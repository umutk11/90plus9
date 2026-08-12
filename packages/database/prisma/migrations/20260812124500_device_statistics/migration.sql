-- Keep a stable anonymous device identity across daily game sessions.
ALTER TABLE "game_sessions" ADD COLUMN "device_id" UUID;

-- Existing sessions become the first known device identity for themselves.
UPDATE "game_sessions" SET "device_id" = "id" WHERE "device_id" IS NULL;

ALTER TABLE "game_sessions" ALTER COLUMN "device_id" SET NOT NULL;

CREATE UNIQUE INDEX "game_sessions_device_id_grid_id_key"
ON "game_sessions"("device_id", "grid_id");

CREATE INDEX "game_sessions_device_id_status_idx"
ON "game_sessions"("device_id", "status");
