import { describe, expect, it } from "vitest";
import {
  mealLogFormSchema,
  nutritionGoalsFormSchema,
  parseMealEatenAt,
  validateOptionalMealImageFile,
} from "@/lib/validations/meal";

describe("mealLogFormSchema", () => {
  it("normalizes optional ids and trims text fields", () => {
    const result = mealLogFormSchema.parse({
      mealId: "",
      restaurantId: "",
      menuItemId: "",
      mealName: "  Chicken bowl  ",
      eatenAt: "2026-06-01T12:30",
      notes: "  extra sauce  ",
    });

    expect(result.mealId).toBeNull();
    expect(result.restaurantId).toBeNull();
    expect(result.menuItemId).toBeNull();
    expect(result.mealName).toBe("Chicken bowl");
    expect(result.notes).toBe("extra sauce");
  });
});

describe("nutritionGoalsFormSchema", () => {
  it("accepts empty numeric goals as null values", () => {
    const result = nutritionGoalsFormSchema.parse({
      dailyCalorieTarget: "",
      dailyProteinTargetG: "",
      goalType: "balanced",
      customGoalNote: "",
    });

    expect(result.dailyCalorieTarget).toBeNull();
    expect(result.dailyProteinTargetG).toBeNull();
    expect(result.goalType).toBe("balanced");
  });
});

describe("validateOptionalMealImageFile", () => {
  it("accepts an omitted file", () => {
    expect(validateOptionalMealImageFile(null)).toEqual({
      ok: true,
      file: null,
    });
  });

  it("accepts HEIC uploads by extension when the browser omits the MIME type", () => {
    const result = validateOptionalMealImageFile(
      new File(["meal"], "meal.heic"),
    );

    expect(result.ok).toBe(true);
  });
});

describe("parseMealEatenAt", () => {
  it("parses the app-local meal time into UTC", () => {
    expect(parseMealEatenAt("2026-06-01T12:30")).toBe(
      "2026-06-01T16:30:00.000Z",
    );
  });
});
