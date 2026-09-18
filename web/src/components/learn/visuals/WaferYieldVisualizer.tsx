"use client";

import React, { useState, useMemo } from "react";
import { Disc, RotateCcw, AlertCircle, CheckCircle2, DollarSign, Cpu } from "lucide-react";

export function WaferYieldVisualizer() {
  const [waferDiameterMm, setWaferDiameterMm] = useState<number>(300);
  const [dieWidthMm, setDieWidthMm] = useState<number>(12);
  const [dieHeightMm, setDieHeightMm] = useState<number>(10);
  const [defectDensity, setDefectDensity] = useState<number>(0.15); // defects per cm^2
  const [yieldModel, setYieldModel] = useState<"murphy" | "poisson">("murphy");
  const [waferCost, setWaferCost] = useState<number>(6500);
  const [seed, setSeed] = useState<number>(42);

  // Calculations
  const radiusMm = waferDiameterMm / 2;
  const edgeExclusionMm = 3;
  const usableRadiusMm = radiusMm - edgeExclusionMm;
  const dieAreaMm2 = dieWidthMm * dieHeightMm;
  const dieAreaCm2 = dieAreaMm2 / 100;

  // Gross DPW formula: DPW = pi * (d/2)^2 / A - pi * d / sqrt(2*A)
  const grossDpw = useMemo(() => {
    const raw =
      (Math.PI * Math.pow(usableRadiusMm, 2)) / dieAreaMm2 -
      (Math.PI * waferDiameterMm) / Math.sqrt(2 * dieAreaMm2);
    return Math.max(1, Math.floor(raw));
  }, [usableRadiusMm, dieAreaMm2, waferDiameterMm]);

  // Yield calculation
  const yieldFraction = useMemo(() => {
    const ad = dieAreaCm2 * defectDensity;
    if (ad <= 0.0001) return 0.999;
    if (yieldModel === "poisson") {
      return Math.exp(-ad);
    } else {
      // Murphy model: ((1 - e^(-AD)) / (AD))^2
      const term = (1 - Math.exp(-ad)) / ad;
      return Math.pow(term, 2);
    }
  }, [dieAreaCm2, defectDensity, yieldModel]);

  const yieldPercent = Math.min(100, Math.max(0, yieldFraction * 100));
  const netGoodDies = Math.floor(grossDpw * yieldFraction);
  const defectiveDies = grossDpw - netGoodDies;
  const costPerGoodDie = netGoodDies > 0 ? (waferCost / netGoodDies).toFixed(2) : "N/A";

  // Total defect count on usable wafer area
  const usableAreaCm2 = (Math.PI * Math.pow(usableRadiusMm, 2)) / 100;
  const totalDefectsCount = Math.max(1, Math.round(usableAreaCm2 * defectDensity));

  // Pseudo-random defect coordinates for SVG wafer visualization
  const defectPoints = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    let s = seed;
    const lcg = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    for (let i = 0; i < totalDefectsCount; i++) {
      const r = Math.sqrt(lcg()) * (usableRadiusMm * 0.95);
      const theta = lcg() * 2 * Math.PI;
      pts.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
      });
    }
    return pts;
  }, [seed, totalDefectsCount, usableRadiusMm]);

  return (
    <div className="my-8 rounded-2xl border border-cyan-500/30 bg-[#070d19] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0a1326] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <Disc className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span className="font-mono font-bold text-cyan-300 tracking-wider uppercase text-[12px]">
            Wafer Yield, Defect Density &amp; Die Per Wafer (DPW) Simulator
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span>Interactive Silicon Fabrication Model</span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Wafer Graphic */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#040812] p-4 rounded-xl border border-slate-800/80">
          <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
            <svg viewBox="-160 -160 320 320" className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              {/* Wafer Outer Rim */}
              <circle
                cx="0"
                cy="0"
                r="150"
                fill="#0d192e"
                stroke="#0891b2"
                strokeWidth="2.5"
              />

              {/* Edge Exclusion Ring (3mm) */}
              <circle
                cx="0"
                cy="0"
                r="147"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />

              {/* Wafer Notch / Flat at Bottom */}
              <path
                d="M -6 150 L 0 144 L 6 150 Z"
                fill="#070d19"
                stroke="#0891b2"
                strokeWidth="1.5"
              />

              {/* Simulated Diced Die Grid Pattern */}
              <g opacity="0.35" stroke="#38bdf8" strokeWidth="0.5">
                {Array.from({ length: 21 }).map((_, i) => {
                  const pos = (i - 10) * 14;
                  return (
                    <React.Fragment key={i}>
                      <line x1={pos} y1="-145" x2={pos} y2="145" />
                      <line x1="-145" y1={pos} x2="145" y2={pos} />
                    </React.Fragment>
                  );
                })}
              </g>

              {/* Defect Particles Scatter */}
              {defectPoints.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="2.2" fill="#ef4444" opacity="0.85" />
                  <circle cx={pt.x} cy={pt.y} r="4.5" fill="#ef4444" opacity="0.25" />
                </g>
              ))}

              {/* Center Crosshairs */}
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
            </svg>

            {/* Floating Wafer Spec Badge */}
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-cyan-300">
              {waferDiameterMm}mm Wafer · {totalDefectsCount} Defects
            </div>
          </div>

          <div className="mt-4 w-full flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-400" />
              Good Dies ({netGoodDies})
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-400" />
              Defect Hits ({defectiveDies})
            </span>
            <button
              onClick={() => setSeed((prev) => prev + 17)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 border border-slate-700 transition"
              title="Reseed random defect distribution"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              Reseed
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Sliders & Results */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4 text-xs">
          {/* Controls */}
          <div className="space-y-3.5 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            {/* Wafer Diameter */}
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-300">Wafer Diameter:</span>
                <span className="text-cyan-400 font-bold">{waferDiameterMm} mm</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[150, 200, 300].map((d) => (
                  <button
                    key={d}
                    onClick={() => setWaferDiameterMm(d)}
                    className={`py-1 rounded font-mono text-[11px] border transition ${
                      waferDiameterMm === d
                        ? "bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold shadow-sm"
                        : "bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    {d} mm ({d === 150 ? '6"' : d === 200 ? '8"' : '12"'})
                  </button>
                ))}
              </div>
            </div>

            {/* Die Size Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-slate-300">Die Width X:</span>
                  <span className="text-cyan-400 font-bold">{dieWidthMm} mm</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="26"
                  step="1"
                  value={dieWidthMm}
                  onChange={(e) => setDieWidthMm(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-slate-300">Die Height Y:</span>
                  <span className="text-cyan-400 font-bold">{dieHeightMm} mm</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="26"
                  step="1"
                  value={dieHeightMm}
                  onChange={(e) => setDieHeightMm(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Defect Density */}
            <div className="pt-1">
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-300">Defect Density (D₀):</span>
                <span className="text-amber-400 font-bold">{defectDensity.toFixed(2)} / cm²</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="1.50"
                step="0.02"
                value={defectDensity}
                onChange={(e) => setDefectDensity(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.02 (ISO 3 Modern)</span>
                <span>0.50 (Mature)</span>
                <span>1.50 (Early R&amp;D)</span>
              </div>
            </div>

            {/* Yield Model Toggle */}
            <div className="pt-1 flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-300">Yield Model:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setYieldModel("murphy")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono border transition ${
                    yieldModel === "murphy"
                      ? "bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  Murphy (Triangular)
                </button>
                <button
                  onClick={() => setYieldModel("poisson")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono border transition ${
                    yieldModel === "poisson"
                      ? "bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  Poisson (e^-AD)
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Output Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Die Area</div>
              <div className="text-base font-bold font-mono text-white mt-0.5">{dieAreaMm2} mm²</div>
              <div className="text-[10px] text-slate-500 font-mono">({dieAreaCm2.toFixed(2)} cm²)</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Gross DPW</div>
              <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">{grossDpw}</div>
              <div className="text-[10px] text-slate-500 font-mono">Total Candidates</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Yield</div>
              <div className={`text-base font-bold font-mono mt-0.5 ${yieldPercent > 70 ? 'text-emerald-400' : yieldPercent > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                {yieldPercent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{netGoodDies} Net Good</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Cost / Die</div>
              <div className="text-base font-bold font-mono text-purple-300 mt-0.5">${costPerGoodDie}</div>
              <div className="text-[10px] text-slate-500 font-mono">@ ${waferCost}/wafer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
