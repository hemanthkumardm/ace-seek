/**
 * Real OpenLane Docker (synth → GDS) runner for Ace-Seek Max.
 *
 * Spawns workers/openroad/run_openlane.sh which uses:
 *   - efabless/openlane image
 *   - PDK_ROOT (default ~/.volare / sky130A)
 *   - optional OPENROAD_SSH_* for remote logiclance host
 *
 * Jobs live under OPENROAD_JOBS_DIR/owners/<ownerId>/jobs/ (Sprint A).
 * Production requires a durable OPENROAD_JOBS_DIR (not /tmp).
 *
 * Sprint 2: disk-backed queue + host/per-owner concurrency caps.
 * Jobs start as status=queued; tryDispatchOpenroadQueue spawns when under cap.
 */

import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import type { OpenroadProjectState } from "./openroad-project-hub";
import { getFileByRole } from "./openroad-project-hub";
import {
  probePdkAvailability,
  resolveRunnerPdk,
} from "./openroad-pdk";
import {
  snapshotOpenlaneJobToCheckpoint,
  safeDesignSlug,
} from "./openroad-checkpoints";
import {
  STAGE_TO_OPENLANE_UNTIL,
} from "./openroad-until-map";
import {
  type FlowStageId,
  type FlowMetrics,
  parseMetricsCsv,
  parsePlacementTimingReport,
} from "./openroad-flow-model";
import {
  getOpenroadJobsRoot,
  mapKey,
  ownerJobDir,
  ownerJobsDir,
  resolveOwnedJobDir,
  safeOwnerId,
  writeOwnerMeta,
  type OpenroadOwner,
} from "./openroad-owner";

export type DockerJobPhase =
  | "queued"
  | "preparing"
  | "running"
  | "collecting"
  | "succeeded"
  | "failed";

export interface DockerJobRecord {
  jobId: string;
  /** Tenant isolation key — required for Sprint A */
  ownerId: string;
  status: DockerJobPhase;
  message: string;
  designName: string;
  topModule: string;
  pdk: string;
  mode: "container";
  startedAt: string;
  finishedAt?: string;
  jobDir: string;
  logTail: string;
  artifacts: { name: string; path: string; size: number }[];
  gdsFiles: string[];
  pid?: number;
  exitCode?: number | null;
  /** Sprint 2 — set when rejected for queue depth */
  queueRejected?: boolean;
  /** Sprint C — server-side extracted PPA metrics */
  metrics?: Partial<FlowMetrics>;
  /** Sprint C — structured telemetry */
  telemetry?: {
    durationSec?: number;
    errorCategory?: string;
  };
}

/** Persist enough to spawn after queue wait / process restart */
export type OpenroadSpawnMeta = {
  version: 1;
  jobId: string;
  ownerId: string;
  persistSlug: string;
  designName: string;
  topModule: string;
  untilStage: string;
  until: string;
  pdkLabel: string;
  runner: "orfs" | "openlane";
  openlanePdk: string;
  orfsPlatform: string;
  pdkId: string;
  pdkRoot: string;
  orfsRoot: string;
  overwrite: "0" | "1";
  ckptSlug: string;
  enqueuedAt: string;
};

const jobs = new Map<string, DockerJobRecord>();
/** Keyed by mapKey(ownerId, jobId) — Sprint 2 fix for cross-tenant ol_* collisions */
const children = new Map<string, ChildProcess>();

let dispatchTimer: ReturnType<typeof setInterval> | null = null;
let dispatchRunning = false;

export type OpenroadQueueCaps = {
  maxConcurrentJobs: number;
  maxConcurrentPerOwner: number;
  maxQueuedPerOwner: number;
  maxQueuedGlobal: number;
  dispatchMs: number;
};

export function openroadQueueCaps(): OpenroadQueueCaps {
  const n = (key: string, fallback: number) => {
    const v = Number(process.env[key]);
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
  };
  return {
    maxConcurrentJobs: n("OPENROAD_MAX_CONCURRENT_JOBS", 1),
    maxConcurrentPerOwner: n("OPENROAD_MAX_CONCURRENT_PER_OWNER", 1),
    maxQueuedPerOwner: n("OPENROAD_MAX_QUEUED_PER_OWNER", 3),
    maxQueuedGlobal: n("OPENROAD_MAX_QUEUED_GLOBAL", 10),
    dispatchMs: n("OPENROAD_QUEUE_DISPATCH_MS", 2000),
  };
}

function isActivePhase(s?: string): boolean {
  return (
    s === "queued" ||
    s === "preparing" ||
    s === "running" ||
    s === "collecting"
  );
}

function isRunningPhase(s?: string): boolean {
  return s === "preparing" || s === "running" || s === "collecting";
}

function writeStatusJson(
  jobDir: string,
  status: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  try {
    fs.writeFileSync(
      path.join(jobDir, "status.json"),
      JSON.stringify(
        {
          status,
          message,
          updatedAt: new Date().toISOString(),
          ...extra,
        },
        null,
        2
      ),
      "utf8"
    );
  } catch {
    /* */
  }
}

function writeSpawnMeta(jobDir: string, meta: OpenroadSpawnMeta): void {
  fs.writeFileSync(
    path.join(jobDir, "spawn.json"),
    JSON.stringify(meta, null, 2),
    "utf8"
  );
}

function readSpawnMeta(jobDir: string): OpenroadSpawnMeta | null {
  try {
    const p = path.join(jobDir, "spawn.json");
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as OpenroadSpawnMeta;
  } catch {
    return null;
  }
}

function indexJob(rec: DockerJobRecord, persistSlug?: string): void {
  jobs.set(mapKey(rec.ownerId, rec.jobId), rec);
  if (persistSlug && persistSlug !== rec.jobId) {
    jobs.set(mapKey(rec.ownerId, persistSlug), rec);
  }
}

/** Scan owner job dirs for phase counts (durable truth). */
function scanJobPhases(): {
  running: number;
  queued: number;
  runningByOwner: Map<string, number>;
  queuedByOwner: Map<string, number>;
} {
  const runningByOwner = new Map<string, number>();
  const queuedByOwner = new Map<string, number>();
  let running = 0;
  let queued = 0;

  // Live children are authoritative for "running" (dedupe persistSlug aliases)
  const seenChildJobs = new Set<string>();
  for (const k of children.keys()) {
    const [oid, jid] = k.split("::");
    if (!oid || !jid) continue;
    // Count once per jobId — persistSlug alias shares same ChildProcess
    const rec = jobs.get(k);
    const canon = rec ? mapKey(oid, rec.jobId) : k;
    if (seenChildJobs.has(canon)) continue;
    seenChildJobs.add(canon);
    running += 1;
    runningByOwner.set(oid, (runningByOwner.get(oid) || 0) + 1);
  }

  try {
    const root = path.join(getOpenroadJobsRoot(), "owners");
    if (!fs.existsSync(root)) {
      return { running, queued, runningByOwner, queuedByOwner };
    }
    for (const oid of fs.readdirSync(root)) {
      const jroot = path.join(root, oid, "jobs");
      if (!fs.existsSync(jroot)) continue;
      for (const name of fs.readdirSync(jroot)) {
        const dir = path.join(jroot, name);
        try {
          if (!fs.statSync(dir).isDirectory()) continue;
        } catch {
          continue;
        }
        const st = readStatusFile(dir).status;
        if (st === "queued") {
          queued += 1;
          queuedByOwner.set(oid, (queuedByOwner.get(oid) || 0) + 1);
        } else if (isRunningPhase(st) && !children.has(mapKey(oid, name))) {
          // Disk says running but no child — still count until orphan reconcile
          const meta = readSpawnMeta(dir);
          const canon = mapKey(oid, meta?.jobId || name);
          if (seenChildJobs.has(canon)) continue;
          seenChildJobs.add(canon);
          running += 1;
          runningByOwner.set(oid, (runningByOwner.get(oid) || 0) + 1);
        }
      }
    }
  } catch {
    /* */
  }
  return { running, queued, runningByOwner, queuedByOwner };
}

function ensureDispatchTimer(): void {
  if (dispatchTimer) return;
  const ms = openroadQueueCaps().dispatchMs;
  dispatchTimer = setInterval(() => {
    try {
      tryDispatchOpenroadQueue();
    } catch {
      /* */
    }
  }, Math.max(500, ms));
  // Don't keep process alive solely for the timer in some runtimes
  if (typeof dispatchTimer === "object" && "unref" in dispatchTimer) {
    try {
      (dispatchTimer as NodeJS.Timeout).unref();
    } catch {
      /* */
    }
  }
}

function repoRoot(): string {
  // web/src/lib → web → ace-seek
  return path.resolve(process.cwd(), process.cwd().endsWith("web") ? ".." : ".");
}

function jobsRoot(): string {
  return getOpenroadJobsRoot();
}

function workerDir(): string {
  return path.join(repoRoot(), "workers", "openroad");
}

function isRunnerEnabled(): boolean {
  const v = process.env.OPENROAD_RUNNER_ENABLED;
  if (v === "0" || v === "false") return false;
  // Default enable when docker binary exists (local max runs)
  if (v === "1" || v === "true") return true;
  try {
    return fs.existsSync("/usr/bin/docker") || fs.existsSync("/usr/local/bin/docker");
  } catch {
    return false;
  }
}

function makeJobId(): string {
  return `orj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeSlug(s: string): string {
  return (s || "design").replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 48);
}

/** Testbench / sim-only — must not enter OpenLane synth sources */
function isTestbenchFile(name: string, content?: string): boolean {
  const n = name.replace(/\\/g, "/").toLowerCase();
  const base = n.split("/").pop() || n;
  if (n.includes("/tb/") || base.startsWith("tb_") || base.startsWith("tb."))
    return true;
  if (/_tb\.|_test\.|_tb_/.test(base)) return true;
  if (
    content &&
    /\$dumpfile|\$dumpvars|\$finish|always\s*#/.test(content)
  ) {
    return true;
  }
  return false;
}

function writeInputFiles(jobDir: string, project: OpenroadProjectState): void {
  const input = path.join(jobDir, "input");
  const tbDir = path.join(input, "tb");
  fs.mkdirSync(input, { recursive: true });
  fs.mkdirSync(tbDir, { recursive: true });

  const sdc = getFileByRole(project, "sdc")?.content;
  if (sdc) fs.writeFileSync(path.join(input, "constraints.sdc"), sdc, "utf8");

  for (const f of project.files) {
    if (!/\.(v|sv)$/i.test(f.name)) continue;
    const base = path.basename(f.name);
    if (isTestbenchFile(f.name, f.content)) {
      // Sim-only — prepare_design excludes these from OpenLane synth
      fs.writeFileSync(path.join(tbDir, base), f.content, "utf8");
      continue;
    }
    fs.writeFileSync(path.join(input, base), f.content, "utf8");
  }

  // IO planner pin_order.cfg (OpenLane FP_PIN_ORDER_CFG)
  const pinOrder =
    project.files.find(
      (f) =>
        f.name.toLowerCase() === "pin_order.cfg" ||
        f.name.toLowerCase().endsWith("/pin_order.cfg")
    )?.content || "";
  if (pinOrder.trim()) {
    fs.writeFileSync(path.join(input, "pin_order.cfg"), pinOrder, "utf8");
  }

  // corners for reference (not always consumed by OpenLane)
  const corners = getFileByRole(project, "corners")?.content;
  if (corners) {
    fs.writeFileSync(path.join(input, "corners.tcl"), corners, "utf8");
  }

  fs.writeFileSync(
    path.join(jobDir, "project.json"),
    JSON.stringify(
      {
        designName: project.designName,
        topModule: project.topModule,
        pdk: project.pdk,
        files: project.files.map((f) => f.name),
      },
      null,
      2
    ),
    "utf8"
  );
}

/** Cache poll snapshots — getDockerJob is called every ~2.5s and must stay cheap */
const artifactCache = new Map<
  string,
  {
    key: string;
    artifacts: DockerJobRecord["artifacts"];
    gdsFiles: string[];
    logTail: string;
  }
>();

/** Read only the last N bytes of a log (avoid loading multi‑MB run.log on every poll) */
function readLogTail(logPath: string, maxBytes = 16_384): string {
  try {
    if (!fs.existsSync(logPath)) return "";
    const st = fs.statSync(logPath);
    if (st.size <= maxBytes) return fs.readFileSync(logPath, "utf8");
    const fd = fs.openSync(logPath, "r");
    try {
      const buf = Buffer.alloc(maxBytes);
      fs.readSync(fd, buf, 0, maxBytes, Math.max(0, st.size - maxBytes));
      // drop partial first line
      const s = buf.toString("utf8");
      const i = s.indexOf("\n");
      return i >= 0 ? s.slice(i + 1) : s;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return "";
  }
}

function collectArtifacts(jobDir: string): {
  artifacts: DockerJobRecord["artifacts"];
  gdsFiles: string[];
  logTail: string;
} {
  const results = path.join(jobDir, "results");
  fs.mkdirSync(results, { recursive: true });
  const logPath = path.join(jobDir, "run.log");

  // Cache key: results mtime + file count + log size
  let cacheKey = "empty";
  try {
    const rst = fs.existsSync(results) ? fs.statSync(results) : null;
    const lst = fs.existsSync(logPath) ? fs.statSync(logPath) : null;
    const n = rst ? fs.readdirSync(results).length : 0;
    cacheKey = `${rst?.mtimeMs || 0}:${n}:${lst?.size || 0}:${lst?.mtimeMs || 0}`;
  } catch {
    /* */
  }
  const hit = artifactCache.get(jobDir);
  if (hit && hit.key === cacheKey) {
    return {
      artifacts: hit.artifacts,
      gdsFiles: hit.gdsFiles,
      logTail: hit.logTail,
    };
  }

  const artifacts: DockerJobRecord["artifacts"] = [];
  const gdsFiles: string[] = [];
  const seen = new Set<string>();

  const addFile = (abs: string, displayName: string, copyIntoResults = false) => {
    try {
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return;
      const st = fs.statSync(abs);
      const safe = displayName
        .replace(/\\/g, "/")
        .replace(/^\//, "")
        .replace(/[^a-zA-Z0-9._/-]+/g, "_")
        .replace(/\//g, "_");
      const base = safe || path.basename(abs);
      if (seen.has(base.toLowerCase())) return;
      seen.add(base.toLowerCase());
      let usePath = abs;
      if (copyIntoResults) {
        const dest = path.join(results, base);
        if (path.resolve(abs) !== path.resolve(dest)) {
          try {
            fs.copyFileSync(abs, dest);
            usePath = dest;
          } catch {
            /* keep original path */
          }
        } else {
          usePath = dest;
        }
      }
      artifacts.push({ name: base, path: usePath, size: st.size });
      if (/\.gds(\.gz)?$/i.test(base)) gdsFiles.push(base);
    } catch {
      /* skip */
    }
  };

  // Curated results/ only — never walk full OpenLane tree on poll
  if (fs.existsSync(results)) {
    for (const name of fs.readdirSync(results)) {
      const low = name.toLowerCase();
      if (
        /tmp_placement|global_skip|tmp_merged|\.lef$|logs_placement_.*\.log$|ace_run_tmp|run_ace_run_tmp|cmds\.log|errors\.log|openlane\.log/.test(
          low
        )
      ) {
        continue;
      }
      addFile(path.join(results, name), name, false);
    }
  }

  // Symlink-style aliases for stage DEFs/ODBs (copy once if missing from flat results)
  const stageFiles = [
    ["placement/top.def", "placement_top.def"],
    ["placement/top.odb", "placement_top.odb"],
    ["floorplan/top.def", "floorplan_top.def"],
    ["floorplan/top.odb", "floorplan_top.odb"],
    ["cts/top.def", "cts_top.def"],
    ["cts/top.odb", "cts_top.odb"],
    ["routing/top.def", "routing_top.def"],
    ["routing/top.odb", "routing_top.odb"],
  ] as const;
  for (const [rel, outName] of stageFiles) {
    if (seen.has(outName.toLowerCase())) continue;
    const abs = path.join(
      jobDir,
      "designs",
      "ace_design",
      "runs",
      "ace_run",
      "results",
      rel
    );
    addFile(abs, outName, true);
  }

  const logTail = readLogTail(logPath, 16_384);
  artifactCache.set(jobDir, { key: cacheKey, artifacts, gdsFiles, logTail });
  return { artifacts, gdsFiles, logTail };
}

export function extractMetricsFromJob(jobDir: string): Partial<FlowMetrics> | undefined {
  try {
    const csvPath = path.join(jobDir, "results", "metrics.csv");
    if (fs.existsSync(csvPath)) {
      const m = parseMetricsCsv(fs.readFileSync(csvPath, "utf8"));
      if (Object.keys(m).length > 0) return m;
    }
    const runCsv = path.join(jobDir, "designs", "ace_design", "runs", "ace_run", "reports", "metrics.csv");
    if (fs.existsSync(runCsv)) {
      const m = parseMetricsCsv(fs.readFileSync(runCsv, "utf8"));
      if (Object.keys(m).length > 0) return m;
    }
    const staPath = path.join(jobDir, "results", "dpl_sta.rpt");
    if (fs.existsSync(staPath)) {
      const m = parsePlacementTimingReport(fs.readFileSync(staPath, "utf8"));
      if (Object.keys(m).length > 0) return m;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function readStatusFile(jobDir: string): {
  status?: string;
  message?: string;
  enqueuedAt?: string;
} {
  try {
    const p = path.join(jobDir, "status.json");
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, "utf8")) as {
      status?: string;
      message?: string;
      enqueuedAt?: string;
    };
  } catch {
    return {};
  }
}

/**
 * Look up a job. When ownerId is provided, only that tenant's job is returned
 * (Sprint A isolation). Without ownerId, Map-only lookup (internal).
 */
export function getDockerJob(
  jobId: string,
  ownerId?: string
): DockerJobRecord | undefined {
  // Opportunistic dispatch (poll wakes the queue)
  try {
    tryDispatchOpenroadQueue();
  } catch {
    /* */
  }

  if (ownerId) {
    const keyed = jobs.get(mapKey(ownerId, jobId));
    if (keyed) {
      refreshJobArtifacts(keyed);
      return keyed;
    }
  } else {
    const j = jobs.get(jobId);
    if (j) {
      refreshJobArtifacts(j);
      return j;
    }
  }

  // Disk reload — owner-scoped
  if (ownerId) {
    const dir = resolveOwnedJobDir(ownerId, jobId);
    if (!dir) return undefined;
    return loadJobFromDisk(jobId, dir, ownerId);
  }

  return undefined;
}

function refreshJobArtifacts(j: DockerJobRecord): void {
  if (!j.jobDir || !fs.existsSync(j.jobDir)) return;
  try {
    reconcileOrphanJob(j);
    const { artifacts, gdsFiles, logTail } = collectArtifacts(j.jobDir);
    j.artifacts = artifacts;
    j.gdsFiles = gdsFiles;
    if (logTail) j.logTail = logTail;
    j.metrics = extractMetricsFromJob(j.jobDir) || j.metrics;
    const st = readStatusFile(j.jobDir);
    if (
      st.status === "succeeded" ||
      st.status === "failed" ||
      st.status === "queued" ||
      st.status === "preparing" ||
      st.status === "running"
    ) {
      // Don't overwrite live running with stale queued if child exists
      const ck = mapKey(j.ownerId, j.jobId);
      if (children.has(ck) && st.status === "queued") {
        /* keep in-memory running */
      } else {
        j.status = st.status as DockerJobPhase;
        if (st.message) j.message = st.message;
      }
    }
  } catch {
    /* */
  }
}

/** If disk says running but no live child → mark failed (crash / HMR orphan). */
function reconcileOrphanJob(j: DockerJobRecord): void {
  if (!j.jobDir) return;
  const st = readStatusFile(j.jobDir);
  if (!isRunningPhase(st.status)) return;
  const ck = mapKey(j.ownerId, j.jobId);
  if (children.has(ck)) return;
  // Also check persistSlug key in spawn meta
  const meta = readSpawnMeta(j.jobDir);
  if (meta && children.has(mapKey(j.ownerId, meta.persistSlug))) return;
  // Give a short grace if pid still alive
  if (j.pid) {
    try {
      process.kill(j.pid, 0);
      return; // still alive
    } catch {
      /* dead */
    }
  }
  const msg =
    "OpenLane job orphaned (process gone after restart) — mark failed; re-run stage";
  j.status = "failed";
  j.message = msg;
  j.finishedAt = new Date().toISOString();
  writeStatusJson(j.jobDir, "failed", msg, { orphaned: true });
}

function loadJobFromDisk(
  jobId: string,
  dir: string,
  ownerId: string
): DockerJobRecord | undefined {
  if (!fs.existsSync(dir)) return undefined;
  const st = readStatusFile(dir);
  const { artifacts, gdsFiles, logTail } = collectArtifacts(dir);
  const phase = (st.status as DockerJobPhase) || "failed";
  const rec: DockerJobRecord = {
    jobId,
    ownerId,
    status: phase,
    message: st.message || "",
    designName: "",
    topModule: "",
    pdk: process.env.PDK || "sky130A",
    mode: "container",
    startedAt: "",
    jobDir: dir,
    logTail,
    artifacts,
    gdsFiles,
  };
  try {
    const pj = JSON.parse(
      fs.readFileSync(path.join(dir, "project.json"), "utf8")
    ) as { designName?: string; topModule?: string; pdk?: string };
    rec.designName = pj.designName || "";
    rec.topModule = pj.topModule || "";
    rec.pdk = pj.pdk || rec.pdk;
  } catch {
    /* */
  }
  reconcileOrphanJob(rec);
  const meta = readSpawnMeta(dir);
  indexJob(rec, meta?.persistSlug);
  // Wake dispatcher if anything is still queued
  if (rec.status === "queued") ensureDispatchTimer();
  return rec;
}

export function listDockerJobs(): DockerJobRecord[] {
  return Array.from(jobs.values()).sort((a, b) =>
    (b.startedAt || "").localeCompare(a.startedAt || "")
  );
}

/** Map Studio stage → OpenLane stop point (single source: openroad-until-map).
 *  Unknown ids return null — callers must fail closed (never default to full GDS).
 */
export function openlaneUntilForStage(stage?: string): string | null {
  if (!stage || stage === "all") return "all";
  if (stage === "routing") return "routing";
  const mapped = STAGE_TO_OPENLANE_UNTIL[stage as FlowStageId];
  return mapped ?? null;
}

/**
 * Enqueue a real OpenLane container job (Sprint 2).
 * Writes status=queued on disk; tryDispatchOpenroadQueue spawns when under caps.
 * @param opts.untilStage - Studio stage id; OpenLane stops after that step
 * @param opts.owner - required tenant identity (Sprint A)
 */
export function startOpenroadDockerJob(
  project: OpenroadProjectState,
  openlaneConfig?: Record<string, string | number | boolean>,
  opts?: { untilStage?: string; owner: OpenroadOwner }
): DockerJobRecord {
  const owner = opts?.owner;
  if (!owner?.ownerId) {
    const jobId = makeJobId();
    return {
      jobId,
      ownerId: "anonymous",
      status: "failed",
      message: "Missing owner — provide authenticated API key",
      designName: project.designName,
      topModule: project.topModule,
      pdk: project.pdk || "sky130A",
      mode: "container",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      jobDir: "",
      logTail: "",
      artifacts: [],
      gdsFiles: [],
      exitCode: 401,
    };
  }
  const oid = owner.ownerId;

  const failRec = (
    message: string,
    extra?: Partial<DockerJobRecord>
  ): DockerJobRecord => {
    const jobId = makeJobId();
    const rec: DockerJobRecord = {
      jobId,
      ownerId: oid,
      status: "failed",
      message,
      designName: project.designName,
      topModule: project.topModule,
      pdk: project.pdk || "sky130A",
      mode: "container",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      jobDir: "",
      logTail: message + "\n",
      artifacts: [],
      gdsFiles: [],
      ...extra,
    };
    indexJob(rec);
    return rec;
  };

  try {
    getOpenroadJobsRoot();
  } catch (e) {
    return failRec(e instanceof Error ? e.message : "OPENROAD_JOBS_DIR invalid", {
      exitCode: 503,
    });
  }

  if (!isRunnerEnabled()) {
    return failRec(
      "OPENROAD_RUNNER_ENABLED is off or Docker not found. Set OPENROAD_RUNNER_ENABLED=1 and install Docker."
    );
  }

  const designName = project.designName || "design";
  const top =
    (openlaneConfig?.DESIGN_NAME as string) ||
    project.topModule ||
    "top";
  const untilStage = opts?.untilStage || "all";
  const until = openlaneUntilForStage(untilStage);
  if (!until) {
    return failRec(
      `Unknown OpenLane stage '${untilStage}' — refusing to default to full GDS flow`,
      {
        logTail: `ACE-Seek: refused OpenLane start — unknown stage ${untilStage}\n`,
        exitCode: 2,
      }
    );
  }

  const hasRtl = project.files.some(
    (f) =>
      /\.(v|sv)$/i.test(f.name) &&
      !isTestbenchFile(f.name, f.content)
  );
  if (!hasRtl) {
    return failRec(
      "No RTL (.v/.sv) in project — upload design before OpenLane (placeholder top removed)",
      { exitCode: 4 }
    );
  }

  // Owner-scoped stable job dir for resume (never share across tenants)
  const persistSlug = `ol_${safeSlug(designName)}_${safeSlug(top)}`;
  const jobId =
    until === "synthesis" || until === "all"
      ? `${persistSlug}_${Date.now().toString(36)}`
      : persistSlug;
  fs.mkdirSync(ownerJobsDir(oid), { recursive: true });
  let jobDir = ownerJobDir(oid, persistSlug);
  if (until === "synthesis" || until === "all") {
    jobDir = ownerJobDir(oid, jobId);
  }

  // Busy lock: same resume dir must not double-run
  if (fs.existsSync(jobDir)) {
    const existing = readStatusFile(jobDir);
    const ck = mapKey(oid, jobId);
    const ckPersist = mapKey(oid, persistSlug);
    if (
      isActivePhase(existing.status) ||
      children.has(ck) ||
      children.has(ckPersist)
    ) {
      const busy: DockerJobRecord = {
        jobId,
        ownerId: oid,
        status: "failed",
        message: `Job '${persistSlug}' is already ${existing.status || "active"} — wait for it to finish before re-running this stage`,
        designName,
        topModule: top,
        pdk: project.pdk || "sky130A",
        mode: "container",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        jobDir,
        logTail: "",
        artifacts: [],
        gdsFiles: [],
        exitCode: 409,
      };
      indexJob(busy, persistSlug);
      return busy;
    }
  }

  const caps = openroadQueueCaps();
  const phases = scanJobPhases();
  const ownerQueued = phases.queuedByOwner.get(oid) || 0;
  if (phases.queued >= caps.maxQueuedGlobal) {
    return failRec(
      `OpenLane queue full (global ${phases.queued}/${caps.maxQueuedGlobal}). Retry when a job finishes.`,
      { exitCode: 429, queueRejected: true }
    );
  }
  if (ownerQueued >= caps.maxQueuedPerOwner) {
    return failRec(
      `OpenLane queue full for your account (${ownerQueued}/${caps.maxQueuedPerOwner}). Retry when a job finishes.`,
      { exitCode: 429, queueRejected: true }
    );
  }

  fs.mkdirSync(jobDir, { recursive: true });
  writeOwnerMeta(jobDir, owner, {
    designName,
    topModule: top,
    persistSlug,
    jobId,
  });
  writeInputFiles(jobDir, project);

  const resolved = resolveRunnerPdk(project.pdk || "sky130");
  if (!resolved.ok) {
    const rec: DockerJobRecord = {
      jobId,
      ownerId: oid,
      status: "failed",
      message: resolved.error || `PDK '${project.pdk}' is not runnable on this host`,
      designName,
      topModule: top,
      pdk: project.pdk || "sky130",
      mode: "container",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      jobDir,
      logTail: resolved.error || "",
      artifacts: [],
      gdsFiles: [],
    };
    writeStatusJson(jobDir, "failed", rec.message);
    fs.writeFileSync(
      path.join(jobDir, "run.log"),
      `PDK resolve failed for '${project.pdk}'\n${resolved.error}\n` +
        `pdkRoot=${resolved.pdkRoot}\norfsRoot=${resolved.orfsRoot || "(unset)"}\n` +
        `install: ${resolved.def.installHint}\n`,
      "utf8"
    );
    indexJob(rec, persistSlug);
    return rec;
  }

  const pdkDefaults = resolved.def.openlaneDefaults || {};
  const mergedConfig = { ...pdkDefaults, ...(openlaneConfig || {}) };
  fs.writeFileSync(
    path.join(jobDir, "user_openlane_config.json"),
    JSON.stringify(mergedConfig, null, 2),
    "utf8"
  );

  const pdkLabel =
    resolved.openlanePdk ||
    resolved.orfsPlatform ||
    resolved.pdkId;

  const overwrite: "0" | "1" =
    until === "synthesis" || until === "all" || untilStage === "synthesis"
      ? "1"
      : "0";
  const ckptSlug = safeDesignSlug(designName, top);
  const enqueuedAt = new Date().toISOString();

  const spawnMeta: OpenroadSpawnMeta = {
    version: 1,
    jobId,
    ownerId: oid,
    persistSlug,
    designName,
    topModule: top,
    untilStage,
    until,
    pdkLabel,
    runner: resolved.def.runner === "orfs" ? "orfs" : "openlane",
    openlanePdk: resolved.openlanePdk || "",
    orfsPlatform: resolved.orfsPlatform || "",
    pdkId: resolved.pdkId,
    pdkRoot: resolved.pdkRoot,
    orfsRoot: resolved.orfsRoot || "",
    overwrite,
    ckptSlug,
    enqueuedAt,
  };
  writeSpawnMeta(jobDir, spawnMeta);

  const capsMsg = `queue caps concurrent=${caps.maxConcurrentJobs} perOwner=${caps.maxConcurrentPerOwner}`;
  const rec: DockerJobRecord = {
    jobId,
    ownerId: oid,
    status: "queued",
    message: `Queued OpenLane until ${until} (${pdkLabel}) — ${capsMsg}`,
    designName,
    topModule: top,
    pdk: pdkLabel,
    mode: "container",
    startedAt: enqueuedAt,
    jobDir,
    logTail: `ACE-Seek: enqueued jobId=${jobId} ${capsMsg}\n`,
    artifacts: [],
    gdsFiles: [],
  };
  writeStatusJson(jobDir, "queued", rec.message, {
    ownerId: oid,
    jobId,
    persistSlug,
    enqueuedAt,
  });
  indexJob(rec, persistSlug);
  ensureDispatchTimer();
  tryDispatchOpenroadQueue();
  // Return refreshed record (may already be running if slot free)
  return jobs.get(mapKey(oid, jobId)) || rec;
}

/**
 * Spawn worker for a queued job. Caller must hold slot under concurrency caps.
 */
function spawnOpenroadWorker(rec: DockerJobRecord, meta: OpenroadSpawnMeta): void {
  const jobDir = rec.jobDir;
  const oid = meta.ownerId;
  const childKey = mapKey(oid, meta.jobId);
  if (children.has(childKey)) return;

  const wd = workerDir();
  if (!fs.existsSync(wd)) {
    const msg = `Worker directory missing at ${wd}`;
    rec.status = "failed";
    rec.message = msg;
    writeStatusJson(jobDir, "failed", msg);
    return;
  }

  const prepareOl = path.join(wd, "prepare_design.sh");
  const runOl = path.join(wd, "run_openlane.sh");
  const prepareOrfs = path.join(wd, "prepare_orfs_design.sh");
  const runOrfs = path.join(wd, "run_orfs.sh");
  const mergePy = path.join(wd, "merge_user_config.py");
  const packCkpt = path.join(wd, "pack_checkpoint.sh");

  for (const p of [prepareOl, runOl, prepareOrfs, runOrfs, packCkpt]) {
    try {
      fs.chmodSync(p, 0o755);
    } catch {
      /* */
    }
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PDK_ROOT: meta.pdkRoot,
    PDK: meta.openlanePdk || process.env.PDK || "sky130A",
    OPENROAD_FLOW_ROOT: meta.orfsRoot || process.env.OPENROAD_FLOW_ROOT || "",
    ORFS_PLATFORM: meta.orfsPlatform || "",
    DESIGN_TOP: meta.topModule,
    DESIGN_SLUG: "ace_design",
    OPENLANE_IMAGE:
      process.env.OPENLANE_IMAGE ||
      "efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a",
    OPENLANE_TIMEOUT: process.env.OPENLANE_TIMEOUT || "3600",
    OPENLANE_TAG: "ace_run",
    ACE_OPENLANE_UNTIL: meta.until,
    ACE_OPENLANE_OVERWRITE: meta.overwrite,
    OPENROAD_SSH_HOST: process.env.OPENROAD_SSH_HOST || "",
    OPENROAD_SSH_USER: process.env.OPENROAD_SSH_USER || "root",
    OPENROAD_SSH_KEY: process.env.OPENROAD_SSH_KEY || "",
    OPENROAD_SSH_REMOTE_DIR:
      process.env.OPENROAD_SSH_REMOTE_DIR ||
      "/root/logiclance/ace-openroad-jobs",
    ACE_PDK_ID: meta.pdkId,
  };

  let cmd: string;
  if (meta.runner === "orfs") {
    cmd = `set -e; "${prepareOrfs}" "${jobDir}" "${safeSlug(meta.designName)}" "${meta.topModule}" "${meta.orfsPlatform}"; "${runOrfs}" "${jobDir}"`;
  } else {
    cmd = `set -e; "${prepareOl}" "${jobDir}" "${safeSlug(meta.designName)}" "${meta.topModule}" "${meta.openlanePdk}"; python3 "${mergePy}" "${jobDir}"; "${runOl}" "${jobDir}"; "${packCkpt}" "${jobDir}" "${meta.ckptSlug}" "${meta.untilStage || meta.until}" "${oid}" || true`;
  }

  rec.status = "preparing";
  rec.message =
    meta.runner === "orfs"
      ? `Preparing ORFS (${meta.orfsPlatform})…`
      : `Preparing OpenLane until ${meta.until} (${meta.openlanePdk})…`;
  writeStatusJson(jobDir, "preparing", rec.message);

  let shell: ChildProcess;
  try {
    shell = spawn("bash", ["-lc", cmd], {
      cwd: wd,
      env,
      detached: false,
    });
  } catch (err) {
    const msg = `Failed to spawn OpenLane worker: ${err instanceof Error ? err.message : String(err)}`;
    rec.status = "failed";
    rec.message = msg;
    writeStatusJson(jobDir, "failed", msg);
    return;
  }

  shell.on("error", (err) => {
    const msg = `OpenLane process error: ${err.message}`;
    rec.status = "failed";
    rec.message = msg;
    writeStatusJson(jobDir, "failed", msg);
  });

  rec.pid = shell.pid;
  rec.status = "running";
  rec.message =
    meta.runner === "orfs"
      ? `ORFS ${meta.orfsPlatform} running…`
      : env.OPENROAD_SSH_HOST
        ? `Remote OpenLane until ${meta.until} on ${env.OPENROAD_SSH_HOST}…`
        : `OpenLane Docker until **${meta.until}** (PDK ${meta.openlanePdk})…`;
  writeStatusJson(jobDir, "running", rec.message, { pid: shell.pid });
  children.set(childKey, shell);
  // Also index persist slug for busy checks
  if (meta.persistSlug !== meta.jobId) {
    children.set(mapKey(oid, meta.persistSlug), shell);
  }

  shell.stdout?.on("data", (buf: Buffer) => {
    const t = buf.toString("utf8");
    rec.logTail = (rec.logTail + t).slice(-12000);
    if (/Synthesis|Floorplan|Placement|CTS|Routing|Magic|GDS|stream/i.test(t)) {
      rec.message =
        t.split("\n").filter(Boolean).slice(-1)[0]?.slice(0, 200) || rec.message;
    }
  });
  shell.stderr?.on("data", (buf: Buffer) => {
    rec.logTail = (rec.logTail + buf.toString("utf8")).slice(-12000);
  });

  const finishChild = () => {
    children.delete(childKey);
    if (meta.persistSlug !== meta.jobId) {
      children.delete(mapKey(oid, meta.persistSlug));
    }
    tryDispatchOpenroadQueue();
  };

  shell.on("close", (code) => {
    rec.exitCode = code;
    rec.finishedAt = new Date().toISOString();
    const { artifacts, gdsFiles, logTail } = collectArtifacts(jobDir);
    rec.artifacts = artifacts;
    rec.gdsFiles = gdsFiles;
    rec.logTail = logTail || rec.logTail;
    rec.metrics = extractMetricsFromJob(jobDir);

    const st = readStatusFile(jobDir);
    const stageStop =
      /ACE-Seek: stopped after|stage-limited|stopped after/i.test(
        rec.logTail + (st.message || "")
      ) || /OpenLane stopped after/i.test(st.message || "");
    const stepOk = /ACE-Seek: === step .+ OK ===/i.test(rec.logTail);
    const hasStageEvidence =
      artifacts.length > 0 || gdsFiles.length > 0 || stepOk || stageStop;

    const isSuccessfulRun = (code === 0 && hasStageEvidence) || gdsFiles.length > 0 || stageStop;

    // Hardened Checkpoint Guard (P1 #7): only write checkpoint on verified stage success
    if (isSuccessfulRun && hasStageEvidence) {
      try {
        const man = snapshotOpenlaneJobToCheckpoint({
          jobDir,
          designName: meta.designName,
          topModule: meta.topModule,
          pdk: meta.pdkLabel,
          stage:
            (meta.untilStage as import("./openroad-flow-model").FlowStageId) ||
            "gds",
          ownerId: oid,
        });
        if (man) {
          rec.logTail = (
            rec.logTail +
            `\nACE-Seek: checkpoint snapshot stage=${man.stage} files=${man.files.length}\n`
          ).slice(-12000);
        }
      } catch {
        /* */
      }
    }

    if (code !== 0 && code != null && !stageStop) {
      rec.status = "failed";
      rec.message =
        st.message ||
        `OpenLane failed (exit ${code}). See log. Ensure PDK_ROOT and Docker image.`;
    } else if (gdsFiles.length > 0) {
      rec.status = "succeeded";
      rec.message =
        st.message ||
        `GDS ready (${gdsFiles.length} file(s)): ${gdsFiles.join(", ")}`;
    } else if (code === 0 && hasStageEvidence) {
      rec.status = "succeeded";
      rec.message =
        st.message ||
        (stageStop
          ? "Stage-limited OpenLane step finished (no GDS expected yet)"
          : "Flow exited 0 — check results/ for DEF/reports (GDS may be missing)");
    } else if (stageStop) {
      rec.status = "succeeded";
      rec.message = "Stage-limited OpenLane step finished";
    } else if (code === 0) {
      rec.status = "failed";
      rec.message =
        st.message ||
        "OpenLane exited 0 but produced no stage artifacts — refusing soft success";
    } else {
      rec.status = "failed";
      rec.message =
        st.message ||
        `OpenLane failed (exit ${code ?? "?"}). See log. Ensure PDK_ROOT and Docker image.`;
    }
    writeStatusJson(jobDir, rec.status, rec.message, { exitCode: code });
    finishChild();
  });

  shell.on("error", (err) => {
    rec.status = "failed";
    rec.message = err.message;
    rec.finishedAt = new Date().toISOString();
    writeStatusJson(jobDir, "failed", err.message);
    finishChild();
  });
}

/**
 * Admit next queued OpenLane jobs under host/per-owner caps.
 * Safe to call frequently (close handler + interval).
 */
export function tryDispatchOpenroadQueue(): void {
  if (dispatchRunning) return;
  dispatchRunning = true;
  try {
    const caps = openroadQueueCaps();
    // Collect queued jobs from disk (FIFO by enqueuedAt / mtime)
    type QItem = { ownerId: string; jobId: string; jobDir: string; enqueuedAt: string };
    const queued: QItem[] = [];
    try {
      const root = path.join(getOpenroadJobsRoot(), "owners");
      if (fs.existsSync(root)) {
        for (const oid of fs.readdirSync(root)) {
          const jroot = path.join(root, oid, "jobs");
          if (!fs.existsSync(jroot)) continue;
          for (const name of fs.readdirSync(jroot)) {
            const dir = path.join(jroot, name);
            try {
              if (!fs.statSync(dir).isDirectory()) continue;
            } catch {
              continue;
            }
            const st = readStatusFile(dir);
            if (st.status !== "queued") continue;
            const meta = readSpawnMeta(dir);
            const enqueuedAt =
              (st as { enqueuedAt?: string }).enqueuedAt ||
              meta?.enqueuedAt ||
              String(fs.statSync(dir).mtimeMs);
            queued.push({
              ownerId: oid,
              jobId: meta?.jobId || name,
              jobDir: dir,
              enqueuedAt,
            });
          }
        }
      }
    } catch {
      /* */
    }
    queued.sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt));

    for (const item of queued) {
      const phases = scanJobPhases();
      if (phases.running >= caps.maxConcurrentJobs) break;
      const ownerRun = phases.runningByOwner.get(item.ownerId) || 0;
      if (ownerRun >= caps.maxConcurrentPerOwner) continue;

      const meta = readSpawnMeta(item.jobDir);
      if (!meta) {
        writeStatusJson(
          item.jobDir,
          "failed",
          "Missing spawn.json — cannot dispatch queued job"
        );
        continue;
      }
      let rec = jobs.get(mapKey(item.ownerId, item.jobId));
      if (!rec) {
        rec = loadJobFromDisk(item.jobId, item.jobDir, item.ownerId);
      }
      if (!rec || rec.status !== "queued") continue;
      spawnOpenroadWorker(rec, meta);
    }
  } finally {
    dispatchRunning = false;
  }
}

export function readJobArtifact(
  jobId: string,
  fileName: string,
  ownerId?: string
): { path: string; data: Buffer } | null {
  const j = getDockerJob(jobId, ownerId);
  if (!j) return null;
  if (ownerId && j.ownerId !== ownerId) return null;
  const base = path.basename(fileName);
  // Prefer flattened results/
  const candidates = [
    path.join(j.jobDir, "results", base),
    path.join(j.jobDir, base),
  ];
  // Also search artifact index
  for (const a of j.artifacts || []) {
    if (path.basename(a.name) === base && a.path) candidates.unshift(a.path);
  }
  const resultsRoot = path.resolve(j.jobDir);
  for (const full of candidates) {
    try {
      const resolved = path.resolve(full);
      if (!resolved.startsWith(resultsRoot)) continue;
      if (!fs.existsSync(resolved)) continue;
      return { path: resolved, data: fs.readFileSync(resolved) };
    } catch {
      /* */
    }
  }
  return null;
}

export function runnerDiagnostics(): Record<string, string | boolean | object> {
  const pdkRoot = process.env.PDK_ROOT || path.join(os.homedir(), ".volare");
  const pdk = process.env.PDK || "sky130A";
  const availability = probePdkAvailability();
  let jobsRootPath = "";
  let jobsRootOk = true;
  let jobsRootError = "";
  try {
    jobsRootPath = jobsRoot();
  } catch (e) {
    jobsRootOk = false;
    jobsRootError = e instanceof Error ? e.message : "OPENROAD_JOBS_DIR invalid";
  }
  const caps = openroadQueueCaps();
  let queueStats: { running: number; queued: number } = { running: 0, queued: 0 };
  try {
    const p = scanJobPhases();
    queueStats = { running: p.running, queued: p.queued };
  } catch {
    /* */
  }
  return {
    enabled: isRunnerEnabled(),
    docker: fs.existsSync("/usr/bin/docker") || fs.existsSync("/usr/local/bin/docker"),
    pdkRoot,
    pdkPath: path.join(pdkRoot, pdk),
    pdkExists: fs.existsSync(path.join(pdkRoot, pdk)),
    orfsRoot: process.env.OPENROAD_FLOW_ROOT || process.env.ORFS_ROOT || "",
    workerDir: workerDir(),
    jobsRoot: jobsRootPath,
    jobsRootOk,
    jobsRootError,
    isolation: "owners/<ownerId>/{jobs,checkpoints,uploads}",
    queue: {
      ...caps,
      ...queueStats,
      liveChildren: children.size,
    },
    openlaneImage:
      process.env.OPENLANE_IMAGE ||
      "efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a",
    sshHost: process.env.OPENROAD_SSH_HOST || "(local docker)",
    pdks: availability,
  };
}

/** Stop/kill active running child process for a job */
export function abortOpenroadJob(jobId: string, ownerId?: string): boolean {
  let killed = false;
  for (const [key, proc] of children.entries()) {
    if (ownerId && !key.startsWith(`${safeOwnerId(ownerId)}::`)) continue;
    if (key.endsWith(`::${jobId}`) || key === jobId) {
      try {
        proc.kill("SIGKILL");
        killed = true;
      } catch {
        /* ignore */
      }
      children.delete(key);
    }
  }
  return killed;
}
