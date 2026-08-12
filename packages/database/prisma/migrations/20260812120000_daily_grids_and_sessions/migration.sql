-- CreateEnum
CREATE TYPE "grid_status" AS ENUM ('draft', 'approved', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "game_session_status" AS ENUM ('active', 'completed', 'expired');

-- CreateTable
CREATE TABLE "grids" (
    "id" SERIAL NOT NULL,
    "play_date" DATE NOT NULL,
    "slug" TEXT NOT NULL,
    "dataset_version_id" INTEGER NOT NULL,
    "rule_engine_version" TEXT NOT NULL,
    "difficulty_formula_version" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "status" "grid_status" NOT NULL DEFAULT 'draft',
    "row_rules" JSONB NOT NULL,
    "column_rules" JSONB NOT NULL,
    "created_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(3),
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grids_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grids_play_date_key" UNIQUE ("play_date"),
    CONSTRAINT "grids_slug_key" UNIQUE ("slug")
);

-- CreateTable
CREATE TABLE "grid_cells" (
    "id" SERIAL NOT NULL,
    "grid_id" INTEGER NOT NULL,
    "cell_key" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "answer_count" INTEGER NOT NULL,
    "answer_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grid_cells_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grid_cells_answer_count_check" CHECK ("answer_count" >= 8),
    CONSTRAINT "grid_cells_answer_hash_check" CHECK ("answer_hash" ~ '^[a-f0-9]{64}$'),
    CONSTRAINT "grid_cells_grid_id_cell_key_key" UNIQUE ("grid_id", "cell_key")
);

-- CreateTable
CREATE TABLE "grid_cell_answers" (
    "grid_cell_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grid_cell_answers_pkey" PRIMARY KEY ("grid_cell_id", "player_id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" UUID NOT NULL,
    "grid_id" INTEGER NOT NULL,
    "status" "game_session_status" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_session_cells" (
    "session_id" UUID NOT NULL,
    "grid_cell_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "filled_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_session_cells_pkey" PRIMARY KEY ("session_id", "grid_cell_id"),
    CONSTRAINT "game_session_cells_session_id_player_id_key" UNIQUE ("session_id", "player_id")
);

-- CreateTable
CREATE TABLE "game_guesses" (
    "id" SERIAL NOT NULL,
    "request_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "grid_cell_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "guessed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_guesses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_guesses_session_id_request_id_key" UNIQUE ("session_id", "request_id")
);

-- CreateIndex
CREATE INDEX "grids_status_play_date_idx" ON "grids"("status", "play_date");
CREATE INDEX "grids_dataset_version_id_idx" ON "grids"("dataset_version_id");
CREATE INDEX "grid_cells_grid_id_row_id_column_id_idx" ON "grid_cells"("grid_id", "row_id", "column_id");
CREATE INDEX "grid_cell_answers_player_id_idx" ON "grid_cell_answers"("player_id");
CREATE INDEX "game_sessions_grid_id_status_idx" ON "game_sessions"("grid_id", "status");
CREATE INDEX "game_sessions_last_seen_at_idx" ON "game_sessions"("last_seen_at");
CREATE INDEX "game_session_cells_grid_cell_id_idx" ON "game_session_cells"("grid_cell_id");
CREATE INDEX "game_guesses_session_id_guessed_at_idx" ON "game_guesses"("session_id", "guessed_at");
CREATE INDEX "game_guesses_grid_cell_id_player_id_idx" ON "game_guesses"("grid_cell_id", "player_id");

-- AddForeignKey
ALTER TABLE "grids" ADD CONSTRAINT "grids_dataset_version_id_fkey" FOREIGN KEY ("dataset_version_id") REFERENCES "dataset_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grid_cells" ADD CONSTRAINT "grid_cells_grid_id_fkey" FOREIGN KEY ("grid_id") REFERENCES "grids"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_cell_answers" ADD CONSTRAINT "grid_cell_answers_grid_cell_id_fkey" FOREIGN KEY ("grid_cell_id") REFERENCES "grid_cells"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_cell_answers" ADD CONSTRAINT "grid_cell_answers_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_grid_id_fkey" FOREIGN KEY ("grid_id") REFERENCES "grids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_session_cells" ADD CONSTRAINT "game_session_cells_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_session_cells" ADD CONSTRAINT "game_session_cells_grid_cell_id_fkey" FOREIGN KEY ("grid_cell_id") REFERENCES "grid_cells"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_session_cells" ADD CONSTRAINT "game_session_cells_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_guesses" ADD CONSTRAINT "game_guesses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_guesses" ADD CONSTRAINT "game_guesses_grid_cell_id_fkey" FOREIGN KEY ("grid_cell_id") REFERENCES "grid_cells"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_guesses" ADD CONSTRAINT "game_guesses_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Published answer snapshots and cell metadata are immutable.
CREATE FUNCTION protect_published_grid_snapshot() RETURNS trigger AS $$
DECLARE
  target_grid_status "grid_status";
BEGIN
  IF TG_TABLE_NAME = 'grid_cells' THEN
    SELECT status INTO target_grid_status
    FROM grids
    WHERE id = COALESCE(OLD.grid_id, NEW.grid_id);
  ELSE
    SELECT g.status INTO target_grid_status
    FROM grid_cells gc
    JOIN grids g ON g.id = gc.grid_id
    WHERE gc.id = COALESCE(OLD.grid_cell_id, NEW.grid_cell_id);
  END IF;

  IF target_grid_status IN ('published', 'archived') THEN
    RAISE EXCEPTION 'Published grid snapshots are immutable';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "grid_cells_immutable_after_publish"
BEFORE INSERT OR UPDATE OR DELETE ON "grid_cells"
FOR EACH ROW EXECUTE FUNCTION protect_published_grid_snapshot();

CREATE TRIGGER "grid_cell_answers_immutable_after_publish"
BEFORE INSERT OR UPDATE OR DELETE ON "grid_cell_answers"
FOR EACH ROW EXECUTE FUNCTION protect_published_grid_snapshot();
