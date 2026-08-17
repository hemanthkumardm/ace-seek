/**
 * openroad.ace-seek.com project hub — uploaded VLSI handoff files (browser localStorage).
 */

import {
  OPENROAD_HANDOFF_EVENT,
  OPENROAD_MANIFEST_NAME,
  type OpenroadManifest,
  type OpenroadPdkId,
} from "./openroad-format";

const STORAGE_KEY = "ace_openroad_project_v1";

export interface OpenroadProjectFile {
  name: string;
  content: string;
  /** bytes-ish estimate */
  size: number;
  uploadedAt: string;
  role: "sdc" | "corners" | "manifest" | "rtl" | "script" | "other";
}

export interface OpenroadProjectState {
  projectName: string;
  designName: string;
  topModule: string;
  pdk: OpenroadPdkId;
  files: OpenroadProjectFile[];
  updatedAt: string;
}

export function emptyOpenroadProject(): OpenroadProjectState {
  return {
    projectName: "openroad-project",
    designName: "design",
    topModule: "top",
    pdk: "sky130",
    files: [],
    updatedAt: new Date().toISOString(),
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function inferRole(name: string): OpenroadProjectFile["role"] {
  const n = name.toLowerCase();
  if (n === OPENROAD_MANIFEST_NAME || n.endsWith(".json")) return "manifest";
  if (n.endsWith(".sdc") || n.includes("constraint")) return "sdc";
  if (n.includes("corner") || n.includes("mmmc")) return "corners";
  if (n.endsWith(".v") || n.endsWith(".sv") || n.endsWith(".vhd")) return "rtl";
  if (n.endsWith(".tcl") || n.endsWith(".sh") || n === "makefile") return "script";
  return "other";
}

export function loadOpenroadProject(): OpenroadProjectState {
  if (!canUseStorage()) return emptyOpenroadProject();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOpenroadProject();
    const parsed = JSON.parse(raw) as OpenroadProjectState;
    if (!parsed || !Array.isArray(parsed.files)) return emptyOpenroadProject();
    return {
      ...emptyOpenroadProject(),
      ...parsed,
      files: parsed.files.map((f) => ({
        ...f,
        role: f.role || inferRole(f.name),
        size: f.size ?? f.content?.length ?? 0,
      })),
    };
  } catch {
    return emptyOpenroadProject();
  }
}

export function saveOpenroadProject(state: OpenroadProjectState): void {
  if (!canUseStorage()) return;
  try {
    const next = { ...state, updatedAt: new Date().toISOString() };
    // Cap ~2MB total text
    const json = JSON.stringify(next);
    if (json.length > 2_000_000) {
      console.warn("OpenROAD project too large for localStorage");
      return;
    }
    localStorage.setItem(STORAGE_KEY, json);
    window.dispatchEvent(new Event(OPENROAD_HANDOFF_EVENT));
  } catch {
    /* ignore */
  }
}

export function clearOpenroadProject(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(OPENROAD_HANDOFF_EVENT));
  } catch {
    /* ignore */
  }
}

export function upsertProjectFile(
  state: OpenroadProjectState,
  name: string,
  content: string
): OpenroadProjectState {
  const role = inferRole(name);
  const file: OpenroadProjectFile = {
    name,
    content,
    size: content.length,
    uploadedAt: new Date().toISOString(),
    role,
  };
  const files = state.files.filter(
    (f) => f.name.toLowerCase() !== name.toLowerCase()
  );
  files.push(file);

  let designName = state.designName;
  let topModule = state.topModule;
  let pdk = state.pdk;

  if (role === "manifest") {
    try {
      const m = JSON.parse(content) as OpenroadManifest;
      if (m.designName) designName = m.designName;
      if (m.topModule) topModule = m.topModule;
      if (m.pdk) pdk = m.pdk;
    } catch {
      /* ignore */
    }
  }

  return {
    ...state,
    designName,
    topModule,
    pdk,
    projectName: state.projectName || designName,
    files,
  };
}

export function getFileByRole(
  state: OpenroadProjectState,
  role: OpenroadProjectFile["role"]
): OpenroadProjectFile | undefined {
  return state.files.find((f) => f.role === role);
}

export function projectHealth(state: OpenroadProjectState): {
  hasSdc: boolean;
  hasCorners: boolean;
  hasManifest: boolean;
  hasRtl: boolean;
  readyForScripts: boolean;
  score: number;
  hints: string[];
} {
  const hasSdc = state.files.some((f) => f.role === "sdc");
  const hasCorners = state.files.some((f) => f.role === "corners");
  const hasManifest = state.files.some((f) => f.role === "manifest");
  const hasRtl = state.files.some((f) => f.role === "rtl");
  const hints: string[] = [];
  if (!hasSdc) hints.push("Upload constraints.sdc from VLSI OpenROAD handoff");
  if (!hasCorners)
    hints.push("Optional: corners.tcl from VLSI MMMC → OpenROAD export");
  if (!hasRtl)
    hints.push("Optional: upload RTL (.v/.sv) for full Yosys→OpenROAD packs");
  if (!hasManifest)
    hints.push("Optional: ace-seek-openroad.json for design/PDK metadata");

  let score = 0;
  if (hasSdc) score += 50;
  if (hasCorners) score += 20;
  if (hasRtl) score += 20;
  if (hasManifest) score += 10;

  return {
    hasSdc,
    hasCorners,
    hasManifest,
    hasRtl,
    readyForScripts: hasSdc,
    score,
    hints,
  };
}
