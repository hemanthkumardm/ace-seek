"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  Play,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Settings,
  Layers,
  Terminal,
  Clock,
  Sparkles,
} from "lucide-react";

const DEFAULT_MD = `# Hardware Specification Notes

Write markdown + math on the left.
Click **Compile** to preview the PDF on the right, then **Download** when ready.

Inline math $E=mc^2$ and clock period formulation:

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

export default function MdToPdfPage() {
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
  const [statusMsg, setStatusMsg] = useState(
    "Edit markdown → Compile → preview → Download."
  );
  const [elapsed, setElapsed] = useState(0);
  const [health, setHealth] = useState<Health>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta | null>(null);
  const [previewStale, setPreviewStale] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [activeApiKey, setActiveApiKey] = useState("");
  const [isProActive, setIsProActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compilingRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const refreshHealth = useCallback(() => {
    fetch("/api/compile")
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth({ ok: false }));
  }, []);

  const validateKeyOnline = useCallback(async (keyToTest: string) => {
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setIsProActive(true);
        setStatusMsg(`API Key Authorized: ${data.tier.toUpperCase()} Plan (${data.email})`);
        return true;
      } else {
        setIsProActive(false);
        setErrorMsg(data.error || "Invalid API key");
        return false;
      }
    } catch {
      setIsProActive(false);
      return false;
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshHealth();
    const savedKey = localStorage.getItem("ace_api_key");
    if (savedKey) {
      setActiveApiKey(savedKey);
      setApiKeyInput(savedKey);
      void validateKeyOnline(savedKey);
    }
  }, [refreshHealth, validateKeyOnline]);

  const handleActivateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;

    setStatusMsg("Validating API License Key...");
    const isValid = await validateKeyOnline(trimmed);
    if (isValid) {
      localStorage.setItem("ace_api_key", trimmed);
      setActiveApiKey(trimmed);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (previewBlob) setPreviewStale(true);
  }, [markdown, engine, backend, paper, format, isWide, landscape, toc]);

  const sizeLabel = () => {
    const n =
      typeof TextEncoder !== "undefined"
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
      setStatusMsg(usingDocker ? "Starting Docker compile…" : "Starting compile…");
      setElapsed(0);
      const started = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - started) / 1000));
      }, 250);

      try {
        if (usingDocker && health && health.dockerReady === false) {
          throw new Error(
            "Docker image 'aic' is not ready.\n\nFrom repo root:\n  docker build -t aic .\n\nThen refresh and try again."
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

        let startRes: Response;
        try {
          startRes = await fetch("/api/compile", { method: "POST", body: formData });
        } catch (netErr: unknown) {
          const msg = netErr instanceof Error ? netErr.message : String(netErr);
          throw new Error(
            `${msg}\n\nCannot reach the server. Run:\n  npm run dev\nThen open the tools URL again.`
          );
        }

        const startJson = await startRes.json().catch(() => ({}));
        if (!startRes.ok) {
          throw new Error(
            [startJson.error, startJson.details, startJson.hint]
              .filter(Boolean)
              .join("\n\n") || `HTTP ${startRes.status}`
          );
        }

        const jobId = startJson.jobId as string;
        if (!jobId) throw new Error("Server did not return jobId");

        setStatusMsg(`Job ${jobId.slice(0, 8)}… running`);

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
            continue;
          }
          if (!stRes.ok) continue;
          const st = await stRes.json();
          if (st.status === "running" || st.status === "queued") {
            setStatusMsg(
              `Compiling… ${Math.round((Date.now() - started) / 1000)}s · ${st.status}`
            );
            continue;
          }
          finalStatus = st;
          break;
        }

        if (!finalStatus) {
          throw new Error("Compile timed out while waiting for job.");
        }
        if (finalStatus.status === "error") {
          throw new Error(
            [finalStatus.error, finalStatus.details].filter(Boolean).join("\n\n") ||
              "Compilation failed"
          );
        }
        if (finalStatus.status !== "done") {
          throw new Error(`Unexpected job status: ${finalStatus.status}`);
        }

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
            : `Preview ready · ${sec}s · ${usedBackend || "?"} / ${usedEngine || "?"} · ${(blob.size / 1024).toFixed(1)} KB`
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
      health?.dockerReady,
      refreshHealth,
      setPreviewFromBlob,
    ]
  );

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
    <div className="flex-1 flex flex-col min-h-0 h-[calc(100dvh-4rem)] bg-[var(--surface-panel)] font-mono">
      {/* Neo-Brutalist Instrument Header Bar */}
      <div className="shrink-0 border-b-3 border-black px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-panel)] shadow-[0_4px_0_#000000]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-[var(--brutal-yellow)] border-2 border-black flex items-center justify-center text-black">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">
              Markdown → PDF Compiler Workstation
            </h1>
            <p className="text-[10px] font-black text-[var(--brutal-yellow)]">
              DOC.ACE-SEEK.COM · ENGINE V2.3
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* API Key Authorization Input Form */}
          <form onSubmit={handleActivateApiKey} className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-black text-white">API Key:</span>
            <input
              type="password"
              placeholder="Paste Key from ace-seek.com"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="brutal-input text-[11px] !py-1 !px-2 w-48 font-mono"
            />
            <button type="submit" className="brutal-btn brutal-btn-yellow !py-1 !px-2 text-[10px] font-black">
              <span>{isProActive ? "Active" : "Activate"}</span>
            </button>
          </form>

          {isProActive ? (
            <span className="brutal-badge brutal-badge-lime" title="Pro License Active">
              ● PRO LICENSE
            </span>
          ) : (
            <span className="brutal-badge brutal-badge-cyan" title="Free Mode - Paste API key from ace-seek.com">
              ● FREE MODE
            </span>
          )}
        </div>
      </div>

      {/* Neo-Brutalist Control Console Toolbar */}
      <div className="shrink-0 border-b-3 border-black px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-panel)] shadow-[0_4px_0_#000000]">
        <div className="flex flex-wrap items-center gap-3 text-xs font-black">
          <label className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white">Backend:</span>
            <select
              className="brutal-input text-xs !py-1 !px-2"
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
            >
              <option value="auto">Auto</option>
              <option value="local">Local</option>
              <option value="docker">Docker</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white">Engine:</span>
            <select
              className="brutal-input text-xs !py-1 !px-2"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              disabled={format === "docx"}
            >
              <option value="auto">Auto</option>
              <option value="tectonic">Tectonic</option>
              <option value="xelatex">XeLaTeX</option>
              <option value="lualatex">LuaLaTeX</option>
              <option value="pdflatex">PDFLaTeX</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white">Format:</span>
            <select
              className="brutal-input text-xs !py-1 !px-2"
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

          <label className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white">File:</span>
            <input
              className="brutal-input w-28 text-xs !py-1 !px-2"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            accept=".md,.txt,.markdown"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className="brutal-btn !text-xs !py-1.5 !px-3 font-black"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompiling}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            type="button"
            className="brutal-btn brutal-btn-yellow !text-xs !py-1.5 !px-4 font-black"
            onClick={() => void compileDocument()}
            disabled={isCompiling || markdown.trim().length === 0}
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>{isCompiling ? `Compiling (${elapsed}s)` : "Compile"}</span>
          </button>

          <button
            type="button"
            className="brutal-btn brutal-btn-cyan !text-xs !py-1.5 !px-3 font-black"
            onClick={downloadPreview}
            disabled={downloadDisabled}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Neo-Brutalist Status Bar */}
      <div className="shrink-0 px-4 py-2 text-[11px] font-mono font-black text-[var(--brutal-yellow)] border-b-3 border-black bg-[var(--surface-recessed)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span suppressHydrationWarning>{sizeLabel()} · {markdown.length} chars</span>
          {previewStale && hasPreview ? (
            <span className="brutal-badge brutal-badge-pink">
              ● OUTDATED PREVIEW
            </span>
          ) : null}
          {statusMsg && !errorMsg ? <span>{statusMsg}</span> : null}
        </div>

        {errorMsg ? (
          <span className="text-rose-400 font-black truncate max-w-md" title={errorMsg}>
            ERR: {errorMsg.split("\n")[0]}
          </span>
        ) : null}
      </div>

      {/* Main Split Console: Editor & Preview */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden font-mono">
        {/* Left Side: Markdown Source Editor */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 border-b-3 lg:border-b-0 lg:border-r-3 border-black">
          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white border-b-3 border-black bg-[var(--surface-panel)] flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[var(--brutal-yellow)]" />
              <span>MARKDOWN SOURCE EDITOR</span>
            </span>
            <span className="brutal-badge brutal-badge-lime text-[9px]">TEX / MATH READY</span>
          </div>

          <textarea
            className="flex-1 w-full p-4 font-mono text-xs leading-relaxed resize-none outline-none bg-black text-[var(--brutal-lime)] min-h-[40vh] lg:min-h-0 font-semibold"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            disabled={isCompiling && !livePreview}
          />
        </div>

        {/* Right Side: PDF Preview Screen */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[var(--surface-panel)]">
          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white border-b-3 border-black bg-[var(--surface-panel)] flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[var(--brutal-cyan)]" />
              <span>DOCUMENT OUTPUT PREVIEW ({format.toUpperCase()})</span>
            </span>
            {isCompiling && (
              <span className="text-[var(--brutal-yellow)] animate-pulse font-black">
                RENDERING...
              </span>
            )}
          </div>

          <div className="flex-1 min-h-[40vh] lg:min-h-0 relative bg-black">
            {errorMsg && (
              <div className="absolute inset-0 z-10 overflow-auto p-6 bg-rose-950 text-rose-200 font-mono text-xs whitespace-pre-wrap border-3 border-black font-bold">
                <p className="font-black text-sm mb-3 text-white flex items-center gap-2 uppercase">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Compilation Error Detected</span>
                </p>
                {errorMsg}
              </div>
            )}

            {!previewUrl && !isCompiling && !errorMsg && (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <div className="brutal-panel p-8 max-w-xs space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[6px_6px_0_#000000]">
                  <div className="w-10 h-10 rounded-md bg-[var(--brutal-yellow)] border-2 border-black flex items-center justify-center text-black mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-black text-white uppercase">No Preview Loaded</p>
                  <p className="text-xs text-slate-300 font-bold leading-relaxed">
                    Enter Markdown markup on the left panel and hit Compile to build the document preview.
                  </p>
                </div>
              </div>
            )}

            {isCompiling && !previewUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="brutal-lcd p-6 text-center space-y-2 font-black">
                  <div className="font-mono text-xs animate-pulse">
                    COMPILING PDF DOCUMENT... {elapsed}s
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
