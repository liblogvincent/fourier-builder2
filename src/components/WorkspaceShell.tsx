import { Link, useLocation } from "@tanstack/react-router";
import { useWorkspace } from "@/store/workspace";
import { WorkflowDag } from "./dag/WorkflowDag";
import { PartnerRail } from "./partner/PartnerRail";
import { DemoModeToggle } from "./top/DemoModeToggle";
import type { ReactNode } from "react";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const phase = useWorkspace((s) => s.phase);
  const brief = useWorkspace((s) => s.brief);
  const location = useLocation();
  const onHome = location.pathname === "/";
  const onWorkspace = location.pathname === "/workspace";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Left: DAG ribbon */}
      <aside className="hidden w-64 flex-col border-r border-border bg-white/50 md:flex">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Campaign DAG
          </span>
          <div className="size-2 animate-pulse rounded-full bg-emerald" />
        </div>
        <WorkflowDag />
      </aside>

      {/* Center */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        <nav className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tighter">
                Fourier
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Agentic End2End Engine
              </span>
            </Link>
            <Link
              to="/campaigns/$id/history"
              params={{ id: brief.id }}
              className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[10px] uppercase hover:bg-foreground hover:text-white"
              title="Run history for this brief"
            >
              {brief.id.replace(/^brief_/, "")} · history
            </Link>
            <div className="ml-4 flex items-center gap-1">
              <NavLink to="/" active={onHome}>
                Home
              </NavLink>
              <NavLink to="/workspace" active={onWorkspace}>
                Workspace
              </NavLink>
              <NavLink to="/content" active={location.pathname.startsWith("/content")}>
                Content
              </NavLink>
              <NavLink to="/media" active={location.pathname.startsWith("/media")}>
                Media
              </NavLink>
              <NavLink to="/campaigns" active={location.pathname.startsWith("/campaigns")}>
                Campaigns
              </NavLink>
              <NavLink to="/skills" active={location.pathname.startsWith("/skills")}>
                Skills
              </NavLink>
              <NavLink to="/evals" active={location.pathname.startsWith("/evals")}>
                Evals
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {phase}
            </span>
            <DemoModeToggle />
          </div>
        </nav>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      {/* Right: Partner rail */}
      <aside className="hidden w-80 flex-col border-l border-border bg-[color-mix(in_oklab,var(--background),white_20%)] lg:flex">
        <PartnerRail />
      </aside>
    </div>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`rounded-sm px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? "bg-foreground text-white"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
