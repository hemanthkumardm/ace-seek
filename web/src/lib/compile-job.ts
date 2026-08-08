import { spawn, execFileSync } from "child_process";
import fs from "fs/promises";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";

export type JobStatus = "queued" | "running" | "done" | "error";

export type JobRecord = {
  id: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  format: string;
  filename: string;
  backend?: string;
  engine?: string;
  ms?: number;
  bytesIn?: number;
  error?: string;
  details?: string;
  outFile?: string;
  logTail?: string;
};

const JOB_ROOT = path.join(os.tmpdir(), "aic-web-jobs");

function ensureJobRoot() {
  if (!existsSync(JOB_ROOT)) mkdirSync(JOB_ROOT, { recursive: true });
}

export function projectRoot(): string {
  if (process.env.AIC_ROOT && existsSync(path.join(process.env.AIC_ROOT, "bin/aic"))) {
    return process.env.AIC_ROOT;
  }
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(path.join(dir, "bin/aic"))) return dir;
    if (existsSync(path.join(dir, "..", "bin/aic"))) {
      return path.resolve(dir, "..");
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "..");
}

export function enrichedPath(): string {
  const home = process.env.HOME || os.homedir();
  const extra = path.join(home, ".local/bin");
  const cur = process.env.PATH || "";
  return cur.includes(extra) ? cur : `${extra}:${cur}`;
}

export function which(bin: string): boolean {
  for (const dir of enrichedPath().split(path.delimiter)) {
    if (existsSync(path.join(dir, bin))) return true;
  }
  return false;
}

export function hostCapabilities() {
  return {
    pandoc: which("pandoc"),
    tectonic: which("tectonic"),
    xelatex: which("xelatex"),
    lualatex: which("lualatex"),
    pdflatex: which("pdflatex"),
    docker: which("docker"),
    dockerImage: dockerImageExists("aic"),
  };
}

function dockerImageExists(name: string): boolean {
  if (!which("docker")) return false;
  try {
    execFileSync("docker", ["image", "inspect", name], {
      stdio: "ignore",
      env: { ...process.env, PATH: enrichedPath() },
    });
    return true;
  } catch {
    return false;
  }
}

function jobDir(id: string) {
  return path.join(JOB_ROOT, id);
}

function statusPath(id: string) {
  return path.join(jobDir(id), "status.json");
}

export function readJob(id: string): JobRecord | null {
  const p = statusPath(id);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as JobRecord;
  } catch {
    return null;
  }
}

function writeJob(job: JobRecord) {
  ensureJobRoot();
  const dir = jobDir(job.id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  job.updatedAt = Date.now();
  writeFileSync(statusPath(job.id), JSON.stringify(job, null, 2));
}

function runCmd(
  cmd: string,
  args: string[],
  opts: { cwd: string; timeoutMs: number }
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: { ...process.env, PATH: enrichedPath() },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const maxLog = 2_000_000;
    child.stdout.on("data", (d: Buffer) => {
      if (stdout.length < maxLog) stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      if (stderr.length < maxLog) stderr += d.toString();
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Compile timed out after ${Math.round(opts.timeoutMs / 1000)}s`));
    }, opts.timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function parseResolved(log: string): { backend?: string; engine?: string } {
  const out: { backend?: string; engine?: string } = {};
  const m = log.match(/resolved:\s*backend=(\S+)\s+engine=(\S+)/i);
  if (m) {
    out.backend = m[1];
    out.engine = m[2];
  }
  return out;
}

export type StartJobInput = {
  markdown: string;
  engine: string;
  backend: string;
  paper: string;
  format: string;
  wide: boolean;
  landscape: boolean;
  toc: boolean;
  margin: string;
  filename: string;
};

/** Create job and run compile in background (does not block HTTP). */
export function startCompileJob(input: StartJobInput): JobRecord {
  ensureJobRoot();
  const id = randomBytes(8).toString("hex");
  const dir = jobDir(id);
  mkdirSync(dir, { recursive: true });

  const format = input.format;
  const outName = `document.${format === "tex" ? "tex" : format}`;
  const inputPath = path.join(dir, "document.md");
  const outputPath = path.join(dir, outName);

  writeFileSync(inputPath, input.markdown, "utf8");

  const job: JobRecord = {
    id,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    format,
    filename: input.filename || "document",
    bytesIn: Buffer.byteLength(input.markdown, "utf8"),
  };
  writeJob(job);

  // Fire-and-forget (Next.js may keep the process alive while promise runs)
  void runJob(job.id, input, inputPath, outputPath);

  return job;
}

async function runJob(
  id: string,
  input: StartJobInput,
  inputPath: string,
  outputPath: string
) {
  const job = readJob(id);
  if (!job) return;

  job.status = "running";
  writeJob(job);

  const root = projectRoot();
  const aic = path.join(root, "bin/aic");
  if (!existsSync(aic)) {
    job.status = "error";
    job.error = "aic binary not found";
    job.details = aic;
    writeJob(job);
    return;
  }

  // Production image (Dockerfile.web) has TeX inside — never nest Docker.
  let backend = input.backend;
  if (process.env.AIC_FORCE_LOCAL === "1") {
    backend = "local";
  } else if (backend === "auto" && process.env.AIC_BACKEND_DEFAULT) {
    // optional default override
  }

  let engine = input.engine;
  if (engine === "auto" && process.env.AIC_FORCE_LOCAL === "1") {
    // Prefer classic engines shipped in pandoc/latex image
    engine = which("xelatex") ? "xelatex" : which("lualatex") ? "lualatex" : "auto";
  }

  const args: string[] = [
    "--backend",
    backend,
    "--engine",
    engine,
    "--format",
    input.format,
  ];
  if (input.wide) {
    args.push("--wide");
  } else {
    args.push("--paper", input.paper);
    if (input.landscape) args.push("--landscape");
    if (input.margin) args.push("--margin", input.margin);
  }
  if (!input.toc) args.push("--no-toc");
  args.push(inputPath, outputPath);

  const timeoutMs =
    backend === "docker"
      ? Number(process.env.AIC_TIMEOUT_MS || 300_000)
      : Number(process.env.AIC_TIMEOUT_LOCAL_MS || 180_000);

  const t0 = Date.now();
  try {
    console.log(`[job ${id}] start`, args.join(" "));
    const result = await runCmd(aic, args, { cwd: root, timeoutMs });
    const ms = Date.now() - t0;
    const log = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    const resolved = parseResolved(log);

    if (result.code !== 0) {
      job.status = "error";
      job.error = "Compilation failed";
      job.details = (log || `exit ${result.code}`).slice(-8000);
      job.ms = ms;
      job.backend = resolved.backend || input.backend;
      job.engine = resolved.engine || input.engine;
      job.logTail = log.slice(-2000);
      writeJob(job);
      console.error(`[job ${id}] failed`, job.details?.slice(0, 500));
      return;
    }

    if (!existsSync(outputPath)) {
      job.status = "error";
      job.error = "Output file missing";
      job.details = log.slice(-4000);
      job.ms = ms;
      writeJob(job);
      return;
    }

    job.status = "done";
    job.ms = ms;
    job.backend = resolved.backend || input.backend;
    job.engine = resolved.engine || input.engine;
    job.outFile = outputPath;
    job.logTail = log.slice(-1500);
    writeJob(job);
    console.log(`[job ${id}] done ${ms}ms backend=${job.backend} engine=${job.engine}`);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    job.status = "error";
    job.error = "Internal error";
    job.details = message;
    job.ms = Date.now() - t0;
    writeJob(job);
    console.error(`[job ${id}] exception`, message);
  }
}

export function contentTypeFor(format: string): string {
  switch (format) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "tex":
      return "application/x-tex";
    default:
      return "application/octet-stream";
  }
}

export async function readJobOutput(id: string): Promise<Buffer | null> {
  const job = readJob(id);
  if (!job || job.status !== "done" || !job.outFile) return null;
  if (!existsSync(job.outFile)) return null;
  return fs.readFile(job.outFile);
}
