import {
  FileClock,
  LayoutDashboard,
  Plus,
  Rocket,
  Settings,
  Sparkles
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/preset/new", label: "Create preset", icon: Plus },
  { to: "/templates", label: "Templates", icon: Sparkles },
  { to: "/logs", label: "Logs", icon: FileClock },
  { to: "/settings", label: "Settings", icon: Settings }
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-ink-950 text-zinc-100 transition-colors light:bg-zinc-100 light:text-zinc-900">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-ink-900/70 px-4 py-5 light:border-black/10 light:bg-white">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500 text-ink-950 shadow-glow">
            <Rocket size={21} strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold tracking-tight">OneClickLaunch</div>
            <div className="text-xs text-zinc-500">Your desktop, ready.</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent-500/15 text-accent-300 light:text-accent-600"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 light:hover:bg-black/5 light:hover:text-zinc-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-zinc-500 light:border-black/10 light:bg-zinc-50">
          Actions run only when you press Launch. OneClickLaunch never requests administrator access.
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
