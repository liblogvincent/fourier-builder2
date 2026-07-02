import { useWorkspace } from "@/store/workspace";

export function LiveTile() {
  return (
    <section className="rounded-sm border border-border bg-foreground p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
            Time-collapse · simulated
          </p>
          <h2 className="mt-1 text-2xl font-bold">Campaign ran for 7 days</h2>
          <p className="mt-1 text-sm text-white/70">
            Insights agent is analyzing performance · proposing learnings →
          </p>
        </div>
        <div className="text-right font-mono">
          <p className="text-[10px] uppercase tracking-wider text-white/60">CTR</p>
          <p className="text-2xl font-bold">2.84%</p>
          <p className="text-[10px] uppercase tracking-wider text-white/60">vs benchmark +38%</p>
        </div>
      </div>
    </section>
  );
}

export function ValueReadout() {
  const decisions = useWorkspace((s) => s.gateDecisions);
  const disposition = useWorkspace((s) => s.proposalDisposition);
  const gateCount = Object.keys(decisions).length;
  return (
    <section className="grid grid-cols-3 gap-4">
      <Metric label="Hours returned" value="38h" sub="vs. Deloitte baseline" />
      <Metric label="Cost / campaign" value="$1,180" sub="−35% vs. camp_01" />
      <Metric label="Skills reused" value="12" sub="compounding from camp_01–03" />
      <Metric label="Gates approved" value={`${gateCount} / 5`} sub="H1 → H2 → H-legal → H3 → H4" />
      <Metric label="First-pass QA" value="94%" sub="15 / 16 variants" />
      <Metric
        label="H4 disposition"
        value={
          disposition === "pending"
            ? "Pending"
            : disposition === "promoted"
              ? "Promoted ✓"
              : "Rejected"
        }
        sub="new global rule"
      />
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-sm border border-border bg-white p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="font-mono text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
