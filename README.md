# OneClickLaunch

OneClickLaunch is a Windows 11 desktop app for bundling applications, websites,
folders, files, browser tabs, commands, and optional process-closing actions into
reusable one-click presets.

## Features

- Dark and light dashboard with searchable preset cards
- Create, edit, duplicate, delete, drag-reorder, and test actions
- Application, website, folder, file, command, browser-tab, and close-app actions
- Native Windows file, folder, and executable pickers
- Detection for Chrome, Edge, Firefox, VS Code, Discord, Steam, Spotify, Notepad,
  Word, Excel, and PowerPoint
- Launch preview, command disclosure, live status, stop, and failed-action relaunch
- Ready-made Study, Coding, Gaming, Editing, and Research templates
- Windows notification-area tray menu with one-click access to every saved preset
- Local JSON persistence, launch logs, import/export, and data reset
- Context-isolated Electron IPC with no renderer Node.js access

## Requirements

- Windows 11
- Node.js 20 or newer
- npm

## Run in development

PowerShell may block `npm.ps1` on some Windows installations. Use `npm.cmd` in that
case:

```powershell
npm.cmd install
npm.cmd run dev
```

The Vite renderer starts first, followed by the Electron desktop window.

Closing the main window keeps OneClickLaunch running in the Windows notification
area. Click the tray icon to launch a saved preset, reopen the window, or quit the
app. Tray launches preserve command disclosure and close-app confirmations.

## Build

Create the production renderer and Electron bundles:

```powershell
npm.cmd run build
```

Create a Windows NSIS installer:

```powershell
npm.cmd run dist
```

The installer is written to `release/`.

## Data location

Presets and settings are stored in Electron's Windows app-data directory as:

```text
one-click-launch.json
```

Launch history is stored beside it as:

```text
launch-logs.json
```

The exact path is shown in the app under **Settings > Data**. Writes use a
temporary file and rename step to avoid leaving partially written JSON.

## Safety model

- Nothing runs while creating or editing a preset.
- Actions run only after the user presses **Launch** or explicitly tests one action.
- Command text is shown again before execution.
- Close-app actions require a separate warning confirmation.
- Website actions accept only `http:` and `https:` URLs.
- Process names are sanitized before being passed to `taskkill.exe`.
- The app does not delete files, change Windows settings, or request elevation.
- Electron uses context isolation and exposes only a narrow typed preload API.

Commands are intentionally powerful. Review commands and imported presets before
launching them.

## Project structure

```text
electron/
  main/       Window lifecycle, IPC, storage, launch engine, app detection
  preload/    Context-isolated renderer API
src/
  components/ Shared interface components and action builder
  pages/      Dashboard, editor, launch status, templates, settings, logs
  services/   Renderer data state and browser-only preview fallback
  types/      Shared TypeScript contracts
  utils/      Defaults and preset templates
```

The storage module is isolated behind IPC so it can be replaced with SQLite
without changing the renderer's data contract.
