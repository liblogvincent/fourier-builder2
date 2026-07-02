import { useState } from "react";
import { useWorkspace } from "@/store/workspace";

export function BriefCard() {
  const brief = useWorkspace((s) => s.brief);
  const phase = useWorkspace((s) => s.phase);
  const advance = useWorkspace((s) => s.advance);
  const [open, setOpen] = useState(phase === "brief");

  return (
    <section className="rounded-sm border border-border bg-[color-mix(in_oklab,var(--background),white_60%)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex size-8 items-center justify-center rounded bg-black/5">
            <span className="font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
              Doc
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold">Brief: {brief.product}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {brief.market} • {brief.channels.join(", ").toUpperCase()} •{" "}
              {brief.locales.join(" / ")}
            </p>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {open ? "Collapse −" : "Expand +"}
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-6 border-t border-border bg-white p-6 text-xs">
          <Field label="Campaign">{brief.campaign}</Field>
          <Field label="Product">{brief.product}</Field>
          <Field label="Audience">{brief.audience}</Field>
          <Field label="Objective">{brief.objective}</Field>
          <Field label="Budget">${brief.budget_usd.toLocaleString()}</Field>
          <Field label="Locales">{brief.locales.join(", ")}</Field>
          <div className="col-span-2">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Agent assumptions
            </p>
            <ul className="space-y-1">
              {brief.assumptions.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {phase === "brief" && (
        <div className="border-t border-border bg-white p-4">
          <button
            onClick={advance}
            className="w-full rounded-sm bg-foreground py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-hilti"
          >
            Send brief to Strategy agent →
          </button>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-foreground">{children}</p>
    </div>
  );
}
