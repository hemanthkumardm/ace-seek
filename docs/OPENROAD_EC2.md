# OpenROAD on EC2 — Sprint A multi-tenant readiness

Ace-Seek OpenROAD jobs are **owner-isolated** before shared hosting. Use this checklist when bringing up the ASIC Studio runner on EC2 (after product completion).

## Disk layout

Set a **durable** jobs root on EBS (never `/tmp` in production):

```bash
sudo mkdir -p /data/ace-openroad-jobs /data/volare
sudo chown -R ubuntu:ubuntu /data   # or ec2-user
export OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
export PDK_ROOT=/data/volare
```

Tree created at runtime:

```text
$OPENROAD_JOBS_DIR/
  owners/<ownerId>/
    jobs/<jobId|ol_design_top>/     # OpenLane work dirs + owner.json
    checkpoints/<design_slug>/      # synth / stage snapshots
    checkpoints/LATEST              # per-owner only (no global LATEST)
    uploads/<odb_upload_id>/        # uploaded ODBs
```

`ownerId` comes from the issued API key’s user id (Clerk/HMAC), or `key_<sha256>` for legacy keys. Local empty-key runs use `local_dev` only when `NODE_ENV !== production`.

## Required env (production)

```env
NODE_ENV=production
OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
OPENROAD_RUNNER_ENABLED=1
PDK_ROOT=/data/volare
PDK=sky130A
OPENLANE_IMAGE=efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a
ACE_TOOLS_MODE=auto
# Optional: ACE_TOOLS_MODE=host after apt install verilator iverilog yosys
```

**Fail-closed:** if `OPENROAD_JOBS_DIR` is unset or under `/tmp` while `NODE_ENV=production`, OpenROAD APIs return **503**.

## Isolation guarantees (Sprint A)

| Surface | Behavior |
|---------|----------|
| Job start (`/api/openroad/stage`, `/run`) | Writes under `owners/<id>/jobs/` |
| Job poll / artifact download | Requires `x-api-key` (or `?apiKey=`); only that owner’s jobs |
| Checkpoints | Per-owner path + `LATEST`; no shared global pointer |
| ODB open / upload | Paths must be under caller’s owner tree |

Cross-tenant job IDOR and shared `ol_<design>_<top>` collisions are blocked by the owner namespace.

## Queue + concurrency (Sprint 2)

OpenLane jobs are **queued on disk** (`status.json` = `queued`) and dispatched when under caps. Defaults for a single EC2 host:

| Env | Default | Role |
|-----|---------|------|
| `OPENROAD_MAX_CONCURRENT_JOBS` | `1` | Host-wide OpenLane/Docker cap |
| `OPENROAD_MAX_CONCURRENT_PER_OWNER` | `1` | Fairness across tenants |
| `OPENROAD_MAX_QUEUED_PER_OWNER` | `3` | Backpressure → HTTP **429** |
| `OPENROAD_MAX_QUEUED_GLOBAL` | `10` | Protect disk / dispatcher |
| `OPENROAD_QUEUE_DISPATCH_MS` | `2000` | Periodic dispatch wake |

Same resume dir (`ol_<design>_<top>`) while already queued/running → **409**. Diagnostics: `GET /api/openroad/run` → `runner.queue`.

## EC2 bootstrap sketch

```bash
# 1) Docker + app user in docker group
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker ubuntu

# 2) Durable volumes (prefer separate EBS mounted at /data)
sudo mkdir -p /data/ace-openroad-jobs /data/volare
sudo chown -R ubuntu:ubuntu /data

# 3) PDK
pip install volare
volare enable --pdk sky130 --pdk-root /data/volare

# 4) Pull OpenLane image once
docker pull efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a

# 5) App env
cd ~/ace-seek/web
cp .env.example .env.local
# edit: OPENROAD_JOBS_DIR, PDK_ROOT, Clerk, Supabase, …

# 6) Smoke
curl -s -H "x-api-key: $ACE_KEY" http://127.0.0.1:3000/api/openroad/pdks | jq '.jobsRoot,.jobsRootError'
```

Expect `jobsRoot` = `/data/ace-openroad-jobs` and `jobsRootError` = null.

## Security group / ports

| Port | Purpose |
|------|---------|
| 22 | SSH |
| 80 / 443 | Next.js (or Caddy/nginx reverse proxy) |
| — | Do **not** expose Docker daemon |

ODB GUI needs `DISPLAY` / X11 on the **interactive** workstation path; headless EC2 API runs do not need GUI.

## EC2 smoke checklist

On the host (after Docker + PDK + env):

```bash
cd /path/to/ace-seek
export OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
export PDK_ROOT=/data/volare
export PDK=sky130A
# optional API ping:
export ACE_KEY='your_issued_key'
export BASE_URL=http://127.0.0.1:3000

bash scripts/ec2-smoke-openroad.sh
```

Expect `FAIL=0`. Then run one Studio stage (lint → synth → floorplan) and confirm
`owners/<id>/jobs/` appears under `$OPENROAD_JOBS_DIR`.

Live job logs: Studio uses **SSE** at `/api/openroad/jobs/:id/stream` (falls back
to 2.5s poll). Pass `?apiKey=` for EventSource auth.

## Sprint 3 add-ons

| Feature | Env / doc |
|---------|-----------|
| Dual-synth skip | Automatic when owner checkpoint has `synth_netlist.v` |
| S3/R2 artifact offload | `OPENROAD_ARTIFACT_S3_BUCKET` (+ optional endpoint/keys) |
| External queue worker | `OPENROAD_QUEUE_EXTERNAL=1` + `workers/openroad/queue_worker.mjs` — see `docs/OPENROAD_K8S.md` |

## Later

- Redis/Postgres job table
- Multi-dispatcher RWX flock redesign
- Admin “impersonate owner” tooling

## Related

- `web/src/lib/openroad-owner.ts` — identity + path helpers
- `workers/openroad/README.md` — runner scripts
- `docs/OPENROAD_PLATFORM.md` — product flow
