import { verifyChampionReferenceInDatabase } from "../../../scripts/data/champion-reference.mjs";

function percentage(part, total) {
  return total === 0 ? 0 : Number(((part / total) * 100).toFixed(2));
}

export async function collectCanonicalQuality(
  client,
  { championReference, datasetVersionId, expected },
) {
  const datasetResult = await client.query(
    `SELECT
      id,
      source_name,
      source_version,
      status,
      source_updated_at,
      player_count,
      club_count,
      match_count,
      player_club_season_count
    FROM dataset_versions
    WHERE id = $1`,
    [datasetVersionId],
  );
  if (datasetResult.rowCount !== 1) {
    throw new Error(`Canonical kalite kontrolü: dataset version bulunamadı: ${datasetVersionId}`);
  }

  const countsResult = await client.query(
    `SELECT
      (SELECT COUNT(*)::integer FROM seasons WHERE start_year BETWEEN 2012 AND 2025) AS seasons,
      (SELECT COUNT(*)::integer FROM countries) AS countries,
      (SELECT COUNT(DISTINCT club_id)::integer FROM player_match_evidence
        WHERE dataset_version_id = $1) AS clubs,
      (SELECT COUNT(DISTINCT player_id)::integer FROM player_match_evidence
        WHERE dataset_version_id = $1) AS players,
      (SELECT COUNT(*)::integer FROM matches WHERE dataset_version_id = $1) AS matches,
      (SELECT COUNT(*)::integer FROM player_match_evidence
        WHERE dataset_version_id = $1) AS evidence,
      (SELECT COUNT(*)::integer FROM player_club_seasons
        WHERE dataset_version_id = $1) AS player_club_seasons,
      (SELECT COUNT(*)::integer FROM club_seasons cs
        JOIN seasons s ON s.id = cs.season_id
        WHERE s.start_year BETWEEN 2012 AND 2025) AS club_seasons`,
    [datasetVersionId],
  );
  const playerResult = await client.query(
    `WITH dataset_players AS (
      SELECT DISTINCT player_id
      FROM player_match_evidence
      WHERE dataset_version_id = $1
    ), selected_players AS (
      SELECT p.*
      FROM players p
      JOIN dataset_players dp ON dp.player_id = p.id
    )
    SELECT
      COUNT(*)::integer AS players,
      COUNT(*) FILTER (WHERE source_player_id IS NULL)::integer AS missing_source_ids,
      COUNT(*) FILTER (WHERE display_name IS NULL OR BTRIM(display_name) = '')::integer
        AS missing_names,
      (SELECT COUNT(*)::integer FROM (
        SELECT source_player_id FROM selected_players GROUP BY source_player_id HAVING COUNT(*) > 1
      ) duplicate_ids) AS duplicate_source_ids,
      COUNT(*) FILTER (WHERE raw_citizenship IS NULL)::integer AS missing_raw_citizenships,
      COUNT(*) FILTER (WHERE citizenship_country_id IS NULL)::integer AS missing_citizenships,
      COUNT(*) FILTER (
        WHERE raw_citizenship IS NOT NULL AND citizenship_country_id IS NULL
      )::integer AS unmapped_citizenships,
      COUNT(*) FILTER (WHERE position_group IS NULL)::integer AS missing_positions,
      COUNT(*) FILTER (
        WHERE date_of_birth > $2::date
      )::integer AS future_birth_dates,
      COUNT(*) FILTER (
        WHERE date_of_birth < DATE '1960-01-01' OR date_of_birth > $2::date
      )::integer AS implausible_birth_dates,
      COUNT(*) FILTER (WHERE height_cm IS NULL)::integer AS missing_heights,
      (SELECT COUNT(*)::integer FROM (
        SELECT normalized_name FROM selected_players GROUP BY normalized_name HAVING COUNT(*) > 1
      ) duplicate_names) AS duplicate_name_groups,
      ARRAY_AGG(source_player_id ORDER BY source_player_id)
        FILTER (WHERE citizenship_country_id IS NULL) AS missing_citizenship_source_ids,
      ARRAY_AGG(source_player_id ORDER BY source_player_id)
        FILTER (WHERE position_group IS NULL) AS missing_position_source_ids
    FROM selected_players`,
    [datasetVersionId, datasetResult.rows[0].source_updated_at],
  );
  const relationResult = await client.query(
    `WITH actual AS (
      SELECT
        pme.player_id,
        pme.club_id,
        m.season_id,
        COUNT(*)::integer AS evidence_count,
        COUNT(*) FILTER (WHERE pme.evidence_type = 'appearance')::integer AS appearance_count,
        COUNT(*) FILTER (WHERE pme.evidence_type = 'starting_lineup')::integer AS start_count,
        COUNT(*) FILTER (WHERE pme.evidence_type = 'substitute')::integer AS bench_count,
        MIN(m.match_date) AS first_seen_date,
        MAX(m.match_date) AS last_seen_date
      FROM player_match_evidence pme
      JOIN matches m ON m.id = pme.match_id
      WHERE pme.dataset_version_id = $1 AND m.dataset_version_id = $1
      GROUP BY pme.player_id, pme.club_id, m.season_id
    ), relation_checks AS (
      SELECT pcs.*, a.appearance_count AS actual_appearances, a.start_count AS actual_starts,
        a.bench_count AS actual_benches, a.evidence_count AS actual_evidence,
        a.first_seen_date AS actual_first_seen, a.last_seen_date AS actual_last_seen
      FROM player_club_seasons pcs
      LEFT JOIN actual a
        ON a.player_id = pcs.player_id AND a.club_id = pcs.club_id AND a.season_id = pcs.season_id
      WHERE pcs.dataset_version_id = $1
    )
    SELECT
      COUNT(*)::integer AS relations,
      COUNT(*) FILTER (WHERE actual_evidence IS NULL)::integer AS relations_without_evidence,
      COUNT(*) FILTER (
        WHERE actual_evidence IS NOT NULL AND (
          evidence_count <> actual_evidence OR
          appearance_count <> actual_appearances OR
          lineup_count <> actual_starts + actual_benches
        )
      )::integer AS relation_count_mismatches,
      COUNT(*) FILTER (
        WHERE actual_evidence IS NOT NULL AND (
          has_appearance <> (actual_appearances > 0) OR
          has_start <> (actual_starts > 0) OR
          has_bench <> (actual_benches > 0)
        )
      )::integer AS relation_flag_mismatches,
      COUNT(*) FILTER (
        WHERE actual_evidence IS NOT NULL AND (
          first_seen_date <> actual_first_seen OR last_seen_date <> actual_last_seen
        )
      )::integer AS relation_date_mismatches,
      COUNT(*) FILTER (WHERE evidence_count = 1)::integer AS single_evidence_relations,
      COUNT(*) FILTER (WHERE is_accepted_for_game = false)::integer AS inactive_relations
    FROM relation_checks`,
    [datasetVersionId],
  );
  const evidenceResult = await client.query(
    `SELECT
      COUNT(*) FILTER (
        WHERE pme.club_id <> m.home_club_id AND pme.club_id <> m.away_club_id
      )::integer AS evidence_club_match_mismatches,
      COUNT(*) FILTER (
        WHERE m.match_date < MAKE_DATE(s.start_year, 7, 1)
          OR m.match_date > MAKE_DATE(s.end_year, 8, 31)
      )::integer AS evidence_outside_season
    FROM player_match_evidence pme
    JOIN matches m ON m.id = pme.match_id
    JOIN seasons s ON s.id = m.season_id
    WHERE pme.dataset_version_id = $1 AND m.dataset_version_id = $1`,
    [datasetVersionId],
  );
  const anomalyResult = await client.query(
    `SELECT
      (SELECT COUNT(*)::integer FROM (
        SELECT player_id, season_id
        FROM player_club_seasons
        WHERE dataset_version_id = $1
        GROUP BY player_id, season_id
        HAVING COUNT(*) > 2
      ) unusual_club_counts) AS players_over_two_clubs_in_season,
      (SELECT COUNT(*)::integer FROM (
        SELECT player_id, match_id
        FROM player_match_evidence
        WHERE dataset_version_id = $1
        GROUP BY player_id, match_id
        HAVING COUNT(DISTINCT club_id) > 1
      ) double_club_matches) AS players_for_two_clubs_in_match`,
    [datasetVersionId],
  );
  const issueResult = await client.query(
    `SELECT
      COUNT(*) FILTER (WHERE status IN ('open', 'reviewing'))::integer AS open_issues,
      COUNT(*) FILTER (
        WHERE status IN ('open', 'reviewing') AND severity = 'critical'
      )::integer AS open_critical_issues
    FROM data_quality_issues`,
  );
  const previousResult = await client.query(
    `SELECT source_version, player_count, club_count, match_count, player_club_season_count
    FROM dataset_versions
    WHERE source_name = $1 AND source_version < $2 AND status IN ('ready', 'active', 'archived')
    ORDER BY source_version DESC
    LIMIT 1`,
    [datasetResult.rows[0].source_name, datasetResult.rows[0].source_version],
  );

  const counts = countsResult.rows[0];
  const players = playerResult.rows[0];
  const relations = relationResult.rows[0];
  const evidence = evidenceResult.rows[0];
  const anomalies = anomalyResult.rows[0];
  const issues = issueResult.rows[0];
  const criticalErrors = [];
  const warnings = [];
  const expectedCounts = {
    seasons: expected.seasons,
    countries: 165,
    clubs: expected.clubs,
    players: expected.players,
    matches: expected.games,
    evidence: expected.playerMatchEvidenceRows,
    player_club_seasons: expected.playerClubSeasonRelations,
    club_seasons: expected.clubSeasons,
  };

  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) {
      criticalErrors.push(`${key}: beklenen ${value}, bulunan ${counts[key]}`);
    }
  }

  const zeroCriticalMetrics = {
    missing_source_ids: players.missing_source_ids,
    missing_names: players.missing_names,
    duplicate_source_ids: players.duplicate_source_ids,
    unmapped_citizenships: players.unmapped_citizenships,
    future_birth_dates: players.future_birth_dates,
    implausible_birth_dates: players.implausible_birth_dates,
    relations_without_evidence: relations.relations_without_evidence,
    relation_count_mismatches: relations.relation_count_mismatches,
    relation_flag_mismatches: relations.relation_flag_mismatches,
    relation_date_mismatches: relations.relation_date_mismatches,
    evidence_club_match_mismatches: evidence.evidence_club_match_mismatches,
    evidence_outside_season: evidence.evidence_outside_season,
    players_for_two_clubs_in_match: anomalies.players_for_two_clubs_in_match,
    open_critical_issues: issues.open_critical_issues,
  };
  for (const [key, value] of Object.entries(zeroCriticalMetrics)) {
    if (value !== 0) {
      criticalErrors.push(`${key}: ${value}`);
    }
  }

  let championRows = [];
  try {
    championRows = await verifyChampionReferenceInDatabase(client, championReference);
  } catch (error) {
    criticalErrors.push(error instanceof Error ? error.message : String(error));
  }

  if (players.missing_citizenships > 0) {
    warnings.push(`Vatandaşlığı eksik oyuncu: ${players.missing_citizenships}`);
  }
  if (players.missing_positions > 0) {
    warnings.push(`Genel mevkisi eksik oyuncu: ${players.missing_positions}`);
  }
  if (players.duplicate_name_groups > 0) {
    warnings.push(`Aynı normalize ada sahip farklı oyuncu grubu: ${players.duplicate_name_groups}`);
  }
  if (relations.single_evidence_relations > 0) {
    warnings.push(
      `Tek kanıtlı oyuncu–kulüp–sezon ilişkisi: ${relations.single_evidence_relations}`,
    );
  }
  if (anomalies.players_over_two_clubs_in_season > 0) {
    warnings.push(
      `Bir sezonda ikiden fazla kulüpte görünen oyuncu: ${anomalies.players_over_two_clubs_in_season}`,
    );
  }

  const previous = previousResult.rows[0] ?? null;
  const previousVersionDiff = previous
    ? {
        sourceVersion: previous.source_version,
        players: counts.players - previous.player_count,
        clubs: counts.clubs - previous.club_count,
        matches: counts.matches - previous.match_count,
        playerClubSeasons: counts.player_club_seasons - previous.player_club_season_count,
      }
    : null;

  return {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    status: criticalErrors.length === 0 ? "passed" : "failed",
    dataset: datasetResult.rows[0],
    counts: { ...counts, champions: championRows.length },
    playerQuality: {
      ...players,
      citizenshipFillPercent: percentage(
        players.players - players.missing_citizenships,
        players.players,
      ),
      positionFillPercent: percentage(players.players - players.missing_positions, players.players),
    },
    relationQuality: { ...relations, ...evidence, ...anomalies },
    issueSummary: issues,
    previousVersionDiff,
    criticalErrors,
    warnings,
  };
}

export function assertCanonicalQuality(report) {
  if (report.status !== "passed") {
    throw new Error(`Canonical veri kalite kapısı başarısız:\n${report.criticalErrors.join("\n")}`);
  }
}

export async function syncCanonicalQualityIssues(client, report) {
  const generatedIssues = [
    {
      description: `${report.playerQuality.missing_citizenships} oyuncunun kaynak vatandaşlık alanı boş; oyunda vatandaşlık kriterine dahil edilmeyecek.`,
      issueType: "players_missing_citizenship",
      relatedRecords: {
        datasetVersionId: report.dataset.id,
        sourcePlayerIds: report.playerQuality.missing_citizenship_source_ids ?? [],
      },
      severity: "warning",
      shouldExist: report.playerQuality.missing_citizenships > 0,
    },
    {
      description: `${report.playerQuality.missing_positions} oyuncunun genel mevki alanı boş; manuel inceleme bekliyor.`,
      issueType: "players_missing_position",
      relatedRecords: {
        datasetVersionId: report.dataset.id,
        sourcePlayerIds: report.playerQuality.missing_position_source_ids ?? [],
      },
      severity: "warning",
      shouldExist: report.playerQuality.missing_positions > 0,
    },
  ];

  for (const issue of generatedIssues) {
    const existingResult = await client.query(
      `SELECT id
      FROM data_quality_issues
      WHERE issue_type = $1 AND status IN ('open', 'reviewing')
      ORDER BY id
      LIMIT 1`,
      [issue.issueType],
    );
    const existing = existingResult.rows[0];

    if (issue.shouldExist && existing) {
      await client.query(
        `UPDATE data_quality_issues
          SET severity = $2, related_records = $3, description = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [existing.id, issue.severity, issue.relatedRecords, issue.description],
      );
    } else if (issue.shouldExist) {
      await client.query(
        `INSERT INTO data_quality_issues (
          issue_type, severity, related_records, description, status, updated_at
        ) VALUES ($1, $2, $3, $4, 'open', CURRENT_TIMESTAMP)`,
        [issue.issueType, issue.severity, issue.relatedRecords, issue.description],
      );
    } else if (existing) {
      await client.query(
        `UPDATE data_quality_issues
          SET
            status = 'resolved',
            resolution_note = 'Canonical kalite kontrolünde sorun artık bulunmuyor.',
            resolved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [existing.id],
      );
    }
  }

  const summaryResult = await client.query(
    `SELECT
      COUNT(*) FILTER (WHERE status IN ('open', 'reviewing'))::integer AS open_issues,
      COUNT(*) FILTER (
        WHERE status IN ('open', 'reviewing') AND severity = 'critical'
      )::integer AS open_critical_issues
    FROM data_quality_issues`,
  );

  return summaryResult.rows[0];
}
