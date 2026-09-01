"use client";

import React, { useState } from "react";
import { Cpu, FileText, Activity, Layers, Thermometer, Zap, CheckCircle2, ShieldAlert } from "lucide-react";

export function LibertyFormatVisualizer() {
  const [selectedCorner, setSelectedCorner] = useState<"TT" | "SS" | "FF">("TT");
  const [selectedCell, setSelectedCell] = useState<"NAND2" | "DFF" | "INV">("NAND2");
  const [inputSlew, setInputSlew] = useState<number>(0.05); // ns
  const [loadCap, setLoadCap] = useState<number>(0.015); // pF

  // NLDM 2D Interpolation Model for SkyWater 130nm (sky130_fd_sc_hd)
  // Delay = BaseDelay * CornerFactor + SlewCoeff * Slew + CapCoeff * Cap
  const cornerFactors = {
    TT: { name: "Typical (TT / 1.80V / 25°C)", factor: 1.0, color: "#06b6d4", leakage: 1.42, desc: "Nominal process, standard temperature. Used for typical power and delay modeling." },
    SS: { name: "Slow-Slow (SS / 1.62V / 125°C)", factor: 1.48, color: "#f43f5e", leakage: 8.64, desc: "Worst-case process, low voltage (-10%), high temperature. Mandatory for Setup Timing ($WNS$) Signoff." },
    FF: { name: "Fast-Fast (FF / 1.98V / -40°C)", factor: 0.68, color: "#10b981", leakage: 0.48, desc: "Best-case process, high voltage (+10%), sub-zero temperature. Mandatory for Hold Timing ($WHS$) Signoff." },
  };

  const cellSpecs = {
    NAND2: {
      name: "sky130_fd_sc_hd__nand2_1",
      footprint: "2-Input NAND Gate (X1 Drive)",
      area: "5.76 µm²",
      baseDelay: 0.045, // ns
      slewCoeff: 0.35,
      capCoeff: 3.2,
      timingArc: "pin(Y) { related_pin: \"A B\"; timing_type: combinational; }",
      libSnippet: `cell (sky130_fd_sc_hd__nand2_1) {
  area : 5.76;
  cell_leakage_power : LEAKAGE_VAL;
  pin (Y) {
    direction : output;
    function : "(!(A & B))";
    timing () {
      related_pin : "A B";
      timing_sense : negative_unate;
      cell_rise (table_template_3x3) {
        index_1 ("0.01, 0.05, 0.20"); /* Input Transition (ns) */
        index_2 ("0.005, 0.02, 0.08"); /* Output Load (pF) */
        values ( \\
          "0.024, 0.048, 0.145", \\
          "0.042, 0.068, 0.168", \\
          "0.098, 0.125, 0.235"  \\
        );
      }
      rise_transition (table_template_3x3) { ... }
    }
  }
}`,
    },
    DFF: {
      name: "sky130_fd_sc_hd__dfxtp_1",
      footprint: "D Flip-Flop with Positive Edge Clock",
      area: "17.28 µm²",
      baseDelay: 0.18, // ns
      slewCoeff: 0.22,
      capCoeff: 2.1,
      timingArc: "pin(D) { timing_type: setup_rising; related_pin: \"CLK\"; }",
      libSnippet: `cell (sky130_fd_sc_hd__dfxtp_1) {
  area : 17.28;
  ff (IQ, IQN) {
    next_state : "D";
    clocked_on : "CLK";
  }
  pin (D) {
    direction : input;
    timing () {
      related_pin : "CLK";
      timing_type : setup_rising;
      rise_constraint (table_template_3x3) {
        values ("0.042, 0.055, 0.088", ...);
      }
    }
    timing () {
      related_pin : "CLK";
      timing_type : hold_rising;
      rise_constraint (table_template_3x3) {
        values ("0.012, 0.015, 0.022", ...);
      }
    }
  }
  pin (Q) {
    direction : output;
    timing () {
      related_pin : "CLK";
      timing_type : rising_edge; /* Clock-to-Q Delay */
      cell_rise (...) { ... }
    }
  }
}`,
    },
    INV: {
      name: "sky130_fd_sc_hd__inv_2",
      footprint: "High Drive Inverter (X2 Drive)",
      area: "3.84 µm²",
      baseDelay: 0.028, // ns
      slewCoeff: 0.28,
      capCoeff: 1.8,
      timingArc: "pin(Y) { related_pin: \"A\"; timing_type: combinational; }",
      libSnippet: `cell (sky130_fd_sc_hd__inv_2) {
  area : 3.84;
  cell_leakage_power : LEAKAGE_VAL;
  pin (Y) {
    direction : output;
    function : "(!A)";
    timing () {
      related_pin : "A";
      timing_sense : negative_unate;
      cell_rise (table_template_3x3) { ... }
      cell_fall (table_template_3x3) { ... }
    }
  }
}`,
    },
  };

  const currCorner = cornerFactors[selectedCorner];
  const currCell = cellSpecs[selectedCell];

  // Calculate NLDM interpolated delay
  const rawDelay = (currCell.baseDelay + currCell.slewCoeff * inputSlew + currCell.capCoeff * loadCap) * currCorner.factor;
  const delayPs = Math.round(rawDelay * 1000);
  const leakageVal = (currCorner.leakage * (currCell.name.includes("dfx") ? 3.0 : 1.0)).toFixed(2);

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
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Liberty (.lib) Modeling &amp; Process Corners (PVT) Inspector
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              2D Non-Linear Delay Model (NLDM) lookup tables, timing arcs, and PVT process corners
            </p>
          </div>
        </div>

        {/* Cell Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(["NAND2", "DFF", "INV"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCell(c)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                selectedCell === c
                  ? "bg-[var(--ln-accent)] text-slate-950 font-bold shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {c === "NAND2" ? "nand2_1" : c === "DFF" ? "dfxtp_1 (Flop)" : "inv_2"}
            </button>
          ))}
        </div>
      </div>

      {/* Process Corners (PVT) Selection Bar */}
      <div className="grid grid-cols-3 gap-2 mb-4 font-mono text-xs">
        {(["TT", "SS", "FF"] as const).map((cr) => {
          const corner = cornerFactors[cr];
          const isSelected = selectedCorner === cr;
          return (
            <button
              key={cr}
              type="button"
              onClick={() => setSelectedCorner(cr)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
              style={{ borderLeftColor: isSelected ? corner.color : undefined, borderLeftWidth: isSelected ? "4px" : "1px" }}
            >
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-xs" style={{ color: corner.color }}>
                  {cr} Corner
                </span>
                <span className="text-[10px] text-slate-400">Scale: {corner.factor}x</span>
              </div>
              <div className="text-[10px] text-slate-300 font-sans">{corner.name}</div>
            </button>
          );
        })}
      </div>

      {/* Interactive NLDM 2D Interpolation Sliders */}
      <div className="grid md:grid-cols-2 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>Input Transition Slew (`index_1`)</span>
            <span className="text-cyan-400">{inputSlew.toFixed(3)} ns ({(inputSlew * 1000).toFixed(0)} ps)</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.20"
            step="0.005"
            value={inputSlew}
            onChange={(e) => setInputSlew(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Slower input slew increases propagation delay.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>Output Net Load Capacitance (`index_2`)</span>
            <span className="text-amber-400">{loadCap.toFixed(3)} pF ({(loadCap * 1000).toFixed(0)} fF)</span>
          </div>
          <input
            type="range"
            min="0.005"
            max="0.08"
            step="0.002"
            value={loadCap}
            onChange={(e) => setLoadCap(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Higher wire/pin load capacitance increases delay.</div>
        </div>
      </div>

      {/* Live Calculated Delay & Liberty Code Inspector */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
          <div>
            <span className="text-cyan-300 font-bold block">{currCell.name}</span>
            <span className="text-[10px] text-slate-400">{currCell.footprint} · Area: {currCell.area}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 px-2.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-xs">
              NLDM Cell Delay: <span className="text-white text-sm">{delayPs} ps</span>
            </span>
            <span className="p-1.5 px-2.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold text-xs">
              Static Leakage: <span className="text-white text-sm">{leakageVal} nW</span>
            </span>
          </div>
        </div>

        {/* Liberty Code Block with Real-Time Values */}
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Liberty (.lib) Representation:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto max-h-56">
            {currCell.libSnippet.replace("LEAKAGE_VAL", `${leakageVal} nW`)}
          </pre>
        </div>

        {/* PVT Signoff Guidance Card */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-slate-300">
          ℹ️ <span className="font-bold text-white">Corner Usage Rule:</span> {currCorner.desc}
        </div>
      </div>
    </div>
  );
}
