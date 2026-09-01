"use client";

import React from "react";
import type { FlowMetrics } from "@/lib/openroad-flow-model";

interface MetricsPpaCardProps {
  metrics?: Partial<FlowMetrics>;
  className?: string;
}

export function MetricsPpaCard({ metrics, className = "" }: MetricsPpaCardProps) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className={`p-4 bg-[#0e1322] border border-white/10 rounded-xl text-center text-xs text-white/40 ${className}`}>
        No PPA metrics recorded for this stage yet. Run synthesis/placement to extract timing & area.
      </div>
    );
  }

  const wns = metrics.wnsNs;
  const tns = metrics.tnsNs;
  const area = metrics.areaUm2;
  const util = metrics.utilizationPct;
  const power = metrics.powerMw;
  const wire = metrics.wirelengthUm;
  const cells = metrics.cellCount;

  const isTimingMet = wns == null || wns >= 0;

  return (
    <div className={`p-4 bg-[#0e1322] border border-white/10 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-lg ${className}`}>
      {/* WNS chip */}
      <div className="flex flex-col min-w-[90px]">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">WNS (Setup)</span>
        <span
          className={`text-base font-bold font-mono ${
            wns == null
              ? "text-white/40"
              : isTimingMet
                ? "text-emerald-400"
                : "text-rose-400"
          }`}
        >
          {wns != null ? `${wns.toFixed(3)} ns` : "—"}
        </span>
      </div>

      {/* TNS chip */}
      <div className="flex flex-col min-w-[90px]">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">TNS (Total)</span>
        <span
          className={`text-base font-bold font-mono ${
            tns == null
              ? "text-white/40"
              : tns >= 0
                ? "text-emerald-400"
                : "text-rose-400"
          }`}
        >
          {tns != null ? `${tns.toFixed(2)} ns` : "—"}
        </span>
      </div>

      {/* Area chip */}
      <div className="flex flex-col min-w-[100px]">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">Design Area</span>
        <span className="text-base font-bold font-mono text-blue-400">
          {area != null ? `${Math.round(area).toLocaleString()} µm²` : "—"}
        </span>
      </div>

      {/* Utilization chip */}
      <div className="flex flex-col min-w-[90px]">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">Utilization</span>
        <span className="text-base font-bold font-mono text-cyan-400">
          {util != null ? `${util.toFixed(1)}%` : "—"}
        </span>
      </div>

      {/* Power chip */}
      {power != null && (
        <div className="flex flex-col min-w-[90px]">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">Total Power</span>
          <span className="text-base font-bold font-mono text-amber-400">
            {`${power.toFixed(2)} mW`}
          </span>
        </div>
      )}

      {/* Wirelength chip */}
      {wire != null && (
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">Wirelength</span>
          <span className="text-base font-bold font-mono text-indigo-300">
            {`${Math.round(wire).toLocaleString()} µm`}
          </span>
        </div>
      )}

      {/* Standard Cells */}
      {cells != null && (
        <div className="flex flex-col min-w-[80px]">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">Cells</span>
          <span className="text-base font-bold font-mono text-violet-300">
            {cells.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
