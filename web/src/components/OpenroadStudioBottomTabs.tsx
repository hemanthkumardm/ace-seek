"use client";

/**
 * OpenROAD Studio bottom tabs panel (inputs / flow / sanity / log / reports / artifacts).
 * Tab state ownership stays in the studio page — this is presentational + local filters.
 */

import React, { useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  Download,
  Eraser,
  Eye,
  FileJson,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  ARTIFACT_KIND_TABS,
  artifactMatchesKindTab,
  type ArtifactKindTab,
  type StudioBottomTab,
} from "@/lib/openroad-studio-artifacts-ui";
import type { FlowStageId, StageResultPayload } from "@/lib/openroad-flow-model";
import type { StageArtifact } from "@/lib/openroad-stage-artifacts";
import {
  downloadArtifact,
  downloadStageBundle,
} from "@/lib/openroad-stage-artifacts";
import type {
  SanityItem,
  StageConfigSchema,
  StageInputValues,
} from "@/lib/openroad-stage-config";
import { resolveField } from "@/lib/openroad-stage-config";
import { FLOW_CONFIG_NAME } from "@/lib/openroad-template";
import type { StageAssertion } from "@/lib/openroad-stage-nodes";
import type { OpenroadJobResult } from "@/lib/openroad-run-engine";

export type StudioLogFilter = "stage" | "all" | "error";

export type StudioLogLine = {
  t: string;
  stage: FlowStageId | null;
  level: "info" | "warn" | "error" | "step";
};

export interface OpenroadStudioBottomTabsProps {
  bottomTab: StudioBottomTab;
  setBottomTab: Dispatch<SetStateAction<StudioBottomTab>>;
  logFilter: StudioLogFilter;
  setLogFilter: Dispatch<SetStateAction<StudioLogFilter>>;
  artifactKindTab: ArtifactKindTab;
  setArtifactKindTab: Dispatch<SetStateAction<ArtifactKindTab>>;
  selectedStage: FlowStageId;
  stageMeta: { short: string; label: string };
  stageSchema: StageConfigSchema | undefined;
  stageInputs: StageInputValues;
  stageFlowDraft: string;
  setStageFlowDraft: Dispatch<SetStateAction<string>>;
  stageFlowSlice: unknown;
  flowJsonDraft: string;
  setFlowJsonDraft: Dispatch<SetStateAction<string>>;
  applyStageFlowJson: () => void;
  applyFlowJson: () => void;
  assertShow: StageAssertion[];
  sanityStage: SanityItem[];
  filteredLog: StudioLogLine[];
  stageLogLines: StudioLogLine[];
  stageRt: { logLines: string[] };
  stageResult: StageResultPayload | undefined;
  busy: boolean;
  runningStage: FlowStageId | null;
  runElapsedSec: number;
  runHint: string;
  logEndRef: RefObject<HTMLDivElement | null>;
  selectedArtifacts: StageArtifact[];
  setStageArtifacts: Dispatch<SetStateAction<StageArtifact[]>>;
  previewArtifact: StageArtifact | null;
  setPreviewArtifact: Dispatch<SetStateAction<StageArtifact | null>>;
  previewText: string;
  setPreviewText: Dispatch<SetStateAction<string>>;
  previewBusy: boolean;
  openArtifactPreview: (a: StageArtifact) => void | Promise<void>;
  running: boolean;
  clearWholeFlow: () => void;
  job: OpenroadJobResult | null;
  jobDownloadUrl: (jobId: string, name: string) => string;
}

export function OpenroadStudioBottomTabs({
  bottomTab,
  setBottomTab,
  logFilter,
  setLogFilter,
  artifactKindTab,
  setArtifactKindTab,
  selectedStage,
  stageMeta,
  stageSchema,
  stageInputs,
  stageFlowDraft,
  setStageFlowDraft,
  stageFlowSlice,
  flowJsonDraft,
  setFlowJsonDraft,
  applyStageFlowJson,
  applyFlowJson,
  assertShow,
  sanityStage,
  filteredLog,
  stageLogLines,
  stageRt,
  stageResult,
  busy,
  runningStage,
  runElapsedSec,
  runHint,
  logEndRef,
  selectedArtifacts,
  setStageArtifacts,
  previewArtifact,
  setPreviewArtifact,
  previewText,
  setPreviewText,
  previewBusy,
  openArtifactPreview,
  running,
  clearWholeFlow,
  job,
  jobDownloadUrl,
}: OpenroadStudioBottomTabsProps) {
  const filteredArtifacts = useMemo(
    () =>
      selectedArtifacts.filter((a) =>
        artifactMatchesKindTab(artifactKindTab, a.kind, a.name)
      ),
    [selectedArtifacts, artifactKindTab]
  );

  const artifactTabCounts = useMemo(() => {
    const counts: Record<ArtifactKindTab, number> = {
      all: selectedArtifacts.length,
      logs: 0,
      reports: 0,
      layout: 0,
      metrics: 0,
      vcd: 0,
      other: 0,
    };
    for (const a of selectedArtifacts) {
      for (const t of ARTIFACT_KIND_TABS) {
        if (t.id === "all") continue;
        if (artifactMatchesKindTab(t.id, a.kind, a.name)) counts[t.id]++;
      }
    }
    return counts;
  }, [selectedArtifacts]);

  return (
    <div className="neu-panel flex flex-col min-h-[200px]">
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200/60 items-center">
        <span className="text-[9px] font-black uppercase text-sky-700 px-2 mr-1">
          {stageMeta.short}
        </span>
        {(
          [
            ["inputs", "Inputs"],
            ["flow", "Flow JSON"],
            ["sanity", "Sanity"],
            ["log", "Live log"],
            ["reports", "Stage log"],
            ["artifacts", "Artifacts"],
          ] as const
        ).map(([id, lab]) => (
          <button
            key={id}
            type="button"
            onClick={() => setBottomTab(id)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg ${
              bottomTab === id
                ? "neu-btn-active text-sky-700"
                : "neu-btn"
            }`}
          >
            {lab}
            {id === "sanity" &&
            sanityStage.filter((s) => s.level === "error").length > 0
              ? ` (${sanityStage.filter((s) => s.level === "error").length})`
              : ""}
            {id === "artifacts" && selectedArtifacts.length > 0
              ? ` (${selectedArtifacts.length})`
              : ""}
            {id === "log" && stageLogLines.length > 0
              ? ` (${stageLogLines.length})`
              : ""}
          </button>
        ))}
        {bottomTab === "log" && (
          <div className="ml-auto flex gap-1">
            {(
              [
                ["stage", "This stage"],
                ["error", "Errors"],
                ["all", "Full flow"],
              ] as const
            ).map(([f, lab]) => (
              <button
                key={f}
                type="button"
                onClick={() => setLogFilter(f)}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                  logFilter === f ? "neu-btn-active" : "neu-btn"
                }`}
              >
                {lab}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-[140px] max-h-56 overflow-auto p-3">
        {bottomTab === "inputs" && (
          <div className="text-[10px] font-mono space-y-2 text-[var(--neu-text-muted)]">
            <p className="font-black text-[var(--neu-text)] uppercase">
              {stageMeta.label} · resolved inputs only
            </p>
            {stageSchema ? (
              stageSchema.fields.map((f) => {
                const raw = stageInputs[selectedStage]?.[f.key] ?? "";
                const effective = resolveField(
                  selectedStage,
                  f.key,
                  stageInputs
                );
                return (
                  <div key={f.key} className="neu-inset px-2 py-1.5">
                    <span className="text-sky-700 font-black">
                      {f.key}
                    </span>{" "}
                    <span className="text-[9px] uppercase text-slate-500">
                      {f.label}
                    </span>
                    <div className="text-[var(--neu-text)]">
                      effective:{" "}
                      <code className="text-sky-800">
                        {JSON.stringify(effective)}
                      </code>
                      {raw === "" && (
                        <span className="text-slate-500">
                          {" "}
                          (using default)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No inputs for this stage.</p>
            )}
            <p className="pt-1 font-bold text-[9px]">
              Edit values in the stage panel on the right (or Flow JSON
              tab). Only this stage’s keys are listed here.
            </p>
          </div>
        )}
        {bottomTab === "flow" && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)] flex items-center gap-1">
              <FileJson className="w-3.5 h-3.5" />
              {stageMeta.label} slice of{" "}
              <code className="text-sky-700">{FLOW_CONFIG_NAME}</code>{" "}
              — edit this stage only, then Apply.
            </p>
            <textarea
              className="neu-input w-full h-36 text-[10px] font-mono text-[var(--neu-text)]"
              value={stageFlowDraft}
              onChange={(e) => setStageFlowDraft(e.target.value)}
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="neu-btn neu-btn-primary !text-[10px] font-black"
                onClick={applyStageFlowJson}
              >
                Apply stage JSON
              </button>
              <button
                type="button"
                className="neu-btn !text-[10px] font-black"
                onClick={() =>
                  setStageFlowDraft(
                    JSON.stringify(stageFlowSlice, null, 2) + "\n"
                  )
                }
              >
                Reload from UI
              </button>
              <details className="w-full text-[10px]">
                <summary className="cursor-pointer font-black text-slate-600">
                  Full {FLOW_CONFIG_NAME} (all stages)
                </summary>
                <textarea
                  className="neu-input w-full h-32 text-[10px] font-mono mt-2 text-[var(--neu-text)]"
                  value={flowJsonDraft}
                  onChange={(e) => setFlowJsonDraft(e.target.value)}
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="neu-btn neu-btn-primary !text-[10px] font-black mt-1"
                  onClick={applyFlowJson}
                >
                  Apply full flow JSON
                </button>
              </details>
            </div>
          </div>
        )}
        {bottomTab === "sanity" && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
              Checks for{" "}
              <span className="text-sky-700 font-black uppercase">
                {stageMeta.label}
              </span>{" "}
              — input sanity + node pre/post assertions
            </p>
            {assertShow.map((a, i) => (
              <div
                key={`a-${i}`}
                className={`neu-inset px-3 py-2 text-[11px] font-bold ${
                  a.level === "error"
                    ? "text-rose-700"
                    : a.level === "warn"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}
              >
                <span className="uppercase text-[9px] opacity-70">
                  assert · {a.phase} · {a.id}
                </span>
                <p>{a.message}</p>
              </div>
            ))}
            {sanityStage.map((s, i) => (
              <div
                key={i}
                className={`neu-inset px-3 py-2 text-[11px] font-bold ${
                  s.level === "error"
                    ? "text-rose-700"
                    : "text-amber-700"
                }`}
              >
                <span className="uppercase text-[9px] opacity-70">
                  {s.stage} · {s.code}
                  {s.field ? ` · ${s.field}` : ""}
                </span>
                <p>{s.message}</p>
              </div>
            ))}
            {assertShow.length === 0 && sanityStage.length === 0 && (
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> No issues for this
                stage
              </p>
            )}
          </div>
        )}
        {bottomTab === "log" && (
          <div className="rounded-xl p-3 font-mono text-[11px] leading-relaxed space-y-0.5 min-h-[120px] max-h-56 overflow-auto border border-slate-700 bg-[#0b1220] text-[#e8eef7] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[9px] font-black uppercase text-[#7dd3fc] mb-1">
              {logFilter === "all"
                ? "Full flow log"
                : logFilter === "error"
                  ? `${stageMeta.label} · errors/warnings`
                  : `${stageMeta.label} · live log`}
            </p>
            {(busy || runningStage) &&
              runningStage === selectedStage && (
                <div className="mb-2 rounded-lg border border-sky-500/40 bg-sky-950/50 px-2 py-2 text-[#7dd3fc]">
                  <span className="inline-flex items-center gap-2 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    In progress · {runElapsedSec}s
                  </span>
                  <p className="text-[10px] text-sky-100/90 mt-0.5">
                    {runHint}
                  </p>
                </div>
              )}
            {filteredLog.length === 0 && !(busy || runningStage) && (
              <p className="text-[#94a3b8]">
                No log for {stageMeta.label} yet — run this stage.
                {logFilter !== "all" && (
                  <>
                    {" "}
                    Or switch to <strong>Full flow</strong> to see
                    everything.
                  </>
                )}
              </p>
            )}
            {filteredLog.length === 0 &&
              (busy || runningStage) &&
              runningStage === selectedStage && (
                <p className="text-[#94a3b8]">
                  {runHint || "This stage is running… progress updates will appear here."}
                </p>
              )}
            {filteredLog.map((l, i) => (
              <div
                key={i}
                className={
                  l.level === "error"
                    ? "text-[#ff6b7a] font-semibold"
                    : l.level === "warn"
                      ? "text-[#fbbf24] font-semibold"
                      : l.level === "step"
                        ? "text-[#38bdf8] font-bold"
                        : "text-[#e8eef7]"
                }
              >
                {logFilter === "all" && l.stage && (
                  <span className="text-[#7dd3fc] mr-1.5 opacity-90">
                    [{l.stage}]
                  </span>
                )}
                {l.t}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
        {bottomTab === "reports" && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
              Stage log for{" "}
              <span className="text-sky-700 font-black uppercase">
                {stageMeta.label}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedArtifacts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="neu-btn !text-[9px] font-black inline-flex items-center gap-1"
                  onClick={() => downloadArtifact(a)}
                >
                  <Download className="w-3 h-3" /> {a.kind}: {a.name}
                </button>
              ))}
              {selectedArtifacts.length > 0 && (
                <button
                  type="button"
                  className="neu-btn neu-btn-primary !text-[9px] font-black inline-flex items-center gap-1"
                  onClick={() =>
                    downloadStageBundle(
                      selectedStage,
                      selectedArtifacts
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Download stage bundle
                </button>
              )}
            </div>
            <pre className="rounded-xl p-3 text-[11px] font-mono whitespace-pre-wrap max-h-48 overflow-auto border border-slate-700 bg-[#0b1220] text-[#e8eef7] leading-relaxed">
              {stageLogLines.map((l) => l.t).join("\n") ||
                stageRt.logLines.join("\n") ||
                (stageResult && "log" in stageResult
                  ? stageResult.log
                  : `No ${stageMeta.label} log yet — run this stage.`)}
            </pre>
          </div>
        )}
        {bottomTab === "artifacts" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
                Artifacts for{" "}
                <span className="text-sky-700 font-black uppercase">
                  {stageMeta.label}
                </span>{" "}
                only — switch the left rail to see other stages.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {filteredArtifacts.length > 0 && (
                  <button
                    type="button"
                    className="neu-btn neu-btn-primary !text-[9px] font-black inline-flex items-center gap-1"
                    onClick={() =>
                      downloadStageBundle(
                        selectedStage,
                        filteredArtifacts
                      )
                    }
                  >
                    <Download className="w-3 h-3" /> Bundle
                    {artifactKindTab !== "all"
                      ? ` (${artifactKindTab})`
                      : ""}
                  </button>
                )}
                <button
                  type="button"
                  disabled={running || selectedArtifacts.length === 0}
                  className="neu-btn !text-[9px] font-black text-amber-700 inline-flex items-center gap-1 disabled:opacity-40"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Clear artifacts for ${stageMeta.label} only?`
                      )
                    )
                      return;
                    setStageArtifacts((prev) =>
                      prev.filter((a) => a.stage !== selectedStage)
                    );
                  }}
                >
                  <Eraser className="w-3 h-3" /> Clear stage artifacts
                </button>
                <button
                  type="button"
                  disabled={running}
                  className="neu-btn !text-[9px] font-black text-rose-700 inline-flex items-center gap-1 disabled:opacity-40"
                  onClick={() => clearWholeFlow()}
                >
                  <Trash2 className="w-3 h-3" /> Clear whole flow
                </button>
              </div>
            </div>

            {/* Kind tabs: Logs / Reports / Layout / … */}
            <div className="flex flex-wrap gap-1">
              {ARTIFACT_KIND_TABS.map((t) => {
                const count = artifactTabCounts[t.id];
                if (t.id !== "all" && count === 0 && t.id === "vcd" && selectedStage !== "simulation")
                  return null;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setArtifactKindTab(t.id)}
                    className={`neu-btn !text-[9px] !px-2 !py-1 font-black uppercase tracking-wide ${
                      artifactKindTab === t.id
                        ? "neu-btn-primary"
                        : "opacity-80"
                    }`}
                  >
                    {t.label}
                    <span className="ml-1 opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>

            {selectedArtifacts.length === 0 ? (
              <p className="text-[11px] font-bold text-[var(--neu-text-muted)] neu-inset p-4">
                No artifacts for <strong>{stageMeta.label}</strong> yet.
                Run this stage to collect logs/reports
                {selectedStage === "simulation" ? " / VCD" : ""}
                {selectedStage === "synthesis"
                  ? " / netlist / area reports"
                  : ""}
                .
              </p>
            ) : filteredArtifacts.length === 0 ? (
              <p className="text-[11px] font-bold text-[var(--neu-text-muted)] neu-inset p-4">
                No <strong>{artifactKindTab}</strong> artifacts for{" "}
                {stageMeta.label}. Try another tab.
              </p>
            ) : (
              <div className="grid lg:grid-cols-2 gap-3 min-h-0">
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {filteredArtifacts.map((a) => (
                    <li
                      key={a.id}
                      className={`neu-inset flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px] font-bold ${
                        previewArtifact?.id === a.id
                          ? "ring-1 ring-sky-500"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 truncate text-left flex-1 hover:text-sky-700"
                        title="Preview"
                        onClick={() => void openArtifactPreview(a)}
                      >
                        <span className="text-sky-700 uppercase mr-1.5">
                          [{a.kind}]
                        </span>
                        {a.name}
                        <span className="text-[var(--neu-text-muted)] ml-1">
                          {a.size > 0
                            ? a.size > 1024
                              ? `${(a.size / 1024).toFixed(1)} KB`
                              : `${a.size} B`
                            : ""}
                        </span>
                      </button>
                      <span className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          className="neu-btn !text-[9px] font-black inline-flex items-center gap-1"
                          onClick={() => void openArtifactPreview(a)}
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          type="button"
                          disabled={!a.content && !a.jobDownload}
                          className="neu-btn !text-[9px] font-black inline-flex items-center gap-1 disabled:opacity-40"
                          onClick={() => downloadArtifact(a)}
                        >
                          <Download className="w-3 h-3" /> Save
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="neu-inset flex flex-col min-h-[12rem] max-h-64 overflow-hidden">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200/80 shrink-0">
                    <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)] truncate">
                      Preview
                      {previewArtifact
                        ? ` · ${previewArtifact.name}`
                        : " · click View on a file"}
                    </p>
                    {previewArtifact && (
                      <button
                        type="button"
                        className="text-[9px] font-black text-slate-500 hover:text-rose-600"
                        onClick={() => {
                          setPreviewArtifact(null);
                          setPreviewText("");
                        }}
                      >
                        Close
                      </button>
                    )}
                  </div>
                  <pre className="flex-1 overflow-auto p-2 text-[10px] font-mono whitespace-pre-wrap leading-relaxed text-[#e8eef7] bg-[#0b1220]">
                    {previewBusy
                      ? "Loading…"
                      : previewText ||
                        "Select a log or report and click View to read it here before downloading."}
                  </pre>
                </div>
              </div>
            )}

            {/* Job files for this stage only (not yet stored) */}
            {job &&
              job.artifacts
                ?.filter((ja) => {
                  const inferred = (() => {
                    const n = ja.name.toLowerCase();
                    if (/synthesis|yosys|synth|nl\.v|area_0/.test(n))
                      return "synthesis";
                    if (/floorplan|initial_fp|tap|pdn|place_io/.test(n))
                      return /pdn|power/.test(n)
                        ? "powerplan"
                        : "floorplan";
                    if (/placement|gpl|dpl/.test(n)) return "placement";
                    if (/\bcts\b/.test(n)) return "cts";
                    if (/routing|route|grt/.test(n)) return "route";
                    if (/\.gds|signoff|magic|klayout/.test(n)) return "gds";
                    if (/metrics/.test(n)) return "gds";
                    return null;
                  })();
                  if (inferred !== selectedStage) return false;
                  if (
                    selectedArtifacts.some(
                      (sa) =>
                        sa.name === ja.name ||
                        sa.jobDownload?.name === ja.name
                    )
                  )
                    return false;
                  // Classify job file for kind tab
                  const k = /\.log|\.warnings|\.errors|logs_/i.test(ja.name)
                    ? "log"
                    : /\.odb|\.def|\.gds/i.test(ja.name)
                      ? "def"
                      : /metrics/i.test(ja.name)
                        ? "metrics"
                        : /\.rpt|report/i.test(ja.name)
                          ? "report"
                          : "other";
                  return artifactMatchesKindTab(
                    artifactKindTab,
                    k,
                    ja.name
                  );
                })
                .map((a) => {
                  const text = a.content;
                  if (text != null) {
                    return (
                      <button
                        key={a.name}
                        type="button"
                        className="neu-btn !text-[10px] font-black inline-flex items-center gap-1 mr-2"
                        onClick={() =>
                          downloadArtifact({
                            id: `job::${a.name}`,
                            stage: selectedStage,
                            name: a.name,
                            kind: "other",
                            content: text,
                            size: text.length,
                            createdAt: new Date().toISOString(),
                          })
                        }
                      >
                        <Download className="w-3 h-3" /> {a.name}
                      </button>
                    );
                  }
                  return (
                    <a
                      key={a.name}
                      href={jobDownloadUrl(job.jobId, a.name)}
                      className="neu-btn !text-[10px] font-black inline-flex items-center gap-1 mr-2"
                    >
                      <Download className="w-3 h-3" /> {a.name}
                    </a>
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}
