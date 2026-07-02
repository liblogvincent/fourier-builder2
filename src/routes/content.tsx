import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { AgencyUploadZone } from "@/components/content/AgencyUploadZone";
import { FigmaPushPanel } from "@/components/content/FigmaPushPanel";
import { FormatPreview } from "@/components/content/FormatPreview";
import { VariantCard } from "@/components/timeline/VariantCard";
import { openPptxInNewTab } from "@/lib/html-pptx";
import { listSkills } from "@/lib/persistence";
import { useState, useMemo } from "react";
import type { AdVariant, DecisionRationale, RegistryArtifact } from "@/types";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content Workspace — Fourier" },
      { name: "description", content: "Master content, channel breakdown, Figma integration." },
    ],
  }),
  component: ContentDashboard,
});

type ChannelTab = "paid" | "social" | "hol" | "email";

const CHANNELS: { key: ChannelTab; label: string; description: string }[] = [
  { key: "paid", label: "Paid Media", description: "Meta/Google/LinkedIn ad copy + images. Format-fit to 9×16 / 16×9 / 1×1 / 4×5. R1 scope." },
  { key: "social", label: "Social & HN", description: "LinkedIn, Instagram, YouTube + Hilti Network posts. R2 scope." },
  { key: "hol", label: "HOL", description: "Landing pages, Contentful banners (×N MO spaces), hardcoded banners. R2 scope." },
  { key: "email", label: "Email", description: "Figma mock-up → Excel basefile → SFMC preview. Localized per market. R2 scope." },
];

function ContentDashboard() {
  const brief = useWorkspace((s) => s.brief);
  const plan = useWorkspace((s) => s.plan);
  const variants = useWorkspace((s) => s.variants);
  const phase = useWorkspace((s) => s.phase);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const rationaleStream = useWorkspace((s) => s.rationaleStream);
  const qaResults = useWorkspace((s) => s.qaResults);
  const appliedFixes = useWorkspace((s) => s.appliedFixes);
  const [channelTab, setChannelTab] = useState<ChannelTab>("paid");
  const [selectedVariant, setSelectedVariant] = useState<AdVariant | null>(null);

  // Data-driven derivations (replaces hardcoded mock functions)
  const contentRationale: DecisionRationale | undefined = useMemo(
    () => rationaleStream.filter((r) => r.agent === "content").at(-1),
    [rationaleStream],
  );

  const brandGuidelines: RegistryArtifact[] = useMemo(() => {
    try {
      return listSkills().filter((s) => s.status === "Approved" && (s.type === "Guideline" || s.type === "Rule"));
    } catch {
      return [];
    }
  }, []);

  const hasContent = variants.length > 0;
  const contentReady = phase === "content" || phase === "localization" || phase === "qa" ||
    phase === "H2" || phase === "H-legal" || phase === "rollout" || phase === "H3" ||
    phase === "live" || phase === "H4" || phase === "done";
  const preContent = phase === "brief" || phase === "planning" || phase === "H1";

  // Guard: no active campaign
  if (phase === "brief" && brief.campaign === "New Campaign") {
    return (
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">No active campaign. Start a campaign first to see content.</p>
        </div>
      </WorkspaceShell>
    );
  }

  // Paid Media variants (real data)
  const paidVariants = useMemo(() => variants.filter((v) => v.channel === "meta"), [variants]);
  const linkedinVariants = useMemo(() => variants.filter((v) => v.channel === "linkedin"), [variants]);
  const locales = useMemo(() => [...new Set(variants.map((v) => v.locale))], [variants]);
  const [activeLocale, setActiveLocale] = useState<string>(locales[0] || "de-DE");
  const filteredVariants = useMemo(
    () => paidVariants.filter((v) => v.locale === activeLocale),
    [paidVariants, activeLocale],
  );

  // FormatPreview data
  const previewVariant = selectedVariant || filteredVariants[0] || null;

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        {/* Header */}
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Content Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{brief.campaign}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {brief.product} · {brief.market} · {brief.locales.join(" / ")} · Phase: {phase}
          </p>
        </header>

        {/* Gate Status Banner */}
        {preContent && (
          <div className="rounded-sm border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Content pending.</span> Creative content will be generated after H1 Plan Approval. Advance through briefing → strategy → H1 to trigger content generation.
          </div>
        )}
        {phase === "content" && agentBusy === "content" && (
          <div className="rounded-sm border border-blue/20 bg-blue/5 px-4 py-3 text-xs">
            <span className="font-bold text-blue">Content agent generating…</span> The Content agent is creating creative concepts and ad variants. Results will appear below shortly.
          </div>
        )}
        {phase === "content" && hasContent && !agentBusy && (
          <div className="rounded-sm border border-emerald/20 bg-emerald/5 px-4 py-3 text-xs">
            <span className="font-bold text-emerald">✓ Content generated.</span> {contentRationale?.decided || "Creative concepts ready for review."}
            <span className="ml-2 text-muted-foreground">Ready for Creative Approval (H-C gate — not yet wired into pipeline Phase type).</span>
          </div>
        )}
        {contentReady && hasContent && (
          <div className="rounded-sm border border-emerald/20 bg-emerald/5 px-4 py-3 text-xs">
            <span className="font-bold text-emerald">✓ Content complete.</span> {contentRationale?.decided || ""} {variants.length} variants across {locales.length} locales.
          </div>
        )}

        {/* ================================================================ */}
        {/* TIER 1: MASTER CONTENT */}
        {/* ================================================================ */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">Tier 1</span>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Master Content — Creative Concept</h2>
            <span className="ml-auto font-mono text-[9px] text-muted-foreground">Approved at H-C gate · feeds all channels</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Big Idea */}
            <div className="rounded-sm border border-border bg-white lg:col-span-2">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Big Idea</span>
              </div>
              <div className="p-4">
                {contentRationale ? (
                  <>
                    <p className="text-lg font-bold tracking-tight">{contentRationale.decided}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {contentRationale.why.map((w, i) => (
                        <span key={i} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                          {w.slice(0, 80)}{w.length > 80 ? "…" : ""}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                      <span>Confidence: {(contentRationale.confidence * 100).toFixed(0)}%</span>
                      <span>·</span>
                      <span>Cited: {contentRationale.knowledge_cited.join(", ")}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Creative concept pending — the Content agent will generate the Big Idea after H1 Plan Approval.</p>
                )}
              </div>
            </div>

            {/* Key Visual */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Key Visual</span>
                <span className={`ml-2 rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white ${hasContent ? "bg-emerald" : "bg-muted"}`}>
                  {hasContent ? "generated" : "pending"}
                </span>
              </div>
              <div className="flex items-center justify-center bg-black/5 p-6">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded border-2 border-dashed border-border bg-white">
                    <span className="font-mono text-[8px] uppercase text-muted-foreground">KV</span>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">
                    {contentRationale?.decided?.slice(0, 80) || brief.product} — {hasContent ? `${variants.length} variants generated` : "pending generation"}
                  </p>
                </div>
              </div>
              <div className="border-t border-border px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Source: AI · Adobe Firefly (stub)</span>
                <button className="font-mono text-[9px] uppercase text-hilti hover:underline">Edit in Figma →</button>
              </div>
            </div>

            {/* Master Story */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Master Story</span>
              </div>
              <div className="p-4 space-y-3">
                {contentRationale?.why?.length ? (
                  contentRationale.why.map((w, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="mt-0.5 font-mono text-[10px] font-bold text-hilti">0{i + 1}</span>
                      <p className="text-xs">{w}</p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="mt-0.5 font-mono text-[10px] font-bold text-muted-foreground">01</span>
                      <p className="text-xs text-muted-foreground">{brief.objective}</p>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground">Waiting for Content agent to develop messages.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Video */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Key Video</span>
                <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-foreground">R2</span>
              </div>
              <div className="flex items-center justify-center bg-black/5 p-6">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded bg-black/10">
                    <span className="font-mono text-[8px] uppercase text-muted-foreground">▶ mp4</span>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground">15s product demo — {brief.product} torque control → jobsite wide → CTA overlay</p>
                </div>
              </div>
              <div className="border-t border-border px-4 py-2">
                <span className="font-mono text-[9px] text-muted-foreground">Deferred to R2 — video MCP not yet mature</span>
              </div>
            </div>

            {/* Concept Deck */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Concept Deck</span>
                <span className={`ml-2 rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white ${hasContent ? "bg-emerald" : "bg-muted"}`}>
                  {hasContent ? "ready" : "pending"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 p-6">
                <div className="flex size-12 items-center justify-center rounded bg-hilti/10">
                  <span className="font-mono text-lg font-bold text-hilti">P</span>
                </div>
                <p className="text-center text-xs">Branded PPTX · Hilti corporate template · {variants.length || 0} variants included</p>
                <button
                  onClick={() => openPptxInNewTab({ brief, plan, variants, variantCount: variants.length || 4, localeCount: brief.locales.length })}
                  className="rounded-sm bg-hilti px-3 py-1.5 font-mono text-[10px] font-bold text-white hover:bg-hilti/90"
                >
                  View Deck →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* LOOK & FEEL — from skills registry */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Look & Feel — Brand Rules
          </h2>
          {brandGuidelines.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {brandGuidelines.map((rule) => (
                <div key={rule.id} className="rounded-sm border border-border bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white ${
                      rule.scope === "Global" ? "bg-foreground" : rule.scope === "Market" ? "bg-hilti" : "bg-muted"
                    }`}>{rule.scope}</span>
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">{rule.type}</span>
                    <span className="ml-auto font-mono text-[8px] text-muted-foreground">{rule.provenance === "human_authored" ? "✎ human" : "🤖 ai"}</span>
                  </div>
                  <p className="text-sm font-bold">{rule.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{rule.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-background p-6 text-center">
              <p className="text-xs text-muted-foreground">No brand rules loaded. <a href="/skills" className="text-hilti underline">Check Skills Registry →</a></p>
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/* TIER 2: CHANNEL CONTENT */}
        {/* ================================================================ */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-foreground">Tier 2</span>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Channel Content</h2>
            <span className="ml-auto font-mono text-[9px] text-muted-foreground">Derived from master · format-fit per channel</span>
          </div>

          {/* Channel tabs */}
          <div className="flex gap-1 rounded-sm border border-border bg-background p-1 mb-4">
            {CHANNELS.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setChannelTab(ch.key)}
                className={`flex-1 rounded-sm py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  channelTab === ch.key ? "bg-foreground text-white" : "text-muted-foreground hover:bg-black/5"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Channel description */}
          <div className="mb-4 rounded-sm border border-border bg-background px-4 py-2 text-xs text-muted-foreground">
            <strong className="text-foreground">{CHANNELS.find(c => c.key === channelTab)?.label}</strong>
            {" — "}{CHANNELS.find(c => c.key === channelTab)?.description}
          </div>

          {/* Channel content */}
          {channelTab === "paid" && (
            hasContent ? (
              <div className="space-y-4">
                {/* Locale filter */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">Locale:</span>
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setActiveLocale(loc)}
                      className={`rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        loc === activeLocale ? "bg-foreground text-white" : "border border-border text-muted-foreground hover:bg-black/5"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                  <span className="ml-auto font-mono text-[9px] text-muted-foreground">
                    {paidVariants.length} variants · {locales.length} locales · 4 formats
                  </span>
                </div>

                {/* Variant grid + FormatPreview side-by-side */}
                <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                  {/* Variant cards */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredVariants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`text-left transition-all ${
                          selectedVariant?.id === v.id ? "ring-2 ring-hilti rounded-sm" : ""
                        }`}
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

                  {/* FormatPreview sidebar */}
                  <div>
                    {previewVariant ? (
                      <FormatPreview
                        headline={previewVariant.headline}
                        primaryText={previewVariant.primary_text}
                        cta={previewVariant.cta}
                        imageRef={previewVariant.imageRef}
                        locale={previewVariant.locale}
                        channel={previewVariant.channel}
                      />
                    ) : (
                      <div className="rounded-sm border border-dashed border-border bg-background p-6 text-center">
                        <p className="font-mono text-[9px] text-muted-foreground">Select a variant to preview format fit</p>
                      </div>
                    )}
                    <p className="mt-2 text-center font-mono text-[8px] text-muted-foreground">
                      Click a variant card to preview · formats: 9×16 / 16×9 / 1×1 / 4×5
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
                <p className="text-xs text-muted-foreground">Content not yet generated. Variants will appear here after the Content agent runs. Advance past H1 to trigger content generation.</p>
              </div>
            )
          )}

          {channelTab === "social" && (
            linkedinVariants.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {linkedinVariants.map((v) => (
                  <VariantCard key={v.id} variant={v} />
                ))}
              </div>
            ) : (
              <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
                <p className="text-sm font-semibold">Social & HN content — R2 scope</p>
                <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                  LinkedIn, Instagram, YouTube + Hilti Network posts. The current prototype generates Meta paid-social content at R1. Social variants will appear here when multi-channel generation is enabled (R2).
                </p>
              </div>
            )
          )}

          {channelTab === "hol" && (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
              <p className="text-sm font-semibold">HOL — Hilti Online content — R2 scope</p>
              <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                Landing page mock-ups (C6), Contentful banners rebuilt per MO space (R4), hardcoded banners via Weblate (R9). Requires Contentful integration + Figma→Contentful mapping pipeline. Not yet in prototype scope.
              </p>
            </div>
          )}

          {channelTab === "email" && (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
              <p className="text-sm font-semibold">Email content — R2 scope</p>
              <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                Figma email mock-up → Excel basefile → SFMC preview (C5, R6). Localized per market via Weblate/Transperfect. Requires SFMC integration. Not yet in prototype scope.
              </p>
            </div>
          )}
        </section>

        {/* Figma + Agency upload */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Figma Board — Single Source of Truth
          </h2>
          <FigmaPushPanel variants={variants} />
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Agency Content Upload — Feed into Figma Board
          </h2>
          <AgencyUploadZone />
        </section>
      </div>
    </WorkspaceShell>
  );
}
