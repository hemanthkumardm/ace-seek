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

function FormulaCard({
  formula,
  variables,
  insight,
  edaTool = "Cadence Innovus / Synopsys ICC2",
}: {
  formula: string;
  variables: string;
  insight: string;
  edaTool?: string;
}) {
  return (
    <div className="bg-slate-950/95 border border-slate-800/90 rounded-xl p-3.5 space-y-2 font-mono text-left shadow-lg">
      <div className="flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Underlying Formula & Physics Model</span>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-medium shrink-0">
          {edaTool}
        </span>
      </div>

      <div className="text-[11px] sm:text-xs font-bold text-amber-200 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800/90 tracking-wide overflow-x-auto whitespace-nowrap shadow-inner">
        {formula}
      </div>

      <div className="text-[10px] text-slate-300 space-y-1.5 leading-relaxed border-t border-slate-800/60 pt-2">
        <div className="text-slate-400">
          <strong className="text-slate-200">Variables:</strong> {variables}
        </div>
        <div className="text-slate-400">
          <strong className="text-cyan-400">EDA Physical Insight:</strong> {insight}
        </div>
      </div>
    </div>
  );
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

  // 1.3 Macro Channel Width
  const [crossingPins, setCrossingPins] = useState<number>(128);
  const [trackPitch, setTrackPitch] = useState<number>(0.14); // um
  const [availLayers, setAvailLayers] = useState<number>(4);

  // 1.4 Pad-Limited vs Core-Limited
  const [padCount, setPadCount] = useState<number>(160);
  const [padPitch, setPadPitch] = useState<number>(55); // um

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

  // 3.2 Clock Buffer Stages
  const [clockRootInCap, setClockRootInCap] = useState<number>(4.0); // fF
  const [totalTreeLeafCap, setTotalTreeLeafCap] = useState<number>(2500.0); // fF

  // 3.3 Useful Skew Optimizer
  const [setupSlack, setSetupSlack] = useState<number>(-45); // ps
  const [downstreamHoldSlack, setDownstreamHoldSlack] = useState<number>(65); // ps

  // 3.4 Clock Power & ICG
  const [clockSinks, setClockSinks] = useState<number>(28000);
  const [clockGatingEff, setClockGatingEff] = useState<number>(0.75);

  // =========================================================================
  // 4. RTL & LOGIC SYNTHESIS CALCULATORS STATE
  // =========================================================================
  // 4.1 Clock Period & Combinational Budget
  const [synthTargetFreq, setSynthTargetFreq] = useState<number>(1250); // MHz
  const [tcqDelay, setTcqDelay] = useState<number>(42); // ps
  const [tsetupDelay, setTsetupDelay] = useState<number>(35); // ps
  const [uncertaintyDelay, setUncertaintyDelay] = useState<number>(40); // ps
  const [timingMarginPct, setTimingMarginPct] = useState<number>(10); // 10%

  // 4.2 Logic Depth & Gate Level Estimator
  const [fo4Delay, setFo4Delay] = useState<number>(12.5); // ps
  const [stageEffort, setStageEffort] = useState<number>(1.8);

  // 4.3 Setup Slack
  const [launchClockDelay, setLaunchClockDelay] = useState<number>(180); // ps
  const [captureClockDelay, setCaptureClockDelay] = useState<number>(195); // ps
  const [combDataDelay, setCombDataDelay] = useState<number>(560); // ps

  // 4.4 Hold Slack
  const [minCombDataDelay, setMinCombDataDelay] = useState<number>(65); // ps
  const [tholdDelay, setTholdDelay] = useState<number>(25); // ps

  // 4.5 Method of Logical Effort (LE)
  const [cinCap, setCinCap] = useState<number>(2.5); // fF
  const [cloadCap, setCloadCap] = useState<number>(120.0); // fF
  const [pathBranching, setPathBranching] = useState<number>(2.0);

  // 4.6 Pipelining Latency vs Throughput Sizer
  const [unpipelinedDelay, setUnpipelinedDelay] = useState<number>(3.8); // ns

  // 4.7 Gate Equivalent (GE) Converter
  const [totalSynArea, setTotalSynArea] = useState<number>(350000); // um2
  const [nand2Area, setNand2Area] = useState<number>(0.84); // um2

  // 4.8 Wireload Model RC Estimator
  const [netFanout, setNetFanout] = useState<number>(6);
  const [blockGateCount, setBlockGateCount] = useState<number>(50000);

  // 4.9 ADP & EDP
  const [designAreaMm2, setDesignAreaMm2] = useState<number>(1.25); // mm2
  const [criticalDelayNs, setCriticalDelayNs] = useState<number>(0.85); // ns
  const [activePowerMw, setActivePowerMw] = useState<number>(45.0); // mW

  // 4.10 Asynchronous FIFO Depth (CDC)
  const [writeFreq, setWriteFreq] = useState<number>(400); // MHz
  const [readFreq, setReadFreq] = useState<number>(125); // MHz
  const [burstLength, setBurstLength] = useState<number>(128); // words

  // =========================================================================
  // 5. SIGNAL INTEGRITY & ANTENNA CALCULATORS STATE
  // =========================================================================
  // 5.1 Process Antenna Ratio (PAR)
  const [metalArea, setMetalArea] = useState<number>(185.0); // um2
  const [gateOxideArea, setGateOxideArea] = useState<number>(0.32); // um2
  const [antennaLimit, setAntennaLimit] = useState<number>(400); // 400:1

  // 5.2 Miller Coupling Delta Delay
  const [couplingCap, setCouplingCap] = useState<number>(18.5); // fF
  const [groundCap, setGroundCap] = useState<number>(14.0); // fF
  const [driverRes, setDriverRes] = useState<number>(180); // Ohm

  // 5.3 Crosstalk Glitch Voltage
  const [aggressorSlew, setAggressorSlew] = useState<number>(45); // ps

  // 5.4 Slew Degradation & Transition Time
  const [inputSlewPs, setInputSlewPs] = useState<number>(30); // ps
  const [interconnectR, setInterconnectR] = useState<number>(85); // Ohm
  const [fanoutC, setFanoutC] = useState<number>(45); // fF

  // 5.5 Decoupling Radius
  const [switchRiseTimePs, setSwitchRiseTimePs] = useState<number>(40); // ps
  const [pdnPropVelocity, setPdnPropVelocity] = useState<number>(150); // um/ps

  // =========================================================================
  // 6. POWER INTEGRITY & VOLTUS CALCULATORS STATE
  // =========================================================================
  // 6.1 Dynamic L*di/dt Drop
  const [peakCurrentSurge, setPeakCurrentSurge] = useState<number>(4.2); // A
  const [currentSlewRate, setCurrentSlewRate] = useState<number>(35.0); // mA/ps
  const [packageInductance, setPackageInductance] = useState<number>(0.45); // nH
  const [meshResistance, setMeshResistance] = useState<number>(0.018); // Ohm

  // 6.2 Decap Sizing
  const [switchingWindow, setSwitchingWindow] = useState<number>(65); // ps
  const [allowableDynamicDrop, setAllowableDynamicDrop] = useState<number>(32.0); // mV

  // 6.3 MTCMOS Inrush Current
  const [virtualRailCap, setVirtualRailCap] = useState<number>(35.0); // nF
  const [targetWakeupTime, setTargetWakeupTime] = useState<number>(45.0); // ns

  // 6.4 Electromigration Black's MTTF
  const [emRmsCurrent, setEmRmsCurrent] = useState<number>(2.8); // mA
  const [emWireWidth, setEmWireWidth] = useState<number>(0.40); // um
  const [junctionTemp, setJunctionTemp] = useState<number>(105); // C

  // 6.5 Target Impedance (Z_target)
  const [pdnMaxRipplePct, setPdnMaxRipplePct] = useState<number>(3.0); // 3% VDD
  const [transientStepCurrent, setTransientStepCurrent] = useState<number>(5.5); // A

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
  const waferRadius = 150;
  const dpw = Math.max(0, Math.floor((Math.PI * waferRadius * waferRadius) / dieAreaMm2 - (Math.PI * 2 * waferRadius) / Math.sqrt(2 * dieAreaMm2)));

  // 1.3 Macro Channel
  const reqChannelWidth = Math.round(((crossingPins * trackPitch) / (availLayers * 0.75)) * 100) / 100;
  const reqHalo = Math.round((reqChannelWidth / 2) * 100) / 100;

  // 1.4 Pad Limit Analyzer
  const maxPadsPerimeter = Math.floor((2 * (dieWidth + dieHeight)) / (padPitch || 55));
  const isPadLimited = padCount > maxPadsPerimeter;

  // 1.5 Row Snapping
  const totalRows = Math.floor(coreHeight / (rowHeight || 0.54));
  const totalSiteCols = Math.floor(coreWidth / (siteWidth || 0.09));
  const snappedCoreAreaMm2 = Math.round(((totalRows * rowHeight * totalSiteCols * siteWidth) / 1e6) * 1000) / 1000;

  // 2.1 Power & Current
  const dynamicPowerMw = Math.round(activityFactor * totalCap * vddVoltage * vddVoltage * clockFreq * 1000 * 10) / 10;
  const totalPowerMw = Math.round((dynamicPowerMw + leakagePower) * 10) / 10;
  const totalCurrentA = Math.round((totalPowerMw / (vddVoltage * 1000)) * 1000) / 1000;

  // 2.2 Ring Width
  const currentPerSideA = totalCurrentA / 4;
  const minRingWidthUm = Math.round(((currentPerSideA * 1000) / (maxEmDensity * metalThickness)) * 100) / 100;

  // 2.3 Mesh Stripe Pitch
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
  const totalWellTapsReq = Math.ceil(coreArea / (tapPitch * rowHeight * 10));

  // 3.1 Elmore Latency
  const wireR = (wireLength * unitR);
  const wireC = (wireLength * unitC) / 1000; // pF
  const elmoreDelayPs = Math.round(driverR * (wireC + sinkC / 1000) + 0.5 * wireR * wireC + wireR * (sinkC / 1000) * 1000);

  // 3.2 Clock Buffer Stages
  const treeGainRatio = totalTreeLeafCap / (clockRootInCap || 1.0);
  const optBufferStages = Math.max(1, Math.round(Math.log(treeGainRatio) / Math.log(Math.E)));
  const optBufferFanout = Math.round(Math.pow(treeGainRatio, 1 / optBufferStages) * 10) / 10;

  // 3.3 Useful Skew
  const maxUsefulSkew = Math.min(Math.abs(setupSlack), Math.max(0, downstreamHoldSlack - 15));

  // 3.4 Clock Power & ICG
  const unGatedClockPowerMw = Math.round(2.0 * (clockSinks * 0.002) * vddVoltage * vddVoltage * clockFreq * 1000 * 10) / 10;
  const gatedClockPowerMw = Math.round(unGatedClockPowerMw * (1 - clockGatingEff * 0.65) * 10) / 10;
  const savedClockPowerMw = Math.round((unGatedClockPowerMw - gatedClockPowerMw) * 10) / 10;

  // 4.1 Logic Synthesis Clock Budget
  const clockPeriodPs = Math.round((1000000 / (synthTargetFreq || 1000)) * 10) / 10;
  const marginPs = Math.round((clockPeriodPs * (timingMarginPct / 100)) * 10) / 10;
  const maxCombBudgetPs = Math.max(0, Math.round(clockPeriodPs - (tcqDelay + tsetupDelay + uncertaintyDelay + marginPs)));
  const seqOverheadPct = Math.round(((tcqDelay + tsetupDelay + uncertaintyDelay) / clockPeriodPs) * 100 * 10) / 10;

  // 4.2 Logic Depth
  const maxLogicLevels = Math.floor(maxCombBudgetPs / (fo4Delay * stageEffort));

  // 4.3 Setup Slack
  const requiredSetupTimePs = clockPeriodPs + captureClockDelay - uncertaintyDelay - tsetupDelay;
  const arrivalSetupTimePs = launchClockDelay + combDataDelay;
  const calculatedSetupSlackPs = Math.round(requiredSetupTimePs - arrivalSetupTimePs);

  // 4.4 Hold Slack
  const requiredHoldTimePs = captureClockDelay + uncertaintyDelay + tholdDelay;
  const arrivalHoldTimePs = launchClockDelay + minCombDataDelay;
  const calculatedHoldSlackPs = Math.round(arrivalHoldTimePs - requiredHoldTimePs);

  // 4.5 Method of Logical Effort (LE)
  const pathElectricalEffort = cloadCap / (cinCap || 1.0);
  const totalPathEffortF = pathElectricalEffort * pathBranching;
  const optStagesN = Math.max(1, Math.round(Math.log(totalPathEffortF) / Math.log(3.6)));
  const optStageEffortFhat = Math.round(Math.pow(totalPathEffortF, 1 / optStagesN) * 100) / 100;
  const minLePathDelayPs = Math.round(optStagesN * optStageEffortFhat * fo4Delay);

  // 4.6 Pipelining Sizing
  const effCyclePs = clockPeriodPs - (tcqDelay + tsetupDelay + uncertaintyDelay);
  const reqPipelineStages = Math.ceil((unpipelinedDelay * 1000) / Math.max(1, effCyclePs));

  // 4.7 Gate Equivalents (GE)
  const kiloGateEquivalents = Math.round((totalSynArea / (nand2Area || 1.0) / 1000) * 10) / 10;

  // 4.8 Wireload Model RC
  const estWireLenUm = Math.round(12.0 * Math.pow(blockGateCount / 1000, 0.4) * (1 + netFanout * 0.35));
  const estWireDelayPs = Math.round(estWireLenUm * 0.08 * (1 + netFanout * 0.15));

  // 4.9 ADP & EDP
  const adpScore = Math.round(designAreaMm2 * criticalDelayNs * 1000) / 1000;
  const edpScore = Math.round((activePowerMw * criticalDelayNs * criticalDelayNs) * 100) / 100;

  // 4.10 Asynchronous FIFO Depth
  const rawFifoDepth = Math.ceil(burstLength - burstLength * (readFreq / (writeFreq || 1)));
  const safeFifoDepth = Math.max(8, Math.pow(2, Math.ceil(Math.log2(rawFifoDepth))));
  const grayPointerBits = Math.log2(safeFifoDepth) + 1;

  // 5.1 Process Antenna
  const actualPAR = Math.round((metalArea / (gateOxideArea || 0.01)) * 10) / 10;
  const isAntennaViolated = actualPAR > antennaLimit;
  const reqDiodeArea = isAntennaViolated ? Math.round(((metalArea - antennaLimit * gateOxideArea) / 250) * 1000) / 1000 : 0;

  // 5.2 Miller Coupling
  const effCapOutOfPhase = Math.round((groundCap + 2 * couplingCap) * 10) / 10;
  const deltaDelaySlowdownPs = Math.round((driverRes * 2 * (couplingCap / 1000)) * 1000);

  // 5.3 Crosstalk Glitch
  const glitchPeakVolt = Math.round((vddVoltage * (couplingCap / (couplingCap + groundCap)) * (driverRes / (driverRes + (aggressorSlew / 0.05)))) * 1000) / 1000;
  const glitchPctVdd = Math.round((glitchPeakVolt / vddVoltage) * 100 * 10) / 10;

  // 5.4 Slew Degradation
  const totalSlewOutPs = Math.round(Math.sqrt(inputSlewPs * inputSlewPs + Math.pow(2.2 * interconnectR * (fanoutC / 1000), 2)));

  // 5.5 Decoupling Radius
  const maxDecapRadiusUm = Math.round((switchRiseTimePs / 2) * pdnPropVelocity * 0.01);

  // 6.1 Dynamic L*di/dt
  const vInductiveDropMv = Math.round(packageInductance * currentSlewRate * 1000 * 10) / 10;
  const vResistiveDropMv = Math.round(peakCurrentSurge * meshResistance * 1000 * 10) / 10;
  const vTotalDynamicDropMv = Math.round((vInductiveDropMv + vResistiveDropMv) * 10) / 10;
  const dynamicDropPctVdd = Math.round((vTotalDynamicDropMv / (vddVoltage * 1000)) * 100 * 10) / 10;

  // 6.2 Decap Sizing
  const reqChargePc = peakCurrentSurge * switchingWindow; // pC
  const reqDecapNf = Math.round((reqChargePc / (allowableDynamicDrop || 30)) * 10) / 10;
  const decapCellCount = Math.ceil((reqDecapNf * 1000) / 32);

  // 6.3 MTCMOS Inrush Current
  const peakInrushCurrentA = Math.round(((virtualRailCap * vddVoltage) / (targetWakeupTime || 10)) * 100) / 100;
  const reqDaisyStages = Math.ceil(peakInrushCurrentA / 0.35);

  // 6.4 Black's EM MTTF
  const actualEmCurrentDensity = Math.round((emRmsCurrent / (emWireWidth * metalThickness)) * 100) / 100;
  const isEmViolated = actualEmCurrentDensity > maxEmDensity;
  const emMttfYears = isEmViolated ? Math.round(15 * Math.pow(maxEmDensity / actualEmCurrentDensity, 2) * 10) / 10 : 25.0;

  // 6.5 Target Impedance
  const maxPdnVoltageRippleMv = (vddVoltage * 1000 * (pdnMaxRipplePct / 100));
  const zTargetMilliOhms = Math.round((maxPdnVoltageRippleMv / (transientStepCurrent * 0.5)) * 10) / 10;

  // Filter list
  const DOMAIN_TABS: { id: CalculatorDomain; label: string; icon: any; count: number }[] = [
    { id: "all", label: "All Calculators", icon: Calculator, count: 34 },
    { id: "floorplan", label: "Floorplanning & Die", icon: Layout, count: 5 },
    { id: "power_plan", label: "Power Planning (PDN)", icon: Zap, count: 5 },
    { id: "cts_clock", label: "Clock Tree (CTS)", icon: Clock, count: 4 },
    { id: "logic_synthesis", label: "Logic Synthesis (RTL)", icon: Cpu, count: 10 },
    { id: "signal_integrity", label: "Signal Integrity (SI)", icon: Radio, count: 5 },
    { id: "power_integrity", label: "Voltus Power & IR", icon: Flame, count: 5 },
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
              34 live engineering calculators with real-time slider controls, LaTeX & ASCII mathematical formulas, physical variable breakdowns, and 1-click production EDA command exporters for Cadence Innovus, Genus, Voltus, Tempus, and Synopsys.
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
            <h2 className="text-lg font-bold text-white">Floorplanning & Core/Die Sizing Calculators (1–5)</h2>
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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-indigo-300">
                <code>create_floorplan -site CoreSite -core_density_size {`{${targetUtil} ${aspectRatio} 20 20 20 20}`}</code>
                <button
                  onClick={() => copyCommand(`create_floorplan -site CoreSite -core_density_size {${targetUtil} ${aspectRatio} 20 20 20 20}`, "fp_core")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "fp_core" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="A_core = (A_std + A_macro) / Target_Util  |  Width = √(A_core / Aspect)  |  Height = A_core / Width"
                variables="A_std = Standard cell area, A_macro = Hard IP/SRAM area, Target_Util = Placement density ratio (0.50 - 0.85), Aspect = Height / Width ratio (H/W)."
                insight="Cadence Innovus and Synopsys ICC2 establish core boundaries [X1, Y1, X2, Y2] so cell density stays within routing feasibility limits."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
            </div>

            {/* Calc 1.2: Die Sizing & DPW */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  #2 Die Sizing & Wafer Yield (DPW)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  set_db .die_bbox
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Adds perimeter I/O pad rings and core-to-die keepouts to calculate total silicon reticle area and Dies Per 300mm Wafer.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-indigo-300">
                <code>set_db current_design .die_bbox {`{0.0 0.0 ${dieWidth} ${dieHeight}}`}</code>
                <button
                  onClick={() => copyCommand(`set_db current_design .die_bbox {0.0 0.0 ${dieWidth} ${dieHeight}}`, "fp_die")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "fp_die" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="W_die = W_core + 2·Margin + 2·W_pad  |  DPW = (π·r_wafer²) / A_die - (2π·r_wafer) / √(2·A_die)"
                variables="W_die = Full reticle width, Margin = Core-to-die keepout (20-40 µm), W_pad = I/O cell height, r_wafer = Wafer radius (150 mm for 300 mm wafer), A_die = Die area in mm²."
                insight="Accounts for edge wafer scrap and saw blade dicing scribe channels (80-120 µm) between reticles."
                edaTool="Cadence Innovus / Scribe Signoff"
              />
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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-indigo-300">
                <code>create_place_halo -halo_deltas {`{${reqHalo} ${reqHalo} ${reqHalo} ${reqHalo}}`} -insts [get_db insts -if {`{.is_macro}`}]</code>
                <button
                  onClick={() => copyCommand(`create_place_halo -halo_deltas {${reqHalo} ${reqHalo} ${reqHalo} ${reqHalo}} -insts [get_db insts -if {.is_macro}]`, "fp_halo")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "fp_halo" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="W_channel = (N_pins · Pitch_track) / (N_layers · 0.75)  |  Halo_macro = W_channel / 2"
                variables="N_pins = Bus routing pins crossing macro gap, Pitch_track = Metal track pitch (µm), N_layers = Available routing metal layers, 0.75 = Practical routing efficiency."
                insight="Prevents standard cell placement within macro gaps and eliminates pin access routing congestion hotspots."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
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

              <div className="grid grid-cols-2 gap-3 bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Max Perimeter Pads</div>
                  <div className="text-sm font-bold text-white mt-0.5">{maxPadsPerimeter} Pads</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Design Limiting Factor</div>
                  <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${isPadLimited ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                    {isPadLimited ? "PAD-LIMITED (Wasted Silicon)" : "CORE-LIMITED (Optimal Silicon)"}
                  </div>
                </div>
              </div>

              <FormulaCard
                formula="N_max_pads = ⌊ 2·(W_die + H_die) / Pitch_pad ⌋  |  Condition: N_req > N_max_pads ⇒ Pad-Limited"
                variables="W_die, H_die = Outer silicon die dimensions (µm), Pitch_pad = Center-to-center bond pad pitch (50-65 µm), N_req = Required signal/power I/O count."
                insight="If pad-limited, consider staggered multi-tier wirebond I/O cells or migrating to Flip-Chip C4 area array bumps."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
            </div>

            {/* Calc 1.5: Row Grid Snapping */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  #5 Standard Cell Row & Site Grid Snapping Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  create_site_row
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Aligns floorplan core dimensions to integer multiples of standard cell library row height and site column pitch.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Row Height (µm):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rowHeight}
                    onChange={(e) => setRowHeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Site Width (µm):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={siteWidth}
                    onChange={(e) => setSiteWidth(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Total Placed Rows:</span>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-400 font-bold">{totalRows} Rows</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Total Site Columns:</span>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-400 font-bold">{totalSiteCols.toLocaleString()} Cols</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-indigo-300">
                <code>create_site_row -site CoreSite -height {rowHeight} -width {siteWidth} -origin {`{0.0 0.0}`}</code>
                <button
                  onClick={() => copyCommand(`create_site_row -site CoreSite -height ${rowHeight} -width ${siteWidth} -origin {0.0 0.0}`, "fp_site")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "fp_site" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="N_rows = ⌊ H_core / H_row ⌋  |  N_sites = ⌊ W_core / W_site ⌋  |  A_snapped = N_rows · N_sites · (H_row · W_site)"
                variables="H_row = Standard cell track height (e.g. 7.5T, 9T, or 12T cell pitch), W_site = FinFET manufacturing grid unit step (µm)."
                insight="Floorplan dimensions must align strictly to the site grid; unaligned boundaries cause illegal off-grid placement DRCs."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
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
            <h2 className="text-lg font-bold text-white">Power Planning & Power Distribution Network (PDN) Calculators (6–10)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 2.1: Total Current & Power */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  #6 Total Current & Power Budget Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_power
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates total SoC active current and power dissipation to feed power ring and stripe width sizing formulas.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>report_power -leakage -dynamic -out_file power_budget.rpt</code>
                <button
                  onClick={() => copyCommand(`report_power -leakage -dynamic -out_file power_budget.rpt`, "pg_pwr")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_pwr" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="P_total = α·C_total·V_DD²·f_clk + P_leak  |  I_DD_total = P_total / V_DD"
                variables="α = Activity factor (0.10 - 0.20), C_total = Total switched node capacitance (nF), V_DD = Operating voltage (V), f_clk = Operating frequency (GHz)."
                insight="Establishes global current envelope for package power bump allocation and electromigration sizing."
                edaTool="Cadence Voltus / Synopsys PrimePower"
              />
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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>add_rings -nets {`{VDD VSS}`} -type core_rings -width {minRingWidthUm} -spacing {Math.round(minRingWidthUm * 0.5 * 10) / 10} -layer {`{M7 M8}`}</code>
                <button
                  onClick={() => copyCommand(`add_rings -nets {VDD VSS} -type core_rings -width ${minRingWidthUm} -spacing ${minRingWidthUm * 0.5} -layer {M7 M8}`, "pg_rings")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_rings" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="I_side = I_DD_total / 4  |  W_ring_min = I_side / (J_EM_limit · t_metal)"
                variables="I_side = Current per core ring side (A), J_EM_limit = Foundry DC electromigration density (mA/µm²), t_metal = Layer metal thickness (µm)."
                insight="Guarantees top metal layers M7/M8 carry peripheral core current without thermal degradation or void formation."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>add_stripes -nets {`{VDD VSS}`} -layer M6 -width {stripeWidth} -spacing {stripeWidth} -set_to_set_distance {calcStripePitch}</code>
                <button
                  onClick={() => copyCommand(`add_stripes -nets {VDD VSS} -layer M6 -width ${stripeWidth} -spacing ${stripeWidth} -set_to_set_distance ${calcStripePitch}`, "pg_stripes")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_stripes" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="J_area = I_DD / A_core  |  Pitch_max = (8 · ΔV_IR · W_stripe) / (J_area · R_sheet · L_core)"
                variables="ΔV_IR = Target IR drop (mV), R_sheet = Sheet resistance (Ω/□), W_stripe = Stripe width (µm), L_core = Stripe span length (µm)."
                insight="Guarantees static resistive voltage drop across the intermediate mesh stays under 2% VDD."
                edaTool="Cadence Voltus / Innovus"
              />
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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>edit_power_via -add_redundant -nets {`{VDD VSS}`} -layers {`{M6 M7}`} -min_vias_per_connection {reqViaCuts}</code>
                <button
                  onClick={() => copyCommand(`edit_power_via -add_redundant -nets {VDD VSS} -layers {M6 M7} -min_vias_per_connection ${reqViaCuts}`, "pg_via")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_via" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="N_cuts = ⌈ I_intersection / I_via_EM_limit ⌉  |  N_cols = ⌈√N_cuts⌉  |  N_rows = ⌈N_cuts / N_cols⌉"
                variables="I_intersection = DC current entering stripe cross (mA), I_via_EM_limit = Foundry limit per single via contact."
                insight="Redundant multi-cut via arrays eliminate single-point contact failures and alleviate current crowding."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
            </div>

            {/* Calc 2.5: Well-Tap Placement Pitch */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  #10 Well-Tap Placement Pitch & Latchup Distance Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  add_well_taps
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Computes maximum well-tap insertion pitch and checkerboard offset to suppress parasitic PNPN latchup firing.
              </p>

              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Max Substrate Dist (µm):</span>
                  <input
                    type="number"
                    value={maxWellDistance}
                    onChange={(e) => setMaxWellDistance(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Calculated Tap Pitch:</span>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-400 font-bold">{tapPitch} µm</div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Est. Well-Tap Count:</span>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-400 font-bold">{totalWellTapsReq.toLocaleString()} Cells</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-amber-300">
                <code>add_well_taps -cell WELLTAP_X1 -checkerboard -max_distance {maxWellDistance}</code>
                <button
                  onClick={() => copyCommand(`add_well_taps -cell WELLTAP_X1 -checkerboard -max_distance ${maxWellDistance}`, "pg_tap")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pg_tap" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="Pitch_tap = 2 · D_max_latchup  |  R_well = R_sheet_well · (D_max / W_tap) < V_BE_on (0.7V) / I_sub_noise"
                variables="D_max_latchup = Foundry maximum tap-to-gate distance rule (25-30 µm), V_BE_on = Parasitic BJT turn-on threshold (0.7 V)."
                insight="Ties N-well to VDD and P-substrate to VSS, shunting substrate noise currents and preventing PNPN thyristor latchup."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
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
            <h2 className="text-lg font-bold text-white">Clock Tree Synthesis (CTS) & Clocking Calculators (11–14)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 3.1: Elmore Latency */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  #11 Elmore Clock Insertion Delay (Latency)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  set_ccopt_property
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates distributed RC propagation delay and slew degradation for clock distribution trunks.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <code>set_ccopt_property target_insertion_delay {(elmoreDelayPs / 1000).toFixed(3)}</code>
                <button
                  onClick={() => copyCommand(`set_ccopt_property target_insertion_delay ${(elmoreDelayPs / 1000).toFixed(3)}`, "cts_elmore")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "cts_elmore" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="T_Elmore = R_driver·(C_wire + C_sink) + 0.5·R_wire·C_wire + R_wire·C_sink"
                variables="R_driver = Clock driver resistance (Ω), R_wire = Unit resistance × Length, C_wire = Unit capacitance × Length, C_sink = Leaf load."
                insight="Cadence CCOpt balances distributed RC insertion delays across clock branches to minimize skew across all endpoints."
                edaTool="Cadence CCOpt / Synopsys CTS"
              />
            </div>

            {/* Calc 3.2: Clock Buffer Stages */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  #12 Optimal Clock Buffer Stages & Fanout Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  set_ccopt_property buffer_cells
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates optimal inverter tree buffer levels and per-stage fanout scale factors to achieve minimum propagation delay.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Root Clock Pin Cap (fF):</span>
                  <input
                    type="number"
                    value={clockRootInCap}
                    onChange={(e) => setClockRootInCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Total Leaf Load (fF):</span>
                  <input
                    type="number"
                    value={totalTreeLeafCap}
                    onChange={(e) => setTotalTreeLeafCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Optimal Buffer Levels</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{optBufferStages} Stages</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Optimal Stage Fanout (f)</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{optBufferFanout}x Fanout</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <code>set_ccopt_property buffer_cells {`{CLKBUF_X4 CLKBUF_X8 CLKBUF_X16}`} -max_fanout {Math.ceil(optBufferFanout)}</code>
                <button
                  onClick={() => copyCommand(`set_ccopt_property buffer_cells {CLKBUF_X4 CLKBUF_X8 CLKBUF_X16} -max_fanout ${Math.ceil(optBufferFanout)}`, "cts_stages")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "cts_stages" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="N_stages = ⌈ ln(C_load / C_in) / ln(e) ⌉  |  f_opt = (C_load / C_in)^(1/N) ≈ e (2.718 - 4.0)"
                variables="C_load = Total clock leaf capacitance (fF), C_in = Input root gate pin capacitance (fF), e = Euler's constant."
                insight="A per-stage step effort of e ≈ 2.7 - 4.0 mathematically minimizes the cumulative tree insertion latency."
                edaTool="Cadence CCOpt / Synopsys CTS"
              />
            </div>

            {/* Calc 3.3: Useful Skew Optimizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  #13 Intentional Useful Skew Optimizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  set_ccopt_property target_skew
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates maximum safe capture clock delay that recovers critical setup slack without causing downstream hold violations.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <code>set_ccopt_property -skew_group SG_CORE target_skew {(maxUsefulSkew / 1000).toFixed(3)}</code>
                <button
                  onClick={() => copyCommand(`set_ccopt_property -skew_group SG_CORE target_skew ${(maxUsefulSkew / 1000).toFixed(3)}`, "cts_skew")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "cts_skew" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="T_skew_safe = min( |Slack_setup|, max(0, Slack_hold_downstream - T_hold_margin) )"
                variables="Slack_setup = Setup violation on critical launch path, Slack_hold_downstream = Margin on capturing flop's forward path."
                insight="CCOpt useful skew scheduling borrows cycle time from non-critical downstream stages to resolve setup violations without adding area."
                edaTool="Cadence CCOpt Useful Skew"
              />
            </div>

            {/* Calc 3.4: Clock Power & ICG */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  #14 Integrated Clock Gating (ICG) Power Reduction Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  set_clock_gating_style
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Evaluates power savings achieved by inserting latch-based integrated clock gating (ICG) cells across flop registers.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Clock Sinks:</span>
                  <input
                    type="number"
                    value={clockSinks}
                    onChange={(e) => setClockSinks(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Gating Efficiency (0.4 - 0.9):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={clockGatingEff}
                    onChange={(e) => setClockGatingEff(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Ungated Clock Power</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">{unGatedClockPowerMw} mW</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Power Saved by ICG</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">-{savedClockPowerMw} mW</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <code>set_clock_gating_style -pos integrated -control_point before -min_bitwidth 4</code>
                <button
                  onClick={() => copyCommand(`set_clock_gating_style -pos integrated -control_point before -min_bitwidth 4`, "cts_icg")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "cts_icg" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="P_saved = N_flops · C_clk_pin · V_DD² · f_clk · η_gating - P_ICG_overhead"
                variables="N_flops = Gated register count, C_clk_pin = Flop clock input capacitance, η_gating = Duty cycle percentage when clock is disabled."
                insight="Gating latch-based clock drivers eliminates dynamic charging of unused register branches, slashing total clock network power by 40-70%."
                edaTool="Cadence Genus / Synopsys Design Compiler"
              />
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
            <h2 className="text-lg font-bold text-white">RTL & Logic Synthesis Calculators (15–24)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 4.1: Clock Period & Max Comb Budget */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #15 Clock Period & Max Comb Budget
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  create_clock
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Derives maximum allowed combinational logic delay by subtracting flip-flop T_cq, setup time, clock jitter, and margins from clock period.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>create_clock -name clk_core -period {(clockPeriodPs / 1000).toFixed(3)} [get_ports clk]</code>
                <button
                  onClick={() => copyCommand(`create_clock -name clk_core -period ${(clockPeriodPs / 1000).toFixed(3)} [get_ports clk]`, "syn_clk")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_clk" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="T_comb_max = T_clk - (T_cq + T_setup + T_uncertainty + T_margin)"
                variables="T_clk = 1000 / Frequency (ns), T_cq = Clock-to-Q delay, T_setup = Cell setup requirement, T_uncertainty = Clock jitter & CTS skew margin."
                insight="Dictates the maximum combinational path delay budget available for synthesis mapping and restructuring."
                edaTool="Cadence Genus / Synopsys Design Compiler"
              />
            </div>

            {/* Calc 4.2: Logic Depth & FO4 Estimator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #16 Logic Depth & Gate Level Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  FO4 Inverter Metric
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Estimates maximum allowable combinational gate levels based on process node Fanout-of-4 (FO4) delay metrics.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>set_max_delay -from [all_inputs] -to [all_registers] {maxCombBudgetPs / 1000}</code>
                <button
                  onClick={() => copyCommand(`set_max_delay -from [all_inputs] -to [all_registers] ${maxCombBudgetPs / 1000}`, "syn_fo4")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_fo4" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="N_levels_max = ⌊ T_comb_max / (Delay_FO4 · Stage_Effort) ⌋  |  Total_FO4 = T_comb_max / Delay_FO4"
                variables="Delay_FO4 = Fanout-of-4 inverter delay for target node (10-15 ps in FinFET), Stage_Effort = Average stage logical + electrical effort (1.5 - 2.5)."
                insight="If allowable gate levels < logic requirements, microarchitectures must add pipeline register stages."
                edaTool="Cadence Genus / Synopsys Design Compiler"
              />
            </div>

            {/* Calc 4.3: Setup Slack Signoff */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #17 Setup Slack Signoff (Max Delay)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_timing -delay_type max
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Derives setup timing slack from clock period, launch/capture clock network latencies, and combinational data path propagation.
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Launch Clk Lat (ps):</span>
                  <input
                    type="number"
                    value={launchClockDelay}
                    onChange={(e) => setLaunchClockDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Capture Clk Lat (ps):</span>
                  <input
                    type="number"
                    value={captureClockDelay}
                    onChange={(e) => setCaptureClockDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Comb Data Path (ps):</span>
                  <input
                    type="number"
                    value={combDataDelay}
                    onChange={(e) => setCombDataDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Required Arrival Time</div>
                  <div className="text-sm font-bold text-white mt-0.5">{requiredSetupTimePs} ps</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Setup Slack (WNS)</div>
                  <div className={`text-sm font-bold mt-0.5 ${calculatedSetupSlackPs >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {calculatedSetupSlackPs >= 0 ? `+${calculatedSetupSlackPs} ps (MET)` : `${calculatedSetupSlackPs} ps (VIOLATION)`}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>report_timing -delay_type max -path_type full_clock_expanded</code>
                <button
                  onClick={() => copyCommand(`report_timing -delay_type max -path_type full_clock_expanded`, "syn_setup")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_setup" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="Slack_setup = (T_clk + T_capture_clk - T_uncertainty - T_setup) - (T_launch_clk + T_comb_data)"
                variables="T_capture_clk - T_launch_clk = Clock skew, T_comb_data = Wire + gate delay across combinatorial cloud."
                insight="Positive setup slack guarantees data arrives and stabilizes before the next active capture clock edge."
                edaTool="Cadence Tempus / Synopsys PrimeTime"
              />
            </div>

            {/* Calc 4.4: Hold Slack Signoff */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #18 Hold Slack Signoff & Min Delay Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_timing -delay_type min
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Checks fast-corner min delay races to prevent newly launched data from corrupting existing state at the capture register.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Min Data Path Delay (ps):</span>
                  <input
                    type="number"
                    value={minCombDataDelay}
                    onChange={(e) => setMinCombDataDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Cell T_hold Time (ps):</span>
                  <input
                    type="number"
                    value={tholdDelay}
                    onChange={(e) => setTholdDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Required Hold Arrival</div>
                  <div className="text-sm font-bold text-white mt-0.5">{requiredHoldTimePs} ps</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Hold Slack (WNS)</div>
                  <div className={`text-sm font-bold mt-0.5 ${calculatedHoldSlackPs >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {calculatedHoldSlackPs >= 0 ? `+${calculatedHoldSlackPs} ps (MET)` : `${calculatedHoldSlackPs} ps (RACE FAIL)`}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>opt_design -hold -hold_target_slack 0.030</code>
                <button
                  onClick={() => copyCommand(`opt_design -hold -hold_target_slack 0.030`, "syn_hold")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_hold" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="Slack_hold = (T_launch_clk_min + T_comb_data_min) - (T_capture_clk_max + T_uncertainty + T_hold)"
                variables="T_launch_clk_min = Fast clock arrival, T_comb_data_min = Shortest datapath delay, T_hold = Flop library hold time."
                insight="Hold violations are frequency-independent; Innovus inserts delay buffer cells (CLKBUF_X1) to eliminate race conditions."
                edaTool="Cadence Innovus / Tempus"
              />
            </div>

            {/* Calc 4.5: Method of Logical Effort */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #19 Method of Logical Effort (LE) Path Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Logical Effort
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates optimal gate staging and sizing to drive high-capacitance loads with minimum path delay.
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">C_in (fF):</span>
                  <input
                    type="number"
                    value={cinCap}
                    onChange={(e) => setCinCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">C_load (fF):</span>
                  <input
                    type="number"
                    value={cloadCap}
                    onChange={(e) => setCloadCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Branching (B):</span>
                  <input
                    type="number"
                    value={pathBranching}
                    onChange={(e) => setPathBranching(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Total Effort (F)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{totalPathEffortF.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Optimal Stages (N)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{optStagesN} Stages</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Min Path Delay</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{minLePathDelayPs} ps</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>set_driving_cell -lib_cell INVX1 [all_inputs]; set_load {cloadCap / 1000} [all_outputs]</code>
                <button
                  onClick={() => copyCommand(`set_driving_cell -lib_cell INVX1 [all_inputs]; set_load ${cloadCap / 1000} [all_outputs]`, "syn_le")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_le" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="F = G·B·H  |  f_hat = F^(1/N)  |  D_min = N·F^(1/N) + ∑ p_i"
                variables="G = Total logical effort (∏ g_i), B = Branching effort (∏ b_i), H = Electrical gain (C_out / C_in), p_i = Parasitic delay."
                insight="Sutherland's Logical Effort proves delay is minimized when every stage bears equal effort f_hat ≈ 3.6 - 4.0."
                edaTool="Cadence Genus / Synopsys DC"
              />
            </div>

            {/* Calc 4.6: Pipelining Sizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #20 Pipelining Latency vs Throughput Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Pipelining
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Determines required register pipeline depth to meet target operating clock frequencies for complex computational datapaths.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Unpipelined Delay (ns):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={unpipelinedDelay}
                    onChange={(e) => setUnpipelinedDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Target Freq (MHz):</span>
                  <input
                    type="number"
                    value={synthTargetFreq}
                    onChange={(e) => setSynthTargetFreq(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Required Pipeline Stages</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{reqPipelineStages} Pipeline Registers</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Total Latency</div>
                  <div className="text-sm font-bold text-white mt-0.5">{(reqPipelineStages * (clockPeriodPs / 1000)).toFixed(2)} ns ({reqPipelineStages} cycles)</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>set_multicycle_path -setup {reqPipelineStages} -from [get_pins datapath_reg/CP]</code>
                <button
                  onClick={() => copyCommand(`set_multicycle_path -setup ${reqPipelineStages} -from [get_pins datapath_reg/CP]`, "syn_pipe")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_pipe" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="N_stages = ⌈ T_unpipelined / T_clk_eff ⌉  |  Throughput = f_clk · Words/cycle  |  Latency = N_stages · T_clk"
                variables="T_unpipelined = Total raw arithmetic combinational delay, T_clk_eff = T_clk - (T_cq + T_setup + T_unc)."
                insight="Splitting long datapath logic with pipeline registers scales maximum clock frequency at the expense of initial latency cycles."
                edaTool="Cadence Genus / Synopsys DC Retiming"
              />
            </div>

            {/* Calc 4.7: Gate Equivalent (GE) Converter */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #21 Gate Equivalent (GE) Converter
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_area -ge
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Converts physical synthesized cell area in square micrometers into standard industry NAND2 Gate Equivalents (kGE / MGE).
              </p>

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

              <FormulaCard
                formula="kGE = Area_silicon_µm² / (Area_NAND2_X1 · 1000)  |  MGE = kGE / 1000"
                variables="Area_silicon = Physical cell footprint (µm²), Area_NAND2_X1 = Standard 2-input NAND library cell area in process node."
                insight="Normalizes complexity metrics across process technologies (28nm to 3nm) regardless of physical cell layout pitch."
                edaTool="Cadence Genus / Synopsys DC"
              />
            </div>

            {/* Calc 4.8: Wireload Model RC */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #22 Wireload Model (WLM) RC Estimator
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  set_wire_load_model
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Estimates statistical pre-layout interconnect RC wire delay based on block gate count and net fanout degrees.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Block Gate Count:</span>
                  <input
                    type="number"
                    step="5000"
                    value={blockGateCount}
                    onChange={(e) => setBlockGateCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Net Fanout Degree:</span>
                  <input
                    type="number"
                    value={netFanout}
                    onChange={(e) => setNetFanout(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Estimated Wire Length</div>
                  <div className="text-sm font-bold text-white mt-0.5">{estWireLenUm} µm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Est. WLM Interconnect Delay</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{estWireDelayPs} ps</div>
                </div>
              </div>

              <FormulaCard
                formula="L_est = 12·(Gates/1000)^0.4 · (1 + 0.35·Fanout)  |  ΔT_wire = R_driver·C_wire + 0.5·R_wire·C_wire"
                variables="Gates = Synthesized module gate count, Fanout = Pin fanout degree, R_wire, C_wire = Statistical unit RC parameters."
                insight="Used during pre-layout synthesis (Genus/DC) before floorplanning coordinates exist; superseded by PLE in physical synthesis."
                edaTool="Cadence Genus / Synopsys Design Compiler"
              />
            </div>

            {/* Calc 4.9: ADP & EDP Product */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #23 Area-Delay (ADP) & Energy-Delay (EDP)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_qor
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates silicon efficiency figures of merit: Area-Delay Product (ADP) and Energy-Delay Product (EDP).
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Area (mm²):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={designAreaMm2}
                    onChange={(e) => setDesignAreaMm2(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Critical Delay (ns):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={criticalDelayNs}
                    onChange={(e) => setCriticalDelayNs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Power (mW):</span>
                  <input
                    type="number"
                    step="5"
                    value={activePowerMw}
                    onChange={(e) => setActivePowerMw(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Area-Delay Product (ADP)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{adpScore} mm²·ns</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Energy-Delay Product (EDP)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{edpScore} pJ·ns</div>
                </div>
              </div>

              <FormulaCard
                formula="ADP = Area · Delay_crit  |  EDP = Energy_op · Delay_crit = (P_total · T_clk) · Delay_crit"
                variables="Area = Total silicon cell area (mm²), Delay_crit = Worst critical path delay (ns), P_total = Active power dissipation (mW)."
                insight="Primary Quality of Results (QoR) optimization metric used to rank architectural trade-offs between speed, cost, and energy."
                edaTool="Cadence Genus / Synopsys Design Compiler"
              />
            </div>

            {/* Calc 4.10: Asynchronous FIFO Depth (CDC) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  #24 Asynchronous FIFO Depth (CDC Safe)
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  CDC Burst Sizing
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates safe power-of-2 dual-clock FIFO depth to guarantee zero data loss during multi-rate clock domain crossings.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <code>set_clock_groups -asynchronous -group {`{clk_wr}`} -group {`{clk_rd}`}</code>
                <button
                  onClick={() => copyCommand(`set_clock_groups -asynchronous -group {clk_wr} -group {clk_rd}`, "syn_fifo")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "syn_fifo" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="Depth_raw = Burst - ⌊ Burst · (f_rd / f_wr) ⌋  |  Depth_safe = 2^( ⌈log2(Depth_raw)⌉ )  |  Bits_Gray = log2(Depth_safe) + 1"
                variables="Burst = Maximum continuous incoming data burst words, f_wr = Write domain clock, f_rd = Read domain clock."
                insight="Gray code pointers cross asynchronous clock boundaries through 2-flop synchronizers to prevent multi-bit CDC metastability."
                edaTool="Cadence Conformal CDC / Synopsys SpyGlass"
              />
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
            <h2 className="text-lg font-bold text-white">Signal Integrity (SI) & Process Antenna Calculators (25–29)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 5.1: Process Antenna Sizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  #25 Process Antenna Ratio (PAR) & Diode Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  insert_antenna_diode
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Evaluates plasma charge accumulation ratios on metal layers and sizes reverse-biased antenna diodes.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-purple-300">
                <code>insert_antenna_diode -cell ANTENNA_X1 -nets [get_db nets -if {`{.antenna_ratio > ${antennaLimit}}`}]</code>
                <button
                  onClick={() => copyCommand(`insert_antenna_diode -cell ANTENNA_X1 -nets [get_db nets -if {.antenna_ratio > ${antennaLimit}}]`, "si_antenna")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "si_antenna" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="PAR = (∑ A_metal) / A_gate_oxide  |  A_diode_req = (A_metal - Limit·A_gate) / J_discharge_limit"
                variables="A_metal = Exposed metal interconnect area during plasma etching, A_gate = Connected thin gate oxide area, Limit = Foundry design rule threshold (e.g. 400:1)."
                insight="Plasma charge accumulation during reactive ion etching causes dielectric gate oxide breakdown unless discharged by reverse-biased PN diodes."
                edaTool="Cadence Innovus / Synopsys IC Compiler II"
              />
            </div>

            {/* Calc 5.2: Miller Coupling Delta Delay */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  #26 Miller Coupling Factor & Delta Delay
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  set_si_delay_mode
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Models dynamic Miller capacitance multiplication when adjacent parallel wires switch in opposite directions simultaneously.
              </p>

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

              <div className="grid grid-cols-2 gap-3 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Effective Out-of-Phase Cap</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{effCapOutOfPhase} fF (2x Cc)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Induced Delta Delay Slowdown</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">+{deltaDelaySlowdownPs} ps</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-purple-300">
                <code>set_si_delay_calculation_mode -crosstalk_noise -miller_effect</code>
                <button
                  onClick={() => copyCommand(`set_si_delay_calculation_mode -crosstalk_noise -miller_effect`, "si_miller")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "si_miller" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="C_eff = C_gnd + (1 - M_C)·C_coupling  |  M_C = -1 (Opposite Switch ⇒ C_eff = C_gnd + 2·C_c)  |  ΔDelay = R_driver·2·C_c"
                variables="C_coupling = Sidewall coupling capacitance between nets, C_gnd = Wire area capacitance to ground, M_C = Switching direction factor (-1 to +1)."
                insight="Opposite-direction transitions double effective coupling capacitance (2·Cc), creating major setup timing violations."
                edaTool="Cadence Tempus SI / Synopsys PrimeTime SI"
              />
            </div>

            {/* Calc 5.3: Crosstalk Glitch Peak */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  #27 Crosstalk Glitch Peak Voltage Noise
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_noise
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates capacitively coupled glitch peak voltage amplitude and verifies receiver noise margins.
              </p>

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
                  <span className="text-slate-400 block mb-1">Aggressor Slew (ps):</span>
                  <input
                    type="number"
                    value={aggressorSlew}
                    onChange={(e) => setAggressorSlew(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-purple-300">
                <code>report_noise -violators -above 0.20 -out_file noise_signoff.rpt</code>
                <button
                  onClick={() => copyCommand(`report_noise -violators -above 0.20 -out_file noise_signoff.rpt`, "si_noise")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "si_noise" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="V_glitch_peak = V_DD · (C_c / (C_c + C_gnd)) · ( R_victim / (R_victim + t_aggressor_slew / C_c) )"
                variables="C_c = Coupling capacitance, C_gnd = Victim ground capacitance, R_victim = Holding resistance of quiet victim driver, t_slew = Aggressor switching edge."
                insight="If glitch voltage exceeds receiver noise margin (V_IL / V_IH), false logic switching or clock double-triggering occurs."
                edaTool="Cadence Tempus SI / Synopsys PrimeTime SI"
              />
            </div>

            {/* Calc 5.4: Slew Degradation & Transition Sizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  #28 Slew Degradation & Transition Time Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_constraint -drv
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates output slew degradation across high-resistance interconnect wires and validates maximum transition design rules.
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Input Slew (ps):</span>
                  <input
                    type="number"
                    value={inputSlewPs}
                    onChange={(e) => setInputSlewPs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Interconnect R (Ω):</span>
                  <input
                    type="number"
                    value={interconnectR}
                    onChange={(e) => setInterconnectR(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Fanout Cap (fF):</span>
                  <input
                    type="number"
                    value={fanoutC}
                    onChange={(e) => setFanoutC(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Total Output Slew</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{totalSlewOutPs} ps</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Max Slew Limit (10% T_clk)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{Math.round(clockPeriodPs * 0.1)} ps (DRV Limit)</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-purple-300">
                <code>report_constraint -all_violators -drv -max_transition</code>
                <button
                  onClick={() => copyCommand(`report_constraint -all_violators -drv -max_transition`, "si_slew")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "si_slew" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="t_slew_out = √( t_slew_in² + (2.2 · R_net · C_load)² )  |  t_trans_limit ≈ 0.10 · T_clk"
                variables="t_slew_in = Driver intrinsic input transition, R_net = Distributed wire resistance, C_load = Total fanout capacitance."
                insight="Degraded slew transitions significantly increase receiver internal cell delays and amplify susceptibility to crosstalk glitch noise."
                edaTool="Cadence Innovus / Synopsys ICC2"
              />
            </div>

            {/* Calc 5.5: Decoupling Radius */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  #29 Decoupling Radius & High-Frequency Noise Localization
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_decap
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates maximum physical distance decoupling capacitors can be placed from switching cells to supply high-frequency transient current.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Switching Rise Time (ps):</span>
                  <input
                    type="number"
                    value={switchRiseTimePs}
                    onChange={(e) => setSwitchRiseTimePs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">EM Wave Speed (µm/ps):</span>
                  <input
                    type="number"
                    value={pdnPropVelocity}
                    onChange={(e) => setPdnPropVelocity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Max Effective Decap Radius</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{maxDecapRadiusUm} µm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Effective Decap Zone</div>
                  <div className="text-sm font-bold text-white mt-0.5">±{maxDecapRadiusUm} µm Circular Radius</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-purple-300">
                <code>report_decap -radius {maxDecapRadiusUm} -net VDD -out_file decap_radius.rpt</code>
                <button
                  onClick={() => copyCommand(`report_decap -radius ${maxDecapRadiusUm} -net VDD -out_file decap_radius.rpt`, "si_radius")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "si_radius" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="r_decap_max ≤ (t_switch_rise / 2) · v_propagation  |  v_prop = 1 / √(L_mesh · C_mesh)"
                variables="t_switch_rise = Current transition edge time (ps), v_propagation = Signal wave propagation speed across silicon dielectric (~150 µm/ps)."
                insight="Decaps placed beyond the effective radius cannot deliver charge during the rapid switching window due to finite speed-of-light grid propagation."
                edaTool="Cadence Voltus / Synopsys RedHawk"
              />
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
            <h2 className="text-lg font-bold text-white">Power Integrity, Dynamic IR Drop & EM Calculators (30–34)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calc 6.1: Dynamic L*di/dt Drop */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  #30 Dynamic L·di/dt Transient Rail Drop
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  analyze_rail -dynamic
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Models simultaneous switching current slew (di/dt) and package inductance to calculate peak dynamic voltage dips.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-orange-300">
                <code>set_rail_analysis_mode -method dynamic -accuracy hd -voltage_threshold 0.040</code>
                <button
                  onClick={() => copyCommand(`set_rail_analysis_mode -method dynamic -accuracy hd -voltage_threshold 0.040`, "pi_dyn")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pi_dyn" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="ΔV_dynamic = ΔV_inductive + ΔV_resistive = L_pkg · (di/dt) + I_peak · R_mesh"
                variables="L_pkg = Package + C4 bump parasitic inductance (nH), di/dt = Simultaneous switching current slew rate, R_mesh = On-die grid resistance."
                insight="Voltus dynamic analysis models package L and die mesh R to catch transient ground bounce and supply sags during clock edges."
                edaTool="Cadence Voltus-DP / Ansys RedHawk-SC"
              />
            </div>

            {/* Calc 6.2: Decap Sizing */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  #31 Decoupling Capacitor (Decap) Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  add_decaps
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates required on-die charge storage capacitance to dampen localized dynamic switching spikes.
              </p>

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

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-orange-300">
                <code>add_decaps -cells {`{DECAP_X32_THICK_OD}`} -density 0.12 -target_ir_drop {(allowableDynamicDrop / 1000).toFixed(3)}</code>
                <button
                  onClick={() => copyCommand(`add_decaps -cells {DECAP_X32_THICK_OD} -density 0.12 -target_ir_drop ${(allowableDynamicDrop / 1000).toFixed(3)}`, "pi_decap")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pi_decap" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="Q_req = I_surge · Δt_window  |  C_decap_req = Q_req / ΔV_allowed  |  N_cells = ⌈ C_decap / C_unit_cell ⌉"
                variables="I_surge = Peak transient switching current (A), Δt_window = Switching pulse width (ps), ΔV_allowed = Maximum tolerable dynamic voltage ripple (mV)."
                insight="Decap cells act as local charge reservoirs during clock edges, replenishing charge faster than package inductors can respond."
                edaTool="Cadence Innovus / Voltus"
              />
            </div>

            {/* Calc 6.3: MTCMOS Power Switch Sizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  #32 MTCMOS Sleep Transistor & Inrush Current Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  add_power_switch
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sizes power gating header/footer sleep transistors and calculates peak inrush charging current during wake-up transitions.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Virtual Rail Cap (nF):</span>
                  <input
                    type="number"
                    value={virtualRailCap}
                    onChange={(e) => setVirtualRailCap(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Target Wakeup Time (ns):</span>
                  <input
                    type="number"
                    value={targetWakeupTime}
                    onChange={(e) => setTargetWakeupTime(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-orange-950/30 border border-orange-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Peak Inrush Current</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">{peakInrushCurrentA} A</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Required Daisy-Chain Stages</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{reqDaisyStages} Buffer Stages</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-orange-300">
                <code>add_power_switch -power_domain PD_SLEEP -global_power VDD -local_power VDD_SW -cells {`{HEADSWITCH_X16}`} -daisy_chain</code>
                <button
                  onClick={() => copyCommand(`add_power_switch -power_domain PD_SLEEP -global_power VDD -local_power VDD_SW -cells {HEADSWITCH_X16} -daisy_chain`, "pi_switch")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pi_switch" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="I_inrush_peak = (C_virtual_rail · V_DD) / t_wakeup  |  N_daisy_stages = ⌈ I_inrush_peak / I_stage_limit ⌉"
                variables="C_virtual_rail = Capacitance of gated power domain rail (nF), t_wakeup = Allowed power-on sequence time (ns), I_stage_limit = Max inrush step per stage."
                insight="Staggered daisy-chain sleep transistor activation prevents inrush current from collapsing the supply rail of adjacent active power domains."
                edaTool="Cadence Innovus / Voltus"
              />
            </div>

            {/* Calc 6.4: Electromigration Black's MTTF */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  #33 Electromigration (EM) Black's Equation & MTTF
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  report_em
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calculates Mean Time to Failure (MTTF) and checks wire current densities against foundry electromigration limits.
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">RMS Current (mA):</span>
                  <input
                    type="number"
                    step="0.2"
                    value={emRmsCurrent}
                    onChange={(e) => setEmRmsCurrent(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Wire Width (µm):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={emWireWidth}
                    onChange={(e) => setEmWireWidth(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Junction Temp (°C):</span>
                  <input
                    type="number"
                    value={junctionTemp}
                    onChange={(e) => setJunctionTemp(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-orange-950/30 border border-orange-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Current Density (J)</div>
                  <div className={`text-sm font-bold mt-0.5 ${isEmViolated ? "text-rose-400" : "text-emerald-400"}`}>
                    {actualEmCurrentDensity} mA/µm² {isEmViolated ? "(EM FAIL)" : "(SAFE)"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Estimated MTTF</div>
                  <div className="text-sm font-bold text-white mt-0.5">{emMttfYears} Years</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-orange-300">
                <code>report_em -limit 1.0 -method rms_and_peak -out_file em_signoff.rpt</code>
                <button
                  onClick={() => copyCommand(`report_em -limit 1.0 -method rms_and_peak -out_file em_signoff.rpt`, "pi_em")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pi_em" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="MTTF = (A / J^n) · exp( E_a / (k_B · T_j) )  |  J_actual = I_rms / (W_wire · t_metal) ≤ J_EM_limit"
                variables="J = Current density (mA/µm²), E_a = Activation energy (~0.85 eV for Cu), k_B = Boltzmann constant, T_j = Junction temperature (K)."
                insight="High current densities drive atomic momentum transfer, causing open voids or short-circuit extrusion whiskers."
                edaTool="Cadence Voltus-EM / Synopsys RedHawk"
              />
            </div>

            {/* Calc 6.5: Target Impedance Z_target Sizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  #34 Target Impedance (Z_target) PDN Sizer
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  analyze_power_grid
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Applies Larry Smith's Target Impedance model to calculate the maximum permissible PDN impedance across all operating frequencies.
              </p>

              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
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
                  <span className="text-slate-400 block mb-1">Max Ripple Allowed (% VDD):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={pdnMaxRipplePct}
                    onChange={(e) => setPdnMaxRipplePct(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Max Step Current (A):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={transientStepCurrent}
                    onChange={(e) => setTransientStepCurrent(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-orange-950/30 border border-orange-500/30 p-3.5 rounded-xl font-mono text-xs text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Allowed Voltage Ripple</div>
                  <div className="text-sm font-bold text-white mt-0.5">{maxPdnVoltageRippleMv.toFixed(1)} mV</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Target PDN Impedance (Z_target)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{zTargetMilliOhms} mΩ (Milliohms)</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-[11px] text-orange-300">
                <code>analyze_power_grid -target_impedance {zTargetMilliOhms / 1000} -frequency_range {`{1e6 10e9}`}</code>
                <button
                  onClick={() => copyCommand(`analyze_power_grid -target_impedance ${zTargetMilliOhms / 1000} -frequency_range {1e6 10e9}`, "pi_ztarget")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  {copiedCmd === "pi_ztarget" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <FormulaCard
                formula="Z_target = (V_DD · Ripple_pct) / (I_transient_max · 0.5)  |  Z_PDN(f) ≤ Z_target  ∀ f ∈ [DC, f_knee]"
                variables="V_DD = Supply voltage (V), Ripple_pct = Max allowed transient voltage variation (e.g. 3%), I_transient_max = Maximum step current."
                insight="Larry Smith's PDN Target Impedance method ensures power distribution impedance stays flat from DC to GHz frequencies, suppressing resonance peaks."
                edaTool="Cadence Voltus / Ansys RedHawk PDN"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
