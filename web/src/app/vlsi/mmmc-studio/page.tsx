"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  Grid,
  Plus,
  Trash2,
  FileText,
  Sliders,
  Cpu,
  ArrowRight,
  Upload,
  Library,
  Thermometer,
} from "lucide-react";

import {
  MmmcState,
  DEFAULT_MMMC_STATE,
  MMMC_PRESETS,
  generateMmmcTcl,
  parseMmmcTcl,
  lintMmmcState,
  emptyMmmcState,
  starterMmmcState,
  createLibrarySet,
  createRcCorner,
  createOpCond,
  createDelayCorner,
  createConstraintMode,
  createAnalysisView,
  normalizeMmmcState,
  LibrarySet,
  RcCorner,
  OperatingCondition,
  DelayCorner,
  ConstraintMode,
  AnalysisView,
} from "@/lib/mmmc-engine";
import {
  buildMmmcViewRegistry,
  saveMmmcViewRegistry,
} from "@/lib/mmmc-timing-bridge";
import {
  applySdcTransferToMmmc,
  bindSdcPackToMode,
  buildSdcPullFromMode,
  clearSdcTransfer,
  loadSdcProjectRegistry,
  loadSdcTransfer,
  lintSdcModeLinks,
  saveMmmcModeSnapshot,
  saveSdcPull,
  type SdcProjectPack,
  type SdcTransferPayload,
  upsertSdcProject,
} from "@/lib/sdc-mmmc-bridge";
import {
  clearHubTransfer,
  loadHubTransfer,
} from "@/lib/report-hub-engine";
import { VlsiStudioGate } from "@/components/VlsiStudioGate";

type TabId =
  | "configure"
  | "matrix"
  | "views"
  | "script"
  | "lint";

const inputCls =
  "w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400";
const labelCls = "text-[9px] font-black uppercase text-slate-600 block mb-0.5";

/** Split paths on newlines, commas, and whitespace (farm .lib lists). */
function parsePathList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .flatMap((chunk) => chunk.trim().split(/\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatPathList(files: string[], multiline: boolean): string {
  if (multiline && files.length > 1) return files.join("\n");
  return files.join(" ");
}

/**
 * Free-form path list editor. Keeps raw text while focused so space/comma work;
 * commits parsed list on blur (or Enter for single-line).
 */
function PathListField({
  files,
  onCommit,
  placeholder,
  multiline = true,
  rows = 4,
}: {
  files: string[];
  onCommit: (files: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [draft, setDraft] = useState(() => formatPathList(files, multiline));
  const [focused, setFocused] = useState(false);
  const filesKey = files.join("\0");

  useEffect(() => {
    if (!focused) setDraft(formatPathList(files, multiline));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when external files change
  }, [filesKey, focused, multiline]);

  const display = focused ? draft : formatPathList(files, multiline);

  const onBlurCommit = () => {
    const next = parsePathList(draft);
    setFocused(false);
    setDraft(formatPathList(next, multiline));
    onCommit(next);
  };

  if (!multiline) {
    return (
      <input
        type="text"
        className={inputCls}
        value={display}
        placeholder={placeholder}
        spellCheck={false}
        onFocus={() => {
          setFocused(true);
          setDraft(formatPathList(files, false));
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={onBlurCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    );
  }

  return (
    <div className="space-y-1">
      <textarea
        className={`${inputCls} h-24 resize-y`}
        rows={rows}
        value={display}
        placeholder={placeholder}
        spellCheck={false}
        onFocus={() => {
          setFocused(true);
          setDraft(formatPathList(files, true));
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={onBlurCommit}
      />
      <p className="text-[9px] font-bold text-slate-500">
        Separate with <b>space</b>, <b>comma</b>, or <b>new line</b>
        {focused
          ? ` · typing… (${parsePathList(draft).length} path${
              parsePathList(draft).length === 1 ? "" : "s"
            } when you leave the field)`
          : ` · ${files.length} path${files.length === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}

function MmmcStudioPage() {
  const [state, setState] = useState<MmmcState>(() =>
    normalizeMmmcState(structuredClone(DEFAULT_MMMC_STATE))
  );
  const [vendor, setVendor] = useState<"cadence" | "synopsys">("cadence");
  const [activeTab, setActiveTab] = useState<TabId>("configure");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [attachedSdcPayload, setAttachedSdcPayload] =
    useState<SdcTransferPayload | null>(null);
  const [sdcProjects, setSdcProjects] = useState<SdcProjectPack[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  const setMmmc = (next: MmmcState | ((prev: MmmcState) => MmmcState)) => {
    setState((prev) =>
      normalizeMmmcState(typeof next === "function" ? next(prev) : next)
    );
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  // Deep links + B1.8 SDC transfer auto-apply
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qTab = params.get("tab");
    const qVendor = params.get("vendor");
    const importSdc = params.get("import_sdc") === "true";
    const fromHub = params.get("from_hub") === "true";
    const map: Record<string, TabId> = {
      matrix: "matrix",
      views: "views",
      corners: "configure",
      modes: "configure",
      script: "script",
      lint: "lint",
      configure: "configure",
      libs: "configure",
    };
    if (qTab && map[qTab]) setActiveTab(map[qTab]);
    if (qVendor && ["cadence", "synopsys"].includes(qVendor)) {
      setVendor(qVendor as "cadence" | "synopsys");
    }

    const reg = loadSdcProjectRegistry();
    if (reg?.projects?.length) setSdcProjects(reg.projects);

    if (fromHub) {
      const hub = loadHubTransfer();
      if (hub?.text) {
        try {
          const parsed = parseMmmcTcl(hub.text);
          if (
            parsed.librarySets.length ||
            parsed.delayCorners.length ||
            parsed.analysisViews.length
          ) {
            setMmmc(parsed);
            flash(`Loaded from Report Hub: ${hub.filename || "mmmc"}`);
            setActiveTab("configure");
          }
        } catch {
          /* ignore */
        }
        clearHubTransfer();
        const url = new URL(window.location.href);
        url.searchParams.delete("from_hub");
        window.history.replaceState(null, "", url.toString());
      }
    }

    const transfer = loadSdcTransfer();
    if (transfer?.sdcText) {
      setAttachedSdcPayload(transfer);
      // Auto-apply when deep-linked from SDC Studio
      if (importSdc) {
        setMmmc((prev) => {
          const result = applySdcTransferToMmmc(prev, transfer);
          upsertSdcProject(result.pack);
          setSdcProjects((p) => {
            const others = p.filter((x) => x.id !== result.pack.id);
            return [...others, result.pack];
          });
          flash(
            `SDC ${result.action === "created" ? "created mode" : "bound to"} "${result.modeName}" · ${result.pack.clockCount} clocks`
          );
          return result.state;
        });
        clearSdcTransfer();
        // Clean query so refresh doesn't re-apply
        const url = new URL(window.location.href);
        url.searchParams.delete("import_sdc");
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.get("tab") !== activeTab) {
      url.searchParams.set("tab", activeTab);
      changed = true;
    }
    if (url.searchParams.get("vendor") !== vendor) {
      url.searchParams.set("vendor", vendor);
      changed = true;
    }
    if (changed) window.history.replaceState(null, "", url.toString());
  }, [activeTab, vendor]);

  // B1.7 + B1.8: push analysis views + mode snapshot for other studios
  useEffect(() => {
    const t = window.setTimeout(() => {
      const reg = buildMmmcViewRegistry(state, "mmmc-studio");
      saveMmmcViewRegistry(reg);
      saveMmmcModeSnapshot(state);
    }, 250);
    return () => window.clearTimeout(t);
  }, [state]);

  const generatedScript = useMemo(
    () => generateMmmcTcl(state, vendor),
    [state, vendor]
  );

  const lintMessages = useMemo(
    () => [...lintMmmcState(state), ...lintSdcModeLinks(state)],
    [state]
  );

  const bindTransferToMode = (modeId: string) => {
    if (!attachedSdcPayload) return;
    const result = applySdcTransferToMmmc(state, {
      ...attachedSdcPayload,
      action: "bind",
      targetModeId: modeId,
    });
    setMmmc(result.state);
    upsertSdcProject(result.pack);
    setSdcProjects((p) => {
      const others = p.filter((x) => x.id !== result.pack.id);
      return [...others, result.pack];
    });
    clearSdcTransfer();
    setAttachedSdcPayload(null);
    flash(
      `Bound SDC → mode "${result.modeName}" (${result.pack.clockCount} clocks · ${result.pack.fileName})`
    );
  };

  const createModeFromTransfer = () => {
    if (!attachedSdcPayload) return;
    const result = applySdcTransferToMmmc(state, {
      ...attachedSdcPayload,
      action: "create",
    });
    setMmmc(result.state);
    upsertSdcProject(result.pack);
    setSdcProjects((p) => {
      const others = p.filter((x) => x.id !== result.pack.id);
      return [...others, result.pack];
    });
    clearSdcTransfer();
    setAttachedSdcPayload(null);
    flash(`Created mode "${result.modeName}" from SDC Studio`);
  };

  const openModeInSdcStudio = (modeId: string) => {
    const mode = state.constraintModes.find((m) => m.id === modeId);
    if (!mode) return;
    if (!mode.sdcText?.trim()) {
      flash("Mode has no SDC text — bind from SDC Studio first");
      return;
    }
    saveSdcPull(buildSdcPullFromMode(mode));
    flash(`Opening mode "${mode.name}" in SDC Studio…`);
    window.location.href = `/vlsi/sdc-studio?from_mmmc=true&mode=${encodeURIComponent(mode.name)}`;
  };

  const applyProjectPackToMode = (modeId: string, packId: string) => {
    const pack = sdcProjects.find((p) => p.id === packId);
    if (!pack) return;
    setMmmc((prev) => ({
      ...prev,
      constraintModes: prev.constraintModes.map((m) =>
        m.id === modeId ? bindSdcPackToMode(m, pack) : m
      ),
    }));
    flash(`Applied project "${pack.name}" → mode (${pack.clockCount} clocks)`);
  };
  const errorCount = lintMessages.filter((m) => m.severity === "error").length;
  const warningCount = lintMessages.filter((m) => m.severity === "warning").length;

  const loadPreset = (presetState: MmmcState, name: string) => {
    setMmmc(structuredClone(presetState));
    flash(`Loaded preset: ${name}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      flash("Copied MMMC TCL to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      flash("Copy failed");
    }
  };

  const handleDownload = () => {
    const filename = vendor === "cadence" ? "mmmc.tcl" : "scenarios.tcl";
    const blob = new Blob([generatedScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    flash(`Downloaded ${filename}`);
  };

  const handleImportTcl = (text: string) => {
    try {
      const parsed = parseMmmcTcl(text);
      if (
        !parsed.librarySets.length &&
        !parsed.delayCorners.length &&
        !parsed.analysisViews.length
      ) {
        flash("Could not parse MMMC objects from file");
        return;
      }
      setMmmc(parsed);
      flash(
        `Imported ${parsed.librarySets.length} libs · ${parsed.opConds.length} opconds · ${parsed.delayCorners.length} delay · ${parsed.analysisViews.length} views`
      );
      setActiveTab("configure");
    } catch {
      flash("Import failed — check TCL syntax");
    }
  };

  // --- CRUD updaters ---
  const updateLib = (id: string, patch: Partial<LibrarySet>) => {
    setMmmc((prev) => ({
      ...prev,
      librarySets: prev.librarySets.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    }));
  };

  const removeLib = (id: string) => {
    setMmmc((prev) => ({
      ...prev,
      librarySets: prev.librarySets.filter((l) => l.id !== id),
      delayCorners: prev.delayCorners.map((d) =>
        d.librarySetId === id
          ? { ...d, librarySetId: prev.librarySets.find((x) => x.id !== id)?.id || "" }
          : d
      ),
    }));
  };

  const updateRc = (id: string, patch: Partial<RcCorner>) => {
    setMmmc((prev) => ({
      ...prev,
      rcCorners: prev.rcCorners.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const removeRc = (id: string) => {
    setMmmc((prev) => ({
      ...prev,
      rcCorners: prev.rcCorners.filter((r) => r.id !== id),
      delayCorners: prev.delayCorners.map((d) =>
        d.rcCornerId === id
          ? { ...d, rcCornerId: prev.rcCorners.find((x) => x.id !== id)?.id || "" }
          : d
      ),
    }));
  };

  const updateOp = (id: string, patch: Partial<OperatingCondition>) => {
    setMmmc((prev) => ({
      ...prev,
      opConds: prev.opConds.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  };

  const removeOp = (id: string) => {
    setMmmc((prev) => ({
      ...prev,
      opConds: prev.opConds.filter((o) => o.id !== id),
      delayCorners: prev.delayCorners.map((d) =>
        d.opCondId === id ? { ...d, opCondId: undefined } : d
      ),
    }));
  };

  const updateDc = (id: string, patch: Partial<DelayCorner>) => {
    setMmmc((prev) => ({
      ...prev,
      delayCorners: prev.delayCorners.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    }));
  };

  const removeDc = (id: string) => {
    setMmmc((prev) => ({
      ...prev,
      delayCorners: prev.delayCorners.filter((d) => d.id !== id),
      analysisViews: prev.analysisViews.filter((v) => v.delayCornerId !== id),
    }));
  };

  const updateMode = (id: string, patch: Partial<ConstraintMode>) => {
    setMmmc((prev) => ({
      ...prev,
      constraintModes: prev.constraintModes.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    }));
  };

  const removeMode = (id: string) => {
    setMmmc((prev) => ({
      ...prev,
      constraintModes: prev.constraintModes.filter((m) => m.id !== id),
      analysisViews: prev.analysisViews.filter((v) => v.constraintModeId !== id),
    }));
  };

  const updateView = (id: string, patch: Partial<AnalysisView>) => {
    setMmmc((prev) => ({
      ...prev,
      analysisViews: prev.analysisViews.map((v) =>
        v.id === id ? { ...v, ...patch } : v
      ),
    }));
  };

  const removeView = (id: string) => {
    setMmmc((prev) => ({
      ...prev,
      analysisViews: prev.analysisViews.filter((v) => v.id !== id),
    }));
  };

  const toggleMatrixCell = (
    cornerId: string,
    modeId: string,
    type: "setup" | "hold"
  ) => {
    setMmmc((prev) => {
      let views = [...prev.analysisViews];
      const existingIdx = views.findIndex(
        (v) => v.delayCornerId === cornerId && v.constraintModeId === modeId
      );
      const corner = prev.delayCorners.find((d) => d.id === cornerId);
      const mode = prev.constraintModes.find((m) => m.id === modeId);
      const viewName = `view_${mode?.name || "mode"}_${corner?.name || "corner"}`;

      if (existingIdx >= 0) {
        const v = views[existingIdx];
        let nextSetup = v.isSetup;
        let nextHold = v.isHold;
        if (type === "setup") nextSetup = !nextSetup;
        if (type === "hold") nextHold = !nextHold;
        if (!nextSetup && !nextHold) {
          views = views.filter((_, i) => i !== existingIdx);
        } else {
          views[existingIdx] = {
            ...v,
            isSetup: nextSetup,
            isHold: nextHold,
            // Innovus defaults: dynamic≈setup, leakage≈hold
            isDynamic: nextSetup ? v.isDynamic || nextSetup : v.isDynamic,
            isLeakage: nextHold ? v.isLeakage || nextHold : v.isLeakage,
            active: true,
          };
        }
      } else {
        views.push(
          createAnalysisView(prev, {
            name: viewName,
            delayCornerId: cornerId,
            constraintModeId: modeId,
            isSetup: type === "setup",
            isHold: type === "hold",
            isDynamic: type === "setup",
            isLeakage: type === "hold",
            active: true,
          })
        );
      }
      return { ...prev, analysisViews: views };
    });
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
          <div className="w-10 h-10 neu-panel bg-indigo-600 text-white flex items-center justify-center font-black rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              MMMC Studio
              <span className="neu-badge bg-indigo-100 text-indigo-900 border-indigo-600 text-[9px]">
                Configure → Generate
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-600">
              Build your multi-mode multi-corner file from user inputs, then download{" "}
              <code className="bg-slate-100 px-1 rounded">mmmc.tcl</code> / scenarios
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="neu-inset px-2 py-1 flex items-center gap-2 text-xs font-bold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <select
              onChange={(e) => {
                const p = MMMC_PRESETS.find((pr) => pr.name === e.target.value);
                if (p) loadPreset(p.state, p.name);
              }}
              defaultValue=""
              className="bg-white text-slate-900 outline-none cursor-pointer font-bold rounded px-1 border border-slate-300"
            >
              <option value="" disabled>
                Load preset…
              </option>
              {MMMC_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setMmmc(starterMmmcState());
              flash("Loaded Innovus-style starter (func setup/hold + opconds)");
              setActiveTab("configure");
            }}
            className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
          >
            New starter
          </button>
          <button
            type="button"
            onClick={() => {
              setMmmc(emptyMmmcState());
              flash("Cleared all — add modes, libs, RC, opconds, delay, views");
              setActiveTab("configure");
            }}
            className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
          >
            Clear all
          </button>

          <input
            ref={importRef}
            type="file"
            accept=".tcl,.txt,.mmmc"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => handleImportTcl(String(r.result || ""));
              r.readAsText(f);
            }}
          />
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="neu-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 bg-white text-slate-900"
          >
            <Upload className="w-3.5 h-3.5" />
            Import TCL
          </button>

          <div className="neu-inset p-1 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setVendor("cadence")}
              className={`px-2.5 py-1.5 rounded-lg ${
                vendor === "cadence"
                  ? "neu-btn-active text-indigo-800 font-black"
                  : "text-slate-600"
              }`}
            >
              Cadence
            </button>
            <button
              type="button"
              onClick={() => setVendor("synopsys")}
              className={`px-2.5 py-1.5 rounded-lg ${
                vendor === "synopsys"
                  ? "neu-btn-active text-sky-800 font-black"
                  : "text-slate-600"
              }`}
            >
              Synopsys
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="neu-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 bg-white text-slate-900"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            Copy TCL
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="neu-btn neu-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download {vendor === "cadence" ? "mmmc.tcl" : "scenarios.tcl"}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-5 max-w-7xl w-full mx-auto space-y-4">
        {/* Workflow strip */}
        <div className="neu-panel bg-white p-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-800">
          <span className="text-indigo-700 uppercase">Workflow</span>
          <span>1. Configure libs · RC · delay corners · SDC modes</span>
          <span>→</span>
          <span>2. Matrix: enable Setup/Hold views</span>
          <span>→</span>
          <span>3. Download generated TCL</span>
          <span className="ml-auto text-slate-500 font-bold">
            {state.librarySets.length} libs · {state.delayCorners.length} delay ·{" "}
            {state.constraintModes.length} modes · {state.analysisViews.filter((v) => v.active).length} active views
          </span>
        </div>

        <div className="neu-panel bg-white p-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["configure", "1. Configure inputs", Sliders],
                ["matrix", "2. Mode × Corner matrix", Grid],
                ["views", `Views (${state.analysisViews.length})`, Layers],
                ["script", "3. Generated TCL", FileText],
                [
                  "lint",
                  `Lint (${errorCount + warningCount})`,
                  AlertTriangle,
                ],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`neu-btn px-3 py-1.5 text-xs font-black flex items-center gap-2 ${
                  activeTab === id
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-800 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vlsi/sdc-studio"
              className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-purple-50 text-purple-900"
            >
              <ArrowRight className="w-3 h-3" /> SDC Studio
            </Link>
            <button
              type="button"
              onClick={() => {
                const reg = buildMmmcViewRegistry(state, "mmmc-studio");
                saveMmmcViewRegistry(reg);
                const active = state.analysisViews.filter((v) => v.active);
                const first =
                  active.find((v) => v.isSetup)?.name ||
                  active[0]?.name ||
                  "";
                const q = first
                  ? `?tab=paths&view=${encodeURIComponent(first)}`
                  : "?tab=paths";
                flash(
                  `Pushed ${reg.views.length} analysis view(s) → Timing Studio`
                );
                window.location.href = `/vlsi/timing-studio${q}`;
              }}
              className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-emerald-600 text-white"
              title="Save views to Timing and open path filter"
            >
              <ArrowRight className="w-3 h-3" /> Push views → Timing
            </button>
          </div>
        </div>

        {/* ========== CONFIGURE (user inputs) ========== */}
        {activeTab === "configure" && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-600">
              Build an Innovus-style MMMC: modes → libs → RC →{" "}
              <code className="bg-slate-100 px-1 rounded">create_opcond</code> → delay corners →
              views. Paths can be multi-line farm absolute paths. TCL is rebuilt live.
            </p>

            {/* Constraint modes first (matches farm script order) */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  Constraint modes{" "}
                  <span className="text-slate-400 font-bold">create_constraint_mode</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setMmmc((prev) => ({
                      ...prev,
                      constraintModes: [
                        ...prev.constraintModes,
                        createConstraintMode({
                          name: prev.constraintModes.length ? `mode_${prev.constraintModes.length + 1}` : "func",
                        }),
                      ],
                    }))
                  }
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-purple-600 text-white"
                >
                  <Plus className="w-3 h-3" /> Add mode
                </button>
              </div>

              {attachedSdcPayload && (
                <div className="p-3 bg-indigo-50 border-2 border-indigo-600 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-indigo-950">
                    <span>
                      SDC Studio transfer ready ·{" "}
                      {attachedSdcPayload.modeName || "func"} ·{" "}
                      {attachedSdcPayload.clockCount} clocks
                      {attachedSdcPayload.clockNames?.length
                        ? ` (${attachedSdcPayload.clockNames.slice(0, 4).join(", ")}${
                            attachedSdcPayload.clockNames.length > 4 ? "…" : ""
                          })`
                        : ""}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] text-slate-600"
                      onClick={() => {
                        clearSdcTransfer();
                        setAttachedSdcPayload(null);
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={createModeFromTransfer}
                      className="neu-btn px-2 py-1 text-[10px] font-black bg-emerald-600 text-white"
                    >
                      + Create new mode from SDC
                    </button>
                    {state.constraintModes.map((cm) => (
                      <button
                        key={cm.id}
                        type="button"
                        onClick={() => bindTransferToMode(cm.id)}
                        className="neu-btn px-2 py-1 text-[10px] font-black bg-indigo-600 text-white"
                      >
                        Bind → {cm.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sdcProjects.length > 0 && (
                <p className="text-[10px] font-bold text-slate-600">
                  {sdcProjects.length} SDC project pack(s) available from SDC Studio registry.
                  Use “Apply project…” on a mode, or open a mode in SDC Studio to edit.
                </p>
              )}

              <div className="space-y-2">
                {state.constraintModes.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-3 bg-slate-50 border-2 border-black rounded-lg space-y-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-3">
                        <label className={labelCls}>Mode name</label>
                        <input
                          className={inputCls}
                          value={cm.name}
                          onChange={(e) =>
                            updateMode(cm.id, { name: e.target.value })
                          }
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className={labelCls}>
                          SDC file paths (-sdc_files)
                        </label>
                        <PathListField
                          files={cm.sdcFiles}
                          multiline={false}
                          onCommit={(sdcFiles) => updateMode(cm.id, { sdcFiles })}
                          placeholder="top_func.sdc  io.sdc"
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => openModeInSdcStudio(cm.id)}
                          className="neu-btn px-2 py-1.5 text-[9px] font-black bg-purple-600 text-white"
                          title="Open this mode's SDC in SDC Studio"
                        >
                          Edit in SDC
                        </button>
                      </div>
                      <div className="md:col-span-1 flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => removeMode(cm.id)}
                          className="neu-btn p-2 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Link status + project picker */}
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold">
                      {cm.sdcSource === "studio" || cm.sdcProjectId ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-400">
                          Linked SDC Studio
                          {cm.linkedAt
                            ? ` · ${new Date(cm.linkedAt).toLocaleString()}`
                            : ""}
                        </span>
                      ) : cm.sdcText ? (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          Inline SDC
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-400">
                          No SDC body yet
                        </span>
                      )}
                      {(cm.clockCount ?? 0) > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-500">
                          {cm.clockCount} clock
                          {cm.clockCount === 1 ? "" : "s"}
                          {cm.clockNames?.length
                            ? `: ${cm.clockNames.slice(0, 5).join(", ")}${
                                cm.clockNames.length > 5 ? "…" : ""
                              }`
                            : ""}
                        </span>
                      )}
                      {sdcProjects.length > 0 && (
                        <select
                          className={`${inputCls} !w-auto max-w-[200px]`}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              applyProjectPackToMode(cm.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Apply project…</option>
                          {sdcProjects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.fileName}) · {p.clockCount} clk
                            </option>
                          ))}
                        </select>
                      )}
                      {cm.sdcText && (
                        <button
                          type="button"
                          className="neu-btn px-2 py-0.5 text-[9px] font-black bg-white text-slate-900"
                          onClick={() => {
                            const blob = new Blob([cm.sdcText || ""], {
                              type: "text/plain;charset=utf-8",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = cm.sdcFiles[0] || `${cm.name}.sdc`;
                            a.click();
                            URL.revokeObjectURL(url);
                            flash(`Downloaded ${a.download}`);
                          }}
                        >
                          Download .sdc
                        </button>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>
                        SDC text (from Studio attach or paste)
                      </label>
                      <textarea
                        className={`${inputCls} h-24 resize-y`}
                        value={cm.sdcText || ""}
                        onChange={(e) =>
                          updateMode(cm.id, {
                            sdcText: e.target.value || undefined,
                            sdcSource: e.target.value ? cm.sdcSource || "inline" : undefined,
                          })
                        }
                        placeholder="# paste constraints or Attach from SDC Studio"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Library sets */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Library className="w-4 h-4 text-indigo-600" />
                  Library sets <span className="text-slate-400 font-bold">create_library_set</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setMmmc((prev) => ({
                      ...prev,
                      librarySets: [
                        ...prev.librarySets,
                        createLibrarySet({ name: `lib_${prev.librarySets.length + 1}` }),
                      ],
                    }))
                  }
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-indigo-600 text-white"
                >
                  <Plus className="w-3 h-3" /> Add library set
                </button>
              </div>
              {state.librarySets.length === 0 && (
                <p className="text-[10px] font-bold text-rose-600">
                  Add at least one library set (.lib / .db paths as used on your farm).
                </p>
              )}
              <div className="space-y-2">
                {state.librarySets.map((ls) => (
                  <div
                    key={ls.id}
                    className="p-3 bg-slate-50 border-2 border-black rounded-lg space-y-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-3">
                        <label className={labelCls}>Name</label>
                        <input
                          className={inputCls}
                          value={ls.name}
                          onChange={(e) => updateLib(ls.id, { name: e.target.value })}
                          placeholder="ssgnp_0p72v_m40c"
                        />
                      </div>
                      <div className="md:col-span-8">
                        <label className={labelCls}>
                          Timing libs (.lib / .db paths)
                        </label>
                        <PathListField
                          files={ls.files}
                          onCommit={(files) => updateLib(ls.id, { files })}
                          placeholder={
                            "lib_a.lib lib_b.lib\nor one path per line / comma-separated"
                          }
                        />
                      </div>
                      <div className="md:col-span-1 flex items-start justify-end pt-5">
                        <button
                          type="button"
                          onClick={() => removeLib(ls.id)}
                          className="neu-btn p-2 text-rose-600"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500">
                      Emits multi-line <code>-timing [list …]</code> in mmmc.tcl
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* RC corners */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  RC corners <span className="text-slate-400 font-bold">create_rc_corner</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setMmmc((prev) => ({
                      ...prev,
                      rcCorners: [
                        ...prev.rcCorners,
                        createRcCorner({ name: `rc_${prev.rcCorners.length + 1}` }),
                      ],
                    }))
                  }
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-amber-500 text-black"
                >
                  <Plus className="w-3 h-3" /> Add RC corner
                </button>
              </div>
              <div className="space-y-2">
                {state.rcCorners.map((rc) => (
                  <div
                    key={rc.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-3">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={rc.name}
                        onChange={(e) => updateRc(rc.id, { name: e.target.value })}
                        placeholder="rcworst_m40c"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Temp °C</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={rc.temperatureC}
                        onChange={(e) =>
                          updateRc(rc.id, {
                            temperatureC: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className={labelCls}>QRC tech file path</label>
                      <input
                        className={inputCls}
                        value={rc.qrcTechFile || ""}
                        onChange={(e) =>
                          updateRc(rc.id, { qrcTechFile: e.target.value })
                        }
                        placeholder="/mnt/data/.../rcworst/Tech/rcworst/qrcTechFile"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeRc(rc.id)}
                        className="neu-btn p-2 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="md:col-span-11">
                      <label className={labelCls}>Cap table (optional)</label>
                      <input
                        className={inputCls}
                        value={rc.capTableFile || ""}
                        onChange={(e) =>
                          updateRc(rc.id, {
                            capTableFile: e.target.value || undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Operating conditions */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  Operating conditions{" "}
                  <span className="text-slate-400 font-bold">create_opcond</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setMmmc((prev) => ({
                      ...prev,
                      opConds: [
                        ...prev.opConds,
                        createOpCond({
                          name: `op_${prev.opConds.length + 1}`,
                          process: 1,
                          voltage: 0.8,
                          temperatureC: 25,
                        }),
                      ],
                    }))
                  }
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-emerald-600 text-white"
                >
                  <Plus className="w-3 h-3" /> Add opcond
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-600">
                Innovus: <code>create_opcond -name … -process -voltage -temperature</code>, then
                reference from delay corners via <code>-opcond</code>.
              </p>
              <div className="space-y-2">
                {state.opConds.map((op) => (
                  <div
                    key={op.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-4">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={op.name}
                        onChange={(e) => updateOp(op.id, { name: e.target.value })}
                        placeholder="ssgnp_op_worst_m40c"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Process</label>
                      <input
                        type="number"
                        step="0.01"
                        className={inputCls}
                        value={op.process}
                        onChange={(e) =>
                          updateOp(op.id, {
                            process: parseFloat(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Voltage (V)</label>
                      <input
                        type="number"
                        step="0.01"
                        className={inputCls}
                        value={op.voltage}
                        onChange={(e) =>
                          updateOp(op.id, {
                            voltage: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>Temp °C</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={op.temperatureC}
                        onChange={(e) =>
                          updateOp(op.id, {
                            temperatureC: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeOp(op.id)}
                        className="neu-btn p-2 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Delay corners */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  Delay corners{" "}
                  <span className="text-slate-400 font-bold">
                    create_delay_corner (lib + opcond + RC)
                  </span>
                </h3>
                <button
                  type="button"
                  disabled={!state.librarySets.length || !state.rcCorners.length}
                  onClick={() =>
                    setMmmc((prev) => ({
                      ...prev,
                      delayCorners: [
                        ...prev.delayCorners,
                        createDelayCorner(prev, {
                          name: `dc_${prev.delayCorners.length + 1}`,
                        }),
                      ],
                    }))
                  }
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-indigo-600 text-white disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" /> Add delay corner
                </button>
              </div>
              <div className="space-y-2">
                {state.delayCorners.map((dc) => (
                  <div
                    key={dc.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-3">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={dc.name}
                        onChange={(e) => updateDc(dc.id, { name: e.target.value })}
                        placeholder="ssgnp_setup_corner"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>Library set</label>
                      <select
                        className={inputCls}
                        value={dc.librarySetId}
                        onChange={(e) =>
                          updateDc(dc.id, { librarySetId: e.target.value })
                        }
                      >
                        <option value="">— select —</option>
                        {state.librarySets.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>Opcond</label>
                      <select
                        className={inputCls}
                        value={dc.opCondId || ""}
                        onChange={(e) =>
                          updateDc(dc.id, {
                            opCondId: e.target.value || undefined,
                            opCondName: e.target.value
                              ? state.opConds.find((o) => o.id === e.target.value)
                                  ?.name
                              : undefined,
                          })
                        }
                      >
                        <option value="">— none —</option>
                        {state.opConds.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.voltage}V / {o.temperatureC}C)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>RC corner</label>
                      <select
                        className={inputCls}
                        value={dc.rcCornerId}
                        onChange={(e) =>
                          updateDc(dc.id, { rcCornerId: e.target.value })
                        }
                      >
                        <option value="">— select —</option>
                        {state.rcCorners.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeDc(dc.id)}
                        className="neu-btn p-2 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className="neu-btn neu-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2"
              >
                Next: Mode × Corner matrix <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========== MATRIX ========== */}
        {activeTab === "matrix" && (
          <div className="space-y-4">
            <div className="neu-panel bg-white p-4 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-indigo-600" />
                Analysis views matrix
              </h3>
              <p className="text-[10px] font-bold text-slate-600">
                Rows = constraint modes · Columns = delay corners. Toggle{" "}
                <b>Setup</b> / <b>Hold</b> to create or remove analysis views. Script updates
                automatically.
              </p>

              {!state.delayCorners.length || !state.constraintModes.length ? (
                <div className="p-4 bg-amber-50 border-2 border-amber-500 text-xs font-bold text-amber-950">
                  Add delay corners and constraint modes in{" "}
                  <button
                    type="button"
                    className="underline font-black"
                    onClick={() => setActiveTab("configure")}
                  >
                    Configure inputs
                  </button>{" "}
                  first.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border-2 border-black">
                    <thead className="bg-slate-900 text-white font-black">
                      <tr>
                        <th className="p-2 border border-slate-600 text-left">
                          Mode \ Corner
                        </th>
                        {state.delayCorners.map((dc) => (
                          <th
                            key={dc.id}
                            className="p-2 border border-slate-600 text-center"
                          >
                            {dc.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.constraintModes.map((mode) => (
                        <tr key={mode.id} className="bg-white">
                          <td className="p-2 border border-slate-300 font-black text-slate-900">
                            {mode.name}
                          </td>
                          {state.delayCorners.map((dc) => {
                            const view = state.analysisViews.find(
                              (v) =>
                                v.delayCornerId === dc.id &&
                                v.constraintModeId === mode.id
                            );
                            const isSetup = !!view?.isSetup;
                            const isHold = !!view?.isHold;
                            return (
                              <td
                                key={dc.id}
                                className="p-2 border border-slate-300 text-center align-middle"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleMatrixCell(dc.id, mode.id, "setup")
                                      }
                                      className={`px-2.5 py-1 text-[10px] font-black rounded border-2 border-black ${
                                        isSetup
                                          ? "bg-indigo-600 text-white"
                                          : "bg-white text-slate-700"
                                      }`}
                                    >
                                      Setup
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleMatrixCell(dc.id, mode.id, "hold")
                                      }
                                      className={`px-2.5 py-1 text-[10px] font-black rounded border-2 border-black ${
                                        isHold
                                          ? "bg-amber-400 text-black"
                                          : "bg-white text-slate-700"
                                      }`}
                                    >
                                      Hold
                                    </button>
                                  </div>
                                  {view && (
                                    <span className="text-[8px] font-mono text-slate-600 truncate max-w-[140px]">
                                      {view.name}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("configure")}
                className="neu-btn px-3 py-2 text-xs font-black bg-white text-slate-900"
              >
                ← Edit inputs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("script")}
                className="neu-btn neu-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2"
              >
                View / download TCL <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========== VIEWS LIST ========== */}
        {activeTab === "views" && (
          <div className="neu-panel bg-white p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-900">
                Analysis views (editable)
              </h3>
              <button
                type="button"
                disabled={
                  !state.delayCorners.length || !state.constraintModes.length
                }
                onClick={() =>
                  setMmmc((prev) => ({
                    ...prev,
                    analysisViews: [
                      ...prev.analysisViews,
                      createAnalysisView(prev),
                    ],
                  }))
                }
                className="neu-btn px-2.5 py-1 text-[10px] font-black bg-indigo-600 text-white disabled:opacity-40"
              >
                <Plus className="w-3 h-3 inline" /> Add view
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-600">
              <code>set_analysis_view</code> lists: Setup / Hold / Leakage / Dynamic (Innovus
              often maps leakage→hold view, dynamic→setup view).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border-2 border-black">
                <thead className="bg-slate-900 text-white font-black">
                  <tr>
                    <th className="p-2 border border-slate-600 text-left">Name</th>
                    <th className="p-2 border border-slate-600">Delay corner</th>
                    <th className="p-2 border border-slate-600">Mode</th>
                    <th className="p-2 border border-slate-600">Setup</th>
                    <th className="p-2 border border-slate-600">Hold</th>
                    <th className="p-2 border border-slate-600">Leak</th>
                    <th className="p-2 border border-slate-600">Dyn</th>
                    <th className="p-2 border border-slate-600">Active</th>
                    <th className="p-2 border border-slate-600" />
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {state.analysisViews.map((v, i) => (
                    <tr
                      key={v.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="p-1.5 border border-slate-200">
                        <input
                          className={inputCls}
                          value={v.name}
                          onChange={(e) =>
                            updateView(v.id, { name: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-1.5 border border-slate-200">
                        <select
                          className={inputCls}
                          value={v.delayCornerId}
                          onChange={(e) =>
                            updateView(v.id, { delayCornerId: e.target.value })
                          }
                        >
                          {state.delayCorners.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5 border border-slate-200">
                        <select
                          className={inputCls}
                          value={v.constraintModeId}
                          onChange={(e) =>
                            updateView(v.id, {
                              constraintModeId: e.target.value,
                            })
                          }
                        >
                          {state.constraintModes.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-indigo-600"
                          checked={v.isSetup}
                          onChange={(e) =>
                            updateView(v.id, { isSetup: e.target.checked })
                          }
                        />
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-amber-500"
                          checked={v.isHold}
                          onChange={(e) =>
                            updateView(v.id, { isHold: e.target.checked })
                          }
                        />
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-rose-500"
                          checked={!!v.isLeakage}
                          onChange={(e) =>
                            updateView(v.id, { isLeakage: e.target.checked })
                          }
                          title="-leakage"
                        />
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-sky-500"
                          checked={!!v.isDynamic}
                          onChange={(e) =>
                            updateView(v.id, { isDynamic: e.target.checked })
                          }
                          title="-dynamic"
                        />
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-600"
                          checked={v.active}
                          onChange={(e) =>
                            updateView(v.id, { active: e.target.checked })
                          }
                        />
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center">
                        <button
                          type="button"
                          onClick={() => removeView(v.id)}
                          className="text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== SCRIPT ========== */}
        {activeTab === "script" && (
          <div className="neu-panel bg-white p-4 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Generated file ({vendor === "cadence" ? "mmmc.tcl" : "scenarios.tcl"})
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="neu-btn px-3 py-1.5 text-xs font-black bg-white text-slate-900"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="neu-btn neu-btn-primary px-3 py-1.5 text-xs font-black"
                >
                  Download
                </button>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-600">
              This file is generated from your configuration inputs above. Re-download after any edit.
            </p>
            <textarea
              readOnly
              value={generatedScript}
              className="w-full h-[28rem] p-4 font-mono text-xs bg-slate-900 text-emerald-100 rounded-xl border-2 border-black focus:outline-none"
            />
            <div className="space-y-1">
              <label className={labelCls}>Or paste existing MMMC TCL to import / edit</label>
              <textarea
                className={`${inputCls} h-28`}
                placeholder="Paste create_library_set / create_rc_corner / … here then click Import paste"
                id="mmmc-import-paste"
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(
                    "mmmc-import-paste"
                  ) as HTMLTextAreaElement | null;
                  if (el?.value) handleImportTcl(el.value);
                }}
                className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
              >
                Import paste into configurator
              </button>
            </div>
          </div>
        )}

        {/* ========== LINT ========== */}
        {activeTab === "lint" && (
          <div className="neu-panel bg-white p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Configuration lint
            </h3>
            {lintMessages.length > 0 ? (
              <div className="space-y-2">
                {lintMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border-2 text-xs font-bold space-y-1 ${
                      m.severity === "error"
                        ? "bg-rose-50 border-rose-600 text-rose-950"
                        : m.severity === "warning"
                        ? "bg-amber-50 border-amber-600 text-amber-950"
                        : "bg-sky-50 border-sky-600 text-sky-950"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      {m.severity === "error" ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : m.severity === "warning" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                      {m.message}
                    </div>
                    <p className="text-[11px] font-normal pl-6 text-slate-800">
                      <b>Fix:</b> {m.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-black text-xs rounded-lg flex items-center gap-2">
                <Check className="w-5 h-5" />
                Configuration looks consistent for generation.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


export default function MmmcStudioPageGate() {
  return (
    <VlsiStudioGate studio="mmmc">
      <MmmcStudioPage />
    </VlsiStudioGate>
  );
}
