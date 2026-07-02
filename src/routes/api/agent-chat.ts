import { createFileRoute } from "@tanstack/react-router";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { createAiGatewayProvider, resolveGatewayConfig } from "@/lib/ai-gateway.server";
import {
  buildOrchestratorSystemPrompt,
  buildOrchestratorContext,
  type ContextSnapshot,
} from "@/lib/orchestrator-prompt";

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

        const { messages, context } = (await request.json()) as Body;
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

        const system = `${buildOrchestratorSystemPrompt()}

${buildOrchestratorContext(snapshot)}`;

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
