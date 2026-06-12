import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  Tray,
  type MessageBoxOptions
} from "electron";
import type { CloseAppsConfig, CommandConfig, Preset } from "../../src/types";
import { startLaunch } from "./launcher";
import { loadData } from "./storage";
import { createTrayIcon } from "./trayIcon";

let tray: Tray | null = null;
let getMainWindow: () => BrowserWindow | null;

function showMessageBox(window: BrowserWindow | null, options: MessageBoxOptions) {
  return window?.isVisible()
    ? dialog.showMessageBox(window, options)
    : dialog.showMessageBox(options);
}

function showMainWindow() {
  const window = getMainWindow();
  if (!window) return;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}

async function confirmTrayLaunch(preset: Preset) {
  const window = getMainWindow();
  const actions = preset.actions.filter((action) => action.enabled);
  const commands = actions.filter((action) => action.type === "command");
  const closeActions = actions.filter((action) => action.type === "close-apps");

  if (actions.length === 0) return null;

  if (preset.confirmBeforeLaunch || commands.length > 0) {
    const commandText = commands
      .map((action) => `${action.name}: ${(action.config as CommandConfig).command}`)
      .join("\n");
    const confirmation = await showMessageBox(window, {
      type: "question",
      title: `Launch ${preset.name}?`,
      message: `Launch "${preset.name}" with ${actions.length} action${actions.length === 1 ? "" : "s"}?`,
      detail: commandText ? `Commands that will run:\n\n${commandText}` : preset.description,
      buttons: ["Launch", "Cancel"],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });
    if (confirmation.response !== 0) return null;
  }

  if (closeActions.length > 0) {
    const processNames = closeActions.flatMap(
      (action) => (action.config as CloseAppsConfig).processNames
    ).filter(Boolean);
    const warning = await showMessageBox(window, {
      type: "warning",
      title: "Close apps before launch?",
      message: "This preset will attempt to close running applications.",
      detail: processNames.join("\n"),
      buttons: ["Close apps and launch", "Cancel"],
      defaultId: 1,
      cancelId: 1,
      noLink: true
    });
    if (warning.response !== 0) return null;
  }

  return { allowCloseApps: closeActions.length > 0 };
}

async function launchPreset(preset: Preset) {
  const confirmation = await confirmTrayLaunch(preset);
  if (!confirmation) return;
  const window = getMainWindow();
  if (!window) return;
  await startLaunch(window, { preset, allowCloseApps: confirmation.allowCloseApps });
}

export async function refreshTrayMenu() {
  if (!tray) return;
  const { presets } = await loadData();
  const presetItems = presets.length > 0
    ? presets.map((preset) => ({
        label: `${preset.icon || "•"} ${preset.name}`,
        enabled: preset.actions.some((action) => action.enabled),
        click: () => void launchPreset(preset)
      }))
    : [{ label: "No presets yet", enabled: false }];

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Open OneClickLaunch",
      click: showMainWindow
    },
    { type: "separator" },
    {
      label: "Launch preset",
      submenu: presetItems
    },
    { type: "separator" },
    {
      label: "Quit OneClickLaunch",
      click: () => app.quit()
    }
  ]));
}

export async function createTray(windowProvider: () => BrowserWindow | null) {
  getMainWindow = windowProvider;
  tray = new Tray(createTrayIcon());
  tray.setToolTip("OneClickLaunch");
  tray.on("click", () => tray?.popUpContextMenu());
  tray.on("double-click", showMainWindow);
  await refreshTrayMenu();
}

export function destroyTray() {
  tray?.destroy();
  tray = null;
}
