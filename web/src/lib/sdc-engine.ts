/**
 * SDC Engine v2 — constraint studio core
 *
 * - Multi-vendor SDC/XDC generation
 * - Full command parse (clocks, gen clocks, groups, I/O, MCP, false path, latency, uncertainty)
 * - Tool/flow-aware lint (PrimeTime, Genus, Innovus, Tempus, Vivado, Quartus)
 * - Timing budget solver (reg2reg / in2reg / reg2out) aligned with STA equations
 * - Clock-tree schematic model
 * - Accurate waveform geometry (duty, latency, MCP edges)
 * - Import from Timing Studio path → SDC suggestions
 * - Connectivity via shared graph-engine (CDC map / clock tree)
 */

import {
  buildGraphFromSdc,
  domainMapView,
  graphStats,
  type DesignGraph,
  type GraphStats,
} from "@/lib/graph-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VendorFormat = "synopsys" | "cadence" | "xilinx" | "quartus";
export type SdcToolTarget =
  | "generic"
  | "primetime"
  | "genus"
  | "innovus"
  | "tempus"
  | "vivado"
  | "quartus";

export interface PrimaryClock {
  id: string;
  name: string;
  periodNs: number;
  waveformRising: number;
  waveformFalling: number;
  targets: string;
  isVirtual: boolean;
  uncertaintySetup: number;
  uncertaintyHold: number;
  latencySource: number;
  latencyNetwork: number;
}

export interface GeneratedClock {
  id: string;
  name: string;
  masterClockId: string;
  sourcePin: string;
  targets: string;
  divideBy: number;
  multiplyBy: number;
  invert: boolean;
  /** e.g. {1 1 3 3} edge list string inside braces */
  edges?: string;
  combinational?: boolean;
}

export interface ClockGroupRelation {
  id: string;
  group1Clocks: string[];
  group2Clocks: string[];
  relationType: "asynchronous" | "logically_exclusive" | "physically_exclusive";
}

export interface IoConstraint {
  id: string;
  portName: string;
  clockName: string;
  delayType: "input" | "output";
  minNs: number;
  maxNs: number;
  clockFall?: boolean;
  addDelay?: boolean;
  drivingCell?: string;
  drivingPin?: string;
  loadPf?: number;
  setupAsic?: number;
  holdAsic?: number;
}

export interface MulticycleConstraint {
  id: string;
  from: string;
  through: string;
  to: string;
  cycles: number;
  holdCycles?: number;
  type: "setup" | "hold";
  edge: "start" | "end";
}

export interface FalsePathConstraint {
  id: string;
  from: string;
  through: string;
  to: string;
  comment?: string;
}

/** set_max_delay / set_min_delay */
export interface PathDelayConstraint {
  id: string;
  delayType: "max" | "min";
  valueNs: number;
  from: string;
  through: string;
  to: string;
  ignoreClockLatency?: boolean;
  comment?: string;
}

/** set_case_analysis */
export interface CaseAnalysisConstraint {
  id: string;
  value: "0" | "1" | "rising" | "falling";
  portOrPin: string;
}

/** set_disable_timing */
export interface DisableTimingConstraint {
  id: string;
  fromPin: string;
  toPin: string;
  cellOrInstance?: string;
}

/** Global design rule caps (0 = not emitted) */
export interface DesignRuleLimits {
  maxTransitionNs: number;
  maxCapacitancePf: number;
  maxFanout: number;
}

export interface SdcStudioState {
  primaryClocks: PrimaryClock[];
  generatedClocks: GeneratedClock[];
  clockGroups: ClockGroupRelation[];
  ioConstraints: IoConstraint[];
  multicycles: MulticycleConstraint[];
  falsePaths: FalsePathConstraint[];
  pathDelays: PathDelayConstraint[];
  caseAnalyses: CaseAnalysisConstraint[];
  disableTimings: DisableTimingConstraint[];
  designRules: DesignRuleLimits;
}

/** Fill missing fields for older presets / partial imports */
export function normalizeSdcState(
  s: Partial<SdcStudioState> | SdcStudioState
): SdcStudioState {
  return {
    primaryClocks: s.primaryClocks || [],
    generatedClocks: (s.generatedClocks || []).map((g) => ({
      ...g,
      edges: g.edges,
      combinational: g.combinational || false,
    })),
    clockGroups: s.clockGroups || [],
    ioConstraints: s.ioConstraints || [],
    multicycles: s.multicycles || [],
    falsePaths: s.falsePaths || [],
    pathDelays: s.pathDelays || [],
    caseAnalyses: s.caseAnalyses || [],
    disableTimings: s.disableTimings || [],
    designRules: s.designRules || {
      maxTransitionNs: 0,
      maxCapacitancePf: 0,
      maxFanout: 0,
    },
  };
}

export interface LintMessage {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  message: string;
  category: "clock" | "cdc" | "io" | "exception" | "tool" | "budget";
  toolHint?: SdcToolTarget;
}

// ---------------------------------------------------------------------------
// Defaults & presets
// ---------------------------------------------------------------------------

const EMPTY_RULES: DesignRuleLimits = {
  maxTransitionNs: 0,
  maxCapacitancePf: 0,
  maxFanout: 0,
};

export const DEFAULT_SDC_STATE: SdcStudioState = {
  pathDelays: [],
  caseAnalyses: [],
  disableTimings: [],
  designRules: { ...EMPTY_RULES },
  primaryClocks: [
    {
      id: "clk_sys",
      name: "clk_sys",
      periodNs: 10.0,
      waveformRising: 0,
      waveformFalling: 5.0,
      targets: "[get_ports clk_sys_in]",
      isVirtual: false,
      uncertaintySetup: 0.15,
      uncertaintyHold: 0.08,
      latencySource: 0.2,
      latencyNetwork: 0.5,
    },
    {
      id: "clk_pci",
      name: "clk_pci",
      periodNs: 8.0,
      waveformRising: 0,
      waveformFalling: 4.0,
      targets: "[get_ports pcie_clk_p]",
      isVirtual: false,
      uncertaintySetup: 0.12,
      uncertaintyHold: 0.06,
      latencySource: 0.1,
      latencyNetwork: 0.3,
    },
    {
      id: "vclk_ext",
      name: "vclk_ext",
      periodNs: 10.0,
      waveformRising: 0,
      waveformFalling: 5.0,
      targets: "",
      isVirtual: true,
      uncertaintySetup: 0.2,
      uncertaintyHold: 0.1,
      latencySource: 0,
      latencyNetwork: 0,
    },
  ],
  generatedClocks: [
    {
      id: "clk_div2",
      name: "clk_div2",
      masterClockId: "clk_sys",
      sourcePin: "[get_pins u_sys_clk_gen/u_pll/clk_out]",
      targets: "[get_pins u_div2/Q]",
      divideBy: 2,
      multiplyBy: 1,
      invert: false,
    },
  ],
  clockGroups: [
    {
      id: "cg_sys_pci",
      group1Clocks: ["clk_sys", "clk_div2"],
      group2Clocks: ["clk_pci"],
      relationType: "asynchronous",
    },
  ],
  ioConstraints: [
    {
      id: "io_rx_data",
      portName: "[get_ports {rx_data[*]}]",
      clockName: "vclk_ext",
      delayType: "input",
      minNs: 1.2,
      maxNs: 3.5,
      clockFall: false,
      addDelay: false,
      drivingCell: "BUF_X4",
      drivingPin: "Y",
      setupAsic: 0.08,
      holdAsic: 0.04,
    },
    {
      id: "io_tx_data",
      portName: "[get_ports {tx_data[*]}]",
      clockName: "clk_sys",
      delayType: "output",
      minNs: 0.8,
      maxNs: 2.5,
      clockFall: false,
      addDelay: false,
      loadPf: 12.0,
      setupAsic: 0.1,
      holdAsic: 0.05,
    },
  ],
  multicycles: [
    {
      id: "mcp_alu_mult",
      from: "[get_pins u_alu/mult_reg[*]/C]",
      through: "",
      to: "[get_pins u_alu/acc_reg[*]/D]",
      cycles: 2,
      type: "setup",
      edge: "end",
    },
    {
      id: "mcp_alu_mult_hold",
      from: "[get_pins u_alu/mult_reg[*]/C]",
      through: "",
      to: "[get_pins u_alu/acc_reg[*]/D]",
      cycles: 1,
      type: "hold",
      edge: "end",
    },
  ],
  falsePaths: [
    {
      id: "fp_async_rst",
      from: "[get_ports rst_n]",
      through: "",
      to: "",
      comment: "Asynchronous system reset path assertion",
    },
    {
      id: "fp_cfg_regs",
      from: "[get_pins u_config/cfg_*_reg[*]/Q]",
      through: "",
      to: "",
      comment: "Static configuration registers",
    },
  ],
};

export const SDC_PRESETS: {
  name: string;
  description: string;
  state: SdcStudioState;
}[] = [
  {
    name: "Dual-Clock SoC Core",
    description:
      "System clock with PLL divider, asynchronous PCIe domain, async reset false paths, and multicycle multiplier.",
    state: DEFAULT_SDC_STATE,
  },
  {
    name: "DDR3 Controller Interface",
    description:
      "100MHz system clock with 400MHz generated memory clock, DDR I/O delays, and strict setup/hold constraints.",
    state: {
      primaryClocks: [
        {
          id: "sys_clk_100",
          name: "sys_clk_100",
          periodNs: 10.0,
          waveformRising: 0,
          waveformFalling: 5.0,
          targets: "[get_ports sys_clk_p]",
          isVirtual: false,
          uncertaintySetup: 0.1,
          uncertaintyHold: 0.05,
          latencySource: 0.1,
          latencyNetwork: 0.2,
        },
        {
          id: "ddr_vclk",
          name: "ddr_vclk",
          periodNs: 2.5,
          waveformRising: 0,
          waveformFalling: 1.25,
          targets: "",
          isVirtual: true,
          uncertaintySetup: 0.08,
          uncertaintyHold: 0.04,
          latencySource: 0,
          latencyNetwork: 0,
        },
      ],
      generatedClocks: [
        {
          id: "ddr_phy_clk",
          name: "ddr_phy_clk",
          masterClockId: "sys_clk_100",
          sourcePin: "[get_pins u_pll/ref_clk]",
          targets: "[get_pins u_pll/out_clk_400mhz]",
          divideBy: 1,
          multiplyBy: 4,
          invert: false,
        },
      ],
      clockGroups: [],
      ioConstraints: [
        {
          id: "ddr_dq_in",
          portName: "[get_ports {ddr_dq[*]}]",
          clockName: "ddr_vclk",
          delayType: "input",
          minNs: 0.35,
          maxNs: 0.75,
          clockFall: false,
          addDelay: false,
          setupAsic: 0.05,
          holdAsic: 0.03,
        },
        {
          id: "ddr_dq_out",
          portName: "[get_ports {ddr_dq[*]}]",
          clockName: "ddr_phy_clk",
          delayType: "output",
          minNs: 0.25,
          maxNs: 0.65,
          clockFall: false,
          addDelay: false,
          loadPf: 8.0,
          setupAsic: 0.06,
          holdAsic: 0.03,
        },
      ],
      multicycles: [],
      falsePaths: [
        {
          id: "fp_calib",
          from: "[get_pins u_ddr_phy/calib_done_reg/Q]",
          through: "",
          to: "",
          comment: "Calibration done status signal",
        },
      ],
      pathDelays: [],
      caseAnalyses: [],
      disableTimings: [],
      designRules: { ...EMPTY_RULES },
    },
  },
  {
    name: "RGMII Ethernet PHY",
    description:
      "125MHz RGMII transmit/receive clocking with dual-edge data I/O delay constraints and false-path control logic.",
    state: {
      primaryClocks: [
        {
          id: "rgmii_rxc",
          name: "rgmii_rxc",
          periodNs: 8.0,
          waveformRising: 0,
          waveformFalling: 4.0,
          targets: "[get_ports rgmii_rxc]",
          isVirtual: false,
          uncertaintySetup: 0.15,
          uncertaintyHold: 0.08,
          latencySource: 0.15,
          latencyNetwork: 0.35,
        },
        {
          id: "rgmii_txc",
          name: "rgmii_txc",
          periodNs: 8.0,
          waveformRising: 0,
          waveformFalling: 4.0,
          targets: "[get_ports rgmii_txc]",
          isVirtual: false,
          uncertaintySetup: 0.15,
          uncertaintyHold: 0.08,
          latencySource: 0.1,
          latencyNetwork: 0.25,
        },
      ],
      generatedClocks: [],
      clockGroups: [
        {
          id: "cg_rgmii_async",
          group1Clocks: ["rgmii_rxc"],
          group2Clocks: ["rgmii_txc"],
          relationType: "asynchronous",
        },
      ],
      ioConstraints: [
        {
          id: "rgmii_rxd_rise",
          portName: "[get_ports {rgmii_rxd[*]}]",
          clockName: "rgmii_rxc",
          delayType: "input",
          minNs: 1.0,
          maxNs: 2.8,
          clockFall: false,
          addDelay: false,
          setupAsic: 0.1,
          holdAsic: 0.05,
        },
        {
          id: "rgmii_rxd_fall",
          portName: "[get_ports {rgmii_rxd[*]}]",
          clockName: "rgmii_rxc",
          delayType: "input",
          minNs: 1.0,
          maxNs: 2.8,
          clockFall: true,
          addDelay: true,
          setupAsic: 0.1,
          holdAsic: 0.05,
        },
      ],
      multicycles: [],
      falsePaths: [
        {
          id: "fp_phy_rst",
          from: "[get_ports phy_rst_n]",
          through: "",
          to: "",
          comment: "PHY hard reset signal",
        },
      ],
      pathDelays: [],
      caseAnalyses: [],
      disableTimings: [],
      designRules: { ...EMPTY_RULES },
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function emptySdcState(): SdcStudioState {
  return {
    primaryClocks: [],
    generatedClocks: [],
    clockGroups: [],
    ioConstraints: [],
    multicycles: [],
    falsePaths: [],
    pathDelays: [],
    caseAnalyses: [],
    disableTimings: [],
    designRules: { ...EMPTY_RULES },
  };
}

export function allClockNames(state: SdcStudioState): string[] {
  return [
    ...state.primaryClocks.map((c) => c.name),
    ...state.generatedClocks.map((g) => g.name),
  ];
}

export function resolveClockPeriod(
  state: SdcStudioState,
  clockName: string
): number {
  const p = state.primaryClocks.find((c) => c.name === clockName || c.id === clockName);
  if (p) return p.periodNs;
  const g = state.generatedClocks.find((c) => c.name === clockName || c.id === clockName);
  if (g) {
    const master = state.primaryClocks.find(
      (c) => c.id === g.masterClockId || c.name === g.masterClockId
    );
    const masterP = master?.periodNs ?? 10;
    const ratio = (g.divideBy || 1) / (g.multiplyBy || 1);
    return masterP * ratio;
  }
  return 10;
}

export function resolveClockMeta(
  state: SdcStudioState,
  clockName: string
): {
  name: string;
  periodNs: number;
  waveformRising: number;
  waveformFalling: number;
  uncertaintySetup: number;
  uncertaintyHold: number;
  latencySource: number;
  latencyNetwork: number;
  isVirtual: boolean;
  isGenerated: boolean;
} {
  const p = state.primaryClocks.find((c) => c.name === clockName || c.id === clockName);
  if (p) {
    return {
      name: p.name,
      periodNs: p.periodNs,
      waveformRising: p.waveformRising,
      waveformFalling: p.waveformFalling,
      uncertaintySetup: p.uncertaintySetup,
      uncertaintyHold: p.uncertaintyHold,
      latencySource: p.latencySource,
      latencyNetwork: p.latencyNetwork,
      isVirtual: p.isVirtual,
      isGenerated: false,
    };
  }
  const g = state.generatedClocks.find((c) => c.name === clockName || c.id === clockName);
  if (g) {
    const master = state.primaryClocks.find(
      (c) => c.id === g.masterClockId || c.name === g.masterClockId
    );
    const period = resolveClockPeriod(state, clockName);
    const duty = master
      ? (master.waveformFalling - master.waveformRising) / master.periodNs
      : 0.5;
    return {
      name: g.name,
      periodNs: period,
      waveformRising: g.invert ? period * duty : 0,
      waveformFalling: g.invert ? period : period * duty,
      uncertaintySetup: master?.uncertaintySetup ?? 0.1,
      uncertaintyHold: master?.uncertaintyHold ?? 0.05,
      latencySource: master?.latencySource ?? 0,
      latencyNetwork: master?.latencyNetwork ?? 0,
      isVirtual: false,
      isGenerated: true,
    };
  }
  return {
    name: clockName,
    periodNs: 10,
    waveformRising: 0,
    waveformFalling: 5,
    uncertaintySetup: 0.1,
    uncertaintyHold: 0.05,
    latencySource: 0,
    latencyNetwork: 0,
    isVirtual: false,
    isGenerated: false,
  };
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Code generator
// ---------------------------------------------------------------------------

export function generateSdcCode(
  stateIn: SdcStudioState,
  vendor: VendorFormat = "synopsys"
): string {
  const state = normalizeSdcState(stateIn);
  const lines: string[] = [];
  const dateStr = new Date().toISOString().split("T")[0];
  const comment = vendor === "xilinx" ? "#" : "#";

  lines.push(`${"#".repeat(80)}`);
  lines.push(`${comment} SDC/XDC Constraint File`);
  lines.push(`${comment} Target Vendor Format : ${vendor.toUpperCase()}`);
  lines.push(`${comment} Generated by         : ACE-SEEK SDC Constraint Studio v2`);
  lines.push(`${comment} Date Created         : ${dateStr}`);
  lines.push(`${"#".repeat(80)}\n`);

  lines.push(`${comment} =============================================================================`);
  lines.push(`${comment} 1. PRIMARY & VIRTUAL CLOCK DEFINITIONS`);
  lines.push(`${comment} =============================================================================`);

  if (state.primaryClocks.length === 0) {
    lines.push(`${comment} (No primary clocks defined)\n`);
  } else {
    for (const clk of state.primaryClocks) {
      if (clk.isVirtual) {
        lines.push(`${comment} Virtual Clock: ${clk.name}`);
        lines.push(
          `create_clock -name ${clk.name} -period ${clk.periodNs.toFixed(3)} -waveform {${clk.waveformRising.toFixed(3)} ${clk.waveformFalling.toFixed(3)}}`
        );
      } else {
        lines.push(
          `${comment} Primary Clock: ${clk.name} (${(1000 / clk.periodNs).toFixed(1)} MHz)`
        );
        const rawTarget = clk.targets ? clk.targets.trim() : clk.name;
        const targetStr = rawTarget.startsWith("[")
          ? rawTarget
          : `[get_ports ${rawTarget}]`;
        lines.push(
          `create_clock -name ${clk.name} -period ${clk.periodNs.toFixed(3)} -waveform {${clk.waveformRising.toFixed(3)} ${clk.waveformFalling.toFixed(3)}} ${targetStr}`
        );
      }

      if (clk.uncertaintySetup > 0 || clk.uncertaintyHold > 0) {
        if (vendor === "xilinx") {
          lines.push(`set_clock_uncertainty ${clk.uncertaintySetup.toFixed(3)} [get_clocks ${clk.name}]`);
        } else if (
          Math.abs(clk.uncertaintySetup - clk.uncertaintyHold) < 1e-9
        ) {
          lines.push(
            `set_clock_uncertainty ${clk.uncertaintySetup.toFixed(3)} [get_clocks ${clk.name}]`
          );
        } else {
          lines.push(
            `set_clock_uncertainty -setup ${clk.uncertaintySetup.toFixed(3)} [get_clocks ${clk.name}]`
          );
          lines.push(
            `set_clock_uncertainty -hold ${clk.uncertaintyHold.toFixed(3)} [get_clocks ${clk.name}]`
          );
        }
      }

      if (clk.latencySource > 0) {
        lines.push(
          `set_clock_latency -source ${clk.latencySource.toFixed(3)} [get_clocks ${clk.name}]`
        );
      }
      if (clk.latencyNetwork > 0) {
        lines.push(
          `set_clock_latency ${clk.latencyNetwork.toFixed(3)} [get_clocks ${clk.name}]`
        );
      }
      lines.push("");
    }
  }

  lines.push(`${comment} =============================================================================`);
  lines.push(`${comment} 2. GENERATED CLOCKS`);
  lines.push(`${comment} =============================================================================`);

  if (state.generatedClocks.length === 0) {
    lines.push(`${comment} (No generated clocks defined)\n`);
  } else {
    for (const gclk of state.generatedClocks) {
      const masterClk = state.primaryClocks.find(
        (c) => c.id === gclk.masterClockId || c.name === gclk.masterClockId
      );
      const masterName = masterClk ? masterClk.name : gclk.masterClockId;
      lines.push(`${comment} Generated Clock: ${gclk.name} (from ${masterName})`);

      let cmd = `create_generated_clock -name ${gclk.name}`;
      if (gclk.sourcePin) cmd += ` -source ${gclk.sourcePin}`;
      if (gclk.divideBy > 1) cmd += ` -divide_by ${gclk.divideBy}`;
      if (gclk.multiplyBy > 1) cmd += ` -multiply_by ${gclk.multiplyBy}`;
      if (gclk.invert) cmd += ` -invert`;
      if (gclk.combinational) cmd += ` -combinational`;
      if (gclk.edges?.trim()) cmd += ` -edges {${gclk.edges.trim()}}`;
      if (masterName) cmd += ` -master_clock [get_clocks ${masterName}]`;
      cmd += ` ${gclk.targets || "[get_pins u_gen_clk/Q]"}`;
      lines.push(cmd);
      lines.push("");
    }
  }

  lines.push(`${comment} =============================================================================`);
  lines.push(`${comment} 3. CLOCK GROUPS & CDC RELATIONSHIPS`);
  lines.push(`${comment} =============================================================================`);

  const activeClockNames = new Set(allClockNames(state));
  const activeClockGroups = state.clockGroups.filter((cg) => {
    const g1 = cg.group1Clocks.filter((c) => activeClockNames.has(c));
    const g2 = cg.group2Clocks.filter((c) => activeClockNames.has(c));
    return g1.length > 0 && g2.length > 0;
  });

  if (activeClockGroups.length === 0) {
    lines.push(`${comment} (No clock group interactions configured)\n`);
  } else {
    for (const cg of activeClockGroups) {
      const g1Active = cg.group1Clocks.filter((c) => activeClockNames.has(c));
      const g2Active = cg.group2Clocks.filter((c) => activeClockNames.has(c));
      const g1 = g1Active.map((c) => `[get_clocks ${c}]`).join(" ");
      const g2 = g2Active.map((c) => `[get_clocks ${c}]`).join(" ");
      lines.push(`${comment} Clock Group: ${cg.relationType.toUpperCase()}`);
      if (vendor === "xilinx" || vendor === "quartus") {
        lines.push(
          `set_clock_groups -${cg.relationType} -group {${g1}} -group {${g2}}`
        );
      } else {
        lines.push(
          `set_clock_groups -${cg.relationType} -group [list ${g1}] -group [list ${g2}]`
        );
      }
      lines.push("");
    }
  }

  lines.push(`${comment} =============================================================================`);
  lines.push(`${comment} 4. INPUT & OUTPUT DELAY CONSTRAINTS`);
  lines.push(`${comment} =============================================================================`);

  if (state.ioConstraints.length === 0) {
    lines.push(`${comment} (No I/O constraints defined)\n`);
  } else {
    for (const io of state.ioConstraints) {
      const isInput = io.delayType === "input";
      const cmdBase = isInput ? "set_input_delay" : "set_output_delay";
      const fallFlag = io.clockFall ? " -clock_fall" : "";
      const addFlag = io.addDelay ? " -add_delay" : "";
      lines.push(
        `${comment} ${isInput ? "Input" : "Output"} Delay: ${io.portName} (clk: ${io.clockName})`
      );

      if (Math.abs(io.minNs - io.maxNs) < 1e-12) {
        lines.push(
          `${cmdBase} -clock [get_clocks ${io.clockName}]${fallFlag}${addFlag} ${io.maxNs.toFixed(3)} ${io.portName}`
        );
      } else {
        lines.push(
          `${cmdBase} -clock [get_clocks ${io.clockName}] -max${fallFlag}${addFlag} ${io.maxNs.toFixed(3)} ${io.portName}`
        );
        lines.push(
          `${cmdBase} -clock [get_clocks ${io.clockName}] -min${fallFlag}${addFlag} ${io.minNs.toFixed(3)} ${io.portName}`
        );
      }
      if (io.drivingCell && isInput) {
        const pinStr = io.drivingPin ? ` -pin ${io.drivingPin}` : "";
        lines.push(
          `set_driving_cell -lib_cell ${io.drivingCell}${pinStr} ${io.portName}`
        );
      }
      if (io.loadPf !== undefined && io.loadPf > 0 && !isInput) {
        lines.push(`set_load ${io.loadPf.toFixed(2)} ${io.portName}`);
      }
      lines.push("");
    }
  }

  lines.push(`${comment} =============================================================================`);
  lines.push(`${comment} 5. TIMING EXCEPTIONS (MULTICYCLE & FALSE PATHS)`);
  lines.push(`${comment} =============================================================================`);

  if (state.multicycles.length === 0 && state.falsePaths.length === 0) {
    lines.push(`${comment} (No timing exceptions defined)\n`);
  } else {
    // Group setup/hold pairs for cleaner emit
    const emitted = new Set<string>();
    for (const mcp of state.multicycles) {
      const key = `${mcp.from}|${mcp.through}|${mcp.to}|${mcp.edge}`;
      if (emitted.has(key) && mcp.type === "hold") continue;

      const edgeFlag = mcp.edge === "start" ? " -start" : mcp.edge === "end" ? " -end" : "";
      const fromStr = mcp.from ? ` -from ${mcp.from}` : "";
      const throughStr = mcp.through ? ` -through ${mcp.through}` : "";
      const toStr = mcp.to ? ` -to ${mcp.to}` : "";

      if (mcp.type === "setup") {
        const holdVal =
          mcp.holdCycles !== undefined
            ? mcp.holdCycles
            : Math.max(0, mcp.cycles - 1);
        lines.push(
          `${comment} Multicycle: setup ${mcp.cycles}, hold ${holdVal}`
        );
        lines.push(
          `set_multicycle_path ${mcp.cycles} -setup${edgeFlag}${fromStr}${throughStr}${toStr}`
        );
        lines.push(
          `set_multicycle_path ${holdVal} -hold${edgeFlag}${fromStr}${throughStr}${toStr}`
        );
        emitted.add(key);
      } else if (!state.multicycles.some(
        (s) =>
          s.type === "setup" &&
          s.from === mcp.from &&
          s.to === mcp.to &&
          s.through === mcp.through
      )) {
        lines.push(
          `set_multicycle_path ${mcp.cycles} -hold${edgeFlag}${fromStr}${throughStr}${toStr}`
        );
      }
      lines.push("");
    }

    for (const fp of state.falsePaths) {
      if (fp.comment) lines.push(`${comment} ${fp.comment}`);
      let cmd = `set_false_path`;
      if (fp.from) cmd += ` -from ${fp.from}`;
      if (fp.through) cmd += ` -through ${fp.through}`;
      if (fp.to) cmd += ` -to ${fp.to}`;
      lines.push(cmd);
      lines.push("");
    }
  }

  // Path delays, case analysis, disable timing, design rules
  lines.push(`${comment} =============================================================================`);
  lines.push(`${comment} 6. PATH DELAYS, CASE ANALYSIS, DISABLE TIMING & DESIGN RULES`);
  lines.push(`${comment} =============================================================================`);

  if (
    state.pathDelays.length === 0 &&
    state.caseAnalyses.length === 0 &&
    state.disableTimings.length === 0 &&
    !state.designRules.maxTransitionNs &&
    !state.designRules.maxCapacitancePf &&
    !state.designRules.maxFanout
  ) {
    lines.push(`${comment} (No additional path/case/disable/design-rule constraints)\n`);
  }

  for (const pd of state.pathDelays) {
    if (pd.comment) lines.push(`${comment} ${pd.comment}`);
    const cmdBase = pd.delayType === "max" ? "set_max_delay" : "set_min_delay";
    let cmd = `${cmdBase} ${pd.valueNs.toFixed(3)}`;
    if (pd.ignoreClockLatency) cmd += ` -ignore_clock_latency`;
    if (pd.from) cmd += ` -from ${pd.from}`;
    if (pd.through) cmd += ` -through ${pd.through}`;
    if (pd.to) cmd += ` -to ${pd.to}`;
    lines.push(cmd);
    lines.push("");
  }

  for (const ca of state.caseAnalyses) {
    lines.push(`set_case_analysis ${ca.value} ${ca.portOrPin}`);
  }
  if (state.caseAnalyses.length) lines.push("");

  for (const dt of state.disableTimings) {
    let cmd = `set_disable_timing`;
    if (dt.cellOrInstance) cmd += ` ${dt.cellOrInstance}`;
    if (dt.fromPin) cmd += ` -from ${dt.fromPin}`;
    if (dt.toPin) cmd += ` -to ${dt.toPin}`;
    lines.push(cmd);
  }
  if (state.disableTimings.length) lines.push("");

  if (state.designRules.maxTransitionNs > 0) {
    lines.push(
      `set_max_transition ${state.designRules.maxTransitionNs.toFixed(3)} [current_design]`
    );
  }
  if (state.designRules.maxCapacitancePf > 0) {
    lines.push(
      `set_max_capacitance ${state.designRules.maxCapacitancePf.toFixed(3)} [current_design]`
    );
  }
  if (state.designRules.maxFanout > 0) {
    lines.push(`set_max_fanout ${state.designRules.maxFanout} [current_design]`);
  }
  if (
    state.designRules.maxTransitionNs > 0 ||
    state.designRules.maxCapacitancePf > 0 ||
    state.designRules.maxFanout > 0
  ) {
    lines.push("");
  }

  lines.push(`${comment} =============================================================================`);
  lines.push(`${comment} END OF SDC CONSTRAINTS`);
  lines.push(`${comment} =============================================================================`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Robust SDC parser
// ---------------------------------------------------------------------------

/** Collapse continued lines ending with \ */
function preprocessSdc(raw: string): string[] {
  const rawLines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let buf = "";
  for (const line of rawLines) {
    const noComment = line.replace(/(?<!["'])#(?![{]).*$/, (m, offset, s) => {
      // keep # inside braces roughly; simple strip of trailing # comments
      const before = s.slice(0, offset);
      if ((before.match(/\{/g) || []).length > (before.match(/\}/g) || []).length) return m;
      return "";
    });
    // Simpler: strip # comments not inside []
    let cleaned = line;
    const hashIdx = cleaned.indexOf("#");
    if (hashIdx >= 0 && !cleaned.slice(0, hashIdx).includes("[")) {
      // allow # only if it's not mid-token; strip trailing comments
      if (!/#[a-fA-F0-9]/.test(cleaned.slice(hashIdx, hashIdx + 2))) {
        cleaned = cleaned.slice(0, hashIdx);
      }
    }
    cleaned = cleaned.trim();
    if (!cleaned || cleaned.startsWith("//")) continue;
    if (cleaned.endsWith("\\")) {
      buf += cleaned.slice(0, -1) + " ";
      continue;
    }
    out.push((buf + cleaned).trim());
    buf = "";
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function extractFlag(cmd: string, flag: string): string | null {
  // -flag value  or -flag {value} or -flag [get_...]
  const re = new RegExp(
    `${flag}\\s+(\\{[^}]+\\}|\\[[^\\]]+\\]|\\S+)`,
    "i"
  );
  const m = cmd.match(re);
  return m ? m[1].trim() : null;
}

function extractAllGetObjects(cmd: string): string[] {
  const objs: string[] = [];
  const re = /\[get_(?:ports|pins|clocks|cells|nets)\s+[^\]]+\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd)) !== null) objs.push(m[0]);
  return objs;
}

function trailingObject(cmd: string): string {
  const objs = extractAllGetObjects(cmd);
  if (objs.length) return objs[objs.length - 1];
  // bare port at end
  const m = cmd.match(/\s(\S+)\s*$/);
  return m ? m[1] : "";
}

function parseWaveform(cmd: string, period: number): { r: number; f: number } {
  const m = cmd.match(/-waveform\s*\{([^}]+)\}/i);
  if (m) {
    const parts = m[1].trim().split(/[\s,]+/).map(parseFloat);
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return { r: parts[0], f: parts[1] };
    }
  }
  return { r: 0, f: period / 2 };
}

export function parseSdcText(rawText: string): SdcStudioState {
  const state = emptySdcState();
  const lines = preprocessSdc(rawText);
  let ioCounter = 1;
  let mcpCounter = 1;
  let fpCounter = 1;
  let cgCounter = 1;
  let gCounter = 1;

  // Track uncertainty/latency applied after create_clock by clock name
  const uncSetup: Record<string, number> = {};
  const uncHold: Record<string, number> = {};
  const latSrc: Record<string, number> = {};
  const latNet: Record<string, number> = {};

  for (const trimmed of lines) {
    // create_clock
    if (/^create_clock\b/i.test(trimmed)) {
      const name =
        extractFlag(trimmed, "-name")?.replace(/[{}]/g, "") ||
        `clk_${state.primaryClocks.length + 1}`;
      const period = parseFloat(extractFlag(trimmed, "-period") || "10") || 10;
      const wf = parseWaveform(trimmed, period);
      const hasPort = /\[get_ports/i.test(trimmed) || /\[get_pins/i.test(trimmed);
      const isVirtual =
        /virtual/i.test(trimmed) ||
        (!hasPort && !trailingObject(trimmed).startsWith("["));
      let targets = "";
      if (hasPort) {
        const ports = extractAllGetObjects(trimmed).filter(
          (o) => /get_ports|get_pins/i.test(o)
        );
        targets = ports[ports.length - 1] || "";
      }
      state.primaryClocks.push({
        id: name,
        name,
        periodNs: period,
        waveformRising: wf.r,
        waveformFalling: wf.f,
        targets,
        isVirtual,
        uncertaintySetup: 0.1,
        uncertaintyHold: 0.05,
        latencySource: 0,
        latencyNetwork: 0,
      });
      continue;
    }

    // create_generated_clock
    if (/^create_generated_clock\b/i.test(trimmed)) {
      const name =
        extractFlag(trimmed, "-name")?.replace(/[{}]/g, "") ||
        `gclk_${gCounter++}`;
      const source = extractFlag(trimmed, "-source") || "";
      const masterRaw =
        extractFlag(trimmed, "-master_clock") ||
        extractFlag(trimmed, "-master") ||
        "";
      const masterName =
        masterRaw.replace(/\[get_clocks\s+([^\]]+)\]/i, "$1").replace(/[{}]/g, "").trim() ||
        state.primaryClocks[0]?.name ||
        "clk_sys";
      const div = parseInt(extractFlag(trimmed, "-divide_by") || "1", 10) || 1;
      const mul = parseInt(extractFlag(trimmed, "-multiply_by") || "1", 10) || 1;
      const invert = /\s-invert\b/i.test(trimmed);
      const combinational = /\s-combinational\b/i.test(trimmed);
      const edgesRaw = extractFlag(trimmed, "-edges");
      const edges = edgesRaw
        ? edgesRaw.replace(/^\{|\}$/g, "").trim()
        : undefined;
      const targets =
        extractAllGetObjects(trimmed).filter((o) => /get_pins|get_ports/i.test(o)).pop() ||
        trailingObject(trimmed);
      // master may be id or name — match existing
      const master =
        state.primaryClocks.find((c) => c.name === masterName || c.id === masterName) ||
        state.primaryClocks[0];
      state.generatedClocks.push({
        id: name,
        name,
        masterClockId: master?.id || masterName,
        sourcePin: source,
        targets,
        divideBy: div,
        multiplyBy: mul,
        invert,
        combinational,
        edges,
      });
      continue;
    }

    // set_clock_uncertainty
    if (/^set_clock_uncertainty\b/i.test(trimmed)) {
      const isSetup = /\s-setup\b/i.test(trimmed);
      const isHold = /\s-hold\b/i.test(trimmed);
      const valMatch = trimmed.match(
        /set_clock_uncertainty(?:\s+-setup|\s+-hold)?\s+(-?\d+(?:\.\d+)?)/i
      );
      const val = valMatch ? parseFloat(valMatch[1]) : 0;
      const clkMatch = trimmed.match(/\[get_clocks\s+([^\]]+)\]/i);
      const clkName = clkMatch ? clkMatch[1].trim() : "";
      if (clkName) {
        if (isHold) uncHold[clkName] = val;
        else if (isSetup) uncSetup[clkName] = val;
        else {
          uncSetup[clkName] = val;
          uncHold[clkName] = val;
        }
      }
      continue;
    }

    // set_clock_latency
    if (/^set_clock_latency\b/i.test(trimmed)) {
      const isSource = /\s-source\b/i.test(trimmed);
      const valMatch = trimmed.match(
        /set_clock_latency(?:\s+-source)?\s+(-?\d+(?:\.\d+)?)/i
      );
      const val = valMatch ? parseFloat(valMatch[1]) : 0;
      const clkMatch = trimmed.match(/\[get_clocks\s+([^\]]+)\]/i);
      const clkName = clkMatch ? clkMatch[1].trim() : "";
      if (clkName) {
        if (isSource) latSrc[clkName] = val;
        else latNet[clkName] = val;
      }
      continue;
    }

    // set_clock_groups
    if (/^set_clock_groups\b/i.test(trimmed)) {
      let relationType: ClockGroupRelation["relationType"] = "asynchronous";
      if (/logically_exclusive/i.test(trimmed))
        relationType = "logically_exclusive";
      else if (/physically_exclusive/i.test(trimmed))
        relationType = "physically_exclusive";

      const groups: string[][] = [];
      // -group [list [get_clocks a] [get_clocks b]] or -group {[get_clocks a] ...}
      const groupRe = /-group\s+(?:\[list\s+([^\]]+)\]|\{([^}]+)\})/gi;
      let gm: RegExpExecArray | null;
      while ((gm = groupRe.exec(trimmed)) !== null) {
        const body = gm[1] || gm[2] || "";
        const names = [
          ...body.matchAll(/\[get_clocks\s+([^\]]+)\]/gi),
        ].map((x) => x[1].trim());
        // also bare names
        if (names.length === 0) {
          body.split(/\s+/).forEach((t) => {
            if (t && !t.startsWith("-")) names.push(t.replace(/[{}]/g, ""));
          });
        }
        if (names.length) groups.push(names);
      }
      if (groups.length >= 2) {
        state.clockGroups.push({
          id: `cg_${cgCounter++}`,
          group1Clocks: groups[0],
          group2Clocks: groups[1],
          relationType,
        });
      }
      continue;
    }

    // set_input_delay / set_output_delay
    if (/^set_(input|output)_delay\b/i.test(trimmed)) {
      const delayType = /^set_input_delay/i.test(trimmed) ? "input" : "output";
      const clkMatch =
        trimmed.match(/-clock\s+\[get_clocks\s+([^\]]+)\]/i) ||
        trimmed.match(/-clock\s+(\S+)/i);
      const clockName = clkMatch ? clkMatch[1].replace(/[{}]/g, "") : "clk_sys";
      const isMax = /\s-max\b/i.test(trimmed);
      const isMin = /\s-min\b/i.test(trimmed);
      // value is last number before object, or last float not part of get_*
      const port = trailingObject(trimmed);
      const withoutPort = port
        ? trimmed.slice(0, trimmed.lastIndexOf(port)).trim()
        : trimmed;
      const nums = [...withoutPort.matchAll(/(?<![-\w])(-?\d+(?:\.\d+)?)/g)].map(
        (x) => parseFloat(x[1])
      );
      // filter out obvious non-delay tokens if any
      const delayVal = nums.length ? nums[nums.length - 1] : 1.0;

      // Merge min/max into same constraint when port+clock match
      const existing = state.ioConstraints.find(
        (io) =>
          io.portName === port &&
          io.clockName === clockName &&
          io.delayType === delayType &&
          !!io.clockFall === /\s-clock_fall\b/i.test(trimmed)
      );
      if (existing) {
        if (isMin) existing.minNs = delayVal;
        else if (isMax) existing.maxNs = delayVal;
        else {
          existing.minNs = delayVal;
          existing.maxNs = delayVal;
        }
      } else {
        state.ioConstraints.push({
          id: `io_${ioCounter++}`,
          portName: port || "port",
          clockName,
          delayType,
          minNs: isMax ? delayVal * 0.5 : delayVal,
          maxNs: isMin ? delayVal * 2 : delayVal,
          clockFall: /\s-clock_fall\b/i.test(trimmed),
          addDelay: /\s-add_delay\b/i.test(trimmed),
        });
      }
      continue;
    }

    // set_driving_cell
    if (/^set_driving_cell\b/i.test(trimmed)) {
      const lib = extractFlag(trimmed, "-lib_cell") || extractFlag(trimmed, "-libcell");
      const pin = extractFlag(trimmed, "-pin");
      const port = trailingObject(trimmed);
      const io = state.ioConstraints.find(
        (i) => i.portName === port && i.delayType === "input"
      );
      if (io && lib) {
        io.drivingCell = lib;
        if (pin) io.drivingPin = pin;
      }
      continue;
    }

    // set_load
    if (/^set_load\b/i.test(trimmed)) {
      const valM = trimmed.match(/set_load\s+(-?\d+(?:\.\d+)?)/i);
      const port = trailingObject(trimmed);
      const io = state.ioConstraints.find(
        (i) => i.portName === port && i.delayType === "output"
      );
      if (io && valM) io.loadPf = parseFloat(valM[1]);
      continue;
    }

    // set_multicycle_path
    if (/^set_multicycle_path\b/i.test(trimmed)) {
      const isHold = /\s-hold\b/i.test(trimmed);
      const isSetup = /\s-setup\b/i.test(trimmed) || !isHold;
      const cyclesM = trimmed.match(
        /set_multicycle_path\s+(-?\d+(?:\.\d+)?)/i
      );
      const cycles = cyclesM ? Math.round(parseFloat(cyclesM[1])) : 2;
      const edge: MulticycleConstraint["edge"] = /\s-start\b/i.test(trimmed)
        ? "start"
        : "end";
      const from = extractFlag(trimmed, "-from") || "";
      const through = extractFlag(trimmed, "-through") || "";
      const to = extractFlag(trimmed, "-to") || "";
      state.multicycles.push({
        id: `mcp_${mcpCounter++}`,
        from,
        through,
        to,
        cycles,
        type: isHold ? "hold" : "setup",
        edge,
        holdCycles: isHold ? cycles : undefined,
      });
      continue;
    }

    // set_false_path
    if (/^set_false_path\b/i.test(trimmed)) {
      state.falsePaths.push({
        id: `fp_${fpCounter++}`,
        from: extractFlag(trimmed, "-from") || "",
        through: extractFlag(trimmed, "-through") || "",
        to: extractFlag(trimmed, "-to") || "",
        comment: "Imported from SDC",
      });
      continue;
    }

    // set_max_delay / set_min_delay
    if (/^set_(max|min)_delay\b/i.test(trimmed)) {
      const delayType = /^set_max_delay/i.test(trimmed) ? "max" : "min";
      const valM = trimmed.match(/set_(?:max|min)_delay\s+(-?\d+(?:\.\d+)?)/i);
      const valueNs = valM ? parseFloat(valM[1]) : 0;
      state.pathDelays.push({
        id: `pd_${state.pathDelays.length + 1}`,
        delayType,
        valueNs,
        from: extractFlag(trimmed, "-from") || "",
        through: extractFlag(trimmed, "-through") || "",
        to: extractFlag(trimmed, "-to") || "",
        ignoreClockLatency: /\s-ignore_clock_latency\b/i.test(trimmed),
      });
      continue;
    }

    // set_case_analysis
    if (/^set_case_analysis\b/i.test(trimmed)) {
      const m = trimmed.match(
        /set_case_analysis\s+(0|1|rising|falling)\s+(\S+)/i
      );
      if (m) {
        state.caseAnalyses.push({
          id: `ca_${state.caseAnalyses.length + 1}`,
          value: m[1].toLowerCase() as CaseAnalysisConstraint["value"],
          portOrPin: m[2],
        });
      }
      continue;
    }

    // set_disable_timing
    if (/^set_disable_timing\b/i.test(trimmed)) {
      state.disableTimings.push({
        id: `dt_${state.disableTimings.length + 1}`,
        fromPin: extractFlag(trimmed, "-from") || "",
        toPin: extractFlag(trimmed, "-to") || "",
        cellOrInstance:
          extractAllGetObjects(trimmed)[0] ||
          (trimmed.match(/set_disable_timing\s+(\S+)/i)?.[1] &&
          !trimmed.match(/set_disable_timing\s+-/i)
            ? trimmed.match(/set_disable_timing\s+(\S+)/i)![1]
            : undefined),
      });
      continue;
    }

    // set_max_transition / capacitance / fanout
    if (/^set_max_transition\b/i.test(trimmed)) {
      const m = trimmed.match(/set_max_transition\s+(-?\d+(?:\.\d+)?)/i);
      if (m) state.designRules.maxTransitionNs = parseFloat(m[1]);
      continue;
    }
    if (/^set_max_capacitance\b/i.test(trimmed)) {
      const m = trimmed.match(/set_max_capacitance\s+(-?\d+(?:\.\d+)?)/i);
      if (m) state.designRules.maxCapacitancePf = parseFloat(m[1]);
      continue;
    }
    if (/^set_max_fanout\b/i.test(trimmed)) {
      const m = trimmed.match(/set_max_fanout\s+(-?\d+(?:\.\d+)?)/i);
      if (m) state.designRules.maxFanout = parseFloat(m[1]);
      continue;
    }
  }

  // Apply deferred uncertainty / latency
  for (const clk of state.primaryClocks) {
    if (uncSetup[clk.name] !== undefined) clk.uncertaintySetup = uncSetup[clk.name];
    if (uncHold[clk.name] !== undefined) clk.uncertaintyHold = uncHold[clk.name];
    if (latSrc[clk.name] !== undefined) clk.latencySource = latSrc[clk.name];
    if (latNet[clk.name] !== undefined) clk.latencyNetwork = latNet[clk.name];
  }

  // Pair MCP holdCycles onto setup entries
  for (const setup of state.multicycles.filter((m) => m.type === "setup")) {
    const hold = state.multicycles.find(
      (h) =>
        h.type === "hold" &&
        h.from === setup.from &&
        h.to === setup.to &&
        h.through === setup.through
    );
    if (hold) setup.holdCycles = hold.cycles;
    else if (setup.holdCycles === undefined)
      setup.holdCycles = Math.max(0, setup.cycles - 1);
  }

  if (state.primaryClocks.length === 0) {
    return normalizeSdcState(structuredClone(DEFAULT_SDC_STATE));
  }

  return normalizeSdcState(state);
}

// ---------------------------------------------------------------------------
// Tool / flow-aware lint
// ---------------------------------------------------------------------------

export function lintSdcState(
  stateIn: SdcStudioState,
  tool: SdcToolTarget = "generic",
  vendor: VendorFormat = "synopsys"
): LintMessage[] {
  const state = normalizeSdcState(stateIn);
  const msgs: LintMessage[] = [];
  const names = allClockNames(state);

  if (state.primaryClocks.length === 0) {
    msgs.push({
      id: "err_no_clocks",
      severity: "error",
      title: "No Primary Clocks Defined",
      message:
        "Every SDC file requires at least one primary or virtual clock for STA.",
      category: "clock",
    });
  }

  for (const clk of state.primaryClocks) {
    if (!clk.isVirtual && !clk.targets.trim()) {
      msgs.push({
        id: `warn_clk_notarget_${clk.id}`,
        severity: "warning",
        title: `Clock "${clk.name}" Missing Target`,
        message:
          "Primary physical clocks should target a port/pin (e.g. [get_ports clk_in]).",
        category: "clock",
      });
    }
    if (clk.periodNs <= 0) {
      msgs.push({
        id: `err_clk_period_${clk.id}`,
        severity: "error",
        title: `Clock "${clk.name}" Invalid Period`,
        message: "Clock period must be greater than 0 ns.",
        category: "clock",
      });
    }
    if (
      clk.waveformFalling <= clk.waveformRising ||
      clk.waveformFalling > clk.periodNs + 1e-9
    ) {
      msgs.push({
        id: `warn_wf_${clk.id}`,
        severity: "warning",
        title: `Clock "${clk.name}" Waveform Odd`,
        message: `Waveform {${clk.waveformRising}, ${clk.waveformFalling}} should satisfy rise < fall ≤ period (${clk.periodNs}).`,
        category: "clock",
      });
    }
    if (clk.periodNs > 0 && clk.uncertaintySetup > clk.periodNs * 0.2) {
      msgs.push({
        id: `warn_unc_${clk.id}`,
        severity: "warning",
        title: `High Setup Uncertainty on "${clk.name}"`,
        message: `Uncertainty ${clk.uncertaintySetup} ns is >20% of period (${clk.periodNs} ns) — check jitter/derate assumptions.`,
        category: "clock",
      });
    }
    if (clk.uncertaintyHold > clk.uncertaintySetup && clk.uncertaintySetup > 0) {
      msgs.push({
        id: `warn_hold_unc_${clk.id}`,
        severity: "info",
        title: `Hold unc > setup unc on "${clk.name}"`,
        message: `Hold ${clk.uncertaintyHold} ns vs setup ${clk.uncertaintySetup} ns is unusual (not wrong).`,
        category: "clock",
      });
    }
    // Tool-specific
    if (
      (tool === "genus" || tool === "innovus") &&
      clk.latencyNetwork > 0 &&
      !clk.isVirtual
    ) {
      msgs.push({
        id: `info_lat_${clk.id}`,
        severity: "info",
        title: `Network latency on "${clk.name}"`,
        message:
          tool === "genus"
            ? "Genus often uses ideal clocks early; network latency may be ignored until CTS."
            : "Innovus will refine network latency after CTS — this is an early budget number.",
        category: "tool",
        toolHint: tool,
      });
    }
    if (tool === "vivado" && clk.uncertaintyHold > 0 && vendor !== "xilinx") {
      msgs.push({
        id: `info_xdc_${clk.id}`,
        severity: "info",
        title: "Vivado prefers XDC emit",
        message: "Switch vendor format to Xilinx for cleaner Vivado XDC.",
        category: "tool",
        toolHint: "vivado",
      });
    }
  }

  for (const gclk of state.generatedClocks) {
    const masterExists = state.primaryClocks.some(
      (c) => c.id === gclk.masterClockId || c.name === gclk.masterClockId
    );
    // also allow generated master chain
    const genMaster = state.generatedClocks.some(
      (c) => c.id === gclk.masterClockId || c.name === gclk.masterClockId
    );
    if (!masterExists && !genMaster) {
      msgs.push({
        id: `err_gclk_nomaster_${gclk.id}`,
        severity: "error",
        title: `Generated Clock "${gclk.name}" Orphan Master`,
        message: `Master "${gclk.masterClockId}" is not defined.`,
        category: "clock",
      });
    }
    if (!gclk.targets.trim()) {
      msgs.push({
        id: `warn_gclk_tgt_${gclk.id}`,
        severity: "warning",
        title: `Generated Clock "${gclk.name}" Missing Target`,
        message: "create_generated_clock needs a pin/port target object.",
        category: "clock",
      });
    }
    if (tool === "tempus" || tool === "primetime") {
      if (!gclk.sourcePin) {
        msgs.push({
          id: `warn_gclk_src_${gclk.id}`,
          severity: "warning",
          title: `"${gclk.name}" missing -source`,
          message: "Signoff tools require -source for generated clocks.",
          category: "tool",
          toolHint: tool,
        });
      }
    }
  }

  for (const io of state.ioConstraints) {
    if (!names.includes(io.clockName)) {
      msgs.push({
        id: `err_io_noclk_${io.id}`,
        severity: "error",
        title: `I/O "${io.portName}" Bad Clock`,
        message: `Reference clock "${io.clockName}" is not defined.`,
        category: "io",
      });
    }
    if (io.minNs > io.maxNs) {
      msgs.push({
        id: `err_io_minmax_${io.id}`,
        severity: "error",
        title: `I/O "${io.portName}" Min > Max`,
        message: `min ${io.minNs} ns cannot exceed max ${io.maxNs} ns.`,
        category: "io",
      });
    }
    const period = resolveClockPeriod(state, io.clockName);
    if (io.maxNs > period) {
      msgs.push({
        id: `warn_io_period_${io.id}`,
        severity: "warning",
        title: `I/O max delay > period`,
        message: `${io.portName}: max ${io.maxNs} ns > ${io.clockName} period ${period} ns — often wrong or intentional multi-cycle I/O.`,
        category: "io",
      });
    }
    if (
      io.delayType === "input" &&
      !io.drivingCell &&
      (tool === "genus" || tool === "innovus" || tool === "tempus")
    ) {
      msgs.push({
        id: `info_drive_${io.id}`,
        severity: "info",
        title: "Missing set_driving_cell",
        message: `${io.portName}: ASIC flows usually need driving_cell for accurate input transition.`,
        category: "tool",
        toolHint: tool,
      });
    }
    if (
      io.delayType === "output" &&
      (io.loadPf === undefined || io.loadPf <= 0) &&
      (tool === "genus" || tool === "innovus")
    ) {
      msgs.push({
        id: `info_load_${io.id}`,
        severity: "info",
        title: "Missing set_load",
        message: `${io.portName}: set_load improves output timing realism at synthesis/PnR.`,
        category: "tool",
        toolHint: tool,
      });
    }
  }

  const setups = state.multicycles.filter((m) => m.type === "setup");
  const holds = state.multicycles.filter((m) => m.type === "hold");
  for (const setupMcp of setups) {
    if (setupMcp.cycles > 1) {
      const matchingHold = holds.find(
        (h) => h.from === setupMcp.from && h.to === setupMcp.to
      );
      if (!matchingHold && setupMcp.holdCycles === undefined) {
        msgs.push({
          id: `warn_mcp_missing_hold_${setupMcp.id}`,
          severity: "warning",
          title: `MCP setup ${setupMcp.cycles} missing hold`,
          message: `Usually set hold multicycle to ${setupMcp.cycles - 1} for -end edge checks.`,
          category: "exception",
        });
      }
    }
  }

  if (state.clockGroups.length > 0 && state.falsePaths.length > 0) {
    msgs.push({
      id: "info_precedence_check",
      severity: "info",
      title: "SDC Precedence",
      message:
        "set_clock_groups outranks set_false_path for cross-domain cuts. Explicit false paths between cut domains are redundant.",
      category: "cdc",
    });
  }

  // Budget warnings
  for (const b of computeAllBudgets(state)) {
    if (b.setupSlack < 0) {
      msgs.push({
        id: `budget_setup_${b.id}`,
        severity: "warning",
        title: `Tight/negative setup budget: ${b.label}`,
        message: `Setup slack ${b.setupSlack.toFixed(3)} ns (req ${b.requiredSetup.toFixed(3)} − path ${b.pathBudget.toFixed(3)}).`,
        category: "budget",
      });
    }
    if (b.holdSlack < 0) {
      msgs.push({
        id: `budget_hold_${b.id}`,
        severity: "warning",
        title: `Negative hold budget: ${b.label}`,
        message: `Hold slack ${b.holdSlack.toFixed(3)} ns — increase min delay or check latency skew.`,
        category: "budget",
      });
    }
  }

  if (tool === "quartus" && vendor !== "quartus") {
    msgs.push({
      id: "info_quartus_vendor",
      severity: "info",
      title: "Quartus target",
      message: "Set vendor format to Quartus for Altera/Intel SDC style groups.",
      category: "tool",
      toolHint: "quartus",
    });
  }

  // CDC / domain policy (merged CDC studio)
  msgs.push(...lintCdc(state));

  return msgs;
}

// ---------------------------------------------------------------------------
// CDC / clock-domain analysis (merged into SDC Studio)
// ---------------------------------------------------------------------------

export type CdcRelation =
  | "sync"
  | "asynchronous"
  | "logically_exclusive"
  | "physically_exclusive";

export function getCdcRelation(
  state: SdcStudioState,
  clkA: string,
  clkB: string
): CdcRelation {
  if (clkA === clkB) return "sync";
  const found = state.clockGroups.find(
    (cg) =>
      (cg.group1Clocks.includes(clkA) && cg.group2Clocks.includes(clkB)) ||
      (cg.group1Clocks.includes(clkB) && cg.group2Clocks.includes(clkA))
  );
  return found ? found.relationType : "sync";
}

/** Domain = primary root + generated children sharing that master lineage */
export interface CdcDomain {
  id: string;
  rootName: string;
  clocks: string[];
  colorIndex: number;
  isVirtual: boolean;
  periodNs: number;
}

export function buildCdcDomains(state: SdcStudioState): CdcDomain[] {
  const domains: CdcDomain[] = [];
  let color = 0;

  for (const p of state.primaryClocks) {
    const clocks = [p.name];
    // Generated clocks whose master is this primary (or chain)
    for (const g of state.generatedClocks) {
      if (g.masterClockId === p.id || g.masterClockId === p.name) {
        clocks.push(g.name);
      }
    }
    domains.push({
      id: p.id,
      rootName: p.name,
      clocks,
      colorIndex: color++ % 8,
      isVirtual: p.isVirtual,
      periodNs: p.periodNs,
    });
  }

  // Generated with orphan / gen-gen master not already placed
  for (const g of state.generatedClocks) {
    if (domains.some((d) => d.clocks.includes(g.name))) continue;
    const masterDom = domains.find(
      (d) =>
        d.clocks.includes(g.masterClockId) || d.rootName === g.masterClockId
    );
    if (masterDom) {
      masterDom.clocks.push(g.name);
    } else {
      domains.push({
        id: g.id,
        rootName: g.name,
        clocks: [g.name],
        colorIndex: color++ % 8,
        isVirtual: false,
        periodNs: resolveClockPeriod(state, g.name),
      });
    }
  }

  return domains;
}

export function clockToDomainId(
  domains: CdcDomain[],
  clockName: string
): string | null {
  const d = domains.find((x) => x.clocks.includes(clockName));
  return d ? d.id : null;
}

export interface CdcPairAnalysis {
  clkA: string;
  clkB: string;
  domainA: string;
  domainB: string;
  relation: CdcRelation;
  /** true if different domain roots and still treated as timed (sync) */
  missingCut: boolean;
  sameDomain: boolean;
  note: string;
}

export function analyzeCdcPairs(state: SdcStudioState): CdcPairAnalysis[] {
  const domains = buildCdcDomains(state);
  const names = allClockNames(state);
  const pairs: CdcPairAnalysis[] = [];

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const clkA = names[i];
      const clkB = names[j];
      const da = clockToDomainId(domains, clkA);
      const db = clockToDomainId(domains, clkB);
      const sameDomain = da !== null && da === db;
      const relation = getCdcRelation(state, clkA, clkB);
      const missingCut = !sameDomain && relation === "sync";
      let note = "";
      if (sameDomain) {
        note =
          relation === "sync"
            ? "Same clock family — timed (expected)."
            : `Same family but marked ${relation} — unusual; check intent.`;
      } else if (relation === "sync") {
        note =
          "Different domains still SYNC — STA will time cross-domain paths unless cut or properly synchronized.";
      } else if (relation === "asynchronous") {
        note =
          "Async cut — no STA paths between groups; ensure real CDC synchronizers in RTL.";
      } else {
        note = `${relation.replace(/_/g, " ")} — mutually exclusive clocks.`;
      }
      pairs.push({
        clkA,
        clkB,
        domainA: da || clkA,
        domainB: db || clkB,
        relation,
        missingCut,
        sameDomain,
        note,
      });
    }
  }
  return pairs;
}

export interface CdcSummary {
  domainCount: number;
  asyncCuts: number;
  exclusiveCuts: number;
  missingCuts: number;
  domains: CdcDomain[];
  pairs: CdcPairAnalysis[];
  generatedInCut: { clock: string; issue: string }[];
}

export function summarizeCdc(state: SdcStudioState): CdcSummary {
  const domains = buildCdcDomains(state);
  const pairs = analyzeCdcPairs(state);
  const asyncCuts = state.clockGroups.filter(
    (g) => g.relationType === "asynchronous"
  ).length;
  const exclusiveCuts = state.clockGroups.filter(
    (g) => g.relationType !== "asynchronous"
  ).length;
  const missingCuts = pairs.filter((p) => p.missingCut).length;

  const generatedInCut: { clock: string; issue: string }[] = [];
  for (const g of state.generatedClocks) {
    const masterName =
      state.primaryClocks.find(
        (c) => c.id === g.masterClockId || c.name === g.masterClockId
      )?.name || g.masterClockId;
    // If master is async to some clock but generated is not in same groups as master
    for (const cg of state.clockGroups) {
      const masterIn1 = cg.group1Clocks.includes(masterName);
      const masterIn2 = cg.group2Clocks.includes(masterName);
      const genIn1 = cg.group1Clocks.includes(g.name);
      const genIn2 = cg.group2Clocks.includes(g.name);
      if ((masterIn1 || masterIn2) && !genIn1 && !genIn2) {
        generatedInCut.push({
          clock: g.name,
          issue: `Master "${masterName}" is in a clock group but "${g.name}" is not — add generated clock to the same -group list.`,
        });
      }
    }
  }

  return {
    domainCount: domains.length,
    asyncCuts,
    exclusiveCuts,
    missingCuts,
    domains,
    pairs,
    generatedInCut,
  };
}

export function lintCdc(state: SdcStudioState): LintMessage[] {
  const msgs: LintMessage[] = [];
  const summary = summarizeCdc(state);
  const physicalClocks = state.primaryClocks.filter((c) => !c.isVirtual);

  if (physicalClocks.length >= 2 && state.clockGroups.length === 0) {
    msgs.push({
      id: "cdc_no_groups",
      severity: "warning",
      title: "No clock groups defined",
      message: `${physicalClocks.length} physical clocks with no set_clock_groups — cross-domain paths are timed as synchronous unless false-pathed.`,
      category: "cdc",
    });
  }

  // Cap missing-cut warnings to avoid spam
  const missing = summary.pairs.filter((p) => p.missingCut).slice(0, 12);
  for (const p of missing) {
    msgs.push({
      id: `cdc_missing_${p.clkA}_${p.clkB}`,
      severity: "warning",
      title: `Missing CDC cut: ${p.clkA} ↔ ${p.clkB}`,
      message: p.note,
      category: "cdc",
    });
  }
  if (summary.missingCuts > missing.length) {
    msgs.push({
      id: "cdc_missing_more",
      severity: "info",
      title: `${summary.missingCuts - missing.length} more uncut domain pairs`,
      message: "See CDC / Domains matrix for the full list.",
      category: "cdc",
    });
  }

  for (const g of summary.generatedInCut) {
    msgs.push({
      id: `cdc_gen_${g.clock}`,
      severity: "warning",
      title: `Generated clock "${g.clock}" omitted from group`,
      message: g.issue,
      category: "cdc",
    });
  }

  // False path vs clock_groups redundancy
  for (const fp of state.falsePaths) {
    const fromClk = guessClockFromObject(state, fp.from);
    const toClk = guessClockFromObject(state, fp.to);
    if (fromClk && toClk && fromClk !== toClk) {
      const rel = getCdcRelation(state, fromClk, toClk);
      if (rel !== "sync") {
        msgs.push({
          id: `cdc_fp_redundant_${fp.id}`,
          severity: "info",
          title: "False path may be redundant",
          message: `${fromClk}↔${toClk} already ${rel} via set_clock_groups (outranks set_false_path).`,
          category: "cdc",
        });
      }
    }
  }

  // Same-domain marked async (odd)
  for (const p of summary.pairs) {
    if (p.sameDomain && p.relation !== "sync") {
      msgs.push({
        id: `cdc_same_domain_cut_${p.clkA}_${p.clkB}`,
        severity: "warning",
        title: `Same-family clocks cut: ${p.clkA} / ${p.clkB}`,
        message: p.note,
        category: "cdc",
      });
    }
  }

  if (state.clockGroups.length > 0 && state.falsePaths.length > 0) {
    // already have general precedence in lintSdcState — skip duplicate if id exists
    // keep one detailed CDC note only when not already added... lintSdcState adds info_precedence_check
  }

  return msgs;
}

function guessClockFromObject(
  state: SdcStudioState,
  obj: string
): string | null {
  if (!obj) return null;
  for (const n of allClockNames(state)) {
    if (obj.includes(n)) return n;
  }
  return null;
}

export interface CdcDomainMapModel {
  domains: CdcDomain[];
  /** clocks as nodes with domain color */
  nodes: {
    id: string;
    name: string;
    domainId: string;
    colorIndex: number;
    kind: "primary" | "virtual" | "generated";
  }[];
  /** gen lineage edges */
  treeEdges: { from: string; to: string; label?: string }[];
  /** async / exclusive cuts between domain roots */
  cutEdges: {
    from: string;
    to: string;
    relation: CdcRelation;
  }[];
}

/** Build shared design graph from current SDC state */
export function getSdcDesignGraph(state: SdcStudioState): DesignGraph {
  return buildGraphFromSdc({
    primaryClocks: state.primaryClocks.map((c) => ({
      id: c.id,
      name: c.name,
      periodNs: c.periodNs,
      isVirtual: c.isVirtual,
    })),
    generatedClocks: state.generatedClocks.map((g) => ({
      id: g.id,
      name: g.name,
      masterClockId: g.masterClockId,
      divideBy: g.divideBy,
      multiplyBy: g.multiplyBy,
    })),
    clockGroups: state.clockGroups.map((cg) => ({
      group1Clocks: cg.group1Clocks,
      group2Clocks: cg.group2Clocks,
      relationType: cg.relationType,
    })),
    ioConstraints: state.ioConstraints.map((io) => ({
      id: io.id,
      portName: io.portName,
      clockName: io.clockName,
      delayType: io.delayType,
      maxNs: io.maxNs,
    })),
  });
}

export function getSdcGraphStats(state: SdcStudioState): GraphStats {
  return graphStats(getSdcDesignGraph(state));
}

export function buildCdcDomainMap(state: SdcStudioState): CdcDomainMapModel {
  // Connectivity from shared graph engine
  const g = getSdcDesignGraph(state);
  const view = domainMapView(g);
  const domains = buildCdcDomains(state);

  // Prefer graph clock nodes (exclude pure io from matrix layout of clocks;
  // keep them on domain map for treeEdges)
  const nodes: CdcDomainMapModel["nodes"] = view.nodes
    .filter((n) => n.kind !== "io")
    .map((n) => ({
      id: n.id,
      name: n.name,
      domainId: n.domainId,
      colorIndex: n.colorIndex,
      kind: n.kind === "virtual" ? "virtual" : n.kind === "generated" ? "generated" : "primary",
    }));

  // Fallback if graph empty
  if (nodes.length === 0) {
    for (const d of domains) {
      nodes.push({
        id: d.rootName,
        name: d.rootName,
        domainId: d.id,
        colorIndex: d.colorIndex,
        kind: d.isVirtual ? "virtual" : "primary",
      });
    }
  }

  const treeEdges = view.treeEdges
    .filter((e) => !String(e.to).startsWith("io:"))
    .map((e) => ({ from: e.from, to: e.to, label: e.label }));

  const cutEdges: CdcDomainMapModel["cutEdges"] = view.cutEdges.map((e) => ({
    from: e.from,
    to: e.to,
    relation: e.relation as CdcRelation,
  }));

  return { domains, nodes, treeEdges, cutEdges };
}

/** Palette for domain coloring (Tailwind-ish hex) */
export const CDC_DOMAIN_COLORS = [
  { fill: "#dbeafe", stroke: "#2563eb", text: "#1e3a8a" }, // blue
  { fill: "#fce7f3", stroke: "#db2777", text: "#9d174d" }, // pink
  { fill: "#d1fae5", stroke: "#059669", text: "#065f46" }, // green
  { fill: "#fef3c7", stroke: "#d97706", text: "#92400e" }, // amber
  { fill: "#e0e7ff", stroke: "#4f46e5", text: "#312e81" }, // indigo
  { fill: "#ffedd5", stroke: "#ea580c", text: "#9a3412" }, // orange
  { fill: "#f3e8ff", stroke: "#9333ea", text: "#6b21a8" }, // purple
  { fill: "#ccfbf1", stroke: "#0d9488", text: "#115e59" }, // teal
];

export interface CdcFixSuggestion {
  id: string;
  severity: "warning" | "info";
  title: string;
  detail: string;
  apply?: (state: SdcStudioState) => SdcStudioState;
}

export function cdcFixSuggestions(state: SdcStudioState): CdcFixSuggestion[] {
  const out: CdcFixSuggestion[] = [];
  const summary = summarizeCdc(state);

  for (const p of summary.pairs.filter((x) => x.missingCut).slice(0, 20)) {
    out.push({
      id: `fix_async_${p.clkA}_${p.clkB}`,
      severity: "warning",
      title: `Mark ${p.clkA} ↔ ${p.clkB} asynchronous`,
      detail: p.note,
      apply: (s) => applyCdcRelation(s, p.clkA, p.clkB, "asynchronous"),
    });
  }

  for (const g of summary.generatedInCut) {
    out.push({
      id: `fix_gen_${g.clock}`,
      severity: "warning",
      title: `Include ${g.clock} in clock groups with master`,
      detail: g.issue,
      apply: (s) => includeGeneratedInMasterGroups(s, g.clock),
    });
  }

  if (out.length === 0) {
    out.push({
      id: "cdc_ok",
      severity: "info",
      title: "CDC policy looks consistent",
      detail:
        "No missing domain cuts detected among defined clocks. Still verify RTL synchronizers for every async cut.",
    });
  }

  return out;
}

export function applyCdcRelation(
  state: SdcStudioState,
  clkA: string,
  clkB: string,
  relation: CdcRelation
): SdcStudioState {
  if (clkA === clkB) return state;
  const cleaned = state.clockGroups.filter(
    (cg) =>
      !(
        (cg.group1Clocks.includes(clkA) && cg.group2Clocks.includes(clkB)) ||
        (cg.group1Clocks.includes(clkB) && cg.group2Clocks.includes(clkA))
      )
  );
  if (relation === "sync") {
    return { ...state, clockGroups: cleaned };
  }
  // Expand groups with generated clocks in same domain
  const domains = buildCdcDomains(state);
  const domA = domains.find((d) => d.clocks.includes(clkA));
  const domB = domains.find((d) => d.clocks.includes(clkB));
  const g1 = domA ? [...domA.clocks] : [clkA];
  const g2 = domB ? [...domB.clocks] : [clkB];
  return {
    ...state,
    clockGroups: [
      ...cleaned,
      {
        id: `cg_${clkA}_${clkB}_${Date.now().toString(36).slice(-4)}`,
        group1Clocks: g1,
        group2Clocks: g2,
        relationType: relation,
      },
    ],
  };
}

function includeGeneratedInMasterGroups(
  state: SdcStudioState,
  genName: string
): SdcStudioState {
  const g = state.generatedClocks.find((x) => x.name === genName);
  if (!g) return state;
  const masterName =
    state.primaryClocks.find(
      (c) => c.id === g.masterClockId || c.name === g.masterClockId
    )?.name || g.masterClockId;

  return {
    ...state,
    clockGroups: state.clockGroups.map((cg) => {
      const g1 = [...cg.group1Clocks];
      const g2 = [...cg.group2Clocks];
      if (g1.includes(masterName) && !g1.includes(genName)) g1.push(genName);
      if (g2.includes(masterName) && !g2.includes(genName)) g2.push(genName);
      return { ...cg, group1Clocks: g1, group2Clocks: g2 };
    }),
  };
}

/** CDC-focused suggestions from a timing path (cross-clock) */
export function suggestionsFromCdcPath(
  path: TimingPathImport,
  state: SdcStudioState
): CdcFixSuggestion[] {
  const out: CdcFixSuggestion[] = [];
  const launch = path.clock;
  const capture = path.captureClock || path.clock;
  if (!launch) {
    out.push({
      id: "cdc_path_noclk",
      severity: "info",
      title: "No clocks found in path snippet",
      detail: "Paste a path that includes launch/capture Clock: lines.",
    });
    return out;
  }

  if (capture && launch !== capture) {
    const rel = getCdcRelation(state, launch, capture);
    if (rel === "sync") {
      out.push({
        id: "cdc_path_async",
        severity: "warning",
        title: `Cross-clock path ${launch} → ${capture} is still timed`,
        detail: `Slack ${path.slack ?? "n/a"}. If domains are async, apply set_clock_groups -asynchronous (with RTL CDC).`,
        apply: (s) => applyCdcRelation(s, launch, capture, "asynchronous"),
      });
      out.push({
        id: "cdc_path_fp",
        severity: "info",
        title: "Or set_false_path (weaker than clock_groups)",
        detail: "Use only when paths are false but clocks are not fully async.",
        apply: (s) => ({
          ...s,
          falsePaths: [
            ...s.falsePaths,
            {
              id: `fp_cdc_${Date.now().toString(36).slice(-4)}`,
              from: path.startpoint
                ? `[get_pins ${path.startpoint}]`
                : `[get_clocks ${launch}]`,
              through: "",
              to: path.endpoint
                ? `[get_pins ${path.endpoint}]`
                : `[get_clocks ${capture}]`,
              comment: `CDC path ${launch}→${capture} from STA import`,
            },
          ],
        }),
      });
    } else {
      out.push({
        id: "cdc_path_already_cut",
        severity: "info",
        title: `Already ${rel}: ${launch} ↔ ${capture}`,
        detail:
          "Constraint already cuts this pair. If still seeing paths, check generated clocks missing from -group lists or report_timing -ignore_clock_latency quirks.",
      });
    }
  } else {
    out.push({
      id: "cdc_path_same",
      severity: "info",
      title: "Same-clock path",
      detail:
        "Not a CDC issue — use Budget / MCP / I/O tabs for same-domain closure.",
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Timing budget solver
// ---------------------------------------------------------------------------

export type BudgetKind = "reg2reg" | "in2reg" | "reg2out";

export interface TimingBudget {
  id: string;
  kind: BudgetKind;
  label: string;
  launchClock: string;
  captureClock: string;
  periodNs: number;
  setupCycles: number;
  /** Available time for data path (setup) */
  requiredSetup: number;
  /** Conservative path estimate used for slack (I/O max or combo placeholder) */
  pathBudget: number;
  setupSlack: number;
  holdSlack: number;
  equationSetup: string;
  equationHold: string;
  details: Record<string, number>;
}

/**
 * Setup (single-cycle reg2reg, end edge):
 *   required = capture_edge + cap_lat − unc − setup
 *   arrival  = launch_edge + launch_lat + data
 *   with capture_edge = launch_edge + N*period (N=setup cycles)
 *   => data_max = N*T + (cap_lat − launch_lat) − unc − setup
 *
 * Hold:
 *   arrival_min >= capture_lat + hold + unc_hold − launch_lat  (same edge)
 */
export function computeReg2RegBudget(
  state: SdcStudioState,
  launchName: string,
  captureName: string,
  setupCycles = 1,
  comboEstimateNs?: number
): TimingBudget {
  const L = resolveClockMeta(state, launchName);
  const C = resolveClockMeta(state, captureName);
  // Use capture period for setup window when same domain; else min
  const period =
    launchName === captureName
      ? C.periodNs
      : Math.min(L.periodNs, C.periodNs);

  const N = Math.max(1, setupCycles);
  const launchLat = L.latencySource + L.latencyNetwork;
  const capLat = C.latencySource + C.latencyNetwork;
  const skew = capLat - launchLat;
  const setupLib = 0.05; // default library setup if not provided
  const holdLib = 0.03;

  const dataMax =
    N * period + skew - C.uncertaintySetup - setupLib;
  const path =
    comboEstimateNs !== undefined
      ? comboEstimateNs
      : Math.max(0.1, dataMax * 0.7); // default assume 70% used

  const setupSlack = dataMax - path;
  // Hold: min data >= hold + unc_hold − skew  (skew = cap - launch; useful skew helps hold if launch late)
  const dataMinReq = holdLib + C.uncertaintyHold - skew;
  const pathMin = path * 0.25; // assume min path ~25% of est
  const holdSlack = pathMin - dataMinReq;

  return {
    id: `r2r_${launchName}_${captureName}_${N}`,
    kind: "reg2reg",
    label: `${launchName} → ${captureName} (×${N})`,
    launchClock: launchName,
    captureClock: captureName,
    periodNs: period,
    setupCycles: N,
    requiredSetup: dataMax,
    pathBudget: path,
    setupSlack,
    holdSlack,
    equationSetup: `data_max = ${N}×${period.toFixed(3)} + skew(${skew.toFixed(3)}) − unc(${C.uncertaintySetup.toFixed(3)}) − setup(${setupLib}) = ${dataMax.toFixed(3)} ns`,
    equationHold: `data_min ≥ hold(${holdLib}) + unc_h(${C.uncertaintyHold.toFixed(3)}) − skew(${skew.toFixed(3)}) = ${dataMinReq.toFixed(3)} ns`,
    details: {
      launchLat,
      capLat,
      skew,
      uncertaintySetup: C.uncertaintySetup,
      uncertaintyHold: C.uncertaintyHold,
      setupLib,
      holdLib,
      pathMin,
      dataMinReq,
    },
  };
}

export function computeIoBudget(
  state: SdcStudioState,
  io: IoConstraint
): TimingBudget {
  const C = resolveClockMeta(state, io.clockName);
  const period = C.periodNs;
  const lat = C.latencySource + C.latencyNetwork;
  const setupLib = io.setupAsic ?? 0.08;
  const holdLib = io.holdAsic ?? 0.04;

  if (io.delayType === "input") {
    // in2reg: data_max = T − input_max − unc − setup  (+ latency terms often idealized)
    const dataMax =
      period - io.maxNs - C.uncertaintySetup - setupLib;
    const path = Math.max(0.05, dataMax * 0.65);
    const setupSlack = dataMax - path;
    // hold: input_min + data_min >= hold + unc_h
    const dataMinReq = holdLib + C.uncertaintyHold - io.minNs;
    const pathMin = path * 0.2;
    const holdSlack = pathMin - Math.max(0, dataMinReq);

    return {
      id: `io_${io.id}`,
      kind: "in2reg",
      label: `IN ${io.portName} @ ${io.clockName}`,
      launchClock: io.clockName,
      captureClock: io.clockName,
      periodNs: period,
      setupCycles: 1,
      requiredSetup: dataMax,
      pathBudget: path,
      setupSlack,
      holdSlack,
      equationSetup: `data_max = T(${period.toFixed(3)}) − input_max(${io.maxNs.toFixed(3)}) − unc(${C.uncertaintySetup.toFixed(3)}) − setup(${setupLib}) = ${dataMax.toFixed(3)}`,
      equationHold: `hold: input_min(${io.minNs.toFixed(3)}) + data_min ≥ hold(${holdLib}) + unc_h(${C.uncertaintyHold.toFixed(3)})`,
      details: { lat, inputMax: io.maxNs, inputMin: io.minNs, setupLib, holdLib },
    };
  }

  // reg2out
  const dataMax =
    period - io.maxNs - C.uncertaintySetup - setupLib;
  const path = Math.max(0.05, dataMax * 0.65);
  const setupSlack = dataMax - path;
  const dataMinReq = holdLib + C.uncertaintyHold - io.minNs;
  const pathMin = path * 0.2;
  const holdSlack = pathMin - Math.max(0, dataMinReq);

  return {
    id: `io_${io.id}`,
    kind: "reg2out",
    label: `OUT ${io.portName} @ ${io.clockName}`,
    launchClock: io.clockName,
    captureClock: io.clockName,
    periodNs: period,
    setupCycles: 1,
    requiredSetup: dataMax,
    pathBudget: path,
    setupSlack,
    holdSlack,
    equationSetup: `data_max = T(${period.toFixed(3)}) − output_max(${io.maxNs.toFixed(3)}) − unc(${C.uncertaintySetup.toFixed(3)}) − setup(${setupLib}) = ${dataMax.toFixed(3)}`,
    equationHold: `hold uses output_min(${io.minNs.toFixed(3)})`,
    details: { lat, outputMax: io.maxNs, outputMin: io.minNs, setupLib, holdLib },
  };
}

export function computeAllBudgets(state: SdcStudioState): TimingBudget[] {
  const budgets: TimingBudget[] = [];

  // Same-domain reg2reg for each primary non-virtual clock
  for (const clk of state.primaryClocks.filter((c) => !c.isVirtual)) {
    const mcp = state.multicycles.find(
      (m) => m.type === "setup" && m.cycles > 1
    );
    const N = mcp?.cycles ?? 1;
    budgets.push(computeReg2RegBudget(state, clk.name, clk.name, N));
  }

  // Generated clock domains
  for (const g of state.generatedClocks) {
    budgets.push(computeReg2RegBudget(state, g.name, g.name, 1));
  }

  // I/O
  for (const io of state.ioConstraints) {
    budgets.push(computeIoBudget(state, io));
  }

  return budgets;
}

// ---------------------------------------------------------------------------
// Clock tree schematic
// ---------------------------------------------------------------------------

export interface ClockTreeNode {
  id: string;
  name: string;
  kind: "primary" | "virtual" | "generated" | "io";
  periodNs: number;
  detail?: string;
}

export interface ClockTreeEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ClockTreeSchematic {
  nodes: ClockTreeNode[];
  edges: ClockTreeEdge[];
}

export function buildClockTreeSchematic(
  state: SdcStudioState
): ClockTreeSchematic {
  // Prefer graph-backed connectivity; keep display ids stable for UI
  const g = getSdcDesignGraph(state);
  const view = domainMapView(g);
  const nodes: ClockTreeNode[] = [];
  const edges: ClockTreeEdge[] = [];

  // Map graph clock/io nodes → tree schematic with periods
  for (const n of view.nodes) {
    if (n.kind === "io") {
      const io = state.ioConstraints.find((i) => `io:${i.id}` === n.id || i.id === n.id);
      nodes.push({
        id: n.id,
        name: n.name,
        kind: "io",
        periodNs: io
          ? resolveClockPeriod(state, io.clockName)
          : 10,
        detail: io ? `${io.delayType} ${io.maxNs.toFixed(2)}ns` : "io",
      });
      continue;
    }
    const period = resolveClockPeriod(state, n.name);
    const primary = state.primaryClocks.find((c) => c.name === n.name);
    nodes.push({
      id: n.name,
      name: n.name,
      kind: n.kind === "virtual" ? "virtual" : n.kind === "generated" ? "generated" : "primary",
      periodNs: period,
      detail:
        n.kind === "virtual"
          ? "virtual"
          : n.kind === "generated"
          ? view.treeEdges.find((e) => e.to === n.name)?.label || "gen"
          : `${(1000 / period).toFixed(0)} MHz`,
    });
    void primary;
  }

  for (const e of view.treeEdges) {
    edges.push({
      from: e.from.startsWith("io:") ? e.from : e.from,
      to: e.to.startsWith("io:") ? e.to : e.to,
      label: e.label,
    });
  }

  // Fallback if graph produced nothing
  if (nodes.length === 0) {
    for (const c of state.primaryClocks) {
      nodes.push({
        id: c.id,
        name: c.name,
        kind: c.isVirtual ? "virtual" : "primary",
        periodNs: c.periodNs,
        detail: c.isVirtual ? "virtual" : `${(1000 / c.periodNs).toFixed(0)} MHz`,
      });
    }
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Waveform models (accurate)
// ---------------------------------------------------------------------------

export interface ClockWaveformModel {
  name: string;
  periodNs: number;
  rise: number;
  fall: number;
  duty: number;
  latencyTotal: number;
  /** Edge times shifted by source+network latency for FF clock pin view */
  effectiveRise: number;
  effectiveFall: number;
  uncertaintySetup: number;
  uncertaintyHold: number;
}

export function buildClockWaveformModel(
  state: SdcStudioState,
  clockName: string
): ClockWaveformModel {
  const m = resolveClockMeta(state, clockName);
  const latencyTotal = m.latencySource + m.latencyNetwork;
  return {
    name: m.name,
    periodNs: m.periodNs,
    rise: m.waveformRising,
    fall: m.waveformFalling,
    duty: (m.waveformFalling - m.waveformRising) / (m.periodNs || 1),
    latencyTotal,
    effectiveRise: m.waveformRising + latencyTotal,
    effectiveFall: m.waveformFalling + latencyTotal,
    uncertaintySetup: m.uncertaintySetup,
    uncertaintyHold: m.uncertaintyHold,
  };
}

export interface McpWaveformModel {
  periodNs: number;
  setupCycles: number;
  holdCycles: number;
  edge: "start" | "end";
  /** Default single-cycle setup capture edge */
  defaultCapture: number;
  /** Multicycle setup capture edge */
  mcpCapture: number;
  launchEdge: number;
  holdCapture: number;
}

export function buildMcpWaveformModel(
  periodNs: number,
  setupCycles: number,
  holdCycles: number,
  edge: "start" | "end" = "end"
): McpWaveformModel {
  const N = Math.max(1, setupCycles);
  const H = holdCycles;
  // -end: launch @0, capture moves to N*T
  // -start: launch moves earlier (negative) by (N-1)*T, capture @T
  if (edge === "start") {
    return {
      periodNs,
      setupCycles: N,
      holdCycles: H,
      edge,
      defaultCapture: periodNs,
      mcpCapture: periodNs,
      launchEdge: -(N - 1) * periodNs,
      holdCapture: H * periodNs, // simplified
    };
  }
  return {
    periodNs,
    setupCycles: N,
    holdCycles: H,
    edge,
    defaultCapture: periodNs,
    mcpCapture: N * periodNs,
    launchEdge: 0,
    holdCapture: H * periodNs,
  };
}

/** SVG path for digital clock over multiple periods */
export function clockSvgPath(
  period: number,
  rise: number,
  fall: number,
  tMin: number,
  tMax: number,
  xOf: (t: number) => number,
  yHigh: number,
  yLow: number
): string {
  if (period <= 0) period = 1;
  const dutyStart = ((rise % period) + period) % period;
  const dutyEnd = ((fall % period) + period) % period;
  const pts: string[] = [];

  const phaseAt = (t: number) => {
    const ph = ((t - rise) % period + period) % period;
    // high between rise and fall within period
    const r = 0;
    const f = (dutyEnd - dutyStart + period) % period || period * 0.5;
    return ph < f;
  };

  let high = phaseAt(tMin);
  pts.push(`M ${xOf(tMin)} ${high ? yHigh : yLow}`);

  // collect edges
  const events: { t: number; high: boolean }[] = [];
  const startK = Math.floor((tMin - rise) / period) - 1;
  const endK = Math.ceil((tMax - rise) / period) + 1;
  for (let k = startK; k <= endK; k++) {
    const r = rise + k * period;
    const f = fall + k * period;
    if (r >= tMin && r <= tMax) events.push({ t: r, high: true });
    if (f >= tMin && f <= tMax) events.push({ t: f, high: false });
  }
  events.sort((a, b) => a.t - b.t);

  for (const ev of events) {
    pts.push(`L ${xOf(ev.t)} ${high ? yHigh : yLow}`);
    high = ev.high;
    pts.push(`L ${xOf(ev.t)} ${high ? yHigh : yLow}`);
  }
  pts.push(`L ${xOf(tMax)} ${high ? yHigh : yLow}`);
  return pts.join(" ");
}

// ---------------------------------------------------------------------------
// Timing Studio path → SDC suggestions
// ---------------------------------------------------------------------------

export interface TimingPathImport {
  startpoint?: string;
  endpoint?: string;
  clock?: string;
  captureClock?: string;
  type?: "setup" | "hold";
  pathKind?: string;
  slack?: number;
  launchEdge?: number;
  captureEdge?: number;
  inputDelay?: number;
  outputDelay?: number;
  uncertainty?: number;
  dataPathDelay?: number;
  librarySetup?: number;
  libraryHold?: number;
  periodNs?: number;
}

export interface SdcSuggestion {
  id: string;
  kind: "clock" | "io" | "mcp" | "false_path" | "uncertainty" | "info";
  title: string;
  detail: string;
  apply: (state: SdcStudioState) => SdcStudioState;
}

export function suggestionsFromTimingPath(
  path: TimingPathImport,
  state: SdcStudioState
): SdcSuggestion[] {
  const out: SdcSuggestion[] = [];
  const clk = path.clock || "clk_sys";
  const period =
    path.periodNs ||
    (path.captureEdge !== undefined &&
    path.launchEdge !== undefined &&
    path.captureEdge > path.launchEdge
      ? path.captureEdge - path.launchEdge
      : resolveClockPeriod(state, clk));

  // Ensure clock exists
  if (!allClockNames(state).includes(clk)) {
    out.push({
      id: "add_clock",
      kind: "clock",
      title: `Add clock ${clk}`,
      detail: `Period ≈ ${period.toFixed(3)} ns from path edges.`,
      apply: (s) => ({
        ...s,
        primaryClocks: [
          ...s.primaryClocks,
          {
            id: clk,
            name: clk,
            periodNs: period,
            waveformRising: 0,
            waveformFalling: period / 2,
            targets: `[get_ports ${clk}]`,
            isVirtual: false,
            uncertaintySetup: path.uncertainty ?? 0.1,
            uncertaintyHold: (path.uncertainty ?? 0.1) * 0.5,
            latencySource: 0,
            latencyNetwork: 0,
          },
        ],
      }),
    });
  }

  if (path.uncertainty && path.uncertainty > 0) {
    out.push({
      id: "set_unc",
      kind: "uncertainty",
      title: `Set uncertainty ${path.uncertainty.toFixed(3)} ns on ${clk}`,
      detail: "From path report clock uncertainty.",
      apply: (s) => ({
        ...s,
        primaryClocks: s.primaryClocks.map((c) =>
          c.name === clk
            ? {
                ...c,
                uncertaintySetup: path.uncertainty!,
                uncertaintyHold: path.uncertainty! * 0.5,
              }
            : c
        ),
      }),
    });
  }

  if (
    (path.pathKind === "in2reg" || path.pathKind === "in2out") &&
    path.inputDelay !== undefined &&
    path.inputDelay > 0
  ) {
    const port = path.startpoint || "input_port";
    out.push({
      id: "set_input_delay",
      kind: "io",
      title: `set_input_delay ${path.inputDelay.toFixed(3)} on ${port}`,
      detail: "From STA path input external delay.",
      apply: (s) => ({
        ...s,
        ioConstraints: [
          ...s.ioConstraints.filter(
            (io) => !(io.portName.includes(port) && io.delayType === "input")
          ),
          {
            id: uid("io_in"),
            portName: port.startsWith("[") ? port : `[get_ports ${port}]`,
            clockName: clk,
            delayType: "input",
            minNs: path.inputDelay! * 0.5,
            maxNs: path.inputDelay!,
            setupAsic: path.librarySetup,
            holdAsic: path.libraryHold,
          },
        ],
      }),
    });
  }

  if (
    (path.pathKind === "reg2out" || path.pathKind === "in2out") &&
    path.outputDelay !== undefined &&
    path.outputDelay > 0
  ) {
    const port = path.endpoint || "output_port";
    out.push({
      id: "set_output_delay",
      kind: "io",
      title: `set_output_delay ${path.outputDelay.toFixed(3)} on ${port}`,
      detail: "From STA path output external delay.",
      apply: (s) => ({
        ...s,
        ioConstraints: [
          ...s.ioConstraints.filter(
            (io) => !(io.portName.includes(port) && io.delayType === "output")
          ),
          {
            id: uid("io_out"),
            portName: port.startsWith("[") ? port : `[get_ports ${port}]`,
            clockName: path.captureClock || clk,
            delayType: "output",
            minNs: path.outputDelay! * 0.5,
            maxNs: path.outputDelay!,
            setupAsic: path.librarySetup,
            holdAsic: path.libraryHold,
          },
        ],
      }),
    });
  }

  // If setup violated with deep path, suggest MCP
  if (
    path.type === "setup" &&
    path.slack !== undefined &&
    path.slack < 0 &&
    path.dataPathDelay !== undefined &&
    path.dataPathDelay > period
  ) {
    const cycles = Math.ceil(path.dataPathDelay / period) + 0; // at least cover data
    const N = Math.max(2, cycles);
    out.push({
      id: "suggest_mcp",
      kind: "mcp",
      title: `Suggest multicycle setup ${N}`,
      detail: `Data path ${path.dataPathDelay.toFixed(3)} ns > period ${period.toFixed(3)} ns; slack ${path.slack.toFixed(3)}.`,
      apply: (s) => ({
        ...s,
        multicycles: [
          ...s.multicycles,
          {
            id: uid("mcp"),
            from: path.startpoint
              ? `[get_pins ${path.startpoint}]`
              : "",
            through: "",
            to: path.endpoint ? `[get_pins ${path.endpoint}]` : "",
            cycles: N,
            holdCycles: N - 1,
            type: "setup",
            edge: "end",
          },
          {
            id: uid("mcp_h"),
            from: path.startpoint
              ? `[get_pins ${path.startpoint}]`
              : "",
            through: "",
            to: path.endpoint ? `[get_pins ${path.endpoint}]` : "",
            cycles: N - 1,
            type: "hold",
            edge: "end",
          },
        ],
      }),
    });
  }

  // Async-looking: different clocks
  if (
    path.clock &&
    path.captureClock &&
    path.clock !== path.captureClock &&
    path.slack !== undefined &&
    path.slack < 0
  ) {
    out.push({
      id: "suggest_async",
      kind: "false_path",
      title: `Async cut ${path.clock} ↔ ${path.captureClock}`,
      detail:
        "Cross-clock violation — consider set_clock_groups -asynchronous if domains are truly async (with proper CDC).",
      apply: (s) => ({
        ...s,
        clockGroups: [
          ...s.clockGroups,
          {
            id: uid("cg"),
            group1Clocks: [path.clock!],
            group2Clocks: [path.captureClock!],
            relationType: "asynchronous",
          },
        ],
      }),
    });
  }

  if (out.length === 0) {
    out.push({
      id: "info_none",
      kind: "info",
      title: "No automatic SDC edits",
      detail:
        "Path already consistent with clocks; tune I/O or exceptions manually from Timing Studio metrics.",
      apply: (s) => s,
    });
  }

  return out;
}

/** Parse a pasted timing path summary (or Timing Studio JSON-ish) into import fields */
export function parseTimingPathSnippet(text: string): TimingPathImport | null {
  if (!text.trim()) return null;
  // JSON from Timing Studio export-like
  try {
    const j = JSON.parse(text);
    if (j && (j.clock || j.startpoint || j.slack !== undefined)) {
      return j as TimingPathImport;
    }
  } catch {
    /* not JSON */
  }

  const path: TimingPathImport = {};
  const start =
    text.match(/Startpoint:\s*(?:\([RF]\)\s*)?(\S+)/i) ||
    text.match(/startpoint["\s:]+([^\s",]+)/i);
  if (start) path.startpoint = start[1];
  const end =
    text.match(/Endpoint:\s*(?:\([RF]\)\s*)?(\S+)/i) ||
    text.match(/endpoint["\s:]+([^\s",]+)/i);
  if (end) path.endpoint = end[1];
  const clocks = [...text.matchAll(/Clock:\s*(?:\([RF]\)\s*)?(\S+)/gi)];
  if (clocks[0]) path.clock = clocks[0][1].replace(/[()]/g, "");
  if (clocks[1]) path.captureClock = clocks[1][1].replace(/[()]/g, "");
  const slack =
    text.match(/Slack:=\s*(-?\d+(?:\.\d+)?)/i) ||
    text.match(/slack\s*(?:\([^)]*\))?\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i) ||
    text.match(/VIOLATED\s*\(\s*(-?\d+(?:\.\d+)?)\s*(?:ns|ps)?\s*\)/i);
  if (slack) {
    let s = parseFloat(slack[1]);
    if (/\bps\b/i.test(text) && Math.abs(s) > 50) s /= 1000;
    path.slack = s;
  }
  const edge = text.match(
    /Clock Edge:\+\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i
  );
  if (edge) {
    let cap = parseFloat(edge[1]);
    let lan = parseFloat(edge[2]);
    if (cap > 100) {
      cap /= 1000;
      lan /= 1000;
    }
    path.captureEdge = cap;
    path.launchEdge = lan;
    path.periodNs = Math.abs(cap - lan) || undefined;
  }
  const inD = text.match(/Input Delay:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (inD) {
    let v = Math.abs(parseFloat(inD[1]));
    if (v > 100) v /= 1000;
    path.inputDelay = v;
  }
  const outD = text.match(/Output Delay:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (outD) {
    let v = Math.abs(parseFloat(outD[1]));
    if (v > 100) v /= 1000;
    path.outputDelay = v;
  }
  const dp = text.match(/Data Path:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (dp) {
    let v = Math.abs(parseFloat(dp[1]));
    if (v > 100) v /= 1000;
    path.dataPathDelay = v;
  }
  const unc = text.match(/Uncertainty:[-+]?\s*(-?\d+(?:\.\d+)?)/i);
  if (unc) {
    let v = Math.abs(parseFloat(unc[1]));
    if (v > 100) v /= 1000;
    path.uncertainty = v;
  }
  if (/\bhold\b/i.test(text) && !/\bsetup\b/i.test(text)) path.type = "hold";
  else path.type = "setup";

  if (
    /Late Output|output delay|reg2out|pad_/i.test(text) &&
    path.outputDelay
  )
    path.pathKind = "reg2out";
  else if (/input delay|in2reg|Late External/i.test(text) && path.inputDelay)
    path.pathKind = path.outputDelay ? "in2out" : "in2reg";
  else path.pathKind = "reg2reg";

  if (!path.startpoint && !path.clock && path.slack === undefined) return null;
  return path;
}

export function vendorToDefaultTool(vendor: VendorFormat): SdcToolTarget {
  switch (vendor) {
    case "xilinx":
      return "vivado";
    case "quartus":
      return "quartus";
    case "cadence":
      return "innovus";
    default:
      return "primetime";
  }
}
