import type { Preset } from "../types";

const now = "2026-01-01T00:00:00.000Z";
const id = (name: string) => `template-${name}`;

export const templates: Preset[] = [
  {
    id: id("study"),
    name: "Study Mode",
    icon: "📚",
    description: "Notes, research tools, and your college portal in one launch.",
    confirmBeforeLaunch: true,
    launchDelayMs: 300,
    createdAt: now,
    updatedAt: now,
    actions: [
      { id: id("study-chatgpt"), type: "website", name: "Open ChatGPT", enabled: true, delayBeforeMs: 0, config: { url: "https://chatgpt.com", browser: "default" } },
      { id: id("study-notes"), type: "folder", name: "Open notes folder", enabled: false, delayBeforeMs: 0, config: { path: "" } },
      { id: id("study-youtube"), type: "website", name: "Study playlist", enabled: false, delayBeforeMs: 0, config: { url: "https://youtube.com", browser: "default" } },
      { id: id("study-portal"), type: "website", name: "College portal", enabled: false, delayBeforeMs: 0, config: { url: "https://", browser: "default" } }
    ]
  },
  {
    id: id("coding"),
    name: "Coding Mode",
    icon: "💻",
    description: "Editor, project, terminal, GitHub, and local app.",
    confirmBeforeLaunch: true,
    launchDelayMs: 350,
    createdAt: now,
    updatedAt: now,
    actions: [
      { id: id("coding-vscode"), type: "application", name: "Open VS Code", enabled: false, delayBeforeMs: 0, config: { executablePath: "", arguments: "" } },
      { id: id("coding-project"), type: "folder", name: "Open project folder", enabled: false, delayBeforeMs: 0, config: { path: "" } },
      { id: id("coding-dev"), type: "command", name: "Start dev server", enabled: false, delayBeforeMs: 0, config: { command: "npm run dev", workingDirectory: "", hidden: false, keepOpen: true } },
      { id: id("coding-github"), type: "website", name: "Open GitHub", enabled: true, delayBeforeMs: 0, config: { url: "https://github.com", browser: "default" } },
      { id: id("coding-localhost"), type: "website", name: "Open localhost", enabled: false, delayBeforeMs: 1500, config: { url: "http://localhost:3000", browser: "default" } }
    ]
  },
  {
    id: id("gaming"),
    name: "Gaming Mode",
    icon: "🎮",
    description: "Launch your game clients, voice chat, and music.",
    confirmBeforeLaunch: true,
    launchDelayMs: 400,
    createdAt: now,
    updatedAt: now,
    actions: [
      { id: id("gaming-discord"), type: "application", name: "Open Discord", enabled: false, delayBeforeMs: 0, config: { executablePath: "", arguments: "" } },
      { id: id("gaming-steam"), type: "application", name: "Open Steam", enabled: false, delayBeforeMs: 0, config: { executablePath: "", arguments: "" } },
      { id: id("gaming-spotify"), type: "application", name: "Open Spotify", enabled: false, delayBeforeMs: 0, config: { executablePath: "", arguments: "" } },
      { id: id("gaming-close"), type: "close-apps", name: "Close heavy apps", enabled: false, delayBeforeMs: 0, config: { processNames: [], showWarning: true } }
    ]
  },
  {
    id: id("editing"),
    name: "Editing Mode",
    icon: "🎬",
    description: "Editing software and all of your media folders.",
    confirmBeforeLaunch: true,
    launchDelayMs: 300,
    createdAt: now,
    updatedAt: now,
    actions: [
      { id: id("editing-app"), type: "application", name: "Open editing software", enabled: false, delayBeforeMs: 0, config: { executablePath: "", arguments: "" } },
      { id: id("editing-assets"), type: "folder", name: "Open assets", enabled: false, delayBeforeMs: 0, config: { path: "" } },
      { id: id("editing-music"), type: "folder", name: "Open music", enabled: false, delayBeforeMs: 0, config: { path: "" } },
      { id: id("editing-export"), type: "folder", name: "Open exports", enabled: false, delayBeforeMs: 0, config: { path: "" } }
    ]
  },
  {
    id: id("research"),
    name: "Research Mode",
    icon: "🔎",
    description: "A focused set of research tabs, PDFs, and notes.",
    confirmBeforeLaunch: true,
    launchDelayMs: 250,
    createdAt: now,
    updatedAt: now,
    actions: [
      { id: id("research-tabs"), type: "browser-tabs", name: "Research tabs", enabled: true, delayBeforeMs: 0, config: { browser: "default", urls: ["https://scholar.google.com", "https://chatgpt.com", "https://wikipedia.org"] } },
      { id: id("research-pdfs"), type: "folder", name: "Open PDF folder", enabled: false, delayBeforeMs: 0, config: { path: "" } },
      { id: id("research-notes"), type: "file", name: "Open notes", enabled: false, delayBeforeMs: 0, config: { path: "" } }
    ]
  }
];

export function instantiateTemplate(template: Preset): Preset {
  const timestamp = new Date().toISOString();
  return {
    ...structuredClone(template),
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    actions: template.actions.map((action) => ({ ...structuredClone(action), id: crypto.randomUUID() }))
  };
}
