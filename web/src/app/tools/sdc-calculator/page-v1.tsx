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
  FileCode,
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

export default function SdcCalculatorPage() {
  const [state, setState] = useState<SdcStudioState>(DEFAULT_SDC_STATE);
  const [vendor, setVendor] = useState<VendorFormat>("synopsys");
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

  const loadPreset = (presetState: SdcStudioState, name: string) => {
    setState(structuredClone(presetState));
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

      // Purge deleted clock from clockGroups
      const nextClockGroups = prev.clockGroups
        .map((cg) => ({
          ...cg,
          group1Clocks: cg.group1Clocks.filter((name) => name !== targetName),
          group2Clocks: cg.group2Clocks.filter((name) => name !== targetName),
        }))
        .filter((cg) => cg.group1Clocks.length > 0 && cg.group2Clocks.length > 0);

      // Re-assign orphaned I/O constraints
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
  };

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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden p-3 md:p-5 gap-4 select-none">
      {/* NEUMORPHIC TOP BAR */}
      <header className="neu-panel p-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="neu-inset p-3 flex items-center justify-center text-sky-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">
                ASIC STA WORKBENCH
              </span>
              <span className="neu-badge text-[9px] font-black text-slate-600">
                LIGHT NEUMORPHIC UI
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              SDC Constraint Studio & Linter
            </h1>
          </div>
        </div>

        {/* Action Controls */}
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

          {/* Vendor Selector Pills */}
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

          {/* Buttons */}
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

      {/* MAIN NEUMORPHIC WORKBENCH BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
        {/* LEFT WORKSTATION PANEL (Col 7) */}
        <div className="lg:col-span-7 neu-panel flex flex-col min-h-0 overflow-hidden p-5 gap-4">
          {/* NEUMORPHIC TABS */}
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
              <span>1. Clocks & Tree</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.primaryClocks.length + state.generatedClocks.length}
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
              <span>2. CDC Matrix</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.clockGroups.length}
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
              <SlidersHorizontal className="h-4 w-4" />
              <span>3. I/O Delays</span>
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
              <span>4. Exceptions</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.multicycles.length + state.falsePaths.length}
              </span>
            </button>
          </div>

          {/* TAB EDITORS SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {/* ------------------ TAB 1: CLOCKS ------------------ */}
            {activeTab === "clocks" && (
              <div className="space-y-6">
                {/* Primary Clocks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <span>Primary Clocks (`create_clock`)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Base oscillators, virtual reference clocks, uncertainty, and latency bounds.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addPrimaryClock}
                      className="neu-btn px-3 py-1.5 text-xs font-bold text-sky-600 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Clock
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.primaryClocks.map((clk) => (
                      <div key={clk.id} className="neu-panel-sm p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={clk.name}
                              onChange={(e) => updatePrimaryClock(clk.id, { name: e.target.value })}
                              className="neu-input px-2.5 py-1 text-xs font-black text-sky-600 w-32"
                              placeholder="Clock Name"
                            />
                            <span className="text-[11px] font-bold text-slate-500">
                              ({(1000 / clk.periodNs).toFixed(1)} MHz)
                            </span>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer ml-2">
                              <input
                                type="checkbox"
                                checked={clk.isVirtual}
                                onChange={(e) => updatePrimaryClock(clk.id, { isVirtual: e.target.checked })}
                                className="rounded text-sky-600"
                              />
                              Virtual Clock
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => deletePrimaryClock(clk.id)}
                            className="neu-btn p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Period (ns)
                            <input
                              type="number"
                              step="0.1"
                              value={clk.periodNs}
                              onChange={(e) =>
                                updatePrimaryClock(clk.id, {
                                  periodNs: parseFloat(e.target.value) || 1,
                                  waveformFalling: (parseFloat(e.target.value) || 1) / 2,
                                })
                              }
                              className="neu-input px-2.5 py-1.5 text-slate-800"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Target Pin / Port
                            <input
                              type="text"
                              disabled={clk.isVirtual}
                              value={clk.targets}
                              onChange={(e) => updatePrimaryClock(clk.id, { targets: e.target.value })}
                              placeholder="[get_ports clk_in]"
                              className="neu-input px-2.5 py-1.5 text-slate-800 disabled:opacity-40"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Uncertainty (Setup/Hold)
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={clk.uncertaintySetup}
                                onChange={(e) =>
                                  updatePrimaryClock(clk.id, { uncertaintySetup: parseFloat(e.target.value) || 0 })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                                placeholder="Setup"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={clk.uncertaintyHold}
                                onChange={(e) =>
                                  updatePrimaryClock(clk.id, { uncertaintyHold: parseFloat(e.target.value) || 0 })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                                placeholder="Hold"
                              />
                            </div>
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Latency (Src / Net)
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={clk.latencySource}
                                onChange={(e) =>
                                  updatePrimaryClock(clk.id, { latencySource: parseFloat(e.target.value) || 0 })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                                placeholder="Src"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={clk.latencyNetwork}
                                onChange={(e) =>
                                  updatePrimaryClock(clk.id, { latencyNetwork: parseFloat(e.target.value) || 0 })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                                placeholder="Net"
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Clocks */}
                <div className="space-y-3 pt-4 border-t border-slate-300/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <span>Generated Clocks (`create_generated_clock`)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        PLL dividers, multipliers, and phase-shifted derived clocks.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addGeneratedClock}
                      className="neu-btn px-3 py-1.5 text-xs font-bold text-purple-600 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Generated Clock
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.generatedClocks.map((gclk) => (
                      <div key={gclk.id} className="neu-panel-sm p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={gclk.name}
                              onChange={(e) => updateGeneratedClock(gclk.id, { name: e.target.value })}
                              className="neu-input px-2.5 py-1 text-xs font-black text-purple-600 w-36"
                              placeholder="Generated Clock Name"
                            />
                            <span className="text-[11px] font-bold text-slate-500">
                              (Divide: {gclk.divideBy}x | Multiply: {gclk.multiplyBy}x)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteGeneratedClock(gclk.id)}
                            className="neu-btn p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Master Clock
                            <select
                              value={gclk.masterClockId}
                              onChange={(e) => updateGeneratedClock(gclk.id, { masterClockId: e.target.value })}
                              className="neu-input px-2 py-1.5 text-slate-800"
                            >
                              {state.primaryClocks.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Source Pin (`-source`)
                            <input
                              type="text"
                              value={gclk.sourcePin}
                              onChange={(e) => updateGeneratedClock(gclk.id, { sourcePin: e.target.value })}
                              placeholder="[get_pins u_pll/clk_out]"
                              className="neu-input px-2.5 py-1.5 text-slate-800"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Divide / Multiply
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={gclk.divideBy}
                                onChange={(e) =>
                                  updateGeneratedClock(gclk.id, { divideBy: parseInt(e.target.value) || 1 })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                                placeholder="Div"
                              />
                              <input
                                type="number"
                                min="1"
                                value={gclk.multiplyBy}
                                onChange={(e) =>
                                  updateGeneratedClock(gclk.id, { multiplyBy: parseInt(e.target.value) || 1 })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                                placeholder="Mult"
                              />
                            </div>
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Target Object
                            <input
                              type="text"
                              value={gclk.targets}
                              onChange={(e) => updateGeneratedClock(gclk.id, { targets: e.target.value })}
                              placeholder="[get_pins u_div/Q]"
                              className="neu-input px-2.5 py-1.5 text-slate-800"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------ TAB 2: CDC MATRIX ------------------ */}
            {activeTab === "cdc" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>Clock Domain CDC Matrix (`set_clock_groups`)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Click cells to cycle domain relationships: <b className="text-emerald-600">Synchronous</b> $\rightarrow$ <b className="text-rose-600">Asynchronous (-asynchronous)</b> $\rightarrow$ <b className="text-amber-600">Logically Exclusive</b> $\rightarrow$ <b className="text-purple-600">Physically Exclusive</b>.
                  </p>
                </div>

                {allClocksList.length < 2 ? (
                  <div className="neu-inset p-8 text-center text-xs text-slate-500 font-bold">
                    Please define at least 2 clocks in Tab 1 to configure domain interactions.
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* ------------------ TAB 3: I/O DELAYS ------------------ */}
            {activeTab === "io" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span>I/O Interface Delays (`set_input_delay`, `set_output_delay`)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Constrain external chip interfaces relative to reference clocks with driving cells and loads.
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

                <div className="space-y-3">
                  {state.ioConstraints.map((io) => (
                    <div key={io.id} className="neu-panel-sm p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`neu-badge text-[10px] font-black uppercase ${
                              io.delayType === "input" ? "text-emerald-600" : "text-sky-600"
                            }`}
                          >
                            {io.delayType}
                          </span>
                          <input
                            type="text"
                            value={io.portName}
                            onChange={(e) => updateIoConstraint(io.id, { portName: e.target.value })}
                            className="neu-input px-2.5 py-1 text-xs font-bold text-slate-800 w-44"
                            placeholder="[get_ports data[*]]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteIoConstraint(io.id)}
                          className="neu-btn p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                          Ref Clock
                          <select
                            value={io.clockName}
                            onChange={(e) => updateIoConstraint(io.id, { clockName: e.target.value })}
                            className="neu-input px-2 py-1.5 text-slate-800"
                          >
                            {allClocksList.map((clk) => (
                              <option key={clk} value={clk}>
                                {clk}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                          Delay Bounds (Min / Max ns)
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={io.minNs}
                              onChange={(e) =>
                                updateIoConstraint(io.id, { minNs: parseFloat(e.target.value) || 0 })
                              }
                              className="neu-input px-2 py-1.5 w-full text-slate-800"
                              placeholder="Min"
                            />
                            <input
                              type="number"
                              step="0.1"
                              value={io.maxNs}
                              onChange={(e) =>
                                updateIoConstraint(io.id, { maxNs: parseFloat(e.target.value) || 0 })
                              }
                              className="neu-input px-2 py-1.5 w-full text-slate-800"
                              placeholder="Max"
                            />
                          </div>
                        </label>

                        <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                          {io.delayType === "input" ? "Driving Cell" : "Load (pF)"}
                          {io.delayType === "input" ? (
                            <input
                              type="text"
                              value={io.drivingCell || ""}
                              onChange={(e) => updateIoConstraint(io.id, { drivingCell: e.target.value })}
                              placeholder="BUF_X4"
                              className="neu-input px-2 py-1.5 text-slate-800"
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.5"
                              value={io.loadPf || 10}
                              onChange={(e) =>
                                updateIoConstraint(io.id, { loadPf: parseFloat(e.target.value) || 0 })
                              }
                              className="neu-input px-2 py-1.5 text-slate-800"
                            />
                          )}
                        </label>

                        <div className="flex flex-col justify-end gap-1.5 text-[11px]">
                          <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={io.clockFall}
                              onChange={(e) => updateIoConstraint(io.id, { clockFall: e.target.checked })}
                              className="rounded text-emerald-600"
                            />
                            -clock_fall
                          </label>
                          <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={io.addDelay}
                              onChange={(e) => updateIoConstraint(io.id, { addDelay: e.target.checked })}
                              className="rounded text-emerald-600"
                            />
                            -add_delay
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------ TAB 4: EXCEPTIONS ------------------ */}
            {activeTab === "exceptions" && (
              <div className="space-y-6">
                {/* Multicycle Paths */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <span>Multicycle Paths (`set_multicycle_path`)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Multi-cycle setup/hold relaxation with dynamic timing edge shift diagram.
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

                  <div className="space-y-3">
                    {state.multicycles.map((mcp) => (
                      <div key={mcp.id} className="neu-panel-sm p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                          <span className="neu-badge text-[10px] font-black uppercase text-amber-600">
                            {mcp.type} ({mcp.cycles} cycles)
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteMulticycle(mcp.id)}
                            className="neu-btn p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            -from Register Pin
                            <input
                              type="text"
                              value={mcp.from}
                              onChange={(e) => updateMulticycle(mcp.id, { from: e.target.value })}
                              className="neu-input px-2.5 py-1.5 text-slate-800 font-mono"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            -to Register Pin
                            <input
                              type="text"
                              value={mcp.to}
                              onChange={(e) => updateMulticycle(mcp.id, { to: e.target.value })}
                              className="neu-input px-2.5 py-1.5 text-slate-800 font-mono"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Cycles ($N$)
                            <input
                              type="number"
                              min="1"
                              value={mcp.cycles}
                              onChange={(e) =>
                                updateMulticycle(mcp.id, { cycles: parseInt(e.target.value) || 1 })
                              }
                              className="neu-input px-2.5 py-1.5 text-slate-800"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            Check Type & Edge
                            <div className="flex items-center gap-1">
                              <select
                                value={mcp.type}
                                onChange={(e) =>
                                  updateMulticycle(mcp.id, { type: e.target.value as 'setup' | 'hold' })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                              >
                                <option value="setup">setup</option>
                                <option value="hold">hold</option>
                              </select>
                              <select
                                value={mcp.edge}
                                onChange={(e) =>
                                  updateMulticycle(mcp.id, { edge: e.target.value as 'start' | 'end' })
                                }
                                className="neu-input px-2 py-1.5 w-full text-slate-800"
                              >
                                <option value="end">-end</option>
                                <option value="start">-start</option>
                              </select>
                            </div>
                          </label>
                        </div>

                        {/* Soft Neumorphic Waveform Canvas */}
                        <div className="neu-inset p-3 space-y-1">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide block">
                            Multicycle Edge Shift Timing Waveform
                          </span>
                          <svg viewBox="0 0 500 65" className="w-full h-14">
                            <line x1="50" y1="10" x2="50" y2="55" stroke="#cbd5e1" strokeDasharray="2,2" />
                            <line x1="150" y1="10" x2="150" y2="55" stroke="#cbd5e1" strokeDasharray="2,2" />
                            <line x1="250" y1="10" x2="250" y2="55" stroke="#cbd5e1" strokeDasharray="2,2" />
                            <line x1="350" y1="10" x2="350" y2="55" stroke="#cbd5e1" strokeDasharray="2,2" />

                            <path
                              d="M 10 30 L 50 30 L 50 15 L 100 15 L 100 30 L 150 30 L 150 15 L 200 15 L 200 30 L 250 30 L 250 15 L 300 15 L 300 30 L 350 30 L 350 15 L 400 15 L 400 30"
                              fill="none"
                              stroke="#0284c7"
                              strokeWidth="2.5"
                            />

                            <circle cx="50" cy="15" r="4" fill="#10b981" />
                            <text x="38" y="48" fill="#10b981" fontSize="9" fontWeight="bold">
                              Launch (0)
                            </text>

                            {mcp.type === "setup" ? (
                              <>
                                <circle cx={50 + mcp.cycles * 100} cy="15" r="4" fill="#d97706" />
                                <text x={35 + mcp.cycles * 100} y="48" fill="#d97706" fontSize="9" fontWeight="bold">
                                  Setup Check ({mcp.cycles})
                                </text>
                              </>
                            ) : (
                              <>
                                <circle cx={50 + mcp.cycles * 100} cy="15" r="4" fill="#e11d48" />
                                <text x={35 + mcp.cycles * 100} y="48" fill="#e11d48" fontSize="9" fontWeight="bold">
                                  Hold Check ({mcp.cycles})
                                </text>
                              </>
                            )}
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* False Paths */}
                <div className="space-y-3 pt-4 border-t border-slate-300/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <span>False Paths (`set_false_path`)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Disable STA path checks for static status registers or async resets.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addFalsePath}
                      className="neu-btn px-3 py-1.5 text-xs font-bold text-rose-600 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add False Path
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.falsePaths.map((fp) => (
                      <div key={fp.id} className="neu-panel-sm p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                          <input
                            type="text"
                            value={fp.comment || ""}
                            onChange={(e) => updateFalsePath(fp.id, { comment: e.target.value })}
                            className="neu-input px-2.5 py-1 text-xs font-bold text-rose-600 w-72"
                            placeholder="Description (e.g. Reset Path)"
                          />
                          <button
                            type="button"
                            onClick={() => deleteFalsePath(fp.id)}
                            className="neu-btn p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            -from Object
                            <input
                              type="text"
                              value={fp.from}
                              onChange={(e) => updateFalsePath(fp.id, { from: e.target.value })}
                              className="neu-input px-2.5 py-1.5 text-slate-800 font-mono"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            -through Object
                            <input
                              type="text"
                              value={fp.through}
                              onChange={(e) => updateFalsePath(fp.id, { through: e.target.value })}
                              className="neu-input px-2.5 py-1.5 text-slate-800 font-mono"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                            -to Object
                            <input
                              type="text"
                              value={fp.to}
                              onChange={(e) => updateFalsePath(fp.id, { to: e.target.value })}
                              className="neu-input px-2.5 py-1.5 text-slate-800 font-mono"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT GENERATED CODE & LINTER PANEL (Col 5) */}
        <div className="lg:col-span-5 neu-panel flex flex-col min-h-0 overflow-hidden p-5 gap-3">
          {/* Linter Diagnostic Header */}
          <div className="neu-inset p-3 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600 animate-pulse" />
                <span className="text-xs font-black text-slate-800">AST Constraint Linter</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black">
                <span
                  className={`neu-badge ${
                    errorCount > 0 ? "text-rose-600 font-bold" : "text-emerald-600"
                  }`}
                >
                  {errorCount} Errors
                </span>
                <span
                  className={`neu-badge ${
                    warningCount > 0 ? "text-amber-600 font-bold" : "text-slate-500"
                  }`}
                >
                  {warningCount} Warnings
                </span>
              </div>
            </div>

            {/* Diagnostic Message List */}
            {lintMessages.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {lintMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                      m.severity === "error"
                        ? "bg-rose-100/70 border border-rose-200 text-rose-800"
                        : m.severity === "warning"
                        ? "bg-amber-100/70 border border-amber-200 text-amber-800"
                        : "bg-sky-100/70 border border-sky-200 text-sky-800"
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

          {/* Code Viewer Title */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-black text-sky-600">
              constraints_{vendor}.{vendor === "xilinx" ? "xdc" : "sdc"}
            </span>
            <span className="neu-badge text-[10px] font-black text-slate-600 uppercase">
              {vendor} FORMAT
            </span>
          </div>

          {/* Soft Recessed Code Editor */}
          <div className="flex-1 neu-inset p-4 overflow-auto font-mono text-xs text-slate-800 leading-relaxed select-text">
            <pre className="whitespace-pre">{generatedCode}</pre>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 neu-panel px-5 py-3 text-xs font-black text-sky-700 shadow-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
