import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import type { LaunchAction, LaunchRequest, Preset, Settings } from "../../src/types";
import { detectApps } from "./appDetection";
import { startLaunch, stopLaunch } from "./launcher";
import {
  clearLogs,
  dataPath,
  deletePreset,
  exportData,
  importData,
  listLogs,
  loadData,
  resetData,
  savePreset,
  saveSettings
} from "./storage";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: "#09090b",
    title: "OneClickLaunch",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("data:load", () => loadData());
ipcMain.handle("data:save-preset", (_event, preset: Preset) => savePreset(preset));
ipcMain.handle("data:delete-preset", (_event, id: string) => deletePreset(id));
ipcMain.handle("data:save-settings", (_event, settings: Settings) => saveSettings(settings));
ipcMain.handle("data:reset", () => resetData());
ipcMain.handle("data:export", () => exportData());
ipcMain.handle("data:import", () => importData());
ipcMain.handle("data:location", () => dataPath());
ipcMain.handle("logs:list", () => listLogs());
ipcMain.handle("logs:clear", () => clearLogs());
ipcMain.handle("apps:detect", () => detectApps());

ipcMain.handle("picker:file", async () => {
  const result = await dialog.showOpenDialog({ title: "Choose a file", properties: ["openFile"] });
  return result.canceled ? null : result.filePaths[0] ?? null;
});
ipcMain.handle("picker:folder", async () => {
  const result = await dialog.showOpenDialog({ title: "Choose a folder", properties: ["openDirectory", "createDirectory"] });
  return result.canceled ? null : result.filePaths[0] ?? null;
});
ipcMain.handle("picker:executable", async () => {
  const result = await dialog.showOpenDialog({
    title: "Choose an application",
    properties: ["openFile"],
    filters: [{ name: "Windows applications", extensions: ["exe", "com", "bat", "cmd"] }]
  });
  return result.canceled ? null : result.filePaths[0] ?? null;
});

ipcMain.handle("launcher:start", (_event, request: LaunchRequest) => {
  if (!mainWindow) throw new Error("Main window is unavailable.");
  return startLaunch(mainWindow, request);
});
ipcMain.handle("launcher:test", (_event, action: LaunchAction, allowCloseApps: boolean) => {
  if (!mainWindow) throw new Error("Main window is unavailable.");
  const now = new Date().toISOString();
  const preset: Preset = {
    id: `test-${action.id}`,
    name: "Action test",
    description: "",
    icon: "🧪",
    actions: [{ ...action, enabled: true, delayBeforeMs: 0 }],
    confirmBeforeLaunch: false,
    launchDelayMs: 0,
    createdAt: now,
    updatedAt: now
  };
  return startLaunch(mainWindow, { preset, allowCloseApps, isTest: true });
});
ipcMain.handle("launcher:stop", (_event, launchId: string) => stopLaunch(launchId));
