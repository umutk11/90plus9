-- Canonical imported records coexist across dataset versions so a ready version can be
-- validated before it becomes active.

-- DropIndex
DROP INDEX "matches_source_game_id_key";

-- DropIndex
DROP INDEX "player_club_seasons_player_id_club_id_season_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "matches_dataset_version_id_source_game_id_key"
ON "matches"("dataset_version_id", "source_game_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_club_seasons_dataset_version_id_player_id_club_id_se_key"
ON "player_club_seasons"("dataset_version_id", "player_id", "club_id", "season_id");
