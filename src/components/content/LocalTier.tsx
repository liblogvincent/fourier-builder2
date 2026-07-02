import type { AdVariant } from "@/types";

interface LocalTierProps {
  hasContent: boolean; // Tier 3 complete?
  effectiveVariants: AdVariant[];
  onGenerate: () => void;
  onImport: () => void;
}

export function LocalTier({ hasContent, effectiveVariants, onGenerate, onImport }: LocalTierProps) {
  if (!hasContent) {
    return (
      <section className="rounded-sm border-2 border-dashed border-border bg-background/50 opacity-60">
        <div className="px-4 py-6 text-center">
          <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-foreground/60">Tier 4</span>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Local Markets — Locked</p>
          <p className="mt-1 text-xs text-muted-foreground">Complete Tier 3 (Channel Assignment) to localize per market.</p>
        </div>
      </section>
    );
  }

  const locales = [...new Set(effectiveVariants.map((v) => v.locale))];
  const localeCounts = locales.map((loc) => ({
    locale: loc,
    count: effectiveVariants.filter((v) => v.locale === loc).length,
    label: loc === "de-DE" ? "Germany (master)" :
           loc === "de-AT" ? "Austria" :
           loc === "de-CH" ? "Switzerland (DE)" :
           loc === "fr-CH" ? "Switzerland (FR)" : loc,
  }));

  return (
    <section className="rounded-sm border-2 border-emerald/30 bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-emerald/5">
        <div className="flex items-center gap-3">
          <span className="rounded-sm bg-emerald px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">Tier 4</span>
          <div>
            <p className="text-sm font-bold">Local — Market Versions</p>
            <p className="font-mono text-[9px] text-muted-foreground">"What does it say in each market?" · {effectiveVariants.length} localized assets</p>
          </div>
        </div>
        <span className="font-mono text-[9px] font-bold uppercase text-emerald">✓ {locales.length} markets</span>
      </div>

      {/* Locale matrix */}
      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {localeCounts.map((lc) => (
            <div key={lc.locale} className="rounded-sm border border-border bg-background p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold uppercase">{lc.locale}</span>
                <span className="rounded-sm bg-emerald px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase text-white">✓ done</span>
              </div>
              <p className="text-xs">{lc.label}</p>
              <p className="mt-1 font-mono text-[8px] text-muted-foreground">{lc.count} localized variants</p>
              <div className="mt-2 h-1 rounded-full bg-background overflow-hidden">
                <div className="h-full rounded-full bg-emerald" style={{ width: "100%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Locale diff summary */}
        <div className="mt-4 rounded-sm border border-border bg-background p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Locale Adaptations</p>
          <div className="space-y-1 text-[10px]">
            <p><span className="font-bold">de-DE → de-AT:</span> Lexicon identical to DE master</p>
            <p><span className="font-bold">de-DE → de-CH:</span> Safety cues swapped for durability/heritage (CH contractor preference)</p>
            <p><span className="font-bold">de-DE → fr-CH:</span> Full French translation · SKU codes preserved</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <button onClick={onGenerate} className="rounded-sm bg-emerald px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-white hover:bg-emerald/90">
          ⟡ Localize All
        </button>
        <button onClick={onImport} className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-muted-foreground hover:bg-black/5">
          ⬆ Import Translations
        </button>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">All tiers complete ✓</span>
      </div>
    </section>
  );
}
