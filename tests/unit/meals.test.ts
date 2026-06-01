import { describe, expect, it } from "vitest";
import {
  calculateMacroCalories,
  calculateNutritionTotals,
  getMealEstimateStats,
  getMealTimingBuckets,
  type MealLogWithDetails,
} from "@/lib/services/meals";

describe("calculateNutritionTotals", () => {
  it("adds estimated nutrition across meals", () => {
    const meals = [
      meal({
        calories: 500,
        protein_g: 30,
        fat_g: 15,
        carbs_g: 55,
      }),
      meal({
        calories: 720,
        protein_g: 42,
        fat_g: 24,
        carbs_g: 80,
      }),
    ];

    expect(calculateNutritionTotals(meals)).toEqual({
      calories: 1220,
      proteinG: 72,
      fatG: 39,
      carbsG: 135,
    });
  });
});

describe("calculateMacroCalories", () => {
  it("converts macro grams into calorie distribution", () => {
    expect(
      calculateMacroCalories({
        calories: 1000,
        proteinG: 50,
        fatG: 20,
        carbsG: 100,
      }),
    ).toEqual({
      protein: 200,
      fat: 180,
      carbs: 400,
      total: 780,
    });
  });
});

describe("getMealEstimateStats", () => {
  it("calculates coverage for meals with estimates", () => {
    const meals = [
      meal({ calories: 300 }),
      meal(null),
      meal({ calories: 600 }),
    ];

    expect(getMealEstimateStats(meals)).toEqual({
      mealsWithEstimates: 2,
      mealsWithoutEstimates: 1,
      estimateCoveragePercent: 67,
    });
  });
});

describe("getMealTimingBuckets", () => {
  it("groups meals by app-local eating time", () => {
    const buckets = getMealTimingBuckets([
      { eaten_at: "2026-06-01T12:00:00.000Z" },
      { eaten_at: "2026-06-01T17:00:00.000Z" },
      { eaten_at: "2026-06-01T22:00:00.000Z" },
      { eaten_at: "2026-06-02T03:30:00.000Z" },
    ]);

    expect(buckets.map((bucket) => [bucket.key, bucket.count])).toEqual([
      ["breakfast", 1],
      ["lunch", 1],
      ["dinner", 1],
      ["lateNight", 1],
    ]);
  });
});

function meal(
  nutrition: Partial<MealLogWithDetails["nutrition"]> | null,
): MealLogWithDetails {
  return {
    id: crypto.randomUUID(),
    user_id: "user-1",
    restaurant_id: null,
    menu_item_id: null,
    meal_name: "Meal",
    photo_url: null,
    eaten_at: "2026-06-01T16:00:00.000Z",
    notes: null,
    created_at: "2026-06-01T16:00:00.000Z",
    updated_at: "2026-06-01T16:00:00.000Z",
    restaurant: null,
    menuItem: null,
    nutrition: nutrition
      ? {
          meal_log_id: "meal-1",
          calories: nutrition.calories ?? null,
          protein_g: nutrition.protein_g ?? null,
          fat_g: nutrition.fat_g ?? null,
          carbs_g: nutrition.carbs_g ?? null,
          confidence: null,
          ai_provider: null,
          ai_model: null,
          created_at: "2026-06-01T16:00:00.000Z",
          updated_at: "2026-06-01T16:00:00.000Z",
        }
      : null,
    signedPhotoUrl: null,
  };
}
