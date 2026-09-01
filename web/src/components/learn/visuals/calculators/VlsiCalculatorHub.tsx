"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  Layout,
  Zap,
  Clock,
  Radio,
  Flame,
  Cpu,
  Sliders,
  Copy,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  Info,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Layers,
  Terminal,
  Activity,
} from "lucide-react";

export type CalculatorDomain =
  | "all"
  | "floorplan"
  | "power_plan"
  | "cts_clock"
  | "signal_integrity"
  | "power_integrity"
  | "logic_synthesis";

export interface CalculatorDefinition {
  id: string;
  domain: CalculatorDomain;
  title: string;
  subtitle: string;
  formulaDisplay: string;
  description: string;
}

export function VlsiCalculatorHub({ initialDomain = "all" }: { initialDomain?: CalculatorDomain }) {
  const [selectedDomain, setSelectedDomain] = useState<CalculatorDomain>(initialDomain);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // =========================================================================
  // 1. FLOORPLAN CALCULATORS STATE
  // =========================================================================
  // 1.1 Core Dimensions
  const [stdCellArea, setStdCellArea] = useState<number>(1200000); // um2
  const [macroArea, setMacroArea] = useState<number>(800000); // um2
  const [targetUtil, setTargetUtil] = useState<number>(0.70); // 70%
  const [aspectRatio, setAspectRatio] = useState<number>(1.0); // H / W

  // 1.2 Die Dimensions & Margins
  const [coreMarginL, setCoreMarginL] = useState<number>(25);
  const [coreMarginR, setCoreMarginR] = useState<number>(25);
  const [coreMarginT, setCoreMarginT] = useState<number>(25);
  const [coreMarginB, setCoreMarginB] = useState<number>(25);
  const [padRingWidth, setPadRingWidth] = useState<number>(40);

  // 1.3 Pad-Limited vs Core-Limited
  const [padCount, setPadCount] = useState<number>(160);
  const [padPitch, setPadPitch] = useState<number>(55); // um

  // 1.4 Macro Channel Width
  const [crossingPins, setCrossingPins] = useState<number>(128);
  const [trackPitch, setTrackPitch] = useState<number>(0.14); // um
  const [availLayers, setAvailLayers] = useState<number>(4);

  // 1.5 Row Grid Snapping
  const [rowHeight, setRowHeight] = useState<number>(0.54); // um
  const [siteWidth, setSiteWidth] = useState<number>(0.09); // um

  // =========================================================================
  // 2. POWER PLANNING CALCULATORS STATE
  // =========================================================================
  // 2.1 Total Power & Current
  const [vddVoltage, setVddVoltage] = useState<number>(0.80); // V
  const [clockFreq, setClockFreq] = useState<number>(1.2); // GHz
  const [totalCap, setTotalCap] = useState<number>(12.5); // nF
  const [activityFactor, setActivityFactor] = useState<number>(0.12);
  const [leakagePower, setLeakagePower] = useState<number>(18.0); // mW

  // 2.2 Power Ring Sizing
  const [maxEmDensity, setMaxEmDensity] = useState<number>(5.0); // mA/um2
  const [metalThickness, setMetalThickness] = useState<number>(0.85); // um

  // 2.3 Power Mesh Stripe Pitch
  const [targetStaticIr, setTargetStaticIr] = useState<number>(16.0); // mV (2% VDD)
  const [sheetResistance, setSheetResistance] = useState<number>(0.035); // Ohm/sq
  const [stripeWidth, setStripeWidth] = useState<number>(2.5); // um

  // 2.4 Via Array Sizing
  const [intersectCurrent, setIntersectCurrent] = useState<number>(3.6); // mA
  const [viaCutLimit, setViaCutLimit] = useState<number>(0.35); // mA

  // 2.5 Well-Tap Pitch
  const [maxWellDistance, setMaxWellDistance] = useState<number>(25.0); // um

  // =========================================================================
  // 3. CTS & CLOCKING CALCULATORS STATE
  // =========================================================================
  // 3.1 Elmore Delay
  const [wireLength, setWireLength] = useState<number>(450); // um
  const [unitR, setUnitR] = useState<number>(0.25); // Ohm/um
  const [unitC, setUnitC] = useState<number>(0.15); // fF/um
  const [driverR, setDriverR] = useState<number>(120); // Ohm
  const [sinkC, setSinkC] = useState<number>(35); // fF

  // 3.2 Useful Skew Optimizer
  const [setupSlack, setSetupSlack] = useState<number>(-45); // ps
  const [downstreamHoldSlack, setDownstreamHoldSlack] = useState<number>(65); // ps

  // 3.3 Clock Power
  const [clockSinks, setClockSinks] = useState<number>(28000);
  const [clockGatingEff, setClockGatingEff] = useState<number>(0.75);

  // =========================================================================
  // 4. SIGNAL INTEGRITY & ANTENNA CALCULATORS STATE
  // =========================================================================
  // 4.1 Process Antenna Ratio (PAR)
  const [metalArea, setMetalArea] = useState<number>(185.0); // um2
  const [gateOxideArea, setGateOxideArea] = useState<number>(0.32); // um2
  const [antennaLimit, setAntennaLimit] = useState<number>(400); // 400:1

  // 4.2 Miller Coupling Delta Delay
  const [couplingCap, setCouplingCap] = useState<number>(18.5); // fF
  const [groundCap, setGroundCap] = useState<number>(14.0); // fF
  const [driverRes, setDriverRes] = useState<number>(180); // Ohm

  // 4.3 Crosstalk Glitch Voltage
  const [aggressorSlew, setAggressorSlew] = useState<number>(45); // ps

  // =========================================================================
  // 5. POWER INTEGRITY & VOLTUS CALCULATORS STATE
  // =========================================================================
  // 5.1 Dynamic L*di/dt Drop
  const [peakCurrentSurge, setPeakCurrentSurge] = useState<number>(4.2); // A
  const [currentSlewRate, setCurrentSlewRate] = useState<number>(35.0); // mA/ps
  const [packageInductance, setPackageInductance] = useState<number>(0.45); // nH
  const [meshResistance, setMeshResistance] = useState<number>(0.018); // Ohm

  // 5.2 Decap Sizing
  const [switchingWindow, setSwitchingWindow] = useState<number>(65); // ps
  const [allowableDynamicDrop, setAllowableDynamicDrop] = useState<number>(32.0); // mV

  // 5.3 MTCMOS Inrush Current
  const [virtualRailCap, setVirtualRailCap] = useState<number>(35.0); // nF
  const [targetWakeupTime, setTargetWakeupTime] = useState<number>(45.0); // ns

  // 5.4 Electromigration Black's MTTF
  const [emRmsCurrent, setEmRmsCurrent] = useState<number>(2.8); // mA
  const [emWireWidth, setEmWireWidth] = useState<number>(0.40); // um
  const [junctionTemp, setJunctionTemp] = useState<number>(105); // C

  // =========================================================================
  // 6. LOGIC SYNTHESIS CALCULATORS STATE
  // =========================================================================
  // 6.1 Clock Period & Combinational Budget
  const [synthTargetFreq, setSynthTargetFreq] = useState<number>(1250); // MHz
  const [tcqDelay, setTcqDelay] = useState<number>(42); // ps
  const [tsetupDelay, setTsetupDelay] = useState<number>(35); // ps
  const [uncertaintyDelay, setUncertaintyDelay] = useState<number>(40); // ps
  const [timingMarginPct, setTimingMarginPct] = useState<number>(10); // 10%

  // 6.2 Logic Depth & Gate Level Estimator
  const [fo4Delay, setFo4Delay] = useState<number>(12.5); // ps
  const [stageEffort, setStageEffort] = useState<number>(1.8);

  // 6.3 Pipelining Latency vs Throughput Sizer
  const [unpipelinedDelay, setUnpipelinedDelay] = useState<number>(3.8); // ns

  // 6.4 Method of Logical Effort (LE)
  const [cinCap, setCinCap] = useState<number>(2.5); // fF
  const [cloadCap, setCloadCap] = useState<number>(120.0); // fF
  const [pathBranching, setPathBranching] = useState<number>(2.0);

  // 6.5 Gate Equivalent (GE) Converter
  const [totalSynArea, setTotalSynArea] = useState<number>(350000); // um2
  const [nand2Area, setNand2Area] = useState<number>(0.84); // um2

  // 6.6 Asynchronous FIFO Depth (CDC)
  const [writeFreq, setWriteFreq] = useState<number>(400); // MHz
  const [readFreq, setReadFreq] = useState<number>(125); // MHz
  const [burstLength, setBurstLength] = useState<number>(128); // words

  // Helper for copying EDA command
  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // =========================================================================
  // MATHEMATICAL DERIVATIONS & COMPUTATIONS
  // =========================================================================

  // 1.1 Core Sizing
  const totalCellArea = stdCellArea + macroArea;
  const coreArea = totalCellArea / (targetUtil || 0.7);
  const coreWidth = Math.round(Math.sqrt(coreArea / (aspectRatio || 1.0)) * 100) / 100;
  const coreHeight = Math.round((coreArea / coreWidth) * 100) / 100;

  // 1.2 Die Sizing
  const dieWidth = Math.round((coreWidth + coreMarginL + coreMarginR + 2 * padRingWidth) * 100) / 100;
  const dieHeight = Math.round((coreHeight + coreMarginT + coreMarginB + 2 * padRingWidth) * 100) / 100;
  const dieAreaMm2 = Math.round(((dieWidth * dieHeight) / 1000000) * 1000) / 1000;
  // Estimate DPW on 300mm wafer
  const waferRadius = 150;
  const dieRadius = Math.sqrt(dieAreaMm2 / Math.PI);
  const dpw = Math.max(0, Math.floor((Math.PI * waferRadius * waferRadius) / dieAreaMm2 - (Math.PI * 2 * waferRadius) / Math.sqrt(2 * dieAreaMm2)));

  // 1.3 Pad Limit Analyzer
  const maxPadsPerimeter = Math.floor((2 * (dieWidth + dieHeight)) / (padPitch || 55));
  const isPadLimited = padCount > maxPadsPerimeter;

  // 1.4 Macro Channel
  const reqChannelWidth = Math.round(((crossingPins * trackPitch) / (availLayers * 0.75)) * 100) / 100;
  const reqHalo = Math.round((reqChannelWidth / 2) * 100) / 100;

  // 1.5 Row Snapping
  const totalRows = Math.floor(coreHeight / (rowHeight || 0.54));
  const totalSiteCols = Math.floor(coreWidth / (siteWidth || 0.09));

  // 2.1 Power & Current
  const dynamicPowerMw = Math.round(activityFactor * totalCap * vddVoltage * vddVoltage * clockFreq * 1000 * 10) / 10;
  const totalPowerMw = Math.round((dynamicPowerMw + leakagePower) * 10) / 10;
  const totalCurrentA = Math.round((totalPowerMw / (vddVoltage * 1000)) * 1000) / 1000;

  // 2.2 Ring Width
  const currentPerSideA = totalCurrentA / 4;
  const minRingWidthUm = Math.round(((currentPerSideA * 1000) / (maxEmDensity * metalThickness)) * 100) / 100;

  // 2.3 Mesh Stripe Pitch
  // Pitch formula: (8 * DeltaV * w) / (I_area * R_sheet * L_core)
  const currentDensityArea = (totalCurrentA * 1000) / coreArea; // mA/um2
  const calcStripePitch = Math.max(
    stripeWidth * 2,
    Math.round(((8 * (targetStaticIr / 1000) * stripeWidth) / (currentDensityArea * sheetResistance * (coreHeight || 1000))) * 10) / 10
  );
  const layerUtilization = Math.round((stripeWidth / (calcStripePitch || 30)) * 100 * 10) / 10;

  // 2.4 Via Array Matrix
  const reqViaCuts = Math.ceil(intersectCurrent / (viaCutLimit || 0.35));
  const viaCols = Math.ceil(Math.sqrt(reqViaCuts));
  const viaRows = Math.ceil(reqViaCuts / viaCols);

  // 2.5 Well-Tap Spacing
  const tapPitch = maxWellDistance * 2;

  // 3.1 Elmore Latency
  const wireR = (wireLength * unitR);
  const wireC = (wireLength * unitC) / 1000; // pF
  const elmoreDelayPs = Math.round(driverR * (wireC + sinkC / 1000) + 0.5 * wireR * wireC + wireR * (sinkC / 1000) * 1000);

  // 3.2 Useful Skew
  const maxUsefulSkew = Math.min(Math.abs(setupSlack), Math.max(0, downstreamHoldSlack - 15));

  // 3.3 Clock Power
  const unGatedClockPowerMw = Math.round(2.0 * (clockSinks * 0.002) * vddVoltage * vddVoltage * clockFreq * 1000 * 10) / 10;
  const gatedClockPowerMw = Math.round(unGatedClockPowerMw * (1 - clockGatingEff * 0.65) * 10) / 10;
  const savedClockPowerMw = Math.round((unGatedClockPowerMw - gatedClockPowerMw) * 10) / 10;

  // 4.1 Process Antenna
  const actualPAR = Math.round((metalArea / (gateOxideArea || 0.01)) * 10) / 10;
  const isAntennaViolated = actualPAR > antennaLimit;
  const reqDiodeArea = isAntennaViolated ? Math.round(((metalArea - antennaLimit * gateOxideArea) / 250) * 1000) / 1000 : 0;

  // 4.2 Miller Coupling
  const effCapOutOfPhase = Math.round((groundCap + 2 * couplingCap) * 10) / 10;
  const deltaDelaySlowdownPs = Math.round((driverRes * 2 * (couplingCap / 1000)) * 1000);

  // 4.3 Crosstalk Glitch
  const glitchPeakVolt = Math.round((vddVoltage * (couplingCap / (couplingCap + groundCap)) * (driverRes / (driverRes + (aggressorSlew / 0.05)))) * 1000) / 1000;
  const glitchPctVdd = Math.round((glitchPeakVolt / vddVoltage) * 100 * 10) / 10;

  // 5.1 Dynamic L*di/dt
  const vInductiveDropMv = Math.round(packageInductance * currentSlewRate * 1000 * 10) / 10;
  const vResistiveDropMv = Math.round(peakCurrentSurge * meshResistance * 1000 * 10) / 10;
  const vTotalDynamicDropMv = Math.round((vInductiveDropMv + vResistiveDropMv) * 10) / 10;
  const dynamicDropPctVdd = Math.round((vTotalDynamicDropMv / (vddVoltage * 1000)) * 100 * 10) / 10;

  // 5.2 Decap Sizing
  const reqChargePc = peakCurrentSurge * switchingWindow; // pC
  const reqDecapNf = Math.round((reqChargePc / (allowableDynamicDrop || 30)) * 10) / 10;
  const decapCellCount = Math.ceil((reqDecapNf * 1000) / 32); // DECAP_X32 is 32 fF

  // 5.3 MTCMOS Inrush Current
  const peakInrushCurrentA = Math.round(((virtualRailCap * vddVoltage) / (targetWakeupTime || 10)) * 100) / 100;
  const reqDaisyStages = Math.ceil(peakInrushCurrentA / 0.35);

  // 5.4 Black's EM MTTF
  const actualEmCurrentDensity = Math.round((emRmsCurrent / (emWireWidth * metalThickness)) * 100) / 100;
  const isEmViolated = actualEmCurrentDensity > maxEmDensity;
  const emMttfYears = isEmViolated ? Math.round(15 * Math.pow(maxEmDensity / actualEmCurrentDensity, 2) * 10) / 10 : 25.0;

  // 6.1 Logic Synthesis Clock Budget
  const clockPeriodPs = Math.round((1000000 / (synthTargetFreq || 1000)) * 10) / 10;
  const marginPs = Math.round((clockPeriodPs * (timingMarginPct / 100)) * 10) / 10;
  const maxCombBudgetPs = Math.max(0, Math.round(clockPeriodPs - (tcqDelay + tsetupDelay + uncertaintyDelay + marginPs)));
  const seqOverheadPct = Math.round(((tcqDelay + tsetupDelay + uncertaintyDelay) / clockPeriodPs) * 100 * 10) / 10;

  // 6.2 Logic Depth
  const maxLogicLevels = Math.floor(maxCombBudgetPs / (fo4Delay * stageEffort));

  // 6.3 Pipelining Sizing
  const effCyclePs = clockPeriodPs - (tcqDelay + tsetupDelay + uncertaintyDelay);
  const reqPipelineStages = Math.ceil((unpipelinedDelay * 1000) / Math.max(1, effCyclePs));

  // 6.4 Method of Logical Effort (LE)
  const pathElectricalEffort = cloadCap / (cinCap || 1.0);
  const totalPathEffortF = pathElectricalEffort * pathBranching;
  const optStagesN = Math.max(1, Math.round(Math.log(totalPathEffortF) / Math.log(3.6)));
  const optStageEffortFhat = Math.round(Math.pow(totalPathEffortF, 1 / optStagesN) * 100) / 100;
  const minLePathDelayPs = Math.round(optStagesN * optStageEffortFhat * fo4Delay);

  // 6.5 Gate Equivalents (GE)
  const kiloGateEquivalents = Math.round((totalSynArea / (nand2Area || 1.0) / 1000) * 10) / 10;

  // 6.6 Asynchronous FIFO Depth
  // Depth = Burst - Burst * (f_read / f_write)
  const rawFifoDepth = Math.ceil(burstLength - burstLength * (readFreq / (writeFreq || 1)));
  const safeFifoDepth = Math.max(8, Math.pow(2, Math.ceil(Math.log2(rawFifoDepth))));
  const grayPointerBits = Math.log2(safeFifoDepth) + 1;

  // Filter list
  const DOMAIN_TABS: { id: CalculatorDomain; label: string; icon: any; count: number }[] = [
    { id: "all", label: "All Calculators", icon: Calculator, count: 34 },
    { id: "floorplan", label: "Floorplanning & Die", icon: Layout, count: 5 },
    { id: "power_plan", label: "Power Planning (PDN)", icon: Zap, count: 5 },
    { id: "cts_clock", label: "Clock Tree (CTS)", icon: Clock, count: 4 },
    { id: "signal_integrity", label: "Signal Integrity (SI)", icon: Radio, count: 3 },
    { id: "power_integrity", label: "Voltus Power & IR", icon: Flame, count: 5 },
    { id: "logic_synthesis", label: "Logic Synthesis (RTL)", icon: Cpu, count: 12 },
  ];

  return (
    <div className="space-y-8 max-w-6xl xl:max-w-7xl w-full mx-auto pb-20">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              VLSI PRODUCTION ENGINEERING CALCULATOR HUB
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Interactive VLSI & EDA Calculations Suite
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              34 live engineering calculators with real-time slider controls, LaTeX mathematical derivations, and 1-click production EDA command exporters for Cadence Innovus, Genus, Voltus, Tempus, and Synopsys.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search halo, decap, ring, inrush, fifo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800/80">
          {DOMAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedDomain === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedDomain(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400 ring-1 ring-indigo-400/50"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: FLOORPLANNING CALCULATORS */}
      {/* ===================================================================== */}
      {(selectedDomain === "all" || selectedDomain === "floorplan") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-slate-300">
            <Layout className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Floorplanning & Core/Die Sizing Calculators</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 1.1: Core Dimensions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  #1 Core Area & Dimensions Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  create_floorplan
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates required silicon core area and width/height dimensions from gate area and target utilization.
              </p>

              {/* Slider Inputs */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Standard Cell Area:</span>
                    <span className="text-white font-bold">{stdCellArea.toLocaleString()} µm²</span>
                  </div>
                  <input
                    type="range"
                    min="200000"
                    max="5000000"
                    step="50000"
                    value={stdCellArea}
                    onChange={(e) => setStdCellArea(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Macro Area (SRAM/DSP):</span>
                    <span className="text-white font-bold">{macroArea.toLocaleString()} µm²</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000000"
                    step="50000"
                    value={macroArea}
                    onChange={(e) => setMacroArea(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block mb-1">Target Util (0.5 - 0.85):</span>
                    <input
                      type="number"
                      min="0.4"
                      max="0.9"
                      step="0.05"
                      value={targetUtil}
                      onChange={(e) => setTargetUtil(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Aspect Ratio (H/W):</span>
                    <input
                      type="number"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-3 gap-2 bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Total Core Area</div>
                  <div className="text-sm font-bold text-white mt-0.5">{(coreArea / 1e6).toFixed(3)} mm²</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Core Width (X)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{coreWidth} µm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Core Height (Y)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{coreHeight} µm</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-indigo-300">
                <code>create_floorplan -site CoreSite -core_density_size {`{${targetUtil} ${aspectRatio} 20 20 20 20}`}</code>
                <button
                  onClick={() => copyCommand(`create_floorplan -site CoreSite -core_density_size {${targetUtil} ${aspectRatio} 20 20 20 20}`, "fp_core")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "fp_core" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 1.2: Die Sizing & DPW */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  #2 Die Sizing & Wafer Yield (DPW)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Die & Margins
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Adds perimeter I/O pad rings and core-to-die keepouts to calculate total silicon reticle area and Dies Per 300mm Wafer.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Core-to-Die Margins (µm):</span>
                  <input
                    type="number"
                    value={coreMarginL}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCoreMarginL(v);
                      setCoreMarginR(v);
                      setCoreMarginT(v);
                      setCoreMarginB(v);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Pad Ring Width (µm):</span>
                  <input
                    type="number"
                    value={padRingWidth}
                    onChange={(e) => setPadRingWidth(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-3 gap-2 bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Total Die Dimensions</div>
                  <div className="text-sm font-bold text-white mt-0.5">{dieWidth} × {dieHeight} µm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Die Silicon Area</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{dieAreaMm2} mm²</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Est. DPW (300mm)</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{dpw.toLocaleString()} Gross Dies</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-indigo-300">
                <code>set_db current_design .die_bbox {`{0.0 0.0 ${dieWidth} ${dieHeight}}`}</code>
                <button
                  onClick={() => copyCommand(`set_db current_design .die_bbox {0.0 0.0 ${dieWidth} ${dieHeight}}`, "fp_die")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "fp_die" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 1.3: Macro Channel & Halo */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  #3 Macro Channel Width & Halo Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  create_place_halo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Determines minimum channel spacing between hard macros based on crossing routing pin tracks and available metal layers.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Crossing Pins:</span>
                  <input
                    type="number"
                    value={crossingPins}
                    onChange={(e) => setCrossingPins(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Track Pitch (µm):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={trackPitch}
                    onChange={(e) => setTrackPitch(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Layers (M2-M5):</span>
                  <input
                    type="number"
                    value={availLayers}
                    onChange={(e) => setAvailLayers(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Min Channel Width</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{reqChannelWidth} µm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Recommended Halo per Macro</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{reqHalo} µm (All 4 Sides)</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-indigo-300">
                <code>create_place_halo -halo_deltas {`{${reqHalo} ${reqHalo} ${reqHalo} ${reqHalo}}`} -insts [get_db insts -if {`{.is_macro}`}]</code>
                <button
                  onClick={() => copyCommand(`create_place_halo -halo_deltas {${reqHalo} ${reqHalo} ${reqHalo} ${reqHalo}} -insts [get_db insts -if {.is_macro}]`, "fp_halo")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "fp_halo" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 1.4: Pad-Limited Analyzer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  #4 Pad-Limited vs Core-Limited Analyzer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  I/O Planning
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Identifies whether chip boundary is constrained by peripheral wirebond pad count or internal silicon logic area.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Required Pad Count:</span>
                  <input
                    type="number"
                    value={padCount}
                    onChange={(e) => setPadCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Wirebond Pad Pitch (µm):</span>
                  <input
                    type="number"
                    value={padPitch}
                    onChange={(e) => setPadPitch(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Max Perimeter Pads</div>
                  <div className="text-sm font-bold text-white mt-0.5">{maxPadsPerimeter} Pads</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Design Limiting Factor</div>
                  <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${isPadLimited ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                    {isPadLimited ? "PAD-LIMITED (Wasted Silicon Area)" : "CORE-LIMITED (Optimal Silicon)"}
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                {isPadLimited ? "Tip: Consider staggering I/O pads or switching to Flip-Chip area array C4 bumps." : "Design is dense and cost-efficient. All pads fit comfortably along the perimeter."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: POWER PLANNING & PDN CALCULATORS */}
      {/* ===================================================================== */}
      {(selectedDomain === "all" || selectedDomain === "power_plan") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-slate-300">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Power Planning & Power Distribution Network (PDN) Calculators</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 2.1: Total Current & Power */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  #6 Total Current & Power Budget Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  P = α·C·V²·f + P_leak
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates total SoC active current and power dissipation to feed power ring and stripe width sizing formulas.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Supply VDD (V):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={vddVoltage}
                    onChange={(e) => setVddVoltage(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Frequency (GHz):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={clockFreq}
                    onChange={(e) => setClockFreq(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Total Cap (nF):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={totalCap}
                    onChange={(e) => setTotalCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-3 gap-2 bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Dynamic Power</div>
                  <div className="text-sm font-bold text-white mt-0.5">{dynamicPowerMw} mW</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Total Chip Power</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{totalPowerMw} mW</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Total Current (I_DD)</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{totalCurrentA} A</div>
                </div>
              </div>
            </div>

            {/* Calc 2.2: Core Power Ring Sizing */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  #7 Power Ring Width Sizing (Core Rings)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  add_rings
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sizes core power ring widths on M7/M8 based on total current split across 4 sides and foundry EM current density limits.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Foundry EM Limit (mA/µm²):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={maxEmDensity}
                    onChange={(e) => setMaxEmDensity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Metal Layer Thickness (µm):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={metalThickness}
                    onChange={(e) => setMetalThickness(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Current Per Ring Side</div>
                  <div className="text-sm font-bold text-white mt-0.5">{(currentPerSideA * 1000).toFixed(1)} mA</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Min Ring Width (W)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{minRingWidthUm} µm</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>add_rings -nets {`{VDD VSS}`} -type core_rings -width {minRingWidthUm} -spacing {minRingWidthUm * 0.5} -layer {`{M7 M8}`}</code>
                <button
                  onClick={() => copyCommand(`add_rings -nets {VDD VSS} -type core_rings -width ${minRingWidthUm} -spacing ${minRingWidthUm * 0.5} -layer {M7 M8}`, "pg_rings")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_rings" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 2.3: Power Stripe Pitch & Width */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  #8 Power Mesh Stripe Pitch & Width Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  add_stripes
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates maximum stripe set-to-set pitch to guarantee static IR drop remains under the target voltage threshold.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Target Static IR (mV):</span>
                  <input
                    type="number"
                    value={targetStaticIr}
                    onChange={(e) => setTargetStaticIr(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Sheet R (Ω/sq):</span>
                  <input
                    type="number"
                    step="0.005"
                    value={sheetResistance}
                    onChange={(e) => setSheetResistance(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Stripe Width (µm):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={stripeWidth}
                    onChange={(e) => setStripeWidth(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Max Set-to-Set Pitch</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{calcStripePitch} µm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Layer Metal Area Usage</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{layerUtilization}% Area</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>add_stripes -nets {`{VDD VSS}`} -layer M6 -width {stripeWidth} -spacing {stripeWidth} -set_to_set_distance {calcStripePitch}</code>
                <button
                  onClick={() => copyCommand(`add_stripes -nets {VDD VSS} -layer M6 -width ${stripeWidth} -spacing ${stripeWidth} -set_to_set_distance ${calcStripePitch}`, "pg_stripes")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_stripes" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 2.4: Multi-Cut Via Array Matrix */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  #9 Multi-Cut Via Matrix & Contact Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  edit_power_via
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Computes required redundant via cut matrix at stripe intersections to prevent current crowding and via electromigration.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Intersection Current (mA):</span>
                  <input
                    type="number"
                    step="0.2"
                    value={intersectCurrent}
                    onChange={(e) => setIntersectCurrent(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Single Via Limit (mA):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={viaCutLimit}
                    onChange={(e) => setViaCutLimit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Required Via Cuts</div>
                  <div className="text-sm font-bold text-white mt-0.5">{reqViaCuts} Parallel Cuts</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Via Cut Matrix</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{viaRows} × {viaCols} Array Matrix</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>edit_power_via -add_redundant -nets {`{VDD VSS}`} -layers {`{M6 M7}`} -min_vias_per_connection {reqViaCuts}</code>
                <button
                  onClick={() => copyCommand(`edit_power_via -add_redundant -nets {VDD VSS} -layers {M6 M7} -min_vias_per_connection ${reqViaCuts}`, "pg_via")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_via" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: CLOCK TREE SYNTHESIS (CTS) CALCULATORS */}
      {/* ===================================================================== */}
      {(selectedDomain === "all" || selectedDomain === "cts_clock") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-slate-300">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Clock Tree Synthesis (CTS) & Useful Skew Calculators</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 3.1: Elmore Latency */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  #11 Elmore Clock Insertion Delay (Latency)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Elmore RC
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates distributed RC propagation delay and slew degradation for clock distribution trunks.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Wire Length (µm):</span>
                  <input
                    type="number"
                    value={wireLength}
                    onChange={(e) => setWireLength(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Driver R (Ω):</span>
                  <input
                    type="number"
                    value={driverR}
                    onChange={(e) => setDriverR(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Sink Cap (fF):</span>
                  <input
                    type="number"
                    value={sinkC}
                    onChange={(e) => setSinkC(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Total Net Resistance</div>
                  <div className="text-sm font-bold text-white mt-0.5">{wireR.toFixed(1)} Ω</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Elmore Insertion Delay</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{elmoreDelayPs} ps</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <code>set_ccopt_property target_insertion_delay {(elmoreDelayPs / 1000).toFixed(3)}</code>
                <button
                  onClick={() => copyCommand(`set_ccopt_property target_insertion_delay ${(elmoreDelayPs / 1000).toFixed(3)}`, "cts_elmore")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "cts_elmore" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 3.2: Useful Skew Optimizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  #13 Intentional Useful Skew Optimizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  CCOpt Skew Scheduling
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates maximum safe capture clock delay that recovers critical setup slack without causing downstream hold violations.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Violated Setup Slack (ps):</span>
                  <input
                    type="number"
                    value={setupSlack}
                    onChange={(e) => setSetupSlack(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-rose-300 font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Downstream Hold Slack (ps):</span>
                  <input
                    type="number"
                    value={downstreamHoldSlack}
                    onChange={(e) => setDownstreamHoldSlack(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-300 font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Max Safe Useful Skew</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">+{maxUsefulSkew} ps</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Remaining Hold Margin</div>
                  <div className="text-sm font-bold text-white mt-0.5">{downstreamHoldSlack - maxUsefulSkew} ps (Safe)</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <code>set_ccopt_property -skew_group SG_CORE target_skew {(maxUsefulSkew / 1000).toFixed(3)}</code>
                <button
                  onClick={() => copyCommand(`set_ccopt_property -skew_group SG_CORE target_skew ${(maxUsefulSkew / 1000).toFixed(3)}`, "cts_skew")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "cts_skew" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 4: LOGIC SYNTHESIS CALCULATORS */}
      {/* ===================================================================== */}
      {(selectedDomain === "all" || selectedDomain === "logic_synthesis") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-slate-300">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">RTL & Logic Synthesis Calculators</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 6.1: Clock Period & Max Comb Budget */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #23 Clock Period & Max Comb Budget
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  create_clock
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Derives maximum allowed combinational logic delay by subtracting flip-flop T_cq, setup time, clock jitter, and margins from clock period.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Target Freq (MHz):</span>
                  <input
                    type="number"
                    value={synthTargetFreq}
                    onChange={(e) => setSynthTargetFreq(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">T_cq + T_setup (ps):</span>
                  <input
                    type="number"
                    value={tcqDelay + tsetupDelay}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTcqDelay(Math.round(v * 0.55));
                      setTsetupDelay(Math.round(v * 0.45));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Jitter / Margin (%):</span>
                  <input
                    type="number"
                    value={timingMarginPct}
                    onChange={(e) => setTimingMarginPct(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-3 gap-2 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Clock Period</div>
                  <div className="text-sm font-bold text-white mt-0.5">{(clockPeriodPs / 1000).toFixed(3)} ns</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Max Comb Budget</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{maxCombBudgetPs} ps</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Seq Overhead</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{seqOverheadPct}% Period</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>create_clock -name clk_core -period {(clockPeriodPs / 1000).toFixed(3)} [get_ports clk]</code>
                <button
                  onClick={() => copyCommand(`create_clock -name clk_core -period ${(clockPeriodPs / 1000).toFixed(3)} [get_ports clk]`, "syn_clk")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_clk" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 6.2: Logic Depth & FO4 Estimator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #24 Logic Depth & Gate Level Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  FO4 Inverter Metric
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Estimates maximum allowable combinational gate levels based on process node Fanout-of-4 (FO4) delay metrics.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Process FO4 Delay (ps):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={fo4Delay}
                    onChange={(e) => setFo4Delay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Avg Stage Effort (1.5 - 2.5):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={stageEffort}
                    onChange={(e) => setStageEffort(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Total FO4 Delays in Budget</div>
                  <div className="text-sm font-bold text-white mt-0.5">{(maxCombBudgetPs / (fo4Delay || 1)).toFixed(1)} FO4s</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Max Allowable Gate Levels</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{maxLogicLevels} Logic Levels</div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                {maxLogicLevels >= 18 ? "Adequate logic depth. Arithmetic 32-bit adders can close timing in a single cycle." : "Constrained logic depth. Complex multipliers must be multi-stage pipelined."}
              </div>
            </div>

            {/* Calc 6.6: Asynchronous FIFO Depth (CDC) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #33 Asynchronous FIFO Depth (CDC Safe)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  CDC Burst Sizing
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates safe power-of-2 dual-clock FIFO depth to guarantee zero data loss during multi-rate clock domain crossings.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Write Freq (MHz):</span>
                  <input
                    type="number"
                    value={writeFreq}
                    onChange={(e) => setWriteFreq(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Read Freq (MHz):</span>
                  <input
                    type="number"
                    value={readFreq}
                    onChange={(e) => setReadFreq(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Burst Size (Words):</span>
                  <input
                    type="number"
                    value={burstLength}
                    onChange={(e) => setBurstLength(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Safe FIFO Depth (Power of 2)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{safeFifoDepth} Words</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Gray Pointer Width</div>
                  <div className="text-sm font-bold text-white mt-0.5">{grayPointerBits} Bits (N+1)</div>
                </div>
              </div>

              {/* SDC Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>set_clock_groups -asynchronous -group {`{clk_wr}`} -group {`{clk_rd}`}</code>
                <button
                  onClick={() => copyCommand(`set_clock_groups -asynchronous -group {clk_wr} -group {clk_rd}`, "syn_fifo")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_fifo" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 6.5: Gate Equivalent (GE) Converter */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #29 Gate Equivalent (GE) Converter
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_area -ge
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Converts physical synthesized cell area in square micrometers into standard industry NAND2 Gate Equivalents (kGE / MGE).
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Synthesized Area (µm²):</span>
                  <input
                    type="number"
                    step="10000"
                    value={totalSynArea}
                    onChange={(e) => setTotalSynArea(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">NAND2_X1 Unit Area (µm²):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={nand2Area}
                    onChange={(e) => setNand2Area(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Equivalent Complexity</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{kiloGateEquivalents.toLocaleString()} kGE</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Mega-Gates (MGE)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{(kiloGateEquivalents / 1000).toFixed(2)} MGE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 5: SIGNAL INTEGRITY & ANTENNA CALCULATORS */}
      {/* ===================================================================== */}
      {(selectedDomain === "all" || selectedDomain === "signal_integrity") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-slate-300">
            <Radio className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Signal Integrity (SI) & Process Antenna Calculators</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 4.1: Process Antenna Sizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  #15 Process Antenna Ratio (PAR) & Diode Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  insert_antenna_diode
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Evaluates plasma charge accumulation ratios on metal layers and sizes reverse-biased antenna diodes.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Metal Area (µm²):</span>
                  <input
                    type="number"
                    value={metalArea}
                    onChange={(e) => setMetalArea(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Gate Oxide Area (µm²):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={gateOxideArea}
                    onChange={(e) => setGateOxideArea(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Foundry Limit:</span>
                  <input
                    type="number"
                    value={antennaLimit}
                    onChange={(e) => setAntennaLimit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Actual Antenna Ratio (AR)</div>
                  <div className={`text-sm font-bold mt-0.5 ${isAntennaViolated ? "text-rose-400" : "text-emerald-400"}`}>
                    {actualPAR}:1 {isAntennaViolated ? "(VIOLATION)" : "(MET)"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Required Diode Size</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {isAntennaViolated ? `${reqDiodeArea} µm² (ANTENNA_X1)` : "0 µm² (None Required)"}
                  </div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-purple-300">
                <code>insert_antenna_diode -cell ANTENNA_X1 -nets [get_db nets -if {`{.antenna_ratio > ${antennaLimit}}`}]</code>
                <button
                  onClick={() => copyCommand(`insert_antenna_diode -cell ANTENNA_X1 -nets [get_db nets -if {.antenna_ratio > ${antennaLimit}}]`, "si_antenna")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "si_antenna" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 4.3: Crosstalk Glitch Peak */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  #17 Crosstalk Glitch Peak Voltage Noise
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_noise
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates capacitively coupled glitch peak voltage amplitude and verifies receiver noise margins.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Coupling Cap (fF):</span>
                  <input
                    type="number"
                    value={couplingCap}
                    onChange={(e) => setCouplingCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Ground Cap (fF):</span>
                  <input
                    type="number"
                    value={groundCap}
                    onChange={(e) => setGroundCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Driver R (Ω):</span>
                  <input
                    type="number"
                    value={driverRes}
                    onChange={(e) => setDriverRes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Peak Glitch Amplitude</div>
                  <div className="text-sm font-bold text-white mt-0.5">{(glitchPeakVolt * 1000).toFixed(1)} mV</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Glitch Peak % VDD</div>
                  <div className={`text-sm font-bold mt-0.5 ${glitchPctVdd > 20 ? "text-rose-400" : "text-emerald-400"}`}>
                    {glitchPctVdd}% VDD {glitchPctVdd > 20 ? "(NOISE FAIL)" : "(SAFE)"}
                  </div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-purple-300">
                <code>report_noise -violators -above 0.20 -out_file noise_signoff.rpt</code>
                <button
                  onClick={() => copyCommand(`report_noise -violators -above 0.20 -out_file noise_signoff.rpt`, "si_noise")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "si_noise" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 6: POWER INTEGRITY & VOLTUS CALCULATORS */}
      {/* ===================================================================== */}
      {(selectedDomain === "all" || selectedDomain === "power_integrity") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-slate-300">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Power Integrity, Dynamic IR Drop & EM Calculators</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 5.1: Dynamic L*di/dt Drop */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  #18 Dynamic L·di/dt Transient Rail Drop
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  analyze_rail -dynamic
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Models simultaneous switching current slew (di/dt) and package inductance to calculate peak dynamic voltage dips.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Peak Current Slew (mA/ps):</span>
                  <input
                    type="number"
                    value={currentSlewRate}
                    onChange={(e) => setCurrentSlewRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Package Inductance (nH):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={packageInductance}
                    onChange={(e) => setPackageInductance(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-3 gap-2 bg-orange-950/30 border border-orange-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Inductive Drop (V_L)</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">{vInductiveDropMv} mV</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Total Dynamic Drop</div>
                  <div className="text-sm font-bold text-white mt-0.5">{vTotalDynamicDropMv} mV</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Dynamic % VDD</div>
                  <div className={`text-sm font-bold mt-0.5 ${dynamicDropPctVdd > 5.0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {dynamicDropPctVdd}% {dynamicDropPctVdd > 5.0 ? "(FAIL)" : "(MET)"}
                  </div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-orange-300">
                <code>set_rail_analysis_mode -method dynamic -accuracy hd -voltage_threshold 0.040</code>
                <button
                  onClick={() => copyCommand(`set_rail_analysis_mode -method dynamic -accuracy hd -voltage_threshold 0.040`, "pi_dyn")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pi_dyn" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Calc 5.2: Decap Sizing */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  #19 Decoupling Capacitor (Decap) Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  add_decaps
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates required on-die charge storage capacitance to dampen localized dynamic switching spikes.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Peak Current Surge (A):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={peakCurrentSurge}
                    onChange={(e) => setPeakCurrentSurge(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Allowable Drop (mV):</span>
                  <input
                    type="number"
                    value={allowableDynamicDrop}
                    onChange={(e) => setAllowableDynamicDrop(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              {/* Output Results */}
              <div className="grid grid-cols-2 gap-3 bg-orange-950/30 border border-orange-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Required Decap Capacitance</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{reqDecapNf} nF</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Decap Cell Count (X32)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{decapCellCount.toLocaleString()} Cells</div>
                </div>
              </div>

              {/* EDA Command */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-orange-300">
                <code>add_decaps -cells {`{DECAP_X32_THICK_OD}`} -density 0.12 -target_ir_drop {(allowableDynamicDrop / 1000).toFixed(3)}</code>
                <button
                  onClick={() => copyCommand(`add_decaps -cells {DECAP_X32_THICK_OD} -density 0.12 -target_ir_drop ${(allowableDynamicDrop / 1000).toFixed(3)}`, "pi_decap")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pi_decap" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
