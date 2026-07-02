import type {
  Brief,
  CampaignPlan,
  AdVariant,
  LocaleDiffEntry,
  QAResult,
  ConnectorCall,
  SkillProposal,
  GateDecision,
  DecisionRationale,
} from "@/types";

interface ExportState {
  brief: Brief;
  plan: CampaignPlan;
  variants: AdVariant[];
  localeDiffs: LocaleDiffEntry[];
  qaResults: QAResult[];
  connectorCalls: ConnectorCall[];
  proposal: SkillProposal;
  gateDecisions: Record<string, GateDecision>;
  rationaleStream: DecisionRationale[];
}

export function exportCampaign(state: ExportState): string {
  const sections: Record<string, unknown> = {
    "01-brief": {
      campaign: state.brief.campaign,
      product: state.brief.product,
      market: state.brief.market,
      audience: state.brief.audience,
      channels: state.brief.channels,
      locales: state.brief.locales,
      objective: state.brief.objective,
      budget_usd: state.brief.budget_usd,
      assumptions: state.brief.assumptions,
    },
    "02-plan": {
      plan_id: state.plan.id,
      brief_id: state.plan.briefId,
      node_count: state.plan.nodes.length,
      nodes: state.plan.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        kind: n.kind,
        gate: n.gate,
        agent: n.agent,
        depends_on: n.depends_on,
      })),
      strategy_rationale: state.plan.rationale,
    },
    "03-content": state.variants.map((v) => ({
      id: v.id,
      channel: v.channel,
      segment: v.segment,
      locale: v.locale,
      headline: v.headline,
      primary_text: v.primary_text,
      cta: v.cta,
      character_counts: v.characterCounts,
      utm_params: v.utmParams,
    })),
    "04-localization": state.localeDiffs.map((d) => ({
      locale: d.locale,
      base_phrase: d.base_phrase,
      localized_phrase: d.localized_phrase,
      reason: d.reason,
    })),
    "05-qa": {
      total_variants: state.qaResults.length,
      total_checks: state.qaResults.reduce((sum, r) => sum + r.checks.length, 0),
      passing: state.qaResults.filter((r) => r.judge.verdict === "pass").length,
      results: state.qaResults.map((r) => ({
        variant_id: r.variant_id,
        deterministic_checks: r.checks,
        brand_judge: {
          score: r.judge.score,
          accuracy: r.judge.accuracy,
          verdict: r.judge.verdict,
          flagged_phrase: r.judge.flagged_phrase,
          reason: r.judge.reason,
          suggestion: r.judge.suggestion,
        },
      })),
    },
    "06-rollout": state.connectorCalls.map((c) => ({
      connector: c.connector,
      action: c.action,
      target: c.target,
      status: c.status,
      variant_id: c.variant_id,
    })),
    "07-insights": state.proposal
      ? {
          name: state.proposal.name,
          type: state.proposal.type,
          scope: state.proposal.scope,
          pattern: state.proposal.pattern,
          body: state.proposal.body,
          confidence: state.proposal.confidence,
          impact: state.proposal.impact,
          status: state.proposal.status,
        }
      : null,
    "gate-decisions": Object.entries(state.gateDecisions).map(([gate, d]) => ({
      gate,
      verdict: d.verdict,
      reviewer: d.reviewer,
      note: d.note,
      decided_at: d.decided_at,
    })),
    "agent-rationales": state.rationaleStream.map((r) => ({
      agent: r.agent,
      decided: r.decided,
      why: r.why,
      confidence: r.confidence,
      knowledge_cited: r.knowledge_cited,
      timestamp: r.timestamp,
    })),
  };

  return JSON.stringify(sections, null, 2);
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** CSV export: one row per variant + QA summary */
export function exportCampaignCSV(state: ExportState): string {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

  // Variants sheet
  const headers = ["id", "channel", "segment", "locale", "headline", "primary_text", "cta", "image_ref"];
  const rows = [headers.join(",")];

  for (const v of state.variants) {
    rows.push([
      escape(v.id),
      escape(v.channel),
      escape(v.segment),
      escape(v.locale),
      escape(v.headline),
      escape(v.primary_text),
      escape(v.cta),
      escape(v.imageRef || ""),
    ].join(","));
  }

  rows.push(""); // blank separator

  // QA summary
  rows.push("QA Results");
  rows.push(["variant_id", "verdict", "score", "flagged_phrase", "reason"].join(","));
  for (const q of state.qaResults) {
    rows.push([
      escape(q.variant_id),
      escape(q.judge.verdict),
      q.judge.score,
      escape(q.judge.flagged_phrase || ""),
      escape(q.judge.reason || ""),
    ].join(","));
  }

  rows.push(""); // blank separator

  // Connector calls
  rows.push("Connector Calls");
  rows.push(["connector", "action", "target", "status", "variant_id"].join(","));
  for (const c of state.connectorCalls) {
    rows.push([
      escape(c.connector),
      escape(c.action),
      escape(c.target),
      escape(c.status),
      escape(c.variant_id),
    ].join(","));
  }

  return rows.join("\n");
}

export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
