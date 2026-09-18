"use client";

import React, { useState } from "react";
import { Sparkles, Layers, Sliders, ArrowRight, Check, Eye } from "lucide-react";

type LithoSource = {
  name: string;
  lambdaNm: number;
  defaultNa: number;
  nodeEra: string;
};

const LITHO_SOURCES: LithoSource[] = [
  { name: "G-line (Mercury Lamp)", lambdaNm: 436, defaultNa: 0.45, nodeEra: "1980s (1.2µm – 0.8µm)" },
  { name: "I-line (Mercury Lamp)", lambdaNm: 365, defaultNa: 0.55, nodeEra: "1990s (0.5µm – 0.35µm)" },
  { name: "KrF (DUV Laser)", lambdaNm: 248, defaultNa: 0.70, nodeEra: "Late 1990s (250nm – 180nm)" },
  { name: "ArF Dry (DUV Laser)", lambdaNm: 193, defaultNa: 0.85, nodeEra: "Early 2000s (90nm – 65nm)" },
  { name: "ArFi (193nm Immersion)", lambdaNm: 193, defaultNa: 1.35, nodeEra: "2006–2018 (45nm – 7nm multi-patterning)" },
  { name: "EUV (13.5nm Tin Plasma)", lambdaNm: 13.5, defaultNa: 0.33, nodeEra: "2019+ (7nm, 5nm, 3nm)" },
  { name: "High-NA EUV (Anamorphic)", lambdaNm: 13.5, defaultNa: 0.55, nodeEra: "2025+ (2nm, A16, A14 nodes)" },
];

export function PhotolithoTransistorVisualizer() {
  const [activeTab, setActiveTab] = useState<"litho" | "transistor">("litho");

  // Litho State
  const [selectedSourceIdx, setSelectedSourceIdx] = useState<number>(4); // ArFi
  const [na, setNa] = useState<number>(1.35);
  const [k1, setK1] = useState<number>(0.33);

  const source = LITHO_SOURCES[selectedSourceIdx];
  // Rayleigh Resolution: CD = k1 * lambda / NA
  const cdNm = (k1 * source.lambdaNm) / na;
  // Depth of Focus: DoF = k2 * lambda / (NA^2), k2 ~ 0.5
  const dofNm = (0.5 * source.lambdaNm) / Math.pow(na, 2);

  // Transistor State
  const [transistorType, setTransistorType] = useState<"planar" | "finfet" | "gaafet">("finfet");

  return (
    <div className="my-8 rounded-2xl border border-cyan-500/30 bg-[#070d19] overflow-hidden shadow-2xl">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0a1326] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-bold text-cyan-300 tracking-wider uppercase text-[12px]">
            FEOL Optics &amp; Transistor Architecture Lab
          </span>
        </div>
        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("litho")}
            className={`px-3 py-1 rounded-md text-[11px] font-mono transition ${
              activeTab === "litho"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Rayleigh Lithography
          </button>
          <button
            onClick={() => setActiveTab("transistor")}
            className={`px-3 py-1 rounded-md text-[11px] font-mono transition ${
              activeTab === "transistor"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Planar vs FinFET vs GAAFET
          </button>
        </div>
      </div>

      {activeTab === "litho" ? (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left: Interactive Optical Formula & Sliders */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="font-mono text-slate-300 font-bold text-[11px] uppercase tracking-wider block">
                Photolithography Light Source:
              </span>
              <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                {LITHO_SOURCES.map((src, i) => (
                  <button
                    key={src.name}
                    onClick={() => {
                      setSelectedSourceIdx(i);
                      setNa(src.defaultNa);
                    }}
                    className={`p-2 rounded-lg text-left flex items-center justify-between border transition font-mono ${
                      selectedSourceIdx === i
                        ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300"
                        : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[11px]">{src.name}</div>
                      <div className="text-[10px] text-slate-400">{src.nodeEra}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-400 text-[11px]">λ = {src.lambdaNm} nm</div>
                      <div className="text-[10px] text-slate-500">NA: {src.defaultNa}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-slate-300">Numerical Aperture (NA):</span>
                  <span className="text-cyan-400 font-bold">{na.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="1.45"
                  step="0.05"
                  value={na}
                  onChange={(e) => setNa(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-slate-300">Process Factor (k₁):</span>
                  <span className="text-amber-400 font-bold">{k1.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.26"
                  max="0.60"
                  step="0.01"
                  value={k1}
                  onChange={(e) => setK1(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>0.26 (Theoretical Limit)</span>
                  <span>0.50 (Standard)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Optical Simulation Preview & Metrics */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            {/* Wave Optics Diagram */}
            <div className="bg-[#040812] p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
              <svg viewBox="0 0 320 160" className="w-full max-w-[340px] h-[160px]">
                {/* Photomask */}
                <rect x="20" y="20" width="110" height="8" fill="#475569" />
                <rect x="190" y="20" width="110" height="8" fill="#475569" />
                <text x="160" y="15" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  Photomask Slit (Pitch)
                </text>

                {/* Diffracted Light Rays */}
                <path d="M 130 28 L 80 110 L 240 110 L 190 28 Z" fill="rgba(6, 182, 212, 0.15)" />
                <line x1="160" y1="28" x2="160" y2="110" stroke="#22d3ee" strokeDasharray="3 3" strokeWidth="1" />

                {/* Lens / Immersion Medium */}
                <ellipse cx="160" cy="70" rx="60" ry="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="240" y="73" fill="#38bdf8" fontSize="8" fontFamily="monospace">Lens (NA: {na})</text>

                {/* Aerial Image Intensity Curve */}
                <path
                  d="M 60 110 Q 160 85 260 110"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                />

                {/* Photoresist & Printed Feature */}
                <rect x="30" y="120" width="260" height="25" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                {/* Exposed Pattern Trench */}
                <rect
                  x={160 - Math.min(60, cdNm * 0.8)}
                  y="120"
                  width={Math.max(10, Math.min(120, cdNm * 1.6))}
                  height="25"
                  fill="#06b6d4"
                  opacity="0.75"
                />
                <text x="160" y="137" fill="#020617" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  CD = {cdNm.toFixed(1)} nm
                </text>
                <text x="160" y="156" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  Silicon Substrate
                </text>
              </svg>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Critical Dimension (CD)</div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{cdNm.toFixed(1)} nm</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Rayleigh Resolution limit</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Depth of Focus (DoF)</div>
                <div className="text-xl font-bold font-mono text-amber-300 mt-1">{dofNm.toFixed(1)} nm</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Vertical focal tolerance</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Transistor Evolution Tab */
        <div className="p-5 space-y-5 text-xs">
          {/* Architecture Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "planar", title: "1. Planar Bulk MOSFET", sub: "> 28nm Legacy Nodes", gate: "1-Sided Top Gate" },
              { id: "finfet", title: "2. 3D FinFET", sub: "16nm down to 3nm", gate: "3-Sided Wrapped Gate" },
              { id: "gaafet", title: "3. Gate-All-Around (GAAFET)", sub: "2nm / A16 / A14 Nodes", gate: "4-Sided All-Around Gate" },
            ].map((arch) => (
              <button
                key={arch.id}
                onClick={() => setTransistorType(arch.id as any)}
                className={`p-3 rounded-xl border text-left transition font-mono ${
                  transistorType === arch.id
                    ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-md"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="font-bold text-[12px]">{arch.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{arch.sub}</div>
                <div className="text-[10px] text-cyan-400 font-bold mt-2">{arch.gate}</div>
              </button>
            ))}
          </div>

          {/* Cross Section Diagram & Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div className="lg:col-span-6 flex items-center justify-center bg-[#040812] p-4 rounded-lg border border-slate-800/80">
              {transistorType === "planar" && (
                <svg viewBox="0 0 280 140" className="w-full max-w-[260px] h-[130px]">
                  <rect x="20" y="80" width="240" height="50" fill="#1e293b" stroke="#334155" />
                  <text x="140" y="115" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">Silicon Substrate</text>
                  <rect x="30" y="55" width="50" height="30" fill="#047857" rx="3" />
                  <text x="55" y="74" fill="#a7f3d0" fontSize="9" textAnchor="middle" fontFamily="monospace">Source</text>
                  <rect x="200" y="55" width="50" height="30" fill="#047857" rx="3" />
                  <text x="225" y="74" fill="#a7f3d0" fontSize="9" textAnchor="middle" fontFamily="monospace">Drain</text>
                  {/* Gate Oxide */}
                  <rect x="90" y="74" width="100" height="6" fill="#f59e0b" />
                  {/* Gate Electrode */}
                  <rect x="90" y="44" width="100" height="30" fill="#0284c7" rx="2" />
                  <text x="140" y="63" fill="#ffffff" fontSize="9" textAnchor="middle" fontFamily="monospace">Poly/HKMG Gate</text>
                  <path d="M 85 95 Q 140 105 195 95" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                  <text x="140" y="132" fill="#ef4444" fontSize="8" textAnchor="middle" fontFamily="monospace">Subsurface Leakage Path</text>
                </svg>
              )}

              {transistorType === "finfet" && (
                <svg viewBox="0 0 280 140" className="w-full max-w-[260px] h-[130px]">
                  <rect x="20" y="100" width="240" height="30" fill="#1e293b" stroke="#334155" />
                  {/* 3D Vertical Fin */}
                  <rect x="125" y="35" width="30" height="70" fill="#10b981" rx="2" />
                  <text x="140" y="70" fill="#064e3b" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Fin</text>
                  {/* Gate wrapping around 3 sides */}
                  <path
                    d="M 90 100 L 90 20 L 190 20 L 190 100 L 165 100 L 165 35 L 115 35 L 115 100 Z"
                    fill="#0284c7"
                    opacity="0.85"
                  />
                  <text x="140" y="16" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">Gate (3 Sides)</text>
                  <text x="140" y="120" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">SiO2 Isolation / Substrate</text>
                </svg>
              )}

              {transistorType === "gaafet" && (
                <svg viewBox="0 0 280 140" className="w-full max-w-[260px] h-[130px]">
                  {/* Metal Gate Body enveloping everything */}
                  <rect x="60" y="15" width="160" height="110" fill="#0369a1" opacity="0.4" rx="6" />
                  <text x="140" y="28" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">All-Around Gate</text>
                  {/* 3 Stacked Horizontal Nanosheets */}
                  <rect x="90" y="38" width="100" height="14" fill="#10b981" rx="3" stroke="#059669" strokeWidth="1" />
                  <text x="140" y="49" fill="#022c22" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Nanosheet 1</text>
                  <rect x="90" y="64" width="100" height="14" fill="#10b981" rx="3" stroke="#059669" strokeWidth="1" />
                  <text x="140" y="75" fill="#022c22" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Nanosheet 2</text>
                  <rect x="90" y="90" width="100" height="14" fill="#10b981" rx="3" stroke="#059669" strokeWidth="1" />
                  <text x="140" y="101" fill="#022c22" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Nanosheet 3</text>
                  <text x="140" y="132" fill="#a7f3d0" fontSize="8" textAnchor="middle" fontFamily="monospace">Full 4-Sided Electrostatic Gate Control</text>
                </svg>
              )}
            </div>

            <div className="lg:col-span-6 space-y-2.5 font-mono text-[11px]">
              <div className="text-cyan-300 font-bold text-xs uppercase tracking-wider">
                {transistorType === "planar" && "Planar Bulk MOSFET Limitations:"}
                {transistorType === "finfet" && "3D FinFET Architecture:"}
                {transistorType === "gaafet" && "Gate-All-Around (GAAFET / MBCFET):"}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {transistorType === "planar" &&
                  "Planar transistors control the channel from a single top gate. Below 28nm, the drain electric field penetrates deep into the substrate (DIBL), causing uncontrollable subthreshold leakage currents even when the gate is turned OFF."}
                {transistorType === "finfet" &&
                  "FinFET raises a 3D silicon fin so the gate wraps around three sides (left, top, right). This dramatically tightens electrostatic control, suppressing short-channel leakage and doubling drive current per unit footprint."}
                {transistorType === "gaafet" &&
                  "GAAFET suspends vertically stacked silicon nanosheets with gate oxide and metal enveloping all 4 sides. Provides the ultimate electrostatic channel control required for sub-2nm nodes and enables variable sheet widths for PPA optimization."}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px]">
                <div>
                  <span className="text-slate-400">Subthreshold Swing: </span>
                  <span className="text-white font-bold">
                    {transistorType === "planar" ? "> 85 mV/dec" : transistorType === "finfet" ? "68 mV/dec" : "63 mV/dec (Ideal ~60)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">DIBL: </span>
                  <span className="text-white font-bold">
                    {transistorType === "planar" ? "> 120 mV/V (Poor)" : transistorType === "finfet" ? "40 mV/V (Good)" : "< 25 mV/V (Superb)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
