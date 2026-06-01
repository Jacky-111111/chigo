import { z } from "zod";
import { parseDateTimeLocalInTimeZone } from "@/lib/utils/date-range";
import {
  acceptedMenuImageExtensions,
  acceptedMenuImageTypes,
  maxMenuImageBytes,
} from "@/lib/validations/menu";

export const nutritionGoalOptions = [
  { value: "balanced", label: "Balanced" },
  { value: "high_protein", label: "High protein" },
  { value: "weight_loss", label: "Weight loss" },
  { value: "maintenance", label: "Maintenance" },
  { value: "custom", label: "Custom" },
] as const;

const optionalUuid = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}, z.string().uuid().nullable());

const optionalPositiveInt = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return null;
    }

    return Number(value);
  }, z.number().int().min(0).max(max).nullable());

export const mealLogFormSchema = z.object({
  mealId: optionalUuid.optional(),
  restaurantId: optionalUuid,
  menuItemId: optionalUuid,
  mealName: z.string().trim().min(1, "Meal name is required.").max(120),
  eatenAt: z.string().trim().min(1, "Meal time is required."),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional(),
});

export const nutritionGoalsFormSchema = z.object({
  dailyCalorieTarget: optionalPositiveInt(8000),
  dailyProteinTargetG: optionalPositiveInt(500),
  goalType: z
    .enum(["balanced", "high_protein", "weight_loss", "maintenance", "custom"])
    .nullable()
    .default("balanced"),
  customGoalNote: z
    .string()
    .trim()
    .max(240, "Keep custom goal notes under 240 characters.")
    .optional(),
});

export function validateOptionalMealImageFile(
  value: FormDataEntryValue | null,
) {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: true as const, file: null };
  }

  const extension = value.name.split(".").pop()?.toLowerCase();
  const acceptedType = acceptedMenuImageTypes.includes(
    value.type as (typeof acceptedMenuImageTypes)[number],
  );
  const acceptedExtension = Boolean(
    extension && acceptedMenuImageExtensions.includes(extension),
  );

  if (!acceptedType && !acceptedExtension) {
    return {
      ok: false as const,
      message: "Use a JPEG, PNG, WebP, HEIC, or HEIF image.",
    };
  }

  if (value.size > maxMenuImageBytes) {
    return {
      ok: false as const,
      message: "Meal photos must be 10 MB or smaller.",
    };
  }

  return { ok: true as const, file: value };
}

export function parseMealEatenAt(value: string) {
  return parseDateTimeLocalInTimeZone(value);
}
