import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/services/profiles";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile(user.id);

  if (!profile?.profile_completed_at) {
    redirect("/onboarding");
  }

  redirect("/invites");
}
