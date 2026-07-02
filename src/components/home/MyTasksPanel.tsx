import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/store/workspace";
import {
  getAllBriefPhases,
  getRole,
  listCampaigns,
  setRole as persistRole,
  type StoredRole,
} from "@/lib/persistence";
import { GATE_LABEL, ROLE_GATES, ROLE_LABEL } from "@/lib/roles";
import type { Brief, Phase } from "@/types";

interface Task {
  brief: Brief;
  gate: string;
  status: "waiting" | "queued";
}

export function MyTasksPanel() {
  const [role, setRoleState] = useState<StoredRole>("campaign_manager");
  const [campaigns, setCampaigns] = useState<Brief[]>([]);
  const [phases, setPhases] = useState<Record<string, string>>({});
  const activePhase = useWorkspace((s) => s.phase);
  const activeBriefId = useWorkspace((s) => s.brief.id);
  const loadBrief = useWorkspace((s) => s.loadBrief);
  const navigate = useNavigate();

  useEffect(() => {
    setRoleState(getRole());
    setCampaigns(listCampaigns());
    setPhases(getAllBriefPhases());
  }, [activePhase]);

  const tasks = useMemo<Task[]>(() => {
    const gates = ROLE_GATES[role];
    const out: Task[] = [];
    for (const b of campaigns) {
      const p = (b.id === activeBriefId ? activePhase : (phases[b.id] as Phase)) ?? "brief";
      for (const g of gates) {
        if (p === g) out.push({ brief: b, gate: g, status: "waiting" });
      }
    }
    // If nothing is waiting, show upcoming queued gate for the active campaign
    if (out.length === 0 && campaigns.length > 0) {
      const b = campaigns.find((c) => c.id === activeBriefId) ?? campaigns[0];
      out.push({ brief: b, gate: gates[0], status: "queued" });
    }
    return out;
  }, [role, campaigns, phases, activePhase, activeBriefId]);

  const changeRole = (r: StoredRole) => {
    setRoleState(r);
    persistRole(r);
  };

  const openTask = (t: Task) => {
    if (t.brief.id !== activeBriefId) loadBrief(t.brief);
    void navigate({ to: "/workspace" });
    if (t.status === "queued") {
      setTimeout(() => void useWorkspace.getState().advance(), 50);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-sm border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
          My tasks
        </p>
        <select
          value={role}
          onChange={(e) => changeRole(e.target.value as StoredRole)}
          className="rounded-sm border border-border bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider"
        >
          {(Object.keys(ROLE_LABEL) as StoredRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        Role: {ROLE_LABEL[role]} · gates {ROLE_GATES[role].join(", ")}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.length === 0 && (
          <div className="rounded-sm border border-dashed border-border bg-background p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              No open tasks for this role.
            </p>
          </div>
        )}
        {tasks.map((t, i) => (
          <button
            key={`${t.brief.id}-${t.gate}-${i}`}
            onClick={() => openTask(t)}
            className="group flex w-full items-start gap-3 rounded-sm border border-border bg-background p-3 text-left transition-colors hover:border-foreground"
          >
            <div
              className={`mt-1 size-2 shrink-0 rounded-full ${
                t.status === "waiting" ? "bg-hilti animate-pulse" : "bg-black/20"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
                  {t.gate}
                </span>
                <span className="truncate text-xs font-medium">
                  {GATE_LABEL[t.gate] ?? "Review"}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                {t.brief.campaign}
              </p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {t.brief.market} · {t.brief.locales.join("/")} · {t.status}
              </p>
            </div>
            <span className="shrink-0 self-center font-mono text-[10px] uppercase text-muted-foreground group-hover:text-hilti">
              Open →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
