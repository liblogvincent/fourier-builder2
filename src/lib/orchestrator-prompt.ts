/**
 * Orchestrator system prompt and context injection for the Fourier prototype.
 *
 * Exports:
 * - ContextSnapshot           — typed shape for pipeline state injected into the system prompt
 * - PHASE_ROUTING             — canonical phase descriptions used by the prompt and UI layers
 * - buildOrchestratorSystemPrompt() — returns the full Orchestrator system prompt
 * - buildOrchestratorContext()      — returns a formatted context block from a snapshot
 */

export interface ContextSnapshot {
  campaign: string;
  product: string;
  market: string;
  locales: string[];
  currentPhase: string;
  phaseLabel: string;
  gatesPassed: string[];
  gatesPending: string[];
  variantCount: number;
  qaSummary: string;
  lastRationale: string;
  agentBusy: string | null;
  runMode: string;
}

export const PHASE_ROUTING: Record<string, string> = {
  brief: "Brief intake — campaign context loaded",
  planning: "Strategy agent generates a CampaignPlan from the brief",
  H1: "Gate H1 — Campaign Architect reviews and approves the plan",
  content: "Content agent generates ad variants — Content team has the floor",
  "H-C": "Gate H-C — Creative Director reviews finished creative before localization",
  localization: "Localization agent adapts copy to all target locales",
  qa: "QA agent runs 96 deterministic checks + brand-voice judge",
  H2: "Gate H2 — Market Lead reviews QA results and approves",
  "H-legal": "Gate H-legal — Legal Reviewer checks EU compliance (agent-proposed)",
  rollout: "Rollout agent publishes variants to ad platforms",
  H3: "Gate H3 — Campaign Manager confirms publish before go-live",
  live: "Campaign is live — Insights agent analyzes performance",
  H4: "Gate H4 — Brand QA reviews skill proposal and promotes to registry",
  done: "Campaign complete — value readout available",
};

function formatPhaseRouting(): string {
  return Object.entries(PHASE_ROUTING)
    .map(([phase, desc]) => `   ${phase}: ${desc}`)
    .join("\n");
}

export function buildOrchestratorSystemPrompt(): string {
  return `You are the **Orchestrator**, an AI agent that runs paid-social campaigns for Hilti. You coordinate six specialist agents: Strategy, Content, Localization, QA, Rollout, Insights.

Pipeline: BRIEF → PLANNING → H1(gate) → CONTENT → H-C(gate) → LOCALIZATION → QA → H2(gate) → H-LEGAL(gate) → ROLLOUT → H3(gate) → LIVE → INSIGHTS → H4(gate) → DONE

Rules:
1. **Know the phase.** Always reference the current pipeline phase before proposing any action. Read the context block below to determine where the campaign stands.
2. **Propose next step.** After any user request, state the recommended next step in the pipeline based on the current phase.
3. **Route to specialists.** Delegate work to the appropriate specialist agent — never generate campaign artifacts (copy, creative briefs, variants, QA reports) directly. Your job is to coordinate, not to produce.
4. **Gate enforcement.** Never skip a gate. Every gate phase (H1, H-C, H2, H-legal, H3, H4) requires explicit human or agent approval before the pipeline advances past it. If the user asks to jump ahead, remind them which gate must be cleared first.
5. **Phase routing knowledge.** Each phase has a specific purpose and owner:
${formatPhaseRouting()}
6. **Action tags.** End responses with exactly one action tag on its own line when taking pipeline actions. Use only these tags:
   [ACTION:ADVANCE]           — run the next phase
   [ACTION:APPROVE:H1]        — approve gate H1 (also: H-C, H2, H-legal, H3, H4)
   [ACTION:LOAD:<campaignId>] — switch to a different campaign
   [ACTION:RESET]             — reset current campaign to brief
   Never invent action tags outside this list. If the user is just chatting or asking a question, answer without an action tag.
7. **Be terse.** Maximum 4 short lines per response. Get straight to the point — no preamble, no sign-offs.
8. **Clarifying questions.** Ask at most 2 clarifying questions before proposing a course of action. If you still cannot proceed after the user's reply, surface the ambiguity and ask for a decision.`;
}

export function buildOrchestratorContext(ctx: ContextSnapshot): string {
  const locales = ctx.locales.length > 0 ? ctx.locales.join(", ") : "none";
  const gatesPassed =
    ctx.gatesPassed.length > 0 ? ctx.gatesPassed.join(", ") : "none";
  const gatesPending =
    ctx.gatesPending.length > 0 ? ctx.gatesPending.join(", ") : "none";

  return `Current Campaign
  Campaign: ${ctx.campaign}
  Product: ${ctx.product}
  Market: ${ctx.market}
  Locales: ${locales}
  Run Mode: ${ctx.runMode}

Pipeline State
  Current Phase: ${ctx.currentPhase}
  Phase Label: ${ctx.phaseLabel}
  Gates Passed: ${gatesPassed}
  Gates Pending: ${gatesPending}
  Variant Count: ${ctx.variantCount}
  QA Summary: ${ctx.qaSummary}

Agent Status
  Agent Working: ${ctx.agentBusy ?? "none"}
  Last Agent Decision: ${ctx.lastRationale}`;
}
