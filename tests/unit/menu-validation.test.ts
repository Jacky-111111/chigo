import { describe, expect, it } from "vitest";
import {
  menuFeedbackFormSchema,
  menuUploadFormSchema,
} from "@/lib/validations/menu";

describe("menuUploadFormSchema", () => {
  it("accepts an optional restaurant and defaults target language", () => {
    const result = menuUploadFormSchema.parse({
      restaurantId: "",
      targetLanguage: "en",
    });

    expect(result.restaurantId).toBeNull();
    expect(result.targetLanguage).toBe("en");
  });
});

describe("menuFeedbackFormSchema", () => {
  it("accepts allergy risk feedback", () => {
    const result = menuFeedbackFormSchema.parse({
      menuUploadId: "10000000-0000-4000-8000-000000000001",
      menuItemId: "10000000-0000-4000-8000-000000000002",
      feedbackType: "allergy_risk",
      note: "Contains peanuts.",
    });

    expect(result.feedbackType).toBe("allergy_risk");
  });
});
