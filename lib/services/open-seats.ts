import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getProfilesByIds } from "@/lib/services/friends";
import type { OpenSeatPost, Profile, Restaurant } from "@/types/database";

export type OpenSeatPostWithDetails = OpenSeatPost & {
  host: Profile;
  restaurant: Restaurant | null;
};

export async function listActiveOpenSeatPosts() {
  if (!hasSupabaseEnv()) {
    return [] satisfies OpenSeatPostWithDetails[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_seat_posts")
    .select("*")
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateOpenSeatPosts((data ?? []) as OpenSeatPost[]);
}

async function hydrateOpenSeatPosts(posts: OpenSeatPost[]) {
  if (posts.length === 0) {
    return [] satisfies OpenSeatPostWithDetails[];
  }

  const supabase = await createClient();
  const hostProfiles = await getProfilesByIds([
    ...new Set(posts.map((post) => post.host_id)),
  ]);
  const restaurantIds = [
    ...new Set(
      posts.flatMap((post) => (post.restaurant_id ? [post.restaurant_id] : [])),
    ),
  ];
  const restaurants = new Map<string, Restaurant>();

  if (restaurantIds.length > 0) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .in("id", restaurantIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const restaurant of (data ?? []) as Restaurant[]) {
      restaurants.set(restaurant.id, restaurant);
    }
  }

  return posts.flatMap((post) => {
    const host = hostProfiles.get(post.host_id);

    if (!host) {
      return [];
    }

    return [
      {
        ...post,
        host,
        restaurant: post.restaurant_id
          ? (restaurants.get(post.restaurant_id) ?? null)
          : null,
      },
    ];
  });
}
