"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Cpu, Loader2, RefreshCw, ShieldAlert, CheckCircle2, Ban } from "lucide-react";

export type EngineRow = {
  name: string;
  available: boolean;
  description: string;
  tier: string;
  status: string;
  studio: string;
};

const AUTOMACRO_KEY = "ace_seek_automacro_enabled";
const FORGE_LEC_KEY = "ace_seek_forge_lec";

export function loadAutomacroEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(AUTOMACRO_KEY);
  if (v === null) return true;
  return v !== "0" && v !== "false";
}

export function saveAutomacroEnabled(on: boolean) {
  localStorage.setItem(AUTOMACRO_KEY, on ? "1" : "0");
}

export function loadForgeLecEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FORGE_LEC_KEY) === "1";
}

export function saveForgeLecEnabled(on: boolean) {
  localStorage.setItem(FORGE_LEC_KEY, on ? "1" : "0");
}

function statusBadge(status: string) {
  if (status === "production")
    return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (status === "model_dse")
    return "bg-amber-500/15 text-amber-800 border-amber-500/30";
  return "bg-slate-500/15 text-slate-600 border-slate-400/30";
}

type Props = {
  /** Optional AutoMacro log/report text from floorplan artifacts */
  automacroReport?: string | null;
  /** Workstation / session API key for /api/openroad/engines */
  apiKey?: string;
};

export function OpenroadEnginesPanel({ automacroReport, apiKey }: Props) {
  const [engines, setEngines] = useState<EngineRow[]>([]);
  const [source, setSource] = useState<string>("");
  const [cloudSpine, setCloudSpine] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [automacroOn, setAutomacroOn] = useState(true);
  const [forgeLecOn, setForgeLecOn] = useState(false);

  useEffect(() => {
    setAutomacroOn(loadAutomacroEnabled());
    setForgeLecOn(loadForgeLecEnabled());
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers["x-api-key"] = apiKey;
      const res = await fetch("/api/openroad/engines", {
        cache: "no-store",
        headers,
      });
      const data = await res.json();
      if (!res.ok && !data.engines) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setEngines(Array.isArray(data.engines) ? data.engines : []);
      setSource(data.source || "");
      setCloudSpine(data.cloudSpine || "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load engines");
    } finally {
      setBusy(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleAutomacro = (on: boolean) => {
    setAutomacroOn(on);
    saveAutomacroEnabled(on);
  };

  const toggleForgeLec = (on: boolean) => {
    setForgeLecOn(on);
    saveForgeLecEnabled(on);
  };

  return (
    <div className="neu-panel p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
            Ace engines
          </p>
          <h3 className="text-sm font-black uppercase text-[var(--neu-text)] flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-sky-600" /> Studio engine status
          </h3>
        </div>
        <button
          type="button"
          className="neu-btn !text-[10px] font-black flex items-center gap-1"
          onClick={() => void refresh()}
          disabled={busy}
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Refresh
        </button>
      </div>

      <p className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2 py-1.5">
        {cloudSpine ||
          "Cloud spine: Legacy Docker PnR (default) or AceForge Classic/Chip — pick Flow profile on Project."}
      </p>

      {/* Ace-AutoMacro control */}
      <div className="neu-inset p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--neu-text)]">
              Ace-AutoMacro (floorplan)
            </p>
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
              When ON, OpenLane floorplan runs Ace-AutoMacro if hard macros are detected.
              Halo X/Y µm are set on the <strong>Floorplan</strong> stage (
              <code className="text-sky-700">ACE_AUTOMACRO_HALO_*</code>). Flightline/RUDY lives
              inside this engine — not a separate Studio product.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[11px] font-black cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={automacroOn}
              onChange={(e) => toggleAutomacro(e.target.checked)}
            />
            {automacroOn ? "Enabled" : "Disabled"}
          </label>
        </div>
        {automacroReport ? (
          <pre className="neu-inset p-2 text-[9px] font-mono max-h-40 overflow-auto whitespace-pre-wrap text-slate-700 bg-black/5 rounded-lg">
            {automacroReport.slice(0, 8000)}
          </pre>
        ) : (
          <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
            No AutoMacro log in current artifacts yet — run <strong>floorplan</strong> on a
            design with SRAM/macros to generate <code className="text-sky-700">ace_automacro.log</code>.
          </p>
        )}
      </div>

      {/* AceForge optional EQY step */}
      <div className="neu-inset p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--neu-text)]">
              AceForge LEC (EQY)
            </p>
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
              When ON, AceForge Classic/Chip may run an EQY step if{" "}
              <code className="text-sky-700">eqy</code> is in the worker image (
              <code className="text-sky-700">ACE_FORGE_LEC=1</code>). Default off — fail-closed.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[11px] font-black cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={forgeLecOn}
              onChange={(e) => toggleForgeLec(e.target.checked)}
            />
            {forgeLecOn ? "Enabled" : "Disabled"}
          </label>
        </div>
      </div>

      {err && (
        <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> {err}
        </p>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {engines.map((e) => (
          <div
            key={e.name}
            className="neu-inset p-2.5 flex flex-col gap-1 border border-black/5"
          >
            <div className="flex flex-wrap items-center gap-2">
              {e.available ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="text-[11px] font-black font-mono text-[var(--neu-text)]">
                {e.name}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${statusBadge(
                  e.status
                )}`}
              >
                {e.status}
              </span>
              <span className="text-[9px] font-bold text-[var(--neu-text-muted)] uppercase">
                {e.tier}
              </span>
            </div>
            <p className="text-[10px] font-bold text-[var(--neu-text-muted)] leading-snug">
              {e.description}
            </p>
            {e.studio && (
              <p className="text-[9px] font-semibold text-slate-500 leading-snug">
                Studio: {e.studio}
              </p>
            )}
          </div>
        ))}
        {!engines.length && !busy && (
          <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">No engines listed.</p>
        )}
      </div>

      {source && (
        <p className="text-[9px] font-bold text-[var(--neu-text-muted)]">
          Source: {source}
        </p>
      )}
    </div>
  );
}
