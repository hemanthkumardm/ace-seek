/**
 * Per-stage OpenLane / PnR user inputs + defaults + sanity checks.
 * Empty / blank field → default is used (placeholder UX).
 */

import type { FlowStageId } from "./openroad-flow-model";
import type { OpenroadProjectState } from "./openroad-project-hub";
import { getFileByRole, projectHealth } from "./openroad-project-hub";
import { getPdkDef } from "./openroad-pdk-catalog";

export type FieldType = "text" | "number" | "boolean" | "select";

export interface StageFieldDef {
  key: string;
  label: string;
  type: FieldType;
  /** Default when user leaves blank */
  defaultValue: string | number | boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  /** Soft validation */
  min?: number;
  max?: number;
  required?: boolean;
}

export interface StageConfigSchema {
  id: FlowStageId;
  label: string;
  fields: StageFieldDef[];
}

/** User-editable values (strings in form state; empty = use default) */
export type StageInputValues = Record<FlowStageId, Record<string, string>>;

export const STAGE_CONFIG_SCHEMAS: StageConfigSchema[] = [
  {
    id: "lint",
    label: "Lint",
    fields: [
      {
        key: "LINT_TOP",
        label: "Top module",
        type: "text",
        defaultValue: "top",
        placeholder: "top",
      },
      {
        key: "LINT_WALL",
        label: "Enable -Wall style warnings",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    id: "simulation",
    label: "Simulation",
    fields: [
      {
        key: "SIM_TB_TOP",
        label: "Testbench top",
        type: "text",
        defaultValue: "tb_top",
        placeholder: "tb_top",
        help: "Module name of testbench (template uses tb_top)",
      },
      {
        key: "SIM_TIMEOUT_CYCLES",
        label: "Max sim note (doc only)",
        type: "number",
        defaultValue: 200,
        placeholder: "200",
      },
    ],
  },
  {
    id: "synthesis",
    label: "Synthesis",
    fields: [
      {
        key: "CLOCK_PORT",
        label: "Clock port",
        type: "text",
        defaultValue: "clk",
        placeholder: "clk",
        help: "Primary clock port name in RTL",
      },
      {
        key: "CLOCK_PERIOD",
        label: "Clock period (ns)",
        type: "number",
        defaultValue: 10,
        placeholder: "from SDC or e.g. 10",
        min: 0.1,
        max: 1000,
        help: "Used for OpenLane if set. Waveform prefers create_clock -period from uploaded SDC (not a fixed 10 ns template).",
      },
      {
        key: "SYNTH_NO_FLAT",
        label: "Keep hierarchy (no flatten)",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "QUIT_ON_SYNTH_CHECKS",
        label: "Quit on synth checks",
        type: "boolean",
        defaultValue: false,
        help: "false = continue on soft synth check failures (easier debug)",
      },
      {
        key: "SYNTH_STRATEGY",
        label: "Yosys/ABC strategy",
        type: "text",
        defaultValue: "AREA 0",
        placeholder: "AREA 0",
        help: "OpenLane SYNTH_STRATEGY e.g. AREA 0–3, DELAY 0–4",
      },
      {
        key: "SYNTH_BUFFERING",
        label: "Synth buffering",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "SYNTH_SIZING",
        label: "Synth gate sizing",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "SYNTH_CLOCK_UNCERTAINTY",
        label: "Clock uncertainty (ns)",
        type: "number",
        defaultValue: 0.25,
        placeholder: "0.25",
        min: 0,
        max: 5,
      },
      {
        key: "SYNTH_TIMING_DERATE",
        label: "Timing derate",
        type: "number",
        defaultValue: 0.05,
        placeholder: "0.05",
        min: 0,
        max: 0.5,
      },
    ],
  },
  {
    id: "io_plan",
    label: "IO Planner",
    fields: [
      {
        key: "IO_PLAN_JSON",
        label: "IO plan (auto — use center panel)",
        type: "text",
        defaultValue: "",
        placeholder: "{}",
        help: "Serialized pin→side map. Edit interactively in the IO Planner view (not by hand).",
      },
      {
        key: "IO_USE_PIN_ORDER",
        label: "Apply pin_order.cfg to floorplan",
        type: "boolean",
        defaultValue: true,
        help: "Sets OpenLane FP_PIN_ORDER_CFG when true",
      },
    ],
  },
  {
    id: "floorplan",
    label: "Floorplan",
    fields: [
      {
        key: "FP_SIZING",
        label: "FP sizing mode",
        type: "select",
        defaultValue: "absolute",
        options: [
          { value: "absolute", label: "absolute (DIE/CORE area)" },
          { value: "relative", label: "relative (utilization)" },
        ],
      },
      {
        key: "DIE_AREA",
        label: "Die area (µm)",
        type: "text",
        defaultValue: "0 0 400 400",
        placeholder: "0 0 400 400",
        help: "llx lly urx ury — required for absolute mode",
      },
      {
        key: "CORE_AREA",
        label: "Core area (µm)",
        type: "text",
        defaultValue: "20 20 380 380",
        placeholder: "20 20 380 380",
        help: "Must sit inside die. Halo (die−core) is where PDN rings live.",
      },
      {
        key: "FP_CORE_UTIL",
        label: "Core util % (relative mode)",
        type: "number",
        defaultValue: 30,
        placeholder: "30",
        min: 5,
        max: 90,
        help: "Only used when FP_SIZING=relative",
      },
      {
        key: "FP_ASPECT_RATIO",
        label: "Aspect ratio",
        type: "number",
        defaultValue: 1,
        placeholder: "1",
        min: 0.2,
        max: 5,
      },
      // IO pin geometry
      {
        key: "FP_IO_MIN_DISTANCE",
        label: "IO min distance (µm)",
        type: "number",
        defaultValue: 3,
        placeholder: "3",
        min: 0.5,
        max: 50,
        help: "Minimum spacing between IO pins on a side",
      },
      {
        key: "FP_IO_HLENGTH",
        label: "IO horizontal pin length (µm)",
        type: "number",
        defaultValue: 4,
        placeholder: "4",
        min: 1,
        max: 50,
      },
      {
        key: "FP_IO_VLENGTH",
        label: "IO vertical pin length (µm)",
        type: "number",
        defaultValue: 4,
        placeholder: "4",
        min: 1,
        max: 50,
      },
      {
        key: "FP_IO_HLAYER",
        label: "IO horizontal metal",
        type: "text",
        defaultValue: "met3",
        placeholder: "met3",
        help: "Metal for E/W pins (sky130 often met3)",
      },
      {
        key: "FP_IO_VLAYER",
        label: "IO vertical metal",
        type: "text",
        defaultValue: "met2",
        placeholder: "met2",
        help: "Metal for N/S pins (sky130 often met2)",
      },
      // Tap / endcap
      {
        key: "RUN_TAP_DECAP_INSERTION",
        label: "Insert tap / endcap cells",
        type: "boolean",
        defaultValue: true,
        help: "Well taps + endcaps along rows (always recommended for sky130)",
      },
      {
        key: "FP_TAPCELL_DIST",
        label: "Tap cell distance (µm)",
        type: "number",
        defaultValue: 13,
        placeholder: "13",
        min: 5,
        max: 100,
        help: "Max distance between well taps (sky130 hd default ~13)",
      },
      {
        key: "FP_TAP_HORIZONTAL_HALO",
        label: "Tap horizontal halo (µm)",
        type: "number",
        defaultValue: 10,
        placeholder: "10",
        min: 0,
        max: 50,
      },
      {
        key: "FP_TAP_VERTICAL_HALO",
        label: "Tap vertical halo (µm)",
        type: "number",
        defaultValue: 10,
        placeholder: "10",
        min: 0,
        max: 50,
      },
    ],
  },
  {
    id: "powerplan",
    label: "Powerplan",
    fields: [
      // ── Enables ──────────────────────────────────────────────
      {
        key: "FP_PDN_CORE_RING",
        label: "Core PDN rings",
        type: "boolean",
        defaultValue: true,
        help: "Closed VPWR/VGND rings in the die↔core margin. Requires Multilayer PDN.",
      },
      {
        key: "FP_PDN_MULTILAYER",
        label: "Multilayer PDN",
        type: "boolean",
        defaultValue: true,
        help: "REQUIRED for rings: vertical straps + horizontal straps on two metals (sky130: met4/met5).",
      },
      {
        key: "FP_PDN_ENABLE_RAILS",
        label: "Stdcell power rails",
        type: "boolean",
        defaultValue: true,
        help: "Followpin rails on stdcell rows (usually met1).",
      },
      {
        key: "FP_PDN_AUTO_ADJUST",
        label: "Auto-adjust PDN geometry",
        type: "boolean",
        defaultValue: true,
        help: "OpenLane may tweak pitch/offset slightly to fit the core grid.",
      },
      // ── Core ring geometry (µm) — lives in die↔core halo ─────
      {
        key: "FP_PDN_CORE_RING_VWIDTH",
        label: "Ring vertical width (µm)",
        type: "number",
        defaultValue: 1.6,
        placeholder: "1.6",
        min: 0.5,
        max: 20,
        help: "Width of vertical ring straps (sky130 default 1.6). Must fit die–core halo with offset+spacing.",
      },
      {
        key: "FP_PDN_CORE_RING_HWIDTH",
        label: "Ring horizontal width (µm)",
        type: "number",
        defaultValue: 1.6,
        placeholder: "1.6",
        min: 0.5,
        max: 20,
        help: "Width of horizontal ring straps (sky130 default 1.6).",
      },
      {
        key: "FP_PDN_CORE_RING_VSPACING",
        label: "Ring vertical spacing (µm)",
        type: "number",
        defaultValue: 1.7,
        placeholder: "1.7",
        min: 0.28,
        max: 20,
        help: "Gap between dual vertical ring lines (VPWR↔VGND). ≥ metal min-spacing (~0.28–1.7).",
      },
      {
        key: "FP_PDN_CORE_RING_HSPACING",
        label: "Ring horizontal spacing (µm)",
        type: "number",
        defaultValue: 1.7,
        placeholder: "1.7",
        min: 0.28,
        max: 20,
        help: "Gap between dual horizontal ring lines.",
      },
      {
        key: "FP_PDN_CORE_RING_VOFFSET",
        label: "Ring vertical offset from core (µm)",
        type: "number",
        defaultValue: 6,
        placeholder: "6",
        min: 1,
        max: 100,
        help: "Distance from core edge to first vertical ring. Must be < (die−core)/2 halo.",
      },
      {
        key: "FP_PDN_CORE_RING_HOFFSET",
        label: "Ring horizontal offset from core (µm)",
        type: "number",
        defaultValue: 6,
        placeholder: "6",
        min: 1,
        max: 100,
        help: "Distance from core edge to first horizontal ring.",
      },
      // ── Straps inside core ───────────────────────────────────
      {
        key: "FP_PDN_VWIDTH",
        label: "Vertical strap width (µm)",
        type: "number",
        defaultValue: 1.6,
        placeholder: "1.6",
        min: 0.3,
        max: 20,
        help: "Width of vertical power straps (usually met4).",
      },
      {
        key: "FP_PDN_HWIDTH",
        label: "Horizontal strap width (µm)",
        type: "number",
        defaultValue: 1.6,
        placeholder: "1.6",
        min: 0.3,
        max: 20,
        help: "Width of horizontal power straps (usually met5; needs multilayer).",
      },
      {
        key: "FP_PDN_VSPACING",
        label: "Vertical strap spacing (µm)",
        type: "number",
        defaultValue: 1.7,
        placeholder: "1.7",
        min: 0.28,
        max: 50,
        help: "Spacing between parallel vertical strap pairs.",
      },
      {
        key: "FP_PDN_HSPACING",
        label: "Horizontal strap spacing (µm)",
        type: "number",
        defaultValue: 1.7,
        placeholder: "1.7",
        min: 0.28,
        max: 50,
        help: "Spacing between parallel horizontal strap pairs.",
      },
      {
        key: "FP_PDN_VPITCH",
        label: "Vertical strap pitch (µm)",
        type: "number",
        defaultValue: 153.6,
        placeholder: "153.6",
        min: 10,
        max: 500,
        help: "Pitch between vertical strap groups (sky130 OpenLane default ~153.6).",
      },
      {
        key: "FP_PDN_HPITCH",
        label: "Horizontal strap pitch (µm)",
        type: "number",
        defaultValue: 153.18,
        placeholder: "153.18",
        min: 10,
        max: 500,
        help: "Pitch between horizontal strap groups (sky130 default ~153.18).",
      },
      {
        key: "FP_PDN_VOFFSET",
        label: "Vertical strap offset (µm)",
        type: "number",
        defaultValue: 16.32,
        placeholder: "16.32",
        min: 0,
        max: 200,
        help: "Offset of first vertical strap from core edge.",
      },
      {
        key: "FP_PDN_HOFFSET",
        label: "Horizontal strap offset (µm)",
        type: "number",
        defaultValue: 16.65,
        placeholder: "16.65",
        min: 0,
        max: 200,
        help: "Offset of first horizontal strap from core edge.",
      },
      // ── Rails ────────────────────────────────────────────────
      {
        key: "FP_PDN_RAIL_WIDTH",
        label: "Rail width (µm)",
        type: "number",
        defaultValue: 0.48,
        placeholder: "0.48",
        min: 0.14,
        max: 5,
        help: "Stdcell followpin rail width (sky130 hd met1 default 0.48).",
      },
      {
        key: "FP_PDN_RAIL_OFFSET",
        label: "Rail offset (µm)",
        type: "number",
        defaultValue: 0,
        placeholder: "0",
        min: 0,
        max: 10,
        help: "Followpin rail offset (usually 0).",
      },
      // ── Layers (advanced) ────────────────────────────────────
      {
        key: "FP_PDN_VERTICAL_LAYER",
        label: "Vertical PDN layer",
        type: "text",
        defaultValue: "met4",
        placeholder: "met4",
        help: "sky130: met4. GF180: often Metal4. Must match PDK tech LEF.",
      },
      {
        key: "FP_PDN_HORIZONTAL_LAYER",
        label: "Horizontal PDN layer",
        type: "text",
        defaultValue: "met5",
        placeholder: "met5",
        help: "sky130: met5 (needs multilayer). Used for horizontal straps + ring H.",
      },
      {
        key: "FP_PDN_RAIL_LAYER",
        label: "Rail layer",
        type: "text",
        defaultValue: "met1",
        placeholder: "met1",
        help: "Followpin / stdcell rail layer (sky130: met1).",
      },
      {
        key: "FP_PDN_VERTICAL_HALO",
        label: "Macro vertical halo (µm)",
        type: "number",
        defaultValue: 10,
        placeholder: "10",
        min: 0,
        max: 100,
        help: "Keep-out around macros for vertical PDN.",
      },
      {
        key: "FP_PDN_HORIZONTAL_HALO",
        label: "Macro horizontal halo (µm)",
        type: "number",
        defaultValue: 10,
        placeholder: "10",
        min: 0,
        max: 100,
        help: "Keep-out around macros for horizontal PDN.",
      },
      // ── Nets ─────────────────────────────────────────────────
      {
        key: "VDD_NETS",
        label: "VDD net name(s)",
        type: "text",
        defaultValue: "VPWR",
        placeholder: "VPWR",
        help: "sky130 OpenLane usually VPWR (not VDD).",
      },
      {
        key: "GND_NETS",
        label: "GND net name(s)",
        type: "text",
        defaultValue: "VGND",
        placeholder: "VGND",
        help: "sky130 OpenLane usually VGND (not VSS).",
      },
    ],
  },
  {
    id: "placement",
    label: "Placement",
    fields: [
      {
        key: "PL_TARGET_DENSITY",
        label: "Target density",
        type: "number",
        defaultValue: 0.4,
        placeholder: "0.4",
        min: 0.1,
        max: 0.95,
        help: "Lower if GPL-0302 / overflow. Typical 0.3–0.55",
      },
      {
        key: "PL_TIME_DRIVEN",
        label: "Timing-driven placement",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "PL_ROUTABILITY_DRIVEN",
        label: "Routability-driven",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "PL_ESTIMATE_PARASITICS",
        label: "Post-place timing STA (est. parasitics)",
        type: "boolean",
        defaultValue: true,
        help: "OpenLane run_sta after placement → gpl_sta / dpl_sta WNS·TNS reports",
      },
      {
        key: "PL_WIRELENGTH_COEF",
        label: "Wirelength coefficient",
        type: "number",
        defaultValue: 0.25,
        placeholder: "0.25",
        min: 0.05,
        max: 1,
        help: "GPL wirelength weight (higher → shorter wires, may hurt density)",
      },
      {
        key: "GPL_CELL_PADDING",
        label: "Global place cell padding (sites)",
        type: "number",
        defaultValue: 0,
        placeholder: "0",
        min: 0,
        max: 10,
        help: "Extra sites around cells in GPL. Raise if congestion; keep ≤ DPL padding",
      },
      {
        key: "DPL_CELL_PADDING",
        label: "Detailed place cell padding (sites)",
        type: "number",
        defaultValue: 0,
        placeholder: "0",
        min: 0,
        max: 10,
        help: "Should be ≥ GPL_CELL_PADDING",
      },
      {
        key: "PL_RESIZER_DESIGN_OPTIMIZATIONS",
        label: "Resizer design opts (buffer/size)",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "PL_RESIZER_TIMING_OPTIMIZATIONS",
        label: "Resizer timing opts",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "PL_RESIZER_SETUP_SLACK_MARGIN",
        label: "Resizer setup slack margin (ns)",
        type: "number",
        defaultValue: 0.05,
        placeholder: "0.05",
        min: 0,
        max: 2,
        help: "Extra setup margin targeted by resizer",
      },
      {
        key: "PL_RESIZER_HOLD_SLACK_MARGIN",
        label: "Resizer hold slack margin (ns)",
        type: "number",
        defaultValue: 0.1,
        placeholder: "0.1",
        min: 0,
        max: 2,
      },
      {
        key: "PL_MAX_DISPLACEMENT_X",
        label: "Max displace X (µm)",
        type: "number",
        defaultValue: 500,
        placeholder: "500",
        min: 10,
        max: 5000,
        help: "Detailed placement max move in X",
      },
      {
        key: "PL_MAX_DISPLACEMENT_Y",
        label: "Max displace Y (µm)",
        type: "number",
        defaultValue: 100,
        placeholder: "100",
        min: 5,
        max: 2000,
      },
    ],
  },
  {
    id: "cts",
    label: "CTS",
    fields: [
      {
        key: "CTS_ROOT_BUFFER",
        label: "CTS root buffer",
        type: "text",
        defaultValue: "",
        placeholder: "sky130_fd_sc_hd__clkbuf_16 (empty = PDK default)",
        help: "Clock tree root buffer cell",
      },
      {
        key: "CTS_CLK_BUFFER_LIST",
        label: "Clock buffer list",
        type: "text",
        defaultValue: "",
        placeholder: "sky130_fd_sc_hd__clkbuf_8 sky130_fd_sc_hd__clkbuf_4 …",
        help: "Space-separated buffers CTS may use (empty = tool/PDK default)",
      },
      {
        key: "CTS_TOLERANCE",
        label: "CTS skew tolerance",
        type: "number",
        defaultValue: 100,
        placeholder: "100",
        min: 1,
        max: 1000,
        help: "OpenLane CTS_TOLERANCE (higher = looser skew target)",
      },
      {
        key: "CTS_SINK_CLUSTERING_SIZE",
        label: "Sink clustering size",
        type: "number",
        defaultValue: 25,
        placeholder: "25",
        min: 2,
        max: 200,
      },
      {
        key: "CTS_SINK_CLUSTERING_MAX_DIAMETER",
        label: "Sink cluster max diameter (µm)",
        type: "number",
        defaultValue: 50,
        placeholder: "50",
        min: 5,
        max: 500,
      },
      {
        key: "CTS_CLK_MAX_WIRE_LENGTH",
        label: "Max clock wire length (µm)",
        type: "number",
        defaultValue: 0,
        placeholder: "0 = unlimited",
        min: 0,
        max: 2000,
        help: "0 = no limit (OpenLane default)",
      },
      {
        key: "CTS_REPORT_TIMING",
        label: "Report timing after CTS",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    id: "route",
    label: "Route",
    fields: [
      {
        key: "RT_MIN_LAYER",
        label: "Min routing layer",
        type: "text",
        defaultValue: "met1",
        placeholder: "met1",
      },
      {
        key: "RT_MAX_LAYER",
        label: "Max routing layer",
        type: "text",
        defaultValue: "met4",
        placeholder: "met4",
        help: "sky130 often met4/met5. Keep ≥ PDN horizontal layer if possible",
      },
      {
        key: "ROUTING_CORES",
        label: "Routing cores (threads)",
        type: "number",
        defaultValue: 2,
        placeholder: "2",
        min: 1,
        max: 32,
      },
      {
        key: "GRT_ALLOW_CONGESTION",
        label: "Allow global-route congestion",
        type: "boolean",
        defaultValue: false,
        help: "true = continue even if GRT overflow remains (debug)",
      },
      {
        key: "GRT_ADJUSTMENT",
        label: "GRT resource adjustment",
        type: "number",
        defaultValue: 0.3,
        placeholder: "0.3",
        min: 0,
        max: 0.9,
        help: "0–0.9; higher = more pessimistic / reserved resources",
      },
      {
        key: "GRT_OVERFLOW_ITERS",
        label: "GRT overflow iterations",
        type: "number",
        defaultValue: 50,
        placeholder: "50",
        min: 5,
        max: 200,
      },
      {
        key: "GRT_REPAIR_ANTENNAS",
        label: "Repair antennas (GRT)",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "DRT_OPT_ITERS",
        label: "Detailed route opt iterations",
        type: "number",
        defaultValue: 64,
        placeholder: "64",
        min: 1,
        max: 128,
        help: "TritonRoute DRT_OPT_ITERS",
      },
      {
        key: "RUN_FILL_INSERTION",
        label: "Metal fill insertion",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    id: "drc",
    label: "DRC",
    fields: [
      {
        key: "RUN_MAGIC_DRC",
        label: "Run Magic DRC",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "RUN_KLAYOUT_DRC",
        label: "Run KLayout DRC",
        type: "boolean",
        defaultValue: false,
        help: "Often strict on tiny cores — off by default for debug",
      },
      {
        key: "QUIT_ON_MAGIC_DRC",
        label: "Quit on Magic DRC fail",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "QUIT_ON_KLAYOUT_DRC",
        label: "Quit on KLayout DRC fail",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "QUIT_ON_TR_DRC",
        label: "Quit on TritonRoute DRC",
        type: "boolean",
        defaultValue: false,
        help: "If true, routing DRC violations fail the flow",
      },
    ],
  },
  {
    id: "lvs",
    label: "LVS",
    fields: [
      {
        key: "RUN_LVS",
        label: "Run LVS",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "QUIT_ON_LVS_ERROR",
        label: "Quit on LVS error",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "LVS_INSERT_POWER_PINS",
        label: "Insert power pins for LVS",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    id: "gds",
    label: "GDS",
    fields: [
      {
        key: "PRIMARY_GDSII_STREAMOUT_TOOL",
        label: "GDS stream-out tool",
        type: "select",
        defaultValue: "magic",
        options: [
          { value: "magic", label: "magic" },
          { value: "klayout", label: "klayout" },
        ],
      },
      {
        key: "RUN_KLAYOUT",
        label: "Also stream KLayout GDS",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "MAGIC_EXT_USE_GDS",
        label: "Magic extract use GDS",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
];

export function emptyStageInputValues(): StageInputValues {
  const out = {} as StageInputValues;
  for (const s of STAGE_CONFIG_SCHEMAS) {
    out[s.id] = {};
    for (const f of s.fields) out[s.id][f.key] = "";
  }
  return out;
}

/** Resolve form value or default */
export function resolveField(
  stage: FlowStageId,
  key: string,
  values: StageInputValues
): string | number | boolean {
  const schema = STAGE_CONFIG_SCHEMAS.find((s) => s.id === stage);
  const field = schema?.fields.find((f) => f.key === key);
  if (!field) return values[stage]?.[key] ?? "";
  const raw = (values[stage]?.[key] ?? "").trim();
  if (raw === "") return field.defaultValue;
  if (field.type === "boolean") {
    return raw === "true" || raw === "1" || raw === "yes";
  }
  if (field.type === "number") {
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : (field.defaultValue as number);
  }
  return raw;
}

/** Keys that are Ace-Seek UI only — never pass to OpenLane config.json */
export const OPENLANE_DROP_UI_KEYS = new Set([
  "LINT_TOP",
  "LINT_WALL",
  "SIM_TB_TOP",
  "SIM_TIMEOUT_CYCLES",
  "IO_PLAN_JSON",
  "IO_USE_PIN_ORDER",
]);

export function resolveAllOpenlaneConfig(
  values: StageInputValues,
  opts?: { pdk?: string }
): Record<string, string | number | boolean> {
  // PDK-specific defaults first (user stage inputs override when non-empty)
  const pdkDefaults = getPdkDef(opts?.pdk).openlaneDefaults || {};
  const c: Record<string, string | number | boolean> = {
    DESIGN_NAME: "top",
    VERILOG_FILES: "dir::src/*.v",
    RUN_LINTER: false,
    QUIT_ON_TR_DRC: false,
    QUIT_ON_ILLEGAL_OVERLAPS: false,
    ...pdkDefaults,
  };
  for (const s of STAGE_CONFIG_SCHEMAS) {
    for (const f of s.fields) {
      if (OPENLANE_DROP_UI_KEYS.has(f.key)) continue;
      const raw = (values[s.id]?.[f.key] ?? "").trim();
      if (raw === "" && f.key in pdkDefaults && c[f.key] !== undefined) {
        continue;
      }
      c[f.key] = resolveField(s.id, f.key, values);
    }
  }
  // Wire IO planner → OpenLane FP_PIN_ORDER_CFG when plan is saved and enabled.
  // pin_order.cfg is also force-wired in merge_user_config.py when the file exists.
  const usePinOrder = resolveField("io_plan", "IO_USE_PIN_ORDER", values);
  const planJson = String(values.io_plan?.IO_PLAN_JSON || "").trim();
  if (usePinOrder !== false && planJson) {
    c.FP_PIN_ORDER_CFG = "dir::pin_order.cfg";
  }
  return c;
}

export type SanityLevel = "ok" | "warn" | "error";

export interface SanityItem {
  stage: FlowStageId | "global";
  level: SanityLevel;
  code: string;
  message: string;
  /** Field key if related */
  field?: string;
}

function parseArea(s: string): { llx: number; lly: number; urx: number; ury: number } | null {
  const p = s.trim().split(/\s+/).map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) return null;
  return { llx: p[0], lly: p[1], urx: p[2], ury: p[3] };
}

/** Pre-run / per-stage sanity checks (inputs + project) */
export function runSanityChecks(
  project: OpenroadProjectState,
  values: StageInputValues,
  opts?: { stage?: FlowStageId | "all"; log?: string }
): SanityItem[] {
  const items: SanityItem[] = [];
  const health = projectHealth(project);
  const scope = opts?.stage || "all";

  // Global project
  if (scope === "all" || scope === "synthesis") {
    if (!health.hasSdc) {
      items.push({
        stage: "global",
        level: "error",
        code: "NO_SDC",
        message: "Missing constraints.sdc — export from VLSI or upload on Project",
      });
    }
    if (!health.hasRtl) {
      items.push({
        stage: "global",
        level: "error",
        code: "NO_RTL",
        message:
          "No RTL uploaded — OpenLane will refuse to run (placeholder top removed)",
      });
    }
    const sdc = getFileByRole(project, "sdc")?.content || "";
    const clkPort = String(resolveField("synthesis", "CLOCK_PORT", values));
    if (sdc && !new RegExp(`\\b${clkPort}\\b`).test(sdc) && !/create_clock/i.test(sdc)) {
      items.push({
        stage: "synthesis",
        level: "warn",
        code: "CLK_PORT",
        field: "CLOCK_PORT",
        message: `Clock port "${clkPort}" not obvious in SDC — check create_clock target`,
      });
    }
    const period = Number(resolveField("synthesis", "CLOCK_PERIOD", values));
    if (period <= 0 || period > 500) {
      items.push({
        stage: "synthesis",
        level: "error",
        code: "PERIOD",
        field: "CLOCK_PERIOD",
        message: `Clock period ${period} ns out of range (0.1–500)`,
      });
    }
  }

  if (scope === "io_plan") {
    const planRaw = (values.io_plan?.IO_PLAN_JSON || "").trim();
    if (!planRaw) {
      items.push({
        stage: "io_plan",
        level: "warn",
        code: "IO_PLAN_EMPTY",
        field: "IO_PLAN_JSON",
        message:
          "No IO plan saved yet — assign ports to N/S/E/W in the center panel, then Run",
      });
    }
  }

  if (scope === "all" || scope === "floorplan") {
    const mode = String(resolveField("floorplan", "FP_SIZING", values));
    const die = parseArea(String(resolveField("floorplan", "DIE_AREA", values)));
    const core = parseArea(String(resolveField("floorplan", "CORE_AREA", values)));
    if (mode === "absolute") {
      if (!die) {
        items.push({
          stage: "floorplan",
          level: "error",
          code: "DIE_AREA",
          field: "DIE_AREA",
          message: "DIE_AREA must be four numbers: llx lly urx ury",
        });
      } else if (die.urx <= die.llx || die.ury <= die.lly) {
        items.push({
          stage: "floorplan",
          level: "error",
          code: "DIE_AREA",
          field: "DIE_AREA",
          message: "DIE_AREA urx/ury must be greater than llx/lly",
        });
      }
      if (!core) {
        items.push({
          stage: "floorplan",
          level: "error",
          code: "CORE_AREA",
          field: "CORE_AREA",
          message: "CORE_AREA must be four numbers: llx lly urx ury",
        });
      } else if (die && core) {
        if (
          core.llx < die.llx ||
          core.lly < die.lly ||
          core.urx > die.urx ||
          core.ury > die.ury
        ) {
          items.push({
            stage: "floorplan",
            level: "error",
            code: "CORE_IN_DIE",
            field: "CORE_AREA",
            message: "CORE_AREA must be fully inside DIE_AREA",
          });
        }
        const dieA = (die.urx - die.llx) * (die.ury - die.lly);
        if (dieA < 100) {
          items.push({
            stage: "floorplan",
            level: "warn",
            code: "DIE_SMALL",
            field: "DIE_AREA",
            message: "Die area is very small — large RTL may fail placement (GPL-0302)",
          });
        }
      }
    } else {
      const util = Number(resolveField("floorplan", "FP_CORE_UTIL", values));
      if (util < 5 || util > 85) {
        items.push({
          stage: "floorplan",
          level: "warn",
          code: "UTIL",
          field: "FP_CORE_UTIL",
          message: `Core util ${util}% is aggressive — try 15–40% for large designs`,
        });
      }
    }
  }

  if (scope === "all" || scope === "powerplan" || scope === "floorplan") {
    const ringsOn = Boolean(resolveField("powerplan", "FP_PDN_CORE_RING", values));
    const multi = Boolean(resolveField("powerplan", "FP_PDN_MULTILAYER", values));
    if (ringsOn && !multi) {
      items.push({
        stage: "powerplan",
        level: "error",
        code: "PDN_RING_NEEDS_MULTI",
        field: "FP_PDN_MULTILAYER",
        message:
          "Core rings require Multilayer PDN (OpenLane). Enable Multilayer or turn rings off.",
      });
    }

    const num = (key: string) => Number(resolveField("powerplan", key, values));
    const rw = num("FP_PDN_CORE_RING_VWIDTH");
    const rh = num("FP_PDN_CORE_RING_HWIDTH");
    const rsv = num("FP_PDN_CORE_RING_VSPACING");
    const rsh = num("FP_PDN_CORE_RING_HSPACING");
    const rov = num("FP_PDN_CORE_RING_VOFFSET");
    const roh = num("FP_PDN_CORE_RING_HOFFSET");
    const vp = num("FP_PDN_VPITCH");
    const hp = num("FP_PDN_HPITCH");
    const railW = num("FP_PDN_RAIL_WIDTH");

    const checkRange = (
      field: string,
      v: number,
      lo: number,
      hi: number,
      label: string
    ) => {
      if (!Number.isFinite(v)) {
        items.push({
          stage: "powerplan",
          level: "error",
          code: "PDN_NAN",
          field,
          message: `${label} must be a number`,
        });
      } else if (v < lo || v > hi) {
        items.push({
          stage: "powerplan",
          level: "error",
          code: "PDN_RANGE",
          field,
          message: `${label} ${v} out of range (${lo}–${hi} µm)`,
        });
      }
    };

    if (ringsOn) {
      checkRange("FP_PDN_CORE_RING_VWIDTH", rw, 0.5, 20, "Ring V width");
      checkRange("FP_PDN_CORE_RING_HWIDTH", rh, 0.5, 20, "Ring H width");
      checkRange("FP_PDN_CORE_RING_VSPACING", rsv, 0.28, 20, "Ring V spacing");
      checkRange("FP_PDN_CORE_RING_HSPACING", rsh, 0.28, 20, "Ring H spacing");
      checkRange("FP_PDN_CORE_RING_VOFFSET", rov, 1, 100, "Ring V offset");
      checkRange("FP_PDN_CORE_RING_HOFFSET", roh, 1, 100, "Ring H offset");
    }
    checkRange("FP_PDN_VPITCH", vp, 10, 500, "Vertical strap pitch");
    checkRange("FP_PDN_HPITCH", hp, 10, 500, "Horizontal strap pitch");
    checkRange("FP_PDN_RAIL_WIDTH", railW, 0.14, 5, "Rail width");

    // Halo fit: ring stack must fit in die–core margin
    if (ringsOn) {
      const die = parseArea(
        String(resolveField("floorplan", "DIE_AREA", values))
      );
      const core = parseArea(
        String(resolveField("floorplan", "CORE_AREA", values))
      );
      if (die && core) {
        const haloX = Math.min(core.llx - die.llx, die.urx - core.urx);
        const haloY = Math.min(core.lly - die.lly, die.ury - core.ury);
        // dual rings: offset + width + spacing + width (approx)
        const needX = roh + rh + rsh + rh;
        const needY = rov + rw + rsv + rw;
        if (needX > haloX - 0.5) {
          items.push({
            stage: "powerplan",
            level: "error",
            code: "PDN_RING_HALO_X",
            field: "FP_PDN_CORE_RING_HOFFSET",
            message: `Ring stack needs ~${needX.toFixed(1)} µm horizontal halo but die–core only has ~${haloX.toFixed(1)} µm — shrink offset/width/spacing or grow die margin`,
          });
        }
        if (needY > haloY - 0.5) {
          items.push({
            stage: "powerplan",
            level: "error",
            code: "PDN_RING_HALO_Y",
            field: "FP_PDN_CORE_RING_VOFFSET",
            message: `Ring stack needs ~${needY.toFixed(1)} µm vertical halo but die–core only has ~${haloY.toFixed(1)} µm — shrink offset/width/spacing or grow die margin`,
          });
        }
        if (haloX < 5 || haloY < 5) {
          items.push({
            stage: "powerplan",
            level: "warn",
            code: "PDN_HALO_TIGHT",
            message: `Die–core halo is tight (X=${haloX.toFixed(1)} Y=${haloY.toFixed(1)} µm). Rings need room — typical halo ≥ 15–50 µm.`,
          });
        }
      }
    }

    if (vp < 40 || hp < 40) {
      items.push({
        stage: "powerplan",
        level: "warn",
        code: "PDN_PITCH_DENSE",
        field: "FP_PDN_VPITCH",
        message: `Strap pitch ~${vp}/${hp} µm is very dense — may over-congest routing (sky130 default ~153)`,
      });
    }
  }

  if (scope === "all" || scope === "placement") {
    const dens = Number(resolveField("placement", "PL_TARGET_DENSITY", values));
    if (dens < 0.15 || dens > 0.85) {
      items.push({
        stage: "placement",
        level: "warn",
        code: "DENSITY",
        field: "PL_TARGET_DENSITY",
        message: `Density ${dens} may fail or leave huge whitespace — typical 0.3–0.55`,
      });
    }
  }

  if (scope === "all" || scope === "route") {
    const layer = String(resolveField("route", "RT_MAX_LAYER", values));
    const okLayer =
      /^met[1-5]$/i.test(layer) ||
      /^Metal[1-5]$/i.test(layer) ||
      /^M[1-9]$/i.test(layer) ||
      /^metal[0-9]+$/i.test(layer);
    if (!okLayer) {
      items.push({
        stage: "route",
        level: "warn",
        code: "LAYER",
        field: "RT_MAX_LAYER",
        message: `RT_MAX_LAYER "${layer}" unusual (sky130: met1–met5, gf180: Metal*, asap7: M*)`,
      });
    }
  }

  // Post-log sanity when log provided
  if (opts?.log) {
    const log = opts.log;
    if (/GPL-0302|higher -density|larger core area/i.test(log)) {
      items.push({
        stage: "placement",
        level: "error",
        code: "GPL-0302",
        field: "PL_TARGET_DENSITY",
        message:
          "Placement density/core too small (GPL-0302). Increase DIE/CORE or lower PL_TARGET_DENSITY and re-run.",
      });
    }
    if (/Re-definition of module/i.test(log)) {
      items.push({
        stage: "synthesis",
        level: "error",
        code: "DUP_MODULE",
        message: "Duplicate RTL modules — remove duplicate .v files from Project",
      });
    }
    if (/There are violations in the design after KLayout DRC/i.test(log)) {
      items.push({
        stage: "drc",
        level: "warn",
        code: "KLAYOUT_DRC",
        field: "QUIT_ON_KLAYOUT_DRC",
        message: "KLayout DRC reported violations — disable quit-on-DRC or fix layout inputs",
      });
    }
    if (/Flow failed/i.test(log) && !items.some((i) => i.level === "error")) {
      items.push({
        stage: "global",
        level: "error",
        code: "FLOW_FAILED",
        message: "OpenLane reported Flow failed — open Live log for the failing STEP",
      });
    }
  }

  return items;
}

export function sanitySummary(items: SanityItem[]): {
  errors: number;
  warns: number;
  ok: boolean;
} {
  const errors = items.filter((i) => i.level === "error").length;
  const warns = items.filter((i) => i.level === "warn").length;
  return { errors, warns, ok: errors === 0 };
}

const STORAGE_KEY = "ace_openroad_stage_inputs_v1";

export function loadStageInputs(): StageInputValues {
  if (typeof window === "undefined") return emptyStageInputValues();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStageInputValues();
    const parsed = JSON.parse(raw) as StageInputValues;
    const base = emptyStageInputValues();
    for (const s of STAGE_CONFIG_SCHEMAS) {
      base[s.id] = { ...base[s.id], ...(parsed[s.id] || {}) };
    }
    return base;
  } catch {
    return emptyStageInputValues();
  }
}

export function saveStageInputs(values: StageInputValues): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    /* */
  }
}
