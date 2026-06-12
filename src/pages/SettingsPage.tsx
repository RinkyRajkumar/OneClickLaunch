import { Download, FolderOpen, RotateCcw, Save, Upload, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAppData } from "../services/AppDataContext";
import type { Settings } from "../types";

export default function SettingsPage() {
  const { settings, saveSettings, replaceData } = useAppData();
  const [draft, setDraft] = useState<Settings>(settings);
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => { void window.api.data.location().then(setLocation); }, []);

  const save = async () => {
    await saveSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const importData = async () => {
    try {
      const imported = await window.api.data.import();
      if (imported) replaceData(imported);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to import that file.");
    }
  };

  const reset = async () => {
    if (!window.confirm("Reset all presets, settings, and logs? This cannot be undone.")) return;
    replaceData(await window.api.data.reset());
  };

  return (
    <div className="mx-auto max-w-4xl p-8 lg:p-10">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Defaults apply to new presets. Existing presets keep their own launch options."
        actions={<button className="btn-primary" onClick={() => void save()}><Save size={16} /> {saved ? "Saved" : "Save settings"}</button>}
      />

      <div className="space-y-5">
        <section className="panel p-5">
          <h2 className="font-semibold">Appearance and defaults</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label><span className="label">Theme</span><select className="input" value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value as Settings["theme"] })}><option value="dark">Dark</option><option value="light">Light</option></select></label>
            <label><span className="label">Default browser</span><select className="input" value={draft.defaultBrowser} onChange={(event) => setDraft({ ...draft, defaultBrowser: event.target.value as Settings["defaultBrowser"] })}><option value="default">System default</option><option value="chrome">Chrome</option><option value="edge">Edge</option><option value="firefox">Firefox</option></select></label>
            <label><span className="label">Default launch delay (ms)</span><input className="input" type="number" min="0" max="600000" value={draft.defaultLaunchDelayMs} onChange={(event) => setDraft({ ...draft, defaultLaunchDelayMs: Math.max(0, Number(event.target.value)) })} /></label>
            <label className="flex items-end pb-2"><span className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.confirmBeforeLaunch} onChange={(event) => setDraft({ ...draft, confirmBeforeLaunch: event.target.checked })} /> Confirm before launching new presets</span></label>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-semibold">Data</h2>
          <div className="mt-4 rounded-xl bg-black/20 p-3 light:bg-zinc-50">
            <div className="flex items-center gap-2 text-xs text-zinc-500"><FolderOpen size={14} /> App data location</div>
            <div className="mt-1 break-all font-mono text-xs">{location}</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-secondary" onClick={() => void window.api.data.export()}><Download size={16} /> Export presets</button>
            <button className="btn-secondary" onClick={() => void importData()}><Upload size={16} /> Import presets</button>
            <button className="btn-danger ml-auto" onClick={() => void reset()}><RotateCcw size={16} /> Reset app data</button>
          </div>
        </section>

        <section className="panel p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-400">
              <Workflow size={19} />
            </div>
            <div>
              <h2 className="font-semibold">System tray</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                OneClickLaunch stays available in the Windows notification area when you close the main window.
                Click its tray icon to launch any saved preset, reopen the dashboard, or quit the app.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-accent-500/20 bg-accent-500/5 p-5 text-sm leading-relaxed text-zinc-400">
          <strong className="text-accent-300">Safety by default.</strong> OneClickLaunch does not delete files, modify system settings, or elevate itself. Commands only run after a launch click and show their exact text during confirmation.
        </section>
      </div>
    </div>
  );
}
