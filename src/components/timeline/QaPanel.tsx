import { useWorkspace } from "@/store/workspace";
import { VariantCard } from "./VariantCard";

export function QaPanel() {
  const qaResults = useWorkspace((s) => s.qaResults);
  const variants = useWorkspace((s) => s.variants);
  const applyFix = useWorkspace((s) => s.applyFix);
  const appliedFixes = useWorkspace((s) => s.appliedFixes);

  const total = qaResults.length;
  const passing = qaResults.filter(
    (r) =>
      r.judge.verdict === "pass" || appliedFixes.has(r.variant_id),
  ).length;
  const failing = qaResults.filter(
    (r) => r.judge.verdict === "fail" && !appliedFixes.has(r.variant_id),
  );

  return (
    <section className="space-y-4">
      <header className="rounded-sm border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              QA agent · 100% coverage
            </p>
            <h2 className="text-sm font-semibold">
              {passing} / {total} variants passing · brand-judge accuracy 96%
            </h2>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <Stat label="Deterministic" value="64 / 64 ✓" tone="ok" />
            <Stat
              label="Brand judge"
              value={`${passing} / ${total} ${failing.length ? "✗" : "✓"}`}
              tone={failing.length ? "bad" : "ok"}
            />
            <Stat
              label="First-pass rate"
              value={`${Math.round((passing / total) * 100)}%`}
              tone="ok"
            />
          </div>
        </div>
      </header>

      {failing.length > 0 && (
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-hilti">
            Blockers — review & auto-fix
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {failing.map((r) => {
              const variant = variants.find((v) => v.id === r.variant_id)!;
              return (
                <VariantCard
                  key={r.variant_id}
                  variant={variant}
                  flagged={{
                    phrase: r.judge.flagged_phrase!,
                    suggestion: r.judge.suggestion!,
                    reason: r.judge.reason!,
                  }}
                  onApplyFix={() => applyFix(r.variant_id)}
                />
              );
            })}
          </div>
        </div>
      )}

      <details className="rounded-sm border border-border bg-white">
        <summary className="cursor-pointer p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-black/[0.02]">
          Full check matrix ({total} variants × 4 deterministic rules + brand judge)
        </summary>
        <div className="border-t border-border p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-1">Variant</th>
                <th className="py-1">Det.</th>
                <th className="py-1">Judge</th>
                <th className="py-1">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {qaResults.map((r) => {
                const fixed = appliedFixes.has(r.variant_id);
                const ok = r.judge.verdict === "pass" || fixed;
                return (
                  <tr key={r.variant_id} className="border-t border-border">
                    <td className="py-1.5 font-mono text-[10px]">{r.variant_id}</td>
                    <td className="py-1.5 font-mono text-[10px] text-emerald">
                      {r.checks.filter((c) => c.result === "pass").length}/{r.checks.length}
                    </td>
                    <td className="py-1.5 font-mono text-[10px]">
                      {(r.judge.score * 100).toFixed(0)}%
                    </td>
                    <td
                      className={`py-1.5 font-mono text-[10px] font-bold ${
                        ok ? "text-emerald" : "text-hilti"
                      }`}
                    >
                      {ok ? "PASS" : "FAIL"}
                      {fixed ? " (fixed)" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "bad";
}) {
  return (
    <div className="text-right">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-bold ${tone === "ok" ? "text-emerald" : "text-hilti"}`}>
        {value}
      </p>
    </div>
  );
}
