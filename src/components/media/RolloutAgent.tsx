import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useWorkspace } from "@/store/workspace";
import { ROLLOUT_PROMPT } from "@/lib/agent-prompts";

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
  const brief = useWorkspace((s) => s.brief);
  const connectorCalls = useWorkspace((s) => s.connectorCalls);
  const qaResults = useWorkspace((s) => s.qaResults);
  const variants = useWorkspace((s) => s.variants);
  const stream = useWorkspace((s) => s.rationaleStream);

  const hasPublishing = connectorCalls.length > 0;
  const hasQA = qaResults.length > 0;
  const state = hasPublishing ? (hasQA ? "done" : "publishing") : "idle";
  const guidance = GUIDANCE[state];
  const lastRationale = stream[stream.length - 1];

  const context = useMemo(
    () => ({
      campaign: brief.campaign,
      product: brief.product,
      market: brief.market,
      locales: brief.locales,
      currentPhase: phase,
      phaseLabel: "Rollout & Optimization — Epic 4+5",
      variantCount: variants.length,
      qaSummary: hasQA ? `${qaResults.filter(r => r.judge.verdict === "pass").length}/${qaResults.length} passed` : "n/a",
      lastRationale: lastRationale?.decided ?? "none",
    }),
    [brief.campaign, brief.product, brief.market, brief.locales, phase, variants.length, hasQA, qaResults, lastRationale?.decided],
  );

  const contextRef = useRef(context);
  useEffect(() => { contextRef.current = context; }, [context]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent-chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, agentType: "rollout", context: contextRef.current },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  // Auto-fire initial prompt on mount
  useEffect(() => {
    if (!initialPromptSent) {
      setInitialPromptSent(true);
      const timer = setTimeout(() => {
        const pubCount = connectorCalls.length;
        const qaCount = qaResults.length;
        sendMessage({ text: `Give me a status update. Publishing: ${pubCount} connector calls. QA: ${qaCount} variants checked. What's the current state and what should we focus on?` });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialPromptSent, sendMessage, connectorCalls.length, qaResults.length]);

  const busy = status === "submitted" || status === "streaming";

  const handleSend = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="rounded-sm border-2 border-blue-500/30 bg-white">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-blue-500/5">
        <div className="flex size-7 items-center justify-center rounded-full bg-blue-500 text-white">
          <span className="font-mono text-[9px] font-bold">R</span>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
            Rollout & Optimization Agent <span className="text-blue-500/60">· Epic 4+5 · R1-R11, OPT1-OPT3</span>
            {busy && <span className="text-blue-500 animate-pulse ml-1">· thinking…</span>}
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
              <button key={s} onClick={() => handleSend(s)} disabled={busy} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] hover:border-blue-500/40 transition-colors disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
          <details className="mt-3">
            <summary className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">
              View agent prompt →
            </summary>
            <pre className="mt-2 rounded-sm border border-border bg-background p-3 font-mono text-[8px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
              {ROLLOUT_PROMPT}
            </pre>
          </details>
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isUser = m.role === "user";
            const text = typeof m.content === "string" ? m.content : (m.parts?.map((p: any) => p.text ?? "").join("") ?? "");
            return (
              <div key={m.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`shrink-0 size-5 rounded-full flex items-center justify-center font-mono text-[7px] font-bold text-white ${isUser ? "bg-hilti" : "bg-blue-500"}`}>
                  {isUser ? "U" : "R"}
                </div>
                <div className={`rounded-sm px-3 py-2 text-xs max-w-[85%] ${isUser ? "bg-hilti text-white" : "bg-background border border-border"}`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask about publishing, QA, UTM tracking, sync status, optimization…"
          className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-blue-500/40 focus:outline-none"
          disabled={busy}
        />
        <button onClick={() => handleSend(input)} disabled={!input.trim() || busy} className="rounded-sm bg-blue-500 px-3 py-1.5 font-mono text-[9px] font-bold text-white hover:bg-blue-500/90 disabled:opacity-30">
          Send
        </button>
      </div>
    </div>
  );
}
