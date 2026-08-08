#!/usr/bin/env bash
# One-time system packages for aic (Ubuntu/Debian or RHEL-family).
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  SUDO="sudo"
else
  SUDO=""
fi

detect() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck source=/dev/null
    . /etc/os-release
    echo "${ID_LIKE:-$ID}"
  else
    echo unknown
  fi
}

OS_FAMILY="$(detect)"

echo "→ Detected OS family: $OS_FAMILY"

if echo "$OS_FAMILY" | grep -qiE 'debian|ubuntu'; then
  $SUDO apt-get update
  $SUDO apt-get install -y \
    pandoc \
    texlive-xetex \
    texlive-luatex \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-science \
    latexmk
elif echo "$OS_FAMILY" | grep -qiE 'rhel|fedora|centos'; then
  if command -v dnf >/dev/null 2>&1; then
    PM=dnf
  else
    PM=yum
  fi
  $SUDO $PM install -y \
    pandoc \
    texlive-xetex \
    texlive-collection-latexrecommended \
    texlive-collection-fontsrecommended \
    texlive-collection-latexextra \
    latexmk || true
  echo "Note: on RHEL, package names vary — install texlive-scheme-medium if above fails."
else
  echo "Unknown distro. Install manually:"
  echo "  pandoc, texlive-xetex, texlive-luatex, latex-extra, science packages"
  exit 1
fi

echo "→ Installing aic into ~/bin ..."
mkdir -p "${HOME}/bin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ln -sfn "${ROOT}/bin/aic" "${HOME}/bin/aic"
chmod +x "${ROOT}/bin/aic"

case ":$PATH:" in
  *":${HOME}/bin:"*) ;;
  *)
    echo "→ Add to your shell rc:  export PATH=\"\$HOME/bin:\$PATH\""
    ;;
esac

echo "→ Checking tools..."
for t in pandoc xelatex lualatex; do
  if command -v "$t" >/dev/null 2>&1; then
    echo "  ok  $t  ($($t --version 2>/dev/null | head -1))"
  else
    echo "  MISSING  $t"
  fi
done

echo "Done. Try:  aic examples/sample.md"
