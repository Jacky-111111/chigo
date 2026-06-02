import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getProfilesByIds } from "@/lib/services/friends";
import type {
  MealPlan,
  MealPlanAvailability,
  MealPlanParticipant,
  MealPlanRestaurantCandidate,
  MealPlanTimeSlot,
  Profile,
  Restaurant,
} from "@/types/database";

export type MealPlanParticipantWithProfile = MealPlanParticipant & {
  profile: Profile;
};

export type MealPlanTimeSlotWithAvailability = MealPlanTimeSlot & {
  availability: Array<
    MealPlanAvailability & {
      profile: Profile;
    }
  >;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  score: number;
};

export type MealPlanWithDetails = MealPlan & {
  creator: Profile;
  participants: MealPlanParticipantWithProfile[];
  candidates: Restaurant[];
  timeSlots: MealPlanTimeSlotWithAvailability[];
  bestTimeSlot: MealPlanTimeSlotWithAvailability | null;
};

export async function listMealPlans(currentUserId: string) {
  if (!hasSupabaseEnv()) {
    return [] satisfies MealPlanWithDetails[];
  }

  const supabase = await createClient();
  const { data: participantData, error: participantError } = await supabase
    .from("meal_plan_participants")
    .select("*")
    .eq("user_id", currentUserId)
    .in("status", ["invited", "joined"]);

  if (participantError) {
    throw new Error(participantError.message);
  }

  const participantRows = (participantData ?? []) as MealPlanParticipant[];
  const planIds = participantRows.map((participant) => participant.plan_id);

  if (planIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .in("id", planIds)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateMealPlans((data ?? []) as MealPlan[]);
}

export async function getMealPlanDetail(planId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [plan] = await hydrateMealPlans([data as MealPlan]);
  return plan ?? null;
}

export function getCurrentUserPlanParticipant(
  plan: MealPlanWithDetails,
  currentUserId: string,
) {
  return (
    plan.participants.find(
      (participant) => participant.user_id === currentUserId,
    ) ?? null
  );
}

export function buildGoogleCalendarUrl(plan: MealPlanWithDetails) {
  if (!plan.confirmed_start_at) {
    return null;
  }

  const start = new Date(plan.confirmed_start_at);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const restaurant = plan.confirmed_restaurant_id
    ? plan.candidates.find(
        (candidate) => candidate.id === plan.confirmed_restaurant_id,
      )
    : null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: plan.title,
    dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
    details: plan.note ?? "ChiGo meal plan",
    location: restaurant?.address ?? restaurant?.name ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsCalendar(plan: MealPlanWithDetails) {
  if (!plan.confirmed_start_at) {
    return null;
  }

  const start = new Date(plan.confirmed_start_at);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const restaurant = plan.confirmed_restaurant_id
    ? plan.candidates.find(
        (candidate) => candidate.id === plan.confirmed_restaurant_id,
      )
    : null;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ChiGo//Meal Plan//EN",
    "BEGIN:VEVENT",
    `UID:${plan.id}@chigo`,
    `DTSTAMP:${toCalendarDate(new Date())}`,
    `DTSTART:${toCalendarDate(start)}`,
    `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${escapeIcs(plan.title)}`,
    `DESCRIPTION:${escapeIcs(plan.note ?? "ChiGo meal plan")}`,
    `LOCATION:${escapeIcs(restaurant?.address ?? restaurant?.name ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

async function hydrateMealPlans(plans: MealPlan[]) {
  if (plans.length === 0) {
    return [] satisfies MealPlanWithDetails[];
  }

  const supabase = await createClient();
  const planIds = plans.map((plan) => plan.id);
  const [
    { data: participantsData, error: participantsError },
    { data: candidatesData, error: candidatesError },
    { data: timeSlotsData, error: timeSlotsError },
    { data: availabilityData, error: availabilityError },
  ] = await Promise.all([
    supabase
      .from("meal_plan_participants")
      .select("*")
      .in("plan_id", planIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("meal_plan_restaurant_candidates")
      .select("*")
      .in("plan_id", planIds),
    supabase
      .from("meal_plan_time_slots")
      .select("*")
      .in("plan_id", planIds)
      .order("start_at", { ascending: true }),
    supabase.from("meal_plan_availability").select("*").in("plan_id", planIds),
  ]);

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  if (candidatesError) {
    throw new Error(candidatesError.message);
  }

  if (timeSlotsError) {
    throw new Error(timeSlotsError.message);
  }

  if (availabilityError) {
    throw new Error(availabilityError.message);
  }

  const participants = (participantsData ?? []) as MealPlanParticipant[];
  const candidates = (candidatesData ?? []) as MealPlanRestaurantCandidate[];
  const timeSlots = (timeSlotsData ?? []) as MealPlanTimeSlot[];
  const availability = (availabilityData ?? []) as MealPlanAvailability[];
  const profileIds = [
    ...new Set([
      ...plans.map((plan) => plan.creator_id),
      ...participants.map((participant) => participant.user_id),
      ...availability.map((item) => item.user_id),
    ]),
  ];
  const profiles = await getProfilesByIds(profileIds);
  const restaurantIds = [
    ...new Set(candidates.map((item) => item.restaurant_id)),
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

  const participantsByPlan = new Map<
    string,
    MealPlanParticipantWithProfile[]
  >();

  for (const participant of participants) {
    const profile = profiles.get(participant.user_id);

    if (!profile) {
      continue;
    }

    const list = participantsByPlan.get(participant.plan_id) ?? [];
    list.push({ ...participant, profile });
    participantsByPlan.set(participant.plan_id, list);
  }

  const candidatesByPlan = new Map<string, Restaurant[]>();

  for (const candidate of candidates) {
    const restaurant = restaurants.get(candidate.restaurant_id);

    if (!restaurant) {
      continue;
    }

    const list = candidatesByPlan.get(candidate.plan_id) ?? [];
    list.push(restaurant);
    candidatesByPlan.set(candidate.plan_id, list);
  }

  const availabilityBySlot = new Map<
    string,
    Array<MealPlanAvailability & { profile: Profile }>
  >();

  for (const item of availability) {
    const profile = profiles.get(item.user_id);

    if (!profile) {
      continue;
    }

    const list = availabilityBySlot.get(item.time_slot_id) ?? [];
    list.push({ ...item, profile });
    availabilityBySlot.set(item.time_slot_id, list);
  }

  const slotsByPlan = new Map<string, MealPlanTimeSlotWithAvailability[]>();

  for (const slot of timeSlots) {
    const slotAvailability = availabilityBySlot.get(slot.id) ?? [];
    const yesCount = slotAvailability.filter(
      (item) => item.availability === "yes",
    ).length;
    const maybeCount = slotAvailability.filter(
      (item) => item.availability === "maybe",
    ).length;
    const noCount = slotAvailability.filter(
      (item) => item.availability === "no",
    ).length;
    const hydratedSlot = {
      ...slot,
      availability: slotAvailability,
      yesCount,
      maybeCount,
      noCount,
      score: yesCount * 2 + maybeCount,
    };
    const list = slotsByPlan.get(slot.plan_id) ?? [];
    list.push(hydratedSlot);
    slotsByPlan.set(slot.plan_id, list);
  }

  return plans.flatMap((plan) => {
    const creator = profiles.get(plan.creator_id);

    if (!creator) {
      return [];
    }

    const planTimeSlots = (slotsByPlan.get(plan.id) ?? []).sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
    const bestTimeSlot =
      [...planTimeSlots].sort((a, b) =>
        b.score === a.score
          ? new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
          : b.score - a.score,
      )[0] ?? null;

    return [
      {
        ...plan,
        creator,
        participants: participantsByPlan.get(plan.id) ?? [],
        candidates: candidatesByPlan.get(plan.id) ?? [],
        timeSlots: planTimeSlots,
        bestTimeSlot,
      },
    ];
  });
}

function toCalendarDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
