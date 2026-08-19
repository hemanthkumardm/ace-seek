"use client";

/**
 * Interactive die-side IO planner — assign RTL ports to N/S/E/W.
 */

import React, { useMemo } from "react";
import {
  ArrowDown,
  ArrowUp,
  MapPin,
  RefreshCw,
  Wand2,
  X,
} from "lucide-react";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import {
  type PinSide,
  type RtlPort,
  type IoPlanAssignment,
  PIN_SIDES,
  SIDE_LABEL,
  parsePortsFromProject,
  parseIoPlanJson,
  reconcilePlan,
  autoPlacePorts,
  assignPin,
  removePin,
  movePinInSide,
  unplacedPins,
  planSummary,
  planIsComplete,
  allPins,
  serializeIoPlan,
} from "@/lib/openroad-io-plan";

const DIR_COLOR: Record<string, string> = {
  input: "text-sky-700 bg-sky-50 border-sky-200",
  output: "text-emerald-700 bg-emerald-50 border-emerald-200",
  inout: "text-amber-700 bg-amber-50 border-amber-200",
};

function pinDir(ports: RtlPort[], pin: string): string {
  for (const p of ports) {
    if (p.pins.includes(pin) || p.name === pin) return p.direction;
  }
  return "inout";
}

export interface OpenroadIoPlannerProps {
  project: OpenroadProjectState;
  /** Raw IO_PLAN_JSON from stageInputs */
  planJson: string;
  onChange: (planJson: string) => void;
}

export function OpenroadIoPlanner({
  project,
  planJson,
  onChange,
}: OpenroadIoPlannerProps) {
  const ports = useMemo(() => parsePortsFromProject(project), [project]);
  const plan: IoPlanAssignment = useMemo(() => {
    const saved = parseIoPlanJson(planJson);
    const r = reconcilePlan(ports, saved);
    r.topModule = project.topModule || "top";
    return r;
  }, [ports, planJson, project.topModule]);

  const free = unplacedPins(ports, plan.order);
  const complete = planIsComplete(plan);
  const total = allPins(ports).length;

  const commit = (next: IoPlanAssignment) => {
    onChange(
      serializeIoPlan({
        ...next,
        topModule: project.topModule || "top",
        ports,
        updatedAt: new Date().toISOString(),
      })
    );
  };

  const setOrder = (order: IoPlanAssignment["order"]) => {
    commit({ ...plan, order, ports });
  };

  const onAuto = () => {
    setOrder(autoPlacePorts(ports));
  };

  const onClear = () => {
    setOrder({ N: [], E: [], S: [], W: [] });
  };

  const onRefreshPorts = () => {
    // Re-parse from RTL; keep placements that still exist
    const fresh = parsePortsFromProject(project);
    const r = reconcilePlan(fresh, plan);
    commit(r);
  };

  const placeAllOn = (side: PinSide) => {
    let order = { ...plan.order };
    for (const pin of free) {
      order = assignPin(order, pin, side);
    }
    setOrder(order);
  };

  return (
    <div className="neu-panel p-4 space-y-3 h-full overflow-auto">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
            IO Planner · before floorplan
          </p>
          <h2 className="text-lg font-black uppercase flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            Port sides
          </h2>
          <p className="text-[11px] font-bold text-[var(--neu-text-muted)] mt-1 max-w-xl">
            Ports from design top{" "}
            <code className="text-sky-700">{project.topModule || "top"}</code>
            . Click a side to place selected unplaced pins, or use Auto-place.
            Order on each side becomes OpenLane{" "}
            <code className="text-sky-700">pin_order.cfg</code> (
            <code className="text-sky-700">FP_PIN_ORDER_CFG</code>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="neu-btn !text-[10px] font-black inline-flex items-center gap-1"
            onClick={onRefreshPorts}
            title="Re-read ports from Design RTL"
          >
            <RefreshCw className="w-3 h-3" /> Refresh ports
          </button>
          <button
            type="button"
            className="neu-btn neu-btn-primary !text-[10px] font-black inline-flex items-center gap-1"
            onClick={onAuto}
          >
            <Wand2 className="w-3 h-3" /> Auto-place
          </button>
          <button
            type="button"
            className="neu-btn !text-[10px] font-black"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>

      <div
        className={`neu-inset px-3 py-2 text-[11px] font-black ${
          complete
            ? "text-emerald-700"
            : total === 0
              ? "text-rose-600"
              : "text-amber-700"
        }`}
      >
        {total === 0
          ? "No ports found — set top module and upload RTL on Project / Design"
          : planSummary(plan)}
        {complete ? " · ready — Run IO Planner to commit pin_order.cfg" : ""}
      </div>

      {/* Port legend */}
      {ports.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ports.map((p) => (
            <span
              key={p.name}
              className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${
                DIR_COLOR[p.direction] || DIR_COLOR.inout
              }`}
              title={`${p.direction}${
                p.msb != null ? ` [${p.msb}:${p.lsb}]` : ""
              } → ${p.pins.length} pin(s)`}
            >
              {p.direction === "input"
                ? "in"
                : p.direction === "output"
                  ? "out"
                  : "io"}{" "}
              {p.name}
              {p.msb != null ? `[${p.msb}:${p.lsb}]` : ""}
            </span>
          ))}
        </div>
      )}

      {/* Die + sides layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(200px,240px)] gap-3">
        <div className="grid grid-rows-[auto_1fr_auto] gap-2 min-h-[320px]">
          <SideColumn
            side="N"
            pins={plan.order.N}
            ports={ports}
            onAssign={(pin) => setOrder(assignPin(plan.order, pin, "N"))}
            onRemove={(pin) => setOrder(removePin(plan.order, pin))}
            onMove={(pin, d) =>
              setOrder(movePinInSide(plan.order, "N", pin, d))
            }
            onDropFree={() => placeAllOn("N")}
          />
          <div className="grid grid-cols-[1fr_minmax(140px,1fr)_1fr] gap-2 min-h-[180px]">
            <SideColumn
              side="W"
              pins={plan.order.W}
              ports={ports}
              onAssign={(pin) => setOrder(assignPin(plan.order, pin, "W"))}
              onRemove={(pin) => setOrder(removePin(plan.order, pin))}
              onMove={(pin, d) =>
                setOrder(movePinInSide(plan.order, "W", pin, d))
              }
              onDropFree={() => placeAllOn("W")}
            />
            <div className="neu-inset flex flex-col items-center justify-center p-3 border-2 border-dashed border-sky-300/60 bg-sky-50/40">
              <p className="text-[10px] font-black uppercase text-sky-800">
                Die core
              </p>
              <p className="text-[9px] font-bold text-[var(--neu-text-muted)] text-center mt-1">
                {project.designName || "design"}
              </p>
              <p className="text-[9px] font-mono text-sky-700 mt-2">
                {project.topModule || "top"}
              </p>
              <p className="text-[8px] font-bold text-slate-400 mt-3 text-center">
                N↑ · E→ · S↓ · W←
              </p>
            </div>
            <SideColumn
              side="E"
              pins={plan.order.E}
              ports={ports}
              onAssign={(pin) => setOrder(assignPin(plan.order, pin, "E"))}
              onRemove={(pin) => setOrder(removePin(plan.order, pin))}
              onMove={(pin, d) =>
                setOrder(movePinInSide(plan.order, "E", pin, d))
              }
              onDropFree={() => placeAllOn("E")}
            />
          </div>
          <SideColumn
            side="S"
            pins={plan.order.S}
            ports={ports}
            onAssign={(pin) => setOrder(assignPin(plan.order, pin, "S"))}
            onRemove={(pin) => setOrder(removePin(plan.order, pin))}
            onMove={(pin, d) =>
              setOrder(movePinInSide(plan.order, "S", pin, d))
            }
            onDropFree={() => placeAllOn("S")}
          />
        </div>

        {/* Unplaced + quick place */}
        <div className="neu-inset p-2 space-y-2 max-h-[480px] overflow-auto">
          <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
            Unplaced ({free.length})
          </p>
          {free.length === 0 ? (
            <p className="text-[10px] font-bold text-emerald-600">
              All pins assigned
            </p>
          ) : (
            <ul className="space-y-1">
              {free.map((pin) => {
                const d = pinDir(ports, pin);
                return (
                  <li
                    key={pin}
                    className="flex flex-col gap-1 neu-panel-sm p-1.5"
                  >
                    <span
                      className={`text-[10px] font-mono font-bold truncate ${
                        DIR_COLOR[d]?.split(" ")[0] || ""
                      }`}
                      title={pin}
                    >
                      {pin}
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {PIN_SIDES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 hover:bg-sky-100 text-slate-700 border border-slate-200"
                          onClick={() =>
                            setOrder(assignPin(plan.order, pin, s))
                          }
                          title={`Place on ${SIDE_LABEL[s]}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {free.length > 0 && (
            <div className="pt-1 border-t border-slate-200 space-y-1">
              <p className="text-[8px] font-black uppercase text-slate-400">
                Dump all free →
              </p>
              <div className="flex flex-wrap gap-1">
                {PIN_SIDES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="neu-btn !text-[9px] font-black !px-2 !py-0.5"
                    onClick={() => placeAllOn(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SideColumn({
  side,
  pins,
  ports,
  onRemove,
  onMove,
  onDropFree,
}: {
  side: PinSide;
  pins: string[];
  ports: RtlPort[];
  onAssign: (pin: string) => void;
  onRemove: (pin: string) => void;
  onMove: (pin: string, dir: -1 | 1) => void;
  onDropFree: () => void;
}) {
  return (
    <div className="neu-inset p-2 min-h-[72px] flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[9px] font-black uppercase text-sky-800">
          #{side} {SIDE_LABEL[side]}
          <span className="text-slate-400 font-bold ml-1">({pins.length})</span>
        </p>
        <button
          type="button"
          className="text-[8px] font-black text-sky-600 hover:underline"
          onClick={onDropFree}
          title="Move all unplaced pins here"
        >
          + unplaced
        </button>
      </div>
      {pins.length === 0 ? (
        <p className="text-[9px] font-bold text-slate-400 py-2 text-center">
          empty
        </p>
      ) : (
        <ul className="space-y-0.5 max-h-36 overflow-auto">
          {pins.map((pin) => {
            const d = pinDir(ports, pin);
            return (
              <li
                key={pin}
                className={`flex items-center gap-0.5 text-[9px] font-mono border rounded px-1 py-0.5 ${
                  DIR_COLOR[d] || DIR_COLOR.inout
                }`}
              >
                <span className="flex-1 truncate" title={pin}>
                  {pin}
                </span>
                <button
                  type="button"
                  className="p-0.5 opacity-60 hover:opacity-100"
                  onClick={() => onMove(pin, -1)}
                  title="Move earlier on side"
                >
                  <ArrowUp className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  className="p-0.5 opacity-60 hover:opacity-100"
                  onClick={() => onMove(pin, 1)}
                  title="Move later on side"
                >
                  <ArrowDown className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  className="p-0.5 opacity-60 hover:opacity-100"
                  onClick={() => onRemove(pin)}
                  title="Unplace"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
