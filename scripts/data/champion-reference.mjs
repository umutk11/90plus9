import { readFile } from "node:fs/promises";
import path from "node:path";

const FIRST_SEASON = 2012;
const LAST_SEASON = 2025;
const TFF_ARCHIVE_URL = "https://www.tff.org/default.aspx?pageID=545";
const TFF_SEASON_URL_PATTERN = /^https:\/\/www\.tff\.org\/default\.aspx\?pageID=\d+$/;

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function isValidDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function validateChampionReference(reference, clubReference, version) {
  const errors = [];
  const warnings = [];
  const expectedYears = Array.from(
    { length: LAST_SEASON - FIRST_SEASON + 1 },
    (_, index) => FIRST_SEASON + index,
  );

  if (reference.schemaVersion !== 1) {
    errors.push("Şampiyonluk referansı: schemaVersion 1 olmalıdır.");
  }
  if (reference.datasetVersion !== Number(version)) {
    errors.push(`Şampiyonluk referansı: datasetVersion v${version} ile uyuşmuyor.`);
  }
  if (reference.competitionId !== "TR1" || reference.competitionName !== "Süper Lig") {
    errors.push("Şampiyonluk referansı: yarışma TR1 / Süper Lig olmalıdır.");
  }
  if (reference.seasonStartYear !== FIRST_SEASON || reference.seasonEndYear !== LAST_SEASON) {
    errors.push("Şampiyonluk referansı: sezon kapsamı 2012/13–2025/26 olmalıdır.");
  }
  if (reference.reviewStatus !== "approved") {
    errors.push("Şampiyonluk referansı: bütün kayıtlar onaylandıktan sonra approved olmalıdır.");
  }
  if (!isValidDate(reference.reviewedAt) || !reference.reviewedBy?.trim()) {
    errors.push("Şampiyonluk referansı: reviewedAt ve reviewedBy zorunludur.");
  }
  if (!isValidDate(reference.sourceCheckedAt)) {
    errors.push("Şampiyonluk referansı: sourceCheckedAt geçerli bir tarih olmalıdır.");
  }
  if (reference.officialArchiveUrl !== TFF_ARCHIVE_URL) {
    errors.push("Şampiyonluk referansı: resmî TFF arşiv URL'si eksik veya geçersiz.");
  }
  if (!Array.isArray(reference.champions)) {
    return {
      errors: [...errors, "Şampiyonluk referansı: champions listesi bulunamadı."],
      expectedYears,
      warnings,
    };
  }

  const clubsBySourceId = new Map(
    (clubReference.clubs ?? []).map((club) => [club.sourceClubId, club]),
  );
  const duplicateYears = duplicateValues(
    reference.champions.map((champion) => champion.seasonStartYear),
  );
  const duplicateUrls = duplicateValues(reference.champions.map((champion) => champion.sourceUrl));
  const actualYears = new Set(reference.champions.map((champion) => champion.seasonStartYear));

  if (duplicateYears.length > 0) {
    errors.push(`Şampiyonluk referansı: tekrar eden sezonlar: ${duplicateYears.join(", ")}`);
  }
  if (duplicateUrls.length > 0) {
    errors.push(`Şampiyonluk referansı: tekrar eden sezon URL'leri: ${duplicateUrls.join(", ")}`);
  }
  if (reference.champions.length !== expectedYears.length) {
    errors.push(
      `Şampiyonluk referansı: beklenen ${expectedYears.length}, bulunan ${reference.champions.length} kayıt.`,
    );
  }

  for (const year of expectedYears) {
    if (!actualYears.has(year)) {
      errors.push(`Şampiyonluk referansı: ${year}/${String(year + 1).slice(-2)} sezonu eksik.`);
    }
  }

  for (const champion of reference.champions) {
    if (!expectedYears.includes(champion.seasonStartYear)) {
      errors.push(`Şampiyonluk referansı: kapsam dışı sezon: ${champion.seasonStartYear}`);
    }
    if (!Number.isSafeInteger(champion.sourceClubId) || champion.sourceClubId <= 0) {
      errors.push(`Şampiyonluk referansı: ${champion.seasonStartYear} sourceClubId geçersiz.`);
      continue;
    }

    const club = clubsBySourceId.get(champion.sourceClubId);
    if (!club) {
      errors.push(
        `Şampiyonluk referansı: ${champion.seasonStartYear} için bilinmeyen sourceClubId ${champion.sourceClubId}.`,
      );
    } else {
      if (club.reviewStatus !== "approved") {
        errors.push(
          `Şampiyonluk referansı: ${champion.seasonStartYear} kulüp kimliği onaylı değil.`,
        );
      }
      if (club.proposedName !== champion.canonicalClubName) {
        errors.push(
          `Şampiyonluk referansı: ${champion.seasonStartYear} canonical adı kulüp referansıyla uyuşmuyor.`,
        );
      }
    }

    if (!TFF_SEASON_URL_PATTERN.test(champion.sourceUrl ?? "")) {
      errors.push(
        `Şampiyonluk referansı: ${champion.seasonStartYear} için resmî HTTPS TFF sezon URL'si geçersiz.`,
      );
    }
  }

  if (clubReference.reviewStatus !== "approved") {
    errors.push("Şampiyonluk referansı: bağlı kulüp kimlik referansı onaylı değil.");
  }

  return { errors, expectedYears, warnings };
}

export async function loadChampionReference(repositoryRoot, version) {
  const championReferencePath = path.join(
    repositoryRoot,
    `data/reference/champions/super-lig-dcaribou-v${version}.json`,
  );
  const clubReferencePath = path.join(
    repositoryRoot,
    `data/reference/club-identities/dcaribou-kaggle-v${version}.json`,
  );
  const [championReference, clubReference] = await Promise.all([
    readFile(championReferencePath, "utf8").then(JSON.parse),
    readFile(clubReferencePath, "utf8").then(JSON.parse),
  ]);
  const validation = validateChampionReference(championReference, clubReference, version);

  if (validation.errors.length > 0) {
    throw new Error(`Şampiyonluk referansı geçersiz:\n${validation.errors.join("\n")}`);
  }

  return { championReference, championReferencePath, clubReference, validation };
}

export async function verifyChampionReferenceInDatabase(client, reference) {
  const result = await client.query(
    `SELECT
      s.start_year,
      c.source_club_id,
      c.display_name,
      cs.participated_in_super_lig,
      cs.championship_source_url,
      cs.championship_verified_at,
      cs.championship_verified_by
    FROM seasons s
    LEFT JOIN club_seasons cs ON cs.season_id = s.id AND cs.is_champion = true
    LEFT JOIN clubs c ON c.id = cs.club_id
    WHERE s.start_year BETWEEN $1 AND $2
    ORDER BY s.start_year`,
    [reference.seasonStartYear, reference.seasonEndYear],
  );
  const rowsByYear = new Map(result.rows.map((row) => [row.start_year, row]));
  const errors = [];

  for (const champion of reference.champions) {
    const row = rowsByYear.get(champion.seasonStartYear);
    if (!row?.source_club_id) {
      errors.push(`${champion.seasonStartYear}: şampiyon club_seasons kaydı bulunamadı.`);
      continue;
    }
    if (
      row.source_club_id !== champion.sourceClubId ||
      row.display_name !== champion.canonicalClubName
    ) {
      errors.push(`${champion.seasonStartYear}: şampiyon kulüp referansla uyuşmuyor.`);
    }
    if (row.participated_in_super_lig !== true) {
      errors.push(`${champion.seasonStartYear}: şampiyon kulüp sezon katılımcısı değil.`);
    }
    if (
      row.championship_source_url !== champion.sourceUrl ||
      !row.championship_verified_at ||
      row.championship_verified_by !== reference.reviewedBy
    ) {
      errors.push(`${champion.seasonStartYear}: şampiyonluk kaynak/denetim bilgisi eksik.`);
    }
  }

  if (result.rows.length !== reference.champions.length) {
    errors.push(
      `Şampiyonluk DB kontrolü: beklenen ${reference.champions.length}, bulunan ${result.rows.length} sezon.`,
    );
  }
  if (errors.length > 0) {
    throw new Error(`Şampiyonluk DB kalite kontrolü başarısız:\n${errors.join("\n")}`);
  }

  return result.rows;
}

export async function applyChampionReference(client, reference) {
  await client.query(
    `UPDATE club_seasons cs
      SET
        is_champion = false,
        championship_source_url = NULL,
        championship_verified_at = NULL,
        championship_verified_by = NULL
      FROM seasons s
      WHERE s.id = cs.season_id AND s.start_year BETWEEN $1 AND $2`,
    [reference.seasonStartYear, reference.seasonEndYear],
  );

  for (const champion of reference.champions) {
    const result = await client.query(
      `UPDATE club_seasons cs
        SET
          is_champion = true,
          championship_source_url = $3,
          championship_verified_at = $4,
          championship_verified_by = $5
        FROM clubs c, seasons s
        WHERE
          cs.club_id = c.id AND
          cs.season_id = s.id AND
          c.source_club_id = $1 AND
          s.start_year = $2 AND
          cs.participated_in_super_lig = true
        RETURNING cs.id`,
      [
        champion.sourceClubId,
        champion.seasonStartYear,
        champion.sourceUrl,
        reference.reviewedAt,
        reference.reviewedBy,
      ],
    );
    if (result.rowCount !== 1) {
      throw new Error(
        `${champion.seasonStartYear}/${String(champion.seasonStartYear + 1).slice(-2)} ${champion.canonicalClubName} için tek bir katılımcı club_seasons kaydı bulunamadı.`,
      );
    }
  }

  return verifyChampionReferenceInDatabase(client, reference);
}
