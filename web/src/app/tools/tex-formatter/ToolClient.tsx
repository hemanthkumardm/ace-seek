"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Sparkles,
  Copy,
  Check,
  Wand2,
  Download,
  Eraser,
  AlertCircle,
} from "lucide-react";
import {
  MATH_TEMPLATES,
  MathWrapMode,
  SYMBOL_CHIPS,
  WRAP_MODES,
  normalizeTex,
  templateCategories,
  wrapTex,
} from "@/lib/tex-math";
import { useEntitlements } from "@/hooks/useEntitlements";
import { FeatureLock, PlanPill } from "@/components/FeatureLock";

/** Free plan may use these categories; STA needs Pro; full library is Pro+ */
const FREE_TEMPLATE_CATEGORIES = new Set(["Algebra", "Series", "Stats"]);

export default function TexFormatterPage() {
  const { ent } = useEntitlements();
  const canSta = ent.tex.staTemplates;
  const canAllTemplates = ent.tex.allTemplates;
  const canDownload = ent.tex.download;
  const canAlign = ent.tex.alignExport;

  const [tex, setTex] = useState("E = mc^2");
  const [wrapMode, setWrapMode] = useState<MathWrapMode>("display-dollar");
  const [category, setCategory] = useState<string>("Algebra");
  const [copied, setCopied] = useState<"out" | "raw" | null>(null);
  const [toast, setToast] = useState("");
  const [renderError, setRenderError] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const categories = useMemo(() => templateCategories(), []);

  const categoryAllowed = useCallback(
    (c: string): boolean => {
      if (c === "STA / VLSI") return canSta;
      if (canAllTemplates) return true;
      return FREE_TEMPLATE_CATEGORIES.has(c);
    },
    [canSta, canAllTemplates]
  );

  const templates = useMemo(
    () => MATH_TEMPLATES.filter((t) => t.category === category),
    [category]
  );

  useEffect(() => {
    if (!categoryAllowed(category)) {
      const fallback =
        categories.find((c) => categoryAllowed(c)) || "Algebra";
      setCategory(fallback);
    }
  }, [category, categoryAllowed, categories]);

  useEffect(() => {
    if (!canAlign && wrapMode === "align") {
      setWrapMode("display-dollar");
    }
  }, [canAlign, wrapMode]);

  const cleanTex = useMemo(() => normalizeTex(tex), [tex]);
  const formatted = useMemo(() => wrapTex(cleanTex, wrapMode), [cleanTex, wrapMode]);

  const safePreviewHtml = useMemo(() => {
    try {
      return katex.renderToString(cleanTex || "\\ ", {
        displayMode: wrapMode !== "inline-dollar" && wrapMode !== "inline-paren",
        throwOnError: false,
        strict: "ignore",
        trust: false,
        output: "html",
      });
    } catch {
      return "";
    }
  }, [cleanTex, wrapMode]);

  useEffect(() => {
    try {
      katex.renderToString(cleanTex || "\\ ", {
        displayMode: true,
        throwOnError: true,
        strict: "ignore",
      });
      setRenderError("");
    } catch (e: unknown) {
      setRenderError(e instanceof Error ? e.message : String(e));
    }
  }, [cleanTex]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  };

  const insertAtCursor = useCallback((snippet: string) => {
    const el = taRef.current;
    if (!el) {
      setTex((t) => t + snippet);
      return;
    }
    const start = el.selectionStart ?? tex.length;
    const end = el.selectionEnd ?? tex.length;
    const next = tex.slice(0, start) + snippet + tex.slice(end);
    setTex(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }, [tex]);

  const copyText = async (text: string, which: "out" | "raw") => {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    flash(which === "out" ? "Formatted math copied" : "Raw TeX copied");
    window.setTimeout(() => setCopied(null), 1600);
  };

  const downloadSnippet = () => {
    if (!canDownload) {
      flash("Download requires Pro+");
      return;
    }
    const blob = new Blob([formatted + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formula.md";
    a.click();
    URL.revokeObjectURL(url);
    flash("Downloaded formula.md");
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[var(--background)] text-slate-200 font-mono">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--bevel-shadow)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
                LaTeX Formula Builder
              </h1>
              <p className="text-[11px] text-slate-400">
                Live preview · templates · STA & export
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlanPill tier={ent.tier} />
            <button
              type="button"
              onClick={() => {
                setTex(normalizeTex(tex));
                flash("Cleaned expression");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Clean
            </button>
            <button
              type="button"
              onClick={() => void copyText(formatted, "out")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-cyan)] px-3 py-1.5 text-xs font-black text-black hover:bg-cyan-300 transition-all shadow-md"
            >
              {copied === "out" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "out" ? "Copied" : "Copy for MD"}
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-2">
        {/* Left: editor */}
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
          {/* Templates */}
          <section className="shrink-0 rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-3 shadow-2xl">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-200">Templates</p>
              <div className="flex flex-wrap gap-1">
                {categories.map((c) => {
                  const ok = categoryAllowed(c);
                  const needsPro = c === "STA / VLSI" || !FREE_TEMPLATE_CATEGORIES.has(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        if (!ok) {
                          flash(
                            c === "STA / VLSI"
                              ? "STA templates require Pro+"
                              : "Full template library requires Pro+"
                          );
                          return;
                        }
                        setCategory(c);
                      }}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                        category === c
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : ok
                            ? "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                            : "bg-slate-900/60 text-slate-600 border border-slate-800 opacity-60"
                      }`}
                    >
                      {c}
                      {!ok && needsPro ? " · Pro+" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <FeatureLock
              locked={!categoryAllowed(category)}
              requires={category === "STA / VLSI" ? "pro" : "pro"}
              title={
                category === "STA / VLSI"
                  ? "STA / VLSI templates"
                  : "Full template library"
              }
            >
              <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                {templates.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setTex(t.tex);
                      flash(t.name);
                    }}
                    className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/10"
                    title={t.tex}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </FeatureLock>
          </section>

          {/* Symbol chips */}
          <section className="shrink-0 max-h-[28%] overflow-auto rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-3 shadow-2xl">
            <p className="mb-2 text-xs font-bold text-slate-200">Insert symbols</p>
            <div className="space-y-2">
              {SYMBOL_CHIPS.map((g) => (
                <div key={g.group}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {g.group}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {g.items.map((item) => (
                      <button
                        key={item.label + item.insert}
                        type="button"
                        title={item.title || item.insert}
                        onClick={() => insertAtCursor(item.insert)}
                        className="min-w-[2rem] rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs font-bold text-slate-200 hover:border-cyan-500/50 hover:bg-cyan-500/10"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Editor */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--bevel-shadow)] px-3 py-2 bg-[var(--surface-recessed)]">
              <div>
                <p className="text-xs font-bold text-slate-200">TeX expression</p>
                <p className="text-[11px] text-slate-400">Type or paste</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTex("");
                  taRef.current?.focus();
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
              >
                <Eraser className="h-3 w-3" />
                Clear
              </button>
            </div>
            <textarea
              ref={taRef}
              value={tex}
              onChange={(e) => setTex(e.target.value)}
              spellCheck={false}
              placeholder="e.g. E = mc^2"
              className="min-h-[8rem] flex-1 resize-none border-0 bg-transparent px-3 py-3 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
            />
          </section>
        </div>

        {/* Right: preview + export */}
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
          {/* Live preview */}
          <section className="flex min-h-[40%] flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--bevel-shadow)] px-3 py-2 bg-[var(--surface-recessed)]">
              <div>
                <p className="text-xs font-bold text-slate-200">Live preview</p>
                <p className="text-[11px] text-slate-400">KaTeX output</p>
              </div>
              {renderError ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-bold text-rose-400">
                  <AlertCircle className="h-3 w-3" />
                  TeX issue
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  OK
                </span>
              )}
            </div>
            <div className="flex min-h-[10rem] flex-1 items-center justify-center overflow-auto bg-slate-950/60 p-6">
              {safePreviewHtml ? (
                <div
                  className="max-w-full overflow-x-auto text-slate-100 [&_.katex]:text-[1.15em] sm:[&_.katex]:text-[1.35em]"
                  dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
                />
              ) : (
                <p className="text-sm text-slate-500">Preview appears here</p>
              )}
            </div>
            {renderError && (
              <div className="border-t border-rose-900/50 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-300 font-mono">
                {renderError}
              </div>
            )}
          </section>

          {/* Export mode */}
          <section className="shrink-0 rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-200">Export format</p>
              {!canAlign && (
                <FeatureLock locked requires="pro" mode="badge" title="align* export" />
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WRAP_MODES.map((m) => {
                const lockedAlign = m.id === "align" && !canAlign;
                return (
                  <button
                    key={m.id}
                    type="button"
                    title={lockedAlign ? "Pro+ required for align*" : m.hint}
                    onClick={() => {
                      if (lockedAlign) {
                        flash("align* export requires Pro+");
                        return;
                      }
                      setWrapMode(m.id);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                      wrapMode === m.id
                        ? "bg-[var(--accent-cyan)] text-black"
                        : lockedAlign
                          ? "bg-slate-900/60 text-slate-600 border border-slate-800 opacity-60"
                          : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {m.label}
                    {lockedAlign ? " · Pro+" : ""}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Output snippet */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--bevel-shadow)] px-3 py-2 bg-[var(--surface-recessed)]">
              <div>
                <p className="text-xs font-bold text-slate-200">Ready to paste</p>
                <p className="text-[11px] text-slate-400">
                  {WRAP_MODES.find((m) => m.id === wrapMode)?.hint}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void copyText(cleanTex, "raw")}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
                >
                  {copied === "raw" ? "Copied raw" : "Copy raw"}
                </button>
                <button
                  type="button"
                  disabled={!canDownload}
                  title={canDownload ? "Download formula.md" : "Pro+ required"}
                  onClick={downloadSnippet}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                >
                  <Download className="h-3 w-3" />
                  .md{!canDownload ? " · Pro+" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => void copyText(formatted, "out")}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-cyan)] px-2.5 py-1 text-[11px] font-black text-black hover:bg-cyan-300"
                >
                  {copied === "out" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy
                </button>
              </div>
            </div>
            <pre className="min-h-[6rem] flex-1 overflow-auto bg-slate-950/50 px-3 py-3 font-mono text-[12px] leading-relaxed text-cyan-300 whitespace-pre-wrap">
              {formatted || " "}
            </pre>
          </section>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-100 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
