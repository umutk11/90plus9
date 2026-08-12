import "server-only";

import { getDatabasePool } from "./database";
import {
  getGridCellDefinition,
  gridCellKeys,
  gridColumns,
  gridRows,
  type GridCellKey,
  type GridRowId,
} from "./grid-config";

const MINIMUM_ANSWERS_PER_CELL = 8;

type PlayerSearchResult = {
  id: number;
  name: string;
};

function normalizeSearchTerm(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replaceAll("ø", "o")
    .replaceAll("ł", "l")
    .replaceAll("đ", "d")
    .replaceAll("ð", "d")
    .replaceAll("þ", "th")
    .replaceAll("æ", "ae")
    .replaceAll("œ", "oe")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ruleCondition(ruleId: GridRowId) {
  switch (ruleId) {
    case "champion":
      return "COALESCE(cs.is_champion, false) = true";
    case "midfielder":
      return "p.position_group = 'mid'";
    case "foreign":
      return "country.iso_alpha_2 IS DISTINCT FROM 'TR' AND country.id IS NOT NULL";
  }
}

export async function searchPlayers(rawQuery: string, limit = 8): Promise<PlayerSearchResult[]> {
  const query = normalizeSearchTerm(rawQuery);
  if (query.length < 2) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 10);
  const pool = getDatabasePool();
  const result = await pool.query<{ id: number; name: string }>(
    `WITH active_dataset AS (
      SELECT id
      FROM dataset_versions
      WHERE status = 'active'
      ORDER BY source_version DESC
      LIMIT 1
    )
    SELECT
      p.source_player_id AS id,
      p.display_name AS name,
      p.normalized_name
    FROM players p
    WHERE
      p.is_active_for_game = true
      AND p.review_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM player_club_seasons pcs
        JOIN active_dataset dataset ON dataset.id = pcs.dataset_version_id
        WHERE
          pcs.player_id = p.id
          AND pcs.is_accepted_for_game = true
          AND pcs.review_status = 'approved'
      )
      AND (
        p.normalized_name LIKE $1
        OR EXISTS (
          SELECT 1
          FROM player_aliases alias
          WHERE alias.player_id = p.id AND alias.normalized_alias LIKE $1
        )
      )
    ORDER BY
      CASE
        WHEN p.normalized_name = $2 THEN 0
        WHEN p.normalized_name LIKE $3 THEN 1
        ELSE 2
      END,
      LENGTH(p.display_name),
      p.display_name
    LIMIT $4`,
    [`%${query}%`, query, `${query}%`, safeLimit],
  );

  return result.rows.map((player) => ({ id: player.id, name: player.name }));
}

export async function getGridAnswerCounts() {
  const pool = getDatabasePool();
  const result = await pool.query<{
    answer_count: number;
    column_id: string;
    row_id: GridRowId;
  }>(
    `WITH active_dataset AS (
      SELECT id
      FROM dataset_versions
      WHERE status = 'active'
      ORDER BY source_version DESC
      LIMIT 1
    ), target_clubs(column_id, source_club_id) AS (
      VALUES ${gridColumns.map((_, index) => `($${index * 2 + 1}::text, $${index * 2 + 2}::integer)`).join(", ")}
    ), target_rules(row_id) AS (
      VALUES ${gridRows.map((_, index) => `($${gridColumns.length * 2 + index + 1}::text)`).join(", ")}
    )
    SELECT
      target_clubs.column_id,
      target_rules.row_id,
      COUNT(DISTINCT pcs.player_id)::integer AS answer_count
    FROM target_clubs
    CROSS JOIN target_rules
    LEFT JOIN clubs c ON c.source_club_id = target_clubs.source_club_id
    LEFT JOIN player_club_seasons pcs ON pcs.club_id = c.id
    LEFT JOIN active_dataset dataset ON dataset.id = pcs.dataset_version_id
    LEFT JOIN players p ON p.id = pcs.player_id
    LEFT JOIN countries country ON country.id = p.citizenship_country_id
    LEFT JOIN club_seasons cs ON cs.club_id = pcs.club_id AND cs.season_id = pcs.season_id
    WHERE
      dataset.id IS NOT NULL
      AND pcs.is_accepted_for_game = true
      AND pcs.review_status = 'approved'
      AND p.is_active_for_game = true
      AND p.review_status = 'approved'
      AND CASE target_rules.row_id
        WHEN 'champion' THEN COALESCE(cs.is_champion, false) = true
        WHEN 'midfielder' THEN p.position_group = 'mid'
        WHEN 'foreign' THEN country.iso_alpha_2 IS DISTINCT FROM 'TR' AND country.id IS NOT NULL
        ELSE false
      END
    GROUP BY target_clubs.column_id, target_rules.row_id`,
    [
      ...gridColumns.flatMap((column) => [column.id, column.sourceClubId]),
      ...gridRows.map((row) => row.id),
    ],
  );

  const counts = Object.fromEntries(gridCellKeys.map((cellKey) => [cellKey, 0])) as Record<
    GridCellKey,
    number
  >;
  for (const row of result.rows) {
    const cellKey = `${row.row_id}-${row.column_id}` as GridCellKey;
    counts[cellKey] = row.answer_count;
  }

  const invalidCells = gridCellKeys.filter((cellKey) => counts[cellKey] < MINIMUM_ANSWERS_PER_CELL);
  if (invalidCells.length > 0) {
    throw new Error(`Yayınlanamaz grid hücreleri: ${invalidCells.join(", ")}`);
  }

  return counts;
}

export async function verifyPlayerGuess(cellKey: GridCellKey, sourcePlayerId: number) {
  const { column, row } = getGridCellDefinition(cellKey);
  const pool = getDatabasePool();
  const result = await pool.query<{ id: number; name: string }>(
    `WITH active_dataset AS (
      SELECT id
      FROM dataset_versions
      WHERE status = 'active'
      ORDER BY source_version DESC
      LIMIT 1
    )
    SELECT DISTINCT p.source_player_id AS id, p.display_name AS name
    FROM players p
    JOIN player_club_seasons pcs ON pcs.player_id = p.id
    JOIN active_dataset dataset ON dataset.id = pcs.dataset_version_id
    JOIN clubs c ON c.id = pcs.club_id
    LEFT JOIN countries country ON country.id = p.citizenship_country_id
    LEFT JOIN club_seasons cs ON cs.club_id = pcs.club_id AND cs.season_id = pcs.season_id
    WHERE
      p.source_player_id = $1
      AND c.source_club_id = $2
      AND p.is_active_for_game = true
      AND p.review_status = 'approved'
      AND pcs.is_accepted_for_game = true
      AND pcs.review_status = 'approved'
      AND ${ruleCondition(row.id)}
    LIMIT 1`,
    [sourcePlayerId, column.sourceClubId],
  );

  return result.rows[0] ?? null;
}
