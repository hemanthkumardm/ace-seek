# Local test checklist — AceFlow / EQY / 3D Lab (main @ 3cde410)

```bash
cd web && npm run dev
# AceFlow tests
cd .. && PYTHONPATH=. python3 -m unittest tests.test_flow_orchestrator -q
```

## Must-pass UI checks

| # | Where | Expect |
|---|--------|--------|
| 1 | `/vlsi/learn` | 3D lab card says **illustrative** / ~15 µm latch-up — not “tap.1 ≤25µm” |
| 2 | `/die_viewer_3d.html` | Banner: illustrative schematic; Ace-Seek branding; **Wafer Fab / PnR Flow** toggle |
| 3 | Die viewer RC Path | Sky130-style cell names; Elmore HUD; no “Copper” for Sky130 metals |
| 4 | Package Flip-Chip | Wirebonds hidden; **pads/UBM still visible** |
| 5 | OpenROAD Studio → Formal LEC | Badge **NOT RUN IN STUDIO**; no “100% PROVED”; script preview paths `synthesis_*` / `routing_*.nl.v` |
| 6 | Export pack README | Honest scope table; `make lec-*` fails without `eqy` |

## AceFlow CLI sanity

```bash
# Should FAIL without eqy (fail-closed)
PYTHONPATH=. python3 -c "
from workers.engines.flow import AceFlow, DesignState
from workers.engines.flow.steps import EqyLecStep
import tempfile
d=tempfile.mkdtemp()
f=AceFlow('t',[EqyLecStep()],d)
s=f.run(DesignState(design_name='top', rtl_files=('a.v',)))
assert s.status=='failed' and s.metrics.get('lec_equivalent') is False
print('fail-closed OK')
"
```

## Known intentional (not bugs)

- Procedural die geometry is **schematic**, not real Ibex DEF
- Studio LEC does not execute EQY in the cloud
- `ACE_FLOW_MOCK=1` still exists for offline demos only — do not enable in production
