import { contextBridge, ipcRenderer } from "electron";
import type { ElectronApi, LaunchEvent } from "../../src/types";

const api: ElectronApi = {
  data: {
    load: () => ipcRenderer.invoke("data:load"),
    savePreset: (preset) => ipcRenderer.invoke("data:save-preset", preset),
    deletePreset: (id) => ipcRenderer.invoke("data:delete-preset", id),
    saveSettings: (settings) => ipcRenderer.invoke("data:save-settings", settings),
    reset: () => ipcRenderer.invoke("data:reset"),
    export: () => ipcRenderer.invoke("data:export"),
    import: () => ipcRenderer.invoke("data:import"),
    location: () => ipcRenderer.invoke("data:location")
  },
  launcher: {
    start: (request) => ipcRenderer.invoke("launcher:start", request),
    stop: (launchId) => ipcRenderer.invoke("launcher:stop", launchId),
    test: (action, allowCloseApps) => ipcRenderer.invoke("launcher:test", action, allowCloseApps),
    onStatus: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: LaunchEvent) => callback(payload);
      ipcRenderer.on("launcher:status", listener);
      return () => ipcRenderer.removeListener("launcher:status", listener);
    }
  },
  picker: {
    file: () => ipcRenderer.invoke("picker:file"),
    folder: () => ipcRenderer.invoke("picker:folder"),
    executable: () => ipcRenderer.invoke("picker:executable")
  },
  apps: {
    detect: () => ipcRenderer.invoke("apps:detect")
  },
  logs: {
    list: () => ipcRenderer.invoke("logs:list"),
    clear: () => ipcRenderer.invoke("logs:clear")
  }
};

contextBridge.exposeInMainWorld("api", api);
