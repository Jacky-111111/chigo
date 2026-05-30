import { redirect } from "next/navigation";
import { completeOnboarding } from "@/lib/actions/profile-actions";
import { ProfileForm } from "@/components/settings/profile-form";
import { getProfileBundle, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Onboarding",
};

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const { profile, preferences } = await getProfileBundle(user.id);

  if (profile?.profile_completed_at) {
    redirect("/invites");
  }

  return (
    <section className="page-shell grid gap-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
          Set up your dining profile
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          A few preferences make invites feel more human and help friends know what works for you.
        </p>
      </div>

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      <ProfileForm
        action={completeOnboarding}
        profile={profile}
        preferences={preferences}
        submitLabel="Finish setup"
      />
    </section>
  );
}
