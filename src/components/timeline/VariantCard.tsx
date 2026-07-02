import type { AdVariant } from "@/types";
import heroImg from "@/assets/siw-6at-hero.jpg";
import { useWorkspace } from "@/store/workspace";

export function VariantCard({
  variant,
  flagged,
  onApplyFix,
}: {
  variant: AdVariant;
  flagged?: { phrase: string; suggestion: string; reason: string };
  onApplyFix?: () => void;
}) {
  const fixed = useWorkspace((s) => s.appliedFixes.has(variant.id));
  const displayText =
    fixed && flagged
      ? variant.primary_text.replace(flagged.phrase, flagged.suggestion)
      : variant.primary_text;

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-black/[0.02] px-3 py-2">
        <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
          {variant.id.toUpperCase()}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          locale: {variant.locale}
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          meta / paid-social
        </span>
      </div>

      <div className="aspect-square w-full overflow-hidden border-b border-border bg-stone-100">
        <img
          src={heroImg}
          alt="Hilti SIW 6AT-A22 cordless impact wrench"
          className="size-full object-cover"
          loading="lazy"
          width={1024}
          height={1024}
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-hilti">
            <span className="font-mono text-[9px] font-bold text-white">H</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">Hilti {variant.locale.split("-")[1]}</span>
            <span className="font-mono text-[9px] text-muted-foreground">Sponsored</span>
          </div>
        </div>

        <h3 className="text-sm font-bold leading-snug">{variant.headline}</h3>

        {flagged && !fixed ? (
          <div className="rounded-sm border border-hilti/20 bg-hilti-soft p-3">
            <p className="text-sm leading-relaxed">
              {variant.primary_text.split(flagged.phrase).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="rounded bg-hilti px-1 font-bold text-white">
                      {flagged.phrase}
                    </span>
                  )}
                </span>
              ))}
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-hilti/10 pt-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-hilti">
                FAULT: BRAND VOICE
              </span>
              {onApplyFix && (
                <button
                  onClick={onApplyFix}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-hilti underline underline-offset-2 hover:no-underline"
                >
                  Apply auto-fix ({flagged.suggestion})
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90">{displayText}</p>
        )}

        {fixed && flagged && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-emerald">
            ✓ auto-fix applied · '{flagged.phrase}' → '{flagged.suggestion}'
          </p>
        )}

        <button className="w-full rounded-sm border border-border bg-black/[0.02] py-2 text-xs font-bold hover:bg-black/[0.05]">
          {variant.cta}
        </button>
      </div>
    </div>
  );
}
