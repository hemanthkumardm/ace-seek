"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Download, Loader2, RefreshCw, Cpu } from "lucide-react";
import {
  loadOpenroadProject,
  projectHealth,
  type OpenroadProjectState,
} from "@/lib/openroad-project-hub";
import type { OpenroadJobResult } from "@/lib/openroad-run-engine";
import { downloadTextFile } from "@/lib/openroad-format";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function OpenroadRunPage() {
  const { apiKey, ent, ready } = useEntitlements();
  const [project, setProject] = useState<OpenroadProjectState | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpenroadJobResult | null>(null);
  const [mode, setMode] = useState<"dry_run" | "container">("container");
  const [err, setErr] = useState("");
  const [runnerInfo, setRunnerInfo] = useState<Record<string, unknown> | null>(
    null
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resolveKey = () =>
    apiKey ||
    (typeof window !== "undefined"
      ? localStorage.getItem("ace_seek_api_key") || ""
      : "");

  const jobDownloadUrl = (jobId: string, name: string) => {
    const key = resolveKey();
    const q = new URLSearchParams({ download: name });
    if (key) q.set("apiKey", key);
    return `/api/openroad/jobs/${jobId}?${q.toString()}`;
  };

  useEffect(() => {
    setProject(loadOpenroadProject());
    const key = resolveKey();
    void fetch("/api/openroad/run", {
      headers: key ? { "x-api-key": key } : {},
    })
      .then((r) => r.json())
      .then((d) => setRunnerInfo(d.runner || null))
      .catch(() => null);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount probe only
  }, []);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPoll = (jobId: string) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const key = resolveKey();
        const res = await fetch(`/api/openroad/jobs/${jobId}`, {
          headers: key ? { "x-api-key": key } : {},
        });
        const data = await res.json();
        if (data.result) {
          setResult(data.result as OpenroadJobResult);
          const st = data.result.status as string;
          if (st === "succeeded" || st === "failed" || st === "rejected") {
            stopPoll();
            setBusy(false);
          }
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  };

  if (!project) {
    return (
      <div className="m-shell py-10 text-sm font-bold text-slate-500">
        Loading…
      </div>
    );
  }

  const health = projectHealth(project);
  const canRun = Boolean(ent.openroad?.run);

  const onRun = async () => {
    if (!health.readyForScripts) {
      setErr("Upload constraints.sdc on Project first");
      return;
    }
    if (ready && !canRun) {
      setErr("OpenROAD Run requires Max or Team");
      return;
    }
    setBusy(true);
    setResult(null);
    setErr("");
    stopPoll();

    const key =
      apiKey ||
      (typeof window !== "undefined"
        ? localStorage.getItem("ace_seek_api_key") || ""
        : "");

    try {
      const res = await fetch("/api/openroad/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify({ apiKey: key, project, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || `Run failed (${res.status})`);
        setBusy(false);
        return;
      }
      if (data.runner) setRunnerInfo(data.runner);
      const r = data.result as OpenroadJobResult;
      setResult(r);
      if (
        mode === "container" &&
        r.jobId &&
        (r.status === "running" ||
          r.status === "preparing" ||
          r.status === "queued")
      ) {
        startPoll(r.jobId);
      } else {
        setBusy(false);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Run failed");
      setBusy(false);
    }
  };

  const running =
    busy ||
    result?.status === "running" ||
    result?.status === "preparing" ||
    result?.status === "queued";

  return (
    <div className="m-shell py-8 space-y-6 font-mono">
      <div className="border-b-4 border-black pb-4 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">
            OpenROAD · Run · Max · synth → GDS
          </p>
          <h1 className="text-2xl font-black uppercase text-slate-900 flex items-center gap-2">
            <Play className="w-6 h-6" /> OpenLane job runner
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-1 max-w-2xl">
            <strong>container</strong> runs real OpenLane Docker: Yosys synth →
            floorplan → place → CTS → route → Magic GDS.{" "}
            <strong>dry_run</strong> is synthetic STA only. Jobs can take
            10–60+ minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border-2 border-black px-2 py-2 text-xs font-black"
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "dry_run" | "container")
            }
            disabled={running}
          >
            <option value="container">container (OpenLane → GDS)</option>
            <option value="dry_run">dry_run (synthetic)</option>
          </select>
          <button
            type="button"
            disabled={running || !health.readyForScripts}
            onClick={() => void onRun()}
            className="brutal-btn brutal-btn-yellow !text-sm font-black flex items-center gap-2 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {running ? "Running…" : "Queue job"}
          </button>
          {result?.jobId && mode === "container" && (
            <button
              type="button"
              className="brutal-btn bg-white !text-xs font-black flex items-center gap-1"
              onClick={() => startPoll(result.jobId)}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Poll
            </button>
          )}
        </div>
      </div>

      {runnerInfo && (
        <div className="brutal-panel p-3 border-3 border-black bg-slate-50 text-[10px] font-bold grid sm:grid-cols-2 gap-1">
          <p className="flex items-center gap-1 sm:col-span-2">
            <Cpu className="w-3.5 h-3.5" /> Runner diagnostics
          </p>
          {Object.entries(runnerInfo).map(([k, v]) => (
            <p key={k}>
              <span className="text-slate-500">{k}:</span> {String(v)}
            </p>
          ))}
        </div>
      )}

      {err && (
        <div className="brutal-panel p-3 border-3 border-black bg-rose-50 text-xs font-bold text-rose-800">
          {err}
        </div>
      )}

      {!health.readyForScripts && (
        <div className="brutal-panel p-4 border-3 border-black bg-amber-50 text-xs font-bold">
          Need constraints.sdc —{" "}
          <a href="/openroad/project" className="underline">
            open Project
          </a>
          . Optional but recommended: RTL (.v) for real synth.
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div
            className={`brutal-panel p-4 border-3 border-black text-xs font-bold ${
              result.status === "succeeded"
                ? "bg-emerald-50"
                : result.status === "failed" || result.status === "rejected"
                  ? "bg-rose-50"
                  : "bg-amber-50"
            }`}
          >
            <p className="font-black uppercase">
              {result.status} · {result.jobId} · {result.mode}
            </p>
            <p className="mt-1">{result.message}</p>
            {result.metrics && (
              <p className="mt-2 text-slate-700">
                WNS {result.metrics.wnsNs} ns · TNS {result.metrics.tnsNs} ns
              </p>
            )}
            {result.gdsFiles && result.gdsFiles.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="font-black text-emerald-800">GDS artifacts</p>
                {result.gdsFiles.map((g) => (
                  <a
                    key={g}
                    className="block underline text-emerald-900"
                    href={jobDownloadUrl(result.jobId, g)}
                  >
                    Download {g}
                  </a>
                ))}
              </div>
            )}
            {result.artifacts && result.artifacts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.artifacts.slice(0, 24).map((a) =>
                  a.content != null ? (
                    <button
                      key={a.name}
                      type="button"
                      className="brutal-btn bg-white !text-[10px] font-black"
                      onClick={() =>
                        downloadTextFile(a.name, a.content || "")
                      }
                    >
                      <Download className="w-3 h-3 inline" /> {a.name}
                    </button>
                  ) : (
                    <a
                      key={a.name}
                      className="brutal-btn bg-white !text-[10px] font-black inline-flex items-center gap-1"
                      href={jobDownloadUrl(result.jobId, a.name)}
                    >
                      <Download className="w-3 h-3" /> {a.name}
                      {a.size != null ? ` (${a.size}B)` : ""}
                    </a>
                  )
                )}
              </div>
            )}
            {result.log && (
              <button
                type="button"
                className="mt-3 brutal-btn bg-white !text-xs font-black inline-flex items-center gap-1"
                onClick={() =>
                  downloadTextFile(`${result.jobId}-run.log`, result.log)
                }
              >
                <Download className="w-3.5 h-3.5" /> Download log
              </button>
            )}
          </div>
          {result.log && (
            <pre className="brutal-panel p-4 border-3 border-black bg-slate-900 text-amber-100 text-[10px] overflow-auto max-h-96 whitespace-pre-wrap">
              {result.log}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
