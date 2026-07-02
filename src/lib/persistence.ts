import type { Brief, EvalPoint, RegistryArtifact, CampaignPlan, AdVariant, QAResult, ConnectorCall, DecisionRationale, GateDecision } from "@/types";
import {
  registry as seedRegistry,
  evalSeries as seedEvals,
  brief as defaultBrief,
  plan as defaultPlan,
  variants as defaultVariants,
  qaResults as defaultQa,
  connectorCalls as defaultConn,
} from "@/fixtures/camp_04";

const CAMPAIGNS_KEY = "luban.campaigns";
const RUNS_KEY = "luban.runs";
const SKILLS_KEY = "luban.skills";
const PHASES_KEY = "luban.campaign_phases";
const ROLE_KEY = "luban.role";
const STATE_PREFIX = "luban.state.";

interface CampaignState {
  plan: CampaignPlan;
  variants: AdVariant[];
  qaResults: QAResult[];
  connectorCalls: ConnectorCall[];
  rationaleStream: DecisionRationale[];
  gateDecisions: Record<string, GateDecision>;
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

// ---- Campaigns ----
export function listCampaigns(): Brief[] {
  const saved = safeRead<Brief[]>(CAMPAIGNS_KEY, []);
  if (!saved.find((b) => b.id === defaultBrief.id)) {
    return [defaultBrief, ...saved];
  }
  return saved;
}

export function saveCampaign(b: Brief) {
  const all = safeRead<Brief[]>(CAMPAIGNS_KEY, []);
  const next = [b, ...all.filter((x) => x.id !== b.id)];
  safeWrite(CAMPAIGNS_KEY, next);
}

// ---- Runs / Evals ----
export function listRuns(): EvalPoint[] {
  const saved = safeRead<EvalPoint[]>(RUNS_KEY, []);
  // seed + user runs; renumber sequentially
  const merged = [...seedEvals, ...saved];
  return merged.map((p, i) => ({ ...p, campaignNumber: i + 1 }));
}

export function recordRun(point: Omit<EvalPoint, "campaignNumber">) {
  const saved = safeRead<EvalPoint[]>(RUNS_KEY, []);
  safeWrite(RUNS_KEY, [...saved, { ...point, campaignNumber: 0 }]);
}

// ---- Skills registry ----
export function listSkills(): RegistryArtifact[] {
  const saved = safeRead<RegistryArtifact[]>(SKILLS_KEY, []);
  const seen = new Set(seedRegistry.map((r) => r.id));
  return [...seedRegistry, ...saved.filter((s) => !seen.has(s.id))];
}

export function promoteSkill(s: RegistryArtifact) {
  const saved = safeRead<RegistryArtifact[]>(SKILLS_KEY, []);
  if (saved.find((x) => x.id === s.id)) return;
  safeWrite(SKILLS_KEY, [...saved, s]);
}

// ---- Per-campaign phase (for Home dashboard progress) ----
export function getBriefPhase(id: string): string | null {
  const map = safeRead<Record<string, string>>(PHASES_KEY, {});
  return map[id] ?? null;
}

export function setBriefPhase(id: string, phase: string) {
  const map = safeRead<Record<string, string>>(PHASES_KEY, {});
  safeWrite(PHASES_KEY, { ...map, [id]: phase });
}

export function getAllBriefPhases(): Record<string, string> {
  return safeRead<Record<string, string>>(PHASES_KEY, {});
}

// ---- Role (local UI filter) ----
export type StoredRole = "campaign_manager" | "legal" | "market_lead" | "brand_qa";
export function getRole(): StoredRole {
  return safeRead<StoredRole>(ROLE_KEY, "campaign_manager");
}
export function setRole(r: StoredRole) {
  safeWrite(ROLE_KEY, r);
}

// ---- Campaign working state (variants, plan, QA, etc.) ----
export function saveCampaignState(briefId: string, state: Partial<CampaignState>) {
  const key = STATE_PREFIX + briefId;
  const existing = safeRead<CampaignState>(key, {} as CampaignState);
  safeWrite(key, { ...existing, ...state });
}

export function loadCampaignState(briefId: string): Partial<CampaignState> {
  const key = STATE_PREFIX + briefId;
  return safeRead<Partial<CampaignState>>(key, {});
}

// ---- Seed camp_04 as a permanent saved campaign ----
export function seedCamp04() {
  const campaigns = safeRead<Brief[]>(CAMPAIGNS_KEY, []);
  if (!campaigns.find((b) => b.id === defaultBrief.id)) {
    saveCampaign(defaultBrief);
    // Also seed the demo state so Content/Media pages show data
    saveCampaignState(defaultBrief.id, {
      plan: defaultPlan,
      variants: defaultVariants,
      qaResults: defaultQa,
      connectorCalls: defaultConn,
      rationaleStream: [],
      gateDecisions: {},
    });
  }
}
