#!/bin/sh
set -e
cd /app
pnpm db:push
pnpm --filter @tractus/api db:backfill-content-hash
pnpm db:seed || true
exec pnpm --filter @tractus/api start
