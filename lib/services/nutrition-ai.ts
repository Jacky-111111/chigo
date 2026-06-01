import { z } from "zod";

const nutritionEstimateSchema = z.object({
  calories: z.number().int().min(0).max(10000).nullable(),
  protein_g: z.number().min(0).max(1000).nullable(),
  fat_g: z.number().min(0).max(1000).nullable(),
  carbs_g: z.number().min(0).max(1000).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export type NutritionEstimateResult = z.infer<typeof nutritionEstimateSchema>;

export type MealNutritionAiResult = {
  provider: "openai";
  model: string;
  estimate: NutritionEstimateResult;
};

export const defaultNutritionTimeoutMs = 45_000;

const nutritionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["calories", "protein_g", "fat_g", "carbs_g", "confidence"],
  properties: {
    calories: {
      type: ["integer", "null"],
      minimum: 0,
      maximum: 10000,
      description: "Estimated total calories for the meal.",
    },
    protein_g: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 1000,
      description: "Estimated protein in grams.",
    },
    fat_g: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 1000,
      description: "Estimated fat in grams.",
    },
    carbs_g: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 1000,
      description: "Estimated carbohydrates in grams.",
    },
    confidence: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 1,
      description: "Confidence in the estimate.",
    },
  },
} as const;

export function getNutritionAiConfig() {
  return {
    provider: "openai" as const,
    model:
      process.env.OPENAI_NUTRITION_MODEL ??
      process.env.OPENAI_MENU_MODEL ??
      "gpt-4o-mini",
    timeoutMs: getNutritionTimeoutMs(process.env.OPENAI_NUTRITION_TIMEOUT_MS),
  };
}

export function getNutritionTimeoutMs(value?: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return defaultNutritionTimeoutMs;
  }

  return Math.min(Math.max(Math.trunc(parsed), 10_000), 120_000);
}

export async function estimateMealNutrition({
  mealName,
  notes,
  restaurantName,
  menuItemName,
  imageDataUrl,
}: {
  mealName: string;
  notes?: string | null;
  restaurantName?: string | null;
  menuItemName?: string | null;
  imageDataUrl?: string | null;
}): Promise<MealNutritionAiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const config = getNutritionAiConfig();

  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to the project environment, then retry nutrition estimation.",
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildNutritionPrompt({
                  mealName,
                  notes,
                  restaurantName,
                  menuItemName,
                  hasImage: Boolean(imageDataUrl),
                }),
              },
              ...(imageDataUrl
                ? [
                    {
                      type: "input_image",
                      image_url: imageDataUrl,
                      detail: "high",
                    },
                  ]
                : []),
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "chigo_meal_nutrition_estimate",
            strict: true,
            schema: nutritionJsonSchema,
          },
        },
      }),
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(
        `Nutrition estimation timed out after ${Math.round(config.timeoutMs / 1000)} seconds. Please retry.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(
      getOpenAiErrorMessage(payload) ??
        `OpenAI request failed with ${response.status}.`,
    );
  }

  const parsed = JSON.parse(getOutputText(payload)) as unknown;
  const estimate = nutritionEstimateSchema.parse(parsed);

  return {
    provider: config.provider,
    model: config.model,
    estimate,
  };
}

function buildNutritionPrompt({
  mealName,
  notes,
  restaurantName,
  menuItemName,
  hasImage,
}: {
  mealName: string;
  notes?: string | null;
  restaurantName?: string | null;
  menuItemName?: string | null;
  hasImage: boolean;
}) {
  return [
    "You are ChiGo's nutrition estimator. Return JSON only and follow the schema.",
    "Estimate calories, protein, fat, and carbohydrates for the meal.",
    "This is not medical advice. Make conservative estimates and use null when there is not enough information.",
    hasImage
      ? "Use the meal photo for portion and ingredient clues."
      : "No photo is available; rely on the text details.",
    `Meal name: ${mealName}.`,
    restaurantName ? `Restaurant: ${restaurantName}.` : "Restaurant: unknown.",
    menuItemName
      ? `Linked menu item: ${menuItemName}.`
      : "Linked menu item: none.",
    notes ? `User notes: ${notes}.` : "User notes: none.",
  ].join("\n");
}

function getOutputText(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "output_text" in payload &&
    typeof payload.output_text === "string" &&
    payload.output_text.trim().length > 0
  ) {
    return payload.output_text;
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("output" in payload) ||
    !Array.isArray(payload.output)
  ) {
    throw new Error("OpenAI returned no structured nutrition output.");
  }

  const output = payload.output as unknown[];
  const textParts = output.flatMap((item: unknown) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("content" in item) ||
      !Array.isArray(item.content)
    ) {
      return [];
    }

    const contentItems = item.content as unknown[];

    return contentItems.flatMap((content: unknown) => {
      if (!content || typeof content !== "object") {
        return [];
      }

      if ("text" in content && typeof content.text === "string") {
        return [content.text];
      }

      if ("refusal" in content && typeof content.refusal === "string") {
        throw new Error(content.refusal);
      }

      return [];
    });
  });

  const outputText = textParts.join("\n").trim();

  if (!outputText) {
    throw new Error("OpenAI returned an empty nutrition estimate.");
  }

  return outputText;
}

function getOpenAiErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return null;
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}
