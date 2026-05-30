import Link from "next/link";
import type { InviteFilter } from "@/lib/services/invites";
import { cn } from "@/lib/utils/cn";

const filters: Array<{ value: InviteFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "starting-soon", label: "Starting soon" },
  { value: "open-spots", label: "Open spots" },
  { value: "mine", label: "My invites" },
];

export function InviteFilters({ active }: { active: InviteFilter }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Link
          key={filter.value}
          href={filter.value === "all" ? "/invites" : `/invites?filter=${filter.value}`}
          className={cn(
            "rounded-[8px] border border-[var(--border)] bg-white px-3 py-2 text-sm font-bold text-[var(--text-muted)] transition hover:border-[var(--brand-indigo)] hover:text-[var(--brand-eggplant)]",
            active === filter.value && "border-[var(--brand-eggplant)] bg-[var(--brand-eggplant)] text-white hover:text-white",
          )}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
