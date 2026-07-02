import { useState } from "react";
import { useWorkspace } from "@/store/workspace";
import type { Phase } from "@/types";

const PHASE_GUIDANCE: Record<string, { agent: string; message: string; suggestions: string[] }> = {
  brief: {
    agent: "Orchestrator",
    message: "I'm ready to structure your campaign brief. Paste your brief above or type a campaign idea — I'll extract the key details and prepare it for the Strategy agent.",
    suggestions: ["TE 70, 10% off, DACH, €50k, Q4"],
  },
  planning: {
    agent: "Strategy",
    message: "I'm analyzing your brief and generating the campaign plan — channel mix, budget allocation, audience targeting, and variant strategy. This takes a moment...",
    suggestions: [],
  },
  H1: {
    agent: "Orchestrator",
    message: "The Strategy agent has generated the CampaignPlan. Review the plan above — you can export it as JSON or view it as a presentation. I recommend discussing it before approving.",
    suggestions: [
      "Why did you choose Meta as the hero channel?",
      "What's the budget breakdown per channel?",
      "How did you decide on 4 variants?",
      "What are the projected KPIs?",
    ],
  },
  content: {
    agent: "Content",
    message: "I've generated ad copy variants based on the approved plan. You can see them above and in the Content workspace. Would you like me to explain the creative choices?",
    suggestions: [
      "Explain the creative angles you chose",
      "Show me the character counts per variant",
      "Can you generate an image concept for variant 1?",
    ],
  },
  localization: {
    agent: "Localization",
    message: "I've adapted all variants to the target locales. I made market-specific adjustments where needed — de-CH leads with durability instead of safety, and fr-CH is fully translated.",
    suggestions: [
      "What changes did you make for the Swiss market?",
      "Are SKU codes preserved across all locales?",
    ],
  },
  qa: {
    agent: "QA",
    message: "I've run structural checks and a brand-voice review on all variants. Any flagged items are shown above.",
    suggestions: ["Show me the full QA report", "What needs to be fixed?"],
  },
};

export function AgentDiscussion() {
  const phase = useWorkspace((s) => s.phase);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const [messages, setMessages] = useState<{ from: "agent" | "user"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const guidance = PHASE_GUIDANCE[phase];
  const agentName = agentBusy || guidance?.agent || "Orchestrator";

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    // Simulate agent response
    setTimeout(() => {
      const responses: Record<string, string> = {
        "why did you choose meta": `I chose Meta as the hero channel because contractor segments in DACH index 3.2× higher on Meta vs LinkedIn for power-tool campaigns (DACH_Meta_2025_Q3 benchmarks). Meta also offers better creative format flexibility for video + static combinations. LinkedIn would add ~€15k to reach the same audience size. If you want multi-channel, I can split 70/30 Meta/LinkedIn — would increase budget by ~€12k.`,
        "budget": `The €142,500 budget breaks down as: 70% Meta paid-social (€100k), 15% creative production (€21k), 10% localization (€14k), 5% contingency (€7k). Projected ROAS is 4.35× based on comparable DACH power-tool campaigns. If you want to reduce, I'd suggest cutting variants from 4 to 3 (saves ~€8k) rather than reducing media spend.`,
        "kpi": `Projected KPIs: 1,861 conversions at €76.30 CPA, 4.35× ROAS, 2.8% CTR (above the 2.1% DACH benchmark for industrial tools). These are plan projections — actual performance depends on creative quality and market conditions. I've built in a 15% variance buffer.`,
        "variant": `I chose 4 base variants to give statistical power for first-pass creative learning. Each variant tests a different angle: torque control (technical), runtime/battery life (practical), jobsite durability (emotional), and total cost of ownership (financial). With 4 variants × 4 locales = 16 total ads, we can identify which message resonates best per market within the first 2 weeks.`,
        "explain": `I generated 4 creative concepts focused on torque-control and dust-compliance for the DACH contractor segment. Each concept emphasizes a different value proposition: precision, durability, productivity, and platform compatibility. The brand voice follows Hilti v4.2 guidelines — no hype adjectives, technical-first messaging.`,
        "change": `Let me walk through the market-specific changes. For de-CH (Switzerland German), I swapped safety-led messaging for durability-led because CH contractor segments over-index on heritage and longevity cues (CH_Market_Heritage_Playbook_v2). For fr-CH, I did a full French translation while preserving SKU codes. de-AT is lexically identical to de-DE with no changes needed.`,
        "qa report": `Here's the QA summary: 15 of 16 variants passed all checks. Variant v_1_de-DE was flagged for using "revolutionäre" which is on the Hilti brand-voice blacklist for iterative hardware updates. The suggested replacement is "leistungsstarke" (high-performance). Would you like me to auto-fix it?`,
      };
      const q = text.toLowerCase();
      let response = "That's a great question. Let me look into the details and get back to you with specifics. In the meantime, would you like to review any other aspect of the ";
      response += phase === "H1" ? "plan?" : phase === "content" ? "creative concepts?" : "output?";
      for (const [key, val] of Object.entries(responses)) {
        if (q.includes(key)) { response = val; break; }
      }
      setMessages((prev) => [...prev, { from: "agent", text: response }]);
    }, 800 + Math.random() * 1200);
  };

  return (
    <div className="rounded-sm border border-border bg-white">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-full bg-foreground text-white">
          <span className="font-mono text-[9px] font-bold">{agentName[0]}</span>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
            {agentName} Agent {agentBusy && <span className="text-hilti animate-pulse">· thinking…</span>}
          </p>
          <p className="font-mono text-[8px] text-muted-foreground">Phase: {phase}</p>
        </div>
      </div>

      {/* Agent guidance + suggestions */}
      {messages.length === 0 && guidance && (
        <div className="p-4 space-y-3">
          <p className="text-xs leading-relaxed">{guidance.message}</p>
          {guidance.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {guidance.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] hover:border-foreground hover:bg-foreground/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 size-5 rounded-full flex items-center justify-center font-mono text-[7px] font-bold text-white ${m.from === "agent" ? "bg-foreground" : "bg-hilti"}`}>
                {m.from === "agent" ? "AI" : "U"}
              </div>
              <div className={`rounded-sm px-3 py-2 text-xs max-w-[85%] ${m.from === "agent" ? "bg-background border border-border" : "bg-hilti text-white"}`}>
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder={phase === "H1" ? "Discuss the plan before approving…" : phase === "brief" ? "Describe your campaign idea…" : "Ask the agent a question…"}
          className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-hilti focus:outline-none"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="rounded-sm bg-foreground px-3 py-1.5 font-mono text-[9px] font-bold text-white hover:bg-hilti disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
}
