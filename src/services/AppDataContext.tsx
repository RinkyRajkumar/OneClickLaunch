import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppData, Preset, Settings } from "../types";
import { defaultSettings } from "../utils/defaults";

interface AppDataContextValue extends AppData {
  loading: boolean;
  refresh: () => Promise<void>;
  savePreset: (preset: Preset) => Promise<Preset>;
  deletePreset: (id: string) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  replaceData: (data: AppData) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({ presets: [], settings: defaultSettings });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const loaded = await window.api.data.load();
    setData(loaded);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", data.settings.theme === "light");
  }, [data.settings.theme]);

  const value = useMemo<AppDataContextValue>(() => ({
    ...data,
    loading,
    refresh,
    replaceData: setData,
    savePreset: async (preset) => {
      const saved = await window.api.data.savePreset(preset);
      setData((current) => ({
        ...current,
        presets: current.presets.some((item) => item.id === saved.id)
          ? current.presets.map((item) => item.id === saved.id ? saved : item)
          : [...current.presets, saved]
      }));
      return saved;
    },
    deletePreset: async (id) => {
      await window.api.data.deletePreset(id);
      setData((current) => ({ ...current, presets: current.presets.filter((preset) => preset.id !== id) }));
    },
    saveSettings: async (settings) => {
      await window.api.data.saveSettings(settings);
      setData((current) => ({ ...current, settings }));
    }
  }), [data, loading]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider");
  return context;
}
