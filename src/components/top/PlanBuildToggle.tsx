import { useWorkspace } from "@/store/workspace";

export function PlanBuildToggle() {
  const planMode = useWorkspace((s) => s.planMode);
  const setPlanMode = useWorkspace((s) => s.setPlanMode);

  return (
    <div className="flex items-center rounded-sm border border-border bg-white">
      <button
        onClick={() => setPlanMode(true)}
        className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
          planMode
            ? "bg-hilti text-white"
            : "text-muted-foreground hover:bg-black/5"
        }`}
        title="Plan mode: agent proposes directions, you review and choose"
      >
        Plan
      </button>
      <button
        onClick={() => setPlanMode(false)}
        className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
          !planMode
            ? "bg-emerald text-white"
            : "text-muted-foreground hover:bg-black/5"
        }`}
        title="Build mode: agent generates final output and advances the pipeline"
      >
        Build
      </button>
    </div>
  );
}
