# Activity / time-resolved power (Studio)

## What ships today

1. **Static power from OpenLane** — `placement_power.rpt` (and metrics summary)
   parsed into PPA tiles (total / dynamic / leakage mW).
2. **VCD activity timeline** — after Simulation, Studio bins scalar toggle counts
   over time and shows an **Activity / power (VCD)** chart in the PPA sidebar.
3. **Educational power envelope** — if placement power exists,
   `P(t) ≈ leakage + dynamic × (toggle_rate(t) / mean_rate)`.

This is **not** foundry signoff vector power. It is for demos, education, and
correlation while iterating RTL.

## How to use

1. Run **Simulation** (produces VCD) → activity bars appear.
2. Run **Placement** (or load placement power reports) → envelope scales with
   report dynamic/leakage.
3. Prefer curated `placement_power.rpt` over mid-run log scraping.

## SAIF / production path (later)

For real activity-annotated power:

- Dump **SAIF** or annotated VCD from GLS
- Feed liberty + SPEF into OpenSTA / commercial PX
- Store SAIF under the owner job tree and add a dedicated report stage

Until then, keep SAIF files in the Project file list for handoff; the chart uses VCD.

## Related

- `parseVcdActivityTimeline` / `estimateActivityPowerSeries` in `openroad-flow-model.ts`
- `ActivityTimeline` in `OpenroadCharts.tsx`
