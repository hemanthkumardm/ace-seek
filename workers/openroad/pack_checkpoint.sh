#!/usr/bin/env bash
# Pack OpenLane job results into modular checkpoint directory.
# Usage: pack_checkpoint.sh <job_dir> <design_slug> <stage> [owner_id]
#
# Sprint A: checkpoints live under owners/<ownerId>/checkpoints/<slug>/
# Owner is read from job_dir/owner.json when not passed explicitly.
set -euo pipefail
JOB_DIR="${1:?}"
SLUG="${2:?}"
STAGE="${3:-unknown}"
ROOT="${OPENROAD_JOBS_DIR:-/tmp/ace-openroad-jobs}"

OWNER_ID="${4:-}"
if [[ -z "$OWNER_ID" && -f "$JOB_DIR/owner.json" ]]; then
  OWNER_ID=$(python3 -c "import json; print(json.load(open('$JOB_DIR/owner.json')).get('ownerId',''))" 2>/dev/null || true)
fi
if [[ -z "$OWNER_ID" ]]; then
  OWNER_ID="local_dev"
fi
# sanitize
OWNER_ID=$(echo "$OWNER_ID" | sed 's/[^a-zA-Z0-9_.-]/_/g' | cut -c1-64)
if [[ -z "$OWNER_ID" ]]; then
  OWNER_ID="local_dev"
fi

CKPT_ROOT="$ROOT/owners/$OWNER_ID/checkpoints"
CKPT="$CKPT_ROOT/$SLUG"
mkdir -p "$CKPT"

# Copy harvested results
if [[ -d "$JOB_DIR/results" ]]; then
  mkdir -p "$CKPT/results"
  cp -a "$JOB_DIR/results/." "$CKPT/results/" 2>/dev/null || true
fi

# Light snapshot of design run (exclude huge binaries if needed)
RUNS="$JOB_DIR/designs/ace_design/runs"
if [[ -d "$RUNS" ]]; then
  mkdir -p "$CKPT/runs"
  # copy last run tree metadata + small artifacts
  LATEST=$(ls -dt "$RUNS"/* 2>/dev/null | head -1 || true)
  if [[ -n "$LATEST" ]]; then
    rsync -a --max-size=5m \
      --include='*/' \
      --include='*.v' --include='*.def' --include='*.sdc' --include='*.rpt' \
      --include='*.json' --include='*.log' --include='*.csv' \
      --exclude='*' \
      "$LATEST/" "$CKPT/runs/ace_run/" 2>/dev/null || true
  fi
fi

python3 - <<PY
import json, os, time
ckpt = "$CKPT"
stage = "$STAGE"
owner = "$OWNER_ID"
files = []
for root, dirs, fnames in os.walk(ckpt):
    for f in fnames:
        if f == "manifest.json":
            continue
        rel = os.path.relpath(os.path.join(root, f), ckpt)
        files.append(rel)
man = {
    "version": 1,
    "stage": stage,
    "ownerId": owner,
    "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "files": sorted(files),
}
with open(os.path.join(ckpt, "manifest.json"), "w") as fp:
    json.dump(man, fp, indent=2)
print("checkpoint packed", ckpt, "files", len(files))
PY
# Per-owner LATEST only (never global)
echo "$SLUG" > "$CKPT_ROOT/LATEST"
echo "ACE-Seek: checkpoint ready stage=$STAGE owner=$OWNER_ID path=$CKPT"
