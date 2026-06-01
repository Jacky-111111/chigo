import { afterEach, describe, expect, it } from "vitest";
import {
  defaultNutritionTimeoutMs,
  getNutritionAiConfig,
  getNutritionTimeoutMs,
} from "@/lib/services/nutrition-ai";

describe("getNutritionAiConfig", () => {
  const originalNutritionModel = process.env.OPENAI_NUTRITION_MODEL;
  const originalMenuModel = process.env.OPENAI_MENU_MODEL;
  const originalTimeout = process.env.OPENAI_NUTRITION_TIMEOUT_MS;

  afterEach(() => {
    if (originalNutritionModel === undefined) {
      delete process.env.OPENAI_NUTRITION_MODEL;
    } else {
      process.env.OPENAI_NUTRITION_MODEL = originalNutritionModel;
    }

    if (originalMenuModel === undefined) {
      delete process.env.OPENAI_MENU_MODEL;
    } else {
      process.env.OPENAI_MENU_MODEL = originalMenuModel;
    }

    if (originalTimeout === undefined) {
      delete process.env.OPENAI_NUTRITION_TIMEOUT_MS;
    } else {
      process.env.OPENAI_NUTRITION_TIMEOUT_MS = originalTimeout;
    }
  });

  it("prefers the nutrition model and falls back to the menu model", () => {
    process.env.OPENAI_MENU_MODEL = "gpt-4o-mini";
    process.env.OPENAI_NUTRITION_MODEL = "gpt-5-mini";

    expect(getNutritionAiConfig().model).toBe("gpt-5-mini");

    delete process.env.OPENAI_NUTRITION_MODEL;

    expect(getNutritionAiConfig().model).toBe("gpt-4o-mini");
  });
});

describe("getNutritionTimeoutMs", () => {
  it("uses a safe default when the env value is missing or invalid", () => {
    expect(getNutritionTimeoutMs()).toBe(defaultNutritionTimeoutMs);
    expect(getNutritionTimeoutMs("not-a-number")).toBe(
      defaultNutritionTimeoutMs,
    );
  });

  it("clamps configured timeout values", () => {
    expect(getNutritionTimeoutMs("100")).toBe(10_000);
    expect(getNutritionTimeoutMs("45000")).toBe(45_000);
    expect(getNutritionTimeoutMs("500000")).toBe(120_000);
  });
});
