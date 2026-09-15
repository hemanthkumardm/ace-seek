# Audit — AceFlow / EQY / 3D Silicon Lab

**Branch:** `openroad.ace-seek`  
**Scope:** commits `e5ecb15` → `67db5c9`  
**Date:** 2026-09-10  
**Status:** Fix batches **A→E implemented** (see changelog at bottom)

Hosted **OpenLane Docker PnR** remains the credible synth→GDS path. AceFlow + Studio EQY + the 3D lab were strong demos but overclaimed or mis-taught in places.

---

## P0 — Trust / wrong learning / false signoff

### Formal LEC / AceFlow

| # | Issue | Location |
|---|--------|----------|
| 1 | Studio “Formal LEC (EQY)” is fake UI — always `100% PROVED`; counts = `cellCount * 0.12` | `OpenroadStudioCenterView.tsx` |
| 2 | `EqyLecStep` mocks EQUIVALENT when `eqy` missing or non-zero exit | `eqy_step.py` |
| 3 | Unit tests assert the mock success path | `tests/test_flow_orchestrator.py` |
| 4 | Generated `.eqy` scripts invalid (`mode flat` / `mode rtl_vs_synth` in `[options]`) | worker + export + UI |
| 5 | Netlist paths mismatch synth/route outputs | `openroad-scripts-engine.ts` |
| 6 | Makefile soft-succeeds without EQY | export Makefile |
| 7 | Yosys/OpenROAD write stub artifacts; flow never aborts on fail | `yosys_step.py`, `openroad_step.py`, `flow.py` |
| 8 | Timing ECO is arithmetic theater | `eco_step.py` |

### 3D Silicon Lab

| # | Issue |
|---|--------|
| 9 | Fab sequencer mixes wafer fab with PnR order |
| 10 | Invented SkyWater rule `tap.1 ≤ 25 µm` (real ~15 µm latch-up) |
| 11 | Poly sheet R wrong (~5.5 vs ~48.2 Ω/sq) |
| 12 | MCON R wrong (9.3 vs ~152 Ω/cut) |
| 13 | Elmore / wirebond formulas misstated |
| 14 | Preferred routing directions inverted vs labels |
| 15 | Endcap taught as `decap_3` + false CMP oxide story |
| 16 | Metals labeled Copper (Sky130 is primarily Al) |
| 17 | Cell names not Sky130 (`INV_X2` vs `sky130_fd_sc_hd__inv_2`) |

---

## P1 — Misleading product / integration

| # | Issue |
|---|--------|
| 18 | Ibex/GCD presets are procedural fake geometry |
| 19 | Ibex metrics disagree with authentic Ace-Seek baseline |
| 20 | DEF upload broken (`defFileInput` missing) |
| 21 | Learn Hub overclaims + wrong tap rule |
| 22 | Auth mismatch — Learn gated, `.html` public |
| 23 | No “illustrative / not tapeout” disclaimer |
| 24 | Flip-chip mode hides pads (UBM still needed) |
| 25 | Package exclusivity oversold |
| 26 | `flow_config.json` neither valid OpenLane nor AceFlow schema |
| 27 | Three different EQY recipes (UI ≠ export ≠ worker) |
| 28 | AceFlow vs hosted OpenLane naming confusion |
| 29 | AceFlow docs overclaim adaptive/hermetic |

---

## P2 — UX / perf / a11y

| # | Issue |
|---|--------|
| 30 | Die viewer desktop-only |
| 31 | Continuous rAF + random flicker |
| 32 | Almost no a11y |
| 33 | RC HUD discoverability |
| 34 | “All” filter jumps fab timeline |
| 35 | Studio LEC looks like real signoff |

---

## P3 — Upgrades (extraordinary)

1. Real EQY jobs or honest “script preview / not run”
2. Real Ibex DEF/JSON + “Schematic” mode label
3. Dual timelines: Wafer fab vs PnR
4. Cite Sky130 RCX footnotes; fix constants; Sky130 cell names
5. Package lab with R+L; UBM pads in flip-chip
6. Embed in LearnShell + quizzes
7. Split OpenLane `config.json` vs AceFlow orchestration
8. Gate mocks behind `ACE_FLOW_MOCK=1`
9. WebGL/LOD + idle pause
10. Studio LEC = download scripts until cloud EQY exists

---

## Fix batches

| Batch | Scope | Outcome |
|-------|--------|---------|
| **A** | Kill fake LEC success (Studio + EqyStep + Makefile + tests) | No false “100% PROVED” |
| **B** | Die-viewer physics + dual fab/PnR timeline + disclaimer | Stop mis-teaching |
| **C** | Export pack paths / valid EQY / honest README | Scripts that can run |
| **D** | Schematic labeling + Learn Hub copy/auth | Honest Ibex story |
| **E** | Perf / mobile / a11y polish | Usable lab |

---

## Keep (good)

- Separating real ODB/OpenSTA Studio from educational 3D lab
- Sky130 sheet R → Ω/µm for li1/met1–3 and via1/via2 (mostly correct)
- AceFlow modular Step/Flow/DesignState skeleton
- Packaging selector + filler visualization (when labeled illustrative)
- Hosted OpenLane Docker as credible tapeout path

---

## Changelog — fixes applied

### Batch A — Fake LEC killed
- `EqyLecStep` fail-closed; mock only with `ACE_FLOW_MOCK=1`
- Studio LEC tab: **NOT RUN IN STUDIO** script preview (no fake 100% PROVED)
- Yosys/OpenROAD no stub success without mock
- AceFlow aborts on `failed`
- ECO is script-only unless mock
- Tests updated (9/9 pass)

### Batch B — Die viewer physics
- Dual timelines: Wafer Fab vs PnR Flow
- Tap ~15 µm (LU.2/LU.3); poly ~48.2 Ω/sq; MCON 152 Ω
- Al metals; Sky130 cell names; honest Elmore / package R+L
- Flip-chip keeps UBM pads

### Batch C — Export pack
- Valid EQY sections; netlist paths aligned to `synthesis_` / `routing_*.nl.v`
- Makefile `lec-*` fail-closed
- Split `flow_config.json` vs `openlane_config.json`
- Honest README

### Batch D — Product honesty
- Schematic disclaimer + Ace-Seek branding
- Learn Hub illustrative copy

### Batch E — UX
- Mobile CSS, idle/hidden rAF pause, a11y labels, All-filter fix, RC hint, DEF file input
