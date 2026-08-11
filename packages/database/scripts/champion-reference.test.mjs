import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { validateChampionReference } from "../../../scripts/data/champion-reference.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let championReference;
let clubReference;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

beforeAll(async () => {
  [championReference, clubReference] = await Promise.all([
    readFile(
      path.join(repositoryRoot, "data/reference/champions/super-lig-dcaribou-v677.json"),
      "utf8",
    ).then(JSON.parse),
    readFile(
      path.join(repositoryRoot, "data/reference/club-identities/dcaribou-kaggle-v677.json"),
      "utf8",
    ).then(JSON.parse),
  ]);
});

describe("Süper Lig şampiyonluk referansı", () => {
  it("14 sezonun tamamını onaylı kulüp ve TFF kaynaklarıyla kabul eder", () => {
    const result = validateChampionReference(championReference, clubReference, 677);

    expect(result.errors).toEqual([]);
    expect(championReference.champions).toHaveLength(14);
  });

  it("eksik veya tekrar eden sezonu reddeder", () => {
    const invalidReference = clone(championReference);
    invalidReference.champions[13].seasonStartYear = 2024;
    const result = validateChampionReference(invalidReference, clubReference, 677);

    expect(result.errors.some((error) => error.includes("tekrar eden sezonlar"))).toBe(true);
    expect(result.errors.some((error) => error.includes("2025/26 sezonu eksik"))).toBe(true);
  });

  it("canonical kulüp adı kaynak kimliğiyle uyuşmuyorsa reddeder", () => {
    const invalidReference = clone(championReference);
    invalidReference.champions[0].canonicalClubName = "Yanlış Kulüp";
    const result = validateChampionReference(invalidReference, clubReference, 677);

    expect(result.errors.some((error) => error.includes("canonical adı"))).toBe(true);
  });

  it("TFF dışındaki veya HTTP sezon kaynağını reddeder", () => {
    const invalidReference = clone(championReference);
    invalidReference.champions[0].sourceUrl = "http://example.com/season/2012";
    const result = validateChampionReference(invalidReference, clubReference, 677);

    expect(result.errors.some((error) => error.includes("HTTPS TFF sezon URL'si"))).toBe(true);
  });
});
