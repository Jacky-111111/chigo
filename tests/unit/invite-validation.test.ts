import { describe, expect, it } from "vitest";
import { inviteFormSchema } from "@/lib/validations/invite";

describe("inviteFormSchema", () => {
  it("coerces max participants and accepts the immediate preset", () => {
    const result = inviteFormSchema.parse({
      restaurantId: "10000000-0000-4000-8000-000000000001",
      startPreset: "now",
      maxParticipants: "4",
      message: "Dinner after class?",
    });

    expect(result.maxParticipants).toBe(4);
    expect(result.visibility).toBe("campus_public");
  });

  it("accepts Stage 4 friends-only visibility", () => {
    const result = inviteFormSchema.parse({
      restaurantId: "10000000-0000-4000-8000-000000000001",
      startPreset: "in_1_hour",
      maxParticipants: "3",
      visibility: "friends_only",
    });

    expect(result.visibility).toBe("friends_only");
  });
});
