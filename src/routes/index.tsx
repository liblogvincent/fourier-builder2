import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  const campaignStarted = useWorkspace((s) => s.campaignStarted);
  const demoMode = useWorkspace((s) => s.demoMode);
  const newCampaign = useWorkspace((s) => s.newCampaign);
  const navigate = useNavigate();

  const isClean = !campaignStarted && !demoMode;

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

        {isClean ? (
          <>
            <div className="rounded-sm border border-border bg-background px-4 py-3 text-xs text-center">
              <strong>No campaign loaded.</strong> Describe your campaign below or click a starter — the Orchestrator will structure your brief.
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="h-[480px]">
                <AgentConsole />
              </div>
              <div className="h-[480px] flex flex-col items-center justify-center gap-4 rounded-sm border-2 border-dashed border-border bg-white p-8">
                <p className="text-sm text-muted-foreground text-center">Quick start</p>
                <button onClick={() => { newCampaign(); void navigate({ to: "/workspace" }); }} className="w-full rounded-sm bg-hilti px-4 py-2 text-sm font-bold text-white hover:bg-hilti/90">
                  + New Campaign
                </button>
                <button onClick={() => useWorkspace.getState().setDemoMode(true)} className="w-full rounded-sm border border-border bg-white px-4 py-2 text-sm font-bold hover:bg-black/5">
                  ▶ Run Demo
                </button>
                <a href="https://github.com/liblogvincent/luban/blob/main/docs/Fourier-User-Handbook.md" target="_blank" rel="noopener noreferrer" className="w-full rounded-sm border border-border bg-white px-4 py-2 text-sm font-bold text-center hover:bg-black/5">
                  📖 User Handbook
                </a>
              </div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </WorkspaceShell>
  );
}
