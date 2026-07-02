import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useWorkspace } from "@/store/workspace";
import { CAMPAIGN_PLANNING_PROMPT } from "@/lib/agent-prompts";
import type { Phase } from "@/types";

const PHASE_GUIDANCE: Record<string, { agent: string; message: string; suggestions: string[] }> = {
  brief: {
    agent: "Campaign Planning",
    message: "I'm the Campaign Planning Agent (Epic 1). Drop your brief below or describe your campaign idea here — I'll structure it and generate the full strategy across all 5 workstreams: Paid Media, HOL Journey, Email, Social/HN, and cross-channel synthesis.",
    suggestions: ["TE 70, 10% off, DACH, €50k, Q4"],
  },
  planning: {
    agent: "Campaign Planning",
    message: "I'm analyzing your brief and generating the campaign plan — channel mix, budget allocation, audience targeting, and variant strategy. This takes a moment...",
    suggestions: [],
  },
  H1: {
    agent: "Campaign Planning",
    message: "The brief has been structured. Review the campaign objectives, target audience, hero product, offer, and high-level channel direction. Approve to authorize full strategy generation across all 5 workstreams.",
    suggestions: [
      "Is the audience definition complete?",
      "Should we add or remove channels?",
      "Is the budget range appropriate?",
    ],
  },
  H2: {
    agent: "Campaign Planning",
    message: "The Campaign Plan (Epic 1, A0-A5) is ready. This covers 5 RMB workstreams: Paid Media Campaign Planning (A1-A2), HOL Customer Journey (A3), Email Campaign Planning (A4), and Organic Social/HN Campaign Planning (A5). I recommend discussing each workstream before approving at H2.",
    suggestions: [
      "Show me the paid media plan (channel mix, budget, KPIs)",
      "What's the HOL customer journey?",
      "Walk me through the email strategy",
      "What's the organic social plan?",
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
  "H-C": {
    agent: "Content",
    message: "The creative assets are ready for review. Review the ad copy variants before they are localized and built into live platforms. This is the last gate before creative goes to build.",
    suggestions: [
      "Show me each variant by locale",
      "Walk through the brand-voice QA results",
      "Are there any compliance concerns?",
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
    message: "I've run structural checks and a brand-voice review on all variants. The built campaign has been validated against the approved plan. Any flagged items are shown above.",
    suggestions: ["Show me the full QA report", "What needs to be fixed?"],
  },
};

export function AgentDiscussion() {
  const phase = useWorkspace((s) => s.phase);
  const brief = useWorkspace((s) => s.brief);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const variants = useWorkspace((s) => s.variants);
  const qaResults = useWorkspace((s) => s.qaResults);
  const stream = useWorkspace((s) => s.rationaleStream);

  const guidance = PHASE_GUIDANCE[phase];
  const agentName = agentBusy || guidance?.agent || "Orchestrator";
  const lastRationale = stream[stream.length - 1];

  const context = useMemo(
    () => ({
      campaign: brief.campaign,
      product: brief.product,
      market: brief.market,
      locales: brief.locales,
      currentPhase: phase,
      phaseLabel: guidance?.message ?? "",
      variantCount: variants.length,
      qaSummary: qaResults.length > 0 ? `${qaResults.filter(r => r.judge.verdict === "pass").length}/${qaResults.length} passed` : "n/a",
      lastRationale: lastRationale?.decided ?? "none",
    }),
    [brief.campaign, brief.product, brief.market, brief.locales, phase, guidance?.message, variants.length, qaResults, lastRationale?.decided],
  );

  const contextRef = useRef(context);
  useEffect(() => { contextRef.current = context; }, [context]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent-chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, agentType: "campaign-planning", context: contextRef.current },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  // Auto-fire initial prompt on mount
  useEffect(() => {
    if (!initialPromptSent && guidance && guidance.suggestions.length > 0) {
      setInitialPromptSent(true);
      const timer = setTimeout(() => {
        sendMessage({ text: `Introduce yourself and explain what you're working on for this phase: ${phase}. Briefly summarize the campaign context and suggest what we should discuss.` });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, initialPromptSent, guidance, sendMessage]);

  const busy = status === "submitted" || status === "streaming";

  const handleSend = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="rounded-lg border-l-4 border-l-maize border border-border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 bg-maize/5">
        <div className="flex size-9 items-center justify-center rounded-full bg-gravel text-white text-sm font-bold">
          {agentName[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-gravel">
            {agentName} {busy && <span className="text-hilti animate-pulse ml-1">· thinking…</span>}
          </p>
          <p className="text-xs text-muted-foreground">Campaign Planning Agent · Phase: {phase}</p>
        </div>
        <span className="ml-auto rounded-full bg-maize/20 px-2.5 py-1 text-[11px] font-medium text-gravel">Epic 1</span>
      </div>

      {/* Agent guidance + suggestions (shown when no AI messages yet) */}
      {messages.length === 0 && guidance && (
        <div className="p-5 space-y-3">
          <p className="text-sm leading-relaxed text-gravel">{guidance.message}</p>
          {guidance.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {guidance.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={busy}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs hover:border-maize hover:bg-maize/5 transition-all disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <details className="mt-3">
            <summary className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">
              View agent prompt →
            </summary>
            <pre className="mt-2 rounded-sm border border-border bg-background p-3 font-mono text-[8px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
              {CAMPAIGN_PLANNING_PROMPT}
            </pre>
          </details>
        </div>
      )}

      {/* AI chat messages */}
      {messages.length > 0 && (
        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isUser = m.role === "user";
            const text = typeof m.content === "string" ? m.content : (m.parts?.map((p: any) => p.text ?? "").join("") ?? "");
            return (
              <div key={m.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`shrink-0 size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isUser ? "bg-hilti" : "bg-gravel"}`}>
                  {isUser ? "U" : "AI"}
                </div>
                <div className={`rounded-lg px-4 py-2.5 text-sm max-w-[80%] ${isUser ? "bg-hilti text-white" : "bg-maize/10 border border-maize/20"}`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder={phase === "H1" ? "Discuss the brief before approving…" : phase === "H2" ? "Discuss the plan before approving…" : phase === "brief" ? "Describe your campaign idea…" : "Ask the agent a question…"}
          className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-hilti focus:outline-none"
          disabled={busy}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || busy}
          className="rounded-sm bg-foreground px-3 py-1.5 font-mono text-[9px] font-bold text-white hover:bg-hilti disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
}
