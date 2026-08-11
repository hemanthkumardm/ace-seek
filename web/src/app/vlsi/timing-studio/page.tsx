"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Activity,
  Upload,
  BarChart2,
  List,
  AlertTriangle,
  Check,
  Info,
  Target,
  ArrowRight,
  Sparkles,
  Trash2,
  Play,
  FileText,
  Edit3,
  Sliders,
  Cpu,
  GitBranch,
  Layers,
  Clock,
  Box,
  Radio,
  Wrench,
  Download,
  Copy,
  Network,
  Maximize2,
  Loader2,
} from "lucide-react";
import {
  parseTimingReport,
  MOCK_STA_REPORTS,
  TimingStudioState,
  TimingPath,
  TimingVendor,
  applySolver,
  DEFAULT_SOLVER,
  SolverControls,
  SolverStage,
  getFlowGuidelines,
  buildWaveformModel,
  clockWaveformPath,
  FlowStage,
  generateEcoProposals,
  generateSessionEcoProposals,
  mergeSolverPatches,
  exportEcoScript,
  buildCellLadderCatalog,
  summarizeCatalog,
  EcoAction,
} from "@/lib/timing-engine";

import {
  createReportSession,
  addReportFile,
  switchActiveFile,
  removeReportFile,
  getActiveFile,
  type ReportSession,
  type IngestReportFile,
} from "@/lib/report-ingest-engine";

import {
  diffTimingStates,
  evaluateEcoEffectiveness,
  type TimingDiffResult,
  type PathDiffPair,
} from "@/lib/diff-engine-vlsi";

import { deriveCornerId } from "@/lib/corner-model";
import {
  type EcoVendor,
  exportVendorEcoScript,
  generateVendorEcoLine,
  vendorsForStage,
  defaultVendorForStage,
  isVendorValidForStage,
  vendorLabel,
} from "@/lib/eco-scripts";
import {
  loadEcoSession,
  saveEcoSession,
  clearEcoSession,
  computePredictedMetrics,
} from "@/lib/eco-session-model";
import {
  generateExportPack,
  downloadZipFile,
  downloadTextFile,
} from "@/lib/sdc-export-pack";
import { DEFAULT_SDC_STATE, normalizeSdcState, parseSdcText } from "@/lib/sdc-engine";
import {
  resolveDisplayDesignName,
  saveLastDesignName,
  loadLastSdcStateJson,
} from "@/lib/studio-shared";
import {
  faninCone,
  fanoutCone,
  exportCriticalConeTcl,
  serializeGraph,
  mergeGraphs,
  buildGraphFromTimingPaths,
  buildGraphFromSdc,
  type DesignGraph,
} from "@/lib/graph-engine";
import {
  applyMmmcViewTagging,
  countPathsByView,
  loadMmmcViewRegistry,
  type MmmcViewDescriptor,
  type MmmcViewRegistry,
} from "@/lib/mmmc-timing-bridge";
import {
  clearHubTransfer,
  loadHubTransfer,
} from "@/lib/report-hub-engine";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Sub-components: Schematic + Waveform
// ---------------------------------------------------------------------------

function PathSchematicView({ path }: { path: TimingPath }) {
  const nodes = path.schematic.nodes;
  if (!nodes.length) {
    return (
      <p className="text-[10px] font-bold text-slate-400 text-center py-6">
        No cell-level steps to draw a schematic for this path.
      </p>
    );
  }

  const W = Math.max(560, nodes.length * 88 + 40);
  const H = 140;
  const y = 70;
  const gap = (W - 60) / Math.max(1, nodes.length - 1 || 1);

  const roleColor = (role: string) => {
    switch (role) {
      case "ff":
        return { fill: "#fef3c7", stroke: "#d97706", text: "#92400e" };
      case "pad":
        return { fill: "#e0e7ff", stroke: "#4f46e5", text: "#3730a3" };
      case "port":
        return { fill: "#f1f5f9", stroke: "#475569", text: "#334155" };
      case "gate":
        return { fill: "#dbeafe", stroke: "#2563eb", text: "#1e40af" };
      default:
        return { fill: "#f8fafc", stroke: "#94a3b8", text: "#64748b" };
    }
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px] h-auto">
        {/* Edges */}
        {nodes.map((n, i) => {
          if (i === 0) return null;
          const x0 = 30 + (i - 1) * gap;
          const x1 = 30 + i * gap;
          const delay = n.delayNs;
          return (
            <g key={`e-${i}`}>
              <line
                x1={x0 + 28}
                y1={y}
                x2={x1 - 28}
                y2={y}
                stroke="#0f172a"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
              {delay > 0.001 && (
                <text
                  x={(x0 + x1) / 2}
                  y={y - 14}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="8"
                  fill="#64748b"
                >
                  {delay.toFixed(3)}ns
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
          </marker>
        </defs>
        {/* Nodes */}
        {nodes.map((n, i) => {
          const x = 30 + i * gap;
          const c = roleColor(n.role);
          const w = n.role === "ff" ? 52 : 48;
          const h = n.role === "ff" ? 36 : 32;
          return (
            <g key={n.id} transform={`translate(${x}, ${y})`}>
              <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                rx={n.role === "ff" ? 4 : 8}
                fill={n.isCritical ? "#fecdd3" : c.fill}
                stroke={n.isCritical ? "#e11d48" : c.stroke}
                strokeWidth={n.isCritical ? 2.5 : 2}
              />
              {n.role === "ff" && (
                <line
                  x1={-w / 2 + 8}
                  y1={h / 2}
                  x2={0}
                  y2={0}
                  stroke={c.stroke}
                  strokeWidth="1.5"
                />
              )}
              <text
                y={4}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill={c.text}
              >
                {(n.cell || n.role).slice(0, 10)}
              </text>
              <text
                y={h / 2 + 12}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill="#64748b"
              >
                {n.label.length > 14 ? n.label.slice(-14) : n.label}
              </text>
              {n.edge && (
                <text
                  y={-h / 2 - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="900"
                  fill="#7c3aed"
                >
                  {n.edge.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 text-[9px] font-bold text-slate-500">
        <span>
          Cell delay: <b className="text-slate-800">{path.cellDelayNs.toFixed(3)} ns</b>
        </span>
        <span>
          Net delay: <b className="text-slate-800">{path.netDelayNs.toFixed(3)} ns</b>
        </span>
        <span>
          Levels: <b className="text-slate-800">{path.levels}</b>
        </span>
        <span>
          Kind: <b className="text-slate-800">{path.pathKind}</b>
        </span>
      </div>
    </div>
  );
}

function TimingWaveformView({
  path,
  sim,
}: {
  path: TimingPath;
  sim: {
    arrivalTime: number;
    requiredTime: number;
    slack: number;
    inputDelay: number;
    dataPathDelay: number;
    outputDelay: number;
    captureClockLatency: number;
  };
}) {
  const wf = buildWaveformModel(path, sim);
  const padL = 70;
  const padR = 20;
  const svgW = 640;
  const innerW = svgW - padL - padR;
  const xOf = (t: number) =>
    padL + ((t - wf.tMin) / (wf.tMax - wf.tMin || 1)) * innerW;

  const launchPath = clockWaveformPath(
    wf.launchEdge,
    wf.period,
    wf.duty,
    wf.tMin,
    wf.tMax,
    xOf,
    28,
    48
  );
  const capturePath = clockWaveformPath(
    wf.captureEdge,
    wf.period,
    wf.duty,
    wf.tMin,
    wf.tMax,
    xOf,
    78,
    98
  );

  // Data eye: low until dataStart, transition, high until arrival marker
  const d0 = xOf(wf.dataStart);
  const dArr = xOf(wf.dataArrival);
  const dReq = xOf(wf.required);
  const dataYLow = 128;
  const dataYHigh = 112;

  const ticks: number[] = [];
  const span = wf.tMax - wf.tMin;
  const step = span > 5 ? 1 : span > 2 ? 0.5 : span > 0.5 ? 0.1 : 0.05;
  const t0 = Math.ceil(wf.tMin / step) * step;
  for (let t = t0; t <= wf.tMax + 1e-9; t += step) ticks.push(t);

  const viol = wf.slack < 0;

  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 640 210" className="w-full min-w-[520px] h-auto">
        {/* Grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={xOf(t)}
              y1={10}
              x2={xOf(t)}
              y2={175}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2,3"
            />
            <text
              x={xOf(t)}
              y={190}
              textAnchor="middle"
              className="font-mono"
              fontSize="8"
              fill="#94a3b8"
            >
              {t.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Launch clock */}
        <text x={8} y={40} fontSize="9" fontWeight="800" fill="#475569">
          Launch CLK
        </text>
        <path d={launchPath} fill="none" stroke="#0f172a" strokeWidth="2.5" />
        <line
          x1={xOf(wf.launchEdge)}
          y1={12}
          x2={xOf(wf.launchEdge)}
          y2={170}
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
        <text
          x={xOf(wf.launchEdge) + 3}
          y={18}
          fontSize="8"
          fontWeight="700"
          fill="#64748b"
        >
          launch {wf.launchEdge.toFixed(3)}
        </text>

        {/* Capture clock */}
        <text x={8} y={90} fontSize="9" fontWeight="800" fill="#2563eb">
          Capture CLK
        </text>
        <path d={capturePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />
        <line
          x1={xOf(wf.captureEdge)}
          y1={12}
          x2={xOf(wf.captureEdge)}
          y2={170}
          stroke="#3b82f6"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
        <text
          x={xOf(wf.captureEdge) + 3}
          y={62}
          fontSize="8"
          fontWeight="700"
          fill="#2563eb"
        >
          capture {wf.captureEdge.toFixed(3)}
        </text>

        {/* Data path stack bars */}
        <text x={8} y={122} fontSize="9" fontWeight="800" fill="#475569">
          Data path
        </text>
        {/* latency */}
        <rect
          x={xOf(wf.launchEdge)}
          y={120}
          width={Math.max(0, xOf(wf.launchClkLatEnd) - xOf(wf.launchEdge))}
          height={14}
          fill="#fef08a"
          stroke="#ca8a04"
          strokeWidth="1"
          opacity="0.85"
        />
        {/* input + drv */}
        <rect
          x={xOf(wf.launchClkLatEnd)}
          y={120}
          width={Math.max(0, xOf(wf.inputEnd) - xOf(wf.launchClkLatEnd))}
          height={14}
          fill="#fdba74"
          stroke="#ea580c"
          strokeWidth="1"
          opacity="0.85"
        />
        {/* combo data */}
        <rect
          x={xOf(wf.inputEnd)}
          y={120}
          width={Math.max(0, dArr - xOf(wf.inputEnd))}
          height={14}
          fill="#fca5a5"
          stroke="#dc2626"
          strokeWidth="1"
          opacity="0.85"
        />

        {/* Digital data waveform sketch */}
        <path
          d={`M ${xOf(wf.tMin)} ${dataYLow} L ${d0} ${dataYLow} L ${d0} ${dataYHigh} L ${dArr} ${dataYHigh}`}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2"
        />

        {/* Arrival / Required / Slack */}
        <line
          x1={dArr}
          y1={12}
          x2={dArr}
          y2={170}
          stroke={viol ? "#e11d48" : "#16a34a"}
          strokeWidth="2"
        />
        <line
          x1={dReq}
          y1={12}
          x2={dReq}
          y2={170}
          stroke={viol ? "#f43f5e" : "#15803d"}
          strokeWidth="2"
          strokeDasharray="4,2"
        />

        {viol ? (
          <g>
            <rect
              x={Math.min(dReq, dArr)}
              y={148}
              width={Math.abs(dArr - dReq)}
              height={18}
              fill="#fecdd3"
              stroke="#e11d48"
              strokeWidth="1"
              opacity="0.9"
            />
            <text
              x={(dReq + dArr) / 2}
              y={160}
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill="#be123c"
            >
              {path.type.toUpperCase()} VIOL {wf.slack.toFixed(3)} ns
            </text>
          </g>
        ) : (
          <g>
            <rect
              x={Math.min(dReq, dArr)}
              y={148}
              width={Math.max(4, Math.abs(dReq - dArr))}
              height={18}
              fill="#bbf7d0"
              stroke="#16a34a"
              strokeWidth="1"
              opacity="0.9"
            />
            <text
              x={(dReq + dArr) / 2}
              y={160}
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill="#15803d"
            >
              SLACK +{wf.slack.toFixed(3)} ns
            </text>
          </g>
        )}

        <text x={dArr + 4} y={175} fontSize="8" fontWeight="700" fill="#0f172a">
          arr {wf.dataArrival.toFixed(3)}
        </text>
        <text x={dReq + 4} y={18} fontSize="8" fontWeight="700" fill="#0f172a">
          req {wf.required.toFixed(3)}
        </text>

        {/* Legend */}
        <g transform="translate(70, 198)">
          <rect width="10" height="8" fill="#fef08a" stroke="#ca8a04" />
          <text x="14" y="7" fontSize="7" fill="#64748b">
            clk latency
          </text>
          <rect x="70" width="10" height="8" fill="#fdba74" stroke="#ea580c" />
          <text x="84" y="7" fontSize="7" fill="#64748b">
            input/drv
          </text>
          <rect x="140" width="10" height="8" fill="#fca5a5" stroke="#dc2626" />
          <text x="154" y="7" fontSize="7" fill="#64748b">
            combo data
          </text>
          <line x1="220" y1="4" x2="235" y2="4" stroke="#7c3aed" strokeWidth="2" />
          <text x="238" y="7" fontSize="7" fill="#64748b">
            data edge
          </text>
        </g>
      </svg>

      {/* Equation strip */}
      <div className="mt-2 neu-inset p-2 text-[9px] font-mono text-slate-600 space-y-0.5">
        {path.type === "setup" ? (
          <>
            <div>
              <b>Arrival</b> = launch({path.launchEdge.toFixed(3)}) + lat(
              {path.launchClockLatency.toFixed(3)}) + drv(
              {path.launchDrvAdjust.toFixed(3)}) + iDelay(
              {sim.inputDelay.toFixed(3)}) + data({sim.dataPathDelay.toFixed(3)}) ={" "}
              <b>{sim.arrivalTime.toFixed(3)} ns</b>
            </div>
            <div>
              <b>Required</b> = capture({path.captureEdge.toFixed(3)}) + lat(
              {sim.captureClockLatency.toFixed(3)}) − unc(
              {path.uncertainty.toFixed(3)}) − setup(
              {path.librarySetup.toFixed(3)}) − oDelay(
              {sim.outputDelay.toFixed(3)}) ={" "}
              <b>{sim.requiredTime.toFixed(3)} ns</b>
            </div>
            <div>
              <b>Slack</b> = required − arrival ={" "}
              <b className={viol ? "text-rose-600" : "text-emerald-600"}>
                {sim.slack.toFixed(3)} ns
              </b>
              {path.equationError > 0.02 && (
                <span className="text-amber-600">
                  {" "}
                  (report slack {path.reportedSlack.toFixed(3)}, Δeq{" "}
                  {path.equationError.toFixed(3)})
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <b>Hold Arrival</b> = {sim.arrivalTime.toFixed(3)} ns ·{" "}
              <b>Required</b> = {sim.requiredTime.toFixed(3)} ns
            </div>
            <div>
              <b>Hold Slack</b> = arrival − required ={" "}
              <b className={viol ? "text-rose-600" : "text-emerald-600"}>
                {sim.slack.toFixed(3)} ns
              </b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function InteractiveTimingStudioPage() {
  const [reportText, setReportText] = useState("");
  const [designNameOverride, setDesignNameOverride] = useState("");
  const [activeFilename, setActiveFilename] = useState("");
  const [debouncedReportText, setDebouncedReportText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [vendor, setVendor] = useState<TimingVendor>("auto");
  const [activeTab, setActiveTab] = useState<
    "summary" | "paths" | "violations" | "schematic" | "si" | "eco" | "compare"
  >("summary");
  const [selectedPathId, setSelectedPathId] = useState<string>("");
  const [selectedCorner, setSelectedCorner] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  /** B1.7: user-assigned MMMC analysis view for current report (tags all paths) */
  const [assignedViewName, setAssignedViewName] = useState<string>("");
  /** Per session-file view assignment */
  const [fileViewAssign, setFileViewAssign] = useState<Record<string, string>>({});
  const [mmmcRegistry, setMmmcRegistry] = useState<MmmcViewRegistry | null>(null);
  const [compareReportId, setCompareReportId] = useState<string>("");
  const [diffFilter, setDiffFilter] = useState<"all" | "regressed" | "improved" | "fixed" | "new_failing">("all");
  const [toast, setToast] = useState("");
  const [rawPopupOpen, setRawPopupOpen] = useState(false);
  const [rawPopupPinned, setRawPopupPinned] = useState(false);
  const rawHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<SolverStage>("synthesis");
  const [solver, setSolver] = useState<SolverControls>({ ...DEFAULT_SOLVER });
  const [ecoSelected, setEcoSelected] = useState<Record<string, boolean>>({});
  const [ecoVendor, setEcoVendor] = useState<EcoVendor>("genus");
  const [session, setSession] = useState<ReportSession>({ files: [], activeId: "" });

  // Load saved ECO session on mount
  useEffect(() => {
    const saved = loadEcoSession();
    if (saved) {
      if (saved.stage) setStage(saved.stage);
      if (saved.vendor) {
        const st = saved.stage || "synthesis";
        setEcoVendor(
          isVendorValidForStage(saved.vendor, st)
            ? saved.vendor
            : defaultVendorForStage(st)
        );
      }
      if (saved.selectedActionIds.length > 0) {
        const sel: Record<string, boolean> = {};
        saved.selectedActionIds.forEach((id) => (sel[id] = true));
        setEcoSelected(sel);
      }
    }
  }, []);

  // When flow stage changes, lock tool list to that stage
  useEffect(() => {
    if (!isVendorValidForStage(ecoVendor, stage)) {
      setEcoVendor(defaultVendorForStage(stage));
    }
  }, [stage, ecoVendor]);

  // Debounced parsing trigger (A6.2 & A6.3)
  useEffect(() => {
    if (reportText === debouncedReportText) {
      setIsParsing(false);
      return;
    }
    const isLarge = reportText.length > 2000;
    if (isLarge) setIsParsing(true);

    const timer = setTimeout(() => {
      setDebouncedReportText(reportText);
      setIsParsing(false);
    }, isLarge ? 400 : 100);

    return () => clearTimeout(timer);
  }, [reportText, debouncedReportText]);

  // B1.7: load MMMC analysis view registry (pushed from MMMC Studio)
  const refreshMmmcRegistry = () => {
    setMmmcRegistry(loadMmmcViewRegistry());
  };

  useEffect(() => {
    refreshMmmcRegistry();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ace_seek_mmmc_view_registry") refreshMmmcRegistry();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Deep links search params sync (A6.4 + B1.7 view= + B3 hub)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qTab = params.get("tab");
    const qPath = params.get("path");
    const qVendor = params.get("vendor");
    const qView = params.get("view");
    const fromHub = params.get("from_hub") === "true";

    if (qTab && ["summary", "paths", "violations", "schematic", "si", "eco", "compare"].includes(qTab)) {
      setActiveTab(qTab as any);
    }
    if (qPath) {
      setSelectedPathId(qPath);
    }
    if (qVendor && ["auto", "cadence", "synopsys", "opensta"].includes(qVendor)) {
      setVendor(qVendor as any);
    }
    if (qView) {
      setSelectedView(qView);
      setAssignedViewName(qView);
    }

    if (fromHub) {
      const transfer = loadHubTransfer();
      if (transfer?.text) {
        setReportText(transfer.text);
        setDebouncedReportText(transfer.text);
        setActiveFilename(transfer.filename || "hub_report.rpt");
        if (transfer.designName) setDesignNameOverride(transfer.designName);
        if (
          transfer.vendor &&
          ["auto", "cadence", "synopsys", "opensta"].includes(transfer.vendor)
        ) {
          setVendor(transfer.vendor as TimingVendor);
        }
        setIsAnalyzed(true);
        setSolver({ ...DEFAULT_SOLVER });
        setToast(
          `Loaded from Report Hub: ${transfer.filename || "report"}`
        );
        window.setTimeout(() => setToast(""), 2500);
        clearHubTransfer();
        const url = new URL(window.location.href);
        url.searchParams.delete("from_hub");
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let changed = false;

    if (activeTab && url.searchParams.get("tab") !== activeTab) {
      url.searchParams.set("tab", activeTab);
      changed = true;
    }
    if (selectedPathId && url.searchParams.get("path") !== selectedPathId) {
      url.searchParams.set("path", selectedPathId);
      changed = true;
    }
    if (vendor && url.searchParams.get("vendor") !== vendor) {
      url.searchParams.set("vendor", vendor);
      changed = true;
    }
    if (selectedView && selectedView !== "all") {
      if (url.searchParams.get("view") !== selectedView) {
        url.searchParams.set("view", selectedView);
        changed = true;
      }
    } else if (url.searchParams.has("view")) {
      url.searchParams.delete("view");
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, "", url.toString());
    }
  }, [activeTab, selectedPathId, vendor, selectedView]);

  const openRawPopup = () => {
    if (rawHoverTimer.current) {
      clearTimeout(rawHoverTimer.current);
      rawHoverTimer.current = null;
    }
    setRawPopupOpen(true);
  };

  const scheduleCloseRawPopup = () => {
    if (rawPopupPinned) return;
    if (rawHoverTimer.current) clearTimeout(rawHoverTimer.current);
    rawHoverTimer.current = setTimeout(() => setRawPopupOpen(false), 120);
  };

  const closeRawPopup = () => {
    setRawPopupPinned(false);
    setRawPopupOpen(false);
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const mmmcViews: MmmcViewDescriptor[] = useMemo(
    () => mmmcRegistry?.views ?? [],
    [mmmcRegistry]
  );

  const effectiveAssignedView = useMemo(() => {
    if (assignedViewName) return assignedViewName;
    if (session?.activeId && fileViewAssign[session.activeId]) {
      return fileViewAssign[session.activeId];
    }
    return "";
  }, [assignedViewName, fileViewAssign, session?.activeId]);

  const timingState: TimingStudioState = useMemo(() => {
    const raw = parseTimingReport(debouncedReportText, vendor);
    if (!raw.paths.length && !mmmcViews.length) return raw;
    return applyMmmcViewTagging(raw, {
      views: mmmcViews,
      assignedViewName: effectiveAssignedView || undefined,
      filename: activeFilename,
      // User assignment overrides report headers; auto-match only fills blanks
      overwriteExisting: !!effectiveAssignedView,
    });
  }, [
    debouncedReportText,
    vendor,
    mmmcViews,
    effectiveAssignedView,
    activeFilename,
  ]);

  const viewPathCounts = useMemo(
    () => countPathsByView(timingState.paths),
    [timingState.paths]
  );

  const displayDesignName = useMemo(() => {
    return (
      resolveDisplayDesignName({
        reportDesignName: timingState.designName,
        userOverride: designNameOverride,
        filename: activeFilename,
      }) || "—"
    );
  }, [timingState.designName, designNameOverride, activeFilename]);

  useEffect(() => {
    if (displayDesignName && displayDesignName !== "—") {
      saveLastDesignName(displayDesignName);
    }
  }, [displayDesignName]);

  // Sync stage + default tool from detected flow (once per analysis)
  useEffect(() => {
    if (!isAnalyzed) return;
    const fs = timingState.flowStage;
    let nextStage: SolverStage | null = null;
    if (fs === "synthesis" || fs === "pnr" || fs === "signoff") {
      nextStage = fs;
    } else if (timingState.toolName) {
      const t = timingState.toolName.toLowerCase();
      if (
        t.includes("genus") ||
        t.includes("design compiler") ||
        t.includes("dc_shell") ||
        t.includes("yosys")
      )
        nextStage = "synthesis";
      else if (
        t.includes("innovus") ||
        t.includes("icc") ||
        t.includes("openroad") ||
        t.includes("encounter")
      )
        nextStage = "pnr";
      else if (
        t.includes("primetime") ||
        t.includes("pt_shell") ||
        t.includes("tempus") ||
        t.includes("opensta")
      )
        nextStage = "signoff";
    }
    if (nextStage) {
      setStage(nextStage);
      setEcoVendor(defaultVendorForStage(nextStage));
    }
  }, [isAnalyzed, timingState.flowStage, timingState.toolName]);

  useEffect(() => {
    if (timingState.paths.length > 0) {
      const exists = timingState.paths.some((p) => p.id === selectedPathId);
      if (!exists) setSelectedPathId(timingState.paths[0].id);
    }
  }, [timingState.paths, selectedPathId]);

  // Close raw popup when switching paths or clearing analysis
  useEffect(() => {
    setRawPopupOpen(false);
    setRawPopupPinned(false);
    setEcoSelected({});
  }, [selectedPathId, isAnalyzed]);

  const selectedPath = useMemo(() => {
    return (
      timingState.paths.find((p) => p.id === selectedPathId) ||
      timingState.paths[0] ||
      null
    );
  }, [timingState, selectedPathId]);

  const solverResult = useMemo(() => {
    if (!selectedPath) return null;
    return applySolver(selectedPath, solver, stage);
  }, [selectedPath, solver, stage]);

  const guidelines = useMemo(() => {
    return getFlowGuidelines(
      selectedPath,
      stage,
      timingState.toolName
    );
  }, [selectedPath, stage, timingState.toolName]);

  const cellCatalog = useMemo(
    () => buildCellLadderCatalog(timingState.paths),
    [timingState.paths]
  );

  const pathEco = useMemo(() => {
    if (!selectedPath) return [] as EcoAction[];
    return generateEcoProposals(selectedPath, stage, {
      catalogPaths: timingState.paths,
    });
  }, [selectedPath, stage, timingState.paths]);

  const sessionEco = useMemo(() => {
    return generateSessionEcoProposals(timingState.paths, stage, 24);
  }, [timingState.paths, stage]);

  const activeEcoProposals = useMemo(() => {
    const list = selectedPath ? pathEco : sessionEco;
    return list.filter((a) => ecoSelected[a.id]);
  }, [selectedPath, pathEco, sessionEco, ecoSelected]);

  const predictedTimingMetrics = useMemo(() => {
    return computePredictedMetrics(timingState.paths, activeEcoProposals);
  }, [timingState.paths, activeEcoProposals]);

  // Auto-save active ECO session
  useEffect(() => {
    if (!timingState.paths.length) return;
    const selectedActionIds = Object.entries(ecoSelected)
      .filter(([, val]) => val)
      .map(([id]) => id);
    saveEcoSession({
      id: "session_active",
      name: `ECO Session (${stage})`,
      stage,
      vendor: ecoVendor,
      selectedActionIds,
      pathIds: timingState.paths.map((p) => p.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [ecoSelected, stage, ecoVendor, timingState.paths]);

  const [coneDepth, setConeDepth] = useState<number>(4);
  const [coneMode, setConeMode] = useState<"fanin" | "fanout" | "both">("fanin");

  const fullSessionGraph: DesignGraph = useMemo(() => {
    const timingGraph = buildGraphFromTimingPaths(timingState.paths);
    const sdcGraph = buildGraphFromSdc(DEFAULT_SDC_STATE);
    return mergeGraphs(timingGraph, sdcGraph);
  }, [timingState.paths]);

  const activeConeNodes = useMemo(() => {
    if (!selectedPath) return [];
    const targetPin = coneMode === "fanout" ? selectedPath.startpoint : selectedPath.endpoint;
    if (coneMode === "fanin") return faninCone(fullSessionGraph, targetPin, coneDepth);
    if (coneMode === "fanout") return fanoutCone(fullSessionGraph, targetPin, coneDepth);
    const inCone = faninCone(fullSessionGraph, targetPin, coneDepth);
    const outCone = fanoutCone(fullSessionGraph, targetPin, coneDepth);
    const combinedMap = new Map<string, (typeof inCone)[0]>();
    inCone.forEach((n) => combinedMap.set(n.id, n));
    outCone.forEach((n) => combinedMap.set(n.id, n));
    return Array.from(combinedMap.values());
  }, [selectedPath, coneMode, coneDepth, fullSessionGraph]);

  const histogramData = useMemo(() => {
    if (timingState.paths.length === 0) return [];
    const slacks = timingState.paths.map((p) => p.slack);
    const min = Math.min(...slacks);
    const max = Math.max(...slacks);
    const range = max - min || 1.0;
    const binWidth = range / 10;
    const bins = Array.from({ length: 10 }, (_, i) => ({
      min: min + i * binWidth,
      max: min + (i + 1) * binWidth,
      count: 0,
    }));
    slacks.forEach((s) => {
      let binIdx = Math.floor((s - min) / binWidth);
      if (binIdx >= 10) binIdx = 9;
      if (binIdx < 0) binIdx = 0;
      bins[binIdx].count++;
    });
    return bins;
  }, [timingState]);

  const filteredPaths = useMemo(() => {
    return timingState.paths.filter((p) => {
      if (selectedCorner !== "all") {
        const cId = deriveCornerId(p.corner || "");
        if (p.corner !== selectedCorner && cId !== selectedCorner) return false;
      }
      if (selectedView !== "all" && p.viewName !== selectedView) return false;
      if (selectedGroup !== "all" && p.pathGroup !== selectedGroup) return false;
      if (selectedType !== "all" && p.type !== selectedType) return false;
      return true;
    });
  }, [timingState.paths, selectedCorner, selectedView, selectedGroup, selectedType]);

  const handleParse = () => {
    if (!reportText.trim()) {
      flash("Please paste or upload a timing report first");
      return;
    }
    const state = parseTimingReport(reportText, vendor);
    if (state.paths.length === 0) {
      flash("Could not parse any valid timing paths. Try vendor=Auto or check format.");
      return;
    }
    setIsAnalyzed(true);
    setSolver({ ...DEFAULT_SOLVER });
    setSelectedPathId(state.paths[0].id);
    const tagged = applyMmmcViewTagging(state, {
      views: mmmcViews,
      assignedViewName: effectiveAssignedView || undefined,
      filename: activeFilename,
      overwriteExisting: !!effectiveAssignedView,
    });
    const nTagged = tagged.paths.filter((p) => p.viewName).length;
    flash(
      `Parsed ${state.paths.length} paths (${state.detectedVendor} · ${state.flowStage})` +
        (nTagged ? ` · ${nTagged} tagged with MMMC view` : "")
    );
  };

  const compareReportState = useMemo(() => {
    if (!compareReportId) return null;
    const file = session.files.find((f) => f.id === compareReportId);
    if (!file) return null;
    const raw = parseTimingReport(file.text, vendor);
    return applyMmmcViewTagging(raw, {
      views: mmmcViews,
      assignedViewName: fileViewAssign[file.id] || undefined,
      filename: file.filename,
      overwriteExisting: !!fileViewAssign[file.id],
    });
  }, [compareReportId, session.files, vendor, mmmcViews, fileViewAssign]);

  const timingDiff: TimingDiffResult | null = useMemo(() => {
    if (!compareReportState || !timingState.paths.length || !compareReportState.paths.length) {
      return null;
    }
    return diffTimingStates(timingState, compareReportState);
  }, [timingState, compareReportState]);

  const ecoVerification = useMemo(() => {
    if (!timingDiff || !sessionEco.length) return [];
    return evaluateEcoEffectiveness(sessionEco, timingDiff);
  }, [sessionEco, timingDiff]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = String(evt.target?.result || "");
        setSession((prev) => {
          const next = addReportFile(prev, file.name, text, vendor);
          const act = getActiveFile(next);
          if (act) {
            setReportText(act.text);
            setActiveFilename(act.filename || file.name);
            const state = parseTimingReport(act.text, vendor);
            if (state.paths.length > 0) {
              setIsAnalyzed(true);
              setSolver({ ...DEFAULT_SOLVER });
              setSelectedPathId(state.paths[0].id);
            }
          }
          return next;
        });
      };
      reader.readAsText(file);
    });
    flash(`Uploaded ${files.length} report file(s) into session`);
  };

  const handleSelectSessionFile = (fileId: string) => {
    const next = switchActiveFile(session, fileId);
    setSession(next);
    const act = getActiveFile(next);
    if (act) {
      setReportText(act.text);
      setActiveFilename(act.filename || "");
      // Restore per-file MMMC view assignment
      setAssignedViewName(fileViewAssign[fileId] || "");
      const state = parseTimingReport(act.text, vendor);
      setIsAnalyzed(state.paths.length > 0);
      if (state.paths.length > 0) setSelectedPathId(state.paths[0].id);
      flash(`Switched active report to ${act.filename}`);
    }
  };

  const handleAssignView = (viewName: string) => {
    setAssignedViewName(viewName);
    if (session.activeId) {
      setFileViewAssign((prev) => {
        const next = { ...prev };
        if (viewName) next[session.activeId] = viewName;
        else delete next[session.activeId];
        return next;
      });
    }
    if (viewName) {
      setSelectedView(viewName);
      flash(`Tagged report paths → analysis view "${viewName}"`);
    } else {
      flash("Cleared forced view assignment (auto-match / report headers)");
    }
  };

  const handleRemoveSessionFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = removeReportFile(session, fileId);
    setSession(next);
    const act = getActiveFile(next);
    if (act) {
      setReportText(act.text);
      const state = parseTimingReport(act.text, vendor);
      setIsAnalyzed(state.paths.length > 0);
      if (state.paths.length > 0) setSelectedPathId(state.paths[0].id);
    } else {
      setReportText("");
      setIsAnalyzed(false);
    }
  };

  const loadPreset = (presetName: "synopsys" | "cadence" | "opensta") => {
    setActiveFilename(`mock_${presetName}.rpt`);
    setDesignNameOverride("");
    setVendor(presetName);
    const text = MOCK_STA_REPORTS[presetName];
    setReportText(text);
    const fileName = `${presetName}_mock.rpt`;
    setSession((prev) => addReportFile(prev, fileName, text, presetName));
    setSelectedPathId("");
    setIsAnalyzed(true);
    setSolver({ ...DEFAULT_SOLVER });
    flash(`Loaded mock ${presetName} report`);
  };

  const clearReport = () => {
    setReportText("");
    setSelectedPathId("");
    setIsAnalyzed(false);
    setSession({ files: [], activeId: "" });
    setSolver({ ...DEFAULT_SOLVER });
    flash("Cleared report data");
  };

  const setCtrl = <K extends keyof SolverControls>(key: K, val: SolverControls[K]) => {
    setSolver((prev) => ({ ...prev, [key]: val }));
  };

  const stageLabel = (s: FlowStage | SolverStage) => {
    if (s === "synthesis") return "Synthesis";
    if (s === "pnr") return "Place & Route";
    if (s === "signoff") return "Signoff STA";
    return "Unknown";
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden p-3 md:p-5 gap-4 select-none">
      {/* TOP HEADER */}
      <header className="neu-panel p-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="neu-inset p-3 flex items-center justify-center text-amber-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">
                ASIC TIMING STUDIO
              </span>
              <span className="neu-badge text-[9px] font-black text-emerald-600">
                STA · SI · ECO
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Tool-Aware Path Analyzer · Waveforms · Schematic
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="neu-inset px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <select
              onChange={(e) => loadPreset(e.target.value as "synopsys" | "cadence" | "opensta")}
              value=""
              className="bg-white text-slate-900 outline-none cursor-pointer font-bold rounded px-1 border border-slate-300"
            >
              <option value="" disabled className="bg-white text-slate-900">
                Load Mock Report…
              </option>
              <option value="synopsys" className="bg-white text-slate-900">Synopsys PrimeTime</option>
              <option value="cadence" className="bg-white text-slate-900">Cadence Genus</option>
              <option value="opensta" className="bg-white text-slate-900">OpenSTA</option>
            </select>
          </div>

          <div className="neu-inset p-1 flex items-center gap-1 text-xs font-bold">
            {(
              [
                ["auto", "Auto"],
                ["synopsys", "Synopsys"],
                ["cadence", "Cadence"],
                ["opensta", "OpenSTA"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setVendor(id)}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  vendor === id
                    ? "neu-btn-active text-sky-600 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.rpt,.log"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="neu-btn px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            <span>Upload</span>
          </button>

          {isAnalyzed && (
            <button
              type="button"
              onClick={() => setIsAnalyzed(false)}
              className="neu-btn px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Input</span>
            </button>
          )}

          {reportText && (
            <button
              type="button"
              onClick={clearReport}
              className="neu-btn px-3.5 py-2 text-xs font-bold text-rose-600 flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* SESSION REPORT FILES TAB BAR */}
      {session.files.length > 0 && (
        <div className="neu-panel p-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1 shrink-0">
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            Session Reports ({session.files.length}):
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {session.files.map((file) => {
              const isActive = file.id === session.activeId;
              const vAssign = fileViewAssign[file.id];
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleSelectSessionFile(file.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border-2 transition shrink-0 ${
                    isActive
                      ? "bg-amber-100 border-amber-500 text-amber-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate max-w-[140px]">{file.filename}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                    {file.result.stage}
                  </span>
                  {vAssign && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-400 font-mono max-w-[100px] truncate"
                      title={`MMMC view: ${vAssign}`}
                    >
                      {vAssign}
                    </span>
                  )}
                  <span
                    onClick={(e) => handleRemoveSessionFile(file.id, e)}
                    className="hover:text-rose-600 text-slate-400 font-bold ml-1 text-sm leading-none"
                    title="Remove file"
                  >
                    ×
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* B1.7 MMMC analysis view link bar */}
      <div className="neu-panel p-2 flex flex-wrap items-center gap-2 shrink-0 border-b-2 border-black bg-indigo-50/60">
        <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider px-2 flex items-center gap-1 shrink-0">
          <Layers className="h-3.5 w-3.5 text-indigo-600" />
          MMMC views
        </span>
        {mmmcViews.length > 0 ? (
          <>
            <span className="text-[10px] font-bold text-slate-700">
              {mmmcViews.length} from MMMC Studio
              {mmmcRegistry?.savedAt
                ? ` · ${new Date(mmmcRegistry.savedAt).toLocaleTimeString()}`
                : ""}
            </span>
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-800">
              Tag report as
              <select
                value={effectiveAssignedView}
                onChange={(e) => handleAssignView(e.target.value)}
                className="bg-white text-slate-900 text-[11px] font-black rounded p-1.5 border-2 border-black outline-none cursor-pointer max-w-[220px]"
              >
                <option value="" className="bg-white text-slate-900">
                  Auto (header / filename / setup·hold)
                </option>
                {mmmcViews.map((v) => (
                  <option key={v.name} value={v.name} className="bg-white text-slate-900">
                    {v.name}
                    {v.isSetup ? " ·setup" : ""}
                    {v.isHold ? " ·hold" : ""}
                    {v.delayCornerName ? ` ·${v.delayCornerName}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                refreshMmmcRegistry();
                flash("Reloaded MMMC view registry");
              }}
              className="neu-btn px-2 py-1 text-[10px] font-black bg-white text-slate-900"
            >
              Refresh
            </button>
          </>
        ) : (
          <span className="text-[10px] font-bold text-slate-600">
            No views linked yet — configure MMMC Studio and they auto-sync here.
          </span>
        )}
        <Link
          href="/vlsi/mmmc-studio?tab=views"
          className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-indigo-600 text-white ml-auto"
        >
          Open MMMC Studio <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* PASTE STATE */}
      {!isAnalyzed && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 border-4 border-dashed border-slate-300 rounded-xl gap-6 overflow-y-auto">
          <div className="max-w-2xl text-center space-y-4">
            <h2 className="text-2xl font-black text-slate-700 uppercase tracking-tight">
              Paste or Upload Timing Report
            </h2>
            <p className="text-xs font-bold text-slate-500">
              Supports PrimeTime, Genus/Tempus, and OpenSTA path reports. Auto-detects
              vendor and flow stage (synthesis / PnR / signoff).
            </p>
          </div>
          <div className="w-full max-w-4xl flex flex-col gap-4">
            {isParsing && (
              <div className="neu-panel-sm p-3 bg-amber-100 border-2 border-amber-600 text-amber-950 font-black text-xs flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  <span>Parsing timing report ({reportText.length.toLocaleString()} chars)...</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-800">Debounced 400ms</span>
              </div>
            )}
            <textarea
              className="w-full h-80 p-4 border-3 border-black rounded-xl font-mono text-xs focus:outline-none shadow-[4px_4px_0_#000000] focus:shadow-[6px_6px_0_#000000] transition-all bg-white text-slate-800"
              placeholder={`Paste report_timing output here...

Startpoint: u_core/reg_a (rising edge-triggered flip-flop clocked by clk)
Endpoint: u_core/reg_b (rising edge-triggered flip-flop clocked by clk)
...`}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
            <div className="flex justify-between items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400">
                Tip: Load a mock report from the top bar to try the engine instantly.
              </span>
              <button
                type="button"
                onClick={handleParse}
                className="neu-btn neu-btn-primary px-6 py-2.5 text-xs font-black flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Parse Timing Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKBENCH */}
      {isAnalyzed && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
          {/* LEFT */}
          <div className="lg:col-span-8 flex flex-col min-h-0 overflow-hidden gap-4">
            {/* Tool / flow meta */}
            <div className="neu-panel p-4 grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 shrink-0">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> STA Tool
                </span>
                <p className="text-xs font-bold text-slate-700 truncate" title={timingState.toolName}>
                  {timingState.toolName || "Generic"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Flow Stage
                </span>
                <p className="text-xs font-bold text-purple-700">
                  {stageLabel(timingState.flowStage)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400">Vendor</span>
                <p className="text-xs font-bold text-slate-700 capitalize">
                  {timingState.detectedVendor}
                </p>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[9px] font-black uppercase text-slate-400">
                  Design{" "}
                  {designNameOverride
                    ? "(override)"
                    : timingState.designName
                    ? "(from report)"
                    : activeFilename
                    ? "(filename)"
                    : ""}
                </span>
                <input
                  type="text"
                  value={
                    designNameOverride !== ""
                      ? designNameOverride
                      : displayDesignName === "—"
                      ? ""
                      : displayDesignName
                  }
                  placeholder="Design name (from report / filename)"
                  onChange={(e) => setDesignNameOverride(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs font-bold border-2 border-black rounded px-2 py-1 outline-none truncate"
                  title="Per-session design name. Auto from Module:/Design: header or filename; edit to override."
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400">Corner / WL</span>
                <p className="text-xs font-bold text-slate-700 truncate">
                  {timingState.operatingConditions || timingState.wireloadMode || "—"}
                </p>
              </div>
            </div>

            <div className="neu-panel flex-1 flex flex-col min-h-0 overflow-hidden p-5 gap-4">
              {/* Tabs */}
              <div className="neu-inset p-1.5 flex items-center gap-1 text-xs font-bold shrink-0 overflow-x-auto">
                {(
                  [
                    ["summary", "Summary", BarChart2, null],
                    ["paths", "Paths & Wave", List, timingState.totalPaths],
                    ["schematic", "Schematic", GitBranch, null],
                    ["si", "SI / Noise", Radio, timingState.siSummary.highNoisePaths || null],
                    ["eco", "ECO", Wrench, timingState.failingCount || null],
                    ["violations", "Violations", AlertTriangle, timingState.failingCount],
                    ["compare", "Compare / Δ", GitBranch, compareReportId ? "Diff" : null],
                  ] as const
                ).map(([id, label, Icon, badge]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                      activeTab === id
                        ? "neu-btn-active text-amber-600 font-black shadow-inner"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    {badge !== null && (
                      <span
                        className={`neu-badge text-[10px] ${
                          id === "violations" || id === "si" || id === "eco"
                            ? "text-rose-600 bg-rose-100 border-rose-300"
                            : "text-slate-600"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {/* SUMMARY */}
                {activeTab === "summary" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="neu-panel-sm p-4 bg-[#f4f7fb] space-y-1.5 border-l-4 border-l-sky-500">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          WNS Setup
                        </p>
                        <p
                          className={`text-xl font-black ${
                            timingState.wns < 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {timingState.wns.toFixed(3)} ns
                        </p>
                      </div>
                      <div className="neu-panel-sm p-4 bg-[#f4f7fb] space-y-1.5 border-l-4 border-l-purple-500">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          TNS Setup
                        </p>
                        <p
                          className={`text-xl font-black ${
                            timingState.tns < 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {timingState.tns.toFixed(3)} ns
                        </p>
                      </div>
                      <div className="neu-panel-sm p-4 bg-[#f4f7fb] space-y-1.5 border-l-4 border-l-amber-500">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          WNS Hold
                        </p>
                        <p
                          className={`text-xl font-black ${
                            timingState.wnsHold < 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {timingState.wnsHold.toFixed(3)} ns
                        </p>
                      </div>
                      <div className="neu-panel-sm p-4 bg-[#f4f7fb] space-y-1.5 border-l-4 border-l-rose-500">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          Violations
                        </p>
                        <p className="text-xl font-black text-rose-600">
                          {timingState.failingCount}
                          <span className="text-[10px] font-bold text-slate-400 ml-1">
                            ({timingState.failingSetup}S / {timingState.failingHold}H)
                          </span>
                        </p>
                      </div>
                    </div>

                    {Object.keys(viewPathCounts).length > 0 && (
                      <div className="neu-panel bg-white p-4 space-y-2">
                        <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          Timing by analysis view (MMMC)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Object.entries(viewPathCounts).map(([name, c]) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setSelectedView(name === "(untagged)" ? "all" : name);
                                setActiveTab("paths");
                              }}
                              className="text-left p-3 border-2 border-black rounded-lg bg-slate-50 hover:bg-indigo-50"
                            >
                              <div className="text-[11px] font-black text-indigo-900 truncate">
                                {name}
                              </div>
                              <div className="text-[10px] font-bold text-slate-600 mt-1">
                                {c.total} paths · {c.failing} fail · WNS{" "}
                                <span
                                  className={
                                    c.wns < 0 ? "text-rose-600" : "text-emerald-600"
                                  }
                                >
                                  {c.wns.toFixed(3)} ns
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {timingState.pathGroups.length > 0 && (
                      <div className="neu-panel-sm p-3 flex flex-wrap gap-2 items-center">
                        <span className="text-[9px] font-black uppercase text-slate-400">
                          Path groups:
                        </span>
                        {timingState.pathGroups.map((g) => (
                          <span key={g} className="neu-badge text-[10px] font-bold">
                            {g}
                          </span>
                        ))}
                        <span className="text-[9px] font-black uppercase text-slate-400 ml-2">
                          Clocks:
                        </span>
                        {timingState.clocks.map((c) => (
                          <span
                            key={c}
                            className="neu-badge text-[10px] font-bold text-sky-700 bg-sky-50"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {timingState.corners.length > 0 && (
                      <div className="neu-panel-sm p-4 bg-slate-50 space-y-3 border-2 border-black">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-indigo-700 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            Multi-Corner Operating Conditions ({timingState.corners.length} Corners)
                          </span>
                          {selectedCorner !== "all" && (
                            <button
                              type="button"
                              onClick={() => setSelectedCorner("all")}
                              className="text-[9px] font-black text-sky-600 hover:underline uppercase"
                            >
                              Reset Corner Filter
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {timingState.corners.map((c) => {
                            const isMet = c.wns >= 0;
                            const isSelected = selectedCorner === c.id || selectedCorner === c.name;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCorner(isSelected ? "all" : c.id);
                                  setActiveTab("paths");
                                }}
                                className={`p-3 rounded-lg border-2 border-black text-left transition-all shadow-[2px_2px_0_#000] text-xs ${
                                  isSelected
                                    ? "bg-amber-100 border-amber-500 shadow-[3px_3px_0_#b45309]"
                                    : isMet
                                    ? "bg-white hover:bg-emerald-50"
                                    : "bg-rose-50 hover:bg-rose-100"
                                }`}
                              >
                                <div className="font-black text-slate-800 flex items-center justify-between gap-2">
                                  <span className="truncate max-w-[180px]" title={c.name}>{c.name}</span>
                                  {c.operatingCondition?.voltageV !== undefined && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                      {c.operatingCondition.voltageV}V · {c.operatingCondition.tempC ?? "?"}°C
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between font-mono mt-2 text-[10px]">
                                  <span className={isMet ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                                    WNS: {c.wns.toFixed(3)} ns
                                  </span>
                                  <span className="text-slate-500">TNS: {c.tns.toFixed(3)} ns</span>
                                  <span className="text-slate-400 font-sans font-bold">({c.pathCount} paths)</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {timingState.paths.length > 0 && (
                      <div className="neu-panel-sm p-4 bg-[#f4f7fb] space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-amber-500" />
                          Slack Distribution
                        </h4>
                        <div className="neu-inset p-3 bg-white h-48 flex items-end justify-between gap-1">
                          {(() => {
                            const maxCount =
                              Math.max(...histogramData.map((d) => d.count)) || 1;
                            return histogramData.map((d, i) => {
                              const pct = (d.count / maxCount) * 100;
                              const isViolated = d.max <= 0;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                                >
                                  <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white font-mono text-[9px] px-2 py-1 rounded shadow-lg z-10 w-28 text-center pointer-events-none">
                                    {d.min.toFixed(3)} → {d.max.toFixed(3)} ns
                                    <div className="font-black text-amber-400">
                                      Paths: {d.count}
                                    </div>
                                  </div>
                                  <div
                                    style={{ height: `${Math.max(4, pct)}%` }}
                                    className={`w-full rounded-t border border-black transition-all ${
                                      isViolated
                                        ? "bg-rose-400 shadow-[2px_2px_0_#000000]"
                                        : "bg-emerald-400 shadow-[2px_2px_0_#000000]"
                                    } group-hover:brightness-110`}
                                  />
                                  <span className="text-[8px] font-black text-slate-400 mt-1 truncate max-w-full">
                                    {d.min.toFixed(2)}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* SI snapshot */}
                    <div className="neu-panel-sm p-3 flex flex-wrap gap-4 items-center text-[10px] font-bold">
                      <span className="text-slate-400 uppercase font-black">SI / Noise</span>
                      <span>
                        Report SI paths:{" "}
                        <b className="text-fuchsia-700">{timingState.siSummary.pathsWithReportedSi}</b>
                      </span>
                      <span>
                        High noise:{" "}
                        <b className="text-amber-700">{timingState.siSummary.highNoisePaths}</b>
                      </span>
                      <span>
                        Avg SI frac:{" "}
                        <b>{(timingState.siSummary.avgSiFraction * 100).toFixed(1)}%</b>
                      </span>
                      <button
                        type="button"
                        className="neu-btn px-2 py-1 text-[9px] font-black"
                        onClick={() => setActiveTab("si")}
                      >
                        Open SI
                      </button>
                      <button
                        type="button"
                        className="neu-btn px-2 py-1 text-[9px] font-black"
                        onClick={() => setActiveTab("eco")}
                      >
                        Open ECO
                      </button>
                    </div>

                    {/* Path kind breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(["reg2reg", "in2reg", "reg2out", "in2out"] as const).map((k) => {
                        const n = timingState.paths.filter((p) => p.pathKind === k).length;
                        return (
                          <div
                            key={k}
                            className="neu-inset p-2 text-center"
                          >
                            <p className="text-[9px] font-black uppercase text-slate-400">
                              {k}
                            </p>
                            <p className="text-sm font-black text-slate-700">{n}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PATHS + WAVEFORM */}
                {activeTab === "paths" && (
                  <div className="space-y-6">
                    {selectedPath && solverResult && (
                      <div className="neu-panel-sm p-4 bg-[#f4f7fb] space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-600 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            STA Waveform ({selectedPath.type}) · {selectedPath.clock}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ns · period≈
                            {(
                              selectedPath.captureEdge - selectedPath.launchEdge ||
                              selectedPath.captureEdge ||
                              0
                            ).toFixed(3)}
                          </span>
                        </h4>
                        <div className="neu-inset p-3 bg-white">
                          <TimingWaveformView
                            path={selectedPath}
                            sim={{
                              arrivalTime: solverResult.arrivalTime,
                              requiredTime: solverResult.requiredTime,
                              slack: solverResult.slack,
                              inputDelay: solverResult.inputDelay,
                              dataPathDelay: solverResult.dataPathDelay,
                              outputDelay: solverResult.outputDelay,
                              captureClockLatency: solverResult.captureClockLatency,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                          <span>Available Paths ({filteredPaths.length} / {timingState.paths.length})</span>
                        </h4>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Corner filter */}
                          {timingState.corners.length > 0 && (
                            <select
                              value={selectedCorner}
                              onChange={(e) => setSelectedCorner(e.target.value)}
                              className="bg-white text-slate-900 text-[11px] font-black rounded p-1.5 border-2 border-black shadow-[2px_2px_0_#000] outline-none cursor-pointer"
                            >
                              <option value="all" className="bg-white text-slate-900">
                                All Corners ({timingState.corners.length})
                              </option>
                              {timingState.corners.map((c) => (
                                <option key={c.id} value={c.id} className="bg-white text-slate-900">
                                  {c.name} (WNS {c.wns.toFixed(2)})
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Analysis View filter (report + MMMC registry) */}
                          {(timingState.analysisViews.length > 0 || mmmcViews.length > 0) && (
                            <select
                              value={selectedView}
                              onChange={(e) => setSelectedView(e.target.value)}
                              className="bg-white text-slate-900 text-[11px] font-black rounded p-1.5 border-2 border-black shadow-[2px_2px_0_#000] outline-none cursor-pointer max-w-[260px]"
                              title="Filter paths by MMMC analysis view"
                            >
                              <option value="all" className="bg-white text-slate-900">
                                All Views ({timingState.analysisViews.length || mmmcViews.length})
                              </option>
                              {timingState.analysisViews.map((v) => {
                                const c = viewPathCounts[v];
                                return (
                                  <option key={v} value={v} className="bg-white text-slate-900">
                                    {v}
                                    {c
                                      ? ` (${c.total} paths · WNS ${c.wns.toFixed(2)})`
                                      : ""}
                                  </option>
                                );
                              })}
                            </select>
                          )}

                          {/* Path Group filter */}
                          {timingState.pathGroups.length > 1 && (
                            <select
                              value={selectedGroup}
                              onChange={(e) => setSelectedGroup(e.target.value)}
                              className="bg-white text-slate-900 text-[11px] font-black rounded p-1.5 border-2 border-black shadow-[2px_2px_0_#000] outline-none cursor-pointer"
                            >
                              <option value="all" className="bg-white text-slate-900">
                                All Path Groups
                              </option>
                              {timingState.pathGroups.map((g) => (
                                <option key={g} value={g} className="bg-white text-slate-900">
                                  {g}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Check type filter */}
                          <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="bg-white text-slate-900 text-[11px] font-black rounded p-1.5 border-2 border-black shadow-[2px_2px_0_#000] outline-none cursor-pointer"
                          >
                            <option value="all" className="bg-white text-slate-900">
                              Setup & Hold
                            </option>
                            <option value="setup" className="bg-white text-slate-900">
                              Setup (max)
                            </option>
                            <option value="hold" className="bg-white text-slate-900">
                              Hold (min)
                            </option>
                          </select>
                        </div>
                      </div>

                      {filteredPaths.length === 0 ? (
                        <div className="neu-panel-sm p-6 text-center text-slate-400 font-bold text-xs">
                          No paths match the selected filters.
                        </div>
                      ) : (
                        filteredPaths.map((p) => {
                          const isViolated = p.slack < 0;
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPathId(p.id)}
                              className={`p-3 border-2 border-black rounded-lg cursor-pointer transition-all shadow-[3px_3px_0_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] ${
                                selectedPathId === p.id
                                  ? "bg-amber-100 border-amber-500 shadow-[4px_4px_0_#b45309]"
                                  : isViolated
                                  ? "bg-rose-50 hover:bg-rose-100/50"
                                  : "bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1.5 mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isViolated ? "bg-rose-500" : "bg-emerald-500"
                                    }`}
                                  />
                                  {p.id} · {p.type} · {p.pathKind}
                                  {p.viewName && (
                                    <span
                                      className="bg-violet-100 text-violet-900 font-black px-1.5 py-0.5 rounded text-[9px] border border-violet-400"
                                      title="MMMC analysis view"
                                    >
                                      view:{p.viewName}
                                    </span>
                                  )}
                                  {p.corner && p.corner !== "default_corner" && (
                                    <span className="bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.5 rounded text-[9px] border border-indigo-300">
                                      {p.corner}
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`text-xs font-black ${
                                    isViolated ? "text-rose-600" : "text-emerald-600"
                                  }`}
                                >
                                  {p.slack.toFixed(3)} ns
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 min-w-0">
                                <span className="truncate flex-1" title={p.startpoint}>
                                  {p.startpoint}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate flex-1" title={p.endpoint}>
                                  {p.endpoint}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-[9px] font-bold text-slate-400">
                                <span>arr {p.arrivalTime.toFixed(3)}</span>
                                <span>req {p.requiredTime.toFixed(3)}</span>
                                <span>levels {p.levels}</span>
                                <span>grp {p.pathGroup}</span>
                                {p.si.siDeltaNs > 0.001 && (
                                  <span className="text-fuchsia-600">
                                    SI {p.si.siDeltaNs.toFixed(3)}
                                    {p.si.hasReportedSi ? "" : "~"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* SCHEMATIC & GRAPH ENGINE */}
                {activeTab === "schematic" && (
                  <div className="space-y-4">
                    {/* Design graph backbone header with export */}
                    <div className="neu-panel-sm p-3 bg-white border-2 border-black flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-slate-800">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-black uppercase text-indigo-700 flex items-center gap-1">
                          <Network className="w-3.5 h-3.5 text-indigo-600" />
                          Merged Graph Backbone
                        </span>
                        <span>
                          Nodes: <b>{fullSessionGraph.nodes.size}</b>
                        </span>
                        <span>
                          Edges: <b>{fullSessionGraph.edges.length}</b>
                        </span>
                        <span>
                          Domains: <b>{fullSessionGraph.domains.length}</b>
                        </span>
                      </div>

                      {/* Download graph.json button */}
                      <button
                        type="button"
                        className="neu-btn px-2.5 py-1 text-[9px] font-black flex items-center gap-1 bg-slate-100 hover:bg-slate-200"
                        onClick={() => {
                          const jsonStr = serializeGraph(fullSessionGraph);
                          downloadTextFile(jsonStr, "design_graph.json");
                          flash("Downloaded design_graph.json");
                        }}
                      >
                        <Download className="w-3 h-3 text-slate-700" />
                        Download graph.json
                      </button>
                    </div>

                    {selectedPath ? (
                      <>
                        <div className="neu-panel-sm p-4 bg-[#f4f7fb] space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
                            <GitBranch className="w-4 h-4 text-indigo-500" />
                            Path Schematic · {selectedPath.startpoint} →{" "}
                            {selectedPath.endpoint}
                          </h4>
                          <p className="text-[9px] font-bold text-slate-500">
                            Built from shared design graph (path subgraph).
                          </p>
                          <div className="neu-inset p-3 bg-white">
                            <PathSchematicView path={selectedPath} />
                          </div>
                        </div>

                        {/* Fanin / Fanout Cone Analysis Sub-Panel */}
                        <div className="neu-panel-sm p-4 bg-slate-50 border-2 border-black space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <div>
                              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                                <Maximize2 className="w-3.5 h-3.5 text-orange-600" />
                                Logic Cone Query & Critical Cone Export
                              </h4>
                              <p className="text-[9px] font-bold text-slate-500">
                                Cone from pin ({coneMode === "fanout" ? selectedPath.startpoint : selectedPath.endpoint}) up to depth {coneDepth}.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Mode selection */}
                              <select
                                value={coneMode}
                                onChange={(e) => setConeMode(e.target.value as "fanin" | "fanout" | "both")}
                                className="bg-white text-slate-900 text-[10px] font-black uppercase rounded p-1 border-2 border-black outline-none cursor-pointer"
                              >
                                <option value="fanin">Fanin Cone</option>
                                <option value="fanout">Fanout Cone</option>
                                <option value="both">Both Cones</option>
                              </select>

                              {/* Depth Slider */}
                              <div className="flex items-center gap-1 bg-white p-1 rounded border-2 border-black">
                                <span className="text-[9px] font-black uppercase text-slate-500">Depth N:</span>
                                <input
                                  type="range"
                                  min={1}
                                  max={16}
                                  value={coneDepth}
                                  onChange={(e) => setConeDepth(parseInt(e.target.value, 10))}
                                  className="w-16 accent-indigo-600 cursor-pointer"
                                />
                                <span className="text-[10px] font-black font-mono text-indigo-700 w-4 text-center">
                                  {coneDepth}
                                </span>
                              </div>

                              {/* Export Critical Cone TCL button */}
                              <button
                                type="button"
                                className="neu-btn px-2.5 py-1 text-[9px] font-black flex items-center gap-1 bg-amber-50 border-amber-600 text-amber-900 hover:bg-amber-100"
                                onClick={async () => {
                                  const tcl = exportCriticalConeTcl(activeConeNodes, "critical_cone", ecoVendor);
                                  try {
                                    await navigator.clipboard.writeText(tcl);
                                    flash(`Copied Critical Cone PnR TCL for ${ecoVendor.toUpperCase()}`);
                                  } catch {
                                    flash("Copy failed");
                                  }
                                }}
                              >
                                <Copy className="w-3 h-3 text-amber-700" />
                                Copy PnR Path Group
                              </button>
                            </div>
                          </div>

                          {/* Cone instances / nodes table */}
                          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                            <table className="w-full text-[10px] text-left border-collapse border border-slate-300">
                              <thead className="bg-slate-200 text-slate-800 font-black">
                                <tr>
                                  <th className="p-1.5 border border-slate-300">#</th>
                                  <th className="p-1.5 border border-slate-300">Pin / Node ID</th>
                                  <th className="p-1.5 border border-slate-300">Kind</th>
                                  <th className="p-1.5 border border-slate-300">Cell</th>
                                  <th className="p-1.5 border border-slate-300 text-right">Delay (ns)</th>
                                  <th className="p-1.5 border border-slate-300 text-right">Fanout</th>
                                </tr>
                              </thead>
                              <tbody className="font-mono text-[9px]">
                                {activeConeNodes.length > 0 ? (
                                  activeConeNodes.slice(0, 40).map((n, idx) => (
                                    <tr key={n.id} className="hover:bg-indigo-50/60 border-b border-slate-200">
                                      <td className="p-1 border border-slate-200 text-slate-400">{idx + 1}</td>
                                      <td className="p-1 border border-slate-200 font-bold text-slate-900 truncate max-w-[200px]">
                                        {n.id}
                                      </td>
                                      <td className="p-1 border border-slate-200 uppercase text-indigo-700 font-bold">
                                        {n.kind}
                                      </td>
                                      <td className="p-1 border border-slate-200 text-slate-600">
                                        {n.cell || "—"}
                                      </td>
                                      <td className="p-1 border border-slate-200 text-right text-slate-900 font-bold tabular-nums">
                                        {(n.delayNs || 0).toFixed(3)}
                                      </td>
                                      <td className="p-1 border border-slate-200 text-right text-slate-600 tabular-nums">
                                        {n.fanout ?? "—"}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="p-3 text-center text-slate-400 font-bold">
                                      No cone nodes discovered within depth {coneDepth}.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="neu-panel-sm p-3 overflow-x-auto bg-white">
                          <table className="w-full text-[10px] text-left border-collapse border-2 border-black">
                            <thead className="bg-slate-800 text-white font-black">
                              <tr>
                                <th className="p-2 border border-slate-600">#</th>
                                <th className="p-2 border border-slate-600">Point</th>
                                <th className="p-2 border border-slate-600">Cell</th>
                                <th className="p-2 border border-slate-600">Dir</th>
                                <th className="p-2 border border-slate-600 text-right">Incr (ns)</th>
                                <th className="p-2 border border-slate-600 text-right">Path (ns)</th>
                                <th className="p-2 border border-slate-600">Kind</th>
                              </tr>
                            </thead>
                            <tbody className="font-bold">
                              {selectedPath.steps
                                .filter((s) => s.kind !== "summary")
                                .map((s, i) => {
                                  const hot = s.incr > 0.1;
                                  const warm = s.incr > 0.05 && !hot;
                                  return (
                                    <tr
                                      key={i}
                                      className={`${
                                        i % 2 === 0 ? "bg-white" : "bg-slate-50"
                                      } hover:bg-sky-50 border-b border-slate-200`}
                                    >
                                      <td className="p-1.5 border border-slate-200 font-mono text-slate-500">
                                        {i + 1}
                                      </td>
                                      <td className="p-1.5 border border-slate-200 font-mono text-slate-900 break-all max-w-[180px]">
                                        {s.point}
                                      </td>
                                      <td className="p-1.5 border border-slate-200 font-mono text-indigo-800">
                                        {s.cell || "—"}
                                      </td>
                                      <td className="p-1.5 border border-slate-200 text-violet-700 uppercase font-black">
                                        {s.dir || "—"}
                                      </td>
                                      <td
                                        className={`p-1.5 border border-slate-200 font-mono text-right tabular-nums ${
                                          hot
                                            ? "bg-rose-600 text-white font-black"
                                            : warm
                                            ? "bg-amber-200 text-amber-950 font-black"
                                            : "bg-emerald-50 text-slate-900"
                                        }`}
                                      >
                                        {s.incr.toFixed(3)}
                                      </td>
                                      <td className="p-1.5 border border-slate-200 font-mono text-right tabular-nums text-slate-900 bg-slate-100 font-black">
                                        {s.path.toFixed(3)}
                                      </td>
                                      <td className="p-1.5 border border-slate-200 text-slate-600 capitalize">
                                        {s.kind}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                          <div className="flex flex-wrap gap-3 mt-2 text-[9px] font-bold text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-rose-600 border border-black" />
                              Incr &gt; 0.1 ns (critical)
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-amber-200 border border-black" />
                              Incr &gt; 0.05 ns
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-emerald-50 border border-slate-300" />
                              Low delay
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                              Path cumulative
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 text-center py-8">
                        Select a path to view schematic
                      </p>
                    )}
                  </div>
                )}


                {/* SI / NOISE */}
                {activeTab === "si" && selectedPath && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="neu-panel-sm p-3 border-l-4 border-l-fuchsia-500">
                        <p className="text-[9px] font-black uppercase text-slate-400">Path SI Δ</p>
                        <p className="text-lg font-black text-fuchsia-700">
                          {selectedPath.si.siDeltaNs.toFixed(3)} ns
                        </p>
                      </div>
                      <div className="neu-panel-sm p-3 border-l-4 border-l-violet-500">
                        <p className="text-[9px] font-black uppercase text-slate-400">SI fraction</p>
                        <p className="text-lg font-black text-violet-700">
                          {(selectedPath.si.siFraction * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="neu-panel-sm p-3 border-l-4 border-l-amber-500">
                        <p className="text-[9px] font-black uppercase text-slate-400">Noise risk</p>
                        <p className="text-lg font-black text-amber-700">
                          {selectedPath.si.noiseRiskScore}/100
                        </p>
                      </div>
                      <div className="neu-panel-sm p-3 border-l-4 border-l-slate-500">
                        <p className="text-[9px] font-black uppercase text-slate-400">Source</p>
                        <p className="text-sm font-black text-slate-700">
                          {selectedPath.si.hasReportedSi ? "Report SI" : "Heuristic risk"}
                        </p>
                      </div>
                    </div>

                    {!selectedPath.si.hasReportedSi && (
                      <div className="neu-inset p-2 bg-amber-50 border-l-4 border-l-amber-500 text-[10px] font-bold text-amber-900">
                        No tool SI/crosstalk fields found. Values below are{" "}
                        <b>heuristic noise/SI risk</b> from delay/fanout — not signoff SI. Re-run
                        PT-SI/Tempus SI and paste those reports for real deltas.
                      </div>
                    )}

                    <div className="neu-inset p-3 text-[10px] font-bold text-slate-600 space-y-1">
                      {selectedPath.si.notes.map((n, i) => (
                        <p key={i}>• {n}</p>
                      ))}
                      <p className="text-slate-400 pt-1">
                        Design SI: {timingState.siSummary.pathsWithReportedSi} paths with report SI ·
                        high-noise paths {timingState.siSummary.highNoisePaths} ·
                        avg SI fraction {(timingState.siSummary.avgSiFraction * 100).toFixed(1)}%
                      </p>
                    </div>

                    {/* SI bar vs data path */}
                    <div className="neu-panel-sm p-4 space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-600">
                        Data path attribution
                      </h4>
                      <div className="h-6 flex rounded-lg overflow-hidden border-2 border-black">
                        {(() => {
                          const dp = Math.max(selectedPath.dataPathDelay, 1e-6);
                          const si = Math.min(selectedPath.si.siDeltaNs, dp);
                          const base = Math.max(0, dp - si);
                          const basePct = (base / dp) * 100;
                          const siPct = (si / dp) * 100;
                          return (
                            <>
                              <div
                                style={{ width: `${basePct}%` }}
                                className="bg-sky-400 flex items-center justify-center text-[9px] font-black"
                                title="Base delay"
                              >
                                {basePct > 12 ? `base ${base.toFixed(3)}` : ""}
                              </div>
                              <div
                                style={{ width: `${Math.max(siPct, si > 0 ? 2 : 0)}%` }}
                                className="bg-fuchsia-500 flex items-center justify-center text-[9px] font-black text-white"
                                title="SI / risk"
                              >
                                {siPct > 10 ? `SI ${si.toFixed(3)}` : ""}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-[9px] font-mono text-slate-500">
                        base {selectedPath.si.baseDataPathNs.toFixed(3)} + SI{" "}
                        {selectedPath.si.siDeltaNs.toFixed(3)} · data path{" "}
                        {selectedPath.dataPathDelay.toFixed(3)} ns
                      </p>
                    </div>

                    <div className="neu-panel-sm p-3 overflow-x-auto">
                      <h4 className="text-xs font-black uppercase text-slate-600 mb-2">
                        Aggressors / hot stages
                      </h4>
                      {selectedPath.si.aggressors.length === 0 ? (
                        <p className="text-[10px] font-bold text-slate-400">
                          No aggressor or high-risk stages listed for this path.
                        </p>
                      ) : (
                        <table className="w-full text-[10px] border-collapse border border-black">
                          <thead className="bg-slate-800 text-white">
                            <tr>
                              <th className="p-1.5 text-left">Net / pin</th>
                              <th className="p-1.5 text-right">Δ ns</th>
                              <th className="p-1.5 text-right">Fanout</th>
                              <th className="p-1.5">Src</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPath.si.aggressors.map((a) => (
                              <tr key={a.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
                                <td className="p-1.5 font-mono text-slate-900 break-all font-bold">
                                  {a.label}
                                </td>
                                <td className="p-1.5 text-right font-mono font-black text-fuchsia-800">
                                  {a.contributionNs.toFixed(3)}
                                </td>
                                <td className="p-1.5 text-right font-mono font-black text-slate-900 tabular-nums">
                                  {a.fanout ?? "—"}
                                </td>
                                <td className="p-1.5 uppercase text-[9px] font-black text-slate-700">
                                  {a.source}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {timingState.siSummary.topAggressors.length > 0 && (
                      <div className="neu-panel-sm p-3 bg-white border-2 border-black">
                        <h4 className="text-xs font-black uppercase text-slate-800 mb-2">
                          Design-wide top aggressors
                        </h4>
                        <div className="space-y-1.5">
                          {timingState.siSummary.topAggressors.slice(0, 8).map((a) => (
                            <div
                              key={a.id + a.label}
                              className="flex justify-between items-center gap-2 text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1.5"
                            >
                              <span
                                className="font-mono text-slate-900 truncate mr-2"
                                title={a.label}
                              >
                                {a.label}
                              </span>
                              <span className="text-fuchsia-800 font-mono font-black shrink-0 tabular-nums">
                                {a.contributionNs.toFixed(3)} ns
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="neu-btn neu-btn-primary px-3 py-2 text-[10px] font-black"
                      onClick={() => {
                        setSolver((s) => ({
                          ...s,
                          siReductionPct: Math.max(s.siReductionPct, 40),
                        }));
                        setActiveTab("eco");
                        flash("Applied SI mitigation knob → see ECO / solver");
                      }}
                    >
                      Mitigate SI in ECO solver (40%)
                    </button>
                  </div>
                )}
                {activeTab === "si" && !selectedPath && (
                  <p className="text-xs font-bold text-slate-400 text-center py-8">
                    Select a path to inspect SI / noise.
                  </p>
                )}

                {/* ECO */}
                {activeTab === "eco" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-orange-600" />
                          ECO proposals & Script Export
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500">
                          Flow-specific tools & methods · cell ladders from report · export Tcl
                        </p>
                        {timingState.paths.length > 0 && (
                          <p className="text-[9px] font-bold text-indigo-700 mt-0.5">
                            Cell catalog: {summarizeCatalog(cellCatalog)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Stage first — drives tool list */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black uppercase text-slate-500">
                            Flow:
                          </span>
                          <select
                            value={stage}
                            onChange={(e) => {
                              const s = e.target.value as SolverStage;
                              setStage(s);
                              setEcoVendor(defaultVendorForStage(s));
                            }}
                            className="bg-white text-slate-900 text-[10px] font-black uppercase rounded p-1.5 border-2 border-black outline-none cursor-pointer shadow-[2px_2px_0_#000]"
                          >
                            <option value="synthesis">Synthesis</option>
                            <option value="pnr">PnR</option>
                            <option value="signoff">Signoff</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black uppercase text-slate-500">
                            Tool:
                          </span>
                          <select
                            value={
                              isVendorValidForStage(ecoVendor, stage)
                                ? ecoVendor
                                : defaultVendorForStage(stage)
                            }
                            onChange={(e) =>
                              setEcoVendor(e.target.value as EcoVendor)
                            }
                            className="bg-white text-slate-900 text-[10px] font-black rounded p-1.5 border-2 border-black outline-none cursor-pointer shadow-[2px_2px_0_#000] max-w-[200px]"
                          >
                            {vendorsForStage(stage).map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="neu-panel-sm p-2 text-[9px] font-bold text-slate-600 flex flex-wrap gap-2">
                      <span className="font-black text-slate-800 uppercase">
                        {stage} methods:
                      </span>
                      {stage === "synthesis" && (
                        <span>
                          path groups · retime · compile effort · I/O SDC · uncertainty ·
                          period · map size/VT · pipeline
                        </span>
                      )}
                      {stage === "pnr" && (
                        <span>
                          eco size/VT · buffers · useful skew · shield/route · cell ladder
                        </span>
                      )}
                      {stage === "signoff" && (
                        <span>
                          size_cell / eco_update · SI notes · constraint review · cell ladder
                        </span>
                      )}
                    </div>

                    {/* Predicted Timing Metrics Card */}
                    <div className="neu-panel-sm p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-2 border-black shadow-[3px_3px_0_#000]">
                      <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Predicted Impact ({predictedTimingMetrics.selectedActionCount} actions selected)
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          Diminishing returns model applied
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-1.5 rounded bg-white/5 border border-white/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Setup WNS</span>
                          <span
                            className={`text-xs font-black font-mono ${
                              predictedTimingMetrics.predictedWnsSetup < 0 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {predictedTimingMetrics.baselineWnsSetup.toFixed(3)} →{" "}
                            {predictedTimingMetrics.predictedWnsSetup.toFixed(3)} ns
                          </span>
                        </div>

                        <div className="p-1.5 rounded bg-white/5 border border-white/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Setup TNS</span>
                          <span
                            className={`text-xs font-black font-mono ${
                              predictedTimingMetrics.predictedTnsSetup < 0 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {predictedTimingMetrics.baselineTnsSetup.toFixed(3)} →{" "}
                            {predictedTimingMetrics.predictedTnsSetup.toFixed(3)} ns
                          </span>
                        </div>

                        <div className="p-1.5 rounded bg-white/5 border border-white/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Effective Gain</span>
                          <span className="text-xs font-black font-mono text-emerald-400">
                            +{predictedTimingMetrics.effectiveTotalGainNs.toFixed(3)} ns
                          </span>
                        </div>

                        <div className="p-1.5 rounded bg-white/5 border border-white/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Targeted Paths</span>
                          <span className="text-xs font-black font-mono text-indigo-300">
                            {predictedTimingMetrics.targetedPathCount} paths
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedPath && (
                      <div className="neu-inset p-2 text-[10px] font-mono text-slate-600">
                        {selectedPath.id} · slack{" "}
                        <b className={selectedPath.slack < 0 ? "text-rose-600" : "text-emerald-600"}>
                          {selectedPath.slack.toFixed(3)} ns
                        </b>{" "}
                        · sim{" "}
                        <b className={solverResult && solverResult.slack < 0 ? "text-rose-600" : "text-emerald-600"}>
                          {solverResult ? solverResult.slack.toFixed(3) : "—"} ns
                        </b>
                      </div>
                    )}

                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                      {(selectedPath ? pathEco : sessionEco).map((a) => {
                        const on = !!ecoSelected[a.id];
                        const vendorCmd = generateVendorEcoLine(a, ecoVendor);
                        return (
                          <div
                            key={a.id}
                            className={`neu-panel-sm p-3 flex gap-3 items-start border-l-4 ${
                              !a.stageOk
                                ? "border-l-slate-300 opacity-70"
                                : a.risk === "high"
                                ? "border-l-rose-500"
                                : a.risk === "med"
                                ? "border-l-amber-500"
                                : "border-l-emerald-500"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={!a.stageOk}
                              onChange={() =>
                                setEcoSelected((prev) => ({ ...prev, [a.id]: !prev[a.id] }))
                              }
                              className="mt-1 accent-orange-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-black text-slate-800">{a.title}</p>
                                <span className="text-[8px] font-black uppercase text-orange-700 bg-orange-50 px-1 rounded">
                                  {a.type}
                                </span>
                                <span className="text-[8px] font-black uppercase text-slate-400">
                                  risk {a.risk}
                                </span>
                                {a.cellPickSource && a.cellPickSource !== "none" && (
                                  <span
                                    className={`text-[8px] font-black uppercase px-1 rounded border ${
                                      a.cellPickSource === "seen"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                                        : "bg-amber-50 text-amber-900 border-amber-400"
                                    }`}
                                  >
                                    cell:{a.cellPickSource}
                                  </span>
                                )}
                                {!a.stageOk && (
                                  <span className="text-[8px] font-black text-slate-400">
                                    N/A @ {stage}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">{a.detail}</p>
                              {a.fromCell && a.toCell && (
                                <p className="text-[9px] font-mono font-black text-slate-800 mt-0.5">
                                  <span className="text-slate-500">{a.fromCell}</span>
                                  {" → "}
                                  <span className="text-indigo-700">{a.toCell}</span>
                                </p>
                              )}
                              <p className="text-[9px] font-mono text-indigo-700 bg-indigo-50/70 p-1 rounded border border-indigo-100 mt-1 truncate">
                                <b className="text-[8px] uppercase text-indigo-500 mr-1">[{ecoVendor.toUpperCase()}]</b>
                                {vendorCmd}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-emerald-700">
                                +{a.estGainNs.toFixed(3)} ns
                              </p>
                              <button
                                type="button"
                                className="text-[9px] font-black text-purple-600 uppercase mt-1"
                                onClick={() => {
                                  setSolver((s) => mergeSolverPatches(s, [a.solverPatch]));
                                  flash(`Applied: ${a.title}`);
                                }}
                              >
                                Apply knob
                              </button>
                            </div>
                            {ecoVerification.length > 0 && (() => {
                              const v = ecoVerification.find((ev) => ev.eco.id === a.id);
                              if (!v) return null;
                              const badgeStyle =
                                v.status === "worked"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-400 font-black"
                                  : v.status === "partial"
                                  ? "bg-amber-100 text-amber-800 border-amber-400 font-bold"
                                  : v.status === "failed"
                                  ? "bg-rose-100 text-rose-800 border-rose-400 font-bold"
                                  : "bg-slate-100 text-slate-600 border-slate-300 font-normal";
                              return (
                                <div className={`w-full mt-2 p-1.5 rounded border text-[9px] flex items-center justify-between ${badgeStyle}`}>
                                  <span>Verified in Report B: <b>{v.status.toUpperCase()}</b></span>
                                  <span className="font-mono text-[9px]">{v.explanation}</span>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                      {selectedPath && pathEco.length === 0 && (
                        <p className="text-xs font-bold text-slate-400">No ECO proposals for this path.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="neu-btn neu-btn-primary px-3 py-2 text-[10px] font-black"
                        onClick={() => {
                          const list = selectedPath ? pathEco : sessionEco;
                          const patches = list
                            .filter((a) => ecoSelected[a.id] && a.stageOk)
                            .map((a) => a.solverPatch);
                          if (!patches.length) {
                            flash("Select one or more ECO checkboxes first");
                            return;
                          }
                          setSolver((s) => mergeSolverPatches(s, patches));
                          flash(`Merged ${patches.length} ECO knobs into solver`);
                        }}
                      >
                        Apply selected → solver
                      </button>

                      <button
                        type="button"
                        className="neu-btn px-3 py-2 text-[10px] font-black flex items-center gap-1"
                        onClick={async () => {
                          const list = selectedPath ? pathEco : sessionEco;
                          const selectedList = list.filter((a) => ecoSelected[a.id]);
                          const finalActions = selectedList.length ? selectedList : list;

                          const script = exportVendorEcoScript(finalActions, {
                            vendor: ecoVendor,
                            stage,
                            designName: displayDesignName !== "—" ? displayDesignName : "design",
                          });
                          try {
                            await navigator.clipboard.writeText(script);
                            flash(`Copied ${ecoVendor.toUpperCase()} TCL script`);
                          } catch {
                            flash("Copy failed");
                          }
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy {ecoVendor.toUpperCase()} Tcl
                      </button>

                      <button
                        type="button"
                        className="neu-btn px-3 py-2 text-[10px] font-black flex items-center gap-1"
                        onClick={() => {
                          const list = selectedPath ? pathEco : sessionEco;
                          const selectedList = list.filter((a) => ecoSelected[a.id]);
                          const finalActions = selectedList.length ? selectedList : list;

                          const script = exportVendorEcoScript(finalActions, {
                            vendor: ecoVendor,
                            stage,
                            designName: displayDesignName !== "—" ? displayDesignName : "design",
                          });
                          downloadTextFile(script, `eco_${ecoVendor}.tcl`);
                          flash(`Downloaded eco_${ecoVendor}.tcl`);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" /> Export .tcl
                      </button>

                      {/* Download Export Pack (.zip) */}
                      <button
                        type="button"
                        className="neu-btn bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2 text-[10px] font-black flex items-center gap-1 shadow-[2px_2px_0_#000]"
                        onClick={() => {
                          const list = selectedPath ? pathEco : sessionEco;
                          const selectedList = list.filter((a) => ecoSelected[a.id]);
                          const finalActions = selectedList.length ? selectedList : list;

                          const pack = generateExportPack(
                            DEFAULT_SDC_STATE,
                            timingState,
                            finalActions,
                            ecoVendor
                          );
                          downloadZipFile(pack.zipBytes, `ace_seek_${ecoVendor}_pack.zip`);
                          flash(`Downloaded SDC & ECO Export Pack (.zip)`);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" /> Download Pack (.zip)
                      </button>

                      <button
                        type="button"
                        className="neu-btn px-3 py-2 text-[10px] font-black"
                        onClick={() => {
                          setSolver({ ...DEFAULT_SOLVER });
                          setEcoSelected({});
                          clearEcoSession();
                          flash("Reset solver + cleared saved session");
                        }}
                      >
                        Reset
                      </button>
                    </div>

                    {!selectedPath && (
                      <p className="text-[10px] font-bold text-slate-400">
                        Showing session-wide proposals from failing paths. Select a path for path-specific ECO.
                      </p>
                    )}
                  </div>
                )}

                {/* VIOLATIONS */}
                {activeTab === "violations" && (
                  <div className="space-y-4">
                    {timingState.failingCount > 0 ? (
                      <div className="space-y-3">
                        <div className="neu-inset p-4 bg-rose-50 flex items-start gap-3 border-l-4 border-l-rose-500">
                          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                          <div>
                            <h4 className="text-sm font-black text-rose-700">
                              Failing Paths Detected
                            </h4>
                            <p className="text-xs font-bold text-rose-600 mt-1">
                              {timingState.failingSetup} setup · {timingState.failingHold}{" "}
                              hold · TNS {timingState.tns.toFixed(3)} ns
                            </p>
                          </div>
                        </div>
                        {timingState.paths
                          .filter((p) => p.slack < 0)
                          .map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPathId(p.id);
                                setActiveTab("paths");
                              }}
                              className="p-3 border-2 border-black bg-rose-50/30 rounded-lg cursor-pointer hover:bg-rose-50 transition-all shadow-[3px_3px_0_#000000]"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-rose-600 uppercase">
                                  {p.id} · {p.type} · {p.pathKind}
                                </span>
                                <span className="text-xs font-black text-rose-600">
                                  {p.slack.toFixed(3)} ns
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 truncate">
                                {p.startpoint} → {p.endpoint}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="neu-panel-sm p-8 bg-emerald-50 text-center border-l-4 border-l-emerald-500">
                        <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h4 className="text-sm font-black text-emerald-700 uppercase">
                          Timing Clean
                        </h4>
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          Zero setup or hold violations in this report.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* COMPARE */}
                {activeTab === "compare" && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 neu-panel-sm p-4 bg-white">
                      <div className="space-y-1 min-w-[200px]">
                        <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                          <GitBranch className="h-4 w-4 text-sky-600" />
                          Compare Baseline against Target (Report B)
                        </label>
                        <p className="text-[10px] font-bold text-slate-500">
                          Select another uploaded file from current session or upload Report B to evaluate Δslack and ECO results.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={compareReportId}
                          onChange={(e) => setCompareReportId(e.target.value)}
                          className="bg-white text-slate-900 text-xs font-bold rounded-lg p-2 border-2 border-black outline-none cursor-pointer shadow-[2px_2px_0_#000]"
                        >
                          <option value="">-- Select Report B from Session --</option>
                          {session.files.map((f) => (
                            <option key={f.id} value={f.id} disabled={f.text === reportText}>
                              {f.filename} ({f.result.detectedVendor}) {f.text === reportText ? "(Current Baseline)" : ""}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="neu-btn text-xs font-black px-3 py-2 flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-sky-600" /> Upload Report B
                        </button>
                      </div>
                    </div>

                    {timingDiff ? (
                      <div className="space-y-6">
                        {/* Metric Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`neu-panel-sm p-4 border-l-4 ${timingDiff.deltaWns >= 0 ? "border-l-emerald-500 bg-emerald-50/50" : "border-l-rose-500 bg-rose-50/50"}`}>
                            <p className="text-[10px] font-black uppercase text-slate-500">Δ WNS Setup</p>
                            <p className={`text-xl font-black ${timingDiff.deltaWns >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {timingDiff.deltaWns >= 0 ? `+${timingDiff.deltaWns.toFixed(3)}` : timingDiff.deltaWns.toFixed(3)} ns
                            </p>
                            <p className="text-[9px] font-bold text-slate-500">
                              Baseline {timingState.wns.toFixed(3)} → Target {compareReportState?.wns.toFixed(3)} ns
                            </p>
                          </div>

                          <div className={`neu-panel-sm p-4 border-l-4 ${timingDiff.deltaTns >= 0 ? "border-l-emerald-500 bg-emerald-50/50" : "border-l-rose-500 bg-rose-50/50"}`}>
                            <p className="text-[10px] font-black uppercase text-slate-500">Δ TNS Setup</p>
                            <p className={`text-xl font-black ${timingDiff.deltaTns >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {timingDiff.deltaTns >= 0 ? `+${timingDiff.deltaTns.toFixed(3)}` : timingDiff.deltaTns.toFixed(3)} ns
                            </p>
                            <p className="text-[9px] font-bold text-slate-500">
                              Baseline {timingState.tns.toFixed(3)} → Target {compareReportState?.tns.toFixed(3)} ns
                            </p>
                          </div>

                          <div className={`neu-panel-sm p-4 border-l-4 ${timingDiff.deltaFailingCount <= 0 ? "border-l-emerald-500 bg-emerald-50/50" : "border-l-rose-500 bg-rose-50/50"}`}>
                            <p className="text-[10px] font-black uppercase text-slate-500">Δ Failing Paths</p>
                            <p className={`text-xl font-black ${timingDiff.deltaFailingCount <= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {timingDiff.deltaFailingCount <= 0 ? timingDiff.deltaFailingCount : `+${timingDiff.deltaFailingCount}`}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500">
                              Baseline {timingState.failingCount} → Target {compareReportState?.failingCount}
                            </p>
                          </div>

                          <div className="neu-panel-sm p-4 border-l-4 border-l-sky-500 bg-sky-50/50">
                            <p className="text-[10px] font-black uppercase text-slate-500">Matched Paths</p>
                            <p className="text-xl font-black text-sky-900">
                              {timingDiff.counts.totalMatched}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500">
                              {timingDiff.counts.fixed} Fixed · {timingDiff.counts.regressed} Regressed
                            </p>
                          </div>
                        </div>

                        {/* Path Comparison Table */}
                        <div className="neu-panel-sm p-4 bg-white space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                              Path Delta Breakdown
                            </h4>

                            {/* Filter Buttons */}
                            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold">
                              {(
                                [
                                  ["all", "All Pairs", timingDiff.pairs.length],
                                  ["regressed", "Regressed 📉", timingDiff.counts.regressed],
                                  ["improved", "Improved 📈", timingDiff.counts.improved],
                                  ["fixed", "Fixed 🎉", timingDiff.counts.fixed],
                                  ["new_failing", "New Fail ⚠️", timingDiff.counts.newFailing],
                                ] as const
                              ).map(([f, lbl, count]) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => setDiffFilter(f)}
                                  className={`px-2.5 py-1 rounded-full border transition ${
                                    diffFilter === f
                                      ? "bg-slate-900 text-white font-black border-black"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300"
                                  }`}
                                >
                                  {lbl} ({count})
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 sticky top-0">
                                <tr>
                                  <th className="p-2">Status</th>
                                  <th className="p-2">Startpoint → Endpoint</th>
                                  <th className="p-2">Type / Group</th>
                                  <th className="p-2 text-right">Baseline Slack</th>
                                  <th className="p-2 text-right">Target Slack</th>
                                  <th className="p-2 text-right">Δ Slack</th>
                                  <th className="p-2 text-right">Δ Arrival</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {timingDiff.pairs
                                  .filter((pair) => diffFilter === "all" || pair.status === diffFilter)
                                  .map((pair, idx) => {
                                    const statusBadge =
                                      pair.status === "fixed"
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : pair.status === "new_failing"
                                        ? "bg-rose-100 text-rose-800 border-rose-300"
                                        : pair.status === "regressed"
                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                        : pair.status === "improved"
                                        ? "bg-sky-100 text-sky-800 border-sky-300"
                                        : "bg-slate-100 text-slate-600 border-slate-300";

                                    return (
                                      <tr key={idx} className="hover:bg-slate-50 transition">
                                        <td className="p-2">
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${statusBadge}`}>
                                            {pair.status.replace("_", " ")}
                                          </span>
                                        </td>
                                        <td className="p-2 font-mono text-[11px] max-w-[280px] truncate" title={pair.signature}>
                                          <span className="font-bold text-slate-900">{pair.startpoint}</span>
                                          <span className="text-slate-400 mx-1">→</span>
                                          <span className="text-slate-700">{pair.endpoint}</span>
                                        </td>
                                        <td className="p-2 text-[10px] text-slate-500 font-bold uppercase">
                                          {pair.type} · {pair.pathGroup}
                                        </td>
                                        <td className="p-2 text-right font-mono font-bold tabular-nums">
                                          {pair.pathA ? (
                                            <span className={pair.pathA.slack < 0 ? "text-rose-600" : "text-emerald-600"}>
                                              {pair.pathA.slack.toFixed(3)} ns
                                            </span>
                                          ) : (
                                            "—"
                                          )}
                                        </td>
                                        <td className="p-2 text-right font-mono font-bold tabular-nums">
                                          {pair.pathB ? (
                                            <span className={pair.pathB.slack < 0 ? "text-rose-600" : "text-emerald-600"}>
                                              {pair.pathB.slack.toFixed(3)} ns
                                            </span>
                                          ) : (
                                            "—"
                                          )}
                                        </td>
                                        <td className="p-2 text-right font-mono font-black tabular-nums">
                                          <span className={pair.deltaSlackNs >= 0 ? "text-emerald-700" : "text-rose-700"}>
                                            {pair.deltaSlackNs >= 0 ? `+${pair.deltaSlackNs.toFixed(3)}` : pair.deltaSlackNs.toFixed(3)} ns
                                          </span>
                                        </td>
                                        <td className="p-2 text-right font-mono text-slate-600 tabular-nums">
                                          {pair.deltaArrivalNs >= 0 ? `+${pair.deltaArrivalNs.toFixed(3)}` : pair.deltaArrivalNs.toFixed(3)} ns
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="neu-panel-sm p-8 text-center bg-slate-50 space-y-3">
                        <GitBranch className="h-8 w-8 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-black text-slate-700">No Comparison Target Selected</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Please select a second report from the dropdown above or click <b>Upload Report B</b> to analyze path slacks side-by-side.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Solver + details */}
          <div className="lg:col-span-4 flex flex-col min-h-0 gap-4 overflow-hidden">
            <div className="neu-panel bg-white p-5 flex flex-col shrink-0 gap-3 max-h-[55%] overflow-y-auto">
              <div className="border-b-2 border-slate-100 pb-2 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-purple-600" />
                  Remediation Solver
                </h3>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as SolverStage)}
                  className="bg-white text-slate-900 text-[10px] font-black uppercase rounded p-1 border-2 border-black cursor-pointer outline-none shadow-[1px_1px_0_#000]"
                >
                  <option value="synthesis" className="bg-white text-slate-900">
                    Synthesis
                  </option>
                  <option value="pnr" className="bg-white text-slate-900">
                    PnR
                  </option>
                  <option value="signoff" className="bg-white text-slate-900">
                    Signoff
                  </option>
                </select>
              </div>

              {solverResult && selectedPath ? (
                <div className="space-y-3">
                  <div className="neu-inset p-3 bg-slate-50 flex items-center justify-between border-l-4 border-l-purple-500">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">
                        Simulated Slack
                      </p>
                      <p
                        className={`text-lg font-black ${
                          solverResult.slack < 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {solverResult.slack.toFixed(3)} ns
                      </p>
                      <p className="text-[9px] font-bold text-slate-400">
                        Δ {solverResult.deltaSlack >= 0 ? "+" : ""}
                        {solverResult.deltaSlack.toFixed(3)} vs report
                      </p>
                    </div>
                    <span
                      className={`neu-badge text-[9px] font-black uppercase ${
                        solverResult.met
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {solverResult.met ? "Timing Met" : "Violating"}
                    </span>
                  </div>

                  {/* Savings chips */}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(solverResult.savings)
                      .filter(([, v]) => v > 0.0005)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[8px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200"
                        >
                          {k.replace("Ns", "")} −{v.toFixed(3)}
                        </span>
                      ))}
                  </div>

                  <div className="space-y-2.5 text-xs font-bold text-slate-700">
                    {(
                      [
                        ["slewReductionPct", "Input driver / slew", 0, 80, 5, "%"],
                        ["pipelineStages", "Pipeline stages", 0, 4, 1, "regs"],
                        ["lvtRatioPct", "LVT cell swap", 0, 100, 10, "%"],
                        ["gateUpsizePct", "Gate upsizing", 0, 50, 5, "%"],
                        ["bufferOptPct", "Buffer / net opt", 0, 40, 5, "%"],
                        ["usefulSkewNs", "Useful skew", 0, 0.5, 0.01, "ns"],
                        ["outputRelaxPct", "Output delay relax", 0, 50, 5, "%"],
                        ["siReductionPct", "SI / shield what-if", 0, 60, 5, "%"],
                      ] as const
                    ).map(([key, label, min, max, step, unit]) => (
                      <div key={key} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="uppercase">{label}</span>
                          <span className="font-mono text-purple-600">
                            {key === "pipelineStages"
                              ? `+${solver[key]} ${unit}`
                              : key === "usefulSkewNs"
                              ? `${solver[key].toFixed(2)} ${unit}`
                              : `${solver[key]}${unit}`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={solver[key]}
                          onChange={(e) =>
                            setCtrl(
                              key,
                              (key === "usefulSkewNs"
                                ? parseFloat(e.target.value)
                                : parseInt(e.target.value, 10)) as never
                            )
                          }
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSolver({ ...DEFAULT_SOLVER })}
                    className="text-[10px] font-black text-slate-500 hover:text-purple-600 uppercase"
                  >
                    Reset knobs
                  </button>

                  <div className="space-y-2 border-t-2 border-slate-100 pt-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-purple-500" />
                      {stageLabel(stage)} · Tool guidance
                    </h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {guidelines.map((g, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 p-2 rounded border border-slate-100 text-[10px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                g.priority === "high"
                                  ? "bg-rose-500"
                                  : g.priority === "med"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            <p className="font-black text-purple-700 uppercase">
                              {g.title}
                            </p>
                            <span className="text-[8px] text-slate-400 ml-auto uppercase">
                              {g.category}
                            </span>
                          </div>
                          <p className="text-slate-500 font-bold leading-relaxed mt-0.5">
                            {g.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-bold text-center py-4">
                  Select a timing path to open the solver.
                </p>
              )}
            </div>

            {/* Path metrics + steps */}
            <div className="neu-panel bg-white p-5 flex-1 flex flex-col min-h-0 overflow-hidden">
              {selectedPath ? (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="border-b-2 border-slate-100 pb-2 space-y-1 shrink-0">
                    <h3 className="text-xs font-black text-slate-800 truncate">
                      {selectedPath.endpoint}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-[9px] font-black text-slate-400 uppercase">
                      <span className="flex items-center gap-0.5">
                        <Box className="w-3 h-3" />
                        {selectedPath.pathKind}
                      </span>
                      <span>lv {selectedPath.levels}</span>
                      <span>clk {selectedPath.clock}</span>
                      <span
                        className={
                          selectedPath.slack < 0 ? "text-rose-500" : "text-emerald-600"
                        }
                      >
                        {selectedPath.slack.toFixed(3)} ns
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold shrink-0">
                    {(
                      [
                        ["Launch edge", selectedPath.launchEdge],
                        ["Capture edge", selectedPath.captureEdge],
                        ["Launch lat", selectedPath.launchClockLatency],
                        ["Capture lat", selectedPath.captureClockLatency],
                        ["Input delay", selectedPath.inputDelay],
                        ["Output delay", selectedPath.outputDelay],
                        ["Data path", selectedPath.dataPathDelay],
                        ["Uncertainty", selectedPath.uncertainty],
                        ["Lib setup", selectedPath.librarySetup],
                        ["Lib hold", selectedPath.libraryHold],
                        ["Arrival", selectedPath.arrivalTime],
                        ["Required", selectedPath.requiredTime],
                      ] as const
                    ).map(([label, val]) => (
                      <div key={label} className="bg-slate-50 px-1.5 py-1 rounded border border-slate-100 flex justify-between">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-mono text-slate-800">{val.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto border-2 border-black rounded-lg bg-slate-50 min-h-0">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-slate-200 border-b-2 border-black font-black text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2 border-r border-slate-300">Point</th>
                          <th className="p-2 border-r border-slate-300">Incr</th>
                          <th className="p-2">Path</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold divide-y divide-slate-200">
                        {selectedPath.steps
                          .filter((s) => s.kind !== "summary")
                          .map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-100 transition-colors">
                              <td className="p-2 border-r border-slate-300 font-mono break-all text-slate-600">
                                {s.point}{" "}
                                {s.dir && (
                                  <span className="text-purple-600 font-black">
                                    ({s.dir})
                                  </span>
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-300 font-mono text-slate-800">
                                {s.incr.toFixed(3)}
                              </td>
                              <td className="p-2 font-mono text-slate-800">
                                {s.path.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="shrink-0 pt-1">
                    <button
                      type="button"
                      className="neu-btn w-full px-3 py-2 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 text-slate-700 hover:text-amber-700"
                      onMouseEnter={openRawPopup}
                      onMouseLeave={scheduleCloseRawPopup}
                      onFocus={openRawPopup}
                      onBlur={scheduleCloseRawPopup}
                      onClick={() => {
                        setRawPopupPinned(true);
                        setRawPopupOpen(true);
                      }}
                      title="Hover to preview raw path report"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Raw Path Text
                      <span className="text-[8px] font-bold text-slate-400 normal-case">
                        (hover)
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                  <Target className="w-8 h-8" />
                  <p className="text-xs font-bold">Select a path to view steps</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raw path hover / pin popup */}
      {rawPopupOpen && selectedPath && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-8"
          onClick={closeRawPopup}
        >
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" />
          <div
            role="dialog"
            aria-label="Raw path text"
            className="relative z-10 w-full max-w-3xl max-h-[80vh] flex flex-col rounded-xl border-4 border-black bg-white shadow-[8px_8px_0_#000000] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={openRawPopup}
            onMouseLeave={scheduleCloseRawPopup}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b-4 border-black bg-slate-900 text-white shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Raw Path Report
                </p>
                <p className="text-xs font-bold truncate text-slate-200">
                  {selectedPath.id} · {selectedPath.startpoint} → {selectedPath.endpoint}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="px-2.5 py-1 text-[10px] font-black uppercase rounded border-2 border-white/30 hover:bg-white/10"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(selectedPath.rawText);
                      flash("Copied raw path text");
                    } catch {
                      flash("Copy failed");
                    }
                  }}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 text-[10px] font-black uppercase rounded border-2 border-white/30 hover:bg-white/10"
                  onClick={closeRawPopup}
                >
                  Close
                </button>
              </div>
            </div>
            <pre className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950 text-emerald-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words">
              {selectedPath.rawText}
            </pre>
            <div className="px-4 py-2 border-t-2 border-slate-700 bg-slate-900 text-[9px] font-bold text-slate-400 shrink-0">
              Hover the button or this panel to keep open · click outside or Close to dismiss
              {rawPopupPinned ? " · pinned by click" : ""}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-xl font-bold text-xs flex items-center gap-2 border-2 border-slate-700">
            <Check className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
