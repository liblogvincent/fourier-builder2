// Fourier core types — CampaignPlan, not CampaignTemplate. Open gate namespace.

export type GateId = string; // seed: "H1" | "H2" | "H3" | "H4" — agent may propose extras
export type AgentName =
  | "strategy"
  | "content"
  | "localization"
  | "qa"
  | "rollout"
  | "insights";

export type NodeStatus = "pending" | "running" | "done" | "blocked";
export type NodeKind = "agent" | "tool" | "gate";

export interface DecisionRationale {
  id: string;
  agent: AgentName;
  decided: string;
  why: string[];
  alternatives: { option: string; rejected_because: string }[];
  confidence: number; // 0-1
  knowledge_cited: string[];
  timestamp: string; // HH:MM:SS
  status?: "thinking" | "decided" | "blocked";
}

export interface Brief {
  id: string;
  campaign: string;
  product: string;
  market: string;
  audience: string;
  channels: string[];
  locales: string[];
  objective: string;
  budget_usd: number;
  assumptions: string[];
}

export interface PlanNode {
  id: string;
  label: string;
  kind: NodeKind;
  gate?: GateId;
  agent?: AgentName;
  status: NodeStatus;
  depends_on: string[];
}

export interface CampaignPlan {
  id: string;
  briefId: string;
  nodes: PlanNode[];
  rationale: DecisionRationale;
}

export type AdChannel = "meta" | "linkedin" | "google";

export interface AdVariant {
  id: string;
  channel: AdChannel;
  segment: string;
  locale: string;
  headline: string;
  primary_text: string;
  cta: string;
  imageRef: string;
}

export interface LocaleDiffEntry {
  locale: string;
  base_phrase: string;
  localized_phrase: string;
  reason: string;
}

export interface DeterministicCheck {
  rule: string;
  result: "pass" | "fail";
  detail?: string;
}

export interface BrandJudge {
  score: number; // 0-1
  accuracy: number; // 0-1 confidence of the judge
  verdict: "pass" | "fail";
  flagged_phrase?: string;
  reason?: string;
  suggestion?: string;
}

export interface QAResult {
  variant_id: string;
  checks: DeterministicCheck[];
  judge: BrandJudge;
}

export interface ConnectorCall {
  connector: string;
  action: "publish";
  target: string;
  status: "ok" | "pending" | "error";
  variant_id: string;
}

export interface GateDecision {
  gate: GateId;
  verdict: "approved" | "changes_requested" | "rejected";
  reviewer: string;
  note: string;
  decided_at: string;
  signature?: string;
}

export interface SkillProposal {
  id: string;
  name: string;
  type: "Rule" | "Guideline" | "Playbook";
  scope: "Global" | "Channel" | "Market";
  pattern: string;
  body: string;
  derived_from: string;
  confidence: number;
  impact: { hours_saved: number; quality_delta: number };
  status: "Proposed" | "Promoted" | "Rejected";
}

export interface RegistryArtifact {
  id: string;
  name: string;
  type: "Rule" | "Guideline" | "Playbook";
  scope: "Global" | "Channel" | "Market";
  version: number;
  status: "Approved" | "Proposed" | "Deprecated";
  body: string;
  provenance: "human_authored" | "ai_promoted";
}

export interface EvalPoint {
  campaignNumber: number;
  campaign: string;
  hoursReturned: number;
  costUsd: number;
  qualityAvg: number;
  skillsReused: number;
}

export type Phase =
  | "brief"
  | "planning"
  | "H1"
  | "content"
  | "localization"
  | "qa"
  | "H2"
  | "H-legal"
  | "rollout"
  | "H3"
  | "live"
  | "H4"
  | "done";
