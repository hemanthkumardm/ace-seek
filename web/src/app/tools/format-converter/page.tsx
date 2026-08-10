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

export default function FormatConverterPage() {
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
      const result = convertData(src ?? input, f ?? from, t ?? to, { pretty });
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
    [input, from, to, pretty]
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
    // convert will run via live effect
    flash("Swapped formats");
  };

  const onFromChange = (f: DataFormat) => {
    setFrom(f);
    // If empty-ish, load sample
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
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#f0f2f5] text-slate-800">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-slate-900">
                Format converter
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                JSON · YAML · TOML · CSV · Base64 · URL · Hex
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                error
                  ? "bg-rose-50 text-rose-700"
                  : output
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {error ? "Error" : output ? "Converted" : "Waiting"}
            </span>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="shrink-0 border-b border-slate-200/60 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
            From
            <select
              value={from}
              onChange={(e) => onFromChange(e.target.value as DataFormat)}
              className="min-w-[8.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            >
              {DATA_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={swap}
            className="mb-0.5 rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
            title="Swap formats"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
            To
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as DataFormat)}
              className="min-w-[8.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-200"
            >
              {DATA_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-violet-600"
              checked={live}
              onChange={(e) => setLive(e.target.checked)}
            />
            Live
          </label>
          <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-violet-600"
              checked={pretty}
              onChange={(e) => setPretty(e.target.checked)}
            />
            Pretty
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => runConvert()}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Convert
            </button>
            <button
              type="button"
              onClick={() => void copyOut()}
              disabled={!output}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={downloadOut}
              disabled={!output}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Save
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
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                from === p.from && to === p.to
                  ? "bg-violet-100 text-violet-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">Input</p>
              <p className="text-[11px] text-slate-400">{fromMeta.label}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={detect}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                title="Auto-detect format"
              >
                <Wand2 className="h-3 w-3" />
                Detect
              </button>
              <button
                type="button"
                onClick={loadSample}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
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
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
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
            className="min-h-[12rem] flex-1 resize-none border-0 bg-transparent px-3 py-3 font-mono text-[12px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-300"
          />
        </section>

        {/* Output */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">Result</p>
              <p className="text-[11px] text-slate-400">{toMeta.label}</p>
            </div>
            <button
              type="button"
              onClick={() => void copyOut()}
              disabled={!output}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {error ? (
            <div className="flex flex-1 items-start gap-2 overflow-auto p-4 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Couldn’t convert</p>
                <p className="mt-1 font-mono text-xs text-rose-600/90 whitespace-pre-wrap">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <textarea
              readOnly
              value={output}
              placeholder="Result appears here…"
              className="min-h-[12rem] flex-1 resize-none border-0 bg-slate-50/50 px-3 py-3 font-mono text-[12px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-300"
            />
          )}
        </section>
      </div>

      {/* Status footer */}
      <footer className="shrink-0 border-t border-slate-200/80 bg-white/80 px-4 py-2 text-[11px] text-slate-500 sm:px-6">
        <span className="font-medium text-slate-600">
          {fromMeta.label} → {toMeta.label}
        </span>
        <span className="mx-2 text-slate-300">·</span>
        <span className={error ? "text-rose-600" : ""}>{statusLine}</span>
      </footer>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
