import { useState } from "react";
import { useWorkspace } from "@/store/workspace";

const EXAMPLE_BRIEF = `Campaign: Q4 Power-Tool Promotion — DACH
Product: SIW 6AT-A22 cordless impact wrench
Market: Germany, Austria, Switzerland (de-DE, de-AT, de-CH, fr-CH)
Audience: Contractor segment — site foremen and finishing crews, aged 28-55
Objective: Drive consideration and dealer-locator clicks for the SIW 6AT-A22
Offer: 10% off battery + charger bundle
Budget: €142,500
Channels: Meta (hero), LinkedIn (secondary)
Timeline: Q4 2026, 8-week flight`;

export function BriefCard() {
  const brief = useWorkspace((s) => s.brief);
  const phase = useWorkspace((s) => s.phase);
  const advance = useWorkspace((s) => s.advance);
  const loadBrief = useWorkspace((s) => s.loadBrief);
  const [open, setOpen] = useState(true);
  const [freeText, setFreeText] = useState("");
  const [structured, setStructured] = useState(false);

  const isEmpty = !brief.product && !brief.campaign;
  const isNew = brief.campaign === "New Campaign" || isEmpty;

  const handleStructure = () => {
    const text = freeText.trim();
    if (!text) return;
    // Simple extraction from free text (prototype — production uses LLM)
    const extract = (pattern: RegExp, fallback: string) => {
      const m = text.match(pattern);
      return m ? m[1].trim() : fallback;
    };
    loadBrief({
      id: `brief_${Date.now()}`,
      campaign: extract(/Campaign:\s*(.+)/, "New Campaign"),
      product: extract(/Product:\s*(.+)/, ""),
      market: extract(/Market:\s*(.+)/, "DACH"),
      audience: extract(/Audience:\s*(.+)/, ""),
      objective: extract(/Objective:\s*(.+)/, ""),
      channels: text.toLowerCase().includes("linkedin") ? ["meta", "linkedin"] : ["meta"],
      locales: text.includes("fr-CH") ? ["de-DE", "de-AT", "de-CH", "fr-CH"] :
               text.includes("de-CH") ? ["de-DE", "de-AT", "de-CH"] :
               text.includes("de-AT") ? ["de-DE", "de-AT"] : ["de-DE"],
      budget_usd: parseInt(extract(/Budget:\s*€?\$?\s*([\d,]+)/, "0").replace(/,/g, "")) || 0,
      assumptions: [],
    });
    setStructured(true);
  };

  const handleSendToStrategy = () => {
    void advance();
  };

  return (
    <section className="rounded-sm border border-border bg-white">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded bg-hilti/10">
            <span className="font-mono text-[10px] font-bold uppercase text-hilti">A0</span>
          </div>
          <div>
            <p className="text-xs font-semibold">
              {isNew ? "Drop your campaign brief" : `Brief: ${brief.product || brief.campaign}`}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {isNew
                ? "Free-text or structured — the agent will normalize it"
                : `${brief.market} · ${brief.channels.join(", ").toUpperCase()} · ${brief.locales.join(" / ")}`}
            </p>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {open ? "Collapse −" : "Expand +"}
        </span>
      </button>

      {open && (
        <>
          {isNew ? (
            /* FREE-TEXT BRIEF INPUT — matches real RMB workflow where people drop a PPT or free text */
            <div className="border-t border-border bg-background p-4 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Paste your campaign brief below — the Strategy agent (A0) will structure and validate it
              </p>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder={EXAMPLE_BRIEF}
                className="w-full h-40 rounded-sm border border-border bg-white px-3 py-2 text-xs font-mono leading-relaxed focus:border-hilti focus:outline-none resize-y"
                rows={10}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStructure}
                  disabled={!freeText.trim()}
                  className="rounded-sm bg-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-hilti disabled:opacity-30"
                >
                  Structure Brief (A0)
                </button>
                <button
                  onClick={() => setFreeText(EXAMPLE_BRIEF)}
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Use example brief →
                </button>
              </div>
              <p className="font-mono text-[8px] text-muted-foreground">
                In production, A0 would use an LLM to extract campaign, product, audience, objective, budget, channels, and locales. Here we use simple regex extraction for the prototype.
              </p>
            </div>
          ) : (
            /* STRUCTURED BRIEF VIEW — shown after A0 has structured the brief */
            <div className="grid grid-cols-2 gap-6 border-t border-border bg-white p-6 text-xs">
              <Field label="Campaign">{brief.campaign}</Field>
              <Field label="Product">{brief.product}</Field>
              <Field label="Market">{brief.market}</Field>
              <Field label="Audience">{brief.audience}</Field>
              <Field label="Objective">{brief.objective}</Field>
              <Field label="Budget">€{brief.budget_usd.toLocaleString()}</Field>
              <Field label="Channels">{brief.channels.join(", ").toUpperCase()}</Field>
              <Field label="Locales">{brief.locales.join(" / ")}</Field>
              {brief.assumptions.length > 0 && (
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
              )}
              {structured && (
                <div className="col-span-2 rounded-sm border border-emerald/20 bg-emerald/5 p-3">
                  <p className="font-mono text-[10px] font-bold uppercase text-emerald">✓ Brief structured by A0</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    The Strategy agent has extracted and validated the key fields. Review and edit above, then send to Strategy to generate the campaign plan.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Send to Strategy button — only when brief is structured */}
          {!isNew && phase === "brief" && (
            <div className="border-t border-border bg-white p-4">
              <button
                onClick={handleSendToStrategy}
                className="w-full rounded-sm bg-hilti py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-hilti/90"
              >
                Send brief to Strategy agent →
              </button>
              <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground">
                Triggers A1-A5: Paid Media Plan, HOL Journey, Email Strategy, Social Strategy
              </p>
            </div>
          )}
        </>
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
      <p className="text-foreground">{children || <span className="text-muted-foreground italic">—</span>}</p>
    </div>
  );
}
