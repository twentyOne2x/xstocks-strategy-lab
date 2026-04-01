import { z } from "../../shared/node_modules/zod/index.js";

import {
  discoverySelectionSchema,
  nonEmptyStringSchema,
} from "../../shared/dist/contracts/common.js";

const qualificationModePreferenceSchema = z.enum(["basket", "directional"]);

const questionOptionQualificationSchema = z.object({
  modePreference: qualificationModePreferenceSchema.optional(),
  selection: discoverySelectionSchema.optional(),
  directionalOptIn: z.boolean().optional(),
  yieldBufferAllowed: z.boolean().optional(),
  fitNote: nonEmptyStringSchema,
});

const questionOptionSchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  qualification: questionOptionQualificationSchema,
});

const questionSchema = z.object({
  id: nonEmptyStringSchema,
  screenIndex: z.number().int().positive(),
  conditional: z.boolean().optional(),
  triggeredByQuestionId: nonEmptyStringSchema.optional(),
  triggeredByOptionIds: z.array(nonEmptyStringSchema).optional(),
  prompt: nonEmptyStringSchema,
  helper: nonEmptyStringSchema,
  options: z.array(questionOptionSchema).min(1),
});

export const QUALIFICATION_QUESTION_CATALOG_VERSION =
  "xstocks_qualification_catalog_v1";

export const qualificationQuestionCatalogSchema = z.object({
  version: z.literal(QUALIFICATION_QUESTION_CATALOG_VERSION),
  questions: z.array(questionSchema).min(1),
});

export const QUALIFICATION_QUESTION_CATALOG = qualificationQuestionCatalogSchema.parse(
  {
    version: QUALIFICATION_QUESTION_CATALOG_VERSION,
    questions: [
      {
        id: "q_goal_preference",
        screenIndex: 1,
        prompt: "What should this strategy optimize for first?",
        helper:
          "This is the strongest signal for which portfolio to start with.",
        options: [
          {
            id: "broad_exposure",
            label: "Broad xStocks exposure",
            description:
              "Start with a wide basket across the xStocks universe.",
            qualification: {
              selection: { type: "theme", key: "broad-market" },
              yieldBufferAllowed: true,
              fitNote:
                "Broad exposure keeps the basket wide and the setup simpler.",
            },
          },
          {
            id: "theme_tilt",
            label: "A clear equity theme",
            description:
              "Lean into a visible market theme with named xStocks.",
            qualification: {
              selection: { type: "theme", key: "ai-infra" },
              fitNote:
                "The user wants a recognizable theme lane, not a generic index basket.",
            },
          },
          {
            id: "leaders",
            label: "Highest-conviction leaders",
            description:
              "Concentrate in the names showing the strongest leadership.",
            qualification: {
              selection: { type: "theme", key: "cross-market-leaders" },
              fitNote:
                "Leader-first selection means a tighter, more active basket.",
            },
          },
          {
            id: "unsure",
            label: "Choose a strong default for me",
            description:
              "Not sure yet is fine. We start with the broadest, simplest preview.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote: "Uncertainty routes to the safest default preview.",
            },
          },
        ],
      },
      {
        id: "q_theme_preference",
        screenIndex: 1,
        conditional: true,
        triggeredByQuestionId: "q_goal_preference",
        triggeredByOptionIds: ["theme_tilt"],
        prompt: "Which market theme should the basket lean into?",
        helper: "Pick the equity theme that fits your conviction.",
        options: [
          {
            id: "tech_ai",
            label: "Tech + AI leaders",
            description: "AI infrastructure and platform leaders.",
            qualification: {
              selection: { type: "theme", key: "ai-infra" },
              fitNote: "Tech/AI lane selected.",
            },
          },
          {
            id: "consumer_platforms",
            label: "Consumer + internet platforms",
            description: "Consumer internet and marketplace names.",
            qualification: {
              selection: { type: "theme", key: "us-tech-leaders" },
              fitNote: "Consumer platform lane selected.",
            },
          },
          {
            id: "quality_cashflow",
            label: "Quality + cashflow leaders",
            description: "Steady cash-generating mega cap names.",
            qualification: {
              selection: { type: "theme", key: "spy-core" },
              fitNote: "Quality/cashflow lane selected.",
            },
          },
          {
            id: "unsure",
            label: "Not sure — pick the cleanest setup",
            description:
              "We will pick the theme with the cleanest setup right now.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Theme left open; system picks the cleanest default.",
            },
          },
        ],
      },
      {
        id: "q_expression_preference",
        screenIndex: 2,
        prompt: "How much expression do you want?",
        helper: "This decides how concentrated and active the basket gets.",
        options: [
          {
            id: "simple",
            label: "Keep it simple",
            description:
              "Fewer decisions, broader holdings, less movement.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Simple expression caps concentration and activity.",
            },
          },
          {
            id: "tilted",
            label: "Give me a noticeable tilt",
            description:
              "Some theme or conviction without constant movement.",
            qualification: {
              fitNote:
                "Tilted expression supports thematic or moderately active baskets.",
            },
          },
          {
            id: "active",
            label: "Make it selective and active",
            description:
              "Tighter basket, more frequent refreshes, higher conviction.",
            qualification: {
              fitNote:
                "Active expression required for directional eligibility.",
            },
          },
          {
            id: "unsure",
            label: "Not sure",
            description:
              "We default toward simpler unless other signals are clear.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Expression uncertainty resolves toward simpler setup.",
            },
          },
        ],
      },
      {
        id: "q_risk_level",
        screenIndex: 3,
        prompt: "How much swing should this wallet take?",
        helper:
          "This sets how concentrated the basket gets and caps single-name weights.",
        options: [
          {
            id: "low",
            label: "Keep swings lower",
            description: "Broader basket, tighter single-name caps.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote: "Low risk means broader basket and tighter caps.",
            },
          },
          {
            id: "medium",
            label: "Balanced swings",
            description:
              "A reasonable middle between protection and upside.",
            qualification: {
              fitNote: "Medium risk is the default band.",
            },
          },
          {
            id: "high",
            label: "Accept bigger swings",
            description:
              "Tighter basket and larger top weights for more upside potential.",
            qualification: {
              fitNote:
                "High risk allows tighter baskets and larger position sizes.",
            },
          },
          {
            id: "unsure",
            label: "Not sure",
            description:
              "We resolve to medium unless the safe-default path applies.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote: "Risk uncertainty resolves to medium.",
            },
          },
        ],
      },
      {
        id: "q_drawdown_sensitivity",
        screenIndex: 3,
        conditional: true,
        triggeredByQuestionId: "q_risk_level",
        triggeredByOptionIds: ["low", "medium", "high"],
        prompt:
          "In a rough stretch, how protective should this setup feel?",
        helper: "Optional refinement — skip if unsure.",
        options: [
          {
            id: "high",
            label: "Keep drawdowns tighter",
            description:
              "Clip aggressiveness to reduce worst-case depth.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "High drawdown sensitivity clips risk one tier.",
            },
          },
          {
            id: "medium",
            label: "Moderate pullbacks are fine",
            description:
              "Accept some depth for better upside potential.",
            qualification: {
              fitNote:
                "Moderate drawdown tolerance is the default.",
            },
          },
          {
            id: "low",
            label: "I can live with deeper pullbacks",
            description:
              "More room for the strategy to run without tightening.",
            qualification: {
              fitNote:
                "Low drawdown sensitivity allows higher volatility tolerance.",
            },
          },
          {
            id: "unset",
            label: "Skip / not sure",
            description:
              "Leave this unset and let the system use the risk answer alone.",
            qualification: {
              fitNote: "Drawdown refinement skipped.",
            },
          },
        ],
      },
      {
        id: "q_rebalance_preference",
        screenIndex: 4,
        prompt: "How often should the strategy refresh itself?",
        helper:
          "Rebalancing trims, adds, or swaps names to stay in line with its rules.",
        options: [
          {
            id: "low_touch",
            label: "Mostly leave winners alone",
            description:
              "Monthly checks with drift thresholds. Minimal movement.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Low-touch rebalancing keeps turnover minimal.",
            },
          },
          {
            id: "scheduled",
            label: "Refresh on a steady rhythm",
            description:
              "Biweekly or monthly refreshes. Predictable cadence.",
            qualification: {
              fitNote:
                "Scheduled rebalancing is the default cadence.",
            },
          },
          {
            id: "active",
            label: "Refresh more often to track leadership",
            description:
              "Weekly or event-driven refreshes when conditions shift.",
            qualification: {
              fitNote:
                "Active rebalancing supports faster leadership tracking.",
            },
          },
          {
            id: "unsure",
            label: "Not sure",
            description: "We resolve to a steady scheduled rhythm.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Rebalance uncertainty resolves to scheduled cadence.",
            },
          },
        ],
      },
      {
        id: "q_directional_appetite",
        screenIndex: 5,
        prompt:
          "When the market tone turns, how should this strategy behave?",
        helper:
          "Directional means the strategy can change market stance, not just reshuffle names.",
        options: [
          {
            id: "long_only",
            label: "Stay long and rotate within xStocks",
            description:
              "Keep the basket long-only and rotate between names.",
            qualification: {
              modePreference: "basket",
              directionalOptIn: false,
              fitNote:
                "Long-only keeps the strategy rotating within the basket.",
            },
          },
          {
            id: "adaptive",
            label: "Stay long, but get more defensive",
            description:
              "Still long-led, but can get more cautious when conditions deteriorate.",
            qualification: {
              modePreference: "basket",
              directionalOptIn: false,
              fitNote: "Adaptive stays long-led but can tilt defensive.",
            },
          },
          {
            id: "directional",
            label: "Let it change market stance",
            description:
              "This setup can do more than reshuffle names. It can change stance when conditions change.",
            qualification: {
              modePreference: "directional",
              directionalOptIn: true,
              fitNote:
                "Directional opt-in enabled but still hard-gated.",
            },
          },
          {
            id: "unsure",
            label: "Keep it simple for now",
            description:
              "We resolve to long-only to keep it straightforward.",
            qualification: {
              modePreference: "basket",
              directionalOptIn: false,
              yieldBufferAllowed: true,
              fitNote: "Stance uncertainty resolves to long-only.",
            },
          },
        ],
      },
      {
        id: "q_automation_comfort",
        screenIndex: 6,
        prompt:
          "How comfortable are you with the strategy adjusting on its own once funded?",
        helper:
          "This decides whether event-driven shifts are allowed or the strategy stays predictable.",
        options: [
          {
            id: "low",
            label: "Keep it predictable",
            description:
              "No surprises. Changes only on a fixed schedule.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Low automation blocks directional and caps mode complexity.",
            },
          },
          {
            id: "medium",
            label: "Regular rules-based changes are fine",
            description:
              "Comfortable with the strategy following its own rules on schedule.",
            qualification: {
              fitNote:
                "Medium automation is the default comfort level.",
            },
          },
          {
            id: "high",
            label: "Comfortable with faster rules-based shifts",
            description:
              "Fine with the strategy acting quickly when conditions warrant.",
            qualification: {
              fitNote:
                "High automation required for directional eligibility.",
            },
          },
          {
            id: "unsure",
            label: "Not sure",
            description:
              "We resolve to medium — regular rules-based changes.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Automation uncertainty resolves to medium.",
            },
          },
        ],
      },
      {
        id: "q_certainty",
        screenIndex: 7,
        prompt: "How decided are you right now?",
        helper:
          "This sets how confidently we match you and how we explain the recommendation.",
        options: [
          {
            id: "high",
            label: "I know the portfolio I want",
            description:
              "Lock in the recommendation with high confidence.",
            qualification: {
              fitNote:
                "High certainty supports full recommendation confidence.",
            },
          },
          {
            id: "medium",
            label: "I have a leaning and want a good match",
            description: "Match me based on the answers I gave.",
            qualification: {
              fitNote: "Medium certainty supports solid recommendation.",
            },
          },
          {
            id: "unsure",
            label: "Skip / not sure",
            description:
              "Treat this as exploring. Keep the match flexible and explain the preview plainly.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Certainty left open — treat the user as exploring.",
            },
          },
          {
            id: "low",
            label: "I'm mostly exploring",
            description:
              "Show me the preview and let me look around.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote:
                "Exploring — preview stays broad and low-commitment.",
            },
          },
          {
            id: "default_requested",
            label: "Give me the safest default preview",
            description:
              "Start with the broadest, simplest setup. Tighten it later.",
            qualification: {
              yieldBufferAllowed: true,
              fitNote: "Default requested — safe fallback applied.",
            },
          },
        ],
      },
    ],
  },
);

const answerShape = Object.fromEntries(
  QUALIFICATION_QUESTION_CATALOG.questions.map((question) => [
    question.id,
    z.enum(question.options.map((option) => option.id)).optional(),
  ]),
);

export const qualificationAnswerMapSchema = z.object(answerShape).strict();

const questionIndex = new Map(
  QUALIFICATION_QUESTION_CATALOG.questions.map((question) => [question.id, question]),
);

export function getQualificationQuestion(questionId) {
  return questionIndex.get(questionId) ?? null;
}

export function getQualificationOption(questionId, optionId) {
  const question = getQualificationQuestion(questionId);
  if (!question) {
    return null;
  }

  return question.options.find((option) => option.id === optionId) ?? null;
}
