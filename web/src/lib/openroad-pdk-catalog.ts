/**
 * Client-safe OpenROAD PDK catalog (no Node fs).
 */

export type OpenroadPdkId =
  | "sky130"
  | "sky130B"
  | "gf180mcu"
  | "asap7"
  | "nangate45"
  | "generic";

export type PdkRunnerKind = "openlane" | "orfs" | "scripts_only";

export interface OpenroadPdkDef {
  id: OpenroadPdkId;
  label: string;
  short: string;
  description: string;
  runner: PdkRunnerKind;
  openlanePdk: string | null;
  openlanePdkAlts?: string[];
  orfsPlatform: string | null;
  openlaneDefaults: Record<string, string | number | boolean>;
  liberty: string;
  techLef: string;
  installHint: string;
}

export const OPENROAD_PDKS: OpenroadPdkDef[] = [
  {
    id: "sky130",
    label: "SkyWater 130nm (sky130A)",
    short: "sky130",
    description: "Default open PDK — OpenLane + volare sky130A",
    runner: "openlane",
    openlanePdk: "sky130A",
    openlanePdkAlts: ["sky130A"],
    orfsPlatform: "sky130hd",
    openlaneDefaults: {
      RT_MAX_LAYER: "met4",
      // Multilayer + core ring required to see closed PDN rings (not only rails/straps)
      FP_PDN_MULTILAYER: true,
      FP_PDN_CORE_RING: true,
      FP_PDN_ENABLE_RAILS: true,
      PRIMARY_GDSII_STREAMOUT_TOOL: "magic",
    },
    liberty:
      "sky130A/libs.ref/sky130_fd_sc_hd/lib/sky130_fd_sc_hd__tt_025C_1v80.lib",
    techLef:
      "sky130A/libs.ref/sky130_fd_sc_hd/techlef/sky130_fd_sc_hd.tlef",
    installHint:
      "pip install volare && volare enable --pdk sky130",
  },
  {
    id: "sky130B",
    label: "SkyWater 130nm + ReRAM (sky130B)",
    short: "sky130B",
    description: "sky130B metal stack / ReRAM variant via OpenLane",
    runner: "openlane",
    openlanePdk: "sky130B",
    orfsPlatform: "sky130hd",
    openlaneDefaults: {
      RT_MAX_LAYER: "met4",
      FP_PDN_MULTILAYER: true,
      FP_PDN_CORE_RING: true,
      FP_PDN_ENABLE_RAILS: true,
      PRIMARY_GDSII_STREAMOUT_TOOL: "magic",
    },
    liberty:
      "sky130B/libs.ref/sky130_fd_sc_hd/lib/sky130_fd_sc_hd__tt_025C_1v80.lib",
    techLef:
      "sky130B/libs.ref/sky130_fd_sc_hd/techlef/sky130_fd_sc_hd.tlef",
    installHint: "volare enable --pdk sky130",
  },
  {
    id: "gf180mcu",
    label: "GlobalFoundries 180nm (GF180MCU)",
    short: "gf180mcu",
    description: "OpenLane + volare gf180mcu (C/D variants)",
    runner: "openlane",
    openlanePdk: "gf180mcuD",
    openlanePdkAlts: ["gf180mcuD", "gf180mcuC", "gf180mcuB", "gf180mcuA"],
    orfsPlatform: "gf180mcu",
    openlaneDefaults: {
      RT_MAX_LAYER: "Metal4",
      FP_PDN_MULTILAYER: true,
      FP_PDN_CORE_RING: true,
      FP_PDN_ENABLE_RAILS: true,
      PRIMARY_GDSII_STREAMOUT_TOOL: "magic",
    },
    liberty:
      "gf180mcuD/libs.ref/gf180mcu_fd_sc_mcu7t5v0/liberty/gf180mcu_fd_sc_mcu7t5v0__tt_025C_5v00.lib",
    techLef:
      "gf180mcuD/libs.ref/gf180mcu_fd_sc_mcu7t5v0/techlef/gf180mcu_fd_sc_mcu7t5v0__nom.tlef",
    installHint: "pip install volare && volare enable --pdk gf180mcu",
  },
  {
    id: "asap7",
    label: "ASAP7 7nm (predictive)",
    short: "asap7",
    description: "ORFS asap7 platform (not classic OpenLane open_pdks)",
    runner: "orfs",
    openlanePdk: null,
    orfsPlatform: "asap7",
    openlaneDefaults: {
      RT_MAX_LAYER: "M5",
      PL_TARGET_DENSITY: 0.5,
    },
    liberty: "asap7/lib/asap7sc7p5t_AO_RVT_TT_nldm_211120.lib.gz",
    techLef: "asap7/lef/asap7_tech_1x_201209.lef",
    installHint:
      "Clone OpenROAD-flow-scripts; set OPENROAD_FLOW_ROOT (platforms/asap7)",
  },
  {
    id: "nangate45",
    label: "Nangate 45nm (FreePDK45)",
    short: "nangate45",
    description: "ORFS nangate45 / FreePDK45 educational platform",
    runner: "orfs",
    openlanePdk: null,
    orfsPlatform: "nangate45",
    openlaneDefaults: {
      RT_MAX_LAYER: "metal10",
      PL_TARGET_DENSITY: 0.5,
    },
    liberty: "nangate45/lib/NangateOpenCellLibrary_typical.lib",
    techLef: "nangate45/lef/NangateOpenCellLibrary.tech.lef",
    installHint:
      "Set OPENROAD_FLOW_ROOT to ORFS tree with platforms/nangate45",
  },
  {
    id: "generic",
    label: "Generic (paths only)",
    short: "generic",
    description: "Pro scripts with placeholders — edit liberty/LEF yourself",
    runner: "scripts_only",
    openlanePdk: null,
    orfsPlatform: null,
    openlaneDefaults: {},
    liberty: "PATH/TO/typical.lib",
    techLef: "PATH/TO/tech.lef",
    installHint: "Provide your own PDK paths in generated scripts",
  },
];

export function getPdkDef(id: string | undefined | null): OpenroadPdkDef {
  const found = OPENROAD_PDKS.find((p) => p.id === id);
  return found || OPENROAD_PDKS[0];
}

export function isOpenroadPdkId(v: string): v is OpenroadPdkId {
  return OPENROAD_PDKS.some((p) => p.id === v);
}
