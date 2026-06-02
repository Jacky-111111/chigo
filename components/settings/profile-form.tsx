import type { DiningPreference, Profile } from "@/types/database";
import {
  formatUsernameChangeDate,
  getNextUsernameChangeDate,
} from "@/lib/utils/username";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const mealTimes = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "late_night", label: "Late night" },
];

export function ProfileForm({
  action,
  profile,
  preferences,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  profile?: Profile | null;
  preferences?: DiningPreference | null;
  submitLabel: string;
}) {
  const selectedMealTimes = new Set(
    preferences?.typical_meal_times ?? ["lunch", "dinner"],
  );
  const usernameHint = getUsernameHint(profile);

  return (
    <form action={action} className="grid gap-5">
      <Card className="grid gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
            Profile
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            This is what other diners see when you host or join a meal.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Username" hint={usernameHint}>
            <Input
              name="username"
              defaultValue={profile?.username ?? ""}
              placeholder="tartan_eater"
              required
            />
          </Field>
          <Field label="Display name">
            <Input
              name="displayName"
              defaultValue={profile?.display_name ?? ""}
              placeholder="Tartan Eater"
              required
            />
          </Field>
        </div>

        <Field label="University">
          <Input
            name="university"
            defaultValue={profile?.university ?? "Carnegie Mellon University"}
            required
          />
        </Field>

        <Field label="Bio">
          <Textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            placeholder="Always down for noodles, sushi, and quick dinners after studio."
            maxLength={180}
          />
        </Field>

        <Field label="Instagram handle" hint="Optional. Store without @.">
          <Input
            name="instagramHandle"
            defaultValue={profile?.instagram_handle ?? ""}
            placeholder="chigo.foodie"
          />
        </Field>
      </Card>

      <Card className="grid gap-5 p-5">
        <div>
          <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
            Dining settings
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            These help ChiGo recommend safer, better meal plans later.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Dietary restrictions"
            hint="Comma separated. Example: vegetarian, halal"
          >
            <Input
              name="dietaryRestrictions"
              defaultValue={(preferences?.dietary_restrictions ?? []).join(
                ", ",
              )}
              placeholder="vegetarian, halal"
            />
          </Field>
          <Field
            label="Allergies"
            hint="Comma separated. Example: peanuts, shellfish"
          >
            <Input
              name="allergies"
              defaultValue={(preferences?.allergies ?? []).join(", ")}
              placeholder="peanuts, shellfish"
            />
          </Field>
        </div>

        <Field
          label="Favorite cuisines"
          hint="Comma separated. Example: Sichuan, Thai, Korean"
        >
          <Input
            name="favoriteCuisines"
            defaultValue={(preferences?.favorite_cuisines ?? []).join(", ")}
            placeholder="Sichuan, Thai, Korean"
          />
        </Field>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold text-[var(--brand-eggplant)]">
            Typical meal times
          </legend>
          <div className="grid gap-2 sm:grid-cols-4">
            {mealTimes.map((mealTime) => (
              <label
                key={mealTime.value}
                className="flex min-h-11 items-center gap-2 rounded-[8px] border border-[var(--border)] bg-white px-3 text-sm font-semibold text-[var(--text-main)]"
              >
                <input
                  name="typicalMealTimes"
                  type="checkbox"
                  value={mealTime.value}
                  defaultChecked={selectedMealTimes.has(mealTime.value)}
                  className="size-4 accent-[var(--brand-eggplant)]"
                />
                {mealTime.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Social preference">
          <Select
            name="socialPreference"
            defaultValue={preferences?.social_preference ?? "open_to_invites"}
          >
            <option value="open_to_invites">Open to dining invites</option>
            <option value="friends_only">Friends only</option>
            <option value="private">Private</option>
          </Select>
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

function getUsernameHint(profile?: Profile | null) {
  const baseHint =
    "Lowercase letters, numbers, and underscores. Changing it invalidates old profile links.";

  if (!profile?.username_changed_at) {
    return `${baseHint} After your first change, username changes are limited to once every 30 days.`;
  }

  return `${baseHint} Username changes are limited to once every 30 days. Next available change: ${formatUsernameChangeDate(
    getNextUsernameChangeDate(profile.username_changed_at),
  )}.`;
}
