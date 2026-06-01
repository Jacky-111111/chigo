import { Target } from "lucide-react";
import { updateNutritionGoals } from "@/lib/actions/meal-actions";
import { nutritionGoalOptions } from "@/lib/validations/meal";
import type { NutritionGoal } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function NutritionGoalsForm({
  goals,
}: {
  goals?: NutritionGoal | null;
}) {
  return (
    <form action={updateNutritionGoals} className="grid gap-5">
      <Card className="grid gap-5 p-5">
        <div className="flex items-center gap-2">
          <Target className="text-[var(--food-tangerine)]" size={20} />
          <div>
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Nutrition goals
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              Goals help ChiGo compare estimates. This is not medical advice.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Daily calories" hint="Optional target.">
            <Input
              name="dailyCalorieTarget"
              type="number"
              min={500}
              max={8000}
              defaultValue={goals?.daily_calorie_target ?? ""}
              placeholder="2200"
            />
          </Field>

          <Field label="Daily protein" hint="Optional grams target.">
            <Input
              name="dailyProteinTargetG"
              type="number"
              min={0}
              max={500}
              defaultValue={goals?.daily_protein_target_g ?? ""}
              placeholder="120"
            />
          </Field>
        </div>

        <Field label="Goal type">
          <Select name="goalType" defaultValue={goals?.goal_type ?? "balanced"}>
            {nutritionGoalOptions.map((goal) => (
              <option key={goal.value} value={goal.value}>
                {goal.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Custom note">
          <Textarea
            name="customGoalNote"
            defaultValue={goals?.custom_goal_note ?? ""}
            placeholder="Example: keep lunches lighter on class days."
            maxLength={240}
          />
        </Field>
      </Card>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving...">
          <Target size={17} />
          Save goals
        </SubmitButton>
      </div>
    </form>
  );
}
