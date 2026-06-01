import type { MealTimingBucket } from "@/lib/services/meals";

type TimingDistributionProps = {
  buckets: MealTimingBucket[];
};

export function TimingDistribution({ buckets }: TimingDistributionProps) {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <div className="grid gap-3">
      {buckets.map((bucket) => {
        const width = Math.max(
          (bucket.count / maxCount) * 100,
          bucket.count ? 12 : 0,
        );

        return (
          <div key={bucket.key} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span className="text-[var(--text-muted)]">{bucket.label}</span>
              <span className="font-black text-[var(--brand-eggplant)]">
                {bucket.count}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#f4f3f8]">
              <div
                className="h-full rounded-full bg-[var(--food-tangerine)]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
