import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { AgencyUploadZone } from "@/components/content/AgencyUploadZone";
import { FigmaPushPanel } from "@/components/content/FigmaPushPanel";
import { openPptxInNewTab } from "@/lib/html-pptx";
import { useState } from "react";

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

const CHANNELS: { key: ChannelTab; label: string; color: string }[] = [
  { key: "paid", label: "Paid Media", color: "bg-blue" },
  { key: "social", label: "Social & HN", color: "bg-purple" },
  { key: "hol", label: "HOL", color: "bg-emerald" },
  { key: "email", label: "Email", color: "bg-amber" },
];

const FORMATS = ["9x16", "16x9", "1x1", "4x5"] as const;

// Master content derived from the campaign plan + creative concept
interface MasterContent {
  bigIdea: string;
  lookAndFeel: string;
  keyVisual: { concept: string; status: "generated" | "pending" | "agency" };
  masterStory: { headline: string; messages: string[] };
  keyVideo: { concept: string; status: "deferred" | "generated" | "pending" };
}

function deriveMasterContent(briefCampaign: string, briefProduct: string, planRationale: string): MasterContent {
  return {
    bigIdea: `Precision torque for ${briefCampaign.includes("DACH") ? "DACH" : briefCampaign.split("—")[0]?.trim() || "EU"} finishing crews`,
    lookAndFeel: "Hilti Red #D2051E · industrial textures · jobsite photography · technical-feature close-ups · Maize Gold accents",
    keyVisual: {
      concept: `${briefProduct} in action — dust-lit workshop, foreman mid-task, torque control visible`,
      status: "generated",
    },
    masterStory: {
      headline: planRationale.slice(0, 60),
      messages: [
        "Precision: constant torque control eliminates over-tightening, protects fasteners",
        "Durability: brushless motor rated 2,000+ hours, IP56 dust/water protection",
        "Productivity: 30% faster rundown vs previous gen, one battery lasts full shift",
      ],
    },
    keyVideo: {
      concept: "15s product demo — close-up torque control → jobsite wide → CTA overlay",
      status: "deferred",
    },
  };
}

// Mock channel content derived from variants + locale data
interface ChannelAsset {
  id: string;
  name: string;
  locale: string;
  format: string;
  headline?: string;
  status: "ready" | "draft" | "pending";
  figmaLinked: boolean;
}

function deriveChannelAssets(channel: ChannelTab, locales: string[], variantCount: number): ChannelAsset[] {
  const assets: ChannelAsset[] = [];
  const perLocale = channel === "paid" ? variantCount : channel === "social" ? 2 : channel === "hol" ? 1 : 1;
  for (const loc of locales) {
    for (let i = 0; i < perLocale; i++) {
      for (const fmt of FORMATS.slice(0, channel === "email" ? 1 : 4)) {
        assets.push({
          id: `${channel}_${loc}_${i + 1}_${fmt}`,
          name: channel === "paid" ? `Ad variant ${i + 1}` :
                channel === "social" ? `Social post ${i + 1}` :
                channel === "hol" ? `Landing page banner` : `Email block ${i + 1}`,
          locale: loc,
          format: fmt,
          status: channel === "paid" ? "ready" : channel === "social" ? "draft" : "pending",
          figmaLinked: channel === "paid",
        });
      }
    }
  }
  return assets;
}

function ContentDashboard() {
  const variants = useWorkspace((s) => s.variants);
  const brief = useWorkspace((s) => s.brief);
  const plan = useWorkspace((s) => s.plan);
  const phase = useWorkspace((s) => s.phase);
  const [channelTab, setChannelTab] = useState<ChannelTab>("paid");

  const hasCampaign = phase !== "brief" || brief.campaign !== "New Campaign";
  if (!hasCampaign) {
    return (
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">No active campaign. Start a campaign first to see content.</p>
        </div>
      </WorkspaceShell>
    );
  }

  const master = deriveMasterContent(brief.campaign, brief.product, plan.rationale.decided);
  const channelAssets = deriveChannelAssets(channelTab, brief.locales, variants.length || 4);

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        {/* Header */}
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Content Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{brief.campaign}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {brief.product} · {brief.market} · {brief.locales.join(" / ")} · {brief.channels.join(", ")} · Phase: {phase}
          </p>
        </header>

        {/* ================================================================ */}
        {/* TIER 1: MASTER CONTENT (Creative Concept — approved at H-C gate) */}
        {/* ================================================================ */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">Tier 1</span>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Master Content — Creative Concept</h2>
            <span className="ml-auto font-mono text-[9px] text-muted-foreground">Approved at H-C gate · feeds all channels</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Big Idea + Look & Feel */}
            <div className="rounded-sm border border-border bg-white lg:col-span-2">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Big Idea</span>
              </div>
              <div className="p-4">
                <p className="text-lg font-bold tracking-tight">{master.bigIdea}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {master.masterStory.messages.map((m, i) => (
                    <span key={i} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {i + 1}. {m.slice(0, 60)}…
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Look & Feel</span>
                <p className="mt-1 text-xs text-muted-foreground">{master.lookAndFeel}</p>
              </div>
            </div>

            {/* Key Visual */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Key Visual</span>
                <span className={`ml-2 rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white ${
                  master.keyVisual.status === "generated" ? "bg-emerald" : "bg-amber"
                }`}>{master.keyVisual.status}</span>
              </div>
              <div className="flex items-center justify-center bg-black/5 p-6">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded border-2 border-dashed border-border bg-white">
                    <span className="font-mono text-[8px] uppercase text-muted-foreground">KV</span>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">{master.keyVisual.concept.slice(0, 80)}…</p>
                </div>
              </div>
              <div className="border-t border-border px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Source: AI · Adobe Firefly</span>
                <button className="font-mono text-[9px] uppercase text-hilti hover:underline">Edit in Figma →</button>
              </div>
            </div>

            {/* Master Story */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Master Story</span>
              </div>
              <div className="p-4 space-y-3">
                {master.masterStory.messages.map((m, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-0.5 font-mono text-[10px] font-bold text-hilti">0{i + 1}</span>
                    <div>
                      <p className="text-xs font-semibold">{m.split(":")[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{m.split(":").slice(1).join(":")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Video */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Key Video</span>
                <span className={`ml-2 rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white ${
                  master.keyVideo.status === "deferred" ? "bg-muted" : "bg-emerald"
                }`}>R2</span>
              </div>
              <div className="flex items-center justify-center bg-black/5 p-6">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded bg-black/10">
                    <span className="font-mono text-[8px] uppercase text-muted-foreground">▶ mp4</span>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground">{master.keyVideo.concept}</p>
                </div>
              </div>
            </div>

            {/* Creative Concept Deck */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border px-4 py-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Concept Deck</span>
                <span className="ml-2 rounded-sm bg-emerald px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-white">generated</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 p-6">
                <div className="flex size-12 items-center justify-center rounded bg-hilti/10">
                  <span className="font-mono text-lg font-bold text-hilti">P</span>
                </div>
                <p className="text-center text-xs">Branded PPTX · Hilti corporate template</p>
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
                  channelTab === ch.key
                    ? "bg-foreground text-white"
                    : "text-muted-foreground hover:bg-black/5"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Channel description */}
          {channelTab === "paid" && (
            <div className="mb-4 rounded-sm border border-border bg-background px-4 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">Paid Media Content (R1)</strong> — Meta/Google/LinkedIn ad copy + images, formatted to 9×16 / 16×9 / 1×1 / 4×5. Compliance-checked before ship. Copy from C1 agent, images from C4 agent.
            </div>
          )}
          {channelTab === "social" && (
            <div className="mb-4 rounded-sm border border-border bg-background px-4 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">Organic Social & HN (R2)</strong> — LinkedIn, Instagram, YouTube + Hilti Network posts. Derived from social strategy (A5) + creative concept. Formatted for platform-specific specs. Sprinklr-ready.
            </div>
          )}
          {channelTab === "hol" && (
            <div className="mb-4 rounded-sm border border-border bg-background px-4 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">HOL — Hilti Online (R2)</strong> — Landing page mock-ups (C6), Contentful banners (× N MO spaces, rebuilt per space), hardcoded banners (Weblate strings). Feeds from HOL journey map (A3).
            </div>
          )}
          {channelTab === "email" && (
            <div className="mb-4 rounded-sm border border-border bg-background px-4 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">Email (R2)</strong> — Figma mock-up → Excel basefile → SFMC preview (C5, R6). Localized per market via Weblate/Transperfect. QA validates design alignment + CTA links (R7).
            </div>
          )}

          {/* Asset grid */}
          <div className="rounded-sm border border-border bg-white">
            <div className="grid grid-cols-[1fr_80px_70px_90px_90px] gap-3 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <span>Asset</span>
              <span>Locale</span>
              <span>Format</span>
              <span>Status</span>
              <span>Figma</span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {channelAssets.slice(0, 20).map((a) => (
                <div key={a.id} className="grid grid-cols-[1fr_80px_70px_90px_90px] gap-3 items-center px-4 py-2 text-xs hover:bg-black/[0.01]">
                  <div>
                    <p className="font-medium truncate">{a.name}</p>
                    {a.headline && <p className="font-mono text-[9px] text-muted-foreground truncate">{a.headline}</p>}
                  </div>
                  <span className="font-mono text-[10px]">{a.locale}</span>
                  <span className="font-mono text-[10px]">{a.format}</span>
                  <span className={`font-mono text-[9px] font-bold uppercase ${
                    a.status === "ready" ? "text-emerald" : a.status === "draft" ? "text-amber" : "text-muted-foreground"
                  }`}>{a.status}</span>
                  <span className={`font-mono text-[9px] ${a.figmaLinked ? "text-[#a259ff]" : "text-muted-foreground"}`}>
                    {a.figmaLinked ? "✓ linked" : "—"}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2 font-mono text-[9px] text-muted-foreground">
              {channelAssets.length} assets · {brief.locales.length} locales · {FORMATS.slice(0, channelTab === "email" ? 1 : 4).join(", ")} formats
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FIGMA INTEGRATION */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Figma Board — Single Source of Truth
          </h2>
          <FigmaPushPanel variants={variants.length > 0 ? variants : channelAssets.map(a => ({
            id: a.id, channel: "meta" as const, segment: "contractor", locale: a.locale,
            headline: a.name, primary_text: "", cta: "Mehr erfahren", imageRef: "placeholder",
          }))} />
        </section>

        {/* ================================================================ */}
        {/* AGENCY UPLOAD */}
        {/* ================================================================ */}
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
