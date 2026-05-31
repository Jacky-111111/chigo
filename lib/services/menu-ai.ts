import { z } from "zod";

const menuItemAnalysisSchema = z.object({
  original_name: z.string().trim().min(1).max(140),
  translated_name: z.string().trim().max(140).nullable(),
  description: z.string().trim().max(500).nullable(),
  ingredients: z.array(z.string().trim().min(1).max(80)).max(24),
  cooking_method: z.string().trim().max(180).nullable(),
  cuisine_context: z.string().trim().max(300).nullable(),
  dietary_warnings: z.array(z.string().trim().min(1).max(60)).max(12),
  recommendation_score: z.number().int().min(0).max(100).nullable(),
  recommendation_reason: z.string().trim().max(320).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

const menuAnalysisSchema = z.object({
  source_language: z.string().trim().max(80).nullable(),
  extracted_text: z.string().trim().max(8000).nullable(),
  items: z.array(menuItemAnalysisSchema).min(1).max(50),
});

export type MenuAnalysisResult = z.infer<typeof menuAnalysisSchema>;

export type MenuAnalysisPreferences = {
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteCuisines: string[];
};

export type MenuAiResult = {
  provider: "openai";
  model: string;
  analysis: MenuAnalysisResult;
};

const menuAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["source_language", "extracted_text", "items"],
  properties: {
    source_language: {
      type: ["string", "null"],
      description:
        "Detected language of the menu image, such as Chinese, English, or Korean.",
    },
    extracted_text: {
      type: ["string", "null"],
      description: "Best-effort OCR text from the menu image.",
    },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "original_name",
          "translated_name",
          "description",
          "ingredients",
          "cooking_method",
          "cuisine_context",
          "dietary_warnings",
          "recommendation_score",
          "recommendation_reason",
          "confidence",
        ],
        properties: {
          original_name: {
            type: "string",
            description:
              "Dish name exactly as it appears, preserving source language when visible.",
          },
          translated_name: {
            type: ["string", "null"],
            description:
              "Dish name translated into the requested target language.",
          },
          description: {
            type: ["string", "null"],
            description:
              "Short explanation of the dish in the target language.",
          },
          ingredients: {
            type: "array",
            items: { type: "string" },
            description: "Likely visible or commonly expected ingredients.",
          },
          cooking_method: {
            type: ["string", "null"],
            description:
              "Likely cooking method, such as fried, steamed, grilled, raw, or simmered.",
          },
          cuisine_context: {
            type: ["string", "null"],
            description:
              "Brief culinary context that helps a diner understand the dish.",
          },
          dietary_warnings: {
            type: "array",
            items: { type: "string" },
            description:
              "Possible warnings such as pork, shellfish, nuts, dairy, gluten, spicy, or raw.",
          },
          recommendation_score: {
            type: ["integer", "null"],
            minimum: 0,
            maximum: 100,
            description:
              "Personalized fit score based on the provided dining preferences.",
          },
          recommendation_reason: {
            type: ["string", "null"],
            description:
              "One-sentence reason for the score, including preference matches or conflicts.",
          },
          confidence: {
            type: ["number", "null"],
            minimum: 0,
            maximum: 1,
            description: "Confidence in OCR and dish inference.",
          },
        },
      },
    },
  },
} as const;

export function getMenuAiConfig() {
  return {
    provider: "openai" as const,
    model: process.env.OPENAI_MENU_MODEL ?? "gpt-4o-mini",
  };
}

export async function analyzeMenuImage({
  imageDataUrl,
  targetLanguage,
  preferences,
  restaurantName,
}: {
  imageDataUrl: string;
  targetLanguage: string;
  preferences: MenuAnalysisPreferences;
  restaurantName?: string | null;
}): Promise<MenuAiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const config = getMenuAiConfig();

  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to the project environment, then retry analysis.",
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
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
              text: buildMenuPrompt({
                targetLanguage,
                preferences,
                restaurantName,
              }),
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "chigo_menu_analysis",
          strict: true,
          schema: menuAnalysisJsonSchema,
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(
      getOpenAiErrorMessage(payload) ??
        `OpenAI request failed with ${response.status}.`,
    );
  }

  const outputText = getOutputText(payload);
  const parsedJson = JSON.parse(outputText) as unknown;
  const analysis = menuAnalysisSchema.parse(parsedJson);

  return {
    ...config,
    analysis,
  };
}

function buildMenuPrompt({
  targetLanguage,
  preferences,
  restaurantName,
}: {
  targetLanguage: string;
  preferences: MenuAnalysisPreferences;
  restaurantName?: string | null;
}) {
  const preferenceLines = [
    `Dietary restrictions: ${preferences.dietaryRestrictions.join(", ") || "none provided"}`,
    `Allergies: ${preferences.allergies.join(", ") || "none provided"}`,
    `Favorite cuisines: ${preferences.favoriteCuisines.join(", ") || "none provided"}`,
  ];

  return [
    "You are ChiGo's menu assistant. Return JSON only and follow the provided schema.",
    "Read the menu image, extract likely menu items, translate them, and explain them for a diner.",
    "Treat all ingredients, allergens, and cooking methods as estimates unless they are explicitly visible.",
    "Do not invent prices. Do not include non-food decorative text unless it names a menu section or dish.",
    `Target language code: ${targetLanguage}.`,
    restaurantName
      ? `Restaurant context: ${restaurantName}.`
      : "Restaurant context: unknown.",
    ...preferenceLines,
  ].join("\n");
}

function getOutputText(payload: unknown) {
  if (hasOutputText(payload)) {
    return payload.output_text;
  }

  if (!hasOutputArray(payload)) {
    throw new Error("OpenAI returned no structured text output.");
  }

  const textParts = payload.output.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("content" in item) ||
      !Array.isArray(item.content)
    ) {
      return [];
    }

    return item.content.flatMap((content) => {
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
    throw new Error("OpenAI returned an empty menu analysis.");
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

function hasOutputText(payload: unknown): payload is { output_text: string } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "output_text" in payload &&
      typeof payload.output_text === "string" &&
      payload.output_text.trim().length > 0,
  );
}

function hasOutputArray(
  payload: unknown,
): payload is { output: Array<{ content?: Array<Record<string, unknown>> }> } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "output" in payload &&
      Array.isArray(payload.output),
  );
}
