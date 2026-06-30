#!/usr/bin/env bash
# One-shot deploy on Oracle VM (Ubuntu). Run after DuckDNS points at this host.
set -euo pipefail

DOMAIN="${DOMAIN:-tractus-devesh.duckdns.org}"
REPO_URL="${REPO_URL:-https://github.com/deveshmaurya1996/TractUs.git}"
APP_DIR="${APP_DIR:-$HOME/Tract-Us}"

echo "==> Ensuring swap (1 GB RAM instances need this for Docker builds)"
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "==> Installing Docker (if missing)"
if ! command -v docker >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y git docker.io docker-compose-v2
  sudo usermod -aG docker "$USER"
  echo "Docker installed. Log out and back in, then re-run this script."
  exit 0
fi

echo "==> Cloning or updating repo"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

echo "==> Writing .env"
cat > .env <<EOF
DOMAIN=${DOMAIN}
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api
NEXT_PUBLIC_SOCKET_URL=https://${DOMAIN}
API_PUBLIC_URL=https://${DOMAIN}
EOF

echo "==> Checking ports 80 and 443 are free"
if sudo ss -tlnp | grep -qE ':80 |:443 '; then
  echo "ERROR: Port 80 or 443 is already in use. Stop the other service or change Caddy ports."
  sudo ss -tlnp | grep -E ':80|:443' || true
  exit 1
fi

echo "==> Building and starting stack (may take 15-20 min on 1 GB RAM)"
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml up --build -d

echo ""
echo "Deploy started. Wait 1-2 minutes for HTTPS, then open:"
echo "  App:     https://${DOMAIN}"
echo "  Swagger: https://${DOMAIN}/api/docs"
echo ""
echo "Logs: docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml logs -f"
