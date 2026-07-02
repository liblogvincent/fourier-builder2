import type { AgentName, DecisionRationale, Phase } from "@/types";

const KEY = "luban.runHistory";

export type RunEventStatus = "running" | "ok" | "error" | "skipped";

export interface RunEvent {
  id: string;
  campaignId: string;
  phase: Phase;
  agent?: AgentName;
  mode: "live" | "demo";
  status: RunEventStatus;
  startedAt: number; // epoch ms
  endedAt?: number;
  durationMs?: number;
  summary?: string;
  error?: string;
  rationaleId?: string;
  attempt: number;
}

type Store = Record<string, RunEvent[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(s: Store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

export function listRunEvents(campaignId: string): RunEvent[] {
  const all = read()[campaignId] ?? [];
  return [...all].sort((a, b) => a.startedAt - b.startedAt);
}

export function appendRunEvent(ev: RunEvent) {
  const s = read();
  const list = s[ev.campaignId] ?? [];
  s[ev.campaignId] = [...list, ev];
  write(s);
}

export function updateRunEvent(campaignId: string, id: string, patch: Partial<RunEvent>) {
  const s = read();
  const list = s[campaignId] ?? [];
  s[campaignId] = list.map((e) => (e.id === id ? { ...e, ...patch } : e));
  write(s);
}

export function clearRunEvents(campaignId: string) {
  const s = read();
  delete s[campaignId];
  write(s);
}

export function nextAttempt(campaignId: string, phase: Phase): number {
  const list = listRunEvents(campaignId).filter((e) => e.phase === phase);
  return list.length + 1;
}
