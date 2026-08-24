"use client";

import React from "react";
import type { FlowMetrics, VcdActivityBin } from "@/lib/openroad-flow-model";
import { buildClockWaveSamples } from "@/lib/openroad-flow-model";

/** VCD toggle-rate / estimated activity power timeline */
export function ActivityTimeline({
  bins,
  powerSeries,
  timescaleHint,
  signalCount,
  totalToggles,
}: {
  bins: VcdActivityBin[];
  powerSeries?: { t: number; powerMw: number }[];
  timescaleHint?: string;
  signalCount?: number;
  totalToggles?: number;
}) {
  if (!bins.length) {
    return (
      <p className="text-[10px] font-bold text-slate-500">
        Activity timeline: run Simulation (VCD) to see toggle-rate over time.
      </p>
    );
  }
  const maxT = Math.max(1, ...bins.map((b) => b.toggles));
  const maxP = Math.max(
    1e-9,
    ...(powerSeries || []).map((p) => p.powerMw),
    0
  );
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase text-slate-500">
        Activity / power (VCD)
      </p>
      <p className="text-[9px] font-bold text-slate-500">
        {signalCount != null ? `${signalCount} scalars · ` : ""}
        {totalToggles != null ? `${totalToggles} toggles` : ""}
        {timescaleHint ? ` · ${timescaleHint}` : ""}
      </p>
      <div className="flex items-end gap-px h-16 neu-inset p-1">
        {bins.map((b, i) => (
          <div
            key={i}
            className="flex-1 bg-amber-500/80 min-w-0 rounded-sm"
            style={{ height: `${(b.toggles / maxT) * 100}%` }}
            title={`t=${b.t0}–${b.t1}: ${b.toggles} toggles`}
          />
        ))}
      </div>
      {powerSeries && powerSeries.length > 0 && (
        <>
          <p className="text-[9px] font-black uppercase text-slate-500">
            Est. power envelope (mW)
          </p>
          <div className="flex items-end gap-px h-12 neu-inset p-1">
            {powerSeries.map((p, i) => (
              <div
                key={i}
                className="flex-1 bg-rose-500/70 min-w-0 rounded-sm"
                style={{ height: `${(p.powerMw / maxP) * 100}%` }}
                title={`~${p.powerMw.toFixed(3)} mW`}
              />
            ))}
          </div>
          <p className="text-[8px] font-bold text-slate-400">
            Educational: leakage + dynamic×(toggle rate / mean). Not signoff
            vector power — use SAIF + liberty for production.
          </p>
        </>
      )}
    </div>
  );
}

/** Horizontal bar histogram for path slack bins */
export function SlackHistogram({
  data,
}: {
  data: FlowMetrics["slackHistogram"];
}) {
  if (!data.length) {
    return (
      <p className="text-[10px] font-bold text-slate-500">
        Path slack histogram: no real path data yet
      </p>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase text-slate-500">
        Path slack histogram (ns)
      </p>
      {data.map((d) => (
        <div key={d.bin} className="flex items-center gap-2 text-[10px] font-mono">
          <span className="w-16 text-slate-500 shrink-0">{d.bin}</span>
          <div className="flex-1 h-3 neu-inset overflow-hidden">
            <div
              className="h-full bg-sky-500"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-slate-600">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export function StackedBars({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; color: string }[];
}) {
  if (!items.length) return null;
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase text-slate-500">{title}</p>
      <div className="flex h-4 w-full overflow-hidden neu-inset">
        {items.map((i) => (
          <div
            key={i.label}
            style={{
              width: `${(i.value / total) * 100}%`,
              background: i.color,
            }}
            title={`${i.label}: ${i.value.toFixed(2)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-slate-500">
        {items.map((i) => (
          <span key={i.label} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ background: i.color }}
            />
            {i.label} {i.value.toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MetricTiles({ metrics }: { metrics: FlowMetrics }) {
  const tiles = [
    { k: "WNS", v: metrics.wnsNs != null ? `${metrics.wnsNs.toFixed(3)} ns` : "—" },
    { k: "TNS", v: metrics.tnsNs != null ? `${metrics.tnsNs.toFixed(3)} ns` : "—" },
    {
      k: "Power",
      v: metrics.powerMw != null ? `${metrics.powerMw.toFixed(2)} mW` : "—",
    },
    {
      k: "Area",
      v: metrics.areaUm2 != null ? `${metrics.areaUm2.toFixed(0)} µm²` : "—",
    },
    {
      k: "Util",
      v:
        metrics.utilizationPct != null
          ? `${metrics.utilizationPct.toFixed(1)}%`
          : "—",
    },
    {
      k: "Cells",
      v: metrics.cellCount != null ? String(metrics.cellCount) : "—",
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((t) => (
        <div key={t.k} className="neu-inset px-2 py-2 text-center">
          <p className="text-[9px] font-black uppercase text-slate-500">{t.k}</p>
          <p className="text-xs font-black text-sky-700 font-mono">{t.v}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Ideal clock sketch from a *known* period (SDC or user stage input).
 * No silent 10ns template — returns empty state if period is missing/invalid.
 */
export function ClockWaveform({
  periodNs,
  riseNs = 0,
  fallNs,
  source,
  clockName,
}: {
  periodNs: number | null | undefined;
  riseNs?: number;
  fallNs?: number;
  /** Where period came from — shown in label */
  source?: "sdc" | "stage_input" | null;
  clockName?: string;
}) {
  if (periodNs == null || !Number.isFinite(periodNs) || periodNs <= 0) {
    return (
      <div className="neu-inset p-3 text-[10px] font-bold text-[var(--neu-text-muted)]">
        <p className="font-black uppercase text-[9px] mb-1">Clock waveform</p>
        No period yet — upload SDC with{" "}
        <code className="text-sky-700">create_clock -period …</code> or set
        Synthesis → Clock period. (No static 10 ns template.)
      </div>
    );
  }

  const pts = buildClockWaveSamples(periodNs, 4, riseNs, fallNs);
  if (!pts.length) {
    return (
      <div className="neu-inset p-3 text-[10px] font-bold text-[var(--neu-text-muted)]">
        Invalid clock period.
      </div>
    );
  }

  const W = 320;
  const H = 56;
  const tMax = pts[pts.length - 1]?.t || periodNs * 4;
  const x = (t: number) => (t / tMax) * (W - 20) + 10;
  const y = (v: number) => (v ? 12 : H - 14);
  let d = "";
  pts.forEach((p, i) => {
    if (i === 0) d += `M ${x(p.t)} ${y(p.v)}`;
    else {
      const prev = pts[i - 1];
      d += ` L ${x(p.t)} ${y(prev.v)} L ${x(p.t)} ${y(p.v)}`;
    }
  });
  const mhz = (1000 / periodNs).toFixed(1);
  const srcLabel =
    source === "sdc"
      ? "from SDC"
      : source === "stage_input"
        ? "from stage input"
        : "";

  return (
    <div>
      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">
        Clock{clockName ? ` ${clockName}` : ""} · T={periodNs} ns · {mhz} MHz
        {srcLabel ? ` · ${srcLabel}` : ""}
      </p>
      <p className="text-[9px] font-bold text-slate-400 mb-1">
        Ideal edges from period (not a live sim VCD)
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-14 neu-inset bg-slate-900"
      >
        <line
          x1={10}
          x2={W - 10}
          y1={H / 2}
          y2={H / 2}
          stroke="#334155"
          strokeDasharray="2 2"
        />
        <path d={d} fill="none" stroke="#38bdf8" strokeWidth={2} />
      </svg>
    </div>
  );
}

/** Digital waveform from real sim VCD samples (or log-derived stubs). */
export function DigitalWaveform({
  samples,
  title,
}: {
  samples: { t: number; v: number; name: string }[];
  title?: string;
}) {
  if (!samples.length) {
    return (
      <div className="neu-inset p-4 text-[11px] font-bold text-[var(--neu-text-muted)]">
        No waveform yet — run Simulation with a testbench that dumps VCD
        ($dumpfile / $dumpvars).
      </div>
    );
  }
  const name = samples[0]?.name || "sig";
  const W = 420;
  const H = 72;
  const t0 = samples[0].t;
  const t1 = samples[samples.length - 1].t;
  const span = Math.max(1, t1 - t0);
  const vmax = Math.max(1, ...samples.map((s) => Math.abs(s.v)));
  const isDigital = samples.every((s) => s.v === 0 || s.v === 1);
  const x = (t: number) => ((t - t0) / span) * (W - 24) + 12;
  const y = (v: number) => {
    if (isDigital) return v ? 14 : H - 16;
    return H - 16 - (v / vmax) * (H - 30);
  };
  let d = "";
  samples.forEach((p, i) => {
    if (i === 0) d += `M ${x(p.t)} ${y(p.v)}`;
    else if (isDigital) {
      const prev = samples[i - 1];
      d += ` L ${x(p.t)} ${y(prev.v)} L ${x(p.t)} ${y(p.v)}`;
    } else {
      d += ` L ${x(p.t)} ${y(p.v)}`;
    }
  });
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">
        {title || "Sim waveform"} · {name} · {samples.length} samples
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-20 neu-inset bg-slate-900"
      >
        <line
          x1={12}
          x2={W - 12}
          y1={H / 2}
          y2={H / 2}
          stroke="#334155"
          strokeDasharray="2 2"
        />
        <path d={d} fill="none" stroke="#34d399" strokeWidth={2} />
      </svg>
      <p className="text-[9px] font-bold text-slate-400 mt-1">
        t={t0}…{t1} (VCD units)
      </p>
    </div>
  );
}
