import type { AdVariant } from "@/types";

interface VariationsTierProps {
  hasContent: boolean; // Tier 1 complete?
  variants: AdVariant[];
  onGenerate: () => void;
  onImport: () => void;
}

export function VariationsTier({ hasContent, variants, onGenerate, onImport }: VariationsTierProps) {
  // Derive variations from real variant data
  const baseVariants = [...new Map(variants.map(v => [v.headline, v])).values()]; // unique by headline

  if (!hasContent) {
    return (
      <section className="rounded-sm border-2 border-dashed border-border bg-background/50 opacity-60">
        <div className="px-4 py-6 text-center">
          <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-foreground/60">CP3</span>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Creative Briefing & Storyboarding — Locked</p>
          <p className="mt-1 text-xs text-muted-foreground">Complete CP1 Creative Concept to unlock storyboards, shotlists, and production plans.</p>
        </div>
      </section>
    );
  }

  if (baseVariants.length === 0) {
    return (
      <section className="rounded-sm border-2 border-dashed border-border bg-background/50">
        <div className="px-4 py-6 text-center">
          <span className="rounded-sm bg-amber px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">CP3</span>
          <p className="mt-2 text-sm font-semibold">Creative Briefing & Storyboarding</p>
          <p className="mt-1 text-xs text-muted-foreground">No variants yet. Generate content to populate storyboards and variations.</p>
          <button onClick={onGenerate} className="mt-3 rounded-sm bg-amber px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-white hover:bg-amber/90">
            ⟡ Generate Variations
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-sm border-2 border-amber/30 bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-amber/5">
        <div className="flex items-center gap-3">
          <span className="rounded-sm bg-amber px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">CP3</span>
          <div>
            <p className="text-sm font-bold">Creative Briefing & Storyboarding</p>
            <p className="font-mono text-[9px] text-muted-foreground">Storyboards · Shotlists · Scripts · Production Plans · Derived from CP1 Creative Concept</p>
          </div>
        </div>
        <span className="font-mono text-[9px] font-bold uppercase text-emerald">✓ {baseVariants.length} variations</span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {baseVariants.map((v) => (
          <div key={v.id} className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-sm px-1 py-0.5 font-mono text-[7px] font-bold uppercase text-white bg-emerald">copy</span>
              <span className="font-mono text-[8px] text-muted-foreground">← {v.locale}</span>
            </div>
            <p className="text-xs font-semibold truncate">{v.headline}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{v.primary_text.slice(0, 50)}…</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="font-mono text-[7px] text-muted-foreground">Formats: 9×16, 16×9, 1×1, 4×5</span>
            </div>
          </div>
        ))}
        <button className="flex items-center justify-center rounded-sm border-2 border-dashed border-border bg-background p-3 hover:border-foreground/40">
          <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground">+ Add Variation</span>
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <button onClick={onGenerate} className="rounded-sm bg-amber px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-white hover:bg-amber/90">
          ⟡ Generate More
        </button>
        <button onClick={onImport} className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-muted-foreground hover:bg-black/5">
          ⬆ Import from DAM
        </button>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">Tier 2 complete — Tier 3 unlocked</span>
      </div>
    </section>
  );
}
