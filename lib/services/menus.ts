import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type {
  MenuFeedback,
  MenuItem,
  MenuUpload,
  Restaurant,
} from "@/types/database";

export type MenuUploadSummary = MenuUpload & {
  restaurant: Pick<Restaurant, "id" | "name" | "cuisine"> | null;
  itemCount: number;
};

export type MenuAnalysisDetail = MenuUpload & {
  restaurant: Restaurant | null;
  items: MenuItem[];
  feedback: MenuFeedback[];
  signedImageUrl: string | null;
};

export async function listMyMenuUploads(currentUserId: string) {
  if (!hasSupabaseEnv()) {
    return [] satisfies MenuUploadSummary[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_uploads")
    .select("*")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateMenuUploadSummaries((data ?? []) as MenuUpload[]);
}

export async function listRestaurantMenuAnalyses(restaurantId: string) {
  if (!hasSupabaseEnv()) {
    return [] satisfies MenuUploadSummary[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_uploads")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "completed")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateMenuUploadSummaries((data ?? []) as MenuUpload[]);
}

export async function getMenuAnalysis(
  menuUploadId: string,
  currentUserId: string,
) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data: uploadData, error: uploadError } = await supabase
    .from("menu_uploads")
    .select("*")
    .eq("id", menuUploadId)
    .maybeSingle();

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  if (!uploadData) {
    return null;
  }

  const upload = uploadData as MenuUpload;
  const [{ data: itemsData, error: itemsError }, restaurant] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("*")
        .eq("menu_upload_id", upload.id)
        .order("sort_order", { ascending: true }),
      upload.restaurant_id
        ? getRestaurantForMenu(upload.restaurant_id)
        : Promise.resolve(null),
    ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = (itemsData ?? []) as MenuItem[];
  const feedback = await getFeedbackForItems(
    currentUserId,
    items.map((item) => item.id),
  );

  const signedImageUrl =
    upload.user_id === currentUserId
      ? await getSignedMenuImageUrl(upload.image_url)
      : null;

  return {
    ...upload,
    restaurant,
    items,
    feedback,
    signedImageUrl,
  } satisfies MenuAnalysisDetail;
}

export async function getSignedMenuImageUrl(storagePath: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("menu-images")
    .createSignedUrl(storagePath, 60 * 10);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

async function hydrateMenuUploadSummaries(uploads: MenuUpload[]) {
  if (uploads.length === 0) {
    return [] satisfies MenuUploadSummary[];
  }

  const supabase = await createClient();
  const restaurantIds = [
    ...new Set(
      uploads.flatMap((upload) =>
        upload.restaurant_id ? [upload.restaurant_id] : [],
      ),
    ),
  ];
  const uploadIds = uploads.map((upload) => upload.id);

  const [
    { data: restaurants, error: restaurantsError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    restaurantIds.length
      ? supabase
          .from("restaurants")
          .select("id,name,cuisine")
          .in("id", restaurantIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("menu_items")
      .select("id,menu_upload_id")
      .in("menu_upload_id", uploadIds),
  ]);

  if (restaurantsError) {
    throw new Error(restaurantsError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const restaurantMap = new Map(
    (
      (restaurants ?? []) as Array<Pick<Restaurant, "id" | "name" | "cuisine">>
    ).map((restaurant) => [restaurant.id, restaurant]),
  );
  const itemCounts = new Map<string, number>();

  for (const item of (items ?? []) as Array<
    Pick<MenuItem, "id" | "menu_upload_id">
  >) {
    itemCounts.set(
      item.menu_upload_id,
      (itemCounts.get(item.menu_upload_id) ?? 0) + 1,
    );
  }

  return uploads.map((upload) => ({
    ...upload,
    restaurant: upload.restaurant_id
      ? (restaurantMap.get(upload.restaurant_id) ?? null)
      : null,
    itemCount: itemCounts.get(upload.id) ?? 0,
  }));
}

async function getRestaurantForMenu(restaurantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Restaurant | null;
}

async function getFeedbackForItems(currentUserId: string, itemIds: string[]) {
  if (itemIds.length === 0) {
    return [] satisfies MenuFeedback[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_feedback")
    .select("*")
    .eq("user_id", currentUserId)
    .in("menu_item_id", itemIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MenuFeedback[];
}
