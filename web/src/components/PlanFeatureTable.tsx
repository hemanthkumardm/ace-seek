"use client";

import React from "react";
import { Check, Minus } from "lucide-react";

const ROWS: { feature: string; free: string | boolean; pro: string | boolean; max: string | boolean; team: string | boolean }[] = [
  { feature: "Doc: MD → PDF / TeX / HTML", free: true, pro: true, max: true, team: true },
  { feature: "Doc: PDF / DOCX / ODT round-trip", free: "Editable PDF→DOCX only", pro: true, max: true, team: true },
  { feature: "Exact look PDF → DOCX", free: false, pro: "≤300 DPI", max: "≤400 DPI", team: "≤400 DPI" },
  { feature: "Pro convert engine", free: false, pro: true, max: true, team: true },
  { feature: "Docker / wide PDF", free: false, pro: true, max: true, team: true },
  { feature: "Diff · side-by-side", free: true, pro: true, max: true, team: true },
  { feature: "Diff · char highlight + .diff export", free: false, pro: true, max: true, team: true },
  { feature: "Format · JSON/YAML", free: true, pro: true, max: true, team: true },
  { feature: "Format · TOML/CSV/Base64/URL/Hex", free: false, pro: true, max: true, team: true },
  { feature: "LaTeX · STA templates + download", free: false, pro: true, max: true, team: true },
  { feature: "SDC Studio", free: "Limited", pro: true, max: true, team: true },
  { feature: "Timing + MMMC", free: false, pro: true, max: true, team: true },
  { feature: "Power Studio + ECO", free: false, pro: false, max: true, team: true },
  { feature: "Daily convert limit", free: "25", pro: "500", max: "Unlimited", team: "Unlimited" },
  { feature: "Team seats / SSO / shared vault", free: false, pro: false, max: false, team: true },
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
  return <span className="text-[11px] font-mono font-medium text-cyan-300/80">{v}</span>;
}

/** Comparison matrix for pricing / docs */
export function PlanFeatureTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl relative overflow-hidden backdrop-blur-md">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--bevel-shadow)] bg-[var(--surface-recessed)] text-xs uppercase tracking-wider font-mono">
            <th className="px-5 py-4 font-bold text-slate-300">Feature</th>
            <th className="px-4 py-4 font-bold text-center text-slate-400">Free</th>
            <th className="px-4 py-4 font-bold text-center text-[var(--accent-cyan)]">Pro</th>
            <th className="px-4 py-4 font-bold text-center text-purple-400">Max</th>
            <th className="px-4 py-4 font-bold text-center text-emerald-400">Team</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--bevel-shadow)]">
          {ROWS.map((r) => (
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
        </tbody>
      </table>
    </div>
  );
}
