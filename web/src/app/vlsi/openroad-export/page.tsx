"use client";

import React, { useMemo, useState } from "react";
import { Download, Boxes, FileText } from "lucide-react";
import {
  buildOpenroadHandoffPack,
  downloadOpenroadHandoffZip,
  downloadTextFile,
  type OpenroadPdkId,
} from "@/lib/openroad-format";
import { OPENROAD_URL } from "@/lib/site";
import { VlsiStudioGate } from "@/components/VlsiStudioGate";

function OpenroadExportInner() {
  const [designName, setDesignName] = useState("design");
  const [topModule, setTopModule] = useState("top");
  const [pdk, setPdk] = useState<OpenroadPdkId>("sky130");
  const [sdcOverride, setSdcOverride] = useState("");
  const [msg, setMsg] = useState("");

  const pack = useMemo(
    () =>
      buildOpenroadHandoffPack({
        designName,
        topModule,
        pdk,
        sdcText: sdcOverride.trim() || undefined,
      }),
    [designName, topModule, pdk, sdcOverride]
  );

  const onZip = () => {
    downloadOpenroadHandoffZip(pack);
    setMsg("Downloaded OpenROAD handoff zip — upload on openroad.ace-seek.com");
  };

  return (
    <div className="m-shell py-8 space-y-6 font-mono">
      <div className="border-b-4 border-black pb-4 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
            VLSI · OpenROAD handoff
          </p>
          <h1 className="text-2xl font-black uppercase text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6" /> Export OpenROAD-format files
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-1 max-w-2xl">
            Builds <code className="bg-slate-200 px-1">constraints.sdc</code> +{" "}
            <code className="bg-slate-200 px-1">corners.tcl</code> + manifest
            from your SDC Studio state (and MMMC registry when present). Next:
            upload the zip on{" "}
            <a href={OPENROAD_URL} className="text-emerald-700 underline">
              openroad.ace-seek.com
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onZip}
          className="brutal-btn brutal-btn-cyan !text-sm font-black flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download handoff zip
        </button>
      </div>

      {msg && (
        <div className="text-xs font-black border-2 border-black bg-emerald-100 px-3 py-2">
          {msg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="brutal-panel p-4 border-3 border-black bg-white space-y-3">
          <label className="text-[11px] font-black uppercase block space-y-1">
            Design name
            <input
              className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-black uppercase block space-y-1">
            Top module
            <input
              className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold"
              value={topModule}
              onChange={(e) => setTopModule(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-black uppercase block space-y-1">
            PDK hint
            <select
              className="w-full border-2 border-black px-2 py-1.5 text-sm font-bold"
              value={pdk}
              onChange={(e) => setPdk(e.target.value as OpenroadPdkId)}
            >
              <option value="sky130">sky130</option>
              <option value="asap7">asap7</option>
              <option value="nangate45">nangate45</option>
              <option value="generic">generic</option>
            </select>
          </label>
          <label className="text-[11px] font-black uppercase block space-y-1">
            Optional SDC paste (overrides last SDC Studio save)
            <textarea
              className="w-full border-2 border-black px-2 py-1.5 text-[11px] font-mono h-32"
              placeholder="Leave empty to use last SDC Studio state from this browser…"
              value={sdcOverride}
              onChange={(e) => setSdcOverride(e.target.value)}
            />
          </label>
        </div>

        <div className="brutal-panel p-4 border-3 border-black bg-white space-y-3">
          <p className="text-[11px] font-black uppercase flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Pack contents
          </p>
          <ul className="text-xs font-bold space-y-1 list-disc pl-4">
            {pack.files.map((f) => (
              <li key={f.filename} className="flex items-center justify-between gap-2">
                <span>{f.filename}</span>
                <button
                  type="button"
                  className="text-emerald-700 underline text-[10px]"
                  onClick={() => downloadTextFile(f.filename, f.content)}
                >
                  download
                </button>
              </li>
            ))}
          </ul>
          <a
            href={OPENROAD_URL}
            className="brutal-btn bg-emerald-400 text-black !text-xs font-black w-full justify-center inline-flex"
          >
            Open openroad.ace-seek.com →
          </a>
        </div>
      </div>

      <pre className="brutal-panel p-4 border-3 border-black bg-slate-900 text-emerald-200 text-[10px] overflow-auto max-h-64 whitespace-pre-wrap">
        {pack.files.find((f) => f.filename === "constraints.sdc")?.content.slice(0, 2500)}
      </pre>
    </div>
  );
}

export default function VlsiOpenroadExportPage() {
  // Free+ can export handoff (uses Report Hub free tier as gate baseline)
  return (
    <VlsiStudioGate studio="sdc">
      <OpenroadExportInner />
    </VlsiStudioGate>
  );
}
