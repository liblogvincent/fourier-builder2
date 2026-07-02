import { useWorkspace } from "@/store/workspace";
import { exportCampaign, downloadJSON } from "@/lib/export";
import { openPptxInNewTab } from "@/lib/html-pptx";

import { useState } from "react";

export function PlanCard() {
  const [open, setOpen] = useState(false);
  const brief = useWorkspace((s) => s.brief);
  const plan = useWorkspace((s) => s.plan);
  const variants = useWorkspace((s) => s.variants);
  const localeDiffs = useWorkspace((s) => s.localeDiffs);
  const qaResults = useWorkspace((s) => s.qaResults);
  const connectorCalls = useWorkspace((s) => s.connectorCalls);
  const proposal = useWorkspace((s) => s.proposal);
  const gateDecisions = useWorkspace((s) => s.gateDecisions);
  const rationaleStream = useWorkspace((s) => s.rationaleStream);
  const revisionFeedback = useWorkspace((s) => s.revisionFeedback);
  const phase = useWorkspace((s) => s.phase);
  const agentNodes = plan.nodes.filter((n) => n.kind === "agent");
  const gateNodes = plan.nodes.filter((n) => n.kind === "gate");
  const variantCount = variants.length || 4;
  const localeCount = brief.locales.length || 4;
  const h1Decision = gateDecisions["H1"];
  const isRevising = phase === "planning" && !!revisionFeedback;

  const handleExportJSON = () => {
    const state = {
      brief,
      plan,
      variants,
      localeDiffs,
      qaResults,
      connectorCalls,
      proposal,
      gateDecisions,
      rationaleStream,
    };
    const json = exportCampaign(state);
    const ts = new Date().toISOString().slice(0, 10);
    downloadJSON(json, `${brief.id}_campaign_plan_${ts}.json`);
  };

  const handleViewPresentation = () => {
    openPptxInNewTab({ brief, plan, variants, variantCount, localeCount });
  };

  return (
    <section className="rounded-sm border border-border bg-white shadow-sm">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-black/[0.01]"
      >
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            CampaignPlan
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {plan.id} · {plan.nodes.length} nodes · {(plan.rationale.confidence * 100).toFixed(0)}% conf
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {open ? "Collapse −" : "Expand +"}
        </span>
      </button>

      {open && (<>
      {/* Revision banner */}
      {isRevising && (
        <div className="border-b border-hilti/20 bg-[color-mix(in_oklab,var(--hilti),white_90%)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase text-hilti">↻ Revising</span>
            <span className="text-xs text-hilti/80">
              Strategy agent re-planning with reviewer feedback
            </span>
          </div>
          {revisionFeedback && (
            <p className="mt-1 text-xs italic text-hilti/70">"{revisionFeedback}"</p>
          )}
        </div>
      )}
      {/* Previous H1 decision (changes requested) */}
      {h1Decision && h1Decision.verdict === "changes_requested" && !isRevising && (
        <div className="border-b border-amber/20 bg-[color-mix(in_oklab,var(--amber,orange),white_90%)] px-4 py-3">
          <p className="text-xs">
            <span className="font-bold">Changes requested</span> — {h1Decision.note || "Reviewer asked for revisions."}
          </p>
        </div>
      )}

      {/* Strategy Summary */}
      <div className="border-b border-border px-4 py-4">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Strategy summary
        </p>
        <p className="text-sm leading-relaxed">{plan.rationale.decided}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
          {plan.rationale.knowledge_cited.map((k) => (
            <span
              key={k}
              className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono uppercase"
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 border-b border-border">
        {[
          { label: "Budget", value: `€${(brief.budget_usd / 1000).toFixed(0)}k` },
          { label: "Audience", value: brief.audience?.split("—")[0]?.trim() || brief.audience || "—" },
          { label: "Channels", value: brief.channels.join(", ") },
          { label: "Locales", value: `${variantCount} variants × ${localeCount} locales` },
        ].map((m) => (
          <div key={m.label} className="border-r border-border px-4 py-3 last:border-r-0">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-tight">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Why + Alternatives */}
      <div className="grid grid-cols-2 border-b border-border">
        <div className="border-r border-border p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Why this plan
          </p>
          <ul className="space-y-1">
            {plan.rationale.why.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span className="mt-0.5 text-[10px] text-emerald">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Alternatives considered ({plan.rationale.alternatives.length})
          </p>
          <ul className="space-y-1.5">
            {plan.rationale.alternatives.map((a, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium">{a.option}</span>
                <br />
                <span className="text-muted-foreground">↳ {a.rejected_because}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* DAG: agent steps + gates (compact) */}
      <div className="grid grid-cols-2 gap-6 p-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Agent steps ({agentNodes.length})
          </p>
          <ul className="space-y-1.5 text-xs">
            {agentNodes.map((n) => (
              <li key={n.id} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-foreground/40" />
                <span>{n.label}</span>
                <span className="font-mono text-[9px] uppercase text-muted-foreground">
                  · {n.agent}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Gates ({gateNodes.length}) <span className="text-foreground/60">— open namespace</span>
          </p>
          <ul className="space-y-1.5 text-xs">
            {gateNodes.map((n) => {
              const agentProposed = !!n.gate && /^H-/.test(n.gate);
              return (
                <li key={n.id} className="flex items-center gap-2">
                  <span
                    className={`rounded-sm border px-1 font-mono text-[9px] font-bold ${
                      agentProposed
                        ? "border-emerald bg-[color-mix(in_oklab,var(--emerald),white_85%)] text-emerald"
                        : "border-hilti text-hilti"
                    }`}
                  >
                    {n.gate}
                  </span>
                  <span>{n.label.replace(/^H[\w-]+:\s*/, "")}</span>
                  {agentProposed && (
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-emerald">
                      ↑ agent-proposed
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <button
          onClick={handleExportJSON}
          className="rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5"
        >
          ↓ Export JSON
        </button>
        <button
          onClick={handleViewPresentation}
          className="rounded-sm bg-hilti px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-hilti/90"
        >
          ◧ View as Presentation
        </button>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
          JSON: full audit trail · Presentation: 5-slide H1 approval deck
        </span>
      </div>
      </>)}
    </section>
  );
}
