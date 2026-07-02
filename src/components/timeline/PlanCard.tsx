import { useWorkspace } from "@/store/workspace";

export function PlanCard() {
  const plan = useWorkspace((s) => s.plan);
  const agentNodes = plan.nodes.filter((n) => n.kind === "agent");
  const gateNodes = plan.nodes.filter((n) => n.kind === "gate");

  return (
    <section className="rounded-sm border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            CampaignPlan
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {plan.id} · {plan.nodes.length} nodes
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald">
          Strategy agent · {(plan.rationale.confidence * 100).toFixed(0)}% conf
        </span>
      </div>
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
    </section>
  );
}
