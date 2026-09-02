"use client";

import React from "react";
import { Check, Minus } from "lucide-react";

type FeatureRow = {
  category?: string;
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  max: string | boolean;
  team: string | boolean;
};

const FEATURE_SECTIONS: { category: string; rows: Omit<FeatureRow, "category">[] }[] = [
  {
    category: "VLSI Academy & Learn Hub",
    rows: [
      { feature: "Beginner & Standard Courses (Digital, STA, SDC, Tcl, PD)", free: true, pro: true, max: true, team: true },
      { feature: "Expert Curriculum & RTL-to-GDSII Signoff Labs", free: false, pro: true, max: true, team: true },
      { feature: "34 Live Production Engineering Calculators", free: true, pro: true, max: true, team: true },
      { feature: "24/7 AI VLSI Tutor & Concept Assistant", free: false, pro: true, max: true, team: true },
    ],
  },
  {
    category: "Master EDA Tool Suites (MAX Tier)",
    rows: [
      { feature: "Cadence Suite (Genus, Innovus, Voltus, Tempus, Conformal)", free: false, pro: false, max: true, team: true },
      { feature: "Synopsys Suite (DC Ultra, ICC2, PrimePower, PrimeTime, Formality)", free: false, pro: false, max: true, team: true },
      { feature: "Open-Source Suite (Yosys/ABC, OpenROAD, PSM, OpenSTA, Formal)", free: false, pro: false, max: true, team: true },
    ],
  },
  {
    category: "VLSI Interactive Studios Suite",
    rows: [
      { feature: "SDC Studio: Waveforms & constraint generator", free: "Basic", pro: true, max: true, team: true },
      { feature: "Timing Studio: Slack breakdown & skew modeling", free: false, pro: true, max: true, team: true },
      { feature: "MMMC Studio: PVT corners & view definitions", free: false, pro: true, max: true, team: true },
      { feature: "Power Studio: UPF multi-voltage & level shifters", free: false, pro: false, max: true, team: true },
      { feature: "Reports Studio: Synthesis, STA & power report parser", free: "Limited", pro: true, max: true, team: true },
      { feature: "Automated Production Tcl Script Exporter", free: false, pro: true, max: true, team: true },
    ],
  },
  {
    category: "OpenROAD Automation & Cloud ASIC Runs",
    rows: [
      { feature: "VLSI → OpenROAD handoff export", free: true, pro: true, max: true, team: true },
      { feature: "Flow script generator (OpenLane / SkyWater 130nm)", free: false, pro: true, max: true, team: true },
      { feature: "Cloud Docker Runner (Real RTL → GDSII runs)", free: false, pro: false, max: true, team: true },
    ],
  },
  {
    category: "Document Compiler & Engineering Utilities",
    rows: [
      { feature: "Doc Compiler: Markdown → PDF / TeX / HTML", free: true, pro: true, max: true, team: true },
      { feature: "Exact look PDF → DOCX", free: false, pro: "≤300 DPI", max: "≤400 DPI", team: "≤400 DPI" },
      { feature: "Diff Studio: Netlist & code diff with .diff export", free: "Side-by-side", pro: "Char highlight", max: "Char highlight", team: "Char highlight" },
      { feature: "Format Studio: JSON, YAML, TOML, CSV, Base64, Hex", free: "JSON/YAML", pro: true, max: true, team: true },
      { feature: "LaTeX & STA Report Templates", free: false, pro: true, max: true, team: true },
    ],
  },
  {
    category: "Platform, Capacity & Support",
    rows: [
      { feature: "Daily document conversion limit", free: "25 / day", pro: "500 / day", max: "Unlimited", team: "Unlimited" },
      { feature: "Execution queue & private workspace vault", free: "Standard", pro: "Priority", max: "Dedicated", team: "Dedicated" },
      { feature: "Team seats, shared workspaces & admin delegation", free: false, pro: false, max: false, team: true },
    ],
  },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true)
    return (
      <span className="inline-flex justify-center text-[#10b981]">
        <Check className="h-4 w-4 stroke-[2.5]" />
      </span>
    );
  if (v === false)
    return (
      <span className="inline-flex justify-center text-slate-700">
        <Minus className="h-4 w-4" />
      </span>
    );
  return <span className="text-[11px] font-mono font-medium text-cyan-300/90">{v}</span>;
}

/** Comparison matrix for pricing / docs */
export function PlanFeatureTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl relative overflow-hidden backdrop-blur-md">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--bevel-shadow)] bg-[var(--surface-recessed)] text-xs uppercase tracking-wider font-mono">
            <th className="px-5 py-4 font-bold text-slate-300">Capability / Feature</th>
            <th className="px-4 py-4 font-bold text-center text-slate-400">Free</th>
            <th className="px-4 py-4 font-bold text-center text-[var(--accent-cyan)]">Pro</th>
            <th className="px-4 py-4 font-bold text-center text-purple-400">Max</th>
            <th className="px-4 py-4 font-bold text-center text-emerald-400">Team</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--bevel-shadow)]">
          {FEATURE_SECTIONS.map((section) => (
            <React.Fragment key={section.category}>
              <tr className="bg-slate-900/60 border-t-2 border-[var(--bevel-shadow)]">
                <td
                  colSpan={5}
                  className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--accent-cyan)] font-mono"
                >
                  {section.category}
                </td>
              </tr>
              {section.rows.map((r) => (
                <tr key={r.feature} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-xs font-medium text-slate-200">{r.feature}</td>
                  <td className="px-4 py-3 text-center">
                    <Cell v={r.free} />
                  </td>
                  <td className="px-4 py-3 text-center bg-cyan-500/[0.02]">
                    <Cell v={r.pro} />
                  </td>
                  <td className="px-4 py-3 text-center bg-purple-500/[0.02]">
                    <Cell v={r.max} />
                  </td>
                  <td className="px-4 py-3 text-center bg-emerald-500/[0.02]">
                    <Cell v={r.team} />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

