"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import {
  closeOpenSeatPostSchema,
  openSeatPostFormSchema,
} from "@/lib/validations/social";

function openSeatError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createOpenSeatPost(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = openSeatPostFormSchema.safeParse({
    restaurantId: formData.get("restaurantId"),
    locationLabel: formData.get("locationLabel"),
    availableSeats: formData.get("availableSeats"),
    durationMinutes: formData.get("durationMinutes") || "45",
    strangersWelcome: formData.get("strangersWelcome"),
  });

  if (!parsed.success) {
    openSeatError(
      "/open-seats",
      parsed.error.issues[0]?.message ?? "Invalid open seat post.",
    );
  }

  const expiresAt = new Date(
    Date.now() + parsed.data.durationMinutes * 60 * 1000,
  ).toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("open_seat_posts").insert({
    host_id: user.id,
    restaurant_id: parsed.data.restaurantId,
    location_label: parsed.data.locationLabel,
    available_seats: parsed.data.availableSeats,
    strangers_welcome: parsed.data.strangersWelcome,
    status: "open",
    expires_at: expiresAt,
  });

  if (error) {
    openSeatError("/open-seats", error.message);
  }

  revalidatePath("/open-seats");
  redirect(`/open-seats?message=${encodeURIComponent("Open seats posted.")}`);
}

export async function closeOpenSeatPost(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = closeOpenSeatPostSchema.safeParse({
    postId: formData.get("postId"),
  });

  if (!parsed.success) {
    openSeatError(
      "/open-seats",
      parsed.error.issues[0]?.message ?? "Invalid post.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("open_seat_posts")
    .update({ status: "closed" })
    .eq("id", parsed.data.postId)
    .eq("host_id", user.id);

  if (error) {
    openSeatError("/open-seats", error.message);
  }

  revalidatePath("/open-seats");
  redirect(
    `/open-seats?message=${encodeURIComponent("Open seat post closed.")}`,
  );
}
