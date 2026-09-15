# 3D Silicon Lab — Master Fab Process & Stage Effects

Illustrative curriculum in `web/public/die_viewer_3d.html` (not foundry tapeout).

Open **Wafer Fab** timeline → use **Master Process HUD** (`#procHud`) on every step.

## 15 Master FAB steps + primary effects

| # | Stage | Effects taught |
|---|--------|----------------|
| 1 | Wafer Prep | Crystal defects, Oi precipitates, warpage/TTV, particles |
| 2 | Photolithography | Overlay, CD variation, standing waves, flare, mask defects |
| 3 | Etch (wet/RIE) | ARDE/microloading, notching, residue, plasma charging |
| 4 | STI | LOD stress, divots, seam voids, CMP dishing |
| 5 | Implant + RTA | **WPE**, channeling, TED, latch-up / taps |
| 6 | Gate oxide | **TDDB**, NBTI/PBTI, pinholes, SILC |
| 7 | MOL contacts | Rc, silicide piping, junction leakage |
| 8 | ILD + CMP | Dishing, erosion, density, puddling |
| 9 | **BEOL plasma metal** | **Process Antenna**, PID, GOX rupture, latent TDDB |
| 10 | Vias / metal | **EM**, stress migration, via voids (Black’s law) |
| 11 | PDN mesh | Static IR, dynamic di/dt, strap EM, SSO coupling |
| 12 | Passivation / pads | Moisture, mobile ions, crackstop, ESD |
| 13 | Wafer sort | Probe scrub, false fails, pad wear |
| 14 | Dicing | Chipping, crack propagation, kerf particles |
| 15 | Packaging | Wire sweep, cratering, C4 voids, IMC, warpage, TSV stress, package L |

Each step HUD includes: **Cause · When · Params · Risks · Mitigations · Interview trap · Formula (when applicable)**.

## Antenna (step 9) — master essentials

- Damage during **BEOL plasma etch**; vulnerability from **PD routing**
- \(R_{ant} = A_{metal}/A_{gate}\) (or perimeter form)
- Fixes: jumper → ECO → diode → manual; diode Cin/leakage tradeoffs

## Packaging

Separate Package selector still covers wirebond → 2.5D (see `SILICON_LAB_PACKAGING.md`).
