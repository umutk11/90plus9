import { spawnSync } from "node:child_process";
import { access, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STAGING_DATABASE_NAME = "staging.duckdb";
const STAGING_MANIFEST_NAME = "manifest.json";

function printUsage() {
  console.log(`Kullanım:
  pnpm data:stage -- --version 677
  pnpm data:stage -- --version 677 --snapshot-dir /path/to/snapshot
  pnpm data:stage -- --version 677 --staging-dir /path/to/staging`);
}

function parseArguments(argv) {
  let snapshotDirectory;
  let stagingDirectory;
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    } else if (argument === "--help") {
      printUsage();
      process.exit(0);
    } else if (argument === "--snapshot-dir") {
      snapshotDirectory = argv[index + 1];
      index += 1;
    } else if (argument === "--staging-dir") {
      stagingDirectory = argv[index + 1];
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

  return { snapshotDirectory, stagingDirectory, version };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function csvRelation(filePath) {
  return `read_csv_auto(
    ${sqlLiteral(filePath)},
    header = true,
    delim = ',',
    quote = '"',
    escape = '"',
    encoding = 'utf-8',
    sample_size = -1,
    strict_mode = true,
    ignore_errors = false,
    null_padding = false
  )`;
}

function readPositiveUniqueIds(entries, key, label) {
  if (!Array.isArray(entries)) {
    throw new Error(`Dışlama dosyasında ${label} listesi bulunamadı.`);
  }

  const ids = entries.map((entry) => entry?.[key]);

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error(`Dışlama dosyasındaki ${label} kimlikleri pozitif tam sayı olmalıdır.`);
  }

  if (new Set(ids).size !== ids.length) {
    throw new Error(`Dışlama dosyasındaki ${label} kimlikleri tekrar ediyor.`);
  }

  return ids;
}

async function loadExclusions(filePath, version) {
  if (!(await fileExists(filePath))) {
    throw new Error(`Snapshot dışlama dosyası bulunamadı: ${filePath}`);
  }

  const exclusions = JSON.parse(await readFile(filePath, "utf8"));

  if (exclusions.schemaVersion !== 1 || exclusions.datasetVersion !== Number(version)) {
    throw new Error(`Dışlama dosyasının şema veya snapshot sürümü v${version} ile uyuşmuyor.`);
  }

  return {
    gameIds: readPositiveUniqueIds(exclusions.games, "sourceGameId", "maç"),
    playerIds: readPositiveUniqueIds(exclusions.players, "sourcePlayerId", "oyuncu"),
  };
}

function runDuckDb(databasePath, query, json = false) {
  const arguments_ = json ? ["-json", databasePath, "-c", query] : [databasePath, "-c", query];
  const result = spawnSync("duckdb", arguments_, {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
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

  if (!json) {
    return undefined;
  }

  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

function validateSourceSchema(repositoryRoot, snapshotDirectory, version) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(repositoryRoot, "scripts/data/validate-snapshot.mjs"),
      "--version",
      version,
      "--snapshot-dir",
      snapshotDirectory,
    ],
    { stdio: "inherit" },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error("Kaynak şema doğrulaması başarısız olduğu için staging üretilmedi.");
  }
}

function buildStagingSql(sources, exclusions) {
  const excludedGameIds = exclusions.gameIds.join(", ");
  const excludedPlayerIds = exclusions.playerIds.join(", ");
  const gameExclusionClause = excludedGameIds ? `AND game_id NOT IN (${excludedGameIds})` : "";
  const appearancePlayerExclusionClause = excludedPlayerIds
    ? `WHERE a.player_id NOT IN (${excludedPlayerIds})`
    : "";
  const lineupPlayerExclusionClause = excludedPlayerIds
    ? `WHERE l.player_id NOT IN (${excludedPlayerIds})`
    : "";

  return `
PRAGMA threads = 4;

CREATE OR REPLACE MACRO normalize_name(value) AS
  trim(
    regexp_replace(
      replace(strip_accents(lower(nfc_normalize(value))), 'ı', 'i'),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );

CREATE TEMP TABLE scoped_games AS
SELECT *
FROM ${sources.games}
WHERE competition_id = 'TR1'
  AND season BETWEEN 2012 AND 2025
  ${gameExclusionClause};

CREATE TEMP TABLE scoped_appearances AS
SELECT a.*, g.season
FROM ${sources.appearances} a
JOIN scoped_games g USING (game_id)
${appearancePlayerExclusionClause};

CREATE TEMP TABLE scoped_lineups AS
SELECT l.*, g.season
FROM ${sources.lineups} l
JOIN scoped_games g USING (game_id)
${lineupPlayerExclusionClause};

CREATE TEMP TABLE evidence_players AS
SELECT DISTINCT player_id FROM scoped_appearances
UNION
SELECT DISTINCT player_id FROM scoped_lineups;

CREATE TEMP TABLE evidence_clubs AS
SELECT DISTINCT home_club_id AS club_id FROM scoped_games
UNION
SELECT DISTINCT away_club_id AS club_id FROM scoped_games;

CREATE TABLE stg_seasons AS
SELECT
  CAST(season AS INTEGER) AS start_year,
  CAST(season + 1 AS INTEGER) AS end_year,
  CAST(season AS VARCHAR) || '/' || right(CAST(season + 1 AS VARCHAR), 2) AS label
FROM scoped_games
GROUP BY season
ORDER BY season;

CREATE TABLE stg_countries AS
SELECT
  CAST(country_id AS INTEGER) AS source_country_id,
  country_code AS source_country_code,
  country_name AS source_name,
  country_name AS display_name,
  confederation AS raw_confederation,
  url AS source_url
FROM ${sources.countries}
ORDER BY country_id;

CREATE TABLE stg_clubs AS
SELECT
  CAST(c.club_id AS INTEGER) AS source_club_id,
  c.name AS source_name,
  c.name AS canonical_name,
  c.name AS display_name,
  normalize_name(c.name) AS normalized_name,
  c.url AS source_url,
  false AS identity_reviewed
FROM ${sources.clubs} c
JOIN evidence_clubs e USING (club_id)
ORDER BY c.club_id;

CREATE TABLE stg_players AS
SELECT
  CAST(p.player_id AS INTEGER) AS source_player_id,
  p.name AS display_name,
  normalize_name(p.name) AS normalized_name,
  p.first_name,
  p.last_name,
  CAST(p.date_of_birth AS DATE) AS date_of_birth,
  p.country_of_birth AS raw_country_of_birth,
  p.country_of_citizenship AS raw_citizenship,
  CASE p.position
    WHEN 'Goalkeeper' THEN 'gk'
    WHEN 'Defender' THEN 'def'
    WHEN 'Midfield' THEN 'mid'
    WHEN 'Attack' THEN 'fwd'
    WHEN 'Missing' THEN NULL
    ELSE NULL
  END AS position_group,
  p.position AS raw_position,
  p.sub_position AS raw_sub_position,
  p.foot AS raw_foot,
  CASE p.foot
    WHEN 'left' THEN 'left'
    WHEN 'right' THEN 'right'
    WHEN 'both' THEN 'both'
    ELSE NULL
  END AS preferred_foot,
  CAST(p.height_in_cm AS INTEGER) AS height_cm,
  p.url AS source_url,
  true AS is_active_for_game,
  'approved' AS review_status
FROM ${sources.players} p
JOIN evidence_players e USING (player_id)
ORDER BY p.player_id;

CREATE TABLE stg_matches AS
SELECT
  CAST(game_id AS INTEGER) AS source_game_id,
  competition_id AS source_competition_id,
  CAST(season AS INTEGER) AS season_start_year,
  date AS match_date,
  CAST(home_club_id AS INTEGER) AS home_source_club_id,
  CAST(away_club_id AS INTEGER) AS away_source_club_id,
  CAST(home_club_goals AS INTEGER) AS home_score,
  CAST(away_club_goals AS INTEGER) AS away_score,
  'played' AS match_status,
  'player_evidence' AS status_source,
  true AS is_player_evidence_allowed,
  url AS source_url
FROM scoped_games
ORDER BY date, game_id;

CREATE TABLE stg_player_match_evidence AS
SELECT
  appearance_id AS source_record_id,
  CAST(game_id AS INTEGER) AS source_game_id,
  CAST(player_id AS INTEGER) AS source_player_id,
  CAST(player_club_id AS INTEGER) AS source_club_id,
  date AS evidence_date,
  'appearance' AS evidence_type,
  CAST(minutes_played AS INTEGER) AS minutes_played
FROM scoped_appearances
UNION ALL
SELECT
  game_lineups_id AS source_record_id,
  CAST(game_id AS INTEGER) AS source_game_id,
  CAST(player_id AS INTEGER) AS source_player_id,
  CAST(club_id AS INTEGER) AS source_club_id,
  date AS evidence_date,
  CASE type
    WHEN 'starting_lineup' THEN 'starting_lineup'
    WHEN 'substitutes' THEN 'substitute'
  END AS evidence_type,
  NULL::INTEGER AS minutes_played
FROM scoped_lineups
ORDER BY source_game_id, source_player_id, evidence_type;

CREATE TABLE stg_player_club_seasons AS
SELECT
  e.source_player_id,
  e.source_club_id,
  m.season_start_year,
  bool_or(e.evidence_type = 'appearance') AS has_appearance,
  bool_or(e.evidence_type = 'starting_lineup') AS has_start,
  bool_or(e.evidence_type = 'substitute') AS has_bench,
  min(e.evidence_date) AS first_seen_date,
  max(e.evidence_date) AS last_seen_date,
  CAST(count(*) FILTER (WHERE e.evidence_type = 'appearance') AS INTEGER) AS appearance_count,
  CAST(count(*) FILTER (WHERE e.evidence_type IN ('starting_lineup', 'substitute')) AS INTEGER)
    AS lineup_count,
  CAST(count(*) AS INTEGER) AS evidence_count,
  CASE
    WHEN bool_or(e.evidence_type = 'appearance') THEN 'appearance'
    ELSE 'lineup'
  END AS evidence_level,
  true AS is_accepted_for_game,
  'approved' AS review_status
FROM stg_player_match_evidence e
JOIN stg_matches m USING (source_game_id)
GROUP BY e.source_player_id, e.source_club_id, m.season_start_year
ORDER BY e.source_player_id, e.source_club_id, m.season_start_year;

CREATE TABLE stg_club_seasons AS
SELECT DISTINCT source_club_id, season_start_year
FROM (
  SELECT home_source_club_id AS source_club_id, season_start_year FROM stg_matches
  UNION ALL
  SELECT away_source_club_id AS source_club_id, season_start_year FROM stg_matches
)
ORDER BY source_club_id, season_start_year;

CHECKPOINT;
`;
}

function buildSummaryQuery() {
  return `
SELECT
  (SELECT COUNT(*) FROM stg_seasons) AS seasons,
  (SELECT COUNT(*) FROM stg_countries) AS countries,
  (SELECT COUNT(*) FROM stg_clubs) AS clubs,
  (SELECT COUNT(*) FROM stg_players) AS players,
  (SELECT COUNT(*) FROM stg_players WHERE position_group IS NULL) AS "playersMissingPositionGroup",
  (SELECT COUNT(*) FROM stg_matches) AS matches,
  (SELECT COUNT(*) FROM stg_player_match_evidence WHERE evidence_type = 'appearance')
    AS "appearanceRows",
  (SELECT COUNT(*) FROM stg_player_match_evidence WHERE evidence_type IN ('starting_lineup', 'substitute'))
    AS "lineupRows",
  (SELECT COUNT(*) FROM stg_player_match_evidence) AS "playerMatchEvidenceRows",
  (SELECT COUNT(*) FROM stg_player_club_seasons) AS "playerClubSeasonRelations",
  (SELECT COUNT(*) FROM stg_club_seasons) AS "clubSeasons";
`;
}

function buildQualityQuery(exclusions) {
  const excludedGameIds = exclusions.gameIds.join(", ");
  const excludedPlayerIds = exclusions.playerIds.join(", ");
  const excludedGamesPresent = excludedGameIds
    ? `(SELECT COUNT(*) FROM stg_matches WHERE source_game_id IN (${excludedGameIds}))`
    : "0";
  const excludedPlayersPresent = excludedPlayerIds
    ? `(SELECT COUNT(*) FROM stg_players WHERE source_player_id IN (${excludedPlayerIds}))`
    : "0";
  const excludedPlayerEvidencePresent = excludedPlayerIds
    ? `(SELECT COUNT(*) FROM stg_player_match_evidence WHERE source_player_id IN (${excludedPlayerIds}))`
    : "0";

  return `
SELECT
  (SELECT COUNT(*) - COUNT(DISTINCT source_game_id) FROM stg_matches) AS "duplicateMatches",
  (SELECT COUNT(*) - COUNT(DISTINCT source_player_id) FROM stg_players) AS "duplicatePlayers",
  (SELECT COUNT(*) - COUNT(DISTINCT source_club_id) FROM stg_clubs) AS "duplicateClubs",
  (SELECT COUNT(*)
    FROM (
      SELECT start_year, end_year, label FROM stg_seasons
      UNION ALL
      SELECT 1999, 2000, '1999/00'
    ) seasons_to_check
    WHERE end_year <> start_year + 1
      OR label <> CAST(start_year AS VARCHAR) || '/' || right(CAST(end_year AS VARCHAR), 2))
    AS "seasonNormalizationFailures",
  (SELECT COUNT(*) FROM stg_matches
    WHERE source_game_id IS NULL OR season_start_year IS NULL OR match_date IS NULL
      OR home_source_club_id IS NULL OR away_source_club_id IS NULL) AS "matchCriticalNulls",
  (SELECT COUNT(*) FROM stg_matches
    WHERE source_competition_id <> 'TR1' OR season_start_year NOT BETWEEN 2012 AND 2025)
    AS "outOfScopeMatches",
  (SELECT COUNT(*) FROM stg_matches
    WHERE year(match_date) NOT IN (season_start_year, season_start_year + 1))
    AS "matchSeasonDateMismatches",
  (SELECT COUNT(*) FROM stg_matches
    WHERE home_source_club_id = away_source_club_id OR home_score IS NULL OR away_score IS NULL
      OR match_status <> 'played' OR is_player_evidence_allowed = false)
    AS "invalidPlayedMatches",
  (SELECT COUNT(*) FROM stg_matches m
    LEFT JOIN (SELECT DISTINCT source_game_id FROM stg_player_match_evidence) e
      USING (source_game_id)
    WHERE e.source_game_id IS NULL) AS "matchesWithoutEvidence",
  (SELECT COUNT(*) FROM stg_players
    WHERE source_player_id IS NULL OR display_name IS NULL OR normalized_name = '')
    AS "playerCriticalNulls",
  (SELECT COUNT(*) FROM stg_players WHERE height_cm IS NOT NULL AND height_cm NOT BETWEEN 50 AND 250)
    AS "invalidPlayerHeights",
  (SELECT COUNT(*) FROM stg_clubs
    WHERE source_club_id IS NULL OR display_name IS NULL OR normalized_name = '')
    AS "clubCriticalNulls",
  (SELECT COUNT(*) FROM stg_countries
    WHERE source_country_id IS NULL OR source_name IS NULL OR display_name IS NULL)
    AS "countryCriticalNulls",
  (SELECT COUNT(*) FROM stg_player_match_evidence e
    LEFT JOIN stg_matches m USING (source_game_id)
    WHERE m.source_game_id IS NULL OR e.source_club_id NOT IN (m.home_source_club_id, m.away_source_club_id))
    AS "evidenceMatchClubMismatches",
  (SELECT COUNT(*) FROM stg_player_match_evidence e
    LEFT JOIN stg_players p USING (source_player_id)
    WHERE p.source_player_id IS NULL) AS "evidenceMissingPlayers",
  (SELECT COUNT(*) FROM stg_player_match_evidence e
    LEFT JOIN stg_clubs c USING (source_club_id)
    WHERE c.source_club_id IS NULL) AS "evidenceMissingClubs",
  (SELECT COUNT(*) - COUNT(DISTINCT (source_game_id, source_player_id, evidence_type))
    FROM stg_player_match_evidence) AS "duplicateEvidenceRows",
  (SELECT COUNT(*) FROM stg_player_match_evidence e
    JOIN stg_matches m USING (source_game_id)
    WHERE e.evidence_date <> m.match_date) AS "evidenceDateMismatches",
  (SELECT COUNT(*) FROM stg_player_match_evidence
    WHERE evidence_type IS NULL OR evidence_type NOT IN ('appearance', 'starting_lineup', 'substitute'))
    AS "unknownEvidenceTypes",
  (SELECT COUNT(*) FROM stg_player_match_evidence
    WHERE minutes_played IS NOT NULL AND minutes_played NOT BETWEEN 0 AND 130)
    AS "invalidEvidenceMinutes",
  (SELECT COUNT(*) FROM stg_players
    WHERE position_group IS NULL AND raw_position IS NOT NULL AND raw_position <> 'Missing')
    AS "unknownPositionGroups",
  (SELECT COUNT(*) FROM stg_players
    WHERE preferred_foot IS NULL AND raw_foot IS NOT NULL) AS "unknownPreferredFeet",
  (SELECT COUNT(*)
    FROM (
      VALUES
        ('İlkay Gündoğan', 'ilkay gundogan'),
        ('IŞIK', 'isik'),
        ('Jean-Pierre', 'jean pierre'),
        ('O’Connor', 'o connor')
    ) AS cases(source_name, expected_name)
    WHERE normalize_name(source_name) <> expected_name) AS "nameNormalizationFailures",
  (SELECT COUNT(*) - COUNT(DISTINCT (source_player_id, source_club_id, season_start_year))
    FROM stg_player_club_seasons) AS "duplicatePlayerClubSeasons",
  (SELECT COUNT(*) FROM stg_player_club_seasons r
    LEFT JOIN stg_players p USING (source_player_id)
    LEFT JOIN stg_clubs c USING (source_club_id)
    LEFT JOIN stg_seasons s ON s.start_year = r.season_start_year
    WHERE p.source_player_id IS NULL OR c.source_club_id IS NULL OR s.start_year IS NULL)
    AS "relationMissingEntities",
  (SELECT COUNT(*) FROM stg_player_club_seasons r
    LEFT JOIN stg_club_seasons cs USING (source_club_id, season_start_year)
    WHERE cs.source_club_id IS NULL) AS "relationClubSeasonMismatches",
  (SELECT COUNT(*) FROM stg_player_club_seasons
    WHERE evidence_count <> appearance_count + lineup_count OR evidence_count <= 0
      OR has_appearance <> (appearance_count > 0)
      OR (has_start OR has_bench) <> (lineup_count > 0)
      OR first_seen_date > last_seen_date
      OR evidence_level <> CASE WHEN has_appearance THEN 'appearance' ELSE 'lineup' END)
    AS "relationAggregateMismatches",
  (SELECT COUNT(*) FROM stg_club_seasons cs
    LEFT JOIN stg_clubs c USING (source_club_id)
    LEFT JOIN stg_seasons s ON s.start_year = cs.season_start_year
    WHERE c.source_club_id IS NULL OR s.start_year IS NULL)
    AS "clubSeasonMissingEntities",
  ${excludedGamesPresent} AS "excludedGamesPresent",
  ${excludedPlayersPresent} AS "excludedPlayersPresent",
  ${excludedPlayerEvidencePresent} AS "excludedPlayerEvidencePresent";
`;
}

function assertExpectedCounts(summary, expected) {
  const expectations = {
    appearanceRows: expected.appearanceRows,
    clubSeasons: expected.clubSeasons,
    clubs: expected.clubs,
    countries: expected.countries,
    lineupRows: expected.lineupRows,
    matches: expected.games,
    playerClubSeasonRelations: expected.playerClubSeasonRelations,
    playerMatchEvidenceRows: expected.playerMatchEvidenceRows,
    players: expected.players,
    playersMissingPositionGroup: expected.playersMissingPositionGroup,
    seasons: expected.seasons,
  };
  const mismatches = Object.entries(expectations)
    .filter(([key, value]) => summary[key] !== value)
    .map(([key, value]) => `${key}: beklenen ${value}, bulunan ${summary[key]}`);

  if (mismatches.length > 0) {
    throw new Error(`Staging regresyon sayıları uyuşmuyor:\n${mismatches.join("\n")}`);
  }
}

function assertQuality(quality) {
  const issues = Object.entries(quality).filter(([, count]) => count !== 0);

  if (issues.length > 0) {
    throw new Error(
      `Staging kalite kontrolü başarısız:\n${issues
        .map(([key, count]) => `${key}: ${count}`)
        .join("\n")}`,
    );
  }
}

async function main() {
  const {
    snapshotDirectory: requestedSnapshotDirectory,
    stagingDirectory: requestedStagingDirectory,
    version,
  } = parseArguments(process.argv.slice(2));
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const snapshotDirectory = path.resolve(
    requestedSnapshotDirectory ?? path.join(repositoryRoot, `data/raw/dcaribou-kaggle-v${version}`),
  );
  const stagingDirectory = path.resolve(
    requestedStagingDirectory ??
      path.join(repositoryRoot, `data/staging/dcaribou-kaggle-v${version}`),
  );
  const exclusionPath = path.join(
    repositoryRoot,
    `data/reference/exclusions/dcaribou-kaggle-v${version}.json`,
  );
  const snapshotMetadataPath = path.join(
    repositoryRoot,
    `data/reference/source-snapshots/dcaribou-kaggle-v${version}.json`,
  );

  if (!(await fileExists(snapshotDirectory))) {
    throw new Error(`Snapshot klasörü bulunamadı: ${snapshotDirectory}`);
  }

  if (!(await fileExists(snapshotMetadataPath))) {
    throw new Error(`Snapshot metadata dosyası bulunamadı: ${snapshotMetadataPath}`);
  }

  validateSourceSchema(repositoryRoot, snapshotDirectory, version);

  const exclusions = await loadExclusions(exclusionPath, version);
  const snapshotMetadata = JSON.parse(await readFile(snapshotMetadataPath, "utf8"));
  const expected = snapshotMetadata.applicationImportScope;

  if (!expected) {
    throw new Error(`Snapshot metadata içinde applicationImportScope bulunamadı.`);
  }

  const sources = {
    appearances: csvRelation(path.join(snapshotDirectory, "appearances.csv")),
    clubs: csvRelation(path.join(snapshotDirectory, "clubs.csv")),
    countries: csvRelation(path.join(snapshotDirectory, "countries.csv")),
    games: csvRelation(path.join(snapshotDirectory, "games.csv")),
    lineups: csvRelation(path.join(snapshotDirectory, "game_lineups.csv")),
    players: csvRelation(path.join(snapshotDirectory, "players.csv")),
  };

  await mkdir(stagingDirectory, { recursive: true });

  const databasePath = path.join(stagingDirectory, STAGING_DATABASE_NAME);
  const temporaryDatabasePath = `${databasePath}.building`;
  const manifestPath = path.join(stagingDirectory, STAGING_MANIFEST_NAME);
  const temporaryManifestPath = `${manifestPath}.building`;

  for (const temporaryPath of [temporaryDatabasePath, temporaryManifestPath]) {
    if (await fileExists(temporaryPath)) {
      await unlink(temporaryPath);
    }
  }

  console.log(`Staging hazırlanıyor: dcaribou Kaggle v${version}`);
  runDuckDb(temporaryDatabasePath, buildStagingSql(sources, exclusions));

  const [summary] = runDuckDb(temporaryDatabasePath, buildSummaryQuery(), true);
  const [quality] = runDuckDb(temporaryDatabasePath, buildQualityQuery(exclusions), true);

  assertExpectedCounts(summary, expected);
  assertQuality(quality);

  const manifest = {
    schemaVersion: 1,
    snapshotVersion: Number(version),
    createdAt: new Date().toISOString(),
    status: "passed",
    sourceDirectory: path.relative(repositoryRoot, snapshotDirectory),
    database: STAGING_DATABASE_NAME,
    exclusions: {
      file: path.relative(repositoryRoot, exclusionPath),
      games: exclusions.gameIds.length,
      players: exclusions.playerIds.length,
    },
    summary,
    quality,
    knownLimitations: [
      "2012/13 sezonunda lineup kanıtı yoktur; yalnızca appearance kullanılır.",
      "Canonical Türkçe kulüp ve ülke adları manuel referans aşamasında uygulanacaktır.",
    ],
  };

  await writeFile(temporaryManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(temporaryDatabasePath, databasePath);
  await rename(temporaryManifestPath, manifestPath);

  console.log(`Sezon: ${summary.seasons}`);
  console.log(`Kulüp: ${summary.clubs}`);
  console.log(`Oyuncu: ${summary.players}`);
  console.log(`Maç: ${summary.matches}`);
  console.log(`Kanıt: ${summary.playerMatchEvidenceRows}`);
  console.log(`Oyuncu–kulüp–sezon ilişkisi: ${summary.playerClubSeasonRelations}`);
  console.log(`Kalite sorunu: 0`);
  console.log(`Staging veritabanı: ${databasePath}`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
