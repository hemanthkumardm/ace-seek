"use client";

/**
 * OpenROAD PnR Studio
 * - Template + ace-seek-flow.json dual config (file ↔ UI)
 * - Ordered stages only: lint → sim → synth → … → gds
 * - Stage views: lint summary, sim waveform, synth report, chip from floorplan+
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, RotateCcw } from "lucide-react";
import { OpenroadStatusIcon } from "@/components/OpenroadStatusIcon";
import { OpenroadStudioBottomTabs } from "@/components/OpenroadStudioBottomTabs";
import { OpenroadStudioToolbar } from "@/components/OpenroadStudioToolbar";
import { OpenroadStudioStageRail } from "@/components/OpenroadStudioStageRail";
import { OpenroadStudioPpaSidebar } from "@/components/OpenroadStudioPpaSidebar";
import {
  type ArtifactKindTab,
  type StudioBottomTab,
} from "@/lib/openroad-studio-artifacts-ui";
import {
  loadCompleted,
  saveCompleted,
  loadResults,
  saveResults,
  clearStudioPersistence,
} from "@/lib/openroad-studio-persistence";
import {
  loadOpenroadProject,
  projectHealth,
  saveOpenroadProject,
  upsertProjectFile,
  getFlowConfigFile,
  type OpenroadProjectState,
  getFileByRole,
} from "@/lib/openroad-project-hub";
import {
  resolveUntilStage,
  completedStagesThrough,
} from "@/lib/openroad-until-map";
import {
  FLOW_STAGES,
  parseOpenroadFlowLog,
  parseSdcClockPeriod,
  parseSimpleVcdWave,
  parsePlacementTimingReport,
  parseMetricsCsv,
  storeLastVcd,
  loadLastVcd,
  parseVcdActivityTimeline,
  estimateActivityPowerSeries,
  canRunStage,
  nextRunnableStage,
  type FlowStageId,
  type StageResultPayload,
  type FlowMetrics,
} from "@/lib/openroad-flow-model";
import type { OpenroadJobResult } from "@/lib/openroad-run-engine";
import { sanitizeOpenroadLogLine } from "@/lib/openroad-user-log";
import { OpenroadStudioCenterView } from "@/components/OpenroadStudioCenterView";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  STAGE_CONFIG_SCHEMAS,
  emptyStageInputValues,
  loadStageInputs,
  saveStageInputs,
  resolveField,
  resolveAllOpenlaneConfig,
  runSanityChecks,
  sanitySummary,
  type StageInputValues,
  type SanityItem,
} from "@/lib/openroad-stage-config";
import {
  FLOW_CONFIG_NAME,
  parseFlowConfigJson,
  flowConfigToStageInputs,
  stageInputsToFlowConfig,
} from "@/lib/openroad-template";
import {
  type StageArtifact,
  loadStageArtifacts,
  saveStageArtifacts,
  artifactsFromStageResult,
  artifactsFromJobFiles,
  mergeArtifacts,
  clearArtifactsFromStage,
  clearStageArtifacts,
  inferStageFromArtifactName,
  curatePlacementArtifacts,
  isJunkOpenlaneArtifact,
} from "@/lib/openroad-stage-artifacts";
import {
  buildStudioCloudSnapshot,
  findDefInJobArtifacts,
  pickDefArtifact,
} from "@/lib/openroad-snapshot";
import {
  cloudPing,
  cloudSaveProject,
  cloudUploadArtifacts,
  cloudRecordStageRun,
  cloudListArtifacts,
  cloudLoadProject,
  getLocalCloudProjectId,
  setLocalCloudProjectId,
} from "@/lib/openroad-cloud";
import {
  getStageNode,
  runPreAssertions,
  runPostAssertions,
  type StageAssertion,
} from "@/lib/openroad-stage-nodes";

type BottomTab = StudioBottomTab;

export default function OpenroadPnRStudioPage() {
  const { apiKey, ent, ready } = useEntitlements();
  const [project, setProject] = useState<OpenroadProjectState | null>(null);
  const [job, setJob] = useState<OpenroadJobResult | null>(null);
  const [log, setLog] = useState("");
  const [metricsCsv, setMetricsCsv] = useState("");
  /** Extra live metrics from placement reports (not only metrics.csv) */
  const [liveMetricsExtra, setLiveMetricsExtra] = useState<
    Partial<FlowMetrics>
  >({});
  const [busy, setBusy] = useState(false);
  const [runningStage, setRunningStage] = useState<FlowStageId | null>(null);
  const [err, setErr] = useState("");
  const [selectedStage, setSelectedStage] = useState<FlowStageId>("lint");
  const [bottomTab, setBottomTab] = useState<BottomTab>("inputs");
  const [artifactKindTab, setArtifactKindTab] =
    useState<ArtifactKindTab>("all");
  const [logFilter, setLogFilter] = useState<"stage" | "all" | "error">("stage");
  const [stageFlowDraft, setStageFlowDraft] = useState("");
  const [stageInputs, setStageInputs] = useState<StageInputValues>(
    emptyStageInputValues
  );
  const [completed, setCompleted] = useState<FlowStageId[]>([]);
  const [stageResults, setStageResults] = useState<
    Partial<Record<FlowStageId, StageResultPayload>>
  >({});
  const [stageArtifacts, setStageArtifacts] = useState<StageArtifact[]>([]);
  /** In-panel preview of an artifact (log/report) before download */
  const [previewArtifact, setPreviewArtifact] = useState<StageArtifact | null>(
    null
  );
  const [previewText, setPreviewText] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [flowJsonDraft, setFlowJsonDraft] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudProjectId, setCloudProjectId] = useState<string | null>(null);
  const [lastAssertions, setLastAssertions] = useState<StageAssertion[]>([]);
  const [lastCheckpoint, setLastCheckpoint] = useState<string | null>(null);
  /** Elapsed seconds while a stage request is in flight */
  const [runElapsedSec, setRunElapsedSec] = useState(0);
  const [runHint, setRunHint] = useState("");
  /** DEF text for Result chip snapshot (from job / artifacts) */
  const [defText, setDefText] = useState<string | null>(null);
  const [defName, setDefName] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const syncingFromFile = useRef(false);
  /** Lock UI to the stage the user launched (don't follow log parser) */
  const userPinnedStageRef = useRef<FlowStageId | null>(null);

  /** Probe Ace-Seek checkpoint on disk (survives refresh — fixes false NEED_CKPT) */
  useEffect(() => {
    if (!project) return;
    const key =
      (typeof window !== "undefined"
        ? localStorage.getItem("ace_seek_api_key") || ""
        : "") || "";
    const q = new URLSearchParams({
      designName: project.designName || "design",
      topModule: project.topModule || "top",
    });
    void fetch(`/api/openroad/checkpoint?${q}`, {
      headers: key ? { "x-api-key": key } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.exists && d.path) setLastCheckpoint(String(d.path));
      })
      .catch(() => {
        /* */
      });
  }, [project?.designName, project?.topModule]);

  /** Load project + flow config → stage inputs; hydrate from Supabase when available */
  useEffect(() => {
    const p = loadOpenroadProject();
    setProject(p);
    setCompleted(loadCompleted());
    setStageResults(loadResults());
    const arts = loadStageArtifacts();
    setStageArtifacts(arts);
    // Restore Result chip from cached DEF artifact (session truth view)
    const defArt = pickDefArtifact(arts);
    if (defArt?.content && /DIEAREA/i.test(defArt.content)) {
      setDefText(defArt.content);
      setDefName(defArt.name);
    }
    setCloudProjectId(getLocalCloudProjectId());

    void (async () => {
      const ok = await cloudPing();
      setCloudReady(ok);
      if (!ok) return;
      const loaded = await cloudLoadProject();
      if (!loaded.ok || !loaded.project) return;
      const row = loaded.project;
      setLocalCloudProjectId(row.id);
      setCloudProjectId(row.id);
      const st = row.state_json as {
        project?: typeof p;
        stageInputs?: StageInputValues;
        completedStages?: FlowStageId[];
        stageResults?: Partial<Record<FlowStageId, StageResultPayload>>;
      };
      if (st?.project?.files?.length) {
        saveOpenroadProject(st.project);
        setProject(st.project);
      }
      if (st?.stageInputs) setStageInputs(st.stageInputs);
      if (st?.completedStages) {
        setCompleted(st.completedStages);
        saveCompleted(st.completedStages);
      }
      if (st?.stageResults) setStageResults(st.stageResults);
      const arts = await cloudListArtifacts({ projectId: row.id });
      if (arts.ok && arts.artifacts?.length) {
        setStageArtifacts(arts.artifacts);
      }
    })();

    const flowFile = getFlowConfigFile(p);
    if (flowFile) {
      const cfg = parseFlowConfigJson(flowFile.content);
      if (cfg) {
        syncingFromFile.current = true;
        setStageInputs(flowConfigToStageInputs(cfg));
        setFlowJsonDraft(JSON.stringify(cfg, null, 2));
        if (cfg.completedStages?.length) {
          setCompleted(cfg.completedStages);
          saveCompleted(cfg.completedStages);
        }
        queueMicrotask(() => {
          syncingFromFile.current = false;
        });
        return;
      }
    }
    setStageInputs(loadStageInputs());
  }, []);

  /** UI stage inputs → localStorage + ace-seek-flow.json in project */
  useEffect(() => {
    if (!project || syncingFromFile.current) return;
    saveStageInputs(stageInputs);
    const cfg = stageInputsToFlowConfig(stageInputs, {
      designName: project.designName,
      topModule: project.topModule,
      pdk: project.pdk,
      completed,
    });
    const text = JSON.stringify(cfg, null, 2) + "\n";
    setFlowJsonDraft(JSON.stringify(cfg, null, 2));
    const next = upsertProjectFile(project, FLOW_CONFIG_NAME, text);
    // avoid loop if content unchanged
    const prev = getFlowConfigFile(project)?.content;
    if (prev !== text) {
      saveOpenroadProject(next);
      setProject(next);
    }
  }, [stageInputs, completed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveCompleted(completed);
  }, [completed]);

  useEffect(() => {
    saveResults(stageResults);
  }, [stageResults]);

  useEffect(() => {
    saveStageArtifacts(stageArtifacts);
  }, [stageArtifacts]);

  const addStageArtifacts = useCallback(
    (incoming: StageArtifact[]) => {
      if (!incoming.length) return;
      setStageArtifacts((prev) => {
        const next = mergeArtifacts(prev, incoming);
        // best-effort Supabase upload
        void cloudUploadArtifacts(
          getLocalCloudProjectId() || undefined,
          incoming
        ).then((r) => {
          if (r.ok) {
            /* keep */
          }
        });
        return next;
      });
    },
    []
  );

  /** Persist studio session snapshot to Supabase (slim — not DEF/GDS truth) */
  const syncCloudSnapshot = useCallback(async () => {
    if (!cloudReady || !project) return;
    const snap = buildStudioCloudSnapshot({
      project,
      stageInputs,
      completedStages: completed,
      stageResults,
      chipHint: defText
        ? {
            mode: "result",
            sourceLabel: defName || "DEF",
            defName: defName || undefined,
          }
        : {
            mode: "intent",
            sourceLabel: "DIE/CORE inputs",
          },
    });
    const r = await cloudSaveProject({
      project: snap.project,
      stageInputs: snap.stageInputs,
      completedStages: snap.completedStages,
      stageResults: snap.stageResults,
      flowConfig: {
        snapshotKind: snap.snapshotKind,
        snapshotVersion: snap.snapshotVersion,
        chipHint: snap.chipHint,
      },
    });
    if (r.ok && r.projectId) {
      setLocalCloudProjectId(r.projectId);
      setCloudProjectId(r.projectId);
    }
  }, [cloudReady, project, stageInputs, completed, stageResults, defText, defName]);

  useEffect(() => {
    if (!cloudReady || !project) return;
    // Debounce hard — stageResults updates on every poll; avoid cloud write storms
    const t = setTimeout(() => {
      void syncCloudSnapshot();
    }, 8000);
    return () => clearTimeout(t);
  }, [cloudReady, project, stageInputs, completed, syncCloudSnapshot]);
  // Sync stageResults only when idle (not every poll tick)
  useEffect(() => {
    if (!cloudReady || !project || busy || runningStage) return;
    const t = setTimeout(() => {
      void syncCloudSnapshot();
    }, 3000);
    return () => clearTimeout(t);
  }, [cloudReady, project, stageResults, busy, runningStage, syncCloudSnapshot]);

  const dieArea = String(resolveField("floorplan", "DIE_AREA", stageInputs));
  const coreArea = String(resolveField("floorplan", "CORE_AREA", stageInputs));

  const clockFromSdc = useMemo(() => {
    const sdc = project ? getFileByRole(project, "sdc")?.content || "" : "";
    return parseSdcClockPeriod(sdc);
  }, [project]);

  const clockFromStage = useMemo(() => {
    const raw = (stageInputs.synthesis?.CLOCK_PERIOD ?? "").trim();
    if (!raw) return null;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [stageInputs.synthesis?.CLOCK_PERIOD]);

  const clockView = useMemo(() => {
    if (clockFromSdc) {
      return {
        periodNs: clockFromSdc.periodNs,
        riseNs: clockFromSdc.riseNs,
        fallNs: clockFromSdc.fallNs,
        name: clockFromSdc.name,
        source: "sdc" as const,
      };
    }
    if (clockFromStage != null) {
      return {
        periodNs: clockFromStage,
        riseNs: 0,
        fallNs: clockFromStage / 2,
        name: undefined as string | undefined,
        source: "stage_input" as const,
      };
    }
    return null;
  }, [clockFromSdc, clockFromStage]);

  const parsed = useMemo(() => {
    // Geometry: DEF Result only — do not feed form DIE/CORE as a fake preview
    const base = parseOpenroadFlowLog(log, {
      designName: project?.designName,
      // Intentionally omit metricsCsv here — we apply authoritative metrics below
      jobStatus: job?.status,
      dieArea: defText ? dieArea : "0 0 0 0",
      coreArea: defText ? coreArea : "0 0 0 0",
      defText,
      defName: defName || undefined,
      completedStages: completed,
      runningStage,
      stageResults,
    });
    // Metrics: authoritative sources only (OpenLane metrics.csv + curated reports).
    // Never use mid-run log scrape — inaccurate / partial STA.
    const fromCsv = metricsCsv?.trim() ? parseMetricsCsv(metricsCsv) : {};
    const x = liveMetricsExtra;
    const m: FlowMetrics = {
      slackHistogram: [],
      areaBreakdown: [],
      powerBreakdown: [],
      ...fromCsv,
      ...(x.wnsNs != null ? { wnsNs: x.wnsNs } : {}),
      ...(x.tnsNs != null ? { tnsNs: x.tnsNs } : {}),
      ...(x.areaUm2 != null ? { areaUm2: x.areaUm2 } : {}),
      ...(x.utilizationPct != null ? { utilizationPct: x.utilizationPct } : {}),
      ...(x.powerMw != null ? { powerMw: x.powerMw } : {}),
      ...(x.dynamicMw != null ? { dynamicMw: x.dynamicMw } : {}),
      ...(x.leakageMw != null ? { leakageMw: x.leakageMw } : {}),
      ...(x.cellCount != null ? { cellCount: x.cellCount } : {}),
      ...(x.wirelengthUm != null ? { wirelengthUm: x.wirelengthUm } : {}),
    };
    if (m.powerMw != null || m.dynamicMw != null || m.leakageMw != null) {
      m.powerBreakdown = [];
      if (m.dynamicMw != null)
        m.powerBreakdown.push({
          label: "Dynamic",
          value: m.dynamicMw,
          color: "#f59e0b",
        });
      if (m.leakageMw != null)
        m.powerBreakdown.push({
          label: "Leakage",
          value: Math.max(m.leakageMw, 1e-6),
          color: "#ec4899",
        });
      if (m.powerMw != null && m.powerBreakdown.length === 0)
        m.powerBreakdown.push({
          label: "Total",
          value: m.powerMw,
          color: "#10b981",
        });
    }
    if (m.areaUm2 != null) {
      const util =
        m.utilizationPct != null ? Math.min(1, m.utilizationPct / 100) : null;
      if (util != null) {
        m.areaBreakdown = [
          { label: "Used", value: m.areaUm2 * util, color: "#38bdf8" },
          {
            label: "Whitespace",
            value: Math.max(0, m.areaUm2 * (1 - util)),
            color: "#334155",
          },
        ];
      } else {
        m.areaBreakdown = [
          { label: "Design area", value: m.areaUm2, color: "#38bdf8" },
        ];
      }
    }
    return { ...base, metrics: m };
  }, [
    log,
    metricsCsv,
    job?.status,
    project?.designName,
    dieArea,
    coreArea,
    defText,
    defName,
    completed,
    runningStage,
    stageResults,
    liveMetricsExtra,
  ]);

  const sanity = useMemo(() => {
    if (!project) return [] as SanityItem[];
    return runSanityChecks(project, stageInputs, {
      stage: "all",
      log: log || undefined,
    });
  }, [project, stageInputs, log]);

  const sanityStage = useMemo(() => {
    if (!project) return [] as SanityItem[];
    return runSanityChecks(project, stageInputs, {
      stage: selectedStage,
      log: log || undefined,
    });
  }, [project, stageInputs, selectedStage, log]);

  const sum = sanitySummary(sanity);
  const nextStage = nextRunnableStage(completed);

  // Do NOT follow parsed.activeStage — old sim/lint lines in the combined log
  // were stealing focus away from the stage the user clicked (e.g. synth → sim).
  // Keep the rail on userPinnedStage / runningStage instead.

  useEffect(() => {
    if (bottomTab === "log" && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [parsed.logLines.length, bottomTab, runHint, runElapsedSec]);

  // Elapsed timer + rotating hints while a stage is running
  useEffect(() => {
    if (!runningStage && !busy) {
      if (runTimerRef.current) {
        clearInterval(runTimerRef.current);
        runTimerRef.current = null;
      }
      return;
    }
    setRunElapsedSec(0);
    const hints: Record<string, string[]> = {
      lint: [
        "Verilator scanning RTL…",
        "Checking modules and warnings…",
        "Still linting — large designs take longer…",
      ],
      simulation: [
        "Compiling testbench (iverilog)…",
        "Running simulation (vvp)…",
        "Waiting for SIM_OK / $finish…",
      ],
      synthesis: [
        "Yosys reading RTL…",
        "Hierarchy / synth / techmap…",
        "Mapping cells (liberty/ABC) — this can take a few minutes…",
        "Writing netlist and stats…",
      ],
      floorplan: [
        "OpenLane Docker preparing design…",
        "Floorplan / IO / PDN…",
      ],
      placement: ["OpenLane placement running…"],
      cts: ["OpenLane CTS running…"],
      route: ["OpenLane routing — can take a long time…"],
      gds: ["OpenLane signoff / GDS…"],
    };
    const list =
      hints[runningStage || "synthesis"] ||
      hints.synthesis ||
      ["Stage running…"];
    setRunHint(list[0]);
    let tick = 0;
    runTimerRef.current = setInterval(() => {
      tick += 1;
      setRunElapsedSec(tick);
      setRunHint(list[Math.min(list.length - 1, Math.floor(tick / 8))]);
    }, 1000);
    return () => {
      if (runTimerRef.current) {
        clearInterval(runTimerRef.current);
        runTimerRef.current = null;
      }
    };
  }, [runningStage, busy]);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (sseRef.current) {
      try {
        sseRef.current.close();
      } catch {
        /* */
      }
      sseRef.current = null;
    }
  };

  /** Load DEF text for Result chip mode (checkpoint/job truth → canvas) */
  /** Job poll/download auth — jobs API is no longer world-readable */
  const jobAuthHeaders = useCallback((): HeadersInit => {
    const key =
      apiKey ||
      (typeof window !== "undefined"
        ? localStorage.getItem("ace_seek_api_key") || ""
        : "");
    return key ? { "x-api-key": key } : {};
  }, [apiKey]);

  const jobDownloadUrl = useCallback(
    (jobId: string, name: string) => {
      const key =
        apiKey ||
        (typeof window !== "undefined"
          ? localStorage.getItem("ace_seek_api_key") || ""
          : "");
      const q = new URLSearchParams({ download: name });
      if (key) q.set("apiKey", key);
      return `/api/openroad/jobs/${jobId}?${q.toString()}`;
    },
    [apiKey]
  );

  const loadDefFromJob = useCallback(
    async (jobId: string, name: string, stageHint?: FlowStageId) => {
      try {
        const res = await fetch(
          `/api/openroad/jobs/${jobId}?download=${encodeURIComponent(name)}`,
          { headers: jobAuthHeaders() }
        );
        if (!res.ok) return;
        const text = await res.text();
        if (!text || text.length < 40 || !/DIEAREA/i.test(text)) return;
        // Cap browser memory (~8MB text)
        const capped =
          text.length > 8_000_000
            ? text.slice(0, 8_000_000)
            : text;
        setDefText(capped);
        setDefName(name);
        // Instance count for PPA "Cells" tile (COMPONENTS N ;)
        const compM = capped.match(/^COMPONENTS\s+(\d+)/m);
        if (compM) {
          const n = parseInt(compM[1], 10);
          if (Number.isFinite(n) && n > 0) {
            setLiveMetricsExtra((prev) => ({
              ...prev,
              cellCount: prev.cellCount ?? n,
            }));
          }
        }
        const st: FlowStageId =
          stageHint || inferStageFromArtifactName(name, "floorplan");
        addStageArtifacts([
          {
            id: `def::${name}`,
            stage: st,
            name,
            kind: "def",
            content: capped.length > 1_500_000 ? undefined : capped,
            jobDownload: { jobId, name },
            size: text.length,
            createdAt: new Date().toISOString(),
            mime: "text/plain",
          },
        ]);
      } catch {
        /* */
      }
    },
    [addStageArtifacts, jobAuthHeaders]
  );

  const openArtifactPreview = useCallback(
    async (a: StageArtifact) => {
      setPreviewArtifact(a);
      setPreviewBusy(true);
      setPreviewText("");
      try {
        if (a.content) {
          setPreviewText(
            a.content.length > 400_000
              ? a.content.slice(0, 400_000) +
                  "\n\n… [preview truncated — download for full file]"
              : a.content
          );
          return;
        }
        if (a.jobDownload) {
          const res = await fetch(
            `/api/openroad/jobs/${a.jobDownload.jobId}?download=${encodeURIComponent(a.jobDownload.name)}`,
            { headers: jobAuthHeaders() }
          );
          if (!res.ok) {
            setPreviewText(`Failed to load (${res.status})`);
            return;
          }
          // Skip huge binaries
          if (/\.(odb|gds|gz)$/i.test(a.name)) {
            setPreviewText(
              `Binary layout file (${a.name}, ${a.size || "?"} bytes).\nUse «Open stage ODB» / OpenROAD GUI — not text-previewable.`
            );
            return;
          }
          const text = await res.text();
          setPreviewText(
            text.length > 400_000
              ? text.slice(0, 400_000) +
                  "\n\n… [preview truncated — download for full file]"
              : text
          );
          // If it's a metrics report, also push into PPA tiles
          if (
            /placement_(timing|power|area_util|metrics_summary)\.rpt$/i.test(
              a.name
            )
          ) {
            const tm = parsePlacementTimingReport(text);
            setLiveMetricsExtra((prev) => ({
              ...prev,
              ...tm,
            }));
          }
        } else {
          setPreviewText("No content available for preview.");
        }
      } catch (e) {
        setPreviewText(
          e instanceof Error ? e.message : "Preview failed"
        );
      } finally {
        setPreviewBusy(false);
      }
    },
    [jobAuthHeaders]
  );

  const fetchArtifactText = useCallback(
    async (jobId: string, name: string) => {
      try {
        const res = await fetch(
          `/api/openroad/jobs/${jobId}?download=${encodeURIComponent(name)}`,
          { headers: jobAuthHeaders() }
        );
        if (!res.ok) return;
        // Only real CSV → metricsCsv parser (do NOT treat *metrics*.rpt as CSV)
        if (/\.csv$/i.test(name)) {
          const text = await res.text();
          setMetricsCsv(text);
          addStageArtifacts([
            {
              id: `gds::${name}`,
              stage: "gds",
              name,
              kind: "metrics",
              content: text,
              size: text.length,
              createdAt: new Date().toISOString(),
              mime: "text/csv",
            },
          ]);
        }
        // Authoritative placement reports only (after stage pack) — not mid-run logs
        const curatedPlace =
          /^(placement_timing|placement_power|placement_area_util|placement_metrics_summary)\.rpt$/i.test(
            name
          ) ||
          /^placement_timing\.rpt$|^placement_power\.rpt$|^placement_area_util\.rpt$|^placement_metrics_summary\.rpt$/i.test(
            name.split("/").pop() || name
          );
        if (curatedPlace) {
          const text = await res.text();
          const tm = parsePlacementTimingReport(text);
          if (
            tm.wnsNs != null ||
            tm.tnsNs != null ||
            tm.powerMw != null ||
            tm.areaUm2 != null ||
            tm.utilizationPct != null
          ) {
            setLiveMetricsExtra((prev) => ({
              ...prev,
              ...(tm.wnsNs != null ? { wnsNs: tm.wnsNs } : {}),
              ...(tm.tnsNs != null ? { tnsNs: tm.tnsNs } : {}),
              ...(tm.powerMw != null ? { powerMw: tm.powerMw } : {}),
              ...(tm.dynamicMw != null ? { dynamicMw: tm.dynamicMw } : {}),
              ...(tm.leakageMw != null ? { leakageMw: tm.leakageMw } : {}),
              ...(tm.areaUm2 != null ? { areaUm2: tm.areaUm2 } : {}),
              ...(tm.utilizationPct != null
                ? { utilizationPct: tm.utilizationPct }
                : {}),
            }));
          }
          addStageArtifacts([
            {
              id: `placement::${name}`,
              stage: "placement",
              name,
              kind: /metrics_summary/i.test(name) ? "metrics" : "report",
              content:
                text.length > 200_000
                  ? text.slice(0, 200_000) + "\n/* truncated */\n"
                  : text,
              jobDownload: { jobId, name },
              size: text.length,
              createdAt: new Date().toISOString(),
              mime: "text/plain",
            },
          ]);
        }
        if (/\.def$/i.test(name)) {
          void loadDefFromJob(jobId, name);
        }
      } catch {
        /* */
      }
    },
    [addStageArtifacts, loadDefFromJob, jobAuthHeaders]
  );

  /** Load curated placement reports into live PPA metrics (success or soft-fail) */
  const loadPlacementReports = useCallback(
    (jobId: string, artifactNames?: string[]) => {
      const want = [
        "placement_metrics_summary.rpt",
        "placement_timing.rpt",
        "placement_power.rpt",
        "placement_area_util.rpt",
      ];
      for (const name of want) {
        const listed = artifactNames?.find(
          (n) => n === name || n.endsWith(`/${name}`)
        );
        void fetchArtifactText(jobId, listed || name);
      }
      const defHit =
        artifactNames?.find((n) =>
          /placement_top\.def$|results_placement_top\.def$/i.test(n)
        ) || "placement_top.def";
      void loadDefFromJob(jobId, defHit, "placement");
    },
    [fetchArtifactText, loadDefFromJob]
  );

  const markOpenlaneChainDone = useCallback(() => {
    const openlaneIds = FLOW_STAGES.filter((s) => s.runner === "openlane").map(
      (s) => s.id
    );
    setCompleted((prev) => {
      const set = new Set([...prev, ...openlaneIds]);
      // ensure lint+sim still required earlier
      return FLOW_STAGES.map((s) => s.id).filter((id) => set.has(id));
    });
  }, []);

  const startPoll = (jobId: string, launchedStage: FlowStageId) => {
    stopPoll();
    userPinnedStageRef.current = launchedStage;
    let lastSig = "";

    const applyPollPayload = (r: OpenroadJobResult) => {
      const sig = `${r.status}|${r.message}|${r.log?.length || 0}|${r.artifacts?.length || 0}|${r.gdsFiles?.length || 0}`;
      const terminal =
        r.status === "succeeded" ||
        r.status === "failed" ||
        r.status === "rejected";
      if (sig === lastSig && !terminal) return;
      lastSig = sig;

      setJob(r);
      if (r.log) {
        setLog(r.log);
        setStageResults((prev) => {
          const prevLog =
            prev[launchedStage] && "log" in prev[launchedStage]!
              ? (prev[launchedStage] as { log?: string }).log || ""
              : "";
          if (prevLog === r.log && !terminal) return prev;
          return {
            ...prev,
            [launchedStage]: {
              kind: "generic",
              summary:
                r.status === "running" ||
                r.status === "preparing" ||
                r.status === "queued"
                  ? `OpenLane ${launchedStage} ${r.status}…`
                  : prev[launchedStage] && "summary" in prev[launchedStage]!
                    ? (prev[launchedStage] as { summary: string }).summary
                    : `OpenLane ${launchedStage}`,
              log: r.log,
            },
          };
        });
      }
      if (r.metrics && Object.keys(r.metrics).length > 0) {
        setLiveMetricsExtra((prev) => ({ ...prev, ...r.metrics }));
      }
      if (r.message) setRunHint(r.message);

      const m = r.artifacts?.find((a) => /metrics\.csv$/i.test(a.name));
      if (m && terminal) void fetchArtifactText(jobId, m.name);
      if (!terminal) return;

      stopPoll();
      setBusy(false);
      setRunningStage(null);
      setRunHint("");
      if (r.status === "succeeded") {
        const logText = r.log || "";
        const fullGds =
          (r.gdsFiles && r.gdsFiles.length > 0) ||
          /Flow complete|stopped after gds|synth→GDS complete/i.test(
            r.message + logText
          );
        if (fullGds || /until=all|until gds/i.test(r.message + logText)) {
          markOpenlaneChainDone();
        } else {
          const untilM =
            logText.match(/stopped after ([a-z_/]+)/i) ||
            r.message.match(/stopped after ['"]?([a-z_/]+)/i) ||
            logText.match(/until=(\w+)/i);
          const stop = resolveUntilStage(
            untilM?.[1] || launchedStage,
            launchedStage
          );
          const through = completedStagesThrough(stop);
          setCompleted((prev) => {
            const next = new Set([...prev, ...through, launchedStage]);
            if (stop === "floorplan" || launchedStage === "floorplan") {
              next.add("floorplan");
              next.add("powerplan");
            }
            if (stop === "placement" || launchedStage === "placement") {
              next.add("placement");
            }
            return FLOW_STAGES.map((s) => s.id).filter((id) => next.has(id));
          });
        }
        const doneStage = launchedStage;
        let stageLog = logText;
        const untilKey = doneStage === "route" ? "routing" : doneStage;
        const idxUntil = logText.lastIndexOf(`ACE_OPENLANE_UNTIL=${untilKey}`);
        const idxStep = logText.lastIndexOf("ACE-Seek: === step ");
        if (idxUntil > 0) stageLog = logText.slice(idxUntil);
        else if (idxStep > 0) stageLog = logText.slice(Math.max(0, idxStep - 200));

        const cellM = stageLog.match(/Number of cells:\s*(\d+)/i);
        const wireM = stageLog.match(/Number of wires:\s*(\d+)/i);
        const summary = fullGds
          ? "OpenLane full flow finished (GDS)"
          : `OpenLane ${doneStage} finished: ${r.message}`;

        if (doneStage === "synthesis") {
          const synthDone: StageResultPayload = {
            kind: "synth",
            summary,
            cellCount: cellM ? parseInt(cellM[1], 10) : undefined,
            wireCount: wireM ? parseInt(wireM[1], 10) : undefined,
            log: stageLog,
            statsLines: stageLog
              .split("\n")
              .filter((l) => /Number of (cells|wires|wire bits)/i.test(l))
              .slice(0, 20),
          };
          setStageResults((prev) => ({ ...prev, synthesis: synthDone }));
          addStageArtifacts(artifactsFromStageResult("synthesis", synthDone));
        } else {
          const genericDone: StageResultPayload = {
            kind: "generic",
            summary,
            log: stageLog,
          };
          setStageResults((prev) => ({ ...prev, [doneStage]: genericDone }));
          addStageArtifacts(artifactsFromStageResult(doneStage, genericDone));
        }
        if (r.artifacts?.length) {
          addStageArtifacts(
            artifactsFromJobFiles(
              jobId,
              r.artifacts.map((a) => ({
                name: a.name,
                size: a.size,
                content: a.content,
              })),
              doneStage
            )
          );
          const defArt = findDefInJobArtifacts(r.artifacts);
          if (defArt) void loadDefFromJob(jobId, defArt.name, doneStage);
          if (doneStage === "placement") {
            loadPlacementReports(jobId, r.artifacts?.map((a) => a.name));
          }
          if (project) {
            const q = new URLSearchParams({
              designName: project.designName || "design",
              topModule: project.topModule || "top",
            });
            void fetch(`/api/openroad/checkpoint?${q}`, {
              headers: jobAuthHeaders(),
            })
              .then((res) => res.json())
              .then((d) => {
                if (d?.exists && d.path) setLastCheckpoint(String(d.path));
              })
              .catch(() => {
                /* */
              });
          }
        }
      } else if (r.status === "failed" && r.log) {
        const failStage = launchedStage;
        setErr(r.message || `${failStage} failed`);
        addStageArtifacts(
          artifactsFromStageResult(failStage, {
            kind: "generic",
            summary: `OpenLane ${failStage} failed — see log`,
            log: r.log,
          })
        );
        setStageResults((prev) => ({
          ...prev,
          [failStage]: {
            kind: "generic",
            summary: r.message || `OpenLane ${failStage} failed`,
            log: r.log || "",
          },
        }));
        if (failStage === "placement") {
          if (r.artifacts?.length) {
            addStageArtifacts(
              artifactsFromJobFiles(
                jobId,
                r.artifacts.map((a) => ({
                  name: a.name,
                  size: a.size,
                  content: a.content,
                })),
                "placement"
              )
            );
          }
          loadPlacementReports(jobId, r.artifacts?.map((a) => a.name));
        }
      }
      r.artifacts
        ?.filter((a) => /metrics|csv/i.test(a.name))
        .slice(0, 3)
        .forEach((a) => void fetchArtifactText(jobId, a.name));
    };

    const startIntervalFallback = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/openroad/jobs/${jobId}`, {
            headers: jobAuthHeaders(),
          });
          if (!res.ok) return;
          const data = await res.json();
          if (!data.result) return;
          applyPollPayload(data.result as OpenroadJobResult);
        } catch {
          /* keep polling */
        }
      }, 2500);
    };

    // Prefer SSE (1s updates); fall back to interval poll if EventSource fails
    try {
      const key =
        (typeof window !== "undefined"
          ? localStorage.getItem("ace_seek_api_key") || ""
          : "") || "";
      const q = new URLSearchParams();
      if (key) q.set("apiKey", key);
      const url = `/api/openroad/jobs/${jobId}/stream?${q.toString()}`;
      const es = new EventSource(url);
      sseRef.current = es;
      let opened = false;
      es.addEventListener("open", () => {
        opened = true;
      });
      es.addEventListener("job", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as {
            result?: OpenroadJobResult;
          };
          if (data.result) applyPollPayload(data.result);
        } catch {
          /* */
        }
      });
      es.addEventListener("done", () => {
        try {
          es.close();
        } catch {
          /* */
        }
        sseRef.current = null;
      });
      es.onerror = () => {
        try {
          es.close();
        } catch {
          /* */
        }
        sseRef.current = null;
        if (!opened) startIntervalFallback();
        else startIntervalFallback();
      };
      // Safety: if SSE never opens, fall back after 3s
      window.setTimeout(() => {
        if (!opened && !pollRef.current) startIntervalFallback();
      }, 3000);
    } catch {
      startIntervalFallback();
    }
  };

  useEffect(() => () => stopPoll(), []);

  const setField = (stage: FlowStageId, key: string, value: string) => {
    setStageInputs((prev) => ({
      ...prev,
      [stage]: { ...prev[stage], [key]: value },
    }));
  };

  const resetStageDefaults = (stage: FlowStageId) => {
    setStageInputs((prev) => ({
      ...prev,
      [stage]: Object.fromEntries(
        (STAGE_CONFIG_SCHEMAS.find((s) => s.id === stage)?.fields || []).map(
          (f) => [f.key, ""]
        )
      ),
    }));
  };

  const applyFlowJson = () => {
    const cfg = parseFlowConfigJson(flowJsonDraft);
    if (!cfg) {
      setErr("Invalid ace-seek-flow.json — check JSON syntax / version");
      return;
    }
    syncingFromFile.current = true;
    setStageInputs(flowConfigToStageInputs(cfg));
    if (cfg.completedStages) setCompleted(cfg.completedStages);
    if (project) {
      const text = JSON.stringify(cfg, null, 2) + "\n";
      const next = upsertProjectFile(
        {
          ...project,
          designName: cfg.designName || project.designName,
          topModule: cfg.topModule || project.topModule,
          pdk: (cfg.pdk as OpenroadProjectState["pdk"]) || project.pdk,
        },
        FLOW_CONFIG_NAME,
        text
      );
      saveOpenroadProject(next);
      setProject(next);
    }
    setErr("");
    queueMicrotask(() => {
      syncingFromFile.current = false;
    });
  };

  /** Apply only the selected stage's JSON slice into stageInputs + flow file */
  const applyStageFlowJson = () => {
    try {
      const j = JSON.parse(stageFlowDraft) as {
        stage?: FlowStageId;
        stageInputs?: Partial<Record<FlowStageId, Record<string, string>>>;
      };
      const sid = (j.stage || selectedStage) as FlowStageId;
      const block = j.stageInputs?.[sid] || j.stageInputs?.[selectedStage];
      if (!block || typeof block !== "object") {
        setErr("Stage JSON must include stageInputs.<stageId> object");
        return;
      }
      setStageInputs((prev) => ({
        ...prev,
        [sid]: {
          ...prev[sid],
          ...Object.fromEntries(
            Object.entries(block).map(([k, v]) => [k, String(v ?? "")])
          ),
        },
      }));
      setErr("");
    } catch {
      setErr("Invalid stage JSON — check syntax");
    }
  };

  /** Never invent "max" — empty key is guest in prod; local-dev elevates via entitlements. */
  const apiKeyResolved = () =>
    apiKey ||
    (typeof window !== "undefined"
      ? localStorage.getItem("ace_seek_api_key") || ""
      : "");

  const invalidateFromStage = (stage: FlowStageId) => {
    const idx = FLOW_STAGES.findIndex((s) => s.id === stage);
    if (idx < 0) return;
    const drop = new Set(FLOW_STAGES.slice(idx).map((s) => s.id));
    setCompleted((prev) => prev.filter((id) => !drop.has(id)));
    setStageResults((prev) => {
      const next = { ...prev };
      for (const id of drop) delete next[id];
      return next;
    });
    setStageArtifacts((prev) => clearArtifactsFromStage(stage, prev));
    // Drop Result DEF view when re-running from floorplan or earlier
    const fpIdx = FLOW_STAGES.findIndex((s) => s.id === "floorplan");
    if (idx <= fpIdx) {
      setDefText(null);
      setDefName(null);
    }
  };

  /** Reset selected stage + all later stages (artifacts, results, completion) */
  const clearStageFlow = (stage: FlowStageId) => {
    if (running) {
      setErr("Stop the running job before clearing");
      return;
    }
    const label = FLOW_STAGES.find((s) => s.id === stage)?.label || stage;
    if (
      !window.confirm(
        `Clear "${label}" and all later stages?\n\nRemoves completion, results, and artifacts from this stage onward. RTL/design files are kept.`
      )
    ) {
      return;
    }
    stopPoll();
    setBusy(false);
    setRunningStage(null);
    invalidateFromStage(stage);
    setErr("");
    setLog((prev) =>
      prev ? `${prev}\n--- cleared from ${stage} ---\n` : ""
    );
  };

  /** Reset entire PnR flow (all stages) */
  const clearWholeFlow = () => {
    if (running) {
      setErr("Stop the running job before clearing");
      return;
    }
    if (
      !window.confirm(
        "Clear the entire flow?\n\nRemoves all stage completion, results, artifacts, and logs. Project RTL/SDC files are kept."
      )
    ) {
      return;
    }
    stopPoll();
    setBusy(false);
    setRunningStage(null);
    setCompleted([]);
    setStageResults({});
    setStageArtifacts([]);
    clearStageArtifacts(); // persist empty
    setLog("");
    setMetricsCsv("");
    setLiveMetricsExtra({});
    setDefText(null);
    setDefName(null);
    setJob(null);
    clearStudioPersistence();

    // Wipe server-side tenant jobs & checkpoints on disk
    const key = apiKeyResolved();
    fetch("/api/openroad/clear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "x-api-key": key } : {}),
      },
    }).catch(() => {
      /* non-blocking server clear */
    });
  };

  /** Run one stage in order only (re-run allowed on the open stage tab) */
  const onRunStage = async (stage: FlowStageId) => {
    if (!project) return;
    // Allow re-run: treat completed stages after this as not required for gate
    const priorsOnly = completed.filter((id) => {
      const i = FLOW_STAGES.findIndex((s) => s.id === id);
      const t = FLOW_STAGES.findIndex((s) => s.id === stage);
      return i >= 0 && i < t;
    });
    const gate = canRunStage(stage, priorsOnly);
    if (!gate.ok) {
      setErr(gate.reason || "Stage locked");
      return;
    }
    if (ready && !ent.openroad?.scripts && !ent.openroad?.run) {
      setErr("OpenROAD stages require Pro (lint/sim) or Max (PnR)");
      return;
    }

    // Per-stage sanity
    const pre = runSanityChecks(project, stageInputs, { stage });
    if (
      stage === "synthesis" ||
      stage === "floorplan" ||
      stage === "powerplan" ||
      stage === "io_plan"
    ) {
      const { ok, errors } = sanitySummary(pre);
      if (!ok) {
        setErr(`${errors} sanity error(s) for ${stage} — fix inputs`);
        setBottomTab("sanity");
        return;
      }
    }

    // Re-run clears this stage + everything after (design may have changed)
    invalidateFromStage(stage);
    // Clear stale metrics until authoritative reports arrive for this run
    if (
      stage === "placement" ||
      stage === "floorplan" ||
      stage === "cts" ||
      stage === "route" ||
      stage === "synthesis"
    ) {
      setLiveMetricsExtra({});
    }

    setBusy(true);
    setRunningStage(stage);
    userPinnedStageRef.current = stage;
    setErr("");
    setSelectedStage(stage);
    setBottomTab("log");
    setLogFilter("stage");
    setRunElapsedSec(0);
    setRunHint(`Starting ${stage}…`);
    setLog(
      (prev) =>
        `${prev}\n--- ${stage} ---\n[Ace-Seek] Starting ${stage}… please wait.\n`
    );
    stopPoll();

    const openlaneConfig = resolveAllOpenlaneConfig(stageInputs, {
      pdk: project.pdk,
    });
    openlaneConfig.DESIGN_NAME = project.topModule || "top";
    openlaneConfig.LINT_TOP =
      resolveField("lint", "LINT_TOP", stageInputs) || project.topModule;
    openlaneConfig.SIM_TB_TOP = resolveField(
      "simulation",
      "SIM_TB_TOP",
      stageInputs
    );

    const key = apiKeyResolved();

    try {
      const res = await fetch("/api/openroad/stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify({
          apiKey: key,
          stage,
          project,
          openlaneConfig,
          lintTop: String(openlaneConfig.LINT_TOP || project.topModule),
          simTbTop: String(openlaneConfig.SIM_TB_TOP || "tb_top"),
          stageInputs,
          completedStages: completed,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.assertions)) {
        setLastAssertions(data.assertions as StageAssertion[]);
      }
      if (data.checkpoint?.path) {
        setLastCheckpoint(String(data.checkpoint.path));
      }
      if (!res.ok) {
        setErr(data.error || `Stage failed (${res.status})`);
        setBusy(false);
        setRunningStage(null);
        setRunHint("");
        setBottomTab("sanity");
        return;
      }
      if (data.error && !data.result && !data.openlaneJob) {
        setErr(data.error);
        setBusy(false);
        setRunningStage(null);
        setRunHint("");
        setBottomTab("sanity");
        return;
      }

      if (data.result) {
        let result = data.result as StageResultPayload;
        if (result.kind === "sim" && result.vcd) {
          storeLastVcd(result.vcd, "tb_top.vcd");
          const wave = parseSimpleVcdWave(result.vcd);
          result = { ...result, wave: wave.length ? wave : result.wave };
        }
        // IO planner: persist pin_order.cfg + plan JSON into project / stageInputs
        if (stage === "io_plan") {
          const ioPayload = data.ioPlan as
            | { planJson?: string; pinOrderCfg?: string }
            | undefined;
          const planJson =
            ioPayload?.planJson ||
            (result.kind === "io_plan"
              ? stageInputs.io_plan?.IO_PLAN_JSON
              : "") ||
            "";
          const pinCfg =
            ioPayload?.pinOrderCfg ||
            (result.kind === "io_plan" ? result.pinOrderCfg : "") ||
            "";
          if (planJson) {
            setStageInputs((prev) => ({
              ...prev,
              io_plan: {
                ...prev.io_plan,
                IO_PLAN_JSON: planJson,
                IO_USE_PIN_ORDER:
                  prev.io_plan?.IO_USE_PIN_ORDER === "" ||
                  prev.io_plan?.IO_USE_PIN_ORDER == null
                    ? "true"
                    : prev.io_plan.IO_USE_PIN_ORDER,
              },
            }));
          }
          if (pinCfg && project) {
            const next = upsertProjectFile(project, "pin_order.cfg", pinCfg);
            saveOpenroadProject(next);
            setProject(next);
          }
        }
        setStageResults((prev) => ({ ...prev, [stage]: result }));
        // Always store log/report artifacts (even on fail)
        const arts = artifactsFromStageResult(stage, result);
        addStageArtifacts(arts);
        const post = runPostAssertions(stage, result, { ok: !!data.ok });
        setLastAssertions((prev) => {
          const pre = prev.filter((a) => a.phase === "pre");
          return [...pre, ...post];
        });
        if (data.ok) {
          const extra = stage === "floorplan" ? ["floorplan", "powerplan"] : [stage];
          setCompleted((prev) => {
            const s = new Set([...prev, ...extra]);
            return FLOW_STAGES.map((x) => x.id).filter((id) => s.has(id));
          });
        } else {
          setErr(result.kind === "generic" ? result.summary : (result as { summary: string }).summary);
        }
        // Append to global log with stage banner so parser tags subsequent lines
        if ("log" in result && result.log) {
          setLog(
            (prev) =>
              `${prev}\n--- ${stage} ---\n${result.log}\n--- end ${stage} ---\n`
          );
        }
        void cloudRecordStageRun({
          projectId: getLocalCloudProjectId() || undefined,
          stage,
          status: data.ok ? "done" : "failed",
          summary:
            "summary" in result ? (result as { summary: string }).summary : stage,
          result,
        });
        void syncCloudSnapshot();
        // Stay on this stage so Live log shows the result immediately
        setSelectedStage(stage);
        userPinnedStageRef.current = stage;
        setBottomTab("log");
        setLogFilter("stage");
        setBusy(false);
        setRunningStage(null);
        setRunHint("");
        return;
      }

      // OpenLane job (floorplan / placement / …)
      if (data.openlaneJob) {
        const r = data.openlaneJob as OpenroadJobResult;
        setJob(r);
        if (r.log) {
          setLog(
            (prev) =>
              `${prev}\n--- ${stage} ---\n${r.log}\n`
          );
        }
        const startPayload: StageResultPayload = {
          kind: "generic",
          summary: `OpenLane Docker · ${stage} running (until stage-limited)…`,
          log: r.log || `[Ace-Seek] ${stage} job ${r.jobId} started…\n`,
        };
        setStageResults((prev) => ({
          ...prev,
          [stage]: startPayload,
        }));
        addStageArtifacts(
          artifactsFromStageResult(stage, {
            ...startPayload,
            summary: `OpenLane ${stage} job log (start)`,
          })
        );
        setSelectedStage(stage);
        userPinnedStageRef.current = stage;
        setBottomTab("log");
        setLogFilter("stage");
        if (
          r.jobId &&
          (r.status === "running" ||
            r.status === "preparing" ||
            r.status === "queued")
        ) {
          startPoll(r.jobId, stage);
        } else {
          setBusy(false);
          setRunningStage(null);
          setRunHint("");
          if (r.status === "succeeded") {
            const extra = stage === "floorplan" ? ["floorplan", "powerplan"] : [stage];
            setCompleted((prev) => {
              const s = new Set([...prev, ...extra]);
              return FLOW_STAGES.map((x) => x.id).filter((id) => s.has(id));
            });
            if (stage === "gds") markOpenlaneChainDone();
            if (r.jobId && r.artifacts?.length) {
              addStageArtifacts(
                artifactsFromJobFiles(
                  r.jobId,
                  r.artifacts.map((a) => ({
                    name: a.name,
                    size: a.size,
                    content: a.content,
                  })),
                  stage
                )
              );
              const defArt = findDefInJobArtifacts(r.artifacts);
              if (defArt) void loadDefFromJob(r.jobId, defArt.name, stage);
            }
            if (r.log) {
              addStageArtifacts(
                artifactsFromStageResult(stage, {
                  kind: "generic",
                  summary: `OpenLane ${stage} finished`,
                  log: r.log,
                })
              );
              setStageResults((prev) => ({
                ...prev,
                [stage]: {
                  kind: "generic",
                  summary: `OpenLane ${stage} finished`,
                  log: r.log || "",
                },
              }));
            }
          } else if (r.status === "failed") {
            setErr(r.message || `${stage} failed`);
            if (r.log) {
              setStageResults((prev) => ({
                ...prev,
                [stage]: {
                  kind: "generic",
                  summary: r.message || "failed",
                  log: r.log || "",
                },
              }));
            }
          }
        }
        return;
      }

      if (data.error) setErr(data.error);
      setBusy(false);
      setRunningStage(null);
      setRunHint("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Stage failed");
      setBusy(false);
      setRunningStage(null);
      setRunHint("");
    }
  };

  const onRunNext = () => {
    if (!nextStage) {
      setErr("All stages completed");
      return;
    }
    void onRunStage(nextStage);
  };

  const stageSchema = STAGE_CONFIG_SCHEMAS.find((s) => s.id === selectedStage);
  const stageRt = parsed.stages.find((s) => s.id === selectedStage)!;
  const stageMeta = FLOW_STAGES.find((s) => s.id === selectedStage)!;
  const stageResult =
    stageResults[selectedStage] || stageRt?.result || undefined;

  /** Per-stage live log: always include this stage's result payload + tagged lines */
  const stageLogLines = useMemo(() => {
    type LL = {
      t: string;
      stage: FlowStageId | null;
      level: "info" | "warn" | "error" | "step";
    };
    const levelOf = (line: string): LL["level"] => {
      if (/error|%Error|FAILED|ERROR:/i.test(line)) return "error";
      if (/warn|%Warning|WARNING/i.test(line)) return "warn";
      if (/STEP|ACE-Seek: ===|Running Synthesis|hierarchy|Number of cells/i.test(line))
        return "step";
      return "info";
    };
    const toLines = (text: string): LL[] =>
      text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => {
          const t = sanitizeOpenroadLogLine(line);
          return {
            t,
            stage: selectedStage,
            level: levelOf(t),
          };
        })
        .filter((l) => l.t.trim());

    const fromParsed = parsed.logLines
      .filter((l) => l.stage === selectedStage)
      .map((l) => ({
        ...l,
        t: sanitizeOpenroadLogLine(l.t),
      }));
    const res = stageResults[selectedStage];
    const fromResult =
      res && "log" in res && res.log ? toLines(res.log) : [];
    const rt = parsed.stages.find((s) => s.id === selectedStage);
    const fromRt = (rt?.logLines || []).map((line) => {
      const t = sanitizeOpenroadLogLine(line);
      return {
        t,
        stage: selectedStage as FlowStageId | null,
        level: levelOf(t),
      };
    });

    // Prefer the stored stage result log (authoritative for Docker lint/sim/yosys).
    // Merge tagged live lines that aren't already present.
    const seen = new Set<string>();
    const out: LL[] = [];
    const pushAll = (arr: LL[]) => {
      for (const l of arr) {
        const key = l.t.slice(0, 500);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(l);
      }
    };
    // Result log first when available (complete stage output)
    if (fromResult.length) pushAll(fromResult);
    pushAll(fromParsed);
    pushAll(fromRt);
    return out;
  }, [parsed.logLines, parsed.stages, selectedStage, stageResults]);

  const filteredLog = useMemo(() => {
    if (logFilter === "all") return parsed.logLines;
    if (logFilter === "error") {
      return stageLogLines.filter(
        (l) => l.level === "error" || l.level === "warn"
      );
    }
    return stageLogLines;
  }, [logFilter, parsed.logLines, stageLogLines]);

  /** Artifacts for the stage currently selected in the rail (must be before any early return) */
  const selectedArtifacts = useMemo(() => {
    const raw = stageArtifacts.filter(
      (a) => a.stage === selectedStage && !isJunkOpenlaneArtifact(a.name)
    );
    if (selectedStage === "placement") return curatePlacementArtifacts(raw);
    return raw;
  }, [stageArtifacts, selectedStage]);

  /** Stage-only slice of flow config for Flow JSON tab */
  const stageFlowSlice = useMemo(() => {
    const schema = STAGE_CONFIG_SCHEMAS.find((s) => s.id === selectedStage);
    const inputs: Record<string, string> = {};
    for (const f of schema?.fields || []) {
      const raw = (stageInputs[selectedStage]?.[f.key] ?? "").trim();
      inputs[f.key] = raw === "" ? String(f.defaultValue) : raw;
    }
    return {
      stage: selectedStage,
      label: FLOW_STAGES.find((s) => s.id === selectedStage)?.label,
      stageInputs: { [selectedStage]: inputs },
    };
  }, [selectedStage, stageInputs]);

  // Keep stage flow draft in sync when switching stages (unless user mid-edit — reset on stage change)
  useEffect(() => {
    setStageFlowDraft(JSON.stringify(stageFlowSlice, null, 2) + "\n");
    setArtifactKindTab("all");
    setPreviewArtifact(null);
    setPreviewText("");
  }, [selectedStage]); // eslint-disable-line react-hooks/exhaustive-deps — intentional: only on stage switch

  // If placement finished earlier (even as soft-fail), hydrate PPA tiles from reports
  useEffect(() => {
    if (selectedStage !== "placement" || !job?.jobId) return;
    if (liveMetricsExtra.wnsNs != null || liveMetricsExtra.areaUm2 != null)
      return;
    const names = job.artifacts?.map((a) => a.name) || [];
    if (
      names.some((n) => /placement_(timing|metrics_summary|power|area)/i.test(n)) ||
      completed.includes("placement")
    ) {
      loadPlacementReports(job.jobId, names);
    }
  }, [selectedStage, job?.jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm font-bold text-[var(--neu-text-muted)] bg-[var(--neu-bg)]">
        Loading project…
      </div>
    );
  }

  const health = projectHealth(project);
  const running =
    busy ||
    job?.status === "running" ||
    job?.status === "preparing" ||
    job?.status === "queued";

  const hasRealMetrics =
    parsed.metrics.wnsNs != null ||
    parsed.metrics.tnsNs != null ||
    parsed.metrics.areaUm2 != null ||
    parsed.metrics.utilizationPct != null ||
    parsed.metrics.powerMw != null ||
    parsed.metrics.cellCount != null;

  /** VCD toggle-rate timeline + educational activity power envelope */
  const activityView = useMemo(() => {
    const fromSim =
      stageResults.simulation &&
      "vcd" in stageResults.simulation &&
      typeof (stageResults.simulation as { vcd?: string }).vcd === "string"
        ? (stageResults.simulation as { vcd?: string }).vcd
        : "";
    const vcd = fromSim || loadLastVcd()?.vcd || "";
    if (!vcd) return null;
    const act = parseVcdActivityTimeline(vcd, { bins: 32 });
    if (!act.bins.length) return null;
    const powerSeries = estimateActivityPowerSeries(act.bins, {
      dynamicMw: parsed.metrics.dynamicMw,
      leakageMw: parsed.metrics.leakageMw,
      powerMw: parsed.metrics.powerMw,
    });
    return {
      bins: act.bins,
      powerSeries,
      signalCount: act.signalCount,
      totalToggles: act.totalToggles,
      timescaleHint: act.timescaleHint,
    };
  }, [stageResults.simulation, parsed.metrics.dynamicMw, parsed.metrics.leakageMw, parsed.metrics.powerMw]);

  const canRunSelected = canRunStage(selectedStage, completed);
  /**
   * Stay on lint (or any stage) tab → Run stays enabled for re-run after design edits.
   * Gate only requires *prior* stages complete, not that this stage is still idle.
   */
  const canReRunSelected = canRunStage(
    selectedStage,
    completed.filter((id) => {
      const idx = FLOW_STAGES.findIndex((s) => s.id === id);
      const sel = FLOW_STAGES.findIndex((s) => s.id === selectedStage);
      return idx >= 0 && idx < sel;
    })
  ).ok;
  const view = stageMeta.view;
  const stageNode = getStageNode(selectedStage);
  /** Prior OpenLane stages done ⇒ treat as checkpointed for UI (job dir resume) */
  const hasFlowProgress = FLOW_STAGES.some(
    (s, i) =>
      s.runner === "openlane" &&
      completed.includes(s.id) &&
      i < FLOW_STAGES.findIndex((x) => x.id === selectedStage)
  );
  const preLive = project
    ? runPreAssertions(selectedStage, project, stageInputs, {
        completed,
        hasCheckpoint: !!lastCheckpoint || hasFlowProgress,
      })
    : [];
  const assertShow = lastAssertions.length
    ? lastAssertions.filter(
        (a) => a.stage === selectedStage || a.stage === "global"
      )
    : preLive;

  const centerView = (
    <OpenroadStudioCenterView
      view={view}
      stageMeta={stageMeta}
      stageResult={stageResult}
      project={project}
      stageInputs={stageInputs}
      onIoPlanJsonChange={(planJson) => {
        setStageInputs((prev) => ({
          ...prev,
          io_plan: {
            ...prev.io_plan,
            IO_PLAN_JSON: planJson,
          },
        }));
      }}
      cellCount={parsed.metrics.cellCount}
      selectedArtifacts={selectedArtifacts}
      selectedStage={selectedStage}
      job={job}
      running={running}
      apiKeyResolved={apiKeyResolved}
      setErr={setErr}
      setRunHint={setRunHint}
      stageLogLines={stageRt.logLines}
    />
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono">
      <OpenroadStudioToolbar
        designName={project.designName}
        topModule={project.topModule}
        pdk={project.pdk}
        cloudReady={cloudReady}
        cloudProjectId={cloudProjectId}
        overall={String(parsed.overall)}
        percent={parsed.percent}
        sanityErrors={sum.errors}
        sanityWarns={sum.warns}
        running={running}
        runningStage={runningStage}
        nextStage={nextStage}
        selectedStage={selectedStage}
        stageShort={stageMeta.short}
        stageLabel={stageMeta.label}
        canReRunSelected={canReRunSelected}
        canReRunReason={canRunSelected.reason}
        completedIncludesSelected={completed.includes(selectedStage)}
        jobId={job?.jobId}
        err={err}
        busy={busy}
        runElapsedSec={runElapsedSec}
        runHint={runHint}
        onRunNext={() => onRunNext()}
        onRunSelected={() => void onRunStage(selectedStage)}
        onPoll={() =>
          startPoll(
            job!.jobId,
            runningStage || selectedStage || "placement"
          )
        }
        onClearStage={() => clearStageFlow(selectedStage)}
        onClearAll={() => clearWholeFlow()}
        onStop={() => {
          stopPoll();
          setBusy(false);
          setRunningStage(null);
          setRunHint("");
        }}
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[12rem_1fr_15rem] gap-3 p-3">
        <OpenroadStudioStageRail
          selectedStage={selectedStage}
          stages={parsed.stages}
          sanity={sanity}
          onSelect={(id) => {
            userPinnedStageRef.current = id;
            setSelectedStage(id);
            setBottomTab("inputs");
          }}
        />

        {/* Center */}
        <main className="min-h-0 overflow-y-auto space-y-3">
          <div className="grid lg:grid-cols-2 gap-3">
            {centerView}

            {/* Stage inputs panel */}
            <div className="neu-panel p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
                    Stage inputs · synced with {FLOW_CONFIG_NAME}
                  </p>
                  <h2 className="text-base font-black uppercase">
                    {stageMeta.label}
                  </h2>
                  <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
                    {stageMeta.description}
                  </p>
                  {(selectedStage === "floorplan" ||
                    selectedStage === "powerplan") && (
                    <p className="text-[10px] font-black text-amber-700 mt-1">
                      Floorplan Docker step = IO + tap/endcap + PDN. Placement
                      (GPL) only runs when you click Run on Placement — not here.
                    </p>
                  )}
                  {stageNode && (
                    <p className="text-[9px] font-bold text-slate-500 mt-1">
                      Node · <code className="text-sky-700">{stageNode.tool}</code>
                      {" · in: "}
                      {stageNode.inputs.join(", ")}
                      {" · out: "}
                      {stageNode.outputs.join(", ")}
                    </p>
                  )}
                  {lastCheckpoint && selectedStage !== "lint" && selectedStage !== "simulation" && (
                    <p className="text-[9px] font-bold text-emerald-700 mt-0.5 truncate" title={lastCheckpoint}>
                      Checkpoint: {lastCheckpoint}
                    </p>
                  )}
                  {!canReRunSelected && (
                    <p className="text-[10px] font-black text-amber-600 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {canRunSelected.reason}
                    </p>
                  )}
                  {canReRunSelected && completed.includes(selectedStage) && (
                    <p className="text-[10px] font-black text-sky-700 mt-1">
                      Stage done — you can re-run after Design edits (later stages
                      will reset).
                    </p>
                  )}
                </div>
                <OpenroadStatusIcon s={stageRt.status} />
              </div>
              {assertShow.length > 0 && (
                <div className="neu-inset p-2 space-y-1 max-h-24 overflow-y-auto">
                  <p className="text-[9px] font-black uppercase text-slate-500">
                    Assertions (Stage Quality Checks)
                  </p>
                  {assertShow.slice(0, 8).map((a, i) => (
                    <p
                      key={`${a.id}-${i}`}
                      className={`text-[10px] font-bold ${
                        a.level === "error"
                          ? "text-rose-600"
                          : a.level === "warn"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      [{a.phase}/{a.id}] {a.message}
                    </p>
                  ))}
                </div>
              )}
              {stageSchema && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedStage === "io_plan" && (
                    <p className="text-[10px] font-bold text-sky-700 neu-inset p-2">
                      Assign ports in the center IO Planner panel. Run commits{" "}
                      <code>pin_order.cfg</code> for OpenLane floorplan.
                    </p>
                  )}
                  {stageSchema.fields
                    .filter((f) => f.key !== "IO_PLAN_JSON")
                    .map((f) => {
                    const val = stageInputs[selectedStage]?.[f.key] ?? "";
                    const effective = resolveField(
                      selectedStage,
                      f.key,
                      stageInputs
                    );
                    return (
                      <label
                        key={f.key}
                        className="block text-[10px] font-bold space-y-0.5"
                      >
                        <span className="text-[var(--neu-text-muted)] uppercase">
                          {f.label}
                          {val === "" && (
                            <span className="ml-1 text-sky-600 font-black">
                              (default: {String(f.defaultValue)})
                            </span>
                          )}
                        </span>
                        {f.type === "boolean" ? (
                          <select
                            className="neu-input w-full text-[11px] font-mono"
                            value={val === "" ? String(f.defaultValue) : val}
                            onChange={(e) =>
                              setField(selectedStage, f.key, e.target.value)
                            }
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : f.type === "select" ? (
                          <select
                            className="neu-input w-full text-[11px] font-mono"
                            value={val || String(f.defaultValue)}
                            onChange={(e) =>
                              setField(
                                selectedStage,
                                f.key,
                                e.target.value === String(f.defaultValue)
                                  ? ""
                                  : e.target.value
                              )
                            }
                          >
                            {f.options?.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="neu-input w-full text-[11px] font-mono"
                            type={f.type === "number" ? "number" : "text"}
                            placeholder={
                              f.placeholder || String(f.defaultValue)
                            }
                            min={f.type === "number" ? f.min : undefined}
                            max={f.type === "number" ? f.max : undefined}
                            step={
                              f.type === "number"
                                ? f.max != null && f.max <= 5
                                  ? "0.01"
                                  : f.max != null && f.max <= 50
                                    ? "0.1"
                                    : "1"
                                : undefined
                            }
                            value={val}
                            onChange={(e) =>
                              setField(selectedStage, f.key, e.target.value)
                            }
                          />
                        )}
                        {(f.help ||
                          (f.type === "number" &&
                            (f.min != null || f.max != null))) && (
                          <span className="block text-[9px] font-medium text-slate-500">
                            {f.help}
                            {f.type === "number" &&
                            (f.min != null || f.max != null)
                              ? ` · range ${f.min ?? "–"}…${f.max ?? "–"}`
                              : ""}
                            {" · effective: "}
                            <code className="text-sky-700">
                              {String(effective).slice(0, 80)}
                              {String(effective).length > 80 ? "…" : ""}
                            </code>
                          </span>
                        )}
                      </label>
                    );
                  })}
                  <button
                    type="button"
                    className="neu-btn !text-[10px] font-black flex items-center gap-1"
                    onClick={() => resetStageDefaults(selectedStage)}
                  >
                    <RotateCcw className="w-3 h-3" /> Reset stage to defaults
                  </button>
                </div>
              )}
              {sanityStage.length > 0 && (
                <div className="neu-inset p-2 space-y-1">
                  {sanityStage.map((s, i) => (
                    <p
                      key={i}
                      className={`text-[10px] font-bold ${
                        s.level === "error"
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      [{s.code}] {s.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom tabs — all scoped to selected stage (left rail) */}
          <OpenroadStudioBottomTabs
            bottomTab={bottomTab}
            setBottomTab={setBottomTab}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
            artifactKindTab={artifactKindTab}
            setArtifactKindTab={setArtifactKindTab}
            selectedStage={selectedStage}
            stageMeta={stageMeta}
            stageSchema={stageSchema}
            stageInputs={stageInputs}
            stageFlowDraft={stageFlowDraft}
            setStageFlowDraft={setStageFlowDraft}
            stageFlowSlice={stageFlowSlice}
            flowJsonDraft={flowJsonDraft}
            setFlowJsonDraft={setFlowJsonDraft}
            applyStageFlowJson={applyStageFlowJson}
            applyFlowJson={applyFlowJson}
            assertShow={assertShow}
            sanityStage={sanityStage}
            filteredLog={filteredLog}
            stageLogLines={stageLogLines}
            stageRt={stageRt}
            stageResult={stageResult}
            busy={busy}
            runningStage={runningStage}
            runElapsedSec={runElapsedSec}
            runHint={runHint}
            logEndRef={logEndRef}
            selectedArtifacts={selectedArtifacts}
            setStageArtifacts={setStageArtifacts}
            previewArtifact={previewArtifact}
            setPreviewArtifact={setPreviewArtifact}
            previewText={previewText}
            setPreviewText={setPreviewText}
            previewBusy={previewBusy}
            openArtifactPreview={openArtifactPreview}
            running={running}
            clearWholeFlow={clearWholeFlow}
            job={job}
            jobDownloadUrl={jobDownloadUrl}
          />
        </main>

        <OpenroadStudioPpaSidebar
          hasRealMetrics={hasRealMetrics}
          metricsCsv={!!metricsCsv}
          metrics={parsed.metrics}
          jobId={job?.jobId}
          artifactNames={job?.artifacts?.map((a) => a.name)}
          onLoadPlacementReports={(jid, names) =>
            loadPlacementReports(jid, names)
          }
          clockView={clockView}
          hasRtl={health.hasRtl}
          activityBins={activityView?.bins}
          activityPower={activityView?.powerSeries}
          activityMeta={
            activityView
              ? {
                  signalCount: activityView.signalCount,
                  totalToggles: activityView.totalToggles,
                  timescaleHint: activityView.timescaleHint,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
