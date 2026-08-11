/**
 * Timing Engine — multi-vendor STA report parser, accurate timing equations,
 * flow/tool-aware analysis, remediation solver, and schematic model.
 *
 * Vendors: Synopsys PrimeTime, Cadence Genus/Tempus, OpenSTA
 *
 * Connectivity uses shared graph-engine for path schematics & design graph.
 */

import {
  buildGraphFromTimingPaths,
  pathSchematicView,
  graphStats,
  type DesignGraph,
  type GraphStats,
  type TimingPathGraphInput,
} from "@/lib/graph-engine";

import {
  ingestReport,
  detectVendor as detectVendorIngest,
  detectFlowStage as detectFlowStageIngest,
  splitReportIntoBlocks,
  type IngestResult,
} from "@/lib/report-ingest-engine";

import {
  extractCornerFromBlock,
  extractViewNameFromBlock,
  aggregateCornerSummaries,
  type CornerSummary,
} from "@/lib/corner-model";

import {
  buildCellLadderCatalog,
  suggestEcoCellPicksForPath,
} from "@/lib/cell-ladder-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimingVendor = "synopsys" | "cadence" | "opensta" | "auto";
export type PathCheckType = "setup" | "hold";
export type PathKind = "reg2reg" | "in2reg" | "reg2out" | "in2out" | "unknown";
export type FlowStage = "synthesis" | "pnr" | "signoff" | "unknown";
export type EdgeDir = "r" | "f" | "";

export interface TimingStep {
  point: string;
  incr: number;
  path: number;
  dir: EdgeDir;
  /** Cell / library leaf name if present, e.g. AND2X2, dff */
  cell?: string;
  /** Arc description e.g. A1->ZN, CP->Q */
  arc?: string;
  fanout?: number;
  loadFf?: number;
  transPs?: number;
  /** Crosstalk / SI incremental delay on this stage (ns), if reported */
  siDeltaNs?: number;
  /** Classification for schematic / analysis */
  kind:
    | "clock"
    | "clock_network"
    | "launch_ff"
    | "capture_ff"
    | "cell"
    | "net"
    | "port"
    | "constraint"
    | "summary"
    | "other";
}

export interface SchematicNode {
  id: string;
  label: string;
  cell?: string;
  role: "port" | "ff" | "gate" | "pad" | "clock" | "other";
  delayNs: number;
  edge: EdgeDir;
  fanout?: number;
  isCritical?: boolean;
}

export interface SchematicEdge {
  from: string;
  to: string;
  delayNs: number;
  netName?: string;
}

export interface PathSchematic {
  nodes: SchematicNode[];
  edges: SchematicEdge[];
  totalCellDelayNs: number;
  totalNetDelayNs: number;
  logicLevels: number;
}

/** Full STA path with accurate equation components (all times in ns). */
export interface TimingPath {
  id: string;
  startpoint: string;
  endpoint: string;
  pathGroup: string;
  type: PathCheckType;
  pathKind: PathKind;
  slack: number;
  clock: string;
  captureClock?: string;
  levels: number;
  rawText: string;
  steps: TimingStep[];
  schematic: PathSchematic;
  /** Operating condition / corner string for multi-corner analysis */
  corner?: string;
  /** MMMC Analysis View or scenario name */
  viewName?: string;

  // --- Launch side ---
  launchEdge: number;
  launchSrcLatency: number;
  launchNetLatency: number;
  /** launchSrc + launchNet (or ideal network delay) */
  launchClockLatency: number;
  /** Driver adjust / CP->Q related launch contribution (Cadence) */
  launchDrvAdjust: number;
  inputDelay: number;

  // --- Capture side ---
  captureEdge: number;
  captureSrcLatency: number;
  captureNetLatency: number;
  captureClockLatency: number;
  outputDelay: number;
  uncertainty: number;
  librarySetup: number;
  libraryHold: number;

  // --- Derived path metrics ---
  dataPathDelay: number;
  cellDelayNs: number;
  netDelayNs: number;
  arrivalTime: number;
  requiredTime: number;
  /** Original reported slack (before any unit conversion issues) */
  reportedSlack: number;
  /** Computed slack from equations; should match reported within tolerance */
  computedSlack: number;
  equationError: number;

  isPs: boolean;
  unitLabel: "ns" | "ps";

  /** SI / noise attribution (report + heuristic) */
  si: PathSiInfo;
}

export interface SiAggressor {
  id: string;
  label: string;
  contributionNs: number;
  fanout?: number;
  /** report = explicit SI; heuristic = inferred risk from fanout/delay */
  source: "report" | "heuristic";
}

export interface PathSiInfo {
  hasReportedSi: boolean;
  /** Total SI/crosstalk delta on data path (ns) */
  siDeltaNs: number;
  /** Data path without SI portion */
  baseDataPathNs: number;
  /** siDelta / dataPath (0–1) */
  siFraction: number;
  aggressors: SiAggressor[];
  /** Heuristic noise risk 0–100 for UI badge */
  noiseRiskScore: number;
  notes: string[];
}

export interface TimingStudioState {
  paths: TimingPath[];
  wns: number;
  tns: number;
  wnsHold: number;
  tnsHold: number;
  failingCount: number;
  failingSetup: number;
  failingHold: number;
  totalPaths: number;
  vendor: TimingVendor;
  detectedVendor: TimingVendor;
  toolName?: string;
  designName?: string;
  operatingConditions?: string;
  wireloadMode?: string;
  areaMode?: string;
  flowStage: FlowStage;
  pathGroups: string[];
  clocks: string[];
  /** Unique MMMC analysis views detected across paths */
  analysisViews: string[];
  /** Aggregated multi-corner summary stats */
  corners: CornerSummary[];
  /** Aggregate SI stats across paths */
  siSummary: SiSummary;
  /** Shared connectivity graph across all parsed paths */
  designGraph: DesignGraph;
  graphStats: GraphStats;
}

export interface SiSummary {
  pathsWithReportedSi: number;
  totalSiDeltaNs: number;
  avgSiFraction: number;
  topAggressors: SiAggressor[];
  highNoisePaths: number;
}

// ---------------------------------------------------------------------------
// Remediation solver
// ---------------------------------------------------------------------------

export type SolverStage = "synthesis" | "pnr" | "signoff";

export interface SolverControls {
  /** 0–80: reduce input external delay / launch driver contribution (%) */
  slewReductionPct: number;
  /** 0–4: insert pipeline flops, divides combinational data path */
  pipelineStages: number;
  /** 0–100: fraction of cell delay swapped to LVT */
  lvtRatioPct: number;
  /** 0–50: gate upsizing reduces remaining cell delay (%) */
  gateUpsizePct: number;
  /** 0–40: buffer insertion / net-delay optimization (%) */
  bufferOptPct: number;
  /** Useful skew on capture (ns): positive = later capture edge (helps setup) */
  usefulSkewNs: number;
  /** Relax output external delay (%) */
  outputRelaxPct: number;
  /** 0–60: reduce attributed SI/crosstalk delta (shielding / spacing what-if) */
  siReductionPct: number;
}

export const DEFAULT_SOLVER: SolverControls = {
  slewReductionPct: 0,
  pipelineStages: 0,
  lvtRatioPct: 0,
  gateUpsizePct: 0,
  bufferOptPct: 0,
  usefulSkewNs: 0,
  outputRelaxPct: 0,
  siReductionPct: 0,
};

export interface SolverResult {
  path: TimingPath;
  arrivalTime: number;
  requiredTime: number;
  slack: number;
  dataPathDelay: number;
  inputDelay: number;
  outputDelay: number;
  levels: number;
  captureClockLatency: number;
  /** Breakdown of delay savings */
  savings: {
    slewNs: number;
    pipelineNs: number;
    lvtNs: number;
    upsizeNs: number;
    bufferNs: number;
    skewNs: number;
    outputNs: number;
    siNs: number;
  };
  met: boolean;
  deltaSlack: number;
  /** Data path after SI reduction applied in model */
  siDeltaNs: number;
}

/**
 * Physics-inspired remediation model applied to a parsed path.
 *
 * Setup:  slack = required − arrival
 * Hold:   slack = arrival − required  (solver knobs mostly help setup;
 *         useful skew sign is inverted for hold awareness)
 */
export function applySolver(
  path: TimingPath,
  ctrl: SolverControls,
  stage: SolverStage = "synthesis"
): SolverResult {
  const isHold = path.type === "hold";

  // Stage-dependent effectiveness multipliers (signoff ECO has less headroom)
  const stageMul =
    stage === "synthesis" ? 1.0 : stage === "pnr" ? 0.85 : 0.55;

  // Bound cell/net to reported data-path so solver never invents extra delay
  const dp = Math.max(0, path.dataPathDelay);
  let cellBase = Math.max(0, path.cellDelayNs);
  let netBase = Math.max(0, path.netDelayNs);
  if (cellBase + netBase < 1e-12 && dp > 0) {
    cellBase = dp * 0.7;
    netBase = dp * 0.3;
  } else if (cellBase + netBase > dp && dp > 0) {
    const scale = dp / (cellBase + netBase);
    cellBase *= scale;
    netBase *= scale;
  }
  const otherData = Math.max(0, dp - cellBase - netBase);

  // 1. Input driver / slew: reduces input_delay + launch drv adjust portion
  const launchPad = path.inputDelay + path.launchDrvAdjust;
  const slewNs =
    launchPad * (ctrl.slewReductionPct / 100) * stageMul;
  const simInput = path.inputDelay * (1 - (ctrl.slewReductionPct / 100) * stageMul);
  const simDrv =
    path.launchDrvAdjust * (1 - (ctrl.slewReductionPct / 100) * stageMul);

  // 2. Pipeline: splits combinational depth (cell+net only; I/O fixed)
  const pipeDiv = Math.max(1, ctrl.pipelineStages + 1);
  let cell = cellBase / pipeDiv;
  let net = netBase / pipeDiv;
  const pipelineNs = cellBase + netBase - (cell + net);

  // 3. LVT swap — primarily cell delay (15–28% depending on stage)
  const lvtEff =
    (stage === "signoff" ? 0.18 : stage === "pnr" ? 0.22 : 0.28) * stageMul;
  const lvtNs = cell * (ctrl.lvtRatioPct / 100) * lvtEff;
  cell -= lvtNs;

  // 4. Gate upsizing — cell delay
  const upsizeNs = cell * (ctrl.gateUpsizePct / 100) * 0.35 * stageMul;
  cell -= upsizeNs;

  // 5. Buffer / net optimization
  const bufferNs = net * (ctrl.bufferOptPct / 100) * 0.5 * stageMul;
  net -= bufferNs;

  // 5b. SI / crosstalk reduction (shield, spacing, aggressor slew) — what-if
  const siBase = Math.max(0, path.si?.siDeltaNs ?? 0);
  const siNs = siBase * (ctrl.siReductionPct / 100) * stageMul;
  const siLeft = Math.max(0, siBase - siNs);

  // Non-SI portion of data path after cell/net opts
  const nonSiData = Math.max(0, cell + net + otherData / pipeDiv);
  // Keep SI as additive residual unless data path already embeds it
  const embedsSi =
    path.si?.hasReportedSi &&
    path.dataPathDelay > 0 &&
    siBase > 0 &&
    path.si.baseDataPathNs > 0 &&
    Math.abs(path.dataPathDelay - (path.si.baseDataPathNs + siBase)) < 0.05;
  let simData = nonSiData;
  if (embedsSi) {
    // data path included SI: scale remaining SI into simData
    const basePart = Math.max(0, nonSiData - siBase * (nonSiData / (path.dataPathDelay || 1)));
    simData = Math.max(0, basePart + siLeft);
  } else if (siBase > 0) {
    // SI modeled as extra on top of structural data; reducing SI improves arrival
    simData = Math.max(0, nonSiData - siNs);
  }

  // 6. Useful skew: setup benefits from later capture; hold from earlier
  const skewApplied = isHold ? -ctrl.usefulSkewNs : ctrl.usefulSkewNs;
  const simCapLat = path.captureClockLatency + skewApplied;

  // 7. Output delay relaxation
  const outputNs = path.outputDelay * (ctrl.outputRelaxPct / 100);
  const simOut = path.outputDelay - outputNs;

  // Recompute arrival / required with full equations
  const arrival = computeArrival({
    launchEdge: path.launchEdge,
    launchClockLatency: path.launchClockLatency,
    launchDrvAdjust: simDrv,
    inputDelay: simInput,
    dataPathDelay: simData,
    pathKind: path.pathKind,
  });

  const required = computeRequired({
    type: path.type,
    captureEdge: path.captureEdge,
    captureClockLatency: simCapLat,
    uncertainty: path.uncertainty,
    librarySetup: path.librarySetup,
    libraryHold: path.libraryHold,
    outputDelay: simOut,
    pathKind: path.pathKind,
  });

  const slack = isHold ? arrival - required : required - arrival;
  const levels = Math.max(0, Math.round(path.levels / pipeDiv));

  return {
    path,
    arrivalTime: arrival,
    requiredTime: required,
    slack,
    dataPathDelay: simData,
    inputDelay: simInput,
    outputDelay: simOut,
    levels,
    captureClockLatency: simCapLat,
    savings: {
      slewNs,
      pipelineNs,
      lvtNs,
      upsizeNs,
      bufferNs,
      skewNs: Math.abs(skewApplied),
      outputNs,
      siNs,
    },
    met: slack >= 0,
    deltaSlack: slack - path.slack,
    siDeltaNs: siLeft,
  };
}

// ---------------------------------------------------------------------------
// Timing equations (industry-standard STA)
// ---------------------------------------------------------------------------

function computeArrival(p: {
  launchEdge: number;
  launchClockLatency: number;
  launchDrvAdjust: number;
  inputDelay: number;
  dataPathDelay: number;
  pathKind: PathKind;
}): number {
  // Standard:
  //   reg*  : launch_edge + launch_latency + (cpq + combo)  [dataPath includes cpq]
  //   in*   : launch_edge + launch_latency + input_delay + combo
  // Cadence often folds drv adjust into launch column separately.
  const base =
    p.launchEdge +
    p.launchClockLatency +
    p.launchDrvAdjust +
    p.inputDelay +
    p.dataPathDelay;
  return base;
}

function computeRequired(p: {
  type: PathCheckType;
  captureEdge: number;
  captureClockLatency: number;
  uncertainty: number;
  librarySetup: number;
  libraryHold: number;
  outputDelay: number;
  pathKind: PathKind;
}): number {
  if (p.type === "hold") {
    // Hold: required = capture_edge + capture_latency + uncertainty + hold
    // (output_delay on hold is typically min output delay add)
    return (
      p.captureEdge +
      p.captureClockLatency +
      p.uncertainty +
      p.libraryHold +
      (p.pathKind === "reg2out" || p.pathKind === "in2out" ? p.outputDelay : 0)
    );
  }
  // Setup: required = capture_edge + capture_latency − uncertainty − setup − output_delay
  return (
    p.captureEdge +
    p.captureClockLatency -
    p.uncertainty -
    p.librarySetup -
    p.outputDelay
  );
}

// ---------------------------------------------------------------------------
// Mock reports
// ---------------------------------------------------------------------------

export const MOCK_STA_REPORTS = {
  synopsys: `****************************************
Report : timing
Design : u_core
Version: U-2023.03-SP2
****************************************

Startpoint: u_core/reg_a (rising edge-triggered flip-flop clocked by clk_sys)
Endpoint: u_core/mem_ctrl/reg_data (rising edge-triggered flip-flop clocked by clk_sys)
Path Group: clk_sys
Path Type: max

Point                                    Incr       Path
-----------------------------------------------------------
clock clk_sys (rising edge)              0.00       0.00
clock network delay (ideal)              0.25       0.25
u_core/reg_a/CP (DFFRX1)                 0.00       0.25 r
u_core/reg_a/Q (DFFRX1)                  0.18       0.43 f
u_core/mem_ctrl/u_gate/Y (AND2X2)        0.35       0.78 r
u_core/mem_ctrl/u_buf/Y (BUFX4)          0.42       1.20 r
u_core/mem_ctrl/reg_data/D (DFFRX1)      0.30       1.50 r
data arrival time                                   1.50

clock clk_sys (rising edge)              1.00       1.00
clock network delay (ideal)              0.22       1.22
clock uncertainty                       -0.05       1.17
u_core/mem_ctrl/reg_data/setup (DFFRX1) -0.08       1.09
data required time                                  1.09
-----------------------------------------------------------
data required time                                  1.09
data arrival time                                  -1.50
-----------------------------------------------------------
slack (VIOLATED)                                   -0.41

Startpoint: u_core/reg_b (rising edge-triggered flip-flop clocked by clk_sys)
Endpoint: u_core/reg_c (rising edge-triggered flip-flop clocked by clk_sys)
Path Group: clk_sys
Path Type: max

Point                                    Incr       Path
-----------------------------------------------------------
clock clk_sys (rising edge)              0.00       0.00
clock network delay (ideal)              0.20       0.20
u_core/reg_b/CP (DFFRX1)                 0.00       0.20 r
u_core/reg_b/Q (DFFRX1)                  0.11       0.31 r
u_core/logic/u_or/Y (OR2X1)              0.08       0.39 r
u_core/reg_c/D (DFFRX1)                  0.02       0.41 r
data arrival time                                   0.41

clock clk_sys (rising edge)              1.00       1.00
clock network delay (ideal)              0.20       1.20
clock uncertainty                       -0.05       1.15
u_core/reg_c/setup (DFFRX1)             -0.08       1.07
data required time                                  1.07
-----------------------------------------------------------
data required time                                  1.07
data arrival time                                  -0.41
-----------------------------------------------------------
slack (MET)                                         0.66

Startpoint: u_core/reg_fast (rising edge-triggered flip-flop clocked by clk_sys)
Endpoint: u_core/reg_near (rising edge-triggered flip-flop clocked by clk_sys)
Path Group: clk_sys
Path Type: min

Point                                    Incr       Path
-----------------------------------------------------------
clock clk_sys (rising edge)              0.00       0.00
clock network delay (ideal)              0.15       0.15
u_core/reg_fast/CP (DFFRX1)              0.00       0.15 r
u_core/reg_fast/Q (DFFRX1)               0.05       0.20 r
u_core/reg_near/D (DFFRX1)               0.01       0.21 r
data arrival time                                   0.21

clock clk_sys (rising edge)              0.00       0.00
clock network delay (ideal)              0.28       0.28
clock uncertainty                        0.03       0.31
u_core/reg_near/hold (DFFRX1)            0.04       0.35
data required time                                  0.35
-----------------------------------------------------------
data required time                                  0.35
data arrival time                                  -0.21
-----------------------------------------------------------
slack (VIOLATED)                                   -0.14`,

  cadence: `============================================================
  Generated by:           Genus(TM) Synthesis Solution 25.13-s071_1
  Generated on:           Jul 31 2026  05:19:12 pm
  Module:                 pad_top
  Operating conditions:   ssgnp0p72v1p62vm40c (balanced_tree)
  Wireload mode:          segmented
  Area mode:              timing library
============================================================


Path 1: VIOLATED (-3495 ps) Late External Delay Assertion at pin pad_zero_flag
          Group: CLK
  Analysis View: func_setup_view
     Startpoint: (R) pad_addr_i[2]
          Clock: (R) CLK
       Endpoint: (F) pad_zero_flag
          Clock: (R) CLK

                     Capture       Launch     
        Clock Edge:+    2000            0     
        Drv Adjust:+       0         2739     
       Src Latency:+       0            0     
       Net Latency:+       0 (I)        0 (I) 
           Arrival:=    2000         2739     
                                              
      Output Delay:-     200                  
     Required Time:=    1800                  
      Launch Clock:-    2739                  
       Input Delay:-     100                  
         Data Path:-    2457                  
             Slack:=   -3495                  

Exceptions/Constraints:
  input_delay              100             top_func.sdc_2_line_9_55_1    
  output_delay             200             top_func.sdc_2_line_10_84_1   

#------------------------------------------------------------------------------------------------------------
#      Timing Point       Flags    Arc   Edge        Cell          Fanout  Load Trans Delay Arrival Instance 
#                                                                          (fF)  (ps)  (ps)   (ps)  Location 
#------------------------------------------------------------------------------------------------------------
  pad_addr_i[2]           -       -      R     (arrival)                1 751.6  4748     0    2839    (-,-) 
  g_pad_addr_i[2].u_pad/C -       PAD->C R     PDIDWUWSWCDG_V          18  16.5    45   731    3569    (-,-) 
  u_core/g26846/ZN        -       I->ZN  F     INVSKND10BWP16P90       16  16.6    17    30    3599    (-,-) 
  u_core/g26727__5477/ZN  -       A1->ZN F     INR2D6BWP16P90           6   6.7    12    33    3632    (-,-) 
  u_core/g26609__5115/ZN  -       A1->ZN R     ND2D1BWP16P90            1   1.1    13    16    3648    (-,-) 
  u_core/g26414__5107/ZN  -       A1->ZN F     ND3OPTPAD2BWP16P90       1   1.7    17    19    3666    (-,-) 
  u_core/g26336__1617/ZN  -       A1->ZN R     NR2SKPBD4BWP16P90        2   4.1    20    23    3689    (-,-) 
  u_core/g26314/ZN        -       I->ZN  F     CKND3BWP16P90            2   2.1     8    15    3704    (-,-) 
  u_core/g27040__7482/ZN  -       A1->ZN R     ND2SKND2BWP16P90         3   2.3    16    15    3719    (-,-) 
  u_core/g26182__4733/ZN  -       A1->ZN F     ND2D2BWP16P90            2   2.6    19    22    3741    (-,-) 
  u_core/g26944__3680/ZN  -       B1->ZN R     IND2D4BWP16P90           2   3.0    11    17    3758    (-,-) 
  u_core/g26045__5526/ZN  -       B2->ZN F     AOI22D4BWP16P90          3   2.3    16    21    3778    (-,-) 
  u_core/g26018__7098/ZN  -       A1->ZN R     IOAI21D1BWP16P90         2   2.1    37    36    3814    (-,-) 
  u_core/g26869__4319/ZN  -       B1->ZN F     IND3OPTPAD2BWP16P90      2   1.1    14    29    3843    (-,-) 
  u_core/g25959__6260/ZN  -       B3->ZN R     IND4D1BWP16P90           1   1.2    16    19    3861    (-,-) 
  u_core/g25957__2398/ZN  -       A1->ZN R     IND4D4BWP16P90           1   3.2    15    32    3893    (-,-) 
  u_core/g16638/ZN        -       I->ZN  F     INVSKND6BWP16P90         2   4.8     8    13    3906    (-,-) 
  u_pad_zero_flag/PAD     -       I->PAD F     PDDWUWSWCDG_V            1 941.8   536  1390    5295    (-,-) 
  pad_zero_flag           -       -      F     (port)                   -     -     -     0    5295    (-,-) 
#------------------------------------------------------------------------------------------------------------

Path 2: MET (120 ps)  reg-to-reg path
          Group: CLK
  Analysis View: func_setup_view
     Startpoint: (R) u_core/reg_a/Q
          Clock: (R) CLK
       Endpoint: (R) u_core/reg_b/D
          Clock: (R) CLK

                     Capture       Launch     
        Clock Edge:+    2000            0     
        Drv Adjust:+       0            0     
       Src Latency:+      50           45     
       Net Latency:+     120 (I)       80 (I) 
           Arrival:=    2170          125     
                                              
      Output Delay:-       0                  
     Required Time:=    2120                  
      Launch Clock:-     125                  
       Input Delay:-       0                  
         Data Path:-    1880                  
             Slack:=     120                  

#------------------------------------------------------------------------------------------------------------
#      Timing Point       Flags    Arc   Edge        Cell          Fanout  Load Trans Delay Arrival Instance 
#------------------------------------------------------------------------------------------------------------
  u_core/reg_a/CP         -       -      R     DFFRHQX1                 1   2.0    20     0     125    (-,-) 
  u_core/reg_a/Q          -       CP->Q  R     DFFRHQX1                 3   8.5    35    90     215    (-,-) 
  u_core/u_and/ZN         -       A1->ZN R     AN2D2BWP16P90            2   4.0    18   450     665    (-,-) 
  u_core/u_or/ZN          -       A1->ZN F     OR2D1BWP16P90            1   2.1    14   800    1465    (-,-) 
  u_core/u_buf/Z          -       I->Z   R     BUFFD4BWP16P90           1   3.0    12   535    2000    (-,-) 
  u_core/reg_b/D          -       -      F     DFFRHQX1                 -     -     -     0    2000    (-,-) 
#------------------------------------------------------------------------------------------------------------`,

  opensta: `Startpoint: u_alu/reg_op1 (rising edge-triggered flip-flop clocked by clk_sys)
Endpoint: u_alu/reg_out (rising edge-triggered flip-flop clocked by clk_sys)
Path Group: clk_sys
Path Type: setup

  Delay    Time   Description
---------------------------------------------------------
   0.00    0.00   clock clk_sys (rising edge)
   0.00    0.00   clock source latency
   0.12    0.12   clock network delay (propagated)
   0.00    0.12 r u_alu/reg_op1/CP (DFF_X1)
   0.10    0.22 r u_alu/reg_op1/Q (DFF_X1)
   0.45    0.67 f u_alu/u_add/u_carry/Y (ADD_X1)
   0.08    0.75 r u_alu/u_mux/Y (MUX2_X1)
   0.00    0.75 f u_alu/reg_out/D (DFF_X1)
           0.75   data arrival time

   1.00    1.00   clock clk_sys (rising edge)
   0.00    1.00   clock source latency
   0.10    1.10   clock network delay (propagated)
  -0.05    1.05   clock uncertainty
  -0.04    1.01   u_alu/reg_out setup time
           1.01   data required time
---------------------------------------------------------
           1.01   data required time
          -0.75   data arrival time
---------------------------------------------------------
           0.26   slack (MET)`,

  multicorner: `============================================================
  Generated by:           Genus(TM) Synthesis Solution 25.13-s071_1
  Module:                 top_core
============================================================

Path 1: VIOLATED (-0.350 ns) Late External Delay Assertion at pin pad_out[0]
  Operating conditions:   ssgnp0p72v1p62vm40c (balanced_tree)
  Group: clk_sys
  Startpoint: reg_src/CP
  Endpoint: pad_out[0]
  Slack: -0.350 ns

#------------------------------------------------------------------------------------------------------------
#      Timing Point       Flags    Arc   Edge        Cell          Fanout  Load Trans Delay Arrival Instance 
#------------------------------------------------------------------------------------------------------------
  reg_src/CP              -       -      R     DFFRHQX1                 1   2.0    20     0     125    (-,-) 
  reg_src/Q               -       CP->Q  R     DFFRHQX1                 3   8.5    35    90     215    (-,-) 
  u_logic/Y               -       A->Y   R     BUFFD4BWP16P90           1   3.0    12   535    1200    (-,-) 
  pad_out[0]              -       -      F     PAD_OUT                  -     -     -     0    1200    (-,-) 
#------------------------------------------------------------------------------------------------------------

Path 2: MET (0.150 ns) Early External Delay Assertion at pin pad_out[0]
  Operating conditions:   ffg0p88v1p98v125c (balanced_tree)
  Group: clk_sys
  Startpoint: reg_src/CP
  Endpoint: pad_out[0]
  Slack: 0.150 ns

#------------------------------------------------------------------------------------------------------------
#      Timing Point       Flags    Arc   Edge        Cell          Fanout  Load Trans Delay Arrival Instance 
#------------------------------------------------------------------------------------------------------------
  reg_src/CP              -       -      R     DFFRHQX1                 1   2.0    15     0      80    (-,-) 
  reg_src/Q               -       CP->Q  R     DFFRHQX1                 3   8.5    25    60     140    (-,-) 
  u_logic/Y               -       A->Y   R     BUFFD4BWP16P90           1   3.0     8   300     440    (-,-) 
  pad_out[0]              -       -      F     PAD_OUT                  -     -     -     0     440    (-,-) 
#------------------------------------------------------------------------------------------------------------`,
};

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

export function detectVendor(text: string): TimingVendor {
  return detectVendorIngest(text);
}

export function detectFlowStage(
  toolName: string,
  text: string,
  wireloadMode?: string
): FlowStage {
  return detectFlowStageIngest(toolName, text, wireloadMode);
}

function inferPathKind(start: string, end: string, steps: TimingStep[]): PathKind {
  const s = start.toLowerCase();
  const e = end.toLowerCase();
  const hasLaunchFf = steps.some((x) => x.kind === "launch_ff");
  const hasCaptureFf = steps.some((x) => x.kind === "capture_ff");
  const startPort =
    s.includes("pad_") ||
    s.includes("port") ||
    (!s.includes("/") && !hasLaunchFf) ||
    /\[.*\]/.test(start) && !s.includes("reg");
  const endPort =
    e.includes("pad_") ||
    e.includes("port") ||
    steps.some((x) => x.kind === "port" && x.point === end);

  // Better heuristics from pin names
  const startIsFf =
    /\/(q|qn|qk|cp|ck|clk)$/i.test(start) ||
    /reg/i.test(start) ||
    hasLaunchFf;
  const endIsFf =
    /\/(d|si|se)$/i.test(end) || /reg/i.test(end) || hasCaptureFf;

  if ((startPort || !startIsFf) && (endPort || !endIsFf)) return "in2out";
  if ((startPort || !startIsFf) && endIsFf) return "in2reg";
  if (startIsFf && (endPort || !endIsFf)) return "reg2out";
  if (startIsFf && endIsFf) return "reg2reg";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Schematic builder
// ---------------------------------------------------------------------------

function classifyStep(point: string, cell?: string, rawLine?: string): TimingStep["kind"] {
  const p = point.toLowerCase();
  const line = (rawLine || "").toLowerCase();
  if (p.startsWith("clock ") || line.includes("rising edge") || line.includes("falling edge")) {
    if (line.includes("network") || line.includes("latency") || line.includes("source")) {
      return "clock_network";
    }
    return "clock";
  }
  if (
    p.includes("uncertainty") ||
    p.includes("setup") ||
    p.includes("hold") ||
    p.includes("library") ||
    p.includes("recover") ||
    p.includes("removal")
  ) {
    return "constraint";
  }
  if (p.includes("data arrival") || p.includes("data required") || p.includes("slack")) {
    return "summary";
  }
  if (/\((port|arrival)\)/i.test(cell || "") || p.includes("pad_") && !p.includes("/")) {
    return "port";
  }
  // Flip-flop pins
  if (/\/(cp|ck|clk|qn?|d|si)$/i.test(point) || /dff|sdff|fd[a-z0-9]|dfxtp|dfxbp/i.test(cell || "")) {
    if (/\/(cp|ck|clk)$/i.test(point)) return "launch_ff";
    if (/\/d$/i.test(point)) return "capture_ff";
    if (/\/qn?$/i.test(point)) return "launch_ff";
    return "cell";
  }
  if (cell && cell !== "-" && !cell.includes("arrival") && !cell.includes("port")) {
    return "cell";
  }
  if (point.includes("/")) return "cell";
  return "other";
}

function roleFromGraphKind(
  kind: string
): SchematicNode["role"] {
  if (kind === "ff") return "ff";
  if (kind === "port") return "port";
  if (kind === "pad") return "pad";
  if (kind === "gate") return "gate";
  if (kind === "clock" || kind === "virtual_clock" || kind === "generated_clock")
    return "clock";
  return "other";
}

function buildSchematic(
  steps: TimingStep[],
  start: string,
  end: string,
  pathId = "path"
): PathSchematic {
  // Prefer shared graph engine for connectivity
  const input: TimingPathGraphInput = {
    id: pathId,
    startpoint: start,
    endpoint: end,
    clock: "clk",
    steps: steps.map((s) => ({
      point: s.point,
      incr: s.incr,
      cell: s.cell,
      fanout: s.fanout,
      kind: s.kind,
      dir: s.dir,
    })),
  };
  const g = buildGraphFromTimingPaths([input]);
  const view = pathSchematicView(g, pathId);
  if (view.nodes.length > 0) {
    return {
      nodes: view.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        cell: n.cell,
        role: roleFromGraphKind(n.kind),
        delayNs: n.delayNs,
        edge: "" as EdgeDir,
        fanout: n.fanout,
        isCritical: n.isCritical,
      })),
      edges: view.edges.map((e) => ({
        from: e.from,
        to: e.to,
        delayNs: e.delayNs,
        netName: e.label,
      })),
      totalCellDelayNs: view.totalCellDelayNs,
      totalNetDelayNs: view.totalNetDelayNs,
      logicLevels: view.logicLevels,
    };
  }

  // Fallback: start/end only
  return {
    nodes: [
      { id: "start", label: start, role: "ff", delayNs: 0, edge: "r" },
      { id: "end", label: end, role: "ff", delayNs: 0, edge: "r" },
    ],
    edges: [{ from: "start", to: "end", delayNs: 0 }],
    totalCellDelayNs: 0,
    totalNetDelayNs: 0,
    logicLevels: 0,
  };
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

/**
 * Centralized STA/SDC unit normalizer.
 * Converts time values (strings, numbers, or tokens with units like ns/ps/us)
 * to standard nanoseconds (ns).
 */
export function parseTimeToken(
  value: string | number | undefined | null,
  unitHint?: string,
  contextIsPs?: boolean
): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    if (unitHint?.toLowerCase() === "ps" || (!unitHint && contextIsPs)) {
      return value / 1000;
    }
    if (unitHint?.toLowerCase() === "us") {
      return value * 1000;
    }
    return value;
  }

  const s = value.trim();
  if (!s) return 0;

  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*(ps|ns|us|ms|s)?$/i);
  if (m) {
    const num = parseFloat(m[1]);
    if (!Number.isFinite(num)) return 0;
    const unit = (m[2] || unitHint || (contextIsPs ? "ps" : "ns")).toLowerCase();
    if (unit === "ps") return num / 1000;
    if (unit === "us") return num * 1000;
    if (unit === "ms") return num * 1000000;
    if (unit === "s") return num * 1000000000;
    return num;
  }

  const numMatch = s.match(/-?\d+(?:\.\d+)?/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[0]);
  if (!Number.isFinite(num)) return 0;

  const isPs =
    /\bps\b/i.test(s) ||
    unitHint?.toLowerCase() === "ps" ||
    (contextIsPs && !/\bns\b/i.test(s));
  return isPs ? num / 1000 : num;
}

function toNs(v: number, isPs: boolean): number {
  return parseTimeToken(v, undefined, isPs);
}

function parseNum(s: string | undefined): number | null {
  if (s === undefined || s === null) return null;
  const n = parseFloat(s.replace(/[(),]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Path block splitter
// ---------------------------------------------------------------------------

function splitPathBlocks(text: string, vendor: TimingVendor): string[] {
  return splitReportIntoBlocks(text, vendor).map((b) => b.rawText);
}

// ---------------------------------------------------------------------------
// Public API: parseTimingReport (Facade over ingestReport)
// ---------------------------------------------------------------------------

export function parseTimingReport(
  text: string,
  vendor: TimingVendor = "auto"
): TimingStudioState {
  const empty: TimingStudioState = {
    paths: [],
    wns: 0,
    tns: 0,
    wnsHold: 0,
    tnsHold: 0,
    failingCount: 0,
    failingSetup: 0,
    failingHold: 0,
    totalPaths: 0,
    vendor,
    detectedVendor: "synopsys",
    flowStage: "unknown",
    pathGroups: [],
    clocks: [],
    analysisViews: [],
    corners: [],
    siSummary: emptySiSummary(),
    designGraph: buildGraphFromTimingPaths([]),
    graphStats: graphStats(buildGraphFromTimingPaths([])),
  };

  if (!text || !text.trim()) return empty;

  const ingest = ingestReport(text, vendor);
  const effectiveVendor = ingest.vendor;
  const isPsGlobal = ingest.isPs;

  const paths: TimingPath[] = [];

  ingest.rawBlocks.forEach((rawBlock, idx) => {
    const block = rawBlock.rawText;
    const header = parsePathHeader(block);
    if (header.startpoint === "unknown" && !/Path\s+\d+/i.test(block)) return;

    let metrics: ExtractedMetrics;
    if (effectiveVendor === "cadence") {
      metrics = parseCadenceBlock(block);
    } else if (effectiveVendor === "opensta") {
      metrics = parseOpenStaBlock(block, isPsGlobal);
    } else {
      metrics = parseSynopsysBlock(block, isPsGlobal);
    }

    if (metrics.slack === null && metrics.arrivalTime === null && metrics.steps.length < 2) {
      return;
    }

    const path = finalizePath(idx, block, header, metrics);
    if (path.startpoint !== "unknown" || path.steps.length > 0) {
      if (path.slack !== 999) paths.push(path);
    }
  });

  const setupPaths = paths.filter((p) => p.type === "setup");
  const holdPaths = paths.filter((p) => p.type === "hold");
  const failingSetup = setupPaths.filter((p) => p.slack < 0);
  const failingHold = holdPaths.filter((p) => p.slack < 0);

  const minSetup = setupPaths.length ? Math.min(...setupPaths.map((p) => p.slack)) : 0;
  const minHold = holdPaths.length ? Math.min(...holdPaths.map((p) => p.slack)) : 0;

  const wnsReport = setupPaths.length ? Math.min(...setupPaths.map((p) => p.slack)) : 0;
  const wnsHoldReport = holdPaths.length ? Math.min(...holdPaths.map((p) => p.slack)) : 0;

  const tns = failingSetup.reduce((a, p) => a + p.slack, 0);
  const tnsHold = failingHold.reduce((a, p) => a + p.slack, 0);

  const pathGroups = [...new Set(paths.map((p) => p.pathGroup))];
  const clocks = [...new Set(paths.map((p) => p.clock).filter(Boolean))];
  const analysisViews = [...new Set(paths.map((p) => p.viewName).filter(Boolean) as string[])];
  const corners = aggregateCornerSummaries(paths);
  const siSummary = buildSiSummary(paths);

  const designGraph = buildGraphFromTimingPaths(
    paths.map((p) => ({
      id: p.id,
      startpoint: p.startpoint,
      endpoint: p.endpoint,
      clock: p.clock,
      captureClock: p.captureClock,
      steps: p.steps,
      si: p.si,
    }))
  );
  const gStats = graphStats(designGraph);

  return {
    paths,
    wns: parseFloat(wnsReport.toFixed(4)),
    tns: parseFloat(tns.toFixed(4)),
    wnsHold: parseFloat(wnsHoldReport.toFixed(4)),
    tnsHold: parseFloat(tnsHold.toFixed(4)),
    failingCount: failingSetup.length + failingHold.length,
    failingSetup: failingSetup.length,
    failingHold: failingHold.length,
    totalPaths: paths.length,
    vendor: effectiveVendor,
    detectedVendor: ingest.detectedVendor,
    toolName: ingest.tool,
    designName: ingest.designName,
    operatingConditions: ingest.operatingConditions,
    wireloadMode: ingest.wireloadMode,
    areaMode: ingest.areaMode,
    flowStage: ingest.stage,
    pathGroups,
    clocks,
    analysisViews,
    corners,
    siSummary,
    designGraph,
    graphStats: gStats,
  };
}

// ---------------------------------------------------------------------------
// Synopsys / OpenSTA table parsers
// ---------------------------------------------------------------------------

interface ExtractedMetrics {
  launchEdge: number;
  captureEdge: number;
  launchClockLatency: number;
  captureClockLatency: number;
  launchSrcLatency: number;
  captureSrcLatency: number;
  launchNetLatency: number;
  captureNetLatency: number;
  launchDrvAdjust: number;
  inputDelay: number;
  outputDelay: number;
  dataPathDelay: number;
  uncertainty: number;
  librarySetup: number;
  libraryHold: number;
  arrivalTime: number | null;
  requiredTime: number | null;
  slack: number | null;
  steps: TimingStep[];
  isPs: boolean;
}

function emptyMetrics(isPs = false): ExtractedMetrics {
  return {
    launchEdge: 0,
    captureEdge: 0,
    launchClockLatency: 0,
    captureClockLatency: 0,
    launchSrcLatency: 0,
    captureSrcLatency: 0,
    launchNetLatency: 0,
    captureNetLatency: 0,
    launchDrvAdjust: 0,
    inputDelay: 0,
    outputDelay: 0,
    dataPathDelay: 0,
    uncertainty: 0,
    librarySetup: 0,
    libraryHold: 0,
    arrivalTime: null,
    requiredTime: null,
    slack: null,
    steps: [],
    isPs,
  };
}

/** Parse Synopsys PrimeTime style path block */
function parseSynopsysBlock(block: string, isPsHint: boolean): ExtractedMetrics {
  const isPs = isPsHint || /\bps\b/i.test(block);
  const m = emptyMetrics(isPs);
  const lines = block.split("\n");

  // Phase: before "data arrival time" = launch; after = capture until required
  let phase: "launch" | "capture" | "done" = "launch";
  let sawDataArrival = false;

  // Synopsys: Point  Incr  Path [r|f]
  // e.g. "clock clk_sys (rising edge)              0.00       0.00"
  // e.g. "u_core/reg_a/Q (DFFRX1)                  0.12       0.37 f"
  const rowRe =
    /^\s*(\S.*?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+([rRfF]))?\s*$/;
  // Summary-only lines: "data arrival time                                   0.68"
  const summaryRe =
    /^\s*(data arrival time|data required time|slack\s*\([^)]+\))\s+(-?\d+(?:\.\d+)?)\s*$/i;

  for (const line of lines) {
    if (/^[\s\-|]+$/.test(line) || /point\s+incr\s+path/i.test(line)) continue;

    const sum = line.match(summaryRe);
    if (sum) {
      const label = sum[1].toLowerCase();
      const val = toNs(parseFloat(sum[2]), isPs);
      if (label.includes("arrival")) {
        m.arrivalTime = Math.abs(val);
        sawDataArrival = true;
        phase = "capture";
      } else if (label.includes("required")) {
        m.requiredTime = Math.abs(val);
      } else if (label.includes("slack")) {
        m.slack = val; // keep sign
      }
      continue;
    }

    // Alternate slack line: "slack (VIOLATED)                                   -0.41"
    const slackOnly = line.match(/slack\s*\([^)]*\)\s+(-?\d+(?:\.\d+)?)/i);
    if (slackOnly && m.slack === null) {
      m.slack = toNs(parseFloat(slackOnly[1]), isPs);
      continue;
    }

    const row = line.match(rowRe);
    if (!row) continue;

    const pointRaw = row[1].trim();
    const incr = toNs(parseFloat(row[2]), isPs);
    const pathVal = toNs(parseFloat(row[3]), isPs);
    const dir = (row[4]?.toLowerCase() as EdgeDir) || "";

    // Extract cell from "pin (CELL)"
    let point = pointRaw;
    let cell: string | undefined;
    const cellM = pointRaw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (cellM) {
      point = cellM[1].trim();
      cell = cellM[2].trim();
    }

    const kind = classifyStep(point, cell, line);
    m.steps.push({ point, incr, path: pathVal, dir, cell, kind });

    const pl = point.toLowerCase();
    const ll = line.toLowerCase();

    if (kind === "clock" && (ll.includes("rising edge") || ll.includes("falling edge"))) {
      if (phase === "launch" && !sawDataArrival) {
        m.launchEdge = pathVal;
      } else {
        m.captureEdge = pathVal;
      }
    } else if (
      kind === "clock_network" ||
      pl.includes("clock network") ||
      pl.includes("clock source") ||
      pl.includes("source latency") ||
      pl.includes("network delay")
    ) {
      if (phase === "launch" && !sawDataArrival) {
        m.launchClockLatency += incr;
        if (pl.includes("source")) m.launchSrcLatency += incr;
        else m.launchNetLatency += incr;
      } else {
        m.captureClockLatency += incr;
        if (pl.includes("source")) m.captureSrcLatency += incr;
        else m.captureNetLatency += incr;
      }
    } else if (pl.includes("uncertainty")) {
      // Incr is typically negative for setup (already subtracted in path)
      m.uncertainty = Math.abs(incr);
    } else if (pl.includes("setup") || ll.includes("setup time")) {
      m.librarySetup = Math.abs(incr);
    } else if (pl.includes("hold") || ll.includes("hold time")) {
      m.libraryHold = Math.abs(incr);
    } else if (pl.includes("input external delay") || pl.includes("input delay")) {
      m.inputDelay = Math.abs(incr);
    } else if (pl.includes("output external delay") || pl.includes("output delay")) {
      m.outputDelay = Math.abs(incr);
    }

    if (pl.includes("data arrival")) {
      m.arrivalTime = Math.abs(pathVal);
      sawDataArrival = true;
      phase = "capture";
    }
    if (pl.includes("data required")) {
      m.requiredTime = Math.abs(pathVal);
    }
  }

  // Data path delay from steps: from first cell after clock network to last data pin
  const dataSteps = m.steps.filter(
    (s) =>
      s.kind === "cell" ||
      s.kind === "launch_ff" ||
      s.kind === "capture_ff" ||
      s.kind === "port" ||
      s.kind === "other"
  );
  if (dataSteps.length > 0) {
    const first = dataSteps[0];
    const last = dataSteps[dataSteps.length - 1];
    // From launch clock pin through data: path at D - path at CP, or sum of incr after latency
    m.dataPathDelay = last.path - first.path + first.incr;
    // Better: sum incr of data steps excluding pure clock pins with 0
    const sumIncr = dataSteps.reduce((a, s) => a + Math.max(0, s.incr), 0);
    if (sumIncr > 0) m.dataPathDelay = sumIncr;
  }

  if (m.arrivalTime === null && dataSteps.length) {
    m.arrivalTime = dataSteps[dataSteps.length - 1].path;
  }

  return m;
}

/** Parse OpenSTA style (Delay Time Description) */
function parseOpenStaBlock(block: string, isPsHint: boolean): ExtractedMetrics {
  const isPs = isPsHint || /\bps\b/i.test(block);
  const m = emptyMetrics(isPs);
  const lines = block.split("\n");
  let phase: "launch" | "capture" = "launch";
  let sawArrival = false;

  // "   0.10    0.22 r u_alu/reg_op1/Q (DFF_X1)"
  // "           0.75   data arrival time"
  const rowRe =
    /^\s*(-?\d+(?:\.\d+)?)?\s+(-?\d+(?:\.\d+)?)\s+(?:([rRfF])\s+)?(.+?)\s*$/;

  for (const line of lines) {
    if (/^[\s\-|]+$/.test(line) || /delay\s+time\s+description/i.test(line)) continue;

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Summary without delay column
    const sum = trimmed.match(
      /^(data arrival time|data required time|slack\s*\([^)]+\))\s*$/i
    );
    // "0.75   data arrival time" already handled by rowRe

    const row = line.match(rowRe);
    if (!row) continue;

    const incrStr = row[1];
    const pathStr = row[2];
    const dir = (row[3]?.toLowerCase() as EdgeDir) || "";
    let desc = row[4].trim();

    const pathVal = toNs(parseFloat(pathStr), isPs);
    const incr = incrStr !== undefined && incrStr !== "" ? toNs(parseFloat(incrStr), isPs) : 0;

    const descL = desc.toLowerCase();
    if (descL.includes("data arrival")) {
      m.arrivalTime = Math.abs(pathVal);
      sawArrival = true;
      phase = "capture";
      continue;
    }
    if (descL.includes("data required")) {
      m.requiredTime = Math.abs(pathVal);
      continue;
    }
    if (descL.startsWith("slack")) {
      m.slack = pathVal;
      // Sometimes "0.26   slack (MET)" — pathVal is slack
      continue;
    }

    let cell: string | undefined;
    const cellM = desc.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    let point = desc;
    if (cellM) {
      point = cellM[1].trim();
      cell = cellM[2].trim();
    }

    // Strip leading edge letter if stuck in desc
    point = point.replace(/^[rRfF]\s+/, "");

    const kind = classifyStep(point, cell, line);
    m.steps.push({ point, incr, path: pathVal, dir, cell, kind });

    if (kind === "clock" && (descL.includes("rising edge") || descL.includes("falling edge"))) {
      if (phase === "launch" && !sawArrival) m.launchEdge = pathVal;
      else m.captureEdge = pathVal;
    } else if (
      descL.includes("network delay") ||
      descL.includes("source latency") ||
      descL.includes("clock source")
    ) {
      if (phase === "launch" && !sawArrival) {
        m.launchClockLatency += incr;
        if (descL.includes("source")) m.launchSrcLatency += incr;
        else m.launchNetLatency += incr;
      } else {
        m.captureClockLatency += incr;
        if (descL.includes("source")) m.captureSrcLatency += incr;
        else m.captureNetLatency += incr;
      }
    } else if (descL.includes("uncertainty")) {
      m.uncertainty = Math.abs(incr);
    } else if (descL.includes("setup")) {
      m.librarySetup = Math.abs(incr);
    } else if (descL.includes("hold")) {
      m.libraryHold = Math.abs(incr);
    } else if (descL.includes("input external") || descL.includes("input delay")) {
      m.inputDelay = Math.abs(incr);
    } else if (descL.includes("output external") || descL.includes("output delay")) {
      m.outputDelay = Math.abs(incr);
    }
  }

  // Slack from last line if needed
  if (m.slack === null) {
    const sm = block.match(/^\s*(-?\d+(?:\.\d+)?)\s+slack\s*\(/im);
    if (sm) m.slack = toNs(parseFloat(sm[1]), isPs);
  }

  const dataSteps = m.steps.filter(
    (s) =>
      s.kind === "cell" ||
      s.kind === "launch_ff" ||
      s.kind === "capture_ff" ||
      s.kind === "port" ||
      s.kind === "other"
  );
  if (dataSteps.length) {
    m.dataPathDelay = dataSteps.reduce((a, s) => a + Math.max(0, s.incr), 0);
  }

  return m;
}

/**
 * Detect whether Cadence path numbers are in picoseconds.
 * Innovus often reports ns (e.g. VIOLATED (-0.085 ns)); Genus/Tempus may use ps.
 * NEVER default to ps — that was collapsing real ns slacks to ~0.
 */
function detectCadenceIsPs(block: string): boolean {
  // Explicit unit in path banner: Path 1: VIOLATED (-0.085 ns)
  const banner = block.match(
    /(?:VIOLATED|MET)\s*\(\s*-?\d+(?:\.\d+)?\s*(ps|ns)\s*\)/i
  );
  if (banner) return banner[1].toLowerCase() === "ps";

  // Column headers
  if (/\bDelay\s*\(\s*ns\s*\)/i.test(block) || /\bArrival\s*\(\s*ns\s*\)/i.test(block)) {
    return false;
  }
  if (/\bDelay\s*\(\s*ps\s*\)/i.test(block) || /\bArrival\s*\(\s*ps\s*\)/i.test(block)) {
    return true;
  }
  // Bare (ns) / (ps) near table header
  if (/\(\s*ns\s*\)/i.test(block) && !/\(\s*ps\s*\)/i.test(block.slice(0, 2500))) {
    return false;
  }
  if (/\(\s*ps\s*\)/i.test(block.slice(0, 2500))) return true;

  // Clock edge magnitude: 1.000 → ns period; 2000 → ps period
  const edgeM = block.match(
    /Clock Edge:\+\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i
  );
  if (edgeM) {
    const cap = Math.abs(parseFloat(edgeM[1]));
    if (cap > 0 && cap < 100) return false;
    if (cap >= 100) return true;
  }

  // Slack magnitude: -0.085 → ns; -3495 → ps
  const slackM =
    block.match(/Slack:=\s*(-?\d+(?:\.\d+)?)/i) ||
    block.match(/(?:VIOLATED|MET)\s*\(\s*(-?\d+(?:\.\d+)?)/i);
  if (slackM) {
    const s = Math.abs(parseFloat(slackM[1]));
    if (s > 0 && s < 50) return false;
    if (s >= 50) return true;
  }

  return false; // safe default: ns (Innovus / modern flows)
}

function parseCadenceNumToken(tok: string): number | null {
  if (tok === "-" || tok === "" || tok === undefined) return null;
  const n = parseFloat(tok);
  return Number.isFinite(n) ? n : null;
}

/** Parse Cadence Genus / Tempus / Innovus path block */
function parseCadenceBlock(block: string): ExtractedMetrics {
  const isPs = detectCadenceIsPs(block);
  const m = emptyMetrics(isPs);
  const u = (v: number) => toNs(v, isPs);

  // --- Summary (Capture | Launch columns) ---
  const edgeM = block.match(
    /Clock Edge:\+\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i
  );
  if (edgeM) {
    m.captureEdge = u(parseFloat(edgeM[1]));
    m.launchEdge = u(parseFloat(edgeM[2]));
  }

  const drvM = block.match(
    /Drv Adjust:\+\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i
  );
  if (drvM) {
    m.launchDrvAdjust = u(parseFloat(drvM[2]));
  }

  const srcM = block.match(
    /Src Latency:\+\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i
  );
  if (srcM) {
    m.captureSrcLatency = u(parseFloat(srcM[1]));
    m.launchSrcLatency = u(parseFloat(srcM[2]));
  }

  // Net latency may be negative (Innovus ideal clock / useful skew)
  const netM = block.match(
    /Net Latency:\+\s*(-?\d+(?:\.\d+)?)\s*(?:\([^)]*\))?\s+(-?\d+(?:\.\d+)?)/i
  );
  if (netM) {
    m.captureNetLatency = u(parseFloat(netM[1]));
    m.launchNetLatency = u(parseFloat(netM[2]));
  }

  m.launchClockLatency = m.launchSrcLatency + m.launchNetLatency;
  m.captureClockLatency = m.captureSrcLatency + m.captureNetLatency;

  const outM = block.match(/Output Delay:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (outM) m.outputDelay = u(Math.abs(parseFloat(outM[1])));

  const inM = block.match(/Input Delay:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (inM) m.inputDelay = u(Math.abs(parseFloat(inM[1])));

  // Innovus: Data Path:+ 0.790   Genus: Data Path:- 2457
  const dpM = block.match(/Data Path:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (dpM) m.dataPathDelay = u(Math.abs(parseFloat(dpM[1])));

  const reqM = block.match(/Required Time:=\s*(-?\d+(?:\.\d+)?)/i);
  if (reqM) m.requiredTime = u(parseFloat(reqM[1]));

  // Launch Clock:= 0.045 (clock arrival at launch FF)
  const launchClkM = block.match(/Launch Clock:[=:-]?\s*(-?\d+(?:\.\d+)?)/i);
  let launchClockArrival: number | null = null;
  if (launchClkM) {
    launchClockArrival = u(Math.abs(parseFloat(launchClkM[1])));
  }

  // Prefer banner slack with its own unit (authoritative)
  const bannerSlack = block.match(
    /Path\s+\d+\s*:\s*(?:VIOLATED|MET)\s*\(\s*(-?\d+(?:\.\d+)?)\s*(ps|ns)?\s*\)/i
  );
  if (bannerSlack) {
    const raw = parseFloat(bannerSlack[1]);
    const unit = (bannerSlack[2] || "").toLowerCase();
    if (unit === "ps") m.slack = raw / 1000;
    else if (unit === "ns") m.slack = raw;
    else m.slack = u(raw);
  }

  const slackM = block.match(/Slack:=\s*(-?\d+(?:\.\d+)?)/i);
  if (slackM) {
    const fromLine = u(parseFloat(slackM[1]));
    if (m.slack === null) m.slack = fromLine;
  }

  const uncM = block.match(/Uncertainty:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (uncM) m.uncertainty = u(Math.abs(parseFloat(uncM[1])));

  const setupM = block.match(/(?:Library\s+)?Setup:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (setupM) m.librarySetup = u(Math.abs(parseFloat(setupM[1])));

  // Data arrival from summary equation when available:
  // arrival = launch_clock + data_path  (Innovus)
  if (launchClockArrival !== null && m.dataPathDelay > 0) {
    m.arrivalTime = launchClockArrival + m.dataPathDelay;
  }

  // --- Timing point table ---
  const isInnovusTable =
    /#\s*Instance\b/i.test(block) ||
    (/\bArc\b/i.test(block) && /\bRequired\b/i.test(block) && /\bPin\b/i.test(block));

  const lines = block.split("\n");
  let inTable = false;
  let headerSeen = false;
  let tableStyle: "genus" | "innovus" | null = isInnovusTable ? "innovus" : null;

  for (const line of lines) {
    if (/Timing Point/i.test(line)) {
      headerSeen = true;
      tableStyle = "genus";
      continue;
    }
    if (/#\s*Instance\b/i.test(line)) {
      headerSeen = true;
      tableStyle = "innovus";
      continue;
    }
    if (headerSeen && /^\s*#\s*(\(ns\)|\(ps\))/i.test(line)) continue;

    if (headerSeen && /^#?-{5,}/.test(line.trim())) {
      inTable = !inTable;
      continue;
    }
    if (!inTable || !line.trim() || line.trim().startsWith("#")) continue;

    if (tableStyle === "innovus") {
      // Parse from the right: (x,y) pin fanout trans required arrival delay ...
      const locM = line.match(/\(([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\)\s*$/);
      if (!locM || locM.index === undefined) continue;
      const beforeLoc = line.slice(0, locM.index).trim();
      const parts = beforeLoc.split(/\s+/);
      if (parts.length < 8) continue;

      const pin = parts[parts.length - 1];
      const fanoutTok = parts[parts.length - 2];
      const transTok = parts[parts.length - 3];
      const arrivalTok = parts[parts.length - 5];
      const delayTok = parts[parts.length - 6];

      const delay = parseCadenceNumToken(delayTok) ?? 0;
      const arrival = parseCadenceNumToken(arrivalTok) ?? 0;

      let arc: string | undefined;
      let cell: string | undefined;
      let inst = parts[0];
      for (let i = 1; i < Math.min(parts.length - 6, 8); i++) {
        const t = parts[i];
        if (t.includes("->") || t === "CP" || t === "CK" || t === "D" || t === "-") {
          arc = t === "-" ? undefined : t;
          if (i + 1 < parts.length) {
            cell = parts[i + 1].replace(/^\(|\)$/g, "");
          }
          inst = parts.slice(0, i).join(" ") || parts[0];
          break;
        }
      }

      const point = pin && pin !== "-" ? pin : inst;
      const kind = classifyStep(point, cell, line);
      m.steps.push({
        point,
        incr: u(delay),
        path: u(arrival),
        dir: "",
        cell,
        arc,
        fanout: parseCadenceNumToken(fanoutTok) ?? undefined,
        transPs: (() => {
          const t = parseCadenceNumToken(transTok);
          if (t === null) return undefined;
          return isPs ? t : t * 1000;
        })(),
        kind,
      });
      continue;
    }

    // Genus / Tempus classic Timing Point table
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;

    const point = parts[0];
    let dir: EdgeDir = "";
    let edgeIdx = -1;
    for (let i = 1; i < parts.length; i++) {
      if (parts[i] === "R" || parts[i] === "F") {
        dir = parts[i].toLowerCase() as EdgeDir;
        edgeIdx = i;
        break;
      }
    }

    let arrival = 0;
    let delay = 0;
    let fanout: number | undefined;
    let loadFf: number | undefined;
    let transPs: number | undefined;
    let cell: string | undefined;
    let arc: string | undefined;

    const last = parts[parts.length - 1];
    const hasLoc =
      (last.includes(",") && last.includes("(")) || /\(.*?,.*?\)/.test(last);
    const numEnd = hasLoc ? parts.length - 2 : parts.length - 1;

    const nums: number[] = [];
    for (let i = numEnd; i >= 1; i--) {
      const n = parseFloat(parts[i]);
      if (Number.isFinite(n) && /^-?\d/.test(parts[i])) {
        nums.unshift(n);
      } else if (parts[i] === "-") {
        nums.unshift(0);
      } else {
        break;
      }
    }
    if (nums.length >= 1) arrival = nums[nums.length - 1];
    if (nums.length >= 2) delay = nums[nums.length - 2];
    if (nums.length >= 3) transPs = nums[nums.length - 3];
    if (nums.length >= 4) loadFf = nums[nums.length - 4];
    if (nums.length >= 5) fanout = nums[nums.length - 5];

    if (edgeIdx >= 0) {
      for (let i = edgeIdx + 1; i < parts.length; i++) {
        if (/^[A-Za-z_(]/.test(parts[i]) && !/^-?\d/.test(parts[i])) {
          if (parts[i] === "-") continue;
          cell = parts[i].replace(/^\(|\)$/g, "");
          break;
        }
      }
      if (edgeIdx >= 1 && parts[edgeIdx - 1].includes("->")) {
        arc = parts[edgeIdx - 1];
      }
    }
    if (!cell) {
      const cm = line.match(/\((arrival|port)\)/i);
      if (cm) cell = cm[1];
    }

    const kind = classifyStep(point, cell, line);
    m.steps.push({
      point,
      incr: u(delay),
      path: u(arrival),
      dir,
      cell,
      arc,
      fanout,
      loadFf,
      transPs,
      kind,
    });
  }

  // Prefer summary arrival; fill from table if missing
  if (m.arrivalTime === null && m.steps.length) {
    m.arrivalTime = m.steps[m.steps.length - 1].path;
  } else if (m.steps.length && m.arrivalTime !== null) {
    const tableArr = m.steps[m.steps.length - 1].path;
    // Use table endpoint when close to summary equation (more precise pin arrival)
    if (tableArr > 0 && Math.abs(tableArr - m.arrivalTime) < 0.05) {
      m.arrivalTime = tableArr;
    }
  }

  // Derive data path if still missing
  if (m.dataPathDelay === 0 && m.arrivalTime !== null) {
    const launchRef =
      m.launchEdge + m.launchClockLatency + m.launchDrvAdjust + m.inputDelay;
    m.dataPathDelay = Math.max(0, m.arrivalTime - launchRef);
  }

  // If slack still null but we have arr/req, compute it
  if (m.slack === null && m.arrivalTime !== null && m.requiredTime !== null) {
    m.slack = m.requiredTime - m.arrivalTime;
  }

  return m;
}

// ---------------------------------------------------------------------------
// Finalize path object
// ---------------------------------------------------------------------------

function finalizePath(
  idx: number,
  block: string,
  header: {
    startpoint: string;
    endpoint: string;
    pathGroup: string;
    type: PathCheckType;
    clock: string;
    captureClock?: string;
    corner?: string;
    viewName?: string;
  },
  metrics: ExtractedMetrics
): TimingPath {
  const isPs = metrics.isPs;

  // Prefer reported slack
  let slack = metrics.slack ?? 999;
  const reportedSlack = slack;

  // Cell vs net delay estimate from steps
  const dataSteps = metrics.steps.filter(
    (s) =>
      s.kind === "cell" ||
      s.kind === "launch_ff" ||
      s.kind === "capture_ff" ||
      s.kind === "port" ||
      s.kind === "other"
  );
  let cellDelayNs = dataSteps
    .filter((s) => s.kind === "cell" || s.kind === "launch_ff")
    .reduce((a, s) => a + Math.max(0, s.incr), 0);
  let netDelayNs = Math.max(0, metrics.dataPathDelay - cellDelayNs);
  if (cellDelayNs === 0 && metrics.dataPathDelay > 0) {
    cellDelayNs = metrics.dataPathDelay * 0.7;
    netDelayNs = metrics.dataPathDelay * 0.3;
  }

  const schematic = buildSchematic(
    metrics.steps,
    header.startpoint,
    header.endpoint,
    `path_${idx + 1}`
  );
  if (schematic.totalCellDelayNs > 0) {
    cellDelayNs = schematic.totalCellDelayNs;
    netDelayNs = schematic.totalNetDelayNs;
  }

  const pathKind = inferPathKind(header.startpoint, header.endpoint, metrics.steps);

  // If capture edge missing, try to infer period from path group or default
  let captureEdge = metrics.captureEdge;
  let launchEdge = metrics.launchEdge;
  if (header.type === "setup" && captureEdge === 0 && metrics.requiredTime !== null) {
    // required ≈ capture + capLat - unc - setup - out
    // leave as 0 if unknown — arrival/required from report take priority
  }

  const arrivalTime =
    metrics.arrivalTime !== null
      ? metrics.arrivalTime
      : computeArrival({
          launchEdge,
          launchClockLatency: metrics.launchClockLatency,
          launchDrvAdjust: metrics.launchDrvAdjust,
          inputDelay: metrics.inputDelay,
          dataPathDelay: metrics.dataPathDelay,
          pathKind,
        });

  const requiredTime =
    metrics.requiredTime !== null
      ? metrics.requiredTime
      : computeRequired({
          type: header.type,
          captureEdge,
          captureClockLatency: metrics.captureClockLatency,
          uncertainty: metrics.uncertainty,
          librarySetup: metrics.librarySetup,
          libraryHold: metrics.libraryHold,
          outputDelay: metrics.outputDelay,
          pathKind,
        });

  const computedSlack =
    header.type === "hold" ? arrivalTime - requiredTime : requiredTime - arrivalTime;

  if (slack === 999) slack = computedSlack;
  const equationError = Math.abs(slack - computedSlack);

  // Logic levels
  let levels = schematic.logicLevels;
  if (levels === 0) {
    levels = dataSteps.filter(
      (s) => s.kind === "cell" && !/\/(cp|ck|clk|d|q)$/i.test(s.point)
    ).length;
  }

  const si = buildPathSiInfo(block, metrics.steps, metrics.dataPathDelay, isPs);

  return {
    id: `path_${idx + 1}`,
    startpoint: header.startpoint,
    endpoint: header.endpoint,
    pathGroup: header.pathGroup,
    type: header.type,
    pathKind,
    slack,
    clock: header.clock,
    captureClock: header.captureClock,
    corner: header.corner || "default_corner",
    viewName: header.viewName,
    levels,
    rawText: block,
    steps: metrics.steps,
    schematic,
    launchEdge,
    launchSrcLatency: metrics.launchSrcLatency,
    launchNetLatency: metrics.launchNetLatency,
    launchClockLatency: metrics.launchClockLatency,
    launchDrvAdjust: metrics.launchDrvAdjust,
    inputDelay: metrics.inputDelay,
    captureEdge,
    captureSrcLatency: metrics.captureSrcLatency,
    captureNetLatency: metrics.captureNetLatency,
    captureClockLatency: metrics.captureClockLatency,
    outputDelay: metrics.outputDelay,
    uncertainty: metrics.uncertainty,
    librarySetup: metrics.librarySetup,
    libraryHold: metrics.libraryHold,
    dataPathDelay: metrics.dataPathDelay,
    cellDelayNs,
    netDelayNs,
    arrivalTime,
    requiredTime,
    reportedSlack,
    computedSlack,
    equationError,
    isPs,
    unitLabel: "ns",
    si,
  };
}

function parsePathHeader(block: string): {
  startpoint: string;
  endpoint: string;
  pathGroup: string;
  type: PathCheckType;
  clock: string;
  captureClock?: string;
  corner?: string;
  viewName?: string;
} {
  let startpoint = "unknown";
  let endpoint = "unknown";

  const startMatch =
    block.match(/(?:Startpoint|Beginpoint):\s*(?:\([RF]\)\s*)?(\S+)/i) ||
    block.match(/Startpoint\s+:\s+(\S+)/i);
  if (startMatch) startpoint = startMatch[1].replace(/[()]/g, "");

  const endMatch =
    block.match(/(?:Endpoint|Endpoint Pin):\s*(?:\([RF]\)\s*)?(\S+)/i) ||
    block.match(/Endpoint\s+:\s+(\S+)/i);
  if (endMatch) endpoint = endMatch[1].replace(/[()]/g, "");

  let pathGroup = "default";
  const groupMatch = block.match(/(?:Path Group|Group):\s*(\S+)/i);
  if (groupMatch) pathGroup = groupMatch[1];

  let type: PathCheckType = "setup";
  if (/\b(?:min|hold|min_delay)\b/i.test(block) && !/\b(?:max|setup)\b/i.test(block)) {
    type = "hold";
  } else if (/\b(?:Path Type:\s*max|Path Type:\s*setup|late)\b/i.test(block)) {
    type = "setup";
  } else if (/\bhold\b/i.test(block) && !/\bsetup\b/i.test(block)) {
    type = "hold";
  }

  let clock = "clk";
  let captureClock: string | undefined;

  // Cadence dual clock lines
  const clocks = [...block.matchAll(/Clock:\s*(?:\([RF]\)\s*)?(\S+)/gi)].map((x) =>
    x[1].replace(/[()]/g, "")
  );
  if (clocks.length >= 1) clock = clocks[0];
  if (clocks.length >= 2) captureClock = clocks[1];

  const clockedBy = block.match(/clocked by\s+(\S+)/i);
  if (clockedBy) clock = clockedBy[1].replace(/[()]/g, "");

  if (clock === "clk") {
    const c = block.match(/clock\s+(\S+)\s+\(/i);
    if (c) clock = c[1];
  }

  const corner = extractCornerFromBlock(block);
  const viewName = extractViewNameFromBlock(block);

  return { startpoint, endpoint, pathGroup, type, clock, captureClock, corner, viewName };
}

// ---------------------------------------------------------------------------
// Tool / flow analysis guidelines
// ---------------------------------------------------------------------------

export interface FlowGuideline {
  title: string;
  desc: string;
  category: "sdc" | "logic" | "physical" | "library" | "clock" | "io";
  priority: "high" | "med" | "low";
}

export function getFlowGuidelines(
  path: TimingPath | null,
  stage: FlowStage | SolverStage,
  toolName?: string
): FlowGuideline[] {
  const tips: FlowGuideline[] = [];
  const tool = (toolName || "").toLowerCase();

  if (!path) {
    return [
      {
        title: "Load a timing report",
        desc: "Paste PrimeTime, Tempus/Genus, or OpenSTA path reports to unlock tool- and flow-aware guidance.",
        category: "sdc",
        priority: "high",
      },
    ];
  }

  const viol = path.slack < 0;
  const shortfall = viol ? Math.abs(path.slack) : 0;

  // Path-kind specific
  if (path.pathKind === "in2out" || path.pathKind === "in2reg") {
    tips.push({
      title: "Review input_delay / driving_cell",
      desc: `External input budget is ${path.inputDelay.toFixed(3)} ns and launch driver adjust is ${path.launchDrvAdjust.toFixed(3)} ns. Oversized input_delay or slow board-side drivers often dominate ${path.pathKind} paths.`,
      category: "io",
      priority: path.inputDelay + path.launchDrvAdjust > path.dataPathDelay * 0.3 ? "high" : "med",
    });
  }
  if (path.pathKind === "reg2out" || path.pathKind === "in2out") {
    tips.push({
      title: "Check output_delay & load",
      desc: `output_delay = ${path.outputDelay.toFixed(3)} ns. For pad paths, large I/O cell delay (${path.cellDelayNs.toFixed(3)} ns cell) often needs set_load / driving cell co-optimization.`,
      category: "io",
      priority: path.outputDelay > 0.1 ? "high" : "med",
    });
  }

  if (path.levels >= 6) {
    tips.push({
      title: "Deep combinational cloud",
      desc: `${path.levels} logic levels with data path ${path.dataPathDelay.toFixed(3)} ns. Consider retiming, pipeline registers, or operator balancing.`,
      category: "logic",
      priority: "high",
    });
  }

  if (path.uncertainty > 0.05) {
    tips.push({
      title: "Clock uncertainty budget",
      desc: `Uncertainty ${path.uncertainty.toFixed(3)} ns is eating setup margin. Confirm set_clock_uncertainty is not overly pessimistic for this corner.`,
      category: "clock",
      priority: "med",
    });
  }

  // Stage-specific
  if (stage === "synthesis") {
    tips.push({
      title: tool.includes("genus") ? "Genus wireload reality check" : "Wireload vs physical",
      desc: "Synthesis wireload models mis-estimate long nets. Re-run with physical-aware / early placement numbers before heavy logic restructuring.",
      category: "physical",
      priority: "med",
    });
    tips.push({
      title: "Compile / map effort",
      desc: viol
        ? `Need ~${shortfall.toFixed(3)} ns. Increase map effort, enable path grouping, and ungroup critical hierarchies.`
        : "Path is met — protect with path groups and disable incremental area squeeze on this endpoint.",
      category: "logic",
      priority: viol ? "high" : "low",
    });
    if (path.schematic.nodes.some((n) => (n.fanout || 0) > 12)) {
      tips.push({
        title: "High fanout during synthesis",
        desc: "Insert buffer trees (set_max_fanout) early; pad drivers with fanout > 12 create slew explosions.",
        category: "physical",
        priority: "high",
      });
    }
  } else if (stage === "pnr") {
    tips.push({
      title: "Placement & routing focus",
      desc: "Tighten place density on the critical cone, enable useful skew, and prioritize NR/NDR on the worst nets.",
      category: "physical",
      priority: "high",
    });
    tips.push({
      title: "VT / drive strength ECO",
      desc: `Cell delay ≈ ${path.cellDelayNs.toFixed(3)} ns vs net ≈ ${path.netDelayNs.toFixed(3)} ns. Upsize high-slew cells; buffer long nets if net portion dominates.`,
      category: "library",
      priority: "high",
    });
  } else if (stage === "signoff") {
    tips.push({
      title: tool.includes("tempus") || tool.includes("primetime")
        ? "Signoff ECO (metal / VT only)"
        : "Late-stage ECO limits",
      desc: "Prefer LVT/SVT swaps and metal-only buffer inserts. Avoid RTL changes this late; use timing ECO scripts on the critical instance list.",
      category: "library",
      priority: "high",
    });
    tips.push({
      title: "SI / derate check",
      desc: "Confirm aocv/pocv derates and SI deltas on this path. False pessimism can look like hard violations.",
      category: "sdc",
      priority: "med",
    });
  }

  // Critical cell from schematic
  const crit = path.schematic.nodes.filter((n) => n.isCritical).slice(0, 3);
  if (crit.length) {
    tips.push({
      title: "Hot cells on path",
      desc: crit.map((c) => `${c.label}${c.cell ? ` (${c.cell})` : ""}: ${c.delayNs.toFixed(3)} ns`).join(" · "),
      category: "library",
      priority: "high",
    });
  }

  return tips.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Waveform geometry helpers (for UI)
// ---------------------------------------------------------------------------

export interface WaveformModel {
  tMin: number;
  tMax: number;
  period: number;
  launchEdge: number;
  captureEdge: number;
  dataStart: number;
  dataArrival: number;
  required: number;
  launchClkLatEnd: number;
  inputEnd: number;
  slack: number;
  type: PathCheckType;
  duty: number;
}

export function buildWaveformModel(
  path: TimingPath,
  sim?: Pick<
    SolverResult,
    "arrivalTime" | "requiredTime" | "slack" | "inputDelay" | "dataPathDelay" | "outputDelay" | "captureClockLatency"
  >
): WaveformModel {
  const arrival = sim?.arrivalTime ?? path.arrivalTime;
  const required = sim?.requiredTime ?? path.requiredTime;
  const slack = sim?.slack ?? path.slack;
  const inputDelay = sim?.inputDelay ?? path.inputDelay;
  const dataPath = sim?.dataPathDelay ?? path.dataPathDelay;
  const capLat = sim?.captureClockLatency ?? path.captureClockLatency;

  const launchEdge = path.launchEdge;
  let captureEdge = path.captureEdge;
  // If capture equals launch (hold same edge) keep it; if zero but required known, estimate
  if (path.type === "setup" && captureEdge <= launchEdge && required > 0) {
    captureEdge = Math.max(
      launchEdge + (path.dataPathDelay || 1),
      required + path.uncertainty + path.librarySetup + path.outputDelay - capLat
    );
  }

  const period = Math.max(0.1, captureEdge - launchEdge || path.captureEdge || 1);
  const launchClkLatEnd = launchEdge + path.launchClockLatency;
  const dataStart =
    launchClkLatEnd + path.launchDrvAdjust + inputDelay;
  // data arrives at arrival; data path bar from dataStart to arrival
  const tMin = Math.min(0, launchEdge, captureEdge) - period * 0.05;
  const tMax =
    Math.max(arrival, required, captureEdge + path.captureClockLatency, launchEdge + period) +
    period * 0.15;

  return {
    tMin,
    tMax: tMax === tMin ? tMin + 1 : tMax,
    period,
    launchEdge,
    captureEdge,
    dataStart,
    dataArrival: arrival,
    required,
    launchClkLatEnd,
    inputEnd: launchClkLatEnd + path.launchDrvAdjust + inputDelay,
    slack,
    type: path.type,
    duty: 0.5,
  };
}

/** SVG path for a digital clock over [tMin,tMax] with edge at edgeTime and period. */
export function clockWaveformPath(
  edgeTime: number,
  period: number,
  duty: number,
  tMin: number,
  tMax: number,
  xOf: (t: number) => number,
  yHigh: number,
  yLow: number
): string {
  if (period <= 0) period = 1;
  const rise0 = edgeTime;
  // Find first edge at or before tMin
  let t = rise0;
  while (t > tMin) t -= period;
  while (t + period < tMin) t += period;

  const pts: string[] = [];
  let x = xOf(tMin);
  let high = false;
  // Determine state at tMin
  const phase = ((tMin - rise0) % period + period) % period;
  high = phase < period * duty;
  pts.push(`M ${xOf(tMin)} ${high ? yHigh : yLow}`);

  const events: number[] = [];
  for (let k = -2; k < 20; k++) {
    const r = rise0 + k * period;
    const f = r + period * duty;
    if (r >= tMin - period && r <= tMax + period) events.push(r);
    if (f >= tMin - period && f <= tMax + period) events.push(f);
  }
  events.sort((a, b) => a - b);

  let stateHigh = high;
  for (const ev of events) {
    if (ev < tMin || ev > tMax) {
      if (ev <= tMin) {
        const ph = ((ev - rise0) % period + period) % period;
        // after edge: rise -> high, fall -> low
        stateHigh = ph < 1e-12 || ph < period * duty;
        // actually at rise event we go high; at fall we go low
      }
      continue;
    }
    // horizontal to event, then vertical
    pts.push(`L ${xOf(ev)} ${stateHigh ? yHigh : yLow}`);
    // toggle
    const isRise = Math.abs(((ev - rise0) / period) % 1) < 1e-6 ||
      Math.abs(((ev - rise0) / period) % 1 - 1) < 1e-6;
    // simpler: compare to rise vs fall lattice
    const distRise = Math.abs(((ev - rise0) / period) % 1);
    const nearRise = distRise < 1e-4 || distRise > 1 - 1e-4;
    stateHigh = nearRise ? true : false;
    if (!nearRise) {
      const distFall = Math.abs(((ev - rise0 - period * duty) / period) % 1);
      if (distFall < 1e-4 || distFall > 1 - 1e-4) stateHigh = false;
    } else {
      stateHigh = true;
    }
    pts.push(`L ${xOf(ev)} ${stateHigh ? yHigh : yLow}`);
  }
  pts.push(`L ${xOf(tMax)} ${stateHigh ? yHigh : yLow}`);
  return pts.join(" ");
}

// ---------------------------------------------------------------------------
// SI / Noise attribution (integrated into Timing Studio)
// ---------------------------------------------------------------------------

function emptySiSummary(): SiSummary {
  return {
    pathsWithReportedSi: 0,
    totalSiDeltaNs: 0,
    avgSiFraction: 0,
    topAggressors: [],
    highNoisePaths: 0,
  };
}

function emptyPathSi(): PathSiInfo {
  return {
    hasReportedSi: false,
    siDeltaNs: 0,
    baseDataPathNs: 0,
    siFraction: 0,
    aggressors: [],
    noiseRiskScore: 0,
    notes: [],
  };
}

/**
 * Extract SI/crosstalk from report text when present; otherwise heuristic
 * aggressors from high-fanout / high-delay stages (noise risk, not true SI).
 *
 * IMPORTANT: never run open-ended /.*?/ regexes over huge Innovus path blocks —
 * that causes catastrophic backtracking ("too much recursion") in V8.
 */
function buildPathSiInfo(
  block: string,
  steps: TimingStep[],
  dataPathDelay: number,
  isPs: boolean
): PathSiInfo {
  const notes: string[] = [];
  const aggressors: SiAggressor[] = [];
  let hasReportedSi = false;
  let siDeltaNs = 0;

  // Line-oriented scan only (O(n), no backtracking traps)
  const lines = block.split("\n");
  // Summary fields usually sit near the top; still scan all lines but cheaply
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // Skip super-long table rows early unless they mention SI keywords
    const lower =
      line.length > 400
        ? line.slice(0, 200).toLowerCase() + line.slice(-80).toLowerCase()
        : line.toLowerCase();
    if (
      !lower.includes("crosstalk") &&
      !lower.includes("xtalk") &&
      !lower.includes("si delta") &&
      !lower.includes("si_delay") &&
      !lower.includes("si delay") &&
      !lower.includes("delta delay") &&
      !(lower.includes("si") && lower.includes("delay") && li < 80)
    ) {
      continue;
    }

    // Summary-style: Crosstalk Delta: 12.3 ps
    const sumM = line.match(
      /(?:crosstalk|xtalk|si(?:\s*delta|\s*delay|_delay)?|delta\s*delay)\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*(ps|ns)?/i
    );
    if (sumM) {
      let v = Math.abs(parseFloat(sumM[1]));
      const unit = (sumM[2] || "").toLowerCase();
      if (unit === "ps" || (!unit && (isPs || v > 50))) v = v / 1000;
      if (Number.isFinite(v)) {
        siDeltaNs = Math.max(siDeltaNs, v);
        hasReportedSi = true;
      }
      continue;
    }

    // Table row mentioning SI: take first token as label, last reasonable number as contrib
    if (
      lower.includes("crosstalk") ||
      lower.includes("xtalk") ||
      lower.includes("si_delta") ||
      lower.includes("si delta")
    ) {
      const toks = line.trim().split(/\s+/);
      if (toks.length < 2) continue;
      const label = toks[0];
      let v: number | null = null;
      for (let t = toks.length - 1; t >= 1; t--) {
        if (/^-?\d+(?:\.\d+)?$/.test(toks[t])) {
          v = Math.abs(parseFloat(toks[t]));
          break;
        }
      }
      if (v === null || !Number.isFinite(v)) continue;
      if (v > 50) v /= 1000;
      hasReportedSi = true;
      siDeltaNs += v;
      if (aggressors.length < 24) {
        aggressors.push({
          id: `rep_${aggressors.length}`,
          label,
          contributionNs: v,
          source: "report",
        });
      }
    }
  }

  // Heuristic: top delay stages with fanout as SI *risk* stand-ins
  const dataSteps = steps.filter(
    (s) =>
      (s.kind === "cell" || s.kind === "other" || s.kind === "port") &&
      s.incr > 0.001
  );
  const sorted = [...dataSteps].sort((a, b) => b.incr - a.incr);
  const top = sorted.slice(0, 5);
  for (const s of top) {
    const fo = s.fanout || 0;
    const risk = s.incr * (1 + Math.log10(fo + 1) * 0.35);
    if (!hasReportedSi && risk > 0.01) {
      aggressors.push({
        id: `h_${aggressors.length}`,
        label: s.point,
        contributionNs: parseFloat((s.incr * (fo > 8 ? 0.15 : 0.05)).toFixed(4)),
        fanout: fo || undefined,
        source: "heuristic",
      });
    }
  }

  if (hasReportedSi && !aggressors.some((a) => a.source === "report")) {
    const share = top.length ? siDeltaNs / top.length : siDeltaNs;
    top.forEach((s, i) => {
      aggressors.push({
        id: `dist_${i}`,
        label: s.point,
        contributionNs: share,
        fanout: s.fanout,
        source: "report",
      });
    });
  }

  if (!hasReportedSi && aggressors.length) {
    siDeltaNs = aggressors.reduce((a, x) => a + x.contributionNs, 0);
    notes.push(
      "No explicit SI/crosstalk fields in report — showing heuristic noise/SI risk from high-delay and high-fanout stages (not tool-accurate SI)."
    );
  } else if (hasReportedSi) {
    notes.push("SI/crosstalk delta extracted from report fields.");
  } else {
    notes.push("No SI data or strong noise-risk stages on this path.");
  }

  if (!hasReportedSi && dataPathDelay > 0) {
    siDeltaNs = Math.min(siDeltaNs, dataPathDelay * 0.25);
  }

  const effectiveBase = hasReportedSi
    ? Math.max(0, dataPathDelay - siDeltaNs)
    : Math.max(0, dataPathDelay - siDeltaNs);
  const siFraction =
    dataPathDelay > 1e-12 ? Math.min(1, siDeltaNs / dataPathDelay) : 0;

  let noiseRiskScore = Math.round(siFraction * 100);
  const maxFo =
    dataSteps.length === 0
      ? 0
      : dataSteps.reduce((m, s) => Math.max(m, s.fanout || 0), 0);
  if (maxFo > 16) noiseRiskScore = Math.min(100, noiseRiskScore + 15);
  if (maxFo > 32) noiseRiskScore = Math.min(100, noiseRiskScore + 15);

  aggressors.sort((a, b) => b.contributionNs - a.contributionNs);

  return {
    hasReportedSi,
    siDeltaNs: parseFloat(siDeltaNs.toFixed(4)),
    baseDataPathNs: parseFloat(effectiveBase.toFixed(4)),
    siFraction: parseFloat(siFraction.toFixed(4)),
    aggressors: aggressors.slice(0, 12),
    noiseRiskScore,
    notes,
  };
}

function buildSiSummary(paths: TimingPath[]): SiSummary {
  if (!paths.length) return emptySiSummary();
  const withSi = paths.filter((p) => p.si.hasReportedSi || p.si.siDeltaNs > 0.001);
  const reported = paths.filter((p) => p.si.hasReportedSi);
  const totalSi = paths.reduce((a, p) => a + p.si.siDeltaNs, 0);
  const avgFrac =
    paths.reduce((a, p) => a + p.si.siFraction, 0) / Math.max(1, paths.length);
  const aggMap = new Map<string, SiAggressor>();
  for (const p of paths) {
    for (const ag of p.si.aggressors) {
      const prev = aggMap.get(ag.label);
      if (prev) {
        prev.contributionNs += ag.contributionNs;
      } else {
        aggMap.set(ag.label, { ...ag });
      }
    }
  }
  const topAggressors = [...aggMap.values()]
    .sort((a, b) => b.contributionNs - a.contributionNs)
    .slice(0, 10);
  const highNoisePaths = paths.filter((p) => p.si.noiseRiskScore >= 40).length;

  return {
    pathsWithReportedSi: reported.length,
    totalSiDeltaNs: parseFloat(totalSi.toFixed(4)),
    avgSiFraction: parseFloat(avgFrac.toFixed(4)),
    topAggressors,
    highNoisePaths,
  };
}

// ---------------------------------------------------------------------------
// ECO proposals (integrated into Timing Studio)
// ---------------------------------------------------------------------------

export type EcoActionType =
  | "upsize"
  | "lvt"
  | "buffer"
  | "useful_skew"
  | "shield"
  | "pipeline"
  | "slew"
  | "output_relax"
  /** Synthesis / SDC-oriented methods */
  | "path_group"
  | "retime"
  | "reduce_freq"
  | "uncertainty"
  | "io_constraint"
  | "compile_effort"
  /** Timing exceptions / freeze (Genus ECO guide) */
  | "path_adjust"
  | "false_path"
  | "multicycle"
  | "preserve";

export interface EcoAction {
  id: string;
  type: EcoActionType;
  title: string;
  detail: string;
  target: string;
  estGainNs: number;
  risk: "low" | "med" | "high";
  stageOk: boolean;
  solverPatch: Partial<SolverControls>;
  scriptLine: string;
  /** Report-driven ladder: current cell master */
  fromCell?: string;
  /** Report-driven ladder: proposed cell master */
  toCell?: string;
  /** seen = appeared in report catalog; inferred = pattern-only */
  cellPickSource?: "seen" | "inferred" | "none";
  /** Optional SDC / path-group helpers */
  pathGroupName?: string;
  clockName?: string;
  suggestedPeriodNs?: number;
  suggestedUncertaintyNs?: number;
  /** path_adjust delay in picoseconds (Genus path_adjust -delay <ps>) */
  pathAdjustPs?: number;
  /** Exception -from object (pin/port/clock) */
  exceptionFrom?: string;
  /** Exception -to object */
  exceptionTo?: string;
  /** Multicycle setup cycles (hold usually setup-1 or 1) */
  mcpCycles?: number;
}

export function generateEcoProposals(
  path: TimingPath,
  stage: SolverStage = "synthesis",
  opts?: { catalogPaths?: TimingPath[] }
): EcoAction[] {
  const actions: EcoAction[] = [];
  const need = path.slack < 0 ? Math.abs(path.slack) : 0;
  const stageOk = (types: SolverStage[]) => types.includes(stage);

  const catalog = buildCellLadderCatalog(opts?.catalogPaths || [path]);
  const picks = suggestEcoCellPicksForPath(path, catalog);

  // Hot cells from schematic
  const hot = path.schematic.nodes
    .filter((n) => n.role === "gate" || n.role === "pad" || n.role === "ff")
    .sort((a, b) => b.delayNs - a.delayNs)
    .slice(0, 4);

  if (picks.upsize || (hot[0] && hot[0].delayNs > 0.02)) {
    const t = hot[0];
    const gain = Math.min(
      need || (t?.delayNs || 0.05) * 0.2,
      (t?.delayNs || 0.05) * 0.25
    );
    const inst = picks.upsize?.instance || t?.label || path.endpoint;
    const fromCell = picks.upsize?.fromCell || t?.cell;
    const toCell = picks.upsize?.toCell;
    const src = picks.upsize?.source || (toCell ? "inferred" : "none");
    actions.push({
      id: `eco_upsize_${inst}`,
      type: "upsize",
      title: toCell
        ? `Upsize → ${toCell}`
        : `Upsize ${inst}`,
      detail: picks.upsize
        ? `${picks.upsize.detail}${fromCell ? ` · from ${fromCell}` : ""}`
        : `Largest stage delay ${t?.delayNs.toFixed(3) || "?"} ns${fromCell ? ` (${fromCell})` : ""}.`,
      target: inst,
      estGainNs: gain,
      risk: stage === "signoff" ? "med" : "low",
      stageOk: stageOk(["synthesis", "pnr", "signoff"]),
      solverPatch: { gateUpsizePct: 30 },
      fromCell,
      toCell,
      cellPickSource: src === "none" && !toCell ? "none" : src,
      scriptLine:
        stage === "synthesis"
          ? toCell
            ? `set_db [get_db insts ${inst}] .base_cell [get_db lib_cells ${toCell}]  ;# ${fromCell || "?"} → ${toCell} · +${gain.toFixed(3)} ns · ${src}`
            : `syn_opt -incremental  ;# upsize via opt · ${inst} · no ladder match`
          : toCell
            ? `size_cell {${inst}} {${toCell}}  ;# ${fromCell || "?"} → ${toCell} · est +${gain.toFixed(3)} ns · ${src}`
            : `size_cell {${inst}} <NEXT_DRIVE_CELL>  ;# est +${gain.toFixed(3)} ns · no ladder match`,
    });
  }

  if (
    picks.lvt ||
    (path.cellDelayNs > path.netDelayNs && path.cellDelayNs > 0.05)
  ) {
    const gain = path.cellDelayNs * 0.12 || 0.03;
    const inst = picks.lvt?.instance || path.endpoint;
    const fromCell = picks.lvt?.fromCell;
    const toCell = picks.lvt?.toCell;
    const src = picks.lvt?.source || (toCell ? "inferred" : "none");
    actions.push({
      id: `eco_lvt_${inst}`,
      type: "lvt",
      title: toCell ? `LVT swap → ${toCell}` : "LVT / SVT swap on critical cone",
      detail: picks.lvt
        ? picks.lvt.detail
        : `Cell delay ${path.cellDelayNs.toFixed(3)} ns dominates net ${path.netDelayNs.toFixed(3)} ns.`,
      target: inst,
      estGainNs: gain,
      risk: stage === "signoff" ? "low" : "med",
      stageOk: stageOk(["pnr", "signoff", "synthesis"]),
      solverPatch: { lvtRatioPct: 50 },
      fromCell,
      toCell,
      cellPickSource: src === "none" && !toCell ? "none" : src,
      scriptLine:
        stage === "synthesis"
          ? toCell
            ? `set_db [get_db insts ${inst}] .base_cell [get_db lib_cells ${toCell}]  ;# VT ${fromCell || "?"} → ${toCell}`
            : `syn_opt -incremental  ;# VT via map/opt + LVT liberty`
          : toCell
            ? `size_cell {${inst}} {${toCell}}  ;# VT ${fromCell || "?"} → ${toCell} · ${src}`
            : `# VT swap critical cells toward endpoint ${path.endpoint}`,
    });
  }

  if (path.netDelayNs > path.cellDelayNs * 0.4 && path.netDelayNs > 0.03) {
    const gain = path.netDelayNs * 0.2;
    actions.push({
      id: "eco_buffer",
      type: "buffer",
      title: "Buffer / rebuffer long nets",
      detail: `Net delay ${path.netDelayNs.toFixed(3)} ns — insert/resize buffers on critical nets.`,
      target: path.endpoint,
      estGainNs: gain,
      risk: "med",
      stageOk: stageOk(["pnr", "signoff", "synthesis"]),
      solverPatch: { bufferOptPct: 30 },
      scriptLine:
        stage === "synthesis"
          ? `set_db max_fanout 10; syn_opt -incremental  ;# buffer near ${path.endpoint}`
          : `# buffer critical nets on path to ${path.endpoint}`,
    });
  }

  if (path.si.siDeltaNs > 0.01 || path.si.noiseRiskScore >= 35) {
    const topAg = path.si.aggressors[0];
    const gain = path.si.siDeltaNs * 0.4 || 0.02;
    actions.push({
      id: "eco_shield",
      type: "shield",
      title: path.si.hasReportedSi
        ? "Reduce SI / shield victim nets"
        : "Mitigate SI risk (spacing / shield)",
      detail: topAg
        ? `Focus near ${topAg.label} (Δ≈${topAg.contributionNs.toFixed(3)} ns, ${topAg.source}).`
        : `SI/risk ${path.si.siDeltaNs.toFixed(3)} ns · noise score ${path.si.noiseRiskScore}.`,
      target: topAg?.label || path.endpoint,
      estGainNs: gain,
      risk: "med",
      stageOk: stageOk(["pnr", "signoff"]),
      solverPatch: { siReductionPct: 40 },
      scriptLine: topAg
        ? `# shield/space nets around ${topAg.label}  ;# SI what-if`
        : `# SI mitigation on path ${path.id}`,
    });
  }

  if (path.levels >= 6 && stage === "synthesis") {
    actions.push({
      id: "eco_pipe",
      type: "pipeline",
      title: "Pipeline / retime deep logic",
      detail: `${path.levels} logic levels — consider register insertion (RTL/synthesis).`,
      target: path.startpoint,
      estGainNs: Math.max(0, path.dataPathDelay * 0.35),
      risk: "high",
      stageOk: stageOk(["synthesis"]),
      solverPatch: { pipelineStages: 1 },
      scriptLine: `# retime/pipeline path ${path.startpoint} -> ${path.endpoint}`,
    });
  }

  if (path.inputDelay > 0.05 || path.launchDrvAdjust > 0.05) {
    actions.push({
      id: "eco_slew",
      type: "slew",
      title: "Improve input driver / external slew",
      detail: `Input delay ${path.inputDelay.toFixed(3)} + drv ${path.launchDrvAdjust.toFixed(3)} ns.`,
      target: path.startpoint,
      estGainNs: (path.inputDelay + path.launchDrvAdjust) * 0.25,
      risk: "low",
      stageOk: stageOk(["synthesis", "pnr", "signoff"]),
      solverPatch: { slewReductionPct: 30 },
      scriptLine: `# set_driving_cell / board driver on ${path.startpoint}`,
    });
  }

  if (path.outputDelay > 0.05 && (path.pathKind === "reg2out" || path.pathKind === "in2out")) {
    actions.push({
      id: "eco_out",
      type: "output_relax",
      title: "Review output_delay / load",
      detail: `output_delay ${path.outputDelay.toFixed(3)} ns — co-optimize load or constraint.`,
      target: path.endpoint,
      estGainNs: path.outputDelay * 0.15,
      risk: "med",
      stageOk: stageOk(["synthesis", "pnr", "signoff"]),
      solverPatch: { outputRelaxPct: 20 },
      scriptLine: `# set_load / set_output_delay review on ${path.endpoint}`,
    });
  }

  if (path.slack < 0 && path.type === "setup") {
    const gain = Math.min(0.08, Math.abs(path.slack) * 0.5);
    actions.push({
      id: "eco_skew",
      type: "useful_skew",
      title: "Useful skew on capture",
      detail: "Defer capture clock slightly (CTS / local buffer) to buy setup margin.",
      target: path.endpoint,
      estGainNs: gain,
      risk: "med",
      stageOk: stageOk(["pnr", "signoff"]),
      solverPatch: { usefulSkewNs: gain },
      scriptLine: `# useful skew toward capture of ${path.endpoint}`,
    });
  }

  // ----- Synthesis-focused methods (Genus / dc_shell / Yosys) -----
  if (stage === "synthesis" && path.slack < 0) {
    const clk = path.clock || path.captureClock || "clk";
    const grp = `pg_${(path.pathGroup || "crit").replace(/[^\w]/g, "_")}`;

    actions.push({
      id: `eco_path_group_${path.id}`,
      type: "path_group",
      title: `Path group weight: ${path.pathGroup || "critical"}`,
      detail:
        "Bias Genus map/opt via define_cost_group + path_group + set_path_group_options -effort_level high.",
      target: path.endpoint,
      estGainNs: Math.min(Math.abs(path.slack) * 0.35, 0.15),
      risk: "low",
      stageOk: true,
      solverPatch: {},
      pathGroupName: grp,
      scriptLine: `define_cost_group -name ${grp}; path_group -group ${grp}; set_path_group_options ${grp} -effort_level high -weight 10; syn_opt -incremental`,
    });

    if (path.levels >= 5) {
      actions.push({
        id: `eco_retime_${path.id}`,
        type: "retime",
        title: "Retiming / balance registers",
        detail: `${path.levels} levels — RTL pipeline preferred; Genus high-effort syn_opt / report_sequential.`,
        target: path.startpoint,
        estGainNs: Math.max(0.05, path.dataPathDelay * 0.2),
        risk: "high",
        stageOk: true,
        solverPatch: { pipelineStages: 1 },
        scriptLine: `set_db syn_opt_effort high; syn_opt -incremental; report_sequential`,
      });
    }

    actions.push({
      id: `eco_compile_${path.id}`,
      type: "compile_effort",
      title: "Raise synthesis effort (incremental)",
      detail:
        "Genus: set_db syn_{generic,map,opt}_effort high then syn_opt -incremental (or full cascade).",
      target: path.endpoint,
      estGainNs: Math.min(Math.abs(path.slack) * 0.25, 0.1),
      risk: "med",
      stageOk: true,
      solverPatch: { gateUpsizePct: 20 },
      scriptLine: `set_db syn_generic_effort high; set_db syn_map_effort high; set_db syn_opt_effort high; syn_opt -incremental`,
    });

    // Period / uncertainty only when badly failing
    if (path.slack < -0.1 && path.type === "setup") {
      const curPeriod =
        path.captureEdge > path.launchEdge
          ? path.captureEdge - path.launchEdge
          : undefined;
      const suggestedPeriod =
        curPeriod && curPeriod > 0
          ? curPeriod + Math.abs(path.slack) * 1.1
          : undefined;
      actions.push({
        id: `eco_freq_${path.id}`,
        type: "reduce_freq",
        title: "Relax clock period (lower Fmax)",
        detail: suggestedPeriod
          ? `Suggest period ≥ ${suggestedPeriod.toFixed(3)} ns on ${clk} (from path edges + slack).`
          : `Increase create_clock period / reduce frequency for ${clk}.`,
        target: path.endpoint,
        estGainNs: Math.abs(path.slack),
        risk: "high",
        stageOk: true,
        solverPatch: {},
        clockName: clk,
        suggestedPeriodNs: suggestedPeriod,
        scriptLine: `# create_clock -period <NEW> ${clk}`,
      });
    }

    if (path.uncertainty >= 0) {
      const newUnc = Math.max(0, path.uncertainty * 0.7 - 0.01);
      actions.push({
        id: `eco_unc_${path.id}`,
        type: "uncertainty",
        title: "Tighten or retune clock uncertainty",
        detail: `Current uncertainty ${path.uncertainty.toFixed(3)} ns — review jitter/skew budget (don't fake timing).`,
        target: path.endpoint,
        estGainNs: Math.max(0, path.uncertainty - newUnc),
        risk: "med",
        stageOk: true,
        solverPatch: {},
        clockName: clk,
        suggestedUncertaintyNs: newUnc > 0 ? newUnc : 0.05,
        scriptLine: `set_clock_uncertainty <NS> [get_clocks ${clk}]`,
      });
    }

    if (
      path.pathKind === "in2reg" ||
      path.pathKind === "reg2out" ||
      path.pathKind === "in2out" ||
      path.inputDelay > 0.05 ||
      path.outputDelay > 0.05
    ) {
      actions.push({
        id: `eco_io_${path.id}`,
        type: "io_constraint",
        title: "Review I/O delays & external budget",
        detail: `in_delay ${path.inputDelay.toFixed(3)} · out_delay ${path.outputDelay.toFixed(3)} — co-optimize board/FPGA or SDC.`,
        target:
          path.pathKind === "reg2out" || path.pathKind === "in2out"
            ? path.endpoint
            : path.startpoint,
        estGainNs: Math.max(path.inputDelay, path.outputDelay) * 0.2,
        risk: "med",
        stageOk: true,
        solverPatch: { outputRelaxPct: 15 },
        scriptLine: `# set_input_delay / set_output_delay review`,
      });
    }

    // --- Exceptions / freeze (misc/GENUS_ECO_INCREMENTAL_EXCEPTIONS_GUIDE.md) ---
    // path_adjust: small local margin only (ps), not free chip closure
    if (path.slack < 0 && Math.abs(path.slack) <= 0.08) {
      const ps = Math.min(200, Math.ceil(Math.abs(path.slack) * 1000 * 1.1));
      actions.push({
        id: `eco_path_adjust_${path.id}`,
        type: "path_adjust",
        title: `path_adjust +${ps} ps (local margin)`,
        detail:
          "Genus path_adjust in picoseconds for small residual — document owner; do not use to fake WNS.",
        target: path.endpoint,
        estGainNs: Math.min(Math.abs(path.slack), ps / 1000),
        risk: "high",
        stageOk: true,
        solverPatch: {},
        exceptionFrom: path.startpoint,
        exceptionTo: path.endpoint,
        pathAdjustPs: ps,
        scriptLine: `path_adjust -delay ${ps} -setup -from {/*start*/} -to {/*end*/}`,
      });
    }

    // Multicycle: deep reg2reg with large miss — only if architecture allows
    if (
      path.pathKind === "reg2reg" &&
      path.slack < -0.15 &&
      path.levels >= 8
    ) {
      const cycles = 2;
      actions.push({
        id: `eco_mcp_${path.id}`,
        type: "multicycle",
        title: `Multicycle setup×${cycles} (if arch allows)`,
        detail:
          "Deep R2R fail — MCP only when interface is truly multi-cycle; always pair hold MCP.",
        target: path.endpoint,
        estGainNs: Math.min(Math.abs(path.slack) * 0.5, 0.4),
        risk: "high",
        stageOk: true,
        solverPatch: {},
        exceptionFrom: path.startpoint,
        exceptionTo: path.endpoint,
        mcpCycles: cycles,
        scriptLine: `set_multicycle_path ${cycles} -setup -from ... -to ...; set_multicycle_path 1 -hold ...`,
      });
    }

    // False path: async-looking clocks or reset-ish startpoints
    const sp = path.startpoint.toLowerCase();
    const clkA = (path.clock || "").toLowerCase();
    const clkB = (path.captureClock || path.clock || "").toLowerCase();
    const looksAsyncClocks =
      !!path.captureClock &&
      path.clock &&
      path.captureClock !== path.clock &&
      !clkA.includes(clkB) &&
      !clkB.includes(clkA);
    const looksReset =
      /rst|reset|por|async/.test(sp) || /rst|reset/.test(path.endpoint.toLowerCase());
    if (looksAsyncClocks || looksReset) {
      actions.push({
        id: `eco_fp_${path.id}`,
        type: "false_path",
        title: looksReset
          ? "False path on reset/async control"
          : "False path / async clock group review",
        detail: looksAsyncClocks
          ? `Launch ${path.clock} vs capture ${path.captureClock} — prefer set_clock_groups -asynchronous if domains are async; FP only for proven non-functional points.`
          : "Reset/static control often needs set_false_path — not a substitute for CDC sync.",
        target: path.endpoint,
        estGainNs: Math.abs(path.slack) * 0.9,
        risk: "high",
        stageOk: true,
        solverPatch: {},
        exceptionFrom: path.startpoint,
        exceptionTo: path.endpoint,
        clockName: path.clock,
        scriptLine: looksAsyncClocks
          ? `set_clock_groups -asynchronous -group {${path.clock}} -group {${path.captureClock}}`
          : `set_false_path -from [get_ports ${path.startpoint}]`,
      });
    }

    // Preserve: freeze non-critical after local ECO (high fanout / many levels elsewhere)
    if (path.slack < 0 && path.levels >= 4) {
      actions.push({
        id: `eco_preserve_${path.id}`,
        type: "preserve",
        title: "Preserve / freeze unrelated IP during ECO",
        detail:
          "set_db insts .preserve true on frozen blocks so syn_opt -incremental only touches the failing cone.",
        target: path.endpoint,
        estGainNs: 0.01,
        risk: "low",
        stageOk: true,
        solverPatch: {},
        scriptLine: `set_db [get_db insts u_ip*] .preserve true; syn_opt -incremental`,
      });
    }
  }

  // Sort by est gain * stageOk
  actions.sort((a, b) => {
    const sa = (a.stageOk ? 1 : 0.3) * a.estGainNs;
    const sb = (b.stageOk ? 1 : 0.3) * b.estGainNs;
    return sb - sa;
  });

  return actions;
}

export function mergeSolverPatches(
  base: SolverControls,
  patches: Partial<SolverControls>[]
): SolverControls {
  const out = { ...base };
  for (const p of patches) {
    for (const [k, v] of Object.entries(p) as [keyof SolverControls, number][]) {
      if (typeof v !== "number") continue;
      // take max of knobs (stronger ECO)
      out[k] = Math.max(out[k] as number, v) as never;
    }
  }
  return out;
}

export function exportEcoScript(
  path: TimingPath,
  actions: EcoAction[],
  stage: SolverStage
): string {
  const lines: string[] = [
    `# ECO batch for ${path.id} · ${path.type} slack ${path.slack.toFixed(3)} ns`,
    `# ${path.startpoint} -> ${path.endpoint}`,
    `# Stage: ${stage} · generated by ACE-SEEK Timing Studio`,
    `# Estimates are what-if only — re-time in the signoff tool.`,
    ``,
  ];
  for (const a of actions) {
    if (!a.stageOk) lines.push(`# [SKIP @ ${stage}] ${a.title}`);
    lines.push(`# ${a.title} · est +${a.estGainNs.toFixed(3)} ns · risk ${a.risk}`);
    lines.push(a.scriptLine);
    lines.push(``);
  }
  return lines.join("\n");
}

/** Aggregate ECO proposals across failing paths (dedupe by type+target). */
export function generateSessionEcoProposals(
  paths: TimingPath[],
  stage: SolverStage,
  limit = 20
): EcoAction[] {
  const failing = paths.filter((p) => p.slack < 0).slice(0, 15);
  // Build one catalog from all session paths so ladders see more strengths/VTs
  const catalogPaths = paths.slice(0, 40);
  const map = new Map<string, EcoAction>();
  for (const p of failing) {
    for (const a of generateEcoProposals(p, stage, { catalogPaths })) {
      const key = `${a.type}|${a.target}|${a.toCell || ""}`;
      const prev = map.get(key);
      if (!prev || a.estGainNs > prev.estGainNs) map.set(key, a);
    }
  }
  return [...map.values()]
    .sort((a, b) => b.estGainNs - a.estGainNs)
    .slice(0, limit);
}

export { buildCellLadderCatalog, summarizeCatalog } from "./cell-ladder-engine";
