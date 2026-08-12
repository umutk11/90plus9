import "server-only";

import { getDatabasePool } from "./database";

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
