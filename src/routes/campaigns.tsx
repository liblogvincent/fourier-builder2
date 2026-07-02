import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { listCampaigns } from "@/lib/persistence";
import { useWorkspace } from "@/store/workspace";
import type { Brief } from "@/types";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [{ title: "Campaigns — Fourier" }],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const [items, setItems] = useState<Brief[]>([]);
  const loadBrief = useWorkspace((s) => s.loadBrief);
  const navigate = useNavigate();

  useEffect(() => {
    listCampaigns().then(setItems).catch(() => setItems([]));
  }, []);

  const open = (b: Brief) => {
    loadBrief(b);
    void navigate({ to: "/workspace" });
    // Immediately spawn the Strategy agent so the user sees a live AI run.
    setTimeout(() => {
      void useWorkspace.getState().advance();
    }, 50);
  };

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Campaigns
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Brief library
            </h1>
          </div>
          <Link
            to="/campaigns/new"
            className="rounded-sm bg-hilti px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white hover:opacity-90"
          >
            + New brief
          </Link>
        </header>

        <div className="grid gap-3">
          {items.map((b) => (
            <div
              key={b.id}
              className="group flex items-start justify-between gap-3 rounded-sm border border-border bg-white p-4 transition-colors hover:border-foreground"
            >
              <button onClick={() => open(b)} className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold">{b.campaign}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {b.product} • {b.market} • {b.channels.join(", ").toUpperCase()} • {b.locales.join(" / ")}
                </p>
                <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                  {b.objective}
                </p>
              </button>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link
                  to="/campaigns/$id/history"
                  params={{ id: b.id }}
                  className="rounded-sm border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-foreground hover:text-foreground"
                >
                  Run history →
                </Link>
                <button
                  onClick={() => open(b)}
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-hilti"
                >
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
