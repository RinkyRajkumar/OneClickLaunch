import {
  AppWindow,
  ChevronDown,
  ChevronUp,
  Copy,
  File,
  Folder,
  GripVertical,
  Play,
  Plus,
  Terminal,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  ActionType,
  ApplicationConfig,
  BrowserChoice,
  BrowserTabsConfig,
  CloseAppsConfig,
  CommandConfig,
  DetectedApp,
  LaunchAction,
  PathConfig,
  WebsiteConfig
} from "../types";
import { actionLabels, configForType } from "../utils/defaults";

const types: ActionType[] = ["application", "website", "folder", "file", "command", "browser-tabs", "close-apps"];

const iconFor = (type: ActionType) => {
  if (type === "application") return AppWindow;
  if (type === "folder") return Folder;
  if (type === "file") return File;
  if (type === "command") return Terminal;
  return Play;
};

function BrowserSelect({ value, onChange }: { value: BrowserChoice; onChange: (value: BrowserChoice) => void }) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value as BrowserChoice)}>
      <option value="default">Default browser</option>
      <option value="chrome">Google Chrome</option>
      <option value="edge">Microsoft Edge</option>
      <option value="firefox">Mozilla Firefox</option>
    </select>
  );
}

export default function ActionEditor({
  action,
  index,
  total,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
  onDragStart,
  onDrop,
  defaultBrowser
}: {
  action: LaunchAction;
  index: number;
  total: number;
  onChange: (action: LaunchAction) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onDragStart: () => void;
  onDrop: () => void;
  defaultBrowser: BrowserChoice;
}) {
  const [expanded, setExpanded] = useState(true);
  const [detectedApps, setDetectedApps] = useState<DetectedApp[]>([]);
  const Icon = iconFor(action.type);
  const updateConfig = (config: LaunchAction["config"]) => onChange({ ...action, config });

  useEffect(() => {
    if (action.type === "application") void window.api.apps.detect().then(setDetectedApps);
  }, [action.type]);

  const choosePath = async (kind: "file" | "folder" | "executable") => {
    const selected = await window.api.picker[kind]();
    if (!selected) return;
    if (kind === "executable") updateConfig({ ...(action.config as ApplicationConfig), executablePath: selected });
    else updateConfig({ path: selected });
  };

  const test = async () => {
    if (action.type === "command" && !window.confirm(`Run this exact command?\n\n${(action.config as CommandConfig).command}`)) return;
    const allowClose = action.type !== "close-apps" || window.confirm("This action will attempt to close the listed processes. Continue?");
    if (!allowClose) return;
    await window.api.launcher.test(action, allowClose);
  };

  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/20 transition light:border-black/10 light:bg-zinc-50"
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-3 p-3">
        <GripVertical size={18} className="cursor-grab text-zinc-600" />
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-accent-400 light:bg-black/5"><Icon size={17} /></div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{action.name}</div>
          <div className="text-xs text-zinc-500">{actionLabels[action.type]}</div>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={action.enabled} onChange={(event) => onChange({ ...action, enabled: event.target.checked })} />
          Enabled
        </label>
        <button className="rounded-lg p-2 text-zinc-500 hover:bg-white/5" onClick={() => onMove(-1)} disabled={index === 0}><ChevronUp size={16} /></button>
        <button className="rounded-lg p-2 text-zinc-500 hover:bg-white/5" onClick={() => onMove(1)} disabled={index === total - 1}><ChevronDown size={16} /></button>
        <button className="rounded-lg p-2 text-zinc-500 hover:bg-white/5" onClick={() => setExpanded((value) => !value)}><ChevronDown className={`transition ${expanded ? "rotate-180" : ""}`} size={17} /></button>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-4 light:border-black/10">
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className="label">Action name</span><input className="input" value={action.name} onChange={(event) => onChange({ ...action, name: event.target.value })} /></label>
            <label>
              <span className="label">Action type</span>
              <select className="input" value={action.type} onChange={(event) => {
                const type = event.target.value as ActionType;
                onChange({ ...action, type, config: configForType(type, defaultBrowser) });
              }}>
                {types.map((type) => <option value={type} key={type}>{actionLabels[type]}</option>)}
              </select>
            </label>

            {action.type === "application" && (() => {
              const config = action.config as ApplicationConfig;
              return <>
                <label className="md:col-span-2">
                  <span className="label">Detected applications</span>
                  <select className="input" defaultValue="" onChange={(event) => {
                    const app = detectedApps.find((item) => item.id === event.target.value);
                    if (app) onChange({ ...action, name: `Open ${app.name}`, config: { ...config, executablePath: app.executablePath } });
                  }}>
                    <option value="">Choose a detected app...</option>
                    {detectedApps.filter((app) => app.detected).map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}
                  </select>
                </label>
                <label className="md:col-span-2"><span className="label">Executable path</span><div className="flex gap-2"><input className="input" value={config.executablePath} onChange={(event) => updateConfig({ ...config, executablePath: event.target.value })} /><button className="btn-secondary shrink-0" onClick={() => void choosePath("executable")}>Browse</button></div></label>
                <label className="md:col-span-2"><span className="label">Launch arguments</span><input className="input" placeholder='--profile "Study"' value={config.arguments ?? ""} onChange={(event) => updateConfig({ ...config, arguments: event.target.value })} /></label>
              </>;
            })()}

            {action.type === "website" && (() => {
              const config = action.config as WebsiteConfig;
              return <>
                <label><span className="label">URL</span><input className="input" value={config.url} onChange={(event) => updateConfig({ ...config, url: event.target.value })} /></label>
                <label><span className="label">Browser</span><BrowserSelect value={config.browser} onChange={(browser) => updateConfig({ ...config, browser })} /></label>
              </>;
            })()}

            {(action.type === "folder" || action.type === "file") && (() => {
              const config = action.config as PathConfig;
              return <label className="md:col-span-2"><span className="label">{action.type === "folder" ? "Folder" : "File"} path</span><div className="flex gap-2"><input className="input" value={config.path} onChange={(event) => updateConfig({ path: event.target.value })} /><button className="btn-secondary shrink-0" onClick={() => void choosePath(action.type === "folder" ? "folder" : "file")}>Browse</button></div></label>;
            })()}

            {action.type === "command" && (() => {
              const config = action.config as CommandConfig;
              return <>
                <label className="md:col-span-2"><span className="label">Exact command</span><textarea className="input min-h-20 font-mono" value={config.command} onChange={(event) => updateConfig({ ...config, command: event.target.value })} /></label>
                <label className="md:col-span-2"><span className="label">Working directory</span><div className="flex gap-2"><input className="input" value={config.workingDirectory ?? ""} onChange={(event) => updateConfig({ ...config, workingDirectory: event.target.value })} /><button className="btn-secondary shrink-0" onClick={async () => { const folder = await window.api.picker.folder(); if (folder) updateConfig({ ...config, workingDirectory: folder }); }}>Browse</button></div></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.hidden} onChange={(event) => updateConfig({ ...config, hidden: event.target.checked })} /> Run hidden</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.keepOpen} onChange={(event) => updateConfig({ ...config, keepOpen: event.target.checked })} /> Keep terminal open</label>
              </>;
            })()}

            {action.type === "browser-tabs" && (() => {
              const config = action.config as BrowserTabsConfig;
              return <>
                <label><span className="label">Browser</span><BrowserSelect value={config.browser} onChange={(browser) => updateConfig({ ...config, browser })} /></label>
                <div />
                <label className="md:col-span-2"><span className="label">URLs, one per line</span><textarea className="input min-h-28" value={config.urls.join("\n")} onChange={(event) => updateConfig({ ...config, urls: event.target.value.split("\n") })} /></label>
              </>;
            })()}

            {action.type === "close-apps" && (() => {
              const config = action.config as CloseAppsConfig;
              return <>
                <label className="md:col-span-2"><span className="label">Process names, one per line</span><textarea className="input min-h-24 font-mono" placeholder={"chrome.exe\nTeams.exe"} value={config.processNames.join("\n")} onChange={(event) => updateConfig({ ...config, processNames: event.target.value.split("\n") })} /></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.showWarning} onChange={(event) => updateConfig({ ...config, showWarning: event.target.checked })} /> Show warning before closing</label>
              </>;
            })()}

            <label><span className="label">Delay before action (ms)</span><input className="input" type="number" min="0" max="600000" value={action.delayBeforeMs} onChange={(event) => onChange({ ...action, delayBeforeMs: Math.max(0, Number(event.target.value)) })} /></label>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 light:border-black/10">
            <button className="btn-secondary" onClick={() => void test()}><Play size={15} /> Test action</button>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={onDuplicate}><Copy size={15} /> Duplicate</button>
              <button className="btn-danger" onClick={onDelete}><Trash2 size={15} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AddActionButton({ onClick }: { onClick: () => void }) {
  return <button className="btn-secondary w-full border-dashed py-3" onClick={onClick}><Plus size={17} /> Add action</button>;
}
