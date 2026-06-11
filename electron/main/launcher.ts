import { BrowserWindow, shell } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import type {
  BrowserChoice,
  BrowserTabsConfig,
  CloseAppsConfig,
  CommandConfig,
  LaunchAction,
  LaunchEvent,
  LaunchRequest,
  PathConfig,
  ApplicationConfig,
  WebsiteConfig
} from "../../src/types";
import { detectApps } from "./appDetection";
import { addLog, savePreset } from "./storage";

interface ActiveLaunch {
  stopped: boolean;
  children: Set<ChildProcess>;
}

const activeLaunches = new Map<string, ActiveLaunch>();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function emit(window: BrowserWindow, event: LaunchEvent) {
  if (!window.isDestroyed()) window.webContents.send("launcher:status", event);
}

function browserPath(browser: BrowserChoice) {
  if (browser === "default") return null;
  return detectApps().find((app) => app.id === browser && app.detected)?.executablePath ?? null;
}

function spawnTracked(executable: string, args: string[], launch: ActiveLaunch, options: Parameters<typeof spawn>[2] = {}) {
  const child = spawn(executable, args, {
    detached: false,
    windowsHide: true,
    stdio: "ignore",
    ...options
  });
  launch.children.add(child);
  child.once("exit", () => launch.children.delete(child));
  child.once("error", () => launch.children.delete(child));
  return child;
}

async function openUrl(url: string, browser: BrowserChoice, launch: ActiveLaunch) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS URLs are allowed.");
  const selectedBrowser = browserPath(browser);
  if (selectedBrowser) {
    spawnTracked(selectedBrowser, [parsed.toString()], launch);
  } else {
    await shell.openExternal(parsed.toString());
  }
}

async function executeAction(action: LaunchAction, launch: ActiveLaunch, allowCloseApps: boolean) {
  switch (action.type) {
    case "application": {
      const config = action.config as ApplicationConfig;
      if (!config.executablePath || !fs.existsSync(config.executablePath)) throw new Error("Executable path does not exist.");
      const args = config.arguments?.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, "")) ?? [];
      spawnTracked(config.executablePath, args, launch);
      return "Application started";
    }
    case "website": {
      const config = action.config as WebsiteConfig;
      await openUrl(config.url, config.browser, launch);
      return "Website opened";
    }
    case "folder":
    case "file": {
      const config = action.config as PathConfig;
      if (!config.path || !fs.existsSync(config.path)) throw new Error("Path does not exist.");
      const error = await shell.openPath(config.path);
      if (error) throw new Error(error);
      return action.type === "folder" ? "Folder opened" : "File opened";
    }
    case "command": {
      const config = action.config as CommandConfig;
      if (!config.command.trim()) throw new Error("Command is empty.");
      if (config.workingDirectory && !fs.existsSync(config.workingDirectory)) throw new Error("Working directory does not exist.");
      const shellArgs = config.keepOpen ? ["/d", "/s", "/k", config.command] : ["/d", "/s", "/c", config.command];
      spawnTracked("cmd.exe", shellArgs, launch, {
        cwd: config.workingDirectory || undefined,
        windowsHide: config.hidden,
        detached: !config.hidden && config.keepOpen,
        stdio: config.hidden ? "ignore" : "inherit"
      });
      return `Command started: ${config.command}`;
    }
    case "browser-tabs": {
      const config = action.config as BrowserTabsConfig;
      const urls = config.urls.filter(Boolean);
      if (!urls.length) throw new Error("No URLs were provided.");
      const selectedBrowser = browserPath(config.browser);
      if (selectedBrowser) {
        for (const url of urls) {
          const parsed = new URL(url);
          if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS URLs are allowed.");
        }
        spawnTracked(selectedBrowser, urls, launch);
      } else {
        for (const url of urls) await openUrl(url, "default", launch);
      }
      return `${urls.length} browser tab${urls.length === 1 ? "" : "s"} opened`;
    }
    case "close-apps": {
      const config = action.config as CloseAppsConfig;
      if (!allowCloseApps) throw new Error("Close-apps permission was not confirmed.");
      const names = config.processNames.map((name) => name.trim()).filter(Boolean);
      if (!names.length) throw new Error("No process names were provided.");
      for (const processName of names) {
        const safeName = processName.replace(/[^a-zA-Z0-9_.-]/g, "");
        if (!safeName) continue;
        await new Promise<void>((resolve, reject) => {
          const child = spawn("taskkill.exe", ["/IM", safeName, "/T"], { windowsHide: true });
          child.once("exit", (code) => code === 0 || code === 128 ? resolve() : reject(new Error(`taskkill exited with code ${code}`)));
          child.once("error", reject);
        });
      }
      return `${names.length} process target${names.length === 1 ? "" : "s"} handled`;
    }
  }
}

export async function startLaunch(window: BrowserWindow, request: LaunchRequest) {
  const launchId = crypto.randomUUID();
  const launch: ActiveLaunch = { stopped: false, children: new Set() };
  activeLaunches.set(launchId, launch);

  void (async () => {
    const actions = request.preset.actions.filter(
      (action) => action.enabled && (!request.actionIds || request.actionIds.includes(action.id))
    );

    for (const action of actions) {
      if (launch.stopped) {
        emit(window, { launchId, presetId: request.preset.id, status: { actionId: action.id, actionName: action.name, state: "skipped", message: "Launch stopped", timestamp: new Date().toISOString() } });
        continue;
      }
      const delay = action.delayBeforeMs || request.preset.launchDelayMs || 0;
      if (delay > 0) await wait(delay);
      if (launch.stopped) {
        emit(window, { launchId, presetId: request.preset.id, status: { actionId: action.id, actionName: action.name, state: "skipped", message: "Launch stopped", timestamp: new Date().toISOString() } });
        continue;
      }

      emit(window, { launchId, presetId: request.preset.id, status: { actionId: action.id, actionName: action.name, state: "starting", timestamp: new Date().toISOString() } });
      try {
        const message = await executeAction(action, launch, request.allowCloseApps);
        emit(window, { launchId, presetId: request.preset.id, status: { actionId: action.id, actionName: action.name, state: "success", message, timestamp: new Date().toISOString() } });
        await addLog({ level: "success", message: `${request.preset.name}: ${action.name} - ${message}`, presetId: request.preset.id, actionId: action.id });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        emit(window, { launchId, presetId: request.preset.id, status: { actionId: action.id, actionName: action.name, state: "failed", message, timestamp: new Date().toISOString() } });
        await addLog({ level: "error", message: `${request.preset.name}: ${action.name} - ${message}`, presetId: request.preset.id, actionId: action.id });
      }
    }

    if (!request.isTest) {
      const updated = { ...request.preset, lastLaunchedAt: new Date().toISOString() };
      await savePreset(updated);
      await addLog({ level: "info", message: `${request.preset.name}: launch finished`, presetId: request.preset.id });
    }
    activeLaunches.delete(launchId);
  })();

  return { launchId, accepted: true };
}

export function stopLaunch(launchId: string) {
  const launch = activeLaunches.get(launchId);
  if (!launch) return;
  launch.stopped = true;
  for (const child of launch.children) {
    try {
      child.kill();
    } catch {
      // Some detached Windows processes cannot be stopped after handoff.
    }
  }
}
