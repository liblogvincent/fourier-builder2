import { useWorkspace } from "@/store/workspace";

export function InsightProposal() {
  const proposal = useWorkspace((s) => s.proposal);
  const disposition = useWorkspace((s) => s.proposalDisposition);

  return (
    <section className="rounded-sm border-2 border-hilti bg-white">
      <div className="flex items-center justify-between border-b border-hilti/20 bg-hilti-soft px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-hilti px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            H4 Proposal
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            Insights agent · derived from {proposal.derived_from}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-hilti">
          {(proposal.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
      <div className="space-y-3 p-4">
        <h3 className="text-base font-bold">{proposal.name}</h3>
        <p className="text-xs text-foreground/80">{proposal.body}</p>
        <div className="rounded-sm border border-border bg-black/[0.02] p-3 font-mono text-[10px]">
          pattern · {proposal.pattern}
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-xs">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Type / scope
            </p>
            <p className="font-medium">
              {proposal.type} · {proposal.scope}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Projected impact
            </p>
            <p className="font-medium">+{proposal.impact.hours_saved}h / campaign</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Quality delta
            </p>
            <p className="font-medium">+{(proposal.impact.quality_delta * 100).toFixed(0)}%</p>
          </div>
        </div>
        {disposition !== "pending" && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-emerald">
            ✓ {disposition} to registry
          </p>
        )}
      </div>
    </section>
  );
}
