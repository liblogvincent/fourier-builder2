import { useState } from "react";
import { useWorkspace } from "@/store/workspace";
import { VariantCard } from "@/components/timeline/VariantCard";
import { FormatPreview } from "@/components/content/FormatPreview";
import type { AdVariant } from "@/types";

interface ChannelTierProps {
  hasContent: boolean; // Tier 2 complete?
  effectiveVariants: AdVariant[];
  onGenerate: () => void;
  onImport: () => void;
}

type ChannelTab = "paid" | "social" | "hol" | "email";

const CHANNELS: { key: ChannelTab; label: string; desc: string }[] = [
  { key: "paid", label: "Paid Media", desc: "Meta/Google/LinkedIn ad copy + images. Format-fit to 9×16/16×9/1×1/4×5." },
  { key: "social", label: "Social & HN", desc: "LinkedIn, Instagram, YouTube + Hilti Network posts. R2 scope." },
  { key: "hol", label: "HOL", desc: "Landing pages, Contentful banners. R2 scope." },
  { key: "email", label: "Email", desc: "Figma → Excel basefile → SFMC preview. R2 scope." },
];

export function ChannelTier({ hasContent, effectiveVariants, onGenerate, onImport }: ChannelTierProps) {
  const [channelTab, setChannelTab] = useState<ChannelTab>("paid");
  const [selectedVariant, setSelectedVariant] = useState<AdVariant | null>(null);
  const qaResults = useWorkspace((s) => s.qaResults);
  const appliedFixes = useWorkspace((s) => s.appliedFixes);

  if (!hasContent) {
    return (
      <section className="rounded-sm border-2 border-dashed border-border bg-background/50 opacity-60">
        <div className="px-4 py-6 text-center">
          <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-foreground/60">Tier 3</span>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Channel Assignment — Locked</p>
          <p className="mt-1 text-xs text-muted-foreground">Complete Tier 2 (Variations) to assign content to channels.</p>
        </div>
      </section>
    );
  }

  const paidVariants = effectiveVariants.filter((v) => v.channel === "meta");
  const locales = [...new Set(effectiveVariants.map((v) => v.locale))];
  const [activeLocale, setActiveLocale] = useState(locales[0] || "de-DE");
  const filteredVariants = paidVariants.filter((v) => v.locale === activeLocale);
  const previewVariant = selectedVariant || filteredVariants[0] || null;

  return (
    <section className="rounded-sm border-2 border-blue/30 bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-blue/5">
        <div className="flex items-center gap-3">
          <span className="rounded-sm bg-blue px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">Tier 3</span>
          <div>
            <p className="text-sm font-bold">Channel — Platform Adaptation</p>
            <p className="font-mono text-[9px] text-muted-foreground">"Where does each variation go?" · {effectiveVariants.length} assets across channels</p>
          </div>
        </div>
        <span className="font-mono text-[9px] font-bold uppercase text-emerald">✓ {paidVariants.length} paid media · {locales.length} locales</span>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 border-b border-border bg-background p-1">
        {CHANNELS.map((ch) => (
          <button
            key={ch.key}
            onClick={() => setChannelTab(ch.key)}
            className={`flex-1 rounded-sm py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
              channelTab === ch.key ? "bg-foreground text-white" : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* Channel description */}
      <div className="border-b border-border bg-background px-4 py-1.5 font-mono text-[8px] text-muted-foreground">
        {CHANNELS.find((c) => c.key === channelTab)?.desc}
      </div>

      {/* Content per channel */}
      {channelTab === "paid" && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[8px] uppercase text-muted-foreground">Locale:</span>
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => setActiveLocale(loc)}
                className={`rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                  loc === activeLocale ? "bg-foreground text-white" : "border border-border text-muted-foreground"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredVariants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`text-left ${selectedVariant?.id === v.id ? "ring-2 ring-hilti rounded-sm" : ""}`}
                >
                  <VariantCard
                    variant={v}
                    flagged={qaResults.find((q) => q.variant_id === v.id && q.judge.verdict === "fail") ? {
                      phrase: qaResults.find((q) => q.variant_id === v.id)!.judge.flagged_phrase!,
                      suggestion: qaResults.find((q) => q.variant_id === v.id)!.judge.suggestion,
                    } : undefined}
                    onApplyFix={appliedFixes.has(v.id) ? undefined : () => useWorkspace.getState().applyFix(v.id)}
                  />
                </button>
              ))}
            </div>
            {previewVariant && (
              <FormatPreview
                headline={previewVariant.headline}
                primaryText={previewVariant.primary_text}
                cta={previewVariant.cta}
                imageRef={previewVariant.imageRef}
                locale={previewVariant.locale}
                channel={previewVariant.channel}
              />
            )}
          </div>
        </div>
      )}
      {channelTab !== "paid" && (
        <div className="p-8 text-center">
          <p className="text-xs text-muted-foreground">{CHANNELS.find((c) => c.key === channelTab)?.label} content — R2 scope. Not yet in prototype.</p>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <button onClick={onGenerate} className="rounded-sm bg-blue px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-white hover:bg-blue/90">
          ⟡ Auto-assign Channels
        </button>
        <button onClick={onImport} className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-muted-foreground hover:bg-black/5">
          ⬆ Import Channel Specs
        </button>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">Tier 3 complete — Tier 4 unlocked</span>
      </div>
    </section>
  );
}
