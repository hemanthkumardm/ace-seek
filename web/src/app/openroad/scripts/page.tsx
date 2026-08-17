"use client";

import React, { useEffect, useState } from "react";
import { FileCode2, Download } from "lucide-react";
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
      <div className="m-shell py-10 text-sm font-bold text-slate-500">
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
    <div className="m-shell py-8 space-y-6 font-mono">
      <div className="border-b-4 border-black pb-4 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-cyan-600 tracking-widest">
            OpenROAD · Scripts · Pro
          </p>
          <h1 className="text-2xl font-black uppercase text-slate-900 flex items-center gap-2">
            <FileCode2 className="w-6 h-6" /> Flow script export
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-1 max-w-2xl">
            Generates Yosys + OpenSTA + OpenROAD Tcl, Makefile, and{" "}
            <code className="bg-slate-200 px-1">docker-run.sh</code> from your
            uploaded VLSI handoff. Run locally or use Max Run for hosted jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={!health.readyForScripts}
          className="brutal-btn brutal-btn-cyan !text-sm font-black flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Download flow pack
        </button>
      </div>

      {msg && (
        <div className="text-xs font-black border-2 border-black bg-cyan-100 px-3 py-2">
          {msg}
        </div>
      )}

      {!health.readyForScripts && (
        <div className="brutal-panel p-4 border-3 border-black bg-amber-50 text-xs font-bold">
          No SDC in project.{" "}
          <a href="/openroad/project" className="underline text-emerald-800">
            Upload handoff files
          </a>{" "}
          first.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 text-xs font-bold">
        <div className="brutal-panel p-4 border-3 border-black bg-white">
          <p className="font-black uppercase mb-2">Pack will include</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>constraints.sdc (from VLSI)</li>
            <li>corners.tcl (multi-corner helper)</li>
            <li>rtl/&lt;top&gt;.v</li>
            <li>scripts/synth.ys · opensta.tcl · openroad.tcl</li>
            <li>Makefile · docker-run.sh · README</li>
          </ul>
        </div>
        <div className="brutal-panel p-4 border-3 border-black bg-white">
          <p className="font-black uppercase mb-2">Project</p>
          <p>Design: {project.designName}</p>
          <p>Top: {project.topModule}</p>
          <p>PDK: {project.pdk}</p>
          <p>Files: {project.files.length}</p>
        </div>
      </div>

      {preview && (
        <pre className="brutal-panel p-4 border-3 border-black bg-slate-900 text-emerald-200 text-[10px] overflow-auto max-h-80 whitespace-pre-wrap">
          {preview}
        </pre>
      )}
    </div>
  );
}
