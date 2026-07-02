import type { StoredRole } from "@/lib/persistence";
import type { GateId, Phase } from "@/types";

export const ROLE_LABEL: Record<StoredRole, string> = {
  campaign_manager: "Campaign Manager",
  legal: "Legal Reviewer",
  market_lead: "Market Lead",
  brand_qa: "Brand QA",
};

export const ROLE_GATES: Record<StoredRole, GateId[]> = {
  campaign_manager: ["H1", "H3"],
  legal: ["H-legal"],
  market_lead: ["H2"],
  brand_qa: ["H4"],
};

export const GATE_LABEL: Record<string, string> = {
  H1: "Approve Campaign Plan",
  H2: "Review QA fixes",
  "H-legal": "Legal & compliance review",
  H3: "Sign off rollout",
  H4: "Approve learned skill",
};

export function isGatePhase(p: Phase): boolean {
  return p === "H1" || p === "H2" || p === "H-legal" || p === "H3" || p === "H4";
}
