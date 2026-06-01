import { Badge } from "@/components/ui/badge";
import type { NutritionTotals } from "@/lib/services/meals";

export function NutritionMacroRow({
  totals,
  compact = false,
}: {
  totals: NutritionTotals;
  compact?: boolean;
}) {
  const macros = [
    { label: "Calories", value: Math.round(totals.calories), unit: "" },
    { label: "Protein", value: Math.round(totals.proteinG), unit: "g" },
    { label: "Fat", value: Math.round(totals.fatG), unit: "g" },
    { label: "Carbs", value: Math.round(totals.carbsG), unit: "g" },
  ];

  return (
    <div
      className={compact ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-4"}
    >
      {macros.map((macro) =>
        compact ? (
          <Badge key={macro.label} variant="indigo">
            {macro.label}: {macro.value}
            {macro.unit}
          </Badge>
        ) : (
          <div
            key={macro.label}
            className="rounded-[8px] bg-[#f7f7fb] px-3 py-2"
          >
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
              {macro.label}
            </p>
            <p className="mt-1 text-lg font-black text-[var(--brand-eggplant)]">
              {macro.value}
              {macro.unit}
            </p>
          </div>
        ),
      )}
    </div>
  );
}
