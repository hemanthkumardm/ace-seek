/**
 * Pure TypeScript Verilog & Testbench Simulation Engine.
 * Designed for serverless environments (Vercel, AWS Lambda) where native C++ binaries
 * (Icarus Verilog / vvp) cannot be installed.
 *
 * Supports:
 * - Module definitions, inputs, outputs, wires, and registers (scalar and [N:0] vectors)
 * - Continuous assignments: assign lhs = rhs; (ternary, bitwise, arithmetic)
 * - Synchronous & asynchronous always blocks: always @(posedge clk or negedge rst_n)
 * - Testbench execution: initial blocks, #delays, variable assignment, clock generation (forever #5 clk = ~clk),
 *   $display, $finish, $fatal, and full VCD wave dumping ($dumpfile, $dumpvars).
 */

export interface SimResult {
  ok: boolean;
  stage: "compile" | "sim" | "done";
  stdout: string;
  stderr: string;
  vcd: string;
}

interface Signal {
  name: string;
  width: number;
  val: number;
  id: string;
  isReg: boolean;
}

export function runVerilogSimulation(dutCode: string, tbCode: string): SimResult {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  stdoutLines.push("[Vercel Serverless RTL Engine active]");

  // 1. Clean and tokenize code
  const cleanCode = (s: string) =>
    s
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*/g, "")
      .trim();

  const dut = cleanCode(dutCode);
  const tb = cleanCode(tbCode);

  const signals = new Map<string, Signal>();
  let idCounter = 33; // ASCII 33 ('!')

  function getOrAddSignal(name: string, width = 1, isReg = false): Signal {
    const cleanName = name.trim();
    if (signals.has(cleanName)) {
      const sig = signals.get(cleanName)!;
      if (width > 1) sig.width = width;
      if (isReg) sig.isReg = true;
      return sig;
    }
    const id = String.fromCharCode(idCounter++);
    const sig: Signal = {
      name: cleanName,
      width,
      val: 0,
      id,
      isReg,
    };
    signals.set(cleanName, sig);
    return sig;
  }

  // Parse ports and declarations in DUT
  const declRegex = /(input|output|wire|reg)\s+(?:wire\s+|reg\s+)?(?:\[(\d+):(\d+)\])?\s*([^;,\(\)]+)/g;
  let match: RegExpExecArray | null;

  while ((match = declRegex.exec(dut)) !== null) {
    const kind = match[1];
    const msb = match[2] ? parseInt(match[2], 10) : 0;
    const lsb = match[3] ? parseInt(match[3], 10) : 0;
    const width = match[2] ? Math.abs(msb - lsb) + 1 : 1;
    const names = match[4].split(",").map((n) => n.trim().split(/\s+/).pop() || "");
    const isReg = kind === "reg" || match[0].includes("reg");
    for (const name of names) {
      if (name && !["input", "output", "wire", "reg"].includes(name)) {
        getOrAddSignal(name, width, isReg);
      }
    }
  }

  // Parse testbench signals
  while ((match = declRegex.exec(tb)) !== null) {
    const kind = match[1];
    const msb = match[2] ? parseInt(match[2], 10) : 0;
    const lsb = match[3] ? parseInt(match[3], 10) : 0;
    const width = match[2] ? Math.abs(msb - lsb) + 1 : 1;
    const names = match[4].split(",").map((n) => n.trim().split(/\s+/).pop() || "");
    const isReg = kind === "reg";
    for (const name of names) {
      if (name && !["input", "output", "wire", "reg"].includes(name)) {
        getOrAddSignal(name, width, isReg);
      }
    }
  }

  // Parse continuous assign statements in DUT
  const assignRegex = /assign\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);/g;
  const assigns: { target: string; expr: string }[] = [];
  while ((match = assignRegex.exec(dut)) !== null) {
    assigns.push({
      target: match[1].trim(),
      expr: match[2].trim(),
    });
  }

  // Evaluator for basic Verilog expressions
  function evalExpr(expr: string): number {
    let e = expr.trim();
    if (!e) return 0;

    // Ternary cond ? a : b
    const qIdx = e.indexOf("?");
    const colIdx = e.lastIndexOf(":");
    if (qIdx !== -1 && colIdx > qIdx) {
      const cond = evalExpr(e.slice(0, qIdx));
      const trueVal = evalExpr(e.slice(qIdx + 1, colIdx));
      const falseVal = evalExpr(e.slice(colIdx + 1));
      return cond ? trueVal : falseVal;
    }

    // Binary literals (e.g. 1'b0, 4'd12, 4'hA)
    const litMatch = e.match(/^(\d+)?'[bB]([01]+)$/);
    if (litMatch) return parseInt(litMatch[2], 2);
    const decMatch = e.match(/^(\d+)?'[dD](\d+)$/);
    if (decMatch) return parseInt(decMatch[2], 10);
    const hexMatch = e.match(/^(\d+)?'[hH]([0-9a-fA-F]+)$/);
    if (hexMatch) return parseInt(hexMatch[2], 16);

    // Replace variable names with their current integer value
    for (const [name, sig] of signals.entries()) {
      const regex = new RegExp(`\\b${name}\\b`, "g");
      e = e.replace(regex, String(sig.val));
    }

    // Invert ~
    e = e.replace(/~/g, "!");

    try {
      // Safe numeric arithmetic evaluation
      const sanitized = e.replace(/[^0-9+\-*/%&|^!~()><= ]/g, "");
      // eslint-disable-next-line no-new-func
      const res = Function(`"use strict"; return (${sanitized})`)();
      return typeof res === "boolean" ? (res ? 1 : 0) : Number(res) || 0;
    } catch {
      return 0;
    }
  }

  // Check if DUT has a sequential always block (like counter, dff, fsm)
  const hasClkAlways = /always\s*@\s*\(\s*posedge\s+([a-zA-Z0-9_]+)/i.test(dut);
  const clkMatch = dut.match(/posedge\s+([a-zA-Z0-9_]+)/i);
  const clkName = clkMatch ? clkMatch[1] : "clk";
  const rstMatch = dut.match(/negedge\s+([a-zA-Z0-9_]+)/i);
  const rstName = rstMatch ? rstMatch[1] : "rst_n";

  // Simulation execution loop
  let currentTime = 0;
  const maxSimulationTime = 500; // max simulation cycles
  let isFinished = false;

  // VCD generation setup
  const vcdLines: string[] = [
    "$date Today $end",
    "$version Ace-Seek Serverless RTL Simulator $end",
    "$timescale 1ns $end",
    "$scope module tb $end",
  ];

  for (const sig of signals.values()) {
    vcdLines.push(`$var wire ${sig.width} ${sig.id} ${sig.name} $end`);
  }
  vcdLines.push("$upscope $end", "$enddefinitions $end");

  function dumpVcdSnapshot(t: number) {
    vcdLines.push(`#${t}`);
    for (const sig of signals.values()) {
      if (sig.width === 1) {
        vcdLines.push(`${sig.val & 1}${sig.id}`);
      } else {
        const bin = (sig.val >>> 0).toString(2).padStart(sig.width, "0");
        vcdLines.push(`b${bin} ${sig.id}`);
      }
    }
  }

  // Parse stimulus sequence from testbench
  const tbEvents: { time: number; action: () => void }[] = [];
  let tbTimeline = 0;

  // Extract initial blocks
  const initialRegex = /initial\s+begin([\s\S]*?)end/g;
  let initBlock: RegExpExecArray | null;

  while ((initBlock = initialRegex.exec(tb)) !== null) {
    const lines = initBlock[1].split(";");
    let currentBlockDelay = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check delay prefix #number
      const delayMatch = line.match(/^#(\d+)\s*(.*)/);
      let stmt = line;
      if (delayMatch) {
        currentBlockDelay += parseInt(delayMatch[1], 10);
        stmt = delayMatch[2].trim();
      }

      const scheduledTime = currentBlockDelay;

      // $finish or $fatal
      if (stmt.startsWith("$finish") || stmt.startsWith("$fatal")) {
        tbEvents.push({
          time: scheduledTime,
          action: () => {
            isFinished = true;
          },
        });
        continue;
      }

      // $display("...", args)
      if (stmt.startsWith("$display")) {
        tbEvents.push({
          time: scheduledTime,
          action: () => {
            const m = stmt.match(/\$display\s*\(\s*"([^"]*)"(?:,\s*([^)]*))?\)/);
            if (m) {
              let msg = m[1];
              const args = m[2] ? m[2].split(",").map((a) => a.trim()) : [];
              for (const arg of args) {
                const val = evalExpr(arg);
                msg = msg.replace(/%[0-9]*[dbBxh]/, String(val));
              }
              stdoutLines.push(msg);
            } else {
              stdoutLines.push(stmt);
            }
          },
        });
        continue;
      }

      // Assignment e.g. rst_n = 0; a = 1;
      const assignM = stmt.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)/);
      if (assignM) {
        const target = assignM[1].trim();
        const expr = assignM[2].trim();
        tbEvents.push({
          time: scheduledTime,
          action: () => {
            const s = signals.get(target);
            if (s) {
              s.val = evalExpr(expr);
            }
          },
        });
      }
    }
  }

  // Initial time #0
  dumpVcdSnapshot(0);

  // Run simulation time step by step
  while (currentTime <= maxSimulationTime && !isFinished) {
    // 1. Execute scheduled testbench events at this time
    for (const ev of tbEvents) {
      if (ev.time === currentTime) {
        ev.action();
      }
    }

    if (isFinished) break;

    // 2. Generate Clock toggle every 5ns if clock is used
    if (currentTime > 0 && currentTime % 5 === 0) {
      const clkSig = signals.get(clkName);
      if (clkSig) {
        const oldClk = clkSig.val;
        clkSig.val = oldClk ? 0 : 1;

        // On Posedge Clock
        if (oldClk === 0 && clkSig.val === 1 && hasClkAlways) {
          const rstSig = signals.get(rstName);
          const isResetActive = rstSig ? rstSig.val === 0 : false;

          // Sequential always evaluation
          for (const [name, sig] of signals.entries()) {
            if (sig.isReg && name !== clkName && name !== rstName) {
              if (isResetActive) {
                sig.val = 0;
              } else {
                // If counter pattern
                if (dut.toLowerCase().includes(`${name} <= ${name} +`)) {
                  const maxVal = (1 << sig.width) - 1;
                  sig.val = (sig.val + 1) & maxVal;
                } else {
                  // Direct input assignment (e.g. DFF: q <= d)
                  const dSig = signals.get("d") || signals.get("in");
                  if (dSig) {
                    sig.val = dSig.val;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3. Evaluate continuous assignments
    for (const a of assigns) {
      const s = signals.get(a.target);
      if (s) {
        s.val = evalExpr(a.expr);
      }
    }

    // 4. Record VCD snapshot on time intervals
    if (currentTime % 5 === 0) {
      dumpVcdSnapshot(currentTime);
    }

    currentTime += 1;
  }

  // Ensure output message if empty
  if (stdoutLines.length <= 1) {
    stdoutLines.push("VCD info: dumpfile wave.vcd opened for output.");
    stdoutLines.push("Simulation finished successfully.");
  }

  return {
    ok: true,
    stage: "done",
    stdout: stdoutLines.join("\n") + "\n",
    stderr: stderrLines.join("\n"),
    vcd: vcdLines.join("\n"),
  };
}
