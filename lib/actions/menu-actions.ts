"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeMenuImage, getMenuAiConfig } from "@/lib/services/menu-ai";
import { normalizeMenuImage } from "@/lib/services/menu-image";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import {
  menuFeedbackFormSchema,
  menuUploadFormSchema,
  validateMenuImageFile,
} from "@/lib/validations/menu";
import type {
  DiningPreference,
  MenuItem,
  MenuUpload,
  Restaurant,
} from "@/types/database";

function menuError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createMenuUpload(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);

  const parsed = menuUploadFormSchema.safeParse({
    restaurantId: formData.get("restaurantId"),
    targetLanguage: formData.get("targetLanguage") || "en",
  });

  if (!parsed.success) {
    menuError(
      "/menus/new",
      parsed.error.issues[0]?.message ?? "Invalid menu upload.",
    );
  }

  const image = validateMenuImageFile(formData.get("image"));

  if (!image.ok) {
    menuError("/menus/new", image.message);
  }

  const supabase = await createClient();
  const imageBuffer = Buffer.from(await image.file.arrayBuffer());
  const normalizedImage = await normalizeMenuImage({
    buffer: imageBuffer,
    mimeType: image.file.type,
    filename: image.file.name,
  }).catch(() => {
    menuError(
      "/menus/new",
      "Could not convert this HEIC/HEIF image. Export it as JPEG or WebP, then try again.",
    );
  });
  const imagePath = `${user.id}/${crypto.randomUUID()}.${normalizedImage.extension}`;
  const { error: storageError } = await supabase.storage
    .from("menu-images")
    .upload(imagePath, normalizedImage.buffer, {
      contentType: normalizedImage.mimeType,
      upsert: false,
    });

  if (storageError) {
    menuError("/menus/new", storageError.message);
  }

  const { data: uploadData, error: uploadError } = await supabase
    .from("menu_uploads")
    .insert({
      user_id: user.id,
      restaurant_id: parsed.data.restaurantId,
      image_url: imagePath,
      status: "uploaded",
      target_language: parsed.data.targetLanguage,
    })
    .select("*")
    .single();

  if (uploadError || !uploadData) {
    await supabase.storage.from("menu-images").remove([imagePath]);
    menuError(
      "/menus/new",
      uploadError?.message ?? "Could not create menu upload.",
    );
  }

  const upload = uploadData as MenuUpload;
  const imageDataUrl = toDataUrl(
    normalizedImage.buffer,
    normalizedImage.mimeType,
  );
  const analysisError = await analyzeAndPersistMenu({
    upload,
    imageDataUrl,
  }).catch((error: unknown) => getErrorMessage(error));

  revalidatePath("/menus");
  revalidatePath("/restaurants");

  if (analysisError) {
    await markMenuUploadFailed(upload.id, user.id, analysisError);
    redirect(`/menus/${upload.id}?error=${encodeURIComponent(analysisError)}`);
  }

  redirect(`/menus/${upload.id}`);
}

export async function retryMenuAnalysis(formData: FormData) {
  const menuUploadId = String(formData.get("menuUploadId") ?? "");
  const user = await requireUser();
  await requireCompletedProfile(user.id);

  if (!menuUploadId) {
    menuError("/menus", "Missing menu upload.");
  }

  const supabase = await createClient();
  const { data: uploadData, error: uploadError } = await supabase
    .from("menu_uploads")
    .select("*")
    .eq("id", menuUploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (uploadError || !uploadData) {
    menuError("/menus", uploadError?.message ?? "Menu upload not found.");
  }

  const upload = uploadData as MenuUpload;
  const { data: imageBlob, error: downloadError } = await supabase.storage
    .from("menu-images")
    .download(upload.image_url);

  if (downloadError || !imageBlob) {
    menuError(
      `/menus/${upload.id}`,
      downloadError?.message ?? "Could not read the stored menu image.",
    );
  }

  const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
  const normalizedImage = await normalizeMenuImage({
    buffer: imageBuffer,
    mimeType: imageBlob.type || "image/jpeg",
    filename: upload.image_url,
  }).catch(async () => {
    const message =
      "Could not convert this HEIC/HEIF image. Export it as JPEG or WebP, then upload again.";
    await markMenuUploadFailed(upload.id, user.id, message);
    menuError(`/menus/${upload.id}`, message);
  });
  const imageDataUrl = toDataUrl(
    normalizedImage.buffer,
    normalizedImage.mimeType,
  );
  const analysisError = await analyzeAndPersistMenu({
    upload,
    imageDataUrl,
  }).catch((error: unknown) => getErrorMessage(error));

  revalidatePath("/menus");
  revalidatePath(`/menus/${upload.id}`);
  revalidatePath("/restaurants");

  if (analysisError) {
    await markMenuUploadFailed(upload.id, user.id, analysisError);
    redirect(`/menus/${upload.id}?error=${encodeURIComponent(analysisError)}`);
  }

  redirect(
    `/menus/${upload.id}?message=${encodeURIComponent("Menu analysis refreshed.")}`,
  );
}

export async function createMenuFeedback(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = menuFeedbackFormSchema.safeParse({
    menuUploadId: formData.get("menuUploadId"),
    menuItemId: formData.get("menuItemId"),
    feedbackType: formData.get("feedbackType"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    menuError("/menus", parsed.error.issues[0]?.message ?? "Invalid feedback.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menu_feedback").insert({
    user_id: user.id,
    menu_item_id: parsed.data.menuItemId,
    feedback_type: parsed.data.feedbackType,
    note: parsed.data.note || null,
  });

  if (error) {
    menuError(`/menus/${parsed.data.menuUploadId}`, error.message);
  }

  revalidatePath(`/menus/${parsed.data.menuUploadId}`);
  redirect(
    `/menus/${parsed.data.menuUploadId}?message=${encodeURIComponent("Thanks for the feedback.")}`,
  );
}

async function analyzeAndPersistMenu({
  upload,
  imageDataUrl,
}: {
  upload: MenuUpload;
  imageDataUrl: string;
}) {
  const supabase = await createClient();
  const config = getMenuAiConfig();

  await supabase
    .from("menu_uploads")
    .update({
      status: "processing",
      error_message: null,
      ai_provider: config.provider,
      ai_model: config.model,
    })
    .eq("id", upload.id)
    .eq("user_id", upload.user_id);

  const [preferences, restaurant] = await Promise.all([
    getDiningPreferences(upload.user_id),
    upload.restaurant_id
      ? getRestaurantName(upload.restaurant_id)
      : Promise.resolve(null),
  ]);
  const result = await analyzeMenuImage({
    imageDataUrl,
    targetLanguage: upload.target_language,
    preferences: {
      dietaryRestrictions: preferences?.dietary_restrictions ?? [],
      allergies: preferences?.allergies ?? [],
      favoriteCuisines: preferences?.favorite_cuisines ?? [],
    },
    restaurantName: restaurant?.name,
  });

  const rows = result.analysis.items.map((item, index) => ({
    menu_upload_id: upload.id,
    original_name: item.original_name,
    translated_name: item.translated_name,
    description: item.description,
    ingredients: item.ingredients,
    cooking_method: item.cooking_method,
    cuisine_context: item.cuisine_context,
    dietary_warnings: item.dietary_warnings,
    recommendation_score: item.recommendation_score,
    recommendation_reason: item.recommendation_reason,
    confidence: item.confidence,
    sort_order: index + 1,
  })) satisfies Array<Omit<MenuItem, "id" | "created_at">>;

  const { error: deleteError } = await supabase
    .from("menu_items")
    .delete()
    .eq("menu_upload_id", upload.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: insertError } = await supabase.from("menu_items").insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from("menu_uploads")
    .update({
      status: "completed",
      source_language: result.analysis.source_language,
      extracted_text: result.analysis.extracted_text,
      ai_provider: result.provider,
      ai_model: result.model,
      error_message: null,
    })
    .eq("id", upload.id)
    .eq("user_id", upload.user_id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function getDiningPreferences(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_dining_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as DiningPreference | null;
}

async function getRestaurantName(restaurantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Pick<Restaurant, "id" | "name"> | null;
}

async function markMenuUploadFailed(
  menuUploadId: string,
  userId: string,
  message: string,
) {
  const supabase = await createClient();
  await supabase
    .from("menu_uploads")
    .update({
      status: "failed",
      error_message: message,
    })
    .eq("id", menuUploadId)
    .eq("user_id", userId);
}

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Menu analysis failed. Please retry in a minute.";
}
