import { describe, expect, it } from "vitest";

import { formatSeason } from "./season";

describe("formatSeason", () => {
  it.each([
    [2012, "2012/13"],
    [2025, "2025/26"],
    [2099, "2099/00"],
  ])("formats the %i season as %s", (startYear, expected) => {
    expect(formatSeason(startYear)).toBe(expected);
  });

  it.each([2012.5, Number.NaN, 999, 10_000])("rejects invalid start year %s", (startYear) => {
    expect(() => formatSeason(startYear)).toThrow("Season start year");
  });
});
