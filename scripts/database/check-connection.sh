#!/usr/bin/env bash

set -euo pipefail

check_migration_connection() {
  local database_name="$1"

  bash scripts/database/compose.sh exec --no-TTY \
    --env PGPASSWORD=plus9_migrator_local \
    postgres \
    psql \
    --host 127.0.0.1 \
    --username plus9_migrator \
    --dbname "$database_name" \
    --no-psqlrc \
    --set ON_ERROR_STOP=1 \
    --tuples-only \
    --command "SELECT current_database(), current_user;"
}

check_database() {
  local database_name="$1"
  local can_create

  bash scripts/database/compose.sh exec --no-TTY \
    --env PGPASSWORD=plus9_app_local \
    postgres \
    psql \
    --host 127.0.0.1 \
    --username plus9_app \
    --dbname "$database_name" \
    --no-psqlrc \
    --set ON_ERROR_STOP=1 \
    --tuples-only \
    --command "SELECT current_database(), current_user;"

  can_create="$(
    bash scripts/database/compose.sh exec --no-TTY \
      --env PGPASSWORD=plus9_app_local \
      postgres \
      psql \
      --host 127.0.0.1 \
      --username plus9_app \
      --dbname "$database_name" \
      --no-psqlrc \
      --set ON_ERROR_STOP=1 \
      --tuples-only \
      --no-align \
      --command "SELECT has_schema_privilege(current_user, 'public', 'CREATE');" \
      | tr -d '[:space:]'
  )"

  if [[ "$can_create" != "f" ]]; then
    echo "plus9_app kullanıcısının şema oluşturma yetkisi olmamalı: $database_name"
    exit 1
  fi
}

check_migration_connection "90plus9"
check_migration_connection "90plus9_test"
check_database "90plus9"
check_database "90plus9_test"

echo "Local PostgreSQL bağlantıları hazır."
