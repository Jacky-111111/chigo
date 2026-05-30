import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { CMU_LOCATION, sortRestaurantsByDistance } from "@/lib/utils/location";
import type { Restaurant } from "@/types/database";

export async function listNearbyRestaurants() {
  if (!hasSupabaseEnv()) {
    return [] satisfies Restaurant[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return sortRestaurantsByDistance((data ?? []) as Restaurant[], CMU_LOCATION);
}

export async function getRestaurantById(restaurantId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

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
