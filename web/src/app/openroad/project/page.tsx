"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  FolderOpen,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
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

export default function OpenroadProjectPage() {
  const [project, setProject] = useState<OpenroadProjectState>(
    emptyOpenroadProject()
  );
  const [flash, setFlash] = useState("");

  const reload = useCallback(() => {
    setProject(loadOpenroadProject());
  }, []);

  useEffect(() => {
    reload();
    const on = () => reload();
    window.addEventListener(OPENROAD_HANDOFF_EVENT, on);
    return () => window.removeEventListener(OPENROAD_HANDOFF_EVENT, on);
  }, [reload]);

  const persist = (next: OpenroadProjectState) => {
    saveOpenroadProject(next);
    setProject(next);
  };

  const toast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2800);
  };

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    let next = { ...project };
    for (const file of Array.from(fileList)) {
      if (file.size > 1_500_000) {
        toast(`Skip ${file.name} (too large)`);
        continue;
      }
      const text = await file.text();
      // Zip not parsed client-side for simplicity — ask for individual files
      if (file.name.toLowerCase().endsWith(".zip")) {
        toast("Unzip locally and upload .sdc / .tcl / .json files");
        continue;
      }
      next = upsertProjectFile(next, file.name, text);
    }
    persist(next);
    toast(`Imported ${fileList.length} file(s)`);
  };

  const health = projectHealth(project);

  return (
    <div className="m-shell py-8 space-y-6 font-mono">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-black pb-4">
        <div>
          <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
            OpenROAD · Project
          </p>
          <h1 className="text-2xl font-black uppercase text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-6 h-6" /> Upload VLSI handoff
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-1 max-w-2xl">
            Export OpenROAD-format files on{" "}
            <a href="/vlsi/openroad-export" className="text-emerald-700 underline">
              VLSI → OpenROAD Export
            </a>
            {typeof VLSI_URL === "string" && VLSI_URL.startsWith("http") && (
              <>
                {" "}
                (
                <a
                  href={`${VLSI_URL}/openroad-export`}
                  className="text-emerald-700 underline"
                >
                  {VLSI_URL}/openroad-export
                </a>
                )
              </>
            )}
            , then upload them here.
          </p>
        </div>
        {flash && (
          <span className="text-xs font-black bg-emerald-400 text-black border-2 border-black px-3 py-1">
            {flash}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="brutal-panel p-6 border-3 border-black bg-white space-y-4">
            <label className="flex flex-col items-center justify-center gap-3 border-3 border-dashed border-black bg-slate-50 p-10 cursor-pointer hover:bg-emerald-50 transition-colors">
              <Upload className="w-8 h-8 text-emerald-600" />
              <span className="text-sm font-black uppercase">
                Drop constraints.sdc · corners.tcl · RTL · manifest
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                (Unzip handoff zip first — individual files preferred)
              </span>
              <input
                type="file"
                multiple
                accept=".sdc,.tcl,.v,.sv,.json,.txt,.md,.ys"
                className="hidden"
                onChange={(e) => void onFiles(e.target.files)}
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-[11px] font-black uppercase space-y-1">
                Design name
                <input
                  className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold"
                  value={project.designName}
                  onChange={(e) =>
                    persist({ ...project, designName: e.target.value })
                  }
                />
              </label>
              <label className="text-[11px] font-black uppercase space-y-1">
                Top module
                <input
                  className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold"
                  value={project.topModule}
                  onChange={(e) =>
                    persist({ ...project, topModule: e.target.value })
                  }
                />
              </label>
              <label className="text-[11px] font-black uppercase space-y-1 sm:col-span-2">
                PDK preset
                <select
                  className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold"
                  value={project.pdk}
                  onChange={(e) =>
                    persist({
                      ...project,
                      pdk: e.target.value as OpenroadPdkId,
                    })
                  }
                >
                  <option value="sky130">sky130</option>
                  <option value="asap7">asap7</option>
                  <option value="nangate45">nangate45</option>
                  <option value="generic">generic</option>
                </select>
              </label>
            </div>
          </div>

          <div className="brutal-panel p-4 border-3 border-black bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase">Files</h2>
              <button
                type="button"
                className="text-[10px] font-black uppercase flex items-center gap-1 text-rose-600"
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
              <p className="text-xs font-bold text-slate-500">
                No files yet — upload VLSI OpenROAD handoff outputs.
              </p>
            ) : (
              <ul className="space-y-2">
                {project.files.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between border-2 border-black px-3 py-2 text-xs font-bold bg-slate-50"
                  >
                    <span>
                      <span className="text-emerald-700 mr-2">[{f.role}]</span>
                      {f.name}
                      <span className="text-slate-400 ml-2">
                        {f.size} B
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-rose-600"
                      onClick={() => {
                        const next = {
                          ...project,
                          files: project.files.filter((x) => x.name !== f.name),
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
          <div className="brutal-panel p-5 border-3 border-black bg-emerald-50 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest">
              Health · {health.score}/100
            </p>
            <div className="h-2 border-2 border-black bg-white">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${health.score}%` }}
              />
            </div>
            <ul className="space-y-1.5 text-[11px] font-bold">
              <li className="flex items-center gap-1.5">
                {health.hasSdc ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                constraints.sdc
              </li>
              <li className="flex items-center gap-1.5">
                {health.hasCorners ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
                corners.tcl
              </li>
              <li className="flex items-center gap-1.5">
                {health.hasRtl ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
                RTL
              </li>
            </ul>
            {health.hints.map((h) => (
              <p key={h} className="text-[10px] font-bold text-slate-600">
                · {h}
              </p>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="/openroad/scripts"
                className="brutal-btn brutal-btn-cyan !text-xs font-black w-full justify-center"
              >
                Scripts (Pro) →
              </a>
              <a
                href="/openroad/run"
                className="brutal-btn brutal-btn-yellow !text-xs font-black w-full justify-center"
              >
                Run (Max) →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
