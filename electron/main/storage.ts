import { app, dialog } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import type { AppData, LogEntry, Preset, Settings } from "../../src/types";
import { defaultSettings } from "../../src/utils/defaults";

const DATA_FILE = "one-click-launch.json";
const LOG_FILE = "launch-logs.json";

async function ensureDirectory() {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
}

export function dataPath() {
  return path.join(app.getPath("userData"), DATA_FILE);
}

async function writeJson(file: string, value: unknown) {
  await ensureDirectory();
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(temporary, file);
}

export async function loadData(): Promise<AppData> {
  try {
    const raw = await fs.readFile(dataPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      presets: Array.isArray(parsed.presets) ? parsed.presets : [],
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) }
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Unable to read app data:", error);
    }
    const initial: AppData = { presets: [], settings: defaultSettings };
    await writeJson(dataPath(), initial);
    return initial;
  }
}

export async function savePreset(preset: Preset): Promise<Preset> {
  const data = await loadData();
  const index = data.presets.findIndex((item) => item.id === preset.id);
  const saved = { ...preset, updatedAt: new Date().toISOString() };
  if (index >= 0) data.presets[index] = saved;
  else data.presets.push(saved);
  await writeJson(dataPath(), data);
  return saved;
}

export async function deletePreset(id: string) {
  const data = await loadData();
  data.presets = data.presets.filter((preset) => preset.id !== id);
  await writeJson(dataPath(), data);
}

export async function saveSettings(settings: Settings) {
  const data = await loadData();
  data.settings = settings;
  await writeJson(dataPath(), data);
  return settings;
}

export async function resetData() {
  const initial: AppData = { presets: [], settings: defaultSettings };
  await writeJson(dataPath(), initial);
  await writeJson(path.join(app.getPath("userData"), LOG_FILE), []);
  return initial;
}

export async function exportData() {
  const result = await dialog.showSaveDialog({
    title: "Export OneClickLaunch presets",
    defaultPath: "one-click-launch-backup.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) return false;
  await writeJson(result.filePath, await loadData());
  return true;
}

export async function importData() {
  const result = await dialog.showOpenDialog({
    title: "Import OneClickLaunch presets",
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const parsed = JSON.parse(await fs.readFile(result.filePaths[0], "utf8")) as AppData;
  if (!Array.isArray(parsed.presets) || !parsed.settings) {
    throw new Error("The selected file is not a valid OneClickLaunch backup.");
  }
  const imported: AppData = {
    presets: parsed.presets,
    settings: { ...defaultSettings, ...parsed.settings }
  };
  await writeJson(dataPath(), imported);
  return imported;
}

function logPath() {
  return path.join(app.getPath("userData"), LOG_FILE);
}

export async function listLogs(): Promise<LogEntry[]> {
  try {
    return JSON.parse(await fs.readFile(logPath(), "utf8")) as LogEntry[];
  } catch {
    return [];
  }
}

export async function addLog(entry: Omit<LogEntry, "id" | "timestamp">) {
  const logs = await listLogs();
  logs.unshift({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  });
  await writeJson(logPath(), logs.slice(0, 1000));
}

export async function clearLogs() {
  await writeJson(logPath(), []);
}
