import { Link, useLocation } from "@tanstack/react-router";
import { useWorkspace } from "@/store/workspace";

const PRIMARY = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/workspace", label: "Campaign", icon: "◈" },
  { to: "/content", label: "Content", icon: "◫" },
  { to: "/media", label: "Media", icon: "⊞" },
];
const SECONDARY = [
  { to: "/skills", label: "Skills", icon: "⚙" },
  { to: "/evals", label: "Evals", icon: "↗" },
];

export function Sidebar() {
  const path = useLocation().pathname;
  const phase = useWorkspace((s) => s.phase);
  const brief = useWorkspace((s) => s.brief);
  const isActive = (to: string) => path === to || (to !== "/" && path.startsWith(to));

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col bg-sidebar text-sidebar-fg">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <span className="text-lg font-bold tracking-tight text-white">Fourier</span>
        <span className="ml-auto size-2 rounded-full bg-emerald animate-pulse" title="Live" />
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {PRIMARY.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
              isActive(item.to)
                ? "bg-white/10 text-maize border-l-[3px] border-l-maize pl-[9px]"
                : "text-sidebar-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="my-3 border-t border-white/10" />

        {SECONDARY.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
              isActive(item.to)
                ? "bg-white/10 text-white"
                : "text-sidebar-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-sm opacity-60">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom: current campaign + handbook */}
      <div className="border-t border-white/10 px-4 py-4 space-y-2">
        <p className="text-[11px] text-sidebar-muted truncate">
          {phase} · {brief.id.replace(/^brief_/, "")}
        </p>
        <a
          href="https://github.com/liblogvincent/luban/blob/main/docs/Fourier-User-Handbook.md"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[11px] text-sidebar-muted hover:text-white transition-colors"
        >
          📖 Handbook
        </a>
      </div>
    </aside>
  );
}
