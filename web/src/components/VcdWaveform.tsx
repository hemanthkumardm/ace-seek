"use client";

import React from "react";
import { parseVcd } from "@/lib/vcd-lite";

export function VcdWaveform({ vcd }: { vcd: string }) {
  const parsed = parseVcd(vcd);
  if (!parsed || !parsed.waves.length) {
    return (
      <p className="text-[11px] font-bold text-slate-400">
        No VCD. Add <code>$dumpfile(&quot;wave.vcd&quot;); $dumpvars(0, tb);</code> in the testbench.
      </p>
    );
  }

  const W = 720;
  const rowH = 28;
  const labelW = 110;
  const H = 16 + parsed.waves.length * rowH;
  const tMax = Math.max(parsed.endTime, 1);

  return (
    <div className="overflow-x-auto border-2 border-black bg-black">
      <svg width={labelW + W} height={H} className="block">
        {parsed.waves.map((w, i) => {
          const y = 14 + i * rowH;
          const pts: string[] = [];
          let last = w.samples[0]?.v ?? "x";
          let lastX = labelW;
          const y1 = y - 8;
          const y0 = y + 8;
          const yMid = y;
          const bit = (v: string) => (v === "1" ? y1 : v === "0" ? y0 : yMid);
          w.samples.forEach((s, si) => {
            const x = labelW + (s.t / tMax) * W;
            if (si === 0) {
              pts.push(`${x},${bit(s.v)}`);
            } else {
              pts.push(`${x},${bit(last)}`, `${x},${bit(s.v)}`);
            }
            last = s.v;
            lastX = x;
          });
          pts.push(`${labelW + W},${bit(last)}`);
          return (
            <g key={w.name + i}>
              <text x={8} y={y + 4} fill="#22d3ee" fontSize="11" fontFamily="ui-monospace,monospace">
                {w.name}
              </text>
              <line x1={labelW} x2={labelW + W} y1={y} y2={y} stroke="#1e293b" />
              <polyline
                fill="none"
                stroke={last === "x" ? "#f43f5e" : "#fde047"}
                strokeWidth="1.5"
                points={pts.join(" ")}
              />
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] font-mono text-slate-500 px-2 py-1">
        t=0 … {parsed.endTime} ({parsed.timescale}) · {parsed.waves.length} signals
      </p>
    </div>
  );
}
