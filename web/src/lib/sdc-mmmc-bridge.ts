/**
 * B1.8 — Deep SDC Studio ↔ MMMC constraint-mode link.
 *
 * - Named SDC project packs (registry)
 * - Transfer SDC → bind/create MMMC modes with clocks + file names
 * - Pull mode SDC back into SDC Studio for edit
 * - Auto-apply helpers for deep links (?import_sdc=true)
 */

import {
  type ConstraintMode,
  type MmmcState,
  createConstraintMode,
  newId,
} from "./mmmc-engine";
import {
  type SdcStudioState,
  allClockNames,
  generateSdcCode,
  normalizeSdcState,
  parseSdcText,
} from "./sdc-engine";

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

export const SDC_TRANSFER_KEY = "ace_seek_sdc_transfer";
export const SDC_PROJECT_REGISTRY_KEY = "ace_seek_sdc_project_registry";
export const SDC_PULL_KEY = "ace_seek_sdc_pull_from_mmmc";
export const MMMC_MODE_SNAPSHOT_KEY = "ace_seek_mmmc_mode_snapshot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SdcProjectPack {
  id: string;
  /** Logical mode / pack name (e.g. func, test) */
  name: string;
  /** Filename used in create_constraint_mode -sdc_files */
  fileName: string;
  sdcText: string;
  /** Optional full SDC studio JSON for lossless re-open */
  sdcStateJson?: string;
  clockNames: string[];
  clockCount: number;
  /** Primary clock period if available */
  primaryPeriodNs?: number;
  designName?: string;
  vendor?: string;
  savedAt: number;
  source: "sdc-studio" | "import" | "mmmc-inline";
}

export interface SdcProjectRegistry {
  projects: SdcProjectPack[];
  activeId?: string;
  savedAt: number;
}

/** One-shot transfer from SDC → MMMC (deep link) */
export interface SdcTransferPayload {
  sdcText: string;
  timestamp: number;
  clockCount: number;
  clockNames?: string[];
  primaryPeriodNs?: number;
  /** Preferred constraint mode name */
  modeName?: string;
  /** Preferred SDC filename for -sdc_files */
  fileName?: string;
  projectId?: string;
  sdcStateJson?: string;
  designName?: string;
  vendor?: string;
  /** auto | create | bind */
  action?: "auto" | "create" | "bind";
  /** Explicit mode id when binding */
  targetModeId?: string;
}

/** MMMC → SDC Studio open-for-edit */
export interface SdcPullPayload {
  sdcText: string;
  modeName: string;
  modeId?: string;
  sdcFiles?: string[];
  sdcProjectId?: string;
  sdcStateJson?: string;
  timestamp: number;
}

export interface MmmcModeSnapshot {
  modes: Array<{
    id: string;
    name: string;
    sdcFiles: string[];
    hasSdcText: boolean;
    clockCount: number;
    clockNames: string[];
    sdcProjectId?: string;
  }>;
  savedAt: number;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveSdcTransfer(payload: SdcTransferPayload): boolean {
  if (!canUseStorage()) return false;
  try {
    localStorage.setItem(SDC_TRANSFER_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadSdcTransfer(): SdcTransferPayload | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SDC_TRANSFER_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SdcTransferPayload;
    if (!p?.sdcText) return null;
    return p;
  } catch {
    return null;
  }
}

export function clearSdcTransfer(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(SDC_TRANSFER_KEY);
  } catch {
    /* ignore */
  }
}

export function saveSdcProjectRegistry(reg: SdcProjectRegistry): boolean {
  if (!canUseStorage()) return false;
  try {
    // Cap roughly: drop oldest if huge
    let projects = reg.projects;
    while (JSON.stringify(projects).length > 1_200_000 && projects.length > 1) {
      projects = projects.slice(1);
    }
    localStorage.setItem(
      SDC_PROJECT_REGISTRY_KEY,
      JSON.stringify({ ...reg, projects, savedAt: Date.now() })
    );
    return true;
  } catch {
    return false;
  }
}

export function loadSdcProjectRegistry(): SdcProjectRegistry | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SDC_PROJECT_REGISTRY_KEY);
    if (!raw) return null;
    const reg = JSON.parse(raw) as SdcProjectRegistry;
    if (!reg || !Array.isArray(reg.projects)) return null;
    return reg;
  } catch {
    return null;
  }
}

export function upsertSdcProject(
  pack: SdcProjectPack,
  reg?: SdcProjectRegistry | null
): SdcProjectRegistry {
  const base = reg || loadSdcProjectRegistry() || { projects: [], savedAt: 0 };
  const idx = base.projects.findIndex(
    (p) => p.id === pack.id || (p.name === pack.name && p.fileName === pack.fileName)
  );
  const projects = [...base.projects];
  if (idx >= 0) projects[idx] = pack;
  else projects.push(pack);
  const next: SdcProjectRegistry = {
    projects,
    activeId: pack.id,
    savedAt: Date.now(),
  };
  saveSdcProjectRegistry(next);
  return next;
}

export function saveSdcPull(payload: SdcPullPayload): boolean {
  if (!canUseStorage()) return false;
  try {
    localStorage.setItem(SDC_PULL_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadSdcPull(): SdcPullPayload | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SDC_PULL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SdcPullPayload;
    if (!p) return null;
    return p;
  } catch {
    return null;
  }
}

export function clearSdcPull(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(SDC_PULL_KEY);
  } catch {
    /* ignore */
  }
}

export function saveMmmcModeSnapshot(state: MmmcState): boolean {
  if (!canUseStorage()) return false;
  try {
    const snap: MmmcModeSnapshot = {
      modes: state.constraintModes.map((m) => ({
        id: m.id,
        name: m.name,
        sdcFiles: m.sdcFiles,
        hasSdcText: !!(m.sdcText && m.sdcText.trim()),
        clockCount: m.clockCount ?? m.clockNames?.length ?? 0,
        clockNames: m.clockNames || [],
        sdcProjectId: m.sdcProjectId,
      })),
      savedAt: Date.now(),
    };
    localStorage.setItem(MMMC_MODE_SNAPSHOT_KEY, JSON.stringify(snap));
    return true;
  } catch {
    return false;
  }
}

export function loadMmmcModeSnapshot(): MmmcModeSnapshot | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(MMMC_MODE_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MmmcModeSnapshot;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Build packs from SDC studio state
// ---------------------------------------------------------------------------

export function summarizeFromSdcState(state: SdcStudioState): {
  clockNames: string[];
  clockCount: number;
  primaryPeriodNs?: number;
} {
  const s = normalizeSdcState(state);
  const clockNames = allClockNames(s);
  const primaryPeriodNs = s.primaryClocks[0]?.periodNs;
  return {
    clockNames,
    clockCount: clockNames.length,
    primaryPeriodNs,
  };
}

export function summarizeFromSdcText(sdcText: string): {
  clockNames: string[];
  clockCount: number;
  primaryPeriodNs?: number;
  state: SdcStudioState;
} {
  const state = normalizeSdcState(parseSdcText(sdcText || ""));
  const meta = summarizeFromSdcState(state);
  return { ...meta, state };
}

export function buildSdcProjectPack(opts: {
  state: SdcStudioState;
  sdcText?: string;
  name?: string;
  fileName?: string;
  vendor?: string;
  designName?: string;
  id?: string;
  source?: SdcProjectPack["source"];
}): SdcProjectPack {
  const s = normalizeSdcState(opts.state);
  const meta = summarizeFromSdcState(s);
  const name = (opts.name || "func").replace(/[^\w\-]+/g, "_") || "func";
  const fileName =
    opts.fileName ||
    (name.endsWith(".sdc") ? name : `constraints_${name}.sdc`);
  const sdcText =
    opts.sdcText ||
    generateSdcCode(s, (opts.vendor as "synopsys" | "cadence") || "synopsys");

  return {
    id: opts.id || newId("sdcproj"),
    name,
    fileName,
    sdcText,
    sdcStateJson: JSON.stringify(s),
    clockNames: meta.clockNames,
    clockCount: meta.clockCount,
    primaryPeriodNs: meta.primaryPeriodNs,
    designName: opts.designName,
    vendor: opts.vendor,
    savedAt: Date.now(),
    source: opts.source || "sdc-studio",
  };
}

export function buildTransferFromPack(
  pack: SdcProjectPack,
  action: SdcTransferPayload["action"] = "auto",
  targetModeId?: string
): SdcTransferPayload {
  return {
    sdcText: pack.sdcText,
    timestamp: Date.now(),
    clockCount: pack.clockCount,
    clockNames: pack.clockNames,
    primaryPeriodNs: pack.primaryPeriodNs,
    modeName: pack.name,
    fileName: pack.fileName,
    projectId: pack.id,
    sdcStateJson: pack.sdcStateJson,
    designName: pack.designName,
    vendor: pack.vendor,
    action,
    targetModeId,
  };
}

// ---------------------------------------------------------------------------
// Bind pack → constraint mode
// ---------------------------------------------------------------------------

export function bindSdcPackToMode(
  mode: ConstraintMode,
  pack: SdcProjectPack
): ConstraintMode {
  const files = [...new Set([...(mode.sdcFiles || []), pack.fileName])].filter(
    Boolean
  );
  return {
    ...mode,
    sdcFiles: files.length ? files : [pack.fileName],
    sdcText: pack.sdcText,
    sdcProjectId: pack.id,
    sdcSource: "studio",
    clockNames: pack.clockNames,
    clockCount: pack.clockCount,
    linkedAt: Date.now(),
  };
}

export function createModeFromSdcPack(pack: SdcProjectPack): ConstraintMode {
  return createConstraintMode({
    id: newId("cm"),
    name: pack.name,
    sdcFiles: [pack.fileName],
    sdcText: pack.sdcText,
    sdcProjectId: pack.id,
    sdcSource: "studio",
    clockNames: pack.clockNames,
    clockCount: pack.clockCount,
    linkedAt: Date.now(),
  });
}

export function packFromTransfer(transfer: SdcTransferPayload): SdcProjectPack {
  const fromText = summarizeFromSdcText(transfer.sdcText);
  const name = transfer.modeName || "func";
  const fileName =
    transfer.fileName ||
    (name.endsWith(".sdc") ? name : `constraints_${name}.sdc`);
  return {
    id: transfer.projectId || newId("sdcproj"),
    name,
    fileName,
    sdcText: transfer.sdcText,
    sdcStateJson: transfer.sdcStateJson || JSON.stringify(fromText.state),
    clockNames: transfer.clockNames?.length
      ? transfer.clockNames
      : fromText.clockNames,
    clockCount: transfer.clockCount || fromText.clockCount,
    primaryPeriodNs: transfer.primaryPeriodNs ?? fromText.primaryPeriodNs,
    designName: transfer.designName,
    vendor: transfer.vendor,
    savedAt: transfer.timestamp || Date.now(),
    source: "sdc-studio",
  };
}

export interface ApplySdcTransferResult {
  state: MmmcState;
  modeId: string;
  modeName: string;
  action: "created" | "bound" | "updated";
  pack: SdcProjectPack;
}

/**
 * Apply SDC transfer to MMMC state:
 * - action create → always new mode
 * - action bind + targetModeId → bind that mode
 * - action auto:
 *   - 0 modes → create
 *   - 1 mode → bind
 *   - N modes + modeName match → bind match
 *   - else create (unique name if collision)
 */
export function applySdcTransferToMmmc(
  state: MmmcState,
  transfer: SdcTransferPayload
): ApplySdcTransferResult {
  const pack = packFromTransfer(transfer);
  const action = transfer.action || "auto";

  if (action === "bind" && transfer.targetModeId) {
    const modes = state.constraintModes.map((m) =>
      m.id === transfer.targetModeId ? bindSdcPackToMode(m, pack) : m
    );
    const mode = modes.find((m) => m.id === transfer.targetModeId);
    if (mode) {
      return {
        state: { ...state, constraintModes: modes },
        modeId: mode.id,
        modeName: mode.name,
        action: "bound",
        pack,
      };
    }
  }

  if (action === "create") {
    let name = pack.name;
    const existing = new Set(state.constraintModes.map((m) => m.name));
    if (existing.has(name)) {
      let i = 2;
      while (existing.has(`${name}_${i}`)) i++;
      name = `${name}_${i}`;
    }
    const mode = createModeFromSdcPack({ ...pack, name });
    return {
      state: {
        ...state,
        constraintModes: [...state.constraintModes, mode],
      },
      modeId: mode.id,
      modeName: mode.name,
      action: "created",
      pack,
    };
  }

  // auto
  if (state.constraintModes.length === 0) {
    const mode = createModeFromSdcPack(pack);
    return {
      state: { ...state, constraintModes: [mode] },
      modeId: mode.id,
      modeName: mode.name,
      action: "created",
      pack,
    };
  }

  if (state.constraintModes.length === 1) {
    const only = state.constraintModes[0];
    const bound = bindSdcPackToMode(only, pack);
    return {
      state: { ...state, constraintModes: [bound] },
      modeId: bound.id,
      modeName: bound.name,
      action: "bound",
      pack,
    };
  }

  // Match by mode name
  const byName = state.constraintModes.find(
    (m) => m.name === pack.name || m.name === transfer.modeName
  );
  if (byName) {
    const modes = state.constraintModes.map((m) =>
      m.id === byName.id ? bindSdcPackToMode(m, pack) : m
    );
    return {
      state: { ...state, constraintModes: modes },
      modeId: byName.id,
      modeName: byName.name,
      action: "bound",
      pack,
    };
  }

  // Create with unique name
  let name = pack.name;
  const existing = new Set(state.constraintModes.map((m) => m.name));
  if (existing.has(name)) {
    let i = 2;
    while (existing.has(`${name}_${i}`)) i++;
    name = `${name}_${i}`;
  }
  const mode = createModeFromSdcPack({ ...pack, name });
  return {
    state: {
      ...state,
      constraintModes: [...state.constraintModes, mode],
    },
    modeId: mode.id,
    modeName: mode.name,
    action: "created",
    pack,
  };
}

/** Build pull payload so SDC Studio can open a mode's constraints for edit */
export function buildSdcPullFromMode(mode: ConstraintMode): SdcPullPayload {
  return {
    sdcText: mode.sdcText || "",
    modeName: mode.name,
    modeId: mode.id,
    sdcFiles: mode.sdcFiles,
    sdcProjectId: mode.sdcProjectId,
    timestamp: Date.now(),
  };
}

/** Apply pull into SDC studio state (prefer full JSON if present) */
export function applySdcPullToStudio(
  pull: SdcPullPayload
): { state: SdcStudioState; modeName: string } {
  if (pull.sdcStateJson) {
    try {
      const parsed = normalizeSdcState(JSON.parse(pull.sdcStateJson));
      return { state: parsed, modeName: pull.modeName };
    } catch {
      /* fall through */
    }
  }
  return {
    state: normalizeSdcState(parseSdcText(pull.sdcText || "")),
    modeName: pull.modeName,
  };
}

/** Lint helpers for linked modes */
export function lintSdcModeLinks(state: MmmcState): Array<{
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  recommendation: string;
}> {
  const msgs: Array<{
    id: string;
    severity: "error" | "warning" | "info";
    message: string;
    recommendation: string;
  }> = [];

  state.constraintModes.forEach((cm) => {
    if (cm.sdcSource === "studio" && !cm.sdcText?.trim()) {
      msgs.push({
        id: `sdc_link_empty_${cm.id}`,
        severity: "warning",
        message: `Mode '${cm.name}' is linked to SDC Studio but has no constraint text`,
        recommendation: "Re-attach from SDC Studio or paste SDC into the mode.",
      });
    }
    if (cm.sdcText?.trim() && (cm.clockCount ?? 0) === 0) {
      const meta = summarizeFromSdcText(cm.sdcText);
      if (meta.clockCount === 0) {
        msgs.push({
          id: `sdc_no_clocks_${cm.id}`,
          severity: "warning",
          message: `Mode '${cm.name}' SDC has no create_clock / create_generated_clock`,
          recommendation: "Open in SDC Studio and define primary clocks for this mode.",
        });
      }
    }
    if (cm.sdcProjectId && !cm.sdcFiles.length) {
      msgs.push({
        id: `sdc_no_file_${cm.id}`,
        severity: "info",
        message: `Mode '${cm.name}' has project link but no -sdc_files entry`,
        recommendation: "Set a filename like constraints_func.sdc for Innovus MMMC.",
      });
    }
  });

  return msgs;
}
