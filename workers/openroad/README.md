# Ace-Seek OpenROAD / OpenLane worker

Full **RTL → synth → floorplan → place → CTS → route → GDS** via **OpenLane Docker**.

## mflowgen-inspired upgrades (Ace-Seek)

- **Stage nodes** (`web/src/lib/openroad-stage-nodes.ts`): each stage declares inputs/outputs/tool + pre/post assertions
- **Flow checkpoints** (`OPENROAD_JOBS_DIR/owners/<ownerId>/checkpoints/<design_slug>/`): after Yosys synth and each OpenLane stage; enables resume without full rebuild (per-tenant; no global LATEST)
- **pack_checkpoint.sh**: snapshots OpenLane job results into the owner checkpoint tree (reads `owner.json`)
- Assertions surface in Studio **Sanity** + stage panel
- **Sprint A:** job dirs are `owners/<ownerId>/jobs/…` — see `docs/OPENROAD_EC2.md`

## Server / AWS EC2 — tools mode

```bash
# ACE_TOOLS_MODE=host|docker|auto  (default auto)
#   host  — light EC2: native verilator / iverilog / yosys
#   docker— OpenLane/tools image for lint/sim/synth
#   auto  — use host if complete, else Docker
```

### Light EC2 (recommended for lint/sim/synth)

```bash
sudo apt update && sudo apt install -y verilator iverilog yosys python3-pip
export ACE_TOOLS_MODE=host
export PDK_ROOT=/opt/volare
pip install volare && volare enable --pdk sky130 --pdk-root $PDK_ROOT
# PnR still needs Docker + OPENROAD_RUNNER_ENABLED=1 when users run floorplan+
```

| Stage | host mode | docker mode |
|--------|-----------|-------------|
| Lint | host `verilator` | tools image |
| Simulation | host `iverilog`+`vvp` | tools image |
| Synthesis | host `yosys` + liberty | tools image |
| Floorplan → GDS | always OpenLane Docker | same |

### Heavy / identical envs (all frontend in Docker)

```bash
export ACE_TOOLS_MODE=docker
export OPENROAD_RUNNER_ENABLED=1
export OPENLANE_IMAGE=efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a
export ACE_TOOLS_IMAGE=$OPENLANE_IMAGE
export PDK_ROOT=/data/volare
export OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
# app user in docker group
pip install volare && volare enable --pdk sky130 --pdk-root $PDK_ROOT
```

Diagnostics: `GET /api/openroad/pdks` → `tools` object (`effectiveMode`, host binaries, docker).

## Local requirements

- Docker image: `efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a`
- OpenLane PDKs under `$PDK_ROOT` (default `~/.volare`):
  - **sky130A** / **sky130B** — `volare enable --pdk sky130`
  - **gf180mcuD** (or C/B/A) — `volare enable --pdk gf180mcu`
- ORFS platforms (asap7, nangate45): set `OPENROAD_FLOW_ROOT` to an OpenROAD-flow-scripts tree

## Multi-PDK

| Project preset | Runner | Needs |
|----------------|--------|--------|
| sky130 | OpenLane Docker | `~/.volare/sky130A` |
| sky130B | OpenLane Docker | `~/.volare/sky130B` |
| gf180mcu | OpenLane Docker | `~/.volare/gf180mcuD` (etc.) |
| asap7 | ORFS (`run_orfs.sh`) | `OPENROAD_FLOW_ROOT` + `platforms/asap7` |
| nangate45 | ORFS | `OPENROAD_FLOW_ROOT` + `platforms/nangate45` |
| generic | Scripts only | — |

The UI never remaps other PDKs to sky130A. Missing PDK fails with install hints.

Probe: `GET /api/openroad/pdks`

## Run a job manually

```bash
export PDK_ROOT=$HOME/.volare
export PDK=sky130A
JOB=/tmp/ace-or-demo
rm -rf "$JOB" && mkdir -p "$JOB/input"
# put rtl.v + constraints.sdc into $JOB/input
./prepare_design.sh "$JOB" mychip top sky130A
./run_openlane.sh "$JOB"
ls "$JOB/results"   # *.gds, *.def, reports
```

## Remote logiclance host

```bash
export OPENROAD_SSH_HOST=164.52.192.156
export OPENROAD_SSH_USER=root
export OPENROAD_SSH_KEY=~/.ssh/YOUR_KEY_FOR_THAT_HOST
export OPENROAD_SSH_REMOTE_DIR=/root/logiclance/ace-openroad-jobs
./run_openlane.sh "$JOB"
```

If SSH key is installed, the worker rsyncs the design, runs Docker (or `/root/logiclance/run_openlane.sh` if present), and pulls results.

**Note:** This environment currently has **no authorized key** for `root@164.52.192.156`. Add the machine’s public key to the server, then set the env vars above.

## Next.js / Max plan

Set in `.env.local` / process:

```env
OPENROAD_RUNNER_ENABLED=1
PDK_ROOT=/home/hemanth/.volare
PDK=sky130A
OPENLANE_IMAGE=efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a
OPENLANE_TIMEOUT=3600
# Local default under /tmp is fine; EC2 production:
# OPENROAD_JOBS_DIR=/data/ace-openroad-jobs
# optional remote:
# OPENROAD_SSH_HOST=164.52.192.156
# OPENROAD_SSH_USER=root
# OPENROAD_SSH_KEY=/path/to/key
```

API: `POST /api/openroad/run` with `mode: "container"` + `x-api-key` starts a
real job under that owner’s namespace. Poll `GET /api/openroad/jobs/:id` with the
same key.
