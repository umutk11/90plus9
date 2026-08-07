const MIN_SEASON_START_YEAR = 1000;
const MAX_SEASON_START_YEAR = 9999;

export function formatSeason(startYear: number): string {
  const isValidYear =
    Number.isInteger(startYear) &&
    startYear >= MIN_SEASON_START_YEAR &&
    startYear <= MAX_SEASON_START_YEAR;

  if (!isValidYear) {
    throw new RangeError("Season start year must be a four-digit integer.");
  }

  const nextYear = String((startYear + 1) % 100).padStart(2, "0");

  return `${startYear}/${nextYear}`;
}
