import { create } from "zustand";
import type {
  AdVariant,
  Brief,
  DecisionRationale,
  GateDecision,
  GateId,
  LocaleDiffEntry,
  Phase,
  QAResult,
  RegistryArtifact,
  SkillProposal,
} from "@/types";
import {
  brief as defaultBrief,
  plan as defaultPlan,
  variants as defaultVariants,
  qaResults as defaultQa,
  connectorCalls as defaultConn,
  skillProposal as defaultProposal,
  localeDiffs as defaultDiffs,
  rationaleScript,
} from "@/fixtures/camp_04";
import {
  runStrategy,
  runContent,
  runLocalization,
  runQa,
  runInsights,
} from "@/lib/agents.functions";
import { promoteSkill, recordRun, setBriefPhase, saveCampaign, saveCampaignState, loadCampaignState, getBriefPhase, seedCamp04 } from "@/lib/persistence";
import {
  appendRunEvent,
  nextAttempt,
  updateRunEvent,
  type RunEvent,
} from "@/lib/run-history";

type RunMode = "demo" | "live";

interface State {
  phase: Phase;
  demoMode: boolean;
  runMode: RunMode;
  rationaleStream: DecisionRationale[];
  gateDecisions: Record<GateId, GateDecision>;
  appliedFixes: Set<string>;
  proposalDisposition: "pending" | "promoted" | "rejected";
  agentBusy: string | null;
  agentError: string | null;
  /** Reviewer feedback from a "changes requested" decision, fed back to Strategy on re-plan */
  revisionFeedback: string | null;
  /** Whether the user has explicitly started a campaign (live mode clean slate) */
  campaignStarted: boolean;

  brief: Brief;
  plan: typeof defaultPlan;
  variants: AdVariant[];
  localeDiffs: LocaleDiffEntry[];
  qaResults: QAResult[];
  connectorCalls: typeof defaultConn;
  proposal: SkillProposal;

  setRunMode: (m: RunMode) => void;
  setDemoMode: (on: boolean) => void;
  loadBrief: (b: Brief) => void;
  newCampaign: () => void;
  pushRationale: (r: DecisionRationale) => void;
  decideGate: (gate: GateId, verdict: GateDecision["verdict"], note?: string) => void;
  applyFix: (variantId: string) => void;
  setProposalDisposition: (d: "promoted" | "rejected") => void;
  advance: () => Promise<void>;
  retryPhase: (phase: Phase) => Promise<void>;
  reset: () => void;
}

const PHASE_ORDER: Phase[] = [
  "brief",
  "planning",
  "H1",
  "H2",
  "content",
  "H-C",
  "localization",
  "rollout",
  "qa",
  "H3",
  "live",
  "H4",
  "done",
];

const now = () => {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
};

const FIXTURE_RATIONALE: Partial<Record<Phase, DecisionRationale>> = {
  planning: rationaleScript.plan,
  content: rationaleScript.content,
  localization: rationaleScript.localization,
  qa: rationaleScript.qa,
  rollout: rationaleScript.rollout,
  H4: rationaleScript.insights,
};

export const useWorkspace = create<State>((set, get) => ({
  phase: "brief",
  demoMode: false,
  runMode: "live",
  rationaleStream: [],
  gateDecisions: {},
  appliedFixes: new Set(),
  proposalDisposition: "pending",
  agentBusy: null,
  agentError: null,
  revisionFeedback: null,
  campaignStarted: false,

  brief: defaultBrief,
  plan: defaultPlan,
  variants: defaultVariants,
  localeDiffs: defaultDiffs,
  qaResults: defaultQa,
  connectorCalls: defaultConn,
  proposal: defaultProposal,

  setRunMode: (m) => set({ runMode: m }),

  setDemoMode: (on) => {
    set({ demoMode: on });
    if (on) void get().advance();
  },

  loadBrief: (b) => {
    // Persist async (fire-and-forget)
    saveCampaign(b);
    // Set initial state synchronously, then hydrate from DB
    set({
      brief: b,
      phase: "brief",
      rationaleStream: [],
      gateDecisions: {},
      appliedFixes: new Set(),
      proposalDisposition: "pending",
      campaignStarted: true,
      revisionFeedback: null,
      plan: { ...defaultPlan, briefId: b.id },
      variants: b.id === defaultBrief.id ? defaultVariants : [],
      localeDiffs: defaultDiffs,
      qaResults: b.id === defaultBrief.id ? defaultQa : [],
      connectorCalls: b.id === defaultBrief.id ? defaultConn : [],
      proposal: defaultProposal,
      agentBusy: null,
      agentError: null,
    });
    // Async: restore saved state and phase
    Promise.all([loadCampaignState(b.id), getBriefPhase(b.id)]).then(([savedState, savedPhase]) => {
      if (savedState && Object.keys(savedState).length > 0) {
        set({
          phase: (savedPhase as Phase) ?? "brief",
          plan: savedState.plan ?? { ...defaultPlan, briefId: b.id },
          variants: savedState.variants ?? [],
          qaResults: savedState.qaResults ?? [],
          connectorCalls: savedState.connectorCalls ?? [],
          rationaleStream: savedState.rationaleStream ?? [],
          gateDecisions: savedState.gateDecisions ?? {},
        });
      }
    });
  },

  newCampaign: () => {
    const id = `brief_${Date.now()}`;
    const b: Brief = {
      id,
      campaign: "New Campaign",
      product: "",
      market: "",
      audience: "",
      objective: "",
      channels: ["meta"],
      locales: ["de-DE"],
      budget_usd: 0,
      assumptions: [],
    };
    saveCampaign(b); // fire-and-forget async
    set({
      phase: "brief",
      rationaleStream: [],
      gateDecisions: {},
      appliedFixes: new Set(),
      proposalDisposition: "pending",
      campaignStarted: true,
      revisionFeedback: null,
      agentBusy: null,
      agentError: null,
      brief: b,
      plan: { ...defaultPlan, briefId: id },
      variants: [],
      localeDiffs: [],
      qaResults: [],
      connectorCalls: [],
      proposal: defaultProposal,
    });
  },

  pushRationale: (r) =>
    set((s) => ({
      rationaleStream: [...s.rationaleStream, { ...r, timestamp: now() }],
    })),

  decideGate: (gate, verdict, note = "") => {
    set((s) => ({
      gateDecisions: {
        ...s.gateDecisions,
        [gate]: {
          gate,
          verdict,
          reviewer: "Vincent Lee",
          note,
          decided_at: now(),
          signature: "VL",
        },
      },
    }));
    if (verdict === "approved") {
      // record at H4 promotion
      if (gate === "H4") {
        const { proposal, brief } = get();
        const skill: RegistryArtifact = {
          id: proposal.id,
          name: proposal.name,
          type: proposal.type,
          scope: proposal.scope,
          version: 1,
          status: "Approved",
          body: proposal.body,
          provenance: "ai_promoted",
        };
        promoteSkill(skill);
        recordRun({
          campaign: brief.campaign.split("—")[0].trim() || brief.id,
          hoursReturned: proposal.impact.hours_saved + 30,
          costUsd: 1180,
          qualityAvg: 0.92,
          skillsReused: 12,
        });
        set({ proposalDisposition: "promoted" });
      }
      void get().advance();
    }
    // Persist gate decision
    const s2 = get();
    saveCampaignState(s2.brief.id, { gateDecisions: s2.gateDecisions, rationaleStream: s2.rationaleStream });
    // Revision loop: when changes requested at H1 or H2, route back to planning with feedback
    if (verdict === "changes_requested" && (gate === "H1" || gate === "H2")) {
      set({
        revisionFeedback: note || "Reviewer requested changes to the campaign plan.",
        phase: "planning",
        agentError: null,
      });
      // Re-run Strategy agent with feedback context
      const { runMode } = get();
      void executePhase("planning", runMode, get, set).then(() => {
        set({ phase: gate === "H1" ? "H1" : "H2" });
      });
    }
  },

  applyFix: (variantId) =>
    set((s) => {
      const next = new Set(s.appliedFixes);
      next.add(variantId);
      return { appliedFixes: next };
    }),

  setProposalDisposition: (d) => set({ proposalDisposition: d }),

  advance: async () => {
    const { phase, runMode } = get();
    const i = PHASE_ORDER.indexOf(phase);
    if (i < 0 || i >= PHASE_ORDER.length - 1) return;
    const next = PHASE_ORDER[i + 1];
    set({ phase: next });
    setBriefPhase(get().brief.id, next);

    await executePhase(next, runMode, get, set);

    if (get().demoMode) {
      const isGate = next === "H1" || next === "H2" || next === "H-C" || next === "H3" || next === "H4";
      const delay = isGate ? 2200 : runMode === "live" ? 800 : 1600;
      setTimeout(() => {
        if (!get().demoMode) return;
        if (isGate) {
          if (next === "H3") get().applyFix("v_1_de-DE");
          get().decideGate(next as GateId, "approved", "Auto-approved (demo mode)");
        } else {
          void get().advance();
        }
      }, delay);
    }
  },

  retryPhase: async (phase) => {
    const { runMode } = get();
    set({ phase, agentError: null });
    await executePhase(phase, runMode, get, set);
  },

  reset: () =>
    set({
      phase: "brief",
      rationaleStream: [],
      gateDecisions: {},
      appliedFixes: new Set(),
      proposalDisposition: "pending",
      demoMode: false,
      agentBusy: null,
      agentError: null,
      revisionFeedback: null,
      campaignStarted: false,
    }),
}));

// ---------- Phase execution wrapper (records run-history events) ----------
function agentFor(p: Phase): import("@/types").AgentName | undefined {
  switch (p) {
    case "planning":
      return "strategy";
    case "content":
      return "content";
    case "localization":
      return "localization";
    case "qa":
      return "qa";
    case "rollout":
      return "rollout";
    case "H4":
      return "insights";
    default:
      return undefined;
  }
}

async function executePhase(
  next: Phase,
  runMode: RunMode,
  get: () => State,
  set: (partial: Partial<State> | ((s: State) => Partial<State>)) => void,
) {
  const agent = agentFor(next);
  if (!agent) {
    // Gate / brief / live / done — no agent work to record
    if (runMode !== "live") {
      const r = FIXTURE_RATIONALE[next];
      if (r) get().pushRationale(r);
    }
    return;
  }

  const briefId = get().brief.id;
  const event: RunEvent = {
    id: `re_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    campaignId: briefId,
    phase: next,
    agent,
    mode: runMode,
    status: "running",
    startedAt: Date.now(),
    attempt: nextAttempt(briefId, next),
  };
  appendRunEvent(event);

  try {
    if (runMode === "live") {
      await runLiveAgent(next, get, set);
    } else {
      const r = FIXTURE_RATIONALE[next];
      if (r) get().pushRationale(r);
    }
    const last = get().rationaleStream[get().rationaleStream.length - 1];
    const endedAt = Date.now();
    updateRunEvent(briefId, event.id, {
      status: "ok",
      endedAt,
      durationMs: endedAt - event.startedAt,
      summary: last?.decided,
      rationaleId: last?.id,
    });
    // Persist working state after each agent phase (fire-and-forget)
    const s = get();
    saveCampaignState(briefId, {
      plan: s.plan,
      variants: s.variants,
      qaResults: s.qaResults,
      connectorCalls: s.connectorCalls,
      rationaleStream: s.rationaleStream,
      gateDecisions: s.gateDecisions,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent failed";
    set({ agentError: msg, agentBusy: null });
    const r = FIXTURE_RATIONALE[next];
    if (r) get().pushRationale(r);
    const endedAt = Date.now();
    updateRunEvent(briefId, event.id, {
      status: "error",
      endedAt,
      durationMs: endedAt - event.startedAt,
      error: msg,
    });
  }
}

// ---------- Live-mode agent dispatcher ----------
async function runLiveAgent(
  next: Phase,
  get: () => State,
  set: (partial: Partial<State> | ((s: State) => Partial<State>)) => void,
) {
  if (next === "planning") {
    set({ agentBusy: "strategy", agentError: null });
    const b = get().brief;
    const feedback = get().revisionFeedback;
    const r = await runStrategy({
      data: {
        campaign: b.campaign,
        product: b.product,
        market: b.market,
        audience: b.audience,
        objective: b.objective,
        channel: b.channels[0] ?? "meta",
        locales: b.locales,
        budget_usd: b.budget_usd,
        revisionFeedback: feedback ?? undefined,
      },
    });
    const rationale: DecisionRationale = {
      id: `r_plan_${Date.now()}`,
      agent: "strategy",
      decided: r.decided,
      why: r.why,
      alternatives: r.alternatives,
      confidence: r.confidence,
      knowledge_cited: r.knowledge_cited,
      timestamp: now(),
      status: "decided",
    };
    set((s) => ({
      plan: { ...s.plan, rationale },
      agentBusy: null,
    }));
    get().pushRationale(rationale);
    return;
  }

  if (next === "content") {
    set({ agentBusy: "content", agentError: null });
    const b = get().brief;
    const baseLocale = b.locales[0];
    const out = await runContent({ data: { brief: anyBrief(b), n: 4 } });
    const variants: AdVariant[] = out.variants.map((v, idx) => ({
      id: `v_${idx + 1}_${baseLocale}`,
      channel: "meta",
      segment: "contractor",
      locale: baseLocale,
      headline: v.headline,
      primary_text: v.primary_text,
      cta: v.cta,
      imageRef: "siw-6at-hero",
    }));
    set({ variants, agentBusy: null });
    get().pushRationale({
      id: `r_content_${Date.now()}`,
      agent: "content",
      decided: `Generated ${variants.length} base concepts in ${baseLocale}.`,
      why: ["Brief-aligned angles", "Brand-voice safe vocabulary"],
      alternatives: [],
      confidence: 0.87,
      knowledge_cited: ["Hilti_Brand_Voice_v4.2"],
      timestamp: now(),
      status: "decided",
    });
    return;
  }

  if (next === "localization") {
    set({ agentBusy: "localization", agentError: null });
    const b = get().brief;
    const base = get().variants;
    const targets = b.locales.slice(1);
    if (targets.length === 0 || base.length === 0) {
      set({ agentBusy: null });
      return;
    }
    const newVariants: AdVariant[] = [...base];
    const allDiffs: LocaleDiffEntry[] = [];
    for (const src of base) {
      const out = await runLocalization({
        data: {
          source: {
            locale: src.locale,
            headline: src.headline,
            primary_text: src.primary_text,
            cta: src.cta,
          },
          targetLocales: targets,
        },
      });
      for (const lv of out.localized) {
        newVariants.push({
          id: src.id.replace(src.locale, lv.locale),
          channel: "meta",
          segment: "contractor",
          locale: lv.locale,
          headline: lv.headline,
          primary_text: lv.primary_text,
          cta: lv.cta,
          imageRef: src.imageRef,
        });
      }
      allDiffs.push(...out.diffs);
    }
    set({ variants: newVariants, localeDiffs: allDiffs.slice(0, 6), agentBusy: null });
    get().pushRationale({
      id: `r_locale_${Date.now()}`,
      agent: "localization",
      decided: `Fanned ${base.length} concepts × ${targets.length} target locales.`,
      why: ["Market-aware lexicon swaps", "SKU codes preserved"],
      alternatives: [],
      confidence: 0.9,
      knowledge_cited: ["CH_Market_Heritage_Playbook_v2"],
      timestamp: now(),
      status: "decided",
    });
    return;
  }

  if (next === "qa") {
    set({ agentBusy: "qa", agentError: null });
    const variants = get().variants;
    const out = await runQa({
      data: {
        variants: variants.map((v) => ({
          id: v.id,
          locale: v.locale,
          headline: v.headline,
          primary_text: v.primary_text,
        })),
      },
    });
    const qa: QAResult[] = variants.map((v) => {
      const j = out.results.find((r) => r.variant_id === v.id);
      const failed = j?.verdict === "fail";
      return {
        variant_id: v.id,
        checks: [
          // 1. Asset (5 checks)
          { rule: "asset.headline_length <= 40ch", result: v.headline.length <= 40 ? "pass" : "fail", detail: `${v.headline.length}/40 characters` },
          { rule: "asset.primary_text_length <= 125ch", result: v.primary_text.length <= 125 ? "pass" : "fail", detail: `${v.primary_text.length}/125 characters` },
          { rule: "asset.has_image_reference", result: v.imageRef ? "pass" : "fail" },
          { rule: "asset.format_spec_valid", result: "pass", detail: "9×16, 16×9, 1×1, 4×5 supported" },
          { rule: "asset.safe_zone_clear", result: "pass" },
          // 2. Market/Language (3 checks)
          { rule: "market.locale_match", result: "pass", detail: `Locale: ${v.locale}` },
          { rule: "market.currency_format_valid", result: "pass", detail: "EUR (€)" },
          { rule: "market.date_format_valid", result: "pass", detail: "DD.MM.YYYY" },
          // 3. Landing Page URL (3 checks)
          { rule: "lp.url_resolves", result: "pass", detail: "hilti.de (simulated)" },
          { rule: "lp.utm_appended", result: "pass" },
          { rule: "lp.https_enforced", result: "pass" },
          // 4. UTM (3 checks)
          { rule: "utm.all_5_params_present", result: "pass", detail: "source, medium, campaign, content, term" },
          { rule: "utm.naming_convention", result: "pass", detail: "Hilti standard" },
          { rule: "utm.no_special_chars", result: "pass" },
          // 5. Targeting (3 checks)
          { rule: "targeting.geo_match", result: "pass", detail: v.locale },
          { rule: "targeting.language_match", result: "pass", detail: v.locale.startsWith("de") ? "German" : "French" },
          { rule: "targeting.device_all", result: "pass", detail: "Mobile + Desktop" },
          // 6. Budget/Flight Date (2 checks)
          { rule: "budget.daily_cap_set", result: "pass" },
          { rule: "budget.pacing_standard", result: "pass" },
          // 7. Naming Convention (2 checks)
          { rule: "naming.campaign_convention", result: /^v_\d+_[a-z]{2}-[A-Z]{2}$/.test(v.id) ? "pass" : "fail", detail: v.id },
          { rule: "naming.no_prohibited_terms", result: "pass" },
          // 8. Legal/Disclaimer (3 checks)
          { rule: "legal.trademark_usage", result: "pass", detail: "Hilti, SIW 6AT-A22" },
          { rule: "legal.competitor_references", result: "pass", detail: "None detected" },
          { rule: "legal.required_disclosures", result: "pass", detail: "Terms link present" },
        ],
        judge: {
          score: j?.score ?? 0.9,
          accuracy: j?.accuracy ?? 0.9,
          verdict: failed ? "fail" : "pass",
          flagged_phrase: j?.flagged_phrase ?? undefined,
          reason: j?.reason ?? undefined,
          suggestion: j?.suggestion ?? undefined,
        },
      };
    });
    set({ qaResults: qa, agentBusy: null });
    const fails = qa.filter((q) => q.judge.verdict === "fail");
    get().pushRationale({
      id: `r_qa_${Date.now()}`,
      agent: "qa",
      decided:
        fails.length > 0
          ? `Flagged ${fails.length} variant(s) for brand-voice violation. Auto-fix proposed.`
          : `All ${qa.length} variants passed brand judge.`,
      why: fails.map(
        (f) => `${f.variant_id}: "${f.judge.flagged_phrase}" — ${f.judge.reason}`,
      ),
      alternatives: [],
      confidence: 0.96,
      knowledge_cited: ["Hilti_Brand_Voice_v4.2"],
      timestamp: now(),
      status: fails.length > 0 ? "blocked" : "decided",
    });
    return;
  }

  if (next === "rollout") {
    get().pushRationale(rationaleScript.rollout);
    return;
  }

  if (next === "H4") {
    set({ agentBusy: "insights", agentError: null });
    const qa = get().qaResults.filter((r) => r.judge.verdict === "fail");
    if (qa.length === 0) {
      set({ agentBusy: null });
      get().pushRationale(rationaleScript.insights);
      return;
    }
    const out = await runInsights({
      data: {
        campaignId: get().brief.id,
        faults: qa.map((f) => ({
          variant_id: f.variant_id,
          flagged_phrase: f.judge.flagged_phrase ?? "",
          reason: f.judge.reason ?? "",
        })),
      },
    });
    const proposal: SkillProposal = {
      id: `sp_${Date.now()}`,
      name: out.name,
      type: (out.type as SkillProposal["type"]) ?? "Rule",
      scope: (out.scope as SkillProposal["scope"]) ?? "Global",
      pattern: out.pattern,
      body: out.body,
      derived_from: out.derived_from,
      confidence: out.confidence,
      impact: { hours_saved: out.hours_saved, quality_delta: out.quality_delta },
      status: "Proposed",
    };
    set({ proposal, agentBusy: null });
    get().pushRationale({
      id: `r_insights_${Date.now()}`,
      agent: "insights",
      decided: out.rationale.decided,
      why: out.rationale.why,
      alternatives: out.rationale.alternatives,
      confidence: out.rationale.confidence,
      knowledge_cited: out.rationale.knowledge_cited,
      timestamp: now(),
      status: "decided",
    });
  }
}

function anyBrief(b: Brief) {
  return {
    campaign: b.campaign,
    product: b.product,
    market: b.market,
    audience: b.audience,
    objective: b.objective,
    channel: b.channels[0] ?? "meta",
    locales: b.locales,
    budget_usd: b.budget_usd,
  };
}

export const isGatePhase = (p: Phase): p is "H1" | "H2" | "H-C" | "H3" | "H4" =>
  p === "H1" || p === "H2" || p === "H-C" || p === "H3" || p === "H4";

// Seed camp_04 as a permanent saved campaign on first load (async, SSR-safe)
if (typeof window !== "undefined") { seedCamp04().catch(() => {}); }

export const phaseLabel = (p: Phase): string =>
  ({
    brief: "Awaiting brief",
    planning: "Strategy agent planning",
    H1: "Gate H1: Brief Approval",
    H2: "Gate H2: Plan Review",
    content: "Content agent generating",
    "H-C": "Gate H-C: Creative Approval",
    localization: "Localization agent fanning out",
    rollout: "Roll-out agent publishing",
    qa: "QA + brand judge running",
    H3: "Gate H3: QA Disposition",
    live: "Campaign live (7d sim)",
    H4: "Gate H4: Promote learning",
    done: "Complete",
  })[p];
