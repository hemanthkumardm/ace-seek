/**
 * Pro: full OpenROAD / Yosys / OpenSTA script pack from uploaded project files.
 */

import {
  buildZipArchive,
  type ExportPackFile,
} from "./sdc-export-pack";
import type { OpenroadProjectState } from "./openroad-project-hub";
import { getFileByRole } from "./openroad-project-hub";
import { getPdkDef } from "./openroad-pdk-catalog";

export interface OpenroadFlowPackResult {
  files: ExportPackFile[];
  zipBytes: Uint8Array;
}

function pdkHint(pdk: string): { liberty: string; techLef: string; note: string } {
  const def = getPdkDef(pdk);
  return {
    liberty: def.liberty,
    techLef: def.techLef,
    note: `${def.label} · ${def.installHint}`,
  };
}

/** Generate Pro flow scripts from OpenROAD project hub state. */
export function buildOpenroadFlowScripts(
  project: OpenroadProjectState
): OpenroadFlowPackResult {
  const design = project.designName || "design";
  const top = project.topModule || "top";
  const pdk = project.pdk || "sky130";
  const paths = pdkHint(pdk);

  const sdc =
    getFileByRole(project, "sdc")?.content ||
    "# missing constraints.sdc — re-export from VLSI\n";
  const corners =
    getFileByRole(project, "corners")?.content ||
    "# optional corners.tcl\n";
  const rtl =
    getFileByRole(project, "rtl")?.content ||
    `// Placeholder RTL for ${top} — replace with real netlist/RTL\nmodule ${top} (input clk, input rst_n, output logic q);\n  always_ff @(posedge clk or negedge rst_n) if (!rst_n) q <= 1'b0; else q <= 1'b1;\nendmodule\n`;

  const runOpensta = [
    "# OpenSTA timing check (Ace-Seek Pro pack)",
    `puts "Ace-Seek OpenSTA · design=${design}"`,
    `read_liberty ${paths.liberty}`,
    `read_verilog results/${top}.synth.v`,
    `link_design ${top}`,
    "read_sdc constraints.sdc",
    "report_checks -path_delay max -fields {slew cap input_pins} -digits 3",
    "report_wns",
    "report_tns",
    "report_power",
    "",
  ].join("\n");

  const runYosys = [
    "# Yosys synth (Ace-Seek Pro pack)",
    `read_verilog rtl/${top}.v`,
    `hierarchy -check -top ${top}`,
    "proc; opt; fsm; opt; memory; opt",
    "techmap; opt",
    `abc -liberty ${paths.liberty}`,
    "clean",
    `write_verilog results/${top}.synth.v`,
    "",
  ].join("\n");

  const runOpenroad = [
    "# OpenROAD floorplan/place/cts/route sketch (Ace-Seek Pro pack)",
    "# Requires OpenROAD binary + PDK LEF/liberty. Edit paths before use.",
    `puts "Ace-Seek OpenROAD · ${design} · PDK ${pdk}"`,
    `read_lef ${paths.techLef}`,
    `read_liberty ${paths.liberty}`,
    `read_verilog results/${top}.synth.v`,
    `link_design ${top}`,
    "read_sdc constraints.sdc",
    "# source corners.tcl  ;# optional multi-corner helpers",
    "initialize_floorplan -die_area {0 0 100 100} -core_area {5 5 95 95} -site unithd",
    "place_pins -hor_layers met3 -ver_layers met2",
    "global_placement -density 0.6",
    "detailed_placement",
    "clock_tree_synthesis -buf_list {sky130_fd_sc_hd__clkbuf_4}",
    "global_route",
    "detailed_route",
    `write_def results/${top}.def`,
    `write_verilog results/${top}.routed.v`,
    "report_design_area",
    "",
  ].join("\n");

  const makefile = [
    `# Ace-Seek OpenROAD flow Makefile — design ${design}`,
    `TOP ?= ${top}`,
    `PDK ?= ${pdk}`,
    "YOSYS ?= yosys",
    "OPENSTA ?= sta",
    "OPENROAD ?= openroad",
    "",
    ".PHONY: all synth sta pnr clean docker-hint",
    "",
    "all: synth sta",
    "",
    "synth:",
    "\tmkdir -p results",
    "\t$(YOSYS) -c scripts/synth.ys",
    "",
    "sta: synth",
    "\t$(OPENSTA) -exit scripts/opensta.tcl",
    "",
    "pnr: synth",
    "\t$(OPENROAD) -exit scripts/openroad.tcl",
    "",
    "docker-hint:",
    "\t@echo 'Example (local): docker run --rm -v $$PWD:/work -w /work openroad/openroad openroad -exit scripts/openroad.tcl'",
    "\t@echo 'Max plan: run the same pack on openroad.ace-seek.com workers (containerized).'",
    "",
    "clean:",
    "\trm -rf results/*",
    "",
  ].join("\n");

  const dockerSh = [
    "#!/usr/bin/env bash",
    "# Local docker helper — Ace-Seek Pro (run on your machine)",
    "set -euo pipefail",
    'IMG="${OPENROAD_IMAGE:-openroad/openroad}"',
    'echo "Using image $IMG — mount this pack directory as /work"',
    'docker run --rm -v "$PWD:/work" -w /work "$IMG" bash -lc \'mkdir -p results && openroad -exit scripts/openroad.tcl\'',
    "",
  ].join("\n");

  const readme = [
    "# Ace-Seek OpenROAD flow pack (Pro)",
    "",
    `Design: ${design}`,
    `Top: ${top}`,
    `PDK: ${pdk}`,
    "",
    paths.note,
    "",
    "## Layout",
    "```",
    "constraints.sdc",
    "corners.tcl",
    "rtl/<top>.v",
    "scripts/synth.ys",
    "scripts/opensta.tcl",
    "scripts/openroad.tcl",
    "Makefile",
    "docker-run.sh",
    "```",
    "",
    "## Local",
    "```bash",
    "make synth sta   # Yosys + OpenSTA",
    "make pnr         # OpenROAD (heavy)",
    "bash docker-run.sh",
    "```",
    "",
    "## Max (Ace-Seek hosted)",
    "Upload this project on openroad.ace-seek.com → Run (Max).",
    "Workers execute the same scripts in isolated containers with quotas.",
    "",
    "Open PDK / educational use. Not a foundry signoff substitute.",
    "",
  ].join("\n");

  const files: ExportPackFile[] = [
    { filename: "constraints.sdc", content: sdc },
    { filename: "corners.tcl", content: corners },
    { filename: `rtl/${top}.v`, content: rtl },
    { filename: "scripts/synth.ys", content: runYosys },
    { filename: "scripts/opensta.tcl", content: runOpensta },
    { filename: "scripts/openroad.tcl", content: runOpenroad },
    { filename: "Makefile", content: makefile },
    { filename: "docker-run.sh", content: dockerSh },
    { filename: "README.md", content: readme },
  ];

  // Include any extra uploaded scripts as-is
  for (const f of project.files) {
    if (f.role === "other" || f.role === "script") {
      if (!files.some((x) => x.filename === f.name)) {
        files.push({ filename: `user/${f.name}`, content: f.content });
      }
    }
  }

  return {
    files,
    zipBytes: buildZipArchive(files),
  };
}

export function downloadFlowPackZip(
  pack: OpenroadFlowPackResult,
  designName: string
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([
    pack.zipBytes.buffer.slice(
      pack.zipBytes.byteOffset,
      pack.zipBytes.byteOffset + pack.zipBytes.byteLength
    ) as ArrayBuffer,
  ], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${designName || "design"}-openroad-flow.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
