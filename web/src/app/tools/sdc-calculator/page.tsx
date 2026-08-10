"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Clock,
  Cpu,
  Check,
  Copy,
  Download,
  Upload,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  Grid,
  Plus,
  Trash2,
  SlidersHorizontal,
  Activity,
  Sliders,
  Eye,
  Layers,
  ArrowRightLeft,
} from "lucide-react";
import {
  SdcStudioState,
  DEFAULT_SDC_STATE,
  SDC_PRESETS,
  VendorFormat,
  generateSdcCode,
  lintSdcState,
  parseSdcText,
  PrimaryClock,
  GeneratedClock,
  ClockGroupRelation,
  IoConstraint,
  MulticycleConstraint,
  FalsePathConstraint,
} from "@/lib/sdc-engine";

export default function InteractiveSdcStudioPage() {
  const [state, setState] = useState<SdcStudioState>(DEFAULT_SDC_STATE);
  const [vendor, setVendor] = useState<VendorFormat>("synopsys");
  const [selectedClkId, setSelectedClkId] = useState<string>("clk_sys");
  const [activeTab, setActiveTab] = useState<"clocks" | "cdc" | "io" | "exceptions">("clocks");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const generatedCode = useMemo(() => {
    return generateSdcCode(state, vendor);
  }, [state, vendor]);

  const lintMessages = useMemo(() => {
    return lintSdcState(state);
  }, [state]);

  const errorCount = lintMessages.filter((m) => m.severity === "error").length;
  const warningCount = lintMessages.filter((m) => m.severity === "warning").length;

  const selectedClk = useMemo(() => {
    return (
      state.primaryClocks.find((c) => c.id === selectedClkId) ||
      state.primaryClocks[0] || {
        id: "default",
        name: "clk_main",
        periodNs: 10.0,
        waveformRising: 0,
        waveformFalling: 5.0,
        targets: "[get_ports clk_in]",
        isVirtual: false,
        uncertaintySetup: 0.15,
        uncertaintyHold: 0.08,
        latencySource: 0.2,
        latencyNetwork: 0.5,
      }
    );
  }, [state.primaryClocks, selectedClkId]);

  const loadPreset = (presetState: SdcStudioState, name: string) => {
    setState(structuredClone(presetState));
    if (presetState.primaryClocks[0]) {
      setSelectedClkId(presetState.primaryClocks[0].id);
    }
    flash(`Loaded preset: ${name}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || "");
      try {
        const parsed = parseSdcText(text);
        setState(parsed);
        if (parsed.primaryClocks[0]) setSelectedClkId(parsed.primaryClocks[0].id);
        flash(`Imported SDC constraints from ${file.name}`);
      } catch (err) {
        flash("Failed to parse SDC file syntax");
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    flash("Copied SDC code to clipboard!");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = vendor === "xilinx" ? "xdc" : "sdc";
    const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `constraints_${vendor}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    flash(`Downloaded constraints_${vendor}.${ext}`);
  };

  // Clock Handlers
  const addPrimaryClock = () => {
    const id = `clk_${Date.now().toString().slice(-4)}`;
    const newClk: PrimaryClock = {
      id,
      name: id,
      periodNs: 10.0,
      waveformRising: 0,
      waveformFalling: 5.0,
      targets: `[get_ports ${id}_in]`,
      isVirtual: false,
      uncertaintySetup: 0.1,
      uncertaintyHold: 0.05,
      latencySource: 0.1,
      latencyNetwork: 0.2,
    };
    setState((prev) => ({
      ...prev,
      primaryClocks: [...prev.primaryClocks, newClk],
    }));
    setSelectedClkId(id);
    flash(`Added clock ${id}`);
  };

  const updatePrimaryClock = (id: string, updates: Partial<PrimaryClock>) => {
    setState((prev) => ({
      ...prev,
      primaryClocks: prev.primaryClocks.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deletePrimaryClock = (id: string) => {
    const targetClk = state.primaryClocks.find((c) => c.id === id);
    const targetName = targetClk ? targetClk.name : id;

    setState((prev) => {
      const nextPrimary = prev.primaryClocks.filter((c) => c.id !== id);
      const remainingClocks = [
        ...nextPrimary.map((c) => c.name),
        ...prev.generatedClocks.map((g) => g.name),
      ];

      const nextClockGroups = prev.clockGroups
        .map((cg) => ({
          ...cg,
          group1Clocks: cg.group1Clocks.filter((name) => name !== targetName),
          group2Clocks: cg.group2Clocks.filter((name) => name !== targetName),
        }))
        .filter((cg) => cg.group1Clocks.length > 0 && cg.group2Clocks.length > 0);

      const fallbackClk = remainingClocks[0] || "clk_sys";
      const nextIo = prev.ioConstraints.map((io) =>
        io.clockName === targetName ? { ...io, clockName: fallbackClk } : io
      );

      return {
        ...prev,
        primaryClocks: nextPrimary,
        clockGroups: nextClockGroups,
        ioConstraints: nextIo,
      };
    });

    if (selectedClkId === id && state.primaryClocks.length > 1) {
      const remaining = state.primaryClocks.filter((c) => c.id !== id);
      setSelectedClkId(remaining[0].id);
    }
  };

  // Generated Clock Handlers
  const addGeneratedClock = () => {
    const master = state.primaryClocks[0]?.id || "clk_sys";
    const id = `clk_gen_${Date.now().toString().slice(-4)}`;
    const newGclk: GeneratedClock = {
      id,
      name: id,
      masterClockId: master,
      sourcePin: "[get_pins u_pll/clk_ref]",
      targets: "[get_pins u_div/clk_out]",
      divideBy: 2,
      multiplyBy: 1,
      invert: false,
    };
    setState((prev) => ({
      ...prev,
      generatedClocks: [...prev.generatedClocks, newGclk],
    }));
    flash(`Added generated clock ${id}`);
  };

  const updateGeneratedClock = (id: string, updates: Partial<GeneratedClock>) => {
    setState((prev) => ({
      ...prev,
      generatedClocks: prev.generatedClocks.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const deleteGeneratedClock = (id: string) => {
    const targetGclk = state.generatedClocks.find((g) => g.id === id);
    const targetName = targetGclk ? targetGclk.name : id;

    setState((prev) => {
      const nextGen = prev.generatedClocks.filter((g) => g.id !== id);
      const remainingClocks = [
        ...prev.primaryClocks.map((c) => c.name),
        ...nextGen.map((g) => g.name),
      ];

      const nextClockGroups = prev.clockGroups
        .map((cg) => ({
          ...cg,
          group1Clocks: cg.group1Clocks.filter((name) => name !== targetName),
          group2Clocks: cg.group2Clocks.filter((name) => name !== targetName),
        }))
        .filter((cg) => cg.group1Clocks.length > 0 && cg.group2Clocks.length > 0);

      const fallbackClk = remainingClocks[0] || "clk_sys";
      const nextIo = prev.ioConstraints.map((io) =>
        io.clockName === targetName ? { ...io, clockName: fallbackClk } : io
      );

      return {
        ...prev,
        generatedClocks: nextGen,
        clockGroups: nextClockGroups,
        ioConstraints: nextIo,
      };
    });
  };

  // CDC Handlers
  const allClocksList = useMemo(() => {
    return [
      ...state.primaryClocks.map((c) => c.name),
      ...state.generatedClocks.map((g) => g.name),
    ];
  }, [state.primaryClocks, state.generatedClocks]);

  const getClockRelation = (clkA: string, clkB: string) => {
    if (clkA === clkB) return "sync";
    const found = state.clockGroups.find(
      (cg) =>
        (cg.group1Clocks.includes(clkA) && cg.group2Clocks.includes(clkB)) ||
        (cg.group1Clocks.includes(clkB) && cg.group2Clocks.includes(clkA))
    );
    return found ? found.relationType : "sync";
  };

  const toggleClockRelation = (clkA: string, clkB: string) => {
    if (clkA === clkB) return;
    const current = getClockRelation(clkA, clkB);
    const nextType: 'sync' | 'asynchronous' | 'logically_exclusive' | 'physically_exclusive' =
      current === 'sync'
        ? 'asynchronous'
        : current === 'asynchronous'
        ? 'logically_exclusive'
        : current === 'logically_exclusive'
        ? 'physically_exclusive'
        : 'sync';

    setState((prev) => {
      const cleaned = prev.clockGroups.filter(
        (cg) =>
          !(
            (cg.group1Clocks.includes(clkA) && cg.group2Clocks.includes(clkB)) ||
            (cg.group1Clocks.includes(clkB) && cg.group2Clocks.includes(clkA))
          )
      );
      if (nextType === 'sync') {
        return { ...prev, clockGroups: cleaned };
      }
      const newGroup: ClockGroupRelation = {
        id: `cg_${clkA}_${clkB}_${Date.now().toString().slice(-4)}`,
        group1Clocks: [clkA],
        group2Clocks: [clkB],
        relationType: nextType,
      };
      return { ...prev, clockGroups: [...cleaned, newGroup] };
    });
  };

  // I/O Handlers
  const addIoConstraint = () => {
    const refClock = allClocksList[0] || "clk_sys";
    const id = `io_${Date.now().toString().slice(-4)}`;
    const newIo: IoConstraint = {
      id,
      portName: `[get_ports port_${id}]`,
      clockName: refClock,
      delayType: "input",
      minNs: 1.0,
      maxNs: 3.0,
      clockFall: false,
      addDelay: false,
    };
    setState((prev) => ({
      ...prev,
      ioConstraints: [...prev.ioConstraints, newIo],
    }));
    flash(`Added I/O Constraint for ${id}`);
  };

  const updateIoConstraint = (id: string, updates: Partial<IoConstraint>) => {
    setState((prev) => ({
      ...prev,
      ioConstraints: prev.ioConstraints.map((io) => (io.id === id ? { ...io, ...updates } : io)),
    }));
  };

  const deleteIoConstraint = (id: string) => {
    setState((prev) => ({
      ...prev,
      ioConstraints: prev.ioConstraints.filter((io) => io.id !== id),
    }));
  };

  // Exception Handlers
  const addMulticycle = () => {
    const id = `mcp_${Date.now().toString().slice(-4)}`;
    const newMcp: MulticycleConstraint = {
      id,
      from: "[get_pins u_ff1/C]",
      through: "",
      to: "[get_pins u_ff2/D]",
      cycles: 2,
      type: "setup",
      edge: "end",
    };
    setState((prev) => ({
      ...prev,
      multicycles: [...prev.multicycles, newMcp],
    }));
    flash("Added Multicycle Path constraint");
  };

  const updateMulticycle = (id: string, updates: Partial<MulticycleConstraint>) => {
    setState((prev) => ({
      ...prev,
      multicycles: prev.multicycles.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const deleteMulticycle = (id: string) => {
    setState((prev) => ({
      ...prev,
      multicycles: prev.multicycles.filter((m) => m.id !== id),
    }));
  };

  const addFalsePath = () => {
    const id = `fp_${Date.now().toString().slice(-4)}`;
    const newFp: FalsePathConstraint = {
      id,
      from: "[get_ports rst_n]",
      through: "",
      to: "",
      comment: "Static reset false path",
    };
    setState((prev) => ({
      ...prev,
      falsePaths: [...prev.falsePaths, newFp],
    }));
    flash("Added False Path constraint");
  };

  const updateFalsePath = (id: string, updates: Partial<FalsePathConstraint>) => {
    setState((prev) => ({
      ...prev,
      falsePaths: prev.falsePaths.map((fp) => (fp.id === id ? { ...fp, ...updates } : fp)),
    }));
  };

  const deleteFalsePath = (id: string) => {
    setState((prev) => ({
      ...prev,
      falsePaths: prev.falsePaths.filter((fp) => fp.id !== id),
    }));
  };

  // Calculation metrics
  const dutyRatio = selectedClk.waveformFalling / (selectedClk.periodNs || 1);
  const freqMhz = (1000 / (selectedClk.periodNs || 1)).toFixed(1);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden p-3 md:p-5 gap-4 select-none">
      {/* TOP HEADER */}
      <header className="neu-panel p-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="neu-inset p-3 flex items-center justify-center text-sky-600">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">
                ASIC SDC STUDIO
              </span>
              <span className="neu-badge text-[9px] font-black text-emerald-600">
                LIVE WAVEFORMS & SLIDERS
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Interactive SDC Waveform & Constraint Studio
            </h1>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Selector */}
          <div className="neu-inset px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <select
              onChange={(e) => {
                const p = SDC_PRESETS.find((pr) => pr.name === e.target.value);
                if (p) loadPreset(p.state, p.name);
              }}
              defaultValue=""
              className="bg-transparent outline-none cursor-pointer text-slate-800 font-bold"
            >
              <option value="" disabled>
                Load Chip Preset…
              </option>
              {SDC_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Selector */}
          <div className="neu-inset p-1 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setVendor("synopsys")}
              className={`px-3 py-1.5 rounded-lg transition ${
                vendor === "synopsys" ? "neu-btn-active text-sky-600 font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Synopsys
            </button>
            <button
              type="button"
              onClick={() => setVendor("cadence")}
              className={`px-3 py-1.5 rounded-lg transition ${
                vendor === "cadence" ? "neu-btn-active text-purple-600 font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Cadence
            </button>
            <button
              type="button"
              onClick={() => setVendor("xilinx")}
              className={`px-3 py-1.5 rounded-lg transition ${
                vendor === "xilinx" ? "neu-btn-active text-emerald-600 font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Xilinx XDC
            </button>
          </div>

          {/* Action Buttons */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".sdc,.xdc,.tcl,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="neu-btn px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
            title="Import SDC file"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="neu-btn neu-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied" : "Copy SDC"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="neu-btn px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKBENCH GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
        {/* LEFT WORKSTATION PANEL: SLIDERS & WAVEFORMS (Col 7) */}
        <div className="lg:col-span-7 neu-panel flex flex-col min-h-0 overflow-hidden p-5 gap-4">
          {/* NAVIGATION TABS */}
          <div className="neu-inset p-1.5 flex items-center gap-2 text-xs font-bold shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("clocks")}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === "clocks"
                  ? "neu-btn-active text-sky-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>1. Clocks & Waveform</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.primaryClocks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("io")}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === "io"
                  ? "neu-btn-active text-emerald-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>2. I/O Eye Diagram</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.ioConstraints.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("exceptions")}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === "exceptions"
                  ? "neu-btn-active text-amber-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>3. MCP Edge Shift</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.multicycles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cdc")}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === "cdc"
                  ? "neu-btn-active text-purple-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Grid className="h-4 w-4" />
              <span>4. CDC Matrix</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.clockGroups.length}
              </span>
            </button>
          </div>

          {/* TAB CONTENTS (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {/* ------------------ TAB 1: HYPER-INTERACTIVE CLOCKS & WAVEFORM SLIDERS ------------------ */}
            {activeTab === "clocks" && (
              <div className="space-y-6">
                {/* Clock Selector & Add / Remove Bar (Primary + Generated Clocks) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {/* Primary Clocks Pills */}
                    {state.primaryClocks.map((c) => (
                      <div
                        key={c.id}
                        className={`neu-btn px-2.5 py-1.5 text-xs font-black flex items-center gap-1.5 transition ${
                          selectedClkId === c.id ? "neu-btn-active text-sky-600 font-black" : "text-slate-600"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedClkId(c.id)}
                          className="flex items-center gap-1 text-left"
                        >
                          <span className="neu-badge text-[9px] text-sky-700 bg-sky-100 font-extrabold uppercase">
                            PRI
                          </span>
                          <span>{c.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">
                            ({(1000 / c.periodNs).toFixed(0)}MHz)
                          </span>
                        </button>

                        {state.primaryClocks.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePrimaryClock(c.id);
                            }}
                            className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-600 transition"
                            title={`Remove primary clock ${c.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Generated Clocks Pills */}
                    {state.generatedClocks.map((g) => (
                      <div
                        key={g.id}
                        className="neu-btn px-2.5 py-1.5 text-xs font-black flex items-center gap-1.5 text-purple-700 transition"
                      >
                        <span className="neu-badge text-[9px] text-purple-700 bg-purple-100 font-extrabold uppercase">
                          GEN
                        </span>
                        <span>{g.name}</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGeneratedClock(g.id);
                          }}
                          className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-600 transition ml-1"
                          title={`Remove generated clock ${g.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={addPrimaryClock}
                      className="neu-btn px-3 py-1.5 text-xs font-bold text-sky-600 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Primary Clock
                    </button>
                    <button
                      type="button"
                      onClick={addGeneratedClock}
                      className="neu-btn px-3 py-1.5 text-xs font-bold text-purple-600 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Gen Clock
                    </button>
                  </div>
                </div>

                {/* LIVE WAVEFORM DISPLAY CANVAS & REMOVE BUTTON */}
                <div className="neu-panel-sm p-4 space-y-2 bg-[#f4f7fb]">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700">
                    <span className="flex items-center gap-2 text-sky-600">
                      <Activity className="h-4 w-4" />
                      Live Clock Waveform ({selectedClk.name})
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="neu-badge text-[10px] text-slate-600">
                        Freq: {freqMhz} MHz | Period: {selectedClk.periodNs.toFixed(2)} ns
                      </span>

                      <button
                        type="button"
                        onClick={() => deletePrimaryClock(selectedClk.id)}
                        disabled={state.primaryClocks.length <= 1}
                        className="neu-btn px-2.5 py-1 text-xs font-bold text-rose-600 flex items-center gap-1 hover:bg-rose-50 disabled:opacity-40"
                        title="Remove selected clock"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Clock</span>
                      </button>
                    </div>
                  </div>

                  {/* SVG Waveform Visualization */}
                  <div className="neu-inset p-3 bg-[#e8edf5]">
                    {(() => {
                      const srcPx = selectedClk.latencySource * 20;
                      const netPx = selectedClk.latencyNetwork * 20;
                      const totalPx = srcPx + netPx;

                      const baseRiseX = 50;
                      const activeRiseX = Math.min(220, baseRiseX + totalPx);
                      const activeFallX = activeRiseX + dutyRatio * 180;
                      const activeCaptureX = Math.min(440, activeRiseX + 180);

                      return (
                        <svg viewBox="0 0 500 105" className="w-full h-28">
                          {/* Ideal Reference Dotted Line (0ns) */}
                          <line x1={baseRiseX} y1="10" x2={baseRiseX} y2="95" stroke="#cbd5e1" strokeDasharray="3,3" />

                          {/* Source Latency Arrow (Purple) */}
                          {selectedClk.latencySource > 0 && (
                            <g>
                              <line
                                x1={baseRiseX}
                                y1="18"
                                x2={baseRiseX + srcPx}
                                y2="18"
                                stroke="#9333ea"
                                strokeWidth="2"
                              />
                              <polygon
                                points={`${baseRiseX + srcPx},18 ${baseRiseX + srcPx - 4},15 ${baseRiseX + srcPx - 4},21`}
                                fill="#9333ea"
                              />
                              <text x={baseRiseX + 4} y="13" fill="#9333ea" fontSize="9" fontWeight="bold">
                                Src Lat (+{selectedClk.latencySource.toFixed(2)}ns)
                              </text>
                            </g>
                          )}

                          {/* Network Latency Arrow (Indigo) */}
                          {selectedClk.latencyNetwork > 0 && (
                            <g>
                              <line
                                x1={baseRiseX + srcPx}
                                y1="18"
                                x2={activeRiseX}
                                y2="18"
                                stroke="#4f46e5"
                                strokeWidth="2"
                              />
                              <polygon
                                points={`${activeRiseX},18 ${activeRiseX - 4},15 ${activeRiseX - 4},21`}
                                fill="#4f46e5"
                              />
                              <text x={baseRiseX + srcPx + 4} y="13" fill="#4f46e5" fontSize="9" fontWeight="bold">
                                Net Lat (+{selectedClk.latencyNetwork.toFixed(2)}ns)
                              </text>
                            </g>
                          )}

                          {/* Setup Uncertainty Shaded Band (Amber at Capture Edge) */}
                          {selectedClk.uncertaintySetup > 0 && (
                            <rect
                              x={activeCaptureX - selectedClk.uncertaintySetup * 15}
                              y="25"
                              width={Math.max(6, selectedClk.uncertaintySetup * 30)}
                              height="50"
                              fill="#f59e0b"
                              fillOpacity="0.3"
                              stroke="#d97706"
                              strokeDasharray="2,2"
                              rx="4"
                            />
                          )}

                          {/* Hold Uncertainty Shaded Band (Rose at Active Launch Edge) */}
                          {selectedClk.uncertaintyHold > 0 && (
                            <rect
                              x={activeRiseX - selectedClk.uncertaintyHold * 15}
                              y="25"
                              width={Math.max(6, selectedClk.uncertaintyHold * 30)}
                              height="50"
                              fill="#f43f5e"
                              fillOpacity="0.3"
                              stroke="#e11d48"
                              strokeDasharray="2,2"
                              rx="4"
                            />
                          )}

                          {/* Primary Waveform Path (Shifted by Source + Network Latency) */}
                          <path
                            d={`M 10 75 L ${activeRiseX} 75 L ${activeRiseX} 30 L ${activeFallX} 30 L ${activeFallX} 75 L ${activeCaptureX} 75 L ${activeCaptureX} 30 L ${activeCaptureX + dutyRatio * 180} 30 L ${activeCaptureX + dutyRatio * 180} 75 L 490 75`}
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="3"
                          />

                          {/* Shifted Rising Edge Marker */}
                          <circle cx={activeRiseX} cy="30" r="4.5" fill="#10b981" />
                          <text x={activeRiseX - 20} y="88" fill="#10b981" fontSize="9" fontWeight="bold">
                            Arr ({ (selectedClk.latencySource + selectedClk.latencyNetwork).toFixed(2) }ns)
                          </text>

                          {/* Falling Edge Marker */}
                          <circle cx={activeFallX} cy="30" r="4.5" fill="#3b82f6" />
                          <text x={activeFallX - 15} y="88" fill="#3b82f6" fontSize="9" fontWeight="bold">
                            Fall ({ (selectedClk.latencySource + selectedClk.latencyNetwork + selectedClk.waveformFalling).toFixed(2) }ns)
                          </text>

                          {/* Capture Edge Marker */}
                          <circle cx={activeCaptureX} cy="30" r="4.5" fill="#10b981" />
                          <text x={activeCaptureX - 25} y="88" fill="#10b981" fontSize="9" fontWeight="bold">
                            Capture ({ (selectedClk.latencySource + selectedClk.latencyNetwork + selectedClk.periodNs).toFixed(2) }ns)
                          </text>

                          {/* Hold Uncertainty Marker Label */}
                          {selectedClk.uncertaintyHold > 0 && (
                            <text x={Math.max(10, activeRiseX - 35)} y="24" fill="#e11d48" fontSize="9" fontWeight="bold">
                              Hold Unc (±{selectedClk.uncertaintyHold.toFixed(2)}ns)
                            </text>
                          )}

                          {/* Setup Uncertainty Marker Label */}
                          {selectedClk.uncertaintySetup > 0 && (
                            <text x={Math.max(200, activeCaptureX - 35)} y="24" fill="#d97706" fontSize="9" fontWeight="bold">
                              Setup Unc (±{selectedClk.uncertaintySetup.toFixed(2)}ns)
                            </text>
                          )}
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* CLOCK IDENTITY & PORT SPECIFICATION CARD */}
                <div className="neu-panel-sm p-4 space-y-3 bg-[#f8fafc]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Clock className="h-4 w-4 text-sky-600" />
                      Clock Identity & Port Target ({selectedClk.name})
                    </h4>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 neu-inset px-2.5 py-1">
                      <input
                        type="checkbox"
                        checked={selectedClk.isVirtual}
                        onChange={(e) => updatePrimaryClock(selectedClk.id, { isVirtual: e.target.checked })}
                        className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span>Virtual Clock (No Port Target)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Custom Clock Name Input */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                        Clock Object Name (-name)
                      </label>
                      <input
                        type="text"
                        value={selectedClk.name}
                        onChange={(e) => updatePrimaryClock(selectedClk.id, { name: e.target.value })}
                        className="neu-input px-3 py-1.5 text-xs font-bold text-sky-800 w-full"
                        placeholder="e.g. clk_sys_100, core_clk"
                      />
                    </div>

                    {/* Clean Target Port Name Input */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                        Clock Target Port Name
                      </label>
                      <input
                        type="text"
                        value={selectedClk.targets.replace(/^\[get_ports\s+/, "").replace(/\]$/, "")}
                        disabled={selectedClk.isVirtual}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, { targets: e.target.value })
                        }
                        className="neu-input px-3 py-1.5 text-xs font-mono font-bold text-slate-800 w-full disabled:opacity-40"
                        placeholder="e.g. sys_clk_in, clk_p"
                      />
                    </div>
                  </div>
                </div>

                {/* REAL-TIME SLIDERS DECK */}
                <div className="neu-panel-sm p-4 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-sky-600" />
                    Interactive Real-Time Timing Sliders
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Clock Period Slider */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">Clock Period (T_clk)</span>
                        <span className="text-sky-600 font-mono font-black">
                          {selectedClk.periodNs.toFixed(2)} ns ({freqMhz} MHz)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="50.0"
                        step="0.1"
                        value={selectedClk.periodNs}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1.0;
                          updatePrimaryClock(selectedClk.id, {
                            periodNs: val,
                            waveformFalling: val * dutyRatio,
                          });
                        }}
                        className="neu-slider"
                      />
                    </div>

                    {/* Duty Cycle Slider */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">Duty Cycle</span>
                        <span className="text-sky-600 font-mono font-black">
                          {(dutyRatio * 100).toFixed(0)}% (Fall: {selectedClk.waveformFalling.toFixed(2)}ns)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={dutyRatio}
                        onChange={(e) => {
                          const ratio = parseFloat(e.target.value) || 0.5;
                          updatePrimaryClock(selectedClk.id, {
                            waveformFalling: selectedClk.periodNs * ratio,
                          });
                        }}
                        className="neu-slider"
                      />
                    </div>

                    {/* Setup Uncertainty Slider */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">Setup Uncertainty (T_unc_su)</span>
                        <span className="text-amber-600 font-mono font-black">
                          {selectedClk.uncertaintySetup.toFixed(2)} ns
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="2.00"
                        step="0.01"
                        value={selectedClk.uncertaintySetup}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            uncertaintySetup: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                      />
                    </div>

                    {/* Hold Uncertainty Slider */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">Hold Uncertainty (T_unc_hd)</span>
                        <span className="text-amber-600 font-mono font-black">
                          {selectedClk.uncertaintyHold.toFixed(2)} ns
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="1.00"
                        step="0.01"
                        value={selectedClk.uncertaintyHold}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            uncertaintyHold: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                      />
                    </div>

                    {/* Source Latency Slider */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">Source Latency (`-source`)</span>
                        <span className="text-purple-600 font-mono font-black">
                          {selectedClk.latencySource.toFixed(2)} ns
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="5.00"
                        step="0.05"
                        value={selectedClk.latencySource}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            latencySource: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                      />
                    </div>

                    {/* Network Latency Slider */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">Network Latency</span>
                        <span className="text-purple-600 font-mono font-black">
                          {selectedClk.latencyNetwork.toFixed(2)} ns
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="5.00"
                        step="0.05"
                        value={selectedClk.latencyNetwork}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            latencyNetwork: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                      />
                    </div>
                  </div>
                </div>

                {/* GENERATED CLOCKS CARD DECK */}
                {state.generatedClocks.length > 0 && (
                  <div className="neu-panel-sm p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-purple-700 uppercase tracking-wide flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-purple-600" />
                        Generated Clocks (`create_generated_clock`)
                      </h4>
                      <button
                        type="button"
                        onClick={addGeneratedClock}
                        className="neu-btn px-2.5 py-1 text-xs font-bold text-purple-600 flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Generated Clock
                      </button>
                    </div>

                    <div className="space-y-3">
                      {state.generatedClocks.map((gclk) => (
                        <div key={gclk.id} className="neu-inset p-3 space-y-3 bg-[#f8f5fd]">
                          <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="neu-badge text-[9px] text-purple-700 bg-purple-100 font-extrabold uppercase">
                                GEN CLK
                              </span>
                              <input
                                type="text"
                                value={gclk.name}
                                onChange={(e) => updateGeneratedClock(gclk.id, { name: e.target.value })}
                                className="neu-input px-2 py-1 text-xs font-bold text-purple-900 w-36"
                              />
                              <span className="text-[11px] font-bold text-slate-500">
                                (Master:
                                <select
                                  value={gclk.masterClockId}
                                  onChange={(e) => updateGeneratedClock(gclk.id, { masterClockId: e.target.value })}
                                  className="bg-transparent text-purple-700 font-bold outline-none ml-1 cursor-pointer"
                                >
                                  {state.primaryClocks.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                                )
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteGeneratedClock(gclk.id)}
                              className="neu-btn px-2.5 py-1 text-xs font-bold text-rose-600 flex items-center gap-1 hover:bg-rose-50"
                              title={`Delete generated clock ${gclk.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block">Divide By</label>
                              <input
                                type="number"
                                min="1"
                                value={gclk.divideBy}
                                onChange={(e) =>
                                  updateGeneratedClock(gclk.id, { divideBy: parseInt(e.target.value) || 1 })
                                }
                                className="neu-input px-2 py-1 text-xs font-mono font-bold w-full"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 block">Multiply By</label>
                              <input
                                type="number"
                                min="1"
                                value={gclk.multiplyBy}
                                onChange={(e) =>
                                  updateGeneratedClock(gclk.id, { multiplyBy: parseInt(e.target.value) || 1 })
                                }
                                className="neu-input px-2 py-1 text-xs font-mono font-bold w-full"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 block">Source Pin (-source)</label>
                              <input
                                type="text"
                                value={gclk.sourcePin}
                                onChange={(e) => updateGeneratedClock(gclk.id, { sourcePin: e.target.value })}
                                className="neu-input px-2 py-1 text-xs font-mono w-full"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 block">Target Pin</label>
                              <input
                                type="text"
                                value={gclk.targets}
                                onChange={(e) => updateGeneratedClock(gclk.id, { targets: e.target.value })}
                                className="neu-input px-2 py-1 text-xs font-mono w-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------ TAB 2: INTERACTIVE I/O TIMING METHODOLOGY & EYE WAVEFORM ------------------ */}
            {activeTab === "io" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-600" />
                      <span>ASIC I/O Timing Methodology & Data Eye Visualizer</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      System-Synchronous & Source-Synchronous input/output timing budget, setup/hold slack arrows & data eye.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addIoConstraint}
                    className="neu-btn px-3 py-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add I/O Constraint
                  </button>
                </div>

                {state.ioConstraints.length === 0 ? (
                  <div className="neu-inset p-8 text-center text-xs font-bold text-slate-500">
                    No I/O constraints defined. Click "Add I/O Constraint" above to start.
                  </div>
                ) : (
                  state.ioConstraints.map((io) => {
                    const refClk =
                      state.primaryClocks.find((c) => c.name === io.clockName) ||
                      state.primaryClocks[0] || { periodNs: 10.0 };
                    const period = refClk.periodNs || 10.0;

                    const isInput = io.delayType === "input";
                    const setupAsic = io.setupAsic !== undefined ? io.setupAsic : 0.0; // Library setup requirement
                    const holdAsic = io.holdAsic !== undefined ? io.holdAsic : 0.0;   // Library hold requirement

                    // STA Slack Math
                    // Input Delay: Setup Slack = Period - MaxDelay - SetupAsic, Hold Slack = MinDelay - HoldAsic
                    const setupSlack = period - io.maxNs - setupAsic;
                    const holdSlack = io.minNs - holdAsic;

                    // SVG Scaling Math (0 to Period ns)
                    const baseW = 500;
                    const scaleX = (ns: number) => {
                      const clamped = Math.max(0, Math.min(period, ns));
                      return 50 + (clamped / period) * 380;
                    };

                    const clkRiseX = scaleX(0); // Launch 0ns
                    const clkCaptureX = scaleX(period); // Capture Period ns
                    const dataMinX = scaleX(io.minNs);
                    const dataMaxX = scaleX(io.maxNs);

                    return (
                      <div key={io.id} className="neu-panel-sm p-4 space-y-4">
                        {/* Header Bar */}
                        <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={io.delayType}
                              onChange={(e) =>
                                updateIoConstraint(io.id, {
                                  delayType: e.target.value as "input" | "output",
                                })
                              }
                              className={`neu-badge text-[10px] font-black uppercase outline-none cursor-pointer ${
                                isInput ? "text-emerald-600 font-bold" : "text-sky-600 font-bold"
                              }`}
                            >
                              <option value="input">INPUT DELAY (set_input_delay)</option>
                              <option value="output">OUTPUT DELAY (set_output_delay)</option>
                            </select>

                            <input
                              type="text"
                              value={io.portName}
                              onChange={(e) => updateIoConstraint(io.id, { portName: e.target.value })}
                              className="neu-input px-2.5 py-1 text-xs font-bold text-slate-800 w-48"
                              placeholder="[get_ports data[*]]"
                            />

                            <span className="text-[11px] font-bold text-slate-500">
                              (Ref Clock:
                              <select
                                value={io.clockName}
                                onChange={(e) => updateIoConstraint(io.id, { clockName: e.target.value })}
                                className="bg-transparent text-sky-600 font-black outline-none ml-1 cursor-pointer"
                              >
                                {allClocksList.map((clk) => (
                                  <option key={clk} value={clk}>
                                    {clk}
                                  </option>
                                ))}
                              </select>
                              )
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteIoConstraint(io.id)}
                            className="neu-btn p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* METHODOLOGY EQUATION FORMULA DISPLAY BOX */}
                        <div className="neu-inset p-3 bg-[#f0f4f9] text-xs font-mono space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wide">
                            <span>ASIC STA Formulation & Slacks ({refClk.name} = {period.toFixed(2)}ns)</span>
                            <span className="text-emerald-600 font-bold">
                              {isInput ? "INPUT BUS BUDGET" : "OUTPUT BUS BUDGET"}
                            </span>
                          </div>
                          {isInput ? (
                            <p className="text-slate-800 text-[11px] font-bold">
                              Max Delay = T_trace_max + T_co_max = <span className="text-emerald-600">{io.maxNs.toFixed(2)}ns</span> | Min Delay = T_trace_min + T_co_min = <span className="text-emerald-600">{io.minNs.toFixed(2)}ns</span>
                            </p>
                          ) : (
                            <p className="text-slate-800 text-[11px] font-bold">
                              Max Delay = T_trace_max + T_setup_ext = <span className="text-sky-600">{io.maxNs.toFixed(2)}ns</span> | Min Delay = T_trace_min - T_hold_ext = <span className="text-sky-600">{io.minNs.toFixed(2)}ns</span>
                            </p>
                          )}
                          <div className="flex flex-wrap gap-6 pt-1 text-[11px]">
                            <span className={setupSlack >= 0 ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                              Setup Slack: {setupSlack >= 0 ? `+${setupSlack.toFixed(2)}ns (PASS)` : `${setupSlack.toFixed(2)}ns (VIOLATION)`}
                            </span>
                            <span className={holdSlack >= 0 ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                              Hold Slack: {holdSlack >= 0 ? `+${holdSlack.toFixed(2)}ns (PASS)` : `${holdSlack.toFixed(2)}ns (VIOLATION)`}
                            </span>
                          </div>
                        </div>

                        {/* DUAL-TRACE ACCURATE CLOCK & DIGITAL DATA BUS SVG WAVEFORM */}
                        <div className="neu-panel-sm p-3 bg-[#e8edf5] space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-black text-sky-700 uppercase tracking-wide">
                            <span>Dual-Trace Clock ({refClk.name}) & Physical Delay vs. Net Slack Visualizer</span>
                            <span className="neu-badge text-[9px] text-slate-600 font-mono">
                              T_period: {period.toFixed(2)}ns | Internal T_su: 0.20ns | T_hd: 0.10ns
                            </span>
                          </div>

                          <svg viewBox="0 0 500 145" className="w-full h-40">
                            {/* Dotted Reference Grid Lines */}
                            <line x1={clkRiseX} y1="10" x2={clkRiseX} y2="135" stroke="#94a3b8" strokeDasharray="3,3" />
                            <line x1={clkCaptureX} y1="10" x2={clkCaptureX} y2="135" stroke="#94a3b8" strokeDasharray="3,3" />

                            {/* Internal ASIC Setup & Hold Requirement Shaded Boxes */}
                            {(() => {
                              const setupReqX = scaleX(period - setupAsic);
                              const holdReqX = scaleX(holdAsic);

                              return (
                                <g>
                                  {/* ASIC Hold Requirement Box at Launch Edge */}
                                  <rect
                                    x={clkRiseX}
                                    y="45"
                                    width={Math.max(4, holdReqX - clkRiseX)}
                                    height="34"
                                    fill="#f43f5e"
                                    fillOpacity="0.25"
                                    stroke="#e11d48"
                                    strokeDasharray="2,2"
                                    rx="2"
                                  />
                                  <text x={clkRiseX + 2} y="41" fill="#e11d48" fontSize="8" fontWeight="bold">
                                    Req T_hd ({holdAsic.toFixed(2)}ns)
                                  </text>

                                  {/* ASIC Setup Requirement Box at Capture Edge */}
                                  <rect
                                    x={setupReqX}
                                    y="45"
                                    width={Math.max(4, clkCaptureX - setupReqX)}
                                    height="34"
                                    fill="#f59e0b"
                                    fillOpacity="0.25"
                                    stroke="#d97706"
                                    strokeDasharray="2,2"
                                    rx="2"
                                  />
                                  <text x={setupReqX - 10} y="41" fill="#d97706" fontSize="8" fontWeight="bold">
                                    Req T_su ({setupAsic.toFixed(2)}ns)
                                  </text>
                                </g>
                              );
                            })()}

                            {/* 1. Dynamic Reference Clock Waveform (Blue) */}
                            {(() => {
                              const dutyRatio = refClk.waveformFalling ? refClk.waveformFalling / period : 0.5;
                              const pulsePx = (clkCaptureX - clkRiseX) * dutyRatio;
                              const clkFallX = clkRiseX + pulsePx;

                              return (
                                <g>
                                  <path
                                    d={`M 10 30 L ${clkRiseX} 30 L ${clkRiseX} 14 L ${clkFallX} 14 L ${clkFallX} 30 L ${clkCaptureX} 30 L ${clkCaptureX} 14 L ${Math.min(490, clkCaptureX + pulsePx)} 14 L ${Math.min(490, clkCaptureX + pulsePx)} 30 L 490 30`}
                                    fill="none"
                                    stroke="#0284c7"
                                    strokeWidth="2.5"
                                  />
                                  <circle cx={clkRiseX} cy="14" r="3" fill="#10b981" />
                                  <circle cx={clkCaptureX} cy="14" r="3" fill="#10b981" />
                                  <text x={clkRiseX - 22} y="11" fill="#0284c7" fontSize="9" fontWeight="bold">
                                    Launch (0ns)
                                  </text>
                                  <text x={clkCaptureX - 25} y="11" fill="#0284c7" fontSize="9" fontWeight="bold">
                                    Capture ({period.toFixed(1)}ns)
                                  </text>
                                </g>
                              );
                            })()}

                            {/* 2. Digital Data Bus Signal (Green Hexagonal Eye Pads) */}
                            <g>
                              {/* Background Data Valid Eye Box */}
                              <polygon
                                points={`${dataMinX - 6},62 ${dataMinX + 6},48 ${dataMaxX - 6},48 ${dataMaxX + 6},62 ${dataMaxX - 6},76 ${dataMinX + 6},76`}
                                fill="#10b981"
                                fillOpacity="0.7"
                                stroke="#059669"
                                strokeWidth="1.5"
                              />

                              {/* Data Bus Crossover Lines */}
                              <path
                                d={`M 10 62 L ${dataMinX - 6} 62 L ${dataMinX + 6} 48 L ${dataMaxX - 6} 48 L ${dataMaxX + 6} 62 L 490 62
                                    M 10 62 L ${dataMinX - 6} 62 L ${dataMinX + 6} 76 L ${dataMaxX - 6} 76 L ${dataMaxX + 6} 62 L 490 62`}
                                fill="none"
                                stroke="#047857"
                                strokeWidth="2"
                              />

                              <text x={Math.max(clkRiseX + 8, dataMinX + 8)} y="66" fill="#ffffff" fontSize="9" fontWeight="bold">
                                DATA (Min: {io.minNs.toFixed(2)}ns ➔ Max: {io.maxNs.toFixed(2)}ns)
                              </text>
                            </g>

                            {/* 3. PHYSICAL DELAY ARROWS & NET SLACK ARROWS */}
                            {(() => {
                              const setupReqX = scaleX(period - setupAsic);
                              const holdReqX = scaleX(holdAsic);

                              return (
                                <g>
                                  {/* PHYSICAL MIN DELAY ARROW (Launch 0ns ➔ T_min) */}
                                  <line x1={clkRiseX} y1="92" x2={dataMinX} y2="92" stroke="#64748b" strokeWidth="1.5" />
                                  <circle cx={clkRiseX} cy="92" r="2.5" fill="#64748b" />
                                  <circle cx={dataMinX} cy="92" r="2.5" fill="#64748b" />
                                  <text x={clkRiseX + 2} y="88" fill="#475569" fontSize="8" fontWeight="bold">
                                    Physical T_min ({io.minNs.toFixed(2)}ns)
                                  </text>

                                  {/* NET HOLD SLACK ARROW (Req T_hd ➔ T_min) */}
                                  <line
                                    x1={holdReqX}
                                    y1="110"
                                    x2={dataMinX}
                                    y2="110"
                                    stroke={holdSlack >= 0 ? "#059669" : "#e11d48"}
                                    strokeWidth="2"
                                  />
                                  <circle cx={holdReqX} cy="110" r="3" fill={holdSlack >= 0 ? "#059669" : "#e11d48"} />
                                  <circle cx={dataMinX} cy="110" r="3" fill={holdSlack >= 0 ? "#059669" : "#e11d48"} />
                                  <text
                                    x={Math.max(10, holdReqX)}
                                    y="124"
                                    fill={holdSlack >= 0 ? "#059669" : "#e11d48"}
                                    fontSize="9"
                                    fontWeight="bold"
                                  >
                                    Net Hold Slack ({holdSlack >= 0 ? `+${holdSlack.toFixed(2)}ns` : `${holdSlack.toFixed(2)}ns VIOLATION`})
                                  </text>

                                  {/* PHYSICAL REMAINING WINDOW (T_max ➔ Capture 1.0ns) */}
                                  <line x1={dataMaxX} y1="92" x2={clkCaptureX} y2="92" stroke="#64748b" strokeWidth="1.5" />
                                  <circle cx={dataMaxX} cy="92" r="2.5" fill="#64748b" />
                                  <circle cx={clkCaptureX} cy="92" r="2.5" fill="#64748b" />
                                  <text x={dataMaxX + 4} y="88" fill="#475569" fontSize="8" fontWeight="bold">
                                    Physical Window ({(period - io.maxNs).toFixed(2)}ns)
                                  </text>

                                  {/* NET SETUP SLACK ARROW (T_max ➔ Req T_su) */}
                                  <line
                                    x1={dataMaxX}
                                    y1="110"
                                    x2={setupReqX}
                                    y2="110"
                                    stroke={setupSlack >= 0 ? "#059669" : "#e11d48"}
                                    strokeWidth="2"
                                  />
                                  <circle cx={dataMaxX} cy="110" r="3" fill={setupSlack >= 0 ? "#059669" : "#e11d48"} />
                                  <circle cx={setupReqX} cy="110" r="3" fill={setupSlack >= 0 ? "#059669" : "#e11d48"} />
                                  <text
                                    x={Math.max(150, dataMaxX + 4)}
                                    y="124"
                                    fill={setupSlack >= 0 ? "#059669" : "#e11d48"}
                                    fontSize="9"
                                    fontWeight="bold"
                                  >
                                    Net Setup Slack ({setupSlack >= 0 ? `+${setupSlack.toFixed(2)}ns` : `${setupSlack.toFixed(2)}ns VIOLATION`})
                                  </text>
                                </g>
                              );
                            })()}
                          </svg>
                        </div>

                        {/* INTERACTIVE TIMING SLIDERS DECK (Delays + Library Setup/Hold Requirements) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Max Delay Slider */}
                          <div className="neu-inset p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-700">Max Delay (T_max)</span>
                              <span className="text-emerald-600 font-mono font-black">{io.maxNs.toFixed(2)} ns</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max={Math.min(20.0, period)}
                              step="0.05"
                              value={io.maxNs}
                              onChange={(e) =>
                                updateIoConstraint(io.id, { maxNs: parseFloat(e.target.value) || 0.1 })
                              }
                              className="neu-slider"
                            />
                          </div>

                          {/* Min Delay Slider */}
                          <div className="neu-inset p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-700">Min Delay (T_min)</span>
                              <span className="text-emerald-600 font-mono font-black">{io.minNs.toFixed(2)} ns</span>
                            </div>
                            <input
                              type="range"
                              min="0.0"
                              max={Math.min(10.0, io.maxNs)}
                              step="0.05"
                              value={io.minNs}
                              onChange={(e) =>
                                updateIoConstraint(io.id, { minNs: parseFloat(e.target.value) || 0 })
                              }
                              className="neu-slider"
                            />
                          </div>

                          {/* Internal Setup Requirement Slider (T_su) */}
                          <div className="neu-inset p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-700">Internal T_su Req</span>
                              <span className="text-amber-600 font-mono font-black">{setupAsic.toFixed(2)} ns</span>
                            </div>
                            <input
                              type="range"
                              min="0.00"
                              max="1.00"
                              step="0.05"
                              value={setupAsic}
                              onChange={(e) =>
                                updateIoConstraint(io.id, { setupAsic: parseFloat(e.target.value) || 0 })
                              }
                              className="neu-slider"
                            />
                          </div>

                          {/* Internal Hold Requirement Slider (T_hd) */}
                          <div className="neu-inset p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-700">Internal T_hd Req</span>
                              <span className="text-rose-600 font-mono font-black">{holdAsic.toFixed(2)} ns</span>
                            </div>
                            <input
                              type="range"
                              min="0.00"
                              max="0.50"
                              step="0.05"
                              value={holdAsic}
                              onChange={(e) =>
                                updateIoConstraint(io.id, { holdAsic: parseFloat(e.target.value) || 0 })
                              }
                              className="neu-slider"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ------------------ TAB 3: MULTICYCLE PATH EDGE SHIFT SLIDERS ------------------ */}
            {activeTab === "exceptions" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      <span>Multicycle Setup & Hold Edge Shift Methodology</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Independent setup check (Cycle N) and hold check (Cycle N - M) edge alignment visualizer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addMulticycle}
                    className="neu-btn px-3 py-1.5 text-xs font-bold text-amber-600 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Multicycle
                  </button>
                </div>

                {state.multicycles.length === 0 ? (
                  <div className="neu-inset p-8 text-center text-xs font-bold text-slate-500">
                    No multicycle paths configured. Click "Add Multicycle" above to create one.
                  </div>
                ) : (
                  state.multicycles.map((mcp) => {
                    const setupN = mcp.cycles || 2;
                    const holdM = mcp.holdCycles !== undefined ? mcp.holdCycles : (setupN - 1);
                    const holdCheckCycle = setupN - holdM;

                    // SVG Scaling for 6 cycles (x=50 to x=450)
                    const cycleWidth = 70;
                    const launchX = 50;
                    const setupCheckX = Math.min(470, launchX + setupN * cycleWidth);
                    const holdCheckX = Math.max(30, Math.min(470, launchX + holdCheckCycle * cycleWidth));

                    return (
                      <div key={mcp.id} className="neu-panel-sm p-4 space-y-4">
                        {/* Header Bar */}
                        <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="neu-badge text-[10px] font-black uppercase text-amber-600">
                              MULTICYCLE (N={setupN}, M={holdM})
                            </span>
                            <input
                              type="text"
                              value={mcp.from}
                              onChange={(e) => updateMulticycle(mcp.id, { from: e.target.value })}
                              className="neu-input px-2 py-1 text-xs font-mono text-slate-800 w-36"
                              placeholder="-from [pins]"
                            />
                            <span className="text-slate-400 font-bold">➔</span>
                            <input
                              type="text"
                              value={mcp.to}
                              onChange={(e) => updateMulticycle(mcp.id, { to: e.target.value })}
                              className="neu-input px-2 py-1 text-xs font-mono text-slate-800 w-36"
                              placeholder="-to [pins]"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={mcp.edge}
                              onChange={(e) =>
                                updateMulticycle(mcp.id, {
                                  edge: e.target.value as "start" | "end",
                                })
                              }
                              className="neu-badge text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                            >
                              <option value="end">-end (latch clk)</option>
                              <option value="start">-start (launch clk)</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => deleteMulticycle(mcp.id)}
                              className="neu-btn p-1.5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* FORMULA METHODOLOGY BOX */}
                        <div className="neu-inset p-3 bg-[#fdf8f0] text-xs font-mono space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-black text-amber-700 uppercase tracking-wide">
                            <span>PrimeTime / Tempus STA Edge Shift Equations</span>
                            <span>Align: {mcp.edge.toUpperCase()}</span>
                          </div>
                          <p className="text-slate-800 text-[11px] font-bold">
                            Setup Check Target = <span className="text-amber-600">Cycle {setupN}</span> | Hold Check Target = N - M = {setupN} - {holdM} = <span className="text-rose-600">Cycle {holdCheckCycle}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            (Default hold check moves to Cycle N-1 unless explicit -hold M is set)
                          </p>
                        </div>

                        {/* DUAL SETUP & HOLD SVG WAVEFORM */}
                        <div className="neu-inset p-3 bg-[#e8edf5]">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide block mb-1">
                            Multi-Cycle Setup & Hold Check Edge Alignment Waveform
                          </span>
                          <svg viewBox="0 0 500 95" className="w-full h-24">
                            {/* Dotted Cycle Grid Lines */}
                            {[0, 1, 2, 3, 4, 5].map((c) => (
                              <line
                                key={c}
                                x1={launchX + c * cycleWidth}
                                y1="10"
                                x2={launchX + c * cycleWidth}
                                y2="85"
                                stroke="#cbd5e1"
                                strokeDasharray="2,2"
                              />
                            ))}

                            {/* Multi-Period Clock Waveform Path */}
                            <path
                              d="M 10 40 L 50 40 L 50 15 L 85 15 L 85 40 L 120 40 L 120 15 L 155 15 L 155 40 L 190 40 L 190 15 L 225 15 L 225 40 L 260 40 L 260 15 L 295 15 L 295 40 L 330 40 L 330 15 L 365 15 L 365 40 L 400 40 L 400 15 L 435 15 L 435 40 L 490 40"
                              fill="none"
                              stroke="#0284c7"
                              strokeWidth="2.5"
                            />

                            {/* Launch Edge Marker (Cycle 0) */}
                            <circle cx={launchX} cy="15" r="4.5" fill="#10b981" />
                            <text x={launchX - 18} y="93" fill="#10b981" fontSize="9" fontWeight="bold">
                              Launch (0)
                            </text>

                            {/* Hold Check Marker (Cycle N - M) */}
                            <circle cx={holdCheckX} cy="15" r="5" fill="#e11d48" />
                            <text x={holdCheckX - 22} y="72" fill="#e11d48" fontSize="9" fontWeight="bold">
                              Hold Check ({holdCheckCycle})
                            </text>

                            {/* Setup Check Marker (Cycle N) */}
                            <circle cx={setupCheckX} cy="15" r="5" fill="#d97706" />
                            <text x={setupCheckX - 24} y="93" fill="#d97706" fontSize="9" fontWeight="bold">
                              Setup Check ({setupN})
                            </text>

                            {/* Setup Arrow (Green -> Amber) */}
                            <line
                              x1={launchX}
                              y1="25"
                              x2={setupCheckX}
                              y2="25"
                              stroke="#d97706"
                              strokeWidth="1.5"
                              strokeDasharray="3,3"
                            />

                            {/* Hold Arrow (Green -> Red) */}
                            <line
                              x1={launchX}
                              y1="50"
                              x2={holdCheckX}
                              y2="50"
                              stroke="#e11d48"
                              strokeWidth="1.5"
                              strokeDasharray="3,3"
                            />
                          </svg>
                        </div>

                        {/* DUAL SLIDERS: SETUP CYCLES (N) & HOLD CYCLES (M) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Setup Cycles Slider (N) */}
                          <div className="neu-inset p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-700">Setup Cycles (-setup N)</span>
                              <span className="text-amber-600 font-mono font-black">N = {setupN} Cycles</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={setupN}
                              onChange={(e) => {
                                const newN = parseInt(e.target.value) || 1;
                                updateMulticycle(mcp.id, {
                                  cycles: newN,
                                  holdCycles: Math.min(newN - 1, mcp.holdCycles ?? (newN - 1)),
                                });
                              }}
                              className="neu-slider"
                            />
                          </div>

                          {/* Hold Cycles Slider (M) */}
                          <div className="neu-inset p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-700">Hold Cycles (-hold M)</span>
                              <span className="text-rose-600 font-mono font-black">M = {holdM} Cycles</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={setupN}
                              step="1"
                              value={holdM}
                              onChange={(e) =>
                                updateMulticycle(mcp.id, {
                                  holdCycles: parseInt(e.target.value) || 0,
                                })
                              }
                              className="neu-slider"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ------------------ TAB 4: CDC MATRIX ------------------ */}
            {activeTab === "cdc" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>CDC Matrix Grid</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure domain interactions by toggling matrix cells.
                  </p>
                </div>

                <div className="neu-panel-sm p-4 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-slate-500 font-black uppercase text-[10px]">
                          Clocks
                        </th>
                        {allClocksList.map((clk) => (
                          <th key={clk} className="p-2 text-center text-sky-600 font-black text-[11px]">
                            {clk}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allClocksList.map((clkA) => (
                        <tr key={clkA} className="border-t border-slate-300/40">
                          <td className="p-2.5 font-black text-sky-600 text-xs">
                            {clkA}
                          </td>
                          {allClocksList.map((clkB) => {
                            const rel = getClockRelation(clkA, clkB);
                            const isSelf = clkA === clkB;
                            return (
                              <td key={clkB} className="p-1 text-center">
                                {isSelf ? (
                                  <span className="text-slate-400 text-[10px] select-none">—</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleClockRelation(clkA, clkB)}
                                    className={`neu-btn px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider w-full ${
                                      rel === "sync"
                                        ? "text-slate-500"
                                        : rel === "asynchronous"
                                        ? "neu-btn-active text-rose-600 font-black"
                                        : rel === "logically_exclusive"
                                        ? "neu-btn-active text-amber-600 font-black"
                                        : "neu-btn-active text-purple-600 font-black"
                                    }`}
                                  >
                                    {rel === "sync" ? "SYNC" : rel === "asynchronous" ? "ASYNC" : rel === "logically_exclusive" ? "LOG_EXCL" : "PHYS_EXCL"}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CODE VIEW & DIAGNOSTICS PANEL (Col 5) */}
        <div className="lg:col-span-5 neu-panel flex flex-col min-h-0 overflow-hidden p-5 gap-3">
          {/* Linter Diagnostic */}
          <div className="neu-inset p-3 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600 animate-pulse" />
                <span className="text-xs font-black text-slate-800">AST Constraint Diagnostics</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black">
                <span className={`neu-badge ${errorCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {errorCount} Errors
                </span>
                <span className={`neu-badge ${warningCount > 0 ? "text-amber-600" : "text-slate-500"}`}>
                  {warningCount} Warnings
                </span>
              </div>
            </div>

            {lintMessages.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {lintMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                      m.severity === "error"
                        ? "bg-rose-100/70 text-rose-800"
                        : m.severity === "warning"
                        ? "bg-amber-100/70 text-amber-800"
                        : "bg-sky-100/70 text-sky-800"
                    }`}
                  >
                    {m.severity === "error" ? (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : m.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-black text-[11px]">{m.title}</p>
                      <p className="text-[10px] leading-relaxed font-mono">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generated Code Panel */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-black text-sky-600">
              constraints_{vendor}.{vendor === "xilinx" ? "xdc" : "sdc"}
            </span>
            <span className="neu-badge text-[10px] font-black text-slate-600 uppercase">
              {vendor} FORMAT
            </span>
          </div>

          <div className="flex-1 neu-inset p-4 overflow-auto font-mono text-xs text-slate-800 leading-relaxed select-text">
            <pre className="whitespace-pre">{generatedCode}</pre>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 neu-panel px-5 py-3 text-xs font-black text-sky-700 shadow-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
