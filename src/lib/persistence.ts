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
import { supabase as getSupabase, isSupabaseConfigured } from "./supabase";

function db() { return getSupabase(); }

// ---- localStorage fallback helpers (used when Supabase is not configured) ----
function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
  catch { return fallback; }
}
function lsWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ---- Campaign state shape ----
interface CampaignState {
  plan: CampaignPlan;
  variants: AdVariant[];
  qaResults: QAResult[];
  connectorCalls: ConnectorCall[];
  rationaleStream: DecisionRationale[];
  gateDecisions: Record<string, GateDecision>;
}

// ---- Campaigns ----
export async function listCampaigns(): Promise<Brief[]> {
  if (isSupabaseConfigured()) {
    const { data } = await db()?.from("campaigns").select("brief").order("updated_at", { ascending: false });
    const briefs = (data || []).map((r: any) => r.brief as Brief);
    if (!briefs.find((b) => b.id === defaultBrief.id)) briefs.push(defaultBrief);
    return briefs;
  }
  // localStorage fallback
  const saved = lsRead<Brief[]>("luban.campaigns", []);
  if (!saved.find((b) => b.id === defaultBrief.id)) return [defaultBrief, ...saved];
  return saved;
}

export async function saveCampaign(b: Brief) {
  if (isSupabaseConfigured()) {
    // Check if exists first, to preserve phase/state on update
    const { data: existing } = await db()?.from("campaigns").select("phase,state").eq("id", b.id).maybeSingle();
    if (existing) {
      await db()?.from("campaigns").update({ brief: b as any, updated_at: new Date().toISOString() }).eq("id", b.id);
    } else {
      await db()?.from("campaigns").insert({ id: b.id, brief: b as any, phase: "brief", state: {}, updated_at: new Date().toISOString() });
    }
    return;
  }
  const all = lsRead<Brief[]>("luban.campaigns", []);
  lsWrite("luban.campaigns", [b, ...all.filter((x) => x.id !== b.id)]);
}

// ---- Campaign working state ----
export async function saveCampaignState(briefId: string, partial: Partial<CampaignState>) {
  if (isSupabaseConfigured()) {
    const { data: existing } = await db()?.from("campaigns").select("state").eq("id", briefId).maybeSingle();
    const current = (existing?.state || {}) as CampaignState;
    const merged = { ...current, ...partial };
    await db()?.from("campaigns").update({ state: merged as any, updated_at: new Date().toISOString() }).eq("id", briefId);
    return;
  }
  const key = "luban.state." + briefId;
  const existing = lsRead<CampaignState>(key, {} as CampaignState);
  lsWrite(key, { ...existing, ...partial });
}

export async function loadCampaignState(briefId: string): Promise<Partial<CampaignState>> {
  if (isSupabaseConfigured()) {
    const { data } = await db()?.from("campaigns").select("state").eq("id", briefId).maybeSingle();
    return (data?.state || {}) as Partial<CampaignState>;
  }
  return lsRead<Partial<CampaignState>>("luban.state." + briefId, {});
}

// ---- Per-campaign phase ----
export async function getBriefPhase(id: string): Promise<string | null> {
  if (isSupabaseConfigured()) {
    const { data } = await db()?.from("campaigns").select("phase").eq("id", id).maybeSingle();
    return data?.phase ?? null;
  }
  const map = lsRead<Record<string, string>>("luban.campaign_phases", {});
  return map[id] ?? null;
}

export async function setBriefPhase(id: string, phase: string) {
  if (isSupabaseConfigured()) {
    await db()?.from("campaigns").update({ phase, updated_at: new Date().toISOString() }).eq("id", id);
    return;
  }
  const map = lsRead<Record<string, string>>("luban.campaign_phases", {});
  lsWrite("luban.campaign_phases", { ...map, [id]: phase });
}

export async function getAllBriefPhases(): Promise<Record<string, string>> {
  if (isSupabaseConfigured()) {
    const { data } = await db()?.from("campaigns").select("id,phase");
    const map: Record<string, string> = {};
    for (const r of (data || [])) map[r.id] = r.phase;
    return map;
  }
  return lsRead<Record<string, string>>("luban.campaign_phases", {});
}

// ---- Runs / Evals ----
export async function listRuns(): Promise<EvalPoint[]> {
  if (isSupabaseConfigured()) {
    const { data } = await db()?.from("runs").select("data").order("created_at");
    const saved = (data || []).map((r: any) => r.data as EvalPoint);
    const merged = [...seedEvals, ...saved];
    return merged.map((p, i) => ({ ...p, campaignNumber: i + 1 }));
  }
  const saved = lsRead<EvalPoint[]>("luban.runs", []);
  const merged = [...seedEvals, ...saved];
  return merged.map((p, i) => ({ ...p, campaignNumber: i + 1 }));
}

export async function recordRun(point: Omit<EvalPoint, "campaignNumber">) {
  if (isSupabaseConfigured()) {
    await db()?.from("runs").insert({ data: point as any });
    return;
  }
  const saved = lsRead<EvalPoint[]>("luban.runs", []);
  lsWrite("luban.runs", [...saved, { ...point, campaignNumber: 0 }]);
}

// ---- Skills registry ----
export async function listSkills(): Promise<RegistryArtifact[]> {
  if (isSupabaseConfigured()) {
    const { data } = await db()?.from("skills").select("data").order("created_at");
    const saved = (data || []).map((r: any) => r.data as RegistryArtifact);
    const seen = new Set(seedRegistry.map((r) => r.id));
    return [...seedRegistry, ...saved.filter((s) => !seen.has(s.id))];
  }
  const saved = lsRead<RegistryArtifact[]>("luban.skills", []);
  const seen = new Set(seedRegistry.map((r) => r.id));
  return [...seedRegistry, ...saved.filter((s) => !seen.has(s.id))];
}

export async function promoteSkill(s: RegistryArtifact) {
  if (isSupabaseConfigured()) {
    await db()?.from("skills").upsert({ id: s.id, data: s as any, updated_at: new Date().toISOString() });
    return;
  }
  const saved = lsRead<RegistryArtifact[]>("luban.skills", []);
  if (saved.find((x) => x.id === s.id)) return;
  lsWrite("luban.skills", [...saved, s]);
}

// ---- Role ----
export type StoredRole = "campaign_manager" | "legal" | "market_lead" | "brand_qa";
export function getRole(): StoredRole {
  return lsRead<StoredRole>("luban.role", "campaign_manager");
}
export function setRole(r: StoredRole) {
  lsWrite("luban.role", r);
}

// ---- Seed camp_04 ----
export async function seedCamp04() {
  if (isSupabaseConfigured()) {
    const { data } = await db()?.from("campaigns").select("id").eq("id", defaultBrief.id).maybeSingle();
    if (!data) {
      await db()?.from("campaigns").insert({
        id: defaultBrief.id,
        brief: defaultBrief as any,
        phase: "done",
        state: {
          plan: defaultPlan,
          variants: defaultVariants,
          qaResults: defaultQa,
          connectorCalls: defaultConn,
          rationaleStream: [],
          gateDecisions: {},
        } as any,
        updated_at: new Date().toISOString(),
      });
    }
    return;
  }
  // localStorage fallback
  const campaigns = lsRead<Brief[]>("luban.campaigns", []);
  if (!campaigns.find((b) => b.id === defaultBrief.id)) {
    saveCampaign(defaultBrief);
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
