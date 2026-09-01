"use client";

import React, { useState } from "react";
import { Terminal, Code, Play, CheckCircle2, AlertTriangle, FileText, RefreshCw, Server } from "lucide-react";

export function EdaScriptingStudioVisualizer({ slug }: { slug?: string }) {
  const [activeTab, setActiveTab] = useState<"tcl_shell" | "log_parser" | "farm_sim">("tcl_shell");

  // --- Tcl Shell State ---
  const [tclCmd, setTclCmd] = useState("report_timing -to [get_pins u_dsp/acc_reg*/D] -max_paths 3");
  const [tclHistory, setTclHistory] = useState<Array<{ cmd: string; output: string; time: string }>>([
    {
      cmd: "set_db design:soc_top .operating_conditions ss_0.75v_125c",
      output: "Setting operating condition to 'ss_0.75v_125c' (PDK: Sky130 / Worst-Corner)...",
      time: "0.02s",
    },
    {
      cmd: "sizeof_collection [get_cells -hier -filter \"is_sequential == true\"]",
      output: "42,850 sequential instances found in database.",
      time: "0.05s",
    },
  ]);

  // --- Regex Parser State ---
  const [regexPattern, setRegexPattern] = useState(`slack \\((VIOLATED|MET)\\)\\s+(-?\\d+\\.\\d+)`);
  const [sampleLog, setSampleLog] = useState(`Path 1: MET
  Endpoint: u_cpu/core/alu/res_reg[7]/D (rising edge-triggered flip-flop)
  Data Path Delay: 1.84 ns
  Required Time:   2.10 ns
  slack (MET)      0.26 ns

Path 2: VIOLATED
  Endpoint: u_dsp/mac/accum_reg[31]/D (rising edge-triggered flip-flop)
  Data Path Delay: 2.58 ns
  Required Time:   2.10 ns
  slack (VIOLATED) -0.48 ns

Path 3: VIOLATED
  Endpoint: u_crypto/aes/state_reg[127]/D (rising edge-triggered flip-flop)
  Data Path Delay: 2.82 ns
  Required Time:   2.10 ns
  slack (VIOLATED) -0.72 ns`);

  // --- Farm Simulator State ---
  const [farmJobs, setFarmJobs] = useState([
    { id: 10421, stage: "Synthesis", corner: "tt_0.80v_25c", mem: "8.2 GB", status: "DONE", exitCode: 0, wns: "+0.12ns" },
    { id: 10422, stage: "STA Signoff", corner: "ss_0.72v_125c", mem: "14.1 GB", status: "RUNNING", exitCode: null, wns: "-0.48ns" },
    { id: 10423, stage: "STA Signoff", corner: "ff_0.88v_-40c", mem: "13.8 GB", status: "RUNNING", exitCode: null, wns: "+0.04ns" },
    { id: 10424, stage: "LEC Equiv", corner: "Nominal", mem: "4.5 GB", status: "QUEUED", exitCode: null, wns: "--" },
  ]);

  const runTclCommand = (cmdToRun: string) => {
    let result = "";
    const clean = cmdToRun.trim();

    if (clean.includes("get_cells") && clean.includes("is_sequential")) {
      result = "42,850 sequential instances matching collection filter.";
    } else if (clean.includes("get_ports") || clean.includes("all_inputs")) {
      result = "{clk rst_n axi_awvalid axi_awaddr[31:0] axi_wdata[63:0] ... (128 ports total)}";
    } else if (clean.includes("report_timing")) {
      result = `Timing Path Report (Worst Negative Slack):
--------------------------------------------------------------------------------
Startpoint: u_dsp/mac/mul_reg[15]/CLK (clocked by clk_core)
Endpoint:   u_dsp/acc_reg[31]/D      (clocked by clk_core)
Path Group: clk_core
Path Type:  max (setup)

  Point                                           Incr       Path
  -------------------------------------------------------------------
  clock clk_core (rise edge)                      0.00       0.00
  clock network delay (ideal)                     0.15       0.15
  u_dsp/mac/mul_reg[15]/CLK                       0.00       0.15 r
  u_dsp/mac/mul_reg[15]/Q (sky130_fd_sc_hd__dfxtp_1) 0.28   0.43 f
  u_dsp/mac/u_add32/U48/Y (sky130_fd_sc_hd__nand2_2) 0.35  0.78 r
  u_dsp/mac/u_add32/U92/Y (sky130_fd_sc_hd__a21oi_2) 0.44  1.22 f
  u_dsp/acc_reg[31]/D (sky130_fd_sc_hd__dfxtp_1)   0.22     1.44 r
  data arrival time                                          1.44

  clock clk_core (rise edge)                      1.00       1.00
  clock network delay (ideal)                     0.15       1.15
  clock uncertainty                              -0.08       1.07
  u_dsp/acc_reg[31]/CLK                           0.00       1.07 r
  library setup time                             -0.12       0.95
  data required time                                         0.95
  -------------------------------------------------------------------
  data required time                                         0.95
  data arrival time                                         -1.44
  -------------------------------------------------------------------
  slack (VIOLATED)                                          -0.49 ns`;
    } else if (clean.includes("sizeof_collection")) {
      result = "Collection size: 12,480 items.";
    } else if (clean.startsWith("set ")) {
      result = clean.split(" ")[1] + " => " + clean.split(" ")[2];
    } else {
      result = `[Tcl Interpreter] Executed: ${clean} (Status: OK, Return: 0)`;
    }

    setTclHistory((prev) => [...prev, { cmd: clean, output: result, time: "0.04s" }]);
  };

  // Evaluate Regex Parsing
  const getParsedResults = () => {
    try {
      const regex = new RegExp(regexPattern, "g");
      const matches = [];
      let match;
      while ((match = regex.exec(sampleLog)) !== null) {
        matches.push({
          full: match[0],
          status: match[1] || "N/A",
          slack: match[2] || "N/A",
          index: match.index,
        });
      }
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  };

  const parsed = getParsedResults();

  return (
    <div className="w-full rounded-2xl border border-[var(--ln-border)] bg-[#0a0d14]/90 backdrop-blur-xl p-5 shadow-2xl space-y-6 my-6 text-[var(--ln-text)]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--ln-border)]/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              EDA Scripting & Farm Studio
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                Tcl • Bash • Python • Perl
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Interactive Tcl Collections Engine, Automated Log Harvester & Compute Farm Simulator
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#121722] p-1 rounded-xl border border-[var(--ln-border)]">
          <button
            onClick={() => setActiveTab("tcl_shell")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "tcl_shell"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            1. Tcl EDA Shell
          </button>
          <button
            onClick={() => setActiveTab("log_parser")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "log_parser"
                ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            2. Python Log Harvester
          </button>
          <button
            onClick={() => setActiveTab("farm_sim")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "farm_sim"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            3. LSF/Slurm Farm Wrapper
          </button>
        </div>
      </div>

      {/* TAB 1: Tcl EDA Shell Simulator */}
      {activeTab === "tcl_shell" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setTclCmd("report_timing -to [get_pins u_dsp/acc_reg*/D] -max_paths 3");
                runTclCommand("report_timing -to [get_pins u_dsp/acc_reg*/D] -max_paths 3");
              }}
              className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 text-left transition-all group"
            >
              <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                <span>report_timing</span>
                <Play className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">
                report_timing -to [get_pins u_dsp/acc_reg*/D]
              </p>
            </button>

            <button
              onClick={() => {
                setTclCmd("sizeof_collection [get_cells -hier -filter \"is_sequential == true\"]");
                runTclCommand("sizeof_collection [get_cells -hier -filter \"is_sequential == true\"]");
              }}
              className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 hover:bg-indigo-950/40 text-left transition-all group"
            >
              <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                <span>Filter Sequential Cells</span>
                <Play className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">
                get_cells -hier -filter "is_sequential"
              </p>
            </button>

            <button
              onClick={() => {
                setTclCmd("all_inputs -no_clocks");
                runTclCommand("all_inputs -no_clocks");
              }}
              className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-950/40 text-left transition-all group"
            >
              <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                <span>all_inputs Collection</span>
                <Play className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">
                all_inputs -no_clocks
              </p>
            </button>
          </div>

          {/* Console Window */}
          <div className="rounded-xl border border-[#2a364f] bg-[#07090e] p-4 font-mono text-xs shadow-inner space-y-3">
            <div className="flex items-center justify-between text-gray-500 text-[11px] border-b border-[#1b2333] pb-2">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                <span className="text-gray-400 ml-1">OpenSTA / PrimeTime Tcl Interactive Console</span>
              </span>
              <button
                onClick={() => setTclHistory([])}
                className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 text-[10px]"
              >
                <RefreshCw className="w-3 h-3" /> Clear Console
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {tclHistory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-cyan-400 flex items-center gap-1.5">
                    <span className="text-gray-500 font-bold">sta_top%</span>
                    <span className="font-semibold">{item.cmd}</span>
                    <span className="text-gray-600 text-[10px] ml-auto">[{item.time}]</span>
                  </div>
                  <pre className="text-gray-300 pl-4 whitespace-pre-wrap leading-relaxed text-[11px] border-l-2 border-cyan-500/20">
                    {item.output}
                  </pre>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tclCmd.trim()) {
                  runTclCommand(tclCmd);
                }
              }}
              className="flex items-center gap-2 pt-2 border-t border-[#1b2333]"
            >
              <span className="text-cyan-400 font-bold">sta_top%</span>
              <input
                type="text"
                value={tclCmd}
                onChange={(e) => setTclCmd(e.target.value)}
                placeholder="Type EDA Tcl command (e.g. report_timing, get_ports *clk*)..."
                className="flex-1 bg-transparent text-white focus:outline-none placeholder-gray-600 text-xs"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Play className="w-3 h-3" /> Run
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Python / Regex Log Harvester */}
      {activeTab === "log_parser" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-bold text-fuchsia-300 flex items-center justify-between">
              <span>Python Regex Pattern (Log Harvester):</span>
              <span className="text-[10px] text-gray-400 font-mono">re.finditer(pattern, log)</span>
            </label>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              className="w-full font-mono text-xs p-3 rounded-xl bg-[#07090e] border border-fuchsia-500/40 text-fuchsia-300 focus:outline-none focus:border-fuchsia-400"
            />

            <label className="text-xs font-bold text-gray-400 block pt-1">
              Raw EDA Timing Report Log (Input Stream):
            </label>
            <textarea
              rows={9}
              value={sampleLog}
              onChange={(e) => setSampleLog(e.target.value)}
              className="w-full font-mono text-[11px] p-3 rounded-xl bg-[#07090e] border border-[var(--ln-border)] text-gray-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span>Extracted QoR Timing DataFrame / JSON:</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                {parsed.matches.length} Violations Captured
              </span>
            </label>

            <div className="rounded-xl border border-[#2a364f] bg-[#07090e] p-3 font-mono text-xs max-h-[310px] overflow-y-auto space-y-2">
              {parsed.error ? (
                <div className="text-red-400 p-2 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Regex Error: {parsed.error}
                </div>
              ) : parsed.matches.length === 0 ? (
                <div className="text-gray-500 text-center py-10">No pattern matches found in log.</div>
              ) : (
                parsed.matches.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                      m.status === "VIOLATED"
                        ? "bg-red-950/20 border-red-500/30 text-red-300"
                        : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            m.status === "VIOLATED" ? "bg-red-400" : "bg-emerald-400"
                          }`}
                        />
                        Path #{idx + 1}: Status = {m.status}
                      </span>
                      <span className="font-mono text-xs">{m.slack} ns</span>
                    </div>
                    <div className="text-[10px] opacity-75 font-mono">Matched: "{m.full}"</div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-[#121722] border border-[var(--ln-border)] text-[11px] text-gray-400 flex items-center justify-between">
              <span>Automated Signoff Verdict:</span>
              {parsed.matches.some((m) => m.status === "VIOLATED") ? (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> REJECT (Timing Violations Found)
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASS (All Paths Met)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Farm Wrapper & LSF/Slurm Simulator */}
      {activeTab === "farm_sim" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-cyan-950/10 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="text-cyan-300 font-mono">
              <span className="text-gray-400">Wrapper: </span>
              set -euo pipefail; bsub -q sta_high -n 8 -R "rusage[mem=32G]" -o logs/job_%J.log
            </div>
            <button
              onClick={() => {
                setFarmJobs((prev) =>
                  prev.map((j) => (j.status === "RUNNING" ? { ...j, status: "DONE", exitCode: 0 } : j))
                );
              }}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Simulate Farm Finish
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border border-[var(--ln-border)] rounded-xl overflow-hidden">
              <thead className="bg-[#121722] text-gray-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-left">Job ID</th>
                  <th className="p-2.5 text-left">EDA Flow Stage</th>
                  <th className="p-2.5 text-left">MMMC Corner</th>
                  <th className="p-2.5 text-left">Memory</th>
                  <th className="p-2.5 text-left">Status</th>
                  <th className="p-2.5 text-left">Exit Code</th>
                  <th className="p-2.5 text-left">Worst Slack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ln-border)] bg-[#07090e]">
                {farmJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#121722]/50 transition-colors">
                    <td className="p-2.5 text-cyan-400 font-bold">#{job.id}</td>
                    <td className="p-2.5 text-white">{job.stage}</td>
                    <td className="p-2.5 text-gray-400">{job.corner}</td>
                    <td className="p-2.5 text-gray-300">{job.mem}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.status === "DONE"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : job.status === "RUNNING"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse"
                            : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {job.exitCode !== null ? (
                        <span className="text-emerald-400 font-bold">rc={job.exitCode}</span>
                      ) : (
                        <span className="text-gray-500">pending</span>
                      )}
                    </td>
                    <td
                      className={`p-2.5 font-bold ${
                        job.wns.startsWith("-") ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {job.wns}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
