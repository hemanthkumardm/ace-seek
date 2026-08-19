/**
 * Launch OpenROAD GUI (Docker) on a real ODB — accurate layout viewer.
 * Replaces the inaccurate DEF canvas snapshot.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { spawn, spawnSync, type ChildProcess } from "child_process";
import type { FlowStageId } from "./openroad-flow-model";
import {
  ownerJobsDir,
  ownerUploadsDir,
  pathUnderOwner,
  writeOwnerMeta,
  type OpenroadOwner,
} from "./openroad-owner";

function repoRoot(): string {
  return path.resolve(
    process.cwd(),
    process.cwd().endsWith("web") ? ".." : "."
  );
}

function workerDir(): string {
  return path.join(repoRoot(), "workers", "openroad");
}

const guiJobs = new Map<
  string,
  { pid: number; odb: string; startedAt: string; logFile: string }
>();

/** Map Studio stage → OpenLane results/<stage>/top.odb */
export function stageToOdbRel(stage: FlowStageId | string): string | null {
  switch (stage) {
    case "floorplan":
    case "powerplan":
      return "results/floorplan/top.odb";
    case "placement":
      return "results/placement/top.odb";
    case "cts":
      return "results/cts/top.odb";
    case "route":
      return "results/routing/top.odb";
    case "drc":
    case "lvs":
    case "gds":
      return "results/final/top.odb"; // may not exist; fallback below
    default:
      return null;
  }
}

/** Find ODB for a job dir + stage (with fallbacks) */
export function findStageOdb(
  jobDir: string,
  stage: FlowStageId | string
): { path: string; label: string } | null {
  const runRoot = path.join(jobDir, "designs", "ace_design", "runs");
  if (!fs.existsSync(runRoot)) return null;
  let runDir = path.join(runRoot, "ace_run");
  if (!fs.existsSync(runDir)) {
    const runs = fs
      .readdirSync(runRoot)
      .map((n) => path.join(runRoot, n))
      .filter((p) => fs.statSync(p).isDirectory())
      .sort(
        (a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs
      );
    if (!runs.length) return null;
    runDir = runs[0];
  }

  const rel = stageToOdbRel(stage);
  const candidates: { path: string; label: string }[] = [];
  if (rel) {
    candidates.push({
      path: path.join(runDir, rel),
      label: `${stage} · ${path.basename(rel)}`,
    });
  }
  // Fallbacks
  const order = [
    "results/placement/top.odb",
    "results/floorplan/top.odb",
    "results/cts/top.odb",
    "results/routing/top.odb",
    "results/final/top.odb",
  ];
  for (const r of order) {
    candidates.push({
      path: path.join(runDir, r),
      label: path.basename(path.dirname(r)) + "/top.odb",
    });
  }
  // Flat harvest
  const flat = path.join(jobDir, "results");
  if (fs.existsSync(flat)) {
    for (const n of fs.readdirSync(flat)) {
      if (/\.odb$/i.test(n)) {
        candidates.push({
          path: path.join(flat, n),
          label: n,
        });
      }
    }
  }

  const seen = new Set<string>();
  for (const c of candidates) {
    const abs = path.resolve(c.path);
    if (seen.has(abs)) continue;
    seen.add(abs);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      return { path: abs, label: c.label };
    }
  }
  return null;
}

/** Resolve latest job dir for an owner (by mtime) matching design slug */
export function findLatestJobDir(
  ownerId: string,
  hint?: string
): string | null {
  const root = ownerJobsDir(ownerId);
  if (!fs.existsSync(root)) return null;
  const dirs = fs
    .readdirSync(root)
    .map((n) => path.join(root, n))
    .filter((p) => {
      try {
        return fs.statSync(p).isDirectory() && nOk(p, hint);
      } catch {
        return false;
      }
    })
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return dirs[0] || null;
}

function nOk(p: string, hint?: string): boolean {
  const base = path.basename(p);
  if (base === "checkpoints" || base === "uploads") return false;
  if (!fs.existsSync(path.join(p, "designs", "ace_design"))) return false;
  if (!hint) return true;
  const h = hint.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
  if (!h) return true;
  return base.toLowerCase().includes(h.slice(0, 8));
}

/** Save uploaded ODB under owners/<id>/uploads */
export function saveUploadedOdb(
  buf: Buffer,
  filename: string,
  owner: OpenroadOwner
): { path: string; id: string } {
  const id = `odb_${Date.now().toString(36)}`;
  const dir = path.join(ownerUploadsDir(owner.ownerId), id);
  fs.mkdirSync(dir, { recursive: true });
  writeOwnerMeta(dir, owner, { kind: "odb_upload" });
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]+/g, "_");
  const dest = path.join(dir, safe.endsWith(".odb") ? safe : `${safe}.odb`);
  fs.writeFileSync(dest, buf);
  return { path: dest, id };
}

/**
 * Headless OpenROAD read_db smoke test — catches truncated / version-mismatch ODBs
 * before spawning the GUI (ORD-0054).
 */
export function validateOdbReadable(odbPath: string): {
  ok: boolean;
  message: string;
} {
  const abs = path.resolve(odbPath);
  if (!fs.existsSync(abs)) {
    return { ok: false, message: `ODB not found: ${abs}` };
  }
  const st = fs.statSync(abs);
  if (st.size < 100) {
    return { ok: false, message: `ODB too small (${st.size} bytes)` };
  }
  try {
    const fd = fs.openSync(abs, "r");
    const hdr = Buffer.alloc(8);
    fs.readSync(fd, hdr, 0, 8, 0);
    fs.closeSync(fd);
    if (hdr.toString("ascii") !== "EHTABDAN") {
      return {
        ok: false,
        message: `Invalid ODB magic (not OpenROAD database) — file may be truncated or wrong format`,
      };
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to read ODB header",
    };
  }

  const image =
    process.env.OPENLANE_IMAGE ||
    "efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a";
  const dir = path.dirname(abs);
  const bn = path.basename(abs);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "ace-odb-validate-"));
  const tcl = path.join(work, "validate.tcl");
  fs.writeFileSync(
    tcl,
    `if {[catch { read_db /odb/${bn} } err]} {\n  puts "VALIDATE_FAIL: $err"\n  exit 1\n}\nputs "VALIDATE_OK"\nexit\n`,
    "utf8"
  );
  try {
    const r = spawnSync(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        `${dir}:/odb:ro`,
        "-v",
        `${tcl}:/t.tcl:ro`,
        "--entrypoint",
        "openroad",
        image,
        "-no_splash",
        "/t.tcl",
      ],
      { encoding: "utf8", timeout: 120_000 }
    );
    const out = `${r.stdout || ""}\n${r.stderr || ""}`;
    if (r.status === 0 && /VALIDATE_OK/.test(out)) {
      return { ok: true, message: `ODB OK (${st.size} bytes)` };
    }
    const errLine =
      out.match(/VALIDATE_FAIL:\s*(.+)/)?.[1] ||
      out.match(/\[ERROR ORD-\d+\][^\n]+/)?.[0] ||
      `OpenROAD rejected ODB (exit ${r.status})`;
    return {
      ok: false,
      message: `${errLine.trim()} — often caused by a truncated upload (raise proxyClientMaxBodySize) or OpenROAD version mismatch`,
    };
  } catch (e) {
    // If Docker unavailable, allow open attempt (GUI script will surface errors)
    return {
      ok: true,
      message: `Skipped validate (docker unavailable): ${
        e instanceof Error ? e.message : "error"
      }`,
    };
  } finally {
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      /* */
    }
  }
}

export function listGuiSessions(): {
  id: string;
  pid: number;
  odb: string;
  startedAt: string;
}[] {
  return [...guiJobs.entries()].map(([id, v]) => ({
    id,
    pid: v.pid,
    odb: v.odb,
    startedAt: v.startedAt,
  }));
}

/**
 * Launch OpenROAD -gui in Docker on an ODB (background).
 * Requires DISPLAY / X11 for the GUI window.
 * Sprint A: ODB must live under the caller's owner tree (no cross-tenant /tmp open).
 */
export function startOpenroadOdbGui(
  odbPath: string,
  owner: OpenroadOwner
): {
  ok: boolean;
  sessionId?: string;
  message: string;
  odb: string;
  display: string;
  logFile?: string;
} {
  const abs = path.resolve(odbPath);
  if (!owner?.ownerId || !pathUnderOwner(abs, owner.ownerId)) {
    return {
      ok: false,
      message:
        "ODB path not allowed — must be under your owners/<id> job/upload tree",
      odb: abs,
      display: process.env.DISPLAY || ":0",
    };
  }
  if (!fs.existsSync(abs)) {
    return {
      ok: false,
      message: `ODB not found: ${abs}`,
      odb: abs,
      display: process.env.DISPLAY || ":0",
    };
  }

  const script = path.join(workerDir(), "open_odb_gui.sh");
  try {
    fs.chmodSync(script, 0o755);
  } catch {
    /* */
  }
  if (!fs.existsSync(script)) {
    return {
      ok: false,
      message: `Missing ${script}`,
      odb: abs,
      display: process.env.DISPLAY || ":0",
    };
  }

  const sessionId = `gui_${Date.now().toString(36)}`;
  const logFile = path.join(os.tmpdir(), `ace-odb-gui-${sessionId}.log`);
  const display = process.env.DISPLAY || ":0";
  fs.writeFileSync(
    logFile,
    `ACE-Seek OpenROAD GUI\nodb=${abs}\ndisplay=${display}\n`,
    "utf8"
  );

  const outFd = fs.openSync(logFile, "a");
  const child: ChildProcess = spawn("bash", [script, abs, logFile], {
    detached: true,
    stdio: ["ignore", outFd, outFd],
    env: { ...process.env, DISPLAY: display },
  });
  fs.closeSync(outFd);

  if (!child.pid) {
    return {
      ok: false,
      message: "Failed to spawn OpenROAD GUI process",
      odb: abs,
      display,
      logFile,
    };
  }
  child.unref();
  guiJobs.set(sessionId, {
    pid: child.pid,
    odb: abs,
    startedAt: new Date().toISOString(),
    logFile,
  });

  return {
    ok: true,
    sessionId,
    message: `OpenROAD GUI starting on ${path.basename(abs)} (DISPLAY=${display}). If no window appears, run: xhost +local:docker && ensure DISPLAY is set for the Node server.`,
    odb: abs,
    display,
    logFile,
  };
}
