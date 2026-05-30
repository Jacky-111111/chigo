import type { Restaurant } from "@/types/database";
import { createDiningInvite } from "@/lib/actions/invite-actions";
import { getDefaultCustomStart } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function InviteForm({
  restaurants,
  selectedRestaurantId,
}: {
  restaurants: Restaurant[];
  selectedRestaurantId?: string;
}) {
  return (
    <form action={createDiningInvite} className="grid gap-5">
      <Card className="grid gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">Meal details</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Create a campus-public invite for a nearby restaurant.
          </p>
        </div>

        <Field label="Restaurant">
          <Select name="restaurantId" defaultValue={selectedRestaurantId ?? restaurants[0]?.id} required>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} {restaurant.cuisine ? `- ${restaurant.cuisine}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Start time">
            <Select name="startPreset" defaultValue="now">
              <option value="now">Now</option>
              <option value="in_30_minutes">In 30 minutes</option>
              <option value="in_1_hour">In 1 hour</option>
              <option value="custom">Custom time</option>
            </Select>
          </Field>

          <Field label="Custom start time" hint="Only used when custom time is selected.">
            <Input name="customStartAt" type="datetime-local" defaultValue={getDefaultCustomStart()} />
          </Field>
        </div>

        <Field label="Maximum group size">
          <Select name="maxParticipants" defaultValue="4">
            <option value="2">2 people</option>
            <option value="3">3 people</option>
            <option value="4">4 people</option>
            <option value="5">5 people</option>
            <option value="6">6 people</option>
            <option value="7">7 people</option>
            <option value="8">8 people</option>
          </Select>
        </Field>

        <Field label="Message" hint="Optional. Keep it short and useful.">
          <Textarea name="message" maxLength={180} placeholder="Want to grab dinner after class?" />
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">Create invite</Button>
      </div>
    </form>
  );
}
