import { describe, expect, it } from "vitest";
import {
  buildMealCheckInDays,
  calculateMacroCalories,
  calculateCurrentMealStreak,
  calculateNutritionTotals,
  getMealCheckInSlotKey,
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

describe("meal check-in helpers", () => {
  it("maps local meal times to breakfast, lunch, and dinner slots", () => {
    expect(getMealCheckInSlotKey("2026-06-01T12:00:00.000Z")).toBe("breakfast");
    expect(getMealCheckInSlotKey("2026-06-01T17:00:00.000Z")).toBe("lunch");
    expect(getMealCheckInSlotKey("2026-06-01T23:00:00.000Z")).toBe("dinner");
    expect(getMealCheckInSlotKey("2026-06-02T04:30:00.000Z")).toBeNull();
  });

  it("builds 42 stable calendar days with three visible meal slots", () => {
    const days = buildMealCheckInDays({
      calendarStartDate: "2026-05-31",
      monthStartDate: "2026-06-01",
      selectedDate: "2026-06-01",
      todayDate: "2026-06-01",
      meals: [
        { eaten_at: "2026-06-01T12:00:00.000Z" },
        { eaten_at: "2026-06-01T17:00:00.000Z" },
        { eaten_at: "2026-06-01T23:00:00.000Z" },
      ],
    });
    const selectedDay = days.find((day) => day.date === "2026-06-01");

    expect(days).toHaveLength(42);
    expect(selectedDay?.completedSlots).toBe(3);
    expect(selectedDay?.isCompleteDay).toBe(true);
    expect(selectedDay?.slots.map((slot) => slot.completed)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("calculates a current streak ending today", () => {
    expect(
      calculateCurrentMealStreak(
        [
          { eaten_at: "2026-05-30T16:00:00.000Z" },
          { eaten_at: "2026-05-31T16:00:00.000Z" },
          { eaten_at: "2026-06-01T16:00:00.000Z" },
        ],
        "2026-06-01",
      ),
    ).toBe(3);
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
