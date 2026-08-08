#!/usr/bin/env bash
# Dump Pandoc's default LaTeX template and install as sta-notes.latex
# so you can customize headers, fonts, answer boxes, etc.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="${1:-${ROOT}/templates}"
DEST="${DEST_DIR}/sta-notes.latex"
USER_DEST="${HOME}/.pandoc/templates/sta-notes.latex"

command -v pandoc >/dev/null 2>&1 || { echo "pandoc required"; exit 1; }

mkdir -p "$DEST_DIR" "${HOME}/.pandoc/templates"

echo "→ Writing default LaTeX template → $DEST"
pandoc -D latex > "$DEST"

# Also install user-global copy for `pandoc --template=sta-notes` from anywhere
cp "$DEST" "$USER_DEST"
echo "→ Also installed: $USER_DEST"

cat <<EOF

Edit either copy to customize:
  fonts, header/footer, colors, title page, answer-box environments, etc.

Then compile with:
  aic --template=sta-notes notes.md

Tip: keep project template under templates/ and commit it with the repo.
EOF
