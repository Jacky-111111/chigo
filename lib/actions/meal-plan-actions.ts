"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addCurrentUserToMealPlanChatThread,
  ensureMealPlanChatThread,
  leaveMealPlanChatThread,
} from "@/lib/services/chats";
import { areAcceptedFriends } from "@/lib/services/friends";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";
import { parseDateTimeLocalInTimeZone } from "@/lib/utils/date-range";
import {
  confirmMealPlanSchema,
  mealPlanAvailabilitySchema,
  mealPlanFormSchema,
  mealPlanStatusSchema,
} from "@/lib/validations/social";
import type { MealPlan, MealPlanTimeSlot } from "@/types/database";

function mealPlanError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createMealPlan(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = mealPlanFormSchema.safeParse({
    title: formData.get("title"),
    note: formData.get("note"),
    restaurantIds: formData.getAll("restaurantIds"),
    participantIds: formData.getAll("participantIds"),
    slotStarts: formData.getAll("slotStarts"),
    durationMinutes: formData.get("durationMinutes") || "90",
  });

  if (!parsed.success) {
    mealPlanError(
      "/plans/new",
      parsed.error.issues[0]?.message ?? "Invalid meal plan.",
    );
  }

  const restaurantIds = [...new Set(parsed.data.restaurantIds)];
  const participantIds = [...new Set(parsed.data.participantIds)].filter(
    (participantId) => participantId !== user.id,
  );
  const timeSlots = parseTimeSlots(
    [...new Set(parsed.data.slotStarts)],
    parsed.data.durationMinutes,
    "/plans/new",
  );

  await assertAcceptedFriends(user.id, participantIds, "/plans/new");

  const supabase = await createClient();
  const { data: planData, error: planError } = await supabase
    .from("meal_plans")
    .insert({
      creator_id: user.id,
      title: parsed.data.title,
      note: parsed.data.note || null,
      status: "collecting_availability",
    })
    .select("*")
    .single();

  if (planError || !planData) {
    mealPlanError(
      "/plans/new",
      planError?.message ?? "Could not create meal plan.",
    );
  }

  const plan = planData as MealPlan;
  const { error: participantError } = await supabase
    .from("meal_plan_participants")
    .insert([
      {
        plan_id: plan.id,
        user_id: user.id,
        role: "creator" as const,
        status: "joined" as const,
      },
      ...participantIds.map((participantId) => ({
        plan_id: plan.id,
        user_id: participantId,
        role: "participant" as const,
        status: "invited" as const,
      })),
    ]);

  if (participantError) {
    mealPlanError("/plans/new", participantError.message);
  }

  const { error: candidateError } = await supabase
    .from("meal_plan_restaurant_candidates")
    .insert(
      restaurantIds.map((restaurantId) => ({
        plan_id: plan.id,
        restaurant_id: restaurantId,
      })),
    );

  if (candidateError) {
    mealPlanError("/plans/new", candidateError.message);
  }

  const { error: slotError } = await supabase
    .from("meal_plan_time_slots")
    .insert(
      timeSlots.map((slot) => ({
        plan_id: plan.id,
        start_at: slot.startAt,
        end_at: slot.endAt,
      })),
    );

  if (slotError) {
    mealPlanError("/plans/new", slotError.message);
  }

  await ensureMealPlanChatThread(plan.id);

  revalidatePath("/plans");
  redirect(`/plans/${plan.id}`);
}

export async function respondToMealPlanInvitation(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = mealPlanStatusSchema.safeParse({
    planId: formData.get("planId"),
    response: formData.get("response"),
  });

  if (!parsed.success) {
    mealPlanError(
      "/plans",
      parsed.error.issues[0]?.message ?? "Invalid response.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_plan_participants")
    .update({ status: parsed.data.response })
    .eq("plan_id", parsed.data.planId)
    .eq("user_id", user.id);

  if (error) {
    mealPlanError(`/plans/${parsed.data.planId}`, error.message);
  }

  if (parsed.data.response === "declined") {
    await leaveMealPlanChatThread(parsed.data.planId, user.id);
  } else {
    await addCurrentUserToMealPlanChatThread(parsed.data.planId, user.id);
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${parsed.data.planId}`);
  redirect(
    `/plans/${parsed.data.planId}?message=${encodeURIComponent(
      parsed.data.response === "joined" ? "Plan joined." : "Plan declined.",
    )}`,
  );
}

export async function submitMealPlanAvailability(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = mealPlanAvailabilitySchema.safeParse({
    planId: formData.get("planId"),
    timeSlotId: formData.get("timeSlotId"),
    availability: formData.get("availability"),
  });

  if (!parsed.success) {
    mealPlanError(
      "/plans",
      parsed.error.issues[0]?.message ?? "Invalid availability.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("meal_plan_availability").upsert(
    {
      plan_id: parsed.data.planId,
      time_slot_id: parsed.data.timeSlotId,
      user_id: user.id,
      availability: parsed.data.availability,
    },
    { onConflict: "time_slot_id,user_id" },
  );

  if (error) {
    mealPlanError(`/plans/${parsed.data.planId}`, error.message);
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${parsed.data.planId}`);
  redirect(
    `/plans/${parsed.data.planId}?message=${encodeURIComponent("Availability saved.")}`,
  );
}

export async function confirmMealPlan(formData: FormData) {
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const parsed = confirmMealPlanSchema.safeParse({
    planId: formData.get("planId"),
    restaurantId: formData.get("restaurantId"),
    timeSlotId: formData.get("timeSlotId"),
  });

  if (!parsed.success) {
    mealPlanError(
      "/plans",
      parsed.error.issues[0]?.message ?? "Invalid confirmation.",
    );
  }

  const supabase = await createClient();
  const { data: slotData, error: slotError } = await supabase
    .from("meal_plan_time_slots")
    .select("*")
    .eq("id", parsed.data.timeSlotId)
    .eq("plan_id", parsed.data.planId)
    .maybeSingle();

  if (slotError || !slotData) {
    mealPlanError(
      `/plans/${parsed.data.planId}`,
      slotError?.message ?? "Time slot not found.",
    );
  }

  const slot = slotData as MealPlanTimeSlot;
  const { data: candidateData, error: candidateError } = await supabase
    .from("meal_plan_restaurant_candidates")
    .select("*")
    .eq("plan_id", parsed.data.planId)
    .eq("restaurant_id", parsed.data.restaurantId)
    .maybeSingle();

  if (candidateError || !candidateData) {
    mealPlanError(
      `/plans/${parsed.data.planId}`,
      candidateError?.message ?? "Restaurant candidate not found.",
    );
  }

  const { error } = await supabase
    .from("meal_plans")
    .update({
      status: "confirmed",
      confirmed_restaurant_id: parsed.data.restaurantId,
      confirmed_start_at: slot.start_at,
    })
    .eq("id", parsed.data.planId)
    .eq("creator_id", user.id);

  if (error) {
    mealPlanError(`/plans/${parsed.data.planId}`, error.message);
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${parsed.data.planId}`);
  redirect(
    `/plans/${parsed.data.planId}?message=${encodeURIComponent("Meal plan confirmed.")}`,
  );
}

async function assertAcceptedFriends(
  userId: string,
  participantIds: string[],
  errorPath: string,
) {
  for (const participantId of participantIds) {
    const accepted = await areAcceptedFriends(userId, participantId);

    if (!accepted) {
      mealPlanError(errorPath, "Meal plans can only invite accepted friends.");
    }
  }
}

function parseTimeSlots(
  slotStarts: string[],
  durationMinutes: number,
  errorPath: string,
) {
  const now = Date.now();

  return slotStarts.map((value) => {
    let startAt: string;

    try {
      startAt = parseDateTimeLocalInTimeZone(value);
    } catch (error) {
      mealPlanError(
        errorPath,
        error instanceof Error ? error.message : "Choose valid time slots.",
      );
    }

    const startMs = new Date(startAt).getTime();

    if (Number.isNaN(startMs) || startMs <= now) {
      mealPlanError(errorPath, "Meal plan time slots must be in the future.");
    }

    return {
      startAt,
      endAt: new Date(startMs + durationMinutes * 60 * 1000).toISOString(),
    };
  });
}
