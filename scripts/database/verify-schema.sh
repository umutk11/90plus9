#!/usr/bin/env bash

set -euo pipefail

case "${PLUS9_ENVIRONMENT:-test}" in
  local | test) ;;
  *)
    echo "Şema doğrulaması yalnızca local veya test ortamında çalışabilir."
    exit 1
    ;;
esac

if [[ ! -f .env ]]; then
  echo ".env bulunamadı. Önce .env.example dosyasını kopyalayın."
  exit 1
fi

set -a
source .env
set +a

if [[ -z "${TEST_DATABASE_URL:-}" || "$TEST_DATABASE_URL" != *"/90plus9_test"* ]]; then
  echo "TEST_DATABASE_URL yalnızca 90plus9_test veritabanını hedeflemelidir."
  exit 1
fi

DATABASE_URL="$TEST_DATABASE_URL" pnpm --filter @90plus9/database exec prisma migrate deploy

bash scripts/database/compose.sh exec --no-TTY \
  --env PGPASSWORD=plus9_migrator_local \
  postgres \
  psql \
  --host 127.0.0.1 \
  --username plus9_migrator \
  --dbname 90plus9_test \
  --no-psqlrc \
  --set ON_ERROR_STOP=1 \
  --file - \
  < scripts/database/verify-schema.sql

echo "Test veritabanı migration ve şema doğrulaması başarılı."
