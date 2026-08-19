"use client";

import React from "react";
import type { ChipSnapshot, FlowStageId } from "@/lib/openroad-flow-model";

const KIND_FILL: Record<string, string> = {
  std: "#22d3ee",
  macro: "#a78bfa",
  io: "#fbbf24",
  clk: "#f472b6",
  tap: "#4ade80",
  endcap: "#fb923c",
  decap: "#38bdf8",
};

const PDN_STROKE = {
  power: "#f87171",
  ground: "#60a5fa",
  signal: "#94a3b8",
};

type Props = {
  chip: ChipSnapshot;
  stageLabel?: string;
  className?: string;
};

/**
 * Chip canvas:
 * - Intent: DIE/CORE from floorplan form
 * - Result: DEF — taps, endcaps, decaps + SPECIALNETS power mesh
 */
export function OpenroadChipCanvas({ chip, stageLabel, className }: Props) {
  const pad = 8;
  const W = 420;
  const H = 420;
  const dieW = Math.max(1e-6, chip.dieW);
  const dieH = Math.max(1e-6, chip.dieH);
  // DEF origin is bottom-left; SVG is top-left → flip Y
  const sx = (x: number) => pad + (x / dieW) * (W - pad * 2);
  const sy = (y: number) => pad + ((dieH - y) / dieH) * (H - pad * 2);
  const sw = (w: number) => (w / dieW) * (W - pad * 2);
  const sh = (h: number) => (h / dieH) * (H - pad * 2);

  const mode = chip.mode || (chip.cells.length ? "result" : "empty");
  const modeBadge = mode === "result" ? "Result · DEF" : "Empty";
  const modeClass =
    mode === "result"
      ? "text-emerald-400 bg-emerald-950/80 border-emerald-700"
      : "text-slate-400 bg-slate-900 border-slate-700";

  const tapN = chip.stats?.tapCount;
  const endN = chip.stats?.endcapCount;
  const pdnN = chip.stats?.pdnCount;
  const shownTaps = chip.cells.filter((c) => c.kind === "tap").length;
  const shownEnds = chip.cells.filter((c) => c.kind === "endcap").length;
  const shownPdn = chip.routes.filter(
    (r) => r.kind === "power" || r.kind === "ground"
  ).length;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">Chip · {stageLabel || chip.stage}</span>
          <span
            className={`shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded border ${modeClass}`}
            title={chip.sourceLabel || modeBadge}
          >
            {modeBadge}
          </span>
        </div>
        <span className="text-slate-500 normal-case font-bold">
          die {chip.dieW.toFixed(1)}×{chip.dieH.toFixed(1)} µm
          {tapN != null && <> · tap {tapN}</>}
          {endN != null && <> · endcap {endN}</>}
          {pdnN != null && <> · pdn {pdnN}</>}
        </span>
      </div>
      {chip.sourceLabel && (
        <p className="text-[9px] font-bold text-slate-500 mb-1.5 normal-case tracking-normal">
          {chip.sourceLabel}
        </p>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto border-2 border-black bg-slate-950 rounded-sm shadow-[4px_4px_0_#000]"
      >
        {/* die */}
        <rect
          x={pad}
          y={pad}
          width={W - pad * 2}
          height={H - pad * 2}
          fill="#0f172a"
          stroke={mode === "result" ? "#34d399" : "#475569"}
          strokeWidth={2}
        />
        {/* core — flip Y: top of rect is coreY+coreH in DEF */}
        <rect
          x={sx(chip.coreX)}
          y={sy(chip.coreY + chip.coreH)}
          width={sw(chip.coreW)}
          height={sh(chip.coreH)}
          fill="#1e293b"
          stroke="#64748b"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        {/* Power mesh under cells — die-relative 0..1, Y flipped */}
        {chip.routes.map((r, i) => {
          const kind = r.kind || "signal";
          const stroke =
            PDN_STROKE[kind as keyof typeof PDN_STROKE] || PDN_STROKE.signal;
          // width is fraction of die; make straps visible
          const lw = Math.max(
            1.2,
            Math.min(5, (r.width || 0.0003) * (W - pad * 2) * 8)
          );
          return (
            <line
              key={`pdn${i}`}
              x1={sx(r.x1 * dieW)}
              y1={sy(r.y1 * dieH)}
              x2={sx(r.x2 * dieW)}
              y2={sy(r.y2 * dieH)}
              stroke={stroke}
              strokeWidth={lw}
              opacity={kind === "signal" ? 0.35 : 0.85}
              strokeLinecap="butt"
            />
          );
        })}
        {/* Cells: DEF bottom-left origin → flip Y (rect top = y+h) */}
        {chip.cells.map((c, i) => {
          const dieX = chip.coreX + c.x * chip.coreW;
          const dieY = chip.coreY + c.y * chip.coreH;
          const cw = Math.max(0.8, sw(c.w * chip.coreW));
          const ch = Math.max(0.8, sh(c.h * chip.coreH));
          return (
            <rect
              key={i}
              x={sx(dieX)}
              y={sy(dieY + c.h * chip.coreH)}
              width={cw}
              height={ch}
              fill={KIND_FILL[c.kind] || "#94a3b8"}
              opacity={
                c.kind === "tap"
                  ? 0.75
                  : c.kind === "endcap"
                    ? 0.95
                    : c.kind === "std"
                      ? 0.55
                      : 0.85
              }
              stroke={c.kind === "endcap" ? "#9a3412" : "none"}
              strokeWidth={c.kind === "endcap" ? 0.3 : 0}
            />
          );
        })}
        {/* legend */}
        <g transform={`translate(${pad + 4}, ${H - pad - 28})`}>
          {(
            [
              ["tap", "Tap"],
              ["endcap", "Endcap"],
              ["decap", "Decap"],
              ["io", "IO"],
            ] as const
          ).map(([k, lab], i) => (
            <g key={k} transform={`translate(${(i % 4) * 72}, 0)`}>
              <rect width={8} height={8} fill={KIND_FILL[k]} />
              <text
                x={12}
                y={8}
                fill="#94a3b8"
                fontSize={8}
                fontFamily="monospace"
              >
                {lab}
              </text>
            </g>
          ))}
          <g transform="translate(0, 12)">
            <line
              x1={0}
              y1={4}
              x2={14}
              y2={4}
              stroke={PDN_STROKE.power}
              strokeWidth={2}
            />
            <text x={18} y={7} fill="#94a3b8" fontSize={8} fontFamily="monospace">
              VPWR
            </text>
            <line
              x1={70}
              y1={4}
              x2={84}
              y2={4}
              stroke={PDN_STROKE.ground}
              strokeWidth={2}
            />
            <text x={88} y={7} fill="#94a3b8" fontSize={8} fontFamily="monospace">
              VGND
            </text>
          </g>
        </g>
      </svg>
      {mode === "result" && chip.cells.length === 0 && shownPdn === 0 && (
        <p className="text-[9px] font-bold text-amber-700 mt-2">
          DEF die/core loaded but no FIXED taps/endcaps or SPECIALNETS mesh
          found. Prefer <code>results/floorplan/top.def</code> (not{" "}
          <code>4-io.def</code>). Re-run floorplan or click Load DEF.
        </p>
      )}
      {mode === "result" && (shownTaps > 0 || shownEnds > 0 || shownPdn > 0) && (
        <p className="text-[9px] font-bold text-emerald-700 mt-2">
          Showing sample: {shownEnds} endcap · {shownTaps} tap · {shownPdn} PDN
          straps
          {chip.stats?.sampled ? " (sampled for UI)" : ""}. Full stdcell
          placement appears after Placement.
        </p>
      )}
    </div>
  );
}

export function stageAccent(stage: FlowStageId | "idle"): string {
  const m: Record<string, string> = {
    lint: "bg-slate-500",
    simulation: "bg-teal-500",
    synthesis: "bg-cyan-500",
    io_plan: "bg-indigo-500",
    floorplan: "bg-sky-500",
    powerplan: "bg-amber-500",
    placement: "bg-violet-500",
    cts: "bg-pink-500",
    route: "bg-emerald-500",
    drc: "bg-orange-500",
    lvs: "bg-rose-500",
    gds: "bg-lime-500",
    idle: "bg-slate-500",
  };
  return m[stage] || m.idle;
}
