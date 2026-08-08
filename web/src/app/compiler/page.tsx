"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

const DEFAULT_MD = `# Quick notes

Write markdown + math on the left.
Click **Compile** to preview the PDF on the right, then **Download** when ready.

Inline math $E=mc^2$ and display:

$$
T_{clk} \\ge t_{cq} + t_{pd} + t_{su}
$$

\`\`\`tcl
create_clock -name CLK -period $T [get_ports clk]
set_clock_uncertainty -setup [expr {0.05*$T}] [get_clocks CLK]
\`\`\`
`;

type Caps = {
  pandoc?: boolean;
  tectonic?: boolean;
  xelatex?: boolean;
  lualatex?: boolean;
  pdflatex?: boolean;
  docker?: boolean;
  dockerImage?: boolean;
};

type Health = {
  ok: boolean;
  projectRoot?: string;
  aic?: boolean;
  capabilities?: Caps;
  fastLocal?: boolean;
  dockerReady?: boolean;
  isProductionContainer?: boolean;
  sizeDockerBytes?: number;
  tip?: string;
} | null;

type PreviewMeta = {
  backend?: string;
  engine?: string;
  ms?: string;
  size?: number;
};

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [engine, setEngine] = useState("auto");
  const [backend, setBackend] = useState("auto");
  const [paper, setPaper] = useState("a4");
  const [format, setFormat] = useState("pdf");
  const [isWide, setIsWide] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [toc, setToc] = useState(false);
  const [filename, setFilename] = useState("document");
  const [livePreview, setLivePreview] = useState(false);

  const [isCompiling, setIsCompiling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("Edit markdown → Compile → preview appears here → Download when happy.");
  const [elapsed, setElapsed] = useState(0);
  const [health, setHealth] = useState<Health>(null);

  // Compiled output held in memory (no auto-download)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta | null>(null);
  const [previewStale, setPreviewStale] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compilingRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  // Avoid SSR/client attribute mismatches (disabled/style/locale)
  const [mounted, setMounted] = useState(false);

  const refreshHealth = useCallback(() => {
    fetch("/api/compile")
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth({ ok: false }));
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Mark preview stale when source or options change
  useEffect(() => {
    if (previewBlob) setPreviewStale(true);
  }, [markdown, engine, backend, paper, format, isWide, landscape, toc]);

  const sizeLabel = () => {
    // Use byteLength only — avoid Blob in render (can differ SSR/client)
    const n = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(markdown).length
      : markdown.length;
    if (n < 1024) return `${n} B`;
    return `${(n / 1024).toFixed(1)} KB`;
  };

  const hasPreview = Boolean(previewBlob);
  const downloadDisabled = !hasPreview || isCompiling;

  const setPreviewFromBlob = useCallback((blob: Blob) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setPreviewBlob(blob);
    setPreviewStale(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMarkdown(String(ev.target?.result ?? ""));
      const base = file.name.replace(/\.(md|txt|markdown)$/i, "");
      setFilename(base || "document");
    };
    reader.readAsText(file);
  };

  const compileDocument = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (compilingRef.current) return;
      compilingRef.current = true;
      setIsCompiling(true);
      setErrorMsg("");
      const usingDocker = backend === "docker";
      setStatusMsg(
        usingDocker
          ? "Starting Docker compile job…"
          : backend === "local" || (backend === "auto" && health?.fastLocal)
            ? "Starting local compile…"
            : "Starting compile…"
      );
      setElapsed(0);
      const started = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - started) / 1000));
      }, 250);

      try {
        // Preflight: docker backend needs image
        if (usingDocker && health && health.dockerReady === false) {
          throw new Error(
            "Docker image 'aic' is not ready.\n\n" +
              "From repo root run:\n  docker build -t aic .\n\n" +
              "Then hard-refresh this page and try again."
          );
        }

        const formData = new FormData();
        formData.append("markdown", markdown);
        formData.append("engine", engine);
        formData.append("backend", backend);
        formData.append("paper", paper);
        formData.append("format", format);
        formData.append("wide", String(isWide));
        formData.append("landscape", String(landscape));
        formData.append("toc", String(toc));
        formData.append("filename", filename);

        // 1) Start job (returns immediately — avoids NetworkError on long Docker runs)
        let startRes: Response;
        try {
          startRes = await fetch("/api/compile", { method: "POST", body: formData });
        } catch (netErr: unknown) {
          const msg = netErr instanceof Error ? netErr.message : String(netErr);
          throw new Error(
            `${msg}\n\nCannot reach the Next.js server. In a terminal:\n` +
              `  cd ~/Desktop/aic && npm run dev\n` +
              `Then open http://localhost:3000`
          );
        }

        const startJson = await startRes.json().catch(() => ({}));
        if (!startRes.ok) {
          throw new Error(
            [startJson.error, startJson.details, startJson.hint].filter(Boolean).join("\n\n") ||
              `HTTP ${startRes.status}`
          );
        }

        const jobId = startJson.jobId as string;
        if (!jobId) throw new Error("Server did not return jobId");

        setStatusMsg(`Job ${jobId.slice(0, 8)}… running (${usingDocker ? "docker" : "local"})`);

        // 2) Poll until done / error (short requests — browser-safe)
        const deadline = Date.now() + (usingDocker ? 320_000 : 200_000);
        let finalStatus: {
          status: string;
          backend?: string;
          engine?: string;
          ms?: number;
          error?: string;
          details?: string;
        } | null = null;

        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 800));
          let stRes: Response;
          try {
            stRes = await fetch(`/api/compile?jobId=${encodeURIComponent(jobId)}`);
          } catch {
            // brief blip — keep polling
            continue;
          }
          if (!stRes.ok) continue;
          const st = await stRes.json();
          if (st.status === "running" || st.status === "queued") {
            setStatusMsg(
              `Compiling… ${Math.round((Date.now() - started) / 1000)}s · ${st.status}` +
                (usingDocker ? " · docker" : "")
            );
            continue;
          }
          finalStatus = st;
          break;
        }

        if (!finalStatus) {
          throw new Error("Compile timed out while waiting for job. Check the npm run dev terminal.");
        }
        if (finalStatus.status === "error") {
          throw new Error(
            [finalStatus.error, finalStatus.details].filter(Boolean).join("\n\n") || "Compilation failed"
          );
        }
        if (finalStatus.status !== "done") {
          throw new Error(`Unexpected job status: ${finalStatus.status}`);
        }

        // 3) Fetch result bytes for preview
        const fileRes = await fetch(
          `/api/compile?jobId=${encodeURIComponent(jobId)}&result=1`
        );
        if (!fileRes.ok) {
          const err = await fileRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch compile result");
        }

        const blob = await fileRes.blob();
        if (blob.size < 50 && format === "pdf") {
          throw new Error("Empty/too-small PDF returned.");
        }

        const usedBackend =
          fileRes.headers.get("X-Md2pdf-Backend") || finalStatus.backend || undefined;
        const usedEngine =
          fileRes.headers.get("X-Md2pdf-Engine") || finalStatus.engine || undefined;
        const usedMs =
          fileRes.headers.get("X-Md2pdf-Ms") ||
          (finalStatus.ms != null ? String(finalStatus.ms) : undefined);

        setPreviewFromBlob(blob);
        setPreviewMeta({
          backend: usedBackend,
          engine: usedEngine,
          ms: usedMs,
          size: blob.size,
        });

        const sec = Math.round((Date.now() - started) / 1000);
        setStatusMsg(
          opts?.silent
            ? `Live preview · ${sec}s · ${usedBackend}/${usedEngine}`
            : `Preview ready · ${sec}s · ${usedBackend || "?"} / ${usedEngine || "?"} · ${(blob.size / 1024).toFixed(1)} KB — Download when ready`
        );
        refreshHealth();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMsg(message);
        if (!opts?.silent) setStatusMsg("");
      } finally {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        compilingRef.current = false;
        setIsCompiling(false);
      }
    },
    [
      markdown,
      engine,
      backend,
      paper,
      format,
      isWide,
      landscape,
      toc,
      filename,
      health?.fastLocal,
      health?.dockerReady,
      refreshHealth,
      setPreviewFromBlob,
    ]
  );

  // Live preview: debounced; disabled for docker (too heavy / slow)
  useEffect(() => {
    if (!livePreview || format !== "pdf" || backend === "docker") return;
    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => {
      if (!markdown.trim() || compilingRef.current) return;
      void compileDocument({ silent: true });
    }, 2500);
    return () => {
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    };
  }, [livePreview, markdown, format, backend, compileDocument]);

  const downloadPreview = () => {
    if (!previewBlob) return;
    const ext = format === "tex" ? "tex" : format;
    const url = URL.createObjectURL(previewBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename || "document"}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMsg(`Downloaded ${filename}.${ext}`);
  };

  const canPreviewInline = format === "pdf";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="brutal-border border-b-4 bg-[var(--accent)] text-black px-4 py-3 flex justify-between items-center gap-3 flex-wrap shrink-0">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">
          AIC · preview studio
        </h1>
        <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
          <span className="bg-black text-white px-2 py-1 uppercase">v2.3</span>
          {/* Only after mount — health is fetched client-side */}
          {mounted && health?.fastLocal && (
            <span className="px-2 py-1 uppercase brutal-border bg-white">FAST LOCAL</span>
          )}
          {mounted && health && !health.fastLocal && (
            <span className="px-2 py-1 uppercase brutal-border bg-yellow-300">NO HOST TEX</span>
          )}
          {mounted && health?.dockerReady && !health.isProductionContainer && (
            <span className="px-2 py-1 uppercase brutal-border bg-white">DOCKER OK</span>
          )}
          {mounted && health && health.dockerReady === false && !health.isProductionContainer && (
            <span className="px-2 py-1 uppercase brutal-border bg-yellow-300">NO DOCKER IMAGE</span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-b-4 border-black bg-[var(--background)] px-3 py-2 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold uppercase flex flex-col gap-1">
          Backend
          <select
            className="brutal-input text-xs py-1 min-w-[10rem]"
            value={backend}
            onChange={(e) => setBackend(e.target.value)}
          >
            <option value="auto">Auto</option>
            <option value="local">Local (fast)</option>
            <option value="docker">Docker (TeX in container)</option>
          </select>
          {backend === "docker" && health?.dockerReady === false && (
            <span className="text-[10px] font-mono normal-case text-red-600 font-normal">
              Run: docker build -t aic .
            </span>
          )}
        </label>

        <label className="text-xs font-bold uppercase flex flex-col gap-1">
          Engine
          <select
            className="brutal-input text-xs py-1 min-w-[9rem]"
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            disabled={format === "docx" ? true : false}
          >
            <option value="auto">Auto</option>
            <option value="tectonic">Tectonic</option>
            <option value="xelatex">XeLaTeX</option>
            <option value="lualatex">LuaLaTeX</option>
            <option value="pdflatex">PDFLaTeX</option>
          </select>
        </label>

        <label className="text-xs font-bold uppercase flex flex-col gap-1">
          Format
          <select
            className="brutal-input text-xs py-1"
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              setPreviewBlob(null);
              if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
              }
              setPreviewUrl(null);
            }}
          >
            <option value="pdf">PDF</option>
            <option value="tex">TEX</option>
            <option value="docx">DOCX</option>
          </select>
        </label>

        <label className="text-xs font-bold uppercase flex flex-col gap-1">
          Paper
          <select
            className="brutal-input text-xs py-1"
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
            disabled={isWide || format === "docx" ? true : false}
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="a3">A3</option>
            <option value="tabloid">Tabloid</option>
          </select>
        </label>

        <label className="text-xs font-bold uppercase flex flex-col gap-1">
          Filename
          <input
            className="brutal-input text-xs py-1 w-32"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer pb-1">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[var(--accent)]"
            checked={isWide}
            onChange={(e) => setIsWide(e.target.checked)}
            disabled={format === "docx" ? true : false}
          />
          Wide
        </label>

        <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer pb-1">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[var(--accent)]"
            checked={landscape}
            onChange={(e) => setLandscape(e.target.checked)}
            disabled={isWide || format === "docx" ? true : false}
          />
          Landscape
        </label>

        <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer pb-1">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[var(--accent)]"
            checked={toc}
            onChange={(e) => setToc(e.target.checked)}
          />
          TOC
        </label>

        <label
          className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer pb-1"
          title="Re-compile ~2.5s after you stop typing (PDF only; can be heavy)"
        >
          <input
            type="checkbox"
            className="w-4 h-4 accent-[var(--accent)]"
            checked={livePreview}
            onChange={(e) => setLivePreview(e.target.checked)}
            disabled={format !== "pdf" ? true : false}
          />
          Live preview
        </label>

        <div className="flex gap-2 ml-auto items-center pb-0.5">
          <input
            type="file"
            accept=".md,.txt,.markdown"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className="brutal-btn secondary text-xs py-2 px-3 brutal-shadow"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompiling === true}
          >
            Upload
          </button>
          <button
            type="button"
            className="brutal-btn text-xs py-2 px-4 brutal-shadow"
            onClick={() => void compileDocument()}
            disabled={isCompiling === true || markdown.trim().length === 0}
          >
            {isCompiling ? `Compiling… ${elapsed}s` : "Compile"}
          </button>
          <button
            type="button"
            className={
              hasPreview
                ? "brutal-btn text-xs py-2 px-4 brutal-shadow download-ready"
                : "brutal-btn text-xs py-2 px-4 brutal-shadow"
            }
            onClick={downloadPreview}
            disabled={downloadDisabled === true}
            title={hasPreview ? "Save the current preview" : "Compile first to enable download"}
          >
            Download
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="shrink-0 px-3 py-1.5 text-[11px] font-mono border-b-2 border-black flex flex-wrap gap-x-4 gap-y-1 items-center bg-[var(--background)]">
        <span className="opacity-70" suppressHydrationWarning>
          {sizeLabel()} · {markdown.length} chars
        </span>
        {previewStale && hasPreview ? (
          <span className="font-bold text-orange-600 uppercase">Preview outdated — recompile</span>
        ) : null}
        {statusMsg && !errorMsg ? <span>{statusMsg}</span> : null}
        {errorMsg ? (
          <span className="text-red-600 font-bold truncate max-w-full" title={errorMsg}>
            ERROR: {errorMsg.split("\n")[0]}
          </span>
        ) : null}
      </div>

      {/* Side-by-side: editor | preview */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 brutal-border border-r-0 lg:border-r-4 border-b-4 lg:border-b-0">
          <div className="bg-black text-white px-3 py-1.5 text-xs font-bold shrink-0 flex justify-between">
            <span>[MARKDOWN]</span>
            <span className="opacity-70">edit here</span>
          </div>
          <textarea
            className="flex-1 w-full p-3 font-mono text-sm resize-none outline-none bg-[var(--background)] text-[var(--foreground)] min-h-[40vh] lg:min-h-0"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            disabled={isCompiling && !livePreview ? true : false}
          />
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[var(--background)]">
          <div className="bg-black text-white px-3 py-1.5 text-xs font-bold shrink-0 flex justify-between items-center gap-2">
            <span>
              [PREVIEW
              {format === "pdf" ? ".PDF" : format === "tex" ? ".TEX" : ".DOCX"}]
              {previewMeta?.backend && (
                <span className="opacity-70 font-normal ml-2">
                  {previewMeta.backend}/{previewMeta.engine}
                  {previewMeta.ms ? ` · ${previewMeta.ms}ms` : ""}
                </span>
              )}
            </span>
            {isCompiling && <span className="animate-pulse text-[var(--accent)]">UPDATING…</span>}
          </div>

          <div className="flex-1 min-h-[40vh] lg:min-h-0 relative bg-[#1a1a1a]">
            {errorMsg && (
              <div className="absolute inset-0 z-10 overflow-auto p-4 bg-red-950/95 text-red-100 font-mono text-xs whitespace-pre-wrap">
                <p className="font-black text-sm mb-2 text-white">COMPILE ERROR</p>
                {errorMsg}
              </div>
            )}

            {!previewUrl && !isCompiling && !errorMsg && (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <div className="text-white/70 font-mono text-sm max-w-sm space-y-3">
                  <p className="text-2xl font-black text-white uppercase">No preview yet</p>
                  <p>
                    Write on the left, click <strong className="text-[var(--accent)]">Compile</strong> to
                    render here, then <strong className="text-[var(--accent2)]">Download</strong> when
                    you like the result.
                  </p>
                  {livePreview && format === "pdf" && (
                    <p className="text-xs">Live preview is on — stop typing for ~2.5s to auto-refresh.</p>
                  )}
                </div>
              </div>
            )}

            {isCompiling && !previewUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[var(--accent)] font-mono font-bold text-lg animate-pulse">
                  Compiling… {elapsed}s
                </div>
              </div>
            )}

            {previewUrl && canPreviewInline && (
              <iframe
                key={previewUrl}
                title="PDF preview"
                src={previewUrl}
                className="absolute inset-0 w-full h-full border-0 bg-white"
              />
            )}

            {previewUrl && !canPreviewInline && previewBlob && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="brutal-border bg-white text-black p-6 max-w-md text-center space-y-3">
                  <p className="font-black uppercase">
                    {format.toUpperCase()} ready ({(previewBlob.size / 1024).toFixed(1)} KB)
                  </p>
                  <p className="text-sm font-mono">
                    Inline preview is only for PDF. Use Download to save the file.
                  </p>
                  <button type="button" className="brutal-btn brutal-shadow" onClick={downloadPreview}>
                    Download .{format}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!health?.fastLocal && !health?.isProductionContainer && (
        <div className="shrink-0 px-3 py-1 text-[10px] font-mono bg-yellow-200 text-black border-t-2 border-black">
          Tip: run <code>./scripts/install-fast-deps.sh</code> then restart <code>npm run dev</code> for
          faster local compiles (badge will say FAST LOCAL).
        </div>
      )}
    </div>
  );
}
