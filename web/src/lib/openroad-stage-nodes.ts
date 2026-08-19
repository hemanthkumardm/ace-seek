/**
 * Modular stage nodes for Ace-Seek OpenROAD.
 * Each stage declares I/O contracts + pre/post assertions (pytest-style checks).
 */

import type { FlowStageId } from "./openroad-flow-model";
import type { OpenroadProjectState } from "./openroad-project-hub";
import type { StageResultPayload } from "./openroad-flow-model";
import type { StageInputValues } from "./openroad-stage-config";
import { resolveField } from "./openroad-stage-config";
import { getPdkDef } from "./openroad-pdk-catalog";

export type NodeIOKind =
  | "rtl"
  | "tb"
  | "sdc"
  | "netlist"
  | "def"
  | "gds"
  | "spef"
  | "report"
  | "checkpoint"
  | "vcd"
  | "config";

export interface StageNodeDef {
  id: FlowStageId;
  label: string;
  /** Human description */
  description: string;
  /** What this node consumes */
  inputs: NodeIOKind[];
  /** What this node produces */
  outputs: NodeIOKind[];
  /** Docker / tool */
  tool: string;
  /** Optional ADK/PDK required */
  needsAdk: boolean;
  /** OpenLane until-token when applicable */
  openlaneUntil?: string;
}

/** Ordered node library (open-source path) */
export const STAGE_NODES: StageNodeDef[] = [
  {
    id: "lint",
    label: "Lint",
    description: "Verilator lint-only (Docker)",
    inputs: ["rtl"],
    outputs: ["report"],
    tool: "verilator@docker",
    needsAdk: false,
  },
  {
    id: "simulation",
    label: "Simulation",
    description: "Icarus functional sim + VCD (Docker)",
    inputs: ["rtl", "tb"],
    outputs: ["report", "vcd"],
    tool: "iverilog@docker",
    needsAdk: false,
  },
  {
    id: "synthesis",
    label: "Synthesis",
    description: "Yosys RTL→gates; writes flow checkpoint (Docker)",
    inputs: ["rtl", "sdc", "config"],
    outputs: ["netlist", "report", "checkpoint"],
    tool: "yosys@docker",
    needsAdk: true,
    openlaneUntil: "synthesis",
  },
  {
    id: "io_plan",
    label: "IO Planner",
    description: "Interactive pin sides N/S/E/W → pin_order.cfg for floorplan",
    inputs: ["rtl", "config"],
    outputs: ["config", "report"],
    tool: "ace-seek@local",
    needsAdk: false,
  },
  {
    id: "floorplan",
    label: "Floorplan",
    description: "Die/core, IO, tap/decap from checkpoint + pin_order",
    inputs: ["checkpoint", "netlist", "sdc", "config"],
    outputs: ["def", "report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    openlaneUntil: "floorplan",
  },
  {
    id: "powerplan",
    label: "Powerplan",
    description:
      "PDN straps/rings — OpenLane runs this inside the floorplan step (same until=floorplan)",
    inputs: ["checkpoint", "config"],
    outputs: ["def", "report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    // OpenLane has no separate powerplan stop; PDN is part of run_floorplan
    openlaneUntil: "floorplan",
  },
  {
    id: "placement",
    label: "Placement",
    description: "Global + detailed place",
    inputs: ["checkpoint", "config"],
    outputs: ["def", "report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    openlaneUntil: "placement",
  },
  {
    id: "cts",
    label: "CTS",
    description: "Clock tree synthesis",
    inputs: ["checkpoint", "config"],
    outputs: ["def", "report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    openlaneUntil: "cts",
  },
  {
    id: "route",
    label: "Route",
    description: "Global + detailed route",
    inputs: ["checkpoint", "config"],
    outputs: ["def", "report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    openlaneUntil: "routing",
  },
  {
    id: "drc",
    label: "DRC",
    description: "Design rule checks",
    inputs: ["checkpoint"],
    outputs: ["report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    openlaneUntil: "drc",
  },
  {
    id: "lvs",
    label: "LVS",
    description: "Layout vs schematic",
    inputs: ["checkpoint", "netlist"],
    outputs: ["report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    openlaneUntil: "lvs",
  },
  {
    id: "gds",
    label: "GDS",
    description: "Stream-out + signoff finish",
    inputs: ["checkpoint"],
    outputs: ["gds", "report", "checkpoint"],
    tool: "openlane@docker",
    needsAdk: true,
    openlaneUntil: "all",
  },
];

export function getStageNode(id: FlowStageId): StageNodeDef | undefined {
  return STAGE_NODES.find((n) => n.id === id);
}

export type AssertLevel = "ok" | "warn" | "error";

export interface StageAssertion {
  id: string;
  stage: FlowStageId | "global";
  level: AssertLevel;
  message: string;
  /** pre = before run, post = after result */
  phase: "pre" | "post";
}

function hasRtl(project: OpenroadProjectState): boolean {
  return project.files.some(
    (f) =>
      /\.(v|sv)$/i.test(f.name) &&
      !/\/tb\//i.test(f.name) &&
      !/^tb_/i.test(f.name.split("/").pop() || "")
  );
}

function hasTb(project: OpenroadProjectState): boolean {
  return project.files.some(
    (f) =>
      /\/tb\//i.test(f.name) ||
      /^tb_/i.test(f.name.split("/").pop() || "") ||
      /_tb\./i.test(f.name)
  );
}

function hasSdc(project: OpenroadProjectState): boolean {
  return project.files.some((f) => f.role === "sdc" || /\.sdc$/i.test(f.name));
}

/** Preconditions before running a stage */
export function runPreAssertions(
  stage: FlowStageId,
  project: OpenroadProjectState,
  values: StageInputValues,
  opts?: { completed?: FlowStageId[]; hasCheckpoint?: boolean }
): StageAssertion[] {
  const out: StageAssertion[] = [];
  const node = getStageNode(stage);
  const completed = opts?.completed || [];
  const idx = STAGE_NODES.findIndex((n) => n.id === stage);

  // Order: prior stages must be done
  for (let i = 0; i < idx; i++) {
    const prev = STAGE_NODES[i].id;
    if (!completed.includes(prev)) {
      out.push({
        id: `ORDER_${prev}`,
        stage,
        level: "error",
        phase: "pre",
        message: `Complete "${STAGE_NODES[i].label}" before ${node?.label || stage}`,
      });
    }
  }

  if (node?.inputs.includes("rtl") && !hasRtl(project)) {
    out.push({
      id: "NEED_RTL",
      stage,
      level: "error",
      phase: "pre",
      message: "RTL (.v/.sv) required — upload on Project or edit in Design",
    });
  }
  if (node?.inputs.includes("tb") && !hasTb(project)) {
    out.push({
      id: "NEED_TB",
      stage,
      level: "error",
      phase: "pre",
      message: "Testbench required (tb_*.v or tb/…)",
    });
  }
  if (node?.inputs.includes("sdc") && !hasSdc(project) && stage !== "lint") {
    out.push({
      id: "NEED_SDC",
      stage,
      level: stage === "simulation" ? "warn" : "error",
      phase: "pre",
      message: "constraints.sdc missing — timing/synth quality will suffer",
    });
  }
  if (
    node?.inputs.includes("checkpoint") &&
    stage !== "synthesis" &&
    opts?.hasCheckpoint === false
  ) {
    // Soft warn only — OpenLane often resumes via stable job dir (ace_run) even
    // without an Ace-Seek checkpoints/<slug>/manifest.json pack.
    out.push({
      id: "NEED_CKPT",
      stage,
      level: "warn",
      phase: "pre",
      message:
        "No Ace-Seek checkpoint pack found for this design slug — if you already ran Floorplan/Place/CTS/Route, OpenLane may still resume from the job dir. Otherwise it rebuilds from RTL (slower).",
    });
  }

  if (node?.needsAdk) {
    const pdk = getPdkDef(project.pdk);
    if (pdk.runner === "scripts_only") {
      out.push({
        id: "ADK_GENERIC",
        stage,
        level: "error",
        phase: "pre",
        message: "PDK 'generic' cannot run Docker PnR — pick sky130 / gf180mcu / …",
      });
    }
  }

  if (stage === "floorplan" || stage === "placement") {
    const die = String(resolveField("floorplan", "DIE_AREA", values));
    if (!/^\s*[\d.]+\s+[\d.]+\s+[\d.]+\s+[\d.]+\s*$/.test(die)) {
      out.push({
        id: "DIE_AREA",
        stage: "floorplan",
        level: "warn",
        phase: "pre",
        message: "DIE_AREA should be four numbers (llx lly urx ury)",
      });
    }
  }

  return out;
}

/** Postconditions after a stage result */
export function runPostAssertions(
  stage: FlowStageId,
  result: StageResultPayload | undefined,
  opts?: { ok?: boolean }
): StageAssertion[] {
  const out: StageAssertion[] = [];
  if (!result) {
    out.push({
      id: "NO_RESULT",
      stage,
      level: "error",
      phase: "post",
      message: "Stage finished without a result payload",
    });
    return out;
  }

  if (result.kind === "io_plan") {
    if (result.total === 0) {
      out.push({
        id: "IO_NO_PORTS",
        stage: "io_plan",
        level: "error",
        phase: "post",
        message: "No ports parsed — check top module / RTL",
      });
    } else if (result.placed < result.total) {
      out.push({
        id: "IO_PARTIAL",
        stage: "io_plan",
        level: "warn",
        phase: "post",
        message: `Only ${result.placed}/${result.total} pins placed on die sides`,
      });
    } else {
      out.push({
        id: "IO_OK",
        stage: "io_plan",
        level: "ok",
        phase: "post",
        message: `pin_order.cfg ready (${result.placed} pins)`,
      });
    }
    return out;
  }

  if (result.kind === "lint") {
    if (result.errorCount > 0) {
      out.push({
        id: "LINT_ERRORS",
        stage,
        level: "error",
        phase: "post",
        message: `Lint reported ${result.errorCount} error(s)`,
      });
    }
    if (result.warnCount > 20) {
      out.push({
        id: "LINT_MANY_WARN",
        stage,
        level: "warn",
        phase: "post",
        message: `High warning count (${result.warnCount}) — review RTL`,
      });
    }
  }

  if (result.kind === "sim") {
    if (!result.ok) {
      out.push({
        id: "SIM_FAIL",
        stage,
        level: "error",
        phase: "post",
        message: "Simulation did not report SIM_OK / exit 0",
      });
    }
    if (!result.vcd && result.ok) {
      out.push({
        id: "SIM_NO_VCD",
        stage,
        level: "warn",
        phase: "post",
        message: "No VCD produced — add $dumpfile/$dumpvars for waveforms",
      });
    }
  }

  if (result.kind === "synth") {
    if (opts?.ok === false) {
      out.push({
        id: "SYNTH_FAIL",
        stage,
        level: "error",
        phase: "post",
        message: result.summary || "Synthesis failed",
      });
    }
    if (result.cellCount != null && result.cellCount === 0) {
      out.push({
        id: "SYNTH_ZERO_CELLS",
        stage,
        level: "error",
        phase: "post",
        message: "Synthesis produced 0 cells — check top module / RTL",
      });
    }
    if (result.cellCount != null && result.cellCount > 0 && result.cellCount < 3) {
      out.push({
        id: "SYNTH_TINY",
        stage,
        level: "warn",
        phase: "post",
        message: `Only ${result.cellCount} cell(s) — confirm this is the intended design`,
      });
    }
    if (!result.netlist && opts?.ok !== false) {
      out.push({
        id: "SYNTH_NO_NETLIST",
        stage,
        level: "warn",
        phase: "post",
        message: "No netlist text captured — checkpoint may still exist on server",
      });
    }
  }

  if (result.kind === "generic" && /failed|ERROR/i.test(result.summary + result.log)) {
    out.push({
      id: "STAGE_FAIL",
      stage,
      level: "error",
      phase: "post",
      message: result.summary || "Stage reported failure",
    });
  }

  return out;
}

export function assertionsOk(items: StageAssertion[]): boolean {
  return !items.some((a) => a.level === "error");
}
