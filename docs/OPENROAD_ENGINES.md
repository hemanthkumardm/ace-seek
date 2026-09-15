# OpenROAD Studio — Engine honesty map

| Engine | Status | Cloud Studio |
|--------|--------|--------------|
| **Legacy Docker PnR** | production | Default Max path (`mode=container`) |
| **AceForge Classic / Chip** | production | Project → Flow profile; AceFlow steps + pad-ring (Chip) |
| **Ace-AutoMacro** (`macro_placer`) | production | Floorplan hook when macros exist; `ACE_AUTOMACRO=0/1` |
| **EQY LEC** | production (local/export) | Script preview in Studio — not a fake prove |
| **PPAOptimizer / Ace-Matrix** | **model_dse** | Analytic sweep — not live multi-run DSE |
| **timing_optimizer** | **stub** | Not shipped |
| **congestion_resolver** | **stub** | Not shipped (RUDY inside AutoMacro) |

API: `GET /api/openroad/engines`  
UI: Studio → **Engines** panel · Project → **Flow profile**  
See also: `docs/ACE_FORGE.md`
