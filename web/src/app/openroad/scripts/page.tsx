"use client";

import React, { useEffect, useState } from "react";
import { FileCode2, Download, FolderOpen } from "lucide-react";
import {
  loadOpenroadProject,
  projectHealth,
  type OpenroadProjectState,
} from "@/lib/openroad-project-hub";
import {
  buildOpenroadFlowScripts,
  downloadFlowPackZip,
} from "@/lib/openroad-scripts-engine";

export default function OpenroadScriptsPage() {
  const [project, setProject] = useState<OpenroadProjectState | null>(null);
  const [preview, setPreview] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setProject(loadOpenroadProject());
  }, []);

  if (!project) {
    return (
      <div className="min-h-full bg-[var(--neu-bg)] flex items-center justify-center text-sm font-bold text-[var(--neu-text-muted)] font-mono">
        Loading project…
      </div>
    );
  }

  const health = projectHealth(project);

  const onExport = () => {
    if (!health.readyForScripts) {
      setMsg("Upload constraints.sdc on Project first");
      return;
    }
    const pack = buildOpenroadFlowScripts(project);
    downloadFlowPackZip(pack, project.designName);
    setPreview(
      pack.files
        .slice(0, 4)
        .map((f) => `=== ${f.filename} ===\n${f.content.slice(0, 400)}…`)
        .join("\n\n")
    );
    setMsg(`Downloaded ${pack.files.length} files as zip`);
  };

  return (
    <div className="min-h-full bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono">
      <div className="m-shell py-8 space-y-6">
        <div className="flex flex-wrap justify-between gap-3 items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">
              OpenROAD · Scripts · Pro
            </p>
            <h1 className="text-2xl font-black uppercase flex items-center gap-2 mt-1">
              <span className="neu-panel-sm p-2 inline-flex">
                <FileCode2 className="w-5 h-5 text-sky-600" />
              </span>
              Flow script export
            </h1>
            <p className="text-xs font-bold text-[var(--neu-text-muted)] mt-2 max-w-2xl">
              Generates Yosys + OpenSTA + OpenROAD Tcl, Makefile, and{" "}
              <code className="neu-inset px-1.5 py-0.5 text-[10px]">
                docker-run.sh
              </code>{" "}
              from your uploaded handoff. Run locally, or use{" "}
              <a href="/openroad/studio" className="text-sky-700 underline">
                PnR Studio
              </a>{" "}
              for hosted OpenLane jobs.
            </p>
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={!health.readyForScripts}
            className="neu-btn neu-btn-primary !text-sm font-black flex items-center gap-2 !py-2.5 !px-4 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download flow pack
          </button>
        </div>

        {msg && (
          <div className="neu-panel-sm px-4 py-2 text-xs font-black text-sky-800">
            {msg}
          </div>
        )}

        {!health.readyForScripts && (
          <div className="neu-inset px-4 py-3 text-xs font-bold text-amber-800 flex flex-wrap items-center gap-2">
            No SDC in project.{" "}
            <a
              href="/openroad/project"
              className="neu-btn !text-[11px] font-black inline-flex items-center gap-1 !py-1.5 !px-2"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Upload handoff
            </a>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 text-xs font-bold">
          <div className="neu-panel p-5 space-y-2">
            <p className="font-black uppercase text-[var(--neu-text-muted)] text-[10px] tracking-wider">
              Pack will include
            </p>
            <ul className="space-y-1.5 text-[var(--neu-text)]">
              {[
                "constraints.sdc (from VLSI handoff)",
                "corners.tcl (multi-corner helper)",
                "rtl/<top>.v",
                "scripts/synth.ys · opensta.tcl · openroad.tcl",
                "Makefile · docker-run.sh · README",
              ].map((item) => (
                <li
                  key={item}
                  className="neu-inset px-3 py-2 text-[11px] font-bold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="neu-panel p-5 space-y-2">
            <p className="font-black uppercase text-[var(--neu-text-muted)] text-[10px] tracking-wider">
              Project snapshot
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["Design", project.designName],
                  ["Top", project.topModule],
                  ["PDK", project.pdk],
                  ["Files", String(project.files.length)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="neu-inset px-3 py-2">
                  <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
                    {k}
                  </p>
                  <p className="text-sm font-black text-sky-800 truncate">
                    {v}
                  </p>
                </div>
              ))}
            </div>
            <a
              href="/openroad/studio"
              className="neu-btn !text-xs font-black w-full justify-center inline-flex !py-2.5 mt-2"
            >
              Open PnR Studio →
            </a>
          </div>
        </div>

        {preview && (
          <pre className="neu-inset p-4 bg-slate-900 text-sky-100 text-[10px] overflow-auto max-h-80 whitespace-pre-wrap font-mono">
            {preview}
          </pre>
        )}
      </div>
    </div>
  );
}
