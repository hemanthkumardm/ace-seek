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
| Max  | + Run jobs |
| Team | Max + seats |

## Env

```env
NEXT_PUBLIC_OPENROAD_URL=https://openroad.ace-seek.com
```

## APIs

- `POST /api/openroad/export-pack` — Pro script file list
- `POST /api/openroad/run` — Max job (dry_run | container)

## Disclaimer

Open PDK / educational and prototype automation. Not a foundry tapeout signoff substitute.
