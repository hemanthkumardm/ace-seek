#!/usr/bin/env bash
# Ace-Seek: Open a real OpenROAD ODB in Docker GUI (streamed over Web VNC / noVNC).
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
VNC_DISPLAY="${ACE_VNC_DISPLAY:-:99}"
VNC_PORT="${ACE_VNC_PORT:-5900}"
NOVNC_PORT="${ACE_NOVNC_PORT:-6080}"
ODB_DIR="$(dirname "$ODB")"
ODB_BN="$(basename "$ODB")"

log() {
  if [[ -n "$LOG" ]]; then
    echo "[$(date -Iseconds)] $*" | tee -a "$LOG"
  else
    echo "[$(date -Iseconds)] $*"
  fi
}

# 1. Start virtual display Xvfb (:99) if not already active
if ! pgrep -f "Xvfb.*${VNC_DISPLAY}" >/dev/null 2>&1; then
  if command -v Xvfb >/dev/null 2>&1; then
    log "Starting Xvfb on display ${VNC_DISPLAY} (1920x1080x24)..."
    Xvfb "${VNC_DISPLAY}" -screen 0 1920x1080x24 -nolisten tcp &
    sleep 1
  fi
fi

# 2. Start lightweight window manager if available
if command -v fluxbox >/dev/null 2>&1 && ! pgrep -f "fluxbox" >/dev/null 2>&1; then
  DISPLAY="${VNC_DISPLAY}" fluxbox &
  sleep 0.5
fi

# 3. Start x11vnc on port 5900 if not already running
if command -v x11vnc >/dev/null 2>&1 && ! pgrep -f "x11vnc.*${VNC_DISPLAY}" >/dev/null 2>&1; then
  log "Starting x11vnc server on port ${VNC_PORT}..."
  x11vnc -display "${VNC_DISPLAY}" -forever -shared -nopw -rfbport "${VNC_PORT}" -bg 2>/dev/null || true
fi

# 4. Start websockify / noVNC on port 6080
if ! pgrep -f "websockify.*${NOVNC_PORT}" >/dev/null 2>&1; then
  NOVNC_DIR="/usr/share/novnc"
  if [[ ! -d "$NOVNC_DIR" && -d "/usr/share/novnc-core" ]]; then
    NOVNC_DIR="/usr/share/novnc-core"
  fi
  WEBSOCKIFY_BIN=""
  if command -v websockify >/dev/null 2>&1; then
    WEBSOCKIFY_BIN="websockify"
  elif python3 -m websockify --help >/dev/null 2>&1; then
    WEBSOCKIFY_BIN="python3 -m websockify"
  fi

  if [[ -n "$WEBSOCKIFY_BIN" ]]; then
    log "Starting websockify noVNC bridge on 0.0.0.0:${NOVNC_PORT}..."
    if [[ -d "$NOVNC_DIR" ]]; then
      $WEBSOCKIFY_BIN --web "$NOVNC_DIR" "0.0.0.0:${NOVNC_PORT}" "localhost:${VNC_PORT}" &
    else
      $WEBSOCKIFY_BIN "0.0.0.0:${NOVNC_PORT}" "localhost:${VNC_PORT}" &
    fi
  elif command -v novnc_proxy >/dev/null 2>&1; then
    log "Starting novnc_proxy on port ${NOVNC_PORT}..."
    novnc_proxy --vnc "localhost:${VNC_PORT}" --listen "${NOVNC_PORT}" &
  else
    log "WARNING: websockify not found"
  fi
fi

# 5. Create ODB startup TCL script directly inside $ODB_DIR so it mounts seamlessly
TCL_FILE="${ODB_DIR}/.open_${ODB_BN}.tcl"
cat >"$TCL_FILE" <<EOF
# Ace-Seek — load ODB in OpenROAD GUI
puts "ACE-Seek: Loading ODB /odb/$ODB_BN into OpenROAD GUI..."
if {[catch { read_db /odb/$ODB_BN } err]} {
  puts "ACE-Seek ERROR loading ODB: \$err"
} else {
  puts "ACE-Seek: ODB /odb/$ODB_BN loaded successfully. Inspect IO pins, PDN core rings, and cell placements."
}
EOF

# Allow local Docker to write to the X11 socket
if command -v xhost >/dev/null 2>&1; then
  DISPLAY="${VNC_DISPLAY}" xhost +local:docker >/dev/null 2>&1 || true
  DISPLAY="${VNC_DISPLAY}" xhost +local:root >/dev/null 2>&1 || true
fi

log "Launching OpenROAD GUI in Docker..."
log "  odb=$ODB"
log "  display=${VNC_DISPLAY}"
log "  image=$IMAGE"
log "  noVNC port=${NOVNC_PORT}"

# Execute OpenROAD GUI attached to the virtual display
exec docker run --rm \
  --name "ace-openroad-gui-$$-$(date +%s)" \
  -e DISPLAY="${VNC_DISPLAY}" \
  -e QT_X11_NO_MITSHM=1 \
  -v /tmp/.X11-unix:/tmp/.X11-unix:rw \
  -v "$ODB_DIR:/odb:rw" \
  --entrypoint openroad \
  "$IMAGE" \
  -gui -no_splash "/odb/.open_${ODB_BN}.tcl"
