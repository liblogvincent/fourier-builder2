import { useWorkspace } from "@/store/workspace";
import type { AgentName, Phase } from "@/types";

const AGENTS: { id: AgentName; label: string; glyph: string; phase: Phase }[] = [
  { id: "strategy", label: "Strategy", glyph: "S", phase: "planning" },
  { id: "content", label: "Content", glyph: "C", phase: "content" },
  { id: "localization", label: "Localize", glyph: "L", phase: "localization" },
  { id: "qa", label: "QA Judge", glyph: "Q", phase: "qa" },
  { id: "rollout", label: "Rollout", glyph: "R", phase: "rollout" },
  { id: "insights", label: "Insights", glyph: "I", phase: "H4" },
];

const ORDER: Phase[] = [
  "brief", "planning", "H1", "content", "localization", "qa",
  "H2", "H-legal", "rollout", "H3", "live", "H4", "done",
];

export function AgentConstellation() {
  const phase = useWorkspace((s) => s.phase);
  const agentBusy = useWorkspace((s) => s.agentBusy);
  const runMode = useWorkspace((s) => s.runMode);
  const stream = useWorkspace((s) => s.rationaleStream);
  const lastRationale = stream[stream.length - 1];
  const currentIdx = ORDER.indexOf(phase);

  const cx = 200;
  const cy = 190;
  const r = 130;

  return (
    <div className="flex h-full flex-col rounded-sm border border-border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
          Agent Constellation
        </p>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {runMode === "live" ? "● 580ai · Live" : "Scripted"}
        </span>
      </div>

      <div className="relative flex-1">
        <svg viewBox="0 0 400 380" className="h-full w-full">
          {/* orbit */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeDasharray="2 4"
          />
          {/* spokes */}
          {AGENTS.map((a, i) => {
            const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            const isBusy = agentBusy === a.id;
            const isDone = ORDER.indexOf(a.phase) < currentIdx;
            return (
              <line
                key={`spoke-${a.id}`}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke={isBusy ? "#D2051E" : isDone ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.08)"}
                strokeWidth={isBusy ? 1.5 : 1}
                strokeDasharray={isBusy ? "4 3" : undefined}
              >
                {isBusy && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-14"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}

          {/* center — You */}
          <circle cx={cx} cy={cy} r={30} fill="#0A0A0A" />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill="white"
            fontFamily="ui-monospace, monospace"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            YOU
          </text>

          {/* agent nodes */}
          {AGENTS.map((a, i) => {
            const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            const isBusy = agentBusy === a.id;
            const isDone = ORDER.indexOf(a.phase) < currentIdx;
            const isActive = ORDER.indexOf(a.phase) === currentIdx;
            const fill = isBusy
              ? "#10b981"
              : isActive
                ? "#D2051E"
                : isDone
                  ? "#0A0A0A"
                  : "#F3F3F3";
            const text = isBusy || isActive || isDone ? "white" : "#666";
            return (
              <g key={a.id}>
                {isBusy && (
                  <circle
                    cx={x}
                    cy={y}
                    r={26}
                    fill="none"
                    stroke="#10b981"
                    strokeOpacity="0.5"
                  >
                    <animate attributeName="r" from="22" to="34" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" from="0.6" to="0" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r={22} fill={fill} stroke="rgba(0,0,0,0.1)" />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={text}
                  fontFamily="ui-monospace, monospace"
                  fontSize="12"
                  fontWeight="700"
                >
                  {a.glyph}
                </text>
                <text
                  x={x}
                  y={y + 40}
                  textAnchor="middle"
                  fill="#666"
                  fontFamily="ui-monospace, monospace"
                  fontSize="9"
                  letterSpacing="0.08em"
                >
                  {a.label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 rounded-sm border border-border bg-background p-2">
        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {agentBusy ? `${agentBusy} · thinking…` : lastRationale ? `${lastRationale.agent} · decided` : "idle"}
        </p>
        <p className="mt-1 line-clamp-2 text-xs">
          {lastRationale?.decided ?? "No agent output yet. Open a campaign to begin."}
        </p>
      </div>
    </div>
  );
}
