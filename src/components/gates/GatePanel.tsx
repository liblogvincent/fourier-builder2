import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/store/workspace";
import type { GateId } from "@/types";

const GATE_COPY: Record<string, { title: string; body: string; reviewerHint: string; discussionPrompt: string }> = {
  H1: {
    title: "Gate H1 · Plan Approval",
    body: "Strategy agent has generated a CampaignPlan. Review the strategy, discuss any concerns with the agent, then approve, request changes, or reject.",
    reviewerHint: "Approving authorizes content generation across all channels and locales.",
    discussionPrompt: "I've drafted the campaign plan. What aspects would you like to discuss? Channel mix? Budget allocation? Audience targeting? I can explain any decision and revise based on your input.",
  },
  H2: {
    title: "Gate H2 · QA Approval",
    body: "QA agent has reviewed all content variants. Review the flagged items, discuss resolutions, then approve or request fixes.",
    reviewerHint: "Approve once all flagged variants are resolved or accepted as-is.",
    discussionPrompt: "QA complete. I found some brand-voice concerns. Would you like me to walk through each one, or shall I auto-fix and show you the changes?",
  },
  "H-legal": {
    title: "Gate H-legal · EU Compliance Review",
    body: "Strategy agent proposed this extra gate because DACH markets require legal sign-off on technical claims.",
    reviewerHint: "Verify torque claims match product spec; confirm no medical/safety claims requiring CE disclosure.",
    discussionPrompt: "I've flagged the technical claims that need legal review. Would you like me to pull the product spec sheet for comparison, or shall we go claim by claim?",
  },
  H3: {
    title: "Gate H3 · Publish Confirm",
    body: "Roll-out agent staged all publishes. Confirm to go live.",
    reviewerHint: "Deterministic publish — no creative drift between approval and ad set.",
    discussionPrompt: "All variants are staged and ready. I can show you the exact ad preview for each market before we publish. Want to spot-check any specific locale or variant?",
  },
  H4: {
    title: "Gate H4 · Promote Learning",
    body: "Insights agent proposes promoting a new skill to the global registry.",
    reviewerHint: "Approving makes the skill active for future campaigns across all markets.",
    discussionPrompt: "This campaign surfaced a pattern I think we should encode as a reusable skill. Let me explain why, and you can decide whether to promote it globally or keep it campaign-scoped.",
  },
};

interface Message {
  id: string;
  from: "agent" | "human";
  text: string;
  timestamp: string;
}

export function GatePanel({ gate }: { gate: GateId }) {
  const decideGate = useWorkspace((s) => s.decideGate);
  const applyFix = useWorkspace((s) => s.applyFix);
  const appliedFixes = useWorkspace((s) => s.appliedFixes);
  const setProposalDisposition = useWorkspace((s) => s.setProposalDisposition);
  const planRationale = useWorkspace((s) => s.plan.rationale);

  const [showSignoff, setShowSignoff] = useState(false);
  const [signoffAction, setSignoffAction] = useState<"approved" | "changes_requested" | "rejected">("approved");
  const [signoffName, setSignoffName] = useState("");
  const [signoffNote, setSignoffNote] = useState("");
  const [signed, setSigned] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [discussionInput, setDiscussionInput] = useState("");
  const [discussionStarted, setDiscussionStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const copy = GATE_COPY[gate] ?? {
    title: `Gate ${gate}`,
    body: "Approve to continue.",
    reviewerHint: "",
    discussionPrompt: "What would you like to discuss?",
  };
  const h2NeedsFix = gate === "H2" && !appliedFixes.has("v_1_de-DE");

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Start discussion with agent's opening message
  const startDiscussion = () => {
    if (discussionStarted) return;
    setDiscussionStarted(true);
    const now = new Date().toLocaleTimeString();
    setMessages([
      {
        id: "agent_open",
        from: "agent",
        text: copy.discussionPrompt,
        timestamp: now,
      },
    ]);
  };

  const sendMessage = () => {
    const text = discussionInput.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString();
    setMessages((prev) => [
      ...prev,
      { id: `human_${Date.now()}`, from: "human", text, timestamp: now },
    ]);
    setDiscussionInput("");

    // Simulate agent response after a brief delay
    setTimeout(() => {
      const responses: Record<string, string> = {
        H1: getH1Response(text, planRationale.decided),
        H2: `Good question. Let me check the flagged variants and get back to you with specifics. The main concern is brand-voice compliance — I found ${text.includes("how many") ? "1 variant" : "some phrases"} that need attention.`,
        "H-legal": `I've cross-referenced the technical claims against the product spec. The torque specification is accurate per the SIW 6AT-A22 datasheet. No medical or safety claims were detected. ${text.includes("CE") ? "CE compliance is confirmed for all DACH markets." : ""}`,
        H3: `All ${useWorkspace.getState().variants.length} variants are staged correctly. Each ad set matches the approved plan — same creative, same targeting, same budget. Ready when you are.`,
        H4: `This skill would prevent the brand-voice violation we saw in this campaign. If promoted globally, future campaigns would automatically flag similar phrases before they reach QA. Impact: ~12 hours saved per campaign.`,
      };
      const resp = responses[gate] || "Let me look into that and get back to you with specifics.";
      const respNow = new Date().toLocaleTimeString();
      setMessages((prev) => [
        ...prev,
        { id: `agent_${Date.now()}`, from: "agent", text: resp, timestamp: respNow },
      ]);
    }, 1000 + Math.random() * 1500);
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
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.from === "human" ? "flex-row-reverse" : ""}`}>
                    <div className={`shrink-0 size-6 rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-white ${
                      m.from === "agent" ? "bg-foreground" : "bg-hilti"
                    }`}>
                      {m.from === "agent" ? "AI" : "U"}
                    </div>
                    <div className={`rounded-sm px-3 py-2 text-xs max-w-[80%] ${
                      m.from === "agent" ? "bg-background border border-border" : "bg-hilti text-white"
                    }`}>
                      <p className="leading-relaxed">{m.text}</p>
                      <p className={`mt-1 font-mono text-[8px] ${m.from === "human" ? "text-white/60" : "text-muted-foreground"}`}>
                        {m.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-border px-4 py-2">
                <input
                  value={discussionInput}
                  onChange={(e) => setDiscussionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask about the plan, suggest changes, discuss tradeoffs…"
                  className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs focus:border-hilti focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!discussionInput.trim()}
                  className="rounded-sm bg-foreground px-3 py-1.5 font-mono text-[10px] font-bold text-white hover:bg-hilti disabled:opacity-30"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>

        {/* H2 auto-fix */}
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

function getH1Response(question: string, planSummary: string): string {
  const q = question.toLowerCase();
  if (q.includes("linkedin") || q.includes("channel")) {
    return `Good question about channels. I chose Meta as the hero channel because contractor segments index 3.2x higher there vs LinkedIn for power-tool campaigns (DACH_Meta_2025_Q3 benchmarks). LinkedIn would add ~€15k to reach the same audience. If you want multi-channel, I can split 70/30 Meta/LinkedIn — would increase budget by ~€12k but give us A/B data on which channel converts better. Want me to revise?`;
  }
  if (q.includes("budget") || q.includes("cost") || q.includes("spend")) {
    return `The €${(142500).toLocaleString()} budget breaks down as: 70% Meta paid-social (€100k), 15% creative production (€21k), 10% localization (€14k), 5% contingency (€7k). Projected 4.35x ROAS based on comparable DACH power-tool campaigns. If you want to reduce, I'd suggest cutting variants from 4 to 3 (saves ~€8k in production) rather than reducing media spend.`;
  }
  if (q.includes("audience") || q.includes("target") || q.includes("who")) {
    return `I'm targeting DACH contractor segment — site foremen and finishing crews, aged 28-55, who value precision and durability over price. This segment over-indexes on Meta (68% daily active) and responds best to technical-feature creative (torque specs, runtime data) rather than lifestyle imagery. If you want to add specifiers/engineers, I'd recommend LinkedIn as a secondary channel.`;
  }
  if (q.includes("kpi") || q.includes("metric") || q.includes("measure")) {
    return `Projected KPIs: 1,861 conversions at €76.30 CPA, 4.35x ROAS, 2.8% CTR (above the 2.1% DACH benchmark for industrial tools). These are plan projections based on comparable campaigns — actual performance depends on creative quality and market conditions. I've built in a 15% variance buffer.`;
  }
  return `That's a fair point. The current plan has ${planSummary.slice(0, 80)}… — I'm happy to revise any aspect. What specifically would you like changed? I can adjust channels, budget split, audience targeting, variant count, or locale strategy.`;
}
