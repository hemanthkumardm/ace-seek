/**
 * Ace-Seek OpenROAD project template (downloadable) + flow config file.
 * File: ace-seek-flow.json  — stage configs; syncs with studio UI.
 */

import { buildZipArchive, type ExportPackFile } from "./sdc-export-pack";
import {
  STAGE_CONFIG_SCHEMAS,
  emptyStageInputValues,
  type StageInputValues,
} from "./openroad-stage-config";
import type { FlowStageId } from "./openroad-flow-model";
import { FLOW_STAGES } from "./openroad-flow-model";

export const FLOW_CONFIG_NAME = "ace-seek-flow.json";
export const FLOW_CONFIG_VERSION = 1 as const;

export interface AceSeekFlowConfig {
  version: typeof FLOW_CONFIG_VERSION;
  designName: string;
  topModule: string;
  pdk: string;
  /** Ordered stage ids */
  stages: FlowStageId[];
  /** Per-stage key→value (string form; empty = default at resolve time) */
  stageInputs: Partial<Record<FlowStageId, Record<string, string>>>;
  /** Completion bookmarks (optional, client-updated) */
  completedStages?: FlowStageId[];
  notes?: string[];
}

export function defaultFlowConfig(partial?: Partial<AceSeekFlowConfig>): AceSeekFlowConfig {
  const stageInputs: AceSeekFlowConfig["stageInputs"] = {};
  for (const s of STAGE_CONFIG_SCHEMAS) {
    stageInputs[s.id] = {};
    for (const f of s.fields) {
      // ship defaults filled so file is self-documenting
      stageInputs[s.id]![f.key] = String(f.defaultValue);
    }
  }
  return {
    version: FLOW_CONFIG_VERSION,
    designName: partial?.designName || "design",
    topModule: partial?.topModule || "top",
    pdk: partial?.pdk || "sky130",
    stages: FLOW_STAGES.map((s) => s.id),
    stageInputs: { ...stageInputs, ...partial?.stageInputs },
    completedStages: partial?.completedStages || [],
    notes: partial?.notes || [
      "Edit stageInputs here OR in PnR Studio UI — both stay in sync.",
      "Empty string values mean: use tool default at resolve time.",
      "Stages must complete in order: lint → simulation → synthesis → … → gds.",
    ],
  };
}

export function parseFlowConfigJson(text: string): AceSeekFlowConfig | null {
  try {
    const j = JSON.parse(text) as AceSeekFlowConfig;
    if (!j || j.version !== 1) return null;
    return {
      ...defaultFlowConfig(),
      ...j,
      stageInputs: { ...defaultFlowConfig().stageInputs, ...j.stageInputs },
    };
  } catch {
    return null;
  }
}

export function flowConfigToStageInputs(cfg: AceSeekFlowConfig): StageInputValues {
  const base = emptyStageInputValues();
  for (const s of STAGE_CONFIG_SCHEMAS) {
    const src = cfg.stageInputs?.[s.id] || {};
    base[s.id] = { ...base[s.id] };
    for (const f of s.fields) {
      // Prefer file value; if equals default, store as "" so UI shows "using default"
      const v = src[f.key];
      if (v === undefined || v === null) base[s.id][f.key] = "";
      else if (String(v) === String(f.defaultValue)) base[s.id][f.key] = "";
      else base[s.id][f.key] = String(v);
    }
  }
  return base;
}

export function stageInputsToFlowConfig(
  inputs: StageInputValues,
  meta: { designName: string; topModule: string; pdk: string; completed?: FlowStageId[] }
): AceSeekFlowConfig {
  const stageInputs: AceSeekFlowConfig["stageInputs"] = {};
  for (const s of STAGE_CONFIG_SCHEMAS) {
    stageInputs[s.id] = {};
    for (const f of s.fields) {
      const raw = (inputs[s.id]?.[f.key] ?? "").trim();
      stageInputs[s.id]![f.key] =
        raw === "" ? String(f.defaultValue) : raw;
    }
  }
  return defaultFlowConfig({
    designName: meta.designName,
    topModule: meta.topModule,
    pdk: meta.pdk,
    stageInputs,
    completedStages: meta.completed || [],
  });
}

/** Sample RTL + TB + SDC + flow config for downloadable template */
export function buildTemplatePackFiles(opts?: {
  designName?: string;
  topModule?: string;
}): ExportPackFile[] {
  const design = opts?.designName || "counter8";
  const top = opts?.topModule || "top";
  const cfg = defaultFlowConfig({
    designName: design,
    topModule: top,
    pdk: "sky130",
  });

  const rtl = `// Ace-Seek OpenROAD template RTL — ${design}
// Replace with your design; keep top module name "${top}" or update ace-seek-flow.json
\`timescale 1ns / 1ps
module ${top} (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       en,
  output reg  [7:0] count
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) count <= 8'd0;
    else if (en) count <= count + 8'd1;
  end
endmodule
`;

  const sdc = `# Ace-Seek template SDC
create_clock -name clk -period 10.0 [get_ports clk]
set_input_delay  -clock clk 1.0 [get_ports en]
set_output_delay -clock clk 1.0 [get_ports count]
`;

  const tb = `// Simple testbench for template top
\`timescale 1ns / 1ps
module tb_${top};
  reg clk = 0, rst_n = 0, en = 0;
  wire [7:0] count;
  always #5 clk = ~clk;
  ${top} dut (.clk(clk), .rst_n(rst_n), .en(en), .count(count));
  initial begin
    $dumpfile("tb.vcd");
    $dumpvars(0, tb_${top});
    rst_n = 0; en = 0;
    repeat (4) @(posedge clk);
    rst_n = 1; en = 1;
    repeat (32) @(posedge clk);
    $display("SIM_OK count=%0d", count);
    $finish;
  end
endmodule
`;

  const readme = `# Ace-Seek OpenROAD project template

## Layout
\`\`\`
ace-seek-flow.json     # stage configs (edit here or in PnR Studio UI)
rtl/${top}.v
constraints.sdc
tb/tb_${top}.v
README.md
\`\`\`

## Flow order (no skipping)
1. lint → 2. simulation → 3. synthesis → 4. io_plan → 5. floorplan → 6. powerplan
→ 7. placement → 8. cts → 9. route → 10. drc → 11. lvs → 12. gds

## Usage
1. Download this zip on openroad.ace-seek.com → Project
2. Upload zip (or edit files and re-upload)
3. PnR Studio: stage inputs auto-load from ace-seek-flow.json
4. Run stages in order only

Defaults in ace-seek-flow.json apply when Studio fields are left blank.
`;

  return [
    {
      filename: FLOW_CONFIG_NAME,
      content: JSON.stringify(cfg, null, 2) + "\n",
    },
    { filename: `rtl/${top}.v`, content: rtl },
    { filename: "constraints.sdc", content: sdc },
    { filename: `tb/tb_${top}.v`, content: tb },
    { filename: "README.md", content: readme },
  ];
}

export function downloadOpenroadTemplateZip(designName = "counter8"): void {
  if (typeof window === "undefined") return;
  const files = buildTemplatePackFiles({ designName, topModule: "top" });
  const zip = buildZipArchive(files);
  const blob = new Blob([
    zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
  ], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ace-seek-openroad-template-${designName}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
