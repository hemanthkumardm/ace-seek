"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Upload,
  Trash2,
  ArrowRight,
  FileText,
  Activity,
  Layers,
  Zap,
  Cpu,
  AlertTriangle,
  Check,
  Filter,
  RefreshCw,
  ExternalLink,
  Tag,
} from "lucide-react";
import {
  type ReportHubEntry,
  type ReportHubTag,
  type HubOpenTarget,
  addToHubHistory,
  buildHubEntry,
  clearHubHistory,
  formatBytes,
  loadHubHistory,
  openEntryInStudio,
  removeHubEntry,
  tagLabel,
} from "@/lib/report-hub-engine";
import { MOCK_STA_REPORTS } from "@/lib/timing-engine";

const inputCls =
  "w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400";

function targetIcon(t: HubOpenTarget) {
  switch (t) {
    case "timing":
      return Activity;
    case "sdc":
      return Cpu;
    case "power":
      return Zap;
    case "mmmc":
      return Layers;
    default:
      return FileText;
  }
}

function targetLabel(t: HubOpenTarget): string {
  switch (t) {
    case "timing":
      return "Timing Studio";
    case "sdc":
      return "SDC Studio";
    case "power":
      return "Power Studio";
    case "mmmc":
      return "MMMC Studio";
    default:
      return "Unknown";
  }
}

function targetBtnClass(t: HubOpenTarget): string {
  switch (t) {
    case "timing":
      return "bg-amber-400 text-black";
    case "sdc":
      return "bg-sky-500 text-white";
    case "power":
      return "bg-rose-600 text-white";
    case "mmmc":
      return "bg-indigo-600 text-white";
    default:
      return "bg-slate-700 text-white";
  }
}

export default function ReportHubPage() {
  const [entries, setEntries] = useState<ReportHubEntry[]>([]);
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterTarget, setFilterTarget] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  };

  const refresh = useCallback(() => {
    const h = loadHubHistory();
    setEntries(h.entries);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterTag !== "all" && !e.tags.includes(filterTag as ReportHubTag))
        return false;
      if (filterTarget !== "all" && e.target !== filterTarget) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${e.filename} ${e.designName || ""} ${e.tool} ${e.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filterTag, filterTarget, query]);

  const selected = entries.find((e) => e.id === selectedId) || filtered[0];

  const ingestFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    let last: ReportHubEntry | null = null;
    for (const file of list) {
      const text = await file.text();
      const entry = buildHubEntry(text, file.name);
      addToHubHistory(entry);
      last = entry;
    }
    refresh();
    if (last) setSelectedId(last.id);
    flash(`Ingested ${list.length} file(s) into Report Hub`);
  };

  const ingestText = (text: string, filename: string) => {
    const entry = buildHubEntry(text, filename);
    addToHubHistory(entry);
    refresh();
    setSelectedId(entry.id);
    flash(`Ingested ${filename}`);
  };

  const handleOpen = (entry: ReportHubEntry) => {
    const href = openEntryInStudio(entry);
    flash(`Opening in ${targetLabel(entry.target)}…`);
    window.location.href = href;
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900 flex flex-col font-sans">
      {toast && (
        <div className="fixed top-4 right-4 z-50 neu-panel px-4 py-2 bg-black text-white text-xs font-black shadow-xl">
          {toast}
        </div>
      )}

      <header className="neu-panel bg-white border-b-2 border-black p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 neu-panel bg-slate-900 text-white flex items-center justify-center font-black rounded-lg">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              Report Hub
              <span className="neu-badge bg-slate-100 text-slate-800 border-slate-600 text-[9px]">
                Ingest → Classify → Open
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-600">
              Drop STA / SDC / UPF / MMMC dumps — auto-tag and jump to the right studio
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".rpt,.txt,.log,.sdc,.upf,.tcl,.timing,.gz"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void ingestFiles(e.target.files);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="neu-btn neu-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload reports
          </button>
          <button
            type="button"
            onClick={() => {
              ingestText(MOCK_STA_REPORTS.synopsys, "mock_pt_setup.rpt");
              ingestText(MOCK_STA_REPORTS.cadence, "mock_genus_paths.rpt");
            }}
            className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
          >
            Load mock STA
          </button>
          <button
            type="button"
            onClick={() => {
              refresh();
              flash("History refreshed");
            }}
            className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
          >
            <RefreshCw className="w-3.5 h-3.5 inline" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm("Clear all Report Hub history in this browser?")) return;
              clearHubHistory();
              setEntries([]);
              setSelectedId("");
              flash("History cleared");
            }}
            className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-rose-700"
          >
            Clear history
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-5 max-w-7xl w-full mx-auto space-y-4">
        <div className="neu-panel bg-white p-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-800">
          <span className="text-slate-700 uppercase">Workflow</span>
          <span>1. Upload or paste dumps</span>
          <span>→</span>
          <span>2. Auto-tag (setup/hold/SI/stage/vendor)</span>
          <span>→</span>
          <span>3. Open in Timing / SDC / MMMC / Power</span>
          <span className="ml-auto text-slate-500 font-bold">
            {entries.length} in history · showing {filtered.length}
          </span>
        </div>

        {/* Drop zone */}
        <div
          className={`neu-panel p-6 border-2 border-dashed transition ${
            dragOver
              ? "bg-indigo-50 border-indigo-600"
              : "bg-white border-black"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) void ingestFiles(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
              <Upload className="w-8 h-8 text-slate-400" />
              <p className="text-sm font-black text-slate-800">
                Drop report files here
              </p>
              <p className="text-[10px] font-bold text-slate-500">
                .rpt · .txt · .sdc · .upf · .tcl — classified via ingest engine
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="neu-btn px-3 py-1.5 text-xs font-black bg-slate-900 text-white mt-1"
              >
                Browse files
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-600">
                Or paste report text
              </label>
              <textarea
                id="hub-paste"
                className={`${inputCls} h-28 resize-y`}
                placeholder="Paste PrimeTime / Genus / OpenSTA / SDC / UPF text…"
              />
              <div className="flex gap-2">
                <input
                  id="hub-paste-name"
                  className={`${inputCls} !w-auto flex-1`}
                  defaultValue="pasted_report.rpt"
                  placeholder="filename.rpt"
                />
                <button
                  type="button"
                  className="neu-btn px-3 py-1.5 text-xs font-black bg-indigo-600 text-white"
                  onClick={() => {
                    const el = document.getElementById(
                      "hub-paste"
                    ) as HTMLTextAreaElement | null;
                    const nameEl = document.getElementById(
                      "hub-paste-name"
                    ) as HTMLInputElement | null;
                    if (el?.value) {
                      ingestText(el.value, nameEl?.value || "pasted_report.rpt");
                      el.value = "";
                    } else flash("Paste some text first");
                  }}
                >
                  Ingest paste
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="neu-panel bg-white p-2 flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <input
            className={`${inputCls} !w-48`}
            placeholder="Search filename / design…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className={`${inputCls} !w-auto`}
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
          >
            <option value="all">All targets</option>
            <option value="timing">Timing</option>
            <option value="sdc">SDC</option>
            <option value="power">Power</option>
            <option value="mmmc">MMMC</option>
            <option value="unknown">Unknown</option>
          </select>
          <select
            className={`${inputCls} !w-auto`}
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {tagLabel(t as ReportHubTag)}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1 ml-auto">
            <Link
              href="/vlsi/timing-studio"
              className="neu-btn px-2 py-1 text-[10px] font-black bg-amber-50 text-amber-950"
            >
              Timing
            </Link>
            <Link
              href="/vlsi/sdc-studio"
              className="neu-btn px-2 py-1 text-[10px] font-black bg-sky-50 text-sky-950"
            >
              SDC
            </Link>
            <Link
              href="/vlsi/mmmc-studio"
              className="neu-btn px-2 py-1 text-[10px] font-black bg-indigo-50 text-indigo-950"
            >
              MMMC
            </Link>
            <Link
              href="/vlsi/power-studio"
              className="neu-btn px-2 py-1 text-[10px] font-black bg-rose-50 text-rose-950"
            >
              Power
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Card list */}
          <div className="lg:col-span-5 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="neu-panel bg-white p-8 text-center text-xs font-bold text-slate-500">
                No reports yet. Upload a dump or load mock STA.
              </div>
            ) : (
              filtered.map((e) => {
                const Icon = targetIcon(e.target);
                const active = selected?.id === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className={`w-full text-left neu-panel p-3 border-2 transition ${
                      active
                        ? "bg-amber-50 border-amber-500"
                        : "bg-white border-black hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 border-black shrink-0 ${targetBtnClass(e.target)}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-slate-900 truncate">
                          {e.filename}
                        </div>
                        <div className="text-[10px] font-bold text-slate-600 truncate">
                          {e.designName || "—"} · {e.tool} · {e.stage}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {e.tags.slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700"
                            >
                              {tagLabel(t)}
                            </span>
                          ))}
                        </div>
                        {e.metrics.pathCount > 0 && (
                          <div className="text-[9px] font-bold text-slate-500 mt-1">
                            {e.metrics.pathCount} paths
                            {e.metrics.wnsSetup !== undefined && (
                              <span
                                className={
                                  e.metrics.wnsSetup < 0
                                    ? " text-rose-600"
                                    : " text-emerald-600"
                                }
                              >
                                {" "}
                                · WNS {e.metrics.wnsSetup.toFixed(3)} ns
                              </span>
                            )}
                            {(e.metrics.failingSetup > 0 ||
                              e.metrics.failingHold > 0) && (
                              <span className="text-rose-600">
                                {" "}
                                · {e.metrics.failingSetup}S/
                                {e.metrics.failingHold}H fail
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0">
                        {new Date(e.savedAt).toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-7">
            {!selected ? (
              <div className="neu-panel bg-white p-10 text-center text-xs font-bold text-slate-500">
                Select a report card to preview tags and open in a studio.
              </div>
            ) : (
              <div className="neu-panel bg-white p-4 space-y-4">
                <div className="flex flex-wrap justify-between gap-2 items-start">
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      {selected.filename}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-600">
                      {formatBytes(selected.originalBytes)}
                      {selected.truncated ? " · stored truncated" : ""} ·{" "}
                      {selected.vendor} · {selected.kind}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpen(selected)}
                      className={`neu-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 ${targetBtnClass(selected.target)}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in {targetLabel(selected.target)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Force timing even if classified elsewhere
                        const href = openEntryInStudio({
                          ...selected,
                          target: "timing",
                        });
                        window.location.href = href;
                      }}
                      className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
                    >
                      Force → Timing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeHubEntry(selected.id);
                        refresh();
                        setSelectedId("");
                        flash("Removed from history");
                      }}
                      className="neu-btn px-2 py-1.5 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-3 bg-slate-50 border-2 border-black rounded-lg">
                    <div className="text-[9px] font-black uppercase text-slate-500">
                      Design
                    </div>
                    <div className="text-xs font-black truncate">
                      {selected.designName || "—"}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border-2 border-black rounded-lg">
                    <div className="text-[9px] font-black uppercase text-slate-500">
                      Tool / stage
                    </div>
                    <div className="text-xs font-black truncate">
                      {selected.tool}
                    </div>
                    <div className="text-[9px] font-bold text-slate-600">
                      {selected.stage}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border-2 border-black rounded-lg">
                    <div className="text-[9px] font-black uppercase text-slate-500">
                      WNS setup
                    </div>
                    <div
                      className={`text-sm font-black ${
                        (selected.metrics.wnsSetup ?? 0) < 0
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {selected.metrics.wnsSetup !== undefined
                        ? `${selected.metrics.wnsSetup.toFixed(3)} ns`
                        : "—"}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border-2 border-black rounded-lg">
                    <div className="text-[9px] font-black uppercase text-slate-500">
                      Violations
                    </div>
                    <div className="text-sm font-black text-rose-600">
                      {selected.metrics.failingSetup +
                        selected.metrics.failingHold}
                      <span className="text-[9px] text-slate-500 font-bold ml-1">
                        ({selected.metrics.failingSetup}S /{" "}
                        {selected.metrics.failingHold}H)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[9px] font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-black px-2 py-0.5 rounded-lg border-2 border-black bg-white"
                      >
                        {tagLabel(t)}
                      </span>
                    ))}
                  </div>
                </div>

                {selected.metrics.clocks.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase text-slate-500 mb-1">
                      Clocks
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-700">
                      {selected.metrics.clocks.join(", ")}
                    </div>
                  </div>
                )}

                {selected.warnings.length > 0 && (
                  <div className="p-2 bg-amber-50 border-2 border-amber-500 rounded-lg text-[10px] font-bold text-amber-950 space-y-0.5">
                    {selected.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="text-[9px] font-black uppercase text-slate-500 mb-1">
                    Preview (first 3k chars)
                  </div>
                  <pre className="h-48 overflow-auto p-3 font-mono text-[10px] bg-slate-900 text-emerald-100 rounded-xl border-2 border-black whitespace-pre-wrap">
                    {selected.text.slice(0, 3000)}
                    {selected.text.length > 3000 ? "\n…" : ""}
                  </pre>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Route: {targetLabel(selected.target)}
                  </span>
                  <span>· {selected.pathBlocks} ingest blocks</span>
                  {selected.metrics.hasSi && (
                    <span className="text-amber-700">· SI signals detected</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
