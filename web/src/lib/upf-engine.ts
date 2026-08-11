/**
 * Ace-Seek VLSI Power Studio — IEEE 1801 UPF Engine
 *
 * Multi-vendor power-intent model / generate / parse / lint.
 * Preset includes pad_top-style always-on + switched core (lab-inspired).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UpfVersion = "2.0" | "2.1" | "3.0";
export type ClampValue = "0" | "1" | "latch" | "Z";
export type IsolationSense = "high" | "low";
export type IsolationLocation = "self" | "parent" | "fanout" | "fanin" | "automatic";
export type AppliesTo = "outputs" | "inputs" | "both";

export interface SupplyNet {
  id: string;
  name: string;
  /** true if rail can be OFF in some PST state */
  switchable?: boolean;
}

export interface SupplyPort {
  id: string;
  name: string;
  direction?: "in" | "out";
}

export interface SupplyConnection {
  id: string;
  netName: string;
  portNames: string[];
}

export interface PowerDomain {
  id: string;
  name: string;
  /** catch-all current scope (always-on shell) */
  includeScope?: boolean;
  /** hierarchical instances e.g. u_core */
  elements: string[];
  primaryPowerNet?: string;
  primaryGroundNet?: string;
  /** documentation only */
  alwaysOn?: boolean;
}

export interface PowerSwitch {
  id: string;
  name: string;
  domainName: string;
  inputSupplyPort: { port: string; net: string };
  outputSupplyPort: { port: string; net: string };
  controlPort: { port: string; net: string };
  onState: { name: string; input: string; controlExpr: string };
  offState: { name: string; controlExpr: string };
}

export interface LogicPort {
  id: string;
  name: string;
  direction: "in" | "out" | "inout";
}

export interface LogicNet {
  id: string;
  name: string;
  portNames: string[];
}

export interface IsolationStrategy {
  id: string;
  name: string;
  domainName: string;
  appliesTo: AppliesTo;
  clampValue: ClampValue;
  isolationPowerNet?: string;
  isolationGroundNet?: string;
  elements?: string[];
  /** control */
  isolationSignal?: string;
  isolationSense?: IsolationSense;
  location?: IsolationLocation;
}

export interface RetentionStrategy {
  id: string;
  name: string;
  domainName: string;
  saveSignal?: string;
  restoreSignal?: string;
  retentionPowerNet?: string;
  retentionGroundNet?: string;
  elements?: string[];
}

export interface LevelShifterStrategy {
  id: string;
  name: string;
  domainName: string;
  appliesTo: AppliesTo;
  rule?: "low_to_high" | "high_to_low" | "both";
  location?: IsolationLocation;
  inputSupplyNet?: string;
  outputSupplyNet?: string;
}

export interface PortState {
  id: string;
  supplyName: string;
  states: Array<{ name: string; nom?: number | "off" | string }>;
}

export interface PstTable {
  id: string;
  name: string;
  supplies: string[];
  states: Array<{ name: string; values: string[] }>;
}

export interface PortAttribute {
  id: string;
  ports: string[];
  driverSupply?: string;
  receiverSupply?: string;
}

export interface UpfLintMessage {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  recommendation: string;
}

export interface UpfState {
  version: UpfVersion;
  designName: string;
  supplyNets: SupplyNet[];
  supplyPorts: SupplyPort[];
  connections: SupplyConnection[];
  domains: PowerDomain[];
  switches: PowerSwitch[];
  logicPorts: LogicPort[];
  logicNets: LogicNet[];
  isolations: IsolationStrategy[];
  retentions: RetentionStrategy[];
  levelShifters: LevelShifterStrategy[];
  portStates: PortState[];
  pst: PstTable[];
  portAttributes: PortAttribute[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyUpfState(designName = "top"): UpfState {
  return {
    version: "2.0",
    designName,
    supplyNets: [],
    supplyPorts: [],
    connections: [],
    domains: [],
    switches: [],
    logicPorts: [],
    logicNets: [],
    isolations: [],
    retentions: [],
    levelShifters: [],
    portStates: [],
    pst: [],
    portAttributes: [],
  };
}

export function normalizeUpfState(raw: Partial<UpfState> | UpfState): UpfState {
  return {
    version: raw.version || "2.0",
    designName: raw.designName || "top",
    supplyNets: raw.supplyNets ? [...raw.supplyNets] : [],
    supplyPorts: raw.supplyPorts ? [...raw.supplyPorts] : [],
    connections: raw.connections ? [...raw.connections] : [],
    domains: (raw.domains || []).map((d) => ({
      ...d,
      elements: d.elements ? [...d.elements] : [],
    })),
    switches: raw.switches ? [...raw.switches] : [],
    logicPorts: raw.logicPorts ? [...raw.logicPorts] : [],
    logicNets: (raw.logicNets || []).map((n) => ({
      ...n,
      portNames: n.portNames ? [...n.portNames] : [],
    })),
    isolations: raw.isolations ? [...raw.isolations] : [],
    retentions: raw.retentions ? [...raw.retentions] : [],
    levelShifters: raw.levelShifters ? [...raw.levelShifters] : [],
    portStates: (raw.portStates || []).map((p) => ({
      ...p,
      states: p.states ? [...p.states] : [],
    })),
    pst: (raw.pst || []).map((t) => ({
      ...t,
      supplies: [...(t.supplies || [])],
      states: (t.states || []).map((s) => ({
        ...s,
        values: [...(s.values || [])],
      })),
    })),
    portAttributes: (raw.portAttributes || []).map((a) => ({
      ...a,
      ports: [...(a.ports || [])],
    })),
    notes: raw.notes,
  };
}

// ---------------------------------------------------------------------------
// pad_top practice preset (Genus lab)
// ---------------------------------------------------------------------------

/** Always-on pad shell + switchable u_core — matches pad_top_practice.upf intent */
export function padTopPracticeState(): UpfState {
  return {
    version: "2.0",
    designName: "pad_top",
    notes:
      "Practice UPF: PD_TOP always-on (pads/shell), PD_CORE = u_core via VDD_CORE switch. Same voltage → no level shifters. Isolation clamps core outputs when SLEEP.",
    supplyNets: [
      { id: "n_vdd", name: "VDD" },
      { id: "n_vss", name: "VSS" },
      { id: "n_vdd_core", name: "VDD_CORE", switchable: true },
    ],
    supplyPorts: [
      { id: "p_vdd", name: "VDD", direction: "in" },
      { id: "p_vss", name: "VSS", direction: "in" },
    ],
    connections: [
      { id: "c1", netName: "VDD", portNames: ["VDD"] },
      { id: "c2", netName: "VSS", portNames: ["VSS"] },
    ],
    domains: [
      {
        id: "d_top",
        name: "PD_TOP",
        includeScope: true,
        elements: [],
        primaryPowerNet: "VDD",
        primaryGroundNet: "VSS",
        alwaysOn: true,
      },
      {
        id: "d_core",
        name: "PD_CORE",
        elements: ["u_core"],
        primaryPowerNet: "VDD_CORE",
        primaryGroundNet: "VSS",
        alwaysOn: false,
      },
    ],
    switches: [
      {
        id: "sw1",
        name: "sw_core",
        domainName: "PD_CORE",
        inputSupplyPort: { port: "vin", net: "VDD" },
        outputSupplyPort: { port: "vout", net: "VDD_CORE" },
        controlPort: { port: "c", net: "sw_core_ctrl" },
        onState: { name: "on_state", input: "vin", controlExpr: "c" },
        offState: { name: "off_state", controlExpr: "!c" },
      },
    ],
    logicPorts: [{ id: "lp1", name: "sw_core_ctrl", direction: "in" }],
    logicNets: [
      { id: "ln1", name: "sw_core_ctrl", portNames: ["sw_core_ctrl"] },
    ],
    isolations: [
      {
        id: "iso1",
        name: "iso_core_out",
        domainName: "PD_CORE",
        appliesTo: "outputs",
        clampValue: "0",
        isolationPowerNet: "VDD",
        isolationGroundNet: "VSS",
        isolationSignal: "sw_core_ctrl",
        isolationSense: "low",
        location: "self",
      },
    ],
    retentions: [],
    levelShifters: [],
    portStates: [
      {
        id: "ps1",
        supplyName: "VDD",
        states: [{ name: "ON", nom: 0.72 }],
      },
      {
        id: "ps2",
        supplyName: "VSS",
        states: [{ name: "ON", nom: 0.0 }],
      },
      {
        id: "ps3",
        supplyName: "VDD_CORE",
        states: [
          { name: "ON", nom: 0.72 },
          { name: "OFF", nom: "off" },
        ],
      },
    ],
    pst: [
      {
        id: "pst1",
        name: "pst_pad_top",
        supplies: ["VDD", "VSS", "VDD_CORE"],
        states: [
          { name: "RUN", values: ["ON", "ON", "ON"] },
          { name: "SLEEP", values: ["ON", "ON", "OFF"] },
        ],
      },
    ],
    portAttributes: [],
  };
}

/** Dual-rail always-on + switched island with retention skeleton */
export function dualRailRetentionState(): UpfState {
  const base = emptyUpfState("chip_top");
  return {
    ...base,
    notes: "Dual always-on VDD/VDDIO + switchable VDD_CPU with retention placeholders.",
    supplyNets: [
      { id: "n1", name: "VDD" },
      { id: "n2", name: "VSS" },
      { id: "n3", name: "VDDIO" },
      { id: "n4", name: "VDD_CPU", switchable: true },
    ],
    supplyPorts: [
      { id: "p1", name: "VDD" },
      { id: "p2", name: "VSS" },
      { id: "p3", name: "VDDIO" },
    ],
    connections: [
      { id: "c1", netName: "VDD", portNames: ["VDD"] },
      { id: "c2", netName: "VSS", portNames: ["VSS"] },
      { id: "c3", netName: "VDDIO", portNames: ["VDDIO"] },
    ],
    domains: [
      {
        id: "d_ao",
        name: "PD_AO",
        includeScope: true,
        elements: [],
        primaryPowerNet: "VDD",
        primaryGroundNet: "VSS",
        alwaysOn: true,
      },
      {
        id: "d_cpu",
        name: "PD_CPU",
        elements: ["u_cpu"],
        primaryPowerNet: "VDD_CPU",
        primaryGroundNet: "VSS",
      },
    ],
    switches: [
      {
        id: "sw1",
        name: "sw_cpu",
        domainName: "PD_CPU",
        inputSupplyPort: { port: "vin", net: "VDD" },
        outputSupplyPort: { port: "vout", net: "VDD_CPU" },
        controlPort: { port: "c", net: "cpu_pg_en" },
        onState: { name: "on", input: "vin", controlExpr: "c" },
        offState: { name: "off", controlExpr: "!c" },
      },
    ],
    logicPorts: [{ id: "lp1", name: "cpu_pg_en", direction: "in" }],
    logicNets: [{ id: "ln1", name: "cpu_pg_en", portNames: ["cpu_pg_en"] }],
    isolations: [
      {
        id: "iso1",
        name: "iso_cpu_out",
        domainName: "PD_CPU",
        appliesTo: "outputs",
        clampValue: "0",
        isolationPowerNet: "VDD",
        isolationGroundNet: "VSS",
        isolationSignal: "cpu_pg_en",
        isolationSense: "low",
        location: "self",
      },
    ],
    retentions: [
      {
        id: "ret1",
        name: "ret_cpu",
        domainName: "PD_CPU",
        saveSignal: "cpu_save",
        restoreSignal: "cpu_restore",
        retentionPowerNet: "VDD",
        retentionGroundNet: "VSS",
      },
    ],
    levelShifters: [
      {
        id: "ls1",
        name: "ls_io",
        domainName: "PD_AO",
        appliesTo: "both",
        rule: "both",
        location: "self",
        inputSupplyNet: "VDD",
        outputSupplyNet: "VDDIO",
      },
    ],
    portStates: [
      { id: "ps1", supplyName: "VDD", states: [{ name: "ON", nom: 0.8 }] },
      { id: "ps2", supplyName: "VSS", states: [{ name: "ON", nom: 0 }] },
      { id: "ps3", supplyName: "VDDIO", states: [{ name: "ON", nom: 1.8 }] },
      {
        id: "ps4",
        supplyName: "VDD_CPU",
        states: [
          { name: "ON", nom: 0.8 },
          { name: "OFF", nom: "off" },
        ],
      },
    ],
    pst: [
      {
        id: "pst1",
        name: "pst_chip",
        supplies: ["VDD", "VSS", "VDDIO", "VDD_CPU"],
        states: [
          { name: "RUN", values: ["ON", "ON", "ON", "ON"] },
          { name: "SLEEP", values: ["ON", "ON", "ON", "OFF"] },
        ],
      },
    ],
    portAttributes: [],
  };
}

export const UPF_PRESETS: {
  name: string;
  description: string;
  state: UpfState;
}[] = [
  {
    name: "Always-on + switched core (pad-style)",
    description:
      "PD_TOP always-on + PD_CORE (u_core) switched rail, isolation clamp-0, PST RUN/SLEEP. No level shifters.",
    state: padTopPracticeState(),
  },
  {
    name: "Dual-rail + retention skeleton",
    description:
      "AO + VDDIO + switched CPU domain with retention and level-shifter placeholders.",
    state: dualRailRetentionState(),
  },
  {
    name: "Blank page template",
    description: "Empty UPF 2.0 shell — configure supplies, domains, switch, ISO, PST.",
    state: emptyUpfState("top"),
  },
];

export const DEFAULT_UPF_STATE: UpfState = padTopPracticeState();

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

function braceList(items: string[]): string {
  if (!items.length) return "{}";
  return `{${items.join(" ")}}`;
}

/** IEEE 1801 UPF text (tool-agnostic body; works with Cadence / Synopsys / others) */
export function generateUpf(
  state: UpfState,
  _opts?: { includeToolComments?: boolean }
): string {
  const s = normalizeUpfState(state);
  const lines: string[] = [];

  lines.push("################################################################################");
  lines.push(`# UPF (IEEE 1801) — ${s.designName}`);
  lines.push("# Generated by Ace-Seek Power Studio");
  if (s.notes) lines.push(`# ${s.notes}`);
  lines.push("################################################################################");
  lines.push("");
  lines.push(`upf_version ${s.version}`);
  lines.push("");

  // Supplies
  lines.push("# --- Supply nets ---");
  s.supplyNets.forEach((n) => {
    lines.push(`create_supply_net ${n.name}`);
  });
  lines.push("");
  lines.push("# --- Supply ports ---");
  s.supplyPorts.forEach((p) => {
    lines.push(`create_supply_port ${p.name}`);
  });
  lines.push("");
  lines.push("# --- Connect supplies ---");
  s.connections.forEach((c) => {
    lines.push(
      `connect_supply_net ${c.netName} -ports ${braceList(c.portNames)}`
    );
  });
  lines.push("");

  // Domains (create then set supply — safer order)
  lines.push("# --- Power domains ---");
  s.domains.forEach((d) => {
    if (d.includeScope) {
      lines.push(`create_power_domain ${d.name} -include_scope`);
    } else if (d.elements.length) {
      lines.push(
        `create_power_domain ${d.name} -elements ${braceList(d.elements)}`
      );
    } else {
      lines.push(`create_power_domain ${d.name}`);
    }
    if (d.primaryPowerNet || d.primaryGroundNet) {
      lines.push(`set_domain_supply_net ${d.name} \\`);
      lines.push(
        `  -primary_power_net  ${d.primaryPowerNet || "VDD"} \\`
      );
      lines.push(`  -primary_ground_net ${d.primaryGroundNet || "VSS"}`);
    }
    lines.push("");
  });

  // Switches + logic
  if (s.switches.length) {
    lines.push("# --- Power switches ---");
    s.switches.forEach((sw) => {
      lines.push(`create_power_switch ${sw.name} \\`);
      lines.push(`  -domain ${sw.domainName} \\`);
      lines.push(
        `  -input_supply_port  {${sw.inputSupplyPort.port} ${sw.inputSupplyPort.net}} \\`
      );
      lines.push(
        `  -output_supply_port {${sw.outputSupplyPort.port} ${sw.outputSupplyPort.net}} \\`
      );
      lines.push(
        `  -control_port       {${sw.controlPort.port} ${sw.controlPort.net}} \\`
      );
      lines.push(
        `  -on_state  {${sw.onState.name} ${sw.onState.input} {${sw.onState.controlExpr}}} \\`
      );
      lines.push(
        `  -off_state {${sw.offState.name} {${sw.offState.controlExpr}}}`
      );
      lines.push("");
    });
  }

  if (s.logicPorts.length || s.logicNets.length) {
    lines.push("# --- Logic control ports/nets ---");
    s.logicPorts.forEach((lp) => {
      lines.push(
        `create_logic_port -direction ${lp.direction} ${lp.name}`
      );
    });
    s.logicNets.forEach((ln) => {
      lines.push(`create_logic_net ${ln.name}`);
      if (ln.portNames.length) {
        lines.push(
          `connect_logic_net ${ln.name} -ports ${braceList(ln.portNames)}`
        );
      }
    });
    lines.push("");
  }

  // Isolation
  if (s.isolations.length) {
    lines.push("# --- Isolation ---");
    s.isolations.forEach((iso) => {
      let cmd = `set_isolation ${iso.name} \\\n  -domain ${iso.domainName} -applies_to ${iso.appliesTo} -clamp_value ${iso.clampValue}`;
      if (iso.isolationPowerNet)
        cmd += ` \\\n  -isolation_power_net ${iso.isolationPowerNet}`;
      if (iso.isolationGroundNet)
        cmd += ` \\\n  -isolation_ground_net ${iso.isolationGroundNet}`;
      if (iso.elements?.length)
        cmd += ` \\\n  -elements ${braceList(iso.elements)}`;
      lines.push(cmd);
      if (iso.isolationSignal) {
        lines.push(`set_isolation_control ${iso.name} \\`);
        lines.push(`  -domain ${iso.domainName} \\`);
        lines.push(`  -isolation_signal ${iso.isolationSignal} \\`);
        lines.push(
          `  -isolation_sense ${iso.isolationSense || "low"} \\`
        );
        lines.push(`  -location ${iso.location || "self"}`);
      }
      lines.push("");
    });
  }

  // Level shifters
  if (s.levelShifters.length) {
    lines.push("# --- Level shifters ---");
    s.levelShifters.forEach((ls) => {
      let cmd = `set_level_shifter ${ls.name} \\\n  -domain ${ls.domainName} -applies_to ${ls.appliesTo}`;
      if (ls.rule) cmd += ` \\\n  -rule ${ls.rule}`;
      if (ls.location) cmd += ` \\\n  -location ${ls.location}`;
      if (ls.inputSupplyNet)
        cmd += ` \\\n  -input_supply_net ${ls.inputSupplyNet}`;
      if (ls.outputSupplyNet)
        cmd += ` \\\n  -output_supply_net ${ls.outputSupplyNet}`;
      lines.push(cmd);
      lines.push("");
    });
  }

  // Retention
  if (s.retentions.length) {
    lines.push("# --- Retention ---");
    s.retentions.forEach((r) => {
      let cmd = `set_retention ${r.name} \\\n  -domain ${r.domainName}`;
      if (r.retentionPowerNet)
        cmd += ` \\\n  -retention_power_net ${r.retentionPowerNet}`;
      if (r.retentionGroundNet)
        cmd += ` \\\n  -retention_ground_net ${r.retentionGroundNet}`;
      if (r.elements?.length)
        cmd += ` \\\n  -elements ${braceList(r.elements)}`;
      lines.push(cmd);
      if (r.saveSignal || r.restoreSignal) {
        lines.push(`set_retention_control ${r.name} \\`);
        lines.push(`  -domain ${r.domainName} \\`);
        if (r.saveSignal)
          lines.push(`  -save_signal {${r.saveSignal} high} \\`);
        if (r.restoreSignal)
          lines.push(`  -restore_signal {${r.restoreSignal} high}`);
      }
      lines.push("");
    });
  }

  // Port states + PST
  if (s.portStates.length) {
    lines.push("# --- Supply port states ---");
    s.portStates.forEach((ps) => {
      const parts = ps.states.map((st) => {
        const nom =
          st.nom === "off" || st.nom === undefined
            ? st.nom === "off"
              ? "off"
              : ""
            : String(st.nom);
        return nom === "off" || nom === ""
          ? `{${st.name} ${nom || "off"}}`
          : `{${st.name} ${nom}}`;
      });
      // add_port_state VDD -state {ON 0.72} -state {OFF off}
      let line = `add_port_state ${ps.supplyName}`;
      parts.forEach((p) => {
        line += ` -state ${p}`;
      });
      lines.push(line);
    });
    lines.push("");
  }

  if (s.pst.length) {
    lines.push("# --- Power state table ---");
    s.pst.forEach((t) => {
      lines.push(
        `create_pst ${t.name} -supplies ${braceList(t.supplies)}`
      );
      t.states.forEach((st) => {
        lines.push(
          `add_pst_state ${st.name} -pst ${t.name} -state ${braceList(st.values)}`
        );
      });
      lines.push("");
    });
  }

  // Port attributes
  if (s.portAttributes.length) {
    lines.push("# --- Port attributes ---");
    s.portAttributes.forEach((pa) => {
      let cmd = `set_port_attributes -ports ${braceList(pa.ports)}`;
      if (pa.driverSupply) cmd += ` \\\n  -driver_supply ${pa.driverSupply}`;
      if (pa.receiverSupply)
        cmd += ` \\\n  -receiver_supply ${pa.receiverSupply}`;
      lines.push(cmd);
      lines.push("");
    });
  }

  lines.push("# End of UPF");
  lines.push("");
  return lines.join("\n");
}

/** Genus flow snippet for this design */
export function generateGenusPowerIntentTcl(
  designName: string,
  upfPath = "pad_top_practice.upf"
): string {
  return [
    `################################################################################`,
    `# Genus power-intent sequence — ${designName}`,
    `# Ace-Seek Power Studio`,
    `################################################################################`,
    ``,
    `elaborate ${designName}`,
    ``,
    `read_power_intent -1801 -module ${designName} -verbose ${upfPath}`,
    `apply_power_intent -design ${designName} -summary`,
    `check_power_intent -design ${designName} -detail > check_power_intent.rpt`,
    ``,
    `report_power_intent -summary`,
    `report_power_intent -power_domain_only > power_intent_domains.rpt`,
    `report_power_intent -isolation_rule_only > power_intent_isolation.rpt`,
    `report_power_intent -power_states > power_intent_states.rpt`,
    ``,
    `# Inserts ISO cells when libs allow; soft-fail if cells missing`,
    `if { [catch {commit_power_intent -design ${designName}} err] } {`,
    `  puts "WARN: commit_power_intent: $err"`,
    `}`,
    ``,
    `report_power_intent_instances -summary`,
    `# Then: read_sdc ... ; syn_generic ; syn_map ; syn_opt`,
    `write_power_intent -1801 -base_name out/${designName}_out -overwrite`,
    ``,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Parser (multi-line \ + subset of create_*/set_*)
// ---------------------------------------------------------------------------

export function flattenUpfCommands(text: string): string[] {
  const raw = text.split(/\r?\n/);
  const out: string[] = [];
  let acc = "";
  for (const rawLine of raw) {
    let line = rawLine;
    let inQ = false;
    let cut = line.length;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"' || line[i] === "'") inQ = !inQ;
      if (line[i] === "#" && !inQ) {
        cut = i;
        break;
      }
    }
    line = line.slice(0, cut).trimEnd();
    if (!line.trim() && !acc) continue;
    if (acc) acc += " " + line.trim();
    else acc = line.trim();
    if (acc.endsWith("\\")) {
      acc = acc.slice(0, -1).trimEnd();
      continue;
    }
    if (acc) out.push(acc);
    acc = "";
  }
  if (acc.trim()) out.push(acc.trim());
  return out;
}

function parseBraceList(s: string): string[] {
  const m = s.match(/\{([^}]*)\}/);
  if (!m) {
    const bare = s.trim().split(/\s+/).filter(Boolean);
    return bare;
  }
  return m[1].trim().split(/\s+/).filter(Boolean);
}

function flagVal(cmd: string, flag: string): string | undefined {
  const re = new RegExp(`-${flag}\\s+(\\{[^}]*\\}|\\S+)`);
  const m = cmd.match(re);
  if (!m) return undefined;
  return m[1].replace(/^\{|\}$/g, "").trim();
}

function flagBracePair(cmd: string, flag: string): [string, string] | undefined {
  const re = new RegExp(`-${flag}\\s+\\{(\\S+)\\s+(\\S+)\\}`);
  const m = cmd.match(re);
  if (!m) return undefined;
  return [m[1], m[2]];
}

export function parseUpf(text: string): UpfState {
  const state = emptyUpfState("top");
  const cmds = flattenUpfCommands(text);
  let idx = 0;

  for (const cmd of cmds) {
    idx++;
    const t = cmd.trim();
    if (!t) continue;

    if (t.startsWith("upf_version")) {
      const v = t.split(/\s+/)[1] as UpfVersion;
      if (v) state.version = v;
      continue;
    }

    if (t.startsWith("create_supply_net")) {
      const name = t.split(/\s+/)[1];
      if (name)
        state.supplyNets.push({
          id: `n_${idx}`,
          name,
          switchable: /core|sw|gated/i.test(name),
        });
      continue;
    }

    if (t.startsWith("create_supply_port")) {
      const name = t.replace(/create_supply_port\s+/, "").split(/\s+/)[0];
      if (name) state.supplyPorts.push({ id: `p_${idx}`, name });
      continue;
    }

    if (t.startsWith("connect_supply_net")) {
      const parts = t.match(
        /connect_supply_net\s+(\S+)\s+-ports\s+(\{[^}]*\}|\S+)/
      );
      if (parts) {
        state.connections.push({
          id: `c_${idx}`,
          netName: parts[1],
          portNames: parseBraceList(parts[2]),
        });
      }
      continue;
    }

    if (t.startsWith("create_power_domain")) {
      const nameMatch = t.match(/create_power_domain\s+(\S+)/);
      const name = nameMatch?.[1] || `PD_${idx}`;
      const includeScope = t.includes("-include_scope");
      const elMatch = t.match(/-elements\s+(\{[^}]*\}|\S+)/);
      const elements = elMatch ? parseBraceList(elMatch[1]) : [];
      state.domains.push({
        id: `d_${idx}`,
        name,
        includeScope,
        elements,
        alwaysOn: includeScope,
      });
      continue;
    }

    if (t.startsWith("set_domain_supply_net")) {
      const name = t.match(/set_domain_supply_net\s+(\S+)/)?.[1];
      const pwr = flagVal(t, "primary_power_net");
      const gnd = flagVal(t, "primary_ground_net");
      const d = state.domains.find((x) => x.name === name);
      if (d) {
        if (pwr) d.primaryPowerNet = pwr;
        if (gnd) d.primaryGroundNet = gnd;
      }
      continue;
    }

    if (t.startsWith("create_power_switch")) {
      const name = t.match(/create_power_switch\s+(\S+)/)?.[1] || `sw_${idx}`;
      const domain = flagVal(t, "domain") || "";
      const inp = flagBracePair(t, "input_supply_port") || ["vin", "VDD"];
      const out = flagBracePair(t, "output_supply_port") || ["vout", "VDD_SW"];
      const ctrl = flagBracePair(t, "control_port") || ["c", "sw_ctrl"];
      // -on_state {on vin {c}}
      const onM = t.match(/-on_state\s+\{(\S+)\s+(\S+)\s+\{([^}]*)\}\}/);
      const offM = t.match(/-off_state\s+\{(\S+)\s+\{([^}]*)\}\}/);
      state.switches.push({
        id: `sw_${idx}`,
        name,
        domainName: domain,
        inputSupplyPort: { port: inp[0], net: inp[1] },
        outputSupplyPort: { port: out[0], net: out[1] },
        controlPort: { port: ctrl[0], net: ctrl[1] },
        onState: {
          name: onM?.[1] || "on",
          input: onM?.[2] || inp[0],
          controlExpr: onM?.[3] || "c",
        },
        offState: {
          name: offM?.[1] || "off",
          controlExpr: offM?.[2] || "!c",
        },
      });
      continue;
    }

    if (t.startsWith("create_logic_port")) {
      const dir = flagVal(t, "direction") as LogicPort["direction"] | undefined;
      const name = t.split(/\s+/).filter((x) => !x.startsWith("-")).pop();
      if (name && name !== "create_logic_port") {
        state.logicPorts.push({
          id: `lp_${idx}`,
          name,
          direction: dir || "in",
        });
      }
      continue;
    }

    if (t.startsWith("create_logic_net")) {
      const name = t.split(/\s+/)[1];
      if (name)
        state.logicNets.push({ id: `ln_${idx}`, name, portNames: [] });
      continue;
    }

    if (t.startsWith("connect_logic_net")) {
      const name = t.match(/connect_logic_net\s+(\S+)/)?.[1];
      const ports = t.match(/-ports\s+(\{[^}]*\}|\S+)/);
      const n = state.logicNets.find((x) => x.name === name);
      if (n && ports) n.portNames = parseBraceList(ports[1]);
      continue;
    }

    if (t.startsWith("set_isolation ") || t.startsWith("set_isolation\t")) {
      const name = t.match(/set_isolation\s+(\S+)/)?.[1] || `iso_${idx}`;
      const domain = flagVal(t, "domain") || "";
      const applies = (flagVal(t, "applies_to") as AppliesTo) || "outputs";
      const clamp = (flagVal(t, "clamp_value") as ClampValue) || "0";
      state.isolations.push({
        id: `iso_${idx}`,
        name,
        domainName: domain,
        appliesTo: applies,
        clampValue: clamp,
        isolationPowerNet: flagVal(t, "isolation_power_net"),
        isolationGroundNet: flagVal(t, "isolation_ground_net"),
      });
      continue;
    }

    if (t.startsWith("set_isolation_control")) {
      const name = t.match(/set_isolation_control\s+(\S+)/)?.[1];
      const iso = state.isolations.find((x) => x.name === name);
      if (iso) {
        iso.isolationSignal = flagVal(t, "isolation_signal");
        iso.isolationSense =
          (flagVal(t, "isolation_sense") as IsolationSense) || "low";
        iso.location =
          (flagVal(t, "location") as IsolationLocation) || "self";
      }
      continue;
    }

    if (t.startsWith("set_retention ") || t.startsWith("set_retention\t")) {
      const name = t.match(/set_retention\s+(\S+)/)?.[1] || `ret_${idx}`;
      state.retentions.push({
        id: `ret_${idx}`,
        name,
        domainName: flagVal(t, "domain") || "",
        retentionPowerNet: flagVal(t, "retention_power_net"),
        retentionGroundNet: flagVal(t, "retention_ground_net"),
      });
      continue;
    }

    if (t.startsWith("set_retention_control")) {
      const name = t.match(/set_retention_control\s+(\S+)/)?.[1];
      const r = state.retentions.find((x) => x.name === name);
      if (r) {
        const save = t.match(/-save_signal\s+\{(\S+)/);
        const restore = t.match(/-restore_signal\s+\{(\S+)/);
        if (save) r.saveSignal = save[1];
        if (restore) r.restoreSignal = restore[1];
      }
      continue;
    }

    if (t.startsWith("set_level_shifter")) {
      const name = t.match(/set_level_shifter\s+(\S+)/)?.[1] || `ls_${idx}`;
      state.levelShifters.push({
        id: `ls_${idx}`,
        name,
        domainName: flagVal(t, "domain") || "",
        appliesTo: (flagVal(t, "applies_to") as AppliesTo) || "both",
        rule: flagVal(t, "rule") as LevelShifterStrategy["rule"],
        location: flagVal(t, "location") as IsolationLocation,
        inputSupplyNet: flagVal(t, "input_supply_net"),
        outputSupplyNet: flagVal(t, "output_supply_net"),
      });
      continue;
    }

    if (t.startsWith("add_port_state")) {
      const supply = t.match(/add_port_state\s+(\S+)/)?.[1];
      if (!supply) continue;
      const states: PortState["states"] = [];
      const re = /-state\s+\{(\S+)\s+([^}]*)\}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(t)) !== null) {
        const nomRaw = m[2].trim();
        const nom =
          nomRaw === "off"
            ? "off"
            : nomRaw === ""
              ? undefined
              : isNaN(Number(nomRaw))
                ? nomRaw
                : Number(nomRaw);
        states.push({ name: m[1], nom });
      }
      state.portStates.push({ id: `ps_${idx}`, supplyName: supply, states });
      continue;
    }

    if (t.startsWith("create_pst")) {
      const name = t.match(/create_pst\s+(\S+)/)?.[1] || `pst_${idx}`;
      const sup = t.match(/-supplies\s+(\{[^}]*\}|\S+)/);
      state.pst.push({
        id: `pst_${idx}`,
        name,
        supplies: sup ? parseBraceList(sup[1]) : [],
        states: [],
      });
      continue;
    }

    if (t.startsWith("add_pst_state")) {
      const name = t.match(/add_pst_state\s+(\S+)/)?.[1];
      const pstName = flagVal(t, "pst");
      const vals = t.match(/-state\s+(\{[^}]*\}|\S+)/);
      const table = state.pst.find((p) => p.name === pstName);
      if (table && name && vals) {
        table.states.push({ name, values: parseBraceList(vals[1]) });
      }
      continue;
    }
  }

  if (
    !state.supplyNets.length &&
    !state.domains.length &&
    text.trim().length < 20
  ) {
    return structuredClone(DEFAULT_UPF_STATE);
  }

  // Infer design name from comments
  const designComment = text.match(/Top design:\s*(\S+)/i);
  if (designComment) state.designName = designComment[1];

  return normalizeUpfState(state);
}

// ---------------------------------------------------------------------------
// Lint
// ---------------------------------------------------------------------------

export function lintUpfState(state: UpfState): UpfLintMessage[] {
  const s = normalizeUpfState(state);
  const msgs: UpfLintMessage[] = [];
  const netNames = new Set(s.supplyNets.map((n) => n.name));
  const domainNames = new Set(s.domains.map((d) => d.name));

  if (!s.domains.length) {
    msgs.push({
      id: "no_domains",
      severity: "error",
      message: "No power domains defined",
      recommendation:
        "Add an always-on domain (-include_scope) and any switchable islands (-elements).",
    });
  }

  s.domains.forEach((d) => {
    if (!d.primaryPowerNet || !d.primaryGroundNet) {
      msgs.push({
        id: `domain_supply_${d.id}`,
        severity: "error",
        message: `Domain '${d.name}' missing primary power/ground`,
        recommendation: `set_domain_supply_net ${d.name} -primary_power_net … -primary_ground_net …`,
      });
    } else {
      if (!netNames.has(d.primaryPowerNet)) {
        msgs.push({
          id: `domain_pwr_missing_${d.id}`,
          severity: "error",
          message: `Domain '${d.name}' power net '${d.primaryPowerNet}' is not created`,
          recommendation: `create_supply_net ${d.primaryPowerNet}`,
        });
      }
      if (!netNames.has(d.primaryGroundNet)) {
        msgs.push({
          id: `domain_gnd_missing_${d.id}`,
          severity: "error",
          message: `Domain '${d.name}' ground net '${d.primaryGroundNet}' is not created`,
          recommendation: `create_supply_net ${d.primaryGroundNet}`,
        });
      }
    }
    if (!d.includeScope && !d.elements.length) {
      msgs.push({
        id: `domain_empty_${d.id}`,
        severity: "warning",
        message: `Domain '${d.name}' has no -elements and no -include_scope`,
        recommendation: "Assign hierarchical instances or mark include_scope.",
      });
    }
  });

  // Switchable domain without isolation
  s.domains.forEach((d) => {
    const isSwitched = s.switches.some((sw) => sw.domainName === d.name);
    if (!isSwitched) return;
    const hasIso = s.isolations.some((i) => i.domainName === d.name);
    if (!hasIso) {
      msgs.push({
        id: `no_iso_${d.id}`,
        severity: "warning",
        message: `Switchable domain '${d.name}' has no isolation strategy`,
        recommendation:
          "Add set_isolation on outputs (clamp 0/1) so AO domain does not see X when OFF.",
      });
    }
  });

  s.switches.forEach((sw) => {
    if (!domainNames.has(sw.domainName)) {
      msgs.push({
        id: `sw_domain_${sw.id}`,
        severity: "error",
        message: `Switch '${sw.name}' references unknown domain '${sw.domainName}'`,
        recommendation: "create_power_domain first, then create_power_switch.",
      });
    }
    if (!netNames.has(sw.inputSupplyPort.net)) {
      msgs.push({
        id: `sw_in_${sw.id}`,
        severity: "error",
        message: `Switch '${sw.name}' input net missing`,
        recommendation: `create_supply_net ${sw.inputSupplyPort.net}`,
      });
    }
  });

  s.isolations.forEach((iso) => {
    if (!domainNames.has(iso.domainName)) {
      msgs.push({
        id: `iso_domain_${iso.id}`,
        severity: "error",
        message: `Isolation '${iso.name}' domain '${iso.domainName}' unknown`,
        recommendation: "Fix -domain name to match create_power_domain.",
      });
    }
    if (!iso.isolationSignal) {
      msgs.push({
        id: `iso_ctrl_${iso.id}`,
        severity: "warning",
        message: `Isolation '${iso.name}' has no set_isolation_control signal`,
        recommendation: "Add isolation_signal (often same as switch control).",
      });
    }
  });

  s.retentions.forEach((r) => {
    if (!r.saveSignal || !r.restoreSignal) {
      msgs.push({
        id: `ret_signals_${r.id}`,
        severity: "warning",
        message: `Retention '${r.name}' missing save/restore signals`,
        recommendation: "set_retention_control with save_signal and restore_signal.",
      });
    }
  });

  if (!s.pst.length) {
    msgs.push({
      id: "no_pst",
      severity: "info",
      message: "No power state table (PST) defined",
      recommendation:
        "Add create_pst / add_pst_state for RUN vs SLEEP (or equivalent modes).",
    });
  } else {
    s.pst.forEach((t) => {
      if (!t.states.length) {
        msgs.push({
          id: `pst_empty_${t.id}`,
          severity: "warning",
          message: `PST '${t.name}' has no states`,
          recommendation: "add_pst_state RUN / SLEEP with legal supply combinations.",
        });
      }
      t.states.forEach((st) => {
        if (st.values.length !== t.supplies.length) {
          msgs.push({
            id: `pst_len_${t.id}_${st.name}`,
            severity: "error",
            message: `PST state '${st.name}' value count ≠ supplies count`,
            recommendation: "Each -state list must match -supplies order/length.",
          });
        }
      });
    });
  }

  // SDC interaction notes
  if (s.isolations.length) {
    msgs.push({
      id: "sdc_iso_note",
      severity: "info",
      message: "SDC interaction: isolation outputs may need false_path / multicycle review",
      recommendation:
        "In SDC Studio, avoid timing through ISO clamps when domain is OFF; coordinate with set_case_analysis on isolation enables if needed.",
    });
  }
  if (s.switches.length) {
    msgs.push({
      id: "sdc_pg_note",
      severity: "info",
      message: "Do not time paths that assume a shutoff domain is ON without a power mode",
      recommendation:
        "Use power-aware STA / mode-based analysis (MMMC views × power modes) for signoff.",
    });
  }

  // Same-voltage → LS may be unnecessary
  if (s.levelShifters.length === 0 && s.domains.length > 1) {
    msgs.push({
      id: "no_ls_ok",
      severity: "info",
      message: "No level shifters — OK when all rails share the same voltage class",
      recommendation:
        "Add set_level_shifter only for true multi-voltage crossings (e.g. 0.72↔1.8).",
    });
  }

  return msgs;
}

// ---------------------------------------------------------------------------
// Domain diagram model (SVG helper data)
// ---------------------------------------------------------------------------

export interface UpfDiagramNode {
  id: string;
  kind: "domain" | "switch" | "supply" | "iso";
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

export interface UpfDiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind: "supply" | "switch" | "iso" | "hierarchy";
}

export function buildUpfDiagram(state: UpfState): {
  nodes: UpfDiagramNode[];
  edges: UpfDiagramEdge[];
} {
  const s = normalizeUpfState(state);
  const nodes: UpfDiagramNode[] = [];
  const edges: UpfDiagramEdge[] = [];

  // Supply column
  s.supplyNets.forEach((n, i) => {
    nodes.push({
      id: `net_${n.name}`,
      kind: "supply",
      label: n.name,
      x: 20,
      y: 40 + i * 70,
      w: 100,
      h: 40,
      fill: n.switchable ? "#fbbf24" : "#34d399",
    });
  });

  s.domains.forEach((d, i) => {
    const x = 200;
    const y = 40 + i * 140;
    nodes.push({
      id: `dom_${d.name}`,
      kind: "domain",
      label: `${d.name}${d.alwaysOn || d.includeScope ? " (AO)" : ""}${
        d.elements.length ? `\n${d.elements.join(",")}` : ""
      }`,
      x,
      y,
      w: 160,
      h: 70,
      fill: d.alwaysOn || d.includeScope ? "#a5b4fc" : "#f9a8d4",
    });
    if (d.primaryPowerNet) {
      edges.push({
        id: `e_pwr_${d.name}`,
        from: `net_${d.primaryPowerNet}`,
        to: `dom_${d.name}`,
        label: "pwr",
        kind: "supply",
      });
    }
  });

  s.switches.forEach((sw, i) => {
    nodes.push({
      id: `sw_${sw.name}`,
      kind: "switch",
      label: sw.name,
      x: 100,
      y: 40 + s.supplyNets.length * 70 + i * 60,
      w: 90,
      h: 36,
      fill: "#fdba74",
    });
    edges.push({
      id: `e_sw_in_${sw.name}`,
      from: `net_${sw.inputSupplyPort.net}`,
      to: `sw_${sw.name}`,
      kind: "switch",
    });
    edges.push({
      id: `e_sw_out_${sw.name}`,
      from: `sw_${sw.name}`,
      to: `net_${sw.outputSupplyPort.net}`,
      label: "gated",
      kind: "switch",
    });
  });

  s.isolations.forEach((iso, i) => {
    nodes.push({
      id: `iso_${iso.name}`,
      kind: "iso",
      label: `ISO ${iso.name}`,
      x: 400,
      y: 60 + i * 80,
      w: 120,
      h: 40,
      fill: "#fca5a5",
    });
    edges.push({
      id: `e_iso_${iso.name}`,
      from: `dom_${iso.domainName}`,
      to: `iso_${iso.name}`,
      label: `clamp ${iso.clampValue}`,
      kind: "iso",
    });
  });

  return { nodes, edges };
}
