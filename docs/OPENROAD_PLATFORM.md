# OpenROAD Peer Platform

**Host:** `openroad.ace-seek.com` → `/openroad`  
**Authoring:** `vlsi.ace-seek.com` (SDC / MMMC → OpenROAD-format handoff)

## Product flow

```text
1. VLSI studios          author SDC + MMMC (+ optional RTL)
2. /vlsi/openroad-export download constraints.sdc, corners.tcl, manifest zip
3. openroad.ace-seek.com upload on Project
4. Pro  → Scripts        full Yosys / OpenSTA / OpenROAD pack + docker-run.sh
5. Max  → Run            dry_run (live) or container (workers when provisioned)
```

## Plans

| Tier | OpenROAD |
|------|----------|
| Free | VLSI handoff export only (SDC Studio) |
| Pro  | Project + Scripts |
| Max  | + Run jobs (OpenLane Docker **synth → GDS**) |
| Team | Max + seats |

## Real Docker runner (synth → GDS)

Worker scripts live in `workers/openroad/`:

- `prepare_design.sh` — OpenLane design tree + `config.json`
- `run_openlane.sh` — Docker OpenLane (`flow.tcl`) full flow through Magic/KLayout GDS

Local requirements (verified on this machine):

- Image: `efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a`
- PDK: `$HOME/.volare/sky130A`

Env (see `web/.env.local` / `docs/OPENROAD_EC2.md`):

```env
OPENROAD_RUNNER_ENABLED=1
PDK_ROOT=/home/hemanth/.volare
PDK=sky130A
OPENLANE_IMAGE=efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a
# Local ok; EC2 production MUST use durable EBS (not /tmp):
# OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
```

**Sprint A isolation:** jobs/checkpoints/uploads live under
`OPENROAD_JOBS_DIR/owners/<ownerId>/…`. APIs require `x-api-key` and refuse
cross-tenant job/ODB access. Production fails closed if `OPENROAD_JOBS_DIR` is
missing or under `/tmp`.

Optional remote (`/root/logiclance` on a worker host):

```env
OPENROAD_SSH_HOST=164.52.192.156
OPENROAD_SSH_USER=root
OPENROAD_SSH_KEY=/path/to/key
OPENROAD_SSH_REMOTE_DIR=/root/logiclance/ace-openroad-jobs
```

API: `POST /api/openroad/run` `{ mode: "container" }` → poll `GET /api/openroad/jobs/:id` → download `?download=top.gds`.

## Env

```env
NEXT_PUBLIC_OPENROAD_URL=https://openroad.ace-seek.com
```

## APIs

- `POST /api/openroad/export-pack` — Pro script file list
- `POST /api/openroad/run` — Max job (dry_run | container)

## Disclaimer

Open PDK / educational and prototype automation. Not a foundry tapeout signoff substitute.
