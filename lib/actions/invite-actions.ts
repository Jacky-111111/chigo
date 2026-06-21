"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addCurrentUserToDiningInviteChatThread,
  ensureDiningInviteChatThread,
  leaveDiningInviteChatThread,
} from "@/lib/services/chats";
import { sendInviteJoinedEmail } from "@/lib/services/email-notifications";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { getStartAtFromPreset } from "@/lib/utils/time";
import { inviteFormSchema } from "@/lib/validations/invite";

function inviteError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createDiningInvite(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);

  const parsed = inviteFormSchema.safeParse({
    restaurantId: formData.get("restaurantId"),
    startPreset: formData.get("startPreset"),
    customStartAt: formData.get("customStartAt"),
    maxParticipants: formData.get("maxParticipants"),
    message: formData.get("message"),
    visibility: formData.get("visibility") || "campus_public",
  });

  if (!parsed.success) {
    inviteError(
      "/invites/new",
      parsed.error.issues[0]?.message ?? "Invalid invite.",
    );
  }

  let startAt: Date;

  try {
    startAt = getStartAtFromPreset(
      parsed.data.startPreset,
      parsed.data.customStartAt,
    );
  } catch (error) {
    inviteError(
      "/invites/new",
      error instanceof Error ? error.message : "Invalid invite time.",
    );
  }

  const now = Date.now();
  const latestAllowedStart = now + 6 * 60 * 60 * 1000;

  if (Number.isNaN(startAt.getTime())) {
    inviteError("/invites/new", "Choose a valid start time.");
  }

  if (
    startAt.getTime() < now - 60 * 1000 ||
    startAt.getTime() > latestAllowedStart
  ) {
    inviteError("/invites/new", "Invites must start within the next 6 hours.");
  }

  const supabase = await createClient();
  const expiresAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("dining_invites")
    .insert({
      host_id: user.id,
      restaurant_id: parsed.data.restaurantId,
      start_at: startAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      max_participants: parsed.data.maxParticipants,
      message: parsed.data.message || null,
      visibility: parsed.data.visibility,
      status: "open",
    })
    .select("id")
    .single();
  const createdInvite = data as { id: string } | null;

  if (error || !createdInvite) {
    inviteError("/invites/new", error?.message ?? "Could not create invite.");
  }

  await ensureDiningInviteChatThread(createdInvite.id);

  revalidatePath("/invites");
  redirect(`/invites/${createdInvite.id}`);
}

export async function joinDiningInvite(formData: FormData) {
  const inviteId = String(formData.get("inviteId") ?? "");
  const user = await requireUser();
  const joinerProfile = await requireCompletedProfile(user.id);

  if (!inviteId) {
    inviteError("/invites", "Missing invite.");
  }

  const supabase = await createClient();
  const { data: inviteData, error: inviteLookupError } = await supabase
    .from("dining_invites")
    .select("*")
    .eq("id", inviteId)
    .maybeSingle();
  const invite = inviteData as import("@/types/database").DiningInvite | null;

  if (inviteLookupError || !invite) {
    inviteError("/invites", inviteLookupError?.message ?? "Invite not found.");
  }

  const detailPath = `/invites/${inviteId}`;

  if (invite.host_id === user.id) {
    inviteError(detailPath, "You are already the host of this invite.");
  }

  if (
    invite.status !== "open" ||
    new Date(invite.expires_at).getTime() <= Date.now()
  ) {
    inviteError(detailPath, "This invite is no longer open.");
  }

  const { data: participantsData, error: participantsError } = await supabase
    .from("dining_invite_participants")
    .select("*")
    .eq("invite_id", inviteId)
    .eq("status", "joined");
  const participants = (participantsData ??
    []) as import("@/types/database").DiningInviteParticipant[];

  if (participantsError) {
    inviteError(detailPath, participantsError.message);
  }

  if (
    (participants ?? []).some((participant) => participant.user_id === user.id)
  ) {
    inviteError(detailPath, "You already joined this invite.");
  }

  if ((participants ?? []).length >= invite.max_participants) {
    inviteError(detailPath, "This invite is full.");
  }

  const { error } = await supabase.from("dining_invite_participants").insert({
    invite_id: inviteId,
    user_id: user.id,
    role: "participant",
    status: "joined",
  });

  if (error) {
    inviteError(
      detailPath,
      error.code === "23505"
        ? "You already joined this invite."
        : error.message,
    );
  }

  await addCurrentUserToDiningInviteChatThread(inviteId, user.id);

  const { data: restaurantData, error: restaurantError } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", invite.restaurant_id)
    .maybeSingle();

  if (restaurantError) {
    console.warn("Could not load restaurant for invite email.", {
      error: restaurantError.message,
      inviteId,
    });
  }

  await sendInviteJoinedEmail({
    hostUserId: invite.host_id,
    inviteId,
    joinerName: joinerProfile.display_name,
    joinerUserId: user.id,
    restaurantName:
      (restaurantData as { name: string } | null)?.name ?? "your restaurant",
  });

  revalidatePath("/invites");
  revalidatePath(detailPath);
  redirect(`${detailPath}?message=${encodeURIComponent("Joined invite.")}`);
}

export async function leaveDiningInvite(formData: FormData) {
  const inviteId = String(formData.get("inviteId") ?? "");
  const user = await requireUser();

  if (!inviteId) {
    inviteError("/invites", "Missing invite.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("dining_invite_participants")
    .update({
      status: "left",
      left_at: new Date().toISOString(),
    })
    .eq("invite_id", inviteId)
    .eq("user_id", user.id)
    .eq("role", "participant")
    .eq("status", "joined");

  if (error) {
    inviteError(`/invites/${inviteId}`, error.message);
  }

  await leaveDiningInviteChatThread(inviteId, user.id);

  revalidatePath("/invites");
  revalidatePath(`/invites/${inviteId}`);
  redirect(
    `/invites/${inviteId}?message=${encodeURIComponent("Left invite.")}`,
  );
}

export async function cancelDiningInvite(formData: FormData) {
  const inviteId = String(formData.get("inviteId") ?? "");
  const user = await requireUser();

  if (!inviteId) {
    inviteError("/invites", "Missing invite.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("dining_invites")
    .update({ status: "canceled" })
    .eq("id", inviteId)
    .eq("host_id", user.id);

  if (error) {
    inviteError(`/invites/${inviteId}`, error.message);
  }

  revalidatePath("/invites");
  revalidatePath(`/invites/${inviteId}`);
  redirect(
    `/invites/${inviteId}?message=${encodeURIComponent("Invite canceled.")}`,
  );
}
