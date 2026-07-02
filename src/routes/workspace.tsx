import { createFileRoute } from "@tanstack/react-router";
import { AgentCanvasShell } from "@/components/AgentCanvasShell";
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
import { exportCampaign, exportCampaignCSV, downloadJSON, downloadCSV } from "@/lib/export";
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
  "brief", "planning", "H1", "H2", "content", "H-C", "localization", "rollout", "qa",
  "H3", "live", "H4", "done",
];
const reached = (phase: Phase, target: Phase): boolean =>
  ORDER.indexOf(phase) >= ORDER.indexOf(target);

function Workspace() {
  const phase = useWorkspace((s) => s.phase);
  const brief = useWorkspace((s) => s.brief);
  const plan = useWorkspace((s) => s.plan);
  const variants = useWorkspace((s) => s.variants);
  const localeDiffs = useWorkspace((s) => s.localeDiffs);
  const qaResults = useWorkspace((s) => s.qaResults);
  const connectorCalls = useWorkspace((s) => s.connectorCalls);
  const proposal = useWorkspace((s) => s.proposal);
  const gateDecisions = useWorkspace((s) => s.gateDecisions);
  const rationaleStream = useWorkspace((s) => s.rationaleStream);

  const handleExportJSON = () => {
    const data = exportCampaign({ brief, plan, variants, localeDiffs, qaResults, connectorCalls, proposal, gateDecisions, rationaleStream });
    downloadJSON(data, `${brief.id}_export.json`);
  };
  const handleExportCSV = () => {
    const data = exportCampaignCSV({ brief, plan, variants, localeDiffs, qaResults, connectorCalls, proposal, gateDecisions, rationaleStream });
    downloadCSV(data, `${brief.id}_variants.csv`);
  };

  return (
    <AgentCanvasShell
      agent={<AgentDiscussion />}
      canvas={
        <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-6">
          {/* Toolbar */}
          {phase !== "brief" && (
            <div className="flex items-center gap-2 pb-2">
              <button onClick={handleExportJSON} className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase hover:bg-black/5">Export JSON ↓</button>
              <button onClick={handleExportCSV} className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase hover:bg-black/5">Export CSV ↓</button>
              <span className="ml-auto font-mono text-[9px] text-muted-foreground">Phase: {phase}</span>
            </div>
          )}
          <BriefCard />
          {reached(phase, "planning") && <PlanCard />}
          {phase === "H1" && <GatePanel gate="H1" />}
          {phase === "H2" && <GatePanel gate="H2" />}
          {reached(phase, "content") && <ContentSection />}
          {phase === "H-C" && <GatePanel gate="H-C" />}
          {reached(phase, "localization") && <LocaleDiff />}
          {reached(phase, "rollout") && <RolloutStatus />}
          {reached(phase, "qa") && <QaPanel />}
          {phase === "H3" && <GatePanel gate="H3" />}
          {reached(phase, "live") && <LiveTile />}
          {reached(phase, "H4") && <InsightProposal />}
          {phase === "H4" && <GatePanel gate="H4" />}
          {phase === "done" && <ValueReadout />}
        </div>
      }
    />
  );
}
