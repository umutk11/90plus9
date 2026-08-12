-- Each anonymous daily session can consume the six-player joker once.
CREATE TABLE "game_jokers" (
    "session_id" UUID NOT NULL,
    "grid_cell_id" INTEGER NOT NULL,
    "player_ids" INTEGER[] NOT NULL,
    "used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_jokers_pkey" PRIMARY KEY ("session_id"),
    CONSTRAINT "game_jokers_six_players_check" CHECK (cardinality("player_ids") = 6)
);

CREATE INDEX "game_jokers_grid_cell_id_idx" ON "game_jokers"("grid_cell_id");

ALTER TABLE "game_jokers"
ADD CONSTRAINT "game_jokers_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_jokers"
ADD CONSTRAINT "game_jokers_grid_cell_id_fkey"
FOREIGN KEY ("grid_cell_id") REFERENCES "grid_cells"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
