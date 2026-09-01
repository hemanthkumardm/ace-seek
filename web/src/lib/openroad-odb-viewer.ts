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
  getOpenroadJobsRoot,
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
  const stageTmpBase = path.join(getOpenroadJobsRoot(), "tmp");
  fs.mkdirSync(stageTmpBase, { recursive: true });
  const work = fs.mkdtempSync(path.join(stageTmpBase, "ace-odb-validate-"));
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

export interface ActiveGuiSession {
  sessionId: string;
  ownerId: string;
  displayNum: number;
  display: string;
  vncPort: number;
  novncPort: number;
  token: string;
  pid: number;
  dockerContainerName: string;
  odb: string;
  logFile: string;
  startedAt: string;
  expiresAt: string;
}

const activeGuiSessions = new Map<string, ActiveGuiSession>();

export function stopOpenroadOdbGui(sessionId: string): boolean {
  const sess = activeGuiSessions.get(sessionId);
  if (!sess) return false;

  try {
    if (sess.pid) {
      process.kill(-sess.pid, "SIGTERM");
    }
  } catch {
    try {
      if (sess.pid) process.kill(sess.pid, "SIGKILL");
    } catch {}
  }

  try {
    if (sess.dockerContainerName) {
      spawnSync("docker", ["rm", "-f", sess.dockerContainerName], { stdio: "ignore" });
    }
  } catch {}

  try {
    spawnSync("pkill", ["-f", `Xvfb :${sess.displayNum}`], { stdio: "ignore" });
    spawnSync("pkill", ["-f", `x11vnc.*:${sess.displayNum}`], { stdio: "ignore" });
    spawnSync("pkill", ["-f", `websockify.*${sess.novncPort}`], { stdio: "ignore" });
    spawnSync("rm", ["-f", `/tmp/.X${sess.displayNum}-lock`, `/tmp/.X11-unix/X${sess.displayNum}`], { stdio: "ignore" });
  } catch {}

  activeGuiSessions.delete(sessionId);
  return true;
}

// Auto-reap expired sessions (20 min lifetime)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [id, sess] of activeGuiSessions.entries()) {
      if (new Date(sess.expiresAt).getTime() <= now) {
        stopOpenroadOdbGui(id);
      }
    }
  }, 30000);
}

function allocateSlot(ownerId: string): {
  displayNum: number;
  display: string;
  vncPort: number;
  novncPort: number;
} {
  // Reclaim any existing session for this owner
  for (const [sId, sess] of activeGuiSessions.entries()) {
    if (sess.ownerId === ownerId) {
      stopOpenroadOdbGui(sId);
    }
  }

  const usedDisplays = new Set<number>();
  for (const sess of activeGuiSessions.values()) {
    usedDisplays.add(sess.displayNum);
  }

  let displayNum = 101;
  for (let i = 101; i <= 120; i++) {
    if (!usedDisplays.has(i)) {
      displayNum = i;
      break;
    }
  }

  const offset = displayNum - 100;
  const vncPort = 5900 + offset;
  const novncPort = 6080 + offset; // 6081, 6082, ...
  const display = `:${displayNum}`;

  return { displayNum, display, vncPort, novncPort };
}

/**
 * Launch OpenROAD GUI inside Docker attached to a private dynamic display & noVNC port.
 */
export function startOpenroadOdbGui(
  odbPath: string,
  owner?: OpenroadOwner | null,
  hostHint?: string
): {
  ok: boolean;
  sessionId?: string;
  message: string;
  odb: string;
  display: string;
  logFile?: string;
  webUrl?: string;
} {
  const abs = path.resolve(odbPath);
  const ownerId = owner?.ownerId || "anon";

  if (!owner?.ownerId || !pathUnderOwner(abs, owner.ownerId)) {
    return {
      ok: false,
      message:
        "ODB path not allowed — must be under your owners/<id> job/upload tree",
      odb: abs,
      display: ":101",
    };
  }
  if (!fs.existsSync(abs)) {
    return {
      ok: false,
      message: `ODB not found: ${abs}`,
      odb: abs,
      display: ":101",
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
      display: ":101",
    };
  }

  const slot = allocateSlot(ownerId);
  const sessionId = `gui_${ownerId.slice(0, 8)}_${Date.now().toString(36)}`;
  const token = Math.random().toString(36).slice(2, 10);
  const containerName = `ace-openroad-gui-${slot.displayNum}-${Date.now().toString(36)}`;
  const logFile = path.join(os.tmpdir(), `ace-odb-gui-${sessionId}.log`);

  fs.writeFileSync(
    logFile,
    `ACE-Seek OpenROAD Dynamic GUI\nsession=${sessionId}\nodb=${abs}\ndisplay=${slot.display}\nnovnc_port=${slot.novncPort}\n`,
    "utf8"
  );

  const outFd = fs.openSync(logFile, "a");
  const child: ChildProcess = spawn(
    "bash",
    [
      script,
      abs,
      logFile,
      slot.display,
      String(slot.vncPort),
      String(slot.novncPort),
      containerName,
    ],
    {
      detached: true,
      stdio: ["ignore", outFd, outFd],
      env: {
        ...process.env,
        DISPLAY: slot.display,
        ACE_VNC_DISPLAY: slot.display,
        ACE_VNC_PORT: String(slot.vncPort),
        ACE_NOVNC_PORT: String(slot.novncPort),
      },
    }
  );
  fs.closeSync(outFd);

  if (!child.pid) {
    return {
      ok: false,
      message: "Failed to spawn OpenROAD GUI process",
      odb: abs,
      display: slot.display,
      logFile,
    };
  }
  child.unref();

  const now = Date.now();
  const sessionRecord: ActiveGuiSession = {
    sessionId,
    ownerId,
    displayNum: slot.displayNum,
    display: slot.display,
    vncPort: slot.vncPort,
    novncPort: slot.novncPort,
    token,
    pid: child.pid,
    dockerContainerName: containerName,
    odb: abs,
    logFile,
    startedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 20 * 60 * 1000).toISOString(), // 20 min TTL
  };
  activeGuiSessions.set(sessionId, sessionRecord);

  const host =
    process.env.OPENROAD_PUBLIC_HOST ||
    process.env.EC2_PUBLIC_IP ||
    (hostHint ? hostHint.split(":")[0] : "") ||
    "3.90.62.206";

  const webUrl = `http://${host}:${slot.novncPort}/vnc.html?autoconnect=true&resize=remote&token=${token}`;

  return {
    ok: true,
    sessionId,
    message: `OpenROAD GUI active for ${path.basename(abs)} on private display ${slot.display}.`,
    odb: abs,
    display: slot.display,
    logFile,
    webUrl,
  };
}
