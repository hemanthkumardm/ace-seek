"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Boxes,
} from "lucide-react";

export type SvTab = "SVA_TIMING" | "UVM_HIERARCHY" | "PACKED_TYPES" | "CRV";

export function SvVisualizer({ initialTab = "SVA_TIMING" }: { initialTab?: SvTab }) {
  const [tab, setTab] = useState<SvTab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  // --- Tab 1: SVA Concurrent Property Simulation States ---
  // Property: req |-> ##[1:2] ack
  // When req is 1 at cycle T, ack must be 1 at cycle T+1 OR T+2.
  const [cycle, setCycle] = useState<number>(0);
  const [reqInput, setReqInput] = useState<0 | 1>(1);
  const [ackInput, setAckInput] = useState<0 | 1>(0);

  type SvaCycleRecord = {
    cycle: number;
    req: number;
    ack: number;
    svaStatus: "VACUOUS_PASS" | "EVALUATING" | "PASS" | "FAIL";
    desc: string;
  };

  const [svaHistory, setSvaHistory] = useState<SvaCycleRecord[]>([
    { cycle: 0, req: 0, ack: 0, svaStatus: "VACUOUS_PASS", desc: "No req (antecedent false ➔ vacuous pass)" },
  ]);

  const [pendingReqCycle, setPendingReqCycle] = useState<number | null>(null);

  const stepSva = () => {
    const nextCycle = cycle + 1;
    let status: "VACUOUS_PASS" | "EVALUATING" | "PASS" | "FAIL" = "VACUOUS_PASS";
    let desc = "req=0 (Antecedent inactive ➔ vacuous pass)";
    let nextPending = pendingReqCycle;

    if (pendingReqCycle !== null) {
      const elapsed = nextCycle - pendingReqCycle;
      if (ackInput === 1) {
        status = "PASS";
        desc = `✓ Ack arrived in ${elapsed} cycle(s) (satisfies ##[1:2])`;
        nextPending = reqInput === 1 ? nextCycle : null;
      } else if (elapsed >= 2) {
        status = "FAIL";
        desc = `❌ Protocol Violation! Ack failed to assert within 2 cycles of Req (cycle #${pendingReqCycle})`;
        nextPending = reqInput === 1 ? nextCycle : null;
      } else {
        status = "EVALUATING";
        desc = `⏳ Evaluating: Req occurred at #${pendingReqCycle}. Waiting for Ack on cycle #${pendingReqCycle + 2}`;
        if (reqInput === 1) nextPending = pendingReqCycle; // Keep original pending
      }
    } else {
      if (reqInput === 1) {
        nextPending = nextCycle;
        status = "EVALUATING";
        desc = `🚀 Antecedent Triggered: Req=1 at cycle #${nextCycle}. Property expects Ack in [1..2] cycles.`;
      }
    }

    setPendingReqCycle(nextPending);
    setCycle(nextCycle);
    setSvaHistory((prev) => [
      ...prev.slice(-9),
      { cycle: nextCycle, req: reqInput, ack: ackInput, svaStatus: status, desc },
    ]);
  };

  const resetSva = () => {
    setCycle(0);
    setPendingReqCycle(null);
    setSvaHistory([
      { cycle: 0, req: 0, ack: 0, svaStatus: "VACUOUS_PASS", desc: "Simulation reset to cycle #0." },
    ]);
  };

  // --- Tab 2: UVM Hierarchy States ---
  const [selectedUvmNode, setSelectedUvmNode] = useState<string>("driver");
  const [uvmPhase, setUvmPhase] = useState<"BUILD" | "CONNECT" | "RUN" | "CHECK">("RUN");

  // Packed struct parser (matches sv-standard-practical)
  const [src, setSrc] = useState(0x11);
  const [dst, setDst] = useState(0x22);
  const [len, setLen] = useState(0x08);
  const [csum, setCsum] = useState(0x3b);
  const packedWord = ((src & 0xff) << 24) | ((dst & 0xff) << 16) | ((len & 0xff) << 8) | (csum & 0xff);
  const csumOk = ((src ^ dst ^ len) & 0xff) === (csum & 0xff);

  // CRV / coverage
  const [randMode, setRandMode] = useState<"rand" | "randc">("randc");
  const [samples, setSamples] = useState<number[]>([]);
  const [cyclePool, setCyclePool] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
  const bins = [
    { name: "low", lo: 0, hi: 3 },
    { name: "high", lo: 4, hi: 7 },
  ];

  const randomize = () => {
    let next: number;
    if (randMode === "rand") {
      next = Math.floor(Math.random() * 8);
    } else {
      let pool = cyclePool;
      if (pool.length === 0) pool = [0, 1, 2, 3, 4, 5, 6, 7];
      const idx = Math.floor(Math.random() * pool.length);
      next = pool[idx];
      setCyclePool(pool.filter((_, i) => i !== idx));
    }
    setSamples((prev) => [...prev.slice(-15), next]);
  };

  const uvmNodeDetails: Record<
    string,
    { title: string; type: string; role: string; tlm: string; code: string }
  > = {
    test: {
      title: "uvm_test (base_test)",
      type: "Top-Level Test Class",
      role: "Instantiates the root verification environment (env), configures factory overrides, and starts top-level sequences.",
      tlm: "Contains environment configuration objects.",
      code: `class base_test extends uvm_test;
  my_env env;
  function void build_phase(uvm_phase phase);
    env = my_env::type_id::create("env", this);
  endfunction
  task run_phase(uvm_phase phase);
    my_seq seq = my_seq::type_id::create("seq");
    phase.raise_objection(this);
    seq.start(env.agent.sequencer);
    phase.drop_objection(this);
  endtask
endclass`,
    },
    env: {
      title: "uvm_env (my_env)",
      type: "Verification Environment",
      role: "Aggregates reusable agents, register abstraction layer (RAL) models, and scoreboards into a unified subsystem testbench.",
      tlm: "Connects Agent analysis ports to Scoreboard analysis exports.",
      code: `class my_env extends uvm_env;
  my_agent      agent;
  my_scoreboard scoreboard;
  function void connect_phase(uvm_phase phase);
    agent.monitor.item_collected_port.connect(scoreboard.item_collected_export);
  endfunction
endclass`,
    },
    agent: {
      title: "uvm_agent (axi_agent)",
      type: "Interface Agent Container",
      role: "Encapsulates the protocol Sequencer, Driver, and Monitor. Can be configured as ACTIVE (Drives DUT) or PASSIVE (Monitor only).",
      tlm: "Driver connects to Sequencer TLM port; Monitor exports transactions.",
      code: `class my_agent extends uvm_agent;
  my_driver    driver;
  my_sequencer sequencer;
  my_monitor   monitor;
  function void connect_phase(uvm_phase phase);
    if (get_is_active() == UVM_ACTIVE)
      driver.seq_item_port.connect(sequencer.seq_item_export);
  endfunction
endclass`,
    },
    driver: {
      title: "uvm_driver (axi_driver)",
      type: "Protocol BFM Driver",
      role: "Pulls abstract transaction sequence items from the Sequencer, unpacks fields, and drives physical pin-level signals on the Virtual Interface (vif).",
      tlm: "`seq_item_port.get_next_item(req)` / `item_done()`",
      code: `class my_driver extends uvm_driver #(my_trans);
  virtual my_if vif;
  task run_phase(uvm_phase phase);
    forever begin
      seq_item_port.get_next_item(req);
      @(posedge vif.clk);
      vif.valid <= 1'b1;
      vif.data  <= req.payload;
      seq_item_port.item_done();
    end
  endtask
endclass`,
    },
    monitor: {
      title: "uvm_monitor (axi_monitor)",
      type: "Passive Observer",
      role: "Passively samples DUT interface pins on clock edges, constructs transaction packets, and broadcasts them out via a TLM Analysis Port (`uvm_analysis_port`).",
      tlm: "`analysis_port.write(trans)` broadcast to Scoreboard & Coverage.",
      code: `class my_monitor extends uvm_monitor;
  uvm_analysis_port #(my_trans) ap;
  virtual my_if vif;
  task run_phase(uvm_phase phase);
    forever @(posedge vif.clk) begin
      if (vif.valid && vif.ready) begin
        my_trans tr = my_trans::type_id::create("tr");
        tr.payload = vif.data;
        ap.write(tr);
      end
    end
  endtask
endclass`,
    },
    scoreboard: {
      title: "uvm_scoreboard (my_scoreboard)",
      type: "Self-Checking Checker",
      role: "Receives transactions from monitors, computes expected responses using a reference model, and performs automated end-to-end data integrity checks.",
      tlm: "`uvm_analysis_imp` receives sampled transactions.",
      code: `class my_scoreboard extends uvm_scoreboard;
  uvm_analysis_imp #(my_trans, my_scoreboard) item_export;
  function void write(my_trans tr);
    if (tr.payload !== expected_queue.pop_front())
      \`uvm_error("SCBD", "Payload mismatch!")
  endfunction
endclass`,
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
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              SystemVerilog Assertions (SVA) &amp; UVM Verification Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              IEEE 1800 SystemVerilog: Temporal Properties ({'|->'}), Implication, and UVM Component Architecture
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(
            [
              ["SVA_TIMING", "SVA"],
              ["PACKED_TYPES", "Packed types"],
              ["CRV", "CRV & coverage"],
              ["UVM_HIERARCHY", "UVM"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                tab === id
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "SVA_TIMING" && (
        <div className="space-y-4">
          {/* SVA Formula Banner */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Tested SVA Property:</span>
              <code className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {"property p_handshake; @(posedge clk) req |-> ##[1:2] ack; endproperty"}
              </code>
            </div>
            <span className="text-[10px] text-amber-400">{"Overlapped Implication (|->)"}</span>
          </div>

          {/* Interactive Stimulus Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Req Pin */}
            <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--ln-muted)] uppercase">1. Request (req)</span>
                <span className="font-mono font-bold text-xs text-cyan-400">req = {reqInput}</span>
              </div>
              <button
                type="button"
                onClick={() => setReqInput((v) => (v === 1 ? 0 : 1))}
                className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  reqInput === 1
                    ? "bg-cyan-400 text-slate-950 shadow-sm hover:brightness-110"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                Set Next req: {reqInput === 1 ? "HIGH (1)" : "LOW (0)"}
              </button>
            </div>

            {/* Ack Pin */}
            <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--ln-muted)] uppercase">2. Acknowledge (ack)</span>
                <span className="font-mono font-bold text-xs text-emerald-400">ack = {ackInput}</span>
              </div>
              <button
                type="button"
                onClick={() => setAckInput((v) => (v === 1 ? 0 : 1))}
                className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  ackInput === 1
                    ? "bg-emerald-400 text-slate-950 shadow-sm hover:brightness-110"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                Set Next ack: {ackInput === 1 ? "HIGH (1)" : "LOW (0)"}
              </button>
            </div>

            {/* Clock Step Trigger */}
            <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--ln-muted)] uppercase">3. Simulation Clock</span>
                <span className="font-mono font-bold text-xs text-[var(--ln-accent)]">Cycle #{cycle}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetSva}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--ln-border)] hover:bg-[var(--ln-hover)] text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={stepSva}
                  className="flex-1 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110"
                >
                  <Play className="w-3.5 h-3.5" />
                  Clock Edge (posedge clk)
                </button>
              </div>
            </div>
          </div>

          {/* SVA Cycle History Timeline & Evaluation Trace */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>SVA Evaluation History &amp; Assertion Verdicts</span>
              <span className="text-cyan-400">Formal Multi-Threaded Property Tracker</span>
            </div>

            <div className="space-y-1.5 overflow-x-auto">
              {svaHistory.map((item, idx) => {
                const isFail = item.svaStatus === "FAIL";
                const isPass = item.svaStatus === "PASS";
                const isEvaluating = item.svaStatus === "EVALUATING";

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border flex items-center justify-between gap-3 text-[11px] transition-all ${
                      isFail
                        ? "border-rose-500/80 bg-rose-950/50 text-rose-200"
                        : isPass
                        ? "border-emerald-500/80 bg-emerald-950/40 text-emerald-200"
                        : isEvaluating
                        ? "border-amber-500/80 bg-amber-950/30 text-amber-200"
                        : "border-slate-800 bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-400">Cycle #{item.cycle}:</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                        req={item.req}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">
                        ack={item.ack}
                      </span>
                    </div>

                    <div className="flex-1 text-[11px] truncate">{item.desc}</div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        isFail
                          ? "bg-rose-900 text-rose-100 animate-pulse font-black"
                          : isPass
                          ? "bg-emerald-900 text-emerald-200"
                          : isEvaluating
                          ? "bg-amber-900 text-amber-200"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.svaStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "UVM_HIERARCHY" && (
        <div className="space-y-4">
          {/* UVM Phase Selector Bar */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="text-slate-400 uppercase font-bold text-[10px]">UVM Execution Phases:</span>
            <div className="flex items-center gap-1.5">
              {(["BUILD", "CONNECT", "RUN", "CHECK"] as const).map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setUvmPhase(ph)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    uvmPhase === ph
                      ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {ph.toLowerCase()}_phase
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Hierarchy Diagram & Code Inspector */}
          <div className="grid md:grid-cols-12 gap-4">
            {/* Left: UVM Tree Nodes */}
            <div className="md:col-span-5 space-y-2 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold px-1">
                Select Testbench Component:
              </div>
              {(["test", "env", "agent", "driver", "monitor", "scoreboard"] as const).map((nodeKey) => {
                const node = uvmNodeDetails[nodeKey];
                const isSelected = selectedUvmNode === nodeKey;

                return (
                  <button
                    key={nodeKey}
                    type="button"
                    onClick={() => setSelectedUvmNode(nodeKey)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-[var(--ln-accent)] bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] shadow-sm font-bold"
                        : "border-[var(--ln-border)] bg-[var(--ln-bg)] text-[var(--ln-text)] opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>{node.title}</span>
                    </div>
                    <span className="text-[10px] text-[var(--ln-muted)] uppercase">
                      {nodeKey}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Component Detail Card & SystemVerilog Source */}
            <div className="md:col-span-7 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-cyan-300 text-sm">
                  {uvmNodeDetails[selectedUvmNode].title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {uvmNodeDetails[selectedUvmNode].type}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                {uvmNodeDetails[selectedUvmNode].role}
              </p>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-300">
                <span className="text-slate-400 font-bold">TLM Port / Transaction Binding:</span>{" "}
                {uvmNodeDetails[selectedUvmNode].tlm}
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">
                  SystemVerilog Source Pattern:
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                  {uvmNodeDetails[selectedUvmNode].code}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "PACKED_TYPES" && (
        <div className="space-y-4 font-mono text-xs">
          <p className="text-[11px] font-sans text-[var(--ln-muted)]">
            A packed struct is one bit-vector. Assigning <code>header = raw_data</code> unpacks fields in declaration order (MSB first).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ["src_addr", src, setSrc],
                ["dest_addr", dst, setDst],
                ["length", len, setLen],
                ["checksum", csum, setCsum],
              ] as const
            ).map(([name, val, set]) => (
              <label key={name} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400">{name}</div>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={val}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-cyan-300">0x{val.toString(16).padStart(2, "0").toUpperCase()}</div>
              </label>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>32-bit word layout</span>
              <span className="text-cyan-300">0x{packedWord.toString(16).padStart(8, "0").toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-black">
              <div className="p-2 rounded bg-cyan-950 border border-cyan-700 text-cyan-200">
                src
                <div>{src.toString(16).padStart(2, "0")}</div>
              </div>
              <div className="p-2 rounded bg-emerald-950 border border-emerald-700 text-emerald-200">
                dest
                <div>{dst.toString(16).padStart(2, "0")}</div>
              </div>
              <div className="p-2 rounded bg-amber-950 border border-amber-700 text-amber-200">
                len
                <div>{len.toString(16).padStart(2, "0")}</div>
              </div>
              <div className={`p-2 rounded border ${csumOk ? "bg-emerald-950 border-emerald-500 text-emerald-200" : "bg-rose-950 border-rose-500 text-rose-200"}`}>
                csum
                <div>{csum.toString(16).padStart(2, "0")}</div>
              </div>
            </div>
            <div className={csumOk ? "text-emerald-400" : "text-rose-400"}>
              checksum_valid = (src ^ dest ^ len) == checksum → {csumOk ? "1 PASS" : "0 FAIL"}
              {" "}(expect 0x{((src ^ dst ^ len) & 0xff).toString(16).padStart(2, "0")})
            </div>
          </div>
        </div>
      )}

      {tab === "CRV" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRandMode("rand");
                setCyclePool([0, 1, 2, 3, 4, 5, 6, 7]);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold ${randMode === "rand" ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}
            >
              rand (with replacement)
            </button>
            <button
              type="button"
              onClick={() => {
                setRandMode("randc");
                setCyclePool([0, 1, 2, 3, 4, 5, 6, 7]);
                setSamples([]);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold ${randMode === "randc" ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}
            >
              randc (cyclic, no repeat)
            </button>
            <button
              type="button"
              onClick={randomize}
              className="px-3 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> randomize()
            </button>
            <button
              type="button"
              onClick={() => {
                setSamples([]);
                setCyclePool([0, 1, 2, 3, 4, 5, 6, 7]);
              }}
              className="px-2 py-1.5 rounded-lg border border-[var(--ln-border)]"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase text-slate-400 font-bold mb-2">Last samples (addr 0..7)</div>
            <div className="flex flex-wrap gap-1">
              {samples.length === 0 && <span className="text-slate-500">Click randomize()</span>}
              {samples.map((s, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded font-black ${
                    i === samples.length - 1 ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {bins.map((b) => {
              const hits = samples.filter((s) => s >= b.lo && s <= b.hi).length;
              const pct = samples.length ? Math.round((hits / samples.length) * 100) : 0;
              return (
                <div key={b.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>
                      coverpoint addr · bins {b.name} = [{b.lo}:{b.hi}]
                    </span>
                    <span className="text-emerald-400">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{hits} hits / {samples.length} samples</div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] font-sans text-[var(--ln-muted)]">
            <code>randc</code> walks the domain without repeats until it is exhausted, then starts a new permutation.
            Functional coverage bins tell you whether both the low and high address ranges were hit — code coverage would not.
          </p>
        </div>
      )}

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 SystemVerilog Verification Guide: Assertions (SVA) &amp; UVM Testbench Architecture
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: SVA Concurrent Properties */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>1. SVA Implication Operators</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>Overlapped ({'|->'}):</strong> If antecedent is true at cycle T, consequent is evaluated starting at cycle T.<br />
              <strong>Non-Overlapped ({'|=>'}):</strong> Consequent is evaluated on the <em>next</em> clock cycle (T+1).<br />
              <strong>Vacuous Pass:</strong> If the antecedent is false, the property trivially passes without spawning evaluation threads.
            </p>
          </div>

          {/* Column 2: Repetition & Timing Ranges */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>2. Range Windows (##[min:max])</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Real-world protocols (AXI, PCIe) allow variable latency. <code>{"req |-> ##[1:2] ack"}</code> allows <code>ack</code> to assert on cycle T+1 or T+2. If <code>ack</code> remains 0 on cycle T+2, a formal protocol violation is logged.
            </p>
          </div>

          {/* Column 3: UVM Testbench Architecture */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <span>3. UVM Phasing &amp; TLM</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              UVM coordinates simulation execution across 9 standard phases. <strong>`build_phase`</strong> constructs hierarchy top-down, <strong>`connect_phase`</strong> wires TLM analysis ports bottom-up, and <strong>`run_phase`</strong> executes concurrent time-consuming stimulus.
            </p>
          </div>
        </div>

        {/* Interactive Try-It-Yourself Checklist */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1.5">
          <div className="font-bold text-cyan-400 uppercase text-[10px]">
            🧪 Interactive Experiments to Try:
          </div>
          <ul className="space-y-1 text-slate-300 list-disc list-inside">
            <li>
              <strong>Trigger Protocol Violation (FAIL):</strong> Set <em>req = HIGH</em> and click <em>Clock Edge</em>. Leave <em>ack = LOW</em> for 2 consecutive cycles. Watch SVA immediately catch the protocol timeout!
            </li>
            <li>
              <strong>Verify Valid Handshake (PASS):</strong> Set <em>req = HIGH</em>, advance 1 cycle, set <em>ack = HIGH</em>, and click <em>Clock Edge</em>. Observe the green assertion pass.
            </li>
            <li>
              <strong>Explore UVM Hierarchy:</strong> Switch to the <em>UVM Testbench Architecture</em> tab and click through <code>uvm_driver</code>, <code>uvm_monitor</code>, and <code>uvm_scoreboard</code> to inspect TLM bindings.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
