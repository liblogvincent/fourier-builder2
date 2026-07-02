# Builder2 Prototype Review - Direction 2 (Agent Plans)

**Location**: `C:\Users\tutuclaw\Documents\luban\prototypes\v2-fourier-agent-led\builder2\`  
**Review Date**: 2026-06-30  
**Status**: Lovable-generated prototype

---

## ✅ What's CORRECT (Architectural Fixes Applied)

### 1. No CampaignTemplate ✅
```bash
$ grep -r "CampaignTemplate" src/
# Only comment: "CampaignPlan, not CampaignTemplate"
```
**Result**: ✅ Template-driven approach removed

### 2. CampaignPlan Interface ✅
```typescript
// src/types.ts:50-55
export interface CampaignPlan {
  id: string;
  briefId: string;
  nodes: PlanNode[];
  rationale: DecisionRationale;
}
```
**Result**: ✅ Agent-generated plan structure present

### 3. DecisionRationale ✅
```typescript
// src/types.ts:15-25
export interface DecisionRationale {
  id: string;
  agent: AgentName;
  decided: string;
  why: string[];
  alternatives: { option: string; rejected_because: string }[];
  confidence: number;
  knowledge_cited: string[];
  timestamp: string;
  status?: "thinking" | "decided" | "blocked";
}
```
**Result**: ✅ Complete decision rationale structure

### 4. Open Gate Namespace ✅
```typescript
// src/types.ts:3
export type GateId = string; // seed: "H1" | "H2" | "H3" | "H4" — agent may propose extras
```
**Result**: ✅ Not closed enum, allows agent-proposed gates

### 5. Partner Rail Component ✅
```
src/components/partner/PartnerRail.tsx
src/components/partner/RationaleCard.tsx
```
**Result**: ✅ Decision rationale visible in UI

### 6. Demo Mode Toggle ✅
```
src/components/top/DemoModeToggle.tsx
```
**Result**: ✅ Auto-approve mode for presentations

### 7. Key Components Present ✅
- ✅ `WorkflowDag.tsx` - Workflow graph visualization
- ✅ `GatePanel.tsx` - Gate approval UI
- ✅ `PlanCard.tsx` - Campaign plan display
- ✅ `QaPanel.tsx` - QA results
- ✅ `ContentSection.tsx` - Content variants
- ✅ `LocaleDiff.tsx` - Localization changes
- ✅ `InsightProposal.tsx` - H4 skill proposals
- ✅ `ValueReadout.tsx` - Time/cost metrics

---

## 🔍 Detailed Component Check

### Routes Present
```
routes/
├── index.tsx                    # Home/landing
├── campaigns.new.tsx           # New campaign brief
├── workspace.$id.tsx           # Campaign workspace
└── __root.tsx                  # Root layout
```

### Fixtures
```
fixtures/
└── camp_04.ts                  # Campaign 04 fixture data
```

---

## ⚠️ POTENTIAL GAPS (To Verify)

### 1. Missing Routes?

**Expected from v5 spec**:
- `/campaigns` - Campaign list view
- `/skills` - Skills registry page
- `/eval` - Eval chart page
- `/settings` - Settings page

**Check**:
```bash
$ find src/routes -name "*.tsx"
# Need to verify if these exist
```

**Status**: ⚠️ Need to verify all routes exist

### 2. Incomplete Fixtures?

**Expected from v5 spec** (lines 604-613):
- ✅ `camp_04` with full `CampaignPlan`
- ⚠️ 3 ad variants × 4 locales = 12 total?
- ⚠️ 1 planted fault in `v_g_specifier` ("revolutionary")?
- ⚠️ QA verdict with `suggested_fix`?
- ⚠️ 3 approved skills in registry?
- ⚠️ 1 proposed skill (awaiting H4)?
- ⚠️ 4 eval points for cost curve?

**Status**: ⚠️ Need to verify fixture completeness

### 3. H-legal Gate Example?

**Expected from v5 spec**:
- Agent-proposed "H-legal" gate as example
- Shows open namespace in action

**Status**: ⚠️ Need to check if H-legal is in fixtures

### 4. QA Auto-Fix Visual?

**Expected from v5 spec** (lines 497-511):
- Visual before/after diff
- "revolutionary" → "proven" shown
- Auto-fix animation or indicator

**Status**: ⚠️ Need to verify QA component shows auto-fix

### 5. Skills Page Functionality?

**Expected from v5 spec** (lines 579-588):
- Skills table view
- H4 promotion action
- Provenance shown (human vs AI)
- "Used In" campaign list

**Status**: ⚠️ Need to verify if skills page exists

### 6. Eval Chart?

**Expected from v5 spec** (lines 577-578):
- 4 campaigns on X-axis
- Cost declining curve
- Tooltip showing skill reuse impact

**Status**: ⚠️ Need to verify if eval route exists

---

## 🔧 Verification Checklist

Run these checks in the builder2 folder:

### Check 1: All Routes Exist
```bash
ls -la src/routes/
# Should have: index, campaigns, campaigns.new, workspace.$id, skills, eval, settings
```

### Check 2: Fixture Completeness
```bash
cat src/fixtures/camp_04.ts | grep -E "variant|locale|revolutionary|H-legal"
# Should have 12 variants, planted fault, H-legal gate
```

### Check 3: QA Component Has Auto-Fix
```bash
grep -r "auto.*fix\|suggested.*fix\|revolutionary" src/components/timeline/QaPanel.tsx
```

### Check 4: Skills Registry
```bash
grep -r "RegistryArtifact\|skill.*registry" src/
```

### Check 5: Demo Mode Works
```bash
grep -r "demoMode\|autoApprove" src/store/
```

---

## 📊 Summary Score

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **No CampaignTemplate** | ✅ Pass | No references found |
| **Has CampaignPlan** | ✅ Pass | Interface defined, used in fixtures |
| **Has DecisionRationale** | ✅ Pass | Complete interface, RationaleCard component |
| **Open gate namespace** | ✅ Pass | `GateId = string` |
| **Partner rail** | ✅ Pass | PartnerRail.tsx exists |
| **Demo mode** | ✅ Pass | DemoModeToggle.tsx exists |
| **All routes** | ⚠️ Unknown | Need to verify |
| **Complete fixtures** | ⚠️ Unknown | Need to verify camp_04.ts depth |
| **QA auto-fix visual** | ⚠️ Unknown | Need to verify QaPanel |
| **Skills page** | ⚠️ Unknown | Need to verify route exists |
| **Eval chart** | ⚠️ Unknown | Need to verify route exists |

**Overall**: ✅ Core architecture correct, ⚠️ Need to verify completeness

---

## 🎯 Next Actions

### Immediate
1. **List all routes**: `ls -la src/routes/`
2. **Check fixture depth**: `cat src/fixtures/camp_04.ts | wc -l`
3. **Verify H-legal**: `grep "H-legal" src/fixtures/camp_04.ts`

### If Missing
1. **Skills page**: May need to add `/skills` route
2. **Eval page**: May need to add `/eval` route
3. **Fixture enrichment**: Add remaining variants, H-legal gate, QA fault

### Testing
1. **Run the prototype**: `cd builder2 && bun dev`
2. **Click through workflow**: Brief → H1 → Content → H2 → H3 → H4
3. **Verify demo mode**: Toggle auto-approve, watch flow-through

---

## 💡 Assessment

**Lovable did well on**:
- ✅ Core architecture (no templates, has plans)
- ✅ Type system (DecisionRationale, open gates)
- ✅ Key components (PartnerRail, gates, workflow)

**Potentially incomplete**:
- ⚠️ Full route coverage (skills, eval pages)
- ⚠️ Fixture depth (12 variants, all locales)
- ⚠️ Edge cases (H-legal example, auto-fix visual)

**Recommendation**: 
1. Run the prototype
2. Walk through full workflow
3. Document what works vs v5 spec
4. Fill gaps if critical

---

*Location: prototypes/v2-fourier-agent-led/builder2/*  
*Review: Initial assessment based on file structure*  
*Next: Runtime verification needed*
