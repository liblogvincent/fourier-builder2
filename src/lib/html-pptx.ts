import type { Brief, CampaignPlan, AdVariant } from "@/types";

interface SlideState {
  brief: Brief;
  plan: CampaignPlan;
  variants: AdVariant[];
  variantCount: number;
  localeCount: number;
}

const SLIDE_STYLE = `
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f0f0f0; color: #1a1a1a; }
  .slide {
    width: 960px; min-height: 540px; margin: 40px auto;
    background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    border-radius: 4px; padding: 60px 80px; page-break-after: always;
    display: flex; flex-direction: column; justify-content: center;
  }
  .slide.cover { background: #D2051E; color: white; }
  .slide.cover h1 { font-size: 36px; font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
  .slide.cover .subtitle { font-size: 18px; opacity: 0.9; }
  .slide h2 { font-size: 28px; font-weight: 700; margin-bottom: 24px; color: #D2051E; }
  .slide.cover h2 { color: white; }
  .metric-row { display: flex; gap: 32px; margin-bottom: 24px; }
  .metric { flex: 1; }
  .metric .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 4px; }
  .metric .value { font-size: 24px; font-weight: 700; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: #f8f8f8; border-radius: 4px; padding: 20px; }
  .card h3 { font-size: 14px; font-weight: 700; margin-bottom: 8px; color: #D2051E; }
  .card p, .card li { font-size: 13px; line-height: 1.5; color: #444; }
  .tag { display:inline-block; background:#D2051E; color:white; font-size:10px; font-weight:700; padding:2px 8px; border-radius:2px; margin-right:4px; text-transform:uppercase; }
  .divider { border-top: 2px solid #D2051E; width: 40px; margin: 16px 0 24px; }
  ul { padding-left: 18px; }
  li { margin-bottom: 4px; }
  .footer { margin-top: auto; padding-top: 24px; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
  .gate-badge { display:inline-block; padding: 4px 10px; border: 2px solid #D2051E; color:#D2051E; font-weight:700; font-size:11px; border-radius:2px; margin-right:6px; }
  @media print {
    body { background: white; }
    .slide { box-shadow: none; margin: 0; border-radius: 0; }
  }
</style>`;

function coverSlide(s: SlideState): string {
  return `<div class="slide cover">
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
    <div style="font-size:14px;font-weight:600;letter-spacing:0.1em;margin-bottom:24px;">CAMPAIGN PLAN · H1 APPROVAL</div>
    <h1>${esc(s.brief.campaign)}</h1>
    <div class="subtitle" style="margin-top:12px;">${esc(s.brief.product)} · ${esc(s.brief.market)} · ${s.brief.locales.map(esc).join(" / ")}</div>
    <div class="divider" style="border-color:white;margin-top:32px;"></div>
    <div class="metric-row" style="margin-top:16px;">
      <div class="metric"><div class="label" style="color:rgba(255,255,255,0.7);">Budget</div><div class="value">€${(s.brief.budget_usd / 1000).toFixed(0)}k</div></div>
      <div class="metric"><div class="label" style="color:rgba(255,255,255,0.7);">Variants</div><div class="value">${s.variantCount} × ${s.localeCount} locales</div></div>
      <div class="metric"><div class="label" style="color:rgba(255,255,255,0.7);">Channels</div><div class="value">${s.brief.channels.map(esc).join(", ")}</div></div>
    </div>
  </div>
  <div class="footer" style="color:rgba(255,255,255,0.6);">Fourier Agentic Engine · Generated ${new Date().toISOString().slice(0,10)} · Draft for Approval</div>
</div>`;
}

function strategySlide(s: SlideState): string {
  return `<div class="slide">
  <h2>Strategy Rationale</h2>
  <div class="divider"></div>
  <p style="font-size:16px;line-height:1.5;margin-bottom:24px;">${esc(s.plan.rationale.decided)}</p>
  <div class="grid-2">
    <div class="card"><h3>Why</h3><ul>${s.plan.rationale.why.map(w => `<li>${esc(w)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Alternatives Considered</h3><ul>${s.plan.rationale.alternatives.map(a => `<li><strong>${esc(a.option)}</strong><br/><span style="color:#999;">↳ ${esc(a.rejected_because)}</span></li>`).join("")}</ul></div>
  </div>
  <div style="margin-top:20px;display:flex;gap:16px;align-items:center;">
    <span class="tag">Confidence ${(s.plan.rationale.confidence * 100).toFixed(0)}%</span>
    ${s.plan.rationale.knowledge_cited.map(k => `<span class="tag" style="background:#666;">${esc(k)}</span>`).join(" ")}
  </div>
  <div class="footer"><span>Fourier Agentic Engine</span><span>Slide 2 / 5</span></div>
</div>`;
}

function audienceSlide(s: SlideState): string {
  return `<div class="slide">
  <h2>Audience &amp; Targeting</h2>
  <div class="divider"></div>
  <div class="grid-2">
    <div class="card"><h3>Market</h3><p style="font-size:20px;font-weight:700;">${esc(s.brief.market)}</p></div>
    <div class="card"><h3>Primary Audience</h3><p>${esc(s.brief.audience)}</p></div>
    <div class="card"><h3>Objective</h3><p>${esc(s.brief.objective)}</p></div>
    <div class="card"><h3>Budget</h3><p style="font-size:20px;font-weight:700;">€${(s.brief.budget_usd).toLocaleString()}</p></div>
  </div>
  <div class="card" style="margin-top:20px;"><h3>Channel Mix</h3><p>${s.brief.channels.map(esc).join(" · ")} — ${s.variantCount} creative concepts × ${s.localeCount} locales = ${s.variantCount * s.localeCount} total variants</p></div>
  <div class="footer"><span>Fourier Agentic Engine</span><span>Slide 3 / 5</span></div>
</div>`;
}

function gateSlide(s: SlideState): string {
  const agentSteps = s.plan.nodes.filter(n => n.kind === "agent");
  const gateSteps = s.plan.nodes.filter(n => n.kind === "gate");
  return `<div class="slide">
  <h2>Workflow &amp; Gates</h2>
  <div class="divider"></div>
  <div class="grid-2">
    <div class="card"><h3>Pipeline</h3><p style="font-family:monospace;font-size:12px;">Brief → Strategy → <span style="color:#D2051E;font-weight:700;">H1</span> → Content → Localization → QA → <span style="color:#D2051E;font-weight:700;">H2</span> → <span style="color:#D2051E;font-weight:700;">H-legal</span> → Rollout → <span style="color:#D2051E;font-weight:700;">H3</span> → Live → Insights → <span style="color:#D2051E;font-weight:700;">H4</span></p></div>
    <div class="card"><h3>Human Gates (${gateSteps.length})</h3>${gateSteps.map(g => `<span class="gate-badge">${esc(g.gate || "")}</span> ${esc(g.label)}<br/>`).join("")}</div>
  </div>
  <div style="margin-top:20px;"><span class="tag">Open gate namespace</span><span class="tag" style="background:#0a0;">Agent-proposed: H-legal</span></div>
  <div class="footer"><span>Fourier Agentic Engine</span><span>Slide 4 / 5</span></div>
</div>`;
}

function approvalSlide(s: SlideState): string {
  return `<div class="slide cover" style="background:#1a1a1a;">
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
    <div style="font-size:14px;font-weight:600;letter-spacing:0.1em;margin-bottom:24px;color:rgba(255,255,255,0.6);">GATE H1 · PLAN APPROVAL</div>
    <h1 style="font-size:32px;">Approve Campaign Plan?</h1>
    <p style="margin-top:16px;font-size:16px;color:rgba(255,255,255,0.7);max-width:500px;">Strategy agent has generated the plan. Review the strategy, audience, and workflow above, then approve, request changes, or reject.</p>
    <div style="margin-top:40px;display:flex;gap:16px;">
      <div style="padding:12px 32px;background:#16a34a;color:white;font-weight:700;border-radius:4px;">✓ Approve &amp; Sign</div>
      <div style="padding:12px 32px;background:#f59e0b;color:white;font-weight:700;border-radius:4px;">↻ Request Changes</div>
      <div style="padding:12px 32px;background:#dc2626;color:white;font-weight:700;border-radius:4px;">✗ Reject</div>
    </div>
    <p style="margin-top:24px;font-size:12px;color:rgba(255,255,255,0.4);">Reviewer: Vincent Lee · Signature: VL</p>
  </div>
  <div class="footer" style="color:rgba(255,255,255,0.4);">Fourier Agentic Engine · Slide 5 / 5</div>
</div>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateHtmlPptx(state: SlideState): string {
  const slides = [
    coverSlide(state),
    strategySlide(state),
    audienceSlide(state),
    gateSlide(state),
    approvalSlide(state),
  ];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Campaign Plan — ${esc(state.brief.campaign)}</title>${SLIDE_STYLE}</head><body>${slides.join("\n")}</body></html>`;
}

export function openPptxInNewTab(state: SlideState): void {
  const html = generateHtmlPptx(state);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  URL.revokeObjectURL(url);
}
