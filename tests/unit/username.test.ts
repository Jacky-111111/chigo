import { describe, expect, it } from "vitest";
import {
  canChangeUsername,
  getNextUsernameChangeDate,
} from "@/lib/utils/username";

describe("username change helpers", () => {
  it("allows the first username change when no prior timestamp exists", () => {
    expect(canChangeUsername(null, new Date("2026-06-02T12:00:00.000Z"))).toBe(
      true,
    );
  });

  it("blocks username changes before the 30 day cooldown has elapsed", () => {
    expect(
      canChangeUsername(
        "2026-06-01T12:00:00.000Z",
        new Date("2026-06-15T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("allows username changes after exactly 30 days", () => {
    expect(
      canChangeUsername(
        "2026-06-01T12:00:00.000Z",
        new Date("2026-07-01T12:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("calculates the next eligible username change date", () => {
    expect(getNextUsernameChangeDate("2026-06-01T12:00:00.000Z")).toEqual(
      new Date("2026-07-01T12:00:00.000Z"),
    );
  });
});
