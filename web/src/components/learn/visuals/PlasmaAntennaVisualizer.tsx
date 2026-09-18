"use client";

import React, { useState } from "react";
import { Zap, AlertTriangle, ShieldCheck, ToggleLeft, ToggleRight, Check } from "lucide-react";

export function PlasmaAntennaVisualizer() {
  const [wireLengthUm, setWireLengthUm] = useState<number>(650);
  const [gateWidthUm, setGateWidthUm] = useState<number>(0.12);
  const [hasJumper, setHasJumper] = useState<boolean>(false);
  const [hasDiode, setHasDiode] = useState<boolean>(false);

  const wireWidthUm = 0.14; // e.g. M1 minimum width
  const gateLengthUm = 0.03; // e.g. 30nm gate length

  // Raw Antenna Area & Gate Area
  const metalAreaUm2 = wireLengthUm * wireWidthUm;
  const gateAreaUm2 = gateWidthUm * gateLengthUm;

  // Effective metal area depends on fixes
  // Jumper breaks the wire into 90% disconnected during M1 etch
  const effectiveMetalArea = hasJumper ? metalAreaUm2 * 0.12 : metalAreaUm2;
  const rawAntennaRatio = Math.round(metalAreaUm2 / gateAreaUm2);
  const effectiveAntennaRatio = hasDiode ? 0 : Math.round(effectiveMetalArea / gateAreaUm2);

  const maxAllowedRatio = 350;
  const isViolated = effectiveAntennaRatio > maxAllowedRatio;

  return (
    <div className="my-8 rounded-2xl border border-cyan-500/30 bg-[#070d19] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0a1326] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-mono font-bold text-cyan-300 tracking-wider uppercase text-[12px]">
            Plasma-Induced Damage (PID) &amp; Antenna Ratio (DFM) Lab
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {isViolated ? (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600/50 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              TDDB Oxide Breakdown Risk
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50 flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              DFM Compliant
            </span>
          )}
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left: Circuit Schematic & Plasma Arc Graphic */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="bg-[#040812] p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <svg viewBox="0 0 320 180" className="w-full max-w-[340px] h-[170px]">
              {/* Plasma Field Glow */}
              <rect x="10" y="10" width="300" height="40" fill="rgba(168, 85, 247, 0.12)" rx="6" />
              <text x="160" y="25" fill="#c084fc" fontSize="9" textAnchor="middle" fontFamily="monospace">
                ⚡ RIE Dry Etch Plasma (Ion Bombardment &amp; Charge Collection)
              </text>

              {/* Inverter Driver on Left */}
              <rect x="25" y="60" width="45" height="40" fill="#1e293b" stroke="#334155" rx="3" />
              <text x="47" y="84" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">Driver</text>

              {/* Long Interconnect Wire (M1) */}
              {!hasJumper ? (
                <g>
                  <line x1="70" y1="80" x2="230" y2="80" stroke="#f97316" strokeWidth="5" />
                  <text x="150" y="72" fill="#fb923c" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    Long M1 Line ({wireLengthUm} µm)
                  </text>
                </g>
              ) : (
                <g>
                  {/* M1 Segment 1 */}
                  <line x1="70" y1="80" x2="160" y2="80" stroke="#f97316" strokeWidth="4" />
                  {/* Via up to M2 Jumper */}
                  <line x1="160" y1="80" x2="160" y2="55" stroke="#38bdf8" strokeWidth="3" />
                  <line x1="160" y1="55" x2="210" y2="55" stroke="#38bdf8" strokeWidth="4" />
                  <line x1="210" y1="55" x2="210" y2="80" stroke="#38bdf8" strokeWidth="3" />
                  {/* M1 Stub to Gate */}
                  <line x1="210" y1="80" x2="230" y2="80" stroke="#f97316" strokeWidth="4" />
                  <text x="185" y="48" fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    M2 Jumper Bridge
                  </text>
                </g>
              )}

              {/* Antenna Diode Fix (if enabled) */}
              {hasDiode && (
                <g>
                  <line x1="220" y1="80" x2="220" y2="120" stroke="#10b981" strokeWidth="2" />
                  <polygon points="214,120 226,120 220,130" fill="#10b981" />
                  <line x1="214" y1="130" x2="226" y2="130" stroke="#10b981" strokeWidth="2" />
                  <line x1="220" y1="130" x2="220" y2="140" stroke="#10b981" strokeWidth="2" />
                  <text x="250" y="132" fill="#34d399" fontSize="8" fontFamily="monospace">Antenna Diode</text>
                </g>
              )}

              {/* Receiver Transistor Gate */}
              <rect x="230" y="65" width="60" height="30" fill="#0f172a" stroke="#475569" rx="3" />
              {/* Thin Gate Oxide (1.2nm) */}
              <rect x="235" y="77" width="50" height="5" fill={isViolated ? "#ef4444" : "#10b981"} />
              <text x="260" y="73" fill="#cbd5e1" fontSize="8" textAnchor="middle" fontFamily="monospace">Gate Oxide</text>
              <text x="260" y="90" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">Receiver</text>

              {/* Plasma Charge Arcing if Violated */}
              {isViolated && (
                <g>
                  <path d="M 150 35 L 155 50 L 148 60 L 152 75" stroke="#facc15" strokeWidth="2" fill="none" />
                  <text x="150" y="105" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    ⚡ Oxide Tunneling Rupture!
                  </text>
                </g>
              )}

              {/* Safe status text */}
              {!isViolated && (
                <text x="160" y="160" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  ✓ Charge safely shunted or segmented
                </text>
              )}
            </svg>
          </div>

          {/* Remediation Action Toggles */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <span className="font-mono text-slate-300 font-bold text-[11px] uppercase tracking-wider block">
              DFM Fixes &amp; Routing ECOs:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setHasJumper(!hasJumper)}
                className={`p-2.5 rounded-lg border text-left transition font-mono flex flex-col justify-between ${
                  hasJumper
                    ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>1. Upper Metal Jumper</span>
                  {hasJumper && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[9px] text-slate-400 mt-1">Hops to M2 near gate during M1 etch</div>
              </button>

              <button
                onClick={() => setHasDiode(!hasDiode)}
                className={`p-2.5 rounded-lg border text-left transition font-mono flex flex-col justify-between ${
                  hasDiode
                    ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>2. Antenna Diode</span>
                  {hasDiode && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[9px] text-slate-400 mt-1">Shunts plasma charge to substrate</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sliders & Metrics */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-300">Metal Interconnect Length:</span>
                <span className="text-amber-400 font-bold">{wireLengthUm} µm</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="25"
                value={wireLengthUm}
                onChange={(e) => setWireLengthUm(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>100 µm (Local)</span>
                <span>800 µm (Bus Line)</span>
                <span>1500 µm (Cross-Die)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-300">Receiver Gate Width (W_gate):</span>
                <span className="text-cyan-400 font-bold">{gateWidthUm.toFixed(2)} µm</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.01"
                value={gateWidthUm}
                onChange={(e) => setGateWidthUm(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.05 µm (Tiny Inverter)</span>
                <span>0.40 µm (Buffer Tree)</span>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Effective Antenna Ratio</div>
              <div className={`text-2xl font-bold font-mono mt-1 ${isViolated ? 'text-rose-400' : 'text-emerald-400'}`}>
                {effectiveAntennaRatio}:1
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Rule limit: &lt; {maxAllowedRatio}:1
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Gate Oxide Integrity</div>
              <div className={`text-base font-bold font-mono mt-1 ${isViolated ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isViolated ? "TDDB Failure" : "Pristine Oxide"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {hasDiode ? "Clamped by diode" : hasJumper ? "Protected by jumper" : isViolated ? "Over-voltage rupture" : "Safe process margin"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
