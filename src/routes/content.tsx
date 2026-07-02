import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { MasterContentTier } from "@/components/content/MasterContentTier";
import { VariationsTier } from "@/components/content/VariationsTier";
import { ChannelTier } from "@/components/content/ChannelTier";
import { LocalTier } from "@/components/content/LocalTier";
import { FigmaPushPanel } from "@/components/content/FigmaPushPanel";
import { AgencyUploadZone } from "@/components/content/AgencyUploadZone";
import { openPptxInNewTab } from "@/lib/html-pptx";
import { listSkills } from "@/lib/persistence";
import { useState, useMemo, useEffect } from "react";
import {
  brief as refBrief,
  plan as refPlan,
  variants as refVariants,
  rationaleScript,
} from "@/fixtures/camp_04";
import type { AdVariant, DecisionRationale, RegistryArtifact } from "@/types";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [{ title: "Content Workspace — Fourier" }, { name: "description", content: "4-tier content hierarchy with dual creation paths." }],
  }),
  component: ContentDashboard,
});

function ContentDashboard() {
  const brief = useWorkspace((s) => s.brief);
  const plan = useWorkspace((s) => s.plan);
  const variants = useWorkspace((s) => s.variants);
  const phase = useWorkspace((s) => s.phase);
  const rationaleStream = useWorkspace((s) => s.rationaleStream);

  const contentRationale = useMemo(() => rationaleStream.filter((r) => r.agent === "content").at(-1), [rationaleStream]);
  const [brandGuidelines, setBrandGuidelines] = useState<RegistryArtifact[]>([]);
  useEffect(() => {
    listSkills().then((skills) => {
      setBrandGuidelines(skills.filter((s) => s.status === "Approved" && (s.type === "Guideline" || s.type === "Rule")));
    }).catch(() => setBrandGuidelines([]));
  }, []);

  const hasContent = variants.length > 0;
  const [showReference, setShowReference] = useState(false);
  const useReference = showReference && !hasContent;

  const effectiveBrief = useReference ? refBrief : brief;
  const effectivePlan = useReference ? refPlan : plan;
  const effectiveVariants = useReference ? refVariants : variants;
  const effectiveRationale: DecisionRationale | undefined = useReference ? rationaleScript.content : contentRationale;

  // Progressive reveal logic
  const tier1Complete = hasContent || useReference;
  const tier2Complete = tier1Complete; // Tier 2 unlocks when Tier 1 is complete (mock variations)
  const tier3Complete = tier2Complete; // Tier 3 unlocks when Tier 2 is complete
  const tier4Complete = tier3Complete; // Tier 4 unlocks when Tier 3 is complete

  // Guard
  if (phase === "brief" && brief.campaign === "New Campaign" && !showReference) {
    return (
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center space-y-4">
          <p className="text-sm text-muted-foreground">No active campaign. Start a campaign first to see content.</p>
          <button onClick={() => setShowReference(true)} className="rounded-sm bg-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase text-white hover:bg-hilti">
            Previous Campaigns: camp_04 →
          </button>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-6">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Content Workspace</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{effectiveBrief.campaign}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{effectiveBrief.product} · {effectiveBrief.market} · Phase: {phase}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openPptxInNewTab({ brief: effectiveBrief, plan: effectivePlan, variants: effectiveVariants, variantCount: effectiveVariants.length || 4, localeCount: effectiveBrief.locales.length })}
              className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase hover:bg-black/5"
            >
              View Deck →
            </button>
          </div>
        </header>

        {/* Reference toggle */}
        {!hasContent && (
          <div className="rounded-sm border border-border bg-background px-4 py-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground"><strong className="text-foreground">No content yet.</strong> View a previous campaign as reference.</span>
            <button onClick={() => setShowReference(!showReference)} className={`rounded-sm px-3 py-1 font-mono text-[10px] font-bold uppercase ${showReference ? "bg-foreground text-white" : "border border-border text-muted-foreground hover:bg-black/5"}`}>
              {showReference ? "← My Campaign" : "Previous Campaigns: camp_04 →"}
            </button>
          </div>
        )}
        {showReference && !hasContent && (
          <div className="rounded-sm border border-amber/20 bg-amber/5 px-4 py-3 text-xs">
            <span className="font-bold text-amber">Viewing reference:</span> camp_04 — Q4 Power-Tool Push. All 4 tiers shown pre-populated as a template.
          </div>
        )}

        {/* ── TIER 1: MASTER CONTENT ── */}
        <MasterContentTier
          effectiveRationale={effectiveRationale}
          effectiveBrief={effectiveBrief}
          effectivePlan={effectivePlan}
          effectiveVariants={effectiveVariants}
          brandGuidelines={brandGuidelines}
          hasContent={tier1Complete}
          onGenerate={() => useWorkspace.getState().advance()}
          onImport={() => document.getElementById("agency-upload-section")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Connector arrow */}
        {tier1Complete && <Arrow />}

        {/* ── TIER 2: VARIATIONS ── */}
        <VariationsTier
          hasContent={tier2Complete}
          onGenerate={() => {}}
          onImport={() => document.getElementById("agency-upload-section")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Connector arrow */}
        {tier2Complete && <Arrow />}

        {/* ── TIER 3: CHANNEL ── */}
        <ChannelTier
          hasContent={tier3Complete}
          effectiveVariants={effectiveVariants}
          onGenerate={() => {}}
          onImport={() => document.getElementById("agency-upload-section")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* Connector arrow */}
        {tier3Complete && <Arrow />}

        {/* ── TIER 4: LOCAL ── */}
        <LocalTier
          hasContent={tier4Complete}
          effectiveVariants={effectiveVariants}
          onGenerate={() => {}}
          onImport={() => document.getElementById("agency-upload-section")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* ── FIGMA + AGENCY UPLOAD (bottom) ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Figma Board — Single Source of Truth</h2>
            <FigmaPushPanel variants={effectiveVariants} />
          </section>
          <section id="agency-upload-section">
            <h2 className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Agency Upload — Import from DAM / Figma</h2>
            <AgencyUploadZone />
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center text-muted-foreground/40">
        <span className="font-mono text-lg">│</span>
        <span className="font-mono text-[8px] uppercase tracking-widest">unlocks</span>
        <span className="font-mono text-lg">▼</span>
      </div>
    </div>
  );
}
