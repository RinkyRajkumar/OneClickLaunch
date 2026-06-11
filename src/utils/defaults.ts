import type {
  ActionConfig,
  ActionType,
  BrowserChoice,
  LaunchAction,
  Preset,
  Settings
} from "../types";

export const defaultSettings: Settings = {
  theme: "dark",
  defaultBrowser: "default",
  defaultLaunchDelayMs: 250,
  confirmBeforeLaunch: true
};

export const createId = () => crypto.randomUUID();

export function configForType(type: ActionType, browser: BrowserChoice = "default"): ActionConfig {
  switch (type) {
    case "application":
      return { executablePath: "", arguments: "" };
    case "website":
      return { url: "https://", browser };
    case "folder":
    case "file":
      return { path: "" };
    case "command":
      return { command: "", workingDirectory: "", hidden: false, keepOpen: true };
    case "browser-tabs":
      return { urls: ["https://"], browser };
    case "close-apps":
      return { processNames: [], showWarning: true };
  }
}

export function createAction(type: ActionType = "application", browser: BrowserChoice = "default"): LaunchAction {
  return {
    id: createId(),
    type,
    name: "New action",
    enabled: true,
    config: configForType(type, browser),
    delayBeforeMs: 0
  };
}

export function createPreset(settings: Settings = defaultSettings): Preset {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name: "Untitled preset",
    description: "",
    icon: "🚀",
    actions: [],
    launchDelayMs: settings.defaultLaunchDelayMs,
    confirmBeforeLaunch: settings.confirmBeforeLaunch,
    createdAt: now,
    updatedAt: now
  };
}

export const actionLabels: Record<ActionType, string> = {
  application: "Open application",
  website: "Open website",
  folder: "Open folder",
  file: "Open file",
  command: "Run command",
  "browser-tabs": "Open browser tabs",
  "close-apps": "Close apps"
};
