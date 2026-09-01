/**
 * Multi-format document conversion jobs.
 * Uses aic for md→pdf (Tcl/math pipeline); pandoc for most pairs;
 * pdftotext (poppler) for PDF → text paths.
 */
import { spawn } from "child_process";
import fs from "fs/promises";
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";
import {
  DocFormat,
  FORMAT_META,
  PdfDocxMode,
  isDocFormat,
  pandocReader,
  pandocWriter,
} from "@/lib/formats";
import { projectRoot, enrichedPath, which } from "@/lib/compile-job";
import { smartPdfToMarkdown } from "@/lib/pdf-structure";

export type ConvertJobStatus = "queued" | "running" | "done" | "error";

export type ConvertJobRecord = {
  id: string;
  status: ConvertJobStatus;
  createdAt: number;
  updatedAt: number;
  inputFormat: DocFormat;
  outputFormat: DocFormat;
  filename: string;
  backend?: string;
  engine?: string;
  ms?: number;
  bytesIn?: number;
  error?: string;
  details?: string;
  outFile?: string;
  logTail?: string;
  /** If output is text, optional UTF-8 body for preview */
  textPreview?: string;
};

const JOB_ROOT =
  process.env.AIC_JOB_ROOT || path.join(os.homedir(), ".cache", "aic-web-jobs");

function ensureJobRoot() {
  if (!existsSync(/*turbopackIgnore: true*/ JOB_ROOT)) mkdirSync(JOB_ROOT, { recursive: true });
}

function jobDir(id: string) {
  return path.join(JOB_ROOT, id);
}

function statusPath(id: string) {
  return path.join(jobDir(id), "status.json");
}

export function readConvertJob(id: string): ConvertJobRecord | null {
  const p = statusPath(id);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as ConvertJobRecord;
  } catch {
    return null;
  }
}

function writeJob(job: ConvertJobRecord) {
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
      reject(new Error(`Convert timed out after ${Math.round(opts.timeoutMs / 1000)}s`));
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

export function convertContentType(format: DocFormat): string {
  return FORMAT_META[format]?.mime || "application/octet-stream";
}

export type StartConvertInput = {
  inputFormat: DocFormat;
  outputFormat: DocFormat;
  /** UTF-8 text when input is text-editable */
  text?: string;
  /** Binary/file buffer when uploaded */
  fileBuffer?: Buffer;
  /** Original upload name for extension hints */
  originalName?: string;
  engine: string;
  backend: string;
  paper: string;
  wide: boolean;
  landscape: boolean;
  toc: boolean;
  margin: string;
  filename: string;
  /**
   * PDF → DOCX only:
   *  editable = pdf2docx (reflowable text)
   *  exact    = page images (visual clone)
   */
  pdfDocxMode?: PdfDocxMode;
  /** Render DPI for exact mode (72–300) */
  exactDpi?: number;
  /**
   * Pro engine (premium): higher-quality exact DPI floor + future commercial APIs.
   * Server must already have validated entitlement.
   */
  useProEngine?: boolean;
};

function outName(format: DocFormat): string {
  return `document.${FORMAT_META[format].ext}`;
}

function inName(format: DocFormat): string {
  return `input.${FORMAT_META[format].ext}`;
}

function pickPdfEngine(requested: string): string {
  if (requested && requested !== "auto") return requested;
  if (which("tectonic")) return "tectonic";
  if (which("xelatex")) return "xelatex";
  if (which("lualatex")) return "lualatex";
  if (which("pdflatex")) return "pdflatex";
  return "tectonic";
}

function hasPdftotext(): boolean {
  return which("pdftotext");
}

/** Extract text from PDF → plain string */
async function pdfToText(pdfPath: string, cwd: string): Promise<string> {
  if (hasPdftotext()) {
    const r = await runCmd("pdftotext", ["-layout", pdfPath, "-"], {
      cwd,
      timeoutMs: 60_000,
    });
    if (r.code === 0) return r.stdout;
    throw new Error(`pdftotext failed:\n${r.stderr || r.stdout}`);
  }
  // Last resort: strings-like dump via pandoc won't work on PDF.
  throw new Error(
    "PDF input needs `pdftotext` (poppler).\n\n" +
      "macOS:  brew install poppler\n" +
      "Ubuntu: sudo apt install -y poppler-utils\n"
  );
}

export function startConvertJob(input: StartConvertInput): ConvertJobRecord {
  ensureJobRoot();
  const id = randomBytes(8).toString("hex");
  const dir = jobDir(id);
  mkdirSync(dir, { recursive: true });

  const { inputFormat: from, outputFormat: to } = input;
  const inputPath = path.join(dir, inName(from));
  const outputPath = path.join(dir, outName(to));

  let bytesIn = 0;
  if (input.fileBuffer && input.fileBuffer.length > 0) {
    writeFileSync(inputPath, input.fileBuffer);
    bytesIn = input.fileBuffer.length;
  } else if (input.text != null) {
    writeFileSync(inputPath, input.text, "utf8");
    bytesIn = Buffer.byteLength(input.text, "utf8");
  } else {
    writeFileSync(inputPath, "", "utf8");
  }

  const job: ConvertJobRecord = {
    id,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    inputFormat: from,
    outputFormat: to,
    filename: input.filename || "document",
    bytesIn,
  };
  writeJob(job);

  void runConvertJob(job.id, input, inputPath, outputPath);
  return job;
}

async function runConvertJob(
  id: string,
  input: StartConvertInput,
  inputPath: string,
  outputPath: string
) {
  const job = readConvertJob(id);
  if (!job) return;

  job.status = "running";
  writeJob(job);

  const from = input.inputFormat;
  const to = input.outputFormat;
  const dir = jobDir(id);
  const t0 = Date.now();
  const logs: string[] = [];
  const log = (s: string) => logs.push(s);

  try {
    if (from === to) {
      copyFileSync(inputPath, outputPath);
      log(`same-format copy ${from}`);
      job.backend = "copy";
      job.engine = "none";
    } else if (from === "md" && to === "pdf") {
      // Best path: aic pipeline (Tcl preprocess + TeX)
      await convertMdToPdfViaAic(input, inputPath, outputPath, log);
      job.backend = input.backend;
      job.engine = input.engine;
    } else if (from === "pdf") {
      await convertFromPdf(from, to, inputPath, outputPath, dir, input, log);
      job.backend = "local";
      job.engine =
        to === "docx"
          ? input.useProEngine
            ? input.pdfDocxMode === "exact"
              ? "pro-exact-images"
              : "pro-editable"
            : input.pdfDocxMode === "exact"
              ? "exact-images"
              : "pdf2docx"
          : hasPdftotext()
            ? "pdftotext+pandoc"
            : "pdftotext";
    } else if (to === "pdf") {
      await convertToPdf(from, inputPath, outputPath, dir, input, log);
      job.backend = "local";
      job.engine = pickPdfEngine(input.engine);
    } else {
      await convertViaPandoc(from, to, inputPath, outputPath, dir, log);
      job.backend = "local";
      job.engine = "pandoc";
    }

    if (!existsSync(outputPath)) {
      throw new Error("Output file was not created");
    }

    // Text preview for text outputs
    if (FORMAT_META[to].textEditable || to === "md" || to === "tex" || to === "plain" || to === "html") {
      try {
        const body = readFileSync(outputPath, "utf8");
        job.textPreview = body.slice(0, 200_000);
      } catch {
        /* binary-ish */
      }
    }

    job.status = "done";
    job.ms = Date.now() - t0;
    job.outFile = outputPath;
    job.logTail = logs.join("\n").slice(-2000);
    writeJob(job);
    console.log(`[convert ${id}] done ${job.ms}ms ${from}→${to}`);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    job.status = "error";
    job.error = "Conversion failed";
    job.details = (logs.join("\n") + "\n" + message).slice(-8000);
    job.ms = Date.now() - t0;
    job.logTail = logs.join("\n").slice(-2000);
    writeJob(job);
    console.error(`[convert ${id}] failed`, message.slice(0, 400));
  }
}

async function convertMdToPdfViaAic(
  input: StartConvertInput,
  inputPath: string,
  outputPath: string,
  log: (s: string) => void
) {
  const root = projectRoot();
  const aic = path.join(root, "bin/aic");
  if (!existsSync(aic)) throw new Error(`aic not found at ${aic}`);

  let backend = input.backend;
  if (process.env.AIC_FORCE_LOCAL === "1") backend = "local";
  else if (backend === "auto" && process.env.AIC_BACKEND_DEFAULT) {
    const def = process.env.AIC_BACKEND_DEFAULT.toLowerCase();
    if (def === "docker" || def === "local") backend = def;
  }

  let engine = input.engine;
  if (engine === "auto") engine = pickPdfEngine("auto");

  const args = ["--backend", backend, "--engine", engine, "--format", "pdf"];
  if (input.wide) args.push("--wide");
  else {
    args.push("--paper", input.paper);
    if (input.landscape) args.push("--landscape");
    if (input.margin) args.push("--margin", input.margin);
  }
  if (!input.toc) args.push("--no-toc");
  args.push(inputPath, outputPath);

  log(`aic ${args.join(" ")}`);
  const r = await runCmd(aic, args, {
    cwd: root,
    timeoutMs: backend === "docker" ? 300_000 : 180_000,
  });
  log(r.stdout);
  log(r.stderr);
  if (r.code !== 0) throw new Error(r.stderr || r.stdout || `aic exit ${r.code}`);
}

async function convertViaPandoc(
  from: DocFormat,
  to: DocFormat,
  inputPath: string,
  outputPath: string,
  cwd: string,
  log: (s: string) => void
) {
  if (!which("pandoc")) {
    throw new Error("pandoc not found. Install: brew install pandoc  (or apt install pandoc)");
  }
  const f = pandocReader(from);
  const t = pandocWriter(to);
  if (!f || !t) throw new Error(`Pandoc cannot map ${from} → ${to}`);

  const args = [inputPath, "-f", f, "-t", t, "-o", outputPath];
  // --standalone only for document formats that need a full wrapper
  if (to === "html" || to === "tex" || to === "docx" || to === "odt") {
    args.push("--standalone");
  }
  log(`pandoc ${args.join(" ")}`);
  const r = await runCmd("pandoc", args, { cwd, timeoutMs: 120_000 });
  log(r.stdout);
  log(r.stderr);
  if (r.code !== 0) throw new Error(r.stderr || r.stdout || `pandoc exit ${r.code}`);
}

async function convertToPdf(
  from: DocFormat,
  inputPath: string,
  outputPath: string,
  cwd: string,
  input: StartConvertInput,
  log: (s: string) => void
) {
  if (!which("pandoc")) throw new Error("pandoc not found");
  const engine = pickPdfEngine(input.engine);
  if (!which(engine) && engine !== "tectonic") {
    // tectonic may live in brew path — which() should catch it
  }
  if (!which(engine)) {
    throw new Error(
      `PDF engine '${engine}' not found. Install tectonic (brew install tectonic) or use Docker.`
    );
  }

  const f = pandocReader(from);
  if (!f) throw new Error(`Cannot convert ${from} to PDF`);

  const args = [
    inputPath,
    "-f",
    f,
    "-o",
    outputPath,
    "--pdf-engine",
    engine,
    "--standalone",
  ];
  if (input.toc) args.push("--toc");
  log(`pandoc ${args.join(" ")}`);
  const r = await runCmd("pandoc", args, { cwd, timeoutMs: 180_000 });
  log(r.stdout);
  log(r.stderr);
  if (r.code !== 0) throw new Error(r.stderr || r.stdout || `pandoc exit ${r.code}`);
}

/**
 * Exact-look PDF → DOCX: each page is a full-page PNG in Word (visual clone).
 */
async function convertPdfToDocxExact(
  inputPath: string,
  outputPath: string,
  cwd: string,
  dpi: number,
  pro: boolean,
  log: (s: string) => void
): Promise<"exact-images" | "pro-exact-images"> {
  const root = projectRoot();
  const helper = path.join(root, "bin/pdf-to-docx-exact");
  if (!existsSync(helper)) {
    throw new Error(`Exact mode helper missing: ${helper}`);
  }
  const maxDpi = pro ? 400 : 300;
  const safeDpi = Math.max(72, Math.min(maxDpi, dpi || (pro ? 300 : 150)));
  log(`exact mode: page images @ ${safeDpi} dpi${pro ? " + pro-max" : ""}`);
  const args = [helper, inputPath, outputPath, "--dpi", String(safeDpi)];
  if (pro) args.push("--pro");
  const r = await runCmd("python3", args, { cwd, timeoutMs: 900_000 });
  log(r.stdout);
  log(r.stderr);
  if (r.code !== 0 || !existsSync(outputPath)) {
    throw new Error(
      r.stderr ||
        r.stdout ||
        `Exact mode failed (exit ${r.code}). Need: pip3 install --user 'pymupdf==1.23.26' python-docx`
    );
  }
  return pro ? "pro-exact-images" : "exact-images";
}

/**
 * Editable PDF → DOCX via bin/pdf-to-docx (pdf2docx).
 * Falls back to LibreOffice then text extraction if needed.
 */
async function convertPdfToDocxEditable(
  inputPath: string,
  outputPath: string,
  cwd: string,
  pro: boolean,
  log: (s: string) => void
): Promise<"pdf2docx" | "pro-pdf2docx" | "libreoffice" | "text-fallback"> {
  const root = projectRoot();
  const helper = path.join(root, "bin/pdf-to-docx");
  if (existsSync(helper)) {
    log(`editable mode: pdf2docx max-quality${pro ? " (pro)" : ""}`);
    const args = [helper, inputPath, outputPath];
    if (pro) args.push("--pro");
    const r = await runCmd("python3", args, {
      cwd,
      timeoutMs: 600_000,
    });
    log(r.stdout);
    log(r.stderr);
    if (r.code === 0 && existsSync(outputPath)) {
      return pro ? "pro-pdf2docx" : "pdf2docx";
    }
    log(`pdf2docx path failed (code ${r.code}); trying alternatives…`);
  }

  const lo =
    (which("soffice") && "soffice") ||
    (which("libreoffice") && "libreoffice") ||
    null;
  if (lo) {
    log(`${lo} --headless --convert-to docx`);
    const r = await runCmd(
      lo,
      ["--headless", "--norestore", "--convert-to", "docx", "--outdir", cwd, inputPath],
      { cwd, timeoutMs: 300_000 }
    );
    log(r.stdout);
    log(r.stderr);
    const base = path.basename(inputPath, path.extname(inputPath)) + ".docx";
    const loOut = path.join(cwd, base);
    if (existsSync(loOut)) {
      if (loOut !== outputPath) copyFileSync(loOut, outputPath);
      return "libreoffice";
    }
  }

  log("WARNING: falling back to text extraction (layout will be poor)");
  const text = await pdfToText(inputPath, cwd);
  const mid = path.join(cwd, "extracted.md");
  writeFileSync(
    mid,
    text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .join("\n\n") + "\n",
    "utf8"
  );
  if (!which("pandoc")) {
    throw new Error(
      "PDF → DOCX (editable) needs pdf2docx.\n\n" +
        "Install:  pip3 install --user -r requirements-convert.txt\n\n" +
        "Or use Exact look mode for visual fidelity."
    );
  }
  const args = [mid, "-f", "markdown", "-t", "docx", "-o", outputPath, "--standalone"];
  const r = await runCmd("pandoc", args, { cwd, timeoutMs: 120_000 });
  log(r.stdout);
  log(r.stderr);
  if (r.code !== 0) throw new Error(r.stderr || r.stdout || `pandoc exit ${r.code}`);
  return "text-fallback";
}

async function convertPdfToDocx(
  inputPath: string,
  outputPath: string,
  cwd: string,
  mode: PdfDocxMode,
  dpi: number,
  pro: boolean,
  log: (s: string) => void
): Promise<string> {
  if (mode === "exact") {
    return convertPdfToDocxExact(inputPath, outputPath, cwd, dpi, pro, log);
  }
  return convertPdfToDocxEditable(inputPath, outputPath, cwd, pro, log);
}

async function convertFromPdf(
  _from: DocFormat,
  to: DocFormat,
  inputPath: string,
  outputPath: string,
  cwd: string,
  input: StartConvertInput,
  log: (s: string) => void
) {
  // Dual mode for Word (+ optional Pro engine = max quality)
  if (to === "docx") {
    const mode: PdfDocxMode = input.pdfDocxMode === "exact" ? "exact" : "editable";
    const pro = Boolean(input.useProEngine);
    let dpi = input.exactDpi ?? (pro ? 300 : 150);
    if (mode === "exact") {
      // Max quality floor for exact; Pro pushes to print-grade
      dpi = pro ? Math.max(dpi, 300) : Math.max(dpi, 150);
      dpi = Math.min(pro ? 400 : 300, dpi);
      log(`Exact look @ ${dpi} dpi${pro ? " (pro-max)" : " (max)"}`);
    } else if (pro) {
      log("Pro engine: editable max-quality pdf2docx");
    } else {
      log("Editable: max-quality pdf2docx");
    }
    const engine = await convertPdfToDocx(
      inputPath,
      outputPath,
      cwd,
      mode,
      dpi,
      pro,
      log
    );
    log(`PDF→DOCX mode=${mode} pro=${pro} engine=${engine}`);
    return;
  }

  const rawText = await pdfToText(inputPath, cwd);
  log(`pdftotext: ${rawText.length} chars`);

  const structuredMd = smartPdfToMarkdown(rawText, input.filename);

  if (to === "plain") {
    writeFileSync(outputPath, rawText, "utf8");
    return;
  }

  if (to === "md") {
    writeFileSync(outputPath, structuredMd, "utf8");
    return;
  }

  // Intermediate structured Markdown → target via pandoc (LaTeX, HTML, ODT, DOCX)
  const mid = path.join(cwd, "extracted.md");
  writeFileSync(mid, structuredMd, "utf8");

  if (to === "pdf") {
    // re-typeset structured document
    await convertToPdf("md", mid, outputPath, cwd, input, log);
    return;
  }

  if (!which("pandoc")) throw new Error("pandoc not found");
  const t = pandocWriter(to);
  if (!t) throw new Error(`Cannot convert PDF → ${to}`);
  const args = [mid, "-f", "markdown", "-t", t, "-o", outputPath];
  if (to === "html" || to === "tex" || to === "odt") {
    args.push("--standalone");
  }
  log(`pandoc ${args.join(" ")}`);
  const r = await runCmd("pandoc", args, { cwd, timeoutMs: 120_000 });
  log(r.stdout);
  log(r.stderr);
  if (r.code !== 0) throw new Error(r.stderr || r.stdout || `pandoc exit ${r.code}`);
}

export async function readConvertOutput(id: string): Promise<Buffer | null> {
  const job = readConvertJob(id);
  if (!job || job.status !== "done" || !job.outFile) return null;
  if (!existsSync(job.outFile)) return null;
  return fs.readFile(job.outFile);
}

export function parseFormats(from: string, to: string): { from: DocFormat; to: DocFormat } | null {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  if (!isDocFormat(f) || !isDocFormat(t)) return null;
  return { from: f, to: t };
}
