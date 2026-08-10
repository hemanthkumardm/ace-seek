#!/usr/bin/env bash
# Local Mac dev: Colima Docker + Next.js web UI (compile via Docker TeX).
# Usage (from repo root):
#   ./scripts/dev-mac.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH}"

# Colima docker socket
if [[ -S "${HOME}/.colima/default/docker.sock" ]]; then
  export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
elif [[ -S "${HOME}/.colima/docker.sock" ]]; then
  export DOCKER_HOST="unix://${HOME}/.colima/docker.sock"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI missing. Install:  brew install docker colima"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "→ Starting Colima (Docker runtime)…"
  colima start --cpu 4 --memory 8 --disk 40
fi

if ! docker image inspect aic >/dev/null 2>&1; then
  echo "→ Building aic image (Pandoc + TeX, first time ~few minutes)…"
  docker build --platform linux/amd64 -t aic .
fi

export AIC_BACKEND_DEFAULT="${AIC_BACKEND_DEFAULT:-docker}"
# Prefer docker backend in the UI health / auto path
export PATH="${HOME}/.local/bin:${PATH}"

echo "→ Docker OK · image aic present"
echo "→ Starting Next.js at http://localhost:3000"
echo "   Doc Compiler: http://localhost:3000/tools/doc-compiler"
echo "   Backend: Docker (no host TeX needed)"
echo ""

cd "$ROOT/web"
if [[ ! -d node_modules ]]; then
  npm install
fi
exec npm run dev
