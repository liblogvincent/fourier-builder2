import { useWorkspace } from "@/store/workspace";

export function RolloutStatus() {
  const calls = useWorkspace((s) => s.connectorCalls);
  const byLocale = calls.reduce<Record<string, number>>((acc, c) => {
    const locale = c.variant_id.split("_").slice(2).join("_");
    acc[locale] = (acc[locale] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="rounded-sm border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Roll-out agent · deterministic publish
          </p>
          <h3 className="text-sm font-semibold">
            {calls.length} variants → meta_ads_api
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald">
          All ok · 99% conf
        </span>
      </div>
      <div className="grid grid-cols-4 gap-px bg-border">
        {Object.entries(byLocale).map(([locale, n]) => (
          <div key={locale} className="bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {locale}
            </p>
            <p className="mt-1 text-2xl font-bold">{n}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-emerald">
              published ✓
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3 font-mono text-[10px] text-muted-foreground">
        connector: meta_ads_api_v18 · adset target: dach_contractor/{`{locale}`}
      </div>
    </section>
  );
}
