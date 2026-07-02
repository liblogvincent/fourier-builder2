# Lovable Improvements Prompt — Builder2 Gap Analysis

> **Context**: Builder2 prototype scored 95/100 on v5-clean-slate spec compliance. This document identifies remaining gaps and provides implementation guidance to achieve 100% compliance.

---

## Executive Summary

Builder2 successfully implements:
- ✅ Core architecture (agent-generated plans, DecisionRationale, open gate namespace)
- ✅ All 4 required gates (H1/H2/H3/H4) with interactive approval flow
- ✅ Partner rail with live rationale streaming
- ✅ QA panel with 100% deterministic coverage + brand-voice judge (96% accuracy shown)
- ✅ Auto-fix visual showing "revolutionäre" → "leistungsstarke"
- ✅ Skills page with registry + H4 proposal flow
- ✅ Eval chart with declining cost curve
- ✅ Demo mode auto-advance through all gates
- ✅ Live mode with real AI agents via Gateway

**Identified gaps (5 points deducted):**
1. **H-legal gate not demonstrated** (3 points) — agent-proposed extra gate missing from fixtures/UI
2. **16 variants not fully rendered** (2 points) — only 4 base variants shown in ContentSection, not all 16 (4 base × 4 locales)

---

## Gap 1: H-legal Gate (Agent-Proposed Extra Gate) — CRITICAL

### Spec Requirement (v5-clean-slate.md, lines 59-99)

```typescript
export type GateId = string;  // Open namespace: "H1" | "H2" | "H3" | "H4" + agent-proposed extras like "H-legal"

export interface PlanGate {
  gate_id: GateId;                             // "H1", "H2", "H3", "H4", or agent-proposed like "H-legal"
  checkpoint: string;                          // what gets reviewed
  required_role: string;                       // "Strategist" | "Content Owner" | "Ops" | "Steward"
  sla_hours?: number;
  rationale?: string;                          // WHY this gate (especially for agent-proposed extras)
}
```

And from the choreographed sequence (lines 336-374):
```
Decided: 5-channel strategy (Meta 40%, LinkedIn 30%, Google 20%, Email 10%)
Why:
• Contractor segment responds best to visual proof (Meta + LinkedIn lead)
• DACH markets require EU compliance review (added H-legal gate)
• Budget split optimized for B2B (LinkedIn over consumer channels)
```

### Current State

**Fixture (`camp_04.ts`)**: Only standard 4 gates in plan.nodes:
```typescript
{ id: "n_h1", label: "H1: Plan approval", kind: "gate", gate: "H1", ... },
{ id: "n_h2", label: "H2: QA approval", kind: "gate", gate: "H2", ... },
{ id: "n_h3", label: "H3: Publish", kind: "gate", gate: "H3", ... },
{ id: "n_h4", label: "H4: Promote skill", kind: "gate", gate: "H4", ... },
```

**Missing**: H-legal gate node between H2 and H3, with rationale explaining why EU compliance requires an extra checkpoint.

### Implementation

**File: `src/fixtures/camp_04.ts`**

1. Add H-legal gate node to `plan.nodes` array (insert after `n_h2`, before `n_rollout`):

```typescript
export const plan: CampaignPlan = {
  // ... existing fields
  nodes: [
    { id: "n_brief", label: "Brief intake", kind: "tool", status: "done", depends_on: [] },
    { id: "n_plan", label: "Strategy plan", kind: "agent", agent: "strategy", status: "done", depends_on: ["n_brief"] },
    { id: "n_h1", label: "H1: Plan approval", kind: "gate", gate: "H1", status: "pending", depends_on: ["n_plan"] },
    { id: "n_content", label: "Content generation", kind: "agent", agent: "content", status: "pending", depends_on: ["n_h1"] },
    { id: "n_locale", label: "Localization", kind: "agent", agent: "localization", status: "pending", depends_on: ["n_content"] },
    { id: "n_qa", label: "QA + brand judge", kind: "agent", agent: "qa", status: "pending", depends_on: ["n_locale"] },
    { id: "n_h2", label: "H2: QA approval", kind: "gate", gate: "H2", status: "pending", depends_on: ["n_qa"] },
    
    // NEW: Agent-proposed extra gate
    { id: "n_h_legal", label: "H-legal: EU compliance", kind: "gate", gate: "H-legal", status: "pending", depends_on: ["n_h2"] },
    
    { id: "n_rollout", label: "Roll-out", kind: "agent", agent: "rollout", status: "pending", depends_on: ["n_h_legal"] }, // Changed from ["n_h2"]
    { id: "n_h3", label: "H3: Publish", kind: "gate", gate: "H3", status: "pending", depends_on: ["n_rollout"] },
    { id: "n_live", label: "Live (7d)", kind: "tool", status: "pending", depends_on: ["n_h3"] },
    { id: "n_insights", label: "Insights", kind: "agent", agent: "insights", status: "pending", depends_on: ["n_live"] },
    { id: "n_h4", label: "H4: Promote skill", kind: "gate", gate: "H4", status: "pending", depends_on: ["n_insights"] },
  ],
};
```

2. Update strategy rationale in `rationaleScript.plan` to mention H-legal:

```typescript
export const rationaleScript: Record<string, DecisionRationale> = {
  plan: {
    id: "r_plan",
    agent: "strategy",
    decided: "Single-channel Meta DAG, 4 base variants × 4 locales, QA-gated + EU compliance checkpoint.",
    why: [
      "Brief lists Meta as the hero channel; multi-channel split would dilute learning",
      "4 base variants gives statistical power for first-pass creative learning",
      "Locale-fanout keeps DACH coverage without burning concepting cycles",
      "DACH markets require EU compliance review — added H-legal gate for legal sign-off on claims",
    ],
    alternatives: [
      {
        option: "Add LinkedIn lookalike",
        rejected_because: "Not in brief budget envelope, no signal yet",
      },
      {
        option: "8 variants × 4 locales",
        rejected_because:
          "Doubles QA load without proven concept lift — defer to round 2",
      },
      {
        option: "Skip extra compliance gate",
        rejected_because: "EU advertising law requires legal review of technical claims in DACH markets",
      },
    ],
    confidence: 0.92,
    knowledge_cited: ["Hilti_Brand_Voice_v4.2", "DACH_Meta_2025_Q3_benchmarks", "EU_Advertising_Compliance_2024"],
    timestamp: "14:02:11",
    status: "decided",
  },
  // ... rest of rationale script
};
```

3. Add H-legal rationale entry (insert after H2 in rationaleScript):

```typescript
  h_legal: {
    id: "r_h_legal",
    agent: "rollout",
    decided: "EU compliance check complete — all technical claims verified against DACH advertising standards.",
    why: [
      "Torque claims ('Drehmoment', 'Drehmomentkontrolle') validated against product spec sheet",
      "No medical/safety claims that require CE marking disclosure",
      "CHF pricing format compliant with Swiss consumer protection law",
    ],
    alternatives: [],
    confidence: 0.98,
    knowledge_cited: ["EU_Advertising_Compliance_2024", "DACH_Technical_Claims_Playbook"],
    timestamp: "14:09:30",
    status: "decided",
  },
```

**File: `src/components/gates/GatePanel.tsx`**

4. Add H-legal to GATE_COPY:

```typescript
const GATE_COPY: Record<
  string,
  { title: string; body: string; reviewerHint: string }
> = {
  H1: { /* existing */ },
  H2: { /* existing */ },
  
  "H-legal": {
    title: "Gate H-legal · EU compliance review",
    body: "Agent proposed this extra gate because DACH markets require legal sign-off on technical claims.",
    reviewerHint: "Verify torque claims match product spec; confirm no medical/safety claims requiring CE disclosure.",
  },
  
  H3: { /* existing */ },
  H4: { /* existing */ },
};
```

**File: `src/store/workspace.ts`**

5. Add H-legal to phase order and execution logic:

```typescript
const PHASE_ORDER: Phase[] = [
  "brief",
  "planning",
  "H1",
  "content",
  "localization",
  "qa",
  "H2",
  "H-legal",  // NEW
  "rollout",
  "H3",
  "live",
  "H4",
  "done",
];
```

6. Update advance() demo mode logic to handle H-legal:

```typescript
  advance: async () => {
    const { phase, runMode } = get();
    const i = PHASE_ORDER.indexOf(phase);
    if (i < 0 || i >= PHASE_ORDER.length - 1) return;
    const next = PHASE_ORDER[i + 1];
    set({ phase: next });

    await executePhase(next, runMode, get, set);

    if (get().demoMode) {
      const isGate = next === "H1" || next === "H2" || next === "H-legal" || next === "H3" || next === "H4";
      const delay = isGate ? 2200 : runMode === "live" ? 800 : 1600;
      setTimeout(() => {
        if (!get().demoMode) return;
        if (isGate) {
          if (next === "H2") get().applyFix("v_1_de-DE");
          get().decideGate(next as GateId, "approved", "Auto-approved (demo mode)");
        } else {
          void get().advance();
        }
      }, delay);
    }
  },
```

7. Update executePhase to emit H-legal rationale:

```typescript
const FIXTURE_RATIONALE: Partial<Record<Phase, DecisionRationale>> = {
  planning: rationaleScript.plan,
  content: rationaleScript.content,
  localization: rationaleScript.localization,
  qa: rationaleScript.qa,
  "H-legal": rationaleScript.h_legal,  // NEW
  rollout: rationaleScript.rollout,
  H4: rationaleScript.insights,
};
```

**File: `src/types.ts`**

8. Add H-legal to Phase union:

```typescript
export type Phase =
  | "brief"
  | "planning"
  | "H1"
  | "content"
  | "localization"
  | "qa"
  | "H2"
  | "H-legal"  // NEW
  | "rollout"
  | "H3"
  | "live"
  | "H4"
  | "done";
```

9. Update phaseLabel function in workspace.ts:

```typescript
export const phaseLabel = (p: Phase): string =>
  ({
    brief: "Awaiting brief",
    planning: "Strategy agent planning",
    H1: "Gate H1: Plan approval",
    content: "Content agent generating",
    localization: "Localization agent fanning out",
    qa: "QA + brand judge running",
    H2: "Gate H2: QA approval",
    "H-legal": "Gate H-legal: EU compliance",  // NEW
    rollout: "Roll-out agent publishing",
    H3: "Gate H3: Publish confirm",
    live: "Campaign live (7d sim)",
    H4: "Gate H4: Promote learning",
    done: "Complete",
  })[p];
```

**File: `src/routes/index.tsx`**

10. Add H-legal gate panel rendering:

```typescript
function Workspace() {
  const phase = useWorkspace((s) => s.phase);

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8">
        <BriefCard />

        {reached(phase, "planning") && <PlanCard />}
        {phase === "H1" && <GatePanel gate="H1" />}

        {reached(phase, "content") && <ContentSection />}
        {reached(phase, "localization") && <LocaleDiff />}
        {reached(phase, "qa") && <QaPanel />}
        {phase === "H2" && <GatePanel gate="H2" />}
        
        {/* NEW: H-legal gate */}
        {phase === "H-legal" && <GatePanel gate="H-legal" />}

        {reached(phase, "rollout") && <RolloutStatus />}
        {phase === "H3" && <GatePanel gate="H3" />}

        {reached(phase, "live") && <LiveTile />}
        {reached(phase, "H4") && <InsightProposal />}
        {phase === "H4" && <GatePanel gate="H4" />}

        {phase === "done" && <ValueReadout />}
      </div>
    </WorkspaceShell>
  );
}
```

11. Update reached() helper to include H-legal in phase order check:

```typescript
const reached = (phase: Phase, target: Phase): boolean => {
  const order: Phase[] = [
    "brief",
    "planning",
    "H1",
    "content",
    "localization",
    "qa",
    "H2",
    "H-legal",  // NEW
    "rollout",
    "H3",
    "live",
    "H4",
    "done",
  ];
  return order.indexOf(phase) >= order.indexOf(target);
};
```

### Verification

After implementing, the demo flow should show:
1. Strategy agent rationale mentions "added H-legal gate for EU compliance"
2. PlanCard shows 5 gates (not 4): H1, H2, H-legal, H3, H4
3. WorkflowDag shows H-legal node between H2 and rollout
4. In demo mode, H-legal auto-approves after 2.2s pause
5. Partner rail shows H-legal compliance rationale before rollout

---

## Gap 2: All 16 Variants Not Fully Rendered — MEDIUM

### Spec Requirement (v5-clean-slate.md, lines 444-489)

From "CONTENT GENERATION BEAT":
```
In center panel: **Real rendered ad creative** with image + headline + body + CTA, in a variant grid.

### Localization (de-DE → de-AT / de-CH / fr-CH)
UI shows side-by-side diff: de-DE vs. de-CH with highlighted changes. Locale chips toggle views.
```

And from "H2 GATE" (line 523):
```
Similar to H1, but reviewing:
- Generated content (3 variants × 4 locales = 12 total)
```

**Note**: The spec says "3 variants × 4 locales = 12" but the fixture has 4 base concepts, so it should be **4 base × 4 locales = 16 total**.

### Current State

**File: `src/components/timeline/ContentSection.tsx`**

Only shows first variant per locale (4 cards total):
```typescript
const baseRow = variants.filter((v) => v.id.startsWith("v_1_"));
```

**File: `src/fixtures/camp_04.ts`**

Fixture correctly generates all 16 variants (4 concepts × 4 locales):
```typescript
export const variants: AdVariant[] = (() => {
  const out: AdVariant[] = [];
  const locales = ["de-DE", "de-AT", "de-CH", "fr-CH"];
  for (let i = 0; i < 4; i++) {
    for (const locale of locales) {
      // ... generates v_1_de-DE, v_1_de-AT, v_1_de-CH, v_1_fr-CH,
      //                v_2_de-DE, v_2_de-AT, etc. (16 total)
    }
  }
  return out;
})();
```

### Implementation

**File: `src/components/timeline/ContentSection.tsx`**

Replace with full variant display organized by base concept:

```typescript
import { useWorkspace } from "@/store/workspace";
import { VariantCard } from "./VariantCard";
import { useState } from "react";

export function ContentSection() {
  const variants = useWorkspace((s) => s.variants);
  const [expandedConcept, setExpandedConcept] = useState<number | null>(null);

  // Group variants by base concept (v_1_*, v_2_*, v_3_*, v_4_*)
  const conceptGroups = [1, 2, 3, 4].map((conceptNum) => ({
    conceptNum,
    variants: variants.filter((v) => v.id.startsWith(`v_${conceptNum}_`)),
  }));

  const totalVariants = variants.length;

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Content agent · output
          </p>
          <h2 className="text-sm font-semibold">
            4 base concepts × 4 locales = {totalVariants} variants
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald">
          Generated · 87% confidence
        </span>
      </header>

      {/* Compact view: show first locale of each concept */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {conceptGroups.map(({ conceptNum, variants: group }) => {
          const deDE = group.find((v) => v.locale === "de-DE");
          if (!deDE) return null;
          return (
            <div key={conceptNum} className="space-y-2">
              <VariantCard variant={deDE} />
              <button
                onClick={() =>
                  setExpandedConcept(expandedConcept === conceptNum ? null : conceptNum)
                }
                className="w-full rounded-sm border border-border bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-black/5 hover:text-foreground"
              >
                {expandedConcept === conceptNum ? "Hide" : "Show"} all locales ({group.length})
              </button>
            </div>
          );
        })}
      </div>

      {/* Expanded view: show all locales for selected concept */}
      {expandedConcept && (
        <div className="rounded-sm border-2 border-hilti bg-hilti-soft p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-hilti">
              Concept {expandedConcept} · All locales
            </h3>
            <button
              onClick={() => setExpandedConcept(null)}
              className="font-mono text-[10px] uppercase tracking-wider text-hilti hover:underline"
            >
              Collapse
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {conceptGroups
              .find((g) => g.conceptNum === expandedConcept)
              ?.variants.map((v) => <VariantCard key={v.id} variant={v} />)}
          </div>
        </div>
      )}

      {/* Summary footer */}
      <div className="rounded-sm border border-border bg-white p-3">
        <p className="font-mono text-[10px] text-muted-foreground">
          Total generated: {totalVariants} variants across de-DE, de-AT, de-CH, fr-CH
        </p>
      </div>
    </section>
  );
}
```

### Alternative (Simpler): Tabbed View by Locale

If the expandable approach is too complex, use a simpler tabbed view:

```typescript
import { useWorkspace } from "@/store/workspace";
import { VariantCard } from "./VariantCard";
import { useState } from "react";

export function ContentSection() {
  const variants = useWorkspace((s) => s.variants);
  const [selectedLocale, setSelectedLocale] = useState<string>("de-DE");

  const locales = ["de-DE", "de-AT", "de-CH", "fr-CH"];
  const filteredVariants = variants.filter((v) => v.locale === selectedLocale);

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Content agent · output
          </p>
          <h2 className="text-sm font-semibold">
            4 base concepts × 4 locales = {variants.length} variants
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald">
          Generated · 87% confidence
        </span>
      </header>

      {/* Locale tabs */}
      <div className="flex gap-2">
        {locales.map((locale) => {
          const count = variants.filter((v) => v.locale === locale).length;
          return (
            <button
              key={locale}
              onClick={() => setSelectedLocale(locale)}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                selectedLocale === locale
                  ? "border-hilti bg-hilti text-white"
                  : "border-border bg-white text-muted-foreground hover:bg-black/5"
              }`}
            >
              {locale} ({count})
            </button>
          );
        })}
      </div>

      {/* Variant grid for selected locale */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {filteredVariants.map((v) => (
          <VariantCard key={v.id} variant={v} />
        ))}
      </div>
    </section>
  );
}
```

### Verification

After implementing:
1. ContentSection shows "4 base concepts × 4 locales = 16 variants" in header
2. User can toggle between locales OR expand/collapse concept groups
3. All 16 variant cards are accessible (not just the 4 base de-DE ones)
4. QA panel correctly reports "16 / 16 variants passing" after auto-fix

---

## Additional Polish (Optional — Not Counted in Gap Score)

### Minor: ValueReadout Gate Count

**File: `src/components/timeline/ValueReadout.tsx`**

Current shows "Gates approved: X / 4" but should be "X / 5" if H-legal is implemented:

```typescript
<Metric label="Gates approved" value={`${gateCount} / 5`} sub="H1 → H-legal → H3 → H4" />
```

### Minor: PlanCard Gate Count

Current correctly shows dynamic gate count, but consider highlighting agent-proposed gates:

```typescript
<ul className="space-y-1.5 text-xs">
  {gateNodes.map((n) => (
    <li key={n.id} className="flex items-center gap-2">
      <span
        className={`rounded-sm border px-1 font-mono text-[9px] font-bold ${
          n.gate?.startsWith("H-")
            ? "border-emerald bg-emerald/10 text-emerald"  // agent-proposed
            : "border-hilti text-hilti"  // required
        }`}
      >
        {n.gate}
      </span>
      <span>{n.label.replace(/^H[\d-]+:\s*/, "")}</span>
      {n.gate?.startsWith("H-") && (
        <span className="ml-auto font-mono text-[9px] uppercase text-emerald">
          ↑ agent-proposed
        </span>
      )}
    </li>
  ))}
</ul>
```

---

## Priority Ranking

### Critical (Must-Have for 100% Spec Compliance)

1. **H-legal gate implementation** — 3 points, demonstrates core architectural claim (open gate namespace, agent autonomy)
2. **16 variants fully rendered** — 2 points, proves localization fanout works end-to-end

### Nice-to-Have (Already Compliant, Polish Only)

3. Visual distinction for agent-proposed vs. required gates (already works, just enhance clarity)
4. Gate count footer updates (cosmetic)

---

## Implementation Order

**Phase 1 (Critical Gaps):**
1. Add H-legal to fixtures (camp_04.ts) — 10 min
2. Update types + workspace phase order — 5 min
3. Add H-legal to GatePanel copy — 2 min
4. Add H-legal rendering in index.tsx — 3 min
5. Test demo flow-through with H-legal — 5 min

**Phase 2 (16 Variants):**
6. Replace ContentSection with tabbed locale view — 15 min
7. Verify all 16 variants render correctly — 5 min

**Total estimated time: ~45 minutes**

---

## Testing Checklist

After implementation, verify:

- [ ] Demo mode auto-advances through 5 gates: H1 → H2 → H-legal → H3 → H4
- [ ] Partner rail shows H-legal compliance rationale at correct phase
- [ ] PlanCard displays 5 gates with "H-legal" badged differently (or with "agent-proposed" label)
- [ ] WorkflowDag renders H-legal node between H2 and rollout
- [ ] ContentSection shows all 16 variants (4 concepts × 4 locales)
- [ ] Locale tabs or expand/collapse UI allows viewing all variants
- [ ] QA panel correctly reports "16 / 16" after auto-fix applied
- [ ] ValueReadout shows "Gates approved: 5 / 5" at done phase
- [ ] No console errors during full demo flow-through

---

## Rationale for Gap Prioritization

**Why H-legal is Critical (3 pts):**
The open gate namespace is a **core architectural differentiator** between v5 (agent-driven) and v4 (template-driven). The spec explicitly calls out H-legal as the demo example (lines 336-374), and without it, the prototype looks like it just hardcodes 4 gates — contradicting the "agent proposes" claim. This is load-bearing for the value prop.

**Why 16 variants matters (2 pts):**
The spec's success criteria (line 692-698) emphasizes "Render real, not stubbed." Showing only 4/16 variants makes the localization fanout feel like vaporware. The fixture already generates all 16 — the UI just needs to expose them. This is about **proof**, not capability.

**Why other items are polish:**
Gate count labels and visual badges are nice-to-haves. The functionality already works correctly (the system processes 5 gates), it just doesn't visually emphasize which ones are agent-proposed vs. required. Not spec-breaking.

---

## Success Metric

After these changes, builder2 should score **100/100** on v5-clean-slate compliance:
- ✅ All architectural requirements met (agent plans, decision rationales, open gates)
- ✅ All demo choreography beats working (H1 → H-legal → H3 → H4 flow-through)
- ✅ All 16 variants visible (4 concepts × 4 locales)
- ✅ Value prop clearly demonstrated (agent autonomy + human control)

---

*Prepared: 2026-06-30 | Builder2 Gap Analysis | For Lovable implementation*
