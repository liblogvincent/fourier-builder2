import { useWorkspace, isGatePhase } from "@/store/workspace";
import type { Phase } from "@/types";

// Map phase to which gate is "active" or which node is running
const phaseToActiveNode = (phase: Phase): string | null => {
  if (phase === "planning") return "n_plan";
  if (phase === "H1") return "n_h1";
  if (phase === "content") return "n_content";
  if (phase === "localization") return "n_locale";
  if (phase === "qa") return "n_qa";
  if (phase === "H2") return "n_h2";
  if (phase === "H-C") return "n_hc";
  if (phase === "rollout") return "n_rollout";
  if (phase === "H3") return "n_h3";
  if (phase === "live") return "n_live";
  if (phase === "H4") return "n_h4";
  return null;
};

const phaseOrder: Phase[] = [
  "brief",
  "planning",
  "H1",
  "H2",
  "content",
  "H-C",
  "localization",
  "rollout",
  "qa",
  "H3",
  "live",
  "H4",
  "done",
];

export function WorkflowDag() {
  const phase = useWorkspace((s) => s.phase);
  const plan = useWorkspace((s) => s.plan);
  const decisions = useWorkspace((s) => s.gateDecisions);
  const activeNode = phaseToActiveNode(phase);
  const currentIdx = phaseOrder.indexOf(phase);

  const nodeIsDone = (nodeId: string): boolean => {
    const node = plan.nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    if (node.kind === "gate" && node.gate && decisions[node.gate]?.verdict === "approved")
      return true;
    // map nodes to phases that complete them
    const map: Record<string, Phase> = {
      n_brief: "planning",
      n_plan: "H1",
      n_content: "localization",
      n_locale: "qa",
      n_qa: "H2",
      n_rollout: "H3",
      n_live: "H4",
      n_insights: "H4",
    };
    const completedWhen = map[nodeId];
    if (completedWhen) {
      return phaseOrder.indexOf(completedWhen) <= currentIdx;
    }
    return false;
  };

  return (
    <div className="flex flex-1 flex-col items-stretch overflow-y-auto p-4">
      {plan.nodes.map((node, i) => {
        const isActive = activeNode === node.id;
        const isDone = nodeIsDone(node.id);
        const isGate = node.kind === "gate";
        return (
          <div key={node.id} className="relative flex items-stretch gap-3">
            {/* Rail + node marker */}
            <div className="flex w-10 flex-col items-center">
              <div
                className={`flex shrink-0 items-center justify-center font-mono text-[10px] font-bold ${
                  isGate ? "size-10 rounded-sm border-2" : "size-7 rounded-full border"
                } ${
                  isActive && isGate
                    ? "animate-pulse-red border-hilti bg-white text-hilti"
                    : isActive
                      ? "border-hilti bg-hilti-soft text-hilti"
                      : isDone
                        ? "border-emerald bg-[color-mix(in_oklab,var(--emerald),white_85%)] text-emerald"
                        : "border-border bg-white text-muted-foreground"
                }`}
              >
                {isGate ? node.gate : i + 1}
              </div>
              {i < plan.nodes.length - 1 && (
                <div
                  className={`w-px flex-1 min-h-6 ${
                    isDone ? "bg-emerald" : "bg-border"
                  }`}
                />
              )}
            </div>
            <div className="-mt-0.5 flex-1 pb-3">
              <p
                className={`font-mono text-[11px] font-medium ${
                  isActive ? "text-hilti" : isDone ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {node.label}
              </p>
              {node.agent && (
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  agent: {node.agent}
                </p>
              )}
              {isActive && (
                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-hilti">
                  {isGatePhase(phase) ? "requires action" : "running"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
