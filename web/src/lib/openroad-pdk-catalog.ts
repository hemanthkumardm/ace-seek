/**
 * Client-safe OpenROAD PDK catalog (no Node fs).
 *
 * Cloud Max OpenLane: sky130, sky130B, gf180mcu (when PDK installed on worker)
 * ORFS Max (needs OPENROAD_FLOW_ROOT): asap7, nangate45, ihp-sg13g2
 * Scripts-only: generic (and any PDK for Pro export packs)
 */

export type OpenroadPdkId =
  | "sky130"
  | "sky130B"
  | "gf180mcu"
  | "ihp-sg13g2"
  | "asap7"
  | "nangate45"
  | "generic";

export type PdkRunnerKind = "openlane" | "orfs" | "scripts_only";

/** Stdcell masters used in generated OpenROAD / Yosys / EQY scripts */
export interface PdkCellMasters {
  tap: string;
  endcap: string;
  buf: string;
  bufHold: string;
  clkbufRoot: string;
  clkbufList: string;
  diode: string;
  fillGlob: string;
  /** Typical liberty basename for EQY / Studio preview */
  libertyFile: string;
  /** Relative lib dir under PDK for multi-corner STA (may be empty for ORFS) */
  pvtLibDir: string;
  slowLib: string;
  typLib: string;
  fastLib: string;
}

export interface OpenroadPdkDef {
  id: OpenroadPdkId;
  label: string;
  short: string;
  description: string;
  runner: PdkRunnerKind;
  /** User-facing capability badge */
  cloudLabel: "Cloud OpenLane" | "Cloud ORFS" | "Scripts only";
  openlanePdk: string | null;
  openlanePdkAlts?: string[];
  orfsPlatform: string | null;
  openlaneDefaults: Record<string, string | number | boolean>;
  liberty: string;
  techLef: string;
  installHint: string;
  cells: PdkCellMasters;
}

const SKY130_CELLS: PdkCellMasters = {
  tap: "sky130_fd_sc_hd__tapvpwrvgnd_1",
  endcap: "sky130_fd_sc_hd__decap_4",
  buf: "sky130_fd_sc_hd__buf_4",
  bufHold: "sky130_fd_sc_hd__buf_2",
  clkbufRoot: "sky130_fd_sc_hd__clkbuf_16",
  clkbufList:
    "sky130_fd_sc_hd__clkbuf_16 sky130_fd_sc_hd__clkbuf_8 sky130_fd_sc_hd__clkbuf_4",
  diode: "sky130_fd_sc_hd__diode_2/DIODE",
  fillGlob: "sky130_fd_sc_hd__fill_*",
  libertyFile: "sky130_fd_sc_hd__tt_025C_1v80.lib",
  pvtLibDir: "libs.ref/sky130_fd_sc_hd/lib",
  slowLib: "sky130_fd_sc_hd__ss_100C_1v60.lib",
  typLib: "sky130_fd_sc_hd__tt_025C_1v80.lib",
  fastLib: "sky130_fd_sc_hd__ff_n40C_1v95.lib",
};

const GF180_CELLS: PdkCellMasters = {
  tap: "gf180mcu_fd_sc_mcu7t5v0__filltie",
  endcap: "gf180mcu_fd_sc_mcu7t5v0__endcap",
  buf: "gf180mcu_fd_sc_mcu7t5v0__buf_4",
  bufHold: "gf180mcu_fd_sc_mcu7t5v0__buf_2",
  clkbufRoot: "gf180mcu_fd_sc_mcu7t5v0__clkbuf_8",
  clkbufList:
    "gf180mcu_fd_sc_mcu7t5v0__clkbuf_8 gf180mcu_fd_sc_mcu7t5v0__clkbuf_4 gf180mcu_fd_sc_mcu7t5v0__clkbuf_2",
  diode: "gf180mcu_fd_sc_mcu7t5v0__antenna/I",
  fillGlob: "gf180mcu_fd_sc_mcu7t5v0__fill_*",
  libertyFile: "gf180mcu_fd_sc_mcu7t5v0__tt_025C_5v00.lib",
  pvtLibDir: "libs.ref/gf180mcu_fd_sc_mcu7t5v0/liberty",
  slowLib: "gf180mcu_fd_sc_mcu7t5v0__ss_125C_4v50.lib",
  typLib: "gf180mcu_fd_sc_mcu7t5v0__tt_025C_5v00.lib",
  fastLib: "gf180mcu_fd_sc_mcu7t5v0__ff_n40C_5v50.lib",
};

const ASAP7_CELLS: PdkCellMasters = {
  tap: "TAPCELL_ASAP7_75t_R",
  endcap: "DECAPx1_ASAP7_75t_R",
  buf: "BUFx4_ASAP7_75t_R",
  bufHold: "BUFx2_ASAP7_75t_R",
  clkbufRoot: "BUFx12_ASAP7_75t_R",
  clkbufList: "BUFx12_ASAP7_75t_R BUFx6_ASAP7_75t_R BUFx4_ASAP7_75t_R",
  diode: "ANTENNA_ASAP7_75t_R",
  fillGlob: "FILL*",
  libertyFile: "asap7sc7p5t_AO_RVT_TT_nldm_211120.lib.gz",
  pvtLibDir: "lib",
  slowLib: "asap7sc7p5t_AO_RVT_SS_nldm_211120.lib.gz",
  typLib: "asap7sc7p5t_AO_RVT_TT_nldm_211120.lib.gz",
  fastLib: "asap7sc7p5t_AO_RVT_FF_nldm_211120.lib.gz",
};

const NANGATE_CELLS: PdkCellMasters = {
  tap: "LOGIC0_X1",
  endcap: "FILLCELL_X1",
  buf: "BUF_X4",
  bufHold: "BUF_X2",
  clkbufRoot: "CLKBUF_X3",
  clkbufList: "CLKBUF_X3 CLKBUF_X2 CLKBUF_X1",
  diode: "ANTENNA_X1",
  fillGlob: "FILLCELL_*",
  libertyFile: "NangateOpenCellLibrary_typical.lib",
  pvtLibDir: "lib",
  slowLib: "NangateOpenCellLibrary_slow.lib",
  typLib: "NangateOpenCellLibrary_typical.lib",
  fastLib: "NangateOpenCellLibrary_fast.lib",
};

const IHP_SG13G2_CELLS: PdkCellMasters = {
  tap: "sg13g2_tapcell",
  endcap: "sg13g2_decap_4",
  buf: "sg13g2_buf_4",
  bufHold: "sg13g2_dlygate4sd1_1",
  clkbufRoot: "sg13g2_buf_16",
  clkbufList: "sg13g2_buf_16 sg13g2_buf_8 sg13g2_buf_4",
  diode: "sg13g2_antennanp",
  fillGlob: "sg13g2_fill_*",
  libertyFile: "sg13g2_stdcell_typ_1p20V_25C.lib",
  pvtLibDir: "libs.ref/sg13g2_stdcell/lib",
  slowLib: "sg13g2_stdcell_slow_1p08V_125C.lib",
  typLib: "sg13g2_stdcell_typ_1p20V_25C.lib",
  fastLib: "sg13g2_stdcell_fast_1p32V_m40C.lib",
};

const GENERIC_CELLS: PdkCellMasters = {
  tap: "YOUR_TAP_CELL",
  endcap: "YOUR_ENDCAP_CELL",
  buf: "YOUR_BUF_CELL",
  bufHold: "YOUR_BUF_HOLD_CELL",
  clkbufRoot: "YOUR_CLKBUF_ROOT",
  clkbufList: "YOUR_CLKBUF_LIST",
  diode: "YOUR_DIODE_CELL",
  fillGlob: "YOUR_FILL_*",
  libertyFile: "typical.lib",
  pvtLibDir: "lib",
  slowLib: "slow.lib",
  typLib: "typical.lib",
  fastLib: "fast.lib",
};

export const OPENROAD_PDKS: OpenroadPdkDef[] = [
  {
    id: "sky130",
    label: "SkyWater 130nm (sky130A)",
    short: "sky130",
    description: "Default open PDK — OpenLane + volare sky130A",
    runner: "openlane",
    cloudLabel: "Cloud OpenLane",
    openlanePdk: "sky130A",
    openlanePdkAlts: ["sky130A"],
    orfsPlatform: "sky130hd",
    openlaneDefaults: {
      RT_MAX_LAYER: "met4",
      FP_PDN_MULTILAYER: true,
      FP_PDN_CORE_RING: true,
      FP_PDN_ENABLE_RAILS: true,
      PRIMARY_GDSII_STREAMOUT_TOOL: "magic",
    },
    liberty:
      "sky130A/libs.ref/sky130_fd_sc_hd/lib/sky130_fd_sc_hd__tt_025C_1v80.lib",
    techLef:
      "sky130A/libs.ref/sky130_fd_sc_hd/techlef/sky130_fd_sc_hd.tlef",
    installHint: "pip install volare && volare enable --pdk sky130",
    cells: SKY130_CELLS,
  },
  {
    id: "sky130B",
    label: "SkyWater 130nm + ReRAM (sky130B)",
    short: "sky130B",
    description: "sky130B metal stack / ReRAM variant via OpenLane",
    runner: "openlane",
    cloudLabel: "Cloud OpenLane",
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
    cells: SKY130_CELLS,
  },
  {
    id: "gf180mcu",
    label: "GlobalFoundries 180nm (GF180MCU)",
    short: "gf180mcu",
    description: "OpenLane + volare gf180mcu (A–D variants)",
    runner: "openlane",
    cloudLabel: "Cloud OpenLane",
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
    cells: GF180_CELLS,
  },
  {
    id: "ihp-sg13g2",
    label: "IHP 130nm SG13G2 (BiCMOS OpenPDK)",
    short: "ihp-sg13g2",
    description:
      "IHP OpenPDK sg13g2 — ORFS platform preferred; OpenLane when ihp-sg13g2 is installed under PDK_ROOT",
    runner: "orfs",
    cloudLabel: "Cloud ORFS",
    openlanePdk: "ihp-sg13g2",
    openlanePdkAlts: ["ihp-sg13g2"],
    orfsPlatform: "ihp-sg13g2",
    openlaneDefaults: {
      RT_MAX_LAYER: "Metal5",
      PL_TARGET_DENSITY: 0.55,
      FP_PDN_MULTILAYER: true,
      FP_PDN_CORE_RING: true,
      FP_PDN_ENABLE_RAILS: true,
    },
    liberty:
      "ihp-sg13g2/libs.ref/sg13g2_stdcell/lib/sg13g2_stdcell_typ_1p20V_25C.lib",
    techLef:
      "ihp-sg13g2/libs.ref/sg13g2_stdcell/techlef/sg13g2_tech.tlef",
    installHint:
      "Clone OpenROAD-flow-scripts with platforms/ihp-sg13g2 (set OPENROAD_FLOW_ROOT), or install IHP-Open-PDK under PDK_ROOT",
    cells: IHP_SG13G2_CELLS,
  },
  {
    id: "asap7",
    label: "ASAP7 7nm (predictive)",
    short: "asap7",
    description: "ORFS asap7 platform (not classic OpenLane open_pdks)",
    runner: "orfs",
    cloudLabel: "Cloud ORFS",
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
    cells: ASAP7_CELLS,
  },
  {
    id: "nangate45",
    label: "Nangate 45nm (FreePDK45)",
    short: "nangate45",
    description: "ORFS nangate45 / FreePDK45 educational platform",
    runner: "orfs",
    cloudLabel: "Cloud ORFS",
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
    cells: NANGATE_CELLS,
  },
  {
    id: "generic",
    label: "Generic (paths only)",
    short: "generic",
    description: "Pro scripts with placeholders — edit liberty/LEF yourself",
    runner: "scripts_only",
    cloudLabel: "Scripts only",
    openlanePdk: null,
    orfsPlatform: null,
    openlaneDefaults: {},
    liberty: "PATH/TO/typical.lib",
    techLef: "PATH/TO/tech.lef",
    installHint: "Provide your own PDK paths in generated scripts",
    cells: GENERIC_CELLS,
  },
];

export function getPdkDef(id: string | undefined | null): OpenroadPdkDef {
  const found = OPENROAD_PDKS.find((p) => p.id === id);
  return found || OPENROAD_PDKS[0];
}

export function isOpenroadPdkId(v: string): v is OpenroadPdkId {
  return OPENROAD_PDKS.some((p) => p.id === v);
}
