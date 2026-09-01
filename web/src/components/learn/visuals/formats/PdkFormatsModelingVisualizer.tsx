"use client";

import React, { useState } from "react";
import { FileCode, Layers, Cpu, Zap, Activity, ShieldCheck, Box, HardDrive, GitBranch, ArrowRight } from "lucide-react";

export function PdkFormatsModelingVisualizer() {
  const [activeTab, setActiveTab] = useState<"LIB_MODELS" | "LEF_TECH_MACRO" | "PARASITIC_QRC_SPEF" | "GDS_DEF_CDL" | "IPXACT_RDL_WAVEFORMS">("LIB_MODELS");
  const [libModel, setLibModel] = useState<"NLDM" | "CCS" | "ECSM">("CCS");

  const libSpecs = {
    NLDM: {
      name: "NLDM (Non-Linear Delay Model - 2D Table Lookup)",
      concept: "Thevenin Voltage Ramp Driver + Lumped Output Capacitor",
      accuracy: "Accurate for >65nm. Fails in FinFET & sub-28nm due to resistive interconnect shielding and non-linear Miller capacitance.",
      syntax: `/* NLDM 2D LUT Table Lookup */
cell (sky130_fd_sc_hd__nand2_1) {
  pin (Y) {
    timing () {
      related_pin : "A B";
      cell_rise (table_template_7x7) {
        index_1 ("0.01, 0.05, 0.10, 0.20, 0.40, 0.80, 1.60"); /* Input Slew (ns) */
        index_2 ("0.001, 0.005, 0.015, 0.030, 0.060, 0.120, 0.240"); /* Load Cap (pF) */
        values (
          "0.024, 0.038, 0.065, 0.112, 0.204, 0.388, 0.752",
          "0.031, 0.045, 0.072, 0.119, 0.211, 0.395, 0.759", ...
        );
      }
    }
  }
}`,
      limitation: "⚠️ Assumes the gate output is a pure linear resistance driving a single capacitor. Ignores wire resistance shielding where the gate only sees near-end capacitance initially.",
    },
    CCS: {
      name: "CCS (Composite Current Source - Synopsys Open Liberty Standard)",
      concept: "Time-Varying Non-Linear Current Source I(t) + Dynamic Receiver Capacitance (C1/C2)",
      accuracy: "Gold standard in sub-nanometer FinFET nodes. Matches SPICE golden simulations to within <1.5% accuracy.",
      syntax: `/* CCS Current Source Model with I(t) Waveforms */
cell (sky130_fd_sc_hd__nand2_1) {
  pin (Y) {
    timing () {
      related_pin : "A B";
      /* Time-dependent drive current I(t) lookup tables */
      output_current_rise () {
        vector ("table_template_ccs") {
          reference_time : 0.024;
          index_1 ("0.05"); /* Input Slew */
          index_2 ("0.015"); /* Output Cap */
          values ("0.000, 0.142, 0.385, 0.892, 1.420, 1.105, 0.420, 0.000"); /* Current I (mA) */
        }
      }
      /* Receiver dynamic capacitance (Miller effect C1 and C2) */
      receiver_capacitance1_rise (table_7x7) { ... }
      receiver_capacitance2_rise (table_7x7) { ... }
    }
  }
}`,
      limitation: "✅ Comprehensive: Models CCS Timing (delay), CCS Power (instantaneous dynamic current spikes for IR drop), and CCS Noise (AC/DC noise immunity).",
    },
    ECSM: {
      name: "ECSM (Effective Current Source Model - Cadence Open Standard)",
      concept: "Voltage-Dependent Current Sources + Multi-Threshold Voltage Waveforms V(t)",
      accuracy: "High accuracy in deep submicron. Captures non-linear waveform shapes and signal integrity noise effects.",
      syntax: `/* ECSM Dynamic Waveform & Current Source Model */
cell (sky130_fd_sc_hd__nand2_1) {
  pin (Y) {
    timing () {
      related_pin : "A B";
      /* Voltage waveforms sampled at multiple transition thresholds (10%, 20%..90%) */
      ecsm_waveform () {
        index_1 ("0.05"); /* Input Slew */
        index_2 ("0.015"); /* Output Cap */
        values ("0.00, 0.18, 0.36, 0.72, 1.08, 1.44, 1.62, 1.80"); /* V(t) Volts */
      }
      ecsm_capacitance () { ... }
    }
  }
}`,
      limitation: "✅ Provides multi-point dynamic waveform interpolation across supply voltage variations.",
    },
  };

  return (
    <div
      className="ln-card p-5 my-6 overflow-hidden rounded-xl"
      style={{
        background: "var(--ln-bg-elev)",
        border: "1px solid var(--ln-border)",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              PDK Architecture &amp; EDA Formats Studio (LIB · LEF · QRC · SPEF · GDSII)
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              In-depth comparative analysis of foundry PDK file formats and standard cell delay models
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("LIB_MODELS")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeTab === "LIB_MODELS" ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            .LIB Models (NLDM/CCS/ECSM)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LEF_TECH_MACRO")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeTab === "LEF_TECH_MACRO" ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            LEF (Tech vs Macro)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PARASITIC_QRC_SPEF")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeTab === "PARASITIC_QRC_SPEF" ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            QRC &amp; SPEF (RC)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("GDS_DEF_CDL")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeTab === "GDS_DEF_CDL" ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            GDSII · DEF · CDL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IPXACT_RDL_WAVEFORMS")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              activeTab === "IPXACT_RDL_WAVEFORMS" ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            IP-XACT · RDL · Waveforms
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "LIB_MODELS" && (
        <div className="space-y-4 font-mono text-xs">
          {/* Model Switcher Bar */}
          <div className="grid grid-cols-3 gap-2">
            {(["NLDM", "CCS", "ECSM"] as const).map((m) => {
              const isSelected = libModel === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLibModel(m)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] text-cyan-400 uppercase font-bold mb-0.5">{m} Model</div>
                  <div className="font-bold text-xs text-white truncate">{m === "NLDM" ? "Non-Linear Delay" : m === "CCS" ? "Composite Current" : "Effective Current"}</div>
                  <div className="text-[9px] text-slate-400 font-sans mt-0.5">{m === "NLDM" ? ">65nm Nodes" : m === "CCS" ? "Synopsys Standard" : "Cadence Standard"}</div>
                </button>
              );
            })}
          </div>

          {/* Model Deep-Dive Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-cyan-300 font-bold">{libSpecs[libModel].name}</span>
              <span className="text-emerald-400 font-bold text-[10px]">Architecture: {libSpecs[libModel].concept}</span>
            </div>

            {/* Accuracy & Physics Note */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-slate-300">
              ℹ️ <strong className="text-white">Physical Characterization:</strong> {libSpecs[libModel].accuracy}
            </div>

            {/* Syntax Code Block */}
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Liberty (.lib) Syntax Representation:</div>
              <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto max-h-60">
                {libSpecs[libModel].syntax}
              </pre>
            </div>

            {/* Rule Summary */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-slate-300">
              {libSpecs[libModel].limitation}
            </div>
          </div>
        </div>
      )}

      {activeTab === "LEF_TECH_MACRO" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tech LEF */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-cyan-300 font-bold flex items-center justify-between pb-2 border-b border-slate-800">
                <span>1. Technology LEF (`tech.lef`)</span>
                <span className="text-[10px] text-cyan-400 uppercase font-bold">Process Rules</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Defines all metal routing layers, vias, design rules, pitches, spacing, width, and antenna ratios for P&amp;R routers.
              </p>
              <pre className="p-3 rounded-lg bg-slate-900 text-cyan-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`LAYER met1
  TYPE ROUTING ;
  WIDTH 0.14 ;
  PITCH 0.34 0.34 ;
  DIRECTION HORIZONTAL ;
  RESISTANCE RPERSQ 0.125 ;
  CAPACITANCE CPERSQDIST 0.00015 ;
END met1

VIA via1_DEFAULT
  LAYER met1 ;
    RECT -0.07 -0.07 0.07 0.07 ;
  LAYER via1 ;
    RECT -0.06 -0.06 0.06 0.06 ;
  LAYER met2 ;
    RECT -0.07 -0.07 0.07 0.07 ;
END via1_DEFAULT`}
              </pre>
            </div>

            {/* Macro / Cell LEF */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-300 font-bold flex items-center justify-between pb-2 border-b border-slate-800">
                <span>2. Macro / Cell LEF (`cells.lef`)</span>
                <span className="text-[10px] text-amber-400 uppercase font-bold">Abstract Geometry</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Provides cell bounding box (`ORIGIN`, `SIZE`), physical pin coordinates (`PIN A`, `RECT`), and routing obstructions (`OBS`) without exposing internal proprietary transistor layouts!
              </p>
              <pre className="p-3 rounded-lg bg-slate-900 text-amber-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`MACRO sky130_fd_sc_hd__nand2_1
  CLASS CORE ;
  ORIGIN 0.00 0.00 ;
  SIZE 1.380 BY 2.720 ;
  SYMMETRY X Y ;
  SITE unithd ;
  PIN A
    DIRECTION INPUT ;
    PORT
      LAYER met1 ;
        RECT 0.28 0.42 0.42 0.76 ;
    END
  END A
  PIN Y
    DIRECTION OUTPUT ;
    PORT
      LAYER met1 ;
        RECT 0.88 1.20 1.02 1.54 ;
    END
  END Y
  OBS
    LAYER met1 ;
      RECT 0.00 0.00 1.38 0.32 ;
  END
END sky130_fd_sc_hd__nand2_1`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === "PARASITIC_QRC_SPEF" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid md:grid-cols-2 gap-4">
            {/* QRC / TLUplus */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-cyan-300 font-bold flex items-center justify-between pb-2 border-b border-slate-800">
                <span>1. Parasitic Tech Files (QRC / TLUplus / ICT)</span>
                <span className="text-[10px] text-cyan-400 uppercase font-bold">Field Solver Models</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Provides dielectric layer thicknesses, permittivity (kappa), metal sheet resistivity, and sidewall 3D fringing capacitance lookup tables used by StarRC / Quantus QRC to extract accurate wire parasitics.
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-slate-300 space-y-1">
                <div>• <strong>RC_WORST:</strong> Max metal resistance R_max + Max dielectric cap C_max.</div>
                <div>• <strong>RC_BEST:</strong> Min metal resistance R_min + Min dielectric cap C_min.</div>
                <div>• <strong>C_WORST:</strong> Min metal spacing / thick dielectric (High sidewall capacitance).</div>
              </div>
            </div>

            {/* SPEF */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-emerald-300 font-bold flex items-center justify-between pb-2 border-b border-slate-800">
                <span>2. Standard Parasitic Format (`top.spef`)</span>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Extracted RC Netlist</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Output of parasitic extraction containing distributed $\Pi$-model resistors and ground/coupling capacitors per net segment for STA delay calculation.
              </p>
              <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`*D_NET net_clk_tree 0.0482
*CONN
*I u_buf1/Y O *L 0.00 0.00
*I u_ff1/CLK I *L 12.4 8.2
*CAP
1 net_clk_tree:1 0.0124
2 net_clk_tree:2 0.0185
3 net_clk_tree:2 other_net:4 0.0082 /* Coupling Cap */
*RES
1 net_clk_tree:1 net_clk_tree:2 4.82
*END`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === "GDS_DEF_CDL" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid md:grid-cols-3 gap-3">
            {/* GDSII / OASIS */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-cyan-300 font-bold text-xs">GDSII / OASIS (Tapeout Mask)</div>
              <p className="text-slate-300 text-[10px] font-sans">
                Binary stream format of all physical geometric polygons (diffusion, polysilicon, nwell, contact, M1..M5) delivered to the semiconductor foundry for photolithography mask generation.
              </p>
              <div className="text-[9px] text-cyan-400 font-mono">Format: Binary Stream (Layer/Datatype)</div>
            </div>

            {/* DEF */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-amber-300 font-bold text-xs">DEF (Design Exchange Format)</div>
              <p className="text-slate-300 text-[10px] font-sans">
                Complete placed-and-routed design database containing die boundary, standard cell placement rows (`PLACED/FIXED`), macro orientations, power grid straps, and routed net geometries.
              </p>
              <div className="text-[9px] text-amber-400 font-mono">Format: ASCII / OpenAccess Database</div>
            </div>

            {/* CDL / SPICE */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-emerald-300 font-bold text-xs">CDL / SPICE (LVS Golden)</div>
              <p className="text-slate-300 text-[10px] font-sans">
                Transistor-level schematic netlist (`MP1`, `MN1`) with transistor channel widths, lengths, and drain/source areas used for Layout Versus Schematic (LVS) verification against GDSII.
              </p>
              <div className="text-[9px] text-emerald-400 font-mono">Format: Transistor Subcircuit Netlist</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "IPXACT_RDL_WAVEFORMS" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid md:grid-cols-3 gap-3">
            {/* IP-XACT & SystemRDL */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-fuchsia-300 font-bold text-xs">IEEE 1685 IP-XACT & SystemRDL</div>
              <p className="text-slate-300 text-[10px] font-sans">
                Metadata interchange standards describing IP component VLNVs, bus interfaces (AXI4/APB), memory maps, and register blocks that auto-generate UVM RAL models, C headers, and RTL decoders.
              </p>
              <pre className="p-2 rounded bg-slate-900 text-fuchsia-300 text-[10px] overflow-x-auto border border-slate-800">
{`<ipxact:component>
  <ipxact:vendor>skywater.org</ipxact:vendor>
  <ipxact:name>spi_master</ipxact:name>
  <ipxact:memoryMap>
    <ipxact:baseAddress>'h40010000</ipxact:baseAddress>
  </ipxact:memoryMap>
</ipxact:component>`}
              </pre>
            </div>

            {/* SDF Back-Annotation */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-cyan-300 font-bold text-xs">SDF (Standard Delay Format)</div>
              <p className="text-slate-300 text-[10px] font-sans">
                Annotates extracted post-layout gate delays (`IOPATH`), wire interconnect delays, and setup/hold timing limits into gate-level simulation (GLS).
              </p>
              <pre className="p-2 rounded bg-slate-900 text-cyan-300 text-[10px] overflow-x-auto border border-slate-800">
{`(DELAYFILE
  (SDFVERSION "3.0")
  (CELL (CELLTYPE "nand2_1")
    (INSTANCE u_nand)
    (DELAY (ABSOLUTE
      (IOPATH A Y (0.12::0.15))
    ))
  )
)`}
              </pre>
            </div>

            {/* SAIF & FSDB */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-emerald-300 font-bold text-xs">SAIF & FSDB Waveforms</div>
              <p className="text-slate-300 text-[10px] font-sans">
                Switching Activity Interchange Format (SAIF) records empirical toggle counts (T_rate, P1) for PrimePower dynamic power estimation; FSDB provides 50x compressed binary waveform seeking.
              </p>
              <pre className="p-2 rounded bg-slate-900 text-emerald-300 text-[10px] overflow-x-auto border border-slate-800">
{`(SAIFILE
  (NET
    (clk_core (T0 500) (T1 500) (TX 0) (TC 1000))
    (data_bus[0] (T0 620) (T1 380) (TC 240))
  )
)`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
