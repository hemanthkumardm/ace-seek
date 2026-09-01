/**
 * Max: OpenROAD job model — dry_run (synthetic) or real Docker OpenLane (synth→GDS).
 */

import type { OpenroadProjectState } from "./openroad-project-hub";
import { getFileByRole, projectHealth } from "./openroad-project-hub";
import { buildOpenroadFlowScripts } from "./openroad-scripts-engine";
import {
  startOpenroadDockerJob,
  getDockerJob,
  type DockerJobRecord,
} from "./openroad-docker-runner";

export type OpenroadJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "rejected"
  | "preparing"
  | "collecting";

export interface OpenroadJobRequest {
  project: OpenroadProjectState;
  /** dry_run = synthetic STA; container = real OpenLane Docker synth→GDS */
  mode?: "dry_run" | "container";
  /** If true and mode=container, start async docker job */
  async?: boolean;
  /** User stage inputs resolved to OpenLane config keys */
  openlaneConfig?: Record<string, string | number | boolean>;
  /**
   * Studio stage id — OpenLane stops after this step when set
   * (synthesis | floorplan | placement | cts | route | gds | …)
   */
  untilStage?: string;
  /** Sprint A — tenant owner (required for container mode) */
  owner?: import("./openroad-owner").OpenroadOwner;
}

export interface OpenroadJobResult {
  jobId: string;
  status: OpenroadJobStatus;
  mode: "dry_run" | "container";
  message: string;
  startedAt: string;
  finishedAt?: string;
  log: string;
  artifacts: { name: string; content?: string; path?: string; size?: number }[];
  metrics?: {
    wnsNs?: number;
    tnsNs?: number;
    designAreaUm2?: number;
  };
  gdsFiles?: string[];
  /** Poll GET /api/openroad/jobs/:id */
  pollUrl?: string;
}

function makeJobId(seed: string): string {
  let h = 2166136261;
  const s = `${seed}|${Math.floor(Date.now() / 1000)}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `orj_${(h >>> 0).toString(36)}`;
}

function syntheticMetrics(design: string, period: number): {
  wns: number;
  tns: number;
  area: number;
} {
  let h = 0;
  for (let i = 0; i < design.length; i++) h = (h * 31 + design.charCodeAt(i)) | 0;
  const u = Math.abs(h % 1000) / 1000;
  const wns = Number((-0.12 - u * 0.35).toFixed(3));
  const paths = 3 + (Math.abs(h) % 5);
  const tns = Number((wns * paths).toFixed(3));
  const area = 1200 + (Math.abs(h) % 800);
  void period;
  return { wns, tns, area };
}

function dockerToResult(d: DockerJobRecord): OpenroadJobResult {
  // Queue-depth rejection surfaces as rejected (API maps exitCode 429 → HTTP 429)
  const status: OpenroadJobStatus =
    d.queueRejected || d.exitCode === 429
      ? "rejected"
      : d.exitCode === 409
        ? "rejected"
        : (d.status as OpenroadJobStatus);
  return {
    jobId: d.jobId,
    status,
    mode: "container",
    message: d.message,
    startedAt: d.startedAt,
    finishedAt: d.finishedAt,
    log: d.logTail,
    artifacts: d.artifacts.map((a) => ({
      name: a.name,
      path: a.path,
      size: a.size,
    })),
    metrics: d.metrics,
    gdsFiles: d.gdsFiles,
    pollUrl: `/api/openroad/jobs/${d.jobId}`,
  };
}

/**
 * Execute OpenROAD job.
 * - dry_run: immediate synthetic OpenSTA log
 * - container: starts real OpenLane Docker (async) → poll job status
 */
export function executeOpenroadJob(req: OpenroadJobRequest): OpenroadJobResult {
  const designSeed = req.project?.designName || "design";
  const startedAt = new Date().toISOString();
  const mode = req.mode || "dry_run";
  const health = projectHealth(req.project);

  if (!health.readyForScripts) {
    return {
      jobId: makeJobId(designSeed),
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
    if (!req.owner?.ownerId) {
      return {
        jobId: makeJobId(designSeed),
        status: "rejected",
        mode,
        message: "Missing owner — authenticate with x-api-key before container runs",
        startedAt,
        finishedAt: new Date().toISOString(),
        log: "ERROR: missing owner",
        artifacts: [],
      };
    }
    const rec = startOpenroadDockerJob(req.project, req.openlaneConfig, {
      untilStage: req.untilStage,
      owner: req.owner,
    });
    return dockerToResult(rec);
  }

  // ---- dry_run (synthetic) ----
  const jobId = makeJobId(designSeed);
  const pack = buildOpenroadFlowScripts(req.project);
  const sdc = getFileByRole(req.project, "sdc")?.content || "";
  const design = req.project.designName || "design";
  const top = req.project.topModule || "top";
  const periodMatch = sdc.match(/-period\s+([0-9.]+)/i);
  const period = periodMatch ? parseFloat(periodMatch[1]) : 10;
  const { wns, tns, area } = syntheticMetrics(design, period);

  const log = [
    "========================================",
    " Ace-Seek OpenROAD dry-run (Max)",
    ` job_id     : ${jobId}`,
    ` design     : ${design}`,
    ` top        : ${top}`,
    ` pdk        : ${req.project.pdk}`,
    ` mode       : dry_run (no Docker)`,
    ` started    : ${startedAt}`,
    "========================================",
    "",
    "For REAL synth→GDS use mode=container (OpenLane Docker).",
    "",
    "OpenSTA-style report (synthetic)",
    "----------------------------------------------------",
    `Startpoint: ${top}/u_reg_a/Q`,
    `Endpoint  : ${top}/u_reg_b/D`,
    `  ${wns.toFixed(3)}   slack (VIOLATED)`,
    `wns ${wns.toFixed(3)}`,
    `tns ${tns.toFixed(3)}`,
    "",
  ].join("\n");

  return {
    jobId,
    status: "succeeded",
    mode: "dry_run",
    message:
      "Dry-run only. Switch to container mode for real OpenLane Docker synth→GDS.",
    startedAt,
    finishedAt: new Date().toISOString(),
    log,
    artifacts: [
      { name: "timing_dry_run.rpt", content: log },
      ...pack.files.map((f) => ({ name: f.filename, content: f.content })),
    ],
    metrics: { wnsNs: wns, tnsNs: tns, designAreaUm2: area },
  };
}

export function pollOpenroadJob(
  jobId: string,
  ownerId?: string
): OpenroadJobResult | null {
  const d = getDockerJob(jobId, ownerId);
  if (!d) return null;
  if (ownerId && d.ownerId !== ownerId) return null;
  return dockerToResult(d);
}
