import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  addDays,
  addMonths,
  appTimeZone,
  formatDateStringInTimeZone,
  getLocalDayUtcRange,
  getMonthStartDateString,
  getTodayDateString,
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

export type MealTimingBucket = {
  key: "breakfast" | "lunch" | "dinner" | "lateNight";
  label: string;
  count: number;
};

export type MacroCalorieDistribution = {
  protein: number;
  fat: number;
  carbs: number;
  total: number;
};

export type MealCheckInSlotKey = "breakfast" | "lunch" | "dinner";

export type MealCheckInSlot = {
  key: MealCheckInSlotKey;
  label: string;
  shortLabel: string;
  count: number;
  completed: boolean;
};

export type MealCheckInCalendarDay = {
  date: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  mealCount: number;
  completedSlots: number;
  isCompleteDay: boolean;
  slots: MealCheckInSlot[];
};

export type MealCheckInCalendar = {
  monthStartDate: string;
  previousMonthDate: string;
  nextMonthDate: string;
  monthLabel: string;
  daysInMonth: number;
  days: MealCheckInCalendarDay[];
  loggedDays: number;
  perfectDays: number;
  completedCheckIns: number;
  possibleCheckIns: number;
  completionPercent: number;
  currentStreak: number;
  longestStreak: number;
};

export type DailyMealJournal = {
  date: string;
  meals: MealLogWithDetails[];
  totals: NutritionTotals;
  mealsWithEstimates: number;
  mealsWithoutEstimates: number;
  estimateCoveragePercent: number;
  timingBuckets: MealTimingBucket[];
  largestMeal: {
    id: string;
    name: string;
    calories: number;
  } | null;
};

export type WeeklyNutritionSummary = {
  weekStartDate: string;
  weekEndDate: string;
  days: Array<{
    date: string;
    mealCount: number;
    totals: NutritionTotals;
  }>;
  totals: NutritionTotals;
  averageDaily: NutritionTotals;
  mealsLogged: number;
  loggedDays: number;
  averageDailyCalories: number;
  mealsWithEstimates: number;
  mealsWithoutEstimates: number;
  estimateCoveragePercent: number;
  macroCalories: MacroCalorieDistribution;
  timingBuckets: MealTimingBucket[];
  highestCalorieDay: {
    date: string;
    calories: number;
  } | null;
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
  const totals = calculateNutritionTotals(meals);

  return {
    date,
    meals,
    totals,
    ...getMealEstimateStats(meals),
    timingBuckets: getMealTimingBuckets(meals),
    largestMeal: getLargestMeal(meals),
  } satisfies DailyMealJournal;
}

export async function getMealCheckInCalendar(
  userId: string,
  selectedDate: string,
) {
  const monthStartDate = getMonthStartDateString(selectedDate);
  const nextMonthDate = addMonths(monthStartDate, 1);
  const previousMonthDate = addMonths(monthStartDate, -1);
  const calendarStartDate = addDays(
    monthStartDate,
    -getCalendarDayOfWeek(monthStartDate),
  );
  const calendarEndDate = addDays(calendarStartDate, 42);
  const todayDate = getTodayDateString();
  const [{ startIso }, { startIso: endIso }] = [
    getLocalDayUtcRange(calendarStartDate),
    getLocalDayUtcRange(calendarEndDate),
  ];
  const [{ startIso: streakStartIso }, { startIso: streakEndIso }] = [
    getLocalDayUtcRange(addDays(todayDate, -90)),
    getLocalDayUtcRange(addDays(todayDate, 1)),
  ];
  const [calendarMeals, streakMeals] = await Promise.all([
    listMealLogRowsInRange(userId, startIso, endIso),
    listMealLogRowsInRange(userId, streakStartIso, streakEndIso),
  ]);
  const days = buildMealCheckInDays({
    calendarStartDate,
    meals: calendarMeals,
    monthStartDate,
    selectedDate,
    todayDate,
  });
  const monthDays = days.filter((day) => day.inCurrentMonth);
  const possibleCheckIns = monthDays.length * mealCheckInSlots.length;
  const completedCheckIns = monthDays.reduce(
    (sum, day) => sum + day.completedSlots,
    0,
  );

  return {
    monthStartDate,
    previousMonthDate,
    nextMonthDate,
    monthLabel: formatMonthLabel(monthStartDate),
    daysInMonth: monthDays.length,
    days,
    loggedDays: monthDays.filter((day) => day.mealCount > 0).length,
    perfectDays: monthDays.filter((day) => day.isCompleteDay).length,
    completedCheckIns,
    possibleCheckIns,
    completionPercent:
      possibleCheckIns === 0
        ? 0
        : Math.round((completedCheckIns / possibleCheckIns) * 100),
    currentStreak: calculateCurrentMealStreak(streakMeals, todayDate),
    longestStreak: calculateLongestMealStreak(monthDays),
  } satisfies MealCheckInCalendar;
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
  const totals = days.reduce(
    (sum, day) => ({
      calories: sum.calories + day.totals.calories,
      proteinG: sum.proteinG + day.totals.proteinG,
      fatG: sum.fatG + day.totals.fatG,
      carbsG: sum.carbsG + day.totals.carbsG,
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 } satisfies NutritionTotals,
  );
  const estimateStats = getMealEstimateStats(meals);
  const highestCalorieDay =
    days
      .filter((day) => day.mealCount > 0)
      .sort((a, b) => b.totals.calories - a.totals.calories)[0] ?? null;

  return {
    weekStartDate: normalizedWeekStart,
    weekEndDate: addDays(normalizedWeekStart, 6),
    days,
    totals,
    averageDaily: {
      calories: Math.round(totals.calories / 7),
      proteinG: Math.round(totals.proteinG / 7),
      fatG: Math.round(totals.fatG / 7),
      carbsG: Math.round(totals.carbsG / 7),
    },
    mealsLogged: meals.length,
    loggedDays: days.filter((day) => day.mealCount > 0).length,
    averageDailyCalories: Math.round(totalCalories / 7),
    ...estimateStats,
    macroCalories: calculateMacroCalories(totals),
    timingBuckets: getMealTimingBuckets(meals),
    highestCalorieDay: highestCalorieDay
      ? {
          date: highestCalorieDay.date,
          calories: highestCalorieDay.totals.calories,
        }
      : null,
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

async function listMealLogRowsInRange(
  userId: string,
  startIso: string,
  endIso: string,
) {
  if (!hasSupabaseEnv()) {
    return [] satisfies Array<Pick<MealLog, "id" | "eaten_at">>;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_logs")
    .select("id,eaten_at")
    .eq("user_id", userId)
    .gte("eaten_at", startIso)
    .lt("eaten_at", endIso)
    .order("eaten_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<Pick<MealLog, "id" | "eaten_at">>;
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

export function calculateMacroCalories(
  totals: NutritionTotals,
): MacroCalorieDistribution {
  const protein = Math.round(totals.proteinG * 4);
  const fat = Math.round(totals.fatG * 9);
  const carbs = Math.round(totals.carbsG * 4);

  return {
    protein,
    fat,
    carbs,
    total: protein + fat + carbs,
  };
}

export function getMealEstimateStats(meals: MealLogWithDetails[]) {
  const mealsWithEstimates = meals.filter((meal) => meal.nutrition).length;
  const mealsWithoutEstimates = meals.length - mealsWithEstimates;

  return {
    mealsWithEstimates,
    mealsWithoutEstimates,
    estimateCoveragePercent:
      meals.length === 0
        ? 0
        : Math.round((mealsWithEstimates / meals.length) * 100),
  };
}

export function getMealTimingBuckets(
  meals: Array<Pick<MealLogWithDetails, "eaten_at">>,
) {
  const buckets: MealTimingBucket[] = [
    { key: "breakfast", label: "Breakfast", count: 0 },
    { key: "lunch", label: "Lunch", count: 0 },
    { key: "dinner", label: "Dinner", count: 0 },
    { key: "lateNight", label: "Late night", count: 0 },
  ];

  for (const meal of meals) {
    const hour = getMealHour(meal.eaten_at);

    if (hour >= 5 && hour < 11) {
      buckets[0].count += 1;
    } else if (hour >= 11 && hour < 16) {
      buckets[1].count += 1;
    } else if (hour >= 16 && hour < 21) {
      buckets[2].count += 1;
    } else {
      buckets[3].count += 1;
    }
  }

  return buckets;
}

const mealCheckInSlots: Array<{
  key: MealCheckInSlotKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "breakfast", label: "Breakfast", shortLabel: "B" },
  { key: "lunch", label: "Lunch", shortLabel: "L" },
  { key: "dinner", label: "Dinner", shortLabel: "D" },
];

export function getMealCheckInSlotKey(
  value: string,
): MealCheckInSlotKey | null {
  const hour = getMealHour(value);

  if (hour >= 5 && hour < 11) {
    return "breakfast";
  }

  if (hour >= 11 && hour < 16) {
    return "lunch";
  }

  if (hour >= 16 && hour < 23) {
    return "dinner";
  }

  return null;
}

export function buildMealCheckInDays({
  calendarStartDate,
  meals,
  monthStartDate,
  selectedDate,
  todayDate,
}: {
  calendarStartDate: string;
  meals: Array<Pick<MealLog, "eaten_at">>;
  monthStartDate: string;
  selectedDate: string;
  todayDate: string;
}) {
  const mealsByDate = new Map<string, MealCheckInSlot[]>();
  const mealCountsByDate = new Map<string, number>();
  const monthPrefix = monthStartDate.slice(0, 7);

  for (const meal of meals) {
    const date = formatDateStringInTimeZone(new Date(meal.eaten_at));
    const slotKey = getMealCheckInSlotKey(meal.eaten_at);
    mealCountsByDate.set(date, (mealCountsByDate.get(date) ?? 0) + 1);

    if (!slotKey) {
      continue;
    }

    const slots = mealsByDate.get(date) ?? createMealCheckInSlots();
    const slot = slots.find((item) => item.key === slotKey);

    if (slot) {
      slot.count += 1;
      slot.completed = true;
    }

    mealsByDate.set(date, slots);
  }

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(calendarStartDate, index);
    const slots = mealsByDate.get(date) ?? createMealCheckInSlots();
    const completedSlots = slots.filter((slot) => slot.completed).length;

    return {
      date,
      dayOfMonth: Number(date.slice(8, 10)),
      inCurrentMonth: date.startsWith(monthPrefix),
      isSelected: date === selectedDate,
      isToday: date === todayDate,
      mealCount: mealCountsByDate.get(date) ?? 0,
      completedSlots,
      isCompleteDay: completedSlots === mealCheckInSlots.length,
      slots,
    } satisfies MealCheckInCalendarDay;
  });
}

export function calculateCurrentMealStreak(
  meals: Array<Pick<MealLog, "eaten_at">>,
  todayDate: string,
) {
  const loggedDates = new Set(
    meals.map((meal) => formatDateStringInTimeZone(new Date(meal.eaten_at))),
  );
  let cursor = todayDate;
  let streak = 0;

  while (loggedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function calculateLongestMealStreak(days: MealCheckInCalendarDay[]) {
  let current = 0;
  let longest = 0;

  for (const day of days) {
    if (day.mealCount > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
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

function getLargestMeal(meals: MealLogWithDetails[]) {
  const meal = meals
    .filter((item) => item.nutrition?.calories)
    .sort(
      (a, b) => (b.nutrition?.calories ?? 0) - (a.nutrition?.calories ?? 0),
    )[0];

  if (!meal?.nutrition?.calories) {
    return null;
  }

  return {
    id: meal.id,
    name: meal.meal_name,
    calories: meal.nutrition.calories,
  };
}

function getMealHour(value: string) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: appTimeZone,
    }).format(new Date(value)),
  );
}

function createMealCheckInSlots(): MealCheckInSlot[] {
  return mealCheckInSlots.map((slot) => ({
    ...slot,
    count: 0,
    completed: false,
  }));
}

function getCalendarDayOfWeek(dateString: string) {
  return new Date(`${dateString}T12:00:00.000Z`).getUTCDay();
}

function formatMonthLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00.000Z`));
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
