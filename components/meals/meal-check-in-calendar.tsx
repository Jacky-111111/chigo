import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MealCheckInCalendar as MealCheckInCalendarData } from "@/lib/services/meals";
import { cn } from "@/lib/utils/cn";

type MealCheckInCalendarProps = {
  calendar: MealCheckInCalendarData;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const slotStyles = {
  breakfast: {
    active: "bg-[var(--food-saffron)] text-[#4b3609]",
    inactive: "bg-[#f2eef3] text-[var(--text-muted)]",
  },
  lunch: {
    active: "bg-[var(--food-tangerine)] text-white",
    inactive: "bg-[#f2eef3] text-[var(--text-muted)]",
  },
  dinner: {
    active: "bg-[var(--brand-indigo)] text-white",
    inactive: "bg-[#f2eef3] text-[var(--text-muted)]",
  },
};

export function MealCheckInCalendar({ calendar }: MealCheckInCalendarProps) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2
              className="text-[var(--food-tangerine)]"
              size={21}
            />
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Check-in calendar
            </h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Breakfast, lunch, and dinner stay visible across the month.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="min-h-9 px-3">
            <Link href={`/meals?date=${calendar.previousMonthDate}`}>
              <ChevronLeft size={16} />
              Prev
            </Link>
          </Button>
          <div className="inline-flex min-h-9 items-center rounded-[8px] border border-[var(--border)] bg-[#f7f7fb] px-3 text-sm font-black text-[var(--brand-eggplant)]">
            {calendar.monthLabel}
          </div>
          <Button asChild variant="secondary" className="min-h-9 px-3">
            <Link href={`/meals?date=${calendar.nextMonthDate}`}>
              Next
              <ChevronRight size={16} />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <CheckInMetric
          icon={<Flame size={17} />}
          label="Current streak"
          value={`${calendar.currentStreak}d`}
        />
        <CheckInMetric
          icon={<Trophy size={17} />}
          label="Perfect days"
          value={calendar.perfectDays}
        />
        <CheckInMetric
          icon={<CheckCircle2 size={17} />}
          label="Logged days"
          value={`${calendar.loggedDays}/${calendar.daysInMonth}`}
        />
        <CheckInMetric
          icon={<CalendarCheck2 size={17} />}
          label="Month completion"
          value={`${calendar.completionPercent}%`}
        />
      </div>

      <div className="grid gap-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-[var(--text-muted)] sm:gap-2">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendar.days.map((day) => (
            <Link
              key={day.date}
              href={`/meals?date=${day.date}`}
              aria-label={`${day.date}: ${day.completedSlots} meal slots checked in`}
              className={cn(
                "grid min-h-24 gap-2 rounded-[8px] border border-[var(--border)] bg-white p-2 text-left transition hover:border-[var(--brand-indigo)] hover:bg-[#fbfbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)] sm:min-h-28",
                !day.inCurrentMonth && "opacity-45",
                day.isSelected &&
                  "border-[var(--brand-eggplant)] bg-[#f4f3ff] shadow-[inset_0_0_0_1px_var(--brand-eggplant)]",
                day.isCompleteDay &&
                  day.inCurrentMonth &&
                  "border-[rgba(222,127,36,0.42)] bg-[rgba(236,178,45,0.08)]",
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-black text-[var(--brand-eggplant)]",
                    day.isToday && "bg-[var(--brand-eggplant)] text-white",
                  )}
                >
                  {day.dayOfMonth}
                </span>
                {day.mealCount > 0 ? (
                  <Badge variant={day.isCompleteDay ? "warm" : "indigo"}>
                    {day.mealCount}
                  </Badge>
                ) : null}
              </span>

              <span className="grid gap-1">
                {day.slots.map((slot) => (
                  <span
                    key={slot.key}
                    className={cn(
                      "inline-flex h-6 items-center justify-center rounded-md text-[10px] font-black",
                      slot.completed
                        ? slotStyles[slot.key].active
                        : slotStyles[slot.key].inactive,
                    )}
                    title={`${slot.label}: ${slot.count}`}
                  >
                    {slot.shortLabel}
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-center">
        <div className="h-3 overflow-hidden rounded-full bg-[#f4f3f8]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--food-saffron),var(--food-tangerine),var(--brand-indigo))]"
            style={{ width: `${calendar.completionPercent}%` }}
          />
        </div>
        <p className="text-sm font-semibold text-[var(--text-muted)]">
          {calendar.completedCheckIns}/{calendar.possibleCheckIns} monthly
          check-ins
        </p>
      </div>
    </Card>
  );
}

function CheckInMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid gap-2 rounded-[8px] bg-[#f7f7fb] p-3">
      <div className="flex items-center gap-2 text-[var(--food-tangerine)]">
        {icon}
        <span className="text-xs font-bold uppercase text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-[var(--brand-eggplant)]">
        {value}
      </p>
    </div>
  );
}
