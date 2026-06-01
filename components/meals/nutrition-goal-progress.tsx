import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NutritionTotals } from "@/lib/services/meals";
import type { NutritionGoal } from "@/types/database";

type NutritionGoalProgressProps = {
  goals: NutritionGoal | null;
  totals: NutritionTotals;
  label?: string;
};

export function NutritionGoalProgress({
  goals,
  totals,
  label = "Goal progress",
}: NutritionGoalProgressProps) {
  const rows = [
    {
      label: "Calories",
      value: Math.round(totals.calories),
      target: goals?.daily_calorie_target ?? null,
      unit: "",
      color: "bg-[var(--food-chili)]",
    },
    {
      label: "Protein",
      value: Math.round(totals.proteinG),
      target: goals?.daily_protein_target_g ?? null,
      unit: "g",
      color: "bg-[var(--brand-indigo)]",
    },
  ];
  const hasGoals = rows.some((row) => row.target);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
          {label}
        </h2>
        <Button asChild variant="ghost" className="min-h-9 px-3">
          <Link href="/settings/nutrition">
            <Settings size={16} />
            Goals
          </Link>
        </Button>
      </div>

      {hasGoals ? (
        <div className="grid gap-3">
          {rows.map((row) => {
            const percent = row.target
              ? Math.min(Math.round((row.value / row.target) * 100), 160)
              : 0;

            return (
              <div key={row.label} className="grid gap-1">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                  <span className="text-[var(--text-muted)]">{row.label}</span>
                  <span className="font-black text-[var(--brand-eggplant)]">
                    {row.target
                      ? `${row.value}${row.unit} / ${row.target}${row.unit}`
                      : "Not set"}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#f4f3f8]">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                {row.target ? (
                  <p className="text-xs font-semibold text-[var(--text-muted)]">
                    {percent}% of daily target
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
          Set calorie or protein goals to compare this journal against your
          targets.
        </p>
      )}
    </div>
  );
}
