import { RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import type { LogEntry } from "../types";

const levelStyle: Record<LogEntry["level"], string> = {
  info: "bg-blue-500/10 text-blue-300",
  success: "bg-accent-500/10 text-accent-300",
  error: "bg-red-500/10 text-red-300",
  warning: "bg-amber-500/10 text-amber-300"
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const load = () => window.api.logs.list().then(setLogs);
  useEffect(() => { void load(); }, []);

  const clear = async () => {
    if (!window.confirm("Clear all launch logs?")) return;
    await window.api.logs.clear();
    setLogs([]);
  };

  return (
    <div className="mx-auto max-w-5xl p-8 lg:p-10">
      <PageHeader
        eyebrow="History"
        title="Launch logs"
        description="A local record of completed and failed launch actions."
        actions={<><button className="btn-secondary" onClick={() => void load()}><RefreshCw size={16} /> Refresh</button><button className="btn-danger" onClick={() => void clear()}><Trash2 size={16} /> Clear</button></>}
      />
      <section className="panel overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">No launch activity yet.</div>
        ) : (
          <div className="divide-y divide-white/10 light:divide-black/10">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                <span className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${levelStyle[log.level]}`}>{log.level}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{log.message}</div>
                  <div className="mt-1 text-xs text-zinc-600">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
