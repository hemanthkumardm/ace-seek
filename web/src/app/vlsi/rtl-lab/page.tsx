"use client";

import React, { useEffect, useState } from "react";
import { Play, Cpu, Terminal } from "lucide-react";
import { RTL_EXAMPLES } from "@/lib/rtl-lab-examples";
import { VcdWaveform } from "@/components/VcdWaveform";
import { VlsiStudioGate } from "@/components/VlsiStudioGate";

function RtlLabBody() {
  const [exId, setExId] = useState(RTL_EXAMPLES[0].id);
  const [dut, setDut] = useState(RTL_EXAMPLES[0].dut);
  const [tb, setTb] = useState(RTL_EXAMPLES[0].tb);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState("");
  const [vcd, setVcd] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [host, setHost] = useState<{ iverilog?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/vlsi/sim")
      .then((r) => r.json())
      .then(setHost)
      .catch(() => setHost({ iverilog: false }));
  }, []);

  const loadEx = (id: string) => {
    const ex = RTL_EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setExId(id);
    setDut(ex.dut);
    setTb(ex.tb);
    setLog("");
    setVcd("");
    setOk(null);
  };

  const run = async () => {
    setRunning(true);
    setLog("");
    setVcd("");
    setOk(null);
    try {
      const res = await fetch("/api/vlsi/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dut, tb }),
      });
      const data = await res.json();
      const text = [data.stdout, data.stderr, data.error].filter(Boolean).join("\n");
      setLog(text || "(no output)");
      setVcd(data.vcd || "");
      setOk(Boolean(data.ok));
    } catch (err) {
      setOk(false);
      setLog(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="m-shell py-6 space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-[var(--brutal-yellow)]">
            ChipVerify-style · Icarus Verilog
          </p>
          <h1 className="text-2xl font-black uppercase text-slate-900">RTL Lab</h1>
          <p className="text-xs font-bold text-slate-700">
            Write DUT + testbench, simulate on this host, inspect console and VCD.
            {host && !host.iverilog ? " Icarus is not installed on this machine." : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="brutal-input !text-xs !py-1.5"
            value={exId}
            onChange={(e) => loadEx(e.target.value)}
          >
            {RTL_EXAMPLES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="brutal-btn brutal-btn-cyan !text-xs font-black"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? "Simulating…" : "Run sim"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">DUT (dut.v)</span>
          <textarea
            value={dut}
            onChange={(e) => setDut(e.target.value)}
            spellCheck={false}
            className="w-full min-h-[280px] brutal-input !text-[11px] !font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Testbench (tb.v)</span>
          <textarea
            value={tb}
            onChange={(e) => setTb(e.target.value)}
            spellCheck={false}
            className="w-full min-h-[280px] brutal-input !text-[11px] !font-mono"
          />
        </label>
      </div>

      <div className="brutal-panel p-4 space-y-2 border-2 border-black">
        <p className="text-[10px] font-black uppercase text-white flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" />
          Console {ok === true ? "· PASS" : ok === false ? "· FAIL" : ""}
        </p>
        <pre className="text-[11px] text-emerald-300 whitespace-pre-wrap min-h-[80px] bg-black p-3 border border-slate-800">
          {log || "Run sim to see $display / errors."}
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase text-slate-900">Waveform</p>
        <VcdWaveform vcd={vcd} />
      </div>
    </div>
  );
}

export default function RtlLabPage() {
  return (
    <VlsiStudioGate studio="rtl">
      <div className="relative">
        <div className="absolute left-4 top-4 hidden md:flex items-center gap-1 text-[10px] font-black text-slate-500">
          <Cpu className="w-3 h-3" /> RTL
        </div>
        <RtlLabBody />
      </div>
    </VlsiStudioGate>
  );
}
