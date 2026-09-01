/**
 * Per-stage downloadable artifacts (logs, reports, VCD, job files).
 * Stored in session/local storage for the browser session; OpenLane
 * binary artifacts still download via job API.
 */

import type { FlowStageId, StageResultPayload } from "./openroad-flow-model";
import { FLOW_STAGES } from "./openroad-flow-model";

export type StageArtifactKind =
  | "log"
  | "report"
  | "summary"
  | "vcd"
  | "metrics"
  | "gds"
  | "def"
  | "other";

export interface StageArtifact {
  id: string;
  stage: FlowStageId;
  name: string;
  kind: StageArtifactKind;
  /** Text content for client-side download */
  content?: string;
  /** Server job download path (relative name) */
  jobDownload?: { jobId: string; name: string };
  size: number;
  createdAt: string;
  mime?: string;
}

const STORAGE_KEY = "ace_openroad_stage_artifacts_v1";
/** Cap total stored text ~1.5MB to avoid quota blowups */
const MAX_TOTAL_CHARS = 1_500_000;

export function artifactId(stage: FlowStageId, name: string): string {
  return `${stage}::${name}`;
}

export function loadStageArtifacts(): StageArtifact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StageArtifact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStageArtifacts(list: StageArtifact[]): void {
  if (typeof window === "undefined") return;
  try {
    // Prefer keeping logs/reports; drop oldest huge blobs if needed
    let total = list.reduce((s, a) => s + (a.content?.length || 0), 0);
    const next = [...list].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
    while (total > MAX_TOTAL_CHARS && next.length) {
      const drop = next.findIndex(
        (a) => a.kind === "vcd" || (a.content && a.content.length > 50_000)
      );
      const i = drop >= 0 ? drop : next.length - 1;
      total -= next[i].content?.length || 0;
      // keep metadata without content if large
      if (next[i].content && next[i].content!.length > 10_000) {
        next[i] = { ...next[i], content: undefined, size: next[i].size };
      } else {
        next.splice(i, 1);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota — store metadata only */
    try {
      const meta = list.map(({ content: _c, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch {
      /* */
    }
  }
}

export function clearStageArtifacts(stage?: FlowStageId): StageArtifact[] {
  const cur = loadStageArtifacts();
  if (!stage) {
    saveStageArtifacts([]);
    return [];
  }
  const next = cur.filter((a) => a.stage !== stage);
  saveStageArtifacts(next);
  return next;
}

export function clearArtifactsFromStage(
  stage: FlowStageId,
  existing: StageArtifact[]
): StageArtifact[] {
  const idx = FLOW_STAGES.findIndex((s) => s.id === stage);
  if (idx < 0) return existing;
  const drop = new Set(FLOW_STAGES.slice(idx).map((s) => s.id));
  return existing.filter((a) => !drop.has(a.stage));
}

function makeArt(
  stage: FlowStageId,
  name: string,
  kind: StageArtifactKind,
  content: string,
  mime?: string
): StageArtifact {
  return {
    id: artifactId(stage, name),
    stage,
    name,
    kind,
    content,
    size: content.length,
    createdAt: new Date().toISOString(),
    mime: mime || "text/plain",
  };
}

/** Build artifacts from a completed stage result */
export function artifactsFromStageResult(
  stage: FlowStageId,
  result: StageResultPayload
): StageArtifact[] {
  const out: StageArtifact[] = [];
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  if ("log" in result && result.log?.trim()) {
    out.push(
      makeArt(stage, `${stage}_${ts}.log`, "log", result.log, "text/plain")
    );
  }

  if (result.kind === "lint") {
    const report = [
      `# Lint report — ${stage}`,
      `Summary: ${result.summary}`,
      `Errors: ${result.errorCount}`,
      `Warnings: ${result.warnCount}`,
      "",
      "## Log",
      result.log || "(empty)",
    ].join("\n");
    out.push(
      makeArt(stage, `${stage}_report_${ts}.txt`, "report", report)
    );
    out.push(
      makeArt(
        stage,
        `${stage}_summary_${ts}.json`,
        "summary",
        JSON.stringify(
          {
            stage,
            summary: result.summary,
            errorCount: result.errorCount,
            warnCount: result.warnCount,
            at: new Date().toISOString(),
          },
          null,
          2
        ),
        "application/json"
      )
    );
  }

  if (result.kind === "sim") {
    const report = [
      `# Simulation report — ${stage}`,
      `Summary: ${result.summary}`,
      `OK: ${result.ok}`,
      "",
      "## Log",
      result.log || "(empty)",
    ].join("\n");
    out.push(
      makeArt(stage, `${stage}_report_${ts}.txt`, "report", report)
    );
    if (result.vcd?.trim()) {
      out.push(
        makeArt(
          stage,
          `tb_top_${ts}.vcd`,
          "vcd",
          result.vcd,
          "text/plain"
        )
      );
    }
  }

  if (result.kind === "synth") {
    const report = [
      `# Synthesis report — ${stage}`,
      `Summary: ${result.summary}`,
      result.cellCount != null ? `Cells: ${result.cellCount}` : "",
      result.wireCount != null ? `Wires: ${result.wireCount}` : "",
      "",
      "## Stats",
      ...(result.statsLines || []),
      "",
      "## Log (tail)",
      (result.log || "").slice(-8000),
    ]
      .filter(Boolean)
      .join("\n");
    out.push(
      makeArt(stage, `${stage}_report_${ts}.txt`, "report", report)
    );
    if (result.netlist?.trim()) {
      out.push(
        makeArt(
          stage,
          `synth_netlist_${ts}.v`,
          "report",
          result.netlist,
          "text/plain"
        )
      );
    }
  }

  if (result.kind === "io_plan") {
    const report = [
      `# IO planner report — ${stage}`,
      result.summary,
      `placed=${result.placed} total=${result.total}`,
      `N=${result.sides.N} E=${result.sides.E} S=${result.sides.S} W=${result.sides.W}`,
      "",
      result.log || "",
    ].join("\n");
    out.push(
      makeArt(stage, `${stage}_report_${ts}.txt`, "report", report)
    );
    if (result.pinOrderCfg?.trim()) {
      out.push(
        makeArt(stage, "pin_order.cfg", "other", result.pinOrderCfg)
      );
    }
  }

  if (result.kind === "generic" && result.log?.trim()) {
    out.push(
      makeArt(stage, `${stage}_report_${ts}.txt`, "report", result.log)
    );
  }

  return out;
}

/** Infer OpenLane path → Studio stage from artifact filename */
export function inferStageFromArtifactName(
  name: string,
  fallback: FlowStageId = "synthesis"
): FlowStageId {
  const n = name.toLowerCase().replace(/\\/g, "/");
  if (/synthesis|yosys|synth|nl\.v|_gl_|area_0|pre_synth|tmp_synthesis/.test(n))
    return "synthesis";
  if (/pin_order|io_plan|fp_pin_order/.test(n)) return "io_plan";
  if (/floorplan|initial_fp|tap|io\.log|pdn/.test(n)) {
    if (/pdn|power/.test(n)) return "powerplan";
    return "floorplan";
  }
  if (
    /placement|global_skip|detailed_place|gpl|dpl|placement_timing|post_place_sta|placement_power|placement_area|placement_metrics|placement_rpt/.test(
      n
    )
  )
    return "placement";
  if (/\bcts\b|clock_tree/.test(n)) return "cts";
  if (/routing|route|grt|fill|wire_length/.test(n)) return "route";
  if (/\bdrc\b|magic_drc|klayout_drc/.test(n)) return "drc";
  if (/\blvs\b|netgen/.test(n)) return "lvs";
  if (/\.gds|\.gds\.gz|signoff|stream|magic\.|klayout/.test(n)) return "gds";
  if (/metrics\.csv|manufacturability/.test(n)) return "gds";
  return fallback;
}

/** Drop noisy OpenLane intermediates from Studio artifact lists */
export function isJunkOpenlaneArtifact(name: string): boolean {
  const n = name.toLowerCase().replace(/\\/g, "/");
  if (/tmp_placement|global_skip_io|tmp_merged|\.lef$/.test(n)) return true;
  if (/ace_run_tmp_|run_ace_run_tmp_/.test(n)) return true;
  if (/logs_placement_.*(gpl_sta|dpl_sta|ace_post_place).*\.log$/.test(n))
    return true;
  // Huge path dumps — keep summary .rpt only
  if (
    /placement_.*(gpl_sta|dpl_sta)\.(max|min)\.rpt$/i.test(n) ||
    /placement_.*(gpl_sta|dpl_sta)\.(checks|clock|nonpropagated|skew)\.rpt$/i.test(
      n
    )
  )
    return true;
  if (/cmds\.log|errors\.log|^openlane\.log$/.test(n)) return true;
  // Duplicate path-prefixed DEFs — keep only placement_top / stage_top
  if (/\.def$/.test(n) && !/(^|_)(placement_top|floorplan_top|cts_top|routing_top|top)\.def$/.test(n)) {
    if (/tmp_|global_skip|9-io|10-global|12-resizer|7-global|4-io|3-initial/.test(n))
      return true;
  }
  // Synthesis reports should not flood placement
  if (/1-synthesis|pre_synth|area_0\.stat/.test(n) && /placement/i.test(n) === false)
    return false; // keep on synth stage via infer
  return false;
}

/** Attach OpenLane job files as stage artifacts (mapped by filename → stage) */
export function artifactsFromJobFiles(
  jobId: string,
  files: { name: string; size?: number; content?: string }[],
  fallbackStage: FlowStageId = "synthesis"
): StageArtifact[] {
  const out: StageArtifact[] = [];
  for (const f of files) {
    if (isJunkOpenlaneArtifact(f.name)) continue;
    const n = f.name.toLowerCase();
    let kind: StageArtifactKind = "other";
    const mapStage = inferStageFromArtifactName(f.name, fallbackStage);
    // When attaching to a PnR stage, don't pull unrelated synth/floorplan noise
    if (
      fallbackStage === "placement" &&
      mapStage !== "placement" &&
      !/placement_|placement\./i.test(f.name)
    ) {
      continue;
    }
    if (/\.gds(\.gz)?$/i.test(n)) kind = "gds";
    else if (/\.odb$/i.test(n)) kind = "def"; // layout DB — group with DEF in UI
    else if (/\.def$/i.test(n)) kind = "def";
    else if (/metrics_summary|metrics\.csv/i.test(n)) kind = "metrics";
    else if (/\.vcd$/i.test(n)) kind = "vcd";
    else if (
      /\.log$/i.test(n) ||
      /\.warnings$/i.test(n) ||
      /\.errors$/i.test(n) ||
      /openlane\.log|cmds\.log|logs_/i.test(n)
    )
      kind = "log";
    else if (/rpt|report|summary|stat|chk|timing|power|area_util/i.test(n))
      kind = "report";
    else if (/\.v$/i.test(n) || /\.nl\.v$/i.test(n)) kind = "report";

    out.push({
      id: artifactId(mapStage, f.name),
      stage: mapStage,
      name: f.name,
      kind,
      content: f.content,
      jobDownload: f.content ? undefined : { jobId, name: f.name },
      size: f.size ?? f.content?.length ?? 0,
      createdAt: new Date().toISOString(),
    });
  }
  return out;
}

/** Preferred placement artifacts for the Artifacts tab (curated order) */
export function curatePlacementArtifacts(
  list: StageArtifact[]
): StageArtifact[] {
  const prefer = [
    /^placement_metrics_summary\.rpt$/i,
    /^placement_timing\.rpt$/i,
    /^placement_power\.rpt$/i,
    /^placement_area_util\.rpt$/i,
    /^placement_top\.def$/i,
    /^placement_.*\.rpt$/i,
    /results_placement_top/i,
  ];
  const placement = list.filter(
    (a) => a.stage === "placement" && !isJunkOpenlaneArtifact(a.name)
  );
  const scored = placement.map((a) => {
    let score = 0;
    for (let i = 0; i < prefer.length; i++) {
      if (prefer[i].test(a.name)) {
        score = 100 - i;
        break;
      }
    }
    if (/timing|power|area|metrics/i.test(a.name)) score = Math.max(score, 50);
    if (/\.def$/i.test(a.name)) score = Math.max(score, 40);
    return { a, score };
  });
  scored.sort((x, y) => y.score - x.score || x.a.name.localeCompare(y.a.name));
  // Cap noise
  return scored.slice(0, 24).map((s) => s.a);
}

export function mergeArtifacts(
  existing: StageArtifact[],
  incoming: StageArtifact[]
): StageArtifact[] {
  const map = new Map<string, StageArtifact>();
  for (const a of existing) map.set(a.id, a);
  for (const a of incoming) map.set(a.id, a);
  return Array.from(map.values()).sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

export function downloadArtifact(a: StageArtifact): void {
  if (typeof window === "undefined") return;
  if (a.jobDownload && !a.content) {
    const key = localStorage.getItem("ace_seek_api_key") || "";
    const q = new URLSearchParams({ download: a.jobDownload.name });
    if (key) q.set("apiKey", key);
    const href = `/api/openroad/jobs/${a.jobDownload.jobId}?${q.toString()}`;
    const link = document.createElement("a");
    link.href = href;
    link.download = a.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  if (!a.content) return;
  const blob = new Blob([a.content], {
    type: a.mime || "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = a.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadStageBundle(
  stage: FlowStageId,
  list: StageArtifact[]
): void {
  const items = list.filter((a) => a.stage === stage && a.content);
  if (!items.length) {
    // fall back to individual job downloads
    list
      .filter((a) => a.stage === stage)
      .forEach((a) => downloadArtifact(a));
    return;
  }
  // Single concatenated text bundle if multiple text files
  const body = items
    .map(
      (a) =>
        `\n${"=".repeat(60)}\n# ${a.name} (${a.kind})\n${"=".repeat(60)}\n${a.content}`
    )
    .join("\n");
  downloadArtifact(
    makeArt(
      stage,
      `${stage}_bundle_${new Date().toISOString().slice(0, 10)}.txt`,
      "report",
      body
    )
  );
}

export function groupArtifactsByStage(
  list: StageArtifact[]
): { stage: FlowStageId; label: string; items: StageArtifact[] }[] {
  return FLOW_STAGES.map((s) => ({
    stage: s.id,
    label: s.label,
    items: list.filter((a) => a.stage === s.id),
  })).filter((g) => g.items.length > 0);
}
