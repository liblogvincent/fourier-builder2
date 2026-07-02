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
  const path = location.pathname;
  const onHome = path === "/";
  const onWorkspace = path === "/workspace";
  const onContent = path.startsWith("/content");
  const onMedia = path.startsWith("/media");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Left sidebar — page-dependent content */}
      <LeftSidebar path={path} onWorkspace={onWorkspace} onContent={onContent} onMedia={onMedia} />

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

function LeftSidebar({ path, onWorkspace, onContent, onMedia }: {
  path: string; onWorkspace: boolean; onContent: boolean; onMedia: boolean;
}) {
  const showDag = onWorkspace;
  const showContentOutline = onContent;
  const showMediaNav = onMedia;
  const showNothing = !showDag && !showContentOutline && !showMediaNav;

  if (showNothing) {
    return (
      <aside className="hidden w-56 flex-col border-r border-border bg-white/50 md:flex">
        <div className="flex items-center border-b border-border p-4">
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Quick Links
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <SideLink to="/workspace" label="→ Campaign Workspace" detail="Pipeline & gates" />
          <SideLink to="/content" label="→ Content" detail="4-tier hierarchy" />
          <SideLink to="/media" label="→ Media" detail="Plan, QA, publish" />
          <SideLink to="/campaigns" label="→ Campaigns" detail="Brief library" />
          <SideLink to="/skills" label="→ Skills" detail="Registry" />
          <SideLink to="/evals" label="→ Evals" detail="Performance" />
          <div className="mt-4 pt-4 border-t border-border">
            <a
              href="https://github.com/liblogvincent/luban/blob/main/docs/Fourier-User-Handbook.md"
              target="_blank" rel="noopener noreferrer"
              className="block rounded-sm px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-black/5 hover:text-foreground"
            >
              📖 Handbook →
            </a>
          </div>
        </div>
      </aside>
    );
  }

  if (showDag) {
    return (
      <aside className="hidden w-64 flex-col border-r border-border bg-white/50 md:flex">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Campaign Pipeline
          </span>
          <div className="size-2 animate-pulse rounded-full bg-emerald" />
        </div>
        <WorkflowDag />
      </aside>
    );
  }

  if (showContentOutline) {
    return (
      <aside className="hidden w-56 flex-col border-r border-border bg-white/50 md:flex">
        <div className="flex items-center border-b border-border p-4">
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Content Tiers
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[10px]">
          <TierItem num="CP1" label="Creative Concept" active />
          <TierItem num="CP3" label="Storyboarding" />
          <TierItem num="CP2" label="Cross-Channel" />
          <TierItem num="R8" label="Localization" />
          <div className="mt-4 pt-4 border-t border-border space-y-1">
            <p className="px-2 text-[9px] uppercase tracking-wider text-muted-foreground">Actions</p>
            <SideLink to="/workspace" label="← Workspace" />
          </div>
        </div>
      </aside>
    );
  }

  if (showMediaNav) {
    return (
      <aside className="hidden w-56 flex-col border-r border-border bg-white/50 md:flex">
        <div className="flex items-center border-b border-border p-4">
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Media Sections
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[10px]">
          <a href="#media-plan" className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-black/5">Media Plan</a>
          <a href="#publishing" className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-black/5">Publishing</a>
          <a href="#utm" className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-black/5">UTM Tracking</a>
          <a href="#qa" className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-black/5">QA Dashboard</a>
          <a href="#sync" className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-black/5">Sync Status</a>
          <div className="mt-4 pt-4 border-t border-border">
            <SideLink to="/workspace" label="← Workspace" />
          </div>
        </div>
      </aside>
    );
  }

  return null;
}

function TierItem({ num, label, active }: { num: string; label: string; active?: boolean }) {
  return (
    <div className={`rounded-sm px-2 py-1.5 flex items-center gap-2 ${active ? "bg-foreground/5 font-bold" : "text-muted-foreground"}`}>
      <span className={`rounded-sm px-1 py-0.5 text-[8px] font-bold ${active ? "bg-foreground text-white" : "bg-border"}`}>T{num}</span>
      {label}
    </div>
  );
}

function SideLink({ to, label, detail }: { to: string; label: string; detail?: string }) {
  return (
    <Link to={to} className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground">
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
      {detail && <span className="block text-[8px] text-muted-foreground/60">{detail}</span>}
    </Link>
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
