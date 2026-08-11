/**
 * Ace-Seek VLSI MMMC (Multi-Mode Multi-Corner) Engine
 *
 * Cadence Innovus / Genus MMMC + Synopsys scenario bundles.
 * Generator/parser aligned with real Innovus mmmc.tcl style:
 *   create_constraint_mode / create_library_set / create_rc_corner /
 *   create_opcond / create_delay_corner / create_analysis_view /
 *   set_analysis_view -setup/-hold/-leakage/-dynamic
 */

export interface LibrarySet {
  id: string;
  name: string;
  files: string[];
}

export interface RcCorner {
  id: string;
  name: string;
  temperatureC: number;
  qrcTechFile?: string;
  capTableFile?: string;
}

/** Cadence create_opcond */
export interface OperatingCondition {
  id: string;
  name: string;
  process: number;
  voltage: number;
  temperatureC: number;
}

export interface DelayCorner {
  id: string;
  name: string;
  librarySetId: string;
  rcCornerId: string;
  /** Preferred link to OperatingCondition.id */
  opCondId?: string;
  /** Legacy free-text opcond name when no create_opcond object exists */
  opCondName?: string;
}

export interface ConstraintMode {
  id: string;
  name: string;
  sdcFiles: string[];
  /** Full SDC body (from SDC Studio attach or paste) */
  sdcText?: string;
  /** B1.8 — linked SDC project pack id */
  sdcProjectId?: string;
  /** Where SDC content came from */
  sdcSource?: "studio" | "file" | "inline";
  /** Clocks discovered in linked SDC */
  clockNames?: string[];
  clockCount?: number;
  /** When last bound from SDC Studio */
  linkedAt?: number;
}

export interface AnalysisView {
  id: string;
  name: string;
  delayCornerId: string;
  constraintModeId: string;
  isSetup: boolean;
  isHold: boolean;
  /** set_analysis_view -leakage */
  isLeakage: boolean;
  /** set_analysis_view -dynamic */
  isDynamic: boolean;
  active: boolean;
}

export interface MmmcState {
  librarySets: LibrarySet[];
  rcCorners: RcCorner[];
  opConds: OperatingCondition[];
  delayCorners: DelayCorner[];
  constraintModes: ConstraintMode[];
  analysisViews: AnalysisView[];
}

export interface MmmcLintMessage {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyMmmcState(): MmmcState {
  return {
    librarySets: [],
    rcCorners: [],
    opConds: [],
    delayCorners: [],
    constraintModes: [],
    analysisViews: [],
  };
}

export function createLibrarySet(partial?: Partial<LibrarySet>): LibrarySet {
  const id = partial?.id || newId("lib");
  return {
    id,
    name: partial?.name || id,
    files: partial?.files?.length ? [...partial.files] : ["stdcell.lib"],
  };
}

export function createRcCorner(partial?: Partial<RcCorner>): RcCorner {
  const id = partial?.id || newId("rc");
  return {
    id,
    name: partial?.name || id,
    temperatureC: partial?.temperatureC ?? 25,
    qrcTechFile: partial?.qrcTechFile || "qrc.tech",
    capTableFile: partial?.capTableFile,
  };
}

export function createOpCond(
  partial?: Partial<OperatingCondition>
): OperatingCondition {
  const id = partial?.id || newId("op");
  return {
    id,
    name: partial?.name || id,
    process: partial?.process ?? 1,
    voltage: partial?.voltage ?? 0.8,
    temperatureC: partial?.temperatureC ?? 25,
  };
}

export function createDelayCorner(
  state: MmmcState,
  partial?: Partial<DelayCorner>
): DelayCorner {
  const id = partial?.id || newId("dc");
  return {
    id,
    name: partial?.name || id,
    librarySetId: partial?.librarySetId || state.librarySets[0]?.id || "",
    rcCornerId: partial?.rcCornerId || state.rcCorners[0]?.id || "",
    opCondId: partial?.opCondId ?? state.opConds[0]?.id,
    opCondName: partial?.opCondName,
  };
}

export function createConstraintMode(
  partial?: Partial<ConstraintMode>
): ConstraintMode {
  const id = partial?.id || newId("cm");
  return {
    id,
    name: partial?.name || id,
    sdcFiles: partial?.sdcFiles?.length
      ? [...partial.sdcFiles]
      : ["constraints.sdc"],
    sdcText: partial?.sdcText,
    sdcProjectId: partial?.sdcProjectId,
    sdcSource: partial?.sdcSource,
    clockNames: partial?.clockNames ? [...partial.clockNames] : undefined,
    clockCount: partial?.clockCount,
    linkedAt: partial?.linkedAt,
  };
}

export function createAnalysisView(
  state: MmmcState,
  partial?: Partial<AnalysisView>
): AnalysisView {
  const id = partial?.id || newId("view");
  const dcId = partial?.delayCornerId || state.delayCorners[0]?.id || "";
  const cmId = partial?.constraintModeId || state.constraintModes[0]?.id || "";
  const dc = state.delayCorners.find((d) => d.id === dcId);
  const cm = state.constraintModes.find((c) => c.id === cmId);
  return {
    id,
    name:
      partial?.name || `view_${cm?.name || "mode"}_${dc?.name || "corner"}`,
    delayCornerId: dcId,
    constraintModeId: cmId,
    isSetup: partial?.isSetup ?? true,
    isHold: partial?.isHold ?? false,
    isLeakage: partial?.isLeakage ?? false,
    isDynamic: partial?.isDynamic ?? false,
    active: partial?.active ?? true,
  };
}

/** Ensure older partial states / presets get opConds + leakage/dynamic flags */
export function normalizeMmmcState(raw: Partial<MmmcState> | MmmcState): MmmcState {
  const state: MmmcState = {
    librarySets: raw.librarySets ? [...raw.librarySets] : [],
    rcCorners: raw.rcCorners ? [...raw.rcCorners] : [],
    opConds: raw.opConds ? [...raw.opConds] : [],
    delayCorners: raw.delayCorners ? [...raw.delayCorners] : [],
    constraintModes: raw.constraintModes ? [...raw.constraintModes] : [],
    analysisViews: (raw.analysisViews || []).map((v) => ({
      ...v,
      isLeakage: v.isLeakage ?? false,
      isDynamic: v.isDynamic ?? false,
    })),
  };
  return state;
}

/** Minimal starter — structure mirrors Innovus dual-corner func mode */
export function starterMmmcState(): MmmcState {
  const libSs = createLibrarySet({
    id: "lib_ss",
    name: "ssgnp_0p72v_m40c",
    files: ["tcbn_ssgnp0p72vm40c_ccs.lib"],
  });
  const libFf = createLibrarySet({
    id: "lib_ff",
    name: "ffgnp_0p88v_125c",
    files: ["tcbn_ffgnp0p88v125c_ccs.lib"],
  });
  const rcWorst = createRcCorner({
    id: "rc_worst",
    name: "rcworst_m40c",
    temperatureC: -40,
    qrcTechFile: "qrcTechFile",
  });
  const rcBest = createRcCorner({
    id: "rc_best",
    name: "cbest_125c",
    temperatureC: 125,
    qrcTechFile: "qrcTechFile",
  });
  const opSs = createOpCond({
    id: "op_ss",
    name: "ssgnp_op_worst_m40c",
    process: 1,
    voltage: 0.72,
    temperatureC: -40,
  });
  const opFf = createOpCond({
    id: "op_ff",
    name: "ffgnp_op_best_125c",
    process: 1,
    voltage: 0.88,
    temperatureC: 125,
  });
  const state: MmmcState = {
    librarySets: [libFf, libSs],
    rcCorners: [rcBest, rcWorst],
    opConds: [opFf, opSs],
    delayCorners: [],
    constraintModes: [],
    analysisViews: [],
  };
  const dcSetup = createDelayCorner(state, {
    id: "dc_ss_setup",
    name: "ssgnp_setup_corner",
    librarySetId: libSs.id,
    rcCornerId: rcWorst.id,
    opCondId: opSs.id,
  });
  const dcHold = createDelayCorner(state, {
    id: "dc_ff_hold",
    name: "ffgnp_hold_corner",
    librarySetId: libFf.id,
    rcCornerId: rcBest.id,
    opCondId: opFf.id,
  });
  state.delayCorners = [dcHold, dcSetup];
  const cm = createConstraintMode({
    id: "cm_func",
    name: "func",
    sdcFiles: ["top_func.sdc"],
  });
  state.constraintModes = [cm];
  state.analysisViews = [
    createAnalysisView(state, {
      id: "view_func_setup",
      name: "func_setup_view",
      delayCornerId: dcSetup.id,
      constraintModeId: cm.id,
      isSetup: true,
      isHold: false,
      isLeakage: false,
      isDynamic: true,
    }),
    createAnalysisView(state, {
      id: "view_func_hold",
      name: "func_hold_view",
      delayCornerId: dcHold.id,
      constraintModeId: cm.id,
      isSetup: false,
      isHold: true,
      isLeakage: true,
      isDynamic: false,
    }),
  ];
  return state;
}

// ---------------------------------------------------------------------------
// Default State & Presets
// ---------------------------------------------------------------------------

export const DEFAULT_MMMC_STATE: MmmcState = {
  librarySets: [
    {
      id: "lib_ss",
      name: "lib_ss_0p72v_m40c",
      files: ["tcbn16_ss0p72v_m40c.lib"],
    },
    {
      id: "lib_ff",
      name: "lib_ff_0p88v_125c",
      files: ["tcbn16_ff0p88v_125c.lib"],
    },
  ],
  rcCorners: [
    {
      id: "rc_worst",
      name: "rc_worst_m40c",
      temperatureC: -40,
      qrcTechFile: "qrc_worst.tech",
    },
    {
      id: "rc_best",
      name: "rc_best_125c",
      temperatureC: 125,
      qrcTechFile: "qrc_best.tech",
    },
  ],
  opConds: [
    {
      id: "op_ss",
      name: "ss0p72vm40c",
      process: 1,
      voltage: 0.72,
      temperatureC: -40,
    },
    {
      id: "op_ff",
      name: "ff0p88v125c",
      process: 1,
      voltage: 0.88,
      temperatureC: 125,
    },
  ],
  delayCorners: [
    {
      id: "dc_ss_worst",
      name: "dc_ss_worst",
      librarySetId: "lib_ss",
      rcCornerId: "rc_worst",
      opCondId: "op_ss",
    },
    {
      id: "dc_ff_best",
      name: "dc_ff_best",
      librarySetId: "lib_ff",
      rcCornerId: "rc_best",
      opCondId: "op_ff",
    },
  ],
  constraintModes: [
    { id: "cm_func", name: "func_mode", sdcFiles: ["constraints_func.sdc"] },
    { id: "cm_test", name: "test_mode", sdcFiles: ["constraints_test.sdc"] },
  ],
  analysisViews: [
    {
      id: "view_func_setup",
      name: "view_func_setup",
      delayCornerId: "dc_ss_worst",
      constraintModeId: "cm_func",
      isSetup: true,
      isHold: false,
      isLeakage: false,
      isDynamic: true,
      active: true,
    },
    {
      id: "view_func_hold",
      name: "view_func_hold",
      delayCornerId: "dc_ff_best",
      constraintModeId: "cm_func",
      isSetup: false,
      isHold: true,
      isLeakage: true,
      isDynamic: false,
      active: true,
    },
    {
      id: "view_test_setup",
      name: "view_test_setup",
      delayCornerId: "dc_ss_worst",
      constraintModeId: "cm_test",
      isSetup: true,
      isHold: false,
      isLeakage: false,
      isDynamic: false,
      active: true,
    },
    {
      id: "view_test_hold",
      name: "view_test_hold",
      delayCornerId: "dc_ff_best",
      constraintModeId: "cm_test",
      isSetup: false,
      isHold: true,
      isLeakage: false,
      isDynamic: false,
      active: true,
    },
  ],
};

/** TSMC 16nm-style dual-corner func MMMC (structure from real Innovus reference) */
export function innovusReferenceStyleState(): MmmcState {
  const libFf = createLibrarySet({
    id: "lib_ffgnp",
    name: "ffgnp_0p88v_125c",
    files: [
      "/mnt/data/libs/tcbn16ffcllbwp16p90cpdulvtffgnp0p88v125c_ccs.lib",
      "/mnt/data/libs/tcbn16ffcllbwp16p90cpdlvtffgnp0p88v125c_ccs.lib",
      "/mnt/data/libs/tcbn16ffcllbwp16p90ffgnp0p88v125c_ccs.lib",
      "/mnt/data/libs/sram_ffgnp0p88v0p88v125c.lib",
    ],
  });
  const libSs = createLibrarySet({
    id: "lib_ssgnp",
    name: "ssgnp_0p72v_m40c",
    files: [
      "/mnt/data/libs/tcbn16ffcllbwp16p90cpdulvtssgnp0p72vm40c_ccs.lib",
      "/mnt/data/libs/tcbn16ffcllbwp16p90cpdlvtssgnp0p72vm40c_ccs.lib",
      "/mnt/data/libs/tcbn16ffcllbwp16p90ssgnp0p72vm40c_ccs.lib",
      "/mnt/data/libs/sram_ssgnp0p72v0p72vm40c.lib",
    ],
  });
  const rcBest = createRcCorner({
    id: "rc_cbest",
    name: "cbest_125c",
    temperatureC: 125,
    qrcTechFile:
      "/mnt/data/RC_RCExtraction/cbest/Tech/cbest/qrcTechFile",
  });
  const rcWorst = createRcCorner({
    id: "rc_rcworst",
    name: "rcworst_m40c",
    temperatureC: -40,
    qrcTechFile:
      "/mnt/data/RC_RCExtraction/rcworst/Tech/rcworst/qrcTechFile",
  });
  const opFf = createOpCond({
    id: "op_ff",
    name: "ffgnp_op_best_125c",
    process: 1,
    voltage: 0.88,
    temperatureC: 125,
  });
  const opSs = createOpCond({
    id: "op_ss",
    name: "ssgnp_op_worst_m40c",
    process: 1,
    voltage: 0.72,
    temperatureC: -40,
  });
  const state: MmmcState = {
    librarySets: [libFf, libSs],
    rcCorners: [rcBest, rcWorst],
    opConds: [opFf, opSs],
    delayCorners: [],
    constraintModes: [],
    analysisViews: [],
  };
  const dcHold = createDelayCorner(state, {
    id: "dc_hold",
    name: "ffgnp_hold_corner",
    librarySetId: libFf.id,
    rcCornerId: rcBest.id,
    opCondId: opFf.id,
  });
  const dcSetup = createDelayCorner(state, {
    id: "dc_setup",
    name: "ssgnp_setup_corner",
    librarySetId: libSs.id,
    rcCornerId: rcWorst.id,
    opCondId: opSs.id,
  });
  state.delayCorners = [dcHold, dcSetup];
  const cm = createConstraintMode({
    id: "cm_func",
    name: "func",
    sdcFiles: ["top_func.sdc"],
  });
  state.constraintModes = [cm];
  state.analysisViews = [
    createAnalysisView(state, {
      id: "v_setup",
      name: "func_setup_view",
      delayCornerId: dcSetup.id,
      constraintModeId: cm.id,
      isSetup: true,
      isHold: false,
      isLeakage: false,
      isDynamic: true,
    }),
    createAnalysisView(state, {
      id: "v_hold",
      name: "func_hold_view",
      delayCornerId: dcHold.id,
      constraintModeId: cm.id,
      isSetup: false,
      isHold: true,
      isLeakage: true,
      isDynamic: false,
    }),
  ];
  return state;
}

export const MMMC_PRESETS: {
  name: string;
  description: string;
  state: MmmcState;
}[] = [
  {
    name: "Innovus dual-corner func (TSMC-style)",
    description:
      "Reference-style SSGNP setup @ rcworst/-40C + FFGNP hold @ cbest/125C with create_opcond and leakage/dynamic views.",
    state: innovusReferenceStyleState(),
  },
  {
    name: "Typical SoC MMMC (Dual-Mode)",
    description:
      "Functional & test modes across SSG (-40C) and FFG (125C) with opconds.",
    state: DEFAULT_MMMC_STATE,
  },
  {
    name: "Automotive AEC-Q100 MMMC (Wide Temp)",
    description:
      "High reliability setup & hold views spanning -40C to 150C high-junction temps.",
    state: normalizeMmmcState({
      librarySets: [
        {
          id: "lib_cold",
          name: "lib_ss_0p72v_m40c",
          files: ["auto_ss0p72v_m40c.lib"],
        },
        {
          id: "lib_hot",
          name: "lib_ss_0p72v_150c",
          files: ["auto_ss0p72v_150c.lib"],
        },
        {
          id: "lib_fast",
          name: "lib_ff_0p88v_m40c",
          files: ["auto_ff0p88v_m40c.lib"],
        },
      ],
      rcCorners: [
        {
          id: "rc_cworst",
          name: "rc_cworst",
          temperatureC: -40,
          qrcTechFile: "qrc_cworst.tech",
        },
        {
          id: "rc_rcworst",
          name: "rc_rcworst",
          temperatureC: 150,
          qrcTechFile: "qrc_rcworst.tech",
        },
        {
          id: "rc_rcbest",
          name: "rc_rcbest",
          temperatureC: -40,
          qrcTechFile: "qrc_rcbest.tech",
        },
      ],
      opConds: [
        {
          id: "op_cold",
          name: "ss_cold",
          process: 1,
          voltage: 0.72,
          temperatureC: -40,
        },
        {
          id: "op_hot",
          name: "ss_hot",
          process: 1,
          voltage: 0.72,
          temperatureC: 150,
        },
        {
          id: "op_fast",
          name: "ff_cold",
          process: 1,
          voltage: 0.88,
          temperatureC: -40,
        },
      ],
      delayCorners: [
        {
          id: "dc_cold_worst",
          name: "dc_cold_worst",
          librarySetId: "lib_cold",
          rcCornerId: "rc_cworst",
          opCondId: "op_cold",
        },
        {
          id: "dc_hot_worst",
          name: "dc_hot_worst",
          librarySetId: "lib_hot",
          rcCornerId: "rc_rcworst",
          opCondId: "op_hot",
        },
        {
          id: "dc_fast_best",
          name: "dc_fast_best",
          librarySetId: "lib_fast",
          rcCornerId: "rc_rcbest",
          opCondId: "op_fast",
        },
      ],
      constraintModes: [
        {
          id: "cm_norm",
          name: "normal_op_mode",
          sdcFiles: ["auto_func.sdc"],
        },
        {
          id: "cm_safe",
          name: "safety_test_mode",
          sdcFiles: ["auto_safety.sdc"],
        },
      ],
      analysisViews: [
        {
          id: "v_norm_setup_cold",
          name: "view_norm_setup_cold",
          delayCornerId: "dc_cold_worst",
          constraintModeId: "cm_norm",
          isSetup: true,
          isHold: false,
          isLeakage: false,
          isDynamic: true,
          active: true,
        },
        {
          id: "v_norm_setup_hot",
          name: "view_norm_setup_hot",
          delayCornerId: "dc_hot_worst",
          constraintModeId: "cm_norm",
          isSetup: true,
          isHold: false,
          isLeakage: false,
          isDynamic: false,
          active: true,
        },
        {
          id: "v_norm_hold_fast",
          name: "view_norm_hold_fast",
          delayCornerId: "dc_fast_best",
          constraintModeId: "cm_norm",
          isSetup: false,
          isHold: true,
          isLeakage: true,
          isDynamic: false,
          active: true,
        },
        {
          id: "v_safe_setup_hot",
          name: "view_safe_setup_hot",
          delayCornerId: "dc_hot_worst",
          constraintModeId: "cm_safe",
          isSetup: true,
          isHold: false,
          isLeakage: false,
          isDynamic: false,
          active: true,
        },
        {
          id: "v_safe_hold_fast",
          name: "view_safe_hold_fast",
          delayCornerId: "dc_fast_best",
          constraintModeId: "cm_safe",
          isSetup: false,
          isHold: true,
          isLeakage: false,
          isDynamic: false,
          active: true,
        },
      ],
    }),
  },
];

// ---------------------------------------------------------------------------
// TCL helpers
// ---------------------------------------------------------------------------

function resolveOpCondName(state: MmmcState, dc: DelayCorner): string | undefined {
  if (dc.opCondId) {
    const op = state.opConds.find((o) => o.id === dc.opCondId);
    if (op) return op.name;
  }
  return dc.opCondName;
}

/** Join backslash-continued TCL into one logical command per statement */
export function flattenTclCommands(tclText: string): string[] {
  const rawLines = tclText.split(/\r?\n/);
  const commands: string[] = [];
  let acc = "";

  for (const raw of rawLines) {
    // Strip full-line comments; keep inline only if not starting line
    let line = raw;
    const trimmedStart = line.trimStart();
    if (!acc && (trimmedStart.startsWith("#") || trimmedStart === "")) {
      continue;
    }
    // Drop trailing comment outside of simple cases
    if (!acc && trimmedStart.startsWith("puts ")) {
      // keep as command for completeness (ignored by object parser)
    }

    // Remove trailing # comment when not inside quotes (simple heuristic)
    let inQuote = false;
    let cut = line.length;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' || ch === "'") inQuote = !inQuote;
      if (ch === "#" && !inQuote) {
        cut = i;
        break;
      }
    }
    line = line.slice(0, cut).trimEnd();
    if (!line.trim() && !acc) continue;

    if (acc) {
      acc += " " + line.trim();
    } else {
      acc = line.trim();
    }

    if (acc.endsWith("\\")) {
      acc = acc.slice(0, -1).trimEnd();
      continue;
    }

    if (acc) commands.push(acc);
    acc = "";
  }
  if (acc.trim()) commands.push(acc.trim());
  return commands;
}

function extractListTokens(afterFlag: string): string[] {
  // afterFlag starts right after "-timing" / "-sdc_files" / "-setup" etc.
  const s = afterFlag.trim();
  // [list ...]
  const listMatch = s.match(/^\[list\s+([\s\S]*?)\]/);
  if (listMatch) {
    return tokenizeTclWords(listMatch[1]);
  }
  // { a b c }
  const braceMatch = s.match(/^\{([^}]*)\}/);
  if (braceMatch) {
    return tokenizeTclWords(braceMatch[1]);
  }
  // bare word
  const bare = s.match(/^([^\s\\]+)/);
  return bare ? [bare[1]] : [];
}

function tokenizeTclWords(body: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const t = m[1] ?? m[2] ?? m[3];
    if (t && t !== "\\" && t !== "]") tokens.push(t.replace(/\\$/, ""));
  }
  return tokens.filter(Boolean);
}

function flagValue(cmd: string, flag: string): string | undefined {
  const re = new RegExp(`-${flag}\\s+(\\S+)`);
  const m = cmd.match(re);
  return m ? m[1].replace(/^[{"]|[}"]$/g, "") : undefined;
}

function flagList(cmd: string, flag: string): string[] {
  const idx = cmd.indexOf(`-${flag}`);
  if (idx < 0) return [];
  const after = cmd.slice(idx + flag.length + 1);
  return extractListTokens(after);
}

function formatMultiLineList(indent: string, items: string[]): string {
  if (items.length === 0) return "[list]";
  if (items.length === 1) return `[list ${items[0]}]`;
  const body = items.map((f) => `${indent}    ${f}`).join(" \\\n");
  return `[list \\\n${body} \\\n${indent}]`;
}

// ---------------------------------------------------------------------------
// Generator — Innovus-style section order & syntax
// ---------------------------------------------------------------------------

export function generateMmmcTcl(
  state: MmmcState,
  vendor: "cadence" | "synopsys" = "cadence"
): string {
  const s = normalizeMmmcState(state);
  const lines: string[] = [];

  if (vendor === "synopsys") {
    lines.push("# ==================================================================");
    lines.push("# Synopsys PrimeTime Multi-Scenario Setup Script");
    lines.push("# Generated by Ace-Seek VLSI Portal");
    lines.push("# ==================================================================\n");

    s.analysisViews.forEach((v) => {
      if (!v.active) return;
      const dc = s.delayCorners.find((d) => d.id === v.delayCornerId);
      const cm = s.constraintModes.find((c) => c.id === v.constraintModeId);
      const lib = s.librarySets.find((l) => l.id === dc?.librarySetId);
      lines.push(`create_scenario ${v.name}`);
      lines.push(`current_scenario ${v.name}`);
      if (lib?.files.length) {
        lines.push(`set_target_library_files [list ${lib.files.join(" ")}]`);
      }
      if (cm?.sdcFiles.length) {
        lines.push(`read_sdc ${cm.sdcFiles.join(" ")}`);
      }
      if (v.isSetup && !v.isHold)
        lines.push(`set_scenario_options -setup true -hold false`);
      else if (!v.isSetup && v.isHold)
        lines.push(`set_scenario_options -setup false -hold true`);
      else lines.push(`set_scenario_options -setup true -hold true`);
      lines.push("");
    });

    lines.push("current_scenario [lindex [all_scenarios] 0]");
    return lines.join("\n");
  }

  // ---- Cadence Innovus / Genus (reference layout) ----
  lines.push("################################################################################");
  lines.push("# Cadence Innovus / Genus MMMC Configuration");
  lines.push("# Generated by Ace-Seek VLSI Portal");
  lines.push("################################################################################");
  lines.push("");

  // 1. Constraint modes (first, as in farm scripts)
  lines.push("################################################################################");
  lines.push("# Constraints (Modes)");
  lines.push("################################################################################");
  s.constraintModes.forEach((cm) => {
    if (cm.clockCount || cm.clockNames?.length) {
      const clocks =
        cm.clockNames?.length
          ? cm.clockNames.join(", ")
          : `${cm.clockCount} clocks`;
      lines.push(`# Mode ${cm.name}: SDC clocks → ${clocks}`);
      if (cm.sdcSource === "studio") {
        lines.push(`# Linked from Ace-Seek SDC Studio (${cm.sdcProjectId || "project"})`);
      }
    }
    const list =
      cm.sdcFiles.length <= 1
        ? `[list ${cm.sdcFiles[0] || "constraints.sdc"}]`
        : formatMultiLineList("", cm.sdcFiles);
    lines.push(`create_constraint_mode -name ${cm.name} \\`);
    lines.push(`    -sdc_files ${list}`);
    lines.push("");
  });
  if (!s.constraintModes.length) lines.push("");

  // 2. Library sets
  lines.push("################################################################################");
  lines.push("# Library sets");
  lines.push("################################################################################");
  lines.push("");
  s.librarySets.forEach((ls) => {
    lines.push(`# ${ls.name}`);
    if (ls.files.length <= 1) {
      lines.push(
        `create_library_set -name ${ls.name} \\`
      );
      lines.push(`    -timing [list ${ls.files[0] || "stdcell.lib"}]`);
    } else {
      lines.push(`create_library_set -name ${ls.name} \\`);
      lines.push(`    -timing [list \\`);
      ls.files.forEach((f, i) => {
        const cont = i < ls.files.length - 1 ? " \\" : " \\";
        lines.push(`        ${f}${cont}`);
      });
      lines.push(`    ]`);
    }
    lines.push("");
  });

  // 3. RC corners
  lines.push("################################################################################");
  lines.push("# RC Corners");
  lines.push("################################################################################");
  s.rcCorners.forEach((rc) => {
    const parts: string[] = [
      `create_rc_corner -name ${rc.name}`,
      `    -temperature ${rc.temperatureC}`,
    ];
    if (rc.qrcTechFile) parts.push(`    -qrc_tech ${rc.qrcTechFile}`);
    if (rc.capTableFile) parts.push(`    -cap_table ${rc.capTableFile}`);
    parts.forEach((p, i) => {
      lines.push(i < parts.length - 1 ? `${p} \\` : p);
    });
    lines.push("");
  });

  // 4. Operating conditions
  if (s.opConds.length) {
    lines.push("################################################################################");
    lines.push("# Operating Conditions");
    lines.push("################################################################################");
    s.opConds.forEach((op) => {
      lines.push(`create_opcond -name ${op.name} \\`);
      lines.push(`    -process ${op.process} \\`);
      lines.push(`    -voltage ${op.voltage} \\`);
      lines.push(`    -temperature ${op.temperatureC}`);
      lines.push("");
    });
  }

  // 5. Delay corners
  lines.push("################################################################################");
  lines.push("# Delay Corners");
  lines.push("################################################################################");
  s.delayCorners.forEach((dc) => {
    const ls = s.librarySets.find((l) => l.id === dc.librarySetId);
    const rc = s.rcCorners.find((r) => r.id === dc.rcCornerId);
    if (!ls || !rc) return;
    const opName = resolveOpCondName(s, dc);
    lines.push(`create_delay_corner -name ${dc.name} \\`);
    lines.push(`    -library_set ${ls.name} \\`);
    if (opName) {
      lines.push(`    -opcond ${opName} \\`);
    }
    lines.push(`    -rc_corner ${rc.name}`);
    lines.push("");
  });

  // 6. Analysis views
  lines.push("################################################################################");
  lines.push("# Analysis Views");
  lines.push("################################################################################");
  s.analysisViews.forEach((v) => {
    const dc = s.delayCorners.find((d) => d.id === v.delayCornerId);
    const cm = s.constraintModes.find((c) => c.id === v.constraintModeId);
    if (!dc || !cm) return;
    // Innovus order: -constraint_mode then -delay_corner
    lines.push(`create_analysis_view -name ${v.name} \\`);
    lines.push(`    -constraint_mode ${cm.name} \\`);
    lines.push(`    -delay_corner ${dc.name}`);
    lines.push("");
  });

  // 7. set_analysis_view
  lines.push("################################################################################");
  lines.push("# Set Analysis Views (Global Execution)");
  lines.push("################################################################################");
  const setup = s.analysisViews
    .filter((v) => v.active && v.isSetup)
    .map((v) => v.name);
  const hold = s.analysisViews
    .filter((v) => v.active && v.isHold)
    .map((v) => v.name);
  let leakage = s.analysisViews
    .filter((v) => v.active && v.isLeakage)
    .map((v) => v.name);
  let dynamic = s.analysisViews
    .filter((v) => v.active && v.isDynamic)
    .map((v) => v.name);
  // If user never set leakage/dynamic, default like Innovus farm: leakage=hold, dynamic=setup
  if (!leakage.length && !dynamic.length) {
    leakage = [...hold];
    dynamic = [...setup];
  }

  lines.push("set_analysis_view \\");
  const setParts: string[] = [];
  if (setup.length) setParts.push(`    -setup {${setup.join(" ")}}`);
  if (hold.length) setParts.push(`    -hold {${hold.join(" ")}}`);
  if (leakage.length) setParts.push(`    -leakage {${leakage.join(" ")}}`);
  if (dynamic.length) setParts.push(`    -dynamic {${dynamic.join(" ")}}`);
  setParts.forEach((p, i) => {
    const isLast = i === setParts.length - 1;
    lines.push(isLast ? p : `${p} \\`);
  });
  if (!setParts.length) {
    lines.push("    -setup {}");
  }
  lines.push("");
  lines.push('puts "INFO: MMMC analysis views have been successfully initialized."');
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Parser (multi-line, braces, create_opcond)
// ---------------------------------------------------------------------------

export function parseMmmcTcl(tclText: string): MmmcState {
  const librarySets: LibrarySet[] = [];
  const rcCorners: RcCorner[] = [];
  const opConds: OperatingCondition[] = [];
  const delayCorners: DelayCorner[] = [];
  const constraintModes: ConstraintMode[] = [];
  const analysisViews: AnalysisView[] = [];

  const commands = flattenTclCommands(tclText);
  let cmdIdx = 0;

  for (const cmd of commands) {
    const trimmed = cmd.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    cmdIdx++;

    if (trimmed.startsWith("create_library_set")) {
      const name = flagValue(trimmed, "name");
      const files = flagList(trimmed, "timing");
      if (name) {
        librarySets.push({
          id: `lib_${cmdIdx}`,
          name,
          files: files.length ? files : ["lib.lib"],
        });
      }
      continue;
    }

    if (trimmed.startsWith("create_rc_corner")) {
      const name = flagValue(trimmed, "name");
      const temp = flagValue(trimmed, "temperature");
      const qrc = flagValue(trimmed, "qrc_tech");
      const cap = flagValue(trimmed, "cap_table");
      if (name) {
        rcCorners.push({
          id: `rc_${cmdIdx}`,
          name,
          temperatureC: temp ? parseFloat(temp) : 25,
          qrcTechFile: qrc,
          capTableFile: cap,
        });
      }
      continue;
    }

    if (trimmed.startsWith("create_opcond")) {
      const name = flagValue(trimmed, "name");
      const process = flagValue(trimmed, "process");
      const voltage = flagValue(trimmed, "voltage");
      const temperature = flagValue(trimmed, "temperature");
      if (name) {
        opConds.push({
          id: `op_${cmdIdx}`,
          name,
          process: process ? parseFloat(process) : 1,
          voltage: voltage ? parseFloat(voltage) : 0.8,
          temperatureC: temperature ? parseFloat(temperature) : 25,
        });
      }
      continue;
    }

    if (trimmed.startsWith("create_delay_corner")) {
      const name = flagValue(trimmed, "name");
      const libName = flagValue(trimmed, "library_set");
      const rcName = flagValue(trimmed, "rc_corner");
      const opName = flagValue(trimmed, "opcond");
      if (name && libName && rcName) {
        const libObj = librarySets.find((l) => l.name === libName);
        const rcObj = rcCorners.find((r) => r.name === rcName);
        const opObj = opName
          ? opConds.find((o) => o.name === opName)
          : undefined;
        delayCorners.push({
          id: `dc_${cmdIdx}`,
          name,
          librarySetId: libObj ? libObj.id : libName,
          rcCornerId: rcObj ? rcObj.id : rcName,
          opCondId: opObj?.id,
          opCondName: opName,
        });
      }
      continue;
    }

    if (trimmed.startsWith("create_constraint_mode")) {
      const name = flagValue(trimmed, "name");
      const sdcFiles = flagList(trimmed, "sdc_files");
      if (name) {
        constraintModes.push({
          id: `cm_${cmdIdx}`,
          name,
          sdcFiles: sdcFiles.length ? sdcFiles : ["mode.sdc"],
        });
      }
      continue;
    }

    if (trimmed.startsWith("create_analysis_view")) {
      const name = flagValue(trimmed, "name");
      const dcName = flagValue(trimmed, "delay_corner");
      const cmName = flagValue(trimmed, "constraint_mode");
      if (name && dcName && cmName) {
        const dcObj = delayCorners.find((d) => d.name === dcName);
        const cmObj = constraintModes.find((c) => c.name === cmName);
        analysisViews.push({
          id: `view_${cmdIdx}`,
          name,
          delayCornerId: dcObj ? dcObj.id : dcName,
          constraintModeId: cmObj ? cmObj.id : cmName,
          isSetup: true,
          isHold: false,
          isLeakage: false,
          isDynamic: false,
          active: true,
        });
      }
      continue;
    }

    if (trimmed.startsWith("set_analysis_view")) {
      const setupViews = flagList(trimmed, "setup");
      const holdViews = flagList(trimmed, "hold");
      const leakageViews = flagList(trimmed, "leakage");
      const dynamicViews = flagList(trimmed, "dynamic");

      analysisViews.forEach((v) => {
        const isSetup = setupViews.includes(v.name);
        const isHold = holdViews.includes(v.name);
        const isLeakage = leakageViews.includes(v.name);
        const isDynamic = dynamicViews.includes(v.name);
        // If set_analysis_view present, drive flags from it
        if (
          setupViews.length ||
          holdViews.length ||
          leakageViews.length ||
          dynamicViews.length
        ) {
          v.isSetup = isSetup;
          v.isHold = isHold;
          v.isLeakage = isLeakage;
          v.isDynamic = isDynamic;
          v.active = isSetup || isHold || isLeakage || isDynamic;
        }
      });
    }
  }

  if (!librarySets.length && !rcCorners.length && !constraintModes.length) {
    return structuredClone(DEFAULT_MMMC_STATE);
  }

  return {
    librarySets,
    rcCorners,
    opConds,
    delayCorners,
    constraintModes,
    analysisViews,
  };
}

// ---------------------------------------------------------------------------
// Lint
// ---------------------------------------------------------------------------

export function lintMmmcState(state: MmmcState): MmmcLintMessage[] {
  const s = normalizeMmmcState(state);
  const msgs: MmmcLintMessage[] = [];

  const activeViews = s.analysisViews.filter((v) => v.active);
  if (activeViews.length === 0) {
    msgs.push({
      id: "no_active_views",
      severity: "error",
      message: "No active analysis views defined in set_analysis_view",
      recommendation:
        "Activate at least one setup and hold view to ensure layout and timing closure.",
    });
  } else if (activeViews.length > 16) {
    msgs.push({
      id: "view_explosion_risk",
      severity: "warning",
      message: `View explosion risk: ${activeViews.length} active views configured`,
      recommendation:
        "More than 16 active views dramatically increase Innovus runtime and memory usage. Group corners into dominant scenarios.",
    });
  }

  s.constraintModes.forEach((cm) => {
    const modeViews = s.analysisViews.filter(
      (v) => v.active && v.constraintModeId === cm.id
    );
    const hasSetup = modeViews.some((v) => v.isSetup);
    const hasHold = modeViews.some((v) => v.isHold);

    if (hasSetup && !hasHold) {
      msgs.push({
        id: `missing_hold_${cm.id}`,
        severity: "warning",
        message: `Constraint mode '${cm.name}' has active setup view but lacks an active hold view`,
        recommendation: `Add a fast-corner hold view for ${cm.name} (e.g. FFGNP + cbest) to catch hold violations.`,
      });
    }
  });

  s.librarySets.forEach((ls) => {
    const isUsed = s.delayCorners.some((dc) => dc.librarySetId === ls.id);
    if (!isUsed) {
      msgs.push({
        id: `unused_lib_${ls.id}`,
        severity: "info",
        message: `LibrarySet '${ls.name}' is defined but not linked to any DelayCorner`,
        recommendation: `Associate '${ls.name}' with a DelayCorner or remove it.`,
      });
    }
  });

  s.constraintModes.forEach((cm) => {
    if (
      !cm.sdcFiles.length ||
      (cm.sdcFiles.length === 1 && !cm.sdcFiles[0].trim())
    ) {
      msgs.push({
        id: `empty_sdc_${cm.id}`,
        severity: "error",
        message: `ConstraintMode '${cm.name}' has no SDC constraint files attached`,
        recommendation: `Attach at least one valid .sdc file to mode '${cm.name}'.`,
      });
    }
  });

  // Opcond linked from delay corner but missing
  s.delayCorners.forEach((dc) => {
    if (dc.opCondId && !s.opConds.some((o) => o.id === dc.opCondId)) {
      msgs.push({
        id: `missing_opcond_${dc.id}`,
        severity: "error",
        message: `Delay corner '${dc.name}' references missing operating condition`,
        recommendation: `Create create_opcond for the PVT used by '${dc.name}'.`,
      });
    }
  });

  // Broken lib/rc refs
  s.delayCorners.forEach((dc) => {
    if (!s.librarySets.some((l) => l.id === dc.librarySetId)) {
      msgs.push({
        id: `broken_lib_${dc.id}`,
        severity: "error",
        message: `Delay corner '${dc.name}' has invalid library_set link`,
        recommendation: "Re-select a library set for this delay corner.",
      });
    }
    if (!s.rcCorners.some((r) => r.id === dc.rcCornerId)) {
      msgs.push({
        id: `broken_rc_${dc.id}`,
        severity: "error",
        message: `Delay corner '${dc.name}' has invalid rc_corner link`,
        recommendation: "Re-select an RC corner for this delay corner.",
      });
    }
  });

  if (!s.opConds.length && s.delayCorners.some((d) => d.opCondName || d.opCondId)) {
    msgs.push({
      id: "opcond_name_only",
      severity: "info",
      message:
        "Delay corners reference opcond names but no create_opcond objects are defined",
      recommendation:
        "Add Operating Conditions (process/voltage/temp) so Innovus scripts emit create_opcond blocks.",
    });
  }

  return msgs;
}
