#!/usr/bin/env bash
# Open a real OpenROAD ODB in Docker GUI (accurate layout viewer).
# Usage: open_odb_gui.sh <path-to.odb> [log_file]
set -euo pipefail

ODB="${1:?odb path required}"
LOG="${2:-}"
ODB="$(cd "$(dirname "$ODB")" && pwd)/$(basename "$ODB")"

if [[ ! -f "$ODB" ]]; then
  echo "ERROR: ODB not found: $ODB" >&2
  exit 2
fi

IMAGE="${OPENLANE_IMAGE:-efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a}"
DISPLAY_ENV="${DISPLAY:-:0}"
ODB_DIR="$(dirname "$ODB")"
ODB_BN="$(basename "$ODB")"
WORKDIR="$(mktemp -d /tmp/ace-odb-gui.XXXXXX)"
TCL="$WORKDIR/open_odb.tcl"

cat >"$TCL" <<EOF
# Ace-Seek — open ODB in OpenROAD GUI
puts "ACE-Seek: reading ODB /odb/$ODB_BN"
read_db /odb/$ODB_BN
puts "ACE-Seek: ODB loaded — use OpenROAD GUI to inspect IO/taps/PDN/cells"
EOF

log() {
  if [[ -n "$LOG" ]]; then
    echo "[$(date -Iseconds)] $*" | tee -a "$LOG"
  else
    echo "[$(date -Iseconds)] $*"
  fi
}

log "Opening ODB in OpenROAD GUI"
log "  odb=$ODB"
log "  display=$DISPLAY_ENV"
log "  image=$IMAGE"

# Allow local docker to use X11 (best-effort; ignore failure)
if command -v xhost >/dev/null 2>&1; then
  xhost +local:docker >/dev/null 2>&1 || xhost +local:root >/dev/null 2>&1 || true
fi

# Run GUI (foreground in this script; caller may background)
exec docker run --rm \
  --name "ace-openroad-gui-$$" \
  -e DISPLAY="$DISPLAY_ENV" \
  -e QT_X11_NO_MITSHM=1 \
  -v /tmp/.X11-unix:/tmp/.X11-unix:rw \
  -v "$ODB_DIR:/odb:ro" \
  -v "$TCL:/odb_scripts/open_odb.tcl:ro" \
  --entrypoint openroad \
  "$IMAGE" \
  -gui -no_splash /odb_scripts/open_odb.tcl
