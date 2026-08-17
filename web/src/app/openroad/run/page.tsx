"use client";

import React, { useEffect, useState } from "react";
import { Play, Download, Loader2 } from "lucide-react";
import {
  loadOpenroadProject,
  projectHealth,
  type OpenroadProjectState,
} from "@/lib/openroad-project-hub";
import {
  executeOpenroadJob,
  type OpenroadJobResult,
} from "@/lib/openroad-run-engine";
import { downloadTextFile } from "@/lib/openroad-format";

export default function OpenroadRunPage() {
  const [project, setProject] = useState<OpenroadProjectState | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpenroadJobResult | null>(null);
  const [mode, setMode] = useState<"dry_run" | "container">("dry_run");

  useEffect(() => {
    setProject(loadOpenroadProject());
  }, []);

  if (!project) {
    return (
      <div className="m-shell py-10 text-sm font-bold text-slate-500">
        Loading…
      </div>
    );
  }

  const health = projectHealth(project);

  const onRun = () => {
    setBusy(true);
    setResult(null);
    // Keep sync for now; workers will be async later
    window.setTimeout(() => {
      const res = executeOpenroadJob({ project, mode });
      setResult(res);
      setBusy(false);
    }, 400);
  };

  return (
    <div className="m-shell py-8 space-y-6 font-mono">
      <div className="border-b-4 border-black pb-4 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">
            OpenROAD · Run · Max
          </p>
          <h1 className="text-2xl font-black uppercase text-slate-900 flex items-center gap-2">
            <Play className="w-6 h-6" /> Job runner
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-1 max-w-2xl">
            Max executes the same scripts Pro downloads.{" "}
            <strong>Dry-run</strong> is live (synthetic OpenSTA log).{" "}
            <strong>Container</strong> mode waits for Docker workers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border-2 border-black px-2 py-2 text-xs font-black"
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "dry_run" | "container")
            }
          >
            <option value="dry_run">dry_run (live)</option>
            <option value="container">container (workers)</option>
          </select>
          <button
            type="button"
            disabled={busy || !health.readyForScripts}
            onClick={onRun}
            className="brutal-btn brutal-btn-yellow !text-sm font-black flex items-center gap-2 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Queue job
          </button>
        </div>
      </div>

      {!health.readyForScripts && (
        <div className="brutal-panel p-4 border-3 border-black bg-amber-50 text-xs font-bold">
          Need constraints.sdc —{" "}
          <a href="/openroad/project" className="underline">
            open Project
          </a>
          .
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div
            className={`brutal-panel p-4 border-3 border-black text-xs font-bold ${
              result.status === "succeeded"
                ? "bg-emerald-50"
                : result.status === "rejected"
                  ? "bg-amber-50"
                  : "bg-rose-50"
            }`}
          >
            <p className="font-black uppercase">
              {result.status} · {result.jobId}
            </p>
            <p className="mt-1">{result.message}</p>
            {result.metrics && (
              <p className="mt-2 text-slate-700">
                WNS {result.metrics.wnsNs} ns · TNS {result.metrics.tnsNs} ns ·
                area ~{result.metrics.designAreaUm2} µm²
              </p>
            )}
            <button
              type="button"
              className="mt-3 brutal-btn bg-white !text-xs font-black inline-flex items-center gap-1"
              onClick={() =>
                downloadTextFile(
                  `${result.jobId}-timing.rpt`,
                  result.log
                )
              }
            >
              <Download className="w-3.5 h-3.5" />
              Download log / report
            </button>
          </div>
          <pre className="brutal-panel p-4 border-3 border-black bg-slate-900 text-amber-100 text-[10px] overflow-auto max-h-96 whitespace-pre-wrap">
            {result.log}
          </pre>
        </div>
      )}
    </div>
  );
}
