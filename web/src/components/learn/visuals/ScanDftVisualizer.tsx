"use client";

import React, { useMemo, useState } from "react";
import { Binary, Play, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

type Fault = "NONE" | "SA0" | "SA1";
type Phase = "insert" | "load" | "capture" | "unload";

function comboFrom(q: number[], fault: Fault) {
  let and01 = q[0] & q[1];
  if (fault === "SA0") and01 = 0;
  if (fault === "SA1") and01 = 1;
  const or23 = q[2] | q[3];
  return [
    and01 === 1 ? 0 : 1, // D0 = ~(Q0 & Q1)
    and01 ^ or23, // D1
    or23 === 1 ? 0 : 1, // D2 = ~(Q2 | Q3)
    q[0] & q[3], // D3
  ];
}

const PATTERN = [1, 1, 0, 0] as const; // sensitizes Q0&Q1

export function ScanDftVisualizer() {
  const [inserted, setInserted] = useState(false);
  const [phase, setPhase] = useState<Phase>("insert");
  const [scanEn, setScanEn] = useState(false);
  const [q, setQ] = useState<number[]>([0, 0, 0, 0]);
  const [loadIdx, setLoadIdx] = useState(0);
  const [unloadIdx, setUnloadIdx] = useState(0);
  const [soLog, setSoLog] = useState<number[]>([]);
  const [fault, setFault] = useState<Fault>("NONE");
  const [captured, setCaptured] = useState<number[] | null>(null);
  const [locLaunch, setLocLaunch] = useState(false);

  const goldenD = useMemo(() => comboFrom(q, "NONE"), [q]);
  const actualD = useMemo(() => comboFrom(q, fault), [q, fault]);
  const [goldenCapture, setGoldenCapture] = useState<number[] | null>(null);

  const detected =
    captured && goldenCapture
      ? captured.some((b, i) => b !== goldenCapture[i])
      : false;

  const reset = () => {
    setInserted(false);
    setPhase("insert");
    setScanEn(false);
    setQ([0, 0, 0, 0]);
    setLoadIdx(0);
    setUnloadIdx(0);
    setSoLog([]);
    setCaptured(null);
    setGoldenCapture(null);
    setLocLaunch(false);
  };

  const insertScan = () => {
    setInserted(true);
    setPhase("load");
    setScanEn(true);
    setQ([0, 0, 0, 0]);
    setLoadIdx(0);
  };

  const shiftIn = () => {
    if (loadIdx >= 4) return;
    const bit = PATTERN[3 - loadIdx]; // SI enters FF0; load MSB first so Q becomes 1,1,0,0
    setQ(([a, b, c]) => [bit, a, b, c]);
    const next = loadIdx + 1;
    setLoadIdx(next);
    if (next >= 4) {
      setScanEn(false);
      setPhase("capture");
    }
  };

  const capture = () => {
    const g = comboFrom(q, "NONE");
    const a = comboFrom(q, fault);
    setGoldenCapture(g);
    setCaptured(a);
    setQ(a);
    setPhase("unload");
    setScanEn(true);
    setUnloadIdx(0);
    setSoLog([]);
    setLocLaunch(false);
  };

  const locPulse = () => {
    // Launch: first functional capture (SE=0) to launch a transition, then second would sample
    const a = comboFrom(q, fault);
    setQ(a);
    setLocLaunch(true);
  };

  const shiftOut = () => {
    if (!captured || unloadIdx >= 4) return;
    const so = q[3];
    setSoLog((s) => [...s, so]);
    setQ(([a, b, c]) => [0, a, b, c]); // shift toward SO
    setUnloadIdx((n) => n + 1);
  };

  const steps: { id: Phase; n: string; title: string; why: string }[] = [
    {
      id: "insert",
      n: "1",
      title: "Insert scan",
      why: "A tester only has SI, SO, SE, CLK. Replace each DFF with a mux-D scan flop so those pins can reach every register.",
    },
    {
      id: "load",
      n: "2",
      title: "Shift in the ATPG vector",
      why: "SE=1. Four clocks load 1-1-0-0 into Q3…Q0. That pattern turns Q0&Q1 ON so a stuck-at on that AND is visible.",
    },
    {
      id: "capture",
      n: "3",
      title: "Capture (one functional clock)",
      why: "SE=0. Combo sees Q, computes D, one rising edge samples D into Q. This is the only cycle that tests the gates.",
    },
    {
      id: "unload",
      n: "4",
      title: "Shift out and compare",
      why: "SE=1 again. Four clocks dump Q onto SO. Compare to the golden signature (what D should have been with no defect).",
    },
  ];

  return (
    <div
      className="ln-card p-5 my-6 rounded-xl"
      style={{ background: "var(--ln-bg-elev)", border: "1px solid var(--ln-border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">Scan insertion → ATPG in four clocks</h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Follow the numbered steps. The picture only does what the current step says.
            </p>
          </div>
        </div>
        <button type="button" className="ln-btn" onClick={reset}>
          <RotateCcw className="w-3.5 h-3.5" /> Start over
        </button>
      </div>

      {/* Step rail */}
      <ol className="grid sm:grid-cols-4 gap-2 mb-5">
        {steps.map((s) => {
          const active = phase === s.id;
          const done =
            (s.id === "insert" && inserted) ||
            (s.id === "load" && loadIdx >= 4) ||
            (s.id === "capture" && captured) ||
            (s.id === "unload" && unloadIdx >= 4);
          return (
            <li
              key={s.id}
              className="p-3 rounded-lg border text-xs"
              style={{
                borderColor: active ? "var(--ln-accent)" : "var(--ln-border)",
                background: active ? "var(--ln-accent-soft)" : "var(--ln-bg)",
              }}
            >
              <div className="font-bold text-[var(--ln-text)]">
                {s.n}. {s.title} {done ? "✓" : ""}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--ln-muted)" }}>
                {s.why}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-[var(--ln-muted)]">Inject a defect on net (Q0 AND Q1):</span>
        {(["NONE", "SA0", "SA1"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFault(f)}
            className={`ln-btn !py-1 ${fault === f ? "ln-btn-primary" : ""}`}
          >
            {f === "NONE" ? "Healthy" : f}
          </button>
        ))}
      </div>

      {/* Mux-D flop picture */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4">
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 mb-3">
          <span>{inserted ? "After scan insertion (SDFF)" : "Before DFT — plain DFF, tester cannot reach Q"}</span>
          <span>
            SE={scanEn ? 1 : 0} · SI={PATTERN[Math.max(0, 3 - loadIdx)] ?? "–"} · SO={q[3]}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {q.map((bit, i) => (
            <div key={i} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-center font-mono text-xs">
              <div className="text-[10px] text-teal-400">FF{i}</div>
              {inserted ? (
                <div className="text-[10px] text-slate-500 mt-1">
                  mux({scanEn ? "SI" : "D"} → Q)
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 mt-1">D only</div>
              )}
              <div className="text-2xl font-black text-white my-1">{bit}</div>
              <div className="text-[10px] text-slate-500">
                D={actualD[i]}
                {goldenD[i] !== actualD[i] ? (
                  <span className="text-rose-400"> ≠ golden {goldenD[i]}</span>
                ) : (
                  <span className="text-emerald-400"> = golden</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">
          Combo under test: D0=¬(Q0∧Q1)  D1=(Q0∧Q1)⊕(Q2∨Q3)  D2=¬(Q2∨Q3)  D3=Q0∧Q3
        </p>
      </div>

      {/* Action for current phase */}
      <div className="p-4 rounded-xl border border-[var(--ln-border)] bg-[var(--ln-bg)] space-y-3">
        {phase === "insert" && (
          <>
            <p className="text-sm text-[var(--ln-text)]">
              Right now each flop only has a functional <strong>D</strong>. A tester pin cannot load Q1.
              Click insert: every flop gets a 2:1 mux. <strong>SE=1</strong> selects SI (the previous Q);
              <strong> SE=0</strong> selects functional D.
            </p>
            <button type="button" className="ln-btn ln-btn-primary" onClick={insertScan}>
              Insert scan cells (DFF → SDFF)
            </button>
          </>
        )}

        {phase === "load" && (
          <>
            <p className="text-sm text-[var(--ln-text)]">
              ATPG chose vector <strong>1100</strong> so Q0=1 and Q1=1. That makes (Q0 AND Q1) a 1 — if the
              net is stuck-at-0, D0 will be wrong after capture.
            </p>
            <p className="text-xs font-mono text-[var(--ln-muted)]">
              Loaded {loadIdx}/4 bits. Next SI = {PATTERN[3 - loadIdx]}
            </p>
            <button type="button" className="ln-btn ln-btn-primary" onClick={shiftIn}>
              <Play className="w-3.5 h-3.5" />
              Shift clock (SE=1) — bit {loadIdx + 1} of 4
            </button>
          </>
        )}

        {phase === "capture" && (
          <>
            <p className="text-sm text-[var(--ln-text)]">
              SE is now 0. One functional clock samples D into Q. That is the only moment the
              combinational gates are tested.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded border border-[var(--ln-border)]">
                Golden D (no defect): {goldenD.join(" ")}
              </div>
              <div className="p-2 rounded border border-[var(--ln-border)]">
                Actual D ({fault}): {actualD.join(" ")}
                {actualD.some((b, i) => b !== goldenD[i]) ? (
                  <span className="text-rose-500"> — observable fail</span>
                ) : (
                  <span className="text-emerald-600"> — same (fault not seen)</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ln-btn ln-btn-primary" onClick={capture}>
                Capture clock (SE=0)
              </button>
              <button type="button" className="ln-btn" onClick={locPulse} disabled={locLaunch}>
                Extra: LOC launch pulse
              </button>
            </div>
            {locLaunch && (
              <p className="text-[12px] text-[var(--ln-muted)]">
                Launch-off-Capture uses <strong>two</strong> functional clocks: the first launches a
                transition at the flop Q, the second (at-speed) captures whether the combo met the
                period. Stuck-at uses only one capture.
              </p>
            )}
          </>
        )}

        {phase === "unload" && (
          <>
            <p className="text-sm text-[var(--ln-text)]">
              Shift the captured Q bits out on SO and compare to the golden signature{" "}
              <strong>{goldenCapture?.join("")}</strong>.
            </p>
            <p className="text-xs font-mono text-[var(--ln-muted)]">
              SO stream: {soLog.length ? soLog.join(" ") : "—"} ({unloadIdx}/4)
            </p>
            {unloadIdx < 4 ? (
              <button type="button" className="ln-btn ln-btn-primary" onClick={shiftOut}>
                <Play className="w-3.5 h-3.5" />
                Shift-out clock (SE=1)
              </button>
            ) : detected ? (
              <div className="flex items-center gap-2 text-rose-500 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Signature mismatch — ATPG flags a defect ({fault}). Die fail.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Signature matches golden — this pattern sees no defect.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
