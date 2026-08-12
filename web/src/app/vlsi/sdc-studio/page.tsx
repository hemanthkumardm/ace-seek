"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
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
  SdcToolTarget,
  generateSdcCode,
  lintSdcState,
  parseSdcText,
  normalizeSdcState,
  PrimaryClock,
  GeneratedClock,
  ClockGroupRelation,
  IoConstraint,
  MulticycleConstraint,
  FalsePathConstraint,
  computeAllBudgets,
  buildClockTreeSchematic,
  buildClockWaveformModel,
  buildMcpWaveformModel,
  clockSvgPath,
  parseTimingPathSnippet,
  suggestionsFromTimingPath,
  SdcSuggestion,
  TimingBudget,
  summarizeCdc,
  buildCdcDomainMap,
  cdcFixSuggestions,
  suggestionsFromCdcPath,
  applyCdcRelation,
  getCdcRelation,
  CDC_DOMAIN_COLORS,
  CdcRelation,
  getSdcGraphStats,
  allClockNames,
} from "@/lib/sdc-engine";
import {
  diffSdcStates,
  type SdcDiffResult,
} from "@/lib/diff-engine-vlsi";
import { saveLastSdcStateJson, loadLastSdcStateJson } from "@/lib/studio-shared";
import { GitBranch, Link2, Calculator, Network, Shield, Cloud, CloudOff } from "lucide-react";
import {
  applySdcPullToStudio,
  buildSdcProjectPack,
  buildTransferFromPack,
  clearSdcPull,
  loadMmmcModeSnapshot,
  loadSdcPull,
  saveSdcTransfer,
  summarizeFromSdcState,
  upsertSdcProject,
  type MmmcModeSnapshot,
} from "@/lib/sdc-mmmc-bridge";
import {
  clearHubTransfer,
  loadHubTransfer,
} from "@/lib/report-hub-engine";
import {
  fetchActiveSdcProject,
  saveSdcProject,
} from "@/lib/cloud-projects";
import { VlsiStudioGate } from "@/components/VlsiStudioGate";

function InteractiveSdcStudioPage() {
  const [state, setState] = useState<SdcStudioState>(() =>
    normalizeSdcState(DEFAULT_SDC_STATE)
  );
  const [vendor, setVendor] = useState<VendorFormat>("synopsys");
  const [tool, setTool] = useState<SdcToolTarget>("primetime");
  const [selectedClkId, setSelectedClkId] = useState<string>("clk_sys");
  const [activeTab, setActiveTab] = useState<
    "clocks" | "cdc" | "io" | "exceptions" | "schematic" | "budget" | "link"
  >("clocks");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [pathSnippet, setPathSnippet] = useState("");
  const [cdcPathSnippet, setCdcPathSnippet] = useState("");
  const [cdcPanel, setCdcPanel] = useState<"matrix" | "map" | "fixes" | "link">(
    "matrix"
  );
  const [baselineState, setBaselineState] = useState<SdcStudioState | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachModeName, setAttachModeName] = useState("func");
  const [attachFileName, setAttachFileName] = useState("constraints_func.sdc");
  const [attachAction, setAttachAction] = useState<"auto" | "create" | "bind">("auto");
  const [attachTargetModeId, setAttachTargetModeId] = useState("");
  const [mmmcModes, setMmmcModes] = useState<MmmcModeSnapshot | null>(null);
  const [linkedModeLabel, setLinkedModeLabel] = useState("");
  /** Cloud project id when account sync is available */
  const [cloudProjectId, setCloudProjectId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<
    "off" | "local" | "syncing" | "synced" | "error"
  >("local");
  const [hydrated, setHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diffFileInputRef = useRef<HTMLInputElement>(null);
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextCloudSave = useRef(false);

  const sdcDiff: SdcDiffResult | null = useMemo(() => {
    if (!baselineState) return null;
    return diffSdcStates(baselineState, state);
  }, [baselineState, state]);

  // Deep links + hydrate: transfer > localStorage > default, then cloud if signed in
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const qTab = params.get("tab");
    const qVendor = params.get("vendor");
    const qTool = params.get("tool");
    const fromMmmc = params.get("from_mmmc") === "true";
    const fromHub = params.get("from_hub") === "true";
    const qMode = params.get("mode");

    if (qTab && ["clocks", "cdc", "io", "exceptions", "schematic", "budget", "link"].includes(qTab)) {
      setActiveTab(qTab as any);
    }
    if (qVendor && ["synopsys", "cadence", "xilinx", "quartus"].includes(qVendor)) {
      setVendor(qVendor as any);
    }
    if (qTool && ["generic", "primetime", "genus", "innovus", "tempus", "vivado", "quartus"].includes(qTool)) {
      setTool(qTool as any);
    }

    setMmmcModes(loadMmmcModeSnapshot());

    let loadedFromTransfer = false;

    if (fromHub) {
      const transfer = loadHubTransfer();
      if (transfer?.text) {
        try {
          const parsed = normalizeSdcState(parseSdcText(transfer.text));
          skipNextCloudSave.current = true;
          setState(parsed);
          if (parsed.primaryClocks[0]) setSelectedClkId(parsed.primaryClocks[0].id);
          setToast(`Loaded from Report Hub: ${transfer.filename || "sdc"}`);
          window.setTimeout(() => setToast(""), 2500);
          loadedFromTransfer = true;
        } catch {
          /* ignore */
        }
        clearHubTransfer();
        const url = new URL(window.location.href);
        url.searchParams.delete("from_hub");
        window.history.replaceState(null, "", url.toString());
      }
    }

    if (!loadedFromTransfer && (fromMmmc || loadSdcPull())) {
      const pull = loadSdcPull();
      if (pull && (pull.sdcText || pull.sdcStateJson)) {
        const { state: pulled, modeName } = applySdcPullToStudio(pull);
        skipNextCloudSave.current = true;
        setState(pulled);
        setLinkedModeLabel(modeName || qMode || pull.modeName);
        if (pulled.primaryClocks[0]) setSelectedClkId(pulled.primaryClocks[0].id);
        setToast(
          `Loaded MMMC mode "${modeName}" into SDC Studio (${allClockNames(pulled).length} clocks)`
        );
        window.setTimeout(() => setToast(""), 2800);
        clearSdcPull();
        const url = new URL(window.location.href);
        url.searchParams.delete("from_mmmc");
        window.history.replaceState(null, "", url.toString());
        loadedFromTransfer = true;
      }
    }

    // Auto-restore last browser session (fixes SDC → Timing → SDC revert)
    if (!loadedFromTransfer) {
      const raw = loadLastSdcStateJson();
      if (raw) {
        try {
          const parsed = normalizeSdcState(JSON.parse(raw));
          skipNextCloudSave.current = true;
          setState(parsed);
          if (parsed.primaryClocks[0]) setSelectedClkId(parsed.primaryClocks[0].id);
          setCloudStatus("local");
          setToast("Restored SDC from this browser");
          window.setTimeout(() => setToast(""), 1800);
        } catch {
          /* keep default */
        }
      }
    }

    setHydrated(true);

    // Multi-device: cloud active project wins when newer / available
    (async () => {
      const cloud = await fetchActiveSdcProject();
      if (cancelled || !cloud?.state_json) return;
      try {
        const parsed = normalizeSdcState(cloud.state_json);
        skipNextCloudSave.current = true;
        setState(parsed);
        if (cloud.vendor) setVendor(cloud.vendor as VendorFormat);
        if (cloud.tool) setTool(cloud.tool as SdcToolTarget);
        if (parsed.primaryClocks[0]) setSelectedClkId(parsed.primaryClocks[0].id);
        setCloudProjectId(cloud.id);
        setCloudStatus("synced");
        setToast(`Cloud SDC loaded · ${cloud.name || "project"}`);
        window.setTimeout(() => setToast(""), 2200);
      } catch {
        /* keep local */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let changed = false;

    if (activeTab && url.searchParams.get("tab") !== activeTab) {
      url.searchParams.set("tab", activeTab);
      changed = true;
    }
    if (vendor && url.searchParams.get("vendor") !== vendor) {
      url.searchParams.set("vendor", vendor);
      changed = true;
    }
    if (tool && url.searchParams.get("tool") !== tool) {
      url.searchParams.set("tool", tool);
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, "", url.toString());
    }
  }, [activeTab, vendor, tool]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  // Persist SDC on this device (always) + debounced account cloud save when available
  useEffect(() => {
    if (!hydrated) return;
    try {
      saveLastSdcStateJson(JSON.stringify(normalizeSdcState(state)));
    } catch {
      /* ignore */
    }

    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }

    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(async () => {
      setCloudStatus((s) => (s === "off" ? s : "syncing"));
      const result = await saveSdcProject({
        id: cloudProjectId || undefined,
        name: "Working SDC",
        vendor,
        tool,
        state: normalizeSdcState(state),
        setActive: true,
      });
      if (result.ok) {
        setCloudProjectId(result.project.id);
        setCloudStatus("synced");
      } else if (
        result.error.includes("Sign in") ||
        result.error.includes("Sign in") ||
        result.error.includes("Cloud project") ||
        result.error.includes("unavailable")
      ) {
        setCloudStatus("local");
      } else {
        setCloudStatus("error");
      }
    }, 1600);

    return () => {
      if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    };
  }, [state, vendor, tool, hydrated, cloudProjectId]);

  const generatedCode = useMemo(() => {
    return generateSdcCode(state, vendor);
  }, [state, vendor]);

  const sdcClockMeta = useMemo(() => summarizeFromSdcState(state), [state]);

  const openAttachDialog = () => {
    setMmmcModes(loadMmmcModeSnapshot());
    const defaultName = linkedModeLabel || "func";
    setAttachModeName(defaultName);
    setAttachFileName(
      defaultName.endsWith(".sdc")
        ? defaultName
        : `constraints_${defaultName}.sdc`
    );
    setAttachAction("auto");
    setAttachTargetModeId("");
    setAttachOpen(true);
  };

  const confirmAttachToMmmc = () => {
    const pack = buildSdcProjectPack({
      state,
      sdcText: generatedCode,
      name: attachModeName.trim() || "func",
      fileName: attachFileName.trim() || "constraints_func.sdc",
      vendor,
      source: "sdc-studio",
    });
    upsertSdcProject(pack);
    const transfer = buildTransferFromPack(
      pack,
      attachAction,
      attachAction === "bind" ? attachTargetModeId || undefined : undefined
    );
    saveSdcTransfer(transfer);
    setAttachOpen(false);
    flash(
      `Pushing SDC pack "${pack.name}" (${pack.clockCount} clocks) → MMMC…`
    );
    window.location.href = `/vlsi/mmmc-studio?tab=configure&import_sdc=true`;
  };

  const lintMessages = useMemo(() => {
    return lintSdcState(state, tool, vendor);
  }, [state, tool, vendor]);

  const budgets = useMemo(() => computeAllBudgets(state), [state]);
  const clockTree = useMemo(() => buildClockTreeSchematic(state), [state]);

  const pathSuggestions = useMemo(() => {
    const parsed = parseTimingPathSnippet(pathSnippet);
    if (!parsed) return [] as SdcSuggestion[];
    return suggestionsFromTimingPath(parsed, state);
  }, [pathSnippet, state]);

  const cdcSummary = useMemo(() => summarizeCdc(state), [state]);
  const cdcMap = useMemo(() => buildCdcDomainMap(state), [state]);
  const cdcFixes = useMemo(() => cdcFixSuggestions(state), [state]);
  const sdcGraphStats = useMemo(() => getSdcGraphStats(state), [state]);
  const cdcPathFixes = useMemo(() => {
    const parsed = parseTimingPathSnippet(cdcPathSnippet);
    if (!parsed) return [];
    return suggestionsFromCdcPath(parsed, state);
  }, [cdcPathSnippet, state]);

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

  const clkWave = useMemo(
    () => buildClockWaveformModel(state, selectedClk.name),
    [state, selectedClk]
  );

  const loadPreset = (presetState: SdcStudioState, name: string) => {
    const next = normalizeSdcState(structuredClone(presetState));
    setState(next);
    if (next.primaryClocks[0]) {
      setSelectedClkId(next.primaryClocks[0].id);
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
        const parsed = normalizeSdcState(parseSdcText(text));
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

  const getClockRelation = (clkA: string, clkB: string): CdcRelation => {
    return getCdcRelation(state, clkA, clkB);
  };

  const toggleClockRelation = (clkA: string, clkB: string) => {
    if (clkA === clkB) return;
    const current = getClockRelation(clkA, clkB);
    const nextType: CdcRelation =
      current === "sync"
        ? "asynchronous"
        : current === "asynchronous"
        ? "logically_exclusive"
        : current === "logically_exclusive"
        ? "physically_exclusive"
        : "sync";

    setState((prev) => applyCdcRelation(prev, clkA, clkB, nextType));
    flash(
      nextType === "sync"
        ? `${clkA} ↔ ${clkB}: SYNC (timed)`
        : `${clkA} ↔ ${clkB}: ${nextType}`
    );
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
                SDC ENGINE v2
              </span>
              <span
                className={`neu-badge text-[9px] font-black inline-flex items-center gap-1 ${
                  cloudStatus === "synced"
                    ? "text-sky-700"
                    : cloudStatus === "syncing"
                      ? "text-amber-700"
                      : cloudStatus === "error"
                        ? "text-red-600"
                        : "text-slate-600"
                }`}
                title={
                  cloudStatus === "synced"
                    ? "Synced to your Ace-Seek account (multi-device)"
                    : cloudStatus === "syncing"
                      ? "Saving…"
                      : cloudStatus === "error"
                        ? "Account sync failed"
                        : "Saved on this device (restores when you return)"
                }
              >
                {cloudStatus === "synced" || cloudStatus === "syncing" ? (
                  <Cloud className="w-3 h-3" />
                ) : (
                  <CloudOff className="w-3 h-3" />
                )}
                {cloudStatus === "synced"
                  ? "CLOUD"
                  : cloudStatus === "syncing"
                    ? "SYNC…"
                    : cloudStatus === "error"
                      ? "CLOUD ERR"
                      : "LOCAL"}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              SDC Studio — Budget · Schematic · Timing Link
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
              className="bg-white text-slate-900 outline-none cursor-pointer font-bold rounded px-1 border border-slate-300"
            >
              <option value="" disabled className="bg-white text-slate-900">
                Load Chip Preset…
              </option>
              {SDC_PRESETS.map((p) => (
                <option key={p.name} value={p.name} className="bg-white text-slate-900">
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
              Xilinx
            </button>
            <button
              type="button"
              onClick={() => setVendor("quartus")}
              className={`px-3 py-1.5 rounded-lg transition ${
                vendor === "quartus" ? "neu-btn-active text-orange-600 font-black" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Quartus
            </button>
          </div>

          {/* Tool target for lint */}
          <div className="neu-inset px-2 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
            <Cpu className="h-3.5 w-3.5 text-purple-500" />
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value as SdcToolTarget)}
              className="bg-white text-slate-900 outline-none cursor-pointer font-black uppercase rounded px-1 border border-slate-300"
              title="Tool-aware lint target"
            >
              <option value="generic" className="bg-white text-slate-900">Generic</option>
              <option value="primetime" className="bg-white text-slate-900">PrimeTime</option>
              <option value="genus" className="bg-white text-slate-900">Genus</option>
              <option value="innovus" className="bg-white text-slate-900">Innovus</option>
              <option value="tempus" className="bg-white text-slate-900">Tempus</option>
              <option value="vivado" className="bg-white text-slate-900">Vivado</option>
              <option value="quartus" className="bg-white text-slate-900">Quartus</option>
            </select>
          </div>

          {/* Action Buttons */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".sdc,.xdc,.tcl,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={diffFileInputRef}
            type="file"
            accept=".sdc,.xdc,.tcl,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                  const parsed = parseSdcText(text);
                  setBaselineState(parsed);
                  flash(`Loaded Baseline SDC: ${file.name} for Diff comparison`);
                }
              };
              reader.readAsText(file);
            }}
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
            onClick={openAttachDialog}
            className="neu-btn px-3 py-2 text-xs font-black flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border-indigo-600 hover:bg-indigo-100"
            title="Attach this SDC constraint set to MMMC Constraint Mode"
          >
            <Layers className="h-4 w-4 text-indigo-700" />
            <span>Attach to MMMC</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const raw = loadLastSdcStateJson();
              if (!raw) {
                flash("No saved SDC in this browser yet — edit clocks first");
                return;
              }
              try {
                const parsed = normalizeSdcState(JSON.parse(raw));
                setState(parsed);
                if (parsed.primaryClocks[0]) setSelectedClkId(parsed.primaryClocks[0].id);
                flash("Restored last SDC from this browser");
              } catch {
                flash("Could not restore saved SDC");
              }
            }}
            className="neu-btn px-3 py-2 text-[10px] font-bold"
            title="Restore SDC last edited in this browser (shared with Timing export context)"
          >
            Restore last
          </button>

          <button
            type="button"
            onClick={() => diffFileInputRef.current?.click()}
            className={`neu-btn px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 ${
              baselineState ? "neu-btn-active text-sky-600 font-black shadow-inner" : ""
            }`}
            title="Upload Baseline SDC to highlight constraint differences"
          >
            <GitBranch className="h-4 w-4 text-sky-600" />
            <span>{baselineState ? "Diff Active" : "Diff Import"}</span>
          </button>
          {baselineState && (
            <button
              type="button"
              onClick={() => {
                setBaselineState(null);
                flash("Cleared Baseline SDC");
              }}
              className="text-[10px] font-black text-rose-600 hover:underline px-1"
            >
              Clear
            </button>
          )}

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

      {/* SDC DIFF BANNER */}
      {sdcDiff && (
        <div className="neu-panel-sm p-3 bg-sky-50 border-l-4 border-l-sky-600 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-sky-600 shrink-0" />
            <div>
              <p className="font-black text-slate-800">
                SDC Constraint Diff Active against Baseline
              </p>
              <p className="text-[10px] font-bold text-slate-500">
                {sdcDiff.stats.added} Added · {sdcDiff.stats.removed} Removed · {sdcDiff.stats.modified} Modified constraints
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold overflow-x-auto">
            {sdcDiff.clocks.map((c) => (
              <span
                key={c.name}
                className={`px-2 py-0.5 rounded border font-mono whitespace-nowrap ${
                  c.status === "added"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-black"
                    : c.status === "removed"
                    ? "bg-rose-100 text-rose-800 border-rose-300 font-black"
                    : c.status === "modified"
                    ? "bg-amber-100 text-amber-800 border-amber-300 font-black"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                {c.name}: {c.status} {c.periodDeltaNs ? `(Δ ${c.periodDeltaNs > 0 ? "+" : ""}${c.periodDeltaNs.toFixed(2)} ns)` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* B1.8 MMMC link status */}
      <div className="neu-panel p-2 flex flex-wrap items-center gap-2 shrink-0 bg-indigo-50/70 border-2 border-indigo-200">
        <Layers className="h-3.5 w-3.5 text-indigo-700" />
        <span className="text-[10px] font-black uppercase text-indigo-900">
          MMMC link
        </span>
        <span className="text-[10px] font-bold text-slate-700">
          {sdcClockMeta.clockCount} clocks in studio
          {linkedModeLabel ? ` · editing mode "${linkedModeLabel}"` : ""}
        </span>
        {mmmcModes?.modes?.length ? (
          <span className="text-[10px] font-bold text-slate-600">
            · MMMC has {mmmcModes.modes.length} mode(s)
            {mmmcModes.modes.some((m) => m.hasSdcText)
              ? ` (${mmmcModes.modes.filter((m) => m.hasSdcText).length} with SDC)`
              : ""}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-500">
            · Open MMMC Studio once to sync mode list
          </span>
        )}
        <button
          type="button"
          onClick={openAttachDialog}
          className="neu-btn px-2 py-1 text-[10px] font-black bg-indigo-600 text-white ml-auto"
        >
          Attach → MMMC
        </button>
        <Link
          href="/vlsi/mmmc-studio?tab=configure"
          className="neu-btn px-2 py-1 text-[10px] font-black bg-white text-indigo-900"
        >
          Open MMMC
        </Link>
      </div>

      {/* B1.8 Attach dialog */}
      {attachOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="neu-panel bg-white max-w-lg w-full p-5 space-y-4 border-4 border-black shadow-[8px_8px_0_#000]">
            <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Attach SDC → MMMC constraint mode
            </h3>
            <p className="text-[11px] font-bold text-slate-600">
              Creates a named SDC project pack and binds it to an MMMC{" "}
              <code className="bg-slate-100 px-1 rounded">create_constraint_mode</code>.
              Clocks: <b>{sdcClockMeta.clockCount}</b>
              {sdcClockMeta.clockNames.length
                ? ` (${sdcClockMeta.clockNames.slice(0, 6).join(", ")}${
                    sdcClockMeta.clockNames.length > 6 ? "…" : ""
                  })`
                : ""}
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-600 block mb-0.5">
                  Mode name
                </label>
                <input
                  className="w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1.5"
                  value={attachModeName}
                  onChange={(e) => {
                    setAttachModeName(e.target.value);
                    if (!attachFileName || attachFileName.startsWith("constraints_")) {
                      setAttachFileName(
                        `constraints_${(e.target.value || "func").replace(/[^\w\-]+/g, "_")}.sdc`
                      );
                    }
                  }}
                  placeholder="func"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-600 block mb-0.5">
                  SDC filename (-sdc_files)
                </label>
                <input
                  className="w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1.5"
                  value={attachFileName}
                  onChange={(e) => setAttachFileName(e.target.value)}
                  placeholder="constraints_func.sdc"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-600 block mb-0.5">
                  Bind action
                </label>
                <select
                  className="w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1.5"
                  value={attachAction}
                  onChange={(e) =>
                    setAttachAction(e.target.value as "auto" | "create" | "bind")
                  }
                >
                  <option value="auto">
                    Auto (0 modes→create, 1 mode→bind, else match name / create)
                  </option>
                  <option value="create">Always create new mode</option>
                  <option value="bind">Bind to existing MMMC mode</option>
                </select>
              </div>
              {attachAction === "bind" && (
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-600 block mb-0.5">
                    Target MMMC mode
                  </label>
                  <select
                    className="w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1.5"
                    value={attachTargetModeId}
                    onChange={(e) => setAttachTargetModeId(e.target.value)}
                  >
                    <option value="">— select —</option>
                    {(mmmcModes?.modes || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.hasSdcText ? " (has SDC)" : ""}
                        {m.clockCount ? ` · ${m.clockCount} clk` : ""}
                      </option>
                    ))}
                  </select>
                  {!mmmcModes?.modes?.length && (
                    <p className="text-[9px] font-bold text-amber-700 mt-1">
                      No MMMC modes snapshot yet. Use Auto, or open MMMC once first.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAttachOpen(false)}
                className="neu-btn px-3 py-1.5 text-xs font-black bg-white text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAttachToMmmc}
                disabled={attachAction === "bind" && !attachTargetModeId}
                className="neu-btn px-3 py-1.5 text-xs font-black bg-indigo-600 text-white disabled:opacity-40"
              >
                Push to MMMC
              </button>
            </div>
          </div>
        </div>
      )}

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
              <span>Clocks</span>
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
              <span>I/O Eye</span>
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
              <span>MCP</span>
              <span className="neu-badge text-[10px] text-slate-600">
                {state.multicycles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cdc")}
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition whitespace-nowrap ${
                activeTab === "cdc"
                  ? "neu-btn-active text-purple-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Network className="h-4 w-4" />
              <span>CDC / Domains</span>
              {cdcSummary.missingCuts > 0 && (
                <span className="neu-badge text-[9px] text-rose-600 bg-rose-100 border-rose-300">
                  {cdcSummary.missingCuts}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schematic")}
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition whitespace-nowrap ${
                activeTab === "schematic"
                  ? "neu-btn-active text-indigo-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Tree</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("budget")}
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition whitespace-nowrap ${
                activeTab === "budget"
                  ? "neu-btn-active text-rose-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Budget</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition whitespace-nowrap ${
                activeTab === "link"
                  ? "neu-btn-active text-cyan-600 font-black shadow-inner"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Link2 className="h-4 w-4" />
              <span>STA Link</span>
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

                  <p className="text-[9px] font-bold text-slate-500">
                    Free numeric entry (any positive period / uncertainty). Sliders are coarse helpers only.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Clock Period — free ns + MHz */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">Clock Period (T_clk)</span>
                        <span className="text-sky-700 font-mono font-black">
                          {selectedClk.periodNs.toFixed(3)} ns · {freqMhz} MHz
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="text-[9px] font-black text-slate-600 w-10">ns</label>
                        <input
                          type="number"
                          min={0.001}
                          step={0.001}
                          value={selectedClk.periodNs}
                          onChange={(e) => {
                            const val = Math.max(0.001, parseFloat(e.target.value) || 0.001);
                            updatePrimaryClock(selectedClk.id, {
                              periodNs: val,
                              waveformFalling: Math.min(val, val * dutyRatio || val / 2),
                            });
                          }}
                          className="flex-1 bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1 outline-none"
                        />
                        <label className="text-[9px] font-black text-slate-600 w-10">MHz</label>
                        <input
                          type="number"
                          min={0.001}
                          step={0.1}
                          value={parseFloat(freqMhz) || 0}
                          onChange={(e) => {
                            const mhz = Math.max(0.001, parseFloat(e.target.value) || 0.001);
                            const val = 1000 / mhz;
                            updatePrimaryClock(selectedClk.id, {
                              periodNs: val,
                              waveformFalling: val * dutyRatio,
                            });
                          }}
                          className="flex-1 bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1 outline-none"
                        />
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="200"
                        step="0.1"
                        value={Math.min(200, Math.max(0.2, selectedClk.periodNs))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1.0;
                          updatePrimaryClock(selectedClk.id, {
                            periodNs: val,
                            waveformFalling: val * dutyRatio,
                          });
                        }}
                        className="neu-slider"
                        title="Coarse 0.2–200 ns (~5 GHz–5 MHz)"
                      />
                    </div>

                    {/* Duty Cycle */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">Duty Cycle</span>
                        <span className="text-sky-700 font-mono font-black">
                          {(dutyRatio * 100).toFixed(0)}% (Fall: {selectedClk.waveformFalling.toFixed(3)}ns)
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

                    {/* Setup Uncertainty — free */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">Setup Uncertainty (T_unc_su)</span>
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={selectedClk.uncertaintySetup}
                          onChange={(e) =>
                            updatePrimaryClock(selectedClk.id, {
                              uncertaintySetup: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-24 bg-white text-amber-800 font-mono text-xs font-black border-2 border-black rounded px-2 py-0.5 outline-none text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.01"
                        value={Math.min(5, selectedClk.uncertaintySetup)}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            uncertaintySetup: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                        title="Coarse 0–5 ns (type higher in box)"
                      />
                    </div>

                    {/* Hold Uncertainty — free */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">Hold Uncertainty (T_unc_hd)</span>
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={selectedClk.uncertaintyHold}
                          onChange={(e) =>
                            updatePrimaryClock(selectedClk.id, {
                              uncertaintyHold: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-24 bg-white text-amber-800 font-mono text-xs font-black border-2 border-black rounded px-2 py-0.5 outline-none text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={Math.min(2, selectedClk.uncertaintyHold)}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            uncertaintyHold: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                        title="Coarse 0–2 ns (type higher in box)"
                      />
                    </div>

                    {/* Source Latency — free */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">Source Latency (`-source`)</span>
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={selectedClk.latencySource}
                          onChange={(e) =>
                            updatePrimaryClock(selectedClk.id, {
                              latencySource: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-24 bg-white text-purple-800 font-mono text-xs font-black border-2 border-black rounded px-2 py-0.5 outline-none text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.05"
                        value={Math.min(10, selectedClk.latencySource)}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            latencySource: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                      />
                    </div>

                    {/* Network Latency — free */}
                    <div className="neu-inset p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">Network Latency</span>
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={selectedClk.latencyNetwork}
                          onChange={(e) =>
                            updatePrimaryClock(selectedClk.id, {
                              latencyNetwork: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-24 bg-white text-purple-800 font-mono text-xs font-black border-2 border-black rounded px-2 py-0.5 outline-none text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.05"
                        value={Math.min(10, selectedClk.latencyNetwork)}
                        onChange={(e) =>
                          updatePrimaryClock(selectedClk.id, {
                            latencyNetwork: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="neu-slider"
                      />
                    </div>
                  </div>

                  {/* Design rules (global) */}
                  <div className="neu-inset p-3 grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Max transition (ns)</p>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={state.designRules?.maxTransitionNs ?? 0}
                        onChange={(e) =>
                          setState((prev) =>
                            normalizeSdcState({
                              ...prev,
                              designRules: {
                                ...normalizeSdcState(prev).designRules,
                                maxTransitionNs: Math.max(0, parseFloat(e.target.value) || 0),
                              },
                            })
                          )
                        }
                        className="w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Max capacitance (pF)</p>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={state.designRules?.maxCapacitancePf ?? 0}
                        onChange={(e) =>
                          setState((prev) =>
                            normalizeSdcState({
                              ...prev,
                              designRules: {
                                ...normalizeSdcState(prev).designRules,
                                maxCapacitancePf: Math.max(0, parseFloat(e.target.value) || 0),
                              },
                            })
                          )
                        }
                        className="w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Max fanout</p>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={state.designRules?.maxFanout ?? 0}
                        onChange={(e) =>
                          setState((prev) =>
                            normalizeSdcState({
                              ...prev,
                              designRules: {
                                ...normalizeSdcState(prev).designRules,
                                maxFanout: Math.max(0, parseInt(e.target.value, 10) || 0),
                              },
                            })
                          )
                        }
                        className="w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1"
                      />
                    </div>
                    <p className="md:col-span-3 text-[9px] font-bold text-slate-500">
                      0 = not written to SDC. Emits set_max_transition / capacitance / fanout on [current_design].
                    </p>
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

            {/* ------------------ TAB: CDC / DOMAINS (merged CDC studio) ------------------ */}
            {activeTab === "cdc" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      CDC / Domains Workspace
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      Clock-domain policy inside SDC — matrix, domain map, lint, and STA path cuts.
                      Emits <code className="text-[10px] bg-slate-100 px-1 rounded">set_clock_groups</code>.
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {(
                      [
                        ["Domains", cdcSummary.domainCount, "text-indigo-700"],
                        ["Async cuts", cdcSummary.asyncCuts, "text-rose-600"],
                        ["Exclusive", cdcSummary.exclusiveCuts, "text-amber-600"],
                        ["Missing", cdcSummary.missingCuts, "text-rose-700"],
                      ] as const
                    ).map(([label, val, color]) => (
                      <div key={label} className="neu-inset px-2 py-1.5 min-w-[64px]">
                        <p className="text-[8px] font-black uppercase text-slate-400">{label}</p>
                        <p className={`text-sm font-black ${color}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-panels */}
                <div className="neu-inset p-1 flex flex-wrap gap-1 text-[10px] font-black">
                  {(
                    [
                      ["matrix", "Matrix"],
                      ["map", "Domain map"],
                      ["fixes", "Quick fixes"],
                      ["link", "Path → cut"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCdcPanel(id)}
                      className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg transition ${
                        cdcPanel === id
                          ? "neu-btn-active text-purple-700"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Domain chips */}
                <div className="flex flex-wrap gap-2">
                  {cdcSummary.domains.map((d) => {
                    const c = CDC_DOMAIN_COLORS[d.colorIndex % CDC_DOMAIN_COLORS.length];
                    return (
                      <div
                        key={d.id}
                        className="px-2 py-1 rounded-lg border-2 text-[9px] font-bold"
                        style={{
                          background: c.fill,
                          borderColor: c.stroke,
                          color: c.text,
                        }}
                      >
                        <span className="font-black uppercase">
                          {d.isVirtual ? "VCLK " : "DOM "}
                          {d.rootName}
                        </span>
                        <span className="opacity-80">
                          {" "}
                          · {d.clocks.join(", ")} · {d.periodNs.toFixed(2)}ns
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* MATRIX */}
                {cdcPanel === "matrix" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500">
                      Click a cell to cycle SYNC → ASYNC → LOG_EXCL → PHYS_EXCL → SYNC.
                      Applying ASYNC expands both domains (includes generated clocks).
                    </p>
                    <div className="neu-panel-sm p-3 overflow-x-auto bg-white">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="p-2 text-left text-slate-500 font-black uppercase text-[10px]">
                              Launch \ Capture
                            </th>
                            {allClocksList.map((clk) => (
                              <th
                                key={clk}
                                className="p-2 text-center text-sky-600 font-black text-[10px] max-w-[72px] truncate"
                                title={clk}
                              >
                                {clk}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allClocksList.map((clkA) => (
                            <tr key={clkA} className="border-t border-slate-200">
                              <td className="p-2 font-black text-sky-700 text-[11px] truncate max-w-[100px]" title={clkA}>
                                {clkA}
                              </td>
                              {allClocksList.map((clkB) => {
                                const rel = getClockRelation(clkA, clkB);
                                const isSelf = clkA === clkB;
                                const pair = cdcSummary.pairs.find(
                                  (p) =>
                                    (p.clkA === clkA && p.clkB === clkB) ||
                                    (p.clkA === clkB && p.clkB === clkA)
                                );
                                const missing = pair?.missingCut;
                                return (
                                  <td key={clkB} className="p-0.5 text-center">
                                    {isSelf ? (
                                      <span className="text-slate-300 text-[10px]">—</span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => toggleClockRelation(clkA, clkB)}
                                        title={pair?.note || rel}
                                        className={`neu-btn px-1.5 py-1.5 text-[9px] font-black uppercase tracking-wide w-full ${
                                          missing
                                            ? "bg-rose-50 text-rose-700 border-rose-300"
                                            : rel === "sync"
                                            ? "text-slate-500"
                                            : rel === "asynchronous"
                                            ? "neu-btn-active text-rose-600"
                                            : rel === "logically_exclusive"
                                            ? "neu-btn-active text-amber-600"
                                            : "neu-btn-active text-purple-600"
                                        }`}
                                      >
                                        {rel === "sync"
                                          ? missing
                                            ? "SYNC!"
                                            : "SYNC"
                                          : rel === "asynchronous"
                                          ? "ASYNC"
                                          : rel === "logically_exclusive"
                                          ? "L_EX"
                                          : "P_EX"}
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
                    <div className="flex flex-wrap gap-3 text-[9px] font-bold text-slate-600">
                      <span>SYNC = timed</span>
                      <span className="text-rose-600">SYNC! = missing domain cut</span>
                      <span className="text-rose-600">ASYNC</span>
                      <span className="text-amber-600">L_EX = logically exclusive</span>
                      <span className="text-purple-600">P_EX = physically exclusive</span>
                    </div>
                  </div>
                )}

                {/* DOMAIN MAP */}
                {cdcPanel === "map" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-800 bg-white border-2 border-black rounded-lg px-3 py-2">
                      <span className="font-black uppercase text-indigo-700">Graph engine</span>
                      <span>
                        Nodes <b>{sdcGraphStats.nodeCount}</b>
                      </span>
                      <span>
                        Edges <b>{sdcGraphStats.edgeCount}</b>
                      </span>
                      <span>
                        Domains <b>{sdcGraphStats.domainCount}</b>
                      </span>
                      <span>
                        Cuts <b>{sdcGraphStats.cutEdges}</b>
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">
                      Solid edges = generated-clock lineage. Dashed red/amber = clock-group cuts.
                      Map is driven by the shared design graph.
                    </p>
                    <div className="neu-inset p-4 bg-white overflow-x-auto">
                      {(() => {
                        const nodes = cdcMap.nodes;
                        if (!nodes.length) {
                          return (
                            <p className="text-xs font-bold text-slate-400 text-center py-8">
                              Add clocks to build the domain map.
                            </p>
                          );
                        }
                        const W = Math.max(560, nodes.length * 100 + 80);
                        const H = 200;
                        const positions = new Map<string, { x: number; y: number }>();
                        const prim = nodes.filter((n) => n.kind === "primary" || n.kind === "virtual");
                        const gen = nodes.filter((n) => n.kind === "generated");
                        const place = (row: typeof nodes, y: number) => {
                          row.forEach((n, i) => {
                            const x =
                              row.length <= 1
                                ? W / 2
                                : 50 + (i * (W - 100)) / (row.length - 1);
                            positions.set(n.id, { x, y });
                          });
                        };
                        place(prim, 50);
                        place(gen, 140);
                        nodes.forEach((n, i) => {
                          if (!positions.has(n.id)) positions.set(n.id, { x: 60 + i * 80, y: 100 });
                        });

                        return (
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px] h-auto">
                            <defs>
                              <marker
                                id="cdcArrow"
                                viewBox="0 0 10 10"
                                refX="8"
                                refY="5"
                                markerWidth="5"
                                markerHeight="5"
                                orient="auto-start-reverse"
                              >
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
                              </marker>
                            </defs>
                            {cdcMap.treeEdges.map((e, i) => {
                              const a = positions.get(e.from);
                              const b = positions.get(e.to);
                              if (!a || !b) return null;
                              return (
                                <g key={`t${i}`}>
                                  <line
                                    x1={a.x}
                                    y1={a.y + 14}
                                    x2={b.x}
                                    y2={b.y - 14}
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                    markerEnd="url(#cdcArrow)"
                                  />
                                  {e.label && (
                                    <text
                                      x={(a.x + b.x) / 2 + 8}
                                      y={(a.y + b.y) / 2}
                                      fontSize="8"
                                      fill="#64748b"
                                      fontWeight="700"
                                    >
                                      {e.label}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                            {cdcMap.cutEdges.map((e, i) => {
                              const a = positions.get(e.from);
                              const b = positions.get(e.to);
                              if (!a || !b) return null;
                              const col =
                                e.relation === "asynchronous" ? "#e11d48" : "#d97706";
                              return (
                                <g key={`c${i}`}>
                                  <line
                                    x1={a.x}
                                    y1={a.y}
                                    x2={b.x}
                                    y2={b.y}
                                    stroke={col}
                                    strokeWidth="2"
                                    strokeDasharray="6,4"
                                    opacity="0.85"
                                  />
                                  <text
                                    x={(a.x + b.x) / 2}
                                    y={(a.y + b.y) / 2 - 6}
                                    fontSize="8"
                                    fill={col}
                                    fontWeight="900"
                                    textAnchor="middle"
                                  >
                                    {e.relation === "asynchronous"
                                      ? "ASYNC"
                                      : e.relation === "logically_exclusive"
                                      ? "L_EX"
                                      : "P_EX"}
                                  </text>
                                </g>
                              );
                            })}
                            {nodes.map((n) => {
                              const p = positions.get(n.id)!;
                              const c =
                                CDC_DOMAIN_COLORS[n.colorIndex % CDC_DOMAIN_COLORS.length];
                              return (
                                <g key={n.id} transform={`translate(${p.x},${p.y})`}>
                                  <rect
                                    x={-40}
                                    y={-14}
                                    width={80}
                                    height={28}
                                    rx={6}
                                    fill={c.fill}
                                    stroke={c.stroke}
                                    strokeWidth="2"
                                  />
                                  <text
                                    y={4}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fontWeight="900"
                                    fill={c.text}
                                  >
                                    {n.name.length > 11 ? n.name.slice(0, 10) + "…" : n.name}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Quick fixes only — lint text lives in right-side Constraint Lint */}
                {cdcPanel === "fixes" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500">
                      Actionable CDC repairs. Warnings/errors stay in the right-hand{" "}
                      <b>Constraint Lint</b> panel.
                    </p>
                    <div className="space-y-2 max-h-[360px] overflow-y-auto">
                      {cdcFixes.map((f) => (
                        <div
                          key={f.id}
                          className="neu-panel-sm p-3 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800">{f.title}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                              {f.detail}
                            </p>
                          </div>
                          {f.apply && (
                            <button
                              type="button"
                              className="neu-btn neu-btn-primary px-2.5 py-1.5 text-[10px] font-black shrink-0"
                              onClick={() => {
                                setState((prev) => f.apply!(prev));
                                flash(`Applied: ${f.title}`);
                              }}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Path → CDC cut */}
                {cdcPanel === "link" && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500">
                      Paste a cross-clock STA path (Timing Studio / Innovus / PT). Suggest async
                      clock_groups or false_path.
                    </p>
                    <textarea
                      className="w-full h-32 p-3 border-2 border-black rounded-lg font-mono text-[10px] focus:outline-none shadow-[3px_3px_0_#000] bg-white"
                      placeholder={`Path 1: VIOLATED (...)
Startpoint: ...
Clock: (R) clk_a
Endpoint: ...
Clock: (R) clk_b
Slack:= -0.12`}
                      value={cdcPathSnippet}
                      onChange={(e) => setCdcPathSnippet(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="neu-btn px-3 py-1.5 text-[10px] font-black"
                        onClick={() => setCdcPathSnippet("")}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="neu-btn px-3 py-1.5 text-[10px] font-black text-cyan-700"
                        onClick={() => {
                          setActiveTab("link");
                          setPathSnippet(cdcPathSnippet);
                        }}
                      >
                        Open full STA Link
                      </button>
                    </div>
                    <div className="space-y-2">
                      {cdcPathSnippet && cdcPathFixes.length === 0 && (
                        <p className="text-xs font-bold text-slate-400">
                          Could not parse clocks from snippet.
                        </p>
                      )}
                      {cdcPathFixes.map((f) => (
                        <div
                          key={f.id}
                          className="neu-panel-sm p-3 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800">{f.title}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                              {f.detail}
                            </p>
                          </div>
                          {f.apply && (
                            <button
                              type="button"
                              className="neu-btn neu-btn-primary px-2.5 py-1.5 text-[10px] font-black shrink-0"
                              onClick={() => {
                                setState((prev) => f.apply!(prev));
                                flash(`Applied: ${f.title}`);
                              }}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------ TAB: CLOCK TREE SCHEMATIC ------------------ */}
            {activeTab === "schematic" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-indigo-500" />
                    Clock Tree Schematic
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Primary / virtual → generated clocks → I/O domains from live constraints.
                  </p>
                </div>
                <div className="neu-inset p-4 bg-white overflow-x-auto">
                  {(() => {
                    const nodes = clockTree.nodes;
                    if (!nodes.length) {
                      return (
                        <p className="text-xs font-bold text-slate-400 text-center py-8">
                          Add clocks to visualize the tree.
                        </p>
                      );
                    }
                    const W = Math.max(640, nodes.length * 100 + 80);
                    const H = 220;
                    const cols = Math.min(nodes.length, 6);
                    const positions = new Map<string, { x: number; y: number }>();
                    const primary = nodes.filter((n) => n.kind === "primary" || n.kind === "virtual");
                    const generated = nodes.filter((n) => n.kind === "generated");
                    const ios = nodes.filter((n) => n.kind === "io");
                    const placeRow = (row: typeof nodes, y: number) => {
                      row.forEach((n, i) => {
                        const x = 60 + (i * (W - 120)) / Math.max(1, row.length - 1 || 1);
                        positions.set(n.id, { x: row.length === 1 ? W / 2 : x, y });
                      });
                    };
                    placeRow(primary, 40);
                    placeRow(generated, 110);
                    placeRow(ios, 180);
                    // place orphans
                    nodes.forEach((n, i) => {
                      if (!positions.has(n.id)) {
                        positions.set(n.id, { x: 60 + i * 90, y: 110 });
                      }
                    });
                    const color = (k: string) => {
                      if (k === "primary") return { f: "#dbeafe", s: "#2563eb" };
                      if (k === "virtual") return { f: "#f3e8ff", s: "#7c3aed" };
                      if (k === "generated") return { f: "#fef3c7", s: "#d97706" };
                      return { f: "#d1fae5", s: "#059669" };
                    };
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px] h-auto">
                        {clockTree.edges.map((e, i) => {
                          const a = positions.get(e.from);
                          const b = positions.get(e.to);
                          if (!a || !b) return null;
                          return (
                            <g key={i}>
                              <line
                                x1={a.x}
                                y1={a.y + 16}
                                x2={b.x}
                                y2={b.y - 16}
                                stroke="#0f172a"
                                strokeWidth="1.5"
                                markerEnd="url(#ctArrow)"
                              />
                              {e.label && (
                                <text
                                  x={(a.x + b.x) / 2}
                                  y={(a.y + b.y) / 2}
                                  fontSize="8"
                                  fill="#64748b"
                                  textAnchor="middle"
                                  fontWeight="700"
                                >
                                  {e.label}
                                </text>
                              )}
                            </g>
                          );
                        })}
                        <defs>
                          <marker id="ctArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
                          </marker>
                        </defs>
                        {nodes.map((n) => {
                          const p = positions.get(n.id)!;
                          const c = color(n.kind);
                          return (
                            <g key={n.id} transform={`translate(${p.x},${p.y})`}>
                              <rect x={-42} y={-16} width={84} height={32} rx={6} fill={c.f} stroke={c.s} strokeWidth="2" />
                              <text y={-2} textAnchor="middle" fontSize="8" fontWeight="900" fill="#0f172a">
                                {n.name.length > 12 ? n.name.slice(0, 11) + "…" : n.name}
                              </text>
                              <text y={10} textAnchor="middle" fontSize="7" fontWeight="700" fill="#64748b">
                                {n.detail || `${n.periodNs.toFixed(2)}ns`}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
                <div className="flex flex-wrap gap-3 text-[9px] font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-200 border border-sky-600" /> Primary</span>
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-200 border border-purple-600" /> Virtual</span>
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-600" /> Generated</span>
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-600" /> I/O domain</span>
                </div>

                {/* Accurate multi-period clock using engine model */}
                <div className="neu-panel-sm p-4 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-600">
                    Accurate Waveform · {clkWave.name} (latency-shifted)
                  </h4>
                  <div className="neu-inset p-3 bg-white overflow-x-auto">
                    {(() => {
                      const period = clkWave.periodNs || 1;
                      const tMin = -0.1;
                      const tMax = period * 2.2;
                      const padL = 50;
                      const svgW = 560;
                      const xOf = (t: number) => padL + ((t - tMin) / (tMax - tMin)) * (svgW - padL - 20);
                      const ideal = clockSvgPath(period, clkWave.rise, clkWave.fall, tMin, tMax, xOf, 28, 48);
                      const atPin = clockSvgPath(
                        period,
                        clkWave.effectiveRise,
                        clkWave.effectiveFall,
                        tMin,
                        tMax,
                        xOf,
                        78,
                        98
                      );
                      return (
                        <svg viewBox="0 0 560 130" className="w-full min-w-[480px]">
                          <text x="8" y="40" fontSize="9" fontWeight="800" fill="#475569">Ideal</text>
                          <path d={ideal} fill="none" stroke="#0f172a" strokeWidth="2.5" />
                          <text x="8" y="90" fontSize="9" fontWeight="800" fill="#2563eb">@ FF (+lat {clkWave.latencyTotal.toFixed(2)})</text>
                          <path d={atPin} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                          <text x={xOf(period)} y="120" fontSize="8" fill="#94a3b8" textAnchor="middle">T={period.toFixed(2)}</text>
                          <line x1={xOf(period)} y1={10} x2={xOf(period)} y2={110} stroke="#cbd5e1" strokeDasharray="3,2" />
                        </svg>
                      );
                    })()}
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">
                    duty {(clkWave.duty * 100).toFixed(0)}% · rise {clkWave.rise.toFixed(3)} · fall {clkWave.fall.toFixed(3)} ·
                    unc setup {clkWave.uncertaintySetup.toFixed(3)} / hold {clkWave.uncertaintyHold.toFixed(3)}
                  </p>
                </div>
              </div>
            )}

            {/* ------------------ TAB: TIMING BUDGET SOLVER ------------------ */}
            {activeTab === "budget" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-rose-500" />
                    Timing Budget Solver
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    STA-aligned setup/hold budgets for reg2reg and I/O (period, uncertainty, latency, external delays).
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {budgets.length === 0 && (
                    <p className="text-xs font-bold text-slate-400">Define clocks to compute budgets.</p>
                  )}
                  {budgets.map((b: TimingBudget) => (
                    <div
                      key={b.id}
                      className={`neu-panel-sm p-3 border-l-4 ${
                        b.setupSlack < 0 ? "border-l-rose-500 bg-rose-50/40" : "border-l-emerald-500 bg-emerald-50/30"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">{b.kind}</p>
                          <p className="text-xs font-black text-slate-800">{b.label}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${b.setupSlack < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            setup {b.setupSlack >= 0 ? "+" : ""}{b.setupSlack.toFixed(3)} ns
                          </p>
                          <p className={`text-[10px] font-bold ${b.holdSlack < 0 ? "text-rose-600" : "text-slate-500"}`}>
                            hold {b.holdSlack >= 0 ? "+" : ""}{b.holdSlack.toFixed(3)} ns
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-[9px] font-mono text-slate-600 space-y-0.5">
                        <p>data_max / required: <b>{b.requiredSetup.toFixed(3)}</b> · path est: <b>{b.pathBudget.toFixed(3)}</b> · T={b.periodNs.toFixed(3)} ×{b.setupCycles}</p>
                        <p className="text-slate-500">{b.equationSetup}</p>
                        <p className="text-slate-500">{b.equationHold}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------ TAB: TIMING STUDIO LINK ------------------ */}
            {activeTab === "link" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-cyan-600" />
                    Timing Studio → SDC Link
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Paste a path block from Timing Studio / Innovus / PrimeTime. Get apply-able SDC suggestions (clocks, I/O, MCP, async cuts).
                  </p>
                </div>
                <textarea
                  className="w-full h-40 p-3 border-2 border-black rounded-lg font-mono text-[10px] focus:outline-none shadow-[3px_3px_0_#000] bg-white"
                  placeholder={`Paste path report snippet, e.g.:

Path 1: VIOLATED (-0.085 ns) Late Output Delay Assertion
Startpoint: (R) u_core/reg_a/CP
Clock: (R) func_clk
Endpoint: (R) m00_axi_araddr[30]
...
Output Delay:- 0.300
Slack:= -0.085`}
                  value={pathSnippet}
                  onChange={(e) => setPathSnippet(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="neu-btn px-3 py-1.5 text-[10px] font-black"
                    onClick={() => setPathSnippet("")}
                  >
                    Clear
                  </button>
                  <a
                    href="/vlsi/timing-studio"
                    className="neu-btn px-3 py-1.5 text-[10px] font-black text-amber-700"
                  >
                    Open Timing Studio
                  </a>
                </div>
                <div className="space-y-2">
                  {pathSnippet && pathSuggestions.length === 0 && (
                    <p className="text-xs font-bold text-slate-400">Could not parse path snippet.</p>
                  )}
                  {pathSuggestions.map((s) => (
                    <div key={s.id} className="neu-panel-sm p-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase text-cyan-600">{s.kind}</p>
                        <p className="text-xs font-black text-slate-800">{s.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">{s.detail}</p>
                      </div>
                      <button
                        type="button"
                        className="neu-btn neu-btn-primary px-3 py-1.5 text-[10px] font-black shrink-0"
                        onClick={() => {
                          setState((prev) => s.apply(prev));
                          flash(`Applied: ${s.title}`);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  ))}
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
                <span className="text-xs font-black text-slate-800">Constraint Lint · {tool}</span>
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
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
                      <p className="font-black text-[11px] flex items-center gap-1.5">
                        {m.title}
                        <span className="text-[8px] uppercase opacity-70">{m.category}</span>
                      </p>
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


export default function InteractiveSdcStudioPageGate() {
  return (
    <VlsiStudioGate studio="sdc">
      <InteractiveSdcStudioPage />
    </VlsiStudioGate>
  );
}
