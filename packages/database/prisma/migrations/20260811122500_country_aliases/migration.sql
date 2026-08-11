-- Preserve source, alternative and historical country names without changing canonical identity.

CREATE TABLE "country_aliases" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "alias_type" "alias_type" NOT NULL,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "source_note" TEXT,

    CONSTRAINT "country_aliases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "country_aliases_normalized_alias_idx"
ON "country_aliases"("normalized_alias");

CREATE UNIQUE INDEX "country_aliases_country_id_normalized_alias_key"
ON "country_aliases"("country_id", "normalized_alias");

ALTER TABLE "country_aliases"
ADD CONSTRAINT "country_aliases_country_id_fkey"
FOREIGN KEY ("country_id") REFERENCES "countries"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
