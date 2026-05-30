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
  });
});
