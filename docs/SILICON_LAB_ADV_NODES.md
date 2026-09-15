# 3D Silicon Lab — Advanced tech nodes (challenges & methods)

Educational schematic track in `web/public/die_viewer_3d.html`.

## How to open

1. Open `/die_viewer_3d.html` (or Learn → Silicon Lab)
2. Purple **Tech-node** selector → pick era (sky130 → ~2nm)
3. Timeline → **Adv Nodes** (11 steps)
4. **PDN Mesh** filter also shows BPR / nano-TSV / BSPD layers when enabled

## Tech-node cards

| ID | Era | Power story |
|----|-----|-------------|
| `sky130` | Teaching planar | Frontside rails/straps |
| `n28` | Scaled planar + Cu | Frontside Cu mesh |
| `n16` | FinFET | Track tax rising |
| `n7` | FinFET + EUV | Starvation → BPR research |
| `n3` | GAA nanosheet | BPR emerging |
| `n2` | GAA + BSPD | Backside power / PowerVia-class |

Each card lists **challenges** and **methods** (HUD on the right).

## Adv Nodes timeline (summary)

1. Tech-node ladder (what “nm” means)
2. FinFET vs planar
3. Cu dual-damascene
4. Cu EM / vias
5. Multi-patterning / EUV
6. MOL parasitics
7. GAA / nanosheet
8. Buried power rails (BPR)
9. **Backside power delivery (BSPD / PowerVia)**
10. Challenge ↔ method cheat-sheet
11. Packaging still applies (2.5D/HBM)

## Honesty

- Schematic only — **not** Sky130 OpenLane-real, **not** a foundry DRC deck
- BSPD does **not** erase package \(L\cdot di/dt\)
- Interview Masterclass still has deeper BSPDN verbal Qs
