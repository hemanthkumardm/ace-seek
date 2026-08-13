"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  RefreshCw,
  Upload,
  Wand2,
  AlertCircle,
} from "lucide-react";
import {
  DATA_FORMATS,
  DataFormat,
  canConvertData,
  convertData,
  detectDataFormat,
  formatInfo,
} from "@/lib/data-convert";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";

export default function FormatConverterPage() {
  const { ent } = useEntitlements();
  const allowedFrom = ent.format.from as DataFormat[];
  const allowedTo = ent.format.to as DataFormat[];

  const [from, setFrom] = useState<DataFormat>("json");
  const [to, setTo] = useState<DataFormat>("yaml");
  const [input, setInput] = useState(formatInfo("json").sample);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState(true);
  const [pretty, setPretty] = useState(true);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fromMeta = formatInfo(from);
  const toMeta = formatInfo(to);
  const pairOk = canConvertData(from, to);

  const runConvert = useCallback(
    (src?: string, f?: DataFormat, t?: DataFormat) => {
      const ff = f ?? from;
      const tt = t ?? to;
      if (!allowedFrom.includes(ff) || !allowedTo.includes(tt)) {
        setOutput("");
        setError(
          `“${ff} → ${tt}” needs a higher plan (you’re on ${ent.label}). Upgrade at https://www.ace-seek.com/pricing.`
        );
        setNote("");
        return;
      }
      const result = convertData(src ?? input, ff, tt, { pretty });
      if (result.ok) {
        setOutput(result.output);
        setError("");
        setNote(result.note || "");
      } else {
        setOutput("");
        setError(result.error);
        setNote("");
      }
    },
    [input, from, to, pretty, allowedFrom, allowedTo, ent.label]
  );

  // Live convert (debounced)
  useEffect(() => {
    if (!live) return;
    const id = window.setTimeout(() => runConvert(), 200);
    return () => window.clearTimeout(id);
  }, [input, from, to, pretty, live, runConvert]);

  // Initial convert
  useEffect(() => {
    runConvert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2000);
  };

  const swap = () => {
    if (!canConvertData(to, from)) {
      flash(`Can't swap ${toMeta.label} → ${fromMeta.label}`);
      return;
    }
    const nextFrom = to;
    const nextTo = from;
    const nextInput = output || input;
    setFrom(nextFrom);
    setTo(nextTo);
    setInput(nextInput);
    flash("Swapped formats");
  };

  const onFromChange = (f: DataFormat) => {
    setFrom(f);
    if (!input.trim() || input === formatInfo(from).sample) {
      setInput(formatInfo(f).sample);
    }
  };

  const loadSample = () => {
    setInput(fromMeta.sample);
    flash(`Loaded ${fromMeta.label} sample`);
  };

  const detect = () => {
    const d = detectDataFormat(input);
    if (d) {
      setFrom(d);
      flash(`Detected ${formatInfo(d).label}`);
    } else {
      flash("Could not detect format");
    }
  };

  const copyOut = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    flash("Copied result");
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadOut = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${toMeta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    flash(`Downloaded converted.${toMeta.ext}`);
  };

  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setInput(text);
      const d = detectDataFormat(text);
      if (d) setFrom(d);
      flash(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const presets: { label: string; from: DataFormat; to: DataFormat }[] = [
    { label: "JSON → YAML", from: "json", to: "yaml" },
    { label: "YAML → JSON", from: "yaml", to: "json" },
    { label: "JSON → TOML", from: "json", to: "toml" },
    { label: "CSV → JSON", from: "csv", to: "json" },
    { label: "JSON → CSV", from: "json", to: "csv" },
    { label: "Encode Base64", from: "text", to: "base64" },
    { label: "Decode Base64", from: "base64", to: "text" },
    { label: "URL encode", from: "text", to: "url" },
  ];

  const statusLine = useMemo(() => {
    if (error) return error;
    if (!pairOk) return `This pair isn't supported yet`;
    if (note) return note;
    if (output) return "Ready";
    return "Enter data to convert";
  }, [error, pairOk, note, output]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[var(--background)] text-slate-200 font-mono">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--bevel-shadow)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 shrink-0 font-bold">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
                Format Converter
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                JSON · YAML · TOML · CSV · Base64 · URL · Hex
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PlanPill tier={ent.tier} />
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                error
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  : output
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {error ? "Error" : output ? "Converted" : "Waiting"}
            </span>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="shrink-0 border-b border-[var(--bevel-shadow)] bg-[var(--surface-panel)] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-400 uppercase">
            From
            <select
              value={from}
              onChange={(e) => onFromChange(e.target.value as DataFormat)}
              className="min-w-[8.5rem] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[var(--accent-cyan)]"
            >
              {DATA_FORMATS.map((f) => {
                const ok = allowedFrom.includes(f.id);
                return (
                  <option key={f.id} value={f.id} disabled={!ok} className="bg-slate-900 text-slate-200">
                    {f.label}
                    {!ok ? " · Pro+" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <button
            type="button"
            onClick={swap}
            className="mb-0.5 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 transition-all"
            title="Swap formats"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-400 uppercase">
            To
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as DataFormat)}
              className="min-w-[8.5rem] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[var(--accent-cyan)]"
            >
              {DATA_FORMATS.map((f) => {
                const ok = allowedTo.includes(f.id);
                return (
                  <option key={f.id} value={f.id} disabled={!ok} className="bg-slate-900 text-slate-200">
                    {f.label}
                    {!ok ? " · Pro+" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs text-slate-400 select-none font-medium">
            <input
              type="checkbox"
              className="rounded accent-[var(--accent-cyan)]"
              checked={live}
              onChange={(e) => setLive(e.target.checked)}
            />
            Live
          </label>
          <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs text-slate-400 select-none font-medium">
            <input
              type="checkbox"
              className="rounded accent-[var(--accent-cyan)]"
              checked={pretty}
              onChange={(e) => setPretty(e.target.checked)}
            />
            Pretty
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => runConvert()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-cyan)] px-4 py-1.5 text-xs font-black text-black hover:bg-cyan-300 transition-all shadow-md"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Convert
            </button>
            <button
              type="button"
              onClick={() => void copyOut()}
              disabled={!output}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!ent.format.download) {
                  flash("Download requires Pro+");
                  return;
                }
                downloadOut();
              }}
              disabled={!output || !ent.format.download}
              title={ent.format.download ? "Download result" : "Pro+ required"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Save{!ent.format.download ? " · Pro+" : ""}
            </button>
          </div>
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setFrom(p.from);
                setTo(p.to);
                if (!input.trim() || input === formatInfo(from).sample) {
                  setInput(formatInfo(p.from).sample);
                }
              }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                from === p.from && to === p.to
                  ? "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40"
                  : "bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      <div className="grid min-h-0 flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-2">
        {/* Input */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--bevel-shadow)] px-3 py-2 bg-[var(--surface-recessed)]">
            <div>
              <p className="text-xs font-bold text-slate-200">Input</p>
              <p className="text-[11px] text-slate-400">{fromMeta.label}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (!ent.format.detect) {
                    flash("Detect requires Free+ API key or higher");
                    return;
                  }
                  detect();
                }}
                disabled={!ent.format.detect && ent.tier === "guest"}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                title="Auto-detect format"
              >
                <Wand2 className="h-3 w-3" />
                Detect
              </button>
              <button
                type="button"
                onClick={loadSample}
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
              >
                Sample
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".json,.yaml,.yml,.toml,.csv,.txt,.b64,.hex"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
              >
                <Upload className="h-3 w-3" />
                File
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={`Paste ${fromMeta.label} here…`}
            className="min-h-[12rem] flex-1 resize-none border-0 bg-transparent px-3 py-3 font-mono text-[12px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
          />
        </section>

        {/* Output */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--bevel-shadow)] px-3 py-2 bg-[var(--surface-recessed)]">
            <div>
              <p className="text-xs font-bold text-slate-200">Result</p>
              <p className="text-[11px] text-slate-400">{toMeta.label}</p>
            </div>
            <button
              type="button"
              onClick={() => void copyOut()}
              disabled={!output}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-cyan)] px-2.5 py-1 text-[11px] font-black text-black hover:bg-cyan-300 disabled:opacity-40"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {error ? (
            <div className="flex flex-1 items-start gap-2 overflow-auto p-4 text-sm text-rose-400 bg-rose-950/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Couldn’t convert</p>
                <p className="mt-1 font-mono text-xs text-rose-300 whitespace-pre-wrap">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <textarea
              readOnly
              value={output}
              placeholder="Result appears here…"
              className="min-h-[12rem] flex-1 resize-none border-0 bg-slate-950/40 px-3 py-3 font-mono text-[12px] leading-relaxed text-cyan-300 outline-none placeholder:text-slate-600"
            />
          )}
        </section>
      </div>

      {/* Status footer */}
      <footer className="shrink-0 border-t border-[var(--bevel-shadow)] bg-[var(--surface-recessed)] px-4 py-2 text-[11px] text-slate-400 sm:px-6">
        <span className="font-bold text-slate-300">
          {fromMeta.label} → {toMeta.label}
        </span>
        <span className="mx-2 text-slate-600">·</span>
        <span className={error ? "text-rose-400" : ""}>{statusLine}</span>
      </footer>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-100 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
