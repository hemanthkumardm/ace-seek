"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Layers, Box, CheckCircle2, Sparkles, Activity, FileCode } from "lucide-react";

export function TechnologyMappingVisualizer() {
  const [selectedCircuit, setSelectedCircuit] = useState<"ADDER" | "AOI" | "MUX">("AOI");
  const [stage, setStage] = useState<"RTL" | "GTECH" | "MAPPED" | "OPTIMIZED">("OPTIMIZED");

  const circuitData = {
    AOI: {
      title: "And-Or-Invert (AOI22) Complex Function: Y = ~((A & B) | (C & D))",
      rtl: `// 1. Synthesizable Behavioral RTL
module aoi22_block (
  input  wire a, b, c, d,
  output wire y
);
  assign y = ~((a & b) | (c & d));
endmodule`,
      gtech: `// 2. Generic Technology-Independent Netlist (GTECH / RTLIL)
module aoi22_block (a, b, c, d, y);
  input a, b, c, d;
  output y;
  wire gtech_n1, gtech_n2, gtech_n3;

  // Unmapped generic boolean primitives
  GTECH_AND2 u_and1 (.A(a), .B(b), .Z(gtech_n1));
  GTECH_AND2 u_and2 (.A(c), .B(d), .Z(gtech_n2));
  GTECH_OR2  u_or1  (.A(gtech_n1), .B(gtech_n2), .Z(gtech_n3));
  GTECH_NOT  u_inv1 (.A(gtech_n3), .Z(y));
endmodule`,
      mapped: `// 3. Initial Technology Mapped Netlist (Discrete SkyWater 130nm Gates)
module aoi22_block (a, b, c, d, y);
  input a, b, c, d;
  output y;
  wire net_ab, net_cd, net_or;

  // Mapped to discrete individual library gates (Sub-optimal Area)
  sky130_fd_sc_hd__and2_1 u_and1 (.A(a), .B(b), .X(net_ab));
  sky130_fd_sc_hd__and2_1 u_and2 (.A(c), .B(d), .X(net_cd));
  sky130_fd_sc_hd__or2_1  u_or1  (.A(net_ab), .B(net_cd), .X(net_or));
  sky130_fd_sc_hd__inv_1  u_inv1 (.A(net_or), .Y(y));
endmodule`,
      optimized: `// 4. Optimized Signoff Gate Netlist (SkyWater 130nm Monolithic Complex Cell)
module aoi22_block (a, b, c, d, y);
  input a, b, c, d;
  output y;

  // Collapsed into 1 single complex AOI22 cell (8 CMOS transistors vs 20!)
  // Drive strength X2 selected to meet max transition constraint (0.15ns slew)
  sky130_fd_sc_hd__aoi22_2 u_aoi22_inst (
    .A1(a),
    .A2(b),
    .B1(c),
    .B2(d),
    .Y(y)
  );
endmodule`,
      metrics: {
        RTL: { area: "N/A (Abstract)", delay: "N/A", cells: "Behavioral AST", transistors: 0 },
        GTECH: { area: "Generic", delay: "4 Logic Levels", cells: "4 Generic Gates", transistors: 0 },
        MAPPED: { area: "44.8 µm²", delay: "320 ps (3 Stages)", cells: "4 Discrete Cells", transistors: 20 },
        OPTIMIZED: { area: "18.4 µm² (-59% Area!)", delay: "95 ps (+70% Speed!)", cells: "1 Monolithic Cell", transistors: 8 },
      },
    },

    ADDER: {
      title: "4-Bit Adder/Subtractor Datapath",
      rtl: `// 1. Synthesizable Behavioral RTL
module adder_sub (
  input  wire [3:0] a, b,
  input  wire       sub,
  output wire [3:0] sum,
  output wire       cout
);
  wire [3:0] b_operand = sub ? ~b : b;
  assign {cout, sum} = a + b_operand + sub;
endmodule`,
      gtech: `// 2. Generic Technology-Independent Netlist (GTECH / RTLIL)
module adder_sub (a, b, sub, sum, cout);
  input [3:0] a, b; input sub;
  output [3:0] sum; output cout;
  wire [3:0] b_inv;

  // Generic 2-input XOR tree for 1's complement inversion
  GTECH_XOR2 u_xor0 (.A(b[0]), .B(sub), .Z(b_inv[0]));
  GTECH_XOR2 u_xor1 (.A(b[1]), .B(sub), .Z(b_inv[1]));
  GTECH_XOR2 u_xor2 (.A(b[2]), .B(sub), .Z(b_inv[2]));
  GTECH_XOR2 u_xor3 (.A(b[3]), .B(sub), .Z(b_inv[3]));

  // Generic unmapped 4-bit addition operator
  GTECH_ADD4 u_add4 (.A(a), .B(b_inv), .CIN(sub), .SUM(sum), .COUT(cout));
endmodule`,
      mapped: `// 3. Initial Technology Mapped Netlist (SkyWater 130nm Discrete Cells)
module adder_sub (a, b, sub, sum, cout);
  input [3:0] a, b; input sub; output [3:0] sum; output cout;
  wire [3:0] b_inv; wire c0, c1, c2;

  sky130_fd_sc_hd__xor2_1 u_x0 (.A(b[0]), .B(sub), .X(b_inv[0]));
  sky130_fd_sc_hd__xor2_1 u_x1 (.A(b[1]), .B(sub), .X(b_inv[1]));
  sky130_fd_sc_hd__xor2_1 u_x2 (.A(b[2]), .B(sub), .X(b_inv[2]));
  sky130_fd_sc_hd__xor2_1 u_x3 (.A(b[3]), .B(sub), .X(b_inv[3]));

  // Ripple-carry discrete full adders
  sky130_fd_sc_hd__fa_1 u_fa0 (.A(a[0]), .B(b_inv[0]), .CIN(sub), .SUM(sum[0]), .COUT(c0));
  sky130_fd_sc_hd__fa_1 u_fa1 (.A(a[1]), .B(b_inv[1]), .CIN(c0),  .SUM(sum[1]), .COUT(c1));
  sky130_fd_sc_hd__fa_1 u_fa2 (.A(a[2]), .B(b_inv[2]), .CIN(c1),  .SUM(sum[2]), .COUT(c2));
  sky130_fd_sc_hd__fa_1 u_fa3 (.A(a[3]), .B(b_inv[3]), .CIN(c2),  .SUM(sum[3]), .COUT(cout));
endmodule`,
      optimized: `// 4. Optimized Signoff Gate Netlist (Carry-Lookahead Sized Cells)
module adder_sub (a, b, sub, sum, cout);
  input [3:0] a, b; input sub; output [3:0] sum; output cout;
  wire [3:0] b_inv; wire c0, c1, c2;

  // Inverters sized up to X2 for reduced propagation delay
  sky130_fd_sc_hd__xor2_2 u_x0 (.A(b[0]), .B(sub), .X(b_inv[0]));
  sky130_fd_sc_hd__xor2_2 u_x1 (.A(b[1]), .B(sub), .X(b_inv[1]));
  sky130_fd_sc_hd__xor2_2 u_x2 (.A(b[2]), .B(sub), .X(b_inv[2]));
  sky130_fd_sc_hd__xor2_2 u_x3 (.A(b[3]), .B(sub), .X(b_inv[3]));

  // Carry-lookahead full adders with X2 drive strength for signoff timing
  sky130_fd_sc_hd__fa_2 u_fa0 (.A(a[0]), .B(b_inv[0]), .CIN(sub), .SUM(sum[0]), .COUT(c0));
  sky130_fd_sc_hd__fa_2 u_fa1 (.A(a[1]), .B(b_inv[1]), .CIN(c0),  .SUM(sum[1]), .COUT(c1));
  sky130_fd_sc_hd__fa_2 u_fa2 (.A(a[2]), .B(b_inv[2]), .CIN(c1),  .SUM(sum[2]), .COUT(c2));
  sky130_fd_sc_hd__fa_2 u_fa3 (.A(a[3]), .B(b_inv[3]), .CIN(c2),  .SUM(sum[3]), .COUT(cout));
endmodule`,
      metrics: {
        RTL: { area: "N/A (Abstract)", delay: "N/A", cells: "Behavioral HDL", transistors: 0 },
        GTECH: { area: "Generic Tree", delay: "4 Add Levels", cells: "1 GTECH_ADD4 + 4 XORs", transistors: 0 },
        MAPPED: { area: "148.6 µm²", delay: "420 ps", cells: "8 Discrete Standard Cells", transistors: 136 },
        OPTIMIZED: { area: "162.0 µm² (Sized X2)", delay: "245 ps (+42% Speedup!)", cells: "8 Sized Fast Cells", transistors: 136 },
      },
    },

    MUX: {
      title: "4-to-1 Priority Steer Multiplexer",
      rtl: `// 1. Synthesizable Behavioral RTL
module pri_mux (
  input  wire [3:0] req,
  input  wire [3:0] d0, d1, d2, d3,
  output reg  [3:0] y
);
  always @(*) begin
    if      (req[0]) y = d0;
    else if (req[1]) y = d1;
    else if (req[2]) y = d2;
    else             y = d3;
  end
endmodule`,
      gtech: `// 2. Generic Technology-Independent Netlist (GTECH / RTLIL)
module pri_mux (req, d0, d1, d2, d3, y);
  input [3:0] req, d0, d1, d2, d3; output [3:0] y;
  wire [1:0] enc_sel;

  // Generic priority encoder block
  GTECH_PRI_ENC4 u_enc (.REQ(req), .SEL(enc_sel));
  // Generic 4:1 multiplexer datapath
  GTECH_MUX4_4BIT u_mux (.D0(d0), .D1(d1), .D2(d2), .D3(d3), .S(enc_sel), .Y(y));
endmodule`,
      mapped: `// 3. Initial Technology Mapped Netlist (SkyWater 130nm Discrete MUX Trees)
module pri_mux (req, d0, d1, d2, d3, y);
  input [3:0] req, d0, d1, d2, d3; output [3:0] y;
  wire [3:0] m01, m23;

  sky130_fd_sc_hd__mux2_1 u_m01_0 (.A0(d0[0]), .A1(d1[0]), .S(req[1]), .X(m01[0]));
  sky130_fd_sc_hd__mux2_1 u_m23_0 (.A0(d2[0]), .A1(d3[0]), .S(req[3]), .X(m23[0]));
  sky130_fd_sc_hd__mux2_1 u_mout_0 (.A0(m01[0]), .A1(m23[0]), .S(req[2]), .X(y[0]));
  // ... repeated for bits 1, 2, 3
endmodule`,
      optimized: `// 4. Optimized Signoff Gate Netlist (Merged Complex AOI/OAI Cells)
module pri_mux (req, d0, d1, d2, d3, y);
  input [3:0] req, d0, d1, d2, d3; output [3:0] y;
  wire req0_b, req1_b;

  sky130_fd_sc_hd__inv_2 u_inv0 (.A(req[0]), .Y(req0_b));
  sky130_fd_sc_hd__inv_2 u_inv1 (.A(req[1]), .Y(req1_b));

  // Merged decode and steering into compound high-density AOI22 gates
  sky130_fd_sc_hd__aoi22_1 u_aoi_0 (.A1(d0[0]), .A2(req[0]), .B1(d1[0]), .B2(req[1]), .Y(y[0]));
  sky130_fd_sc_hd__aoi22_1 u_aoi_1 (.A1(d0[1]), .A2(req[0]), .B1(d1[1]), .B2(req[1]), .Y(y[1]));
  sky130_fd_sc_hd__aoi22_1 u_aoi_2 (.A1(d0[2]), .A2(req[0]), .B1(d1[2]), .B2(req[1]), .Y(y[2]));
  sky130_fd_sc_hd__aoi22_1 u_aoi_3 (.A1(d0[3]), .A2(req[0]), .B1(d1[3]), .B2(req[1]), .Y(y[3]));
endmodule`,
      metrics: {
        RTL: { area: "N/A (Abstract)", delay: "N/A", cells: "Behavioral HDL", transistors: 0 },
        GTECH: { area: "Generic", delay: "3 Logic Levels", cells: "Encoder + Mux Tree", transistors: 0 },
        MAPPED: { area: "142.8 µm²", delay: "380 ps", cells: "12 Discrete 2:1 Muxes", transistors: 144 },
        OPTIMIZED: { area: "94.2 µm² (-34% Area!)", delay: "210 ps (+45% Speedup!)", cells: "6 Compound AOI Cells", transistors: 72 },
      },
    },
  };

  const curr = circuitData[selectedCircuit];
  const metric = curr.metrics[stage];

  const stageCode =
    stage === "RTL"
      ? curr.rtl
      : stage === "GTECH"
      ? curr.gtech
      : stage === "MAPPED"
      ? curr.mapped
      : curr.optimized;

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
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              RTL to SkyWater 130nm Netlist Transformation Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Compare Verilog RTL ➔ Generic Netlist (GTECH) ➔ Initial Mapped Netlist ➔ Optimized Signoff Netlist
            </p>
          </div>
        </div>

        {/* Circuit Selectors */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(["AOI", "ADDER", "MUX"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCircuit(c)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                selectedCircuit === c
                  ? "bg-[var(--ln-accent)] text-slate-950 font-bold shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {c === "AOI" ? "AOI22 Complex" : c === "ADDER" ? "4-Bit ALU" : "4:1 Priority Mux"}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Stage Step Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 font-mono text-xs">
        {[
          { id: "RTL", step: "Stage 1", label: "Behavioral RTL", desc: "Verilog HDL Description" },
          { id: "GTECH", step: "Stage 2", label: "Generic Netlist", desc: "Unmapped GTECH / RTLIL" },
          { id: "MAPPED", step: "Stage 3", label: "Mapped Netlist", desc: "Discrete sky130_fd_sc_hd" },
          { id: "OPTIMIZED", step: "Stage 4", label: "Optimized Netlist", desc: "Complex Cells + Sizing" },
        ].map((s) => {
          const isActive = stage === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStage(s.id as any)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-[9px] text-cyan-400 uppercase font-black">{s.step}</div>
              <div className="font-bold text-xs text-white mb-0.5">{s.label}</div>
              <div className="text-[10px] text-slate-400 font-sans">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Live Netlist Viewer Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 font-bold">{curr.title}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300 text-[10px] font-bold">
            PDK: SkyWater 130nm High Density (`sky130_fd_sc_hd`)
          </span>
        </div>

        {/* Code / Netlist Block */}
        <pre className="p-3.5 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto max-h-72">
          {stageCode}
        </pre>

        {/* Quality of Results (QoR) Impact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Silicon Area:</span>
            <span className="font-black text-cyan-300 text-xs">{metric.area}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Path Delay:</span>
            <span className="font-black text-emerald-300 text-xs">{metric.delay}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Gate Structure:</span>
            <span className="font-black text-amber-300 text-xs">{metric.cells}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">CMOS Transistors:</span>
            <span className="font-black text-white text-xs">{metric.transistors > 0 ? `${metric.transistors} FETs` : "Abstract"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
