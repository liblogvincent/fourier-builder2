import type { ReactNode } from "react";
import { Sidebar } from "@/components/nav/Sidebar";
import { DemoModeToggle } from "@/components/top/DemoModeToggle";
import { useWorkspace } from "@/store/workspace";

interface AgentCanvasShellProps {
  agent: ReactNode;
  canvas: ReactNode;
}

export function AgentCanvasShell({ agent, canvas }: AgentCanvasShellProps) {
  const phase = useWorkspace((s) => s.phase);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workshop-bg">
      <Sidebar />

      {/* Agent Panel (left, 40%) */}
      <div className="flex w-[40%] min-w-0 shrink-0 flex-col border-r border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Agent · {phase}
          </span>
          <DemoModeToggle />
        </div>
        <div className="flex-1 overflow-y-auto">
          {agent}
        </div>
      </div>

      {/* Living Canvas (right, 60%) */}
      <div className="flex flex-1 flex-col min-w-0 bg-canvas-bg">
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Canvas
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">live</span>
            <span className="size-1.5 rounded-full bg-emerald animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="animate-canvas-update">
            {canvas}
          </div>
        </div>
      </div>
    </div>
  );
}
