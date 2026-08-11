"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Download,
  Copy,
  Check,
  Upload,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  FileText,
  Network,
  Layers,
  ArrowRight,
  Cpu,
  Shield,
  Sliders,
  Table2,
} from "lucide-react";
import {
  type UpfState,
  type PowerDomain,
  type IsolationStrategy,
  type PowerSwitch,
  type RetentionStrategy,
  type LevelShifterStrategy,
  type SupplyNet,
  type SupplyPort,
  type PstTable,
  DEFAULT_UPF_STATE,
  UPF_PRESETS,
  emptyUpfState,
  normalizeUpfState,
  generateUpf,
  parseUpf,
  lintUpfState,
  buildUpfDiagram,
  newId,
  padTopPracticeState,
} from "@/lib/upf-engine";
import {
  clearHubTransfer,
  loadHubTransfer,
} from "@/lib/report-hub-engine";

type TabId = "configure" | "strategies" | "states" | "diagram" | "script" | "lint";

const inputCls =
  "w-full bg-white text-slate-900 font-mono text-xs font-bold border-2 border-black rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400";
const labelCls = "text-[9px] font-black uppercase text-slate-600 block mb-0.5";

export default function PowerStudioPage() {
  const [state, setState] = useState<UpfState>(() =>
    normalizeUpfState(structuredClone(DEFAULT_UPF_STATE))
  );
  const [activeTab, setActiveTab] = useState<TabId>("configure");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const setUpf = (next: UpfState | ((p: UpfState) => UpfState)) => {
    setState((prev) =>
      normalizeUpfState(typeof next === "function" ? next(prev) : next)
    );
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qTab = params.get("tab");
    const fromHub = params.get("from_hub") === "true";
    const map: Record<string, TabId> = {
      configure: "configure",
      strategies: "strategies",
      states: "states",
      diagram: "diagram",
      script: "script",
      lint: "lint",
      genus: "script",
    };
    if (qTab && map[qTab]) setActiveTab(map[qTab]);

    if (fromHub) {
      const transfer = loadHubTransfer();
      if (transfer?.text) {
        try {
          const parsed = parseUpf(transfer.text);
          if (parsed.domains.length || parsed.supplyNets.length) {
            setUpf(parsed);
            flash(`Loaded from Report Hub: ${transfer.filename || "upf"}`);
            setActiveTab("configure");
          }
        } catch {
          /* ignore */
        }
        clearHubTransfer();
        const url = new URL(window.location.href);
        url.searchParams.delete("from_hub");
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== activeTab) {
      url.searchParams.set("tab", activeTab);
      window.history.replaceState(null, "", url.toString());
    }
  }, [activeTab]);

  const upfText = useMemo(() => generateUpf(state), [state]);
  const lint = useMemo(() => lintUpfState(state), [state]);
  const diagram = useMemo(() => buildUpfDiagram(state), [state]);
  const errN = lint.filter((m) => m.severity === "error").length;
  const warnN = lint.filter((m) => m.severity === "warning").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upfText);
      setCopied(true);
      flash("Copied UPF to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      flash("Copy failed");
    }
  };

  const handleDownload = () => {
    const filename = `${state.designName || "design"}.upf`;
    const blob = new Blob([upfText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    flash(`Downloaded ${filename}`);
  };

  const handleImport = (text: string) => {
    try {
      const parsed = parseUpf(text);
      if (!parsed.domains.length && !parsed.supplyNets.length) {
        flash("Could not parse UPF objects from file");
        return;
      }
      setUpf(parsed);
      flash(
        `Imported ${parsed.supplyNets.length} nets · ${parsed.domains.length} domains · ${parsed.switches.length} switches · ${parsed.isolations.length} ISO`
      );
      setActiveTab("configure");
    } catch {
      flash("Import failed — check UPF syntax");
    }
  };

  const loadPreset = (presetState: UpfState, name: string) => {
    setUpf(structuredClone(presetState));
    flash(`Loaded preset: ${name}`);
    setActiveTab("configure");
  };

  // --- generic patch helpers ---
  const patchList = <T extends { id: string }>(
    key: keyof UpfState,
    id: string,
    patch: Partial<T>
  ) => {
    setUpf((prev) => ({
      ...prev,
      [key]: ((prev[key] as unknown as T[]) || []).map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const removeFromList = (key: keyof UpfState, id: string) => {
    setUpf((prev) => ({
      ...prev,
      [key]: ((prev[key] as { id: string }[]) || []).filter((x) => x.id !== id),
    }));
  };

  const netOptions = state.supplyNets.map((n) => n.name);
  const domainOptions = state.domains.map((d) => d.name);

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900 flex flex-col font-sans">
      {toast && (
        <div className="fixed top-4 right-4 z-50 neu-panel px-4 py-2 bg-black text-white text-xs font-black shadow-xl">
          {toast}
        </div>
      )}

      <header className="neu-panel bg-white border-b-2 border-black p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 neu-panel bg-rose-600 text-white flex items-center justify-center font-black rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              Power Studio
              <span className="neu-badge bg-rose-100 text-rose-900 border-rose-600 text-[9px]">
                Configure → Generate
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-600">
              Build multi-vendor{" "}
              <code className="bg-slate-100 px-1 rounded">IEEE 1801 UPF</code> from
              user inputs — domains, switches, isolation, retention, PST
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="neu-inset px-2 py-1 flex items-center gap-2 text-xs font-bold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <select
              className="bg-white text-slate-900 outline-none cursor-pointer font-bold rounded px-1 border border-slate-300"
              defaultValue=""
              onChange={(e) => {
                const p = UPF_PRESETS.find((pr) => pr.name === e.target.value);
                if (p) loadPreset(p.state, p.name);
              }}
            >
              <option value="" disabled>
                Load preset…
              </option>
              {UPF_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setUpf(padTopPracticeState());
              flash("Starter: always-on + switched core");
              setActiveTab("configure");
            }}
            className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
          >
            New starter
          </button>
          <button
            type="button"
            onClick={() => {
              setUpf(emptyUpfState("top"));
              flash("Cleared all — add nets, domains, strategies, PST");
              setActiveTab("configure");
            }}
            className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
          >
            Clear all
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".upf,.tcl,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => handleImport(String(r.result || ""));
              r.readAsText(f);
            }}
          />
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="neu-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 bg-white text-slate-900"
          >
            <Upload className="w-3.5 h-3.5" />
            Import UPF
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="neu-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 bg-white text-slate-900"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            Copy UPF
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="neu-btn neu-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download .upf
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-5 max-w-7xl w-full mx-auto space-y-4">
        <div className="neu-panel bg-white p-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-800">
          <span className="text-rose-700 uppercase">Workflow</span>
          <span>1. Configure supplies · domains · switches</span>
          <span>→</span>
          <span>2. Strategies (ISO / retention / LS) · PST</span>
          <span>→</span>
          <span>3. Download generated UPF</span>
          <span className="ml-auto text-slate-500 font-bold">
            {state.supplyNets.length} nets · {state.domains.length} domains ·{" "}
            {state.switches.length} SW · {state.isolations.length} ISO ·{" "}
            {state.retentions.length} RET · {state.levelShifters.length} LS ·{" "}
            {state.pst.reduce((a, t) => a + t.states.length, 0)} modes
          </span>
        </div>

        <div className="neu-panel bg-white p-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["configure", "1. Configure inputs", Sliders],
                ["strategies", "2. Strategies", Shield],
                ["states", `PST (${state.pst[0]?.states.length || 0})`, Table2],
                ["diagram", "Domain map", Network],
                ["script", "3. Generated UPF", FileText],
                ["lint", `Lint (${errN + warnN})`, AlertTriangle],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`neu-btn px-3 py-1.5 text-xs font-black flex items-center gap-2 ${
                  activeTab === id
                    ? "bg-rose-600 text-white"
                    : "bg-white text-slate-800 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vlsi/sdc-studio"
              className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-purple-50 text-purple-900"
            >
              <ArrowRight className="w-3 h-3" /> SDC Studio
            </Link>
            <Link
              href="/vlsi/mmmc-studio"
              className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-indigo-50 text-indigo-900"
            >
              <ArrowRight className="w-3 h-3" /> MMMC Studio
            </Link>
            <Link
              href="/vlsi/timing-studio"
              className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-emerald-50 text-emerald-900"
            >
              <ArrowRight className="w-3 h-3" /> Timing Studio
            </Link>
          </div>
        </div>

        {/* ========== CONFIGURE ========== */}
        {activeTab === "configure" && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-600">
              Enter <b>your</b> design name, supplies, domains, and switches. UPF is rebuilt live
              from this state (same pattern as MMMC Studio).
            </p>

            {/* Design */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-rose-600" />
                Design{" "}
                <span className="text-slate-400 font-bold">upf_version</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Top / design name</label>
                  <input
                    className={inputCls}
                    value={state.designName}
                    onChange={(e) =>
                      setUpf((p) => ({ ...p, designName: e.target.value }))
                    }
                    placeholder="pad_top"
                  />
                </div>
                <div>
                  <label className={labelCls}>upf_version</label>
                  <select
                    className={inputCls}
                    value={state.version}
                    onChange={(e) =>
                      setUpf((p) => ({
                        ...p,
                        version: e.target.value as UpfState["version"],
                      }))
                    }
                  >
                    <option value="2.0">2.0</option>
                    <option value="2.1">2.1</option>
                    <option value="3.0">3.0</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Notes (header comment)</label>
                  <input
                    className={inputCls}
                    value={state.notes || ""}
                    onChange={(e) =>
                      setUpf((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* Supply nets */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Supply nets{" "}
                  <span className="text-slate-400 font-bold">create_supply_net</span>
                </h3>
                <button
                  type="button"
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-amber-500 text-black"
                  onClick={() =>
                    setUpf((p) => ({
                      ...p,
                      supplyNets: [
                        ...p.supplyNets,
                        {
                          id: newId("n"),
                          name: `VDD_${p.supplyNets.length + 1}`,
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="w-3 h-3" /> Add net
                </button>
              </div>
              {state.supplyNets.length === 0 && (
                <p className="text-[10px] font-bold text-rose-600">
                  Add at least VDD / VSS (and any switched rails).
                </p>
              )}
              <div className="space-y-2">
                {state.supplyNets.map((n) => (
                  <div
                    key={n.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-5">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={n.name}
                        onChange={(e) =>
                          patchList<SupplyNet>("supplyNets", n.id, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-5 flex items-end pb-1">
                      <label className="text-[10px] font-black flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-amber-500"
                          checked={!!n.switchable}
                          onChange={(e) =>
                            patchList<SupplyNet>("supplyNets", n.id, {
                              switchable: e.target.checked,
                            })
                          }
                        />
                        Switchable rail (can be OFF in PST)
                      </label>
                    </div>
                    <div className="md:col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        className="neu-btn p-2 text-rose-600"
                        onClick={() => removeFromList("supplyNets", n.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Supply ports + connections */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Supply ports & connects{" "}
                  <span className="text-slate-400 font-bold">
                    create_supply_port · connect_supply_net
                  </span>
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="neu-btn px-2.5 py-1 text-[10px] font-black bg-emerald-600 text-white"
                    onClick={() =>
                      setUpf((p) => ({
                        ...p,
                        supplyPorts: [
                          ...p.supplyPorts,
                          { id: newId("p"), name: "VDD" },
                        ],
                      }))
                    }
                  >
                    <Plus className="w-3 h-3 inline" /> Port
                  </button>
                  <button
                    type="button"
                    className="neu-btn px-2.5 py-1 text-[10px] font-black bg-white text-slate-900"
                    onClick={() =>
                      setUpf((p) => ({
                        ...p,
                        connections: p.supplyPorts.map((port) => ({
                          id: newId("c"),
                          netName: port.name,
                          portNames: [port.name],
                        })),
                      }))
                    }
                  >
                    Auto-bind by name
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {state.supplyPorts.map((sp) => (
                  <div
                    key={sp.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-4">
                      <label className={labelCls}>Port name</label>
                      <input
                        className={inputCls}
                        value={sp.name}
                        onChange={(e) =>
                          patchList<SupplyPort>("supplyPorts", sp.id, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className={labelCls}>Connected net</label>
                      <select
                        className={inputCls}
                        value={
                          state.connections.find((c) =>
                            c.portNames.includes(sp.name)
                          )?.netName || ""
                        }
                        onChange={(e) => {
                          const netName = e.target.value;
                          setUpf((p) => {
                            let connections = p.connections.filter(
                              (c) => !c.portNames.includes(sp.name)
                            );
                            if (netName) {
                              const existing = connections.find(
                                (c) => c.netName === netName
                              );
                              if (existing) {
                                connections = connections.map((c) =>
                                  c.netName === netName
                                    ? {
                                        ...c,
                                        portNames: [
                                          ...new Set([...c.portNames, sp.name]),
                                        ],
                                      }
                                    : c
                                );
                              } else {
                                connections = [
                                  ...connections,
                                  {
                                    id: newId("c"),
                                    netName,
                                    portNames: [sp.name],
                                  },
                                ];
                              }
                            }
                            return { ...p, connections };
                          });
                        }}
                      >
                        <option value="">— none —</option>
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        className="neu-btn p-2 text-rose-600"
                        onClick={() => {
                          setUpf((p) => ({
                            ...p,
                            supplyPorts: p.supplyPorts.filter(
                              (x) => x.id !== sp.id
                            ),
                            connections: p.connections
                              .map((c) => ({
                                ...c,
                                portNames: c.portNames.filter(
                                  (x) => x !== sp.name
                                ),
                              }))
                              .filter((c) => c.portNames.length > 0),
                          }));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Domains */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Power domains{" "}
                  <span className="text-slate-400 font-bold">
                    create_power_domain · set_domain_supply_net
                  </span>
                </h3>
                <button
                  type="button"
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-indigo-600 text-white"
                  onClick={() =>
                    setUpf((p) => ({
                      ...p,
                      domains: [
                        ...p.domains,
                        {
                          id: newId("d"),
                          name: `PD_${p.domains.length + 1}`,
                          elements: [],
                          primaryPowerNet: p.supplyNets[0]?.name || "VDD",
                          primaryGroundNet:
                            p.supplyNets.find((n) => /vss|gnd/i.test(n.name))
                              ?.name || "VSS",
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="w-3 h-3" /> Add domain
                </button>
              </div>
              <div className="space-y-2">
                {state.domains.map((d) => (
                  <div
                    key={d.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={d.name}
                        onChange={(e) =>
                          patchList<PowerDomain>("domains", d.id, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Power net</label>
                      <select
                        className={inputCls}
                        value={d.primaryPowerNet || ""}
                        onChange={(e) =>
                          patchList<PowerDomain>("domains", d.id, {
                            primaryPowerNet: e.target.value,
                          })
                        }
                      >
                        <option value="">—</option>
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Ground net</label>
                      <select
                        className={inputCls}
                        value={d.primaryGroundNet || ""}
                        onChange={(e) =>
                          patchList<PowerDomain>("domains", d.id, {
                            primaryGroundNet: e.target.value,
                          })
                        }
                      >
                        <option value="">—</option>
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>
                        Elements (space-separated)
                      </label>
                      <input
                        className={inputCls}
                        value={d.elements.join(" ")}
                        disabled={!!d.includeScope}
                        onChange={(e) =>
                          patchList<PowerDomain>("domains", d.id, {
                            elements: e.target.value
                              .split(/\s+/)
                              .map((x) => x.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="u_core"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end pb-1">
                      <label className="text-[10px] font-black flex items-center gap-1">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-indigo-600"
                          checked={!!d.includeScope}
                          onChange={(e) =>
                            patchList<PowerDomain>("domains", d.id, {
                              includeScope: e.target.checked,
                              alwaysOn: e.target.checked,
                            })
                          }
                        />
                        -include_scope (AO)
                      </label>
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        className="neu-btn p-2 text-rose-600"
                        onClick={() => removeFromList("domains", d.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Switches */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-600" />
                  Power switches{" "}
                  <span className="text-slate-400 font-bold">
                    create_power_switch
                  </span>
                </h3>
                <button
                  type="button"
                  disabled={!state.domains.length}
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-amber-500 text-black disabled:opacity-40"
                  onClick={() =>
                    setUpf((p) => ({
                      ...p,
                      switches: [
                        ...p.switches,
                        {
                          id: newId("sw"),
                          name: `sw_${p.switches.length + 1}`,
                          domainName:
                            p.domains.find((d) => !d.includeScope)?.name ||
                            p.domains[0]?.name ||
                            "PD_SW",
                          inputSupplyPort: {
                            port: "vin",
                            net: p.supplyNets[0]?.name || "VDD",
                          },
                          outputSupplyPort: {
                            port: "vout",
                            net:
                              p.supplyNets.find((n) => n.switchable)?.name ||
                              "VDD_SW",
                          },
                          controlPort: { port: "c", net: "sw_ctrl" },
                          onState: {
                            name: "on",
                            input: "vin",
                            controlExpr: "c",
                          },
                          offState: { name: "off", controlExpr: "!c" },
                        },
                      ],
                      logicPorts: p.logicPorts.some((l) => l.name === "sw_ctrl")
                        ? p.logicPorts
                        : [
                            ...p.logicPorts,
                            {
                              id: newId("lp"),
                              name: "sw_ctrl",
                              direction: "in" as const,
                            },
                          ],
                      logicNets: p.logicNets.some((l) => l.name === "sw_ctrl")
                        ? p.logicNets
                        : [
                            ...p.logicNets,
                            {
                              id: newId("ln"),
                              name: "sw_ctrl",
                              portNames: ["sw_ctrl"],
                            },
                          ],
                    }))
                  }
                >
                  <Plus className="w-3 h-3" /> Add switch
                </button>
              </div>
              <div className="space-y-2">
                {state.switches.map((sw) => (
                  <div
                    key={sw.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={sw.name}
                        onChange={(e) =>
                          patchList<PowerSwitch>("switches", sw.id, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Domain</label>
                      <select
                        className={inputCls}
                        value={sw.domainName}
                        onChange={(e) =>
                          patchList<PowerSwitch>("switches", sw.id, {
                            domainName: e.target.value,
                          })
                        }
                      >
                        {domainOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Input net</label>
                      <select
                        className={inputCls}
                        value={sw.inputSupplyPort.net}
                        onChange={(e) =>
                          patchList<PowerSwitch>("switches", sw.id, {
                            inputSupplyPort: {
                              ...sw.inputSupplyPort,
                              net: e.target.value,
                            },
                          })
                        }
                      >
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Output net</label>
                      <select
                        className={inputCls}
                        value={sw.outputSupplyPort.net}
                        onChange={(e) =>
                          patchList<PowerSwitch>("switches", sw.id, {
                            outputSupplyPort: {
                              ...sw.outputSupplyPort,
                              net: e.target.value,
                            },
                          })
                        }
                      >
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>Control net</label>
                      <input
                        className={inputCls}
                        value={sw.controlPort.net}
                        onChange={(e) =>
                          patchList<PowerSwitch>("switches", sw.id, {
                            controlPort: {
                              ...sw.controlPort,
                              net: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        className="neu-btn p-2 text-rose-600"
                        onClick={() => removeFromList("switches", sw.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab("strategies")}
                className="neu-btn neu-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2"
              >
                Next: Strategies <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========== STRATEGIES ========== */}
        {activeTab === "strategies" && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-600">
              Isolation, retention (SRPG), and level shifters for domain crossings.
            </p>

            {/* Isolation */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-rose-600" />
                  Isolation{" "}
                  <span className="text-slate-400 font-bold">
                    set_isolation · set_isolation_control
                  </span>
                </h3>
                <button
                  type="button"
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-rose-600 text-white"
                  onClick={() =>
                    setUpf((p) => ({
                      ...p,
                      isolations: [
                        ...p.isolations,
                        {
                          id: newId("iso"),
                          name: `iso_${p.isolations.length + 1}`,
                          domainName:
                            p.domains.find((d) => !d.includeScope)?.name ||
                            p.domains[0]?.name ||
                            "",
                          appliesTo: "outputs",
                          clampValue: "0",
                          isolationPowerNet:
                            p.supplyNets.find((n) => !n.switchable)?.name ||
                            "VDD",
                          isolationGroundNet:
                            p.supplyNets.find((n) => /vss/i.test(n.name))
                              ?.name || "VSS",
                          isolationSignal: p.switches[0]?.controlPort.net,
                          isolationSense: "low",
                          location: "self",
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="w-3 h-3" /> Add isolation
                </button>
              </div>
              <div className="space-y-2">
                {state.isolations.map((iso) => (
                  <div
                    key={iso.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-rose-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={iso.name}
                        onChange={(e) =>
                          patchList<IsolationStrategy>("isolations", iso.id, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Domain</label>
                      <select
                        className={inputCls}
                        value={iso.domainName}
                        onChange={(e) =>
                          patchList<IsolationStrategy>("isolations", iso.id, {
                            domainName: e.target.value,
                          })
                        }
                      >
                        {domainOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Applies</label>
                      <select
                        className={inputCls}
                        value={iso.appliesTo}
                        onChange={(e) =>
                          patchList<IsolationStrategy>("isolations", iso.id, {
                            appliesTo: e.target
                              .value as IsolationStrategy["appliesTo"],
                          })
                        }
                      >
                        <option value="outputs">outputs</option>
                        <option value="inputs">inputs</option>
                        <option value="both">both</option>
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <label className={labelCls}>Clamp</label>
                      <select
                        className={inputCls}
                        value={iso.clampValue}
                        onChange={(e) =>
                          patchList<IsolationStrategy>("isolations", iso.id, {
                            clampValue: e.target
                              .value as IsolationStrategy["clampValue"],
                          })
                        }
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="latch">latch</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>ISO signal</label>
                      <input
                        className={inputCls}
                        value={iso.isolationSignal || ""}
                        onChange={(e) =>
                          patchList<IsolationStrategy>("isolations", iso.id, {
                            isolationSignal: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Sense</label>
                      <select
                        className={inputCls}
                        value={iso.isolationSense || "low"}
                        onChange={(e) =>
                          patchList<IsolationStrategy>("isolations", iso.id, {
                            isolationSense: e.target
                              .value as IsolationStrategy["isolationSense"],
                          })
                        }
                      >
                        <option value="low">low</option>
                        <option value="high">high</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        className="neu-btn p-2 text-rose-600"
                        onClick={() => removeFromList("isolations", iso.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Retention */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-600" />
                  Retention{" "}
                  <span className="text-slate-400 font-bold">set_retention</span>
                </h3>
                <button
                  type="button"
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-sky-600 text-white"
                  onClick={() =>
                    setUpf((p) => ({
                      ...p,
                      retentions: [
                        ...p.retentions,
                        {
                          id: newId("ret"),
                          name: `ret_${p.retentions.length + 1}`,
                          domainName:
                            p.domains.find((d) => !d.includeScope)?.name ||
                            p.domains[0]?.name ||
                            "",
                          saveSignal: "save",
                          restoreSignal: "restore",
                          retentionPowerNet: "VDD",
                          retentionGroundNet: "VSS",
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="w-3 h-3" /> Add retention
                </button>
              </div>
              <div className="space-y-2">
                {state.retentions.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-sky-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={r.name}
                        onChange={(e) =>
                          patchList<RetentionStrategy>("retentions", r.id, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Domain</label>
                      <select
                        className={inputCls}
                        value={r.domainName}
                        onChange={(e) =>
                          patchList<RetentionStrategy>("retentions", r.id, {
                            domainName: e.target.value,
                          })
                        }
                      >
                        {domainOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Save</label>
                      <input
                        className={inputCls}
                        value={r.saveSignal || ""}
                        onChange={(e) =>
                          patchList<RetentionStrategy>("retentions", r.id, {
                            saveSignal: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Restore</label>
                      <input
                        className={inputCls}
                        value={r.restoreSignal || ""}
                        onChange={(e) =>
                          patchList<RetentionStrategy>("retentions", r.id, {
                            restoreSignal: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Ret power</label>
                      <select
                        className={inputCls}
                        value={r.retentionPowerNet || ""}
                        onChange={(e) =>
                          patchList<RetentionStrategy>("retentions", r.id, {
                            retentionPowerNet: e.target.value,
                          })
                        }
                      >
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <label className={labelCls}>Gnd</label>
                      <select
                        className={inputCls}
                        value={r.retentionGroundNet || ""}
                        onChange={(e) =>
                          patchList<RetentionStrategy>("retentions", r.id, {
                            retentionGroundNet: e.target.value,
                          })
                        }
                      >
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        className="neu-btn p-2 text-rose-600"
                        onClick={() => removeFromList("retentions", r.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {state.retentions.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-500">
                    Optional — add when flops must keep state while domain is OFF (SRPG).
                  </p>
                )}
              </div>
            </section>

            {/* Level shifters */}
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-600" />
                  Level shifters{" "}
                  <span className="text-slate-400 font-bold">
                    set_level_shifter
                  </span>
                </h3>
                <button
                  type="button"
                  className="neu-btn px-2.5 py-1 text-[10px] font-black flex items-center gap-1 bg-violet-600 text-white"
                  onClick={() =>
                    setUpf((p) => ({
                      ...p,
                      levelShifters: [
                        ...p.levelShifters,
                        {
                          id: newId("ls"),
                          name: `ls_${p.levelShifters.length + 1}`,
                          domainName: p.domains[0]?.name || "",
                          appliesTo: "both",
                          rule: "both",
                          location: "self",
                          inputSupplyNet: p.supplyNets[0]?.name,
                          outputSupplyNet: p.supplyNets[1]?.name,
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="w-3 h-3" /> Add LS
                </button>
              </div>
              <div className="space-y-2">
                {state.levelShifters.map((ls) => (
                  <div
                    key={ls.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-violet-50 border-2 border-black rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={ls.name}
                        onChange={(e) =>
                          patchList<LevelShifterStrategy>(
                            "levelShifters",
                            ls.id,
                            { name: e.target.value }
                          )
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Domain</label>
                      <select
                        className={inputCls}
                        value={ls.domainName}
                        onChange={(e) =>
                          patchList<LevelShifterStrategy>(
                            "levelShifters",
                            ls.id,
                            { domainName: e.target.value }
                          )
                        }
                      >
                        {domainOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Rule</label>
                      <select
                        className={inputCls}
                        value={ls.rule || "both"}
                        onChange={(e) =>
                          patchList<LevelShifterStrategy>(
                            "levelShifters",
                            ls.id,
                            {
                              rule: e.target
                                .value as LevelShifterStrategy["rule"],
                            }
                          )
                        }
                      >
                        <option value="low_to_high">low_to_high</option>
                        <option value="high_to_low">high_to_low</option>
                        <option value="both">both</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Input supply</label>
                      <select
                        className={inputCls}
                        value={ls.inputSupplyNet || ""}
                        onChange={(e) =>
                          patchList<LevelShifterStrategy>(
                            "levelShifters",
                            ls.id,
                            { inputSupplyNet: e.target.value }
                          )
                        }
                      >
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>Output supply</label>
                      <select
                        className={inputCls}
                        value={ls.outputSupplyNet || ""}
                        onChange={(e) =>
                          patchList<LevelShifterStrategy>(
                            "levelShifters",
                            ls.id,
                            { outputSupplyNet: e.target.value }
                          )
                        }
                      >
                        {netOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        className="neu-btn p-2 text-rose-600"
                        onClick={() => removeFromList("levelShifters", ls.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {state.levelShifters.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-500">
                    Optional — only for multi-voltage crossings (same voltage → skip).
                  </p>
                )}
              </div>
            </section>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("configure")}
                className="neu-btn px-3 py-2 text-xs font-black bg-white text-slate-900"
              >
                ← Edit inputs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("states")}
                className="neu-btn neu-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2"
              >
                Next: PST states <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========== PST ========== */}
        {activeTab === "states" && (
          <div className="space-y-4">
            <section className="neu-panel bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Table2 className="w-4 h-4 text-indigo-600" />
                  Power state table{" "}
                  <span className="text-slate-400 font-bold">
                    create_pst · add_pst_state · add_port_state
                  </span>
                </h3>
                <button
                  type="button"
                  className="neu-btn px-2.5 py-1 text-[10px] font-black bg-indigo-600 text-white"
                  onClick={() =>
                    setUpf((p) => {
                      const supplies = p.supplyNets.map((n) => n.name);
                      return {
                        ...p,
                        portStates: p.supplyNets.map((n) => ({
                          id: newId("ps"),
                          supplyName: n.name,
                          states: n.switchable
                            ? [
                                { name: "ON", nom: 0.72 },
                                { name: "OFF", nom: "off" as const },
                              ]
                            : [
                                {
                                  name: "ON",
                                  nom: /vss|gnd/i.test(n.name) ? 0 : 0.72,
                                },
                              ],
                        })),
                        pst: [
                          {
                            id: newId("pst"),
                            name: "pst0",
                            supplies,
                            states: [
                              {
                                name: "RUN",
                                values: supplies.map(() => "ON"),
                              },
                              {
                                name: "SLEEP",
                                values: p.supplyNets.map((n) =>
                                  n.switchable ? "OFF" : "ON"
                                ),
                              },
                            ],
                          },
                        ],
                      };
                    })
                  }
                >
                  Rebuild RUN/SLEEP from nets
                </button>
              </div>

              {state.pst.length === 0 ? (
                <p className="text-[10px] font-bold text-amber-800 bg-amber-50 border-2 border-amber-500 p-3 rounded-lg">
                  No PST yet — click Rebuild RUN/SLEEP, or import a UPF that defines
                  create_pst.
                </p>
              ) : (
                state.pst.map((t) => (
                  <div key={t.id} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-4">
                        <label className={labelCls}>PST name</label>
                        <input
                          className={inputCls}
                          value={t.name}
                          onChange={(e) =>
                            patchList<PstTable>("pst", t.id, {
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-7">
                        <label className={labelCls}>
                          Supplies order (space-separated)
                        </label>
                        <input
                          className={inputCls}
                          value={t.supplies.join(" ")}
                          onChange={(e) =>
                            patchList<PstTable>("pst", t.id, {
                              supplies: e.target.value
                                .split(/\s+/)
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-end">
                        <button
                          type="button"
                          className="neu-btn p-2 text-rose-600"
                          onClick={() => removeFromList("pst", t.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse border-2 border-black">
                        <thead className="bg-slate-900 text-white font-black">
                          <tr>
                            <th className="p-2 border border-slate-600 text-left">
                              Mode
                            </th>
                            {t.supplies.map((s) => (
                              <th
                                key={s}
                                className="p-2 border border-slate-600 text-center"
                              >
                                {s}
                              </th>
                            ))}
                            <th className="p-2 border border-slate-600" />
                          </tr>
                        </thead>
                        <tbody>
                          {t.states.map((st, si) => (
                            <tr
                              key={`${st.name}_${si}`}
                              className={
                                si % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }
                            >
                              <td className="p-1.5 border border-slate-200">
                                <input
                                  className={inputCls}
                                  value={st.name}
                                  onChange={(e) => {
                                    const name = e.target.value;
                                    setUpf((p) => ({
                                      ...p,
                                      pst: p.pst.map((pt) =>
                                        pt.id !== t.id
                                          ? pt
                                          : {
                                              ...pt,
                                              states: pt.states.map((x, i) =>
                                                i === si
                                                  ? { ...x, name }
                                                  : x
                                              ),
                                            }
                                      ),
                                    }));
                                  }}
                                />
                              </td>
                              {t.supplies.map((_, vi) => (
                                <td
                                  key={vi}
                                  className="p-1.5 border border-slate-200"
                                >
                                  <select
                                    className={inputCls}
                                    value={st.values[vi] || "ON"}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setUpf((p) => ({
                                        ...p,
                                        pst: p.pst.map((pt) =>
                                          pt.id !== t.id
                                            ? pt
                                            : {
                                                ...pt,
                                                states: pt.states.map(
                                                  (x, i) => {
                                                    if (i !== si) return x;
                                                    const values = [
                                                      ...x.values,
                                                    ];
                                                    while (
                                                      values.length <
                                                      t.supplies.length
                                                    )
                                                      values.push("ON");
                                                    values[vi] = val;
                                                    return { ...x, values };
                                                  }
                                                ),
                                              }
                                        ),
                                      }));
                                    }}
                                  >
                                    <option value="ON">ON</option>
                                    <option value="OFF">OFF</option>
                                  </select>
                                </td>
                              ))}
                              <td className="p-1.5 border border-slate-200 text-center">
                                <button
                                  type="button"
                                  className="text-rose-600"
                                  onClick={() =>
                                    setUpf((p) => ({
                                      ...p,
                                      pst: p.pst.map((pt) =>
                                        pt.id !== t.id
                                          ? pt
                                          : {
                                              ...pt,
                                              states: pt.states.filter(
                                                (_, i) => i !== si
                                              ),
                                            }
                                      ),
                                    }))
                                  }
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      className="neu-btn px-2.5 py-1 text-[10px] font-black bg-indigo-600 text-white"
                      onClick={() =>
                        setUpf((p) => ({
                          ...p,
                          pst: p.pst.map((pt) =>
                            pt.id !== t.id
                              ? pt
                              : {
                                  ...pt,
                                  states: [
                                    ...pt.states,
                                    {
                                      name: `MODE_${pt.states.length + 1}`,
                                      values: pt.supplies.map(() => "ON"),
                                    },
                                  ],
                                }
                          ),
                        }))
                      }
                    >
                      <Plus className="w-3 h-3 inline" /> Add mode row
                    </button>
                  </div>
                ))
              )}
            </section>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("strategies")}
                className="neu-btn px-3 py-2 text-xs font-black bg-white text-slate-900"
              >
                ← Strategies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("script")}
                className="neu-btn neu-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2"
              >
                View / download UPF <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========== DIAGRAM ========== */}
        {activeTab === "diagram" && (
          <div className="neu-panel bg-white p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-rose-600" /> Domain map
            </h3>
            <p className="text-[10px] font-bold text-slate-600">
              Live view of supplies, domains, switches, and isolation from your
              configuration.
            </p>
            <svg
              viewBox="0 0 560 420"
              className="w-full max-h-[28rem] border-2 border-black bg-slate-50 rounded-xl"
            >
              {diagram.edges.map((e) => {
                const a = diagram.nodes.find((n) => n.id === e.from);
                const b = diagram.nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                const x1 = a.x + a.w;
                const y1 = a.y + a.h / 2;
                const x2 = b.x;
                const y2 = b.y + b.h / 2;
                return (
                  <g key={e.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#334155"
                      strokeWidth={2}
                      markerEnd="url(#arrow)"
                    />
                    {e.label && (
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 4}
                        fontSize={9}
                        fontWeight={700}
                        fill="#64748b"
                      >
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
                </marker>
              </defs>
              {diagram.nodes.map((n) => (
                <g key={n.id}>
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    fill={n.fill}
                    stroke="#000"
                    strokeWidth={2}
                    rx={6}
                  />
                  <text
                    x={n.x + n.w / 2}
                    y={n.y + n.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontWeight={800}
                    fill="#0f172a"
                  >
                    {n.label.split("\n").map((line, i) => (
                      <tspan key={i} x={n.x + n.w / 2} dy={i === 0 ? 0 : 12}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {/* ========== SCRIPT ========== */}
        {activeTab === "script" && (
          <div className="neu-panel bg-white p-4 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                Generated file ({state.designName || "design"}.upf)
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="neu-btn px-3 py-1.5 text-xs font-black bg-white text-slate-900"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="neu-btn neu-btn-primary px-3 py-1.5 text-xs font-black"
                >
                  Download
                </button>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-600">
              IEEE 1801 UPF generated from your configuration. Tool-agnostic —
              load with your flow&apos;s power-intent command (Genus / Innovus /
              Synopsys / etc.).
            </p>
            <textarea
              readOnly
              value={upfText}
              className="w-full h-[28rem] p-4 font-mono text-xs bg-slate-900 text-emerald-100 rounded-xl border-2 border-black focus:outline-none"
            />
            <div className="space-y-1">
              <label className={labelCls}>
                Or paste existing UPF to import / edit
              </label>
              <textarea
                id="upf-import-paste"
                className={`${inputCls} h-28 resize-y`}
                placeholder="Paste create_power_domain / set_isolation / create_pst …"
              />
              <button
                type="button"
                className="neu-btn px-3 py-1.5 text-[10px] font-black bg-white text-slate-900"
                onClick={() => {
                  const el = document.getElementById(
                    "upf-import-paste"
                  ) as HTMLTextAreaElement | null;
                  if (el?.value) handleImport(el.value);
                }}
              >
                Import paste into configurator
              </button>
            </div>
          </div>
        )}

        {/* ========== LINT ========== */}
        {activeTab === "lint" && (
          <div className="neu-panel bg-white p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Configuration
              lint
            </h3>
            {lint.length === 0 ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-black text-xs rounded-lg flex items-center gap-2">
                <Check className="w-5 h-5" /> Configuration looks consistent for
                generation.
              </div>
            ) : (
              <div className="space-y-2">
                {lint.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border-2 text-xs font-bold space-y-1 ${
                      m.severity === "error"
                        ? "bg-rose-50 border-rose-600 text-rose-950"
                        : m.severity === "warning"
                          ? "bg-amber-50 border-amber-600 text-amber-950"
                          : "bg-sky-50 border-sky-600 text-sky-950"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      {m.severity === "error" ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : m.severity === "warning" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                      {m.message}
                    </div>
                    <p className="text-[11px] font-normal pl-6 text-slate-800">
                      <b>Fix:</b> {m.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
