import { useState } from "react";
import { useWorkspace } from "@/store/workspace";
import type { GateId } from "@/types";

const GATE_COPY: Record<
  string,
  { title: string; body: string; reviewerHint: string }
> = {
  H1: {
    title: "Gate H1 · Plan approval",
    body: "Strategy agent has generated a CampaignPlan. Approve to release Content agent.",
    reviewerHint: "Approving authorizes content generation across 4 locales × 4 concepts.",
  },
  H2: {
    title: "Gate H2 · QA approval",
    body: "QA agent flagged 1 of 16 variants for a brand-voice violation. Auto-fix available.",
    reviewerHint: "Approve once the flagged variant is auto-fixed or accepted as-is.",
  },
  "H-legal": {
    title: "Gate H-legal · EU compliance review",
    body: "Strategy agent proposed this extra gate because DACH markets require legal sign-off on technical claims.",
    reviewerHint:
      "Verify torque claims match product spec; confirm no medical/safety claims requiring CE disclosure.",
  },
  H3: {
    title: "Gate H3 · Publish confirm",
    body: "Roll-out agent staged 16 publishes via meta_ads_api. Confirm to go live.",
    reviewerHint: "Deterministic publish — no creative drift between approval and adset.",
  },
  H4: {
    title: "Gate H4 · Promote learning",
    body: "Insights agent proposes promoting a new Rule to the global registry.",
    reviewerHint: "Approving makes the rule active for future campaigns across all markets.",
  },
};

export function GatePanel({ gate }: { gate: GateId }) {
  const decideGate = useWorkspace((s) => s.decideGate);
  const applyFix = useWorkspace((s) => s.applyFix);
  const appliedFixes = useWorkspace((s) => s.appliedFixes);
  const setProposalDisposition = useWorkspace((s) => s.setProposalDisposition);
  const [note, setNote] = useState("");
  const copy = GATE_COPY[gate] ?? {
    title: `Gate ${gate}`,
    body: "Approve to continue.",
    reviewerHint: "",
  };
  const h2NeedsFix = gate === "H2" && !appliedFixes.has("v_1_de-DE");

  return (
    <div className="sticky bottom-0 z-20 -mx-8 mt-8 border-t-2 border-hilti bg-white px-8 py-6 shadow-2xl ring-1 ring-black/5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{copy.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
          {copy.reviewerHint && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-foreground/60">
              {copy.reviewerHint}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 animate-pulse rounded-full bg-hilti" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-hilti">
            Required action
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-[1fr_auto] gap-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reviewer note (optional) — signed as Vincent Lee"
          className="rounded-sm border border-border bg-background px-3 py-2 text-xs focus:border-hilti focus:outline-none"
        />
        <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Sig
          </span>
          <span className="font-mono text-xs font-bold italic">VL</span>
        </div>
      </div>

      {h2NeedsFix && (
        <div className="mb-4 flex items-center justify-between rounded-sm border border-hilti/20 bg-hilti-soft px-3 py-2 text-xs">
          <span>1 unresolved blocker on v_1_de-DE</span>
          <button
            onClick={() => applyFix("v_1_de-DE")}
            className="font-mono text-[10px] font-bold uppercase tracking-wider text-hilti underline underline-offset-2"
          >
            Apply auto-fix
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => decideGate(gate, "rejected", note)}
          className="h-12 rounded-sm border border-border bg-white text-sm font-bold transition-colors hover:bg-black/5"
        >
          Reject
        </button>
        <button
          onClick={() => decideGate(gate, "changes_requested", note)}
          className="h-12 rounded-sm border border-border bg-white text-sm font-bold transition-colors hover:bg-black/5"
        >
          Request changes
        </button>
        <button
          disabled={h2NeedsFix}
          onClick={() => {
            if (gate === "H4") setProposalDisposition("promoted");
            decideGate(gate, "approved", note);
          }}
          className="h-12 rounded-sm bg-hilti text-sm font-bold text-white shadow-lg transition-colors hover:bg-hilti/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve & sign
        </button>
      </div>
    </div>
  );
}
