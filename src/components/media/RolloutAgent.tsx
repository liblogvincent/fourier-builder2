import { useState } from "react";
import { useWorkspace } from "@/store/workspace";

const GUIDANCE = {
  idle: {
    message: "I'm the Rollout & Optimization Agent. I handle Epic 4 (R1-R11: publishing, localization, ad platform builds, QA) and Epic 5 (OPT1-OPT3: performance optimization). When your campaign reaches the rollout phase, I'll track every publish and flag issues.",
    suggestions: [
      "What's the publishing status?",
      "Show UTM tracking",
      "Run the QA dashboard",
      "What optimizations are available?",
    ],
  },
  publishing: {
    message: "Rollout is in progress. I'm tracking publishes to Meta, checking UTMs, running QA, and monitoring sync status. All connector calls are simulated in this prototype.",
    suggestions: [
      "Show me the publishing status per platform",
      "Are there any QA failures?",
      "What's the sync status?",
    ],
  },
  done: {
    message: "Rollout complete. All variants published (simulated). QA passed with minor brand-voice flags resolved. Optimization recommendations are available based on the campaign performance data.",
    suggestions: [
      "Show optimization recommendations",
      "What skills should we promote to H4?",
      "How did this campaign compare to benchmarks?",
    ],
  },
};

export function RolloutAgent() {
  const phase = useWorkspace((s) => s.phase);
  const connectorCalls = useWorkspace((s) => s.connectorCalls);
  const qaResults = useWorkspace((s) => s.qaResults);
  const [messages, setMessages] = useState<{ from: "agent" | "user"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const hasPublishing = connectorCalls.length > 0;
  const hasQA = qaResults.length > 0;
  const state = hasPublishing ? (hasQA ? "done" : "publishing") : "idle";
  const guidance = GUIDANCE[state];

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      const q = text.toLowerCase();
      let resp = "Let me check the latest data and get back to you. ";
      if (q.includes("publish") || q.includes("status")) {
        const ok = connectorCalls.filter((c) => c.status === "ok").length;
        resp = `Publishing status: ${ok}/${connectorCalls.length} connector calls OK. All variants published to meta_ads_api. 0 errors, 0 pending. All connector calls are simulated in this prototype — real publishing requires Meta/Google/LinkedIn API connections (R2).`;
      } else if (q.includes("qa") || q.includes("fail")) {
        const fails = qaResults.filter((r) => r.judge.verdict === "fail").length;
        resp = `QA Dashboard: ${qaResults.length} variants checked. ${fails} brand-voice violations (all resolved). 4 deterministic checks per variant: character count, CTA list, safety pictogram, UTM — all passing. The full 54-point QA (backlog R11) will be implemented in R1.`;
      } else if (q.includes("utm")) {
        resp = `UTM Tracking: All ${connectorCalls.length} UTMs generated per Hilti naming convention. Format: utm_source=meta&utm_medium=paid_social&utm_campaign=camp_04&utm_content=v_N_de-XX. All pass validation. Generated during Rollout phase (R10).`;
      } else if (q.includes("sync")) {
        resp = `Sync Status: All platforms showing green. Planned budget (€142,500) matches published budget. Creative variants match approved plan. Targeting settings verified. ⚠ Live platform sync is simulated — real API connections needed for production verification (R2).`;
      } else if (q.includes("optim")) {
        resp = `Optimization Recommendations (Epic 5, OPT1-OPT3):\n1. Paid Media: Shift 10% budget from variant 1 to variant 3 — variant 3 has 2.3× higher CTR in de-DE.\n2. HOL Landing Page: Add "trusted by" social proof section above the fold — benchmark data shows 18% conversion lift.\n3. Banner: Replace sidebar banner with sticky footer format — 3× higher visibility on mobile.\n\nThese are mock recommendations for the prototype. Real optimization requires live performance data from ad platforms and Google Analytics (R2).`;
      }
      setMessages((prev) => [...prev, { from: "agent", text: resp }]);
    }, 800);
  };

  return (
    <div className="rounded-sm border-2 border-blue/30 bg-white">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-blue/5">
        <div className="flex size-7 items-center justify-center rounded-full bg-blue text-white">
          <span className="font-mono text-[9px] font-bold">R</span>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
            Rollout & Optimization Agent <span className="text-blue/60">· Epic 4+5 · R1-R11, OPT1-OPT3</span>
          </p>
          <p className="font-mono text-[8px] text-muted-foreground">
            RMB: Erin Shier · Today: 2+ weeks campaign build + 1 week optimization → Target: hours
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <p className="text-xs leading-relaxed">{guidance.message}</p>
          <div className="flex flex-wrap gap-1.5">
            {guidance.suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] hover:border-blue/40 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 size-5 rounded-full flex items-center justify-center font-mono text-[7px] font-bold text-white ${m.from === "agent" ? "bg-blue" : "bg-hilti"}`}>
                {m.from === "agent" ? "R" : "U"}
              </div>
              <div className={`rounded-sm px-3 py-2 text-xs max-w-[85%] ${m.from === "agent" ? "bg-background border border-border" : "bg-hilti text-white"}`}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about publishing, QA, UTM tracking, sync status, optimization…"
          className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-blue/40 focus:outline-none"
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="rounded-sm bg-blue px-3 py-1.5 font-mono text-[9px] font-bold text-white hover:bg-blue/90 disabled:opacity-30">
          Send
        </button>
      </div>
    </div>
  );
}
