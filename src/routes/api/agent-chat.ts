import { createFileRoute } from "@tanstack/react-router";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { createAiGatewayProvider, resolveGatewayConfig } from "@/lib/ai-gateway.server";
import {
  buildOrchestratorSystemPrompt,
  buildOrchestratorContext,
  type ContextSnapshot,
} from "@/lib/orchestrator-prompt";
import {
  CAMPAIGN_PLANNING_PROMPT,
  CONTENT_PLANNING_PROMPT,
  ROLLOUT_PROMPT,
} from "@/lib/agent-prompts";

type ContextBody = {
  campaign?: string;
  product?: string;
  market?: string;
  locales?: string[];
  currentPhase?: string;
  phaseLabel?: string;
  gatesPassed?: string[];
  gatesPending?: string[];
  variantCount?: number;
  qaSummary?: string;
  lastRationale?: string;
  agentBusy?: string | null;
  runMode?: string;
};

type Body = {
  messages: UIMessage[];
  context?: ContextBody;
  /** Specialist agent type — if set, uses that agent's system prompt instead of Orchestrator */
  agentType?: "campaign-planning" | "content-planning" | "rollout";
};

export const Route = createFileRoute("/api/agent-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let config;
        try {
          config = resolveGatewayConfig();
        } catch {
          return new Response("No AI gateway configured. Set LLM_580_API_KEY and LLM_580_BASE_URL environment variables.", { status: 500 });
        }

        const { messages, context, agentType } = (await request.json()) as Body;
        if (!Array.isArray(messages))
          return new Response("messages required", { status: 400 });

        const gateway = createAiGatewayProvider(config);

        const snapshot: ContextSnapshot = {
          campaign: context?.campaign ?? "n/a",
          product: context?.product ?? "n/a",
          market: context?.market ?? "n/a",
          locales: context?.locales ?? [],
          currentPhase: context?.currentPhase ?? "brief",
          phaseLabel: context?.phaseLabel ?? "Brief intake — campaign context loaded",
          gatesPassed: context?.gatesPassed ?? [],
          gatesPending: context?.gatesPending ?? [],
          variantCount: context?.variantCount ?? 0,
          qaSummary: context?.qaSummary ?? "n/a",
          lastRationale: context?.lastRationale ?? "none",
          agentBusy: context?.agentBusy ?? null,
          runMode: context?.runMode ?? "n/a",
        };

        // Select system prompt based on agent type
        let system: string;
        if (agentType === "campaign-planning") {
          system = `${CAMPAIGN_PLANNING_PROMPT}

## Current Campaign State
- Campaign: ${snapshot.campaign}
- Product: ${snapshot.product}
- Market: ${snapshot.market}
- Locales: ${snapshot.locales.join(", ") || "none"}
- Current Phase: ${snapshot.currentPhase} — ${snapshot.phaseLabel}
- Gates Passed: ${snapshot.gatesPassed.join(", ") || "none"}
- Variant Count: ${snapshot.variantCount}
- QA Summary: ${snapshot.qaSummary}
- Last Agent Decision: ${snapshot.lastRationale}

You are speaking with the campaign strategist. Be thorough but scannable. Cite specific numbers and benchmarks. Welcome counter-proposals and revisions.`;
        } else if (agentType === "content-planning") {
          system = `${CONTENT_PLANNING_PROMPT}

## Current Campaign State
- Campaign: ${snapshot.campaign}
- Product: ${snapshot.product}
- Market: ${snapshot.market}
- Locales: ${snapshot.locales.join(", ") || "none"}
- Current Phase: ${snapshot.currentPhase} — ${snapshot.phaseLabel}
- Variant Count: ${snapshot.variantCount}
- Last Agent Decision: ${snapshot.lastRationale}

You are speaking with the content team. Walk through the Creative Concept (Big Idea, Look & Feel, Key Visual), cross-channel requirements table, storyboard directions, and Figma board mapping. Discuss each section before asking for approval.`;
        } else if (agentType === "rollout") {
          system = `${ROLLOUT_PROMPT}

## Current Campaign State
- Campaign: ${snapshot.campaign}
- Product: ${snapshot.product}
- Market: ${snapshot.market}
- Locales: ${snapshot.locales.join(", ") || "none"}
- Current Phase: ${snapshot.currentPhase} — ${snapshot.phaseLabel}
- Variant Count: ${snapshot.variantCount}
- QA Summary: ${snapshot.qaSummary}
- Last Agent Decision: ${snapshot.lastRationale}

You are speaking with the campaign operations manager. Show publishing status, QA results, UTM tracking, and optimization recommendations. Be clear about what is simulated vs real.`;
        } else {
          system = `${buildOrchestratorSystemPrompt()}

${buildOrchestratorContext(snapshot)}`;
        }

        const modelId = process.env.LLM_MODEL || "gpt-5.4";

        const result = streamText({
          model: gateway(modelId),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
