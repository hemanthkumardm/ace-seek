# Local testing checklist — Ace-Seek (current main)

**Dev URL:** http://localhost:3000  
**Date:** 2026-09-15

```bash
cd web && npm run dev
```

---

## A. 3D Silicon Lab — packaging curriculum

| # | Action | Pass if |
|---|--------|---------|
| A1 | Open http://localhost:3000/die_viewer_3d.html | Loads; disclaimer “illustrative schematic” visible |
| A2 | Header shows **Ace-Seek · VLSI Learning Lab** | Branding OK |
| A3 | Toggle **Wafer Fab** / **PnR Flow** | Timelines switch; steps change |
| A4 | Package → **Wirebond** | Wires + leadframe; HUD L≈1.2 nH |
| A5 | Package → **Flip-Chip** | C4 bumps; **pads/UBM still visible**; no wires |
| A6 | Package → **Compare** | Both wirebond + flip-chip visible |
| A7 | Package → **WLCSP** | Fine bumps; lesson HUD updates |
| A8 | Package → **FC-BGA** | C4 + larger BGA balls |
| A9 | Package → **FOWLP / Fan-Out** | RDL stubs + outer bump ring |
| A10 | Package → **2.5D Interposer + HBM** | Interposer plate + HBM stack + μbumps |
| A11 | Package → **Gallery: All** | All package layers + comparison table in HUD |
| A12 | Filter **⚡ RC Path** | Elmore HUD; Sky130-style cell names; Al metals |
| A13 | Mobile width (~375px) | Header wraps; panels usable |
| A14 | Learn Hub card → Launch Lab | http://localhost:3000/vlsi/learn mentions full packaging suite |

---

## B. OpenROAD multi-PDK

| # | Action | Pass if |
|---|--------|---------|
| B1 | http://localhost:3000/openroad (sign in if asked) | Landing loads |
| B2 | **Project** → PDK chips | sky130, sky130B, gf180mcu, asap7, nangate45 visible with Cloud OpenLane / ORFS badges |
| B3 | Select **gf180mcu** → save | Description says Cloud OpenLane; no silent sky130 remap copy |
| B4 | **Scripts** export / preview | README / Tcl mention selected PDK; GF180 cell names if gf180 selected |
| B5 | Studio → Formal LEC tab | Badge **NOT RUN IN STUDIO**; liberty matches project PDK |
| B6 | Select **asap7** | Notes ORFS / OPENROAD_FLOW_ROOT |

---

## C. Auth / plan honesty (smoke)

| # | Action | Pass if |
|---|--------|---------|
| C1 | Signed out → VLSI studio | Asks to sign in (no API-key paste banner) |
| C2 | Signed out → Interview | Sign-in wall |
| C3 | Free account → OpenROAD Run | Locked / Max required |
| C4 | No “100% PROVED” EQY fake success | LEC tab is script preview only |

---

## D. AceFlow (CLI, optional)

```bash
cd /Users/hemanth/Desktop/ace-seek
PYTHONPATH=. python3 -m unittest tests.test_flow_orchestrator -q
```

Pass if **OK** (9 tests). EQY without binary should **fail-closed**.

---

## E. Quick regressions

| # | Check | Pass if |
|---|--------|---------|
| E1 | No `tap.1 ≤ 25 µm` in lab | Uses ~15 µm latch-up language |
| E2 | No “virtually eliminating ground bounce” | Softened SSO wording |
| E3 | Portal `#pricing` | Scrolls smoothly (no huge blur stutter) |
| E4 | VLSI login | Dark theme (matches VLSI chrome) |

---

## Known intentional (not bugs)

- Die lab geometry is **schematic**, not real Ibex DEF  
- Studio EQY does not run formal proof in browser  
- Cloud container PnR needs Max + EC2 PDK installed for non-sky130  
