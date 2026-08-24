"use client";

import {
  Activity,
  AlertTriangle,
  Eraser,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
  Trash2,
} from "lucide-react";
import type { FlowStageId } from "@/lib/openroad-flow-model";

export type OpenroadStudioToolbarProps = {
  designName: string;
  topModule: string;
  pdk: string;
  cloudReady: boolean;
  cloudProjectId: string | null;
  overall: string;
  percent: number;
  sanityErrors: number;
  sanityWarns: number;
  running: boolean;
  runningStage: FlowStageId | null;
  nextStage: FlowStageId | null;
  selectedStage: FlowStageId;
  stageShort: string;
  stageLabel: string;
  canReRunSelected: boolean;
  canReRunReason?: string;
  completedIncludesSelected: boolean;
  jobId?: string;
  err: string;
  busy: boolean;
  runElapsedSec: number;
  runHint: string;
  onRunNext: () => void;
  onRunSelected: () => void;
  onPoll: () => void;
  onClearStage: () => void;
  onClearAll: () => void;
  onStop: () => void;
};

export function OpenroadStudioToolbar(p: OpenroadStudioToolbarProps) {
  return (
    <>
      <div className="shrink-0 px-4 py-3 flex flex-wrap items-center gap-3 justify-between border-b border-slate-200/80 bg-[var(--neu-bg)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="neu-panel-sm px-3 py-1.5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-black uppercase tracking-wide">
              PnR Studio
            </span>
          </div>
          {p.cloudReady ? (
            <span
              className="text-[9px] font-black uppercase text-emerald-700 neu-inset px-2 py-0.5"
              title={
                p.cloudProjectId
                  ? `Supabase project ${p.cloudProjectId}`
                  : "Supabase ready — will sync on save"
              }
            >
              Cloud
            </span>
          ) : (
            <span
              className="text-[9px] font-black uppercase text-slate-500 neu-inset px-2 py-0.5"
              title="Local storage only — configure Supabase for multi-device"
            >
              Local
            </span>
          )}
          <span className="text-[11px] font-bold text-[var(--neu-text-muted)] truncate">
            {p.designName} · {p.topModule} · {p.pdk}
          </span>
          <span className="neu-inset px-2 py-0.5 text-[10px] font-black uppercase">
            {p.overall} · {p.percent}%
          </span>
          {p.sanityErrors > 0 ? (
            <span className="text-[10px] font-black text-rose-600">
              {p.sanityErrors} sanity err
            </span>
          ) : p.sanityWarns > 0 ? (
            <span className="text-[10px] font-black text-amber-600">
              {p.sanityWarns} warn
            </span>
          ) : (
            <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> inputs ok
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="neu-inset w-28 h-2 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all"
              style={{ width: `${p.percent}%` }}
            />
          </div>
          <button
            type="button"
            disabled={p.running || !p.nextStage}
            onClick={() => p.onRunNext()}
            className="neu-btn neu-btn-primary !text-[11px] !py-2 !px-4 font-black flex items-center gap-1.5 disabled:opacity-50"
            title={
              p.nextStage ? `Run next: ${p.nextStage}` : "All stages done"
            }
          >
            {p.running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {p.running
              ? `Running ${p.runningStage || "…"}…`
              : p.nextStage
                ? `Run ${p.nextStage}`
                : "Flow complete"}
          </button>
          <button
            type="button"
            disabled={p.running || !p.canReRunSelected}
            onClick={() => p.onRunSelected()}
            className="neu-btn !text-[11px] !py-2 !px-3 font-black disabled:opacity-50"
            title={
              p.canReRunSelected
                ? p.completedIncludesSelected
                  ? `Re-run ${p.selectedStage} (invalidates later stages)`
                  : `Run ${p.selectedStage}`
                : p.canReRunReason || "Stage locked"
            }
          >
            {p.completedIncludesSelected
              ? `Re-run ${p.stageShort}`
              : p.selectedStage === "lint"
                ? "Run lint"
                : p.selectedStage === "simulation"
                  ? "Run sim"
                  : `Run ${p.stageShort}`}
          </button>
          {p.jobId && (
            <button
              type="button"
              className="neu-btn !text-[11px] !py-2 !px-2"
              onClick={() => p.onPoll()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={p.running}
            className="neu-btn !text-[10px] !py-2 !px-2 font-black text-amber-700 disabled:opacity-40"
            title={`Clear ${p.stageLabel} + later stages`}
            onClick={() => p.onClearStage()}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden xl:inline ml-1">Clear stage</span>
          </button>
          <button
            type="button"
            disabled={p.running}
            className="neu-btn !text-[10px] !py-2 !px-2 font-black text-rose-700 disabled:opacity-40"
            title="Clear entire flow (all stages)"
            onClick={() => p.onClearAll()}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline ml-1">Clear all</span>
          </button>
          <button
            type="button"
            className="neu-btn !text-[11px] !py-2 !px-2"
            onClick={() => p.onStop()}
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {p.err && (
        <div className="shrink-0 mx-4 mt-2 neu-inset px-3 py-2 text-[11px] font-bold text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {p.err}
        </div>
      )}

      {(p.busy || p.runningStage) && (
        <div className="shrink-0 mx-4 mt-2 neu-panel px-4 py-3 flex flex-wrap items-center gap-3 border border-sky-300/60 bg-sky-50/80">
          <Loader2 className="w-5 h-5 text-sky-600 animate-spin shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase text-sky-800">
              Running {p.runningStage || p.stageShort}
              <span className="ml-2 font-mono text-sky-600 normal-case">
                {Math.floor(p.runElapsedSec / 60)}:
                {String(p.runElapsedSec % 60).padStart(2, "0")}
              </span>
            </p>
            <p className="text-[11px] font-bold text-sky-900/80 truncate">
              {p.runHint || "Working…"}
            </p>
            <div className="mt-2 h-1.5 w-full max-w-md neu-inset overflow-hidden rounded-full">
              <div
                className="h-full bg-sky-500 rounded-full animate-pulse"
                style={{
                  width: `${Math.min(92, 12 + p.runElapsedSec * 2)}%`,
                }}
              />
            </div>
            <p className="text-[9px] font-bold text-slate-500 mt-1">
              Live tool output appears when the stage finishes (or via OpenLane
              poll). Stay on this tab — progress is normal.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
