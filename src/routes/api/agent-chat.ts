import { createFileRoute } from "@tanstack/react-router";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { createAiGatewayProvider, resolveGatewayConfig } from "@/lib/ai-gateway.server";

type Body = {
  messages: UIMessage[];
  context?: {
    campaign?: string;
    phase?: string;
    market?: string;
    locales?: string[];
    agentBusy?: string | null;
    lastRationale?: string;
  };
};

export const Route = createFileRoute("/api/agent-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let config;
        try {
          config = resolveGatewayConfig();
        } catch {
          return new Response("No AI gateway configured. Set LLM_580_API_KEY+LLM_580_BASE_URL or LOVABLE_API_KEY.", { status: 500 });
        }

        const { messages, context } = (await request.json()) as Body;
        if (!Array.isArray(messages))
          return new Response("messages required", { status: 400 });

        const gateway = createAiGatewayProvider(config);

        const system = `You are the **Orchestrator**, an AI agent that runs paid-social campaigns for Hilti. You coordinate six specialist agents: Strategy, Content, Localization, QA Judge, Rollout, Insights.

Your job is to be the user's interface — plan, steer, and explain. Be terse (max 4 short lines). When the user asks you to *do* something (plan, generate, localize, QA, roll out, approve), narrate what will happen and end with a single-line action tag on its own line, using EXACTLY one of:

[ACTION:ADVANCE]           — run the next phase
[ACTION:APPROVE:H1]        — approve gate H1 (or H2, H-C, H-legal, H3, H4)
[ACTION:LOAD:<campaignId>] — switch to a different campaign
[ACTION:RESET]             — reset current campaign to brief

Never invent action tags outside that list. If the user is just chatting or asking a question, answer without an action tag.

Current campaign context:
- campaign: ${context?.campaign ?? "n/a"}
- market: ${context?.market ?? "n/a"} · locales: ${(context?.locales ?? []).join(", ")}
- current phase: ${context?.phase ?? "brief"}
- agent working now: ${context?.agentBusy ?? "none"}
- last agent decision: ${context?.lastRationale ?? "none"}`;

        const modelId = process.env.LLM_MODEL || "claude-opus-4-8";

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
