DO $$
DECLARE
  application_table_count integer;
  season_count integer;
  missing_season_count integer;
  domain_constraint_count integer;
BEGIN
  SELECT COUNT(*)
  INTO application_table_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename <> '_prisma_migrations';

  IF application_table_count <> 21 THEN
    RAISE EXCEPTION 'Beklenen 21 uygulama tablosu yerine % tablo bulundu.', application_table_count;
  END IF;

  SELECT COUNT(*)
  INTO season_count
  FROM seasons;

  IF season_count <> 14 THEN
    RAISE EXCEPTION 'Beklenen 14 sezon yerine % sezon bulundu.', season_count;
  END IF;

  SELECT COUNT(*)
  INTO missing_season_count
  FROM generate_series(2012, 2025) AS expected(start_year)
  LEFT JOIN seasons USING (start_year)
  WHERE seasons.id IS NULL
    OR seasons.end_year <> expected.start_year + 1
    OR seasons.label <> CONCAT(expected.start_year, '/', RIGHT((expected.start_year + 1)::text, 2));

  IF missing_season_count <> 0 THEN
    RAISE EXCEPTION 'Sezon seedlerinde % eksik veya hatalı kayıt bulundu.', missing_season_count;
  END IF;

  SELECT COUNT(*)
  INTO domain_constraint_count
  FROM pg_constraint
  WHERE conname = ANY (ARRAY[
    'dataset_versions_checksum_sha256_check',
    'dataset_versions_counts_check',
    'dataset_versions_import_dates_check',
    'seasons_years_check',
    'club_aliases_dates_check',
    'clubs_istanbul_flags_check',
    'clubs_identity_review_check',
    'players_height_cm_check',
    'matches_distinct_clubs_check',
    'matches_scores_check',
    'matches_awarded_evidence_check',
    'player_match_evidence_minutes_check',
    'player_club_seasons_dates_check',
    'player_club_seasons_counts_check',
    'player_club_seasons_flags_check',
    'player_club_seasons_level_check',
    'club_seasons_champion_verification_check',
    'data_overrides_critical_source_check',
    'data_overrides_revert_check',
    'grid_cells_answer_count_check',
    'grid_cells_answer_hash_check',
    'game_jokers_six_players_check'
  ]);

  IF domain_constraint_count <> 22 THEN
    RAISE EXCEPTION 'Beklenen 22 domain constraint yerine % constraint bulundu.', domain_constraint_count;
  END IF;

  IF to_regclass('public.dataset_versions_single_active_idx') IS NULL THEN
    RAISE EXCEPTION 'Tek aktif dataset version indexi bulunamadı.';
  END IF;

  IF to_regclass('public.club_seasons_single_champion_per_season_idx') IS NULL THEN
    RAISE EXCEPTION 'Sezon başına tek şampiyon indexi bulunamadı.';
  END IF;
END $$;

SELECT
  (SELECT COUNT(*) FROM seasons) AS seasons,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations')
    AS application_tables;
