#!/usr/bin/env bash

set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker bulunamadı. Önce Docker Desktop'ı kurup açın."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker çalışmıyor. Docker Desktop'ı açıp hazır olmasını bekleyin."
  exit 1
fi

bash scripts/database/compose.sh up --detach --wait
bash scripts/database/check-connection.sh
