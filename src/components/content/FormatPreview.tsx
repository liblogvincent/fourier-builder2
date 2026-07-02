import { useState } from "react";

type AspectRatio = "9x16" | "16x9" | "1x1" | "4x5";

const RATIO_STYLES: Record<AspectRatio, { width: number; height: number; label: string }> = {
  "9x16": { width: 180, height: 320, label: "9:16 Stories" },
  "16x9": { width: 320, height: 180, label: "16:9 Feed" },
  "1x1": { width: 220, height: 220, label: "1:1 Square" },
  "4x5": { width: 200, height: 250, label: "4:5 Portrait" },
};

interface FormatPreviewProps {
  headline: string;
  primaryText: string;
  cta: string;
  imageRef: string;
  locale: string;
  channel: string;
}

export function FormatPreview({ headline, primaryText, cta, imageRef, locale }: FormatPreviewProps) {
  const [ratio, setRatio] = useState<AspectRatio>("1x1");
  const style = RATIO_STYLES[ratio];

  return (
    <div className="rounded-sm border border-border bg-white">
      {/* Ratio selector */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {(Object.keys(RATIO_STYLES) as AspectRatio[]).map((r) => (
          <button
            key={r}
            onClick={() => setRatio(r)}
            className={`rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
              r === ratio
                ? "bg-foreground text-white"
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">{style.label}</span>
      </div>

      {/* Mock ad preview */}
      <div className="flex items-center justify-center bg-[color-mix(in_oklab,var(--background),white_40%)] p-4">
        <div
          className="relative flex flex-col overflow-hidden rounded-sm border border-border bg-white shadow-sm"
          style={{ width: style.width, height: style.height }}
        >
          {/* Image area */}
          <div className="flex flex-1 items-center justify-center bg-black/5">
            <div className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded bg-black/10">
                <span className="font-mono text-[8px] uppercase text-muted-foreground">img</span>
              </div>
              <p className="font-mono text-[8px] text-muted-foreground">{imageRef}</p>
            </div>
          </div>
          {/* Copy area */}
          <div className="border-t border-border bg-white p-2">
            <p className="text-[10px] font-bold leading-tight" style={{ fontSize: ratio === "9x16" ? "9px" : "10px" }}>
              {headline}
            </p>
            <p className="mt-0.5 text-[8px] leading-tight text-muted-foreground line-clamp-2">
              {primaryText}
            </p>
            <p className="mt-1 rounded-sm bg-foreground px-1.5 py-0.5 text-center text-[8px] font-bold text-white">
              {cta}
            </p>
          </div>
          {/* Locale badge */}
          <div className="absolute right-1 top-1 rounded-sm bg-black/70 px-1 py-0.5 font-mono text-[7px] text-white">
            {locale}
          </div>
        </div>
      </div>

      {/* Character counts */}
      <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 font-mono text-[9px] text-muted-foreground">
        <span>H: {headline.length}/40</span>
        <span>P: {primaryText.length}/125</span>
        <span>CTA: ✓</span>
      </div>
    </div>
  );
}
