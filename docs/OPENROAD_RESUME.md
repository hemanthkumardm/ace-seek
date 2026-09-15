# OpenROAD Studio — resume policy (no silent rebuild)

## Rules

| Action | Behavior |
|--------|----------|
| **Continue / Run next** | `ACE_FORCE_FRESH=0` — resume `ace_run` if it exists |
| **Fresh rebuild…** | Confirm dialog → `ACE_FORCE_FRESH=1` — wipe and prep |
| First run (no `ace_run`) | Fresh prep allowed without force |
| Resume broken + strict | Job **fails** with `RESUME_REQUIRED_FAILED` — no silent overwrite |

Env (workers):

- `ACE_OPENLANE_OVERWRITE` — set only for explicit fresh
- `ACE_RESUME_STRICT` — default `1` (fail if resume cannot load `config.tcl`)

## Logs to look for

- `RESUME_OK` — continued without wipe  
- `FRESH_PREP` — new or explicit wipe  
- `RESUME_REQUIRED_FAILED` — fix by Fresh rebuild or repair job dir  
