"use client";

import React, { useState } from "react";
import { Layers, ArrowRight, Play, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

type DamasceneStep = {
  num: number;
  title: string;
  desc: string;
  subdesc: string;
};

const STEPS: DamasceneStep[] = [
  {
    num: 1,
    title: "1. Dielectric & Etch-Stop Deposition",
    desc: "Deposit low-k Inter-Layer Dielectric (SiCOH, k~2.5) over lower metal with SiN / SiCN etch-stop barrier.",
    subdesc: "Low-k reduces interconnect parasitic capacitance (RC delay), while SiN prevents Cu diffusion.",
  },
  {
    num: 2,
    title: "2. Via Lithography & RIE Etching",
    desc: "Pattern and dry-etch vertical contact vias through the ILD down to the underlying metal layer.",
    subdesc: "Anisotropic fluorocarbon plasma (CF4/C4F8) carves vertical via sidewalls.",
  },
  {
    num: 3,
    title: "3. Trench Lithography & RIE Etching",
    desc: "Pattern and dry-etch horizontal wiring trenches intersecting the vias.",
    subdesc: "Dual-damascene creates both the via and horizontal trench before filling copper once.",
  },
  {
    num: 4,
    title: "4. Ta/TaN Diffusion Barrier & Cu Seed",
    desc: "Deposit ultra-thin (1–2nm) Tantalum/Tantalum Nitride (Ta/TaN) liner by ALD, followed by PVD Cu seed.",
    subdesc: "Copper atoms rapidly drift through silicon/dielectrics causing shorts; TaN acts as an impermeable barrier.",
  },
  {
    num: 5,
    title: "5. Electro-Chemical Copper Plating (ECP)",
    desc: "Electroplate bulk copper from an acid-copper bath, overfilling both vias and trenches with 'superfill'.",
    subdesc: "Organic accelerators and suppressors ensure bottom-up void-free filling of high aspect-ratio vias.",
  },
  {
    num: 6,
    title: "6. Chemical Mechanical Polishing (CMP)",
    desc: "Polish away excess overburden copper and barrier metal using chemical slurry and polishing pads.",
    subdesc: "Planarizes the wafer flat to the dielectric surface, leaving isolated copper wires embedded in ILD.",
  },
];

export function DamasceneMetallizationVisualizer() {
  const [currentStep, setCurrentStep] = useState<number>(6); // Default to completed CMP
  const [wireWidthUm, setWireWidthUm] = useState<number>(2.5); // Wide line CMP dishing
  const [metalDensityPct, setMetalDensityPct] = useState<number>(60);

  // CMP Dishing calculation (nm): dishing increases with wire width and metal density
  const dishingNm = Math.round(wireWidthUm * 8 + (metalDensityPct / 100) * 15);
  const erosionNm = Math.round((metalDensityPct / 100) * 22);

  return (
    <div className="my-8 rounded-2xl border border-cyan-500/30 bg-[#070d19] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0a1326] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-bold text-cyan-300 tracking-wider uppercase text-[12px]">
            BEOL Dual-Damascene &amp; CMP Planarization Sequencer
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Step {currentStep} of 6
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left: Step Navigator */}
        <div className="lg:col-span-5 space-y-2">
          <div className="font-mono text-slate-300 font-bold text-[11px] uppercase tracking-wider mb-2">
            Dual-Damascene Process Flow:
          </div>
          {STEPS.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`w-full p-2.5 rounded-xl border text-left transition font-mono ${
                currentStep === s.num
                  ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-md"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold text-[11px] flex items-center justify-between">
                <span>{s.title}</span>
                {currentStep > s.num && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Right: Dynamic Cross Section & CMP Dishing Lab */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* SVG Cross Section */}
          <div className="bg-[#040812] p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <svg viewBox="0 0 340 180" className="w-full max-w-[340px] h-[170px]">
              {/* Bottom Metal M(n-1) Layer */}
              <rect x="20" y="140" width="300" height="35" fill="#1e293b" stroke="#334155" />
              <rect x="120" y="140" width="100" height="25" fill="#ea580c" />
              <text x="170" y="157" fill="#fed7aa" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                M(n-1) Copper Wire
              </text>

              {/* Etch Stop Layer (SiN) */}
              <rect x="20" y="132" width="300" height="8" fill="#475569" />
              <text x="50" y="138" fill="#94a3b8" fontSize="7" fontFamily="monospace">SiN Barrier</text>

              {/* Inter-Layer Dielectric (ILD) */}
              <rect x="20" y="30" width="300" height="102" fill="#0f172a" stroke="#1e293b" />
              <text x="50" y="50" fill="#38bdf8" fontSize="9" fontFamily="monospace">Low-k ILD</text>

              {/* Step 2+: Via Etch Carve-out */}
              {currentStep >= 2 && currentStep < 4 && (
                <rect x="145" y="80" width="50" height="52" fill="#040812" stroke="#38bdf8" strokeDasharray="2 2" />
              )}

              {/* Step 3+: Trench Etch Carve-out */}
              {currentStep >= 3 && currentStep < 4 && (
                <rect x="90" y="30" width="160" height="50" fill="#040812" stroke="#38bdf8" strokeDasharray="2 2" />
              )}

              {/* Step 4: Barrier Liner (Ta/TaN) */}
              {currentStep >= 4 && (
                <path
                  d="M 90 30 L 90 80 L 145 80 L 145 132 L 195 132 L 195 80 L 250 80 L 250 30 Z"
                  fill="#78716c"
                  stroke="#a8a29e"
                  strokeWidth="1.5"
                />
              )}

              {/* Step 5: Electroplated Copper Overburden */}
              {currentStep === 5 && (
                <path
                  d="M 20 15 L 320 15 L 320 30 L 250 30 L 250 80 L 195 80 L 195 132 L 145 132 L 145 80 L 90 80 L 90 30 L 20 30 Z"
                  fill="#f97316"
                  stroke="#ea580c"
                />
              )}

              {/* Step 6: CMP Planarized Inlaid Copper Wire */}
              {currentStep === 6 && (
                <g>
                  <path
                    d="M 92 30 L 92 80 L 147 80 L 147 132 L 193 132 L 193 80 L 248 80 L 248 30 Z"
                    fill="#f97316"
                  />
                  {/* CMP Dishing dip in wide copper trench */}
                  <path
                    d={`M 92 30 Q 170 ${30 + Math.min(15, dishingNm / 3)} 248 30`}
                    fill="#040812"
                  />
                  <text x="170" y="60" fill="#431407" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    M(n) Dual-Damascene Cu
                  </text>
                  <text x="170" y="115" fill="#431407" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    Via
                  </text>
                </g>
              )}

              {currentStep === 5 && (
                <text x="170" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Bulk Copper Overburden (To Be Polished)
                </text>
              )}
            </svg>

            {/* Current Step Banner */}
            <div className="mt-2 text-center text-cyan-300 font-mono text-[11px] font-bold">
              {STEPS[currentStep - 1].title}
            </div>
          </div>

          {/* CMP Dishing & Density Interactive Control */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-bold">CMP Dishing &amp; Erosion Analysis:</span>
              <span className="text-amber-400 font-bold">Wire Width: {wireWidthUm} µm</span>
            </div>

            <input
              type="range"
              min="0.2"
              max="6.0"
              step="0.2"
              value={wireWidthUm}
              onChange={(e) => setWireWidthUm(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Cu Dishing Depth:</span>
                <span className="text-amber-300 font-bold ml-1.5">{dishingNm} nm</span>
                <div className="text-[9px] text-slate-500 mt-0.5">Thins wide wire center</div>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Dummy Metal Fill:</span>
                <span className="text-emerald-400 font-bold ml-1.5">Required</span>
                <div className="text-[9px] text-slate-500 mt-0.5">Enforces CMP planarity</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
