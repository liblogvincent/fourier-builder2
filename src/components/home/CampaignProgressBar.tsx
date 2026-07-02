import type { Phase } from "@/types";

const STAGES: { key: Phase; label: string }[] = [
  { key: "planning", label: "Strategy" },
  { key: "content", label: "Content" },
  { key: "localization", label: "Localize" },
  { key: "qa", label: "QA" },
  { key: "rollout", label: "Rollout" },
  { key: "live", label: "Live" },
];

const ORDER: Phase[] = [
  "brief", "planning", "H1", "content", "localization", "qa",
  "H2", "H-legal", "rollout", "H3", "live", "H4", "done",
];

export function CampaignProgressBar({
  phase,
  title,
  subtitle,
}: {
  phase: Phase;
  title: string;
  subtitle?: string;
}) {
  const idx = ORDER.indexOf(phase);
  const pct = Math.round((idx / (ORDER.length - 1)) * 100);

  return (
    <div className="rounded-sm border border-border bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Active campaign
          </p>
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-bold tabular-nums">{pct}%</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {phase}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => {
          const sIdx = ORDER.indexOf(s.key);
          const isDone = idx > sIdx;
          const isActive = idx === sIdx || (idx > sIdx && i === STAGES.length - 1 && idx < ORDER.length - 1 && false);
          const isCurrent = phase === s.key;
          return (
            <div key={s.key} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`size-2.5 rounded-full transition-colors ${
                    isDone
                      ? "bg-foreground"
                      : isCurrent
                        ? "bg-hilti animate-pulse"
                        : "bg-black/10"
                  }`}
                />
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider ${
                    isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`h-px flex-1 ${isDone ? "bg-foreground" : "bg-black/10"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
