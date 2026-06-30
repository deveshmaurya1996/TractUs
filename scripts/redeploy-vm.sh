#!/usr/bin/env bash
# Pull latest master and rebuild production containers on the VM.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/Tract-Us}"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml"

cd "$APP_DIR"
git fetch origin master
git checkout master
git pull --ff-only origin master

$COMPOSE up --build -d
$COMPOSE ps

echo "Redeploy complete."
