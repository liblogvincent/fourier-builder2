import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { listRuns } from "@/lib/persistence";
import type { EvalPoint } from "@/types";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/evals")({
  head: () => ({
    meta: [
      { title: "Evals — Fourier" },
      {
        name: "description",
        content:
          "Compounding eval chart: hours returned, cost per campaign, skills reused across campaign history.",
      },
    ],
  }),
  component: EvalsPage,
});

function EvalsPage() {
  const [evalSeries, setEvalSeries] = useState<EvalPoint[]>([]);
  useEffect(() => {
    listRuns().then(setEvalSeries).catch(() => setEvalSeries([]));
  }, []);
  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Evals · Compounding
          </p>
          <h1 className="text-2xl font-bold">The system gets better as it runs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each campaign promotes new skills that the next campaign reuses.
            Hours returned per launch trend up; cost trends down.
          </p>
        </header>

        <section className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Hours returned per campaign
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={evalSeries}>
                <CartesianGrid stroke="oklch(0 0 0 / 0.06)" />
                <XAxis
                  dataKey="campaign"
                  stroke="oklch(0.5 0 0)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid oklch(0 0 0 / 0.08)",
                    borderRadius: 2,
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hoursReturned"
                  stroke="oklch(0.56 0.22 27)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.56 0.22 27)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-sm border border-border bg-white">
          <table className="w-full text-xs">
            <thead className="bg-black/[0.02]">
              <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2">Campaign</th>
                <th className="px-4 py-2">Hours returned</th>
                <th className="px-4 py-2">Cost (USD)</th>
                <th className="px-4 py-2">Quality avg</th>
                <th className="px-4 py-2">Skills reused</th>
              </tr>
            </thead>
            <tbody>
              {evalSeries.map((p) => (
                <tr key={p.campaign} className="border-t border-border">
                  <td className="px-4 py-2 font-mono">{p.campaign}</td>
                  <td className="px-4 py-2">{p.hoursReturned}h</td>
                  <td className="px-4 py-2">${p.costUsd.toLocaleString()}</td>
                  <td className="px-4 py-2">{(p.qualityAvg * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2">{p.skillsReused}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="font-mono text-[10px] text-muted-foreground">
          baseline · Deloitte Hilti Marketing Pilot 2025 (validated)
        </p>
      </div>
    </WorkspaceShell>
  );
}
