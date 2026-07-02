import type { DecisionRationale, RegistryArtifact, Brief, CampaignPlan, AdVariant } from "@/types";

interface MasterContentTierProps {
  effectiveRationale: DecisionRationale | undefined;
  effectiveBrief: Brief;
  effectivePlan: CampaignPlan;
  effectiveVariants: AdVariant[];
  brandGuidelines: RegistryArtifact[];
  hasContent: boolean;
  onGenerate: () => void;
  onImport: () => void;
}

export function MasterContentTier({
  effectiveRationale,
  effectiveBrief,
  effectivePlan,
  effectiveVariants,
  brandGuidelines,
  hasContent,
  onGenerate,
  onImport,
}: MasterContentTierProps) {
  return (
    <section className="rounded-sm border-2 border-foreground/20 bg-white">
      {/* Tier header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-foreground/5">
        <div className="flex items-center gap-3">
          <span className="rounded-sm bg-foreground px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">CP1</span>
          <div>
            <p className="text-sm font-bold">Creative Concept</p>
            <p className="font-mono text-[9px] text-muted-foreground">Big Idea · Look & Feel · Key Visual · Master Story · Approved at H-C gate</p>
          </div>
        </div>
        {hasContent && (
          <span className="font-mono text-[9px] font-bold uppercase text-emerald">✓ Complete · {effectiveVariants.length > 0 ? "4" : "0"} items</span>
        )}
      </div>

      {/* Content cards */}
      <div className="grid gap-4 p-4 lg:grid-cols-3">
        {/* Big Idea */}
        <div className="rounded-sm border border-border bg-background lg:col-span-2">
          <div className="border-b border-border px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Big Idea</span>
          </div>
          <div className="p-3">
            {effectiveRationale ? (
              <>
                <p className="text-sm font-bold">{effectiveRationale.decided}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {effectiveRationale.why.map((w, i) => (
                    <span key={i} className="rounded-full border border-border bg-white px-2 py-0.5 text-[9px] text-muted-foreground">
                      {w.slice(0, 70)}{w.length > 70 ? "…" : ""}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">No creative concept yet. Generate with Fourier or import from Figma.</p>
            )}
          </div>
        </div>

        {/* Key Visual */}
        <div className="rounded-sm border border-border bg-background">
          <div className="border-b border-border px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Key Visual</span>
            <span className={`ml-2 rounded-sm px-1 py-0.5 font-mono text-[7px] font-bold uppercase text-white ${hasContent ? "bg-emerald" : "bg-muted"}`}>
              {hasContent ? "generated" : "pending"}
            </span>
          </div>
          <div className="flex items-center justify-center p-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded border-2 border-dashed border-border bg-white">
                <span className="font-mono text-[7px] uppercase text-muted-foreground">KV</span>
              </div>
              <p className="font-mono text-[8px] text-muted-foreground">{effectiveBrief.product}</p>
            </div>
          </div>
        </div>

        {/* Master Story */}
        <div className="rounded-sm border border-border bg-background">
          <div className="border-b border-border px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Master Story</span>
          </div>
          <div className="p-3 space-y-2">
            {effectiveRationale?.why?.slice(0, 3).map((w, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 font-mono text-[9px] font-bold text-hilti">0{i + 1}</span>
                <p className="text-[10px] leading-relaxed">{w.slice(0, 80)}</p>
              </div>
            )) || (
              <p className="text-[10px] text-muted-foreground italic">No story messages yet.</p>
            )}
          </div>
        </div>

        {/* Key Video */}
        <div className="rounded-sm border border-border bg-background">
          <div className="border-b border-border px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Key Video</span>
            <span className="ml-2 rounded-sm bg-muted px-1 py-0.5 font-mono text-[7px] font-bold uppercase">R2</span>
          </div>
          <div className="flex items-center justify-center p-4">
            <div className="text-center">
              <div className="mx-auto mb-1 flex size-10 items-center justify-center rounded bg-black/10">
                <span className="font-mono text-[7px] uppercase text-muted-foreground">▶ mp4</span>
              </div>
              <p className="font-mono text-[8px] text-muted-foreground">15s demo — {effectiveBrief.product}</p>
            </div>
          </div>
        </div>

        {/* Concept Deck */}
        <div className="rounded-sm border border-border bg-background">
          <div className="border-b border-border px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Concept Deck</span>
            <span className={`ml-2 rounded-sm px-1 py-0.5 font-mono text-[7px] font-bold uppercase text-white ${hasContent ? "bg-emerald" : "bg-muted"}`}>
              {hasContent ? "ready" : "pending"}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4">
            <span className="font-mono text-lg font-bold text-hilti">P</span>
            <p className="text-center text-[10px]">Branded PPTX · Hilti template</p>
          </div>
        </div>
      </div>

      {/* Brand rules (Look & Feel from registry) */}
      {brandGuidelines.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Brand Rules (from Skills Registry)</p>
          <div className="flex flex-wrap gap-2">
            {brandGuidelines.slice(0, 4).map((rule) => (
              <span key={rule.id} className="rounded-sm border border-border bg-white px-2 py-1 font-mono text-[8px]">
                <span className="text-muted-foreground">{rule.scope}</span>{" "}
                <span className="font-bold">{rule.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dual CTA */}
      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <button
          onClick={onGenerate}
          className="rounded-sm bg-foreground px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-white hover:bg-hilti"
        >
          ⟡ {hasContent ? "Regenerate" : "Create with Fourier"}
        </button>
        <button
          onClick={onImport}
          className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-muted-foreground hover:bg-black/5"
        >
          ⬆ Import from Figma / DAM
        </button>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">
          {hasContent ? "CP1 complete — Tier 2 unlocked" : "Start here to unlock Tiers 2-4"}
        </span>
      </div>
    </section>
  );
}
