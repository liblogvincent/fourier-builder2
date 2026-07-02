import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createAiGatewayProvider, resolveGatewayConfig } from "./ai-gateway.server";

const MODEL = process.env.LLM_580_MODEL || "claude-opus-4-8";

function gw() {
  const config = resolveGatewayConfig();
  return createAiGatewayProvider(config);
}

// Shared brief shape (kept tiny for schema-state budget)
const BriefIn = z.object({
  campaign: z.string(),
  product: z.string(),
  market: z.string(),
  audience: z.string(),
  objective: z.string(),
  channel: z.string(),
  locales: z.array(z.string()),
  budget_usd: z.number(),
  revisionFeedback: z.string().optional(),
});
type BriefInT = z.infer<typeof BriefIn>;

// ---- Strategy ----
const RationaleSchema = z.object({
  decided: z.string(),
  why: z.array(z.string()),
  alternatives: z.array(
    z.object({ option: z.string(), rejected_because: z.string() }),
  ),
  confidence: z.number(),
  knowledge_cited: z.array(z.string()),
});

export const runStrategy = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => BriefIn.parse(d))
  .handler(async ({ data }) => {
    const provider = gw();
    const { output } = await generateText({
      model: provider(MODEL),
      output: Output.object({ schema: RationaleSchema }),
      system:
        "You are Strategy, a senior campaign-planning agent at Hilti. Decide a paid-social campaign plan and return rationale. Confidence is 0..1. Be terse, specific, citing concrete knowledge sources.",
      prompt: planPrompt(data),
    });
    return output;
  });

// ---- Content ----
const VariantsSchema = z.object({
  variants: z.array(
    z.object({
      headline: z.string(),
      primary_text: z.string(),
      cta: z.string(),
    }),
  ),
});

export const runContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ brief: BriefIn, n: z.number().min(1).max(6) }).parse(d),
  )
  .handler(async ({ data }) => {
    const provider = gw();
    const baseLocale = data.brief.locales[0];
    const { output } = await generateText({
      model: provider(MODEL),
      output: Output.object({ schema: VariantsSchema }),
      system:
        "You are Content, a paid-social copywriter for Hilti. Brand voice: precision, durability, partnership. NEVER use hype adjectives (revolutionary, revolutionäre, game-changer, innovative). Headlines under 40 chars; primary_text under 125 chars. Match the requested locale exactly.",
      prompt: `Brief:\nproduct=${data.brief.product}\naudience=${data.brief.audience}\nobjective=${data.brief.objective}\nchannel=${data.brief.channel}\nlocale=${baseLocale}\n\nWrite ${data.n} distinct concepts in ${baseLocale}. Each: 1 headline, 1 primary_text, 1 cta. CTAs from: "Händler finden", "Mehr erfahren", "Demo buchen" (or fr equivalents if French locale). Vary the angle (torque/precision/durability/platform).`,
    });
    return output;
  });

// ---- Localization ----
const LocalizedSchema = z.object({
  localized: z.array(
    z.object({
      locale: z.string(),
      headline: z.string(),
      primary_text: z.string(),
      cta: z.string(),
    }),
  ),
  diffs: z.array(
    z.object({
      locale: z.string(),
      base_phrase: z.string(),
      localized_phrase: z.string(),
      reason: z.string(),
    }),
  ),
});

export const runLocalization = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        source: z.object({
          locale: z.string(),
          headline: z.string(),
          primary_text: z.string(),
          cta: z.string(),
        }),
        targetLocales: z.array(z.string()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const provider = gw();
    const { output } = await generateText({
      model: provider(MODEL),
      output: Output.object({ schema: LocalizedSchema }),
      system:
        "You are Localization for Hilti DACH+CH. Preserve SKU codes. CH market over-indexes on durability/heritage (swap safety leads for durability leads). fr-CH = full French translation. Keep CTA from approved list per locale.",
      prompt: `Source (${data.source.locale}):\nheadline=${data.source.headline}\nprimary_text=${data.source.primary_text}\ncta=${data.source.cta}\n\nTarget locales: ${data.targetLocales.join(", ")}.\nReturn one localized object per target locale, plus up to 3 noteworthy diff entries explaining market-driven changes.`,
    });
    return output;
  });

// ---- QA brand judge ----
const JudgeSchema = z.object({
  results: z.array(
    z.object({
      variant_id: z.string(),
      verdict: z.string(), // "pass" | "fail"
      score: z.number(),
      accuracy: z.number(),
      flagged_phrase: z.string().nullable(),
      reason: z.string().nullable(),
      suggestion: z.string().nullable(),
    }),
  ),
});

export const runQa = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        variants: z.array(
          z.object({
            id: z.string(),
            locale: z.string(),
            headline: z.string(),
            primary_text: z.string(),
          }),
        ),
        brandRules: z.array(z.string()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const provider = gw();
    const rules = (
      data.brandRules ?? [
        "Hilti Brand Voice v4.2 §4.2: no hype adjectives on iterative hardware updates. Blacklist: revolutionary, revolutionäre, revolutionnaire, game-changer, game-changing, innovative.",
        "No fear-based safety claims.",
        "Primary text must be ≤ 125 chars.",
      ]
    ).join("\n- ");

    const { output } = await generateText({
      model: provider(MODEL),
      output: Output.object({ schema: JudgeSchema }),
      system:
        "You are QA Brand Judge for Hilti. Apply the rules strictly. For each variant return verdict ('pass' or 'fail'), score (0..1), accuracy (your confidence 0..1), and on fail: the flagged_phrase, reason citing the rule, and a brand-aligned suggestion in the same locale.",
      prompt: `Rules:\n- ${rules}\n\nVariants:\n${data.variants
        .map(
          (v) =>
            `id=${v.id} locale=${v.locale}\n  H: ${v.headline}\n  P: ${v.primary_text}`,
        )
        .join("\n")}`,
    });
    return output;
  });

// ---- Insights ----
const SkillSchema = z.object({
  name: z.string(),
  type: z.string(), // Rule | Guideline | Playbook
  scope: z.string(), // Global | Channel | Market
  pattern: z.string(),
  body: z.string(),
  derived_from: z.string(),
  confidence: z.number(),
  hours_saved: z.number(),
  quality_delta: z.number(),
  rationale: RationaleSchema,
});

export const runInsights = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        campaignId: z.string(),
        faults: z.array(
          z.object({
            variant_id: z.string(),
            flagged_phrase: z.string(),
            reason: z.string(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const provider = gw();
    const { output } = await generateText({
      model: provider(MODEL),
      output: Output.object({ schema: SkillSchema }),
      system:
        "You are Insights, a meta-learning agent at Hilti. From QA faults across a campaign, propose ONE new reusable Skill (Rule/Guideline/Playbook) that would have caught the fault upstream. Provide a tight regex pattern, scope, and decision rationale.",
      prompt: `Campaign: ${data.campaignId}\nFaults:\n${data.faults
        .map((f) => `- ${f.variant_id}: "${f.flagged_phrase}" — ${f.reason}`)
        .join("\n")}\n\nPropose a skill that would prevent this class of fault in future campaigns.`,
    });
    return output;
  });

function planPrompt(b: BriefInT & { revisionFeedback?: string }) {
  const base = `Brief:
campaign=${b.campaign}
product=${b.product}
market=${b.market}
audience=${b.audience}
objective=${b.objective}
channel=${b.channel}
locales=${b.locales.join(", ")}
budget_usd=${b.budget_usd}

Decide: how many base concepts × how many locales, what to defer, key tradeoffs. Cite knowledge like "Hilti_Brand_Voice_v4.2", "DACH_Meta_2025_Q3_benchmarks".`;

  if (b.revisionFeedback) {
    return `${base}\n\n⚠️ REVISION REQUESTED — the reviewer sent the plan back with this feedback. Address every point:\n"${b.revisionFeedback}"\n\nGenerate a revised plan that addresses ALL the reviewer's concerns.`;
  }

  return base;
}
