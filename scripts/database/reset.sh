#!/usr/bin/env bash

set -euo pipefail

case "${PLUS9_ENVIRONMENT:-local}" in
  local | test) ;;
  *)
    echo "Veritabanı sıfırlama yalnızca local veya test ortamında çalışabilir."
    exit 1
    ;;
esac

if [[ "${CONFIRM_DATABASE_RESET:-}" != "90plus9-local" ]]; then
  echo "Bu işlem local veritabanı verilerini siler."
  echo "Onaylamak için CONFIRM_DATABASE_RESET=90plus9-local değerini kullanın."
  exit 1
fi

bash scripts/database/compose.sh down --volumes --remove-orphans
bash scripts/database/start.sh
