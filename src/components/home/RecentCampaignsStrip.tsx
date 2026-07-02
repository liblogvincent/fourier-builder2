import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/store/workspace";
import { getAllBriefPhases, listCampaigns } from "@/lib/persistence";
import type { Brief } from "@/types";

export function RecentCampaignsStrip() {
  const [items, setItems] = useState<Brief[]>([]);
  const [phases, setPhases] = useState<Record<string, string>>({});
  const loadBrief = useWorkspace((s) => s.loadBrief);
  const navigate = useNavigate();

  useEffect(() => {
    listCampaigns().then((c) => setItems(c.slice(0, 4))).catch(() => setItems([]));
    getAllBriefPhases().then(setPhases).catch(() => setPhases({}));
  }, []);

  const open = (b: Brief) => {
    loadBrief(b);
    void navigate({ to: "/workspace" });
    setTimeout(() => void useWorkspace.getState().advance(), 50);
  };

  return (
    <div className="rounded-sm border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
          Recent campaigns
        </p>
        <button
          onClick={() => navigate({ to: "/campaigns" })}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-hilti"
        >
          View all →
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {items.map((b) => (
          <button
            key={b.id}
            onClick={() => open(b)}
            className="group rounded-sm border border-border bg-background p-3 text-left transition-colors hover:border-foreground"
          >
            <p className="truncate text-xs font-semibold">{b.campaign}</p>
            <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {b.market} · {b.channels.join(",")}
            </p>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground group-hover:text-hilti">
              {phases[b.id] ?? "brief"} →
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
