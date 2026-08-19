/**
 * OpenROAD full flow model — ordered stages including lint / sim / GDS.
 */

import { buildChipSnapshot } from "./openroad-def-parse";

export type FlowStageId =
  | "lint"
  | "simulation"
  | "synthesis"
  | "io_plan"
  | "floorplan"
  | "powerplan"
  | "placement"
  | "cts"
  | "route"
  | "drc"
  | "lvs"
  | "gds";

export type StageStatus =
  | "idle"
  | "locked"
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "skipped";

export interface FlowStageDef {
  id: FlowStageId;
  label: string;
  short: string;
  match: RegExp[];
  description: string;
  /** Kind of center panel */
  view: "lint" | "sim" | "synth" | "io" | "chip" | "report";
  /** Where execution happens */
  runner: "local" | "openlane";
}

/** Strict order — no jumping */
export const FLOW_STAGES: FlowStageDef[] = [
  {
    id: "lint",
    label: "Lint",
    short: "Lint",
    match: [/verilator --lint/i, /%Error/i, /%Warning/i, /\[INFO\].*lint/i],
    description: "RTL lint (Verilator in Docker)",
    view: "lint",
    runner: "local",
  },
  {
    id: "simulation",
    label: "Simulation",
    short: "Sim",
    match: [/sim_ok/i, /iverilog/i, /\bvvp\b/i, /\$dumpfile/i],
    description: "Functional sim (Icarus in Docker) + VCD",
    view: "sim",
    runner: "local",
  },
  {
    id: "synthesis",
    label: "Synthesis",
    short: "Synth",
    match: [
      /ACE-Seek: === step synthesis/i,
      /Ace-Seek synth \(Docker/i,
      /Running Synthesis/i,
      /yosys/i,
      /synth\.tcl/i,
      /step\s*1\s*\(synthesis\)/i,
      /logs\/synthesis\//i,
      /stopped after synthesis/i,
    ],
    description: "RTL → gate-level netlist (Yosys in Docker)",
    view: "synth",
    runner: "local",
  },
  {
    id: "io_plan",
    label: "IO Planner",
    short: "IO",
    match: [
      /ACE-Seek: === step io_plan/i,
      /pin_order\.cfg/i,
      /IO planner/i,
      /FP_PIN_ORDER_CFG/i,
      /stopped after io_plan/i,
    ],
    description: "Assign I/O ports to die sides N/S/E/W before floorplan",
    view: "io",
    runner: "local",
  },
  {
    id: "floorplan",
    label: "Floorplan",
    short: "FP",
    match: [
      /ACE-Seek: === step floorplan/i,
      /Running Initial Floorplanning/i,
      /Running IO Placement/i,
      /Tap\/Decap Insertion/i,
      /initial_fp/i,
      /logs\/floorplan\//i,
      /stopped after floorplan/i,
    ],
    description:
      "Die/core, IO, tap/endcap + PDN (OpenLane run_floorplan). Does NOT run placement.",
    view: "chip",
    runner: "openlane",
  },
  {
    id: "powerplan",
    label: "Powerplan",
    short: "PDN",
    match: [
      /Generating PDN/i,
      /Power planning with power/i,
      /power grid/i,
      /power straps/i,
      /logs\/floorplan\/.*pdn/i,
      /stopped after floorplan\/PDN/i,
    ],
    description:
      "UI alias for PDN inside Floorplan (same Docker until=floorplan). Not a separate place step.",
    view: "chip",
    runner: "openlane",
  },
  {
    id: "placement",
    label: "Placement",
    short: "Place",
    match: [
      /ACE-Seek: === step placement/i,
      /ACE-Seek: === step placement_timing/i,
      /Running Global Placement/i,
      /Running Detailed Placement/i,
      /placement resizer/i,
      /logs\/placement\//i,
      /gpl_sta|dpl_sta|post_place_sta|placement_timing/i,
      /stopped after placement/i,
    ],
    description:
      "Global + detailed placement + post-place STA — only when you Run Placement",
    view: "chip",
    runner: "openlane",
  },
  {
    id: "cts",
    label: "CTS",
    short: "CTS",
    match: [
      /ACE-Seek: === step cts/i,
      /Running Clock Tree Synthesis/i,
      /clock tree synthesis/i,
      /logs\/cts\//i,
      /stopped after CTS/i,
    ],
    description: "Clock tree synthesis",
    view: "chip",
    runner: "openlane",
  },
  {
    id: "route",
    label: "Route",
    short: "Route",
    match: [
      /ACE-Seek: === step routing/i,
      /Running Global Routing/i,
      /Running Detailed Routing/i,
      /fill insertion/i,
      /logs\/routing\//i,
      /stopped after routing/i,
    ],
    description: "Global + detailed route + fill",
    view: "chip",
    runner: "openlane",
  },
  {
    id: "drc",
    label: "DRC",
    short: "DRC",
    match: [
      /Running Magic DRC/i,
      /Running KLayout DRC/i,
      /magic drc/i,
      /klayout drc/i,
      /stopped after DRC/i,
    ],
    description: "Design rule checks",
    view: "report",
    runner: "openlane",
  },
  {
    id: "lvs",
    label: "LVS",
    short: "LVS",
    match: [
      /Running LVS/i,
      /\bnetgen\b/i,
      /layout vs schematic/i,
      /stopped after LVS/i,
    ],
    description: "Layout vs schematic",
    view: "report",
    runner: "openlane",
  },
  {
    id: "gds",
    label: "GDS",
    short: "GDS",
    match: [
      /Streaming out GDS/i,
      /Writing GDS/i,
      /run_magic/i,
      /gdsii/i,
      /ACE-Seek: flow complete/i,
      /logs\/signoff\//i,
    ],
    description: "GDS stream-out (Magic / KLayout)",
    view: "report",
    runner: "openlane",
  },
];

export function stageIndex(id: FlowStageId): number {
  return FLOW_STAGES.findIndex((s) => s.id === id);
}

/** Next runnable stage given completed list (strict order) */
export function nextRunnableStage(completed: FlowStageId[]): FlowStageId | null {
  for (const s of FLOW_STAGES) {
    if (!completed.includes(s.id)) return s.id;
  }
  return null;
}

export function canRunStage(
  stage: FlowStageId,
  completed: FlowStageId[]
): { ok: boolean; reason?: string } {
  const idx = stageIndex(stage);
  if (idx < 0) return { ok: false, reason: "Unknown stage" };
  for (let i = 0; i < idx; i++) {
    if (!completed.includes(FLOW_STAGES[i].id)) {
      return {
        ok: false,
        reason: `Complete "${FLOW_STAGES[i].label}" first (order only)`,
      };
    }
  }
  return { ok: true };
}

export type StageStatusUi =
  | "idle"
  | "locked"
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "skipped";

export interface StageRuntime {
  id: FlowStageId;
  status: StageStatusUi;
  startedAt?: string;
  finishedAt?: string;
  logLines: string[];
  errors: string[];
  warnings: string[];
  progress: number;
  /** Stage-specific result payload (real only) */
  result?: StageResultPayload;
}

export type StageResultPayload =
  | { kind: "lint"; summary: string; errorCount: number; warnCount: number; log: string }
  | {
      kind: "sim";
      summary: string;
      ok: boolean;
      log: string;
      /** Raw VCD text when produced by testbench */
      vcd?: string;
      /** Simple digital samples if parsed from log / VCD */
      wave?: { t: number; v: number; name: string }[];
    }
  | {
      kind: "synth";
      summary: string;
      cellCount?: number;
      wireCount?: number;
      log: string;
      statsLines: string[];
      /** Gate-level netlist text when produced by local Yosys */
      netlist?: string;
    }
  | {
      kind: "io_plan";
      summary: string;
      log: string;
      /** OpenLane pin_order.cfg body */
      pinOrderCfg?: string;
      placed: number;
      total: number;
      sides: { N: number; E: number; S: number; W: number };
    }
  | { kind: "generic"; summary: string; log: string };

export interface FlowMetrics {
  wnsNs?: number;
  tnsNs?: number;
  areaUm2?: number;
  utilizationPct?: number;
  wirelengthUm?: number;
  powerMw?: number;
  leakageMw?: number;
  dynamicMw?: number;
  cellCount?: number;
  slackHistogram: { bin: string; count: number }[];
  areaBreakdown: { label: string; value: number; color: string }[];
  powerBreakdown: { label: string; value: number; color: string }[];
}

/** Chip canvas model — intent (form) or result (DEF). See openroad-def-parse. */
export interface ChipSnapshot {
  dieW: number;
  dieH: number;
  coreX: number;
  coreY: number;
  coreW: number;
  coreH: number;
  cells: {
    x: number;
    y: number;
    w: number;
    h: number;
    kind: "std" | "macro" | "io" | "clk" | "tap" | "endcap" | "decap";
  }[];
  routes: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    layer: number;
    kind?: "power" | "ground" | "signal";
    width?: number;
  }[];
  stage: FlowStageId | "idle";
  /** intent = DIE/CORE inputs; result = parsed DEF; empty = none */
  mode?: "intent" | "result" | "empty";
  /** Provenance for UI badge */
  sourceLabel?: string;
  stats?: {
    componentCount?: number;
    pinCount?: number;
    sampled?: boolean;
    defName?: string;
    tapCount?: number;
    endcapCount?: number;
    decapCount?: number;
    pdnCount?: number;
  };
}

export interface ParsedFlowState {
  stages: StageRuntime[];
  activeStage: FlowStageId | null;
  overall: StageStatusUi;
  metrics: FlowMetrics;
  chip: ChipSnapshot;
  logLines: {
    t: string;
    stage: FlowStageId | null;
    level: "info" | "warn" | "error" | "step";
  }[];
  percent: number;
}

function emptyMetrics(): FlowMetrics {
  return {
    slackHistogram: [],
    areaBreakdown: [],
    powerBreakdown: [],
  };
}

function emptyStages(completed: FlowStageId[], running?: FlowStageId | null): StageRuntime[] {
  const next = nextRunnableStage(completed);
  return FLOW_STAGES.map((s) => {
    let status: StageStatusUi = "idle";
    if (completed.includes(s.id)) status = "done";
    else if (running === s.id) status = "running";
    else if (next && stageIndex(s.id) > stageIndex(next)) status = "locked";
    else if (next === s.id) status = "idle";
    else status = "locked";
    return {
      id: s.id,
      status,
      logLines: [],
      errors: [],
      warnings: [],
      progress: completed.includes(s.id) ? 100 : 0,
    };
  });
}

function matchStage(line: string): FlowStageId | null {
  const t = line.trim();
  // Ignore bare directory listings (OpenLane prep creates empty cts/floorplan/… dirs)
  if (/^d[rwx-]{9}/.test(t)) return null;
  if (/^(total\s+\d+|drwx|RUN_DIR=)/i.test(t)) return null;
  // Pure path fragment alone (e.g. "cts" from ls) — not a real step
  if (/^(cts|floorplan|placement|routing|signoff|synthesis|final)\/?$/i.test(t))
    return null;

  // Prefer explicit Ace-Seek step markers
  const ace = t.match(/ACE-Seek:\s*===\s*step\s+(\w+)/i);
  if (ace) {
    const n = ace[1].toLowerCase();
    if (n === "routing") return "route";
    if (n === "gds_magic") return "gds";
    if (n === "placement_timing") return "placement";
    if (FLOW_STAGES.some((s) => s.id === n)) return n as FlowStageId;
  }
  if (
    /placement (timing|metrics|power|area)|placement_timing|placement_power|placement_area|dpl_sta|gpl_sta/i.test(
      t
    )
  ) {
    return "placement";
  }
  // Client appends "--- synthesis ---" / "--- lint ---" when a stage finishes
  const banner = t.match(/^---\s*([a-z_]+)\s*---\s*$/i);
  if (banner) {
    const n = banner[1].toLowerCase();
    if (n === "routing") return "route";
    if (FLOW_STAGES.some((s) => s.id === n)) return n as FlowStageId;
  }
  const stop = t.match(/stopped after\s+(\w+)/i);
  if (stop) {
    const n = stop[1].toLowerCase();
    if (n === "routing") return "route";
    if (n === "cts") return "cts";
    if (FLOW_STAGES.some((s) => s.id === n)) return n as FlowStageId;
  }
  // Docker tool stage headers
  if (/Ace-Seek\s+(lint|sim|synth)\s*\(Docker/i.test(t)) {
    if (/lint/i.test(t)) return "lint";
    if (/sim/i.test(t)) return "simulation";
    if (/synth/i.test(t)) return "synthesis";
  }
  if (/Yosys synthesis OK|SYNTH_DONE|Ace-Seek synth/i.test(t)) return "synthesis";
  if (/LINT_DONE|Docker Verilator/i.test(t)) return "lint";
  if (/SIM_DONE|Docker Icarus|SIM_OK/i.test(t)) return "simulation";

  for (const s of FLOW_STAGES) {
    if (s.match.some((re) => re.test(t))) return s.id;
  }
  return null;
}

function lineLevel(line: string): "info" | "warn" | "error" | "step" {
  if (/\[ERROR\]/i.test(line) || /%Error/i.test(line) || /\bfailed\b/i.test(line))
    return "error";
  if (/\[WARNING\]/i.test(line) || /%Warning/i.test(line)) return "warn";
  if (/\[STEP/i.test(line) || /\[INFO\]:\s*Running/i.test(line)) return "step";
  return "info";
}

export function parseMetricsCsv(csv: string): Partial<FlowMetrics> {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return {};
  const headers = lines[0].split(",").map((h) => h.trim());
  const values = lines[lines.length - 1].split(",").map((v) => v.trim());
  const get = (keys: string[]): number | undefined => {
    for (const k of keys) {
      const i = headers.findIndex((h) => h.toLowerCase() === k.toLowerCase());
      if (i >= 0 && values[i] && values[i] !== "" && values[i] !== "-1") {
        const n = parseFloat(values[i]);
        if (Number.isFinite(n)) return n;
      }
    }
    return undefined;
  };
  return {
    wnsNs: get(["wns", "timing__setup__ws", "worst_slack"]),
    tnsNs: get(["tns", "timing__setup__tns"]),
    areaUm2: get(["design_area", "design__instance__area", "area"]),
    utilizationPct: (() => {
      const u = get(["core_util", "design__instance__utilization"]);
      return u != null && u <= 1 ? u * 100 : u;
    })(),
    wirelengthUm: get(["wire_length", "route__wirelength__total"]),
    cellCount: get(["cells", "design__instance__count"]),
  };
}

/** Parse OpenLane placement STA / power / area reports into FlowMetrics */
export function parsePlacementTimingReport(text: string): Partial<FlowMetrics> {
  const out: Partial<FlowMetrics> = {};
  if (!text?.trim()) return out;
  // report_wns / "wns -0.12" / "wns 0.00"
  // Prefer last explicit wns/tns (dpl_sta is usually last / most authoritative)
  const wnsAll = [...text.matchAll(/\bwns\s+([-\d.]+)/gi)];
  const tnsAll = [...text.matchAll(/\btns\s+([-\d.]+)/gi)];
  const worstMaxAll = [
    ...text.matchAll(
      /report_worst_slack\s+-max[\s\S]{0,160}?worst slack\s+([-\d.]+)/gi
    ),
  ];
  if (wnsAll.length) out.wnsNs = parseFloat(wnsAll[wnsAll.length - 1][1]);
  else if (worstMaxAll.length)
    out.wnsNs = parseFloat(worstMaxAll[worstMaxAll.length - 1][1]);
  else {
    const worstAny = text.match(/worst slack\s+([-\d.]+)/i);
    if (worstAny) out.wnsNs = parseFloat(worstAny[1]);
  }
  if (tnsAll.length) out.tnsNs = parseFloat(tnsAll[tnsAll.length - 1][1]);

  // Design area 143471 u^2 7% utilization.
  const areaUtil = text.match(
    /Design\s+area\s+([\d.]+)\s*u\^?2\s+([\d.]+)\s*%\s*utilization/i
  );
  if (areaUtil) {
    out.areaUm2 = parseFloat(areaUtil[1]);
    out.utilizationPct = parseFloat(areaUtil[2]);
  } else {
    const areaOnly = text.match(/Design\s+area\s+([\d.]+)/i);
    if (areaOnly) out.areaUm2 = parseFloat(areaOnly[1]);
    const utilOnly = text.match(/([\d.]+)\s*%\s*utilization/i);
    if (utilOnly) out.utilizationPct = parseFloat(utilOnly[1]);
  }

  // report_power Total line: Total  7.34e-03  4.49e-03  5.40e-08  1.18e-02 100.0%
  // Capture last number before 100% as total watts
  const powerTotal = text.match(
    /^Total\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/m
  );
  if (powerTotal) {
    const totalW = parseFloat(powerTotal[4]);
    if (Number.isFinite(totalW)) {
      out.powerMw = totalW * 1000; // W → mW
      out.dynamicMw = parseFloat(powerTotal[2]) * 1000;
      out.leakageMw = parseFloat(powerTotal[3]) * 1000;
    }
  } else {
    // Fallback: "Total Power 0.0118 W" style
    const p2 = text.match(/Total\s+Power[:\s]+([\d.eE+-]+)\s*W/i);
    if (p2) out.powerMw = parseFloat(p2[1]) * 1000;
  }

  return out;
}

/** Alias — full placement metrics (timing + power + area) */
export const parsePlacementMetricsReport = parsePlacementTimingReport;

function scrapeLogMetrics(log: string): Partial<FlowMetrics> {
  const out: Partial<FlowMetrics> = {
    ...parsePlacementTimingReport(log),
  };
  const wns = log.match(/wns\s+([-\d.]+)/i);
  const tns = log.match(/tns\s+([-\d.]+)/i);
  if (wns) out.wnsNs = parseFloat(wns[1]);
  if (tns) out.tnsNs = parseFloat(tns[1]);
  const area = log.match(/Design\s+area\s+([\d.]+)/i);
  if (area) out.areaUm2 = parseFloat(area[1]);
  const util = log.match(/utilization[:\s]+([\d.]+)\s*%?/i);
  if (util) out.utilizationPct = parseFloat(util[1]);
  const cells = log.match(/Number of cells[:\s]+(\d+)/i);
  if (cells) out.cellCount = parseInt(cells[1], 10);
  const wires = log.match(/Number of wires[:\s]+(\d+)/i);
  if (wires && !out.cellCount) {
    /* keep */
  }
  // yosys stat
  const yCells = log.match(/Number of cells:\s+(\d+)/i);
  if (yCells) out.cellCount = parseInt(yCells[1], 10);
  return out;
}

function buildAreaBreakdown(m: Partial<FlowMetrics>): FlowMetrics["areaBreakdown"] {
  if (m.areaUm2 == null || !Number.isFinite(m.areaUm2)) return [];
  const total = m.areaUm2;
  const util = m.utilizationPct != null ? m.utilizationPct / 100 : null;
  if (util == null) return [{ label: "Design area", value: total, color: "#0284c7" }];
  const used = total * Math.min(1, Math.max(0, util));
  return [
    { label: "Used (util)", value: used, color: "#0284c7" },
    { label: "Whitespace", value: Math.max(0, total - used), color: "#94a3b8" },
  ];
}

function buildPowerBreakdown(m: Partial<FlowMetrics>): FlowMetrics["powerBreakdown"] {
  const out: FlowMetrics["powerBreakdown"] = [];
  if (m.dynamicMw != null) out.push({ label: "Dynamic", value: m.dynamicMw, color: "#f59e0b" });
  if (m.leakageMw != null) out.push({ label: "Leakage", value: m.leakageMw, color: "#ec4899" });
  if (m.powerMw != null && !out.length)
    out.push({ label: "Total", value: m.powerMw, color: "#10b981" });
  return out;
}

export function chipFromDieCore(
  dieArea: string,
  coreArea: string,
  stage: FlowStageId | "idle",
  opts?: { defText?: string | null; defName?: string }
): ChipSnapshot {
  const snap = buildChipSnapshot({
    dieArea,
    coreArea,
    stage,
    defText: opts?.defText,
    defName: opts?.defName,
  });
  return {
    dieW: snap.dieW,
    dieH: snap.dieH,
    coreX: snap.coreX,
    coreY: snap.coreY,
    coreW: snap.coreW,
    coreH: snap.coreH,
    cells: snap.cells,
    routes: snap.routes,
    stage,
    mode: snap.mode,
    sourceLabel: snap.sourceLabel,
    stats: snap.stats,
  };
}

export function parseOpenroadFlowLog(
  log: string,
  opts?: {
    designName?: string;
    metricsCsv?: string;
    jobStatus?: string;
    dieArea?: string;
    coreArea?: string;
    /** DEF text from job/checkpoint — enables Result chip mode */
    defText?: string | null;
    defName?: string;
    completedStages?: FlowStageId[];
    runningStage?: FlowStageId | null;
    stageResults?: Partial<Record<FlowStageId, StageResultPayload>>;
  }
): ParsedFlowState {
  const completed = opts?.completedStages || [];
  const stages = emptyStages(completed, opts?.runningStage);
  const byId = Object.fromEntries(stages.map((s) => [s.id, s])) as Record<
    FlowStageId,
    StageRuntime
  >;

  // Attach known stage results
  if (opts?.stageResults) {
    for (const [id, res] of Object.entries(opts.stageResults)) {
      if (byId[id as FlowStageId] && res) {
        byId[id as FlowStageId].result = res;
      }
    }
  }

  const logLines: ParsedFlowState["logLines"] = [];
  let active: FlowStageId | null = opts?.runningStage || null;
  const lines = (log || "").split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    const hit = matchStage(line);
    if (hit && byId[hit]) {
      if (active && active !== hit && byId[active].status === "running") {
        // don't auto-complete unless in completed list
      }
      active = hit;
      if (byId[hit].status !== "done" && byId[hit].status !== "locked") {
        byId[hit].status = "running";
        byId[hit].progress = Math.min(95, byId[hit].progress + 5);
      }
    }
    const level = lineLevel(line);
    const stageForLine = hit || active;
    logLines.push({ t: line, stage: stageForLine, level });
    if (stageForLine && byId[stageForLine]) {
      byId[stageForLine].logLines.push(line);
      if (level === "error") byId[stageForLine].errors.push(line);
      if (level === "warn") byId[stageForLine].warnings.push(line);
    }
  }

  const js = (opts?.jobStatus || "").toLowerCase();
  // Map openlane completion onto openlane stages
  if (js === "succeeded") {
    for (const s of FLOW_STAGES) {
      if (s.runner === "openlane" && completed.includes("synthesis")) {
        // if full flow succeeded, mark all openlane stages done
        if (
          log &&
          (s.id === "gds" ||
            byId[s.id].logLines.length > 0 ||
            stageIndex(s.id) >= stageIndex("synthesis"))
        ) {
          /* filled below */
        }
      }
    }
  }

  // If log shows GDS and job succeeded, mark openlane chain
  if (js === "succeeded" || /streaming out gds/i.test(log)) {
    for (const s of FLOW_STAGES) {
      if (s.runner === "openlane" && completed.includes("simulation") || completed.includes("lint")) {
        // only mark if we started pnr
      }
    }
  }

  const scraped = scrapeLogMetrics(log);
  if (opts?.metricsCsv) Object.assign(scraped, parseMetricsCsv(opts.metricsCsv));
  const metrics: FlowMetrics = {
    ...emptyMetrics(),
    ...scraped,
    areaBreakdown: buildAreaBreakdown(scraped),
    powerBreakdown: buildPowerBreakdown(scraped),
  };

  const doneCount = stages.filter((s) => s.status === "done" || completed.includes(s.id)).length;
  const failed = stages.some((s) => s.status === "failed");
  const running = stages.some((s) => s.status === "running") || !!opts?.runningStage;
  const percent = Math.round((doneCount / FLOW_STAGES.length) * 100);

  let overall: StageStatusUi = "idle";
  if (failed) overall = "failed";
  else if (doneCount === FLOW_STAGES.length) overall = "done";
  else if (running) overall = "running";

  // Re-apply completed statuses
  for (const id of completed) {
    if (byId[id]) {
      byId[id].status = "done";
      byId[id].progress = 100;
    }
  }
  if (opts?.runningStage && byId[opts.runningStage]) {
    byId[opts.runningStage].status = "running";
  }
  // lock future
  const next = nextRunnableStage(completed);
  for (const s of FLOW_STAGES) {
    if (completed.includes(s.id)) continue;
    if (opts?.runningStage === s.id) continue;
    if (next && stageIndex(s.id) > stageIndex(next)) {
      byId[s.id].status = "locked";
    }
  }

  const pnrIds: FlowStageId[] = [
    "floorplan",
    "powerplan",
    "placement",
    "cts",
    "route",
    "drc",
    "lvs",
    "gds",
  ];
  let chipStage: FlowStageId | "idle" = "idle";
  if (active && pnrIds.includes(active)) chipStage = active;
  else {
    for (let i = pnrIds.length - 1; i >= 0; i--) {
      if (completed.includes(pnrIds[i])) {
        chipStage = pnrIds[i];
        break;
      }
    }
  }

  return {
    stages: FLOW_STAGES.map((s) => byId[s.id]),
    activeStage: active,
    overall,
    metrics,
    chip: chipFromDieCore(
      opts?.dieArea || "0 0 0 0",
      opts?.coreArea || "0 0 0 0",
      chipStage,
      { defText: opts?.defText, defName: opts?.defName }
    ),
    logLines,
    percent: Math.min(100, percent),
  };
}

export function parseSdcClockPeriod(sdcText: string): {
  periodNs: number;
  riseNs: number;
  fallNs: number;
  name?: string;
  source: "sdc";
} | null {
  if (!sdcText?.trim()) return null;
  const periodMatch = sdcText.match(
    /create_clock\b[^;\n]*?-period\s+([0-9.]+)/i
  );
  if (!periodMatch) {
    if (!/create_clock\b/i.test(sdcText)) return null;
    const loose = sdcText.match(/-period\s+([0-9.]+)/i);
    if (!loose) return null;
    const p = parseFloat(loose[1]);
    if (!Number.isFinite(p) || p <= 0) return null;
    return { periodNs: p, riseNs: 0, fallNs: p / 2, source: "sdc" };
  }
  const periodNs = parseFloat(periodMatch[1]);
  if (!Number.isFinite(periodNs) || periodNs <= 0) return null;
  const nameMatch = sdcText.match(/create_clock\b[^;\n]*?-name\s+(\S+)/i);
  const wf = sdcText.match(
    /create_clock\b[^;\n]*?-waveform\s*\{\s*([0-9.]+)\s+([0-9.]+)\s*\}/i
  );
  return {
    periodNs,
    riseNs: wf ? parseFloat(wf[1]) : 0,
    fallNs: wf ? parseFloat(wf[2]) : periodNs / 2,
    name: nameMatch?.[1]?.replace(/[{}]/g, ""),
    source: "sdc",
  };
}

export function buildClockWaveSamples(
  periodNs: number,
  cycles = 4,
  riseNs = 0,
  fallNs?: number
): { t: number; v: 0 | 1 }[] {
  if (!Number.isFinite(periodNs) || periodNs <= 0) return [];
  const fall = fallNs != null && fallNs > riseNs ? fallNs : periodNs * 0.5;
  const pts: { t: number; v: 0 | 1 }[] = [];
  for (let c = 0; c < cycles; c++) {
    const base = c * periodNs;
    pts.push({ t: base + riseNs, v: 1 });
    pts.push({ t: base + fall, v: 0 });
  }
  pts.push({ t: cycles * periodNs + riseNs, v: 1 });
  return pts;
}

/**
 * Parse VCD for a quick studio preview (one preferred signal).
 * Full dump → download / open in Surfer.
 */
export function parseSimpleVcdWave(
  vcd: string,
  maxSamples = 400
): { t: number; v: number; name: string }[] {
  if (!vcd?.includes("$timescale") && !vcd.includes("#")) return [];
  const vars: Record<string, { name: string; width: number }> = {};
  let scope: string[] = [];
  for (const line of vcd.split(/\r?\n/)) {
    const sc = line.match(/\$scope\s+\w+\s+(\S+)/);
    if (sc) {
      scope.push(sc[1]);
      continue;
    }
    if (/\$upscope/.test(line)) {
      scope.pop();
      continue;
    }
    const vm = line.match(/\$var\s+\w+\s+(\d+)\s+(\S+)\s+(\S+)/);
    if (vm) {
      vars[vm[2]] = {
        name: [...scope, vm[3]].join("."),
        width: parseInt(vm[1], 10) || 1,
      };
    }
  }
  const entries = Object.entries(vars);
  if (!entries.length) return [];

  const score = (n: string) => {
    if (/trap|count|mem_valid|mem_ready|q$|data|out/i.test(n)) return 100;
    if (/\.clk$|clock/i.test(n)) return 80;
    if (/rst|reset/i.test(n)) return 60;
    return 10;
  };
  entries.sort((a, b) => score(b[1].name) - score(a[1].name));
  const [id, meta] = entries[0];
  const name = meta.name;
  const out: { t: number; v: number; name: string }[] = [];
  let t = 0;
  let v = 0;
  let lastPush = -1;
  for (const line of vcd.split(/\r?\n/)) {
    const tm = line.match(/^#(\d+)/);
    if (tm) {
      t = parseInt(tm[1], 10);
      continue;
    }
    const ch = line.match(/^([01xXzZ])(.+)$/);
    if (ch && ch[2] === id) {
      v = ch[1] === "1" ? 1 : 0;
      if (t !== lastPush) {
        out.push({ t, v, name });
        lastPush = t;
      }
      if (out.length >= maxSamples) break;
      continue;
    }
    const b = line.match(/^b([01xXzZ]+)\s+(\S+)/);
    if (b && b[2] === id) {
      const bits = b[1].replace(/[xXzZ]/g, "0");
      v = parseInt(bits, 2) || 0;
      if (t !== lastPush) {
        out.push({ t, v, name });
        lastPush = t;
      }
      if (out.length >= maxSamples) break;
    }
  }
  return out;
}

export function listVcdSignals(vcd: string, limit = 40): string[] {
  if (!vcd) return [];
  const names: string[] = [];
  let scope: string[] = [];
  for (const line of vcd.split(/\r?\n/)) {
    const sc = line.match(/\$scope\s+\w+\s+(\S+)/);
    if (sc) {
      scope.push(sc[1]);
      continue;
    }
    if (/\$upscope/.test(line)) {
      scope.pop();
      continue;
    }
    const vm = line.match(/\$var\s+\w+\s+\d+\s+\S+\s+(\S+)/);
    if (vm) {
      names.push([...scope, vm[1]].join("."));
      if (names.length >= limit) break;
    }
  }
  return names;
}

const VCD_SESSION_KEY = "ace_openroad_last_vcd";
const VCD_NAME_KEY = "ace_openroad_last_vcd_name";

export function storeLastVcd(vcd: string, filename = "tb_top.vcd"): void {
  if (typeof window === "undefined" || !vcd) return;
  try {
    const clipped = vcd.length > 1_500_000 ? vcd.slice(0, 1_500_000) : vcd;
    sessionStorage.setItem(VCD_SESSION_KEY, clipped);
    sessionStorage.setItem(VCD_NAME_KEY, filename);
  } catch {
    /* quota */
  }
}

export function loadLastVcd(): { vcd: string; filename: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const vcd = sessionStorage.getItem(VCD_SESSION_KEY);
    if (!vcd) return null;
    return {
      vcd,
      filename: sessionStorage.getItem(VCD_NAME_KEY) || "tb_top.vcd",
    };
  } catch {
    return null;
  }
}

export function downloadVcdText(vcd: string, filename = "tb_top.vcd"): void {
  if (typeof window === "undefined" || !vcd) return;
  const blob = new Blob([vcd], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".vcd") ? filename : `${filename}.vcd`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Open Surfer web app + download VCD for File → Open */
export function openVcdInSurfer(vcd: string, filename = "tb_top.vcd"): void {
  if (typeof window === "undefined") return;
  if (vcd) downloadVcdText(vcd, filename);
  window.open(
    "https://app.surfer-project.org/",
    "_blank",
    "noopener,noreferrer"
  );
}
