import { useWorkspace, phaseLabel } from "@/store/workspace";
import { RationaleCard } from "./RationaleCard";
import { AgentRoster } from "./AgentRoster";
import { useEffect, useRef } from "react";
import type { Phase } from "@/types";

const PHASE_LOG_LABELS: { phase: Phase; kind: "agent" | "gate" }[] = [
  { phase: "brief", kind: "agent" },
  { phase: "planning", kind: "agent" },
  { phase: "H1", kind: "gate" },
  { phase: "content", kind: "agent" },
  { phase: "H-C", kind: "gate" },
  { phase: "localization", kind: "agent" },
  { phase: "qa", kind: "agent" },
  { phase: "H2", kind: "gate" },
  { phase: "H-legal", kind: "gate" },
  { phase: "rollout", kind: "agent" },
  { phase: "H3", kind: "gate" },
  { phase: "live", kind: "agent" },
  { phase: "H4", kind: "gate" },
  { phase: "done", kind: "agent" },
];

export function PartnerRail() {
  const stream = useWorkspace((s) => s.rationaleStream);
  const phase = useWorkspace((s) => s.phase);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stream.length]);

  const isThinking =
    phase === "planning" ||
    phase === "content" ||
    phase === "localization" ||
    phase === "qa" ||
    phase === "rollout";

  const phaseIdx = PHASE_LOG_LABELS.findIndex((p) => p.phase === phase);

  return (
    <>
      <AgentRoster />

      {/* Agent Log — live progress step list */}
      <div className="border-b border-border bg-white px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="size-1.5 animate-pulse rounded-full bg-hilti" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Agent Log
          </span>
        </div>
        <div className="space-y-0.5">
          {PHASE_LOG_LABELS.map(({ phase: p, kind }, i) => {
            const isDone = i < phaseIdx;
            const isActive = i === phaseIdx;
            const isFuture = i > phaseIdx;
            const label = phaseLabel(p);
            const isGate = kind === "gate";
            return (
              <div
                key={p}
                className={`flex items-center gap-2 rounded-sm px-2 py-1 text-[10px] transition-colors ${
                  isActive ? "bg-hilti/10" : ""
                }`}
              >
                <div
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-emerald text-white"
                      : isActive
                        ? "bg-hilti text-white animate-pulse"
                        : "bg-black/10 text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <span className="text-[8px]">✓</span>
                  ) : isActive ? (
                    <span className="text-[8px]">●</span>
                  ) : (
                    <span className="text-[8px]">○</span>
                  )}
                </div>
                <span
                  className={`font-mono truncate ${
                    isDone
                      ? "text-emerald line-through"
                      : isActive
                        ? "font-bold text-hilti"
                        : "text-muted-foreground"
                  }`}
                >
                  {isGate ? `⚑ ${label}` : label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-2">
        <div className="size-1.5 rounded-full bg-hilti" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
          Agent Reasoning Stream
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {stream.length === 0 && (
          <div className="rounded-sm border border-dashed border-border bg-white/50 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Idle
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Approve the brief or enable Demo Mode — the agent's reasoning will
              stream here as each step runs.
            </p>
          </div>
        )}
        {stream.map((r) => (
          <RationaleCard key={r.id + r.timestamp} rationale={r} />
        ))}
        {isThinking && (
          <div className="relative overflow-hidden rounded-sm border border-dashed border-border bg-black/[0.02] p-4">
            <div className="mb-2 h-3 w-3/4 rounded bg-black/10" />
            <div className="h-2 w-1/2 rounded bg-black/10" />
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="mt-4 flex items-center gap-2">
              <div className="size-1.5 animate-pulse rounded-full bg-hilti" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {phaseLabel(phase)}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-white p-3">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-2 py-1">
          <span className="size-1.5 rounded-full bg-hilti" />
          <span className="font-mono text-[9px] uppercase tracking-wider">
            session: camp_04
          </span>
        </div>
      </div>
    </>
  );
}
