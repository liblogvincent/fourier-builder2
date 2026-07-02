import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { useMemo, useState } from "react";
import {
  brief as refBrief,
  plan as refPlan,
  variants as refVariants,
  qaResults as refQa,
  connectorCalls as refConn,
  rationaleScript,
} from "@/fixtures/camp_04";
import type { ConnectorCall, QAResult } from "@/types";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Workspace — Fourier" },
      { name: "description", content: "Media plan, publishing status, UTM tracking, QA dashboard." },
    ],
  }),
  component: MediaDashboard,
});

function MediaDashboard() {
  const brief = useWorkspace((s) => s.brief);
  const plan = useWorkspace((s) => s.plan);
  const phase = useWorkspace((s) => s.phase);
  const connectorCalls = useWorkspace((s) => s.connectorCalls);
  const qaResults = useWorkspace((s) => s.qaResults);
  const variants = useWorkspace((s) => s.variants);
  const rationaleStream = useWorkspace((s) => s.rationaleStream);

  const effectiveStrategyRationale = useMemo(
    () => rationaleStream.filter((r) => r.agent === "strategy").at(-1),
    [rationaleStream],
  );

  // Reference template mode — use camp_04 fixture when user's campaign has no media data
  const hasMediaData = connectorCalls.length > 0 || qaResults.length > 0;
  const [showReference, setShowReference] = useState(false);
  const useReference = showReference && !hasMediaData;

  const effectiveBrief = useReference ? refBrief : brief;
  const effectivePlan = useReference ? refPlan : plan;
  const effectiveConnectorCalls: ConnectorCall[] = useReference ? refConn : connectorCalls;
  const effectiveQaResults: QAResult[] = useReference ? refQa : qaResults;
  const effectiveVariants = useReference ? refVariants : variants;
  const effectiveStrategyRationale = useReference
    ? rationaleScript.plan
    : strategyRationale;

  // Guard: no active campaign (unless showing reference)
  if (phase === "brief" && effectiveBrief.campaign === "New Campaign" && !showReference) {
    return (
      <WorkspaceShell>
        <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">No active campaign. Start a campaign first to see the media plan.</p>
          <button
            onClick={() => setShowReference(true)}
            className="mt-4 rounded-sm bg-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase text-white hover:bg-hilti"
          >
            Previous Campaigns: camp_04 →
          </button>
        </div>
      </WorkspaceShell>
    );
  }

  const hasPlan = phase !== "brief" || useReference;
  const hasPublishing = effectiveConnectorCalls.length > 0;
  const hasQA = effectiveQaResults.length > 0;
  const hasVariants = effectiveVariants.length > 0;

  // Derived media plan data
  const channelMix = useMemo(() => {
    if (!effectiveStrategyRationale) return [];
    const text = effectiveStrategyRationale.decided.toLowerCase();
    const channels: { name: string; pct: number }[] = [];
    if (text.includes("meta")) channels.push({ name: "Meta", pct: 70 });
    if (text.includes("linkedin")) channels.push({ name: "LinkedIn", pct: 20 });
    if (text.includes("google")) channels.push({ name: "Google Ads", pct: 10 });
    if (channels.length === 0) channels.push({ name: "Meta", pct: 100 });
    const total = channels.reduce((s, c) => s + c.pct, 0);
    return channels.map((c) => ({ ...c, pct: Math.round((c.pct / total) * 100) }));
  }, [effectiveStrategyRationale]);

  // Publishing stats
  const pubStats = useMemo(() => {
    const byConnector: Record<string, { total: number; ok: number; pending: number; error: number }> = {};
    for (const c of effectiveConnectorCalls) {
      const key = c.connector.replace("_ads_api", "").replace("_", " ");
      if (!byConnector[key]) byConnector[key] = { total: 0, ok: 0, pending: 0, error: 0 };
      byConnector[key][c.status] += 1;
      byConnector[key].total += 1;
    }
    return byConnector;
  }, [effectiveConnectorCalls]);

  // QA stats
  const qaStats = useMemo(() => {
    if (!hasQA) return null;
    const passes = effectiveQaResults.filter((r) => r.judge.verdict === "pass").length;
    const fails = effectiveQaResults.filter((r) => r.judge.verdict === "fail").length;
    const blocked = effectiveQaResults.filter((r) => r.checks.some((c) => c.result === "fail")).length;
    return { total: effectiveQaResults.length, passes, fails, blocked, passRate: ((passes / effectiveQaResults.length) * 100).toFixed(0) };
  }, [effectiveQaResults, hasQA]);

  // UTM data
  const utmData = useMemo(() => {
    if (!hasVariants) return [];
    return effectiveVariants.slice(0, 12).map((v) => ({
      variantId: v.id,
      locale: v.locale,
      channel: v.channel,
      utm: `utm_source=${v.channel}&utm_medium=paid_social&utm_campaign=${effectiveBrief.id.replace("brief_", "")}&utm_content=${v.id}&utm_term=${v.locale}`,
      wellFormed: effectiveQaResults.find((q) => q.variant_id === v.id)?.checks.find((c) => c.rule.includes("utm"))?.result === "pass",
    }));
  }, [hasVariants, effectiveVariants, effectiveBrief.id, effectiveQaResults]);

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        {/* Header */}
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Media Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{effectiveBrief.campaign}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {effectiveBrief.product} · {effectiveBrief.market} · {effectiveBrief.locales.join(" / ")} · Budget: €{(effectiveBrief.budget_usd / 1000).toFixed(0)}k · Phase: {phase}
          </p>
        </header>

        {/* Previous Campaigns reference toggle */}
        {!hasMediaData && (
          <div className="rounded-sm border border-border bg-background px-4 py-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <strong className="text-foreground">Your campaign has no media data yet.</strong> View a previous campaign to see what media outputs look like.
            </span>
            <button
              onClick={() => setShowReference(!showReference)}
              className={`rounded-sm px-3 py-1 font-mono text-[10px] font-bold uppercase ${
                showReference
                  ? "bg-foreground text-white"
                  : "border border-border text-muted-foreground hover:bg-black/5"
              }`}
            >
              {showReference ? "← My Campaign" : "Previous Campaigns: camp_04 →"}
            </button>
          </div>
        )}
        {showReference && !hasMediaData && (
          <div className="rounded-sm border border-amber/20 bg-amber/5 px-4 py-3 text-xs">
            <span className="font-bold text-amber">Viewing reference:</span> camp_04 — Q4 Power-Tool Push, EU. {effectiveBrief.product} · {effectiveBrief.market} · {effectiveVariants.length} variants. This is a completed campaign shown as a template.
          </div>
        )}

        {/* ================================================================ */}
        {/* MEDIA PLAN OVERVIEW */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Media Plan Overview</h2>
          {hasPlan && effectiveStrategyRationale ? (
            <div className="space-y-4">
              {/* Metric cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Budget", value: `€${(effectiveBrief.budget_usd / 1000).toFixed(0)}k` },
                  { label: "Channels", value: channelMix.map(c => c.name).join(" + ") },
                  { label: "Audience", value: effectiveBrief.audience?.split("—")[0]?.trim() || effectiveBrief.audience || "All" },
                  { label: "Confidence", value: `${(effectiveStrategyRationale.confidence * 100).toFixed(0)}%` },
                ].map((m) => (
                  <div key={m.label} className="rounded-sm border border-border bg-white p-4">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-sm font-bold">{m.value}</p>
                  </div>
                ))}
              </div>
              {/* Channel breakdown */}
              <div className="rounded-sm border border-border bg-white">
                <div className="border-b border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">Channel Allocation</div>
                <div className="divide-y divide-border">
                  {channelMix.map((ch) => (
                    <div key={ch.name} className="flex items-center gap-4 px-4 py-3">
                      <span className="w-20 text-xs font-semibold">{ch.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                        <div className="h-full rounded-full bg-hilti transition-all" style={{ width: `${ch.pct}%` }} />
                      </div>
                      <span className="w-12 text-right font-mono text-[10px] font-bold">{ch.pct}%</span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        ≈ €{((effectiveBrief.budget_usd * ch.pct) / 100 / 1000).toFixed(0)}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Strategy rationale */}
              <div className="rounded-sm border border-border bg-white p-4">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Strategy Decision</p>
                <p className="text-sm">{effectiveStrategyRationale.decided}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {effectiveStrategyRationale.knowledge_cited.map((k) => (
                    <span key={k} className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
              <p className="text-xs text-muted-foreground">Media plan will be generated by the Strategy agent after brief intake. Advance to planning phase.</p>
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/* PUBLISHING STATUS */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Publishing Status</h2>
          {hasPublishing ? (
            <div className="space-y-4">
              <div className="rounded-sm border border-border bg-white">
                <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-3 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  <span>Platform</span>
                  <span>Total</span>
                  <span>Live</span>
                  <span>Pending</span>
                  <span>Errors</span>
                </div>
                {Object.entries(pubStats).map(([connector, stats]) => (
                  <div key={connector} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-3 items-center border-b border-border px-4 py-2 last:border-b-0 text-xs">
                    <span className="font-semibold capitalize">{connector}</span>
                    <span className="font-mono">{stats.total}</span>
                    <span className="font-mono text-emerald">{stats.ok}</span>
                    <span className="font-mono text-amber">{stats.pending}</span>
                    <span className="font-mono text-red">{stats.error}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-sm border border-border bg-background px-4 py-2 font-mono text-[9px] text-muted-foreground">
                ⚠ All connector calls are simulated in this prototype. Real publishing requires Meta Ads API, Google Ads API, LinkedIn Ads API connections (R2).
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
              <p className="text-sm font-semibold">No publishing activity yet</p>
              <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                Publishing happens after Rollout phase (post H3 gate). Variants are pushed to Meta/Google/LinkedIn via connector APIs. All connector calls are simulated in this prototype.
              </p>
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/* UTM TRACKING */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">UTM Tracking</h2>
          {utmData.length > 0 ? (
            <div className="rounded-sm border border-border bg-white">
              <div className="grid grid-cols-[1fr_60px_60px_60px_1fr] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>Variant</span>
                <span>Locale</span>
                <span>Channel</span>
                <span>Valid</span>
                <span>UTM String</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {utmData.map((u) => (
                  <div key={u.variantId} className="grid grid-cols-[1fr_60px_60px_60px_1fr] gap-2 items-center px-4 py-1.5 text-xs">
                    <span className="font-mono text-[10px] font-bold">{u.variantId}</span>
                    <span className="font-mono text-[10px]">{u.locale}</span>
                    <span className="font-mono text-[9px] uppercase">{u.channel}</span>
                    <span className={`font-mono text-[9px] font-bold ${u.wellFormed ? "text-emerald" : "text-red"}`}>
                      {u.wellFormed ? "✓ pass" : "✗ fail"}
                    </span>
                    <span className="font-mono text-[8px] text-muted-foreground truncate">{u.utm}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-4 py-2 font-mono text-[9px] text-muted-foreground">
                UTMs follow Hilti naming convention · Generated during Rollout phase (R10)
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
              <p className="text-xs text-muted-foreground">UTMs generated during Rollout phase (R10). Not yet available.</p>
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/* QA DASHBOARD */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">QA Dashboard</h2>
          {hasQA && qaStats ? (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Variants", value: qaStats.total },
                  { label: "Pass Rate", value: `${qaStats.passRate}%` },
                  { label: "Failed", value: qaStats.fails, warn: qaStats.fails > 0 },
                  { label: "Blocked", value: qaStats.blocked, warn: qaStats.blocked > 0 },
                ].map((m) => (
                  <div key={m.label} className={`rounded-sm border p-4 ${m.warn ? "border-hilti/30 bg-hilti/5" : "border-border bg-white"}`}>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                    <p className={`mt-1 text-sm font-bold ${m.warn ? "text-hilti" : ""}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Deterministic checks matrix */}
              <div className="rounded-sm border border-border bg-white">
                <div className="border-b border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Structural Checks (54-point pre-launch QA — subset shown)
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border font-mono text-[9px] uppercase text-muted-foreground">
                        <th className="px-4 py-2 text-left">Variant</th>
                        <th className="px-2 py-2 text-center">Char Count</th>
                        <th className="px-2 py-2 text-center">CTA</th>
                        <th className="px-2 py-2 text-center">Safety</th>
                        <th className="px-2 py-2 text-center">UTM</th>
                        <th className="px-3 py-2 text-center">Brand Judge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {effectiveQaResults.slice(0, 16).map((r) => (
                        <tr key={r.variant_id} className="hover:bg-black/[0.01]">
                          <td className="px-4 py-1.5 font-mono text-[10px] font-bold">{r.variant_id}</td>
                          {r.checks.map((c, i) => (
                            <td key={i} className="px-2 py-1.5 text-center">
                              <span className={`font-mono text-[9px] font-bold ${c.result === "pass" ? "text-emerald" : "text-red"}`}>
                                {c.result === "pass" ? "✓" : "✗"}
                              </span>
                            </td>
                          ))}
                          <td className="px-3 py-1.5 text-center">
                            <span className={`font-mono text-[9px] font-bold ${r.judge.verdict === "pass" ? "text-emerald" : "text-red"}`}>
                              {r.judge.verdict === "pass" ? `✓ ${(r.judge.score * 100).toFixed(0)}%` : `✗ ${r.judge.flagged_phrase?.slice(0, 15)}…`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Brand-voice judge results */}
              {effectiveQaResults.filter(r => r.judge.verdict === "fail").length > 0 && (
                <div className="rounded-sm border border-hilti/20 bg-hilti/5 p-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-hilti mb-2">
                    Brand-Voice Violations ({effectiveQaResults.filter(r => r.judge.verdict === "fail").length})
                  </p>
                  {effectiveQaResults.filter(r => r.judge.verdict === "fail").map((r) => (
                    <div key={r.variant_id} className="mt-2 rounded-sm border border-border bg-white p-3 text-xs">
                      <p><span className="font-bold">{r.variant_id}</span>: flagged "{r.judge.flagged_phrase}"</p>
                      <p className="text-muted-foreground mt-1">{r.judge.reason}</p>
                      <p className="text-emerald mt-1">Suggestion: {r.judge.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center">
              <p className="text-sm font-semibold">QA pending</p>
              <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                QA runs after content generation and localization. The QA agent runs 4 deterministic checks per variant (character count, CTA list, safety pictogram, UTM) plus an LLM brand-voice judge. Advance past Localization phase to trigger QA.
              </p>
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/* SYNC STATUS */}
        {/* ================================================================ */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sync Status</h2>
          <div className="rounded-sm border border-dashed border-border bg-background p-6">
            <p className="text-sm font-semibold">Live platform sync — pending platform integration</p>
            <p className="mt-2 text-xs text-muted-foreground max-w-2xl">
              Sync status compares what was planned (the approved CampaignPlan + variants) against what is live on the ad platforms. This requires real API connections to Meta Ads, Google Ads, and LinkedIn Ads. In production (R2), this view will show:
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                { label: "Budget Sync", detail: "Planned spend vs. actual spend per platform" },
                { label: "Creative Sync", detail: "Approved variants vs. live ad creatives" },
                { label: "Targeting Sync", detail: "Planned audiences vs. live targeting settings" },
                { label: "Naming Sync", detail: "Approved naming conventions vs. live ad names" },
              ].map((s) => (
                <div key={s.label} className="rounded-sm border border-border bg-white p-3">
                  <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{s.detail}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase text-muted-foreground">⏳ pending API connection</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
