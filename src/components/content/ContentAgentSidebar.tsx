import { useWorkspace } from "@/store/workspace";
import { useState } from "react";

export function ContentAgentSidebar() {
  const planMode = useWorkspace((s) => s.planMode);
  const [messages, setMessages] = useState<{ role: "user" | "agent"; content: string }[]>([]);
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    // Placeholder: in future, this will call the Content Agent API
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: planMode
            ? "I'll propose creative directions for you to choose from. What angle should I explore — product-led, problem-led, or ecosystem-led?"
            : "Generating copy... (Content Agent API call goes here)",
        },
      ]);
    }, 800);
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 flex h-[520px] w-80 flex-col rounded-sm border border-border bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Content Agent
          </p>
          <p className="font-mono text-[9px] text-muted-foreground">
            {planMode ? "Plan mode — proposing directions" : "Build mode — generating copy"}
          </p>
        </div>
        <div className={`size-2 rounded-full ${planMode ? "bg-hilti" : "bg-emerald"}`} />
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-sm border border-dashed border-border bg-white/50 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Ready
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {planMode
                ? "Create content above, or ask me to brainstorm ideas. I'll propose directions for you to choose from."
                : "Create content above, or tell me what to build. I'll generate final copy ready for review."}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-sm border p-3 text-xs ${
              m.role === "user"
                ? "ml-4 border-hilti/20 bg-hilti/5"
                : "mr-4 border-border bg-white"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={planMode ? "Ask for creative directions..." : "Describe what to build..."}
            className="flex-1 rounded-sm border border-border bg-background px-3 py-2 text-xs focus:border-hilti focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="rounded-sm bg-hilti px-3 py-2 font-mono text-[10px] font-bold text-white hover:bg-hilti/90"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
