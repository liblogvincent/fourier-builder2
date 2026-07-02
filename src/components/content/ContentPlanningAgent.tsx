import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useWorkspace } from "@/store/workspace";
import { CONTENT_PLANNING_PROMPT } from "@/lib/agent-prompts";

const GUIDANCE = {
  idle: {
    message: "I'm the Content Planning Agent. I handle Epic 2 (CP1-CP4): Creative Concept, Cross-Channel Requirements, Storyboarding, and Figma Mapping. When you're ready, I'll generate the full content plan.",
    suggestions: [
      "Generate Creative Concept (CP1)",
      "Show cross-channel requirements (CP2)",
      "Build storyboard (CP3)",
      "Create Figma board with placeholders (CP4)",
    ],
  },
  generating: {
    message: "Generating the content plan — Creative Concept, asset requirements, storyboard directions, and Figma board structure. This covers what the RMB Content Planning team (Jordon) does today in ~5 days per campaign.",
    suggestions: [],
  },
  done: {
    message: "Content plan is ready. I've generated the Creative Concept (Big Idea, Key Visual, Master Story), cross-channel asset requirements, storyboard directions, and Figma board mapping. Review the tiers below — each one builds on the previous.",
    suggestions: [
      "Explain the Big Idea and creative direction",
      "Show me the cross-channel asset breakdown",
      "What's on the Figma board?",
      "How do the storyboards connect to Tier 2 variations?",
    ],
  },
};

export function ContentPlanningAgent() {
  const phase = useWorkspace((s) => s.phase);
  const brief = useWorkspace((s) => s.brief);
  const hasContent = useWorkspace((s) => s.variants.length > 0);
  const variants = useWorkspace((s) => s.variants);
  const stream = useWorkspace((s) => s.rationaleStream);

  const state = hasContent ? "done" : "idle";
  const guidance = GUIDANCE[state];
  const lastRationale = stream[stream.length - 1];

  const context = useMemo(
    () => ({
      campaign: brief.campaign,
      product: brief.product,
      market: brief.market,
      locales: brief.locales,
      currentPhase: phase,
      phaseLabel: "Content Planning — CP1-CP4",
      variantCount: variants.length,
      lastRationale: lastRationale?.decided ?? "none",
    }),
    [brief.campaign, brief.product, brief.market, brief.locales, phase, variants.length, lastRationale?.decided],
  );

  const contextRef = useRef(context);
  useEffect(() => { contextRef.current = context; }, [context]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent-chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, agentType: "content-planning", context: contextRef.current },
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
        sendMessage({ text: "Walk me through the Creative Concept, cross-channel requirements, storyboard, and Figma board mapping for this campaign. What's the Big Idea?" });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialPromptSent, sendMessage]);

  const busy = status === "submitted" || status === "streaming";

  const handleSend = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="rounded-lg border-l-4 border-l-purple-500 border border-border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 bg-purple-500/[0.04]">
        <div className="flex size-9 items-center justify-center rounded-full bg-purple-500 text-white text-sm font-bold">
          CP
        </div>
        <div>
          <p className="text-sm font-semibold text-gravel">
            Content Planning Agent {busy && <span className="text-purple-500 animate-pulse ml-1">· thinking…</span>}
          </p>
          <p className="text-xs text-muted-foreground">RMB: Jordon · Epic 2 (CP1-CP4) · Today: ~5 days → Target: hours</p>
        </div>
        <span className="ml-auto rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-500">Epic 2</span>
      </div>

      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <p className="text-xs leading-relaxed">{guidance.message}</p>
          <div className="flex flex-wrap gap-1.5">
            {guidance.suggestions.map((s) => (
              <button key={s} onClick={() => handleSend(s)} disabled={busy} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] hover:border-purple-500/40 transition-colors disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
          <details className="mt-3">
            <summary className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">
              View agent prompt →
            </summary>
            <pre className="mt-2 rounded-sm border border-border bg-background p-3 font-mono text-[8px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
              {CONTENT_PLANNING_PROMPT}
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
                <div className={`shrink-0 size-5 rounded-full flex items-center justify-center font-mono text-[7px] font-bold text-white ${isUser ? "bg-hilti" : "bg-purple-500"}`}>
                  {isUser ? "U" : "CP"}
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
          placeholder="Ask about Creative Concept, cross-channel requirements, storyboards, Figma mapping…"
          className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-purple-500/40 focus:outline-none"
          disabled={busy}
        />
        <button onClick={() => handleSend(input)} disabled={!input.trim() || busy} className="rounded-sm bg-purple-500 px-3 py-1.5 font-mono text-[9px] font-bold text-white hover:bg-purple-500/90 disabled:opacity-30">
          Send
        </button>
      </div>
    </div>
  );
}
