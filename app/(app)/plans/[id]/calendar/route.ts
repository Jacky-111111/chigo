import { notFound } from "next/navigation";
import { buildIcsCalendar, getMealPlanDetail } from "@/lib/services/meal-plans";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

type CalendarRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: CalendarRouteProps) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  await requireCompletedProfile(user.id);
  const plan = await getMealPlanDetail(id);

  if (!plan) {
    notFound();
  }

  const ics = buildIcsCalendar(plan);

  if (!ics) {
    notFound();
  }

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="chigo-${plan.id}.ics"`,
    },
  });
}
