-- Convert any already-created joker set from six answers to one answer and five decoys.
UPDATE "game_jokers" AS gj
SET "player_ids" = (
  SELECT ARRAY(
    SELECT choices.player_id
    FROM (
      SELECT correct_choice.player_id
      FROM LATERAL (
        SELECT existing_choice.player_id
        FROM unnest(gj."player_ids") WITH ORDINALITY AS existing_choice(player_id, sort_order)
        JOIN "grid_cell_answers" gca
          ON gca."grid_cell_id" = gj."grid_cell_id"
         AND gca."player_id" = existing_choice.player_id
        ORDER BY existing_choice.sort_order
        LIMIT 1
      ) AS correct_choice

      UNION ALL

      SELECT wrong_choice.id
      FROM LATERAL (
        SELECT familiar_player.id
        FROM (
          SELECT p.id, SUM(pcs."evidence_count")::integer AS career_evidence
          FROM "players" p
          JOIN "player_club_seasons" pcs ON pcs."player_id" = p.id
          WHERE p."is_active_for_game" = true
            AND p."review_status" = 'approved'
            AND pcs."is_accepted_for_game" = true
            AND pcs."review_status" = 'approved'
            AND NOT EXISTS (
              SELECT 1
              FROM "grid_cell_answers" gca
              WHERE gca."grid_cell_id" = gj."grid_cell_id"
                AND gca."player_id" = p.id
            )
            AND NOT EXISTS (
              SELECT 1
              FROM "game_session_cells" gsc
              WHERE gsc."session_id" = gj."session_id"
                AND gsc."player_id" = p.id
            )
          GROUP BY p.id
          ORDER BY career_evidence DESC, p.id
          LIMIT 120
        ) AS familiar_player
        ORDER BY md5(
          familiar_player.id::text || gj."session_id"::text || gj."grid_cell_id"::text || 'wrong'
        )
        LIMIT 5
      ) AS wrong_choice
    ) AS choices
    ORDER BY md5(
      choices.player_id::text || gj."session_id"::text || gj."grid_cell_id"::text || 'shuffle'
    )
  )
);
