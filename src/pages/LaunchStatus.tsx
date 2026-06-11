import { AlertTriangle, ArrowLeft, Check, Circle, Loader2, Play, RotateCcw, Square, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAppData } from "../services/AppDataContext";
import type { LaunchState, LaunchStatus as Status } from "../types";
import { actionLabels } from "../utils/defaults";

const statusIcon: Record<LaunchState, typeof Circle> = {
  waiting: Circle,
  starting: Loader2,
  success: Check,
  failed: X,
  skipped: AlertTriangle
};

const statusClass: Record<LaunchState, string> = {
  waiting: "text-zinc-500 bg-white/5",
  starting: "text-blue-300 bg-blue-500/10",
  success: "text-accent-300 bg-accent-500/10",
  failed: "text-red-300 bg-red-500/10",
  skipped: "text-amber-300 bg-amber-500/10"
};

export default function LaunchStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { presets, refresh } = useAppData();
  const preset = presets.find((item) => item.id === id);
  const [launchId, setLaunchId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const enabledActions = useMemo(() => preset?.actions.filter((action) => action.enabled) ?? [], [preset]);
  const failedIds = Object.values(statuses).filter((status) => status.state === "failed").map((status) => status.actionId);
  const terminalCount = Object.values(statuses).filter((status) => ["success", "failed", "skipped"].includes(status.state)).length;
  const finished = started && enabledActions.length > 0 && terminalCount === enabledActions.length;

  useEffect(() => window.api.launcher.onStatus((event) => {
    if (event.presetId !== id && event.launchId !== launchId) return;
    if (launchId && event.launchId !== launchId) return;
    setStatuses((current) => ({ ...current, [event.status.actionId]: event.status }));
  }), [id, launchId]);

  if (!preset) return <div className="p-10"><button className="btn-secondary" onClick={() => navigate("/")}><ArrowLeft size={16} /> Preset not found</button></div>;

  const begin = async (actionIds?: string[]) => {
    const commandActions = preset.actions.filter((action) => action.enabled && action.type === "command" && (!actionIds || actionIds.includes(action.id)));
    const closeActions = preset.actions.filter((action) => action.enabled && action.type === "close-apps" && (!actionIds || actionIds.includes(action.id)));
    const preview = commandActions.map((action) => `• ${action.name}: ${(action.config as { command: string }).command}`).join("\n");

    if ((preset.confirmBeforeLaunch || commandActions.length > 0) && !window.confirm(`Launch "${preset.name}" with ${actionIds?.length ?? enabledActions.length} action(s)?${preview ? `\n\nCommands:\n${preview}` : ""}`)) return;
    const allowCloseApps = closeActions.length === 0 || window.confirm(`Warning: this preset will attempt to close:\n\n${closeActions.flatMap((action) => (action.config as { processNames: string[] }).processNames).join("\n")}\n\nContinue?`);
    if (!allowCloseApps) return;

    if (!actionIds) {
      setStatuses(Object.fromEntries(enabledActions.map((action) => [action.id, { actionId: action.id, actionName: action.name, state: "waiting", timestamp: new Date().toISOString() }])));
    } else {
      setStatuses((current) => ({ ...current, ...Object.fromEntries(actionIds.map((actionId) => {
        const action = preset.actions.find((item) => item.id === actionId)!;
        return [actionId, { actionId, actionName: action.name, state: "waiting" as const, timestamp: new Date().toISOString() }];
      })) }));
    }
    setStarted(true);
    const result = await window.api.launcher.start({ preset, actionIds, allowCloseApps });
    setLaunchId(result.launchId);
    setTimeout(() => void refresh(), 500);
  };

  return (
    <div className="mx-auto max-w-5xl p-8 lg:p-10">
      <PageHeader
        eyebrow={started ? "Launch status" : "Launch preview"}
        title={`${preset.icon} ${preset.name}`}
        description={started ? `${terminalCount} of ${enabledActions.length} actions completed` : "Review every action before anything runs."}
        actions={<button className="btn-secondary" onClick={() => navigate("/")}><ArrowLeft size={16} /> Dashboard</button>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4 light:border-black/10">
            <h2 className="font-semibold">{started ? "Execution" : "Actions to run"}</h2>
          </div>
          <div className="divide-y divide-white/10 light:divide-black/10">
            {enabledActions.map((action, index) => {
              const status = statuses[action.id] ?? { actionId: action.id, actionName: action.name, state: "waiting" as const, timestamp: "" };
              const Icon = statusIcon[status.state];
              return (
                <div key={action.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-full ${statusClass[status.state]}`}>
                    <Icon size={17} className={status.state === "starting" ? "animate-spin" : ""} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{index + 1}. {action.name}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 light:bg-black/5">{actionLabels[action.type]}</span>
                    </div>
                    <div className="mt-1 truncate text-xs text-zinc-500">{status.message ?? (action.delayBeforeMs ? `${action.delayBeforeMs}ms delay` : "Ready")}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass[status.state]}`}>{status.state}</span>
                </div>
              );
            })}
            {enabledActions.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">This preset has no enabled actions.</div>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Summary</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-white/5 p-3 light:bg-black/5"><div className="text-xl font-bold text-accent-400">{Object.values(statuses).filter((s) => s.state === "success").length}</div><div className="text-xs text-zinc-500">Completed</div></div>
              <div className="rounded-xl bg-white/5 p-3 light:bg-black/5"><div className="text-xl font-bold text-red-300">{failedIds.length}</div><div className="text-xs text-zinc-500">Failed</div></div>
            </div>
            {!started && <button disabled={!enabledActions.length} className="btn-primary mt-4 w-full py-3" onClick={() => void begin()}><Play size={17} fill="currentColor" /> Start launch</button>}
            {started && !finished && <button className="btn-danger mt-4 w-full" onClick={() => launchId && window.api.launcher.stop(launchId)}><Square size={15} fill="currentColor" /> Stop</button>}
            {failedIds.length > 0 && <button className="btn-secondary mt-3 w-full" onClick={() => void begin(failedIds)}><RotateCcw size={15} /> Relaunch failed</button>}
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200/70">
            Commands and close-app actions always receive an extra confirmation. No action runs with administrator privileges.
          </div>
        </aside>
      </div>
    </div>
  );
}
