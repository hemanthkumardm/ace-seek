"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Download,
  Filter,
  Layers,
  Search,
  Zap,
  Maximize2,
  ArrowRight,
  FileText,
  Sliders,
} from "lucide-react";
import {
  parseOpenroadTimingReport,
  getSampleTimingInspectionResult,
  type TimingInspectionResult,
  type TimingPath,
  type TimingPathPin,
} from "@/lib/openroad-timing-inspector";
import type { StageArtifact } from "@/lib/openroad-stage-artifacts";

interface OpenroadTimingInspectorProps {
  artifacts?: StageArtifact[];
  initialReportText?: string;
  designName?: string;
}

export function OpenroadTimingInspector({
  artifacts = [],
  initialReportText = "",
  designName = "Ibex RV32 Signoff",
}: OpenroadTimingInspectorProps) {
  // Find available timing artifacts
  const timingArtifacts = useMemo(() => {
    return artifacts.filter((a) =>
      /timing|sta|mcsta|skew|slack/i.test(a.name)
    );
  }, [artifacts]);

  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    timingArtifacts[0]?.id || "default"
  );
  const [customReportText, setCustomReportText] = useState<string>(initialReportText);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [copiedEco, setCopiedEco] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "max" | "min">("all");
  const [cornerFilter, setCornerFilter] = useState<string>("all");
  const [onlyViolations, setOnlyViolations] = useState(false);

  // Selected path for detailed inspection
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  // Determine active report text
  const activeReportText = useMemo(() => {
    if (isCustomMode) return customReportText;
    if (selectedArtifactId === "default") return initialReportText;
    const found = timingArtifacts.find((a) => a.id === selectedArtifactId);
    return found?.content || initialReportText;
  }, [isCustomMode, customReportText, selectedArtifactId, timingArtifacts, initialReportText]);

  // Parse report
  const timingData: TimingInspectionResult = useMemo(() => {
    if (activeReportText && activeReportText.trim()) {
      return parseOpenroadTimingReport(activeReportText);
    }
    return getSampleTimingInspectionResult();
  }, [activeReportText]);

  // Filtered paths
  const filteredPaths = useMemo(() => {
    return timingData.paths.filter((p) => {
      if (onlyViolations && !p.isViolated) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (cornerFilter !== "all" && !p.corner.toLowerCase().includes(cornerFilter.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStart = p.startpoint.toLowerCase().includes(q);
        const matchEnd = p.endpoint.toLowerCase().includes(q);
        const matchGroup = p.group.toLowerCase().includes(q);
        const matchPin = p.pins.some(
          (pin) =>
            pin.pinName.toLowerCase().includes(q) ||
            pin.cellType.toLowerCase().includes(q)
        );
        if (!matchStart && !matchEnd && !matchGroup && !matchPin) return false;
      }
      return true;
    });
  }, [timingData.paths, onlyViolations, typeFilter, cornerFilter, searchQuery]);

  // Currently inspected path
  const currentPath: TimingPath | undefined = useMemo(() => {
    if (!selectedPathId) return filteredPaths[0] || timingData.paths[0];
    return (
      timingData.paths.find((p) => p.id === selectedPathId) ||
      filteredPaths[0] ||
      timingData.paths[0]
    );
  }, [selectedPathId, filteredPaths, timingData.paths]);

  const copyEcoToClipboard = (ecoList: string[]) => {
    const text = ecoList.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedEco(true);
    setTimeout(() => setCopiedEco(false), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-3 text-slate-100">
      {/* Top Banner / Controls */}
      <div className="neu-inset p-3 rounded-xl border border-white/10 bg-[#070b14] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Multi-Corner Static Timing & Slack Inspector
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                OpenSTA Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Design: <span className="text-slate-200 font-mono font-bold">{designName}</span> · Pin-by-pin stage propagation, RC net delays, & automated ECOs
            </p>
          </div>
        </div>

        {/* Report Source Selector */}
        <div className="flex items-center gap-2">
          {timingArtifacts.length > 0 && (
            <select
              value={selectedArtifactId}
              onChange={(e) => {
                setSelectedArtifactId(e.target.value);
                setIsCustomMode(false);
              }}
              className="bg-slate-900 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="default">Signoff Multi-Corner Baseline</option>
              {timingArtifacts.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.name} ({art.stage})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsCustomMode((prev) => !prev)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
              isCustomMode
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {isCustomMode ? "Viewing Custom Text" : "Paste STA Log"}
          </button>
        </div>
      </div>

      {/* Custom Report Textarea if expanded */}
      {isCustomMode && (
        <div className="neu-inset p-3 rounded-xl border border-amber-500/30 bg-[#090e1a] space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-amber-400">
            <span>Paste any OpenROAD / OpenSTA timing report or checks (.rpt / .log) below:</span>
            <span className="text-[10px] text-slate-400 font-mono">
              Auto-updates metrics & paths immediately
            </span>
          </div>
          <textarea
            value={customReportText}
            onChange={(e) => setCustomReportText(e.target.value)}
            placeholder="Paste 'report_checks' or 'signoff_timing_multicorner.rpt' text here..."
            className="w-full h-32 p-2.5 font-mono text-xs bg-black/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 whitespace-pre"
          />
        </div>
      )}

      {/* Multi-Corner PVT Waterfall Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {timingData.corners.map((corner) => {
          const hasHoldViol = (corner.holdSlack ?? 0) < 0;
          const hasSetupViol = (corner.setupSlack ?? 0) < 0;
          return (
            <div
              key={corner.name}
              className="neu-inset p-3 rounded-xl border border-white/10 bg-[#0b101d] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate max-w-[170px]" title={corner.name}>
                  {corner.name}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasHoldViol || hasSetupViol
                      ? "bg-rose-500 animate-pulse"
                      : "bg-emerald-400"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Setup Slack</span>
                  <div
                    className={`text-sm font-black font-mono ${
                      hasSetupViol ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {corner.setupSlack != null
                      ? `${corner.setupSlack > 0 ? "+" : ""}${corner.setupSlack.toFixed(3)} ns`
                      : "—"}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Hold Slack</span>
                  <div
                    className={`text-sm font-black font-mono ${
                      hasHoldViol ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {corner.holdSlack != null
                      ? `${corner.holdSlack > 0 ? "+" : ""}${corner.holdSlack.toFixed(3)} ns`
                      : "—"}
                  </div>
                </div>
              </div>

              {corner.tns != null && (
                <div className="mt-1.5 text-[9px] text-slate-400 font-mono">
                  TNS: <span className={corner.tns < 0 ? "text-rose-400" : "text-slate-200"}>{corner.tns.toFixed(1)} ns</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Global Overview Card */}
        <div className="neu-inset p-3 rounded-xl border border-cyan-500/30 bg-[#071324] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              Signoff Timing Status
            </span>
            <span
              className={`px-1.5 py-0.5 text-[9px] font-black rounded ${
                timingData.violatedCount > 0
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {timingData.violatedCount > 0 ? `${timingData.violatedCount} Violations` : "MET (0 Violations)"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/10">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Worst WNS</span>
              <div
                className={`text-sm font-black font-mono ${
                  timingData.overallWns < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {timingData.overallWns.toFixed(3)} ns
              </div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Evaluated Paths</span>
              <div className="text-sm font-black text-cyan-200 font-mono">
                {timingData.totalPaths} total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Split Table and Path Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Col (5 cols): Paths Table with Filters */}
        <div className="lg:col-span-5 neu-panel p-3 rounded-xl border border-white/10 bg-[#090d18] flex flex-col space-y-2.5 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Critical Paths ({filteredPaths.length})
            </span>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyViolations}
                onChange={(e) => setOnlyViolations(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
              />
              Violated Only
            </label>
          </div>

          {/* Search and Filters */}
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search startpoint, endpoint, pin, or cell..."
                className="w-full bg-[#050811] text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-[#050811] text-[11px] font-semibold px-2 py-1 rounded border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">All Types (Setup & Hold)</option>
                <option value="max">Setup (Max Delay)</option>
                <option value="min">Hold (Min Delay)</option>
              </select>

              <select
                value={cornerFilter}
                onChange={(e) => setCornerFilter(e.target.value)}
                className="bg-[#050811] text-[11px] font-semibold px-2 py-1 rounded border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">All PVT Corners</option>
                <option value="slowest">Slowest (SS)</option>
                <option value="fastest">Fastest (FF)</option>
                <option value="typical">Typical (TT)</option>
              </select>
            </div>
          </div>

          {/* Path List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[440px]">
            {filteredPaths.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No timing paths match the current filter.
              </div>
            ) : (
              filteredPaths.map((path) => {
                const isSelected = currentPath?.id === path.id;
                return (
                  <div
                    key={path.id}
                    onClick={() => setSelectedPathId(path.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-400/60 shadow-md shadow-cyan-950/50"
                        : "bg-[#0b101f] border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            path.isViolated ? "bg-rose-500" : "bg-emerald-400"
                          }`}
                        />
                        <span className="text-[10px] font-black uppercase text-slate-300">
                          {path.type === "max" ? "Setup" : "Hold"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          [{path.corner.split(" ")[0]}]
                        </span>
                      </div>

                      <div
                        className={`text-xs font-mono font-black ${
                          path.isViolated ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {path.slack > 0 ? "+" : ""}
                        {path.slack.toFixed(2)} ns
                      </div>
                    </div>

                    {/* From -> To */}
                    <div className="mt-1.5 text-[11px] font-mono text-slate-300 truncate">
                      <span className="text-slate-400">From:</span> {path.startpoint}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 truncate">
                      <span className="text-slate-400">To:</span> {path.endpoint}
                    </div>

                    {/* Breakdown bar: Cell vs Net delay */}
                    <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                      <span>Depth: {path.logicDepth} gates</span>
                      <div className="flex items-center gap-1">
                        <span>Gate {path.cellDelayPct}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            style={{ width: `${path.cellDelayPct}%` }}
                            className="bg-cyan-400 h-full"
                          />
                          <div
                            style={{ width: `${path.netDelayPct}%` }}
                            className="bg-amber-400 h-full"
                          />
                        </div>
                        <span>Wire {path.netDelayPct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col (7 cols): Detailed Stage & Pin Inspector */}
        <div className="lg:col-span-7 neu-panel p-3.5 rounded-xl border border-white/10 bg-[#090d18] flex flex-col space-y-3 overflow-hidden">
          {currentPath ? (
            <>
              {/* Path Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${
                        currentPath.isViolated
                          ? "bg-rose-900/40 text-rose-300 border border-rose-500/40"
                          : "bg-emerald-900/40 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {currentPath.isViolated ? "Timing Violation" : "Timing Met"}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {currentPath.type === "max" ? "Setup Path (Max Delay)" : "Hold Path (Min Delay)"}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Group: {currentPath.group}
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-mono space-y-0.5">
                    <div className="text-slate-300">
                      <strong className="text-slate-400">Start:</strong> {currentPath.startpoint}{" "}
                      <span className="text-slate-500">({currentPath.startpointType})</span>
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-slate-400">End:</strong> {currentPath.endpoint}{" "}
                      <span className="text-slate-500">({currentPath.endpointType})</span>
                    </div>
                  </div>
                </div>

                {/* Slack Big Callout */}
                <div className="neu-inset px-3 py-2 rounded-xl text-right bg-[#050811] border border-white/5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Critical Slack</div>
                  <div
                    className={`text-xl font-black font-mono ${
                      currentPath.isViolated ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {currentPath.slack > 0 ? "+" : ""}
                    {currentPath.slack.toFixed(3)} ns
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Req: {currentPath.dataRequiredTime.toFixed(2)}ns · Arr: {currentPath.dataArrivalTime.toFixed(2)}ns
                  </div>
                </div>
              </div>

              {/* Pin-by-Pin Stage Table */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Pin & Net Propagation Breakdown ({currentPath.pins.length} stages)</span>
                  {currentPath.bottleneckPin && (
                    <span className="text-amber-400 font-mono text-[9px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Bottleneck: {currentPath.bottleneckPin.pinName} (+{currentPath.bottleneckPin.delay.toFixed(2)}ns)
                    </span>
                  )}
                </div>

                {currentPath.pins.length === 0 ? (
                  <div className="neu-inset p-4 text-center text-xs text-slate-500">
                    No detailed pin report available for this path.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800/80">
                    <table className="w-full text-left font-mono text-[10px]">
                      <thead className="bg-[#050811] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-2 font-bold">Stage / Pin</th>
                          <th className="py-1.5 px-2 font-bold">Cell Type</th>
                          <th className="py-1.5 px-1 font-bold text-center">FO</th>
                          <th className="py-1.5 px-1 font-bold text-right">Cap(pF)</th>
                          <th className="py-1.5 px-1 font-bold text-right">Slew</th>
                          <th className="py-1.5 px-2 font-bold text-right">Delay</th>
                          <th className="py-1.5 px-2 font-bold text-right">Arrival</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 bg-[#070b16]">
                        {currentPath.pins.map((pin) => {
                          const isBottleneck = currentPath.bottleneckPin?.id === pin.id;
                          return (
                            <tr
                              key={pin.id}
                              className={`hover:bg-slate-800/40 ${
                                isBottleneck ? "bg-amber-950/20 text-amber-200" : "text-slate-300"
                              }`}
                            >
                              <td className="py-1 px-2 truncate max-w-[160px]" title={pin.description}>
                                <div className="flex items-center gap-1">
                                  {pin.edge === "^" && <span className="text-emerald-400 text-[9px]">▲</span>}
                                  {pin.edge === "v" && <span className="text-amber-400 text-[9px]">▼</span>}
                                  <span className="truncate">{pin.pinName || pin.description}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-slate-400 truncate max-w-[140px]" title={pin.cellType}>
                                {pin.isNet ? (
                                  <span className="text-slate-500 italic">net wire</span>
                                ) : (
                                  pin.cellType
                                )}
                              </td>
                              <td className="py-1 px-1 text-center text-slate-400">
                                {pin.fanout !== null ? pin.fanout : "—"}
                              </td>
                              <td className="py-1 px-1 text-right text-slate-400">
                                {pin.cap !== null ? pin.cap.toFixed(2) : "—"}
                              </td>
                              <td className="py-1 px-1 text-right text-slate-400">
                                {pin.slew !== null ? pin.slew.toFixed(2) : "—"}
                              </td>
                              <td
                                className={`py-1 px-2 text-right font-bold ${
                                  isBottleneck
                                    ? "text-amber-400 font-black"
                                    : pin.delay > 0.3
                                    ? "text-rose-400"
                                    : "text-slate-200"
                                }`}
                              >
                                {pin.delay.toFixed(2)} ns
                              </td>
                              <td className="py-1 px-2 text-right text-cyan-300 font-semibold">
                                {pin.time.toFixed(2)} ns
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Automated Timing ECO Recommendations Box */}
              <div className="neu-inset p-3 rounded-xl border border-cyan-500/30 bg-[#070e1b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Automated Timing ECO Engine (OpenROAD / OpenSTA)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyEcoToClipboard(currentPath.ecoRecommendations)}
                    className="text-[10px] px-2 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 flex items-center gap-1 font-bold"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedEco ? "Copied!" : "Copy ECO TCL"}
                  </button>
                </div>

                <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside">
                  {currentPath.ecoRecommendations.map((eco, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {eco}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a path from the left panel to inspect stages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
