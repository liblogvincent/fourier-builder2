import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { BriefCard } from "@/components/timeline/BriefCard";
import { PlanCard } from "@/components/timeline/PlanCard";
import { ContentSection } from "@/components/timeline/ContentSection";
import { LocaleDiff } from "@/components/timeline/LocaleDiff";
import { QaPanel } from "@/components/timeline/QaPanel";
import { RolloutStatus } from "@/components/timeline/RolloutStatus";
import { LiveTile, ValueReadout } from "@/components/timeline/ValueReadout";
import { InsightProposal } from "@/components/timeline/InsightProposal";
import { GatePanel } from "@/components/gates/GatePanel";
import { AgentDiscussion } from "@/components/timeline/AgentDiscussion";
import type { Phase } from "@/types";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Fourier" },
      {
        name: "description",
        content:
          "Live agentic campaign workspace: brief → CampaignPlan → content → QA → publish → learn.",
      },
    ],
  }),
  component: Workspace,
});

const ORDER: Phase[] = [
  "brief", "planning", "H1", "content", "localization", "qa",
  "H2", "H-legal", "rollout", "H3", "live", "H4", "done",
];
const reached = (phase: Phase, target: Phase): boolean =>
  ORDER.indexOf(phase) >= ORDER.indexOf(target);

function Workspace() {
  const phase = useWorkspace((s) => s.phase);

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8">
        <AgentDiscussion />

        <BriefCard />

        {reached(phase, "planning") && <PlanCard />}
        {phase === "H1" && <GatePanel gate="H1" />}

        {reached(phase, "content") && <ContentSection />}
        {reached(phase, "localization") && <LocaleDiff />}
        {reached(phase, "qa") && <QaPanel />}
        {phase === "H2" && <GatePanel gate="H2" />}
        {phase === "H-legal" && <GatePanel gate="H-legal" />}

        {reached(phase, "rollout") && <RolloutStatus />}
        {phase === "H3" && <GatePanel gate="H3" />}

        {reached(phase, "live") && <LiveTile />}
        {reached(phase, "H4") && <InsightProposal />}
        {phase === "H4" && <GatePanel gate="H4" />}

        {phase === "done" && <ValueReadout />}
      </div>
    </WorkspaceShell>
  );
}
