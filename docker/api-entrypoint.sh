#!/bin/sh
set -e
cd /app
pnpm db:push
pnpm db:seed:force || pnpm db:seed || true
exec pnpm --filter @tractus/api start
