"use client";

import React, { useState } from "react";
import {
  Layers,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Clock,
  Sliders,
  ShieldCheck,
  Bug,
  Cpu,
  Zap,
} from "lucide-react";

export type TbEvolutionStage =
  | "LINEAR"
  | "FILE_BASED"
  | "FSM_DRIVEN"
  | "LINEAR_RANDOM"
  | "SELF_CHECKING"
  | "UVM_ENTERPRISE";

export function TestbenchEvolutionStudioVisualizer() {
  const [stage, setStage] = useState<TbEvolutionStage>("SELF_CHECKING");
  const [activeTab, setActiveTab] = useState<"EVOLUTION" | "EVENT_QUEUE" | "COVERAGE_TAXONOMY" | "BUG_LIFECYCLE">("EVOLUTION");
  const [eventStep, setEventStep] = useState<number>(0);

  const eventQueueSteps = [
    { name: "1. Preponed Region", desc: "Sample inputs before clock edge (#1step skew). Values are completely stable." },
    { name: "2. Active Region", desc: "Evaluate blocking assignments (=), continuous assigns, clock generators." },
    { name: "3. Inactive Region", desc: "Evaluate #0 procedural delays (Anti-pattern: causes non-deterministic races!)." },
    { name: "4. NBA Region", desc: "Update Non-Blocking Assignments (<=) for all clocked sequential flip-flops." },
    { name: "5. Observed Region", desc: "Evaluate concurrent SystemVerilog Assertions (SVA) against newly settled states." },
    { name: "6. Reactive Region", desc: "Execute dynamic testbench programs, drivers, and monitor sampling." },
    { name: "7. Postponed Region", desc: "Execute $strobe and $monitor display tasks. Final cycle settlement." },
  ];

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
              Verification Methodology &amp; Simulation Engine Studio
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Testbench Evolution, IEEE 1800 Event Queue Scheduler, Coverage Metrics &amp; Tapeout Signoff Checklist
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          {[
            { id: "EVOLUTION", label: "TB Evolution" },
            { id: "EVENT_QUEUE", label: "Event Queue Scheduler" },
            { id: "COVERAGE_TAXONOMY", label: "Coverage Taxonomy" },
            { id: "BUG_LIFECYCLE", label: "Bug & Signoff" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                activeTab === t.id
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Testbench Evolution */}
      {activeTab === "EVOLUTION" && (
        <div className="space-y-4 font-mono text-xs">
          {/* Evolution Steps Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-center">
            {[
              { id: "LINEAR", label: "1. Linear TB" },
              { id: "FILE_BASED", label: "2. File-Based" },
              { id: "FSM_DRIVEN", label: "3. FSM-Driven" },
              { id: "LINEAR_RANDOM", label: "4. Random $urandom" },
              { id: "SELF_CHECKING", label: "5. Self-Checking" },
              { id: "UVM_ENTERPRISE", label: "6. UVM Layered" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStage(s.id as TbEvolutionStage)}
                className={`py-2 px-1 rounded-lg border text-[10px] font-bold transition-all ${
                  stage === s.id
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Evolution Stage Description & Code Sample */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            {stage === "LINEAR" && (
              <div>
                <div className="text-cyan-300 font-bold mb-1">Stage 1: Linear Procedural Testbench (Hardcoded Delays)</div>
                <p className="text-slate-400 text-[11px] mb-3">
                  Stimulus is driven line-by-line using hardcoded delay statements (`#10`). No scoreboarding; engineer must manually inspect waveforms in GTKWave. Fragile, untestable at scale, and breaks if pipeline latency changes.
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs overflow-x-auto">
{`initial begin
  rst_n = 0; a = 0; b = 0;
  #20 rst_n = 1;
  #10 a = 8'd10; b = 8'd20; // Manually check waveform at 30ns
  #10 a = 8'd50; b = 8'd30; // Manually check waveform at 40ns
  #50 $finish;
end`}
                </pre>
              </div>
            )}

            {stage === "FILE_BASED" && (
              <div>
                <div className="text-cyan-300 font-bold mb-1">Stage 2: File-Based Vector Testbench (`$readmemh`)</div>
                <p className="text-slate-400 text-[11px] mb-3">
                  Separates stimulus from testbench logic by reading test vectors from external ASCII hex/binary files. Allows software teams to generate regression vectors from Python/C models.
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs overflow-x-auto">
{`reg [15:0] test_vectors [0:1023];
initial begin
  $readmemh("alu_vectors.hex", test_vectors);
  for (int i=0; i<1024; i++) begin
    @(posedge clk);
    {a, b} = test_vectors[i];
  end
end`}
                </pre>
              </div>
            )}

            {stage === "FSM_DRIVEN" && (
              <div>
                <div className="text-cyan-300 font-bold mb-1">Stage 3: State-Machine Driven Testbench</div>
                <p className="text-slate-400 text-[11px] mb-3">
                  Uses an algorithmic Finite State Machine (FSM) inside the testbench to step through complex handshake protocols (e.g. RESET -&gt; IDLE -&gt; ADDR_PHASE -&gt; DATA_PHASE -&gt; WAIT_ACK -&gt; DONE).
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs overflow-x-auto">
{`always @(posedge clk) begin
  case (tb_state)
    TB_RESET: if (rst_done) tb_state <= TB_CONFIG;
    TB_CONFIG: if (cfg_ack) tb_state <= TB_BURST;
    TB_BURST:  if (burst_done) tb_state <= TB_DRAIN;
  endcase
end`}
                </pre>
              </div>
            )}

            {stage === "LINEAR_RANDOM" && (
              <div>
                <div className="text-cyan-300 font-bold mb-1">Stage 4: Linear Random Testbench (`$urandom_range`)</div>
                <p className="text-slate-400 text-[11px] mb-3">
                  Introduces randomized inputs using Verilog built-in functions. Discovers unexpected corner cases but lacks declarative constraints, often generating illegal stimulus that hangs the bus.
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs overflow-x-auto">
{`repeat (1000) begin
  @(posedge clk);
  a  <= $urandom_range(0, 255);
  b  <= $urandom_range(0, 255);
  op <= $urandom_range(0, 3);
end`}
                </pre>
              </div>
            )}

            {stage === "SELF_CHECKING" && (
              <div>
                <div className="text-emerald-300 font-bold mb-1">Stage 5: Self-Checking Testbench with Golden Scoreboard</div>
                <p className="text-slate-400 text-[11px] mb-3">
                  The modern baseline: Incorporates a software reference model and automated scoreboarding. Emits `$error` or `$fatal` on mismatches. Testbenches can run overnight across 10,000 seeds with automated pass/fail reporting!
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs overflow-x-auto">
{`task check_alu(input [7:0] in_a, input [7:0] in_b, input [8:0] exp);
  @(posedge clk);
  a <= in_a; b <= in_b;
  @(posedge clk); #1;
  assert (result === exp) else $error("[FAIL] Got %h, Exp %h", result, exp);
endtask`}
                </pre>
              </div>
            )}

            {stage === "UVM_ENTERPRISE" && (
              <div>
                <div className="text-cyan-300 font-bold mb-1">Stage 6: Layered Enterprise UVM Architecture (IEEE 1800.2)</div>
                <p className="text-slate-400 text-[11px] mb-3">
                  Complete separation of concerns: Constrained-Random Sequences -&gt; Driver -&gt; Interface -&gt; Monitor -&gt; TLM Analysis Port -&gt; Scoreboard &amp; Coverage Collector. Enables Verification IP (VIP) reuse across entire chip families.
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs overflow-x-auto">
{`class alu_env extends uvm_env;
  alu_agent      m_agent;
  alu_scoreboard m_scoreboard;
  virtual function void connect_phase(uvm_phase phase);
    m_agent.m_monitor.ap.connect(m_scoreboard.analysis_export);
  endfunction
endclass`}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: IEEE 1800 Event Queue Scheduler */}
      {activeTab === "EVENT_QUEUE" && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-cyan-300 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              IEEE 1800 Stratified Event Queue Execution Order (1 Time Step)
            </span>
            <button
              type="button"
              onClick={() => setEventStep((s) => (s + 1) % eventQueueSteps.length)}
              className="px-3 py-1 rounded bg-[var(--ln-accent)] text-slate-950 font-bold hover:brightness-110 flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              Advance Event Region ({eventStep + 1}/7)
            </button>
          </div>

          <p className="text-slate-400 text-[11px]">
            Every simulation time step is divided into discrete ordered regions to prevent race conditions between RTL flip-flop updates and testbench sampling.
          </p>

          <div className="space-y-2">
            {eventQueueSteps.map((q, idx) => (
              <div
                key={q.name}
                className={`p-2.5 rounded-lg border transition-all flex items-start gap-3 ${
                  eventStep === idx
                    ? "bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : idx < eventStep
                    ? "bg-slate-900/60 border-slate-800 text-slate-400 opacity-60"
                    : "bg-slate-900/30 border-slate-900 text-slate-500"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                    eventStep === idx
                      ? "bg-cyan-400 text-slate-950 animate-pulse"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold">{q.name}</div>
                  <div className="text-[11px] text-slate-300">{q.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Coverage Taxonomy */}
      {activeTab === "COVERAGE_TAXONOMY" && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="text-cyan-300 font-bold pb-2 border-b border-slate-800">
            Comprehensive Verification Coverage Taxonomy Matrix
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Code Coverage */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                1. Structural Code Coverage
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Statement / Line:</strong> Has every line of RTL executed?
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Branch / Decision:</strong> Have all `if/else` and `case` paths evaluated true AND false?
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Expression / Condition:</strong> Have all sub-terms in boolean expressions evaluated (MCDC)?
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Toggle Coverage:</strong> Has every bit transitioned 0-&gt;1 and 1-&gt;0?
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">FSM State &amp; Transition:</strong> Have all states and legal arc transitions occurred?
                </div>
              </div>
            </div>

            {/* Functional Coverage */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                2. Functional Specification Coverage
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Coverpoints:</strong> Explicit bins tracking domain variables (addresses, opcodes, lengths).
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Cross Coverage:</strong> Multi-dimensional matrix (e.g. `cross burst_len, memory_boundary`).
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Assertion Coverage:</strong> Tracking `cover property` hits for rare corner-case sequences.
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <strong className="text-white">Verification Plan (vPlan):</strong> 100% mapping of spec requirements to test bins.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Bug Lifecycle & Tapeout Signoff */}
      {activeTab === "BUG_LIFECYCLE" && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="text-amber-300 font-bold pb-2 border-b border-slate-800 flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400" />
            Verification Bug Lifecycle &amp; Golden Tapeout Signoff Criteria
          </div>

          {/* Bug Lifecycle Steps */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
            <div className="font-bold text-cyan-300">Bug Resolution Workflow:</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-[10px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">1. Discovery (Seed FAIL)</div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">2. Minimal Reproducer</div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">3. RTL Fix by Designer</div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">4. 50k Seed Regression</div>
              <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold">5. Bug Closed</div>
            </div>
          </div>

          {/* Tapeout Checklist */}
          <div className="space-y-1.5 text-[11px]">
            <div className="font-bold text-white pt-1">Tapeout Signoff Gate Checklist:</div>
            {[
              "100% Functional Coverage across all vPlan items",
              "100% Code Coverage (Line, Branch, Toggle, FSM) with signed formal waivers",
              "Zero open Sev-1 (Data corruption/Hang) and Sev-2 defects",
              "Bug convergence plateau observed over 100,000+ random regression seeds",
              "Power-Aware Gate-Level Simulation (PA-GLS) pass with zero X-corruption",
              "Formal Equivalence Checking (LEC / Formality) clean against golden RTL",
            ].map((chk) => (
              <div key={chk} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{chk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
