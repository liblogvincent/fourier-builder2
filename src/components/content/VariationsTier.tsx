import { useState } from "react";

interface Variation {
  id: string;
  type: "video" | "image" | "copy_block";
  label: string;
  derivedFrom: string;
}

interface VariationsTierProps {
  hasContent: boolean; // Tier 1 complete?
  onGenerate: () => void;
  onImport: () => void;
}

const MOCK_VARIATIONS: Variation[] = [
  { id: "var_1", type: "video", label: "15s product demo", derivedFrom: "Master Story" },
  { id: "var_2", type: "video", label: "30s testimonial cut", derivedFrom: "Master Story" },
  { id: "var_3", type: "image", label: "Hero jobsite shot", derivedFrom: "Key Visual" },
  { id: "var_4", type: "copy_block", label: "Torque-control headline set", derivedFrom: "Master Story" },
];

export function VariationsTier({ hasContent, onGenerate, onImport }: VariationsTierProps) {
  const [variations] = useState<Variation[]>(hasContent ? MOCK_VARIATIONS : []);

  if (!hasContent) {
    return (
      <section className="rounded-sm border-2 border-dashed border-border bg-background/50 opacity-60">
        <div className="px-4 py-6 text-center">
          <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-foreground/60">Tier 2</span>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Variations — Locked</p>
          <p className="mt-1 text-xs text-muted-foreground">Complete Tier 1 (Master Content) to unlock content variations.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-sm border-2 border-amber/30 bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-amber/5">
        <div className="flex items-center gap-3">
          <span className="rounded-sm bg-amber px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">Tier 2</span>
          <div>
            <p className="text-sm font-bold">Variations — Content Executions</p>
            <p className="font-mono text-[9px] text-muted-foreground">"How many ways do we tell the master story?" · Derived from Tier 1</p>
          </div>
        </div>
        <span className="font-mono text-[9px] font-bold uppercase text-emerald">✓ {variations.length} variations</span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {variations.map((v) => (
          <div key={v.id} className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={`rounded-sm px-1 py-0.5 font-mono text-[7px] font-bold uppercase text-white ${
                v.type === "video" ? "bg-blue" : v.type === "image" ? "bg-purple" : "bg-emerald"
              }`}>{v.type}</span>
              <span className="font-mono text-[8px] text-muted-foreground">← {v.derivedFrom}</span>
            </div>
            <p className="text-xs font-semibold">{v.label}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="font-mono text-[7px] text-muted-foreground">Formats: 9×16, 16×9, 1×1, 4×5</span>
            </div>
          </div>
        ))}
        <button className="flex items-center justify-center rounded-sm border-2 border-dashed border-border bg-background p-3 hover:border-foreground/40">
          <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground">+ Add Variation</span>
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <button onClick={onGenerate} className="rounded-sm bg-amber px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-white hover:bg-amber/90">
          ⟡ Generate More
        </button>
        <button onClick={onImport} className="rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase text-muted-foreground hover:bg-black/5">
          ⬆ Import from DAM
        </button>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">Tier 2 complete — Tier 3 unlocked</span>
      </div>
    </section>
  );
}
