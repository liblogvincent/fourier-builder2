import type { DecisionRationale } from "@/types";

const AGENT_LABEL: Record<DecisionRationale["agent"], string> = {
  strategy: "STRATEGY",
  content: "CONTENT",
  localization: "LOCALIZATION",
  qa: "QA",
  rollout: "ROLLOUT",
  insights: "INSIGHTS",
};

export function RationaleCard({ rationale }: { rationale: DecisionRationale }) {
  const blocked = rationale.status === "blocked";
  return (
    <div
      className={`animate-slide-in rounded-sm border bg-white p-4 shadow-sm ${
        blocked ? "border-l-2 border-l-hilti border-y-border border-r-border" : "border-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-bold ${
            blocked ? "text-hilti" : "text-emerald"
          }`}
        >
          [{AGENT_LABEL[rationale.agent]}: {blocked ? "BLOCKED" : "DECIDED"}]
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {rationale.timestamp}
        </span>
      </div>
      <p className="mb-3 text-xs font-semibold leading-snug">{rationale.decided}</p>

      {rationale.why.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Why
          </p>
          <ul className="space-y-1">
            {rationale.why.map((w, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-snug text-foreground/80">
                <span className="text-muted-foreground">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rationale.alternatives.length > 0 && (
        <details className="mb-3 text-[11px]">
          <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Alternatives considered ({rationale.alternatives.length})
          </summary>
          <ul className="mt-2 space-y-2 border-l border-border pl-3">
            {rationale.alternatives.map((a, i) => (
              <li key={i}>
                <p className="font-medium">{a.option}</p>
                <p className="text-muted-foreground">
                  rejected: {a.rejected_because}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Confidence
          </p>
          <p className="font-mono text-[11px] font-bold">
            {(rationale.confidence * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Cited
          </p>
          <p className="truncate font-mono text-[10px]" title={rationale.knowledge_cited.join(", ")}>
            {rationale.knowledge_cited[0] ?? "—"}
            {rationale.knowledge_cited.length > 1 ? ` +${rationale.knowledge_cited.length - 1}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
