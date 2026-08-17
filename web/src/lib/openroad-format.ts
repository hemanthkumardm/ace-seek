/**
 * OpenROAD-format handoff files from VLSI studios.
 *
 * Flow:
 *   1. Author SDC / MMMC on vlsi.ace-seek.com
 *   2. Download OpenROAD-format pack here (constraints.sdc, corners.tcl, manifest)
 *   3. Upload pack on openroad.ace-seek.com → Pro scripts / Max runs
 */

import {
  generateSdcCode,
  normalizeSdcState,
  type SdcStudioState,
} from "./sdc-engine";
import {
  generateMmmcTcl,
  normalizeMmmcState,
  starterMmmcState,
  type MmmcState,
} from "./mmmc-engine";
import { loadLastSdcStateJson, loadLastDesignName } from "./studio-shared";
import { loadMmmcViewRegistry } from "./mmmc-timing-bridge";
import { loadMmmcModeSnapshot } from "./sdc-mmmc-bridge";
import {
  buildZipArchive,
  type ExportPackFile,
} from "./sdc-export-pack";

export const OPENROAD_MANIFEST_NAME = "ace-seek-openroad.json";
export const OPENROAD_HANDOFF_EVENT = "ace_openroad_handoff_updated";

export type OpenroadPdkId = "sky130" | "asap7" | "nangate45" | "generic";

export interface OpenroadManifest {
  version: 1;
  source: "vlsi.ace-seek";
  designName: string;
  pdk: OpenroadPdkId;
  topModule?: string;
  createdAt: string;
  files: string[];
  notes: string[];
}

export interface OpenroadHandoffInput {
  designName?: string;
  topModule?: string;
  pdk?: OpenroadPdkId;
  /** Raw SDC text (overrides studio state if provided) */
  sdcText?: string;
  /** Optional full MMMC state */
  mmmcState?: Partial<MmmcState> | MmmcState | null;
  /** Extra RTL placeholder note */
  rtlNote?: string;
}

export interface OpenroadHandoffPack {
  files: ExportPackFile[];
  zipBytes: Uint8Array;
  manifest: OpenroadManifest;
}

/** Soften SDC for OpenSTA / OpenROAD (header + common unsupported notes). */
export function toOpenroadSdc(sdcBody: string, designName: string): string {
  const body = (sdcBody || "").trim();
  const header = [
    "# =====================================================================",
    "# OpenSTA / OpenROAD constraints (Ace-Seek VLSI → OpenROAD handoff)",
    `# Design : ${designName || "design"}`,
    `# Generated: ${new Date().toISOString()}`,
    "# Notes:",
    "#  - Prefer OpenSTA-compatible SDC (create_clock, set_input/output_delay,",
    "#    set_false_path, set_multicycle_path, set_clock_groups, set_driving_cell).",
    "#  - Vendor-only commands (some Cadence/Synopsys extensions) may need edits.",
    "# =====================================================================",
    "",
  ].join("\n");
  if (!body) {
    return (
      header +
      [
        "# Placeholder — author constraints in VLSI SDC Studio, then re-export.",
        "create_clock -name clk -period 10.0 [get_ports clk]",
        "",
      ].join("\n")
    );
  }
  return header + body + "\n";
}

/**
 * OpenROAD-oriented multi-corner / scenario helper (not Cadence MMMC).
 * OpenROAD + OpenSTA typically use SDC per corner or Tcl scenarios.
 */
export function toOpenroadCornersTcl(
  mmmc: MmmcState,
  designName: string
): string {
  const s = normalizeMmmcState(mmmc);
  const lines: string[] = [
    "# =====================================================================",
    "# OpenROAD / OpenSTA multi-corner helper (from Ace-Seek MMMC Studio)",
    `# Design : ${designName || "design"}`,
    `# Generated: ${new Date().toISOString()}`,
    "# =====================================================================",
    "# Map VLSI analysis views → OpenSTA corners. Adjust liberty paths for your PDK.",
    "",
    "proc ace_seek_list_corners {} {",
  ];

  const activeViews = s.analysisViews.filter((v) => v.active);
  const views = activeViews.length ? activeViews : s.analysisViews;

  if (!views.length) {
    lines.push('  return [list "func_ss_0p72v_125c"]');
  } else {
    lines.push("  return [list \\");
    views.forEach((v, i) => {
      const cont = i < views.length - 1 ? " \\" : "";
      lines.push(`    "${v.name}"${cont}`);
    });
    lines.push("  ]");
  }
  lines.push("}");
  lines.push("");

  lines.push("proc ace_seek_apply_corner {corner_name liberty_file sdc_file} {");
  lines.push("  # Example OpenSTA-style corner apply (edit for your flow):");
  lines.push("  # read_liberty $liberty_file");
  lines.push("  # read_sdc $sdc_file");
  lines.push('  puts "Ace-Seek: apply corner $corner_name lib=$liberty_file sdc=$sdc_file"');
  lines.push("}");
  lines.push("");

  lines.push("# View → suggested liberty / SDC bindings (from MMMC configurator)");
  views.forEach((v) => {
    const dc = s.delayCorners.find((d) => d.id === v.delayCornerId);
    const cm = s.constraintModes.find((c) => c.id === v.constraintModeId);
    const lib = s.librarySets.find((l) => l.id === dc?.librarySetId);
    const libFiles = lib?.files?.length ? lib.files.join(" ") : "PATH/TO/liberty.lib";
    const sdcFiles = cm?.sdcFiles?.length
      ? cm.sdcFiles.join(" ")
      : "constraints.sdc";
    lines.push(
      `# view ${v.name}: setup=${v.isSetup} hold=${v.isHold} lib={${libFiles}} sdc={${sdcFiles}}`
    );
  });
  lines.push("");

  // Also embed a compact Cadence-style reference for engineers who still use Innovus
  lines.push("# --- Reference: Cadence MMMC export (optional commercial flow) ---");
  lines.push("if {0} {");
  const cadence = generateMmmcTcl(s, "cadence")
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  lines.push(cadence);
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

export function buildOpenroadManifest(
  designName: string,
  files: string[],
  opts?: { pdk?: OpenroadPdkId; topModule?: string }
): OpenroadManifest {
  return {
    version: 1,
    source: "vlsi.ace-seek",
    designName: designName || "design",
    pdk: opts?.pdk || "sky130",
    topModule: opts?.topModule,
    createdAt: new Date().toISOString(),
    files,
    notes: [
      "Created on vlsi.ace-seek.com — upload this zip (or individual files) to openroad.ace-seek.com",
      "Pro: generate full Yosys/OpenROAD/OpenSTA script packs",
      "Max: queue containerized open-PDK runs (when workers are enabled)",
      "Educational / open PDK only — not a foundry tapeout flow",
    ],
  };
}

/**
 * Build VLSI → OpenROAD handoff pack (constraints.sdc, corners.tcl, manifest, README).
 */
export function buildOpenroadHandoffPack(
  input: OpenroadHandoffInput = {}
): OpenroadHandoffPack {
  const designName =
    input.designName?.trim() || loadLastDesignName() || "design";
  const pdk = input.pdk || "sky130";

  let sdcBody = (input.sdcText || "").trim();
  if (!sdcBody) {
    const raw = loadLastSdcStateJson();
    if (raw) {
      try {
        const state = normalizeSdcState(JSON.parse(raw) as SdcStudioState);
        sdcBody = generateSdcCode(state);
      } catch {
        sdcBody = "";
      }
    }
  }

  let mmmc: MmmcState;
  if (input.mmmcState) {
    mmmc = normalizeMmmcState(input.mmmcState);
  } else {
    mmmc = starterMmmcState();
    // Enrich names from registry / mode snapshot if present
    const reg = loadMmmcViewRegistry();
    const modes = loadMmmcModeSnapshot();
    if (reg?.views?.length) {
      // Keep starter structure; corners.tcl will list registry view names via override below
      void reg;
    }
    if (modes?.modes?.length) {
      void modes;
    }
  }

  const constraints = toOpenroadSdc(sdcBody, designName);
  let corners = toOpenroadCornersTcl(mmmc, designName);

  // If we only have view registry (no full mmmc), append view names
  const reg = loadMmmcViewRegistry();
  if (reg?.views?.length) {
    const extra = [
      "",
      "# --- Views from Ace-Seek MMMC → Timing registry ---",
      ...reg.views.map(
        (v) =>
          `# view=${v.name} setup=${v.isSetup ?? "?"} hold=${v.isHold ?? "?"}`
      ),
      "",
    ].join("\n");
    corners += extra;
  }

  const readme = [
    "# Ace-Seek → OpenROAD handoff",
    "",
    `Design: ${designName}`,
    `PDK hint: ${pdk}`,
    "",
    "## Contents",
    "- constraints.sdc     OpenSTA/OpenROAD-oriented SDC from VLSI SDC Studio",
    "- corners.tcl         Multi-corner helper from VLSI MMMC Studio",
    "- ace-seek-openroad.json   Manifest for openroad.ace-seek.com upload",
    "",
    "## Next steps",
    "1. Open https://openroad.ace-seek.com (or /openroad locally)",
    "2. Upload this zip (or the .sdc + .tcl files) on Project",
    "3. Pro: Scripts → download full Yosys/OpenROAD/OpenSTA flow pack",
    "4. Max: Run → queue a container job (open PDK, size-limited)",
    "",
    "Do not use this as a proprietary foundry signoff replacement.",
    "",
  ].join("\n");

  const fileNames = [
    "constraints.sdc",
    "corners.tcl",
    OPENROAD_MANIFEST_NAME,
    "README.md",
  ];
  const manifest = buildOpenroadManifest(designName, fileNames, {
    pdk,
    topModule: input.topModule,
  });

  const files: ExportPackFile[] = [
    { filename: "constraints.sdc", content: constraints },
    { filename: "corners.tcl", content: corners },
    {
      filename: OPENROAD_MANIFEST_NAME,
      content: JSON.stringify(manifest, null, 2) + "\n",
    },
    { filename: "README.md", content: readme },
  ];

  if (input.rtlNote) {
    files.push({
      filename: "rtl_note.txt",
      content: input.rtlNote + "\n",
    });
    manifest.files.push("rtl_note.txt");
  }

  return {
    files,
    zipBytes: buildZipArchive(files),
    manifest,
  };
}

export function downloadOpenroadHandoffZip(
  pack: OpenroadHandoffPack,
  filename?: string
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([pack.zipBytes.buffer.slice(
    pack.zipBytes.byteOffset,
    pack.zipBytes.byteOffset + pack.zipBytes.byteLength
  ) as ArrayBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ||
    `${pack.manifest.designName || "design"}-openroad-handoff.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
