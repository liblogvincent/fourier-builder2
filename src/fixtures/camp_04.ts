import type {
  Brief,
  CampaignPlan,
  AdVariant,
  LocaleDiffEntry,
  QAResult,
  ConnectorCall,
  SkillProposal,
  RegistryArtifact,
  EvalPoint,
  DecisionRationale,
} from "@/types";

export const brief: Brief = {
  id: "brief_camp_04",
  campaign: "camp_04 — Q4 Power-Tool Push, EU",
  product: "SIW 6AT-A22 cordless impact wrench",
  market: "DACH",
  audience: "Contractor segment — site foremen, finishing crews",
  channels: ["meta"],
  locales: ["de-DE", "de-AT", "de-CH", "fr-CH"],
  objective:
    "Drive consideration + dealer-locator clicks for SIW 6AT-A22 among DACH contractors.",
  budget_usd: 142500,
  assumptions: [
    "Hero channel is Meta paid-social (content is the lever, not the media plan)",
    "Existing Hilti pixel + dealer-locator deeplinks already live",
    "Brand-voice guidelines v4.2 are in force; 'revolutionary' is on the blacklist",
  ],
};

export const plan: CampaignPlan = {
  id: "plan_camp_04",
  briefId: brief.id,
  rationale: {
    id: "r_plan",
    agent: "strategy",
    decided:
      "Single-channel Meta DAG, 4 base variants × 4 locales, QA-gated + EU compliance checkpoint.",
    why: [
      "Brief lists Meta as the hero channel; multi-channel split would dilute learning",
      "4 base variants gives statistical power for first-pass creative learning",
      "Locale-fanout keeps DACH coverage without burning concepting cycles",
      "DACH markets require EU compliance review — added H-legal gate for legal sign-off on technical claims",
    ],
    alternatives: [
      {
        option: "Add LinkedIn lookalike",
        rejected_because: "Not in brief budget envelope, no signal yet",
      },
      {
        option: "8 variants × 4 locales",
        rejected_because:
          "Doubles QA load without proven concept lift — defer to round 2",
      },
      {
        option: "Skip extra compliance gate",
        rejected_because:
          "EU advertising law requires legal review of technical claims in DACH markets",
      },
    ],
    confidence: 0.92,
    knowledge_cited: [
      "Hilti_Brand_Voice_v4.2",
      "DACH_Meta_2025_Q3_benchmarks",
      "EU_Advertising_Compliance_2024",
    ],
    timestamp: "14:02:11",
    status: "decided",
  },
  nodes: [
    { id: "n_brief", label: "Brief intake", kind: "tool", status: "done", depends_on: [] },
    { id: "n_plan", label: "Strategy plan", kind: "agent", agent: "strategy", status: "done", depends_on: ["n_brief"] },
    { id: "n_h1", label: "H1: Plan approval", kind: "gate", gate: "H1", status: "pending", depends_on: ["n_plan"] },
    { id: "n_content", label: "Content generation", kind: "agent", agent: "content", status: "pending", depends_on: ["n_h1"] },
    { id: "n_h_creative", label: "H-C: Creative approval", kind: "gate", gate: "H-C", status: "pending", depends_on: ["n_content"] },
    { id: "n_locale", label: "Localization", kind: "agent", agent: "localization", status: "pending", depends_on: ["n_h_creative"] },
    { id: "n_qa", label: "QA + brand judge", kind: "agent", agent: "qa", status: "pending", depends_on: ["n_locale"] },
    { id: "n_h2", label: "H2: QA approval", kind: "gate", gate: "H2", status: "pending", depends_on: ["n_qa"] },
    { id: "n_h_legal", label: "H-legal: EU compliance", kind: "gate", gate: "H-legal", status: "pending", depends_on: ["n_h2"] },
    { id: "n_rollout", label: "Roll-out", kind: "agent", agent: "rollout", status: "pending", depends_on: ["n_h_legal"] },
    { id: "n_h3", label: "H3: Publish", kind: "gate", gate: "H3", status: "pending", depends_on: ["n_rollout"] },
    { id: "n_live", label: "Live (7d)", kind: "tool", status: "pending", depends_on: ["n_h3"] },
    { id: "n_insights", label: "Insights", kind: "agent", agent: "insights", status: "pending", depends_on: ["n_live"] },
    { id: "n_h4", label: "H4: Promote skill", kind: "gate", gate: "H4", status: "pending", depends_on: ["n_insights"] },
  ],
};

// 4 base variants — one in de-DE deliberately contains "revolutionäre"
const baseHeadlines = [
  "Mehr Drehmoment. Weniger Vibration.",
  "Eine Akku-Plattform. Jede Baustelle.",
  "Präzision auf jedem Bolzen.",
  "Der Schlagschrauber, der mitdenkt.",
];
const baseBodies: Record<string, string> = {
  "de-DE":
    "Die {ADJ} SIW 6AT-A22 Schlagschrauber-Technologie für Profis. Maximale Sicherheit auf jeder Baustelle.",
  "de-AT":
    "Die {ADJ} SIW 6AT-A22 für den Profi am Bau. Drehmomentkontrolle, die hält.",
  "de-CH":
    "Die {ADJ} SIW 6AT-A22 für den Profi auf der Baustelle. Drehmomentkontrolle, die hält.",
  "fr-CH":
    "La technologie {ADJ} SIW 6AT-A22 pour les pros du chantier. Un couple maîtrisé.",
};
const ctas: Record<string, string> = {
  "de-DE": "Händler finden",
  "de-AT": "Händler finden",
  "de-CH": "Händler finden",
  "fr-CH": "Trouver un revendeur",
};

export const variants: AdVariant[] = (() => {
  const out: AdVariant[] = [];
  const locales = ["de-DE", "de-AT", "de-CH", "fr-CH"];
  for (let i = 0; i < 4; i++) {
    for (const locale of locales) {
      const isFault = i === 0 && locale === "de-DE";
      const adj = isFault
        ? "revolutionäre"
        : locale.startsWith("fr")
          ? "performante"
          : "leistungsstarke";
      out.push({
        id: `v_${i + 1}_${locale}`,
        channel: "meta",
        segment: "contractor",
        locale,
        headline: baseHeadlines[i],
        primary_text: baseBodies[locale].replace("{ADJ}", adj),
        cta: ctas[locale],
        imageRef: "siw-6at-hero",
        characterCounts: {
          headline: baseHeadlines[i].length,
          body: baseBodies[locale].replace("{ADJ}", adj).length,
          cta: ctas[locale].length,
        },
        utmParams: {
          utm_source: "meta",
          utm_medium: "paid_social",
          utm_campaign: `siw6at_dach_q4_2026`,
          utm_content: `v_${i + 1}_${locale}`,
          utm_term: "hilti_akku",
        },
      });
    }
  }
  return out;
})();

export const localeDiffs: LocaleDiffEntry[] = [
  {
    locale: "de-AT",
    base_phrase: "Baustelle",
    localized_phrase: "Baustelle",
    reason: "Identical lexicon; CTA unchanged.",
  },
  {
    locale: "de-CH",
    base_phrase: "Maximale Sicherheit",
    localized_phrase: "Drehmomentkontrolle, die hält",
    reason: "CH market responds to durability over safety claims (heritage signal).",
  },
  {
    locale: "fr-CH",
    base_phrase: "Schlagschrauber-Technologie",
    localized_phrase: "technologie SIW 6AT-A22",
    reason: "Full localization to French; product code kept for SKU continuity.",
  },
];

export const qaResults: QAResult[] = variants.map((v) => {
  const isFault = v.id === "v_1_de-DE";
  return {
    variant_id: v.id,
    checks: [
      { rule: "char_count.primary_text <= 125", result: "pass" },
      { rule: "cta.in_approved_list", result: "pass" },
      { rule: "image.has_safety_pictogram", result: "pass" },
      { rule: "utm.well_formed", result: "pass" },
      { rule: "Landing page URL resolves", result: "pass", detail: `https://hilti.com/${v.locale}/store/siw-6at-a22` },
      { rule: "UTM params present", result: "pass", detail: `utm_source=meta&utm_medium=paid_social&utm_campaign=siw6at_dach_q4_2026&utm_content=${v.id}` },
    ],
    judge: isFault
      ? {
          score: 0.42,
          accuracy: 0.96,
          verdict: "fail",
          flagged_phrase: "revolutionäre",
          reason:
            "Section 4.2 of Hilti tone-of-voice guidelines prohibits hype-claims for iterative hardware updates.",
          suggestion: "leistungsstarke",
        }
      : { score: 0.94, accuracy: 0.96, verdict: "pass" },
  };
});

export const connectorCalls: ConnectorCall[] = variants.map((v) => ({
  connector: "meta_ads_api",
  action: "publish",
  target: `adset/dach_contractor/${v.locale}`,
  status: "ok",
  variant_id: v.id,
}));

export const skillProposal: SkillProposal = {
  id: "sp_no_hype_iterative",
  name: "No hype-adjectives on iterative hardware updates",
  type: "Rule",
  scope: "Global",
  pattern: "/(revolution|revolution(ary|äre|naire)|game[\\s-]?chang(er|ing))/i",
  body: "Reject hype adjectives in primary text for any campaign whose product is an iterative update of an existing tool line. Suggest neutral substitutes ('leistungsstark', 'zuverlässig', 'performante').",
  derived_from: "camp_04 H2 brand-voice fault",
  confidence: 0.91,
  impact: { hours_saved: 4.5, quality_delta: 0.08 },
  status: "Proposed",
};

export const registry: RegistryArtifact[] = [
  {
    id: "r_bv_42",
    name: "Hilti Brand Voice v4.2",
    type: "Guideline",
    scope: "Global",
    version: 42,
    status: "Approved",
    body: "Precision, durability, partnership. No hyperbole. No fear-based claims.",
    provenance: "human_authored",
  },
  {
    id: "r_cta_dach",
    name: "DACH approved CTAs",
    type: "Rule",
    scope: "Market",
    version: 3,
    status: "Approved",
    body: "Allowed: 'Händler finden', 'Mehr erfahren', 'Demo buchen'.",
    provenance: "human_authored",
  },
  {
    id: "r_meta_125",
    name: "Meta primary text ≤ 125 chars",
    type: "Rule",
    scope: "Channel",
    version: 1,
    status: "Approved",
    body: "Hard cap of 125 characters on Meta primary_text for above-the-fold render.",
    provenance: "human_authored",
  },
  {
    id: "r_loc_ch_durability",
    name: "CH market: lead with durability",
    type: "Playbook",
    scope: "Market",
    version: 2,
    status: "Approved",
    body: "Swiss contractor segment over-indexes on durability/heritage cues vs. safety claims.",
    provenance: "ai_promoted",
  },
];

export const evalSeries: EvalPoint[] = [
  { campaignNumber: 1, campaign: "camp_01", hoursReturned: 6, costUsd: 1820, qualityAvg: 0.78, skillsReused: 0 },
  { campaignNumber: 2, campaign: "camp_02", hoursReturned: 14, costUsd: 1610, qualityAvg: 0.83, skillsReused: 3 },
  { campaignNumber: 3, campaign: "camp_03", hoursReturned: 22, costUsd: 1340, qualityAvg: 0.88, skillsReused: 7 },
  { campaignNumber: 4, campaign: "camp_04", hoursReturned: 38, costUsd: 1180, qualityAvg: 0.92, skillsReused: 12 },
];

// Pre-canned rationale entries the store emits as the agent "works"
export const rationaleScript: Record<string, DecisionRationale> = {
  plan: plan.rationale,
  h_legal: {
    id: "r_h_legal",
    agent: "rollout",
    decided:
      "EU compliance check complete — all technical claims verified against DACH advertising standards.",
    why: [
      "Torque claims ('Drehmoment', 'Drehmomentkontrolle') validated against product spec sheet",
      "No medical/safety claims that require CE marking disclosure",
      "CHF pricing format compliant with Swiss consumer protection law",
    ],
    alternatives: [],
    confidence: 0.98,
    knowledge_cited: [
      "EU_Advertising_Compliance_2024",
      "DACH_Technical_Claims_Playbook",
    ],
    timestamp: "14:09:30",
    status: "decided",
  },
  h_creative: {
    id: "r_h_creative",
    agent: "content",
    decided:
      "Creative review complete — 4 ad concepts approved for localization across DACH markets.",
    why: [
      "Headlines span torque, platform, precision, and smart-tool angles — covers full buyer value spectrum",
      "CTAs aligned to DACH approved list ('Händler finden' for de-*, 'Trouver un revendeur' for fr-CH)",
      "Visual concept uses jobsite authenticity per Brand Voice v4.2",
    ],
    alternatives: [
      {
        option: "Add a 5th 'price/value' concept",
        rejected_because: "Hilti Brand Voice prohibits price-led messaging in paid-social. Deploy via email channel instead.",
      },
    ],
    confidence: 0.94,
    knowledge_cited: ["Hilti_Brand_Voice_v4.2", "DACH_CTA_Approved_List_v3"],
    timestamp: "14:05:45",
    status: "decided",
  },
  content: {
    id: "r_content",
    agent: "content",
    decided: "Generated 4 base concepts emphasizing torque-control + dust-compliance.",
    why: [
      "Brief calls out contractor pain on finishing-bolt precision",
      "DACH segment indexes high on durability cues vs. lifestyle",
    ],
    alternatives: [
      {
        option: "Lifestyle 'pride of craft' angle",
        rejected_because: "Lower CTR in segment benchmarks (DACH_Meta_2025_Q3)",
      },
    ],
    confidence: 0.87,
    knowledge_cited: ["Hilti_Brand_Voice_v4.2", "Contractor_Pain_Atlas_2025"],
    timestamp: "14:04:30",
    status: "decided",
  },
  localization: {
    id: "r_locale",
    agent: "localization",
    decided: "Fanned 4 concepts × 4 locales; CH swapped 'safety' → 'durability' lede.",
    why: [
      "CH contractor segment over-indexes on durability/heritage cues",
      "fr-CH requires full lexical translation; SKU codes preserved",
    ],
    alternatives: [
      {
        option: "Single de-DE variant for all DACH",
        rejected_because: "Loses AT/CH dialect signal and depresses relevance score",
      },
    ],
    confidence: 0.9,
    knowledge_cited: ["CH_Market_Heritage_Playbook_v2"],
    timestamp: "14:06:12",
    status: "decided",
  },
  qa: {
    id: "r_qa",
    agent: "qa",
    decided:
      "Flagged variant v_1_de-DE: brand-voice violation on 'revolutionäre'. Auto-fix proposed: 'leistungsstarke'.",
    why: [
      "Hyperbolic adjective detected in primary text",
      "Mismatch with Hilti Brand Voice v4.2 §4.2 (no hype-claims on iterative hardware)",
      "15 / 16 variants pass deterministic + judge checks (94% first-pass)",
    ],
    alternatives: [
      {
        option: "Pass with reviewer note",
        rejected_because: "Brand-voice rule is hard-fail per governance config",
      },
      {
        option: "Suggest 'innovative' instead",
        rejected_because: "Also on hype-adjective blacklist",
      },
    ],
    confidence: 0.96,
    knowledge_cited: ["Hilti_Brand_Voice_v4.2", "DACH_Adjective_Blacklist"],
    timestamp: "14:08:45",
    status: "blocked",
  },
  rollout: {
    id: "r_rollout",
    agent: "rollout",
    decided: "Published 16 variants via meta_ads_api to 4 DACH adsets.",
    why: [
      "All QA gates green after auto-fix",
      "Deterministic connector — no creative drift at publish",
    ],
    alternatives: [],
    confidence: 0.99,
    knowledge_cited: ["meta_ads_api_v18"],
    timestamp: "14:11:02",
    status: "decided",
  },
  insights: {
    id: "r_insights",
    agent: "insights",
    decided:
      "Proposing new global Rule: reject hype-adjectives on iterative hardware updates.",
    why: [
      "Same fault would have caught 3 prior campaigns post-hoc",
      "Estimated ~4.5h saved per future DACH launch",
    ],
    alternatives: [
      {
        option: "Keep as channel-scope rule",
        rejected_because: "Pattern appears across all paid-social channels in eval set",
      },
    ],
    confidence: 0.91,
    knowledge_cited: ["camp_01..camp_04 QA history"],
    timestamp: "14:14:20",
    status: "decided",
  },
};
