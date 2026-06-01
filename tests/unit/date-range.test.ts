import { describe, expect, it } from "vitest";
import {
  addMonths,
  getLocalDayUtcRange,
  getMonthStartDateString,
  getWeekStartDateString,
  parseDateTimeLocalInTimeZone,
} from "@/lib/utils/date-range";

describe("parseDateTimeLocalInTimeZone", () => {
  it("treats datetime-local values as app timezone values", () => {
    expect(parseDateTimeLocalInTimeZone("2026-06-01T12:30")).toBe(
      "2026-06-01T16:30:00.000Z",
    );
    expect(parseDateTimeLocalInTimeZone("2026-01-01T08:00")).toBe(
      "2026-01-01T13:00:00.000Z",
    );
  });
});

describe("getLocalDayUtcRange", () => {
  it("builds an America/New_York day range", () => {
    const range = getLocalDayUtcRange("2026-06-01");

    expect(range.startIso).toBe("2026-06-01T04:00:00.000Z");
    expect(range.endIso).toBe("2026-06-02T04:00:00.000Z");
  });
});

describe("getWeekStartDateString", () => {
  it("uses Monday as the first day of the week", () => {
    expect(getWeekStartDateString("2026-06-07")).toBe("2026-06-01");
    expect(getWeekStartDateString("2026-06-03")).toBe("2026-06-01");
  });
});

describe("month helpers", () => {
  it("normalizes month starts and shifts months", () => {
    expect(getMonthStartDateString("2026-06-18")).toBe("2026-06-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
  });
});
