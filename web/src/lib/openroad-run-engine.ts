/**
 * Max: OpenROAD job model.
 *
 * Phase 1: in-process "simulate" run that produces a synthetic OpenSTA-style log
 * so Report Hub / Timing can still be exercised.
 * Phase 2: swap executeOpenroadJob body for real Docker/worker queue.
 */

import type { OpenroadProjectState } from "./openroad-project-hub";
import { getFileByRole, projectHealth } from "./openroad-project-hub";
import { buildOpenroadFlowScripts } from "./openroad-scripts-engine";

export type OpenroadJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "rejected";

export interface OpenroadJobRequest {
  project: OpenroadProjectState;
  /** dry_run = generate scripts + synthetic log only (default until workers live) */
  mode?: "dry_run" | "container";
}

export interface OpenroadJobResult {
  jobId: string;
  status: OpenroadJobStatus;
  mode: "dry_run" | "container";
  message: string;
  startedAt: string;
  finishedAt?: string;
  /** Synthetic or real tool log */
  log: string;
  /** Files produced (scripts pack + log) */
  artifacts: { name: string; content: string }[];
  metrics?: {
    wnsNs?: number;
    tnsNs?: number;
    designAreaUm2?: number;
  };
}

function makeJobId(): string {
  return `orj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Execute (or simulate) an OpenROAD job for Max users.
 * Container mode returns rejected until a worker fleet is wired.
 */
export function executeOpenroadJob(req: OpenroadJobRequest): OpenroadJobResult {
  const jobId = makeJobId();
  const startedAt = new Date().toISOString();
  const mode = req.mode || "dry_run";
  const health = projectHealth(req.project);

  if (!health.readyForScripts) {
    return {
      jobId,
      status: "rejected",
      mode,
      message: "Upload constraints.sdc (VLSI OpenROAD handoff) before running.",
      startedAt,
      finishedAt: new Date().toISOString(),
      log: "ERROR: missing SDC",
      artifacts: [],
    };
  }

  if (mode === "container") {
    // Placeholder for real Docker workers
    return {
      jobId,
      status: "rejected",
      mode,
      message:
        "Container workers are not enabled on this deployment yet. Use dry_run for a synthetic OpenSTA log, or download the Pro flow pack and run Docker locally.",
      startedAt,
      finishedAt: new Date().toISOString(),
      log: [
        "Ace-Seek OpenROAD runner",
        `job=${jobId}`,
        "status=rejected",
        "reason=workers_not_provisioned",
        "hint=POST mode=dry_run or use scripts pack + local docker-run.sh",
      ].join("\n"),
      artifacts: [],
    };
  }

  const pack = buildOpenroadFlowScripts(req.project);
  const sdc = getFileByRole(req.project, "sdc")?.content || "";
  const design = req.project.designName || "design";
  const top = req.project.topModule || "top";

  // Lightweight synthetic timing so users can paste into Timing Studio
  const periodMatch = sdc.match(/-period\s+([0-9.]+)/i);
  const period = periodMatch ? parseFloat(periodMatch[1]) : 10;
  const wns = Number((-0.12 - Math.random() * 0.35).toFixed(3));
  const tns = Number((wns * (3 + Math.floor(Math.random() * 5))).toFixed(3));

  const log = [
    "========================================",
    " Ace-Seek OpenROAD dry-run (Max)",
    ` job_id     : ${jobId}`,
    ` design     : ${design}`,
    ` top        : ${top}`,
    ` pdk        : ${req.project.pdk}`,
    ` mode       : dry_run (no Docker worker)`,
    ` started    : ${startedAt}`,
    "========================================",
    "",
    "OpenSTA-style report (synthetic for pipeline testing)",
    "----------------------------------------------------",
    `Startpoint: ${top}/u_reg_a/Q (rising edge-triggered flip-flop clocked by clk)`,
    `Endpoint  : ${top}/u_reg_b/D (rising edge-triggered flip-flop clocked by clk)`,
    `Path Group: reg2reg`,
    "",
    "  Delay    Time   Description",
    "---------------------------------------------------------",
    `   0.000    0.000  clock clk (rise edge)`,
    `   0.050    0.050  clock network delay (ideal)`,
    `   ${(period * 0.35).toFixed(3)}    ${(period * 0.35).toFixed(3)}  data arrival time`,
    `   ${period.toFixed(3)}    ${period.toFixed(3)}  clock clk (rise edge)`,
    `  ${wns.toFixed(3)}   slack (VIOLATED)`,
    "",
    `wns ${wns.toFixed(3)}`,
    `tns ${tns.toFixed(3)}`,
    "",
    `Pack files generated: ${pack.files.length}`,
    "Next: enable container workers for real OpenROAD, or run docker-run.sh locally.",
    "",
  ].join("\n");

  const finishedAt = new Date().toISOString();

  return {
    jobId,
    status: "succeeded",
    mode: "dry_run",
    message:
      "Dry-run completed. Synthetic OpenSTA log ready — paste into VLSI Timing Studio / Report Hub. Container mode pending worker fleet.",
    startedAt,
    finishedAt,
    log,
    artifacts: [
      { name: "timing_dry_run.rpt", content: log },
      ...pack.files.map((f) => ({ name: f.filename, content: f.content })),
    ],
    metrics: {
      wnsNs: wns,
      tnsNs: tns,
      designAreaUm2: 1200 + Math.floor(Math.random() * 800),
    },
  };
}
