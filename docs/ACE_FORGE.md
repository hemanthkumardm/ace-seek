# AceForge — Ace-Seek step-orchestrated PnR

AceForge is Ace-Seek’s **Classic** and **Chip** cloud flow profiles on top of AceFlow + OpenROAD tooling.

## Profiles (Project → Flow profile)

| Profile | Backend | Intent |
|---------|---------|--------|
| **Legacy Docker PnR** | `legacy_ol` | Existing container RTL→GDS with stage stops (default) |
| **AceForge Classic** | `ace_forge` / classic | Block harden, hermetic AceFlow steps, optional Ace-AutoMacro |
| **AceForge Chip** | `ace_forge` / chip | Full-chip intent + pad-ring Tcl hooks |

## Worker entrypoints

- `workers/openroad/prepare_ace_forge.sh`
- `workers/openroad/run_ace_forge.sh`
- `workers/engines/forge/driver.py`

Env: `ACE_FORGE_PROFILE=classic|chip`, `ACE_AUTOMACRO`, `ACE_OPENLANE_UNTIL`, `ACE_FLOW_MOCK` (demos only).

## Studio

Jobs pick up `ACE_FLOW_PROFILE` from the project. Engines panel lists AceForge as production.
