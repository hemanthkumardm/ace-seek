# OpenROAD Studio — Engine honesty map

| Engine | Status | Cloud Studio |
|--------|--------|--------------|
| **Legacy Docker PnR** | production | Default Max path (`mode=container`) |
| **AceForge Classic / Chip** | production | Project → Flow profile; AceFlow steps + pad-ring (Chip) |
| **Ace-AutoMacro** (`macro_placer`) | production | Floorplan hook when macros exist; `ACE_AUTOMACRO=0/1` + halo X/Y on Floorplan stage |
| **EQY LEC** | production (fail-closed) | Studio **Run EQY** when `eqy` on PATH; else export/`make lec-*`; AceForge opt-in `ACE_FORGE_LEC=1` |
| **PnR coach** | production | Signoff Log tab tips from logs + metrics |
| **PPAOptimizer / Ace-Matrix** | **model_dse** | Analytic only — prefer **Measured DSE** in Studio |
| **Measured DSE** | production | 3 real jobs → Pareto from extracted metrics |
| **IHP SG13G2** | catalog | Project PDK `ihp-sg13g2` (ORFS platform; install under `OPENROAD_FLOW_ROOT`) |
| **timing_optimizer** | **stub** | Not shipped |
| **congestion_resolver** | **stub** | Not shipped (RUDY inside AutoMacro) |

API: `GET /api/openroad/engines` · `POST/GET /api/openroad/eqy` · Compare/DSE as in `OPENROAD_COMPARE_DSE.md`  
UI: Studio → **Engines** · **Compare & DSE** · Signoff **PnR coach** / **Formal LEC** · Project → **Flow profile** / PDK  
See also: `docs/ACE_FORGE.md` · `docs/marketing/LINKEDIN_REWRITE.md`
