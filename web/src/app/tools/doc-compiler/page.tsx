"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Play,
  Download,
  Upload,
  AlertCircle,
  ArrowRightLeft,
  Cpu,
  Terminal,
  Copy,
  Check,
  Crown,
  KeyRound,
  Lock,
} from "lucide-react";
import {
  DocFormat,
  FORMAT_META,
  INPUT_FORMATS,
  OUTPUT_FORMATS,
  PdfDocxMode,
  detectFormatFromName,
  qualityNote,
} from "@/lib/formats";

const DEFAULT_MD = `# Hardware Specification Notes

Write or upload a document on the left.
Choose **From** and **To** formats, then **Convert**.

Inline math $E=mc^2$:

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
  docker?: boolean;
  dockerImage?: boolean;
  pdftotext?: boolean;
  pdf2docx?: boolean;
};

type Health = {
  ok: boolean;
  capabilities?: Caps;
  tip?: string;
} | null;

type PreviewMeta = {
  backend?: string;
  engine?: string;
  ms?: string;
  size?: number;
  from?: string;
  to?: string;
};

export default function DocCompilerPage() {
  const [inputFormat, setInputFormat] = useState<DocFormat>("md");
  const [outputFormat, setOutputFormat] = useState<DocFormat>("pdf");
  const [text, setText] = useState(DEFAULT_MD);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [engine, setEngine] = useState("auto");
  const [backend, setBackend] = useState("auto");
  const [paper, setPaper] = useState("a4");
  const [isWide, setIsWide] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [toc, setToc] = useState(false);
  const [filename, setFilename] = useState("document");
  /** PDF → DOCX dual mode */
  const [pdfDocxMode, setPdfDocxMode] = useState<PdfDocxMode>("editable");
  const [exactDpi, setExactDpi] = useState(300);
  const [useProEngine, setUseProEngine] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tier, setTier] = useState<"guest" | "free" | "pro" | "max" | "team">("guest");
  const [tierEmail, setTierEmail] = useState("");
  const isPremium = tier === "pro" || tier === "max" || tier === "team";
  const isMaxOrTeam = tier === "max" || tier === "team";

  const [isCompiling, setIsCompiling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState(
    "Choose input → output formats, edit or upload, then Convert."
  );
  const [elapsed, setElapsed] = useState(0);
  const [health, setHealth] = useState<Health>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta | null>(null);
  const [previewStale, setPreviewStale] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const compilingRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const inMeta = FORMAT_META[inputFormat];
  const outMeta = FORMAT_META[outputFormat];
  const isPdfToDocx = inputFormat === "pdf" && outputFormat === "docx";
  const note = useMemo(
    () => qualityNote(inputFormat, outputFormat, isPdfToDocx ? pdfDocxMode : undefined),
    [inputFormat, outputFormat, isPdfToDocx, pdfDocxMode]
  );
  const needsPdfEngine = outputFormat === "pdf";
  const inputIsText = inMeta.textEditable;

  const refreshHealth = useCallback(() => {
    Promise.all([
      fetch("/api/compile").then((r) => r.json()).catch(() => null),
      fetch("/api/convert").then((r) => r.json()).catch(() => null),
    ]).then(([compileH, convertH]) => {
      const caps = {
        ...(compileH?.capabilities || {}),
        pdftotext: convertH?.capabilities?.pdftotext,
      };
      setHealth({
        ok: Boolean(compileH?.ok || convertH?.ok),
        capabilities: caps,
        tip: convertH?.tip || compileH?.tip,
      });
      if (compileH?.fastLocal && compileH?.capabilities?.tectonic) {
        setBackend((b) => (b === "auto" ? "local" : b));
        setEngine((e) => (e === "auto" ? "tectonic" : e));
      }
    });
  }, []);

  const activateApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      setApiKey("");
      setTier("guest");
      setTierEmail("");
      setUseProEngine(false);
      setPdfDocxMode((m) => (m === "exact" ? "editable" : m));
      return;
    }
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setApiKey("");
        setTier("guest");
        setTierEmail("");
        setErrorMsg(data.error || "Invalid API key");
        setStatusMsg("API key rejected — Free features only.");
        return;
      }
      const t = (data.tier || data.plan || "free") as "free" | "pro" | "max" | "team";
      setApiKey(trimmed);
      setTier(t);
      setTierEmail(data.email || "");
      localStorage.setItem("ace_seek_api_key", trimmed);
      localStorage.setItem("ace_api_key", trimmed);
      setErrorMsg("");
      if (t === "max" || t === "team") {
        setUseProEngine(true);
        setPdfDocxMode("exact");
        setExactDpi(400);
        setStatusMsg(
          `${t.toUpperCase()} unlocked · all features · Exact @ 400 DPI · ${data.email || ""}`
        );
      } else if (t === "pro") {
        setUseProEngine(true);
        setPdfDocxMode("exact");
        setExactDpi(300);
        setStatusMsg(`PRO unlocked · Exact @ 300 DPI · ${data.email || ""}`);
      } else {
        setUseProEngine(false);
        setPdfDocxMode((m) => (m === "exact" ? "editable" : m));
        setExactDpi(150);
        setStatusMsg(`Free plan · core features only · ${data.email || ""}`);
      }
    } catch {
      setErrorMsg("Could not validate API key");
    }
  }, [refreshHealth]);

  useEffect(() => {
    setMounted(true);
    refreshHealth();
    const saved = localStorage.getItem("ace_seek_api_key") || localStorage.getItem("ace_api_key");
    if (saved) {
      setApiKeyInput(saved);
      void activateApiKey(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewBlob(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewText(null);
    setPreviewMeta(null);
  }, []);

  const swapFormats = useCallback(() => {
    setInputFormat(outputFormat);
    setOutputFormat(inputFormat);
    clearPreview();
  }, [inputFormat, outputFormat, clearPreview]);

  const setPreviewFromBlob = useCallback((blob: Blob) => {
    setPreviewBlob(blob);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setPreviewStale(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const det = detectFormatFromName(file.name);
    if (det) setInputFormat(det);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    if (baseName) setFilename(baseName);

    if (inMeta.textEditable) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const textRes = evt.target?.result;
        if (typeof textRes === "string") setText(textRes);
      };
      reader.readAsText(file);
    }
    clearPreview();
  };

  const convertDocument = useCallback(async () => {
    if (compilingRef.current) return;
    compilingRef.current = true;
    setIsCompiling(true);
    setErrorMsg("");
    setStatusMsg(`Converting ${inMeta.label} → ${outMeta.label}…`);
    const started = Date.now();
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);

    try {
      const formData = new FormData();
      formData.append("inputFormat", inputFormat);
      formData.append("outputFormat", outputFormat);
      if (uploadFile) {
        formData.append("file", uploadFile);
      } else {
        formData.append("text", text);
      }
      formData.append("engine", engine);
      formData.append("backend", backend);
      formData.append("paper", paper);
      formData.append("isWide", String(isWide));
      formData.append("landscape", String(landscape));
      formData.append("toc", String(toc));
      formData.append("filename", filename);
      formData.append("pdfDocxMode", pdfDocxMode);
      formData.append("exactDpi", String(exactDpi));
      formData.append("useProEngine", String(useProEngine));
      if (apiKey) formData.append("apiKey", apiKey);

      const initRes = await fetch("/api/convert", { method: "POST", body: formData });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "Failed to start conversion");

      const jobId = initData.jobId;
      let finalStatus = null;
      while (Date.now() - started < 120000) {
        await new Promise((r) => setTimeout(r, 800));
        const stRes = await fetch(`/api/convert?jobId=${encodeURIComponent(jobId)}`).catch(() => null);
        if (!stRes || !stRes.ok) continue;
        const st = await stRes.json();
        if (st.status === "running" || st.status === "queued") continue;
        finalStatus = st;
        break;
      }
      if (!finalStatus) throw new Error("Conversion timed out.");
      if (finalStatus.status === "error") throw new Error(finalStatus.error || "Conversion failed");

      const fileRes = await fetch(`/api/convert?jobId=${encodeURIComponent(jobId)}&result=1`);
      if (!fileRes.ok) throw new Error("Failed to fetch result");
      const blob = await fileRes.blob();
      setPreviewFromBlob(blob);
      if (finalStatus.textPreview) {
        setPreviewText(finalStatus.textPreview);
      } else if (["md", "tex", "plain", "html"].includes(outputFormat)) {
        setPreviewText(await blob.text());
      } else {
        setPreviewText(null);
      }
      setPreviewMeta({
        backend: fileRes.headers.get("X-Convert-Backend") || finalStatus.backend,
        engine: fileRes.headers.get("X-Convert-Engine") || finalStatus.engine,
        ms: fileRes.headers.get("X-Convert-Ms") || String(finalStatus.ms),
        size: blob.size,
        from: inputFormat,
        to: outputFormat,
      });
      setStatusMsg(`Ready · ${inMeta.label} → ${outMeta.label} · ${(blob.size / 1024).toFixed(1)} KB`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatusMsg("");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      compilingRef.current = false;
      setIsCompiling(false);
    }
  }, [inputFormat, outputFormat, text, uploadFile, engine, backend, paper, isWide, landscape, toc, filename, pdfDocxMode, exactDpi, useProEngine, apiKey, inMeta.label, outMeta.label, setPreviewFromBlob]);

  const copyOutput = useCallback(async () => {
    try {
      let body = previewText;
      if (!body && previewBlob) body = await previewBlob.text();
      if (!body) return;
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: unknown) {
      setErrorMsg(`Copy failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [previewText, previewBlob]);

  const downloadPreview = useCallback(() => {
    if (!previewBlob) return;
    const url = URL.createObjectURL(previewBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename || "document"}.${outMeta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [previewBlob, filename, outMeta.ext]);

  const hasPreview = Boolean(previewBlob);
  const canPreviewPdf = outputFormat === "pdf" && Boolean(previewUrl);
  const canPreviewText = Boolean(previewText) && ["md", "tex", "plain", "html"].includes(outputFormat);
  const canCopy = Boolean(previewText?.length) || (Boolean(previewBlob) && ["md", "tex", "plain", "html"].includes(outputFormat));

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] w-full bg-slate-100 font-mono text-slate-900">
        {/* Header */}
        <header className="shrink-0 border-b-3 border-black bg-white px-4 py-3 sm:px-6 shadow-[0_3px_0_#000000]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold text-slate-900">Doc Compiler</h1>
                <p className="text-[11px] text-slate-400 truncate">
                  PDF · Markdown · TeX · DOCX · HTML · ODT
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {mounted && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${isPremium
                      ? "bg-amber-50 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {isPremium ? (
                    <>
                      <Crown className="h-3 w-3" />
                      {tier.toUpperCase()}
                    </>
                  ) : (
                    "Free"
                  )}
                </span>
              )}
              {mounted && health?.tip && (
                <span className="hidden max-w-xs truncate text-[11px] text-slate-400 md:inline" title={health.tip}>
                  {health.tip}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* API key */}
        <div className="shrink-0 border-b-3 border-black bg-[var(--brutal-yellow)] px-4 py-2 sm:px-6 text-black font-black">
          <div className="flex flex-wrap items-center gap-2">
            <KeyRound className="h-4 w-4 shrink-0 text-black" />
            <span className="text-[11px] font-black uppercase text-black">API Key</span>
            <input
              type="password"
              className="w-44 rounded-md border-2 border-black bg-white px-2.5 py-1.5 font-mono text-[11px] text-black outline-none font-bold shadow-[2px_2px_0_#000000] focus:ring-2 focus:ring-black sm:w-56"
              placeholder="From dashboard"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void activateApiKey(apiKeyInput);
              }}
            />
            <button
              type="button"
              className="brutal-btn brutal-btn-yellow !text-[11px] !py-1.5 !px-3 font-black"
              onClick={() => void activateApiKey(apiKeyInput)}
            >
              Activate
            </button>
            {tierEmail && (
              <span className="truncate text-[11px] font-bold text-black">{tierEmail}</span>
            )}
            {!isPremium && (
              <a
                href="/pricing"
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-black uppercase text-black hover:underline"
              >
                <Crown className="h-3.5 w-3.5" />
                Upgrade for Pro
              </a>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="shrink-0 border-b-3 border-black bg-white px-4 py-3 sm:px-6 shadow-[0_3px_0_#000000]">
          <div className="flex flex-wrap items-end gap-3 font-black">
            <label className="flex flex-col gap-1 text-[11px] uppercase text-slate-900 font-black">
              From
              <select
                className="min-w-[9rem] rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-black text-slate-900 outline-none shadow-[2px_2px_0_#000000]"
                value={inputFormat}
                onChange={(e) => {
                  setInputFormat(e.target.value as DocFormat);
                  clearPreview();
                }}
              >
                {INPUT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_META[f].label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="mb-0.5 rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              title="Swap formats"
              onClick={swapFormats}
              disabled={isCompiling}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
              To
              <select
                className="min-w-[9rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                value={outputFormat}
                onChange={(e) => {
                  setOutputFormat(e.target.value as DocFormat);
                  clearPreview();
                }}
              >
                {OUTPUT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_META[f].label}
                  </option>
                ))}
              </select>
            </label>

            {isPdfToDocx && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-600">PDF → DOCX</span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${pdfDocxMode === "editable"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                      }`}
                    onClick={() => {
                      setPdfDocxMode("editable");
                      clearPreview();
                    }}
                  >
                    Editable
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${pdfDocxMode === "exact"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                      } ${!isPremium ? "opacity-60" : ""}`}
                    onClick={() => {
                      if (!isPremium) {
                        setStatusMsg("Exact look is Pro — activate a Pro API key or upgrade.");
                        setErrorMsg("");
                        return;
                      }
                      setPdfDocxMode("exact");
                      clearPreview();
                    }}
                  >
                    {!isPremium && <Lock className="h-3 w-3" />}
                    Exact
                    <span className="text-[9px] text-amber-600">PRO</span>
                  </button>
                </div>
              </div>
            )}

            {isPdfToDocx && isPremium && (
              <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600 select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-sky-600"
                  checked={useProEngine}
                  onChange={(e) => setUseProEngine(e.target.checked)}
                />
                <Crown className="h-3 w-3 text-amber-500" />
                Pro engine
              </label>
            )}

            {isPdfToDocx && pdfDocxMode === "exact" && isPremium && (
              <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                DPI
                <select
                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                  value={exactDpi}
                  onChange={(e) => setExactDpi(Number(e.target.value))}
                >
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                  <option value={400}>400</option>
                </select>
              </label>
            )}

            {needsPdfEngine && (
              <>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                  Backend
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                    value={backend}
                    onChange={(e) => setBackend(e.target.value)}
                  >
                    <option value="auto">Auto</option>
                    <option value="local">Local</option>
                    <option value="docker">Docker</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                  Engine
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                  >
                    <option value="auto">Auto</option>
                    <option value="tectonic">Tectonic</option>
                    <option value="xelatex">XeLaTeX</option>
                    <option value="lualatex">LuaLaTeX</option>
                    <option value="pdflatex">PDFLaTeX</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                  Paper
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                    value={paper}
                    onChange={(e) => setPaper(e.target.value)}
                    disabled={isWide}
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="a3">A3</option>
                  </select>
                </label>
                <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600 select-none">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-sky-600"
                    checked={isWide}
                    onChange={(e) => setIsWide(e.target.checked)}
                  />
                  Wide
                </label>
                <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600 select-none">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-sky-600"
                    checked={toc}
                    onChange={(e) => setToc(e.target.checked)}
                  />
                  TOC
                </label>
              </>
            )}

            <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
              Filename
              <input
                className="w-28 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </label>

            <div className="ml-auto flex flex-wrap items-center gap-2 pb-0.5">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept={inMeta.accept}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="brutal-btn !text-xs !py-1.5 !px-3 font-black"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompiling}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                type="button"
                className="brutal-btn brutal-btn-yellow !text-xs !py-1.5 !px-4 font-black shadow-[3px_3px_0_#000000]"
                onClick={() => void convertDocument()}
                disabled={isCompiling}
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                {isCompiling
                  ? `Converting… ${elapsed}s`
                  : `Convert · ${inMeta.ext.toUpperCase()} → ${outMeta.ext.toUpperCase()}`}
              </button>
              <button
                type="button"
                className="brutal-btn brutal-btn-lime !text-xs !py-1.5 !px-3 font-black"
                onClick={() => void copyOutput()}
                disabled={!canCopy || isCompiling}
                title={
                  canCopy
                    ? "Copy output text"
                    : "Copy works for text outputs (MD, TeX, HTML, plain)"
                }
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                className="brutal-btn brutal-btn-cyan !text-xs !py-1.5 !px-3 font-black"
                onClick={downloadPreview}
                disabled={!hasPreview || isCompiling}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="shrink-0 border-b-3 border-black bg-slate-200 px-4 py-2 text-[11px] font-mono font-black text-slate-900 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-black text-slate-900">
              {inMeta.label} → {outMeta.label}
            </span>
            {uploadFile && <span>· {uploadFile.name}</span>}
            {note && <span className="text-slate-600 font-bold">· {note}</span>}
            {previewStale && hasPreview && (
              <span className="brutal-badge brutal-badge-pink">
                ● OUTDATED
              </span>
            )}
            {statusMsg && !errorMsg ? <span className="text-slate-900 font-bold">· {statusMsg}</span> : null}
            {errorMsg && (
              <span className="truncate text-rose-600 font-black" title={errorMsg}>
                · ERR: {errorMsg.split("\n")[0]}
              </span>
            )}
          </div>
        </div>

        {/* Split panes */}
        <div className="grid min-h-[550px] flex-1 gap-0 lg:grid-cols-2 font-mono">
          {/* Input */}
          <section className="flex min-h-[500px] flex-col border-b-3 border-black bg-white lg:border-b-0 lg:border-r-3">
            <div className="flex shrink-0 items-center justify-between border-b-3 border-black bg-[var(--brutal-cyan)] px-4 py-2 text-black font-black">
              <div className="flex items-center gap-1.5 text-xs font-black text-black">
                <Terminal className="h-3.5 w-3.5 text-black" />
                INPUT · {inMeta.label}
              </div>
              <span className="brutal-badge brutal-badge-lime text-[10px]">
                .{inMeta.ext}
              </span>
            </div>

            {inputIsText ? (
              <div className="relative min-h-[450px] flex-1 bg-white">
                <textarea
                  className="absolute inset-0 h-full w-full resize-none border-0 bg-white p-4 font-mono text-xs leading-relaxed text-slate-900 outline-none font-bold placeholder:text-slate-400 overflow-auto"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  spellCheck={false}
                  disabled={isCompiling}
                  placeholder={`Paste ${inMeta.label} here or use Upload…`}
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-8">
                <div className="max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    {inMeta.label} file required
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Upload a <span className="font-medium text-slate-700">.{inMeta.ext}</span> file,
                    pick an output format, then Convert.
                  </p>
                  {uploadFile ? (
                    <p className="text-xs font-medium text-emerald-700">
                      ✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Choose .{inMeta.ext} file
                    </button>
                  )}
                  {inputFormat === "pdf" && mounted && !health?.capabilities?.pdftotext && (
                    <p className="text-[10px] text-rose-600">
                      Install poppler for PDF reverse: brew install poppler
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Output */}
          <section className="flex min-h-[500px] flex-col bg-white">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b-3 border-black bg-[var(--brutal-lime)] px-4 py-2 text-black font-black">
              <div className="flex min-w-0 items-center gap-1.5 text-xs font-black text-black">
                <Cpu className="h-3.5 w-3.5 shrink-0 text-black" />
                <span className="truncate">
                  OUTPUT · {outMeta.label}
                  {previewMeta?.engine && (
                    <span className="ml-2 font-bold opacity-80">
                      {previewMeta.backend}/{previewMeta.engine}
                      {previewMeta.ms ? ` · ${previewMeta.ms}ms` : ""}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isCompiling && (
                  <span className="animate-pulse text-[11px] font-black text-black">
                    WORKING…
                  </span>
                )}
                {canCopy && !isCompiling && (
                  <button
                    type="button"
                    className="brutal-btn brutal-btn-yellow !text-[10px] !py-1 !px-2 font-black"
                    onClick={() => void copyOutput()}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative min-h-[450px] flex-1 overflow-hidden bg-slate-50">
              {errorMsg && (
                <div className="absolute inset-0 z-10 overflow-auto bg-rose-50 p-6 font-mono text-xs text-rose-800 whitespace-pre-wrap">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-900">
                    <AlertCircle className="h-4 w-4" />
                    Conversion error
                  </p>
                  {errorMsg}
                </div>
              )}

              {!previewUrl && !previewText && !isCompiling && !errorMsg && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <div className="max-w-xs space-y-2">
                    <p className="text-sm font-semibold text-slate-800">No output yet</p>
                    <p className="text-xs leading-relaxed text-slate-500">
                      Choose <strong className="text-slate-700">From</strong> and{" "}
                      <strong className="text-slate-700">To</strong>, provide input, then Convert.
                    </p>
                  </div>
                </div>
              )}

              {isCompiling && !previewUrl && !previewText && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-medium text-slate-600 shadow-sm">
                    Converting… {elapsed}s
                  </div>
                </div>
              )}

              {canPreviewPdf && (
                <iframe
                  key={previewUrl!}
                  title="PDF preview"
                  src={previewUrl!}
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                />
              )}

              {canPreviewText && !canPreviewPdf && (
                <div className="absolute inset-0 flex min-h-0 flex-col">
                  <div className="flex shrink-0 justify-end border-b border-slate-100 bg-white/90 px-3 py-1.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800"
                      onClick={() => void copyOutput()}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy all"}
                    </button>
                  </div>
                  <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {previewText}
                  </pre>
                </div>
              )}

              {hasPreview && !canPreviewPdf && !canPreviewText && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      {outMeta.label} ready
                      {isPdfToDocx
                        ? ` · ${pdfDocxMode === "exact" ? "Exact look" : "Editable"}`
                        : ""}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-500">
                      {(previewBlob!.size / 1024).toFixed(1)} KB — use Download.
                      {isPdfToDocx && pdfDocxMode === "exact"
                        ? " Pages are images (looks like the PDF; text not editable)."
                        : isPdfToDocx
                          ? " Text/tables are editable; layout may differ slightly."
                          : canCopy
                            ? " Text copy is also available."
                            : ""}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {canCopy && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => void copyOutput()}
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        onClick={downloadPreview}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download .{outMeta.ext}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }
