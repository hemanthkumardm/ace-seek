"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  FolderOpen,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Package,
} from "lucide-react";
import {
  clearOpenroadProject,
  emptyOpenroadProject,
  loadOpenroadProject,
  projectHealth,
  saveOpenroadProject,
  upsertProjectFile,
  type OpenroadProjectState,
} from "@/lib/openroad-project-hub";
import {
  OPENROAD_HANDOFF_EVENT,
  type OpenroadPdkId,
} from "@/lib/openroad-format";
import { VLSI_URL } from "@/lib/site";
import {
  downloadOpenroadTemplateZip,
  FLOW_CONFIG_NAME,
  parseFlowConfigJson,
  flowConfigToStageInputs,
} from "@/lib/openroad-template";
import { saveStageInputs, loadStageInputs } from "@/lib/openroad-stage-config";
import {
  cloudPing,
  cloudLoadProject,
  cloudSaveProject,
  setLocalCloudProjectId,
  getLocalCloudProjectId,
} from "@/lib/openroad-cloud";
import {
  OPENROAD_PDKS,
  getPdkDef,
  type OpenroadPdkId as CatalogPdkId,
} from "@/lib/openroad-pdk-catalog";
import { useEntitlements } from "@/hooks/useEntitlements";

type PdkAvail = {
  id: string;
  available: boolean;
  detail: string;
  runner: string;
};

export default function OpenroadProjectPage() {
  const { apiKey } = useEntitlements();
  const [project, setProject] = useState<OpenroadProjectState>(
    emptyOpenroadProject()
  );
  const [flash, setFlash] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const [pdkAvail, setPdkAvail] = useState<PdkAvail[]>([]);
  const [toolsReady, setToolsReady] = useState<boolean | null>(null);

  const reload = useCallback(() => {
    setProject(loadOpenroadProject());
  }, []);

  useEffect(() => {
    reload();
    const on = () => reload();
    window.addEventListener(OPENROAD_HANDOFF_EVENT, on);
    return () => window.removeEventListener(OPENROAD_HANDOFF_EVENT, on);
  }, [reload]);

  useEffect(() => {
    void (async () => {
      const ok = await cloudPing();
      setCloudReady(ok);
      if (!ok) return;
      const loaded = await cloudLoadProject();
      if (loaded.ok && loaded.project) {
        setLocalCloudProjectId(loaded.project.id);
        const st = loaded.project.state_json as {
          project?: OpenroadProjectState;
        };
        if (st?.project?.files?.length) {
          saveOpenroadProject(st.project);
          setProject(st.project);
          setFlash("Loaded project from Supabase");
          setTimeout(() => setFlash(""), 2800);
        }
      }
    })();
  }, []);

  useEffect(() => {
    const key =
      apiKey ||
      (typeof window !== "undefined"
        ? localStorage.getItem("ace_seek_api_key") || ""
        : "");
    void fetch("/api/openroad/pdks", {
      headers: key ? { "x-api-key": key } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.availability)) setPdkAvail(d.availability);
        if (typeof d.toolsReady === "boolean") setToolsReady(d.toolsReady);
      })
      .catch(() => {
        /* offline */
      });
  }, [apiKey]);

  /** Write project meta into ace-seek-flow.json so UI ↔ file stay aligned */
  const syncMetaIntoFlowFile = (
    state: OpenroadProjectState
  ): OpenroadProjectState => {
    const flowFile = state.files.find(
      (f) =>
        f.name.toLowerCase() === FLOW_CONFIG_NAME ||
        f.name.toLowerCase().endsWith(`/${FLOW_CONFIG_NAME}`)
    );
    if (!flowFile) return state;
    const cfg = parseFlowConfigJson(flowFile.content);
    if (!cfg) return state;
    const nextCfg = {
      ...cfg,
      designName: state.designName,
      topModule: state.topModule,
      pdk: state.pdk,
    };
    return upsertProjectFile(
      state,
      flowFile.name,
      JSON.stringify(nextCfg, null, 2) + "\n"
    );
  };

  const persist = (next: OpenroadProjectState) => {
    // Keep flow JSON pdk/design/top in sync with the form — never overwrite form from file here
    next = syncMetaIntoFlowFile(next);
    const flowFile = next.files.find(
      (f) =>
        f.name.toLowerCase() === FLOW_CONFIG_NAME ||
        f.name.toLowerCase().endsWith(`/${FLOW_CONFIG_NAME}`)
    );
    if (flowFile) {
      const cfg = parseFlowConfigJson(flowFile.content);
      if (cfg) saveStageInputs(flowConfigToStageInputs(cfg));
    }
    saveOpenroadProject(next);
    setProject(next);
    // Supabase backup (best-effort)
    if (cloudReady) {
      void cloudSaveProject({
        project: next,
        stageInputs: loadStageInputs(),
        projectId: getLocalCloudProjectId() || undefined,
      }).then((r) => {
        if (r.ok && r.projectId) setLocalCloudProjectId(r.projectId);
      });
    }
  };

  /** On import only: seed design/top/pdk + stage inputs from flow file */
  const applyFlowConfigFromFiles = (
    state: OpenroadProjectState
  ): OpenroadProjectState => {
    const flowFile = state.files.find(
      (f) =>
        f.name.toLowerCase() === FLOW_CONFIG_NAME ||
        f.name.toLowerCase().endsWith(`/${FLOW_CONFIG_NAME}`)
    );
    if (!flowFile) return state;
    const cfg = parseFlowConfigJson(flowFile.content);
    if (!cfg) return state;
    saveStageInputs(flowConfigToStageInputs(cfg));
    return {
      ...state,
      designName: cfg.designName || state.designName,
      topModule: cfg.topModule || state.topModule,
      pdk: (cfg.pdk as OpenroadPdkId) || state.pdk,
    };
  };

  const toast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2800);
  };

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    let next = { ...project };
    let imported = 0;
    for (const file of Array.from(fileList)) {
      if (file.size > 4_000_000) {
        toast(`Skip ${file.name} (too large)`);
        continue;
      }
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const JSZip = (await import("jszip")).default;
          const zip = await JSZip.loadAsync(await file.arrayBuffer());
          const names = Object.keys(zip.files);
          for (const path of names) {
            const entry = zip.files[path];
            if (!entry || entry.dir) continue;
            if (path.split("/").pop()?.startsWith(".")) continue;
            if (path.length > 220) continue;
            const text = await entry.async("string");
            if (text.length > 1_500_000) continue;
            // keep relative path (rtl/, tb/, ace-seek-flow.json)
            next = upsertProjectFile(next, path, text);
            imported++;
          }
        } catch {
          toast(`Could not read zip ${file.name}`);
        }
        continue;
      }
      const text = await file.text();
      next = upsertProjectFile(next, file.name, text);
      imported++;
    }
    next = applyFlowConfigFromFiles(next);
    saveOpenroadProject(next);
    setProject(next);
    toast(imported ? `Imported ${imported} file(s)` : "No files imported");
  };

  const health = projectHealth(project);

  return (
    <div className="min-h-full bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono">
      <div className="m-shell py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 flex items-center gap-2">
              OpenROAD · Project
              {cloudReady ? (
                <span className="text-emerald-700 normal-case">· Supabase</span>
              ) : (
                <span className="text-slate-400 normal-case">· local only</span>
              )}
            </p>
            <h1 className="text-2xl font-black uppercase flex items-center gap-2 mt-1">
              <span className="neu-panel-sm p-2 inline-flex">
                <FolderOpen className="w-5 h-5 text-sky-600" />
              </span>
              Project inputs
            </h1>
            <p className="text-xs font-bold text-[var(--neu-text-muted)] mt-2 max-w-2xl">
              Download the Ace-Seek template (RTL + TB + SDC +{" "}
              <code className="text-sky-700">{FLOW_CONFIG_NAME}</code>
              ), or upload a VLSI OpenROAD handoff zip. Stage configs in the
              flow file auto-load into PnR Studio; you can edit either side.
              {VLSI_URL.startsWith("http") ? (
                <>
                  {" "}
                  Handoff:{" "}
                  <a
                    href={`${VLSI_URL}/openroad-export`}
                    className="text-sky-700 underline"
                  >
                    VLSI → OpenROAD Export
                  </a>
                </>
              ) : (
                <>
                  {" "}
                  <a
                    href="/vlsi/openroad-export"
                    className="text-sky-700 underline font-black"
                  >
                    VLSI → OpenROAD Export
                  </a>
                </>
              )}
            </p>
          </div>
          {flash && (
            <span className="neu-panel-sm px-3 py-1.5 text-xs font-black text-emerald-700">
              {flash}
            </span>
          )}
        </div>

        {/* Template download */}
        <div className="neu-panel p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="neu-panel-sm p-2.5 shrink-0">
              <Package className="w-5 h-5 text-sky-600" />
            </span>
            <div>
              <h2 className="text-sm font-black uppercase">
                Ace-Seek OpenROAD template
              </h2>
              <p className="text-[11px] font-bold text-[var(--neu-text-muted)] mt-1 max-w-xl">
                Full-run starter:{" "}
                <code className="text-sky-700">ace-seek-flow.json</code> (all
                stage defaults), sample RTL, testbench with VCD dump, and SDC.
                Flow order: lint → sim → synth → … → GDS (no stage jumping).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="neu-btn neu-btn-primary !text-xs font-black uppercase inline-flex items-center gap-2 !py-2.5 !px-4"
            onClick={() => {
              downloadOpenroadTemplateZip(project.designName || "counter8");
              toast("Template zip downloaded");
            }}
          >
            <Download className="w-4 h-4" /> Download template
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="neu-panel p-6 space-y-4">
              <label className="neu-inset flex flex-col items-center justify-center gap-3 p-10 cursor-pointer hover:opacity-95 transition-opacity">
                <span className="neu-panel-sm p-3">
                  <Upload className="w-7 h-7 text-sky-600" />
                </span>
                <span className="text-sm font-black uppercase text-center">
                  Drop template zip · handoff · RTL · SDC · flow.json
                </span>
                <span className="text-[11px] font-bold text-[var(--neu-text-muted)] text-center">
                  Accepts .zip (keeps rtl/ tb/ paths) · .sdc · .v · .sv · .json
                </span>
                <input
                  type="file"
                  multiple
                  accept=".sdc,.tcl,.v,.sv,.json,.txt,.md,.ys,.zip"
                  className="hidden"
                  onChange={(e) => void onFiles(e.target.files)}
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-[11px] font-black uppercase space-y-1.5 block">
                  <span className="text-[var(--neu-text-muted)]">
                    Design name
                  </span>
                  <input
                    className="neu-input w-full px-3 py-2 text-sm font-bold"
                    value={project.designName}
                    onChange={(e) =>
                      persist({ ...project, designName: e.target.value })
                    }
                  />
                </label>
                <label className="text-[11px] font-black uppercase space-y-1.5 block">
                  <span className="text-[var(--neu-text-muted)]">
                    Top module
                  </span>
                  <input
                    className="neu-input w-full px-3 py-2 text-sm font-bold"
                    value={project.topModule}
                    onChange={(e) =>
                      persist({ ...project, topModule: e.target.value })
                    }
                  />
                </label>
                <label className="text-[11px] font-black uppercase space-y-1.5 block sm:col-span-2">
                  <span className="text-[var(--neu-text-muted)]">
                    PDK preset
                  </span>
                  <select
                    className="neu-input w-full px-3 py-2 text-sm font-bold"
                    value={project.pdk}
                    onChange={(e) =>
                      persist({
                        ...project,
                        pdk: e.target.value as OpenroadPdkId,
                      })
                    }
                  >
                    {OPENROAD_PDKS.map((p) => {
                      const av = pdkAvail.find((a) => a.id === p.id);
                      const mark =
                        av == null
                          ? ""
                          : av.available
                            ? " ✓ ready"
                            : " · install needed";
                      const runner =
                        p.runner === "openlane"
                          ? "OpenLane"
                          : p.runner === "orfs"
                            ? "ORFS"
                            : "scripts";
                      return (
                        <option key={p.id} value={p.id}>
                          {p.short} — {p.label} [{runner}]{mark}
                        </option>
                      );
                    })}
                  </select>
                  {(() => {
                    const def = getPdkDef(project.pdk as CatalogPdkId);
                    const av = pdkAvail.find((a) => a.id === project.pdk);
                    return (
                      <span className="block text-[10px] font-bold normal-case text-[var(--neu-text-muted)] mt-1 space-y-1">
                        <span className="block">{def.description}</span>
                        {av && (
                          <span
                            className={`block ${
                              av.available
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            {av.available ? "Available — " : "Unavailable — "}
                            {av.detail}
                          </span>
                        )}
                        {toolsReady === false && (
                          <span className="block text-amber-700">
                            Run tools are warming up — try again in a moment.
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </label>
              </div>
            </div>

            <div className="neu-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black uppercase">Files</h2>
                <button
                  type="button"
                  className="neu-btn !text-[10px] font-black uppercase flex items-center gap-1 text-rose-600 !px-2 !py-1.5"
                  onClick={() => {
                    clearOpenroadProject();
                    setProject(emptyOpenroadProject());
                    toast("Project cleared");
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              {project.files.length === 0 ? (
                <p className="text-xs font-bold text-[var(--neu-text-muted)] neu-inset p-4">
                  No files yet — download the template or upload a handoff zip.
                </p>
              ) : (
                <ul className="space-y-2">
                  {project.files.map((f) => (
                    <li
                      key={f.name}
                      className="neu-inset flex items-center justify-between px-3 py-2.5 text-xs font-bold"
                    >
                      <span className="min-w-0 truncate">
                        <span className="text-sky-700 mr-2">[{f.role}]</span>
                        {f.name}
                        <span className="text-[var(--neu-text-muted)] ml-2">
                          {f.size} B
                        </span>
                      </span>
                      <button
                        type="button"
                        className="text-rose-600 font-black uppercase text-[10px] shrink-0 ml-2"
                        onClick={() => {
                          const next = {
                            ...project,
                            files: project.files.filter(
                              (x) => x.name !== f.name
                            ),
                          };
                          persist(next);
                        }}
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="neu-panel p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--neu-text-muted)]">
                Health · {health.score}/100
              </p>
              <div className="neu-inset h-2.5 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded transition-all"
                  style={{ width: `${health.score}%` }}
                />
              </div>
              <ul className="space-y-2 text-[11px] font-bold">
                <li className="flex items-center gap-1.5">
                  {health.hasSdc ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  constraints.sdc
                </li>
                <li className="flex items-center gap-1.5">
                  {health.hasRtl ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  RTL
                </li>
                <li className="flex items-center gap-1.5">
                  {health.hasTb ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  Testbench (sim)
                </li>
                <li className="flex items-center gap-1.5">
                  {health.hasFlowConfig ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {FLOW_CONFIG_NAME}
                </li>
                <li className="flex items-center gap-1.5">
                  {health.hasCorners ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  corners.tcl
                </li>
              </ul>
              {health.hints.map((h) => (
                <p
                  key={h}
                  className="text-[10px] font-bold text-[var(--neu-text-muted)]"
                >
                  · {h}
                </p>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="/openroad/design"
                  className="neu-btn neu-btn-primary !text-xs font-black w-full justify-center inline-flex items-center gap-1 !py-2.5"
                >
                  Edit design <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="/openroad/studio"
                  className="neu-btn !text-xs font-black w-full justify-center inline-flex items-center gap-1 !py-2.5"
                >
                  PnR Studio (Max) <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="/openroad/scripts"
                  className="neu-btn !text-xs font-black w-full justify-center inline-flex items-center gap-1 !py-2.5"
                >
                  Scripts (Pro) <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="neu-panel p-4 text-[10px] font-bold text-[var(--neu-text-muted)] space-y-1">
              <p className="font-black uppercase text-[var(--neu-text)]">
                Stage order (Studio)
              </p>
              <p>
                1 lint → 2 sim → 3 synth → 4 IO plan → 5 floorplan → 6 power → 7
                cts → 8 route → 9 drc → 10 lvs → 11 gds
              </p>
              <p>No jumping — complete prior stage before the next Run.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
