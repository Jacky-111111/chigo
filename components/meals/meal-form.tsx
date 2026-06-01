import Link from "next/link";
import { Camera, Clock, FileText, MapPin, Utensils } from "lucide-react";
import { createMealLog, updateMealLog } from "@/lib/actions/meal-actions";
import type {
  MealLogWithDetails,
  MealMenuItemOption,
} from "@/lib/services/meals";
import { formatDateTimeLocalInTimeZone } from "@/lib/utils/date-range";
import type { Restaurant } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function MealForm({
  restaurants,
  menuItems,
  meal,
}: {
  restaurants: Restaurant[];
  menuItems: MealMenuItemOption[];
  meal?: MealLogWithDetails | null;
}) {
  const action = meal ? updateMealLog : createMealLog;
  const defaultEatenAt = meal
    ? formatDateTimeLocalInTimeZone(meal.eaten_at)
    : formatDateTimeLocalInTimeZone(new Date());

  return (
    <form action={action} className="grid gap-5">
      {meal ? <input type="hidden" name="mealId" value={meal.id} /> : null}

      <Card className="grid gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
            Meal details
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Log what you ate. Nutrition is estimated, never medical advice.
          </p>
        </div>

        <Field label="Meal name">
          <div className="relative">
            <Utensils
              className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]"
              size={16}
            />
            <Input
              name="mealName"
              defaultValue={meal?.meal_name ?? ""}
              placeholder="Spicy chicken bowl"
              required
              className="pl-9"
            />
          </div>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Restaurant">
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]"
                size={16}
              />
              <Select
                name="restaurantId"
                defaultValue={meal?.restaurant_id ?? ""}
                className="pl-9"
              >
                <option value="">No restaurant selected</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field label="Menu item" hint="Optional. Uses your analyzed menus.">
            <Select name="menuItemId" defaultValue={meal?.menu_item_id ?? ""}>
              <option value="">No menu item selected</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {(item.translated_name ?? item.original_name) +
                    (item.restaurantName ? ` - ${item.restaurantName}` : "")}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Meal time">
            <div className="relative">
              <Clock
                className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]"
                size={16}
              />
              <Input
                name="eatenAt"
                type="datetime-local"
                defaultValue={defaultEatenAt}
                required
                className="pl-9"
              />
            </div>
          </Field>

          <Field
            label={meal ? "Replace photo" : "Meal photo"}
            hint="Optional. JPEG, PNG, WebP, HEIC, or HEIF up to 10 MB."
          >
            <Input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="file:mr-3 file:rounded-[8px] file:border-0 file:bg-[var(--brand-eggplant)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </Field>
        </div>

        <Field label="Notes">
          <div className="relative">
            <FileText
              className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]"
              size={16}
            />
            <Textarea
              name="notes"
              defaultValue={meal?.notes ?? ""}
              placeholder="Half rice, extra tofu, shared fries..."
              className="pl-9"
            />
          </div>
        </Field>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="secondary">
          <Link href={meal ? `/meals/${meal.id}` : "/meals"}>Cancel</Link>
        </Button>
        <SubmitButton pendingLabel={meal ? "Saving..." : "Logging meal..."}>
          <Camera size={17} />
          {meal ? "Save meal" : "Log meal"}
        </SubmitButton>
      </div>
    </form>
  );
}
