import { formatShortDate } from "@/lib/utils/date-range";
import type { WeeklyNutritionSummary } from "@/lib/services/meals";

type NutritionLineChartProps = {
  days: WeeklyNutritionSummary["days"];
  calorieTarget?: number | null;
  selectedDate?: string;
};

const chart = {
  width: 720,
  height: 260,
  left: 44,
  right: 20,
  top: 22,
  bottom: 38,
};

export function NutritionLineChart({
  days,
  calorieTarget,
  selectedDate,
}: NutritionLineChartProps) {
  const values = days.map((day) => Math.round(day.totals.calories));
  const maxValue = getNiceMax(Math.max(...values, calorieTarget ?? 0, 100));
  const points = days.map((day, index) => {
    const x =
      chart.left +
      (index / Math.max(days.length - 1, 1)) *
        (chart.width - chart.left - chart.right);
    const y = valueToY(day.totals.calories, maxValue);

    return { ...day, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? chart.left} ${chart.height - chart.bottom} L ${chart.left} ${chart.height - chart.bottom} Z`;
  const targetY = calorieTarget ? valueToY(calorieTarget, maxValue) : null;

  return (
    <div className="grid gap-3">
      <div className="min-h-64 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[#fbfbff] p-3">
        <svg
          aria-label="Weekly calorie trend"
          className="h-64 w-full"
          role="img"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
        >
          <defs>
            <linearGradient id="calorie-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6C6BE2" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6C6BE2" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((ratio) => {
            const y =
              chart.top + ratio * (chart.height - chart.top - chart.bottom);
            const label = Math.round(maxValue * (1 - ratio));

            return (
              <g key={ratio}>
                <line
                  stroke="#e5e4ef"
                  strokeDasharray="4 6"
                  x1={chart.left}
                  x2={chart.width - chart.right}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#68647a"
                  fontSize="12"
                  fontWeight="700"
                  textAnchor="end"
                  x={chart.left - 10}
                  y={y + 4}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {targetY ? (
            <g>
              <line
                stroke="#E05C20"
                strokeDasharray="7 6"
                strokeWidth="2"
                x1={chart.left}
                x2={chart.width - chart.right}
                y1={targetY}
                y2={targetY}
              />
              <text
                fill="#E05C20"
                fontSize="12"
                fontWeight="800"
                x={chart.left + 6}
                y={targetY - 8}
              >
                goal
              </text>
            </g>
          ) : null}

          <path d={areaPath} fill="url(#calorie-area)" />
          <path
            d={linePath}
            fill="none"
            stroke="#372E7D"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />

          {points.map((point) => {
            const active = point.date === selectedDate;

            return (
              <g key={point.date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={active ? "#ECB22D" : "#ffffff"}
                  r={active ? 6 : 5}
                  stroke={active ? "#DE7F24" : "#372E7D"}
                  strokeWidth="3"
                />
                <text
                  fill="#372E7D"
                  fontSize="12"
                  fontWeight="800"
                  textAnchor="middle"
                  x={point.x}
                  y={chart.height - 14}
                >
                  {formatShortDate(point.date).replace(",", "")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-bold text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-8 rounded-full bg-[var(--brand-eggplant)]" />
          Estimated calories
        </span>
        {calorieTarget ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-[var(--food-chili)]" />
            Daily goal
          </span>
        ) : null}
      </div>
    </div>
  );
}

function valueToY(value: number, maxValue: number) {
  const plotHeight = chart.height - chart.top - chart.bottom;
  const ratio = maxValue === 0 ? 0 : Math.min(value / maxValue, 1);

  return chart.top + plotHeight - ratio * plotHeight;
}

function getNiceMax(value: number) {
  return Math.max(100, Math.ceil(value / 500) * 500);
}
