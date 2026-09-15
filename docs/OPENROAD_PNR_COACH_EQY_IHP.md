# PnR coach · EQY Studio job · IHP · AutoMacro stage UI

## PnR coach

- Signoff Log tab shows actionable tips from stage logs + job metrics.
- Pure helper: `web/src/lib/openroad-pnr-coach.ts` · UI: `OpenroadPnrCoach`.

## EQY (fail-closed)

1. Studio → Formal LEC → **Run EQY (Max)**
2. `POST /api/openroad/eqy` `{ project, mode }`
3. If `eqy` is on PATH → run and parse; never invent `equivalent=true`
4. If missing → `status=unavailable` with export / `make lec-*` guidance
5. AceForge: Engines → **AceForge LEC** sets `ACE_FORGE_LEC=1`

## AutoMacro stage UI

- Floorplan stage fields: `ACE_AUTOMACRO`, `ACE_AUTOMACRO_HALO_X/Y`
- Passed as env into OpenLane / AceForge containers (not OpenLane `config.json`)
- Engines panel still has the global ON/OFF toggle

## IHP SG13G2

- Catalog id: `ihp-sg13g2` (ORFS platform `ihp-sg13g2`)
- Install: ORFS tree with `platforms/ihp-sg13g2` + `OPENROAD_FLOW_ROOT`
- Script packs use `sg13g2_*` cell masters

## LinkedIn

- Third-person rewrite: `docs/marketing/LINKEDIN_REWRITE.md`
