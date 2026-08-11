/**
 * B1.7 — Bridge MMMC analysis views ↔ Timing Studio paths.
 *
 * - Persist active MMMC views for Timing to load
 * - Auto-tag paths with viewName (report header, filename, setup/hold, corner match)
 * - Merge MMMC registry into filterable analysisViews list
 */

import type { MmmcState } from "./mmmc-engine";
import type { TimingPath, TimingStudioState } from "./timing-engine";

export interface MmmcViewDescriptor {
  name: string;
  isSetup: boolean;
  isHold: boolean;
  isLeakage: boolean;
  isDynamic: boolean;
  active: boolean;
  delayCornerName?: string;
  constraintModeName?: string;
  librarySetName?: string;
  rcCornerName?: string;
  opCondName?: string;
}

export interface MmmcViewRegistry {
  views: MmmcViewDescriptor[];
  savedAt: number;
  source: "mmmc-studio" | "import" | "manual";
}

export const MMMC_VIEW_REGISTRY_KEY = "ace_seek_mmmc_view_registry";

export function mmmcStateToViewDescriptors(state: MmmcState): MmmcViewDescriptor[] {
  return state.analysisViews.map((v) => {
    const dc = state.delayCorners.find((d) => d.id === v.delayCornerId);
    const cm = state.constraintModes.find((c) => c.id === v.constraintModeId);
    const lib = dc
      ? state.librarySets.find((l) => l.id === dc.librarySetId)
      : undefined;
    const rc = dc
      ? state.rcCorners.find((r) => r.id === dc.rcCornerId)
      : undefined;
    const op = dc?.opCondId
      ? state.opConds.find((o) => o.id === dc.opCondId)
      : dc?.opCondName
        ? { name: dc.opCondName }
        : undefined;

    return {
      name: v.name,
      isSetup: v.isSetup,
      isHold: v.isHold,
      isLeakage: v.isLeakage ?? false,
      isDynamic: v.isDynamic ?? false,
      active: v.active,
      delayCornerName: dc?.name,
      constraintModeName: cm?.name,
      librarySetName: lib?.name,
      rcCornerName: rc?.name,
      opCondName: op?.name,
    };
  });
}

export function buildMmmcViewRegistry(
  state: MmmcState,
  source: MmmcViewRegistry["source"] = "mmmc-studio"
): MmmcViewRegistry {
  return {
    views: mmmcStateToViewDescriptors(state),
    savedAt: Date.now(),
    source,
  };
}

export function saveMmmcViewRegistry(registry: MmmcViewRegistry): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    localStorage.setItem(MMMC_VIEW_REGISTRY_KEY, JSON.stringify(registry));
    return true;
  } catch {
    return false;
  }
}

export function loadMmmcViewRegistry(): MmmcViewRegistry | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(MMMC_VIEW_REGISTRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MmmcViewRegistry;
    if (!parsed || !Array.isArray(parsed.views)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearMmmcViewRegistry(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(MMMC_VIEW_REGISTRY_KEY);
  } catch {
    /* ignore */
  }
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Guess view name from report filename (e.g. top_func_setup_view.rpt). */
export function matchViewFromFilename(
  filename: string | undefined,
  views: MmmcViewDescriptor[]
): string | undefined {
  if (!filename || !views.length) return undefined;
  const base = filename.replace(/\.(rpt|txt|log|gz|timing)$/i, "");
  const nBase = norm(base);

  // Prefer longest name match so func_setup_view wins over setup
  const sorted = [...views].sort((a, b) => b.name.length - a.name.length);
  for (const v of sorted) {
    if (nBase.includes(norm(v.name))) return v.name;
  }
  return undefined;
}

/** Match path setup/hold + corner string to an MMMC view. */
export function matchViewForPath(
  path: Pick<TimingPath, "type" | "corner" | "viewName">,
  views: MmmcViewDescriptor[],
  opts?: {
    assignedViewName?: string;
    filename?: string;
    overwriteExisting?: boolean;
  }
): string | undefined {
  if (path.viewName && !opts?.overwriteExisting) return path.viewName;

  if (opts?.assignedViewName) {
    const forced = views.find((v) => v.name === opts.assignedViewName);
    if (forced) return forced.name;
    // Allow assign even if not in registry (user typed free text)
    if (opts.assignedViewName.trim()) return opts.assignedViewName.trim();
  }

  const active = views.filter((v) => v.active);
  const pool = active.length ? active : views;
  if (!pool.length) return path.viewName;

  const fromFile = matchViewFromFilename(opts?.filename, pool);
  if (fromFile) return fromFile;

  // Corner / delay-corner / opcond fuzzy match
  const cornerRaw = path.corner || "";
  const nCorner = norm(cornerRaw);
  if (nCorner && nCorner !== "defaultcorner") {
    const byCorner = pool.filter((v) => {
      const tokens = [
        v.delayCornerName,
        v.opCondName,
        v.librarySetName,
        v.rcCornerName,
        v.name,
      ]
        .filter(Boolean)
        .map((t) => norm(String(t)));
      return tokens.some(
        (t) => t && (nCorner.includes(t) || t.includes(nCorner))
      );
    });
    const typed = byCorner.filter((v) =>
      path.type === "setup" ? v.isSetup : v.isHold
    );
    if (typed.length === 1) return typed[0].name;
    if (byCorner.length === 1) return byCorner[0].name;
  }

  // Single setup / single hold view in MMMC
  const setupViews = pool.filter((v) => v.isSetup);
  const holdViews = pool.filter((v) => v.isHold);
  if (path.type === "setup" && setupViews.length === 1) return setupViews[0].name;
  if (path.type === "hold" && holdViews.length === 1) return holdViews[0].name;

  return path.viewName;
}

export interface ApplyMmmcViewTaggingOptions {
  views: MmmcViewDescriptor[];
  /** Force all paths (or untagged) to this view name */
  assignedViewName?: string;
  filename?: string;
  /** Re-tag paths that already have a report viewName */
  overwriteExisting?: boolean;
}

/**
 * Tag paths with viewName and expand analysisViews for the filter UI.
 */
export function applyMmmcViewTagging(
  state: TimingStudioState,
  opts: ApplyMmmcViewTaggingOptions
): TimingStudioState {
  const views = opts.views || [];
  const paths = state.paths.map((p) => {
    const viewName = matchViewForPath(p, views, {
      assignedViewName: opts.assignedViewName,
      filename: opts.filename,
      overwriteExisting: opts.overwriteExisting,
    });
    if (viewName === p.viewName) return p;
    return { ...p, viewName };
  });

  const fromPaths = paths
    .map((p) => p.viewName)
    .filter((v): v is string => !!v && v.trim().length > 0);
  const fromRegistry = views.map((v) => v.name);
  const analysisViews = [...new Set([...fromPaths, ...fromRegistry])].sort();

  return {
    ...state,
    paths,
    analysisViews,
  };
}

/** Per-view path counts for filter badges */
export function countPathsByView(
  paths: TimingPath[]
): Record<string, { total: number; failing: number; wns: number }> {
  const map: Record<string, { total: number; failing: number; wns: number }> =
    {};
  for (const p of paths) {
    const key = p.viewName || "(untagged)";
    if (!map[key]) map[key] = { total: 0, failing: 0, wns: Infinity };
    map[key].total++;
    if (p.slack < 0) map[key].failing++;
    if (p.slack < map[key].wns) map[key].wns = p.slack;
  }
  for (const k of Object.keys(map)) {
    if (map[k].wns === Infinity) map[k].wns = 0;
  }
  return map;
}
