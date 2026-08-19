/**
 * Lint / sim / Yosys frontend tools — host OR Docker.
 *
 *   ACE_TOOLS_MODE=host|docker|auto   (default: auto)
 *     host  — verilator / iverilog / yosys on PATH (light EC2)
 *     docker— tools image (OpenLane image by default)
 *     auto  — host if binaries exist, else docker
 *
 * EC2 light:
 *   ACE_TOOLS_MODE=host
 *   PDK_ROOT=/opt/volare
 *
 * EC2 heavy / identical envs:
 *   ACE_TOOLS_MODE=docker
 *   OPENLANE_IMAGE=... ACE_TOOLS_IMAGE=...
 */

import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export type ToolsMode = "host" | "docker" | "auto";

export function toolsImage(): string {
  return (
    process.env.ACE_TOOLS_IMAGE ||
    process.env.OPENLANE_IMAGE ||
    "efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a"
  );
}

export function pdkRoot(): string {
  return process.env.PDK_ROOT || path.join(os.homedir(), ".volare");
}

export function dockerAvailable(): boolean {
  try {
    if (
      fs.existsSync("/usr/bin/docker") ||
      fs.existsSync("/usr/local/bin/docker")
    ) {
      const r = spawnSync("docker", ["version"], {
        encoding: "utf8",
        timeout: 5000,
      });
      return r.status === 0;
    }
    return false;
  } catch {
    return false;
  }
}

/** Which mode is configured (env only) */
export function configuredToolsMode(): ToolsMode {
  const m = (process.env.ACE_TOOLS_MODE || "auto").toLowerCase().trim();
  if (m === "host" || m === "docker" || m === "auto") return m;
  return "auto";
}

function which(bin: string): string | null {
  try {
    const r = spawnSync("which", [bin], { encoding: "utf8", timeout: 3000 });
    if (r.status === 0 && r.stdout?.trim()) return r.stdout.trim().split("\n")[0];
  } catch {
    /* */
  }
  // common paths
  for (const p of [
    `/usr/bin/${bin}`,
    `/usr/local/bin/${bin}`,
    `/opt/homebrew/bin/${bin}`,
  ]) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function hostHasFrontendTools(): {
  ok: boolean;
  verilator: string | null;
  iverilog: string | null;
  vvp: string | null;
  yosys: string | null;
} {
  const verilator = which("verilator");
  const iverilog = which("iverilog");
  const vvp = which("vvp");
  const yosys = which("yosys");
  return {
    ok: !!(verilator && iverilog && vvp && yosys),
    verilator,
    iverilog,
    vvp,
    yosys,
  };
}

/**
 * Resolve effective mode for lint/sim/synth.
 * PnR (OpenLane) always uses Docker separately.
 */
export function resolveToolsMode(): {
  mode: "host" | "docker";
  reason: string;
  host: ReturnType<typeof hostHasFrontendTools>;
  docker: boolean;
} {
  const cfg = configuredToolsMode();
  const host = hostHasFrontendTools();
  const docker = dockerAvailable();

  if (cfg === "host") {
    return {
      mode: "host",
      reason: host.ok
        ? "ACE_TOOLS_MODE=host (native verilator/iverilog/yosys)"
        : "ACE_TOOLS_MODE=host but some binaries missing — runs will fail until installed",
      host,
      docker,
    };
  }
  if (cfg === "docker") {
    return {
      mode: "docker",
      reason: docker
        ? `ACE_TOOLS_MODE=docker (${toolsImage()})`
        : "ACE_TOOLS_MODE=docker but Docker unavailable",
      host,
      docker,
    };
  }
  // auto
  if (host.ok) {
    return {
      mode: "host",
      reason: "ACE_TOOLS_MODE=auto → host tools found",
      host,
      docker,
    };
  }
  if (docker) {
    return {
      mode: "docker",
      reason: `ACE_TOOLS_MODE=auto → host incomplete, using Docker (${toolsImage()})`,
      host,
      docker,
    };
  }
  return {
    mode: "host",
    reason:
      "ACE_TOOLS_MODE=auto → no complete host tools and no Docker; install tools or Docker",
    host,
    docker,
  };
}

export interface ToolRunResult {
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
  log: string;
  /** host | docker */
  mode: "host" | "docker";
}

/**
 * Run bash -lc in tools container with /work mounted.
 */
export function runInToolsContainer(
  workDir: string,
  bashCmd: string,
  opts?: {
    mountPdk?: boolean;
    timeoutMs?: number;
    env?: Record<string, string>;
  }
): ToolRunResult {
  if (!dockerAvailable()) {
    return {
      ok: false,
      status: null,
      stdout: "",
      stderr: "Docker not available on host",
      mode: "docker",
      log: "ERROR: Docker not available. Set ACE_TOOLS_MODE=host and install verilator/iverilog/yosys, or install Docker.",
    };
  }

  const absWork = path.resolve(workDir);
  const image = toolsImage();
  const args = [
    "run",
    "--rm",
    "--entrypoint",
    "bash",
    "-v",
    `${absWork}:/work`,
    "-w",
    "/work",
    "-e",
    "HOME=/tmp",
  ];

  if (opts?.mountPdk) {
    const root = pdkRoot();
    if (fs.existsSync(root)) {
      args.push("-v", `${root}:/pdk:ro`, "-e", "PDK_ROOT=/pdk");
    }
  }

  if (opts?.env) {
    for (const [k, v] of Object.entries(opts.env)) {
      args.push("-e", `${k}=${v}`);
    }
  }

  args.push(image, "-lc", bashCmd);

  const r = spawnSync("docker", args, {
    encoding: "utf8",
    maxBuffer: 16_000_000,
    timeout: opts?.timeoutMs ?? 600_000,
  });

  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  const log = `${stdout}\n${stderr}`.trim();
  return {
    ok: r.status === 0,
    status: r.status,
    stdout,
    stderr,
    mode: "docker",
    log:
      log ||
      (r.error
        ? `ERROR: ${r.error.message}`
        : `docker exit ${r.status}`),
  };
}

/**
 * Run bash -lc on the host in workDir (light EC2 path).
 */
export function runOnHost(
  workDir: string,
  bashCmd: string,
  opts?: { timeoutMs?: number; env?: Record<string, string> }
): ToolRunResult {
  const absWork = path.resolve(workDir);
  const r = spawnSync("bash", ["-lc", bashCmd], {
    encoding: "utf8",
    cwd: absWork,
    maxBuffer: 16_000_000,
    timeout: opts?.timeoutMs ?? 600_000,
    env: { ...process.env, ...(opts?.env || {}) },
  });
  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  const log = `${stdout}\n${stderr}`.trim();
  return {
    ok: r.status === 0,
    status: r.status,
    stdout,
    stderr,
    mode: "host",
    log:
      log ||
      (r.error ? `ERROR: ${r.error.message}` : `host exit ${r.status}`),
  };
}

/**
 * Run a frontend tool command with resolved ACE_TOOLS_MODE.
 */
export function runFrontendTools(
  workDir: string,
  bashCmd: string,
  opts?: {
    mountPdk?: boolean;
    timeoutMs?: number;
    env?: Record<string, string>;
    /** Force mode for this call */
    forceMode?: "host" | "docker";
  }
): ToolRunResult {
  const resolved = resolveToolsMode();
  const mode = opts?.forceMode || resolved.mode;

  if (mode === "docker") {
    if (!resolved.docker) {
      return {
        ok: false,
        status: null,
        stdout: "",
        stderr: "Docker unavailable",
        mode: "docker",
        log: `ERROR: ${resolved.reason}`,
      };
    }
    const r = runInToolsContainer(workDir, bashCmd, opts);
    r.log = `[mode=docker] ${resolved.reason}\n${r.log}`;
    return r;
  }

  // host
  const missing: string[] = [];
  if (!resolved.host.verilator) missing.push("verilator");
  if (!resolved.host.iverilog) missing.push("iverilog");
  if (!resolved.host.vvp) missing.push("vvp");
  if (!resolved.host.yosys) missing.push("yosys");
  // Don't hard-fail host mode if only some missing — command may only need one tool
  const r = runOnHost(workDir, bashCmd, opts);
  r.log = `[mode=host] ${resolved.reason}${
    missing.length ? ` (missing on PATH: ${missing.join(", ")})` : ""
  }\n${r.log}`;
  return r;
}

export function isTbName(name: string): boolean {
  const n = name.replace(/\\/g, "/").toLowerCase();
  const base = n.split("/").pop() || n;
  return (
    n.includes("/tb/") ||
    base.startsWith("tb_") ||
    base.startsWith("tb.") ||
    /_tb\.|_test\./.test(base)
  );
}

/** Liberty path *inside* container when PDK is mounted at /pdk */
export function containerLibertyPath(): string {
  return "/pdk/sky130A/libs.ref/sky130_fd_sc_hd/lib/sky130_fd_sc_hd__tt_025C_1v80.lib";
}

/** Liberty path on host */
export function hostLibertyPath(): string {
  return path.join(
    pdkRoot(),
    "sky130A/libs.ref/sky130_fd_sc_hd/lib/sky130_fd_sc_hd__tt_025C_1v80.lib"
  );
}

export function hostLibertyExists(): boolean {
  return fs.existsSync(hostLibertyPath());
}

/** Diagnostics for /api/openroad/pdks or health */
export function toolsDiagnostics(): Record<string, unknown> {
  const resolved = resolveToolsMode();
  return {
    ACE_TOOLS_MODE: configuredToolsMode(),
    effectiveMode: resolved.mode,
    reason: resolved.reason,
    hostTools: resolved.host,
    dockerAvailable: resolved.docker,
    toolsImage: toolsImage(),
    pdkRoot: pdkRoot(),
    hostLiberty: hostLibertyExists(),
  };
}
