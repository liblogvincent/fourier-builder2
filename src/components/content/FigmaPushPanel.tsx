import { useState } from "react";
import type { AdVariant } from "@/types";

interface FigmaPushPanelProps {
  variants: AdVariant[];
}

type PushStatus = "idle" | "pushing" | "done" | "error";

export function FigmaPushPanel({ variants }: FigmaPushPanelProps) {
  const [status, setStatus] = useState<PushStatus>("idle");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(variants.map((v) => v.id)));

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === variants.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(variants.map((v) => v.id)));
  };

  const pushToFigma = async () => {
    const selected = variants.filter((v) => selectedIds.has(v.id));
    if (selected.length === 0) return;
    setStatus("pushing");

    // In prototype: simulate Figma board creation
    // Production: call Figma MCP / REST API to create frames
    await new Promise((r) => setTimeout(r, 2000));

    const boardName = `Campaign_Content_${new Date().toISOString().slice(0, 10)}`;
    setFigmaUrl(`https://figma.com/board/mock-${Date.now()}/${encodeURIComponent(boardName)}`);
    setStatus("done");
  };

  const selected = variants.filter((v) => selectedIds.has(v.id));

  return (
    <div className="rounded-sm border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-[#a259ff] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
            Figma
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {selected.length} of {variants.length} variants selected
          </span>
        </div>
        <button
          onClick={toggleAll}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {selectedIds.size === variants.length ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Variant checklist */}
      <div className="max-h-48 overflow-y-auto border-b border-border">
        {variants.map((v) => (
          <label
            key={v.id}
            className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2 last:border-b-0 hover:bg-black/[0.02]"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(v.id)}
              onChange={() => toggle(v.id)}
              className="size-3 accent-hilti"
            />
            <span className="font-mono text-[10px]">{v.id}</span>
            <span className="truncate text-xs">{v.headline}</span>
            <span className="ml-auto font-mono text-[9px] uppercase text-muted-foreground">
              {v.locale} · {v.channel}
            </span>
          </label>
        ))}
      </div>

      {/* Action */}
      <div className="p-4">
        {status === "done" && figmaUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-sm bg-emerald/10 px-3 py-2">
              <span className="text-emerald text-sm">✓</span>
              <span className="text-xs font-semibold text-emerald">
                {selected.length} frames pushed to Figma
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-sm border border-border bg-background px-2 py-1 font-mono text-[10px]">
                {figmaUrl}
              </code>
              <button
                onClick={() => window.open(figmaUrl, "_blank")}
                className="rounded-sm bg-[#a259ff] px-3 py-1 font-mono text-[10px] font-bold text-white hover:bg-[#a259ff]/90"
              >
                Open in Figma →
              </button>
            </div>
            <button
              onClick={() => { setStatus("idle"); setFigmaUrl(""); }}
              className="font-mono text-[10px] text-muted-foreground underline"
            >
              Push another batch
            </button>
          </div>
        ) : (
          <button
            onClick={pushToFigma}
            disabled={selected.length === 0 || status === "pushing"}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#a259ff] py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-[#a259ff]/90 disabled:opacity-40"
          >
            {status === "pushing" ? (
              <>⏳ Creating Figma board…</>
            ) : (
              <>↑ Push {selected.length} variants to Figma</>
            )}
          </button>
        )}
        <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground">
          Creates a Figma board with one frame per variant · assets placed as named layers · prototype only
        </p>
      </div>
    </div>
  );
}
