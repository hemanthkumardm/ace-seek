/**
 * Studio localStorage for completed stages + stage results (Sprint 2 extract).
 */

import type { FlowStageId, StageResultPayload } from "./openroad-flow-model";

export const COMPLETED_KEY = "ace_openroad_completed_stages_v1";
export const RESULTS_KEY = "ace_openroad_stage_results_v1";

export function clearStudioPersistence(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(COMPLETED_KEY);
    localStorage.removeItem(RESULTS_KEY);
  } catch {
    /* */
  }
}

export function loadCompleted(): FlowStageId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as FlowStageId[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCompleted(ids: FlowStageId[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(ids));
  } catch {
    /* */
  }
}

export function loadResults(): Partial<Record<FlowStageId, StageResultPayload>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<FlowStageId, StageResultPayload>>;
  } catch {
    return {};
  }
}

export function saveResults(
  r: Partial<Record<FlowStageId, StageResultPayload>>
): void {
  if (typeof window === "undefined") return;
  try {
    // Cap large payloads so localStorage doesn't drop the whole write
    const slim: typeof r = {};
    for (const [k, v] of Object.entries(r)) {
      if (!v) continue;
      if (v.kind === "sim") {
        slim[k as FlowStageId] = {
          ...v,
          vcd: undefined, // VCD kept in sessionStorage via storeLastVcd
          log: v.log?.slice(-80_000),
        };
      } else if (v.kind === "synth") {
        slim[k as FlowStageId] = {
          ...v,
          netlist: v.netlist?.slice(0, 40_000),
          log: v.log?.slice(-100_000),
        };
      } else if (v.kind === "lint") {
        slim[k as FlowStageId] = {
          ...v,
          log: v.log?.slice(-80_000),
        };
      } else if ("log" in v && v.log) {
        slim[k as FlowStageId] = {
          ...v,
          log: v.log.slice(-80_000),
        };
      } else {
        slim[k as FlowStageId] = v;
      }
    }
    localStorage.setItem(RESULTS_KEY, JSON.stringify(slim));
  } catch {
    /* quota — keep in-memory only */
  }
}
