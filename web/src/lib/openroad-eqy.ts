/**
 * EQY formal LEC job helpers — fail-closed; never invent EQUIVALENT.
 */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import type { OpenroadProjectState } from "./openroad-project-hub";
import { getFileByRole } from "./openroad-project-hub";
import { ownerRoot, safeOwnerId } from "./openroad-owner";
import { getPdkDef } from "./openroad-pdk-catalog";

export type EqyMode = "rtl_vs_synth" | "synth_vs_layout";

export type EqyJobRecord = {
  version: 1;
  eqyId: string;
  ownerId: string;
  createdAt: string;
  mode: EqyMode;
  designName: string;
  status: "queued" | "running" | "succeeded" | "failed" | "unavailable";
  equivalent: boolean | null;
  message: string;
  scriptPath?: string;
  logTail?: string;
  exitCode?: number | null;
  eqyAvailable: boolean;
};

function eqyDir(ownerId: string): string {
  return path.join(ownerRoot(safeOwnerId(ownerId)), "eqy");
}

function eqyPath(ownerId: string, eqyId: string): string {
  return path.join(eqyDir(ownerId), `${eqyId}.json`);
}

export function whichEqy(): string | null {
  const r = spawnSync("which", ["eqy"], { encoding: "utf8" });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  return null;
}

export function buildEqyScript(opts: {
  project: OpenroadProjectState;
  mode: EqyMode;
  workDir: string;
}): { script: string; scriptPath: string; missing: string[] } {
  const top = opts.project.topModule || opts.project.designName || "top";
  const pdk = getPdkDef(opts.project.pdk);
  const liberty = pdk.cells.libertyFile;
  const rtl =
    getFileByRole(opts.project, "rtl")?.content ||
    opts.project.files.find((f) => /\.v$|\.sv$/i.test(f.name))?.content ||
    "";
  const missing: string[] = [];
  if (!rtl.trim()) missing.push("RTL");

  const rtlPath = path.join(opts.workDir, `${top}.v`);
  const netPath = path.join(opts.workDir, `synthesis_${top}.v`);
  const routePath = path.join(opts.workDir, `routing_${top}.nl.v`);
  fs.mkdirSync(opts.workDir, { recursive: true });
  fs.writeFileSync(rtlPath, rtl || `// missing RTL\nmodule ${top}; endmodule\n`, "utf8");

  // Prefer prior job artifacts if present under owner jobs — else stub gate for preview-only
  const gateStub = `// Gate netlist placeholder — replace with synth/route output for real LEC\nmodule ${top}; endmodule\n`;
  if (!fs.existsSync(netPath)) fs.writeFileSync(netPath, gateStub, "utf8");
  if (!fs.existsSync(routePath)) fs.writeFileSync(routePath, gateStub, "utf8");

  let script: string;
  if (opts.mode === "rtl_vs_synth") {
    script = `# Ace-Seek EQY — ${top} (rtl_vs_synth) · PDK ${pdk.label}
[gold]
read_verilog -sv ${rtlPath}
prep -top ${top}

[gate]
read_liberty -lib ${liberty}
read_verilog ${netPath}
prep -top ${top}

[strategy sat]
use sat
depth 15
`;
  } else {
    script = `# Ace-Seek EQY — ${top} (synth_vs_layout) · PDK ${pdk.label}
[gold]
read_liberty -lib ${liberty}
read_verilog ${netPath}
prep -top ${top}

[gate]
read_liberty -lib ${liberty}
read_verilog ${routePath}
prep -top ${top}

[strategy sat]
use sat
depth 15
`;
  }

  const scriptPath = path.join(opts.workDir, `${top}_${opts.mode}.eqy`);
  fs.writeFileSync(scriptPath, script, "utf8");
  return { script, scriptPath, missing };
}

function writeJob(rec: EqyJobRecord) {
  const dir = eqyDir(rec.ownerId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(eqyPath(rec.ownerId, rec.eqyId), JSON.stringify(rec, null, 2));
}

export function readEqyJob(ownerId: string, eqyId: string): EqyJobRecord | null {
  try {
    const p = eqyPath(ownerId, eqyId);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as EqyJobRecord;
  } catch {
    return null;
  }
}

/**
 * Start EQY: if `eqy` on PATH, run fail-closed; else mark unavailable with export guidance.
 * Never invents equivalent=true.
 */
export function startEqyJob(opts: {
  ownerId: string;
  project: OpenroadProjectState;
  mode?: EqyMode;
}): EqyJobRecord {
  const mode = opts.mode || "rtl_vs_synth";
  const eqyId = `eqy_${randomBytes(4).toString("hex")}`;
  const workDir = path.join(eqyDir(opts.ownerId), eqyId);
  const { scriptPath, missing } = buildEqyScript({
    project: opts.project,
    mode,
    workDir,
  });

  const eqyBin = whichEqy();
  const base: EqyJobRecord = {
    version: 1,
    eqyId,
    ownerId: opts.ownerId,
    createdAt: new Date().toISOString(),
    mode,
    designName: opts.project.designName || opts.project.topModule || "top",
    status: "queued",
    equivalent: null,
    message: "",
    scriptPath,
    eqyAvailable: Boolean(eqyBin),
    exitCode: null,
  };

  if (missing.length) {
    base.status = "failed";
    base.message = `Missing project inputs for EQY: ${missing.join(", ")}. Upload RTL on Project.`;
    writeJob(base);
    return base;
  }

  if (!eqyBin) {
    base.status = "unavailable";
    base.equivalent = null;
    base.message =
      "eqy not found on this worker PATH. Export the OpenROAD pack and run `make lec-synth` / `make lec-pnr` locally. AceForge cloud LEC requires ACE_FORGE_LEC=1 and eqy in the image.";
    base.logTail = base.message;
    writeJob(base);
    return base;
  }

  base.status = "running";
  base.message = `Running ${eqyBin}…`;
  writeJob(base);

  const logFile = path.join(workDir, "eqy.log");
  const result = spawnSync(eqyBin, [scriptPath], {
    encoding: "utf8",
    cwd: workDir,
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const out = `${result.stdout || ""}\n${result.stderr || ""}`;
  fs.writeFileSync(logFile, out, "utf8");
  base.logTail = out.slice(-8000);
  base.exitCode = result.status;

  const proved =
    /Successfully proved equivalence|EQUIVALENT|Proof successful/i.test(out) &&
    !/NOT EQUIVALENT|Failed to prove|ERROR/i.test(out);
  const failedHard =
    result.error != null ||
    result.status == null ||
    result.status !== 0 ||
    /NOT EQUIVALENT|Failed to prove|ERROR/i.test(out);

  if (proved && !failedHard) {
    base.status = "succeeded";
    base.equivalent = true;
    base.message = "EQY reported equivalence (fail-closed parse).";
  } else {
    base.status = "failed";
    base.equivalent = false;
    base.message = failedHard
      ? `EQY exited ${result.status ?? "error"} — not equivalent or tool failure (fail-closed).`
      : "EQY finished without a clear EQUIVALENT proof — treated as failed (fail-closed).";
  }
  writeJob(base);
  return base;
}
