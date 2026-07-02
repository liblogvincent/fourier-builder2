import { useWorkspace } from "@/store/workspace";

export function DemoModeToggle() {
  const demoMode = useWorkspace((s) => s.demoMode);
  const setDemoMode = useWorkspace((s) => s.setDemoMode);
  const runMode = useWorkspace((s) => s.runMode);
  const setRunMode = useWorkspace((s) => s.setRunMode);
  const reset = useWorkspace((s) => s.reset);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const agentError = useWorkspace((s) => s.agentError);

  return (
    <div className="flex items-center gap-2">
      {agentError && (
        <span className="rounded-sm bg-hilti/10 px-2 py-1 font-mono text-[10px] text-hilti" title={agentError}>
          agent error
        </span>
      )}
      {agentBusy && (
        <span className="animate-pulse rounded-sm bg-emerald/10 px-2 py-1 font-mono text-[10px] text-emerald">
          {agentBusy} thinking…
        </span>
      )}

      {/* Run mode segmented */}
      <div className="flex overflow-hidden rounded-sm border border-border bg-white font-mono text-[10px] uppercase tracking-wider">
        <button
          onClick={() => setRunMode("demo")}
          className={`px-2 py-1 ${runMode === "demo" ? "bg-foreground text-white" : "text-muted-foreground hover:bg-black/5"}`}
          title="Scripted fixture replay — no LLM"
        >
          Scripted
        </button>
        <button
          onClick={() => setRunMode("live")}
          className={`px-2 py-1 ${runMode === "live" ? "bg-emerald text-white" : "text-muted-foreground hover:bg-black/5"}`}
          title="Real Lovable AI agents via Gateway (claude-opus-4-8)"
        >
          {runMode === "live" ? "● Live AI · Opus 4.8" : "Live AI"}
        </button>
      </div>

      <button
        onClick={reset}
        className="rounded-sm border border-border bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-black/5 hover:text-foreground"
      >
        Reset
      </button>
      <button
        onClick={() => setDemoMode(!demoMode)}
        className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 transition-colors ${
          demoMode
            ? "border-hilti bg-hilti-soft text-hilti"
            : "border-border bg-white text-foreground hover:bg-black/5"
        }`}
      >
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider">
          Auto-advance
        </span>
        <div
          className={`relative h-4 w-8 rounded-full transition-colors ${
            demoMode ? "bg-hilti" : "bg-black/10"
          }`}
        >
          <div
            className={`absolute top-0.5 size-3 rounded-full bg-white shadow-sm transition-all ${
              demoMode ? "right-0.5" : "left-0.5"
            }`}
          />
        </div>
      </button>
    </div>
  );
}
