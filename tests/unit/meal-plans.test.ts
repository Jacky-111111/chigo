import { describe, expect, it } from "vitest";
import {
  buildGoogleCalendarUrl,
  buildIcsCalendar,
  type MealPlanWithDetails,
} from "@/lib/services/meal-plans";

describe("meal plan calendar helpers", () => {
  it("builds Google Calendar and ICS outputs for confirmed plans", () => {
    const plan = confirmedPlan();

    expect(buildGoogleCalendarUrl(plan)).toContain(
      "https://calendar.google.com/calendar/render?",
    );
    expect(buildIcsCalendar(plan)).toContain("SUMMARY:Friday dinner");
    expect(buildIcsCalendar(plan)).toContain("LOCATION:5000 Forbes Ave");
  });

  it("returns null for unconfirmed plans", () => {
    const plan = { ...confirmedPlan(), confirmed_start_at: null };

    expect(buildGoogleCalendarUrl(plan)).toBeNull();
    expect(buildIcsCalendar(plan)).toBeNull();
  });
});

function confirmedPlan(): MealPlanWithDetails {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    creator_id: "10000000-0000-4000-8000-000000000001",
    title: "Friday dinner",
    note: "Before the movie",
    status: "confirmed",
    confirmed_restaurant_id: "20000000-0000-4000-8000-000000000001",
    confirmed_start_at: "2026-06-05T22:30:00.000Z",
    created_at: "2026-06-01T16:00:00.000Z",
    updated_at: "2026-06-01T16:00:00.000Z",
    creator: {
      id: "10000000-0000-4000-8000-000000000001",
      username: "owner",
      display_name: "Owner",
      university: "Carnegie Mellon University",
      bio: null,
      instagram_handle: null,
      avatar_url: null,
      profile_completed_at: "2026-06-01T16:00:00.000Z",
      created_at: "2026-06-01T16:00:00.000Z",
      updated_at: "2026-06-01T16:00:00.000Z",
    },
    participants: [],
    candidates: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        name: "Tasty Place",
        cuisine: "Noodles",
        address: "5000 Forbes Ave",
        latitude: 40.443,
        longitude: -79.943,
        price_level: 2,
        photo_url: null,
        google_maps_url: null,
        is_active: true,
        created_at: "2026-06-01T16:00:00.000Z",
        updated_at: "2026-06-01T16:00:00.000Z",
      },
    ],
    timeSlots: [],
    bestTimeSlot: null,
  };
}
