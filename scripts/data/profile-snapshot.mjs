import { spawnSync } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function printUsage() {
  console.log(`Kullanım:
  pnpm data:profile -- --version 677
  pnpm data:profile -- --version 677 --snapshot-dir /path/to/snapshot`);
}

function parseArguments(argv) {
  let snapshotDirectory;
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

  return { snapshotDirectory, version };
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

function runDuckDbJson(query) {
  const result = spawnSync("duckdb", ["-json", ":memory:", "-c", query], {
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
    const details = result.stderr.trim().split("\n").slice(0, 16).join("\n");
    throw new Error(details || `DuckDB ${result.status} koduyla başarısız oldu.`);
  }

  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

function percentage(total, missing) {
  if (total === 0) {
    return null;
  }

  return Number((((total - missing) / total) * 100).toFixed(2));
}

function buildSeasonQuery(sources) {
  return `
WITH
  scoped_games AS (
    SELECT *
    FROM ${sources.games}
    WHERE competition_id = 'TR1' AND season BETWEEN 2012 AND 2025
  ),
  scoped_appearances AS (
    SELECT
      a.*,
      g.season,
      g.home_club_id AS match_home_club_id,
      g.away_club_id AS match_away_club_id
    FROM ${sources.appearances} a
    JOIN scoped_games g USING (game_id)
  ),
  scoped_lineups AS (
    SELECT
      l.*,
      g.season,
      g.home_club_id AS match_home_club_id,
      g.away_club_id AS match_away_club_id
    FROM ${sources.lineups} l
    JOIN scoped_games g USING (game_id)
  ),
  game_quality AS (
    SELECT
      season,
      COUNT(*) AS game_rows,
      COUNT(*) - COUNT(DISTINCT game_id) AS duplicate_game_ids,
      COUNT(*) FILTER (
        WHERE game_id IS NULL OR date IS NULL OR home_club_id IS NULL OR away_club_id IS NULL
      ) AS missing_critical_fields,
      COUNT(*) FILTER (WHERE home_club_id = away_club_id) AS same_home_away_club,
      COUNT(*) FILTER (WHERE home_club_goals IS NULL OR away_club_goals IS NULL) AS missing_scores
    FROM scoped_games
    GROUP BY season
  ),
  appearance_quality AS (
    SELECT
      season,
      COUNT(*) AS appearance_rows,
      COUNT(DISTINCT game_id) AS appearance_games,
      COUNT(*) FILTER (WHERE player_id IS NULL) AS null_player_ids,
      COUNT(*) FILTER (WHERE player_club_id IS NULL) AS null_club_ids,
      COUNT(*) FILTER (
        WHERE player_club_id NOT IN (match_home_club_id, match_away_club_id)
      ) AS mismatched_clubs,
      COUNT(*) - COUNT(DISTINCT (game_id, player_id)) AS duplicate_player_games
    FROM scoped_appearances
    GROUP BY season
  ),
  lineup_quality AS (
    SELECT
      season,
      COUNT(*) AS lineup_rows,
      COUNT(DISTINCT game_id) AS lineup_games,
      COUNT(*) FILTER (WHERE player_id IS NULL) AS null_player_ids,
      COUNT(*) FILTER (WHERE club_id IS NULL) AS null_club_ids,
      COUNT(*) FILTER (
        WHERE club_id NOT IN (match_home_club_id, match_away_club_id)
      ) AS mismatched_clubs,
      COUNT(*) FILTER (WHERE type NOT IN ('starting_lineup', 'substitutes')) AS unknown_types,
      COUNT(*) - COUNT(DISTINCT (game_id, player_id, type)) AS duplicate_player_game_types
    FROM scoped_lineups
    GROUP BY season
  ),
  game_coverage AS (
    SELECT
      g.season,
      COUNT(*) FILTER (WHERE a.game_id IS NULL AND l.game_id IS NULL) AS no_evidence_games
    FROM scoped_games g
    LEFT JOIN (SELECT DISTINCT game_id FROM scoped_appearances) a USING (game_id)
    LEFT JOIN (SELECT DISTINCT game_id FROM scoped_lineups) l USING (game_id)
    GROUP BY g.season
  ),
  evidence_players AS (
    SELECT DISTINCT season, player_id FROM scoped_appearances
    UNION
    SELECT DISTINCT season, player_id FROM scoped_lineups
  ),
  player_profiles AS (SELECT * FROM ${sources.players}),
  player_quality AS (
    SELECT
      e.season,
      COUNT(*) AS player_ids,
      COUNT(*) FILTER (WHERE p.player_id IS NULL) AS missing_profiles,
      COUNT(*) FILTER (WHERE NULLIF(TRIM(p.name), '') IS NULL) AS missing_names,
      COUNT(*) FILTER (
        WHERE NULLIF(TRIM(p.country_of_citizenship), '') IS NULL
      ) AS missing_citizenship,
      COUNT(*) FILTER (
        WHERE NULLIF(TRIM(p.position), '') IS NULL OR LOWER(TRIM(p.position)) = 'missing'
      ) AS missing_positions,
      COUNT(*) FILTER (WHERE p.date_of_birth IS NULL) AS missing_dates_of_birth,
      COUNT(*) FILTER (WHERE NULLIF(TRIM(p.foot), '') IS NULL) AS missing_feet,
      COUNT(*) FILTER (WHERE p.height_in_cm IS NULL) AS missing_heights
    FROM evidence_players e
    LEFT JOIN player_profiles p USING (player_id)
    GROUP BY e.season
  ),
  evidence_clubs AS (
    SELECT DISTINCT season, home_club_id AS club_id FROM scoped_games
    UNION
    SELECT DISTINCT season, away_club_id AS club_id FROM scoped_games
  ),
  club_profiles AS (SELECT * FROM ${sources.clubs}),
  club_quality AS (
    SELECT
      e.season,
      COUNT(*) AS club_ids,
      COUNT(*) FILTER (WHERE c.club_id IS NULL) AS missing_profiles,
      COUNT(*) FILTER (WHERE NULLIF(TRIM(c.name), '') IS NULL) AS missing_names
    FROM evidence_clubs e
    LEFT JOIN club_profiles c USING (club_id)
    GROUP BY e.season
  ),
  player_club_seasons AS (
    SELECT DISTINCT season, player_id, player_club_id AS club_id FROM scoped_appearances
    UNION
    SELECT DISTINCT season, player_id, club_id FROM scoped_lineups
  ),
  relation_quality AS (
    SELECT season, COUNT(*) AS relation_rows
    FROM player_club_seasons
    GROUP BY season
  )
SELECT
  g.season,
  g.game_rows AS "gameRows",
  g.duplicate_game_ids AS "duplicateGameIds",
  g.missing_critical_fields AS "gamesMissingCriticalFields",
  g.same_home_away_club AS "sameHomeAwayClubGames",
  g.missing_scores AS "gamesMissingScores",
  COALESCE(a.appearance_rows, 0) AS "appearanceRows",
  COALESCE(a.appearance_games, 0) AS "appearanceGames",
  COALESCE(a.null_player_ids, 0) AS "appearancesMissingPlayerId",
  COALESCE(a.null_club_ids, 0) AS "appearancesMissingClubId",
  COALESCE(a.mismatched_clubs, 0) AS "appearanceClubMismatches",
  COALESCE(a.duplicate_player_games, 0) AS "duplicateAppearancePlayerGames",
  COALESCE(l.lineup_rows, 0) AS "lineupRows",
  COALESCE(l.lineup_games, 0) AS "lineupGames",
  COALESCE(l.null_player_ids, 0) AS "lineupsMissingPlayerId",
  COALESCE(l.null_club_ids, 0) AS "lineupsMissingClubId",
  COALESCE(l.mismatched_clubs, 0) AS "lineupClubMismatches",
  COALESCE(l.unknown_types, 0) AS "unknownLineupTypes",
  COALESCE(l.duplicate_player_game_types, 0) AS "duplicateLineupPlayerGameTypes",
  c.no_evidence_games AS "noEvidenceGames",
  p.player_ids AS "playerIds",
  p.missing_profiles AS "missingPlayerProfiles",
  p.missing_names AS "playersMissingName",
  p.missing_citizenship AS "playersMissingCitizenship",
  p.missing_positions AS "playersMissingPosition",
  p.missing_dates_of_birth AS "playersMissingDateOfBirth",
  p.missing_feet AS "playersMissingFoot",
  p.missing_heights AS "playersMissingHeight",
  clubs.club_ids AS "clubIds",
  clubs.missing_profiles AS "missingClubProfiles",
  clubs.missing_names AS "clubsMissingName",
  relations.relation_rows AS "playerClubSeasonRelations"
FROM game_quality g
JOIN game_coverage c USING (season)
JOIN player_quality p USING (season)
JOIN club_quality clubs USING (season)
JOIN relation_quality relations USING (season)
LEFT JOIN appearance_quality a USING (season)
LEFT JOIN lineup_quality l USING (season)
ORDER BY g.season;
`;
}

function buildSummaryQuery(sources) {
  return `
WITH
  scoped_games AS (
    SELECT * FROM ${sources.games}
    WHERE competition_id = 'TR1' AND season BETWEEN 2012 AND 2025
  ),
  scoped_appearances AS (
    SELECT a.*, g.season FROM ${sources.appearances} a JOIN scoped_games g USING (game_id)
  ),
  scoped_lineups AS (
    SELECT l.*, g.season FROM ${sources.lineups} l JOIN scoped_games g USING (game_id)
  ),
  evidence_game_ids AS (
    SELECT game_id FROM scoped_appearances
    UNION
    SELECT game_id FROM scoped_lineups
  ),
  evidence_players AS (
    SELECT player_id FROM scoped_appearances
    UNION
    SELECT player_id FROM scoped_lineups
  ),
  player_profiles AS (SELECT * FROM ${sources.players}),
  evidence_clubs AS (
    SELECT DISTINCT season, home_club_id AS club_id FROM scoped_games
    UNION
    SELECT DISTINCT season, away_club_id AS club_id FROM scoped_games
  ),
  club_profiles AS (SELECT * FROM ${sources.clubs}),
  player_club_seasons AS (
    SELECT DISTINCT season, player_id, player_club_id AS club_id FROM scoped_appearances
    UNION
    SELECT DISTINCT season, player_id, club_id FROM scoped_lineups
  )
SELECT
  (SELECT COUNT(DISTINCT season) FROM scoped_games) AS "seasons",
  (SELECT COUNT(*) FROM scoped_games) AS "games",
  (SELECT COUNT(*) FROM evidence_game_ids) AS "evidenceBackedGames",
  (SELECT COUNT(*) FROM scoped_appearances) AS "appearanceRows",
  (SELECT COUNT(*) FROM scoped_lineups) AS "lineupRows",
  (SELECT COUNT(DISTINCT club_id) FROM evidence_clubs) AS "clubs",
  (SELECT COUNT(*) FROM evidence_clubs) AS "clubSeasons",
  (SELECT COUNT(*) FROM evidence_players) AS "players",
  (SELECT COUNT(*) FROM player_club_seasons) AS "playerClubSeasonRelations",
  (SELECT COUNT(*) FROM evidence_players e LEFT JOIN player_profiles p USING (player_id)
    WHERE p.player_id IS NULL) AS "missingPlayerProfiles",
  (SELECT COUNT(*) FROM evidence_players e LEFT JOIN player_profiles p USING (player_id)
    WHERE NULLIF(TRIM(p.name), '') IS NULL) AS "playersMissingName",
  (SELECT COUNT(*) FROM evidence_players e LEFT JOIN player_profiles p USING (player_id)
    WHERE NULLIF(TRIM(p.country_of_citizenship), '') IS NULL) AS "playersMissingCitizenship",
  (SELECT COUNT(*) FROM evidence_players e LEFT JOIN player_profiles p USING (player_id)
    WHERE NULLIF(TRIM(p.position), '') IS NULL OR LOWER(TRIM(p.position)) = 'missing')
    AS "playersMissingPosition",
  (SELECT COUNT(*) FROM evidence_players e LEFT JOIN player_profiles p USING (player_id)
    WHERE p.date_of_birth IS NULL) AS "playersMissingDateOfBirth",
  (SELECT COUNT(*) FROM evidence_players e LEFT JOIN player_profiles p USING (player_id)
    WHERE NULLIF(TRIM(p.foot), '') IS NULL) AS "playersMissingFoot",
  (SELECT COUNT(*) FROM evidence_players e LEFT JOIN player_profiles p USING (player_id)
    WHERE p.height_in_cm IS NULL) AS "playersMissingHeight",
  (SELECT COUNT(*) FROM evidence_clubs e LEFT JOIN club_profiles c USING (club_id)
    WHERE c.club_id IS NULL) AS "missingClubProfiles",
  (SELECT COUNT(*) FROM evidence_clubs e LEFT JOIN club_profiles c USING (club_id)
    WHERE NULLIF(TRIM(c.name), '') IS NULL) AS "clubsMissingName";
`;
}

function buildMissingPlayerQuery(sources) {
  return `
WITH
  scoped_games AS (
    SELECT game_id, season FROM ${sources.games}
    WHERE competition_id = 'TR1' AND season BETWEEN 2012 AND 2025
  ),
  evidence AS (
    SELECT
      g.season,
      a.player_id,
      a.player_name,
      a.player_club_id AS club_id,
      'appearance' AS evidence_source
    FROM ${sources.appearances} a
    JOIN scoped_games g USING (game_id)
    UNION ALL
    SELECT
      g.season,
      l.player_id,
      l.player_name,
      l.club_id,
      'lineup' AS evidence_source
    FROM ${sources.lineups} l
    JOIN scoped_games g USING (game_id)
  ),
  player_profiles AS (SELECT player_id FROM ${sources.players})
SELECT
  e.player_id AS "playerId",
  STRING_AGG(DISTINCT e.player_name, ' | ' ORDER BY e.player_name) AS "playerNames",
  LIST(DISTINCT e.season ORDER BY e.season) AS "seasons",
  LIST(DISTINCT e.club_id ORDER BY e.club_id) AS "clubIds",
  LIST(DISTINCT e.evidence_source ORDER BY e.evidence_source) AS "evidenceSources",
  COUNT(*) AS "evidenceRows"
FROM evidence e
LEFT JOIN player_profiles p USING (player_id)
WHERE p.player_id IS NULL
GROUP BY e.player_id
ORDER BY e.player_id;
`;
}

function buildMissingPositionQuery(sources) {
  return `
WITH
  scoped_games AS (
    SELECT game_id FROM ${sources.games}
    WHERE competition_id = 'TR1' AND season BETWEEN 2012 AND 2025
  ),
  evidence_players AS (
    SELECT a.player_id FROM ${sources.appearances} a JOIN scoped_games g USING (game_id)
    UNION
    SELECT l.player_id FROM ${sources.lineups} l JOIN scoped_games g USING (game_id)
  ),
  player_profiles AS (SELECT * FROM ${sources.players})
SELECT
  p.player_id AS "playerId",
  p.name,
  p.position,
  p.sub_position AS "subPosition",
  p.country_of_citizenship AS "countryOfCitizenship"
FROM evidence_players e
JOIN player_profiles p USING (player_id)
WHERE NULLIF(TRIM(p.position), '') IS NULL OR LOWER(TRIM(p.position)) = 'missing'
ORDER BY p.player_id;
`;
}

function buildNoEvidenceGamesQuery(sources) {
  return `
WITH
  scoped_games AS (
    SELECT * FROM ${sources.games}
    WHERE competition_id = 'TR1' AND season BETWEEN 2012 AND 2025
  ),
  appearance_games AS (
    SELECT DISTINCT a.game_id FROM ${sources.appearances} a JOIN scoped_games g USING (game_id)
  ),
  lineup_games AS (
    SELECT DISTINCT l.game_id FROM ${sources.lineups} l JOIN scoped_games g USING (game_id)
  )
SELECT
  g.game_id AS "gameId",
  g.season,
  g.date,
  g.home_club_name AS "homeClubName",
  g.away_club_name AS "awayClubName",
  g.home_club_goals AS "homeClubGoals",
  g.away_club_goals AS "awayClubGoals"
FROM scoped_games g
LEFT JOIN appearance_games a USING (game_id)
LEFT JOIN lineup_games l USING (game_id)
WHERE a.game_id IS NULL AND l.game_id IS NULL
ORDER BY g.season, g.date, g.game_id;
`;
}

function addFillRates(profile) {
  return {
    ...profile,
    fillRates: {
      playerProfile: percentage(profile.playerIds, profile.missingPlayerProfiles),
      playerName: percentage(profile.playerIds, profile.playersMissingName),
      citizenship: percentage(profile.playerIds, profile.playersMissingCitizenship),
      position: percentage(profile.playerIds, profile.playersMissingPosition),
      dateOfBirth: percentage(profile.playerIds, profile.playersMissingDateOfBirth),
      foot: percentage(profile.playerIds, profile.playersMissingFoot),
      height: percentage(profile.playerIds, profile.playersMissingHeight),
      clubProfile: percentage(profile.clubIds, profile.missingClubProfiles),
      clubName: percentage(profile.clubIds, profile.clubsMissingName),
    },
  };
}

function buildMarkdown(report) {
  const rows = report.seasonProfiles
    .map(
      (profile) =>
        `| ${profile.season}/${String(profile.season + 1).slice(-2)} | ${profile.gameRows} | ${profile.playerIds} | ${profile.missingPlayerProfiles} | ${profile.fillRates.citizenship}% | ${profile.fillRates.position}% | ${profile.fillRates.dateOfBirth}% | ${profile.appearanceGames}/${profile.gameRows} | ${profile.lineupGames}/${profile.gameRows} |`,
    )
    .join("\n");
  const missingPlayers = report.openIssues.missingPlayerProfiles
    .map(
      (player) =>
        `- ${player.playerId} — ${player.playerNames} (${player.seasons.join(", ")}; ${player.evidenceRows} kanıt satırı)`,
    )
    .join("\n");

  return `# dcaribou Kaggle v${report.snapshotVersion} veri doluluk profili

- Durum: **${report.status}**
- Sezon: ${report.summary.seasons}
- Maç: ${report.summary.games}
- Kulüp: ${report.summary.clubs}
- Oyuncu ID: ${report.summary.players}
- Oyuncu–kulüp–sezon ilişkisi: ${report.summary.playerClubSeasonRelations}
- Oyuncu kanıtı olmayan maç: ${report.openIssues.noEvidenceGames.length}

| Sezon | Maç | Oyuncu | Eksik profil | Uyruk doluluk | Mevki doluluk | Doğum tarihi doluluk | Appearance maç | Lineup maç |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Çözümlenmesi gereken eksik oyuncu profilleri

${missingPlayers || "- Yok"}

## Bilinen kapsam farkı

2012/13 sezonunda lineup verisi yoktur; bu sezonda yalnızca appearance kanıtı kullanılır.
`;
}

async function main() {
  const { snapshotDirectory: requestedDirectory, version } = parseArguments(process.argv.slice(2));
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const snapshotDirectory = path.resolve(
    requestedDirectory ?? path.join(repositoryRoot, `data/raw/dcaribou-kaggle-v${version}`),
  );

  if (!(await fileExists(snapshotDirectory))) {
    throw new Error(`Snapshot klasörü bulunamadı: ${snapshotDirectory}`);
  }

  const sources = {
    appearances: csvRelation(path.join(snapshotDirectory, "appearances.csv")),
    clubs: csvRelation(path.join(snapshotDirectory, "clubs.csv")),
    games: csvRelation(path.join(snapshotDirectory, "games.csv")),
    lineups: csvRelation(path.join(snapshotDirectory, "game_lineups.csv")),
    players: csvRelation(path.join(snapshotDirectory, "players.csv")),
  };
  const seasonProfiles = runDuckDbJson(buildSeasonQuery(sources)).map(addFillRates);
  const [summary] = runDuckDbJson(buildSummaryQuery(sources));
  const missingPlayerProfiles = runDuckDbJson(buildMissingPlayerQuery(sources));
  const missingPositionPlayers = runDuckDbJson(buildMissingPositionQuery(sources));
  const noEvidenceGames = runDuckDbJson(buildNoEvidenceGamesQuery(sources));
  const evidenceIntegrityIssues = seasonProfiles.reduce(
    (total, profile) =>
      total +
      profile.duplicateGameIds +
      profile.gamesMissingCriticalFields +
      profile.sameHomeAwayClubGames +
      profile.appearancesMissingPlayerId +
      profile.appearancesMissingClubId +
      profile.appearanceClubMismatches +
      profile.duplicateAppearancePlayerGames +
      profile.lineupsMissingPlayerId +
      profile.lineupsMissingClubId +
      profile.lineupClubMismatches +
      profile.unknownLineupTypes +
      profile.duplicateLineupPlayerGameTypes,
    0,
  );
  const criticalIssueCount =
    missingPlayerProfiles.length + evidenceIntegrityIssues + noEvidenceGames.length;
  const report = {
    snapshotVersion: Number(version),
    checkedAt: new Date().toISOString(),
    scope: {
      competitionId: "TR1",
      firstSeason: 2012,
      lastSeason: 2025,
    },
    status: criticalIssueCount > 0 ? "requires_resolution" : "passed",
    summary: {
      ...summary,
      criticalIssueCount,
      evidenceIntegrityIssues,
      unresolvedNoEvidenceGames: noEvidenceGames.length,
      playerFillRates: {
        profile: percentage(summary.players, summary.missingPlayerProfiles),
        name: percentage(summary.players, summary.playersMissingName),
        citizenship: percentage(summary.players, summary.playersMissingCitizenship),
        position: percentage(summary.players, summary.playersMissingPosition),
        dateOfBirth: percentage(summary.players, summary.playersMissingDateOfBirth),
        foot: percentage(summary.players, summary.playersMissingFoot),
        height: percentage(summary.players, summary.playersMissingHeight),
      },
    },
    seasonProfiles,
    openIssues: {
      missingPlayerProfiles,
      missingPositionPlayers,
      noEvidenceGames,
    },
    knownLimitations: [
      "2012/13 sezonunda game_lineups verisi yoktur; yalnızca appearance kanıtı kullanılır.",
      "Oyuncu kanıtı olmayan maçlar resmi referansla doğrulanmadan otomatik olarak awarded sayılmaz.",
    ],
  };
  const reportDirectory = path.join(repositoryRoot, "reports/data-quality");
  const jsonReportPath = path.join(
    reportDirectory,
    `dcaribou-kaggle-v${version}-completeness.json`,
  );
  const markdownReportPath = path.join(
    reportDirectory,
    `dcaribou-kaggle-v${version}-completeness.md`,
  );

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownReportPath, buildMarkdown(report));

  console.log(`Sezon: ${summary.seasons}`);
  console.log(`Maç: ${summary.games}`);
  console.log(`Kulüp: ${summary.clubs}`);
  console.log(`Oyuncu: ${summary.players}`);
  console.log(`Oyuncu–kulüp–sezon ilişkisi: ${summary.playerClubSeasonRelations}`);
  console.log(`Eksik oyuncu profili: ${missingPlayerProfiles.length}`);
  console.log(`Kanıt bütünlüğü sorunu: ${evidenceIntegrityIssues}`);
  console.log(`Oyuncu kanıtı olmayan maç: ${noEvidenceGames.length}`);
  console.log(`Rapor: ${markdownReportPath}`);

  if (process.env.PLUS9_ENVIRONMENT === "production" && report.status !== "passed") {
    console.error("Production profil kontrolü açık kritik sorunlar nedeniyle başarısız.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
