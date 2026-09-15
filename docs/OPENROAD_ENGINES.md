# OpenROAD Studio — Engine honesty map

| Engine | Status | Cloud Studio |
|--------|--------|--------------|
| **OpenLane Docker** | production | Primary Max path (`mode=container`) |
| **Ace-AutoMacro** (`macro_placer`) | production | Floorplan hook when macros exist; `ACE_AUTOMACRO=0/1` |
| **EQY LEC** | production (local/export) | Script preview in Studio — not a fake prove |
| **PPAOptimizer / Ace-Matrix** | **model_dse** | Analytic sweep — not live multi-OpenLane DSE |
| **timing_optimizer** | **stub** | Not shipped |
| **congestion_resolver** | **stub** | Not shipped (RUDY inside AutoMacro) |

API: `GET /api/openroad/engines`  
UI: Studio → **Engines** panel (status + AutoMacro toggle)
