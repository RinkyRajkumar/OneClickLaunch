export type ActionType =
  | "application"
  | "website"
  | "folder"
  | "file"
  | "command"
  | "browser-tabs"
  | "close-apps";

export type BrowserChoice = "default" | "chrome" | "edge" | "firefox";
export type LaunchState = "waiting" | "starting" | "success" | "failed" | "skipped";

export interface ApplicationConfig {
  executablePath: string;
  arguments?: string;
}

export interface WebsiteConfig {
  url: string;
  browser: BrowserChoice;
}

export interface PathConfig {
  path: string;
}

export interface CommandConfig {
  command: string;
  workingDirectory?: string;
  hidden: boolean;
  keepOpen: boolean;
}

export interface BrowserTabsConfig {
  urls: string[];
  browser: BrowserChoice;
}

export interface CloseAppsConfig {
  processNames: string[];
  showWarning: boolean;
}

export type ActionConfig =
  | ApplicationConfig
  | WebsiteConfig
  | PathConfig
  | CommandConfig
  | BrowserTabsConfig
  | CloseAppsConfig;

export interface LaunchAction {
  id: string;
  type: ActionType;
  name: string;
  enabled: boolean;
  config: ActionConfig;
  delayBeforeMs: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  actions: LaunchAction[];
  launchDelayMs?: number;
  confirmBeforeLaunch: boolean;
  createdAt: string;
  updatedAt: string;
  lastLaunchedAt?: string;
}

export interface Settings {
  theme: "dark" | "light";
  defaultBrowser: BrowserChoice;
  defaultLaunchDelayMs: number;
  confirmBeforeLaunch: boolean;
}

export interface AppData {
  presets: Preset[];
  settings: Settings;
}

export interface DetectedApp {
  id: string;
  name: string;
  executablePath: string;
  detected: boolean;
}

export interface LaunchStatus {
  actionId: string;
  actionName: string;
  state: LaunchState;
  message?: string;
  timestamp: string;
}

export interface LaunchEvent {
  launchId: string;
  presetId: string;
  status: LaunchStatus;
}

export interface LaunchResult {
  launchId: string;
  accepted: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
  presetId?: string;
  actionId?: string;
}

export interface LaunchRequest {
  preset: Preset;
  actionIds?: string[];
  allowCloseApps: boolean;
  isTest?: boolean;
}

export interface ElectronApi {
  data: {
    load: () => Promise<AppData>;
    savePreset: (preset: Preset) => Promise<Preset>;
    deletePreset: (id: string) => Promise<void>;
    saveSettings: (settings: Settings) => Promise<Settings>;
    reset: () => Promise<AppData>;
    export: () => Promise<boolean>;
    import: () => Promise<AppData | null>;
    location: () => Promise<string>;
  };
  launcher: {
    start: (request: LaunchRequest) => Promise<LaunchResult>;
    stop: (launchId: string) => Promise<void>;
    test: (action: LaunchAction, allowCloseApps: boolean) => Promise<LaunchResult>;
    onStatus: (callback: (event: LaunchEvent) => void) => () => void;
  };
  picker: {
    file: () => Promise<string | null>;
    folder: () => Promise<string | null>;
    executable: () => Promise<string | null>;
  };
  apps: {
    detect: () => Promise<DetectedApp[]>;
  };
  logs: {
    list: () => Promise<LogEntry[]>;
    clear: () => Promise<void>;
  };
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}
