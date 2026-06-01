import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  addDays,
  getLocalDayUtcRange,
  getWeekStartDateString,
} from "@/lib/utils/date-range";
import type {
  MealLog,
  MealNutritionEstimate,
  MenuItem,
  MenuUpload,
  NutritionGoal,
  Restaurant,
} from "@/types/database";

export type MealMenuItemOption = Pick<
  MenuItem,
  "id" | "original_name" | "translated_name"
> & {
  restaurantName: string | null;
};

export type MealLogWithDetails = MealLog & {
  restaurant: Pick<Restaurant, "id" | "name" | "cuisine"> | null;
  menuItem: Pick<MenuItem, "id" | "original_name" | "translated_name"> | null;
  nutrition: MealNutritionEstimate | null;
  signedPhotoUrl: string | null;
};

export type NutritionTotals = {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export type DailyMealJournal = {
  date: string;
  meals: MealLogWithDetails[];
  totals: NutritionTotals;
};

export type WeeklyNutritionSummary = {
  weekStartDate: string;
  weekEndDate: string;
  days: Array<{
    date: string;
    mealCount: number;
    totals: NutritionTotals;
  }>;
  mealsLogged: number;
  averageDailyCalories: number;
  topRestaurants: Array<{ name: string; count: number }>;
  insight: string;
};

export async function getNutritionGoals(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nutrition_goals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as NutritionGoal | null;
}

export async function listMealFormOptions(userId: string) {
  if (!hasSupabaseEnv()) {
    return {
      restaurants: [] as Restaurant[],
      menuItems: [] as MealMenuItemOption[],
    };
  }

  const supabase = await createClient();
  const [{ data: restaurants, error: restaurantsError }, menuItems] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      listMealMenuItemOptions(userId),
    ]);

  if (restaurantsError) {
    throw new Error(restaurantsError.message);
  }

  return {
    restaurants: (restaurants ?? []) as Restaurant[],
    menuItems,
  };
}

export async function getDailyMealJournal(userId: string, date: string) {
  const { startIso, endIso } = getLocalDayUtcRange(date);
  const meals = await listMealLogsInRange(userId, startIso, endIso);

  return {
    date,
    meals,
    totals: calculateNutritionTotals(meals),
  } satisfies DailyMealJournal;
}

export async function getMealDetail(mealId: string, userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("id", mealId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [meal] = await hydrateMealLogs([data as MealLog]);
  return meal ?? null;
}

export async function getWeeklyNutritionSummary(
  userId: string,
  weekStartDate: string,
) {
  const normalizedWeekStart = getWeekStartDateString(weekStartDate);
  const weekEndDate = addDays(normalizedWeekStart, 7);
  const { startIso } = getLocalDayUtcRange(normalizedWeekStart);
  const { startIso: endIso } = getLocalDayUtcRange(weekEndDate);
  const meals = await listMealLogsInRange(userId, startIso, endIso);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(normalizedWeekStart, index);
    const dayMeals = meals.filter(
      (meal) =>
        meal.eaten_at >= getLocalDayUtcRange(date).startIso &&
        meal.eaten_at < getLocalDayUtcRange(date).endIso,
    );

    return {
      date,
      mealCount: dayMeals.length,
      totals: calculateNutritionTotals(dayMeals),
    };
  });
  const totalCalories = days.reduce((sum, day) => sum + day.totals.calories, 0);

  return {
    weekStartDate: normalizedWeekStart,
    weekEndDate: addDays(normalizedWeekStart, 6),
    days,
    mealsLogged: meals.length,
    averageDailyCalories: Math.round(totalCalories / 7),
    topRestaurants: getTopRestaurants(meals),
    insight: buildWeeklyInsight(days, meals),
  } satisfies WeeklyNutritionSummary;
}

export async function getSignedMealPhotoUrl(storagePath: string | null) {
  if (!storagePath || !hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("meal-images")
    .createSignedUrl(storagePath, 60 * 10);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

async function listMealLogsInRange(
  userId: string,
  startIso: string,
  endIso: string,
) {
  if (!hasSupabaseEnv()) {
    return [] satisfies MealLogWithDetails[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("eaten_at", startIso)
    .lt("eaten_at", endIso)
    .order("eaten_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateMealLogs((data ?? []) as MealLog[]);
}

async function hydrateMealLogs(meals: MealLog[]) {
  if (meals.length === 0) {
    return [] satisfies MealLogWithDetails[];
  }

  const supabase = await createClient();
  const restaurantIds = [
    ...new Set(
      meals.flatMap((meal) => (meal.restaurant_id ? [meal.restaurant_id] : [])),
    ),
  ];
  const menuItemIds = [
    ...new Set(
      meals.flatMap((meal) => (meal.menu_item_id ? [meal.menu_item_id] : [])),
    ),
  ];
  const mealIds = meals.map((meal) => meal.id);

  const [
    { data: restaurants, error: restaurantsError },
    { data: menuItems, error: menuItemsError },
    { data: estimates, error: estimatesError },
  ] = await Promise.all([
    restaurantIds.length
      ? supabase
          .from("restaurants")
          .select("id,name,cuisine")
          .in("id", restaurantIds)
      : Promise.resolve({ data: [], error: null }),
    menuItemIds.length
      ? supabase
          .from("menu_items")
          .select("id,original_name,translated_name")
          .in("id", menuItemIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("meal_nutrition_estimates")
      .select("*")
      .in("meal_log_id", mealIds),
  ]);

  if (restaurantsError) {
    throw new Error(restaurantsError.message);
  }

  if (menuItemsError) {
    throw new Error(menuItemsError.message);
  }

  if (estimatesError) {
    throw new Error(estimatesError.message);
  }

  const restaurantMap = new Map(
    (
      (restaurants ?? []) as Array<Pick<Restaurant, "id" | "name" | "cuisine">>
    ).map((restaurant) => [restaurant.id, restaurant]),
  );
  const menuItemMap = new Map(
    (
      (menuItems ?? []) as Array<
        Pick<MenuItem, "id" | "original_name" | "translated_name">
      >
    ).map((item) => [item.id, item]),
  );
  const nutritionMap = new Map(
    ((estimates ?? []) as MealNutritionEstimate[]).map((estimate) => [
      estimate.meal_log_id,
      estimate,
    ]),
  );

  return Promise.all(
    meals.map(async (meal) => ({
      ...meal,
      restaurant: meal.restaurant_id
        ? (restaurantMap.get(meal.restaurant_id) ?? null)
        : null,
      menuItem: meal.menu_item_id
        ? (menuItemMap.get(meal.menu_item_id) ?? null)
        : null,
      nutrition: nutritionMap.get(meal.id) ?? null,
      signedPhotoUrl: await getSignedMealPhotoUrl(meal.photo_url),
    })),
  );
}

async function listMealMenuItemOptions(userId: string) {
  const supabase = await createClient();
  const { data: uploads, error: uploadsError } = await supabase
    .from("menu_uploads")
    .select("id,restaurant_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (uploadsError) {
    throw new Error(uploadsError.message);
  }

  const uploadRows = (uploads ?? []) as Array<
    Pick<MenuUpload, "id" | "restaurant_id">
  >;

  if (uploadRows.length === 0) {
    return [] satisfies MealMenuItemOption[];
  }

  const uploadIds = uploadRows.map((upload) => upload.id);
  const restaurantIds = [
    ...new Set(
      uploadRows.flatMap((upload) =>
        upload.restaurant_id ? [upload.restaurant_id] : [],
      ),
    ),
  ];
  const [
    { data: items, error: itemsError },
    { data: restaurants, error: restaurantsError },
  ] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id,menu_upload_id,original_name,translated_name,sort_order")
      .in("menu_upload_id", uploadIds)
      .order("sort_order", { ascending: true })
      .limit(120),
    restaurantIds.length
      ? supabase.from("restaurants").select("id,name").in("id", restaurantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (restaurantsError) {
    throw new Error(restaurantsError.message);
  }

  const uploadRestaurantMap = new Map(
    uploadRows.map((upload) => [upload.id, upload.restaurant_id]),
  );
  const restaurantMap = new Map(
    ((restaurants ?? []) as Array<Pick<Restaurant, "id" | "name">>).map(
      (restaurant) => [restaurant.id, restaurant.name],
    ),
  );

  return (
    (items ?? []) as Array<
      Pick<
        MenuItem,
        "id" | "menu_upload_id" | "original_name" | "translated_name"
      >
    >
  ).map((item) => {
    const restaurantId = uploadRestaurantMap.get(item.menu_upload_id);

    return {
      id: item.id,
      original_name: item.original_name,
      translated_name: item.translated_name,
      restaurantName: restaurantId
        ? (restaurantMap.get(restaurantId) ?? null)
        : null,
    };
  });
}

export function calculateNutritionTotals(meals: MealLogWithDetails[]) {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + (meal.nutrition?.calories ?? 0),
      proteinG: totals.proteinG + Number(meal.nutrition?.protein_g ?? 0),
      fatG: totals.fatG + Number(meal.nutrition?.fat_g ?? 0),
      carbsG: totals.carbsG + Number(meal.nutrition?.carbs_g ?? 0),
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 } satisfies NutritionTotals,
  );
}

function getTopRestaurants(meals: MealLogWithDetails[]) {
  const counts = new Map<string, number>();

  for (const meal of meals) {
    if (!meal.restaurant?.name) {
      continue;
    }

    counts.set(
      meal.restaurant.name,
      (counts.get(meal.restaurant.name) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}

function buildWeeklyInsight(
  days: WeeklyNutritionSummary["days"],
  meals: MealLogWithDetails[],
) {
  if (meals.length === 0) {
    return "Log a few meals this week to unlock a more useful nutrition pattern.";
  }

  const totals = days.reduce(
    (sum, day) => ({
      calories: sum.calories + day.totals.calories,
      proteinG: sum.proteinG + day.totals.proteinG,
      fatG: sum.fatG + day.totals.fatG,
      carbsG: sum.carbsG + day.totals.carbsG,
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 },
  );
  const macroEntries: Array<{ label: string; value: number }> = [
    { label: "protein", value: totals.proteinG },
    { label: "fat", value: totals.fatG },
    { label: "carbs", value: totals.carbsG },
  ];
  const strongestMacro =
    macroEntries.sort((a, b) => b.value - a.value)[0]?.label ?? "carbs";
  const loggedDays = days.filter((day) => day.mealCount > 0).length;

  return `You logged ${meals.length} meals across ${loggedDays} days. Your estimates leaned most toward ${strongestMacro}, so compare that with your goal before making changes.`;
}
