import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { listCampaigns } from "@/lib/persistence";
import {
  clearRunEvents,
  listRunEvents,
  type RunEvent,
} from "@/lib/run-history";
import { useWorkspace } from "@/store/workspace";
import type { Brief, Phase } from "@/types";

export const Route = createFileRoute("/campaigns/$id/history")({
  head: () => ({ meta: [{ title: "Run history — Fourier" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const loadBrief = useWorkspace((s) => s.loadBrief);
  const retryPhase = useWorkspace((s) => s.retryPhase);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const activeBriefId = useWorkspace((s) => s.brief.id);

  const [brief, setBrief] = useState<Brief | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const b = listCampaigns().find((c) => c.id === id) ?? null;
    setBrief(b);
    setEvents(listRunEvents(id));
  }, [id, tick, agentBusy]);

  // poll while an agent is running so durations update
  useEffect(() => {
    if (!agentBusy) return;
    const t = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, [agentBusy]);

  const grouped = useMemo(() => {
    const m = new Map<Phase, RunEvent[]>();
    for (const e of events) {
      const list = m.get(e.phase) ?? [];
      list.push(e);
      m.set(e.phase, list);
    }
    return m;
  }, [events]);

  const onRetry = async (phase: Phase) => {
    if (!brief) return;
    if (activeBriefId !== brief.id) loadBrief(brief);
    await retryPhase(phase);
    setTick((n) => n + 1);
  };

  const onOpen = () => {
    if (!brief) return;
    loadBrief(brief);
    void navigate({ to: "/" });
  };

  if (!brief) {
    return (
      <WorkspaceShell>
        <div className="mx-auto max-w-3xl px-8 py-16 text-sm text-muted-foreground">
          Brief not found.{" "}
          <Link to="/campaigns" className="underline">
            Back to campaigns
          </Link>
          .
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Run history
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {brief.campaign}
            </h1>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {brief.id} • {events.length} agent run
              {events.length === 1 ? "" : "s"} recorded
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpen}
              className="rounded-sm border border-border bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-wider hover:border-foreground"
            >
              Open in workspace
            </button>
            <button
              onClick={() => {
                clearRunEvents(brief.id);
                setTick((n) => n + 1);
              }}
              className="rounded-sm border border-border bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-hilti"
            >
              Clear history
            </button>
          </div>
        </header>

        {events.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
            No runs yet. Open this brief in the workspace and advance the
            workflow — every Live agent invocation is logged here.
          </div>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-6">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={`absolute -left-[27px] top-2 size-3 rounded-full border-2 border-white ${dotColor(e.status)}`}
                />
                <div className="rounded-sm border border-border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {fmtTime(e.startedAt)}
                        </span>
                        <span className="rounded-sm bg-black/5 px-1.5 py-0.5 font-mono text-[10px] uppercase">
                          {e.phase}
                        </span>
                        {e.agent && (
                          <span className="rounded-sm bg-foreground/90 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white">
                            {e.agent}
                          </span>
                        )}
                        <span
                          className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${badge(e.status)}`}
                        >
                          {e.status}
                        </span>
                        <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                          {e.mode}
                        </span>
                        {(grouped.get(e.phase)?.length ?? 1) > 1 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            attempt {e.attempt}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-foreground">
                        {e.status === "error"
                          ? e.error ?? "Agent failed"
                          : e.summary ?? (e.status === "running" ? "…" : "—")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {fmtDur(e)}
                      </span>
                      {e.agent && e.status !== "running" && (
                        <button
                          onClick={() => onRetry(e.phase)}
                          disabled={!!agentBusy}
                          className="rounded-sm border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider hover:border-hilti hover:text-hilti disabled:opacity-40"
                        >
                          ↻ Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </WorkspaceShell>
  );
}

function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDur(e: RunEvent) {
  if (e.status === "running") {
    const ms = Date.now() - e.startedAt;
    return `${(ms / 1000).toFixed(1)}s…`;
  }
  if (!e.durationMs) return "";
  if (e.durationMs < 1000) return `${e.durationMs}ms`;
  return `${(e.durationMs / 1000).toFixed(2)}s`;
}

function dotColor(s: RunEvent["status"]) {
  if (s === "ok") return "bg-emerald";
  if (s === "error") return "bg-hilti";
  if (s === "running") return "bg-amber-400 animate-pulse";
  return "bg-muted-foreground";
}

function badge(s: RunEvent["status"]) {
  if (s === "ok") return "bg-emerald/10 text-emerald";
  if (s === "error") return "bg-hilti/10 text-hilti";
  if (s === "running") return "bg-amber-100 text-amber-700";
  return "bg-black/5 text-muted-foreground";
}
