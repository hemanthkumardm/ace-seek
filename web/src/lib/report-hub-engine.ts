/**
 * B3 — Report Hub engine
 *
 * Classify dumps via ingest, auto-tag, size-capped history, and
 * handoff payloads to Timing / SDC / Power studios.
 */

import { ingestReport, type IngestResult, type TimingVendor } from "./report-ingest-engine";
import { parseTimingReport } from "./timing-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportHubTag =
  | "timing_path"
  | "si"
  | "summary"
  | "setup"
  | "hold"
  | "violations"
  | "met_only"
  | "synthesis"
  | "pnr"
  | "signoff"
  | "synopsys"
  | "cadence"
  | "opensta"
  | "sdc"
  | "upf"
  | "mmmc"
  | "drc"
  | "unknown";

export type HubOpenTarget = "timing" | "sdc" | "power" | "mmmc" | "unknown";

export interface ReportHubMetrics {
  pathCount: number;
  failingSetup: number;
  failingHold: number;
  wnsSetup?: number;
  wnsHold?: number;
  tnsSetup?: number;
  tnsHold?: number;
  hasSi: boolean;
  clocks: string[];
}

export interface ReportHubEntry {
  id: string;
  filename: string;
  savedAt: number;
  /** Full or truncated body */
  text: string;
  truncated: boolean;
  originalBytes: number;
  tags: ReportHubTag[];
  target: HubOpenTarget;
  designName?: string;
  vendor: TimingVendor;
  tool: string;
  stage: string;
  kind: string;
  pathBlocks: number;
  metrics: ReportHubMetrics;
  warnings: string[];
}

export interface ReportHubHistory {
  entries: ReportHubEntry[];
  savedAt: number;
}

export const REPORT_HUB_HISTORY_KEY = "ace_seek_report_hub_history";
export const REPORT_HUB_TRANSFER_KEY = "ace_seek_hub_transfer";

/** Soft cap for all history JSON (~1.2MB) */
export const HUB_HISTORY_MAX_CHARS = 1_200_000;
/** Per-file text stored max (~400KB) */
export const HUB_ENTRY_MAX_TEXT = 400_000;
/** Max number of entries */
export const HUB_MAX_ENTRIES = 24;

export interface HubTransferPayload {
  text: string;
  filename: string;
  vendor: TimingVendor;
  designName?: string;
  target: HubOpenTarget;
  entryId?: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function newHubId(): string {
  return `hub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadHubHistory(): ReportHubHistory {
  if (!canUseStorage()) return { entries: [], savedAt: 0 };
  try {
    const raw = localStorage.getItem(REPORT_HUB_HISTORY_KEY);
    if (!raw) return { entries: [], savedAt: 0 };
    const parsed = JSON.parse(raw) as ReportHubHistory;
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [], savedAt: 0 };
    return parsed;
  } catch {
    return { entries: [], savedAt: 0 };
  }
}

export function saveHubHistory(history: ReportHubHistory): boolean {
  if (!canUseStorage()) return false;
  try {
    let entries = [...history.entries].sort((a, b) => b.savedAt - a.savedAt);
    // Cap count
    entries = entries.slice(0, HUB_MAX_ENTRIES);
    // Cap total size by dropping oldest
    let json = JSON.stringify({ entries, savedAt: Date.now() });
    while (json.length > HUB_HISTORY_MAX_CHARS && entries.length > 1) {
      entries = entries.slice(0, -1);
      json = JSON.stringify({ entries, savedAt: Date.now() });
    }
    // Still too big — shrink texts
    while (json.length > HUB_HISTORY_MAX_CHARS && entries.length > 0) {
      const last = entries[entries.length - 1];
      if (last.text.length > 2000) {
        last.text = last.text.slice(0, Math.floor(last.text.length / 2));
        last.truncated = true;
      } else {
        entries.pop();
      }
      json = JSON.stringify({ entries, savedAt: Date.now() });
    }
    localStorage.setItem(REPORT_HUB_HISTORY_KEY, json);
    return true;
  } catch {
    return false;
  }
}

export function clearHubHistory(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(REPORT_HUB_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export function removeHubEntry(id: string): ReportHubHistory {
  const hist = loadHubHistory();
  const next = {
    entries: hist.entries.filter((e) => e.id !== id),
    savedAt: Date.now(),
  };
  saveHubHistory(next);
  return next;
}

export function saveHubTransfer(payload: HubTransferPayload): boolean {
  if (!canUseStorage()) return false;
  try {
    // Cap transfer size
    const text =
      payload.text.length > HUB_ENTRY_MAX_TEXT
        ? payload.text.slice(0, HUB_ENTRY_MAX_TEXT)
        : payload.text;
    localStorage.setItem(
      REPORT_HUB_TRANSFER_KEY,
      JSON.stringify({ ...payload, text, timestamp: Date.now() })
    );
    return true;
  } catch {
    return false;
  }
}

export function loadHubTransfer(): HubTransferPayload | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(REPORT_HUB_TRANSFER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HubTransferPayload;
  } catch {
    return null;
  }
}

export function clearHubTransfer(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(REPORT_HUB_TRANSFER_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Classification & tags
// ---------------------------------------------------------------------------

export function detectHubTarget(text: string, ingest?: IngestResult): HubOpenTarget {
  const t = text || "";
  const head = t.slice(0, 8000).toLowerCase();

  // UPF / power intent
  if (
    /upf_version|create_power_domain|set_isolation|create_supply_net|set_domain_supply_net/i.test(
      t
    )
  ) {
    return "power";
  }
  // MMMC
  if (
    /create_library_set|create_analysis_view|create_delay_corner|set_analysis_view|create_rc_corner/i.test(
      t
    )
  ) {
    return "mmmc";
  }
  // SDC constraints
  if (
    /create_clock|create_generated_clock|set_input_delay|set_false_path|set_multicycle_path/i.test(
      head
    ) &&
    !/startpoint:|path type:|slack \(violated\)|path \d+\s*:/i.test(head)
  ) {
    return "sdc";
  }
  // Timing reports
  if (
    ingest?.kind === "timing_path" ||
    ingest?.kind === "si_crosstalk" ||
    ingest?.kind === "summary_only" ||
    /startpoint:|path type:|slack \(violated\)|slack \(met\)|path \d+\s*:/i.test(t)
  ) {
    return "timing";
  }
  if (ingest && ingest.rawBlocks.length > 0) return "timing";
  return "unknown";
}

export function extractTags(
  text: string,
  ingest: IngestResult,
  metrics: ReportHubMetrics,
  target: HubOpenTarget
): ReportHubTag[] {
  const tags = new Set<ReportHubTag>();

  if (target === "sdc") tags.add("sdc");
  if (target === "upf" || target === "power") tags.add("upf");
  if (target === "mmmc") tags.add("mmmc");

  if (ingest.kind === "timing_path") tags.add("timing_path");
  if (ingest.kind === "si_crosstalk" || metrics.hasSi) tags.add("si");
  if (ingest.kind === "summary_only") tags.add("summary");
  if (ingest.kind === "unknown" && target === "unknown") tags.add("unknown");

  if (ingest.stage === "synthesis") tags.add("synthesis");
  if (ingest.stage === "pnr") tags.add("pnr");
  if (ingest.stage === "signoff") tags.add("signoff");

  if (ingest.detectedVendor === "synopsys") tags.add("synopsys");
  if (ingest.detectedVendor === "cadence") tags.add("cadence");
  if (ingest.detectedVendor === "opensta") tags.add("opensta");

  if (metrics.failingSetup > 0 || (metrics.wnsSetup !== undefined && metrics.wnsSetup < 0)) {
    tags.add("setup");
    tags.add("violations");
  }
  if (metrics.failingHold > 0 || (metrics.wnsHold !== undefined && metrics.wnsHold < 0)) {
    tags.add("hold");
    tags.add("violations");
  }
  if (
    metrics.pathCount > 0 &&
    metrics.failingSetup === 0 &&
    metrics.failingHold === 0 &&
    !tags.has("violations")
  ) {
    tags.add("met_only");
  }

  // DRC-ish heuristics
  if (/\bdrc\b|design rule|max_transition|max_capacitance|max_fanout/i.test(text.slice(0, 5000))) {
    tags.add("drc");
  }

  return [...tags];
}

export function computeHubMetrics(
  text: string,
  ingest: IngestResult
): ReportHubMetrics {
  const base: ReportHubMetrics = {
    pathCount: ingest.rawBlocks.filter((b) => b.kind === "path").length,
    failingSetup: 0,
    failingHold: 0,
    hasSi: ingest.kind === "si_crosstalk" || /crosstalk|si delta|noise/i.test(text.slice(0, 4000)),
    clocks: [],
  };

  // Prefer full STA parse when it looks like a timing report
  const looksTiming =
    ingest.kind === "timing_path" ||
    ingest.kind === "si_crosstalk" ||
    /startpoint:|path type:|slack \(/i.test(text);

  if (looksTiming && text.length < 2_000_000) {
    try {
      const state = parseTimingReport(text, ingest.vendor === "auto" ? "auto" : ingest.vendor);
      return {
        pathCount: state.totalPaths || base.pathCount,
        failingSetup: state.failingSetup,
        failingHold: state.failingHold,
        wnsSetup: state.wns,
        wnsHold: state.wnsHold,
        tnsSetup: state.tns,
        tnsHold: state.tnsHold,
        hasSi:
          base.hasSi ||
          state.siSummary.pathsWithReportedSi > 0 ||
          state.siSummary.highNoisePaths > 0,
        clocks: state.clocks.slice(0, 12),
      };
    } catch {
      /* fall through */
    }
  }

  // Cheap slack scan
  const slackRe = /slack\s*\((violated|met)\)\s*([-\d.]+)/gi;
  let m: RegExpExecArray | null;
  let minSetup = Infinity;
  let minHold = Infinity;
  while ((m = slackRe.exec(text)) !== null) {
    const val = parseFloat(m[2]);
    if (!Number.isFinite(val)) continue;
    // Heuristic: hold often near min paths — keep both min
    if (val < minSetup) minSetup = val;
    if (m[1].toLowerCase() === "violated" && val < 0) base.failingSetup++;
  }
  if (minSetup !== Infinity) base.wnsSetup = minSetup;
  if (minHold !== Infinity) base.wnsHold = minHold;

  return base;
}

// ---------------------------------------------------------------------------
// Build entry + history API
// ---------------------------------------------------------------------------

export function buildHubEntry(
  text: string,
  filename: string,
  opts?: { id?: string; vendorHint?: TimingVendor }
): ReportHubEntry {
  const originalBytes = new TextEncoder().encode(text).length;
  let body = text;
  let truncated = false;
  if (body.length > HUB_ENTRY_MAX_TEXT) {
    body = body.slice(0, HUB_ENTRY_MAX_TEXT);
    truncated = true;
  }

  const ingest = ingestReport(body, opts?.vendorHint || "auto");
  const metrics = computeHubMetrics(body, ingest);
  const target = detectHubTarget(body, ingest);
  const tags = extractTags(body, ingest, metrics, target);

  return {
    id: opts?.id || newHubId(),
    filename: filename || "report.rpt",
    savedAt: Date.now(),
    text: body,
    truncated,
    originalBytes,
    tags,
    target,
    designName: ingest.designName,
    vendor: ingest.detectedVendor,
    tool: ingest.tool,
    stage: ingest.stage,
    kind: ingest.kind,
    pathBlocks: ingest.rawBlocks.length,
    metrics,
    warnings: [
      ...ingest.warnings,
      ...(truncated
        ? [`Stored text truncated to ${HUB_ENTRY_MAX_TEXT} chars for history cap.`]
        : []),
    ],
  };
}

export function addToHubHistory(entry: ReportHubEntry): ReportHubHistory {
  const hist = loadHubHistory();
  // Replace same filename if recent duplicate
  const withoutDup = hist.entries.filter(
    (e) => !(e.filename === entry.filename && e.id !== entry.id)
  );
  const next: ReportHubHistory = {
    entries: [entry, ...withoutDup].slice(0, HUB_MAX_ENTRIES),
    savedAt: Date.now(),
  };
  saveHubHistory(next);
  return next;
}

export function openTargetHref(target: HubOpenTarget): string {
  switch (target) {
    case "timing":
      return "/vlsi/timing-studio?from_hub=true&tab=summary";
    case "sdc":
      return "/vlsi/sdc-studio?from_hub=true";
    case "power":
      return "/vlsi/power-studio?from_hub=true&tab=script";
    case "mmmc":
      return "/vlsi/mmmc-studio?from_hub=true&tab=script";
    default:
      return "/vlsi/timing-studio?from_hub=true";
  }
}

export function openEntryInStudio(entry: ReportHubEntry): string {
  saveHubTransfer({
    text: entry.text,
    filename: entry.filename,
    vendor: entry.vendor,
    designName: entry.designName,
    target: entry.target === "unknown" ? "timing" : entry.target,
    entryId: entry.id,
    timestamp: Date.now(),
  });
  return openTargetHref(entry.target === "unknown" ? "timing" : entry.target);
}

export function tagLabel(tag: ReportHubTag): string {
  const map: Record<ReportHubTag, string> = {
    timing_path: "Timing paths",
    si: "SI / noise",
    summary: "Summary",
    setup: "Setup",
    hold: "Hold",
    violations: "Violations",
    met_only: "All met",
    synthesis: "Synthesis",
    pnr: "PnR",
    signoff: "Signoff",
    synopsys: "Synopsys",
    cadence: "Cadence",
    opensta: "OpenSTA",
    sdc: "SDC",
    upf: "UPF",
    mmmc: "MMMC",
    drc: "DRC-ish",
    unknown: "Unknown",
  };
  return map[tag] || tag;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
