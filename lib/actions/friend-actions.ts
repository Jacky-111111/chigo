"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getFriendshipBetweenUsers,
  getProfileByUsername,
} from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import {
  friendRequestSchema,
  friendshipResponseSchema,
  removeFriendSchema,
} from "@/lib/validations/social";

function friendError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function sendFriendRequest(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = friendRequestSchema.safeParse({
    username: formData.get("username"),
  });

  if (!parsed.success) {
    friendError(
      "/friends",
      parsed.error.issues[0]?.message ?? "Invalid username.",
    );
  }

  const profile = await getProfileByUsername(parsed.data.username);

  if (!profile) {
    friendError("/friends", "No user found with that username.");
  }

  if (profile.id === user.id) {
    friendError("/friends", "You cannot add yourself.");
  }

  const supabase = await createClient();
  const existing = await getFriendshipBetweenUsers(user.id, profile.id);

  if (existing?.status === "accepted") {
    friendError("/friends", "You are already friends.");
  }

  if (existing?.status === "pending") {
    friendError("/friends", "A friend request is already pending.");
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("friendships")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      friendError("/friends", deleteError.message);
    }
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: profile.id,
    status: "pending",
  });

  if (error) {
    friendError("/friends", error.message);
  }

  revalidatePath("/friends");
  redirect(`/friends?message=${encodeURIComponent("Friend request sent.")}`);
}

export async function respondToFriendRequest(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = friendshipResponseSchema.safeParse({
    friendshipId: formData.get("friendshipId"),
    response: formData.get("response"),
  });

  if (!parsed.success) {
    friendError(
      "/friends",
      parsed.error.issues[0]?.message ?? "Invalid request.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: parsed.data.response })
    .eq("id", parsed.data.friendshipId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) {
    friendError("/friends", error.message);
  }

  revalidatePath("/friends");
  redirect(
    `/friends?message=${encodeURIComponent(
      parsed.data.response === "accepted"
        ? "Friend added."
        : "Request declined.",
    )}`,
  );
}

export async function removeFriend(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = removeFriendSchema.safeParse({
    friendId: formData.get("friendId"),
  });

  if (!parsed.success) {
    friendError(
      "/friends",
      parsed.error.issues[0]?.message ?? "Invalid friend.",
    );
  }

  const friendship = await getFriendshipBetweenUsers(
    user.id,
    parsed.data.friendId,
  );

  if (!friendship || friendship.status !== "accepted") {
    friendError("/friends", "Friendship not found.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendship.id);

  if (error) {
    friendError("/friends", error.message);
  }

  revalidatePath("/friends");
  redirect(`/friends?message=${encodeURIComponent("Friend removed.")}`);
}
