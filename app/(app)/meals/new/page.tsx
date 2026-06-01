import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MealForm } from "@/components/meals/meal-form";
import { Button } from "@/components/ui/button";
import { listMealFormOptions } from "@/lib/services/meals";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "New Meal",
};

export const dynamic = "force-dynamic";

type NewMealPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewMealPage({ searchParams }: NewMealPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const { restaurants, menuItems } = await listMealFormOptions(user.id);

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/meals">
            <ArrowLeft size={17} />
            Back to meals
          </Link>
        </Button>
        <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
          Add a meal
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          Add a photo when you have one, or log manually with notes.
        </p>
      </div>

      {params?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {params.error}
        </div>
      ) : null}

      <MealForm restaurants={restaurants} menuItems={menuItems} />
    </section>
  );
}
