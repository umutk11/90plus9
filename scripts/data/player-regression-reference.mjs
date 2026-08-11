import { readFile } from "node:fs/promises";
import path from "node:path";

const FIRST_SEASON = 2012;
const LAST_SEASON = 2025;
const POSITION_GROUPS = new Set(["gk", "def", "mid", "fwd"]);

function isValidDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function validatePlayerRegressionReference(reference, clubReference, version) {
  const errors = [];
  const cases = Array.isArray(reference.cases) ? reference.cases : [];

  if (reference.schemaVersion !== 1) {
    errors.push("Oyuncu regresyon referansı: schemaVersion 1 olmalıdır.");
  }
  if (reference.datasetVersion !== Number(version)) {
    errors.push(`Oyuncu regresyon referansı: datasetVersion v${version} ile uyuşmuyor.`);
  }
  if (reference.competitionId !== "TR1" || reference.competitionName !== "Süper Lig") {
    errors.push("Oyuncu regresyon referansı: yarışma TR1 / Süper Lig olmalıdır.");
  }
  if (reference.seasonStartYear !== FIRST_SEASON || reference.seasonEndYear !== LAST_SEASON) {
    errors.push("Oyuncu regresyon referansı: sezon kapsamı 2012/13–2025/26 olmalıdır.");
  }
  if (reference.minimumCasesPerSeason !== 5) {
    errors.push("Oyuncu regresyon referansı: sezon başına alt sınır 5 olmalıdır.");
  }
  if (reference.reviewStatus !== "approved") {
    errors.push("Oyuncu regresyon referansı: kullanıcı onayından sonra approved olmalıdır.");
  }
  if (!isValidDate(reference.reviewedAt) || !reference.reviewedBy?.trim()) {
    errors.push("Oyuncu regresyon referansı: reviewedAt ve reviewedBy zorunludur.");
  }
  if (!Array.isArray(reference.cases)) {
    return { errors: [...errors, "Oyuncu regresyon referansı: cases listesi bulunamadı."] };
  }

  const clubsBySourceId = new Map(
    (clubReference.clubs ?? []).map((club) => [club.sourceClubId, club]),
  );
  const keys = new Set();
  const countsBySeason = new Map();
  const positionCounts = new Map([...POSITION_GROUPS].map((position) => [position, 0]));
  let bigFourCases = 0;
  let nonIstanbulCases = 0;
  let foreignCases = 0;

  for (const item of cases) {
    const label = `${item.seasonStartYear}/${String(item.seasonStartYear + 1).slice(-2)} ${item.expectedPlayerName ?? "bilinmeyen oyuncu"}`;
    if (
      !Number.isSafeInteger(item.seasonStartYear) ||
      item.seasonStartYear < FIRST_SEASON ||
      item.seasonStartYear > LAST_SEASON
    ) {
      errors.push(`Oyuncu regresyon referansı: kapsam dışı sezon: ${item.seasonStartYear}`);
    }
    if (!Number.isSafeInteger(item.sourcePlayerId) || item.sourcePlayerId <= 0) {
      errors.push(`Oyuncu regresyon referansı: ${label} sourcePlayerId geçersiz.`);
    }
    if (!item.expectedPlayerName?.trim()) {
      errors.push(`Oyuncu regresyon referansı: ${label} oyuncu adı eksik.`);
    }
    if (!POSITION_GROUPS.has(item.positionGroup)) {
      errors.push(`Oyuncu regresyon referansı: ${label} mevki grubu geçersiz.`);
    } else {
      positionCounts.set(item.positionGroup, positionCounts.get(item.positionGroup) + 1);
    }
    if (typeof item.isForeignCitizen !== "boolean") {
      errors.push(`Oyuncu regresyon referansı: ${label} yabancı oyuncu işareti eksik.`);
    } else if (item.isForeignCitizen) {
      foreignCases += 1;
    }

    const club = clubsBySourceId.get(item.sourceClubId);
    if (!club) {
      errors.push(
        `Oyuncu regresyon referansı: ${label} bilinmeyen sourceClubId ${item.sourceClubId}.`,
      );
    } else {
      if (club.proposedName !== item.canonicalClubName) {
        errors.push(`Oyuncu regresyon referansı: ${label} canonical kulüp adı uyuşmuyor.`);
      }
      bigFourCases += club.isBigFour ? 1 : 0;
      nonIstanbulCases += club.isIstanbul === false ? 1 : 0;
    }

    const key = `${item.seasonStartYear}:${item.sourcePlayerId}:${item.sourceClubId}`;
    if (keys.has(key)) {
      errors.push(`Oyuncu regresyon referansı: tekrar eden kayıt ${key}.`);
    }
    keys.add(key);
    countsBySeason.set(item.seasonStartYear, (countsBySeason.get(item.seasonStartYear) ?? 0) + 1);
  }

  for (let year = FIRST_SEASON; year <= LAST_SEASON; year += 1) {
    const count = countsBySeason.get(year) ?? 0;
    if (count < reference.minimumCasesPerSeason) {
      errors.push(
        `Oyuncu regresyon referansı: ${year}/${String(year + 1).slice(-2)} sezonunda yalnızca ${count} kayıt var.`,
      );
    }
  }
  for (const [position, count] of positionCounts) {
    if (count < 10) {
      errors.push(`Oyuncu regresyon referansı: ${position} için en az 10, bulunan ${count} örnek.`);
    }
  }
  if (bigFourCases === 0 || nonIstanbulCases === 0 || foreignCases === 0) {
    errors.push(
      "Oyuncu regresyon referansı: Dört Büyük, İstanbul dışı ve yabancı oyuncu örnekleri zorunludur.",
    );
  }
  if (clubReference.reviewStatus !== "approved") {
    errors.push("Oyuncu regresyon referansı: bağlı kulüp kimlik referansı onaylı değil.");
  }

  return {
    errors,
    summary: {
      bigFourCases,
      cases: cases.length,
      foreignCases,
      nonIstanbulCases,
      positionCounts: Object.fromEntries(positionCounts),
    },
  };
}

export async function loadPlayerRegressionReference(repositoryRoot, version) {
  const referencePath = path.join(
    repositoryRoot,
    `data/reference/player-regressions/dcaribou-kaggle-v${version}.json`,
  );
  const clubReferencePath = path.join(
    repositoryRoot,
    `data/reference/club-identities/dcaribou-kaggle-v${version}.json`,
  );
  const [reference, clubReference] = await Promise.all([
    readFile(referencePath, "utf8").then(JSON.parse),
    readFile(clubReferencePath, "utf8").then(JSON.parse),
  ]);
  const validation = validatePlayerRegressionReference(reference, clubReference, version);
  if (validation.errors.length > 0) {
    throw new Error(`Oyuncu regresyon referansı geçersiz:\n${validation.errors.join("\n")}`);
  }
  return { playerRegressionReference: reference, referencePath, validation };
}

export async function verifyPlayerRegressionReferenceInDatabase(
  client,
  reference,
  datasetVersionId,
) {
  const result = await client.query(
    `SELECT
      p.source_player_id,
      p.display_name,
      c.source_club_id,
      c.display_name AS club_name,
      s.start_year,
      p.position_group,
      pcs.is_accepted_for_game
    FROM player_club_seasons pcs
    JOIN players p ON p.id = pcs.player_id
    JOIN clubs c ON c.id = pcs.club_id
    JOIN seasons s ON s.id = pcs.season_id
    WHERE pcs.dataset_version_id = $1
      AND p.source_player_id = ANY($2::integer[])
      AND s.start_year BETWEEN $3 AND $4`,
    [
      datasetVersionId,
      [...new Set(reference.cases.map((item) => item.sourcePlayerId))],
      reference.seasonStartYear,
      reference.seasonEndYear,
    ],
  );
  const rowsByKey = new Map(
    result.rows.map((row) => [
      `${row.start_year}:${row.source_player_id}:${row.source_club_id}`,
      row,
    ]),
  );
  const errors = [];

  for (const item of reference.cases) {
    const key = `${item.seasonStartYear}:${item.sourcePlayerId}:${item.sourceClubId}`;
    const row = rowsByKey.get(key);
    if (!row) {
      errors.push(
        `${item.seasonStartYear}: ${item.expectedPlayerName} – ${item.canonicalClubName} ilişkisi bulunamadı.`,
      );
      continue;
    }
    if (row.display_name !== item.expectedPlayerName) {
      errors.push(
        `${item.seasonStartYear}: sourcePlayerId ${item.sourcePlayerId} oyuncu adı uyuşmuyor.`,
      );
    }
    if (row.club_name !== item.canonicalClubName || row.position_group !== item.positionGroup) {
      errors.push(
        `${item.seasonStartYear}: ${item.expectedPlayerName} kulüp/mevki bilgisi uyuşmuyor.`,
      );
    }
    if (row.is_accepted_for_game !== true) {
      errors.push(`${item.seasonStartYear}: ${item.expectedPlayerName} ilişkisi oyunda pasif.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Oyuncu regresyon DB kalite kontrolü başarısız:\n${errors.join("\n")}`);
  }
  return reference.cases;
}
