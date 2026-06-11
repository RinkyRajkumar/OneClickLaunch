import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ActionEditor, { AddActionButton } from "../components/ActionEditor";
import PageHeader from "../components/PageHeader";
import { useAppData } from "../services/AppDataContext";
import type { LaunchAction, Preset } from "../types";
import { createAction, createPreset } from "../utils/defaults";

export default function PresetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { presets, settings, savePreset, loading } = useAppData();
  const [preset, setPreset] = useState<Preset | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!id || id === "new") setPreset(createPreset(settings));
    else setPreset(structuredClone(presets.find((item) => item.id === id) ?? createPreset(settings)));
  }, [id, loading]);

  if (!preset) return <div className="p-10 text-zinc-500">Loading editor...</div>;

  const updateAction = (index: number, action: LaunchAction) => {
    setPreset((current) => current && ({ ...current, actions: current.actions.map((item, itemIndex) => itemIndex === index ? action : item) }));
  };

  const moveAction = (from: number, to: number) => {
    if (to < 0 || to >= preset.actions.length || from === to) return;
    const actions = [...preset.actions];
    const [moved] = actions.splice(from, 1);
    actions.splice(to, 0, moved);
    setPreset({ ...preset, actions });
  };

  const save = async () => {
    if (!preset.name.trim()) return window.alert("Give this preset a name.");
    setSaving(true);
    const saved = await savePreset(preset);
    setSaving(false);
    navigate(`/preset/${saved.id}`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl p-8 lg:p-10">
      <PageHeader
        eyebrow={id === "new" ? "New preset" : "Edit preset"}
        title={id === "new" ? "Build a launch sequence" : preset.name}
        description="Actions run in this order. Drag cards to reorder, and test individual actions before saving."
        actions={<>
          <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
          <button className="btn-primary" disabled={saving} onClick={() => void save()}><Save size={16} /> {saving ? "Saving..." : "Save preset"}</button>
        </>}
      />

      <section className="panel mb-5 p-5">
        <div className="grid gap-4 md:grid-cols-[100px_1fr]">
          <label><span className="label">Icon</span><input className="input text-center text-2xl" maxLength={4} value={preset.icon} onChange={(event) => setPreset({ ...preset, icon: event.target.value })} /></label>
          <label><span className="label">Preset name</span><input className="input" value={preset.name} onChange={(event) => setPreset({ ...preset, name: event.target.value })} /></label>
          <label className="md:col-span-2"><span className="label">Description</span><textarea className="input min-h-20" value={preset.description} onChange={(event) => setPreset({ ...preset, description: event.target.value })} /></label>
          <label><span className="label">Default delay between actions (ms)</span><input className="input" type="number" min="0" max="600000" value={preset.launchDelayMs ?? 0} onChange={(event) => setPreset({ ...preset, launchDelayMs: Math.max(0, Number(event.target.value)) })} /></label>
          <label className="flex items-end pb-2"><span className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preset.confirmBeforeLaunch} onChange={(event) => setPreset({ ...preset, confirmBeforeLaunch: event.target.checked })} /> Ask for confirmation before launch</span></label>
        </div>
      </section>

      <section className="panel p-5">
        <div className="mb-4">
          <h2 className="font-semibold">Actions</h2>
          <p className="mt-1 text-sm text-zinc-500">{preset.actions.length} configured action{preset.actions.length === 1 ? "" : "s"}</p>
        </div>
        <div className="space-y-3">
          {preset.actions.map((action, index) => (
            <ActionEditor
              key={action.id}
              action={action}
              index={index}
              total={preset.actions.length}
              onChange={(changed) => updateAction(index, changed)}
              onDelete={() => setPreset({ ...preset, actions: preset.actions.filter((_, itemIndex) => itemIndex !== index) })}
              onDuplicate={() => {
                const copy = { ...structuredClone(action), id: crypto.randomUUID(), name: `${action.name} copy` };
                const actions = [...preset.actions];
                actions.splice(index + 1, 0, copy);
                setPreset({ ...preset, actions });
              }}
              onMove={(direction) => moveAction(index, index + direction)}
              onDragStart={() => setDragIndex(index)}
              onDrop={() => { if (dragIndex !== null) moveAction(dragIndex, index); setDragIndex(null); }}
              defaultBrowser={settings.defaultBrowser}
            />
          ))}
          <AddActionButton onClick={() => setPreset({ ...preset, actions: [...preset.actions, createAction("application", settings.defaultBrowser)] })} />
        </div>
      </section>
    </div>
  );
}
