import { NextRequest, NextResponse } from "next/server";
import {
  startCompileJob,
  readJob,
  readJobOutput,
  hostCapabilities,
  projectRoot,
  contentTypeFor,
  which,
} from "@/lib/compile-job";
import { existsSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ENGINES = new Set(["auto", "tectonic", "xelatex", "lualatex", "pdflatex"]);
const PAPERS = new Set(["a4", "a3", "a2", "letter", "legal", "tabloid"]);
const FORMATS = new Set(["pdf", "tex", "docx"]);
const BACKENDS = new Set(["auto", "local", "docker"]);

const SIZE_DOCKER_DEFAULT = 50_000;

/**
 * Check if running in Vercel Serverless environment where Docker is unavailable
 */
const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
const externalCompilerUrl = process.env.DOC_COMPILER_API_URL?.replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  const wantResult = req.nextUrl.searchParams.get("result") === "1";

  // Proxy GET job status/result if external compiler URL is configured
  if (externalCompilerUrl) {
    try {
      const targetUrl = new URL(`${externalCompilerUrl}/api/compile`);
      req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));
      const res = await fetch(targetUrl.toString(), {
        headers: { "Content-Type": "application/json" },
      });
      if (wantResult) {
        const blob = await res.arrayBuffer();
        const headers = new Headers(res.headers);
        return new NextResponse(new Uint8Array(blob), { status: res.status, headers });
      }
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      // Fallback to local handler if proxy fetch fails
    }
  }

  if (jobId) {
    const job = readJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (wantResult) {
      if (job.status !== "done") {
        return NextResponse.json(
          { error: "Job not ready", status: job.status },
          { status: 409 }
        );
      }
      const buf = await readJobOutput(jobId);
      if (!buf) {
        return NextResponse.json({ error: "Output missing" }, { status: 404 });
      }
      const headers = new Headers();
      headers.set("Content-Type", contentTypeFor(job.format));
      headers.set(
        "Content-Disposition",
        `inline; filename="${job.filename}.${job.format}"`
      );
      headers.set("X-Md2pdf-Backend", job.backend || "");
      headers.set("X-Md2pdf-Engine", job.engine || "");
      headers.set("X-Md2pdf-Ms", String(job.ms ?? ""));
      headers.set("X-Md2pdf-Job", jobId);
      return new NextResponse(new Uint8Array(buf), { status: 200, headers });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      backend: job.backend,
      engine: job.engine,
      ms: job.ms,
      error: job.error,
      details: job.details,
      format: job.format,
      filename: job.filename,
      updatedAt: job.updatedAt,
    });
  }

  const root = projectRoot();
  const aic = path.join(root, "bin/aic");
  const caps = hostCapabilities();
  const fastLocal =
    caps.pandoc && (caps.tectonic || caps.xelatex || caps.lualatex || caps.pdflatex);

  return NextResponse.json({
    ok: true,
    isVercel,
    hasExternalCompiler: Boolean(externalCompilerUrl),
    externalCompilerUrl: externalCompilerUrl || null,
    projectRoot: root,
    aic: existsSync(aic),
    capabilities: caps,
    fastLocal,
    dockerReady: Boolean(caps.docker && caps.dockerImage),
    isProductionContainer: process.env.AIC_FORCE_LOCAL === "1",
    sizeDockerBytes: Number(process.env.AIC_SIZE_DOCKER || SIZE_DOCKER_DEFAULT),
    tip: externalCompilerUrl
      ? `Using external microservice compiler at ${externalCompilerUrl}`
      : isVercel
        ? "Vercel Serverless environment detected. Docker is unavailable in serverless lambdas. Set DOC_COMPILER_API_URL to an external node or use browser PDF rendering."
        : !caps.docker
          ? "Docker CLI not found on PATH."
          : !caps.dockerImage
            ? "Docker image 'aic' missing. Run: docker build -t aic ."
            : fastLocal
              ? "Host engine ready — small files use local; large/docker backend use image aic."
              : "Install tectonic: ./scripts/install-fast-deps.sh — or use Docker backend.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // If an external compiler node URL is configured in Vercel env, proxy the request directly!
    if (externalCompilerUrl) {
      try {
        const proxyRes = await fetch(`${externalCompilerUrl}/api/compile`, {
          method: "POST",
          body: formData,
        });
        const proxyData = await proxyRes.json();
        return NextResponse.json(proxyData, { status: proxyRes.status });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          {
            error: "External compiler proxy error",
            details: `Failed to reach DOC_COMPILER_API_URL (${externalCompilerUrl}): ${msg}`,
          },
          { status: 502 }
        );
      }
    }

    const markdown = String(formData.get("markdown") ?? "");
    const engine = String(formData.get("engine") ?? "auto");
    const paper = String(formData.get("paper") ?? "a4");
    const format = String(formData.get("format") ?? "pdf").toLowerCase();
    const wide = String(formData.get("wide") ?? "false") === "true";
    const landscape = String(formData.get("landscape") ?? "false") === "true";
    const toc = String(formData.get("toc") ?? "true") !== "false";
    const margin = String(formData.get("margin") ?? "").trim();
    const filename = String(formData.get("filename") ?? "document");
    let backend = String(formData.get("backend") ?? "auto").toLowerCase();

    if (formData.has("docker") && !formData.has("backend")) {
      const d = String(formData.get("docker"));
      if (d === "true") backend = "docker";
      else if (d === "false") backend = "local";
    }

    if (!markdown.trim()) {
      return NextResponse.json({ error: "Markdown content is required" }, { status: 400 });
    }
    if (!ENGINES.has(engine)) {
      return NextResponse.json({ error: `Invalid engine: ${engine}` }, { status: 400 });
    }
    if (!PAPERS.has(paper)) {
      return NextResponse.json({ error: `Invalid paper: ${paper}` }, { status: 400 });
    }
    if (!FORMATS.has(format)) {
      return NextResponse.json({ error: `Invalid format: ${format}` }, { status: 400 });
    }
    if (!BACKENDS.has(backend)) {
      return NextResponse.json({ error: `Invalid backend: ${backend}` }, { status: 400 });
    }

    const caps = hostCapabilities();

    // Check Vercel serverless environment limitation
    if (isVercel && !caps.docker && !caps.pandoc && !caps.tectonic) {
      return NextResponse.json(
        {
          error: "Docker & TeX binaries unavailable in Vercel Serverless environment",
          isVercel: true,
          details:
            "Vercel serverless lambdas run in read-only containers without a Docker daemon.\n\n" +
            "To resolve this, set DOC_COMPILER_API_URL in your Vercel Environment Variables pointing to your hosted compiler microservice (e.g. AWS EC2, Fly.io, or DigitalOcean Docker node).",
          hint: "Set DOC_COMPILER_API_URL=https://your-compiler-node.com in Vercel settings.",
        },
        { status: 503 }
      );
    }

    if (backend === "docker") {
      if (!caps.docker) {
        return NextResponse.json(
          {
            error: "Docker not available",
            details: "docker CLI not found. Install Docker or use Backend=Local / Auto.",
          },
          { status: 400 }
        );
      }
      if (!caps.dockerImage) {
        return NextResponse.json(
          {
            error: "Docker image 'aic' not found",
            details:
              "Build it once from the repo root:\n\n  cd ~/Desktop/aic\n  docker build -t aic .\n\nThen retry Compile with Backend=Docker.",
          },
          { status: 400 }
        );
      }
    }

    const root = projectRoot();
    if (!existsSync(path.join(root, "bin/aic"))) {
      return NextResponse.json(
        { error: "aic binary not found", details: root },
        { status: 500 }
      );
    }

    const job = startCompileJob({
      markdown,
      engine,
      backend,
      paper,
      format,
      wide,
      landscape,
      toc,
      margin,
      filename,
    });

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        message: "Compile started. Poll GET /api/compile?jobId=…",
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[compile] POST error:", message);
    return NextResponse.json(
      {
        error: "Failed to start compile",
        details: message,
        hint: which("docker")
          ? undefined
          : "Docker not on PATH for the Next.js process.",
      },
      { status: 500 }
    );
  }
}
