import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useWorkspace } from "@/store/workspace";
import { listSkills } from "@/lib/persistence";
import type { RegistryArtifact } from "@/types";

export const Route = createFileRoute("/skills")({
  head: () => ({
    meta: [
      { title: "Skills registry — Fourier" },
      {
        name: "description",
        content:
          "Knowledge registry and H4 skill-promotion proposals from completed campaigns.",
      },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const proposal = useWorkspace((s) => s.proposal);
  const disposition = useWorkspace((s) => s.proposalDisposition);
  const setDisposition = useWorkspace((s) => s.setProposalDisposition);
  const [registry, setRegistry] = useState<RegistryArtifact[]>([]);
  useEffect(() => { setRegistry(listSkills()); }, [disposition]);

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Skills · Registry
          </p>
          <h1 className="text-2xl font-bold">Knowledge that compounds</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rules, Guidelines, and Playbooks the agent consults. H4 proposals
            from completed campaigns appear at the top.
          </p>
        </header>

        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-hilti">
            Pending H4 proposals (1)
          </h2>
          <div className="rounded-sm border-2 border-hilti bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-hilti px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                    {proposal.type}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    scope: {proposal.scope}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-emerald">
                    {(proposal.confidence * 100).toFixed(0)}% conf
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold">{proposal.name}</h3>
                <p className="mt-1 text-xs text-foreground/80">{proposal.body}</p>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  derived_from: {proposal.derived_from} · +
                  {proposal.impact.hours_saved}h/campaign
                </p>
              </div>
              <div className="ml-4 flex flex-col gap-2">
                {disposition === "pending" ? (
                  <>
                    <button
                      onClick={() => setDisposition("promoted")}
                      className="rounded-sm bg-hilti px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-white"
                    >
                      Promote
                    </button>
                    <button
                      onClick={() => setDisposition("rejected")}
                      className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="font-mono text-[10px] uppercase text-emerald">
                    ✓ {disposition}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Approved registry ({registry.length})
          </h2>
          <div className="space-y-2">
            {registry.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-sm border border-border bg-white p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm border border-border bg-black/[0.02] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                      {r.type}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      scope: {r.scope}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      v{r.version}
                    </span>
                    {r.provenance === "ai_promoted" && (
                      <span className="font-mono text-[10px] uppercase text-emerald">
                        ↑ ai_promoted
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground">{r.body}</p>
                </div>
                <span className="font-mono text-[10px] uppercase text-emerald">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
