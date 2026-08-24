"use client";

/**
 * Center stage panel for OpenROAD PnR Studio (lint / sim / io / synth / chip / report).
 */

import React, { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { OpenroadIoPlanner } from "@/components/OpenroadIoPlanner";
import { DigitalWaveform } from "@/components/OpenroadCharts";
import { OpenroadVncModal } from "@/components/openroad/openroad-vnc-modal";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import type { OpenroadJobResult } from "@/lib/openroad-run-engine";
import type { StageInputValues } from "@/lib/openroad-stage-config";
import type { StageArtifact } from "@/lib/openroad-stage-artifacts";
import { downloadArtifact } from "@/lib/openroad-stage-artifacts";
import {
  parseSimpleVcdWave,
  parsePlacementTimingReport,
  listVcdSignals,
  loadLastVcd,
  downloadVcdText,
  openVcdInSurfer,
  type FlowStageId,
  type FlowStageDef,
  type StageResultPayload,
} from "@/lib/openroad-flow-model";

export type OpenroadStudioCenterViewProps = {
  view: FlowStageDef["view"];
  stageMeta: Pick<FlowStageDef, "id" | "label" | "short" | "description">;
  stageResult: StageResultPayload | undefined;
  project: OpenroadProjectState;
  stageInputs: StageInputValues;
  onIoPlanJsonChange: (planJson: string) => void;
  /** From parseOpenroadFlowLog metrics (synth fallback) */
  cellCount: number | null | undefined;
  selectedArtifacts: StageArtifact[];
  selectedStage: FlowStageId;
  job: OpenroadJobResult | null;
  running: boolean;
  apiKeyResolved: () => string;
  setErr: (msg: string) => void;
  setRunHint: (msg: string) => void;
  /** Stage runtime log lines for report view */
  stageLogLines: string[];
};

export function OpenroadStudioCenterView({
  view,
  stageMeta,
  stageResult,
  project,
  stageInputs,
  onIoPlanJsonChange,
  cellCount,
  selectedArtifacts,
  selectedStage,
  job,
  running,
  apiKeyResolved,
  setErr,
  setRunHint,
  stageLogLines,
}: OpenroadStudioCenterViewProps) {
  if (view === "lint") {
    const r = stageResult?.kind === "lint" ? stageResult : null;
    return (
      <div className="neu-panel p-4 space-y-3 h-full">
        <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
          Lint summary
        </p>
        <h2 className="text-lg font-black uppercase">RTL lint</h2>
        {r ? (
          <>
            <p
              className={`text-sm font-black ${
                r.errorCount === 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {r.summary}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="neu-inset p-3 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Errors
                </p>
                <p className="text-xl font-black text-rose-600">
                  {r.errorCount}
                </p>
              </div>
              <div className="neu-inset p-3 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Warnings
                </p>
                <p className="text-xl font-black text-amber-600">
                  {r.warnCount}
                </p>
              </div>
            </div>
            <pre className="neu-inset p-2 text-[10px] font-mono max-h-48 overflow-auto whitespace-pre-wrap text-slate-700">
              {r.log.slice(0, 8000) || "(empty log)"}
            </pre>
          </>
        ) : (
          <p className="text-[11px] font-bold text-[var(--neu-text-muted)]">
            Run Lint (stage 1) to see Verilator summary. No synthetic scores.
          </p>
        )}
      </div>
    );
  }

  if (view === "sim") {
    const r = stageResult?.kind === "sim" ? stageResult : null;
    const cached = loadLastVcd();
    const vcdText = r?.vcd || cached?.vcd || "";
    const vcdName = cached?.filename || "tb_top.vcd";
    const wave =
      r?.wave ||
      (vcdText ? parseSimpleVcdWave(vcdText) : undefined) ||
      [];
    const sigs = vcdText ? listVcdSignals(vcdText, 24) : [];
    return (
      <div className="neu-panel p-4 space-y-3 h-full">
        <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
          Simulation waveform · this panel
        </p>
        <h2 className="text-lg font-black uppercase">Functional sim</h2>
        {r ? (
          <>
            <p
              className={`text-sm font-black ${
                r.ok ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {r.summary}
            </p>
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
              Quick preview below (one signal). For full multi-signal waves use
              Surfer.
            </p>
            <DigitalWaveform
              samples={wave}
              title={
                wave.length
                  ? "Studio preview (from VCD)"
                  : "No samples parsed — open full VCD in Surfer"
              }
            />
            {vcdText ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="neu-btn neu-btn-primary !text-[10px] font-black inline-flex items-center gap-1"
                  onClick={() => openVcdInSurfer(vcdText, vcdName)}
                >
                  <ExternalLink className="w-3 h-3" /> Open in Surfer
                </button>
                <button
                  type="button"
                  className="neu-btn !text-[10px] font-black inline-flex items-center gap-1"
                  onClick={() => downloadVcdText(vcdText, vcdName)}
                >
                  <Download className="w-3 h-3" /> Download {vcdName}
                </button>
              </div>
            ) : (
              <p className="text-[10px] font-bold text-amber-700">
                No VCD captured — ensure testbench has $dumpfile / $dumpvars
                and re-run Simulation.
              </p>
            )}
            {vcdText && (
              <div className="neu-inset p-2 text-[9px] font-bold text-[var(--neu-text-muted)] space-y-1">
                <p className="text-sky-700 font-black uppercase">
                  Surfer (recommended full viewer)
                </p>
                <p>
                  1) Click <strong>Open in Surfer</strong> — downloads VCD and
                  opens{" "}
                  <a
                    href="https://app.surfer-project.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline"
                  >
                    app.surfer-project.org
                  </a>
                </p>
                <p>
                  2) In Surfer: <strong>File → Open</strong> → pick the
                  downloaded <code className="text-sky-700">{vcdName}</code>
                </p>
                <p>
                  Desktop: install Surfer, then{" "}
                  <code className="text-sky-700">surfer {vcdName}</code>
                </p>
                {sigs.length > 0 && (
                  <p className="pt-1 text-slate-500">
                    Signals in dump: {sigs.slice(0, 12).join(", ")}
                    {sigs.length > 12 ? "…" : ""}
                  </p>
                )}
              </div>
            )}
            <pre className="neu-inset p-2 text-[10px] font-mono max-h-32 overflow-auto whitespace-pre-wrap text-slate-700">
              {r.log.slice(0, 4000)}
            </pre>
          </>
        ) : (
          <p className="text-[11px] font-bold text-[var(--neu-text-muted)]">
            Complete Lint first, then Run Simulation. Waveform needs a
            testbench with $dumpfile / $dumpvars (template includes one).
            After SIM_OK, stay on this Simulation stage to preview or open
            Surfer.
          </p>
        )}
      </div>
    );
  }

  if (view === "io") {
    return (
      <OpenroadIoPlanner
        project={project}
        planJson={stageInputs.io_plan?.IO_PLAN_JSON || ""}
        onChange={onIoPlanJsonChange}
      />
    );
  }

  if (view === "synth") {
    const r = stageResult?.kind === "synth" ? stageResult : null;
    const cells = r?.cellCount ?? cellCount;
    return (
      <div className="neu-panel p-4 space-y-3 h-full">
        <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
          Yosys synthesis · Docker
        </p>
        <h2 className="text-lg font-black uppercase">Gate-level netlist</h2>
        <p className="text-[11px] font-bold text-[var(--neu-text-muted)]">
          Runs <strong className="text-[var(--neu-text)]">Yosys</strong> via{" "}
          the platform toolchain.
          RTL → netlist + cell stats only — no die view. Next:{" "}
          <strong className="text-[var(--neu-text)]">IO Planner</strong>{" "}
          (port sides), then Floorplan (OpenLane Docker, Max).
        </p>
        {r || cells != null ? (
          <>
            <p className="text-sm font-black text-sky-700">
              {r?.summary || "Synthesis metrics from run"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="neu-inset p-3 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Cells
                </p>
                <p className="text-xl font-black text-sky-700">
                  {cells != null ? cells : "—"}
                </p>
              </div>
              <div className="neu-inset p-3 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Wires
                </p>
                <p className="text-xl font-black text-sky-700">
                  {r?.wireCount != null ? r.wireCount : "—"}
                </p>
              </div>
            </div>
            {(r?.statsLines?.length || 0) > 0 && (
              <pre className="neu-inset p-2 text-[10px] font-mono max-h-40 overflow-auto text-[var(--neu-text)]">
                {r!.statsLines.join("\n")}
              </pre>
            )}
            {r?.netlist && (
              <details className="neu-inset p-2">
                <summary className="text-[10px] font-black uppercase text-sky-700 cursor-pointer">
                  Netlist preview
                </summary>
                <pre className="text-[9px] font-mono max-h-32 overflow-auto mt-1 text-[var(--neu-text)] whitespace-pre-wrap">
                  {r.netlist.slice(0, 3000)}
                  {r.netlist.length > 3000 ? "\n… (download full from Artifacts)" : ""}
                </pre>
              </details>
            )}
            {r?.log && (
              <pre className="neu-inset p-2 text-[10px] font-mono max-h-32 overflow-auto whitespace-pre-wrap text-[var(--neu-text)]">
                {r.log.slice(-5000)}
              </pre>
            )}
          </>
        ) : (
          <p className="text-[11px] font-bold text-[var(--neu-text-muted)]">
            Complete lint → simulation, then <strong>Run Synthesis</strong>{" "}
            (Yosys in Docker). Netlist appears under Artifacts.
          </p>
        )}
      </div>
    );
  }

  if (view === "chip") {
    // Accurate layout = OpenROAD GUI on real ODB (not DEF canvas snapshot)
    const placeTimingArts = selectedArtifacts.filter(
      (a) =>
        a.stage === "placement" &&
        /^(placement_timing|placement_power|placement_area_util|placement_metrics_summary)\.rpt$/i.test(
          a.name
        )
    );
    type PlaceM = {
      wnsNs?: number;
      tnsNs?: number;
      powerMw?: number;
      areaUm2?: number;
      utilizationPct?: number;
      dynamicMw?: number;
      leakageMw?: number;
    };
    const timingFromArts = placeTimingArts.reduce(
      (acc, a) => {
        if (!a.content) return acc;
        const t = parsePlacementTimingReport(a.content);
        return {
          wnsNs: acc.wnsNs ?? t.wnsNs,
          tnsNs: acc.tnsNs ?? t.tnsNs,
          powerMw: acc.powerMw ?? t.powerMw,
          areaUm2: acc.areaUm2 ?? t.areaUm2,
          utilizationPct: acc.utilizationPct ?? t.utilizationPct,
          dynamicMw: acc.dynamicMw ?? t.dynamicMw,
          leakageMw: acc.leakageMw ?? t.leakageMw,
        };
      },
      {} as PlaceM
    );

    const [vncModalOpen, setVncModalOpen] = useState(false);
    const [vncUrl, setVncUrl] = useState("");
    const [vncOdbLabel, setVncOdbLabel] = useState("top.odb");
    const [vncSessionId, setVncSessionId] = useState("");

    const openStageOdb = async () => {
      setErr("");
      setRunHint(`Opening ${selectedStage} ODB in OpenROAD GUI…`);
      try {
        const key = apiKeyResolved();
        const res = await fetch("/api/openroad/odb/open", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
          },
          body: JSON.stringify({
            stage: selectedStage,
            jobId: job?.jobId,
            designHint: project?.designName,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setErr(data.error || data.message || "Failed to open ODB");
          setRunHint("");
          return;
        }
        if (data.webUrl) {
          setVncUrl(data.webUrl);
          setVncOdbLabel(data.label || `${selectedStage} / top.odb`);
          setVncSessionId(data.sessionId || "");
          setVncModalOpen(true);
        }
        setRunHint(
          data.message ||
            `OpenROAD GUI: ${data.label || data.odb} (DISPLAY=${data.display})`
        );
      } catch (e) {
        setErr(e instanceof Error ? e.message : "ODB open failed");
        setRunHint("");
      }
    };

    const onUploadOdb = async (file: File | null) => {
      if (!file) return;
      setErr("");
      setRunHint(
        `Uploading ${file.name} (${(file.size / 1e6).toFixed(1)} MB) → OpenROAD…`
      );
      try {
        const key = apiKeyResolved();
        // Raw octet-stream avoids Next.js FormData parse failures on large ODBs
        const res = await fetch("/api/openroad/odb/upload?open=1", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "content-type": "application/octet-stream",
            "x-odb-filename": file.name || "design.odb",
          },
          body: file,
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setErr(data.error || data.message || "ODB upload/open failed");
          setRunHint("");
          return;
        }
        if (data.webUrl) {
          setVncUrl(data.webUrl);
          setVncOdbLabel(file.name || "uploaded.odb");
          setVncSessionId(data.sessionId || "");
          setVncModalOpen(true);
        }
        setRunHint(
          data.message ||
            `OpenROAD GUI opened uploaded ODB (${data.odb || file.name})`
        );
      } catch (e) {
        setErr(e instanceof Error ? e.message : "ODB upload failed");
        setRunHint("");
      }
    };

    return (
      <div className="neu-panel p-4 h-full space-y-3 overflow-auto">
        <OpenroadVncModal
          isOpen={vncModalOpen}
          onClose={() => setVncModalOpen(false)}
          webUrl={vncUrl}
          stageName={stageMeta.label}
          odbLabel={vncOdbLabel}
          sessionId={vncSessionId}
          apiKey={apiKeyResolved()}
        />
        <div>
          <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
            Layout viewer · real OpenROAD
          </p>
          <h2 className="text-lg font-black uppercase">{stageMeta.label}</h2>
          <p className="text-[11px] font-bold text-[var(--neu-text-muted)] mt-1 max-w-2xl">
            Stream the native <strong className="text-[var(--neu-text)]">OpenROAD Desktop GUI</strong>{" "}
            in your browser to inspect exact IO ports, well taps, endcaps, and PDN rings/straps.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            className="neu-btn neu-btn-primary !text-[11px] font-black"
            onClick={() => void openStageOdb()}
            disabled={running}
          >
            Open {stageMeta.short} in OpenROAD GUI
          </button>
          {vncUrl && (
            <button
              type="button"
              className="neu-btn !text-[11px] font-black text-emerald-600 border-emerald-600/40 hover:bg-emerald-500/10"
              onClick={() => setVncModalOpen(true)}
            >
              Resume OpenROAD Stream
            </button>
          )}
          <label className="neu-btn !text-[11px] font-black cursor-pointer inline-flex items-center">
            Upload .odb → OpenROAD
            <input
              type="file"
              accept=".odb"
              className="hidden"
              onChange={(e) =>
                void onUploadOdb(e.target.files?.[0] || null)
              }
            />
          </label>
        </div>

        <div className="neu-inset p-3 text-[10px] font-bold text-[var(--neu-text-muted)] space-y-1">
          <p>
            Needs a display for the GUI window (
            <code className="text-sky-700">DISPLAY</code> on the server). If
            nothing opens, run{" "}
            <code className="text-sky-700">xhost +local:docker</code> once.
          </p>
          <p>
            Stage ODB path (OpenLane):{" "}
            <code className="text-sky-700">
              runs/ace_run/results/
              {selectedStage === "powerplan"
                ? "floorplan"
                : selectedStage === "route"
                  ? "routing"
                  : selectedStage}
              /top.odb
            </code>
          </p>
        </div>

        {selectedStage === "placement" &&
          (timingFromArts.wnsNs != null ||
            timingFromArts.tnsNs != null ||
            timingFromArts.powerMw != null ||
            timingFromArts.areaUm2 != null) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="neu-inset p-2 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  WNS (ns)
                </p>
                <p
                  className={`text-lg font-black ${
                    (timingFromArts.wnsNs ?? 0) < 0
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {timingFromArts.wnsNs != null
                    ? timingFromArts.wnsNs.toFixed(3)
                    : "—"}
                </p>
              </div>
              <div className="neu-inset p-2 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  TNS (ns)
                </p>
                <p className="text-lg font-black text-sky-700">
                  {timingFromArts.tnsNs != null
                    ? timingFromArts.tnsNs.toFixed(3)
                    : "—"}
                </p>
              </div>
              <div className="neu-inset p-2 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Power (mW)
                </p>
                <p className="text-lg font-black text-amber-700">
                  {timingFromArts.powerMw != null
                    ? timingFromArts.powerMw.toFixed(3)
                    : "—"}
                </p>
              </div>
              <div className="neu-inset p-2 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Dyn / Leak
                </p>
                <p className="text-[11px] font-black text-slate-700">
                  {timingFromArts.dynamicMw != null
                    ? timingFromArts.dynamicMw.toFixed(2)
                    : "—"}
                  /
                  {timingFromArts.leakageMw != null
                    ? timingFromArts.leakageMw.toExponential(1)
                    : "—"}
                </p>
              </div>
              <div className="neu-inset p-2 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Area (µm²)
                </p>
                <p className="text-lg font-black text-indigo-700">
                  {timingFromArts.areaUm2 != null
                    ? Math.round(timingFromArts.areaUm2).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div className="neu-inset p-2 text-center">
                <p className="text-[9px] font-black uppercase text-slate-500">
                  Util %
                </p>
                <p className="text-lg font-black text-violet-700">
                  {timingFromArts.utilizationPct != null
                    ? timingFromArts.utilizationPct.toFixed(1)
                    : "—"}
                </p>
              </div>
            </div>
          )}

        {selectedStage === "placement" && placeTimingArts.length > 0 && (
          <details className="neu-inset p-2">
            <summary className="text-[10px] font-black uppercase text-violet-700 cursor-pointer">
              Placement reports — timing / power / area (
              {placeTimingArts.length})
            </summary>
            <ul className="mt-1 space-y-1">
              {placeTimingArts.slice(0, 8).map((a) => (
                <li key={a.id} className="text-[10px] font-mono">
                  <button
                    type="button"
                    className="text-sky-700 underline font-bold"
                    onClick={() => downloadArtifact(a)}
                  >
                    {a.name}
                  </button>
                  {a.content && (
                    <pre className="text-[9px] max-h-24 overflow-auto mt-0.5 text-slate-600 whitespace-pre-wrap">
                      {a.content.slice(0, 1200)}
                      {a.content.length > 1200 ? "\n…" : ""}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  // report: DRC / LVS / GDS
  return (
    <div className="neu-panel p-4 space-y-3 h-full">
      <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
        Signoff report · {stageMeta.label}
      </p>
      <h2 className="text-lg font-black uppercase">{stageMeta.label}</h2>
      <p className="text-[11px] font-bold text-[var(--neu-text-muted)]">
        {stageMeta.description}
      </p>
      {stageMeta.id === "gds" &&
        job?.artifacts?.some((a) => /gds/i.test(a.name)) && (
          <p className="text-sm font-black text-emerald-600">
            GDS artifact available in Artifacts tab
          </p>
        )}
      <pre className="neu-inset p-2 text-[10px] font-mono max-h-56 overflow-auto whitespace-pre-wrap">
        {stageLogLines.slice(-80).join("\n") ||
          "No stage log yet — run OpenLane from synthesis."}
      </pre>
    </div>
  );
}
