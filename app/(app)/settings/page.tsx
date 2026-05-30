import { signOut } from "@/lib/actions/auth-actions";
import { updateSettings } from "@/lib/actions/profile-actions";
import { ProfileForm } from "@/components/settings/profile-form";
import { Button } from "@/components/ui/button";
import { getProfileBundle, requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const { profile, preferences } = await getProfileBundle(user.id);

  return (
    <section className="page-shell grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
            Settings
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Keep your profile, dietary context, and social preferences current.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </div>

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      {params?.message ? (
        <div className="rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
          {params.message}
        </div>
      ) : null}

      <ProfileForm
        action={updateSettings}
        profile={profile}
        preferences={preferences}
        submitLabel="Save settings"
      />
    </section>
  );
}
