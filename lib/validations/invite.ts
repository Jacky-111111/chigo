import { z } from "zod";

export const inviteFormSchema = z.object({
  restaurantId: z.string().uuid("Choose a restaurant."),
  startPreset: z.enum(["now", "in_30_minutes", "in_1_hour", "custom"]),
  customStartAt: z.string().optional(),
  maxParticipants: z.coerce.number().int().min(2).max(8),
  message: z.string().trim().max(180).optional(),
});

export type InviteFormInput = z.infer<typeof inviteFormSchema>;
