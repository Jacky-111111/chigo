import {
  calculateMacroCalories,
  type NutritionTotals,
} from "@/lib/services/meals";

type MacroDistributionChartProps = {
  totals: NutritionTotals;
};

const macroSegments = [
  { key: "protein", label: "Protein", color: "#6C6BE2" },
  { key: "fat", label: "Fat", color: "#ECB22D" },
  { key: "carbs", label: "Carbs", color: "#DE7F24" },
] as const;

export function MacroDistributionChart({
  totals,
}: MacroDistributionChartProps) {
  const macroCalories = calculateMacroCalories(totals);
  const total = macroCalories.total;

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-[#f7f7fb] p-3">
        <div className="flex h-5 overflow-hidden rounded-full bg-white">
          {macroSegments.map((segment) => {
            const value = macroCalories[segment.key];
            const width = total === 0 ? 0 : (value / total) * 100;

            return (
              <span
                key={segment.key}
                aria-label={`${segment.label} ${Math.round(width)} percent`}
                className="block h-full"
                style={{
                  backgroundColor: segment.color,
                  width: `${width}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        {macroSegments.map((segment) => {
          const value = macroCalories[segment.key];
          const percent = total === 0 ? 0 : Math.round((value / total) * 100);

          return (
            <div
              key={segment.key}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm font-semibold text-[var(--text-muted)]"
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span>{segment.label}</span>
              <span className="font-black text-[var(--brand-eggplant)]">
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
