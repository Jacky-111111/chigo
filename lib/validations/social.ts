import { z } from "zod";

const POSTGRES_UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const uuid = z.string().trim().regex(POSTGRES_UUID_PATTERN, "Invalid ID.");

const optionalUuid = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}, uuid.nullable());

const stringArray = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }

  return [];
}, z.array(z.string()));

export const friendRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Enter a username.")
    .max(24, "Usernames are 24 characters or shorter."),
});

export const friendshipResponseSchema = z.object({
  friendshipId: uuid,
  response: z.enum(["accepted", "rejected"]),
});

export const removeFriendSchema = z.object({
  friendId: uuid,
});

export const openSeatPostFormSchema = z.object({
  restaurantId: optionalUuid,
  locationLabel: z
    .string()
    .trim()
    .min(1, "Add your current location.")
    .max(120, "Keep the location under 120 characters."),
  availableSeats: z.coerce.number().int().min(1).max(12),
  durationMinutes: z.coerce.number().int().min(15).max(180).default(45),
  strangersWelcome: z.preprocess((value) => value === "on", z.boolean()),
});

export const closeOpenSeatPostSchema = z.object({
  postId: uuid,
});

export const friendGroupChatFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(80, "Keep the group name under 80 characters.")
    .optional(),
  memberIds: stringArray.pipe(
    z.array(uuid).min(1, "Choose at least one friend.").max(20),
  ),
});

export const renameFriendGroupChatSchema = z.object({
  threadId: uuid,
  title: z
    .string()
    .trim()
    .max(80, "Keep the group name under 80 characters.")
    .optional(),
});

export const chatMemberSchema = z.object({
  threadId: uuid,
  userId: uuid,
});

export const leaveChatSchema = z.object({
  threadId: uuid,
});

export const chatMessageFormSchema = z.object({
  threadId: uuid,
  body: z
    .string()
    .trim()
    .min(1, "Write a message first.")
    .max(1000, "Messages must be 1,000 characters or shorter."),
});

export const deleteChatMessageSchema = z.object({
  messageId: uuid,
  threadId: uuid,
});

export const mealPlanFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a plan title.")
    .max(120, "Keep the title under 120 characters."),
  note: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters.")
    .optional(),
  restaurantIds: stringArray.pipe(
    z.array(uuid).min(1, "Choose at least one restaurant.").max(5),
  ),
  participantIds: stringArray.pipe(z.array(uuid).max(20)),
  slotStarts: stringArray.pipe(
    z
      .array(z.string().trim().min(1))
      .min(1, "Add at least one time slot.")
      .max(5),
  ),
  durationMinutes: z.coerce.number().int().min(30).max(240).default(90),
});

export const mealPlanStatusSchema = z.object({
  planId: uuid,
  response: z.enum(["joined", "declined"]),
});

export const mealPlanAvailabilitySchema = z.object({
  planId: uuid,
  timeSlotId: uuid,
  availability: z.enum(["yes", "maybe", "no"]),
});

export const confirmMealPlanSchema = z.object({
  planId: uuid,
  restaurantId: uuid,
  timeSlotId: uuid,
});
