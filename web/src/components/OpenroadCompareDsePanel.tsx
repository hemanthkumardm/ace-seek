"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  GitCompare,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import type { RunCompareResult, MeasuredPpa } from "@/lib/openroad-compare";

type JobRow = {
  jobId: string;
  status: string;
  designName?: string;
  startedAt?: string;
  metrics?: Record<string, number> | null;
};

type Props = {
  project: OpenroadProjectState;
  apiKey?: string;
  openlaneConfig?: Record<string, string | number | boolean>;
};

function metricLine(m: MeasuredPpa) {
  const bits = [
    m.wnsNs != null ? `WNS ${m.wnsNs.toFixed(3)} ns` : null,
    m.areaUm2 != null ? `Area ${Math.round(m.areaUm2)} µm²` : null,
    m.powerMw != null ? `P ${m.powerMw.toFixed(3)} mW` : null,
    m.density != null ? `dens ${m.density}` : null,
  ].filter(Boolean);
  return bits.join(" · ") || "metrics pending";
}

export function OpenroadCompareDsePanel({
  project,
  apiKey,
  openlaneConfig,
}: Props) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [jobA, setJobA] = useState("");
  const [jobB, setJobB] = useState("");
  const [compare, setCompare] = useState<RunCompareResult | null>(null);
  const [dseId, setDseId] = useState<string | null>(null);
  const [dseVariants, setDseVariants] = useState<MeasuredPpa[]>([]);
  const [pareto, setPareto] = useState<MeasuredPpa[]>([]);
  const [dseNote, setDseNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const headers = useCallback(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) h["x-api-key"] = apiKey;
    return h;
  }, [apiKey]);

  const refreshJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/openroad/job-history?limit=20", {
        headers: headers(),
        cache: "no-store",
      });
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {
      /* */
    }
  }, [headers]);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    if (!dseId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/openroad/dse?dseId=${encodeURIComponent(dseId)}`, {
          headers: headers(),
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled || !data.ok) return;
        setDseVariants(data.variants || []);
        setPareto(data.pareto || []);
        setDseNote(data.note || "");
        if (data.allDone) void refreshJobs();
      } catch {
        /* */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [dseId, headers, refreshJobs]);

  const runCompare = async () => {
    if (!jobA || !jobB) {
      setErr("Pick two jobs to compare");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/openroad/compare", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ jobA, jobB }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCompare(data.compare);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Compare failed");
    } finally {
      setBusy(false);
    }
  };

  const startDse = async () => {
    setBusy(true);
    setErr(null);
    setCompare(null);
    try {
      const periodMatch = project.files
        .find((f) => f.role === "sdc")
        ?.content.match(/-period\s+([0-9.]+)/i);
      const basePeriodNs = periodMatch ? parseFloat(periodMatch[1]) : undefined;
      const res = await fetch("/api/openroad/dse", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          project,
          openlaneConfig,
          untilStage: "placement",
          basePeriodNs,
          densities: [0.45, 0.55, 0.65],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setDseId(data.dseId);
      setDseNote(data.message || "Measured DSE launched");
      void refreshJobs();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "DSE failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="neu-panel p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
            Measured analysis
          </p>
          <h3 className="text-sm font-black uppercase text-[var(--neu-text)] flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-violet-600" /> Compare & DSE
          </h3>
        </div>
        <button
          type="button"
          className="neu-btn !text-[10px] font-black flex items-center gap-1"
          onClick={() => void refreshJobs()}
        >
          <RefreshCw className="w-3 h-3" /> Jobs
        </button>
      </div>

      <p className="text-[10px] font-bold text-[var(--neu-text-muted)] leading-snug">
        Compare two real jobs side-by-side, or launch a <strong>measured</strong> density
        sweep (3 container runs → Pareto from extracted WNS/area/power — not the analytic
        Ace-Matrix model).
      </p>

      {/* Compare */}
      <div className="neu-inset p-3 space-y-2">
        <p className="text-[10px] font-black uppercase text-[var(--neu-text)]">
          Compare two runs
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-[10px] font-bold space-y-1">
            <span className="text-[var(--neu-text-muted)]">Job A</span>
            <select
              className="neu-input w-full px-2 py-1.5 text-[11px] font-mono"
              value={jobA}
              onChange={(e) => setJobA(e.target.value)}
            >
              <option value="">Select…</option>
              {jobs.map((j) => (
                <option key={j.jobId} value={j.jobId}>
                  {j.jobId.slice(0, 14)}… {j.status} {j.designName || ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold space-y-1">
            <span className="text-[var(--neu-text-muted)]">Job B</span>
            <select
              className="neu-input w-full px-2 py-1.5 text-[11px] font-mono"
              value={jobB}
              onChange={(e) => setJobB(e.target.value)}
            >
              <option value="">Select…</option>
              {jobs.map((j) => (
                <option key={`b-${j.jobId}`} value={j.jobId}>
                  {j.jobId.slice(0, 14)}… {j.status} {j.designName || ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          disabled={busy || !jobA || !jobB}
          onClick={() => void runCompare()}
          className="neu-btn neu-btn-primary !text-[10px] font-black disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null} Compare
        </button>
        {compare && (
          <div className="space-y-2 text-[10px] font-bold">
            <p className="text-violet-800 bg-violet-50 border border-violet-200 rounded-lg px-2 py-1.5">
              {compare.verdict}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="neu-inset p-2">
                <p className="font-black text-[var(--neu-text)]">A · {compare.a.jobId.slice(0, 12)}</p>
                <p className="text-[var(--neu-text-muted)]">{metricLine(compare.a)}</p>
              </div>
              <div className="neu-inset p-2">
                <p className="font-black text-[var(--neu-text)]">B · {compare.b.jobId.slice(0, 12)}</p>
                <p className="text-[var(--neu-text-muted)]">{metricLine(compare.b)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[9px]">
              <pre className="neu-inset p-2 max-h-28 overflow-auto whitespace-pre-wrap">
                {["Only A:", ...compare.logDiff.onlyA].join("\n") || "Only A: —"}
              </pre>
              <pre className="neu-inset p-2 max-h-28 overflow-auto whitespace-pre-wrap">
                {["Only B:", ...compare.logDiff.onlyB].join("\n") || "Only B: —"}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Measured DSE */}
      <div className="neu-inset p-3 space-y-2">
        <p className="text-[10px] font-black uppercase text-[var(--neu-text)] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Measured DSE (3 densities)
        </p>
        <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
          Launches three real jobs until <strong>placement</strong> at densities 0.45 / 0.55 /
          0.65, then builds a Pareto frontier from extracted metrics.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void startDse()}
          className="neu-btn neu-btn-primary !text-[10px] font-black disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null} Launch measured DSE
        </button>
        {dseId && (
          <p className="text-[9px] font-mono text-slate-500">dseId={dseId}</p>
        )}
        {dseNote && (
          <p className="text-[10px] font-bold text-amber-800">{dseNote}</p>
        )}
        {dseVariants.length > 0 && (
          <div className="space-y-1">
            {dseVariants.map((v) => (
              <div
                key={v.jobId}
                className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold neu-inset px-2 py-1"
              >
                <span>
                  {v.label || v.jobId.slice(0, 10)} · <span className="font-mono">{v.status}</span>
                </span>
                <span className="text-[var(--neu-text-muted)]">{metricLine(v)}</span>
              </div>
            ))}
          </div>
        )}
        {pareto.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-2 space-y-1">
            <p className="text-[10px] font-black text-emerald-900 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Measured Pareto frontier
            </p>
            {pareto.map((v) => (
              <p key={`p-${v.jobId}`} className="text-[10px] font-bold text-emerald-800">
                {v.label || v.jobId.slice(0, 12)} — {metricLine(v)}
              </p>
            ))}
          </div>
        )}
      </div>

      {err && (
        <p className="text-[10px] font-bold text-rose-700">{err}</p>
      )}
    </div>
  );
}
