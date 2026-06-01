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

export const acceptedMenuImageExtensions = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
];

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
      message: "Menu images must be 10 MB or smaller.",
    };
  }

  return { ok: true as const, file: value };
}
