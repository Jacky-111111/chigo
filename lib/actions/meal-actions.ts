"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estimateMealNutrition as estimateMealNutritionWithAi } from "@/lib/services/nutrition-ai";
import { normalizeMenuImage } from "@/lib/services/menu-image";
import { removeStoredMealImage } from "@/lib/services/meal-storage";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import {
  mealLogFormSchema,
  nutritionGoalsFormSchema,
  parseMealEatenAt,
  validateOptionalMealImageFile,
} from "@/lib/validations/meal";
import type {
  MealLog,
  MealNutritionEstimate,
  MenuItem,
  Restaurant,
} from "@/types/database";

function mealError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createMealLog(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = mealLogFormSchema.safeParse(getMealInput(formData));

  if (!parsed.success) {
    mealError(
      "/meals/new",
      parsed.error.issues[0]?.message ?? "Invalid meal log.",
    );
  }

  const supabase = await createClient();
  const input = parsed.data;

  await validateMealAssociations({
    supabase,
    userId: user.id,
    restaurantId: input.restaurantId,
    menuItemId: input.menuItemId,
    errorPath: "/meals/new",
  });

  const image = await prepareMealImage(formData.get("photo"), "/meals/new");
  const uploadedImagePath = image
    ? await uploadMealImage({
        buffer: image.buffer,
        contentType: image.mimeType,
        extension: image.extension,
        userId: user.id,
        errorPath: "/meals/new",
      })
    : null;

  let eatenAt: string;

  try {
    eatenAt = parseMealEatenAt(input.eatenAt);
  } catch (error) {
    if (uploadedImagePath) {
      await removeStoredMealImage(supabase.storage, uploadedImagePath);
    }

    mealError(
      "/meals/new",
      error instanceof Error ? error.message : "Invalid meal time.",
    );
  }

  const { data: mealData, error: mealInsertError } = await supabase
    .from("meal_logs")
    .insert({
      user_id: user.id,
      restaurant_id: input.restaurantId,
      menu_item_id: input.menuItemId,
      meal_name: input.mealName,
      photo_url: uploadedImagePath,
      eaten_at: eatenAt,
      notes: input.notes || null,
    })
    .select("*")
    .single();

  if (mealInsertError || !mealData) {
    if (uploadedImagePath) {
      await removeStoredMealImage(supabase.storage, uploadedImagePath);
    }

    mealError(
      "/meals/new",
      mealInsertError?.message ?? "Could not create meal log.",
    );
  }

  const meal = mealData as MealLog;
  const estimationError = await estimateAndPersistMealNutrition({
    meal,
    imageDataUrl: image ? toDataUrl(image.buffer, image.mimeType) : null,
  }).catch((error: unknown) => getErrorMessage(error));

  revalidateMealPaths(meal.id);

  if (estimationError) {
    redirect(`/meals/${meal.id}?error=${encodeURIComponent(estimationError)}`);
  }

  redirect(`/meals/${meal.id}`);
}

export async function updateMealLog(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = mealLogFormSchema.safeParse(getMealInput(formData));

  if (!parsed.success) {
    mealError("/meals", parsed.error.issues[0]?.message ?? "Invalid meal log.");
  }

  const input = parsed.data;

  if (!input.mealId) {
    mealError("/meals", "Missing meal log.");
  }

  const supabase = await createClient();
  const { data: existingMealData, error: existingMealError } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("id", input.mealId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMealError || !existingMealData) {
    mealError("/meals", existingMealError?.message ?? "Meal log not found.");
  }

  const existingMeal = existingMealData as MealLog;
  await validateMealAssociations({
    supabase,
    userId: user.id,
    restaurantId: input.restaurantId,
    menuItemId: input.menuItemId,
    errorPath: `/meals/${existingMeal.id}`,
  });

  const image = await prepareMealImage(
    formData.get("photo"),
    `/meals/${existingMeal.id}`,
  );
  const uploadedImagePath = image
    ? await uploadMealImage({
        buffer: image.buffer,
        contentType: image.mimeType,
        extension: image.extension,
        userId: user.id,
        errorPath: `/meals/${existingMeal.id}`,
      })
    : null;

  let eatenAt: string;

  try {
    eatenAt = parseMealEatenAt(input.eatenAt);
  } catch (error) {
    if (uploadedImagePath) {
      await removeStoredMealImage(supabase.storage, uploadedImagePath);
    }

    mealError(
      `/meals/${existingMeal.id}`,
      error instanceof Error ? error.message : "Invalid meal time.",
    );
  }

  const { data: updatedMealData, error: updateError } = await supabase
    .from("meal_logs")
    .update({
      restaurant_id: input.restaurantId,
      menu_item_id: input.menuItemId,
      meal_name: input.mealName,
      photo_url: uploadedImagePath ?? existingMeal.photo_url,
      eaten_at: eatenAt,
      notes: input.notes || null,
    })
    .eq("id", existingMeal.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updatedMealData) {
    if (uploadedImagePath) {
      await removeStoredMealImage(supabase.storage, uploadedImagePath);
    }

    mealError(
      `/meals/${existingMeal.id}`,
      updateError?.message ?? "Could not update meal log.",
    );
  }

  if (uploadedImagePath && existingMeal.photo_url) {
    await removeStoredMealImage(supabase.storage, existingMeal.photo_url);
  }

  const updatedMeal = updatedMealData as MealLog;
  const estimationError = await estimateAndPersistMealNutrition({
    meal: updatedMeal,
    imageDataUrl: image ? toDataUrl(image.buffer, image.mimeType) : null,
  }).catch((error: unknown) => getErrorMessage(error));

  revalidateMealPaths(updatedMeal.id);

  if (estimationError) {
    redirect(
      `/meals/${updatedMeal.id}?error=${encodeURIComponent(estimationError)}`,
    );
  }

  redirect(
    `/meals/${updatedMeal.id}?message=${encodeURIComponent("Meal saved.")}`,
  );
}

export async function deleteMealLog(formData: FormData) {
  const mealId = String(formData.get("mealId") ?? "");
  const user = await requireUser();
  await requireCompletedProfile(user.id);

  if (!mealId) {
    mealError("/meals", "Missing meal log.");
  }

  const supabase = await createClient();
  const { data: mealData, error: lookupError } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("id", mealId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError || !mealData) {
    mealError("/meals", lookupError?.message ?? "Meal log not found.");
  }

  const meal = mealData as MealLog;
  const { error } = await supabase
    .from("meal_logs")
    .delete()
    .eq("id", meal.id)
    .eq("user_id", user.id);

  if (error) {
    mealError(`/meals/${meal.id}`, error.message);
  }

  if (meal.photo_url) {
    await removeStoredMealImage(supabase.storage, meal.photo_url);
  }

  revalidatePath("/meals");
  revalidatePath("/nutrition");
  redirect(`/meals?message=${encodeURIComponent("Meal deleted.")}`);
}

export async function estimateMealNutrition(formData: FormData) {
  const mealId = String(formData.get("mealId") ?? "");
  const user = await requireUser();
  await requireCompletedProfile(user.id);

  if (!mealId) {
    mealError("/meals", "Missing meal log.");
  }

  const supabase = await createClient();
  const { data: mealData, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("id", mealId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !mealData) {
    mealError("/meals", error?.message ?? "Meal log not found.");
  }

  const meal = mealData as MealLog;
  const imageDataUrl = meal.photo_url
    ? await downloadMealImageAsDataUrl(meal.photo_url)
    : null;
  const estimationError = await estimateAndPersistMealNutrition({
    meal,
    imageDataUrl,
  }).catch((estimateError: unknown) => getErrorMessage(estimateError));

  revalidateMealPaths(meal.id);

  if (estimationError) {
    mealError(`/meals/${meal.id}`, estimationError);
  }

  redirect(
    `/meals/${meal.id}?message=${encodeURIComponent("Nutrition estimate refreshed.")}`,
  );
}

export async function updateNutritionGoals(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = nutritionGoalsFormSchema.safeParse({
    dailyCalorieTarget: formData.get("dailyCalorieTarget"),
    dailyProteinTargetG: formData.get("dailyProteinTargetG"),
    goalType: formData.get("goalType") || "balanced",
    customGoalNote: formData.get("customGoalNote"),
  });

  if (!parsed.success) {
    mealError(
      "/settings/nutrition",
      parsed.error.issues[0]?.message ?? "Invalid nutrition goals.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("nutrition_goals").upsert(
    {
      user_id: user.id,
      daily_calorie_target: parsed.data.dailyCalorieTarget,
      daily_protein_target_g: parsed.data.dailyProteinTargetG,
      goal_type: parsed.data.goalType,
      custom_goal_note: parsed.data.customGoalNote || null,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    mealError("/settings/nutrition", error.message);
  }

  revalidatePath("/settings/nutrition");
  revalidatePath("/nutrition");
  redirect(
    `/settings/nutrition?message=${encodeURIComponent("Nutrition goals saved.")}`,
  );
}

async function estimateAndPersistMealNutrition({
  meal,
  imageDataUrl,
}: {
  meal: MealLog;
  imageDataUrl: string | null;
}) {
  const supabase = await createClient();
  const context = await getMealNutritionContext(meal);
  const result = await estimateMealNutritionWithAi({
    mealName: meal.meal_name,
    notes: meal.notes,
    restaurantName: context.restaurant?.name,
    menuItemName:
      context.menuItem?.translated_name ?? context.menuItem?.original_name,
    imageDataUrl,
  });

  const estimate = result.estimate;
  const row = {
    meal_log_id: meal.id,
    calories: estimate.calories,
    protein_g: estimate.protein_g,
    fat_g: estimate.fat_g,
    carbs_g: estimate.carbs_g,
    confidence: estimate.confidence,
    ai_provider: result.provider,
    ai_model: result.model,
  } satisfies Omit<MealNutritionEstimate, "created_at" | "updated_at">;
  const { error } = await supabase
    .from("meal_nutrition_estimates")
    .upsert(row, { onConflict: "meal_log_id" });

  if (error) {
    throw new Error(error.message);
  }
}

async function getMealNutritionContext(meal: MealLog) {
  const supabase = await createClient();
  const [restaurantResult, menuItemResult] = await Promise.all([
    meal.restaurant_id
      ? supabase
          .from("restaurants")
          .select("id,name")
          .eq("id", meal.restaurant_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    meal.menu_item_id
      ? supabase
          .from("menu_items")
          .select("id,original_name,translated_name")
          .eq("id", meal.menu_item_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (restaurantResult.error) {
    throw new Error(restaurantResult.error.message);
  }

  if (menuItemResult.error) {
    throw new Error(menuItemResult.error.message);
  }

  return {
    restaurant: restaurantResult.data as Pick<Restaurant, "id" | "name"> | null,
    menuItem: menuItemResult.data as Pick<
      MenuItem,
      "id" | "original_name" | "translated_name"
    > | null,
  };
}

async function validateMealAssociations({
  supabase,
  userId,
  restaurantId,
  menuItemId,
  errorPath,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  restaurantId: string | null;
  menuItemId: string | null;
  errorPath: string;
}) {
  if (restaurantId) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      mealError(errorPath, error?.message ?? "Choose an active restaurant.");
    }
  }

  if (!menuItemId) {
    return;
  }

  const { data: menuItem, error: menuItemError } = await supabase
    .from("menu_items")
    .select("id,menu_upload_id")
    .eq("id", menuItemId)
    .maybeSingle();

  if (menuItemError || !menuItem) {
    mealError(
      errorPath,
      menuItemError?.message ?? "Choose a menu item from your analyzed menus.",
    );
  }

  const { data: menuUpload, error: menuUploadError } = await supabase
    .from("menu_uploads")
    .select("id")
    .eq("id", menuItem.menu_upload_id)
    .eq("user_id", userId)
    .eq("status", "completed")
    .maybeSingle();

  if (menuUploadError || !menuUpload) {
    mealError(
      errorPath,
      menuUploadError?.message ??
        "Choose a menu item from your analyzed menus.",
    );
  }
}

async function prepareMealImage(
  value: FormDataEntryValue | null,
  errorPath: string,
) {
  const image = validateOptionalMealImageFile(value);

  if (!image.ok) {
    mealError(errorPath, image.message);
  }

  if (!image.file) {
    return null;
  }

  const imageBuffer = Buffer.from(await image.file.arrayBuffer());

  return normalizeMenuImage({
    buffer: imageBuffer,
    mimeType: image.file.type,
    filename: image.file.name,
  }).catch(() => {
    mealError(
      errorPath,
      "Could not convert this image. Export it as JPEG, PNG, or WebP, then try again.",
    );
  });
}

async function uploadMealImage({
  buffer,
  contentType,
  extension,
  userId,
  errorPath,
}: {
  buffer: Buffer;
  contentType: string;
  extension: string;
  userId: string;
  errorPath: string;
}) {
  const supabase = await createClient();
  const imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("meal-images")
    .upload(imagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    mealError(errorPath, error.message);
  }

  return imagePath;
}

async function downloadMealImageAsDataUrl(imagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("meal-images")
    .download(imagePath);

  if (error || !data) {
    throw new Error(error?.message ?? "Could not read meal photo.");
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return toDataUrl(buffer, data.type || "image/jpeg");
}

function getMealInput(formData: FormData) {
  return {
    mealId: formData.get("mealId"),
    restaurantId: formData.get("restaurantId"),
    menuItemId: formData.get("menuItemId"),
    mealName: formData.get("mealName"),
    eatenAt: formData.get("eatenAt"),
    notes: formData.get("notes"),
  };
}

function revalidateMealPaths(mealId: string) {
  revalidatePath("/meals");
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/nutrition");
}

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Nutrition estimation failed. Please retry in a minute.";
}
