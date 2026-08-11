-- CreateEnum
CREATE TYPE "dataset_version_status" AS ENUM ('pending', 'validating', 'ready', 'failed', 'active', 'archived');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "alias_type" AS ENUM ('source', 'transliteration', 'historical', 'sponsor', 'nickname', 'manual');

-- CreateEnum
CREATE TYPE "position_group" AS ENUM ('gk', 'def', 'mid', 'fwd');

-- CreateEnum
CREATE TYPE "preferred_foot" AS ENUM ('left', 'right', 'both');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('played', 'awarded', 'cancelled', 'postponed', 'unknown');

-- CreateEnum
CREATE TYPE "evidence_type" AS ENUM ('appearance', 'starting_lineup', 'substitute');

-- CreateEnum
CREATE TYPE "evidence_level" AS ENUM ('appearance', 'lineup');

-- CreateEnum
CREATE TYPE "data_quality_severity" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "data_quality_status" AS ENUM ('open', 'reviewing', 'resolved', 'ignored');

-- CreateTable
CREATE TABLE "dataset_versions" (
    "id" SERIAL NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_version" INTEGER NOT NULL,
    "distribution" TEXT NOT NULL,
    "source_updated_at" TIMESTAMPTZ(3),
    "downloaded_at" TIMESTAMPTZ(3) NOT NULL,
    "checksum_sha256" VARCHAR(64) NOT NULL,
    "import_started_at" TIMESTAMPTZ(3),
    "import_finished_at" TIMESTAMPTZ(3),
    "status" "dataset_version_status" NOT NULL DEFAULT 'pending',
    "player_count" INTEGER,
    "club_count" INTEGER,
    "match_count" INTEGER,
    "player_club_season_count" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dataset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" SERIAL NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "label" VARCHAR(7) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "source_country_id" INTEGER,
    "source_country_code" TEXT,
    "source_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "iso_alpha_2" CHAR(2),
    "iso_alpha_3" CHAR(3),
    "confederation" TEXT,
    "continent" TEXT,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" SERIAL NOT NULL,
    "source_club_id" INTEGER NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "city" TEXT,
    "is_istanbul" BOOLEAN,
    "is_non_istanbul" BOOLEAN,
    "is_big_four" BOOLEAN NOT NULL DEFAULT false,
    "is_active_in_scope" BOOLEAN NOT NULL DEFAULT true,
    "source_url" TEXT,
    "identity_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "identity_reviewed_at" TIMESTAMPTZ(3),
    "identity_reviewed_by" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_aliases" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "alias_type" "alias_type" NOT NULL,
    "valid_from" DATE,
    "valid_until" DATE,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "source_note" TEXT,

    CONSTRAINT "club_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "source_player_id" INTEGER NOT NULL,
    "display_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" DATE,
    "country_of_birth_id" INTEGER,
    "citizenship_country_id" INTEGER,
    "raw_country_of_birth" TEXT,
    "raw_citizenship" TEXT,
    "position_group" "position_group",
    "raw_position" TEXT,
    "raw_sub_position" TEXT,
    "preferred_foot" "preferred_foot",
    "height_cm" INTEGER,
    "source_url" TEXT,
    "is_active_for_game" BOOLEAN NOT NULL DEFAULT true,
    "review_status" "review_status" NOT NULL DEFAULT 'approved',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_aliases" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "alias_type" "alias_type" NOT NULL,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "source_note" TEXT,

    CONSTRAINT "player_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "source_game_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "dataset_version_id" INTEGER NOT NULL,
    "match_date" DATE NOT NULL,
    "home_club_id" INTEGER NOT NULL,
    "away_club_id" INTEGER NOT NULL,
    "home_score" INTEGER,
    "away_score" INTEGER,
    "status" "match_status" NOT NULL DEFAULT 'unknown',
    "status_source" TEXT,
    "is_player_evidence_allowed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_match_evidence" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "match_id" INTEGER NOT NULL,
    "club_id" INTEGER NOT NULL,
    "dataset_version_id" INTEGER NOT NULL,
    "evidence_type" "evidence_type" NOT NULL,
    "minutes_played" INTEGER,

    CONSTRAINT "player_match_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_club_seasons" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "club_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "dataset_version_id" INTEGER NOT NULL,
    "has_appearance" BOOLEAN NOT NULL DEFAULT false,
    "has_start" BOOLEAN NOT NULL DEFAULT false,
    "has_bench" BOOLEAN NOT NULL DEFAULT false,
    "first_seen_date" DATE NOT NULL,
    "last_seen_date" DATE NOT NULL,
    "appearance_count" INTEGER NOT NULL DEFAULT 0,
    "lineup_count" INTEGER NOT NULL DEFAULT 0,
    "evidence_count" INTEGER NOT NULL DEFAULT 0,
    "evidence_level" "evidence_level" NOT NULL,
    "is_accepted_for_game" BOOLEAN NOT NULL DEFAULT true,
    "review_status" "review_status" NOT NULL DEFAULT 'approved',

    CONSTRAINT "player_club_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_seasons" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "participated_in_super_lig" BOOLEAN NOT NULL DEFAULT true,
    "is_champion" BOOLEAN NOT NULL DEFAULT false,
    "championship_source_url" TEXT,
    "championship_verified_at" TIMESTAMPTZ(3),
    "championship_verified_by" TEXT,

    CONSTRAINT "club_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_overrides" (
    "id" SERIAL NOT NULL,
    "target_table" TEXT NOT NULL,
    "target_record_id" TEXT NOT NULL,
    "target_field" TEXT,
    "previous_value" JSONB,
    "new_value" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reverted_at" TIMESTAMPTZ(3),
    "reverted_by" TEXT,
    "revert_reason" TEXT,

    CONSTRAINT "data_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_quality_issues" (
    "id" SERIAL NOT NULL,
    "issue_type" TEXT NOT NULL,
    "severity" "data_quality_severity" NOT NULL,
    "related_records" JSONB,
    "description" TEXT NOT NULL,
    "status" "data_quality_status" NOT NULL DEFAULT 'open',
    "resolution_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "resolved_at" TIMESTAMPTZ(3),

    CONSTRAINT "data_quality_issues_pkey" PRIMARY KEY ("id")
);

-- Domain constraints that Prisma cannot express in schema.prisma.
ALTER TABLE "dataset_versions"
ADD CONSTRAINT "dataset_versions_checksum_sha256_check"
CHECK ("checksum_sha256" ~ '^[0-9a-f]{64}$'),
ADD CONSTRAINT "dataset_versions_counts_check"
CHECK (
    ("player_count" IS NULL OR "player_count" >= 0) AND
    ("club_count" IS NULL OR "club_count" >= 0) AND
    ("match_count" IS NULL OR "match_count" >= 0) AND
    ("player_club_season_count" IS NULL OR "player_club_season_count" >= 0)
),
ADD CONSTRAINT "dataset_versions_import_dates_check"
CHECK (
    "import_finished_at" IS NULL OR
    ("import_started_at" IS NOT NULL AND "import_finished_at" >= "import_started_at")
);

ALTER TABLE "seasons"
ADD CONSTRAINT "seasons_years_check"
CHECK ("end_year" = "start_year" + 1);

ALTER TABLE "club_aliases"
ADD CONSTRAINT "club_aliases_dates_check"
CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" >= "valid_from");

ALTER TABLE "clubs"
ADD CONSTRAINT "clubs_istanbul_flags_check"
CHECK (
    ("is_istanbul" IS NULL AND "is_non_istanbul" IS NULL) OR
    ("is_istanbul" IS NOT NULL AND "is_non_istanbul" IS NOT NULL AND "is_istanbul" <> "is_non_istanbul")
),
ADD CONSTRAINT "clubs_identity_review_check"
CHECK (
    "identity_reviewed" = false OR
    ("identity_reviewed_at" IS NOT NULL AND "identity_reviewed_by" IS NOT NULL)
);

ALTER TABLE "players"
ADD CONSTRAINT "players_height_cm_check"
CHECK ("height_cm" IS NULL OR "height_cm" BETWEEN 50 AND 250);

ALTER TABLE "matches"
ADD CONSTRAINT "matches_distinct_clubs_check"
CHECK ("home_club_id" <> "away_club_id"),
ADD CONSTRAINT "matches_scores_check"
CHECK (
    ("home_score" IS NULL OR "home_score" >= 0) AND
    ("away_score" IS NULL OR "away_score" >= 0)
),
ADD CONSTRAINT "matches_awarded_evidence_check"
CHECK ("status" <> 'awarded' OR "is_player_evidence_allowed" = false);

ALTER TABLE "player_match_evidence"
ADD CONSTRAINT "player_match_evidence_minutes_check"
CHECK ("minutes_played" IS NULL OR "minutes_played" BETWEEN 0 AND 130);

ALTER TABLE "player_club_seasons"
ADD CONSTRAINT "player_club_seasons_dates_check"
CHECK ("last_seen_date" >= "first_seen_date"),
ADD CONSTRAINT "player_club_seasons_counts_check"
CHECK (
    "appearance_count" >= 0 AND
    "lineup_count" >= 0 AND
    "evidence_count" = "appearance_count" + "lineup_count" AND
    "evidence_count" > 0
),
ADD CONSTRAINT "player_club_seasons_flags_check"
CHECK (
    "has_appearance" = ("appearance_count" > 0) AND
    ("has_start" OR "has_bench") = ("lineup_count" > 0)
),
ADD CONSTRAINT "player_club_seasons_level_check"
CHECK (
    ("has_appearance" = true AND "evidence_level" = 'appearance') OR
    ("has_appearance" = false AND "evidence_level" = 'lineup')
);

ALTER TABLE "club_seasons"
ADD CONSTRAINT "club_seasons_champion_verification_check"
CHECK (
    "is_champion" = false OR
    (
        "championship_source_url" IS NOT NULL AND
        "championship_verified_at" IS NOT NULL AND
        "championship_verified_by" IS NOT NULL
    )
);

ALTER TABLE "data_overrides"
ADD CONSTRAINT "data_overrides_critical_source_check"
CHECK ("is_critical" = false OR "source_url" IS NOT NULL),
ADD CONSTRAINT "data_overrides_revert_check"
CHECK (
    ("reverted_at" IS NULL AND "reverted_by" IS NULL AND "revert_reason" IS NULL) OR
    ("reverted_at" IS NOT NULL AND "reverted_by" IS NOT NULL AND "revert_reason" IS NOT NULL)
);

-- Static season reference data for the MVP scope.
INSERT INTO "seasons" ("start_year", "end_year", "label")
VALUES
    (2012, 2013, '2012/13'),
    (2013, 2014, '2013/14'),
    (2014, 2015, '2014/15'),
    (2015, 2016, '2015/16'),
    (2016, 2017, '2016/17'),
    (2017, 2018, '2017/18'),
    (2018, 2019, '2018/19'),
    (2019, 2020, '2019/20'),
    (2020, 2021, '2020/21'),
    (2021, 2022, '2021/22'),
    (2022, 2023, '2022/23'),
    (2023, 2024, '2023/24'),
    (2024, 2025, '2024/25'),
    (2025, 2026, '2025/26');

-- CreateIndex
CREATE INDEX "dataset_versions_status_idx" ON "dataset_versions"("status");

-- Only one dataset version may be active at a time.
CREATE UNIQUE INDEX "dataset_versions_single_active_idx"
ON "dataset_versions" (("status"))
WHERE "status" = 'active';

-- CreateIndex
CREATE UNIQUE INDEX "dataset_versions_source_name_source_version_key" ON "dataset_versions"("source_name", "source_version");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_start_year_key" ON "seasons"("start_year");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_end_year_key" ON "seasons"("end_year");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_label_key" ON "seasons"("label");

-- CreateIndex
CREATE UNIQUE INDEX "countries_source_country_id_key" ON "countries"("source_country_id");

-- CreateIndex
CREATE UNIQUE INDEX "countries_source_name_key" ON "countries"("source_name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_alpha_2_key" ON "countries"("iso_alpha_2");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_alpha_3_key" ON "countries"("iso_alpha_3");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_source_club_id_key" ON "clubs"("source_club_id");

-- CreateIndex
CREATE INDEX "clubs_normalized_name_idx" ON "clubs"("normalized_name");

-- CreateIndex
CREATE INDEX "club_aliases_normalized_alias_idx" ON "club_aliases"("normalized_alias");

-- CreateIndex
CREATE UNIQUE INDEX "club_aliases_club_id_normalized_alias_key" ON "club_aliases"("club_id", "normalized_alias");

-- CreateIndex
CREATE UNIQUE INDEX "players_source_player_id_key" ON "players"("source_player_id");

-- CreateIndex
CREATE INDEX "players_normalized_name_idx" ON "players"("normalized_name");

-- CreateIndex
CREATE INDEX "players_citizenship_country_id_idx" ON "players"("citizenship_country_id");

-- CreateIndex
CREATE INDEX "players_position_group_idx" ON "players"("position_group");

-- CreateIndex
CREATE INDEX "player_aliases_normalized_alias_idx" ON "player_aliases"("normalized_alias");

-- CreateIndex
CREATE UNIQUE INDEX "player_aliases_player_id_normalized_alias_key" ON "player_aliases"("player_id", "normalized_alias");

-- CreateIndex
CREATE UNIQUE INDEX "matches_source_game_id_key" ON "matches"("source_game_id");

-- CreateIndex
CREATE INDEX "matches_season_id_match_date_idx" ON "matches"("season_id", "match_date");

-- CreateIndex
CREATE INDEX "matches_home_club_id_season_id_idx" ON "matches"("home_club_id", "season_id");

-- CreateIndex
CREATE INDEX "matches_away_club_id_season_id_idx" ON "matches"("away_club_id", "season_id");

-- CreateIndex
CREATE INDEX "matches_dataset_version_id_idx" ON "matches"("dataset_version_id");

-- CreateIndex
CREATE INDEX "player_match_evidence_match_id_club_id_idx" ON "player_match_evidence"("match_id", "club_id");

-- CreateIndex
CREATE INDEX "player_match_evidence_player_id_club_id_idx" ON "player_match_evidence"("player_id", "club_id");

-- CreateIndex
CREATE INDEX "player_match_evidence_dataset_version_id_idx" ON "player_match_evidence"("dataset_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_match_evidence_player_id_match_id_evidence_type_key" ON "player_match_evidence"("player_id", "match_id", "evidence_type");

-- CreateIndex
CREATE INDEX "player_club_seasons_player_id_season_id_idx" ON "player_club_seasons"("player_id", "season_id");

-- CreateIndex
CREATE INDEX "player_club_seasons_club_id_season_id_player_id_idx" ON "player_club_seasons"("club_id", "season_id", "player_id");

-- CreateIndex
CREATE INDEX "player_club_seasons_dataset_version_id_idx" ON "player_club_seasons"("dataset_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_club_seasons_player_id_club_id_season_id_key" ON "player_club_seasons"("player_id", "club_id", "season_id");

-- CreateIndex
CREATE INDEX "club_seasons_season_id_is_champion_idx" ON "club_seasons"("season_id", "is_champion");

-- A season can have at most one champion; the QA gate verifies that it has exactly one.
CREATE UNIQUE INDEX "club_seasons_single_champion_per_season_idx"
ON "club_seasons" ("season_id")
WHERE "is_champion" = true;

-- CreateIndex
CREATE UNIQUE INDEX "club_seasons_club_id_season_id_key" ON "club_seasons"("club_id", "season_id");

-- CreateIndex
CREATE INDEX "data_overrides_target_table_target_record_id_idx" ON "data_overrides"("target_table", "target_record_id");

-- CreateIndex
CREATE INDEX "data_quality_issues_status_severity_idx" ON "data_quality_issues"("status", "severity");

-- CreateIndex
CREATE INDEX "data_quality_issues_issue_type_idx" ON "data_quality_issues"("issue_type");

-- AddForeignKey
ALTER TABLE "club_aliases" ADD CONSTRAINT "club_aliases_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_country_of_birth_id_fkey" FOREIGN KEY ("country_of_birth_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_citizenship_country_id_fkey" FOREIGN KEY ("citizenship_country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_aliases" ADD CONSTRAINT "player_aliases_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_dataset_version_id_fkey" FOREIGN KEY ("dataset_version_id") REFERENCES "dataset_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_club_id_fkey" FOREIGN KEY ("home_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_club_id_fkey" FOREIGN KEY ("away_club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_evidence" ADD CONSTRAINT "player_match_evidence_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_evidence" ADD CONSTRAINT "player_match_evidence_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_evidence" ADD CONSTRAINT "player_match_evidence_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_evidence" ADD CONSTRAINT "player_match_evidence_dataset_version_id_fkey" FOREIGN KEY ("dataset_version_id") REFERENCES "dataset_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_club_seasons" ADD CONSTRAINT "player_club_seasons_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_club_seasons" ADD CONSTRAINT "player_club_seasons_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_club_seasons" ADD CONSTRAINT "player_club_seasons_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_club_seasons" ADD CONSTRAINT "player_club_seasons_dataset_version_id_fkey" FOREIGN KEY ("dataset_version_id") REFERENCES "dataset_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_seasons" ADD CONSTRAINT "club_seasons_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_seasons" ADD CONSTRAINT "club_seasons_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
