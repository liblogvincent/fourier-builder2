import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { CampaignProgressBar } from "@/components/home/CampaignProgressBar";
import { AgentConstellation } from "@/components/home/AgentConstellation";
import { AgentConsole } from "@/components/home/AgentConsole";
import { MyTasksPanel } from "@/components/home/MyTasksPanel";
import { RecentCampaignsStrip } from "@/components/home/RecentCampaignsStrip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Workspace — Fourier" },
      {
        name: "description",
        content:
          "Chat with the Orchestrator agent. It plans campaigns, delegates to six specialist agents, and asks you to approve gates.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const phase = useWorkspace((s) => s.phase);
  const brief = useWorkspace((s) => s.brief);

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-6xl space-y-4 px-6 py-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Command center
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Agent workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat with the Orchestrator. It plans, delegates to specialist agents,
            and asks you to approve gates.
          </p>
        </header>

        {/* Stats dashboard */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "Gates pending",
              value: phase === "H1" || phase === "H2" || phase === "H-C" || phase === "H-legal" || phase === "H3" || phase === "H4" ? "1" : "0",
              trend: "requires action",
            },
            { label: "Active campaign", value: brief.campaign.split(" — ")[0], trend: phase },
            {
              label: "Skills in registry",
              value: "4",
              trend: "+1 from camp_03",
            },
            {
              label: "Eval trend",
              value: "↓ cost",
              trend: "4 campaigns tracked",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-sm border border-border bg-white p-3"
            >
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 font-mono text-sm font-bold">{stat.value}</p>
              <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                {stat.trend}
              </p>
            </div>
          ))}
        </div>

        <CampaignProgressBar
          phase={phase}
          title={brief.campaign}
          subtitle={`${brief.product} · ${brief.market} · ${brief.locales.join(" / ")}`}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="h-[520px]">
            <AgentConsole />
          </div>
          <div className="h-[520px]">
            <AgentConstellation />
          </div>
        </div>

        <MyTasksPanel />
        <RecentCampaignsStrip />
      </div>
    </WorkspaceShell>
  );
}
