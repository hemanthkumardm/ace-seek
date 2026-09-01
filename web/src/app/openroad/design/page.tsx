"use client";

/**
 * Design editor — edit project files (RTL, TB, SDC, flow JSON) after Project upload,
 * before PnR Studio runs.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileCode2,
  Save,
  Plus,
  Trash2,
  ArrowRight,
  FolderOpen,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  loadOpenroadProject,
  saveOpenroadProject,
  upsertProjectFile,
  emptyOpenroadProject,
  type OpenroadProjectState,
  type OpenroadProjectFile,
} from "@/lib/openroad-project-hub";
import { OPENROAD_HANDOFF_EVENT } from "@/lib/openroad-format";
import {
  FLOW_CONFIG_NAME,
  parseFlowConfigJson,
  flowConfigToStageInputs,
} from "@/lib/openroad-template";
import { saveStageInputs } from "@/lib/openroad-stage-config";

function fileKind(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".sdc")) return "sdc";
  if (n.includes("ace-seek-flow") || n.endsWith(".json")) return "json";
  if (n.includes("/tb/") || /(^|\/)tb[_-]/.test(n)) return "tb";
  if (n.endsWith(".v") || n.endsWith(".sv")) return "rtl";
  if (n.endsWith(".tcl")) return "tcl";
  return "other";
}

function sortFiles(files: OpenroadProjectFile[]): OpenroadProjectFile[] {
  const order = (n: string) => {
    const k = fileKind(n);
    if (k === "rtl") return 0;
    if (k === "tb") return 1;
    if (k === "sdc") return 2;
    if (k === "json") return 3;
    if (k === "tcl") return 4;
    return 5;
  };
  return [...files].sort((a, b) => {
    const d = order(a.name) - order(b.name);
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });
}

export default function OpenroadDesignEditorPage() {
  const [project, setProject] = useState<OpenroadProjectState>(
    emptyOpenroadProject()
  );
  const [selected, setSelected] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [flash, setFlash] = useState("");
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);

  const reload = useCallback(() => {
    const p = loadOpenroadProject();
    setProject(p);
    setDirty(false);
  }, []);

  useEffect(() => {
    reload();
    const on = () => reload();
    window.addEventListener(OPENROAD_HANDOFF_EVENT, on);
    return () => window.removeEventListener(OPENROAD_HANDOFF_EVENT, on);
  }, [reload]);

  const files = useMemo(() => sortFiles(project.files), [project.files]);

  // Select first file when list changes / none selected
  useEffect(() => {
    if (!files.length) {
      setSelected("");
      setDraft("");
      setDirty(false);
      return;
    }
    if (!selected || !files.some((f) => f.name === selected)) {
      const first = files[0].name;
      setSelected(first);
      setDraft(files[0].content);
      setDirty(false);
    }
  }, [files, selected]);

  const current = files.find((f) => f.name === selected);

  const toast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2200);
  };

  const selectFile = (name: string) => {
    if (dirty && selected && selected !== name) {
      const ok = window.confirm(
        `Discard unsaved changes to ${selected}?`
      );
      if (!ok) return;
    }
    const f = files.find((x) => x.name === name);
    setSelected(name);
    setDraft(f?.content ?? "");
    setDirty(false);
  };

  const saveCurrent = () => {
    if (!selected) return;
    let next = upsertProjectFile(project, selected, draft);

    // If flow config edited, re-seed stage inputs for Studio
    if (
      selected.toLowerCase() === FLOW_CONFIG_NAME ||
      selected.toLowerCase().endsWith(`/${FLOW_CONFIG_NAME}`)
    ) {
      const cfg = parseFlowConfigJson(draft);
      if (cfg) {
        saveStageInputs(flowConfigToStageInputs(cfg));
        next = {
          ...next,
          designName: cfg.designName || next.designName,
          topModule: cfg.topModule || next.topModule,
          pdk: (cfg.pdk as OpenroadProjectState["pdk"]) || next.pdk,
        };
      }
    }

    saveOpenroadProject(next);
    setProject(next);
    setDirty(false);
    toast(`Saved ${selected}`);
  };

  const discard = () => {
    if (!current) return;
    setDraft(current.content);
    setDirty(false);
    toast("Discarded edits");
  };

  const removeFile = (name: string) => {
    if (!window.confirm(`Remove ${name} from project?`)) return;
    const next = {
      ...project,
      files: project.files.filter((f) => f.name !== name),
    };
    saveOpenroadProject(next);
    setProject(next);
    if (selected === name) {
      setSelected("");
      setDraft("");
      setDirty(false);
    }
    toast(`Removed ${name}`);
  };

  const addFile = () => {
    const name = newName.trim().replace(/\\/g, "/");
    if (!name) return;
    if (!/\.(v|sv|sdc|tcl|json|md|txt)$/i.test(name)) {
      toast("Use .v / .sv / .sdc / .tcl / .json");
      return;
    }
    if (project.files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      toast("File already exists");
      return;
    }
    let content = "";
    if (/\.(v|sv)$/i.test(name)) {
      const mod = name
        .split("/")
        .pop()!
        .replace(/\.(v|sv)$/i, "")
        .replace(/[^a-zA-Z0-9_]/g, "_");
      content = `// ${name}\n\`timescale 1ns / 1ps\nmodule ${mod} (\n  input  wire clk,\n  input  wire rst_n\n);\n  // TODO\nendmodule\n`;
    } else if (/\.sdc$/i.test(name)) {
      content = `create_clock -name clk -period 10.0 [get_ports clk]\n`;
    } else if (name.toLowerCase().includes("flow")) {
      content = `{\n  "version": 1,\n  "designName": "${project.designName}",\n  "topModule": "${project.topModule}",\n  "pdk": "${project.pdk}",\n  "stages": [],\n  "stageInputs": {}\n}\n`;
    }
    const next = upsertProjectFile(project, name, content);
    saveOpenroadProject(next);
    setProject(next);
    setSelected(name);
    setDraft(content);
    setDirty(false);
    setShowNew(false);
    setNewName("");
    toast(`Created ${name}`);
  };

  const lineCount = draft.split("\n").length;

  return (
    <div className="h-full min-h-0 flex flex-col bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono">
      {/* Toolbar */}
      <div className="shrink-0 px-4 py-3 flex flex-wrap items-center gap-3 justify-between border-b border-slate-200/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="neu-panel-sm px-3 py-1.5 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-black uppercase tracking-wide">
              Design editor
            </span>
          </div>
          <span className="text-[11px] font-bold text-[var(--neu-text-muted)] truncate">
            {project.designName} · {project.topModule} · {project.pdk}
          </span>
          {dirty && (
            <span className="text-[10px] font-black text-amber-600">
              unsaved
            </span>
          )}
          {flash && (
            <span className="text-[10px] font-black text-emerald-600">
              {flash}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={!dirty}
            onClick={discard}
            className="neu-btn !text-[11px] !py-2 !px-3 font-black flex items-center gap-1 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Discard
          </button>
          <button
            type="button"
            disabled={!dirty || !selected}
            onClick={saveCurrent}
            className="neu-btn neu-btn-primary !text-[11px] !py-2 !px-3 font-black flex items-center gap-1 disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <a
            href="/openroad/studio"
            className="neu-btn !text-[11px] !py-2 !px-3 font-black inline-flex items-center gap-1"
          >
            PnR Studio <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="neu-panel p-8 max-w-md text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-black uppercase">No design files yet</p>
            <p className="text-[11px] font-bold text-[var(--neu-text-muted)]">
              Upload a template or handoff zip on Project first, then edit RTL /
              SDC / testbench here.
            </p>
            <a
              href="/openroad/project"
              className="neu-btn neu-btn-primary !text-xs font-black inline-flex items-center gap-1 !py-2.5"
            >
              <FolderOpen className="w-4 h-4" /> Go to Project
            </a>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[14rem_1fr]">
          {/* File list */}
          <aside className="border-r border-slate-200/70 overflow-y-auto p-2 space-y-1 bg-[var(--neu-bg)]">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--neu-text-muted)]">
                Files · {files.length}
              </p>
              <button
                type="button"
                className="neu-btn !text-[9px] !px-1.5 !py-1 font-black"
                onClick={() => setShowNew((v) => !v)}
                title="Add file"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {showNew && (
              <div className="neu-inset p-2 space-y-1 mb-2">
                <input
                  className="neu-input w-full text-[10px] font-mono"
                  placeholder="rtl/module.v or tb/tb_top.v"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFile()}
                />
                <button
                  type="button"
                  className="neu-btn neu-btn-primary w-full !text-[10px] font-black"
                  onClick={addFile}
                >
                  Create
                </button>
              </div>
            )}
            {files.map((f) => {
              const active = f.name === selected;
              const kind = fileKind(f.name);
              return (
                <div
                  key={f.name}
                  className={`group flex items-stretch rounded-xl ${
                    active ? "neu-btn-active" : "hover:bg-white/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectFile(f.name)}
                    className="flex-1 min-w-0 text-left px-2 py-2"
                  >
                    <span className="text-[9px] font-black uppercase text-sky-700">
                      {kind}
                    </span>
                    <p className="text-[11px] font-bold truncate">{f.name}</p>
                    <p className="text-[9px] text-[var(--neu-text-muted)]">
                      {f.size} B
                    </p>
                  </button>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 px-2 text-rose-600"
                    title="Remove"
                    onClick={() => removeFile(f.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </aside>

          {/* Editor */}
          <div className="min-h-0 flex flex-col p-3 gap-2">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-[var(--neu-text-muted)]">
                  Editing
                </p>
                <p className="text-sm font-black truncate">
                  {selected || "—"}
                </p>
              </div>
              <span className="text-[10px] font-bold text-[var(--neu-text-muted)]">
                {lineCount} lines · Ctrl/Cmd+S to save
              </span>
            </div>
            <textarea
              className="flex-1 min-h-[320px] w-full p-3 text-[12px] font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-sky-400/50 rounded-2xl border border-slate-200/80 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.45),inset_-2px_-2px_6px_rgba(255,255,255,0.75)] bg-[var(--neu-bg)] text-[var(--neu-text)] placeholder:text-slate-400 caret-sky-600 selection:bg-sky-200 selection:text-slate-900"
              spellCheck={false}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setDirty(true);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                  e.preventDefault();
                  saveCurrent();
                }
              }}
            />
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)] shrink-0">
              Saves into the browser project (same store as Project / Studio).
              After RTL edits, open PnR Studio → Lint and re-run Lint.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
