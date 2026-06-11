import { Rocket } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState() {
  return (
    <div className="panel grid min-h-80 place-items-center p-10 text-center">
      <div>
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-accent-500/10 text-accent-400">
          <Rocket size={30} />
        </div>
        <h2 className="text-xl font-semibold">Build your first launch preset</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
          Bundle apps, folders, websites, files, and commands into one deliberate click.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn-primary" to="/preset/new">Create preset</Link>
          <Link className="btn-secondary" to="/templates">Browse templates</Link>
        </div>
      </div>
    </div>
  );
}
