import { useWorkspace } from "@/store/workspace";
import type { AgentName, Phase } from "@/types";

const AGENTS: { id: AgentName; label: string; glyph: string; phase: Phase }[] = [
  { id: "strategy", label: "Strategy", glyph: "S", phase: "planning" },
  { id: "content", label: "Content", glyph: "C", phase: "content" },
  { id: "localization", label: "Localization", glyph: "L", phase: "localization" },
  { id: "qa", label: "QA Judge", glyph: "Q", phase: "qa" },
  { id: "rollout", label: "Rollout", glyph: "R", phase: "rollout" },
  { id: "insights", label: "Insights", glyph: "I", phase: "H4" },
];

const PHASE_ORDER: Phase[] = [
  "brief", "planning", "H1", "content", "localization", "qa",
  "H2", "H-legal", "rollout", "H3", "live", "H4", "done",
];

export function AgentRoster() {
  const phase = useWorkspace((s) => s.phase);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const runMode = useWorkspace((s) => s.runMode);
  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div className="border-b border-border bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
          AI Agents
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {runMode === "live" ? "Gemini · Live" : "Scripted"}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {AGENTS.map((a) => {
          const isBusy = agentBusy === a.id;
          const isDone = PHASE_ORDER.indexOf(a.phase) < currentIdx;
          const isActive = PHASE_ORDER.indexOf(a.phase) === currentIdx;
          return (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1"
              title={`${a.label} agent${isBusy ? " — thinking…" : isDone ? " — done" : isActive ? " — active" : " — idle"}`}
            >
              <div
                className={`relative flex size-8 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-colors ${
                  isBusy
                    ? "bg-emerald text-white"
                    : isDone
                      ? "bg-foreground text-white"
                      : isActive
                        ? "bg-hilti text-white"
                        : "bg-black/5 text-muted-foreground"
                }`}
              >
                {a.glyph}
                {isBusy && (
                  <span className="absolute -right-0.5 -top-0.5 size-2 animate-ping rounded-full bg-emerald" />
                )}
              </div>
              <span className="truncate font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                {a.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
