#!/usr/bin/env bash
# Install a FAST local PDF path for small markdown files (no full TeX Live).
# - tectonic (static musl binary) → ~/.local/bin/tectonic
# - ensures pandoc exists
set -euo pipefail

DEST="${HOME}/.local/bin"
mkdir -p "$DEST"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "→ pandoc missing — install with: sudo apt install -y pandoc"
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y pandoc
  fi
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ASSET="tectonic-0.17.0-x86_64-unknown-linux-musl.tar.gz" ;;
  aarch64|arm64) echo "Install tectonic for arm64 from GitHub releases manually."; exit 1 ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

URL="https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.17.0/${ASSET}"
TMP="$(mktemp -d)"
echo "→ Downloading tectonic (musl, works on older glibc)…"
curl -fsSL "$URL" -o "$TMP/tectonic.tgz"
tar -xzf "$TMP/tectonic.tgz" -C "$TMP"
install -m 755 "$TMP/tectonic" "$DEST/tectonic"
rm -rf "$TMP"

echo "→ Installed: $DEST/tectonic  ($("$DEST/tectonic" --version))"
case ":$PATH:" in
  *":$DEST:"*) ;;
  *)
    echo "→ Add to PATH (shell rc):  export PATH=\"\$HOME/.local/bin:\$PATH\""
    ;;
esac

export PATH="$DEST:$PATH"
echo "→ Smoke test (first run may download TeX packages, 1–3 min once)…"
SMOKE="$(mktemp -d)"
printf '# Smoke\n\nHello $x=1$.\n' > "$SMOKE/t.md"
if pandoc "$SMOKE/t.md" -o "$SMOKE/t.pdf" --pdf-engine=tectonic 2>"$SMOKE/log"; then
  echo "→ OK: $SMOKE/t.pdf ($(wc -c <"$SMOKE/t.pdf") bytes)"
  echo "→ Next small compiles should take ~5–15s on this machine."
else
  echo "→ Smoke failed — log:"
  tail -30 "$SMOKE/log" || true
  exit 1
fi

echo ""
echo "Done. Try:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "  aic --backend=local --engine=tectonic --no-toc notes.md"
echo "  # or from web UI: Backend = Auto / Local"
