import { Clock3, Edit3, Play, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAppData } from "../services/AppDataContext";

function relativeDate(value?: string) {
  if (!value) return "Never launched";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

export default function Dashboard() {
  const { presets, deletePreset, loading } = useAppData();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const filtered = useMemo(
    () => presets.filter((preset) => `${preset.name} ${preset.description}`.toLowerCase().includes(query.toLowerCase())),
    [presets, query]
  );

  const remove = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) await deletePreset(id);
  };

  return (
    <div className="mx-auto max-w-[1500px] p-8 lg:p-10">
      <PageHeader
        eyebrow="Workspace launcher"
        title="Ready when you are."
        description="Launch the setup you need without retracing the same clicks every time."
        actions={<Link to="/preset/new" className="btn-primary"><Plus size={17} /> New preset</Link>}
      />

      {presets.length > 0 && (
        <div className="mb-5 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={17} />
            <input className="input pl-10" placeholder="Search presets..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="text-sm text-zinc-500">{filtered.length} preset{filtered.length === 1 ? "" : "s"}</div>
        </div>
      )}

      {loading ? (
        <div className="panel p-10 text-center text-zinc-500">Loading your presets...</div>
      ) : presets.length === 0 ? <EmptyState /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((preset) => (
            <article key={preset.id} className="panel group flex min-h-72 flex-col p-5 transition hover:-translate-y-0.5 hover:border-accent-500/30 hover:shadow-glow">
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-2xl light:bg-black/5">{preset.icon || "🚀"}</div>
                <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                  <button aria-label="Edit preset" className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200" onClick={() => navigate(`/preset/${preset.id}`)}><Edit3 size={16} /></button>
                  <button aria-label="Delete preset" className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-300" onClick={() => void remove(preset.id, preset.name)}><Trash2 size={16} /></button>
                </div>
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">{preset.name}</h2>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-relaxed text-zinc-500">{preset.description || "No description"}</p>
              <div className="mt-5 flex items-center gap-3 text-xs text-zinc-500">
                <span className="rounded-full bg-white/5 px-2.5 py-1 light:bg-black/5">{preset.actions.filter((action) => action.enabled).length} action{preset.actions.filter((action) => action.enabled).length === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1.5"><Clock3 size={13} /> {relativeDate(preset.lastLaunchedAt)}</span>
              </div>
              <button onClick={() => navigate(`/launch/${preset.id}`)} className="btn-primary mt-auto w-full py-3.5 text-base">
                <Play size={18} fill="currentColor" /> Launch
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
