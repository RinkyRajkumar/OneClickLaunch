import type { AppData, ElectronApi, LaunchEvent, LogEntry, Preset } from "../types";
import { defaultSettings } from "../utils/defaults";

if (!window.api) {
  const key = "one-click-launch-browser-preview";
  const listeners = new Set<(event: LaunchEvent) => void>();
  const logs: LogEntry[] = [];

  const read = (): AppData => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as AppData : { presets: [], settings: defaultSettings };
  };
  const write = (data: AppData) => localStorage.setItem(key, JSON.stringify(data));

  const browserApi: ElectronApi = {
    data: {
      load: async () => read(),
      savePreset: async (preset: Preset) => {
        const data = read();
        const saved = { ...preset, updatedAt: new Date().toISOString() };
        data.presets = data.presets.some((item) => item.id === saved.id)
          ? data.presets.map((item) => item.id === saved.id ? saved : item)
          : [...data.presets, saved];
        write(data);
        return saved;
      },
      deletePreset: async (id) => {
        const data = read();
        data.presets = data.presets.filter((preset) => preset.id !== id);
        write(data);
      },
      saveSettings: async (settings) => {
        const data = read();
        data.settings = settings;
        write(data);
        return settings;
      },
      reset: async () => {
        const data = { presets: [], settings: defaultSettings };
        write(data);
        return data;
      },
      export: async () => false,
      import: async () => null,
      location: async () => "Electron app data directory (available in the desktop app)"
    },
    launcher: {
      start: async (request) => {
        const launchId = crypto.randomUUID();
        request.preset.actions.filter((action) => action.enabled).forEach((action, index) => {
          setTimeout(() => {
            listeners.forEach((listener) => listener({
              launchId,
              presetId: request.preset.id,
              status: {
                actionId: action.id,
                actionName: action.name,
                state: "success",
                message: "Browser preview simulation",
                timestamp: new Date().toISOString()
              }
            }));
          }, 250 * (index + 1));
        });
        return { launchId, accepted: true };
      },
      stop: async () => undefined,
      test: async () => ({ launchId: crypto.randomUUID(), accepted: true }),
      onStatus: (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
      }
    },
    picker: {
      file: async () => null,
      folder: async () => null,
      executable: async () => null
    },
    apps: {
      detect: async () => []
    },
    logs: {
      list: async () => logs,
      clear: async () => { logs.length = 0; }
    }
  };

  window.api = browserApi;
}
