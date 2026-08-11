import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  applyChampionReference,
  loadChampionReference,
} from "../../../scripts/data/champion-reference.mjs";
import {
  assertCanonicalQuality,
  collectCanonicalQuality,
  syncCanonicalQualityIssues,
} from "./canonical-quality.mjs";

const { Client } = pg;
const IMPORT_BATCH_SIZE = 1_000;
const EVIDENCE_BATCH_SIZE = 2_500;

function printUsage() {
  console.log(`Kullanım:
  pnpm data:import -- --version 677 --activate
  pnpm data:import -- --version 677 --target test
  pnpm data:import -- --version 677 --staging-dir /path/to/staging

Hedefler:
  app   APP_DATABASE_URL bağlantısını kullanır (varsayılan)
  test  TEST_DATABASE_URL bağlantısını kullanır`);
}

function parseArguments(argv) {
  let activate = false;
  let stagingDirectory;
  let target = "app";
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    } else if (argument === "--activate") {
      activate = true;
    } else if (argument === "--help") {
      printUsage();
      process.exit(0);
    } else if (argument === "--staging-dir") {
      stagingDirectory = argv[index + 1];
      index += 1;
    } else if (argument === "--target") {
      target = argv[index + 1];
      index += 1;
    } else if (argument === "--version") {
      version = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Bilinmeyen parametre: ${argument}`);
    }
  }

  if (!version || !/^\d+$/.test(version)) {
    throw new Error("--version ile pozitif bir snapshot sürümü verilmelidir.");
  }
  if (!new Set(["app", "test"]).has(target)) {
    throw new Error("--target yalnızca app veya test olabilir.");
  }

  return { activate, stagingDirectory, target, version };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseEnvFile(contents) {
  const values = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

async function loadLocalEnvironment(repositoryRoot) {
  const envPath = path.join(repositoryRoot, ".env");
  if (!(await fileExists(envPath))) {
    return;
  }

  const values = parseEnvFile(await readFile(envPath, "utf8"));
  for (const [key, value] of Object.entries(values)) {
    process.env[key] ??= value;
  }
}

function normalizeName(value) {
  return value
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

function runDuckDbJson(databasePath, query) {
  const result = spawnSync("duckdb", ["-json", databasePath, "-c", query], {
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
  });

  if (result.error?.code === "ENOENT") {
    throw new Error("DuckDB bulunamadı. macOS için `brew install duckdb` çalıştırın.");
  }
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const details = result.stderr.trim().split("\n").slice(0, 20).join("\n");
    throw new Error(details || `DuckDB ${result.status} koduyla başarısız oldu.`);
  }

  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

function validateReferenceFiles(repositoryRoot, stagingDirectory, version) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(repositoryRoot, "scripts/data/validate-reference-mappings.mjs"),
      "--version",
      version,
      "--staging-dir",
      stagingDirectory,
    ],
    { stdio: "inherit" },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error("Referans eşleştirmeleri başarısız olduğu için canonical import başlatılmadı.");
  }
}

function quoteIdentifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error(`Güvensiz SQL identifier: ${value}`);
  }
  return `"${value}"`;
}

async function insertRows(
  client,
  table,
  columns,
  rows,
  { batchSize = IMPORT_BATCH_SIZE, onConflict = "" } = {},
) {
  if (rows.length === 0) {
    return;
  }

  const tableSql = quoteIdentifier(table);
  const columnsSql = columns.map(quoteIdentifier).join(", ");

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values = [];
    const placeholders = batch.map((row) => {
      if (row.length !== columns.length) {
        throw new Error(`${table}: sütun ve değer sayısı uyuşmuyor.`);
      }

      const rowPlaceholders = row.map((value) => {
        values.push(value === undefined ? null : value);
        return `$${values.length}`;
      });
      return `(${rowPlaceholders.join(", ")})`;
    });

    await client.query(
      `INSERT INTO ${tableSql} (${columnsSql}) VALUES ${placeholders.join(", ")} ${onConflict}`,
      values,
    );
  }
}

async function streamEvidence(databasePath, handleBatch) {
  const query = `
SELECT source_game_id, source_player_id, source_club_id, evidence_type, minutes_played
FROM stg_player_match_evidence
ORDER BY source_game_id, source_player_id, evidence_type;`;
  const child = spawn("duckdb", ["-csv", "-noheader", databasePath, "-c", query], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exitPromise = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  const reader = createInterface({ input: child.stdout, crlfDelay: Number.POSITIVE_INFINITY });
  let batch = [];
  let count = 0;
  let stderr = "";

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    for await (const line of reader) {
      if (!line) {
        continue;
      }
      const fields = line.split(",");
      if (fields.length !== 5) {
        throw new Error(`Evidence CSV satırı beklenen beş alanı içermiyor: ${line.slice(0, 120)}`);
      }

      const sourceGameId = Number(fields[0]);
      const sourcePlayerId = Number(fields[1]);
      const sourceClubId = Number(fields[2]);
      const minutesPlayed = new Set(["", "NULL"]).has(fields[4]) ? null : Number(fields[4]);
      if (
        !Number.isSafeInteger(sourceGameId) ||
        !Number.isSafeInteger(sourcePlayerId) ||
        !Number.isSafeInteger(sourceClubId) ||
        (minutesPlayed !== null && !Number.isSafeInteger(minutesPlayed))
      ) {
        throw new Error(`Evidence CSV sayısal alanı geçersiz: ${line.slice(0, 120)}`);
      }

      batch.push({
        evidenceType: fields[3],
        minutesPlayed,
        sourceClubId,
        sourceGameId,
        sourcePlayerId,
      });
      count += 1;

      if (batch.length >= EVIDENCE_BATCH_SIZE) {
        await handleBatch(batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await handleBatch(batch);
    }
  } catch (error) {
    child.kill();
    await exitPromise.catch(() => undefined);
    throw error;
  }

  const exitCode = await exitPromise;
  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `DuckDB evidence akışı ${exitCode} koduyla başarısız oldu.`);
  }

  return count;
}

const SOUTH_AMERICAN_CODES = new Set([
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "EC",
  "GF",
  "GY",
  "PE",
  "PY",
  "SR",
  "UY",
  "VE",
]);
const AFRICAN_ADDITIONAL_CODES = new Set([
  "AO",
  "BF",
  "BI",
  "BJ",
  "CD",
  "CF",
  "CG",
  "CI",
  "CM",
  "CV",
  "GA",
  "GM",
  "GN",
  "GQ",
  "GW",
  "KE",
  "LR",
  "ML",
  "MR",
  "RW",
  "SL",
  "SO",
  "ST",
  "TD",
  "TG",
  "TZ",
  "ZM",
  "ZW",
]);
const CONCACAF_ADDITIONAL_CODES = new Set(["AW", "CW", "GF", "GP", "HT", "MQ", "SR", "TT"]);

function inferConfederation(identity, sourceCountry) {
  const isoAlpha2 = identity.isoAlpha2;

  if (identity.origin === "historical") {
    return "UEFA";
  }
  if (AFRICAN_ADDITIONAL_CODES.has(isoAlpha2)) {
    return "CAF";
  }
  if (CONCACAF_ADDITIONAL_CODES.has(isoAlpha2)) {
    return "CONCACAF";
  }
  if (identity.origin === "player_value") {
    if (isoAlpha2 === "LI") {
      return "UEFA";
    }
    if (isoAlpha2 === "SY") {
      return "AFC";
    }
  }

  switch (sourceCountry?.rawConfederation) {
    case "afrika":
      return "CAF";
    case "amerika":
      return SOUTH_AMERICAN_CODES.has(isoAlpha2) ? "CONMEBOL" : "CONCACAF";
    case "asien":
      return new Set(["FJ", "NZ"]).has(isoAlpha2) ? "OFC" : "AFC";
    case "europa":
      return "UEFA";
    default:
      return null;
  }
}

function buildCountryRows(identityReference, mappingReference, stagingCountries) {
  const stagingById = new Map(
    stagingCountries.map((country) => [country.sourceCountryId, country]),
  );
  const alpha3ByTarget = new Map(
    mappingReference.overrides
      .filter((override) => override.isoAlpha3)
      .map((override) => [override.targetCanonicalName, override.isoAlpha3]),
  );

  return identityReference.countries.map((identity) => {
    const sourceCountry = stagingById.get(identity.sourceCountryId);
    return {
      canonicalName: identity.canonicalName,
      confederation: inferConfederation(identity, sourceCountry),
      displayName: identity.proposedDisplayName,
      isoAlpha2: identity.isoAlpha2,
      isoAlpha3: alpha3ByTarget.get(identity.canonicalName) ?? null,
      sourceCountryCode: sourceCountry?.sourceCountryCode ?? null,
      sourceCountryId: identity.sourceCountryId,
      sourceName: identity.sourceName ?? identity.canonicalName,
    };
  });
}

function buildCountryResolver(identityReference, mappingReference) {
  const identityByCanonicalName = new Map(
    identityReference.countries.map((identity) => [identity.canonicalName, identity]),
  );
  const sourceNames = new Set(
    identityReference.countries
      .filter((identity) => identity.origin === "source")
      .map((identity) => identity.sourceName),
  );
  const overrideBySourceName = new Map(
    mappingReference.overrides.map((override) => [override.sourceName, override]),
  );

  return (rawName) => {
    if (rawName === null || rawName === undefined || rawName === "") {
      return null;
    }
    const canonicalName = sourceNames.has(rawName)
      ? rawName
      : overrideBySourceName.get(rawName)?.targetCanonicalName;
    const identity = identityByCanonicalName.get(canonicalName);
    if (!identity) {
      throw new Error(`Ülke eşleştirmesi bulunamadı: ${rawName}`);
    }
    return identity;
  };
}

function mapRequired(map, key, label) {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`${label} eşleştirmesi bulunamadı: ${key}`);
  }
  return value;
}

async function verifyImportedDataset(client, datasetVersionId, expected, importedSourceIds) {
  const summaryResult = await client.query(
    `SELECT
        (SELECT COUNT(*)::integer FROM matches WHERE dataset_version_id = $1) AS matches,
        (SELECT COUNT(*)::integer FROM player_match_evidence WHERE dataset_version_id = $1) AS evidence,
        (SELECT COUNT(*)::integer FROM player_club_seasons WHERE dataset_version_id = $1)
          AS player_club_seasons,
        (SELECT COUNT(DISTINCT player_id)::integer FROM player_match_evidence WHERE dataset_version_id = $1)
          AS players,
        (SELECT COUNT(DISTINCT club_id)::integer FROM player_match_evidence WHERE dataset_version_id = $1)
          AS clubs,
        (SELECT COUNT(*)::integer FROM countries WHERE source_name = ANY($2::text[])) AS countries,
        (SELECT COUNT(*)::integer FROM club_seasons cs
          JOIN clubs c ON c.id = cs.club_id
          JOIN seasons s ON s.id = cs.season_id
          WHERE c.source_club_id = ANY($3::integer[]) AND s.start_year BETWEEN 2012 AND 2025)
          AS club_seasons,
        (SELECT COUNT(*)::integer FROM club_aliases ca
          JOIN clubs c ON c.id = ca.club_id
          WHERE c.source_club_id = ANY($3::integer[]) AND ca.alias = ANY($5::text[]))
          AS club_aliases,
        (SELECT COUNT(*)::integer FROM country_aliases
          WHERE alias = ANY($6::text[])) AS country_aliases,
        (SELECT COUNT(*)::integer FROM players
          WHERE source_player_id = ANY($4::integer[]) AND position_group IS NULL)
          AS players_missing_position`,
    [
      datasetVersionId,
      importedSourceIds.countrySourceNames,
      importedSourceIds.clubIds,
      importedSourceIds.playerIds,
      importedSourceIds.clubAliasNames,
      importedSourceIds.countryAliasNames,
    ],
  );
  const evidenceResult = await client.query(
    `SELECT
        COUNT(*) FILTER (WHERE evidence_type = 'appearance')::integer AS appearances,
        COUNT(*) FILTER (WHERE evidence_type IN ('starting_lineup', 'substitute'))::integer AS lineups
      FROM player_match_evidence
      WHERE dataset_version_id = $1`,
    [datasetVersionId],
  );
  const mappingResult = await client.query(
    `SELECT
        COUNT(*) FILTER (
          WHERE raw_citizenship IS NOT NULL AND citizenship_country_id IS NULL
        )::integer AS missing_citizenships,
        COUNT(*) FILTER (
          WHERE raw_country_of_birth IS NOT NULL AND country_of_birth_id IS NULL
        )::integer AS missing_birth_countries
      FROM players
      WHERE source_player_id = ANY($1::integer[])`,
    [importedSourceIds.playerIds],
  );
  const namingResult = await client.query(
    `SELECT
        (SELECT display_name FROM clubs WHERE source_club_id = 6890) AS basaksehir,
        (SELECT display_name FROM clubs WHERE source_club_id = 39722) AS erzurumspor,
        (SELECT display_name FROM countries WHERE source_name = 'DR Congo') AS dr_congo`,
  );

  const summary = summaryResult.rows[0];
  const evidence = evidenceResult.rows[0];
  const mappings = mappingResult.rows[0];
  const names = namingResult.rows[0];
  const expectations = {
    appearances: expected.appearanceRows,
    club_aliases: expected.clubs,
    club_seasons: expected.clubSeasons,
    clubs: expected.clubs,
    countries: importedSourceIds.countrySourceNames.length,
    country_aliases: importedSourceIds.countryAliasNames.length,
    evidence: expected.playerMatchEvidenceRows,
    lineups: expected.lineupRows,
    matches: expected.games,
    player_club_seasons: expected.playerClubSeasonRelations,
    players: expected.players,
    players_missing_position: expected.playersMissingPositionGroup,
  };
  const actual = { ...summary, ...evidence };
  const mismatches = Object.entries(expectations)
    .filter(([key, value]) => actual[key] !== value)
    .map(([key, value]) => `${key}: beklenen ${value}, bulunan ${actual[key]}`);

  if (mappings.missing_citizenships !== 0 || mappings.missing_birth_countries !== 0) {
    mismatches.push(
      `ülke ilişkileri: eksik vatandaşlık ${mappings.missing_citizenships}, eksik doğum ülkesi ${mappings.missing_birth_countries}`,
    );
  }
  if (
    names.basaksehir !== "Başakşehir" ||
    names.erzurumspor !== "Erzurumspor" ||
    names.dr_congo !== "Demokratik Kongo"
  ) {
    mismatches.push("Onaylı kulüp veya ülke adlarından biri canonical tablolara uygulanmadı.");
  }
  if (mismatches.length > 0) {
    throw new Error(`Canonical import regresyon kontrolü başarısız:\n${mismatches.join("\n")}`);
  }

  return { ...actual, ...mappings, ...names };
}

async function activateDataset(client, datasetVersionId) {
  await client.query(
    `UPDATE dataset_versions
      SET status = 'archived', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'active' AND id <> $1`,
    [datasetVersionId],
  );
  await client.query(
    `UPDATE dataset_versions
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [datasetVersionId],
  );
}

async function writeImportReport(
  repositoryRoot,
  { activate, datasetVersionId, target, verification, version },
) {
  const report = {
    schemaVersion: 1,
    snapshotVersion: Number(version),
    importedAt: new Date().toISOString(),
    target,
    status: activate ? "active" : "ready",
    datasetVersionId,
    summary: verification,
  };
  const reportDirectory = path.join(repositoryRoot, "reports/data-quality");
  const reportPath = path.join(
    reportDirectory,
    `dcaribou-kaggle-v${version}-canonical-import-${target}.json`,
  );
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  return { report, reportPath };
}

async function main() {
  const {
    activate,
    stagingDirectory: requestedStagingDirectory,
    target,
    version,
  } = parseArguments(process.argv.slice(2));
  const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(packageDirectory, "../../..");
  await loadLocalEnvironment(repositoryRoot);

  const environment = process.env.PLUS9_ENVIRONMENT ?? "local";
  if (
    !new Set(["local", "test"]).has(environment) &&
    process.env.CONFIRM_DATASET_IMPORT !== `dcaribou-v${version}`
  ) {
    throw new Error(
      `Local/test dışı import için CONFIRM_DATASET_IMPORT=dcaribou-v${version} gereklidir.`,
    );
  }

  const connectionString =
    target === "test" ? process.env.TEST_DATABASE_URL : process.env.APP_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      `${target === "test" ? "TEST_DATABASE_URL" : "APP_DATABASE_URL"} tanımlı değil.`,
    );
  }

  const stagingDirectory = path.resolve(
    requestedStagingDirectory ??
      path.join(repositoryRoot, `data/staging/dcaribou-kaggle-v${version}`),
  );
  const databasePath = path.join(stagingDirectory, "staging.duckdb");
  const manifestPath = path.join(stagingDirectory, "manifest.json");
  const snapshotMetadataPath = path.join(
    repositoryRoot,
    `data/reference/source-snapshots/dcaribou-kaggle-v${version}.json`,
  );
  const clubReferencePath = path.join(
    repositoryRoot,
    `data/reference/club-identities/dcaribou-kaggle-v${version}.json`,
  );
  const countryIdentityPath = path.join(
    repositoryRoot,
    `data/reference/country-identities/dcaribou-kaggle-v${version}.json`,
  );
  const countryMappingPath = path.join(
    repositoryRoot,
    `data/reference/country-mappings/dcaribou-kaggle-v${version}.json`,
  );

  for (const requiredPath of [
    databasePath,
    manifestPath,
    snapshotMetadataPath,
    clubReferencePath,
    countryIdentityPath,
    countryMappingPath,
  ]) {
    if (!(await fileExists(requiredPath))) {
      throw new Error(`Gerekli import dosyası bulunamadı: ${requiredPath}`);
    }
  }

  validateReferenceFiles(repositoryRoot, stagingDirectory, version);

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const snapshotMetadata = JSON.parse(await readFile(snapshotMetadataPath, "utf8"));
  const clubReference = JSON.parse(await readFile(clubReferencePath, "utf8"));
  const countryIdentityReference = JSON.parse(await readFile(countryIdentityPath, "utf8"));
  const countryMappingReference = JSON.parse(await readFile(countryMappingPath, "utf8"));
  const { championReference } = await loadChampionReference(repositoryRoot, version);
  const expected = snapshotMetadata.applicationImportScope;

  if (
    manifest.status !== "passed" ||
    Object.values(manifest.quality).some((count) => count !== 0)
  ) {
    throw new Error("Staging manifest kalite kontrolünden geçmemiş.");
  }
  if (
    clubReference.reviewStatus !== "approved" ||
    countryIdentityReference.reviewStatus !== "approved" ||
    countryMappingReference.reviewStatus !== "approved"
  ) {
    throw new Error("Canonical import için bütün kulüp ve ülke referansları onaylı olmalıdır.");
  }

  const stagingCountries = runDuckDbJson(
    databasePath,
    `SELECT
      source_country_id AS "sourceCountryId",
      source_country_code AS "sourceCountryCode",
      source_name AS "sourceName",
      raw_confederation AS "rawConfederation"
    FROM stg_countries ORDER BY source_country_id;`,
  );
  const stagingClubs = runDuckDbJson(
    databasePath,
    `SELECT source_club_id AS "sourceClubId", source_name AS "sourceName", source_url AS "sourceUrl"
    FROM stg_clubs ORDER BY source_club_id;`,
  );
  const stagingPlayers = runDuckDbJson(
    databasePath,
    `SELECT
      source_player_id AS "sourcePlayerId",
      display_name AS "displayName",
      normalized_name AS "normalizedName",
      first_name AS "firstName",
      last_name AS "lastName",
      date_of_birth AS "dateOfBirth",
      raw_country_of_birth AS "rawCountryOfBirth",
      raw_citizenship AS "rawCitizenship",
      position_group AS "positionGroup",
      raw_position AS "rawPosition",
      raw_sub_position AS "rawSubPosition",
      preferred_foot AS "preferredFoot",
      height_cm AS "heightCm",
      source_url AS "sourceUrl",
      is_active_for_game AS "isActiveForGame",
      review_status AS "reviewStatus"
    FROM stg_players ORDER BY source_player_id;`,
  );
  const stagingMatches = runDuckDbJson(
    databasePath,
    `SELECT
      source_game_id AS "sourceGameId",
      season_start_year AS "seasonStartYear",
      match_date AS "matchDate",
      home_source_club_id AS "homeSourceClubId",
      away_source_club_id AS "awaySourceClubId",
      home_score AS "homeScore",
      away_score AS "awayScore",
      match_status AS "matchStatus",
      status_source AS "statusSource",
      is_player_evidence_allowed AS "isPlayerEvidenceAllowed"
    FROM stg_matches ORDER BY source_game_id;`,
  );
  const stagingPlayerClubSeasons = runDuckDbJson(
    databasePath,
    `SELECT
      source_player_id AS "sourcePlayerId",
      source_club_id AS "sourceClubId",
      season_start_year AS "seasonStartYear",
      has_appearance AS "hasAppearance",
      has_start AS "hasStart",
      has_bench AS "hasBench",
      first_seen_date AS "firstSeenDate",
      last_seen_date AS "lastSeenDate",
      appearance_count AS "appearanceCount",
      lineup_count AS "lineupCount",
      evidence_count AS "evidenceCount",
      evidence_level AS "evidenceLevel",
      is_accepted_for_game AS "isAcceptedForGame",
      review_status AS "reviewStatus"
    FROM stg_player_club_seasons
    ORDER BY source_player_id, source_club_id, season_start_year;`,
  );
  const stagingClubSeasons = runDuckDbJson(
    databasePath,
    `SELECT source_club_id AS "sourceClubId", season_start_year AS "seasonStartYear"
    FROM stg_club_seasons ORDER BY source_club_id, season_start_year;`,
  );
  const stagingSeasons = runDuckDbJson(
    databasePath,
    `SELECT start_year AS "startYear", end_year AS "endYear", label FROM stg_seasons ORDER BY start_year;`,
  );

  const countryRows = buildCountryRows(
    countryIdentityReference,
    countryMappingReference,
    stagingCountries,
  );
  const resolveCountry = buildCountryResolver(countryIdentityReference, countryMappingReference);
  const clubReferenceById = new Map(clubReference.clubs.map((club) => [club.sourceClubId, club]));

  const client = new Client({
    application_name: `90plus9-import-v${version}`,
    connectionString,
  });
  let transactionStarted = false;
  const importStartedAt = new Date().toISOString();

  try {
    await client.connect();
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    transactionStarted = true;
    await client.query("SELECT pg_advisory_xact_lock($1, $2)", [90, Number(version)]);

    const requiredTables = await client.query(
      `SELECT to_regclass('public.country_aliases') AS country_aliases,
        to_regclass('public.dataset_versions') AS dataset_versions`,
    );
    if (!requiredTables.rows[0].country_aliases || !requiredTables.rows[0].dataset_versions) {
      throw new Error(
        "Canonical import migrationları uygulanmamış. Önce pnpm db:migrate çalıştırın.",
      );
    }

    const existingResult = await client.query(
      `SELECT id, status FROM dataset_versions WHERE source_name = $1 AND source_version = $2`,
      [snapshotMetadata.source.name, Number(version)],
    );

    const importedSourceIds = {
      clubAliasNames: stagingClubs.map((club) => club.sourceName),
      clubIds: stagingClubs.map((club) => club.sourceClubId),
      countryAliasNames: countryMappingReference.overrides.map((override) => override.sourceName),
      countrySourceNames: countryRows.map((country) => country.sourceName),
      playerIds: stagingPlayers.map((player) => player.sourcePlayerId),
    };

    if (existingResult.rowCount > 0) {
      const existing = existingResult.rows[0];
      if (!new Set(["ready", "active"]).has(existing.status)) {
        throw new Error(
          `v${version} daha önce ${existing.status} durumunda kaydedilmiş; otomatik üzerine yazılmayacak.`,
        );
      }

      const championRows = await applyChampionReference(client, championReference);
      const verification = {
        ...(await verifyImportedDataset(client, existing.id, expected, importedSourceIds)),
        champions: championRows.length,
      };
      const qualityReport = await collectCanonicalQuality(client, {
        championReference,
        datasetVersionId: existing.id,
        expected,
      });
      qualityReport.issueSummary = await syncCanonicalQualityIssues(client, qualityReport);
      assertCanonicalQuality(qualityReport);
      verification.quality_status = qualityReport.status;
      verification.quality_warnings = qualityReport.warnings.length;
      if (activate && existing.status !== "active") {
        await activateDataset(client, existing.id);
      }
      await client.query("COMMIT");
      transactionStarted = false;
      const { reportPath } = await writeImportReport(repositoryRoot, {
        activate: activate || existing.status === "active",
        datasetVersionId: existing.id,
        target,
        verification,
        version,
      });
      console.log(`v${version} zaten yüklü; mükerrer kayıt oluşturulmadı.`);
      console.log(`Durum: ${activate ? "active" : existing.status}`);
      console.log(`Maç: ${verification.matches}`);
      console.log(`Şampiyon: ${verification.champions}`);
      console.log(`Rapor: ${reportPath}`);
      return;
    }

    const datasetResult = await client.query(
      `INSERT INTO dataset_versions (
        source_name, source_version, distribution, source_updated_at, downloaded_at,
        checksum_sha256, import_started_at, status, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'validating', CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        snapshotMetadata.source.name,
        Number(version),
        `${snapshotMetadata.distribution.name}:${snapshotMetadata.distribution.dataset}`,
        snapshotMetadata.distribution.sourceUpdatedAt,
        snapshotMetadata.distribution.downloadedAt,
        snapshotMetadata.distribution.sha256,
        importStartedAt,
      ],
    );
    const datasetVersionId = datasetResult.rows[0].id;

    await insertRows(
      client,
      "seasons",
      ["start_year", "end_year", "label"],
      stagingSeasons.map((season) => [season.startYear, season.endYear, season.label]),
      {
        onConflict:
          'ON CONFLICT ("start_year") DO UPDATE SET "end_year" = EXCLUDED."end_year", "label" = EXCLUDED."label"',
      },
    );

    await insertRows(
      client,
      "countries",
      [
        "source_country_id",
        "source_country_code",
        "source_name",
        "display_name",
        "iso_alpha_2",
        "iso_alpha_3",
        "confederation",
        "continent",
      ],
      countryRows.map((country) => [
        country.sourceCountryId,
        country.sourceCountryCode,
        country.sourceName,
        country.displayName,
        country.isoAlpha2,
        country.isoAlpha3,
        country.confederation,
        null,
      ]),
      {
        onConflict: `ON CONFLICT ("source_name") DO UPDATE SET
          "source_country_id" = EXCLUDED."source_country_id",
          "source_country_code" = EXCLUDED."source_country_code",
          "display_name" = EXCLUDED."display_name",
          "iso_alpha_2" = EXCLUDED."iso_alpha_2",
          "iso_alpha_3" = EXCLUDED."iso_alpha_3",
          "confederation" = EXCLUDED."confederation",
          "continent" = EXCLUDED."continent"`,
      },
    );

    const countryIdResult = await client.query(
      `SELECT id, source_name FROM countries WHERE source_name = ANY($1::text[])`,
      [countryRows.map((country) => country.sourceName)],
    );
    const countryIdByCanonicalName = new Map(
      countryIdResult.rows.map((country) => [country.source_name, country.id]),
    );

    const identityByCanonicalName = new Map(
      countryIdentityReference.countries.map((identity) => [identity.canonicalName, identity]),
    );
    await insertRows(
      client,
      "country_aliases",
      ["country_id", "alias", "normalized_alias", "alias_type", "is_manual", "source_note"],
      countryMappingReference.overrides.map((override) => {
        const identity = mapRequired(
          identityByCanonicalName,
          override.targetCanonicalName,
          "Canonical ülke",
        );
        const countryId = mapRequired(
          countryIdByCanonicalName,
          identity.sourceName ?? identity.canonicalName,
          "PostgreSQL ülke",
        );
        const aliasType = override.resolution.startsWith("historical")
          ? "historical"
          : override.resolution === "alternative_alias"
            ? "manual"
            : "source";
        return [
          countryId,
          override.sourceName,
          normalizeName(override.sourceName),
          aliasType,
          aliasType !== "source",
          override.reviewNote ?? `dcaribou v${version} oyuncu ülke değeri`,
        ];
      }),
      {
        onConflict: `ON CONFLICT ("country_id", "normalized_alias") DO UPDATE SET
          "alias" = EXCLUDED."alias",
          "alias_type" = EXCLUDED."alias_type",
          "is_manual" = EXCLUDED."is_manual",
          "source_note" = EXCLUDED."source_note"`,
      },
    );

    await insertRows(
      client,
      "clubs",
      [
        "source_club_id",
        "canonical_name",
        "display_name",
        "normalized_name",
        "city",
        "is_istanbul",
        "is_non_istanbul",
        "is_big_four",
        "is_active_in_scope",
        "source_url",
        "identity_reviewed",
        "identity_reviewed_at",
        "identity_reviewed_by",
        "updated_at",
      ],
      stagingClubs.map((sourceClub) => {
        const club = mapRequired(clubReferenceById, sourceClub.sourceClubId, "Kulüp referansı");
        return [
          club.sourceClubId,
          club.proposedName,
          club.proposedName,
          normalizeName(club.proposedName),
          club.city,
          club.isIstanbul,
          !club.isIstanbul,
          club.isBigFour,
          true,
          sourceClub.sourceUrl,
          true,
          clubReference.reviewedAt,
          clubReference.reviewedBy,
          new Date().toISOString(),
        ];
      }),
      {
        onConflict: `ON CONFLICT ("source_club_id") DO UPDATE SET
          "canonical_name" = EXCLUDED."canonical_name",
          "display_name" = EXCLUDED."display_name",
          "normalized_name" = EXCLUDED."normalized_name",
          "city" = EXCLUDED."city",
          "is_istanbul" = EXCLUDED."is_istanbul",
          "is_non_istanbul" = EXCLUDED."is_non_istanbul",
          "is_big_four" = EXCLUDED."is_big_four",
          "is_active_in_scope" = EXCLUDED."is_active_in_scope",
          "source_url" = EXCLUDED."source_url",
          "identity_reviewed" = EXCLUDED."identity_reviewed",
          "identity_reviewed_at" = EXCLUDED."identity_reviewed_at",
          "identity_reviewed_by" = EXCLUDED."identity_reviewed_by",
          "updated_at" = EXCLUDED."updated_at"`,
      },
    );

    const clubIdResult = await client.query(
      `SELECT id, source_club_id FROM clubs WHERE source_club_id = ANY($1::integer[])`,
      [stagingClubs.map((club) => club.sourceClubId)],
    );
    const clubIdBySourceId = new Map(
      clubIdResult.rows.map((club) => [club.source_club_id, club.id]),
    );

    await insertRows(
      client,
      "club_aliases",
      ["club_id", "alias", "normalized_alias", "alias_type", "is_manual", "source_note"],
      stagingClubs.map((sourceClub) => [
        mapRequired(clubIdBySourceId, sourceClub.sourceClubId, "PostgreSQL kulüp"),
        sourceClub.sourceName,
        normalizeName(sourceClub.sourceName),
        "source",
        false,
        `dcaribou v${version} kaynak kulüp adı`,
      ]),
      {
        onConflict: `ON CONFLICT ("club_id", "normalized_alias") DO UPDATE SET
          "alias" = EXCLUDED."alias", "source_note" = EXCLUDED."source_note"`,
      },
    );

    const now = new Date().toISOString();
    await insertRows(
      client,
      "players",
      [
        "source_player_id",
        "display_name",
        "normalized_name",
        "first_name",
        "last_name",
        "date_of_birth",
        "country_of_birth_id",
        "citizenship_country_id",
        "raw_country_of_birth",
        "raw_citizenship",
        "position_group",
        "raw_position",
        "raw_sub_position",
        "preferred_foot",
        "height_cm",
        "source_url",
        "is_active_for_game",
        "review_status",
        "updated_at",
      ],
      stagingPlayers.map((player) => {
        const birthCountry = resolveCountry(player.rawCountryOfBirth);
        const citizenshipCountry = resolveCountry(player.rawCitizenship);
        return [
          player.sourcePlayerId,
          player.displayName,
          player.normalizedName,
          player.firstName,
          player.lastName,
          player.dateOfBirth,
          birthCountry
            ? mapRequired(
                countryIdByCanonicalName,
                birthCountry.sourceName ?? birthCountry.canonicalName,
                "Doğum ülkesi",
              )
            : null,
          citizenshipCountry
            ? mapRequired(
                countryIdByCanonicalName,
                citizenshipCountry.sourceName ?? citizenshipCountry.canonicalName,
                "Vatandaşlık ülkesi",
              )
            : null,
          player.rawCountryOfBirth,
          player.rawCitizenship,
          player.positionGroup,
          player.rawPosition,
          player.rawSubPosition,
          player.preferredFoot,
          player.heightCm,
          player.sourceUrl,
          player.isActiveForGame,
          player.reviewStatus,
          now,
        ];
      }),
      {
        batchSize: 750,
        onConflict: `ON CONFLICT ("source_player_id") DO UPDATE SET
          "display_name" = EXCLUDED."display_name",
          "normalized_name" = EXCLUDED."normalized_name",
          "first_name" = EXCLUDED."first_name",
          "last_name" = EXCLUDED."last_name",
          "date_of_birth" = EXCLUDED."date_of_birth",
          "country_of_birth_id" = EXCLUDED."country_of_birth_id",
          "citizenship_country_id" = EXCLUDED."citizenship_country_id",
          "raw_country_of_birth" = EXCLUDED."raw_country_of_birth",
          "raw_citizenship" = EXCLUDED."raw_citizenship",
          "position_group" = EXCLUDED."position_group",
          "raw_position" = EXCLUDED."raw_position",
          "raw_sub_position" = EXCLUDED."raw_sub_position",
          "preferred_foot" = EXCLUDED."preferred_foot",
          "height_cm" = EXCLUDED."height_cm",
          "source_url" = EXCLUDED."source_url",
          "is_active_for_game" = EXCLUDED."is_active_for_game",
          "review_status" = EXCLUDED."review_status",
          "updated_at" = EXCLUDED."updated_at"`,
      },
    );

    const playerIdResult = await client.query(
      `SELECT id, source_player_id FROM players WHERE source_player_id = ANY($1::integer[])`,
      [stagingPlayers.map((player) => player.sourcePlayerId)],
    );
    const playerIdBySourceId = new Map(
      playerIdResult.rows.map((player) => [player.source_player_id, player.id]),
    );
    const seasonIdResult = await client.query(
      `SELECT id, start_year FROM seasons WHERE start_year BETWEEN 2012 AND 2025`,
    );
    const seasonIdByStartYear = new Map(
      seasonIdResult.rows.map((season) => [season.start_year, season.id]),
    );

    await insertRows(
      client,
      "matches",
      [
        "source_game_id",
        "season_id",
        "dataset_version_id",
        "match_date",
        "home_club_id",
        "away_club_id",
        "home_score",
        "away_score",
        "status",
        "status_source",
        "is_player_evidence_allowed",
        "updated_at",
      ],
      stagingMatches.map((match) => [
        match.sourceGameId,
        mapRequired(seasonIdByStartYear, match.seasonStartYear, "Sezon"),
        datasetVersionId,
        match.matchDate,
        mapRequired(clubIdBySourceId, match.homeSourceClubId, "Ev sahibi kulüp"),
        mapRequired(clubIdBySourceId, match.awaySourceClubId, "Deplasman kulübü"),
        match.homeScore,
        match.awayScore,
        match.matchStatus,
        match.statusSource,
        match.isPlayerEvidenceAllowed,
        now,
      ]),
      { batchSize: 1_000 },
    );

    const matchIdResult = await client.query(
      `SELECT id, source_game_id FROM matches WHERE dataset_version_id = $1`,
      [datasetVersionId],
    );
    const matchIdBySourceId = new Map(
      matchIdResult.rows.map((match) => [match.source_game_id, match.id]),
    );

    const evidenceCount = await streamEvidence(databasePath, async (batch) => {
      await insertRows(
        client,
        "player_match_evidence",
        [
          "player_id",
          "match_id",
          "club_id",
          "dataset_version_id",
          "evidence_type",
          "minutes_played",
        ],
        batch.map((evidence) => [
          mapRequired(playerIdBySourceId, evidence.sourcePlayerId, "Evidence oyuncu"),
          mapRequired(matchIdBySourceId, evidence.sourceGameId, "Evidence maç"),
          mapRequired(clubIdBySourceId, evidence.sourceClubId, "Evidence kulüp"),
          datasetVersionId,
          evidence.evidenceType,
          evidence.minutesPlayed,
        ]),
        { batchSize: EVIDENCE_BATCH_SIZE },
      );
    });
    if (evidenceCount !== expected.playerMatchEvidenceRows) {
      throw new Error(
        `Evidence akış sayısı uyuşmuyor: beklenen ${expected.playerMatchEvidenceRows}, bulunan ${evidenceCount}`,
      );
    }

    await insertRows(
      client,
      "player_club_seasons",
      [
        "player_id",
        "club_id",
        "season_id",
        "dataset_version_id",
        "has_appearance",
        "has_start",
        "has_bench",
        "first_seen_date",
        "last_seen_date",
        "appearance_count",
        "lineup_count",
        "evidence_count",
        "evidence_level",
        "is_accepted_for_game",
        "review_status",
      ],
      stagingPlayerClubSeasons.map((relation) => [
        mapRequired(playerIdBySourceId, relation.sourcePlayerId, "İlişki oyuncu"),
        mapRequired(clubIdBySourceId, relation.sourceClubId, "İlişki kulüp"),
        mapRequired(seasonIdByStartYear, relation.seasonStartYear, "İlişki sezon"),
        datasetVersionId,
        relation.hasAppearance,
        relation.hasStart,
        relation.hasBench,
        relation.firstSeenDate,
        relation.lastSeenDate,
        relation.appearanceCount,
        relation.lineupCount,
        relation.evidenceCount,
        relation.evidenceLevel,
        relation.isAcceptedForGame,
        relation.reviewStatus,
      ]),
      { batchSize: 1_000 },
    );

    await insertRows(
      client,
      "club_seasons",
      ["club_id", "season_id", "participated_in_super_lig", "is_champion"],
      stagingClubSeasons.map((clubSeason) => [
        mapRequired(clubIdBySourceId, clubSeason.sourceClubId, "Kulüp-sezon kulüp"),
        mapRequired(seasonIdByStartYear, clubSeason.seasonStartYear, "Kulüp-sezon sezon"),
        true,
        false,
      ]),
      {
        onConflict: `ON CONFLICT ("club_id", "season_id") DO UPDATE SET
          "participated_in_super_lig" = true`,
      },
    );

    const championRows = await applyChampionReference(client, championReference);
    const verification = {
      ...(await verifyImportedDataset(client, datasetVersionId, expected, importedSourceIds)),
      champions: championRows.length,
    };
    const qualityReport = await collectCanonicalQuality(client, {
      championReference,
      datasetVersionId,
      expected,
    });
    qualityReport.issueSummary = await syncCanonicalQualityIssues(client, qualityReport);
    assertCanonicalQuality(qualityReport);
    verification.quality_status = qualityReport.status;
    verification.quality_warnings = qualityReport.warnings.length;

    await client.query(
      `UPDATE dataset_versions SET
        import_finished_at = CURRENT_TIMESTAMP,
        status = 'ready',
        player_count = $2,
        club_count = $3,
        match_count = $4,
        player_club_season_count = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [
        datasetVersionId,
        expected.players,
        expected.clubs,
        expected.games,
        expected.playerClubSeasonRelations,
      ],
    );

    if (activate) {
      await activateDataset(client, datasetVersionId);
    }

    await client.query("COMMIT");
    transactionStarted = false;

    const { report, reportPath } = await writeImportReport(repositoryRoot, {
      activate,
      datasetVersionId,
      target,
      verification,
      version,
    });

    console.log(`Canonical import tamamlandı: v${version}`);
    console.log(`Durum: ${report.status}`);
    console.log(`Ülke: ${verification.countries}`);
    console.log(`Kulüp: ${verification.clubs}`);
    console.log(`Oyuncu: ${verification.players}`);
    console.log(`Maç: ${verification.matches}`);
    console.log(`Kanıt: ${verification.evidence}`);
    console.log(`Oyuncu–kulüp–sezon: ${verification.player_club_seasons}`);
    console.log(`Şampiyon: ${verification.champions}`);
    console.log(`Rapor: ${reportPath}`);
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
