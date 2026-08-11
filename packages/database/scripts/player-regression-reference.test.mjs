import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { validatePlayerRegressionReference } from "../../../scripts/data/player-regression-reference.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let reference;
let clubReference;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

beforeAll(async () => {
  [reference, clubReference] = await Promise.all([
    readFile(
      path.join(repositoryRoot, "data/reference/player-regressions/dcaribou-kaggle-v677.json"),
      "utf8",
    ).then(JSON.parse),
    readFile(
      path.join(repositoryRoot, "data/reference/club-identities/dcaribou-kaggle-v677.json"),
      "utf8",
    ).then(JSON.parse),
  ]);
});

describe("bilinen oyuncu regresyon referansı", () => {
  it("14 sezon, 70 onaylı ilişki ve bütün ana mevkileri kabul eder", () => {
    const result = validatePlayerRegressionReference(reference, clubReference, 677);

    expect(result.errors).toEqual([]);
    expect(result.summary.cases).toBe(70);
    expect(result.summary.positionCounts).toEqual({ def: 14, fwd: 27, gk: 14, mid: 15 });
    expect(result.summary.bigFourCases).toBeGreaterThan(0);
    expect(result.summary.nonIstanbulCases).toBeGreaterThan(0);
    expect(result.summary.foreignCases).toBeGreaterThan(0);
  });

  it("bir sezondaki oyuncu sayısı beşin altına düşerse reddeder", () => {
    const invalidReference = clone(reference);
    invalidReference.cases = invalidReference.cases.filter(
      (item, index) => item.seasonStartYear !== 2012 || index !== 0,
    );

    const result = validatePlayerRegressionReference(invalidReference, clubReference, 677);
    expect(result.errors.some((error) => error.includes("2012/13 sezonunda yalnızca 4"))).toBe(
      true,
    );
  });

  it("oyuncu–kulüp–sezon tekrarını ve yanlış kulüp adını reddeder", () => {
    const invalidReference = clone(reference);
    invalidReference.cases.push(clone(invalidReference.cases[0]));
    invalidReference.cases[1].canonicalClubName = "Yanlış Kulüp";

    const result = validatePlayerRegressionReference(invalidReference, clubReference, 677);
    expect(result.errors.some((error) => error.includes("tekrar eden kayıt"))).toBe(true);
    expect(result.errors.some((error) => error.includes("canonical kulüp adı"))).toBe(true);
  });
});
