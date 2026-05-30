import { describe, expect, it } from "vitest";
import { profileFormSchema } from "@/lib/validations/profile";

describe("profileFormSchema", () => {
  it("normalizes usernames and comma-separated preferences", () => {
    const result = profileFormSchema.parse({
      username: "Tartan_Eater",
      displayName: "Tartan Eater",
      university: "Carnegie Mellon University",
      bio: "",
      instagramHandle: "@tartan.eater",
      dietaryRestrictions: "vegetarian, halal",
      allergies: "peanuts",
      favoriteCuisines: "Sichuan, Thai",
      typicalMealTimes: ["lunch", "dinner"],
      socialPreference: "open_to_invites",
    });

    expect(result.username).toBe("tartan_eater");
    expect(result.instagramHandle).toBe("tartan.eater");
    expect(result.favoriteCuisines).toEqual(["Sichuan", "Thai"]);
  });
});
