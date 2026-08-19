/**
 * Server-side PDK resolution + availability (Node fs).
 */

import fs from "fs";
import path from "path";
import os from "os";
import {
  OPENROAD_PDKS,
  getPdkDef,
  type OpenroadPdkDef,
  type OpenroadPdkId,
  type PdkRunnerKind,
} from "./openroad-pdk-catalog";

export type {
  OpenroadPdkId,
  OpenroadPdkDef,
  PdkRunnerKind,
} from "./openroad-pdk-catalog";
export { OPENROAD_PDKS, getPdkDef, isOpenroadPdkId } from "./openroad-pdk-catalog";

export function defaultPdkRoot(): string {
  return process.env.PDK_ROOT || path.join(os.homedir(), ".volare");
}

export function defaultOrfsRoot(): string {
  return process.env.OPENROAD_FLOW_ROOT || process.env.ORFS_ROOT || "";
}

export function resolveOpenlanePdkName(
  pdkId: string,
  pdkRoot?: string
): { pdkName: string | null; path: string | null; reason?: string } {
  const def = getPdkDef(pdkId);
  if (def.runner !== "openlane" || !def.openlanePdk) {
    return {
      pdkName: null,
      path: null,
      reason: `${def.id} is not an OpenLane open_pdks target (${def.runner})`,
    };
  }
  const root = pdkRoot || defaultPdkRoot();
  const candidates = [def.openlanePdk, ...(def.openlanePdkAlts || [])];
  for (const name of candidates) {
    const p = path.join(root, name);
    try {
      if (fs.existsSync(p)) return { pdkName: name, path: p };
    } catch {
      /* */
    }
  }
  return {
    pdkName: def.openlanePdk,
    path: null,
    reason: `PDK not found under ${root} (tried ${candidates.join(", ")}). ${def.installHint}`,
  };
}

export function resolveOrfsPlatform(
  pdkId: string,
  orfsRoot?: string
): { platform: string | null; path: string | null; reason?: string } {
  const def = getPdkDef(pdkId);
  if (def.runner !== "orfs" || !def.orfsPlatform) {
    return {
      platform: null,
      path: null,
      reason: `${def.id} is not an ORFS platform target`,
    };
  }
  const root = orfsRoot || defaultOrfsRoot();
  if (!root) {
    return {
      platform: def.orfsPlatform,
      path: null,
      reason: `Set OPENROAD_FLOW_ROOT to OpenROAD-flow-scripts. ${def.installHint}`,
    };
  }
  const p = path.join(root, "platforms", def.orfsPlatform);
  try {
    if (fs.existsSync(p)) return { platform: def.orfsPlatform, path: p };
  } catch {
    /* */
  }
  return {
    platform: def.orfsPlatform,
    path: null,
    reason: `ORFS platform missing: ${p}. ${def.installHint}`,
  };
}

export interface PdkAvailability {
  id: OpenroadPdkId;
  label: string;
  short: string;
  runner: PdkRunnerKind;
  available: boolean;
  detail: string;
  openlanePdk: string | null;
  orfsPlatform: string | null;
  installHint: string;
}

export function probePdkAvailability(): PdkAvailability[] {
  const pdkRoot = defaultPdkRoot();
  const orfsRoot = defaultOrfsRoot();
  return OPENROAD_PDKS.map((def) => {
    if (def.runner === "scripts_only") {
      return {
        id: def.id,
        label: def.label,
        short: def.short,
        runner: def.runner,
        available: true,
        detail: "Scripts only — always selectable",
        openlanePdk: null,
        orfsPlatform: null,
        installHint: def.installHint,
      };
    }
    if (def.runner === "openlane") {
      const r = resolveOpenlanePdkName(def.id, pdkRoot);
      return {
        id: def.id,
        label: def.label,
        short: def.short,
        runner: def.runner,
        available: !!r.path,
        detail: r.path ? `Installed: ${r.path}` : r.reason || "Not installed",
        openlanePdk: def.openlanePdk,
        orfsPlatform: def.orfsPlatform,
        installHint: def.installHint,
      };
    }
    const r = resolveOrfsPlatform(def.id, orfsRoot);
    return {
      id: def.id,
      label: def.label,
      short: def.short,
      runner: def.runner,
      available: !!r.path,
      detail: r.path
        ? `ORFS platform: ${r.path}`
        : r.reason || "ORFS not configured",
      openlanePdk: null,
      orfsPlatform: def.orfsPlatform,
      installHint: def.installHint,
    };
  });
}

/**
 * Map project pdk id → concrete env for Docker / ORFS (never silently force sky130).
 */
export function resolveRunnerPdk(projectPdk: string): {
  ok: boolean;
  pdkId: OpenroadPdkId;
  def: OpenroadPdkDef;
  openlanePdk: string | null;
  pdkRoot: string;
  orfsRoot: string;
  orfsPlatform: string | null;
  error?: string;
  warnings: string[];
} {
  const def = getPdkDef(projectPdk);
  const pdkRoot = defaultPdkRoot();
  const orfsRoot = defaultOrfsRoot();
  const warnings: string[] = [];

  if (def.runner === "scripts_only") {
    return {
      ok: false,
      pdkId: def.id,
      def,
      openlanePdk: null,
      pdkRoot,
      orfsRoot,
      orfsPlatform: null,
      error:
        "PDK 'generic' is for Pro script packs only — pick sky130/sky130B/gf180mcu for Max OpenLane, or asap7/nangate45 with ORFS.",
      warnings,
    };
  }

  if (def.runner === "openlane") {
    const r = resolveOpenlanePdkName(def.id, pdkRoot);
    if (!r.path) {
      return {
        ok: false,
        pdkId: def.id,
        def,
        openlanePdk: r.pdkName,
        pdkRoot,
        orfsRoot,
        orfsPlatform: def.orfsPlatform,
        error: r.reason,
        warnings,
      };
    }
    return {
      ok: true,
      pdkId: def.id,
      def,
      openlanePdk: r.pdkName,
      pdkRoot,
      orfsRoot,
      orfsPlatform: def.orfsPlatform,
      warnings,
    };
  }

  const r = resolveOrfsPlatform(def.id, orfsRoot);
  if (!r.path) {
    return {
      ok: false,
      pdkId: def.id,
      def,
      openlanePdk: null,
      pdkRoot,
      orfsRoot,
      orfsPlatform: r.platform,
      error: r.reason,
      warnings,
    };
  }
  return {
    ok: true,
    pdkId: def.id,
    def,
    openlanePdk: null,
    pdkRoot,
    orfsRoot,
    orfsPlatform: r.platform,
    warnings,
  };
}
