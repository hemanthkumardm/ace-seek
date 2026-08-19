/**
 * Layered snapshot helpers for OpenROAD Studio.
 *
 * 1. Flow checkpoint (host disk) — physical truth for tools (DEF/netlist)
 * 2. Cloud studio snapshot — UI session state (no multi-MB blobs)
 * 3. Chip canvas — view of intent (form) or result (DEF)
 */

import type { FlowStageId, StageResultPayload } from "./openroad-flow-model";
import type { StageInputValues } from "./openroad-stage-config";
import type { OpenroadProjectState } from "./openroad-project-hub";
import type { StageArtifact } from "./openroad-stage-artifacts";

const MAX_LOG_CLOUD = 12_000;
const MAX_NETLIST_CLOUD = 4_000;
const MAX_VCD_CLOUD = 2_000;

/** Slim stage results for Supabase JSON — keep summaries, drop huge blobs */
export function slimStageResultsForCloud(
  results: Partial<Record<FlowStageId, StageResultPayload>> | undefined
): Partial<Record<FlowStageId, StageResultPayload>> {
  if (!results) return {};
  const out: Partial<Record<FlowStageId, StageResultPayload>> = {};
  for (const [id, res] of Object.entries(results)) {
    if (!res) continue;
    const stage = id as FlowStageId;
    if (res.kind === "lint") {
      out[stage] = {
        ...res,
        log: (res.log || "").slice(-MAX_LOG_CLOUD),
      };
    } else if (res.kind === "sim") {
      out[stage] = {
        ...res,
        log: (res.log || "").slice(-MAX_LOG_CLOUD),
        vcd: res.vcd ? res.vcd.slice(0, MAX_VCD_CLOUD) + "\n/* truncated for cloud */\n" : undefined,
        wave: res.wave?.slice(0, 200),
      };
    } else if (res.kind === "synth") {
      out[stage] = {
        ...res,
        log: (res.log || "").slice(-MAX_LOG_CLOUD),
        netlist: res.netlist
          ? res.netlist.slice(0, MAX_NETLIST_CLOUD) + "\n// truncated for cloud\n"
          : undefined,
        statsLines: res.statsLines?.slice(0, 40),
      };
    } else if (res.kind === "io_plan") {
      out[stage] = {
        ...res,
        log: (res.log || "").slice(-MAX_LOG_CLOUD),
        // keep pin_order.cfg — small and useful
        pinOrderCfg: res.pinOrderCfg?.slice(0, 80_000),
      };
    } else if (res.kind === "generic") {
      out[stage] = {
        ...res,
        log: (res.log || "").slice(-MAX_LOG_CLOUD),
      };
    } else {
      out[stage] = res;
    }
  }
  return out;
}

/** Project files for cloud: keep RTL/SDC/config; skip huge VCD/GDS text if any */
export function slimProjectForCloud(
  project: OpenroadProjectState
): OpenroadProjectState {
  return {
    ...project,
    files: project.files.map((f) => {
      const n = f.name.toLowerCase();
      if (/\.(vcd|gds|gz|oas)$/i.test(n) && (f.content?.length || 0) > 50_000) {
        return {
          ...f,
          content: `/* ${f.name} omitted from cloud snapshot (${f.size} bytes) — keep on host/artifacts */\n`,
          size: 80,
        };
      }
      if ((f.content?.length || 0) > 400_000) {
        return {
          ...f,
          content:
            f.content.slice(0, 200_000) +
            `\n/* truncated for cloud snapshot */\n`,
          size: 200_080,
        };
      }
      return f;
    }),
  };
}

export interface StudioCloudSnapshot {
  project: OpenroadProjectState;
  stageInputs: StageInputValues;
  completedStages: FlowStageId[];
  stageResults: Partial<Record<FlowStageId, StageResultPayload>>;
  /** Provenance */
  snapshotKind: "studio_session";
  snapshotVersion: 1;
  /** Chip view hint only — not geometry truth */
  chipHint?: {
    mode: "intent" | "result" | "empty";
    sourceLabel?: string;
    defName?: string;
  };
}

export function buildStudioCloudSnapshot(opts: {
  project: OpenroadProjectState;
  stageInputs: StageInputValues;
  completedStages: FlowStageId[];
  stageResults: Partial<Record<FlowStageId, StageResultPayload>>;
  chipHint?: StudioCloudSnapshot["chipHint"];
}): StudioCloudSnapshot {
  return {
    project: slimProjectForCloud(opts.project),
    stageInputs: opts.stageInputs,
    completedStages: opts.completedStages,
    stageResults: slimStageResultsForCloud(opts.stageResults),
    snapshotKind: "studio_session",
    snapshotVersion: 1,
    chipHint: opts.chipHint,
  };
}

/**
 * Rank DEF artifacts for chip Result view.
 * Prefer stage results (floorplan/placement/route top.def) over OpenLane
 * intermediates (3-initial_fp, 4-io) which often have UNPLACED stdcells only.
 */
export function scoreDefArtifactName(name: string, size = 0): number {
  const s = name.toLowerCase().replace(/\\/g, "/");
  let score = 0;

  // Prefer late flow results
  if (/results\/?final|final[._/].*def|results_final/.test(s)) score += 100;
  if (/routing|route|detailed/.test(s)) score += 90;
  if (/placement|place(?!d)/.test(s)) score += 80;
  if (/\bcts\b|clock_tree/.test(s)) score += 70;
  if (/results_floorplan|floorplan\/.*top|results\/floorplan/.test(s))
    score += 80;
  // Tapcell DEF is the right floorplan physical view (endcaps + taps)
  if (/tapcell|5-tap/.test(s)) score += 75;
  if (/pdn|6-pdn|power/.test(s)) score += 70;

  // Generic top.def from results pack (often best available)
  if (/(^|\/|_)top\.def$/i.test(s) && !/tmp_/.test(s)) score += 35;
  if (/results_/.test(s)) score += 25;

  // Penalize early intermediates (die/io only, mostly UNPLACED)
  if (/initial_fp|3-initial/.test(s)) score -= 80;
  if (/(^|\/|_)4-io\.def$|tmp_floorplan_4-io|\/4-io\.def/.test(s))
    score -= 90;
  if (/tmp_floorplan|\/tmp\//.test(s)) score -= 30;
  if (/global_skip_io|fill\.def/.test(s)) score -= 20;

  // Prefer larger files (more likely full placed design)
  if (size > 2_000_000) score += 15;
  else if (size > 500_000) score += 8;
  else if (size > 0 && size < 50_000) score -= 10;

  // Content hint: has FIXED/PLACED → real geometry
  return score;
}

/** Pick best DEF artifact from stage artifact list */
export function pickDefArtifact(
  artifacts: StageArtifact[]
): StageArtifact | null {
  const defs = artifacts.filter(
    (a) => a.kind === "def" || /\.def$/i.test(a.name)
  );
  if (!defs.length) return null;
  defs.sort((a, b) => {
    const sb =
      scoreDefArtifactName(b.name, b.size || b.content?.length || 0) -
      scoreDefArtifactName(a.name, a.size || a.content?.length || 0);
    if (sb !== 0) return sb;
    // Prefer content already in memory
    const ac = a.content?.length || 0;
    const bc = b.content?.length || 0;
    return bc - ac;
  });
  return defs[0];
}

export function findDefInJobArtifacts(
  artifacts: { name: string; size?: number; content?: string }[]
): { name: string; content?: string; size?: number } | null {
  const defs = artifacts.filter((a) => /\.def$/i.test(a.name));
  if (!defs.length) return null;
  defs.sort((a, b) => {
    const sa = scoreDefArtifactName(a.name, a.size || a.content?.length || 0);
    const sb = scoreDefArtifactName(b.name, b.size || b.content?.length || 0);
    if (sb !== sa) return sb - sa;
    return (b.size || 0) - (a.size || 0);
  });
  return defs[0];
}
