import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { DiningPreference, Profile } from "@/types/database";

export type ProfileBundle = {
  profile: Profile | null;
  preferences: DiningPreference | null;
};

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentProfile(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile | null;
}

export async function getProfileBundle(userId: string): Promise<ProfileBundle> {
  if (!hasSupabaseEnv()) {
    return { profile: null, preferences: null };
  }

  const supabase = await createClient();
  const [{ data: profile, error: profileError }, { data: preferences, error: preferencesError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_dining_preferences").select("*").eq("user_id", userId).maybeSingle(),
    ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (preferencesError) {
    throw new Error(preferencesError.message);
  }

  return { profile: profile as Profile | null, preferences: preferences as DiningPreference | null };
}

export async function requireCompletedProfile(userId: string) {
  const profile = await getCurrentProfile(userId);

  if (!profile?.profile_completed_at) {
    redirect("/onboarding");
  }

  return profile;
}
