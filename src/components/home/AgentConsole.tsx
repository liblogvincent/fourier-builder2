import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace, phaseLabel } from "@/store/workspace";
import { listCampaigns } from "@/lib/persistence";
import type { GateId } from "@/types";
import { Send, Sparkles } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";

const STARTERS = [
  "Plan the Nuron launch for DE, AT, and CH",
  "What's blocking this campaign?",
  "Run the next step",
  "Approve the current gate",
];

const ACTION_RE = /\[ACTION:([A-Z_]+)(?::([^\]]+))?\]/g;

export function AgentConsole() {
  const navigate = useNavigate();
  const phase = useWorkspace((s) => s.phase);
  const brief = useWorkspace((s) => s.brief);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const rationaleStream = useWorkspace((s) => s.rationaleStream);
  const gateDecisions = useWorkspace((s) => s.gateDecisions);
  const variants = useWorkspace((s) => s.variants);
  const qaResults = useWorkspace((s) => s.qaResults);
  const runMode = useWorkspace((s) => s.runMode);
  const advance = useWorkspace((s) => s.advance);
  const decideGate = useWorkspace((s) => s.decideGate);
  const loadBrief = useWorkspace((s) => s.loadBrief);
  const reset = useWorkspace((s) => s.reset);

  const lastRationale = rationaleStream[rationaleStream.length - 1];
  const [input, setInput] = useState("");
  const handledRef = useRef<Set<string>>(new Set());

  const context = useMemo(
    () => ({
      campaign: brief.campaign,
      product: brief.product,
      market: brief.market,
      locales: brief.locales,
      currentPhase: phase,
      phaseLabel: phaseLabel(phase),
      gatesPassed: Object.entries(gateDecisions)
        .filter(([, d]) => d.verdict === "approved")
        .map(([g]) => g),
      gatesPending: [],
      variantCount: variants.length,
      qaSummary: `${qaResults.filter((r) => r.judge.verdict === "pass").length}/${qaResults.length} passing`,
      lastRationale: rationaleStream.length > 0
        ? rationaleStream[rationaleStream.length - 1].decided
        : null,
      agentBusy,
      runMode,
    }),
    [brief, phase, gateDecisions, variants, qaResults, rationaleStream, agentBusy, runMode],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent-chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, context: contextRef.current },
        }),
      }),
    [],
  );

  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const { messages, sendMessage, append, status, error } = useChat({
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, status]);

  // Parse & execute action tags emitted by the orchestrator.
  useEffect(() => {
    if (status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (handledRef.current.has(last.id)) return;
    const text = textOf(last);
    const matches = [...text.matchAll(ACTION_RE)];
    if (matches.length === 0) {
      handledRef.current.add(last.id);
      return;
    }
    handledRef.current.add(last.id);
    for (const m of matches) {
      const kind = m[1];
      const arg = m[2];
      if (kind === "ADVANCE") void advance();
      else if (kind === "APPROVE" && arg) decideGate(arg as GateId, "approved", "Approved via Orchestrator");
      else if (kind === "LOAD" && arg) {
        const target = listCampaigns().find((b) => b.id === arg || b.id.endsWith(arg));
        if (target) {
          loadBrief(target);
          void navigate({ to: "/workspace" });
        }
      } else if (kind === "RESET") reset();
    }
  }, [messages, status, advance, decideGate, loadBrief, reset, navigate]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    void sendMessage({ text: t });
  };

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
    const names = files.map((f) => f.name).join(", ");
    void append({
      role: "user",
      content: `📎 Uploaded: ${names}. Analyze these files and propose skills if relevant.`,
    });
  };

  return (
    <div className="flex h-full flex-col rounded-sm border border-border bg-white">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-full bg-foreground text-white">
            <Sparkles className="size-3" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
              Orchestrator Agent
            </p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              580ai · Live · steers 6 specialists
            </p>
          </div>
        </div>
        <span
          className={`size-1.5 rounded-full ${busy ? "animate-pulse bg-hilti" : "bg-emerald"}`}
        />
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div>
            <p className="text-xs text-muted-foreground">
              I coordinate Strategy, Content, Localization, QA, Rollout and Insights.
              Tell me what to do — I'll plan it and act.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:border-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}

        {busy && (
          <div className="flex items-center gap-2">
            <div className="size-1.5 animate-pulse rounded-full bg-hilti" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              orchestrator thinking…
            </span>
          </div>
        )}

        {error && (
          <p className="rounded-sm border border-hilti/40 bg-hilti/5 p-2 text-xs text-hilti">
            {error.message}
          </p>
        )}

        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <FileUpload onFilesSelected={handleFilesSelected} />
      </div>

      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell the orchestrator what to do…"
          className="flex-1 rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          disabled={busy}
          autoFocus
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="grid size-9 place-items-center rounded-sm bg-foreground text-white disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

function textOf(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function Bubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const raw = textOf(message);
  // Hide action tags from display but keep them in raw text for parsing.
  const display = raw.replace(ACTION_RE, "").trim();
  return (
    <div className={isUser ? "flex justify-end" : ""}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap text-sm ${
          isUser
            ? "rounded-sm bg-foreground px-3 py-2 text-white"
            : "text-foreground"
        }`}
      >
        {display}
        {!isUser && raw.match(ACTION_RE) && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-emerald">
            ⚡ action dispatched
          </p>
        )}
      </div>
    </div>
  );
}
