import { z } from "zod";

const GUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const inviteFormSchema = z.object({
  restaurantId: z.string().regex(GUID_PATTERN, "Choose a restaurant."),
  startPreset: z.enum(["now", "in_30_minutes", "in_1_hour", "custom"]),
  customStartAt: z.string().optional(),
  maxParticipants: z.coerce.number().int().min(2).max(8),
  message: z.string().trim().max(180).optional(),
  visibility: z
    .enum(["campus_public", "friends_only", "private_link"])
    .default("campus_public"),
});

export type InviteFormInput = z.infer<typeof inviteFormSchema>;
