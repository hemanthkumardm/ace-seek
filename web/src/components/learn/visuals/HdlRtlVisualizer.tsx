"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Cpu, Play, RotateCcw, Layers, MemoryStick, GitMerge, ArrowRightLeft } from "lucide-react";

export type HdlRtlTab = "counter" | "generate" | "sram" | "resource_sharing" | "handshake";

export function HdlRtlVisualizer({ initialTab = "counter" }: { initialTab?: HdlRtlTab }) {
  const [tab, setTab] = useState<HdlRtlTab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  return (
    <div
      className="ln-card p-5 my-6 overflow-hidden rounded-xl"
      style={{ background: "var(--ln-bg-elev)", border: "1px solid var(--ln-border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">Verilog RTL Lab — Hardware you can step</h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Counter, generate unroll, SRAM inference, resource sharing, and a valid/ready skid buffer
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(
            [
              ["counter", "Counter"],
              ["generate", "Generate"],
              ["sram", "SRAM"],
              ["resource_sharing", "Shared ALU"],
              ["handshake", "Skid buffer"],
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

      {tab === "counter" && <CounterLab />}
      {tab === "generate" && <GenerateLab />}
      {tab === "sram" && <SramLab />}
      {tab === "resource_sharing" && <ResourceShareLab />}
      {tab === "handshake" && <SkidLab />}

      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">What this lab is showing</h4>
        <p className="text-[11px] leading-relaxed text-[var(--ln-muted)]">
          {tab === "counter" &&
            "Priority is reset → load → count. Async rst_n clears immediately (no clock). load overwrites enable. en + up_down only run when load is 0. Same template as the 8-bit loadable counter practical."}
          {tab === "generate" &&
            "generate for unrolls at elaboration — it is not a runtime loop. lowest req bit wins; grant is one-hot (req & -req). Change WIDTH and watch the instance names gen_pri[i] appear."}
          {tab === "sram" &&
            "ASIC SRAMs are synchronous. dout updates on the clock, not combinationally. Never reset the array — that explodes into flip-flops. Read-during-write here returns the OLD word (write-first is a different coding style)."}
          {tab === "resource_sharing" &&
            "if (sel) y = a+b; else y = c+d; can infer TWO adders. Mux the inputs first, then ONE adder. Same result, ~half the arithmetic area. Toggle naive vs factored and watch the gate budget."}
          {tab === "handshake" &&
            "s_ready = !skid_valid. When downstream stalls (m_ready=0) the extra register catches the in-flight beat so you still do 1 transfer/cycle when the stall lifts — no combinational ready loop."}
        </p>
      </div>
    </div>
  );
}

function Bit({ v, label }: { v: number; label?: string }) {
  return (
    <div
      className={`min-w-[1.75rem] px-1.5 py-1 rounded text-center font-mono text-xs font-black border ${
        v ? "bg-emerald-500 text-slate-950 border-emerald-300" : "bg-slate-800 text-slate-300 border-slate-700"
      }`}
    >
      {label ? <div className="text-[8px] font-semibold opacity-80">{label}</div> : null}
      {v}
    </div>
  );
}

function CounterLab() {
  const [q, setQ] = useState(0);
  const [rstN, setRstN] = useState(1);
  const [load, setLoad] = useState(0);
  const [en, setEn] = useState(1);
  const [up, setUp] = useState(1);
  const [dataIn, setDataIn] = useState(5);
  const [log, setLog] = useState<string[]>(["Idle. Step the clock — or drop rst_n with no clock."]);

  const bits = useMemo(() => Array.from({ length: 8 }, (_, i) => (q >> (7 - i)) & 1), [q]);

  const resetAsync = () => {
    setRstN(0);
    setQ(0);
    setLog((p) => [...p.slice(-5), "rst_n=0 → q<=0 immediately (async, no clock needed)"]);
  };

  const step = () => {
    if (rstN === 0) {
      setQ(0);
      setLog((p) => [...p.slice(-5), "Clock while reset: q stays 0"]);
      return;
    }
    if (load) {
      setQ(dataIn & 0xff);
      setLog((p) => [...p.slice(-5), `load=1 wins over en → q<=data_in (${dataIn})`]);
      return;
    }
    if (en) {
      const next = up ? (q + 1) & 0xff : (q - 1) & 0xff;
      setQ(next);
      setLog((p) => [...p.slice(-5), `en=1 up_down=${up} → q<=${next}`]);
      return;
    }
    setLog((p) => [...p.slice(-5), "en=0 and load=0 → hold"]);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => (rstN ? resetAsync() : (setRstN(1), setLog((p) => [...p.slice(-5), "rst_n released"])))}
          className={`py-2 rounded-lg font-bold ${rstN ? "bg-slate-800 text-slate-200" : "bg-rose-500 text-slate-950"}`}
        >
          rst_n = {rstN}
        </button>
        <button
          type="button"
          onClick={() => setLoad((v) => (v ? 0 : 1))}
          className={`py-2 rounded-lg font-bold ${load ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-200"}`}
        >
          load = {load}
        </button>
        <button
          type="button"
          onClick={() => setEn((v) => (v ? 0 : 1))}
          className={`py-2 rounded-lg font-bold ${en ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-200"}`}
        >
          en = {en}
        </button>
        <button
          type="button"
          onClick={() => setUp((v) => (v ? 0 : 1))}
          className={`py-2 rounded-lg font-bold ${up ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-200"}`}
        >
          up_down = {up} ({up ? "UP" : "DOWN"})
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[var(--ln-muted)]">
          data_in
          <input
            type="range"
            min={0}
            max={255}
            value={dataIn}
            onChange={(e) => setDataIn(Number(e.target.value))}
            className="ml-2 align-middle"
          />
          <span className="ml-2 text-cyan-300">{dataIn}</span>
        </label>
        <button
          type="button"
          onClick={step}
          className="px-3 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" /> posedge clk
        </button>
        <button
          type="button"
          onClick={() => {
            setQ(0);
            setRstN(1);
            setLoad(0);
            setEn(1);
            setUp(1);
            setLog(["Reset lab"]);
          }}
          className="px-2 py-1.5 rounded-lg border border-[var(--ln-border)] flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase text-slate-400 font-bold">
          <span>q[7:0] = {q} (0x{q.toString(16).toUpperCase().padStart(2, "0")})</span>
          <span className="text-cyan-400">Priority: rst_n → load → en</span>
        </div>
        <div className="flex gap-1">
          {bits.map((b, i) => (
            <Bit key={i} v={b} label={`b${7 - i}`} />
          ))}
        </div>
      </div>
      <ul className="text-[11px] text-slate-300 space-y-0.5 font-sans">
        {log.map((line, i) => (
          <li key={i}>· {line}</li>
        ))}
      </ul>
    </div>
  );
}

function GenerateLab() {
  const [width, setWidth] = useState(4);
  const [req, setReq] = useState(0b0101);

  const masked = req & ((1 << width) - 1);
  const grant = masked & -masked; // lowest-set-bit isolation
  const valid = masked !== 0;

  const rows = Array.from({ length: width }, (_, i) => {
    const r = (masked >> i) & 1;
    const higher = masked & ((1 << i) - 1);
    const g = (grant >> i) & 1;
    return { i, r, higher: higher !== 0 ? 1 : 0, g, name: `gen_pri[${i}]` };
  });

  const toggle = (i: number) => setReq((v) => v ^ (1 << i));

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <Layers className="w-4 h-4 text-[var(--ln-accent)]" />
        <span className="text-[var(--ln-muted)]">WIDTH</span>
        {[2, 4, 8].map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWidth(w)}
            className={`px-2.5 py-1 rounded font-bold ${
              width === w ? "bg-[var(--ln-accent)] text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            {w}
          </button>
        ))}
        <span className="text-emerald-400">valid = {valid ? 1 : 0}</span>
      </div>
      <p className="text-[11px] font-sans text-[var(--ln-muted)]">
        Click request bits. Lowest index has highest priority. Hardware is unrolled — there is no runtime <code>for</code>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="text-[10px] uppercase text-slate-400">
            <tr>
              <th className="pb-2 pr-3">Instance</th>
              <th className="pb-2 pr-3">req[i]</th>
              <th className="pb-2 pr-3">any lower req?</th>
              <th className="pb-2">grant[i]</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.i} className="border-t border-slate-800">
                <td className="py-1.5 pr-3 text-cyan-300">{row.name}</td>
                <td className="py-1.5 pr-3">
                  <button type="button" onClick={() => toggle(row.i)}>
                    <Bit v={row.r} />
                  </button>
                </td>
                <td className="py-1.5 pr-3 text-amber-300">{row.higher}</td>
                <td className="py-1.5">
                  <Bit v={row.g} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300">
        assign grant = req &amp; (~req + 1); → one-hot {grant.toString(2).padStart(width, "0")}
      </div>
    </div>
  );
}

function SramLab() {
  const DEPTH = 8;
  const [mem, setMem] = useState<number[]>(() => Array(DEPTH).fill(0));
  const [addr, setAddr] = useState(0);
  const [we, setWe] = useState(1);
  const [din, setDin] = useState(0xa);
  const [dout, setDout] = useState(0);
  const [resetArray, setResetArray] = useState(false);
  const [note, setNote] = useState("Step clk: if we, mem[addr]<=din; dout always gets OLD mem[addr].");

  const step = () => {
    if (resetArray) {
      setNote("❌ Resetting the array forces flip-flops, not an SRAM compiler. Don't do this.");
      return;
    }
    const old = mem[addr];
    const next = [...mem];
    if (we) next[addr] = din & 0xf;
    setMem(next);
    setDout(old);
    setNote(
      we
        ? `we=1 write ${din & 0xf} @${addr}; dout<=OLD ${old} (read-during-write)`
        : `we=0 read @${addr} → dout<=${old}`
    );
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <MemoryStick className="w-4 h-4 text-[var(--ln-accent)]" />
        <span className="text-[var(--ln-muted)]">addr</span>
        {Array.from({ length: DEPTH }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAddr(i)}
            className={`px-2 py-1 rounded font-bold ${
              addr === i ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setWe((v) => (v ? 0 : 1))}
          className={`px-3 py-1.5 rounded-lg font-bold ${we ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-200"}`}
        >
          we = {we}
        </button>
        <label className="text-[var(--ln-muted)]">
          din[3:0]
          <input
            type="range"
            min={0}
            max={15}
            value={din}
            onChange={(e) => setDin(Number(e.target.value))}
            className="ml-2"
          />
          <span className="ml-2 text-cyan-300">{din}</span>
        </label>
        <button
          type="button"
          onClick={step}
          className="px-3 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" /> posedge clk
        </button>
        <button
          type="button"
          onClick={() => setResetArray((v) => !v)}
          className={`px-3 py-1.5 rounded-lg font-bold ${
            resetArray ? "bg-rose-500 text-slate-950" : "bg-slate-800 text-slate-200"
          }`}
        >
          reset mem[]: {resetArray ? "ON (illegal)" : "off"}
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {mem.map((w, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg border text-center ${
              i === addr ? "border-cyan-400 bg-cyan-950 text-cyan-200" : "border-slate-800 bg-slate-950 text-slate-400"
            }`}
          >
            <div className="text-[9px] uppercase">@{i}</div>
            <div className="font-black">{w.toString(16).toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
        <span className="text-slate-400">dout (registered)</span>
        <span className="text-emerald-300 font-black text-sm">{dout}</span>
      </div>
      <p className={`text-[11px] font-sans ${resetArray ? "text-rose-400" : "text-[var(--ln-muted)]"}`}>{note}</p>
    </div>
  );
}

function ResourceShareLab() {
  const [factored, setFactored] = useState(false);
  const [sel, setSel] = useState(1);
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const [c, setC] = useState(10);
  const [d, setD] = useState(2);
  const y = sel ? a + b : c + d;
  const adders = factored ? 1 : 2;
  const muxes = factored ? 2 : 1;

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <GitMerge className="w-4 h-4 text-[var(--ln-accent)]" />
        <button
          type="button"
          onClick={() => setFactored(false)}
          className={`px-3 py-1.5 rounded-lg font-bold ${!factored ? "bg-rose-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}
        >
          Naive: 2 adders
        </button>
        <button
          type="button"
          onClick={() => setFactored(true)}
          className={`px-3 py-1.5 rounded-lg font-bold ${factored ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}
        >
          Factored: 1 adder
        </button>
        <button
          type="button"
          onClick={() => setSel((v) => (v ? 0 : 1))}
          className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold"
        >
          sel = {sel}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[var(--ln-muted)]">
        {(
          [
            ["a", a, setA],
            ["b", b, setB],
            ["c", c, setC],
            ["d", d, setD],
          ] as const
        ).map(([name, val, set]) => (
          <label key={name}>
            {name}={val}
            <input
              type="range"
              min={0}
              max={15}
              value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full"
            />
          </label>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-300 whitespace-pre-wrap">
          {factored
            ? `op1 = sel ? a : c;  // ${sel ? a : c}
op2 = sel ? b : d;  // ${sel ? b : d}
y   = op1 + op2;    // ${y}
// ONE 32-bit adder`
            : `if (sel) y = a + b; // adder #1 = ${a}+${b}
else     y = c + d; // adder #2 = ${c}+${d}
// TWO adders + output mux`}
        </pre>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Result y</span>
            <span className="text-cyan-300 font-black text-sm">{y}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Adders inferred</span>
            <span className={factored ? "text-emerald-400" : "text-rose-400"}>{adders}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Input muxes</span>
            <span className="text-amber-300">{muxes}</span>
          </div>
          <p className="text-[11px] font-sans text-slate-400">
            Same numeric result either way. Factored form cuts arithmetic area ~45% on a 32-bit datapath.
          </p>
        </div>
      </div>
    </div>
  );
}

function SkidLab() {
  const [sValid, setSValid] = useState(1);
  const [mReady, setMReady] = useState(1);
  const [sData, setSData] = useState(1);
  const [mValid, setMValid] = useState(0);
  const [mData, setMData] = useState(0);
  const [skidValid, setSkidValid] = useState(0);
  const [skidData, setSkidData] = useState(0);
  const [xfers, setXfers] = useState(0);
  const [log, setLog] = useState<string[]>(["Idle. Keep s_valid=1, m_ready=1 and step — 1 beat/cycle."]);

  const sReady = skidValid === 0;

  const step = () => {
    let nextMValid = mValid;
    let nextMData = mData;
    let nextSkidV = skidValid;
    let nextSkidD = skidData;
    let accepted = false;

    if (mReady) {
      if (skidValid) {
        nextMValid = 1;
        nextMData = skidData;
        nextSkidV = 0;
      } else {
        nextMValid = sValid;
        nextMData = sData;
      }
    } else if (sValid && sReady) {
      nextSkidV = 1;
      nextSkidD = sData;
      accepted = true;
    }

    if (mValid && mReady) setXfers((n) => n + 1);
    if (sValid && sReady) {
      accepted = true;
      setSData((d) => (d % 9) + 1);
    }

    setMValid(nextMValid);
    setMData(nextMData);
    setSkidValid(nextSkidV);
    setSkidData(nextSkidD);
    setLog((p) => [
      ...p.slice(-5),
      `clk: s_ready=${sReady} m_valid=${nextMValid} skid=${nextSkidV}${accepted ? " (upstream fire)" : ""}`,
    ]);
  };

  const occ = (mValid ? 1 : 0) + skidValid;

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <ArrowRightLeft className="w-4 h-4 text-[var(--ln-accent)]" />
        <button
          type="button"
          onClick={() => setSValid((v) => (v ? 0 : 1))}
          className={`px-3 py-1.5 rounded-lg font-bold ${sValid ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-200"}`}
        >
          s_valid = {sValid}
        </button>
        <button
          type="button"
          onClick={() => setMReady((v) => (v ? 0 : 1))}
          className={`px-3 py-1.5 rounded-lg font-bold ${mReady ? "bg-emerald-400 text-slate-950" : "bg-rose-500 text-slate-950"}`}
        >
          m_ready = {mReady}
        </button>
        <button
          type="button"
          onClick={step}
          className="px-3 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" /> posedge clk
        </button>
        <button
          type="button"
          onClick={() => {
            setSValid(1);
            setMReady(1);
            setSData(1);
            setMValid(0);
            setMData(0);
            setSkidValid(0);
            setSkidData(0);
            setXfers(0);
            setLog(["Reset lab"]);
          }}
          className="px-2 py-1.5 rounded-lg border border-[var(--ln-border)]"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase text-slate-400">Upstream (slave)</div>
          <div>s_data next = {sData}</div>
          <div className={sReady ? "text-emerald-400" : "text-rose-400"}>s_ready = {sReady ? 1 : 0}</div>
          <div className="text-slate-500 text-[10px]">s_ready = !skid_valid</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900 space-y-1">
          <div className="text-[10px] uppercase text-cyan-400">Skid register</div>
          <div>skid_valid = {skidValid}</div>
          <div>skid_data = {skidData}</div>
          <div className="text-slate-500 text-[10px]">Occupancy {occ}/2</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase text-slate-400">Downstream (master)</div>
          <div>m_valid = {mValid}</div>
          <div>m_data = {mData}</div>
          <div className="text-emerald-400">beats out = {xfers}</div>
        </div>
      </div>
      <p className="text-[11px] font-sans text-[var(--ln-muted)]">
        Try: run with both ready, then drop m_ready for two clocks — the skid fills, s_ready falls, and no beat is lost.
      </p>
      <ul className="text-[11px] text-slate-300 space-y-0.5 font-sans">
        {log.map((line, i) => (
          <li key={i}>· {line}</li>
        ))}
      </ul>
    </div>
  );
}
