import { z } from "zod";

export const menuLanguageOptions = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "es", label: "Spanish" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
  { value: "fr", label: "French" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
] as const;

export const acceptedMenuImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const maxMenuImageBytes = 10 * 1024 * 1024;

const optionalUuid = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}, z.string().uuid().nullable());

export const menuUploadFormSchema = z.object({
  restaurantId: optionalUuid,
  targetLanguage: z
    .string()
    .trim()
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/, "Choose a supported target language.")
    .default("en"),
});

export const menuFeedbackFormSchema = z.object({
  menuUploadId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  feedbackType: z.enum([
    "incorrect_translation",
    "wrong_ingredients",
    "allergy_risk",
    "other",
  ]),
  note: z
    .string()
    .trim()
    .max(400, "Keep feedback under 400 characters.")
    .optional(),
});

export function validateMenuImageFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: false as const, message: "Upload a menu image first." };
  }

  if (
    !acceptedMenuImageTypes.includes(
      value.type as (typeof acceptedMenuImageTypes)[number],
    )
  ) {
    return {
      ok: false as const,
      message: "Use a JPEG, PNG, WebP, HEIC, or HEIF image.",
    };
  }

  if (value.size > maxMenuImageBytes) {
    return {
      ok: false as const,
      message: "Menu images must be 10 MB or smaller.",
    };
  }

  return { ok: true as const, file: value };
}

export function getMenuImageExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (
    fromName &&
    ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)
  ) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/heic") {
    return "heic";
  }

  if (file.type === "image/heif") {
    return "heif";
  }

  return "jpg";
}
