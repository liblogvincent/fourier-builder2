## Why you don't "see" an agent today

The prototype has agent *avatars* (Agent Constellation on Home, Agent Roster on Workspace), but no **agent you can talk to**. The current UI only reflects agent state that a scripted workflow triggers — it never asks the user what to do, never plans, never generates. So visually the six circles sit idle until you press "Advance" in the workspace. For a demo pitched as "AI agent as interface to steer, plan, create," that reads as *no agent*.

Two gaps to close:

1. **No conversational surface.** There's no chat, no prompt box, no way to say "plan a Nuron launch for DE/AT/CH" and watch the agent respond.
2. **The constellation looks passive.** It's a status widget, not an actor. Users don't realize those circles *are* agents until something moves.

There's also a live bug on Home: `AI_NoObjectGeneratedError: response did not match schema` — the structured-output call is failing silently in the background, which reinforces the "nothing is happening" feeling.

## Plan

### 1. Add a real Agent Console on Home (primary change)

Replace the "My Tasks" left column on `/` with an **Agent Console** — a chat surface powered by Lovable AI Gateway (Gemini 3 Flash). This becomes the visible, interactive agent.

```text
┌───────────────────────────────┬────────────────────────┐
│  AGENT CONSOLE (chat)         │  AGENT CONSTELLATION   │
│                               │                        │
│  🟢 Orchestrator · Gemini     │      ┌────┐            │
│  ─────────────────────────    │      │YOU │            │
│  > Plan Nuron launch for      │      └─┬──┘            │
│    DE/AT/CH, 3 channels       │   S  C │  L  Q  R  I   │
│                               │        │                │
│  ✎ Strategy agent drafting…   │  Active: Strategy      │
│  ✓ Plan ready — [Approve H1]  │                        │
│  [Suggested] Run localization │                        │
└───────────────────────────────┴────────────────────────┘
│  My Tasks (role-filtered) — moved below                │
│  Recent campaigns                                      │
```

Behavior:
- Free-text prompt at the bottom. Enter → streams a response from Gemini via a `createServerFn` (`src/lib/agent.functions.ts`).
- The **Orchestrator agent** interprets intent and calls one of a small tool set:
  - `plan_campaign` → advances phase to `planning`, populates the plan.
  - `generate_content` → runs content phase.
  - `localize`, `run_qa`, `rollout` → same pattern.
  - `open_campaign(id)` → loads a brief.
  - `approve_gate(gateId)` → moves past H1/H2/etc.
- Tool calls flip `agentBusy` in `useWorkspace`, so the **Agent Constellation next to it animates in real time** — you literally see the agent light up while it works.
- Suggested next actions render as inline buttons ("Approve plan", "Run localization"), so non-typing users can still steer.

### 2. Make the constellation feel alive on idle

- Add a soft ambient pulse to the center "YOU" node and a "waiting for your instruction →" pointer to the console.
- Show a one-line "Last said:" bubble echoing the most recent user prompt.
- On page load with an empty stream, show 2–3 starter prompts as chips ("Plan a new campaign", "What's blocking camp_04?", "Show localization diffs").

### 3. Fix the `AI_NoObjectGeneratedError`

The Home page currently triggers a structured-output call that fails against its Zod schema (visible in runtime errors). Investigate `src/lib/agents.functions.ts` and either:
- enable `structuredOutputs: true` on the provider (required for OpenAI models to enforce strict `json_schema`), or
- simplify the schema (flatten, drop enums/bounds) for Gemini.
Add a try/catch that surfaces the error into the Agent Console instead of throwing to the runtime overlay.

### 4. Small labeling change

Rename the Home H1 from "Your agents, at a glance" → **"Agent workspace"** and add a subline: *"Chat with the orchestrator. It plans, delegates to specialist agents, and asks you to approve gates."* This sets the mental model up front.

## Technical notes

- New files: `src/components/home/AgentConsole.tsx`, `src/lib/agent.functions.ts` (server fn using `streamText` + tools + Lovable AI Gateway helper already in `src/lib/ai-gateway.server.ts`).
- Reuse existing `useWorkspace` actions (`advance`, `loadBrief`, gate approvals) as the tool `execute` bodies — no new business logic.
- Model: `google/gemini-3-flash-preview`. Tools use `stopWhen: stepCountIs(50)`.
- `MyTasksPanel` moves to a full-width row under the console/constellation pair; nothing is deleted.
- Workspace route (`/workspace`) unchanged; the Agent Roster stays where it is.

## Out of scope

- No thread persistence for now (single conversation, in-memory). Can add later if you want history.
- No changes to the DAG, gates, timeline components, or fixtures.
- No new roles or auth.

Approve this and I'll implement it in build mode.