"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/services/profiles";
import { profileFormSchema } from "@/lib/validations/profile";

function getProfileInput(formData: FormData) {
  return {
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    university: formData.get("university") || "Carnegie Mellon University",
    bio: formData.get("bio"),
    instagramHandle: formData.get("instagramHandle"),
    dietaryRestrictions: formData.get("dietaryRestrictions"),
    allergies: formData.get("allergies"),
    favoriteCuisines: formData.get("favoriteCuisines"),
    typicalMealTimes: formData.getAll("typicalMealTimes"),
    socialPreference: formData.get("socialPreference"),
  };
}

export async function completeOnboarding(formData: FormData) {
  await saveProfile(formData, {
    errorPath: "/onboarding",
    successPath: "/invites",
    markCompleted: true,
  });
}

export async function updateSettings(formData: FormData) {
  await saveProfile(formData, {
    errorPath: "/settings",
    successPath: "/settings?message=Settings saved.",
    markCompleted: false,
  });
}

async function saveProfile(
  formData: FormData,
  options: { errorPath: string; successPath: string; markCompleted: boolean },
) {
  const user = await requireUser();
  const parsed = profileFormSchema.safeParse(getProfileInput(formData));

  if (!parsed.success) {
    redirect(`${options.errorPath}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid profile.")}`);
  }

  const input = parsed.data;
  const supabase = await createClient();
  const completedAt = options.markCompleted ? new Date().toISOString() : undefined;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: input.username,
      display_name: input.displayName,
      university: input.university,
      bio: input.bio || null,
      instagram_handle: input.instagramHandle || null,
      profile_completed_at: completedAt,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    const message =
      profileError.code === "23505"
        ? "That username is already taken."
        : profileError.message;
    redirect(`${options.errorPath}?error=${encodeURIComponent(message)}`);
  }

  const { error: preferenceError } = await supabase.from("user_dining_preferences").upsert(
    {
      user_id: user.id,
      dietary_restrictions: input.dietaryRestrictions,
      allergies: input.allergies,
      favorite_cuisines: input.favoriteCuisines,
      typical_meal_times: input.typicalMealTimes,
      social_preference: input.socialPreference,
    },
    { onConflict: "user_id" },
  );

  if (preferenceError) {
    redirect(`${options.errorPath}?error=${encodeURIComponent(preferenceError.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/invites");
  redirect(options.successPath);
}
