/**
 * Single source of truth for OpenLane until-token ↔ Ace-Seek FlowStageId.
 * Keep UI poll completion and Docker runner aligned via this map.
 */

import type { FlowStageId } from "./openroad-flow-model";

/** OpenLane ACE_OPENLANE_UNTIL tokens (and log aliases) → studio stage id */
export const OPENLANE_UNTIL_TO_STAGE: Record<string, FlowStageId> = {
  synthesis: "synthesis",
  floorplan: "floorplan",
  powerplan: "powerplan",
  pdn: "powerplan",
  placement: "placement",
  cts: "cts",
  routing: "route",
  route: "route",
  drc: "drc",
  lvs: "lvs",
  gds: "gds",
  all: "gds",
};

/** Studio stage → OpenLane until token (powerplan shares floorplan stop) */
export const STAGE_TO_OPENLANE_UNTIL: Partial<Record<FlowStageId, string>> = {
  synthesis: "synthesis",
  floorplan: "floorplan",
  powerplan: "floorplan",
  placement: "placement",
  cts: "cts",
  route: "routing",
  drc: "drc",
  lvs: "lvs",
  gds: "all",
};

/** Ordered OpenLane-visible stages for marking completed prefix after a stop */
export const OPENLANE_COMPLETION_ORDER: FlowStageId[] = [
  "synthesis",
  "floorplan",
  "powerplan",
  "placement",
  "cts",
  "route",
  "drc",
  "lvs",
  "gds",
];

export function resolveUntilStage(
  raw: string | undefined | null,
  fallback: FlowStageId
): FlowStageId {
  if (!raw) return fallback;
  let until = raw.toLowerCase().trim();
  if (until.includes("floorplan")) until = "floorplan";
  return OPENLANE_UNTIL_TO_STAGE[until] || fallback;
}

/** Stages that should be marked done when OpenLane stops at `stop` */
export function completedStagesThrough(stop: FlowStageId): FlowStageId[] {
  const stopIdx = OPENLANE_COMPLETION_ORDER.indexOf(stop);
  if (stopIdx < 0) return [stop];
  const out = OPENLANE_COMPLETION_ORDER.slice(0, stopIdx + 1);
  // PDN is embedded in OpenLane floorplan — always co-complete
  if (stop === "floorplan" && !out.includes("powerplan")) {
    const fp = out.indexOf("floorplan");
    out.splice(fp + 1, 0, "powerplan");
  }
  return out;
}
