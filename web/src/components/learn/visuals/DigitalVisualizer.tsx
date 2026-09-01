"use client";

import React from "react";
import { NumberSystemVisualizer } from "./NumberSystemVisualizer";
import { LogicGateVisualizer } from "./LogicGateVisualizer";
import { SequentialTimingVisualizer } from "./SequentialTimingVisualizer";
import { FsmVisualizer } from "./FsmVisualizer";
import { TimingSlackVisualizer } from "./TimingSlackVisualizer";
import { CdcFifoVisualizer } from "./CdcFifoVisualizer";
import { HazardGlitchVisualizer } from "./HazardGlitchVisualizer";
import { ClockGatingVisualizer } from "./ClockGatingVisualizer";
import { ScanDftVisualizer } from "./ScanDftVisualizer";
import { MultiplierVisualizer } from "./MultiplierVisualizer";
import { VerilogVisualizer } from "./VerilogVisualizer";
import { UpfMultiDomainVisualizer } from "./UpfMultiDomainVisualizer";
import { SvVisualizer } from "./SvVisualizer";
import { HdlRtlVisualizer } from "./HdlRtlVisualizer";
import { TechnologyMappingVisualizer } from "./synthesis/TechnologyMappingVisualizer";
import { LibertyFormatVisualizer } from "./synthesis/LibertyFormatVisualizer";
import { SdcConstraintsVisualizer } from "./synthesis/SdcConstraintsVisualizer";
import { QorReportVisualizer } from "./synthesis/QorReportVisualizer";
import { BoundaryOptimizationVisualizer } from "./synthesis/BoundaryOptimizationVisualizer";
import { ResourceSharingVisualizer } from "./synthesis/ResourceSharingVisualizer";
import { BooleanOptimizationVisualizer } from "./synthesis/BooleanOptimizationVisualizer";
import { SequentialRetimingVisualizer } from "./synthesis/SequentialRetimingVisualizer";
import { MultiVthVisualizer } from "./synthesis/MultiVthVisualizer";
import { PhysicalSynthesisVisualizer } from "./synthesis/PhysicalSynthesisVisualizer";
import { LecFormalityVisualizer } from "./synthesis/LecFormalityVisualizer";
import { EcoSpareCellVisualizer } from "./synthesis/EcoSpareCellVisualizer";
import { MasterSynthesisToolScriptsVisualizer } from "./synthesis/MasterSynthesisToolScriptsVisualizer";
import { SdcClockWaveformVisualizer } from "./constraints/SdcClockWaveformVisualizer";
import { SdcIoBudgetVisualizer } from "./constraints/SdcIoBudgetVisualizer";
import { SdcMulticycleVisualizer } from "./constraints/SdcMulticycleVisualizer";
import { SdcClockGroupsVisualizer } from "./constraints/SdcClockGroupsVisualizer";
import { SdcDdrInterfaceVisualizer } from "./constraints/SdcDdrInterfaceVisualizer";
import { MmmcMatrixVisualizer } from "./constraints/MmmcMatrixVisualizer";
import { MmmcInteractiveStudioVisualizer } from "./constraints/MmmcInteractiveStudioVisualizer";
import { OcvDerateVisualizer } from "./constraints/OcvDerateVisualizer";
import { PdkFormatsModelingVisualizer } from "./formats/PdkFormatsModelingVisualizer";
import { StaTimingPathVisualizer } from "./timing/StaTimingPathVisualizer";
import { StaCrosstalkSiVisualizer } from "./timing/StaCrosstalkSiVisualizer";
import { CdcMetastabilityVisualizer } from "./cdc/CdcMetastabilityVisualizer";
import { CdcPulseToggleVisualizer } from "./cdc/CdcPulseToggleVisualizer";
import { CdcAsyncFifoStudioVisualizer } from "./cdc/CdcAsyncFifoStudioVisualizer";
import { RdcResetSynchronizerVisualizer } from "./cdc/RdcResetSynchronizerVisualizer";
import { UpfPstStudioVisualizer } from "./formats/UpfPstStudioVisualizer";
import { CoverageStudioVisualizer } from "./verification/CoverageStudioVisualizer";
import { UvmArchitectureVisualizer } from "./verification/UvmArchitectureVisualizer";
import { TestbenchEvolutionStudioVisualizer } from "./verification/TestbenchEvolutionStudioVisualizer";
import { EdaScriptingStudioVisualizer } from "./scripting/EdaScriptingStudioVisualizer";
import { VendorMethodsChart } from "./VendorMethodsChart";
import { CadenceCommandStudio } from "./CadenceCommandStudio";
import { SynthesisInteractiveLab } from "./SynthesisInteractiveLab";
import { InnovusInteractiveLab } from "./InnovusInteractiveLab";
import { VoltusInteractiveLab } from "./VoltusInteractiveLab";
import { TempusInteractiveLab } from "./TempusInteractiveLab";
import { ConformalInteractiveLab } from "./ConformalInteractiveLab";
import { VlsiCalculatorHub } from "./calculators/VlsiCalculatorHub";
import { LangTryLab } from "@/components/learn/LangTryLab";
import { GvimSandbox } from "@/components/learn/GvimSandbox";

export function DigitalVisualizer({ slug }: { slug: string }) {
  switch (slug) {
    case "digital-intro":
      return <NumberSystemVisualizer />;
    case "digital-combo":
    case "digital-beginner-practical":
      return <LogicGateVisualizer />;
    case "digital-standard-arithmetic":
    case "digital-expert-datapath":
      return <LogicGateVisualizer initialGate="FULL_ADDER" />;
    case "digital-expert-multipliers":
      return <MultiplierVisualizer />;
    case "digital-seq":
    case "digital-master-clocking":
      return <SequentialTimingVisualizer />;
    case "digital-expert-metastability":
      return <CdcMetastabilityVisualizer />;
    case "digital-fsm-basics":
    case "digital-standard-fsm":
    case "digital-standard-practical":
      return <FsmVisualizer />;
    case "digital-standard-timing":
    case "digital-expert-timing":
      return <StaTimingPathVisualizer />;
    case "digital-expert-fifo":
      return <CdcAsyncFifoStudioVisualizer />;
    case "digital-master-cdc":
      return <CdcPulseToggleVisualizer />;
    case "digital-expert-hazards":
      return <HazardGlitchVisualizer />;
    case "digital-expert-clock-gating":
      return <ClockGatingVisualizer />;
    case "digital-master-lowpower":
      return <UpfMultiDomainVisualizer />;
    case "digital-master-dft":
      return <ScanDftVisualizer />;

    // Verilog track
    case "verilog-theory":
    case "verilog-combo-seq":
      return <VerilogVisualizer initialTab="module_syntax" />;
    case "verilog-mux-practical":
      return <LogicGateVisualizer initialGate="MUX4" />;
    case "verilog-dff-practical":
      return <SequentialTimingVisualizer />;
    case "verilog-counter-practical":
      return <HdlRtlVisualizer initialTab="counter" />;
    case "verilog-standard-generate":
    case "verilog-standard-practical":
      return <HdlRtlVisualizer initialTab="generate" />;
    case "verilog-standard-signed":
      return <VerilogVisualizer initialTab="signed_arith" />;
    case "verilog-standard-sram":
      return <HdlRtlVisualizer initialTab="sram" />;
    case "verilog-expert-event-queue":
      return <VerilogVisualizer initialTab="event_queue" />;
    case "verilog-expert-sim-synth":
      return <VerilogVisualizer initialTab="event_queue" />;
    case "verilog-master-lint":
      return <VerilogVisualizer initialTab="lint_diagnostics" />;
    case "verilog-master-rmm":
      return <VendorMethodsChart domain="synth" />;
    case "verilog-expert-resource-sharing":
      return <HdlRtlVisualizer initialTab="resource_sharing" />;
    case "verilog-expert-practical":
      return <HdlRtlVisualizer initialTab="resource_sharing" />;
    case "verilog-master-lowpower":
      return <ClockGatingVisualizer />;
    case "verilog-master-practical":
      return <HdlRtlVisualizer initialTab="handshake" />;

    case "sv-intro":
      return <VerilogVisualizer initialTab="module_syntax" />;
    case "sv-ff-practical":
      return <SequentialTimingVisualizer />;
    case "sv-sva":
    case "sv-expert-sva-basics":
    case "sv-expert-sva-operators":
    case "sv-expert-practical":
      return <SvVisualizer initialTab="SVA_TIMING" />;
    case "sv-standard-types":
    case "sv-standard-packages":
    case "sv-standard-practical":
      return <SvVisualizer initialTab="PACKED_TYPES" />;
    case "sv-standard-fsm":
      return <FsmVisualizer />;
    case "sv-standard-interfaces":
    case "sv-expert-oop":
    case "sv-master-uvm-arch":
    case "sv-master-uvm-tlm":
    case "sv-master-practical":
      return <SvVisualizer initialTab="UVM_HIERARCHY" />;
    case "sv-expert-dyn-mem":
    case "sv-master-crv":
    case "sv-master-coverage":
      return <SvVisualizer initialTab="CRV" />;

    // RTL Synthesis track (Dedicated visualizer per lesson)
    case "synth-intro":
    case "synth-beginner-practical":
      return <TechnologyMappingVisualizer />;
    case "synth-gtech-lib":
      return <PdkFormatsModelingVisualizer />;
    case "synth-standard-sdc-flow":
      return <SdcConstraintsVisualizer />;
    case "synth-standard-qor":
      return <QorReportVisualizer />;
    case "synth-standard-hierarchy":
      return <BoundaryOptimizationVisualizer />;
    case "synth-standard-operators":
    case "synth-standard-practical":
      return <ResourceSharingVisualizer />;
    case "synth-expert-boolean-opt":
      return <BooleanOptimizationVisualizer />;
    case "synth-expert-retiming":
    case "synth-expert-practical":
      return <SequentialRetimingVisualizer />;
    case "synth-expert-clockgating-insert":
      return <ClockGatingVisualizer />;
    case "synth-expert-dft-insertion":
      return <ScanDftVisualizer />;
    case "synth-master-multivth":
      return <MultiVthVisualizer />;
    case "synth-master-phys-synth":
      return <PhysicalSynthesisVisualizer />;
    case "synth-master-lec-formality":
      return (
        <>
          <VendorMethodsChart domain="synth" />
          <LecFormalityVisualizer />
        </>
      );
    case "synth-master-eco":
      return <EcoSpareCellVisualizer />;

    // SDC & MMMC Constraints Tracks (Dedicated visualizer per lesson)
    case "sdc-clocks-theory":
    case "sdc-virtual-clocks":
    case "sdc-beginner-practical":
      return <SdcClockWaveformVisualizer />;
    case "sdc-io-delays":
    case "sdc-io-practical":
      return <SdcIoBudgetVisualizer />;
    case "sdc-standard-drc":
      return <SdcConstraintsVisualizer />;
    case "sdc-standard-exceptions":
    case "sdc-exceptions-practical":
      return <SdcMulticycleVisualizer />;
    case "sdc-standard-clock-groups":
    case "sdc-standard-practical":
      return <SdcClockGroupsVisualizer />;
    case "sdc-expert-source-sync":
    case "sdc-expert-practical":
      return <SdcDdrInterfaceVisualizer />;
    case "sdc-expert-case-analysis":
    case "sdc-expert-clock-latency-cts":
      return <SdcClockWaveformVisualizer />;
    case "sdc-master-mmmc-matrix":
      return <MmmcMatrixVisualizer />;
    case "sdc-master-sdc-lint":
    case "sdc-master-budgeting":
    case "sdc-master-practical":
      return <VendorMethodsChart domain="sdc" />;

    // MMMC Dedicated Track Routing
    case "mmmc-theory":
    case "mmmc-beginner":
    case "mmmc-practical":
      return <MmmcMatrixVisualizer />;
    case "mmmc-standard-rc-corners":
    case "mmmc-standard-temp-inversion":
    case "mmmc-standard-practical":
      return <LibertyFormatVisualizer />;
    case "mmmc-expert-ocv-derates":
    case "mmmc-expert-cppr-crpr":
    case "mmmc-expert-scan-modes":
    case "mmmc-expert-practical":
      return <OcvDerateVisualizer />;
    case "mmmc-master-view-matrix":
    case "mmmc-master-leakage-corners":
    case "mmmc-master-signoff":
    case "mmmc-master-practical":
      return <MmmcInteractiveStudioVisualizer />;

    // PDK & EDA Formats Track Routing
    case "pdk-beginner-formats":
    case "pdk-standard-lib-models":
    case "pdk-standard-lef-rules":
    case "pdk-standard-practical":
    case "pdk-expert-parasitics":
    case "pdk-expert-ccs-power-noise":
    case "pdk-expert-practical":
    case "pdk-master-signoff":
    case "pdk-master-practical":
    case "xml-expert-rdl":
    case "xml-expert-practical":
    case "xml-master-waveforms":
    case "xml-master-practical":
    case "xml-standard-practical":
      return <PdkFormatsModelingVisualizer />;

    // STA Dedicated Track Routing
    case "sta-setup-hold-theory":
    case "sta-beginner-setup-hold":
    case "sta-report-practical":
      return <StaTimingPathVisualizer />;
    case "sta-standard-crosstalk-si":
    case "sta-standard-path-groups":
    case "sta-standard-practical":
      return <StaCrosstalkSiVisualizer />;
    case "sta-expert-ocv":
    case "sta-expert-useful-skew":
    case "sta-expert-practical":
      return <OcvDerateVisualizer />;
    case "sta-master-signoff":
    case "sta-master-eco":
    case "sta-master-practical":
      return <VendorMethodsChart domain="sta" />;

    // CDC Dedicated Track Routing
    case "cdc-beginner":
    case "cdc-practical":
    case "cdc-sync-practical":
      return <CdcMetastabilityVisualizer />;
    case "cdc-standard-pulse-sync":
    case "cdc-standard-handshake":
    case "cdc-standard-practical":
      return <CdcPulseToggleVisualizer />;
    case "cdc-expert-fifo":
    case "cdc-expert-practical":
      return <CdcAsyncFifoStudioVisualizer />;
    case "cdc-expert-rdc":
    case "cdc-master-lint-signoff":
    case "cdc-master-review":
    case "cdc-master-practical":
      return <RdcResetSynchronizerVisualizer />;

    // UPF / Power Formats Dedicated Track Routing
    case "upf-theory":
    case "upf-beginner":
    case "upf-practical":
    case "upf-beginner-practical":
      return <UpfMultiDomainVisualizer />;
    case "upf-standard-isolation":
    case "upf-standard-level-shifter":
    case "upf-standard-retention":
    case "upf-standard-practical":
      return <UpfMultiDomainVisualizer />;
    case "upf-expert-pst":
    case "upf-expert-pmu-sequencing":
    case "upf-expert-clp":
    case "upf-expert-practical":
      return <UpfPstStudioVisualizer />;
    case "upf-master-signoff":
    case "upf-master-dynamic-power":
    case "upf-master-pa-gls":
    case "upf-master-practical":
      return <VendorMethodsChart domain="upf" />;

    // Verification Track Routing
    case "verif-intro":
    case "verif-beginner":
    case "verif-beginner-tb-evolution":
    case "verif-beginner-scheduler":
    case "verif-beginner-practical":
      return <TestbenchEvolutionStudioVisualizer />;
    case "verif-standard-crv":
    case "verif-standard-coverage":
    case "verif-standard-code-coverage":
    case "verif-standard-practical":
    case "verif-expert-interfaces":
    case "verif-expert-assertions":
    case "verif-expert-cov":
    case "verif-expert-vplan":
    case "verif-expert-practical":
    case "verif-master-close":
    case "verif-master-formal":
    case "verif-master-post-silicon":
    case "verif-master-practical":
      return <CoverageStudioVisualizer />;

    // UVM Track Routing
    case "uvm-intro":
    case "uvm-beginner":
    case "uvm-beginner-practical":
    case "uvm-standard-phases":
    case "uvm-standard-tlm":
    case "uvm-standard-practical":
    case "uvm-expert-sequences":
    case "uvm-expert-ral":
    case "uvm-expert-practical":
    case "uvm-master-scale":
    case "uvm-master-vip":
    case "uvm-master-practical":
      return <UvmArchitectureVisualizer />;

    case "tcl-theory":
    case "tcl-beginner":
    case "tcl-beginner-practical":
    case "tcl-foreach-practical":
    case "tcl-file-practical":
      return <LangTryLab lang="tcl" />;
    case "tcl-standard-collections":
    case "tcl-standard-practical":
    case "tcl-expert-upvar":
    case "tcl-expert-practical":
      return <EdaScriptingStudioVisualizer slug={slug} />;
    case "tcl-master-flow":
    case "tcl-master-practical":
      return <VendorMethodsChart domain="tcl" />;
    case "shell-theory":
    case "shell-beginner":
    case "shell-beginner-practical":
    case "shell-grep-practical":
    case "shell-find-practical":
      return <LangTryLab lang="bash" />;
    case "shell-standard-parsing":
    case "shell-standard-practical":
    case "shell-expert-safe":
    case "shell-expert-practical":
      return <LangTryLab lang="bash" />;
    case "shell-master-farm":
    case "shell-master-practical":
      return <EdaScriptingStudioVisualizer slug={slug} />;
    case "python-theory":
    case "python-beginner":
    case "python-beginner-practical":
    case "python-re-practical":
    case "python-glob-practical":
    case "python-standard-regex":
    case "python-standard-practical":
      return <LangTryLab lang="python" />;
    case "python-expert-pandas":
    case "python-expert-practical":
    case "python-master-pipeline":
    case "python-master-practical":
      return <LangTryLab lang="python" />;
    case "perl-theory":
    case "perl-beginner":
    case "perl-beginner-practical":
    case "perl-slack-practical":
    case "perl-hash-practical":
    case "perl-standard-harvest":
    case "perl-standard-practical":
    case "perl-expert-mod":
    case "perl-expert-practical":
    case "perl-master-legacy":
    case "perl-master-practical":
      return <LangTryLab lang="perl" />;
    case "gvim-theory":
    case "gvim-beginner":
    case "gvim-beginner-practical":
    case "gvim-sub-practical":
    case "gvim-global-practical":
    case "gvim-standard-columns":
    case "gvim-standard-practical":
    case "gvim-expert-macro":
    case "gvim-expert-practical":
    case "gvim-master-vimrc":
    case "gvim-master-practical":
      return <GvimSandbox />;
    case "xml-theory":
    case "xml-beginner":
    case "xml-beginner-practical":
    case "xml-report-practical":
    case "xml-standard-ipxact":
      return <LangTryLab lang="xml" />;
    case "synth-master-practical":
      return (
        <>
          <VendorMethodsChart domain="synth" />
          <MasterSynthesisToolScriptsVisualizer />
        </>
      );

    case "genus-practical-lab":
    case "cadence-intro":
    case "cadence-beginner-practical":
      return <SynthesisInteractiveLab slug={slug} />;

    case "innovus-practical-lab":
    case "innovus-floorplan-pdn":
    case "innovus-placement-cts-route":
    case "innovus-inputs-floorplan-pdn":
    case "innovus-placement-congestion":
    case "innovus-ccopt-cts":
    case "innovus-nanoroute-si":
    case "innovus-timing-closure-eco":
    case "innovus-physical-verification-dfm":
    case "cadence-standard-pnr":
    case "cadence-standard-practical":
      return <InnovusInteractiveLab slug={slug} />;

    case "voltus-practical-lab":
    case "voltus-pgv-modeling":
    case "voltus-static-ir-pdn":
    case "voltus-dynamic-ir-noise":
    case "voltus-em-signoff":
    case "voltus-power-gating-upf":
    case "voltus-decap-power-recovery":
    case "voltus-dynamic-rail-em":
    case "cadence-standard-power":
    case "cadence-power":
      return <VoltusInteractiveLab slug={slug} />;

    case "tempus-practical-lab":
    case "tempus-mmmc-parasitics":
    case "tempus-setup-hold-closure":
    case "tempus-si-crosstalk-glitch":
    case "tempus-ocv-pocv-pba":
    case "tempus-cdc-reset-signoff":
    case "tempus-eco-timing-closure":
    case "cadence-expert-sta":
    case "cadence-expert-practical":
    case "cadence-sta":
      return <TempusInteractiveLab slug={slug} />;

    case "conformal-practical-lab":
    case "conformal-setup-mapping":
    case "conformal-keypoint-unmapped":
    case "conformal-datapath-arithmetic":
    case "conformal-low-power-upf":
    case "conformal-scan-dft-bypass":
    case "conformal-clock-gating-retiming":
    case "conformal-debug-functional-eco":
    case "cadence-master-lec":
    case "cadence-master-practical":
    case "cadence-lec":
      return <ConformalInteractiveLab slug={slug} />;

    case "vlsi-calculators":
    case "vlsi-calc":
      return <VlsiCalculatorHub initialDomain="all" />;
    case "floorplan-calculators":
      return <VlsiCalculatorHub initialDomain="floorplan" />;
    case "power-calculators":
      return <VlsiCalculatorHub initialDomain="power_plan" />;
    case "cts-calculators":
      return <VlsiCalculatorHub initialDomain="cts_clock" />;
    case "synthesis-calculators":
      return <VlsiCalculatorHub initialDomain="logic_synthesis" />;
    case "si-calculators":
      return <VlsiCalculatorHub initialDomain="signal_integrity" />;
    case "power-integrity-calculators":
      return <VlsiCalculatorHub initialDomain="power_integrity" />;

    default:
      return null;
  }
}

