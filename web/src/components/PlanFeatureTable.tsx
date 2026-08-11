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
      <span className="inline-flex justify-center text-emerald-600">
        <Check className="h-4 w-4" />
      </span>
    );
  if (v === false)
    return (
      <span className="inline-flex justify-center text-slate-300">
        <Minus className="h-4 w-4" />
      </span>
    );
  return <span className="text-[11px] font-medium text-slate-600">{v}</span>;
}

/** Comparison matrix for pricing / docs */
export function PlanFeatureTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-semibold">Feature</th>
            <th className="px-3 py-3 font-semibold text-center">Free</th>
            <th className="px-3 py-3 font-semibold text-center">Pro</th>
            <th className="px-3 py-3 font-semibold text-center">Max</th>
            <th className="px-3 py-3 font-semibold text-center">Team</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.feature} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2.5 text-xs font-medium text-slate-800">{r.feature}</td>
              <td className="px-3 py-2.5 text-center">
                <Cell v={r.free} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <Cell v={r.pro} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <Cell v={r.max} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <Cell v={r.team} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
