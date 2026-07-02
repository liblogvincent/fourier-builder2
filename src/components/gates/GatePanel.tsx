import { useState, useRef, useEffect, useMemo } from "react";
import { useWorkspace } from "@/store/workspace";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { GateId } from "@/types";

/** Maps each gate to the right specialist agent persona for discussion */
function agentForGate(gate: GateId): "campaign-planning" | "content-planning" | "rollout" | undefined {
  if (gate === "H1" || gate === "H2") return "campaign-planning";
  if (gate === "H-C") return "content-planning";
  if (gate === "H3") return "rollout";
  return undefined; // H4 uses Orchestrator (default)
}

const GATE_COPY: Record<string, { title: string; body: string; reviewerHint: string; discussionPrompt: string }> = {
  H1: {
    title: "Gate H1 · Brief Approval",
    body: "Campaign Planning agent has structured the brief. Review the campaign objectives, audience, channels, and budget before strategy generation begins.",
    reviewerHint: "Approving locks the brief and authorizes the Strategy agent to generate the full campaign plan across all 5 workstreams.",
    discussionPrompt: "I've structured the brief. What aspects would you like to discuss? Campaign objectives? Target audience? Budget allocation? Channel selection?",
  },
  H2: {
    title: "Gate H2 · Plan Review",
    body: "Strategy agent has generated the complete Campaign Plan across all 5 workstreams: Paid Media, HOL Journey, Email Strategy, Social/HN, and cross-channel synthesis. Review the plan before content creation begins.",
    reviewerHint: "Approve to authorize content generation. Request changes to revise the strategy.",
    discussionPrompt: "The Campaign Plan is ready. I can walk you through each workstream — paid media channel mix, HOL customer journey, email sequence, or social strategy. What would you like to discuss?",
  },
  "H-C": {
    title: "Gate H-C · Creative Approval",
    body: "Content agent has generated ad copy variants based on the approved plan. Review the creative assets — headlines, body copy, CTAs — before they are localized and built into live platforms.",
    reviewerHint: "Approve to authorize localization and rollout. This is the last gate before creative is built into ad platforms.",
    discussionPrompt: "The creative assets are ready for review. I can show you each variant by locale, explain the creative choices, or walk through the brand-voice QA results. What would you like to see?",
  },
  H3: {
    title: "Gate H3 · QA Disposition",
    body: "Roll-out agent has staged all publishes. QA has validated the built campaign against the approved plan. Review QA results and confirm before go-live.",
    reviewerHint: "Approve to go live. This is the last gate before campaign launch.",
    discussionPrompt: "All variants are staged and QA'd. I can show you the exact ad preview for each market before we publish. Want to spot-check any specific locale or variant?",
  },
  H4: {
    title: "Gate H4 · Promote Learning",
    body: "Insights agent proposes promoting a new skill to the global registry from this campaign's learnings.",
    reviewerHint: "Approving makes the skill active for future campaigns across all markets.",
    discussionPrompt: "This campaign surfaced a pattern I think we should encode as a reusable skill. Let me explain why, and you can decide whether to promote it globally or keep it campaign-scoped.",
  },
};


export function GatePanel({ gate }: { gate: GateId }) {
  const decideGate = useWorkspace((s) => s.decideGate);
  const applyFix = useWorkspace((s) => s.applyFix);
  const appliedFixes = useWorkspace((s) => s.appliedFixes);
  const setProposalDisposition = useWorkspace((s) => s.setProposalDisposition);
  const planRationale = useWorkspace((s) => s.plan.rationale);
  const brief = useWorkspace((s) => s.brief);
  const variants = useWorkspace((s) => s.variants);
  const qaResults = useWorkspace((s) => s.qaResults);

  const [showSignoff, setShowSignoff] = useState(false);
  const [signoffAction, setSignoffAction] = useState<"approved" | "changes_requested" | "rejected">("approved");
  const [signoffName, setSignoffName] = useState("");
  const [signoffNote, setSignoffNote] = useState("");
  const [signed, setSigned] = useState(false);

  const [discussionInput, setDiscussionInput] = useState("");
  const [discussionStarted, setDiscussionStarted] = useState(false);
  const [openingSent, setOpeningSent] = useState(false);

  const agentType = agentForGate(gate);

  // Build context for the discussion AI
  const context = useMemo(
    () => ({
      campaign: brief.campaign,
      product: brief.product,
      market: brief.market,
      locales: brief.locales,
      currentPhase: gate,
      phaseLabel: `Gate ${gate} discussion`,
      variantCount: variants.length,
      qaSummary: qaResults.length > 0 ? `${qaResults.filter(r => r.judge.verdict === "pass").length}/${qaResults.length} passed` : "n/a",
      lastRationale: planRationale?.decided ?? "none",
    }),
    [brief.campaign, brief.product, brief.market, brief.locales, gate, variants.length, qaResults, planRationale?.decided],
  );

  const contextRef = useRef(context);
  useEffect(() => { contextRef.current = context; }, [context]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent-chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, agentType, context: contextRef.current },
        }),
      }),
    [agentType],
  );

  const { messages: aiMessages, sendMessage: aiSend, status: aiStatus } = useChat({ transport });

  const aiBusy = aiStatus === "submitted" || aiStatus === "streaming";

  // Send the static opening message once, then hand off to AI for follow-ups
  const sendDiscussionMessage = () => {
    const text = discussionInput.trim();
    if (!text || aiBusy) return;
    setDiscussionInput("");
    // First message in thread: send opening prompt context
    if (!openingSent) {
      setOpeningSent(true);
      aiSend({ text: `Context: ${copy.discussionPrompt}\n\nUser question: ${text}` });
    } else {
      aiSend({ text });
    }
  };
  const chatEndRef = useRef<HTMLDivElement>(null);

  const copy = GATE_COPY[gate] ?? {
    title: `Gate ${gate}`,
    body: "Approve to continue.",
    reviewerHint: "",
    discussionPrompt: "What would you like to discuss?",
  };
  const h2NeedsFix = gate === "H3" && !appliedFixes.has("v_1_de-DE");

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  // Start discussion — the first message is the static prompt; subsequent are AI
  const startDiscussion = () => {
    if (discussionStarted) return;
    setDiscussionStarted(true);
    // Send the opening prompt to AI to get a contextual first response
    aiSend({ text: copy.discussionPrompt });
  };

  const openSignoff = (action: "approved" | "changes_requested" | "rejected") => {
    setSignoffAction(action);
    setShowSignoff(true);
    setSigned(false);
    setSignoffName("");
    setSignoffNote("");
  };

  const confirmSignoff = () => {
    if (!signoffName.trim()) return;
    setSigned(true);
    setTimeout(() => {
      if (gate === "H4") setProposalDisposition(signoffAction === "approved" ? "promoted" : "rejected");
      decideGate(gate, signoffAction, signoffNote);
      setShowSignoff(false);
    }, 1200);
  };

  return (
    <>
      <div className="sticky bottom-0 z-20 -mx-8 mt-8 border-t-2 border-hilti bg-white px-8 py-6 shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{copy.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
            {copy.reviewerHint && (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-foreground/60">
                {copy.reviewerHint}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse rounded-full bg-hilti" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-hilti">Required action</span>
          </div>
        </div>

        {/* Discussion thread */}
        <div className="mb-4 rounded-sm border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Discussion
            </span>
            {!discussionStarted && (
              <button
                onClick={startDiscussion}
                className="font-mono text-[10px] uppercase tracking-wider text-hilti hover:underline"
              >
                Start discussion →
              </button>
            )}
          </div>
          {discussionStarted && (
            <>
              <div className="max-h-48 overflow-y-auto p-4 space-y-3">
                {aiMessages.map((m) => {
                  const isUser = m.role === "user";
                  const text = typeof m.content === "string" ? m.content : (m.parts?.map((p: any) => p.text ?? "").join("") ?? "");
                  return (
                    <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                      <div className={`shrink-0 size-6 rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-white ${
                        isUser ? "bg-hilti" : "bg-foreground"
                      }`}>
                        {isUser ? "U" : "AI"}
                      </div>
                      <div className={`rounded-sm px-3 py-2 text-xs max-w-[80%] ${
                        isUser ? "bg-hilti text-white" : "bg-background border border-border"
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
                      </div>
                    </div>
                  );
                })}
                {aiBusy && (
                  <div className="flex gap-3">
                    <div className="shrink-0 size-6 rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-white bg-foreground">AI</div>
                    <div className="rounded-sm px-3 py-2 text-xs bg-background border border-border">
                      <span className="animate-pulse text-muted-foreground">Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-border px-4 py-2">
                <input
                  value={discussionInput}
                  onChange={(e) => setDiscussionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendDiscussionMessage()}
                  placeholder="Ask about the plan, suggest changes, discuss tradeoffs…"
                  className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-hilti focus:outline-none"
                  disabled={aiBusy}
                />
                <button
                  onClick={sendDiscussionMessage}
                  disabled={!discussionInput.trim() || aiBusy}
                  className="rounded-sm bg-foreground px-3 py-1.5 font-mono text-[10px] font-bold text-white hover:bg-hilti disabled:opacity-30"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>

        {/* H3 auto-fix */}
        {h2NeedsFix && (
          <div className="mb-4 flex items-center justify-between rounded-sm border border-hilti/20 bg-hilti-soft px-3 py-2 text-xs">
            <span>1 unresolved blocker on v_1_de-DE</span>
            <button
              onClick={() => applyFix("v_1_de-DE")}
              className="font-mono text-[10px] font-bold uppercase tracking-wider text-hilti underline underline-offset-2"
            >
              Apply auto-fix
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => openSignoff("rejected")}
            className="h-12 rounded-sm border border-border bg-white text-sm font-bold transition-colors hover:bg-red/5 hover:border-red"
          >
            ✗ Reject
          </button>
          <button
            onClick={() => openSignoff("changes_requested")}
            className="h-12 rounded-sm border border-border bg-white text-sm font-bold transition-colors hover:bg-amber/5 hover:border-amber"
          >
            ↻ Request Changes
          </button>
          <button
            disabled={h2NeedsFix}
            onClick={() => openSignoff("approved")}
            className="h-12 rounded-sm bg-hilti text-sm font-bold text-white shadow-lg transition-colors hover:bg-hilti/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✓ Approve & Sign
          </button>
        </div>
      </div>

      {/* E-Signature Modal */}
      {showSignoff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border-2 border-border bg-white shadow-2xl">
            {!signed ? (
              <>
                <div className="border-b border-border px-6 py-4">
                  <h3 className="text-lg font-bold tracking-tight">
                    {signoffAction === "approved" ? "✓ Approve & Sign" : signoffAction === "changes_requested" ? "↻ Request Changes" : "✗ Reject"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {copy.title} — {gate}
                  </p>
                </div>
                <div className="space-y-4 p-6">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Your name <span className="text-hilti">*</span>
                    </label>
                    <input
                      value={signoffName}
                      onChange={(e) => setSignoffName(e.target.value)}
                      placeholder="Type your full name to sign"
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-hilti focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Note (optional)
                    </label>
                    <textarea
                      value={signoffNote}
                      onChange={(e) => setSignoffNote(e.target.value)}
                      placeholder={
                        signoffAction === "approved" ? "e.g., Plan looks good. Proceed to Content." :
                        signoffAction === "changes_requested" ? "e.g., Add LinkedIn with 20% budget. Re-run." :
                        "e.g., Budget too high for this quarter. Needs re-scoping."
                      }
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-hilti focus:outline-none"
                      rows={3}
                    />
                  </div>
                  <div className="rounded-sm border border-border bg-background px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Signature preview</p>
                    <p className="mt-1 font-mono text-sm font-bold italic">
                      {signoffName || "—"}
                    </p>
                    <p className="font-mono text-[9px] text-muted-foreground">
                      {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 border-t border-border px-6 py-4">
                  <button
                    onClick={() => setShowSignoff(false)}
                    className="flex-1 h-10 rounded-sm border border-border bg-white text-sm font-bold hover:bg-black/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSignoff}
                    disabled={!signoffName.trim()}
                    className={`flex-1 h-10 rounded-sm text-sm font-bold text-white disabled:opacity-30 ${
                      signoffAction === "approved" ? "bg-emerald hover:bg-emerald/90" :
                      signoffAction === "changes_requested" ? "bg-amber hover:bg-amber/90" :
                      "bg-red hover:bg-red/90"
                    }`}
                  >
                    Sign & Confirm
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald/10">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-lg font-bold">Signed</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {signoffName} · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {signoffAction === "approved" ? "Proceeding to next phase…" : "Returning for revision…"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
