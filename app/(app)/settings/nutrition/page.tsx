import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { NutritionGoalsForm } from "@/components/meals/nutrition-goals-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getNutritionGoals } from "@/lib/services/meals";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Nutrition Settings",
};

export const dynamic = "force-dynamic";

type NutritionSettingsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function NutritionSettingsPage({
  searchParams,
}: NutritionSettingsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const goals = await getNutritionGoals(user.id);

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/settings">
            <ArrowLeft size={17} />
            Back to settings
          </Link>
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="warm">Approximate estimates</Badge>
              <Badge variant="neutral">Private to you</Badge>
            </div>
            <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
              Nutrition settings
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              Set lightweight targets for ChiGo&apos;s journal comparisons.
              These settings are not medical advice.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/nutrition">
              <Target size={17} />
              Dashboard
            </Link>
          </Button>
        </div>
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

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <NutritionGoalsForm goals={goals} />

        <Card className="grid h-fit gap-3 p-5">
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
            How ChiGo uses this
          </h2>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Goals are used for simple comparisons in your meal journal and
            weekly dashboard. Estimates can be incomplete when a meal has no
            photo or limited notes.
          </p>
        </Card>
      </div>
    </section>
  );
}
