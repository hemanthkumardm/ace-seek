export type VendorFormat = 'synopsys' | 'cadence' | 'xilinx' | 'quartus';

export interface PrimaryClock {
  id: string;
  name: string;
  periodNs: number;
  waveformRising: number;
  waveformFalling: number;
  targets: string; // e.g. "[get_ports clk_main]" or "clk_sys"
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
  sourcePin: string; // e.g. "[get_pins u_pll/clk_ref]"
  targets: string;   // e.g. "[get_pins u_div/clk_out]"
  divideBy: number;
  multiplyBy: number;
  invert: boolean;
}

export interface ClockGroupRelation {
  id: string;
  group1Clocks: string[]; // clock names
  group2Clocks: string[]; // clock names
  relationType: 'asynchronous' | 'logically_exclusive' | 'physically_exclusive';
}

export interface IoConstraint {
  id: string;
  portName: string;
  clockName: string;
  delayType: 'input' | 'output';
  minNs: number;
  maxNs: number;
  clockFall?: boolean;
  addDelay?: boolean;
  drivingCell?: string;
  drivingPin?: string;
  loadPf?: number;
  setupAsic?: number; // Library setup requirement (ns)
  holdAsic?: number;  // Library hold requirement (ns)
}

export interface MulticycleConstraint {
  id: string;
  from: string;
  through: string;
  to: string;
  cycles: number;      // Setup cycles N
  holdCycles?: number; // Hold cycles M (default: N - 1)
  type: 'setup' | 'hold';
  edge: 'start' | 'end';
}

export interface FalsePathConstraint {
  id: string;
  from: string;
  through: string;
  to: string;
  comment?: string;
}

export interface SdcStudioState {
  primaryClocks: PrimaryClock[];
  generatedClocks: GeneratedClock[];
  clockGroups: ClockGroupRelation[];
  ioConstraints: IoConstraint[];
  multicycles: MulticycleConstraint[];
  falsePaths: FalsePathConstraint[];
}

export interface LintMessage {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  category: 'clock' | 'cdc' | 'io' | 'exception';
}

// ----------------------------------------------------
// DEFAULT INITIAL STATE & PRESETS
// ----------------------------------------------------

export const DEFAULT_SDC_STATE: SdcStudioState = {
  primaryClocks: [
    {
      id: 'clk_sys',
      name: 'clk_sys',
      periodNs: 10.0,
      waveformRising: 0,
      waveformFalling: 5.0,
      targets: '[get_ports clk_sys_in]',
      isVirtual: false,
      uncertaintySetup: 0.15,
      uncertaintyHold: 0.08,
      latencySource: 0.2,
      latencyNetwork: 0.5,
    },
    {
      id: 'clk_pci',
      name: 'clk_pci',
      periodNs: 8.0,
      waveformRising: 0,
      waveformFalling: 4.0,
      targets: '[get_ports pcie_clk_p]',
      isVirtual: false,
      uncertaintySetup: 0.12,
      uncertaintyHold: 0.06,
      latencySource: 0.1,
      latencyNetwork: 0.3,
    },
    {
      id: 'vclk_ext',
      name: 'vclk_ext',
      periodNs: 10.0,
      waveformRising: 0,
      waveformFalling: 5.0,
      targets: '',
      isVirtual: true,
      uncertaintySetup: 0.2,
      uncertaintyHold: 0.1,
      latencySource: 0,
      latencyNetwork: 0,
    },
  ],
  generatedClocks: [
    {
      id: 'clk_div2',
      name: 'clk_div2',
      masterClockId: 'clk_sys',
      sourcePin: '[get_pins u_sys_clk_gen/u_pll/clk_out]',
      targets: '[get_pins u_div2/Q]',
      divideBy: 2,
      multiplyBy: 1,
      invert: false,
    },
  ],
  clockGroups: [
    {
      id: 'cg_sys_pci',
      group1Clocks: ['clk_sys', 'clk_div2'],
      group2Clocks: ['clk_pci'],
      relationType: 'asynchronous',
    },
  ],
  ioConstraints: [
    {
      id: 'io_rx_data',
      portName: '[get_ports {rx_data[*]}]',
      clockName: 'vclk_ext',
      delayType: 'input',
      minNs: 1.2,
      maxNs: 3.5,
      clockFall: false,
      addDelay: false,
      drivingCell: 'BUF_X4',
      drivingPin: 'Y',
    },
    {
      id: 'io_tx_data',
      portName: '[get_ports {tx_data[*]}]',
      clockName: 'clk_sys',
      delayType: 'output',
      minNs: 0.8,
      maxNs: 2.5,
      clockFall: false,
      addDelay: false,
      loadPf: 12.0,
    },
  ],
  multicycles: [
    {
      id: 'mcp_alu_mult',
      from: '[get_pins u_alu/mult_reg[*]/C]',
      through: '',
      to: '[get_pins u_alu/acc_reg[*]/D]',
      cycles: 2,
      type: 'setup',
      edge: 'end',
    },
    {
      id: 'mcp_alu_mult_hold',
      from: '[get_pins u_alu/mult_reg[*]/C]',
      through: '',
      to: '[get_pins u_alu/acc_reg[*]/D]',
      cycles: 1,
      type: 'hold',
      edge: 'end',
    },
  ],
  falsePaths: [
    {
      id: 'fp_async_rst',
      from: '[get_ports rst_n]',
      through: '',
      to: '',
      comment: 'Asynchronous system reset path assertion',
    },
    {
      id: 'fp_cfg_regs',
      from: '[get_pins u_config/cfg_*_reg[*]/Q]',
      through: '',
      to: '',
      comment: 'Static configuration registers',
    },
  ],
};

export const SDC_PRESETS: { name: string; description: string; state: SdcStudioState }[] = [
  {
    name: 'Dual-Clock SoC Core',
    description: 'System clock with PLL divider, asynchronous PCIe domain, async reset false paths, and multicycle multiplier.',
    state: DEFAULT_SDC_STATE,
  },
  {
    name: 'DDR3 Controller Interface',
    description: '100MHz system clock with 400MHz generated memory clock, DDR I/O delays, and strict setup/hold constraints.',
    state: {
      primaryClocks: [
        {
          id: 'sys_clk_100',
          name: 'sys_clk_100',
          periodNs: 10.0,
          waveformRising: 0,
          waveformFalling: 5.0,
          targets: '[get_ports sys_clk_p]',
          isVirtual: false,
          uncertaintySetup: 0.1,
          uncertaintyHold: 0.05,
          latencySource: 0.1,
          latencyNetwork: 0.2,
        },
        {
          id: 'ddr_vclk',
          name: 'ddr_vclk',
          periodNs: 2.5,
          waveformRising: 0,
          waveformFalling: 1.25,
          targets: '',
          isVirtual: true,
          uncertaintySetup: 0.08,
          uncertaintyHold: 0.04,
          latencySource: 0,
          latencyNetwork: 0,
        },
      ],
      generatedClocks: [
        {
          id: 'ddr_phy_clk',
          name: 'ddr_phy_clk',
          masterClockId: 'sys_clk_100',
          sourcePin: '[get_pins u_pll/ref_clk]',
          targets: '[get_pins u_pll/out_clk_400mhz]',
          divideBy: 1,
          multiplyBy: 4,
          invert: false,
        },
      ],
      clockGroups: [],
      ioConstraints: [
        {
          id: 'ddr_dq_in',
          portName: '[get_ports {ddr_dq[*]}]',
          clockName: 'ddr_vclk',
          delayType: 'input',
          minNs: 0.35,
          maxNs: 0.75,
          clockFall: false,
          addDelay: false,
        },
        {
          id: 'ddr_dq_out',
          portName: '[get_ports {ddr_dq[*]}]',
          clockName: 'ddr_phy_clk',
          delayType: 'output',
          minNs: 0.25,
          maxNs: 0.65,
          clockFall: false,
          addDelay: false,
          loadPf: 8.0,
        },
      ],
      multicycles: [],
      falsePaths: [
        {
          id: 'fp_calib',
          from: '[get_pins u_ddr_phy/calib_done_reg/Q]',
          through: '',
          to: '',
          comment: 'Calibration done status signal',
        },
      ],
    },
  },
  {
    name: 'RGMII Ethernet PHY',
    description: '125MHz RGMII transmit/receive clocking with dual-edge data I/O delay constraints and false-path control logic.',
    state: {
      primaryClocks: [
        {
          id: 'rgmii_rxc',
          name: 'rgmii_rxc',
          periodNs: 8.0,
          waveformRising: 0,
          waveformFalling: 4.0,
          targets: '[get_ports rgmii_rxc]',
          isVirtual: false,
          uncertaintySetup: 0.15,
          uncertaintyHold: 0.08,
          latencySource: 0.15,
          latencyNetwork: 0.35,
        },
        {
          id: 'rgmii_txc',
          name: 'rgmii_txc',
          periodNs: 8.0,
          waveformRising: 0,
          waveformFalling: 4.0,
          targets: '[get_ports rgmii_txc]',
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
          id: 'cg_rgmii_async',
          group1Clocks: ['rgmii_rxc'],
          group2Clocks: ['rgmii_txc'],
          relationType: 'asynchronous',
        },
      ],
      ioConstraints: [
        {
          id: 'rgmii_rxd_rise',
          portName: '[get_ports {rgmii_rxd[*]}]',
          clockName: 'rgmii_rxc',
          delayType: 'input',
          minNs: 1.0,
          maxNs: 2.8,
          clockFall: false,
          addDelay: false,
        },
        {
          id: 'rgmii_rxd_fall',
          portName: '[get_ports {rgmii_rxd[*]}]',
          clockName: 'rgmii_rxc',
          delayType: 'input',
          minNs: 1.0,
          maxNs: 2.8,
          clockFall: true,
          addDelay: true,
        },
      ],
      multicycles: [],
      falsePaths: [
        {
          id: 'fp_phy_rst',
          from: '[get_ports phy_rst_n]',
          through: '',
          to: '',
          comment: 'PHY hard reset signal',
        },
      ],
    },
  },
];

// ----------------------------------------------------
// SDC CODE GENERATOR
// ----------------------------------------------------

export function generateSdcCode(state: SdcStudioState, vendor: VendorFormat = 'synopsys'): string {
  const lines: string[] = [];

  // Header
  const dateStr = new Date().toISOString().split('T')[0];
  lines.push(`################################################################################`);
  lines.push(`# SDC (Synopsys Design Constraints) File`);
  lines.push(`# Target Vendor Format : ${vendor.toUpperCase()}`);
  lines.push(`# Generated by         : ACE-SEEK Advanced SDC Constraint Studio`);
  lines.push(`# Date Created         : ${dateStr}`);
  lines.push(`################################################################################\n`);

  // 1. Primary Clocks & Virtual Clocks
  lines.push(`// =============================================================================`);
  lines.push(`// 1. PRIMARY & VIRTUAL CLOCK DEFINITIONS`);
  lines.push(`// =============================================================================`);

  if (state.primaryClocks.length === 0) {
    lines.push(`# (No primary clocks defined)\n`);
  } else {
    for (const clk of state.primaryClocks) {
      if (clk.isVirtual) {
        lines.push(`# Virtual Clock: ${clk.name}`);
        lines.push(`create_clock -name ${clk.name} -period ${clk.periodNs.toFixed(3)} -waveform {${clk.waveformRising.toFixed(3)} ${clk.waveformFalling.toFixed(3)}}`);
      } else {
        lines.push(`# Primary Clock: ${clk.name} (${(1000 / clk.periodNs).toFixed(1)} MHz)`);
        const rawTarget = clk.targets ? clk.targets.trim() : clk.name;
        const targetStr = rawTarget.startsWith('[') ? rawTarget : `[get_ports ${rawTarget}]`;
        lines.push(`create_clock -name ${clk.name} -period ${clk.periodNs.toFixed(3)} -waveform {${clk.waveformRising.toFixed(3)} ${clk.waveformFalling.toFixed(3)}} ${targetStr}`);
      }

      // Latency & Uncertainty
      if (clk.uncertaintySetup > 0 || clk.uncertaintyHold > 0) {
        if (vendor === 'xilinx') {
          lines.push(`set_system_jitter ${clk.uncertaintySetup.toFixed(3)}`);
        } else if (clk.uncertaintySetup === clk.uncertaintyHold) {
          lines.push(`set_clock_uncertainty ${clk.uncertaintySetup.toFixed(3)} [get_clocks ${clk.name}]`);
        } else {
          lines.push(`set_clock_uncertainty -setup ${clk.uncertaintySetup.toFixed(3)} [get_clocks ${clk.name}]`);
          lines.push(`set_clock_uncertainty -hold ${clk.uncertaintyHold.toFixed(3)} [get_clocks ${clk.name}]`);
        }
      }

      if (clk.latencySource > 0) {
        lines.push(`set_clock_latency -source ${clk.latencySource.toFixed(3)} [get_clocks ${clk.name}]`);
      }
      if (clk.latencyNetwork > 0) {
        lines.push(`set_clock_latency ${clk.latencyNetwork.toFixed(3)} [get_clocks ${clk.name}]`);
      }
      lines.push(``);
    }
  }

  // 2. Generated Clocks
  lines.push(`// =============================================================================`);
  lines.push(`// 2. GENERATED CLOCKS`);
  lines.push(`// =============================================================================`);

  if (state.generatedClocks.length === 0) {
    lines.push(`# (No generated clocks defined)\n`);
  } else {
    for (const gclk of state.generatedClocks) {
      const masterClk = state.primaryClocks.find((c) => c.id === gclk.masterClockId);
      const masterName = masterClk ? masterClk.name : gclk.masterClockId;
      lines.push(`# Generated Clock: ${gclk.name} (from ${masterName})`);

      let cmd = `create_generated_clock -name ${gclk.name}`;
      if (gclk.sourcePin) {
        cmd += ` -source ${gclk.sourcePin}`;
      }
      if (gclk.divideBy > 1) {
        cmd += ` -divide_by ${gclk.divideBy}`;
      }
      if (gclk.multiplyBy > 1) {
        cmd += ` -multiply_by ${gclk.multiplyBy}`;
      }
      if (gclk.invert) {
        cmd += ` -invert`;
      }
      cmd += ` ${gclk.targets || '[get_pins u_gen_clk/Q]'}`;
      lines.push(cmd);
      lines.push(``);
    }
  }

  // 3. Clock Groups & CDC Relationships
  lines.push(`// =============================================================================`);
  lines.push(`// 3. CLOCK GROUPS & CDC RELATIONSHIPS`);
  lines.push(`// =============================================================================`);

  const activeClockNames = new Set([
    ...state.primaryClocks.map((c) => c.name),
    ...state.generatedClocks.map((g) => g.name),
  ]);

  const activeClockGroups = state.clockGroups.filter((cg) => {
    const g1Active = cg.group1Clocks.filter((c) => activeClockNames.has(c));
    const g2Active = cg.group2Clocks.filter((c) => activeClockNames.has(c));
    return g1Active.length > 0 && g2Active.length > 0;
  });

  if (activeClockGroups.length === 0) {
    lines.push(`# (No clock group interactions configured)\n`);
  } else {
    for (const cg of activeClockGroups) {
      const g1Active = cg.group1Clocks.filter((c) => activeClockNames.has(c));
      const g2Active = cg.group2Clocks.filter((c) => activeClockNames.has(c));
      const g1 = g1Active.map((c) => `[get_clocks ${c}]`).join(' ');
      const g2 = g2Active.map((c) => `[get_clocks ${c}]`).join(' ');
      lines.push(`# Clock Group Relationship: ${cg.relationType.toUpperCase()}`);

      if (vendor === 'xilinx') {
        lines.push(`set_clock_groups -${cg.relationType} -group { ${g1} } -group { ${g2} }`);
      } else {
        lines.push(`set_clock_groups -${cg.relationType} -group [list ${g1}] -group [list ${g2}]`);
      }
      lines.push(``);
    }
  }

  // 4. Input & Output Constraints
  lines.push(`// =============================================================================`);
  lines.push(`// 4. INPUT & OUTPUT DELAY CONSTRAINTS`);
  lines.push(`// =============================================================================`);

  if (state.ioConstraints.length === 0) {
    lines.push(`# (No I/O constraints defined)\n`);
  } else {
    for (const io of state.ioConstraints) {
      const isInput = io.delayType === 'input';
      const cmdBase = isInput ? 'set_input_delay' : 'set_output_delay';
      const fallFlag = io.clockFall ? ' -clock_fall' : '';
      const addFlag = io.addDelay ? ' -add_delay' : '';

      lines.push(`# ${isInput ? 'Input' : 'Output'} Delay: ${io.portName} (ref clk: ${io.clockName})`);

      if (io.minNs === io.maxNs) {
        lines.push(`${cmdBase} -clock [get_clocks ${io.clockName}]${fallFlag}${addFlag} ${io.maxNs.toFixed(3)} ${io.portName}`);
      } else {
        lines.push(`${cmdBase} -clock [get_clocks ${io.clockName}] -max${fallFlag}${addFlag} ${io.maxNs.toFixed(3)} ${io.portName}`);
        lines.push(`${cmdBase} -clock [get_clocks ${io.clockName}] -min${fallFlag}${addFlag} ${io.minNs.toFixed(3)} ${io.portName}`);
      }

      if (io.drivingCell && isInput) {
        const pinStr = io.drivingPin ? ` -pin ${io.drivingPin}` : '';
        lines.push(`set_driving_cell -lib_cell ${io.drivingCell}${pinStr} ${io.portName}`);
      }
      if (io.loadPf !== undefined && io.loadPf > 0 && !isInput) {
        lines.push(`set_load ${io.loadPf.toFixed(2)} ${io.portName}`);
      }
      lines.push(``);
    }
  }

  // 5. Timing Exceptions
  lines.push(`// =============================================================================`);
  lines.push(`// 5. TIMING EXCEPTIONS (MULTICYCLE & FALSE PATHS)`);
  lines.push(`// =============================================================================`);

  if (state.multicycles.length === 0 && state.falsePaths.length === 0) {
    lines.push(`# (No timing exceptions defined)\n`);
  } else {
    // Multicycle paths
    for (const mcp of state.multicycles) {
      const edgeFlag = mcp.edge === 'start' ? ' -start' : '';
      const fromStr = mcp.from ? ` -from ${mcp.from}` : '';
      const throughStr = mcp.through ? ` -through ${mcp.through}` : '';
      const toStr = mcp.to ? ` -to ${mcp.to}` : '';

      lines.push(`# Multicycle Path: Setup ${mcp.cycles} cycles, Hold ${mcp.holdCycles ?? (mcp.cycles - 1)} cycles`);
      lines.push(`set_multicycle_path ${mcp.cycles} -setup${edgeFlag}${fromStr}${throughStr}${toStr}`);

      const holdVal = mcp.holdCycles !== undefined ? mcp.holdCycles : (mcp.cycles - 1);
      lines.push(`set_multicycle_path ${holdVal} -hold${edgeFlag}${fromStr}${throughStr}${toStr}`);
      lines.push(``);
    }

    // False paths
    for (const fp of state.falsePaths) {
      if (fp.comment) lines.push(`# ${fp.comment}`);
      let cmd = `set_false_path`;
      if (fp.from) cmd += ` -from ${fp.from}`;
      if (fp.through) cmd += ` -through ${fp.through}`;
      if (fp.to) cmd += ` -to ${fp.to}`;
      lines.push(cmd);
      lines.push(``);
    }
  }

  lines.push(`// =============================================================================`);
  lines.push(`// END OF SDC CONSTRAINTS`);
  lines.push(`// =============================================================================`);

  return lines.join('\n');
}

// ----------------------------------------------------
// SDC LINTER ENGINE
// ----------------------------------------------------

export function lintSdcState(state: SdcStudioState): LintMessage[] {
  const msgs: LintMessage[] = [];

  // 1. Clock checks
  if (state.primaryClocks.length === 0) {
    msgs.push({
      id: 'err_no_clocks',
      severity: 'error',
      title: 'No Primary Clocks Defined',
      message: 'Every SDC file requires at least one primary or virtual clock for static timing analysis.',
      category: 'clock',
    });
  }

  for (const clk of state.primaryClocks) {
    if (!clk.isVirtual && !clk.targets.trim()) {
      msgs.push({
        id: `warn_clk_notarget_${clk.id}`,
        severity: 'warning',
        title: `Clock "${clk.name}" Missing Target Object`,
        message: 'Primary physical clocks should specify target port/pin (e.g., [get_ports clk_in]).',
        category: 'clock',
      });
    }
    if (clk.periodNs <= 0) {
      msgs.push({
        id: `err_clk_period_${clk.id}`,
        severity: 'error',
        title: `Clock "${clk.name}" Invalid Period`,
        message: 'Clock period must be greater than 0 ns.',
        category: 'clock',
      });
    }
  }

  // 2. Generated Clock checks
  for (const gclk of state.generatedClocks) {
    const masterExists = state.primaryClocks.some((c) => c.id === gclk.masterClockId || c.name === gclk.masterClockId);
    if (!masterExists) {
      msgs.push({
        id: `err_gclk_nomaster_${gclk.id}`,
        severity: 'error',
        title: `Generated Clock "${gclk.name}" Orphan Master`,
        message: `Master clock "${gclk.masterClockId}" does not exist in primary clocks list.`,
        category: 'clock',
      });
    }
  }

  // 3. I/O Constraints checks
  const allClockNames = new Set([
    ...state.primaryClocks.map((c) => c.name),
    ...state.generatedClocks.map((c) => c.name),
  ]);

  for (const io of state.ioConstraints) {
    if (!allClockNames.has(io.clockName)) {
      msgs.push({
        id: `err_io_noclk_${io.id}`,
        severity: 'error',
        title: `I/O Constraint for "${io.portName}" Reference Clock Invalid`,
        message: `Reference clock "${io.clockName}" is not defined in current clocks.`,
        category: 'io',
      });
    }
    if (io.minNs > io.maxNs) {
      msgs.push({
        id: `err_io_minmax_${io.id}`,
        severity: 'error',
        title: `I/O Constraint "${io.portName}" Min > Max Delay`,
        message: `Minimum delay (${io.minNs}ns) cannot exceed maximum delay (${io.maxNs}ns).`,
        category: 'io',
      });
    }
  }

  // 4. Multicycle path check
  const hasSetupMcp = state.multicycles.filter((m) => m.type === 'setup');
  const hasHoldMcp = state.multicycles.filter((m) => m.type === 'hold');

  for (const setupMcp of hasSetupMcp) {
    if (setupMcp.cycles > 1) {
      const matchingHold = hasHoldMcp.find(
        (h) => h.from === setupMcp.from && h.to === setupMcp.to
      );
      if (!matchingHold) {
        msgs.push({
          id: `warn_mcp_missing_hold_${setupMcp.id}`,
          severity: 'warning',
          title: `Multicycle Setup (${setupMcp.cycles}) Missing Hold Constraint`,
          message: `When setting setup multicycle to ${setupMcp.cycles}, you usually need a hold multicycle of ${setupMcp.cycles - 1} cycles to avoid overly strict hold timing checks.`,
          category: 'exception',
        });
      }
    }
  }

  // 5. Precedence / Masking conflict check
  if (state.clockGroups.length > 0 && state.falsePaths.length > 0) {
    msgs.push({
      id: `info_precedence_check`,
      severity: 'info',
      title: `SDC Precedence Applied`,
      message: `Remember that 'set_clock_groups' has higher priority than 'set_false_path'. Cross-clock paths between cut clock domains will be ignored by STA regardless of explicit false paths.`,
      category: 'cdc',
    });
  }

  return msgs;
}

// ----------------------------------------------------
// SIMPLE SDC TEXT PARSER (IMPORT)
// ----------------------------------------------------

export function parseSdcText(rawText: string): SdcStudioState {
  const lines = rawText.split('\n');
  const state: SdcStudioState = {
    primaryClocks: [],
    generatedClocks: [],
    clockGroups: [],
    ioConstraints: [],
    multicycles: [],
    falsePaths: [],
  };

  let clkCounter = 1;
  let ioCounter = 1;
  let mcpCounter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    if (trimmed.startsWith('create_clock')) {
      const nameMatch = trimmed.match(/-name\s+([^\s]+)/);
      const periodMatch = trimmed.match(/-period\s+([0-9.]+)/);
      const name = nameMatch ? nameMatch[1] : `clk_${clkCounter++}`;
      const periodNs = periodMatch ? parseFloat(periodMatch[1]) : 10.0;
      const isVirtual = !trimmed.includes('[get_ports') && !trimmed.includes('[get_pins');

      let targets = '';
      const portMatch = trimmed.match(/(\[get_ports[^\]]+\]|\[get_pins[^\]]+\]|[^\s]+$)/);
      if (portMatch && !portMatch[1].startsWith('-')) {
        targets = portMatch[1];
      }

      state.primaryClocks.push({
        id: `parsed_${name}`,
        name,
        periodNs,
        waveformRising: 0,
        waveformFalling: periodNs / 2,
        targets,
        isVirtual,
        uncertaintySetup: 0.1,
        uncertaintyHold: 0.05,
        latencySource: 0,
        latencyNetwork: 0,
      });
    }

    if (trimmed.startsWith('set_input_delay') || trimmed.startsWith('set_output_delay')) {
      const delayType = trimmed.startsWith('set_input_delay') ? 'input' : 'output';
      const clkMatch = trimmed.match(/-clock\s+\[get_clocks\s+([^\s\]]+)\]/) || trimmed.match(/-clock\s+([^\s]+)/);
      const valMatch = trimmed.match(/\s([0-9.]+)\s+([^\s]+)$/);

      const clockName = clkMatch ? clkMatch[1] : 'clk_sys';
      const delayVal = valMatch ? parseFloat(valMatch[1]) : 1.0;
      const portName = valMatch ? valMatch[2] : 'port_in';

      state.ioConstraints.push({
        id: `parsed_io_${ioCounter++}`,
        portName,
        clockName,
        delayType,
        minNs: delayVal * 0.5,
        maxNs: delayVal,
        clockFall: trimmed.includes('-clock_fall'),
        addDelay: trimmed.includes('-add_delay'),
      });
    }

    if (trimmed.startsWith('set_false_path')) {
      const fromMatch = trimmed.match(/-from\s+([^\s]+)/);
      const throughMatch = trimmed.match(/-through\s+([^\s]+)/);
      const toMatch = trimmed.match(/-to\s+([^\s]+)/);

      state.falsePaths.push({
        id: `parsed_fp_${mcpCounter++}`,
        from: fromMatch ? fromMatch[1] : '',
        through: throughMatch ? throughMatch[1] : '',
        to: toMatch ? toMatch[1] : '',
        comment: 'Imported from raw SDC',
      });
    }
  }

  if (state.primaryClocks.length === 0) {
    state.primaryClocks = DEFAULT_SDC_STATE.primaryClocks;
  }

  return state;
}
