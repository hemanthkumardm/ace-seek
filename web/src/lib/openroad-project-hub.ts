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

/** Normalize zip/upload paths: strip leading ./ and junk parent folders */
export function normalizeProjectPath(name: string): string {
  let n = name.replace(/\\/g, "/").replace(/^\.?\//, "");
  // drop single top-level folder wrapper from zips (e.g. template/rtl/top.v → rtl/top.v)
  const parts = n.split("/").filter(Boolean);
  if (
    parts.length >= 2 &&
    !/^(rtl|tb|src|sim|constraints?)$/i.test(parts[0]) &&
    !/\.(v|sv|sdc|json|tcl|md|vcd)$/i.test(parts[0])
  ) {
    // keep if second segment is a known dir
    if (/^(rtl|tb|src|sim)$/i.test(parts[1])) {
      n = parts.slice(1).join("/");
    } else if (parts.length === 2 && /\.(v|sv|sdc|json|tcl|md)$/i.test(parts[1])) {
      n = parts[1];
    }
  }
  return n;
}

function inferRole(name: string): OpenroadProjectFile["role"] {
  const n = name.toLowerCase();
  const base = n.split("/").pop() || n;
  if (base === "ace-seek-flow.json") return "manifest";
  if (base === OPENROAD_MANIFEST_NAME) return "manifest";
  if (n.endsWith(".sdc") || base.includes("constraint")) return "sdc";
  if (n.includes("corner") || n.includes("mmmc")) return "corners";
  // testbench files still rtl role (stage runner keys off path/name)
  if (n.includes("/tb/") || base.startsWith("tb_") || /\/tb_/i.test(n))
    return "rtl";
  if (n.endsWith(".v") || n.endsWith(".sv") || n.endsWith(".vhd")) return "rtl";
  if (n.endsWith(".vcd")) return "other";
  if (n.endsWith(".json")) return "manifest";
  if (n.endsWith(".tcl") || n.endsWith(".sh") || base === "makefile") return "script";
  return "other";
}

export function getFlowConfigFile(
  state: OpenroadProjectState
): OpenroadProjectFile | undefined {
  return state.files.find(
    (f) =>
      f.name.toLowerCase() === "ace-seek-flow.json" ||
      f.name.toLowerCase().endsWith("/ace-seek-flow.json")
  );
}

export function getTestbenchFiles(state: OpenroadProjectState): OpenroadProjectFile[] {
  return state.files.filter((f) => {
    const n = f.name.toLowerCase();
    const base = n.split("/").pop() || n;
    return (
      n.includes("/tb/") ||
      base.startsWith("tb_") ||
      (base.startsWith("tb") && base.endsWith(".v"))
    );
  });
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
  const path = normalizeProjectPath(name);
  const role = inferRole(path);
  const file: OpenroadProjectFile = {
    name: path,
    content,
    size: content.length,
    uploadedAt: new Date().toISOString(),
    role,
  };
  const files = state.files.filter(
    (f) => f.name.toLowerCase() !== path.toLowerCase()
  );
  files.push(file);

  let designName = state.designName;
  let topModule = state.topModule;
  let pdk = state.pdk;

  if (role === "manifest") {
    try {
      const m = JSON.parse(content) as OpenroadManifest & {
        designName?: string;
        topModule?: string;
        pdk?: OpenroadPdkId;
      };
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
  hasFlowConfig: boolean;
  hasRtl: boolean;
  hasTb: boolean;
  readyForScripts: boolean;
  score: number;
  hints: string[];
} {
  const hasSdc = state.files.some((f) => f.role === "sdc");
  const hasCorners = state.files.some((f) => f.role === "corners");
  const hasFlowConfig = !!getFlowConfigFile(state);
  const hasManifest =
    hasFlowConfig ||
    state.files.some(
      (f) =>
        f.role === "manifest" &&
        f.name.toLowerCase().includes("openroad")
    );
  const hasRtl = state.files.some(
    (f) =>
      f.role === "rtl" &&
      !/\/tb\//i.test(f.name) &&
      !/^tb_/i.test(f.name.split("/").pop() || "")
  );
  const hasTb = getTestbenchFiles(state).length > 0;
  const hints: string[] = [];
  if (!hasSdc) hints.push("Upload constraints.sdc from VLSI handoff or template");
  if (!hasRtl) hints.push("Upload RTL (.v/.sv) — or download the Ace-Seek template");
  if (!hasTb)
    hints.push("Optional for sim: testbench as tb_*.v or under tb/");
  if (!hasFlowConfig)
    hints.push("Optional: ace-seek-flow.json stage configs (template includes it)");
  if (!hasCorners)
    hints.push("Optional: corners.tcl from VLSI MMMC → OpenROAD export");

  let score = 0;
  if (hasSdc) score += 40;
  if (hasRtl) score += 25;
  if (hasTb) score += 10;
  if (hasFlowConfig) score += 15;
  if (hasCorners) score += 10;

  return {
    hasSdc,
    hasCorners,
    hasManifest,
    hasFlowConfig,
    hasRtl,
    hasTb,
    readyForScripts: hasSdc || hasRtl,
    score: Math.min(100, score),
    hints,
  };
}
