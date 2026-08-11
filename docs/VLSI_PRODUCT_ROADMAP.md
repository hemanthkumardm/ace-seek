# VLSI Platform — Phase-Wise Engine & Studio Roadmap

**Product:** ace-seek VLSI (`vlsi.ace-seek.com`)  
**Status baseline (today):** SDC Studio, Timing Studio (SI/ECO tabs), shared **graph engine**, CDC-inside-SDC  
**Audience:** product + engineering planning  
**Last updated:** 2026-08-10  

This document is a **task list with implementation detail**, not an implementation commit log. Work is split into:

1. **Strongly useful** — improves current SDC + Timing without new product lines  
2. **Expand product scope** — new studios / heavy engines (UPF, MMMC, RTL CDC, …)  
3. **Studio ideas** — including Power (UPF) and Multi-Corner (MMMC), plus additional suggestions  

---

## 0. Current architecture (baseline)

```text
vlsi.ace-seek.com
├── SDC Studio     → sdc-engine.ts  (+ CDC domains, budget, STA link)
├── Timing Studio  → timing-engine.ts (+ SI / ECO tabs)
└── Shared         → graph-engine.ts  (connectivity backbone)
```

| Layer | Files | Responsibility |
|-------|--------|----------------|
| Constraint | `web/src/lib/sdc-engine.ts` | Clocks, I/O, MCP, false path, lint, CDC, budget |
| STA / SI / ECO | `web/src/lib/timing-engine.ts` | Report parse, equations, SI, ECO what-if |
| Graph | `web/src/lib/graph-engine.ts` | Nodes/edges, path chain, domain map queries |
| UI | `web/src/app/vlsi/**` | Neo-brutalist workstations |

**Design rule:** same primary object → integrate (CDC→SDC, SI/ECO→Timing). New primary object + workflow → new studio (UPF, MMMC, DFT).

---

# Part A — Strongly useful (stay on SDC + Timing)

These engines harden the product users already open every day.

---

## Phase A0 — Stability & correctness (1–2 weeks) — ✅ COMPLETED

**Goal:** No crashes on real Innovus/PT dumps; predictable units; CI smoke tests.  
**Verified:** `npm run verify` → **79/79 assertions passed** (re-run 2026-08-10).

| ID | Task | Implementation detail | Done when | Status |
|----|------|----------------------|-----------|--------|
| A0.1 | Large-report parse stress tests | Fixtures under `web/src/lib/__fixtures__/sta/` (Innovus long-line, PT multi-path, Tempus table). Suite: `web/scripts/verify-engines.mts`. | 3+ fixtures, finite slack | ✅ |
| A0.2 | Unit policy centralization | `parseTimeToken`; 50k+ line paste without recursion; runtime budget. | Safe large paste | ✅ |
| A0.3 | Graph engine unit tests | `buildGraphFromTimingPaths`, `pathChain`, SDC async cuts, `mergeGraphs`. | Assertions green | ✅ |
| A0.4 | Round-trip SDC smoke | `generateSdcCode` → `parseSdcText` for all SDC presets. | Counts match | ✅ |

**How to re-verify:**

```bash
cd ace-seek && npm run verify
# or: npm run verify --prefix web
```

**Files:** `timing-engine.ts`, `sdc-engine.ts`, `graph-engine.ts`, `web/scripts/verify-engines.mts`, `web/src/lib/__fixtures__/sta/*`.

---

## Phase A1 — Unified report ingest engine (2–3 weeks) — ✅ COMPLETED

**Goal:** One entry point for “paste any STA-ish text” with vendor/auto detection and shared metadata.  
**Verified:** `npm run verify` → **88/88 assertions** (A0 + A1) re-run 2026-08-10.

| ID | Task | Implementation detail | Done when | Status |
|----|------|----------------------|-----------|--------|
| A1.1 | `report-ingest-engine.ts` | `IngestResult`, auto-detect PT/Genus/OpenSTA (+ tool/stage/kind/blocks). | Auto-detect mocks | ✅ |
| A1.2 | Block splitter registry | Path blocks extracted in ingest (`rawBlocks`). | Blocks ≥ 1 per mock | ✅ |
| A1.3 | Multi-file session | Session add/switch/remove active file API. | Session length & activeId correct | ✅ |
| A1.4 | Wire Timing Studio | Facade via existing `parseTimingReport` + ingest path (suite keeps A0 parse green). | UI/parse unchanged | ✅ (via facade + A0 suite) |

**How to re-verify:**

```bash
cd ace-seek && npm run verify
```

**Files:** `web/src/lib/report-ingest-engine.ts`, `web/scripts/verify-engines.mts` (A1 sections).

**Deps:** A0.  
**Consumers:** Timing, later SI-heavy reports, ECO before/after.

---

## Phase A2 — Diff engine (SDC + timing) (2–3 weeks) — ✅ COMPLETED

**Goal:** “What changed?” for constraints and path slacks.  
**Verified:** `npm run verify` → **96/96 assertions** (A0+A1+A2) re-run 2026-08-10.

| ID | Task | Implementation detail | Done when | Status |
|----|------|----------------------|-----------|--------|
| A2.1 | `diff-engine-vlsi.ts` | Structural SDC diff (modified/added clocks, etc.). | Deltas detected | ✅ |
| A2.2 | Timing path match | Match paths; ΔWNS/ΔTNS/pairs. | Finite deltas | ✅ |
| A2.3 | UI: Timing Compare | `diffTimingStates` wired in Timing Studio. | Compare path present | ✅ |
| A2.4 | UI: SDC Diff | `diffSdcStates(baseline, state)` in SDC Studio. | Diff API wired | ✅ |
| A2.5 | ECO effectiveness | Evaluate proposals vs before/after (status e.g. unverified). | Count match | ✅ |

**How to re-verify:**

```bash
cd ace-seek && npm run verify
```

**Files:** `web/src/lib/diff-engine-vlsi.ts`, Timing/SDC studio pages, `web/scripts/verify-engines.mts` (A2 sections).

**Deps:** A1 helpful.  
**Note:** Docs-tool `diff-engine.ts` kept separate; VLSI uses `diff-engine-vlsi.ts`.

---

## Phase A3 — Unit / corner registry (1–2 weeks) — ✅ COMPLETED

**Goal:** Multi-corner labels without full MMMC studio yet.  
**Verified:** `npm run verify` → **106/106 assertions** (A0–A3) re-run 2026-08-10.

| ID | Task | Implementation detail | Done when | Status |
|----|------|----------------------|-----------|--------|
| A3.1 | `corner-model.ts` | `CornerId`, `OperatingCondition` (process/V/T), parse OC strings. | PVT fields parsed | ✅ |
| A3.2 | `TimingStudioState.corners` | Aggregate unique corners; path.corner tags; UI filter. | Multi-corner paths tagged | ✅ |
| A3.3 | Summary per corner | Per-corner WNS (and UI chips). | ≥2 corners, finite WNS | ✅ |

**How to re-verify:**

```bash
cd ace-seek && npm run verify
```

**Files:** `web/src/lib/corner-model.ts`, `timing-engine.ts` (`corners[]`), Timing Studio multi-corner UI, `verify-engines.mts` A3 section.

**Deps:** A1.  
**Bridge to:** Phase B Multi-Corner / MMMC Studio.

---

## Phase A4 — Script emit & ECO session (2 weeks) — ✅ COMPLETED

**Goal:** Export that engineers can paste into Innovus/PT without rewriting.  
**Verified:** `npm run verify` → **121/121 assertions** (A0–A4) re-run 2026-08-10.

| ID | Task | Implementation detail | Done when | Status |
|----|------|----------------------|-----------|--------|
| A4.1 | Vendor script templates | Innovus / PrimeTime / Tempus emit (`eco-scripts`). | Distinct tool snippets | ✅ |
| A4.2 | ECO session model | `EcoSession` + localStorage load/save/clear. | Default stage/vendor | ✅ |
| A4.3 | Batch apply + predicted WNS/TNS | Diminishing-return gain; predicted metrics. | Finite predicted WNS/TNS | ✅ |
| A4.4 | SDC export pack | `constraints.sdc` + `eco.tcl` + `README.txt` (+ zip payload). | 3-file pack | ✅ |

**How to re-verify:**

```bash
cd ace-seek && npm run verify
```

**Files:** `web/src/lib/eco-scripts/`, `web/src/lib/eco-session-model.ts`, `web/src/lib/sdc-export-pack.ts`, Timing Studio ECO UI.

**Deps:** Current ECO in timing-engine.

---

## Phase A5 — Graph engine depth (2–3 weeks) — ✅ COMPLETED

**Goal:** Design-wide queries, not only path schematic.  
**Verified:** `npm run verify` → **130/130 assertions** (A0–A5) re-run 2026-08-10.

| ID | Task | Implementation detail | Done when | Status |
|----|------|----------------------|-----------|--------|
| A5.1 | Merge Timing + SDC graphs | `mergeGraphs(timing, sdc)`; session graph in Timing Studio. | Merged nodes + SDC domains | ✅ |
| A5.2 | Fanin/fanout cone | `faninCone` / `fanoutCone` + UI depth control. | Cone APIs return nodes | ✅ |
| A5.3 | Critical cone export | Tcl with `group_path` / named group. | Export string valid | ✅ |
| A5.4 | Graph persistence | Serialize/restore DesignGraph JSON. | Round-trip node/edge counts | ✅ |

**How to re-verify:**

```bash
cd ace-seek && npm run verify
```

**Files:** `web/src/lib/graph-engine.ts` (merge/cone/serialize), Timing Studio schematic cone panel + `design_graph.json` download.

**Deps:** graph-engine baseline (done).

---

## Phase A6 — UX polish shared (ongoing) — ✅ COMPLETED (v1)

**Goal:** Readable controls, safe large paste UX, shareable URLs.  
**Verified:** `npm run verify` → **136/136 assertions** (A0–A6) re-run 2026-08-10.

| ID | Task | Implementation detail | Status |
|----|------|----------------------|--------|
| A6.1 | Contrast audit | Selects/options `bg-white text-slate-900`; dark table text | ✅ |
| A6.2 | Debounced parse | `debouncedReportText` before `parseTimingReport` | ✅ |
| A6.3 | Progress for large paste | Progress threshold for large pastes (>2k chars) | ✅ |
| A6.4 | Deep links | `?tab=` / `?path=` / `?vendor=` (Timing); SDC has tab/vendor/tool | ✅ |

**How to re-verify:**

```bash
cd ace-seek && npm run verify
```

**Manual UX checks (optional):** dark text on all dropdowns; paste large report → parsing indicator; open `/vlsi/timing-studio?tab=eco&path=path_1&vendor=cadence`.

---

# Part B — Expand product scope (new studios / heavy engines)

These are **required if** you sell the corresponding capability. Ordered for dependency and market fit.

---

## Phase B1 — Multi-Corner / MMMC Studio — ✅ CONFIGURATOR DONE

**Goal:** Build and lint **multi-mode multi-corner** analysis views (Cadence MMMC / Synopsys scenarios) **from user inputs → live `mmmc.tcl` / scenarios.tcl**.  
**Route:** `/vlsi/mmmc-studio` (own studio, not nested inside SDC).  
**Nav:** Top VLSI bar includes **SDC | Timing | MMMC**. SDC “Attach to MMMC” is a deep-link + localStorage SDC transfer.  
**Verify:** `npm run verify` Phase B1 + B1.6 green (CRUD helpers, user-config generate/parse round-trip).

### Product shape

| Item | Choice |
|------|--------|
| Route | `/vlsi/mmmc-studio` (first-class studio) |
| Workflow | **1. Configure** libs/RC/delay/modes → **2. Matrix** setup/hold → **3. Download** generated TCL |
| Primary object | Analysis view = mode × delay corner × setup/hold |
| Emit | `create_library_set`, `create_rc_corner`, `create_delay_corner`, `create_constraint_mode`, `create_analysis_view`, `set_analysis_view` (Cadence); `create_scenario` (Synopsys) |

### Task list

| ID | Task | Implementation detail | Done when |
|----|------|----------------------|-----------|
| B1.1 | Data model `mmmc-engine.ts` | Types + `empty`/`starter`/`create*` CRUD helpers. | ✅ |
| B1.2 | Presets | Typical SoC + Automotive AEC-Q100. | ✅ |
| B1.3 | Generator | Cadence MMMC + Synopsys scenarios from state. | ✅ |
| B1.4 | Parser (import) | File/paste import → configurator state. | ✅ |
| B1.5 | Lint | Missing hold, unused libs, no active views, explosion. | ✅ |
| B1.6 | Configurator + matrix UI | Full edit forms; mode×corner Setup/Hold matrix; live TCL tab. | ✅ |
| B1.7 | Link Timing Studio | Tag paths with `viewName` (report / filename / setup·hold / assign); filter Timing by MMMC view; push registry from MMMC. | ✅ |
| B1.8 | Link SDC Studio | Named SDC project packs; attach dialog (auto/create/bind); mode clocks + Edit in SDC; reverse pull; mode snapshot; lint links. | ✅ |

**Engine:** `mmmc-engine.ts`  
**UI:** `app/vlsi/mmmc-studio/page.tsx` — Configure | Matrix | Views | Script | Lint

---

## Phase B2 — Power Studio (UPF builder) — ✅ CONFIGURATOR DONE

**Goal:** Full **configure → generate IEEE 1801 UPF** studio (same product shape as MMMC).  
**Route:** `/vlsi/power-studio`  
**Verify:** `npm run verify` Phase B2 green.

### Product shape

| Item | Choice |
|------|--------|
| Route | `/vlsi/power-studio` (first-class) |
| Workflow | **1. Configure** supplies/domains/switches → **2. Strategies** ISO/ret/LS → **3. PST** → **4. Download `.upf`** |
| Emit | Tool-agnostic IEEE 1801 UPF body (Cadence / Synopsys / others) |

### Task list

| ID | Task | Status |
|----|------|--------|
| B2.1 | Data model | ✅ |
| B2.2 | Generator | ✅ |
| B2.3 | Parser + import | ✅ |
| B2.4 | Domain map | ✅ |
| B2.5 | Lint | ✅ |
| B2.6 | SDC tips in lint | ✅ |
| B2.7 | Presets | ✅ |
| B2.8 | Configurator UI (MMMC-style tabs) | ✅ |

**Engine:** `upf-engine.ts` · **UI:** `app/vlsi/power-studio/page.tsx`

---

## Phase B3 — Report Hub — ✅ DONE

**Goal:** Single landing for all dumps → jump to Timing / SDC / MMMC / Power.  
**Route:** `/vlsi/reports`  
**Verify:** Phase B3 block in `npm run verify`.

| ID | Task | Status |
|----|------|--------|
| B3.1 | Hub route + upload/paste/cards | ✅ |
| B3.2 | Size-capped localStorage history | ✅ |
| B3.3 | Auto-tags + metrics (WNS, SI, stage) | ✅ |
| B3.4 | Open in studio handoff | ✅ |

**Engine:** `report-hub-engine.ts` · **UI:** `app/vlsi/reports/page.tsx`

---

## Phase B4 — Report-driven cell ladder (ECO accuracy) — ✅ DONE

**Goal:** ECO proposes **real cell names** without Liberty upload — mine STA path cells.

| ID | Task | Status |
|----|------|--------|
| B4.1 | `cell-ladder-engine.ts` parse TSMC/X/trail names | ✅ |
| B4.2 | Catalog + drive ladders from report paths | ✅ |
| B4.3 | VT swap (seen LVT first, else infer) | ✅ |
| B4.4 | ECO `size_cell` / `ecoChangeCell` with real masters | ✅ |
| B4.5 | Timing ECO UI: from→to + seen/inferred badges | ✅ |

**Approach:** No `.lib` required. Optional Liberty parse deferred.

---

## Phase B5 — Deep RTL / CDC engine (beyond constraint CDC)

**Goal:** Auto-detect CDC structures from RTL (optional advanced).

| ID | Task | Implementation detail |
|----|------|----------------------|
| B5.1 | SV/V subset parse or tree-sitter | Modules, always_ff, clock names heuristic. |
| B5.2 | Synchronizer patterns | 2FF, pulse sync, gray counter heuristics. |
| B5.3 | Reconvergence / data-data checks | Graph on RTL nets. |
| B5.4 | Waivers | JSON waiver DB. |
| B5.5 | Export to SDC | Suggest clock groups / false paths from findings. |

**Estimate:** large (6–10+ weeks). Only if CDC signoff is a product pillar.  
**Note:** Constraint CDC in SDC Studio is enough for many users.

---

## Phase B6 — SPEF / true SI (optional)

| ID | Task | Implementation detail |
|----|------|----------------------|
| B6.1 | SPEF subset parse | `*D_NET`, caps, coupling caps top-N. |
| B6.2 | Couple to graph | Net nodes + coupling edges. |
| B6.3 | Rank nets | Top coupling ratio for Timing SI tab. |

**Estimate:** 3–5 weeks for subset. Full SI solve is out of scope (stay report-driven).

---

## Phase B7 — DFT Studio (optional)

| ID | Task | Implementation detail |
|----|------|----------------------|
| B7.1 | Scan chain parse from DFT reports | Chain order, length, coverage %. |
| B7.2 | Graph chain edges | Visual chain. |
| B7.3 | Mode vs timing note | Link to MMMC test mode views. |

---

## Phase B8 — Physical / congestion lite (optional)

| ID | Task | Implementation detail |
|----|------|----------------------|
| B8.1 | Parse density/congestion summary reports | Not full DEF v1. |
| B8.2 | Heatmap UI | Coarse grid from tool summary. |
| B8.3 | Link ECO | “Hot region” badge on instances if xy from Innovus table present (you already parse locations sometimes). |

---

# Part C — Studio ideas (yours + more)

## C1. Your ideas (recommended)

### Power Studio (UPF builder) — **yes, separate studio**

| | |
|--|--|
| **Why separate** | Primary object = power domain / supply / strategy, not clocks |
| **Engine** | `upf-engine.ts` (Phase B2) |
| **Links** | Graph domain map; SDC tips; later MMMC low-power views |
| **MVP** | Domains + supplies + isolation + generate UPF + lint |

### Multi-Corner / MMMC Studio — **yes; start as SDC tab, promote if heavy**

| | |
|--|--|
| **Why** | Every tapeout has func/test × ss/ff × setup/hold views |
| **Engine** | `mmmc-engine.ts` (Phase B1) |
| **Links** | SDC constraint modes; Timing report filter by view |
| **MVP** | Library sets, RC/delay corners, analysis view matrix, Tcl emit |

**Suggested order:** **MMMC before UPF** if users are digital timing-centric; **UPF first** if power-intent tapeouts are the wedge.

---

## C2. Additional studio suggestions

| Studio | Primary object | Engine | Integrate vs separate | Priority |
|--------|----------------|--------|----------------------|----------|
| **Report Hub** | Uploaded dumps | ingest | Separate light page | High |
| **Constraint Diff** | Two SDCs | diff | Tab in SDC or hub | High |
| **Timing Compare** | Two reports | path match | Tab in Timing | High |
| **Clocking / CTS budget** | Latency/skew targets | extend SDC + graph | Tab in SDC | Med |
| **IR / EM triage** | Power grid report lines | `ir-report-engine` | Separate or Power sub-tab | Med (after UPF) |
| **DFT / Scan** | Chains | dft-engine | Separate | Med/Low |
| **Liberty browser** | Cells | liberty-lite | Sub-tool for ECO | Med |
| **Formal / LEC triage** | Map points / CEX | lec-log-engine | Separate | Low until demand |
| **IP Integration** | Block pin budgets | block-contract + SDC merge | Separate | Med for SoC teams |
| **Waivers Studio** | Waiver records | waiver DB | Shared across CDC/lint/DFT | Med later |
| **Flow / Checklist** | Stage gates | checklist JSON | Hub | Low/Med |

### Naming on the platform

```text
vlsi.ace-seek.com
├── SDC Studio          (clocks, I/O, CDC, exceptions, budgets)
├── Timing Studio       (paths, SI, ECO, compare)
├── MMMC Studio         (or SDC → Corners)     ← your idea
├── Power Studio        (UPF)                  ← your idea
├── Reports Hub         (ingest + history)
└── (later) DFT / IP / IR
```

---

# Part D — Recommended overall phase sequence

| Wave | Phases | Outcome |
|------|--------|---------|
| **Now → 1 month** | A0, A1, A6 | Rock-solid paste + ingest + UX |
| **Month 2** | A2, A3, A4 | Diff, corners-on-paths, ECO export quality |
| **Month 3** | A5, B1 (MMMC MVP) | Graph depth + multi-corner product |
| **Month 4–5** | B2 (Power/UPF MVP) | Second major studio |
| **Month 6+** | B3 hub, B4 liberty-lite, optional B5–B8 | Depth by customer demand |

```text
A0 stability
 → A1 ingest → A2 diff → A3 corners → A4 ECO scripts
 → A5 graph depth
 → B1 MMMC Studio
 → B2 Power / UPF Studio
 → B3 Report Hub
 → B4 Liberty-lite (better ECO)
 → optional RTL-CDC / SPEF / DFT / IR
```

---

# Part E — Implementation checklist templates

## New engine module template

```text
web/src/lib/<name>-engine.ts
  - types + empty state
  - parse*(text) / generate*(state)
  - lint*(state)
  - optional: toGraph(state) → DesignGraph fragments

web/src/app/vlsi/<studio>/page.tsx
  - paste/upload | form CRUD | preview code | lint panel

web/src/lib/__fixtures__/<name>/
  - sample inputs

web/scripts/verify-engines.mts
  - smoke import + assert
```

## Definition of Done (any phase)

- [ ] Types exported; no `any` in public API  
- [ ] At least one fixture + automated smoke  
- [ ] UI contrast: dark text on light controls  
- [ ] Generate + parse path documented  
- [ ] Linked from VLSI home cards  
- [ ] Honest limits noted in UI (“what-if”, “subset UPF”, etc.)

---

# Part F — Explicit non-goals (for a long time)

- Replacing PrimeTime / Tempus / Innovus as signoff solvers  
- Full NLDM liberty characterization UI  
- Full SPEF-based SI re-simulation  
- Full SystemVerilog elaborator  
- Place-and-route legalization  

Ace-seek stays a **constraint + report intelligence + intent authoring** layer on top of EDA tools.

---

# Part G — Quick reference: engines inventory

| Engine | Status | Phase |
|--------|--------|-------|
| SDC | **Done** | — |
| Timing / STA | **Done** | — |
| Graph | **Done** (depth A5) | A5 |
| SI lite | **Done** (heuristic + parse) | A1/B6 improve |
| ECO what-if | **Done** | A4 hardens |
| CDC (constraint) | **Done** (in SDC) | B5 if RTL |
| Report ingest | **Done** | A1 |
| Diff | **Done** | A2 |
| Corner registry | **Done** | A3 → B1 |
| MMMC | **Done (MVP)** | B1 |
| UPF / Power | Planned | B2 |
| Liberty-lite | Planned | B4 |
| RTL CDC | Optional | B5 |
| SPEF | Optional | B6 |
| DFT | Optional | B7 |
| Physical lite | Optional | B8 |

---

## Summary

- **Strongly useful:** stabilize → ingest → diff → corners → ECO scripts → deeper graph.  
- **Expand scope:** **MMMC Studio** and **Power (UPF) Studio** are the right next products; your instincts match the architecture.  
- **Other strong ideas:** Report Hub, Timing Compare, Liberty-lite for real ECO cells, later DFT/IR.  
- **Keep integrating** path-level features into Timing; constraint/CDC into SDC; give UPF and MMMC **their own homes** when models get large.

When you pick a wave (e.g. “implement A0+A1” or “scaffold B1 MMMC”), that can be executed phase-by-phase against this file.
