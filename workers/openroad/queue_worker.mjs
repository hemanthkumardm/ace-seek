#!/usr/bin/env node
/**
 * Sprint 3 — external OpenLane queue dispatcher (EC2 systemd or K8s).
 *
 * When OPENROAD_QUEUE_EXTERNAL=1, Next.js only enqueues (status=queued + spawn.json).
 * This process admits jobs under the same concurrency caps and runs prepare+OpenLane.
 *
 * Usage:
 *   OPENROAD_JOBS_DIR=/data/ace-openroad-jobs node queue_worker.mjs
 *
 * Requires: repo checkout with workers/openroad/*.sh, Docker, PDK_ROOT.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JOBS_ROOT =
  process.env.OPENROAD_JOBS_DIR?.trim() ||
  path.join(os.tmpdir(), "ace-openroad-jobs");

const CAPS = {
  maxConcurrent: num("OPENROAD_MAX_CONCURRENT_JOBS", 1),
  maxPerOwner: num("OPENROAD_MAX_CONCURRENT_PER_OWNER", 1),
  pollMs: num("OPENROAD_QUEUE_DISPATCH_MS", 2000),
};

const children = new Map(); // key ownerId::jobId → ChildProcess

function num(k, d) {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : d;
}

function log(...a) {
  console.log(new Date().toISOString(), ...a);
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function writeStatus(jobDir, status, message, extra = {}) {
  fs.writeFileSync(
    path.join(jobDir, "status.json"),
    JSON.stringify({ status, message, updatedAt: new Date().toISOString(), ...extra }, null, 2)
  );
}

function listQueued() {
  const owners = path.join(JOBS_ROOT, "owners");
  if (!fs.existsSync(owners)) return [];
  const out = [];
  for (const oid of fs.readdirSync(owners)) {
    const jroot = path.join(owners, oid, "jobs");
    if (!fs.existsSync(jroot)) continue;
    for (const name of fs.readdirSync(jroot)) {
      const dir = path.join(jroot, name);
      try {
        if (!fs.statSync(dir).isDirectory()) continue;
      } catch {
        continue;
      }
      const st = readJson(path.join(dir, "status.json"));
      if (st?.status !== "queued") continue;
      const meta = readJson(path.join(dir, "spawn.json"));
      if (!meta) continue;
      out.push({
        ownerId: oid,
        jobId: meta.jobId || name,
        jobDir: dir,
        meta,
        enqueuedAt: st.enqueuedAt || meta.enqueuedAt || "",
      });
    }
  }
  out.sort((a, b) => String(a.enqueuedAt).localeCompare(String(b.enqueuedAt)));
  return out;
}

function runningCount() {
  return children.size;
}

function runningByOwner(oid) {
  let n = 0;
  for (const k of children.keys()) {
    if (k.startsWith(`${oid}::`)) n += 1;
  }
  return n;
}

function safeSlug(s) {
  return (s || "design").replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 48);
}

function spawnJob(item) {
  const { meta, jobDir, ownerId, jobId } = item;
  const key = `${ownerId}::${jobId}`;
  if (children.has(key)) return;

  const prepareOl = path.join(__dirname, "prepare_design.sh");
  const runOl = path.join(__dirname, "run_openlane.sh");
  const prepareOrfs = path.join(__dirname, "prepare_orfs_design.sh");
  const runOrfs = path.join(__dirname, "run_orfs.sh");
  const mergePy = path.join(__dirname, "merge_user_config.py");
  const packCkpt = path.join(__dirname, "pack_checkpoint.sh");

  for (const p of [prepareOl, runOl, prepareOrfs, runOrfs, packCkpt]) {
    try {
      fs.chmodSync(p, 0o755);
    } catch {
      /* */
    }
  }

  const env = {
    ...process.env,
    PDK_ROOT: meta.pdkRoot || process.env.PDK_ROOT || "",
    PDK: meta.openlanePdk || process.env.PDK || "sky130A",
    OPENROAD_FLOW_ROOT: meta.orfsRoot || process.env.OPENROAD_FLOW_ROOT || "",
    ORFS_PLATFORM: meta.orfsPlatform || "",
    DESIGN_TOP: meta.topModule,
    DESIGN_SLUG: "ace_design",
    OPENLANE_TAG: "ace_run",
    ACE_OPENLANE_UNTIL: meta.until,
    ACE_OPENLANE_OVERWRITE: meta.overwrite,
    ACE_EXTERNAL_NETLIST: meta.externalNetlist ? "1" : "0",
    ACE_PDK_ID: meta.pdkId || "",
  };

  let cmd;
  if (meta.runner === "orfs") {
    cmd = `set -e; "${prepareOrfs}" "${jobDir}" "${safeSlug(meta.designName)}" "${meta.topModule}" "${meta.orfsPlatform}"; "${runOrfs}" "${jobDir}"`;
  } else {
    cmd = `set -e; "${prepareOl}" "${jobDir}" "${safeSlug(meta.designName)}" "${meta.topModule}" "${meta.openlanePdk}"; python3 "${mergePy}" "${jobDir}"; "${runOl}" "${jobDir}"; "${packCkpt}" "${jobDir}" "${meta.ckptSlug}" "${meta.untilStage || meta.until}" "${ownerId}" || true`;
  }

  writeStatus(jobDir, "running", `Worker starting OpenLane until ${meta.until}`);
  log("spawn", key, meta.until);

  const shell = spawn("bash", ["-lc", cmd], {
    cwd: __dirname,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.set(key, shell);

  const append = (buf) => {
    try {
      fs.appendFileSync(path.join(jobDir, "run.log"), buf);
    } catch {
      /* */
    }
  };
  shell.stdout?.on("data", append);
  shell.stderr?.on("data", append);

  shell.on("close", (code) => {
    children.delete(key);
    const st = readJson(path.join(jobDir, "status.json")) || {};
    // Prefer shell-written status; else derive
    if (st.status === "running" || st.status === "preparing" || !st.status) {
      writeStatus(
        jobDir,
        code === 0 ? "succeeded" : "failed",
        code === 0
          ? "Worker finished (exit 0)"
          : `Worker failed (exit ${code})`,
        { exitCode: code }
      );
    }
    log("done", key, "exit", code);
  });

  shell.on("error", (err) => {
    children.delete(key);
    writeStatus(jobDir, "failed", err.message);
    log("error", key, err.message);
  });
}

function tick() {
  const queued = listQueued();
  for (const item of queued) {
    if (runningCount() >= CAPS.maxConcurrent) break;
    if (runningByOwner(item.ownerId) >= CAPS.maxPerOwner) continue;
    spawnJob(item);
  }
}

log("Ace-Seek OpenLane queue worker");
log("JOBS_ROOT", JOBS_ROOT);
log("caps", CAPS);
if (!fs.existsSync(JOBS_ROOT)) {
  fs.mkdirSync(JOBS_ROOT, { recursive: true });
}
tick();
setInterval(tick, Math.max(500, CAPS.pollMs));
