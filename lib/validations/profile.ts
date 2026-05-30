import { z } from "zod";

const csvField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}, z.array(z.string().min(1).max(40)).max(12));

const mealTimes = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}, z.array(z.enum(["breakfast", "lunch", "dinner", "late_night"])).max(4));

export const profileFormSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only."),
  displayName: z.string().trim().min(1, "Display name is required.").max(60),
  university: z.string().trim().min(1).max(80).default("Carnegie Mellon University"),
  bio: z.string().trim().max(180).optional(),
  instagramHandle: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, ""))
    .pipe(z.string().max(30).regex(/^[a-zA-Z0-9._]*$/, "Use a valid Instagram handle."))
    .optional(),
  dietaryRestrictions: csvField,
  allergies: csvField,
  favoriteCuisines: csvField,
  typicalMealTimes: mealTimes,
  socialPreference: z.enum(["open_to_invites", "friends_only", "private"]),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
