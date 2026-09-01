import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";
import {
  startConvertJob,
  readConvertJob,
  readConvertOutput,
  convertContentType,
  parseFormats,
} from "@/lib/convert-job";
import {
  FORMAT_META,
  INPUT_FORMATS,
  OUTPUT_FORMATS,
  qualityNote,
  type PdfDocxMode,
} from "@/lib/formats";
import { hostCapabilities, which, enrichedPath } from "@/lib/compile-job";
import { isPremiumPlan } from "@/lib/entitlements";
import { entitlementsFromApiKeyAsync } from "@/lib/entitlements-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ENGINES = new Set(["auto", "tectonic", "xelatex", "lualatex", "pdflatex"]);
const PAPERS = new Set(["a4", "a3", "a2", "letter", "legal", "tabloid"]);
const BACKENDS = new Set(["auto", "local", "docker"]);

const externalCompilerUrl = (
  process.env.DOC_COMPILER_API_URL ||
  process.env.OPENROAD_API_URL ||
  process.env.BACKEND_API_URL ||
  process.env.EC2_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL
)?.replace(/\/$/, "");

// Daily convert usage rate limiter
const DAILY_USAGE = new Map<string, { date: string; count: number }>();

async function checkAndIncrementUsage(
  key: string,
  limit: number
): Promise<{ allowed: boolean; count: number }> {
  if (!Number.isFinite(limit)) return { allowed: true, count: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const redisKey = `ratelimit:convert:${key}:${today}`;
      const res = await fetch(`${redisUrl}/incr/${redisKey}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      const data = await res.json();
      const count = Number(data.result || 1);
      if (count === 1) {
        await fetch(`${redisUrl}/expire/${redisKey}/86400`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        });
      }
      return { allowed: count <= limit, count };
    } catch {
      // Fallback to in-memory on error
    }
  }

  const entry = DAILY_USAGE.get(key);
  if (!entry || entry.date !== today) {
    DAILY_USAGE.set(key, { date: today, count: 1 });
    return { allowed: true, count: 1 };
  }
  if (entry.count >= limit) {
    return { allowed: false, count: entry.count };
  }
  entry.count += 1;
  return { allowed: true, count: entry.count };
}

/**
 * POST — start conversion (text and/or file)
 * GET  ?jobId=  — status
 * GET  ?jobId=&result=1 — bytes
 * GET  (no query) — capabilities + format lists
 */
export async function GET(req: NextRequest) {
  // Proxy GET convert status/result to EC2 compiler microservice if configured
  if (externalCompilerUrl && !process.env.AIC_FORCE_LOCAL) {
    try {
      const targetUrl = new URL(`${externalCompilerUrl}/api/convert`);
      req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));
      const res = await fetch(targetUrl.toString());
      if (req.nextUrl.searchParams.get("result") === "1") {
        const blob = await res.arrayBuffer();
        const cleanHeaders = new Headers();
        const contentType = res.headers.get("content-type");
        const contentDisp = res.headers.get("content-disposition");
        const xBackend = res.headers.get("x-convert-backend");
        const xEngine = res.headers.get("x-convert-engine");
        const xMs = res.headers.get("x-convert-ms");

        if (contentType) cleanHeaders.set("Content-Type", contentType);
        if (contentDisp) cleanHeaders.set("Content-Disposition", contentDisp);
        if (xBackend) cleanHeaders.set("X-Convert-Backend", xBackend);
        if (xEngine) cleanHeaders.set("X-Convert-Engine", xEngine);
        if (xMs) cleanHeaders.set("X-Convert-Ms", xMs);

        return new NextResponse(new Uint8Array(blob), {
          status: res.status,
          headers: cleanHeaders,
        });
      }
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[api/convert GET proxy error]", msg);
      // Fallback to local handler
    }
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  const wantResult = req.nextUrl.searchParams.get("result") === "1";

  if (jobId) {
    const job = readConvertJob(jobId);
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
      const buf = await readConvertOutput(jobId);
      if (!buf) {
        return NextResponse.json({ error: "Output missing" }, { status: 404 });
      }
      const headers = new Headers();
      headers.set("Content-Type", convertContentType(job.outputFormat));
      const ext = FORMAT_META[job.outputFormat].ext;
      headers.set(
        "Content-Disposition",
        `inline; filename="${job.filename}.${ext}"`
      );
      headers.set("X-Convert-From", job.inputFormat);
      headers.set("X-Convert-To", job.outputFormat);
      headers.set("X-Convert-Backend", job.backend || "");
      headers.set("X-Convert-Engine", job.engine || "");
      headers.set("X-Convert-Ms", String(job.ms ?? ""));
      return new NextResponse(new Uint8Array(buf), { status: 200, headers });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      inputFormat: job.inputFormat,
      outputFormat: job.outputFormat,
      backend: job.backend,
      engine: job.engine,
      ms: job.ms,
      error: job.error,
      details: job.details,
      filename: job.filename,
      textPreview: job.textPreview?.slice(0, 50_000),
      updatedAt: job.updatedAt,
    });
  }

  const caps = hostCapabilities();
  let pdf2docx = false;
  try {
    execFileSync("python3", ["-c", "import pdf2docx"], {
      stdio: "ignore",
      env: { ...process.env, PATH: enrichedPath() },
    });
    pdf2docx = true;
  } catch {
    pdf2docx = false;
  }

  return NextResponse.json({
    ok: true,
    inputFormats: INPUT_FORMATS.map((id) => FORMAT_META[id]),
    outputFormats: OUTPUT_FORMATS.map((id) => FORMAT_META[id]),
    capabilities: {
      ...caps,
      pdftotext: which("pdftotext"),
      pdf2docx,
    },
    tip: pdf2docx
      ? "Free: Editable PDF→DOCX. Pro: Exact look + Pro engine (API key)."
      : which("pdftotext")
        ? "Install pdf2docx for Editable PDF → Word: pip3 install --user -r requirements-convert.txt"
        : "Install poppler + pdf2docx for PDF reverse conversion.",
    plans: {
      free: { editable: true, exact: false, proEngine: false },
      pro: { editable: true, exact: true, proEngine: true },
      team: { editable: true, exact: true, proEngine: true },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Proxy POST convert request to EC2 compiler microservice if configured
    if (externalCompilerUrl && !process.env.AIC_FORCE_LOCAL) {
      try {
        const proxyFormData = new FormData();
        for (const [k, v] of formData.entries()) {
          proxyFormData.append(k, v);
        }
        const userKey = String(formData.get("apiKey") ?? formData.get("api_key") ?? "").trim();
        if (!userKey) {
          proxyFormData.set("apiKey", "ace_max_usr_cluster_internal_worker");
        }
        const proxyRes = await fetch(`${externalCompilerUrl}/api/convert`, {
          method: "POST",
          body: proxyFormData,
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

    const inputFormat = String(formData.get("inputFormat") ?? "md").toLowerCase();
    const outputFormat = String(formData.get("outputFormat") ?? "pdf").toLowerCase();
    const parsed = parseFormats(inputFormat, outputFormat);
    if (!parsed) {
      return NextResponse.json(
        { error: `Invalid formats: ${inputFormat} → ${outputFormat}` },
        { status: 400 }
      );
    }

    const engine = String(formData.get("engine") ?? "auto");
    const paper = String(formData.get("paper") ?? "a4");
    const wide = String(formData.get("wide") ?? "false") === "true";
    const landscape = String(formData.get("landscape") ?? "false") === "true";
    const toc = String(formData.get("toc") ?? "false") === "true";
    const margin = String(formData.get("margin") ?? "").trim();
    const filename = String(formData.get("filename") ?? "document");
    let backend = String(formData.get("backend") ?? "auto").toLowerCase();
    const text = formData.has("text") ? String(formData.get("text") ?? "") : undefined;
    const pdfDocxModeRaw = String(formData.get("pdfDocxMode") ?? "editable").toLowerCase();
    let pdfDocxMode: PdfDocxMode =
      pdfDocxModeRaw === "exact" ? "exact" : "editable";
    let exactDpi = Math.max(
      72,
      Math.min(400, Number(formData.get("exactDpi") ?? 300) || 300)
    );
    const apiKey = String(formData.get("apiKey") ?? formData.get("api_key") ?? "").trim();
    const entitlements = await entitlementsFromApiKeyAsync(apiKey || null);

    // --- Daily limit rate check (5 docs/day for Free, 3 for Guest) ---
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "anon";
    const limitKey = apiKey || clientIp;
    const usage = await checkAndIncrementUsage(limitKey, entitlements.maxConvertsPerDay);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: `Daily limit reached (${entitlements.maxConvertsPerDay} docs/day for ${entitlements.label} plan)`,
          details: `You have reached your daily limit of ${entitlements.maxConvertsPerDay} documents. Upgrade to Pro for 500 docs/day!`,
          code: "PLAN_LIMIT",
          upgradeUrl: "/pricing",
          feature: "daily_converts",
          tier: entitlements.tier,
        },
        { status: 402 }
      );
    }

    // Pro engine defaults ON for premium unless client explicitly sends false
    const proFlag = formData.get("useProEngine");
    const wantProEngine =
      proFlag == null || proFlag === ""
        ? entitlements.canProEngine
        : String(proFlag) === "true";

    // --- Plan gates: format allow-list ---
    if (!entitlements.docAllowedInputFormats.includes(parsed.from)) {
      return NextResponse.json(
        {
          error: `Input format “${parsed.from}” is locked on ${entitlements.label}`,
          details: `Allowed inputs: ${entitlements.docAllowedInputFormats.join(", ")}\nUpgrade for more formats.`,
          code: "PLAN_LIMIT",
          upgradeUrl: "/pricing",
          feature: "doc_input_format",
          tier: entitlements.tier,
        },
        { status: 402 }
      );
    }
    if (!entitlements.docAllowedOutputFormats.includes(parsed.to)) {
      return NextResponse.json(
        {
          error: `Output format “${parsed.to}” is locked on ${entitlements.label}`,
          details: `Allowed outputs: ${entitlements.docAllowedOutputFormats.join(", ")}\nUpgrade for DOCX/ODT/etc.`,
          code: "PLAN_LIMIT",
          upgradeUrl: "/pricing",
          feature: "doc_output_format",
          tier: entitlements.tier,
        },
        { status: 402 }
      );
    }
    if (backend === "docker" && !entitlements.canDockerBackend) {
      return NextResponse.json(
        {
          error: "Docker backend requires Pro+",
          code: "PLAN_LIMIT",
          upgradeUrl: "/pricing",
          feature: "docker_backend",
        },
        { status: 402 }
      );
    }
    if (wide && !entitlements.canWidePdf) {
      return NextResponse.json(
        {
          error: "Wide / landscape preset requires Pro+",
          code: "PLAN_LIMIT",
          upgradeUrl: "/pricing",
          feature: "wide_pdf",
        },
        { status: 402 }
      );
    }

    // --- Premium gates for PDF → DOCX ---
    if (parsed.from === "pdf" && parsed.to === "docx") {
      if (pdfDocxMode === "exact" && !entitlements.canExactPdfDocx) {
        return NextResponse.json(
          {
            error: "Exact look requires Pro+",
            details:
              "Exact look embeds each PDF page as a full-page image.\n\n" +
              "Plans: Free (editable only) → Pro (exact @ ≤300 DPI) → Max (400 DPI, unlimited).",
            code: "PLAN_LIMIT",
            upgradeUrl: "/pricing",
            feature: "exact",
            tier: entitlements.tier,
          },
          { status: 402 }
        );
      }
      if (wantProEngine && !entitlements.canProEngine) {
        return NextResponse.json(
          {
            error: "Pro engine requires Pro+",
            details:
              "Pro engine unlocks max-fidelity PDF → DOCX.\nUpgrade at /pricing and paste your API key.",
            code: "PLAN_LIMIT",
            upgradeUrl: "/pricing",
            feature: "pro_engine",
            tier: entitlements.tier,
          },
          { status: 402 }
        );
      }
      exactDpi = Math.min(exactDpi, entitlements.maxExactDpi);
      if (wantProEngine && pdfDocxMode === "exact") {
        exactDpi = Math.max(exactDpi, entitlements.defaultExactDpi);
        exactDpi = Math.min(entitlements.maxExactDpi, exactDpi);
      }
    }

    if (!ENGINES.has(engine)) {
      return NextResponse.json({ error: `Invalid engine: ${engine}` }, { status: 400 });
    }
    if (!PAPERS.has(paper)) {
      return NextResponse.json({ error: `Invalid paper: ${paper}` }, { status: 400 });
    }
    if (!BACKENDS.has(backend)) {
      return NextResponse.json({ error: `Invalid backend: ${backend}` }, { status: 400 });
    }

    let fileBuffer: Buffer | undefined;
    let originalName: string | undefined;
    const file = formData.get("file");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const blob = file as File;
      const ab = await blob.arrayBuffer();
      fileBuffer = Buffer.from(ab);
      originalName = blob.name || undefined;
    }

    const metaIn = FORMAT_META[parsed.from];
    const hasText = Boolean(text && text.trim());
    const hasFile = Boolean(fileBuffer && fileBuffer.length > 0);

    if (!hasText && !hasFile) {
      return NextResponse.json(
        {
          error: "Provide text content or upload a file",
          hint: metaIn.textEditable
            ? "Paste content in the editor or upload a file."
            : `Upload a .${metaIn.ext} file for ${metaIn.label} input.`,
        },
        { status: 400 }
      );
    }

    const useProEngine =
      wantProEngine &&
      entitlements.canProEngine &&
      parsed.from === "pdf" &&
      parsed.to === "docx";

    // If input format is text-editable and text content is provided, prefer text over binary fileBuffer
    const effectiveFileBuffer = metaIn.textEditable && hasText ? undefined : fileBuffer;

    const job = startConvertJob({
      inputFormat: parsed.from,
      outputFormat: parsed.to,
      text: hasText ? text : hasFile ? undefined : "",
      fileBuffer: effectiveFileBuffer,
      originalName,
      engine,
      backend,
      paper,
      wide,
      landscape,
      toc,
      margin,
      filename,
      pdfDocxMode,
      exactDpi,
      useProEngine,
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      inputFormat: parsed.from,
      outputFormat: parsed.to,
      pdfDocxMode:
        parsed.from === "pdf" && parsed.to === "docx" ? pdfDocxMode : undefined,
      useProEngine,
      tier: entitlements.tier,
      premium: isPremiumPlan(entitlements.tier),
      note: qualityNote(parsed.from, parsed.to, pdfDocxMode),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/convert]", message);
    return NextResponse.json({ error: "Server error", details: message }, { status: 500 });
  }
}
