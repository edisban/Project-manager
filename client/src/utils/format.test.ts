import { describe, expect, it } from "vitest";
import {
  ageFrom,
  formatRelative,
  hueFor,
  initials,
  parseDateTime,
  parseLocal,
  pluralize,
  todayIso,
} from "./format";

describe("format utilities", () => {
  it("parses backend dates as local time (no off-by-one day)", () => {
    const date = parseLocal("1995-08-02");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([1995, 7, 2]);
    const dateTime = parseLocal("2026-01-27T15:59:43.721709");
    expect([dateTime.getHours(), dateTime.getMinutes(), dateTime.getSeconds()]).toEqual([
      15, 59, 43,
    ]);
  });

  it("treats API instants (ending in Z) as UTC", () => {
    const date = parseDateTime("2026-01-27T13:00:00Z");
    expect(date.getTime()).toBe(Date.UTC(2026, 0, 27, 13, 0, 0));
    expect(formatRelative(new Date(Date.now() - 5_000).toISOString())).toBe("just now");
  });

  it("computes age around birthdays", () => {
    const now = new Date(2026, 5, 15);
    expect(ageFrom("2000-06-15", now)).toBe(26);
    expect(ageFrom("2000-06-16", now)).toBe(25);
  });

  it("formats relative times", () => {
    const now = new Date(2026, 0, 10, 12, 0, 0);
    expect(formatRelative("2026-01-10T11:59:30", now)).toBe("just now");
    expect(formatRelative("2026-01-09T12:00:00", now)).toBe("yesterday");
    expect(formatRelative("2026-01-03T12:00:00", now)).toBe("last week");
  });

  it("builds initials and stable avatar colours", () => {
    expect(initials("Ada", "Lovelace")).toBe("AL");
    expect(initials("Website redesign project")).toBe("WP");
    expect(initials("apollo")).toBe("AP");
    expect(initials("")).toBe("?");
    expect(hueFor("Apollo")).toBe(hueFor("Apollo"));
  });

  it("pluralizes and formats today's date", () => {
    expect(pluralize(1, "student")).toBe("1 student");
    expect(pluralize(3, "student")).toBe("3 students");
    expect(todayIso(new Date(2026, 2, 5))).toBe("2026-03-05");
  });
});
