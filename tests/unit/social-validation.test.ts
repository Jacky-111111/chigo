import { describe, expect, it } from "vitest";
import {
  chatMessageFormSchema,
  friendGroupChatFormSchema,
  mealPlanFormSchema,
  openSeatPostFormSchema,
} from "@/lib/validations/social";

const userA = "10000000-0000-4000-8000-000000000001";
const userB = "10000000-0000-4000-8000-000000000002";
const restaurantA = "10000000-0000-0000-0000-000000000001";

describe("friendGroupChatFormSchema", () => {
  it("requires at least one selected friend", () => {
    expect(() =>
      friendGroupChatFormSchema.parse({
        title: "Dinner crew",
        memberIds: [],
      }),
    ).toThrow();
  });

  it("normalizes a single selected friend into an array", () => {
    const result = friendGroupChatFormSchema.parse({
      title: "  Dinner crew  ",
      memberIds: userA,
    });

    expect(result.title).toBe("Dinner crew");
    expect(result.memberIds).toEqual([userA]);
  });
});

describe("chatMessageFormSchema", () => {
  it("trims message text and enforces a body", () => {
    const result = chatMessageFormSchema.parse({
      threadId: userA,
      body: "  Meet outside in five?  ",
    });

    expect(result.body).toBe("Meet outside in five?");
  });
});

describe("openSeatPostFormSchema", () => {
  it("coerces seat count and checkbox state", () => {
    const result = openSeatPostFormSchema.parse({
      restaurantId: "",
      locationLabel: "  Cohon 2F  ",
      availableSeats: "2",
      durationMinutes: "45",
      strangersWelcome: "on",
    });

    expect(result.restaurantId).toBeNull();
    expect(result.locationLabel).toBe("Cohon 2F");
    expect(result.availableSeats).toBe(2);
    expect(result.strangersWelcome).toBe(true);
  });

  it("accepts deterministic seed restaurant ids", () => {
    const result = openSeatPostFormSchema.parse({
      restaurantId: restaurantA,
      locationLabel: "Cohon",
      availableSeats: "2",
      durationMinutes: "45",
      strangersWelcome: "off",
    });

    expect(result.restaurantId).toBe(restaurantA);
  });
});

describe("mealPlanFormSchema", () => {
  it("parses candidate restaurants, invited friends, and time slots", () => {
    const result = mealPlanFormSchema.parse({
      title: "  Friday dinner  ",
      note: "  quick before movie  ",
      restaurantIds: [restaurantA],
      participantIds: [userA, userB],
      slotStarts: ["2026-06-05T18:30"],
      durationMinutes: "90",
    });

    expect(result.title).toBe("Friday dinner");
    expect(result.note).toBe("quick before movie");
    expect(result.restaurantIds).toEqual([restaurantA]);
    expect(result.participantIds).toEqual([userA, userB]);
    expect(result.durationMinutes).toBe(90);
  });

  it("ignores blank optional array values from form inputs", () => {
    const result = mealPlanFormSchema.parse({
      title: "Dinner",
      note: "",
      restaurantIds: [restaurantA, ""],
      participantIds: ["", userA],
      slotStarts: ["2026-06-05T18:30", "", "   "],
      durationMinutes: "60",
    });

    expect(result.restaurantIds).toEqual([restaurantA]);
    expect(result.participantIds).toEqual([userA]);
    expect(result.slotStarts).toEqual(["2026-06-05T18:30"]);
  });
});
