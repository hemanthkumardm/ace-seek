/**
 * mflowgen-style flow checkpoints between stages.
 * Host path: $OPENROAD_JOBS_DIR/owners/<ownerId>/checkpoints/<design_slug>/
 * Contents: manifest.json + netlist + optional OpenLane run snapshot.
 */

import fs from "fs";
import path from "path";
import type { FlowStageId } from "./openroad-flow-model";
import {
  getOpenroadJobsRoot,
  ownerCheckpointsDir,
  safeOwnerId,
} from "./openroad-owner";

export interface CheckpointManifest {
  version: 1;
  designName: string;
  topModule: string;
  pdk: string;
  ownerId?: string;
  /** Last completed stage that wrote this checkpoint */
  stage: FlowStageId;
  createdAt: string;
  files: string[];
  /** Optional metrics snapshot */
  metrics?: { cellCount?: number; wireCount?: number; summary?: string };
}

export function safeDesignSlug(designName: string, top: string): string {
  const s = `${designName || "design"}_${top || "top"}`.replace(
    /[^a-zA-Z0-9_.-]+/g,
    "_"
  );
  return s.slice(0, 64);
}

export function checkpointRoot(designSlug: string, ownerId: string): string {
  return path.join(ownerCheckpointsDir(ownerId), designSlug);
}

export function checkpointExists(
  designSlug: string,
  ownerId: string
): boolean {
  const man = path.join(checkpointRoot(designSlug, ownerId), "manifest.json");
  if (fs.existsSync(man)) return true;
  try {
    const latest = path.join(ownerCheckpointsDir(ownerId), "LATEST");
    if (!fs.existsSync(latest)) return false;
    const slug = fs.readFileSync(latest, "utf8").trim();
    if (!slug || slug === designSlug) return false;
    return fs.existsSync(
      path.join(checkpointRoot(slug, ownerId), "manifest.json")
    );
  } catch {
    return false;
  }
}

export function readCheckpointManifest(
  designSlug: string,
  ownerId: string
): CheckpointManifest | null {
  try {
    const p = path.join(checkpointRoot(designSlug, ownerId), "manifest.json");
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as CheckpointManifest;
  } catch {
    return null;
  }
}

/** Resolve checkpoint dir for a design — exact slug, then per-owner LATEST */
export function resolveCheckpointInfo(
  designName: string,
  topModule: string,
  ownerId: string
): {
  exists: boolean;
  slug: string;
  path: string | null;
  stage: FlowStageId | null;
  ownerId: string;
} {
  const oid = safeOwnerId(ownerId);
  const slug = safeDesignSlug(designName, topModule);
  let man = readCheckpointManifest(slug, oid);
  let useSlug = slug;
  if (!man) {
    try {
      const latest = path.join(ownerCheckpointsDir(oid), "LATEST");
      if (fs.existsSync(latest)) {
        const alt = fs.readFileSync(latest, "utf8").trim();
        if (alt) {
          man = readCheckpointManifest(alt, oid);
          if (man) useSlug = alt;
        }
      }
    } catch {
      /* */
    }
  }
  // Legacy global checkpoint (pre-Sprint A) — local_dev only
  if (!man && oid === "local_dev") {
    try {
      const legacyRoot = path.join(getOpenroadJobsRoot(), "checkpoints");
      const legacyMan = path.join(legacyRoot, slug, "manifest.json");
      if (fs.existsSync(legacyMan)) {
        man = JSON.parse(fs.readFileSync(legacyMan, "utf8")) as CheckpointManifest;
        return {
          exists: true,
          slug,
          path: path.join(legacyRoot, slug),
          stage: man.stage ?? null,
          ownerId: oid,
        };
      }
      const latest = path.join(legacyRoot, "LATEST");
      if (fs.existsSync(latest)) {
        const alt = fs.readFileSync(latest, "utf8").trim();
        const p = path.join(legacyRoot, alt, "manifest.json");
        if (alt && fs.existsSync(p)) {
          man = JSON.parse(fs.readFileSync(p, "utf8")) as CheckpointManifest;
          return {
            exists: true,
            slug: alt,
            path: path.join(legacyRoot, alt),
            stage: man.stage ?? null,
            ownerId: oid,
          };
        }
      }
    } catch {
      /* */
    }
  }
  return {
    exists: !!man,
    slug: useSlug,
    path: man ? checkpointRoot(useSlug, oid) : null,
    stage: man?.stage ?? null,
    ownerId: oid,
  };
}

/** Write synth (or later) checkpoint to owner-scoped host path */
export function writeStageCheckpoint(opts: {
  designName: string;
  topModule: string;
  pdk: string;
  stage: FlowStageId;
  ownerId: string;
  /** Relative name → content */
  files: Record<string, string | Buffer>;
  metrics?: CheckpointManifest["metrics"];
}): { dir: string; manifest: CheckpointManifest } {
  const oid = safeOwnerId(opts.ownerId);
  const slug = safeDesignSlug(opts.designName, opts.topModule);
  const dir = checkpointRoot(slug, oid);
  fs.mkdirSync(dir, { recursive: true });
  const names: string[] = [];
  for (const [name, content] of Object.entries(opts.files)) {
    const safe = name.replace(/[^a-zA-Z0-9._/-]+/g, "_");
    const dest = path.join(dir, safe);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (typeof content === "string") fs.writeFileSync(dest, content, "utf8");
    else fs.writeFileSync(dest, content);
    names.push(safe);
  }
  const manifest: CheckpointManifest = {
    version: 1,
    designName: opts.designName,
    topModule: opts.topModule,
    pdk: opts.pdk,
    ownerId: oid,
    stage: opts.stage,
    createdAt: new Date().toISOString(),
    files: names,
    metrics: opts.metrics,
  };
  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  // Per-owner LATEST only (never global)
  fs.writeFileSync(
    path.join(ownerCheckpointsDir(oid), "LATEST"),
    slug,
    "utf8"
  );
  return { dir, manifest };
}

/** After OpenLane job, snapshot key results into checkpoint dir */
export function snapshotOpenlaneJobToCheckpoint(opts: {
  jobDir: string;
  designName: string;
  topModule: string;
  pdk: string;
  stage: FlowStageId;
  ownerId: string;
}): CheckpointManifest | null {
  const results = path.join(opts.jobDir, "results");
  const designs = path.join(opts.jobDir, "designs", "ace_design");
  const files: Record<string, string | Buffer> = {};

  const tryAdd = (abs: string, asName: string) => {
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        files[asName] = fs.readFileSync(abs);
      }
    } catch {
      /* */
    }
  };

  if (fs.existsSync(results)) {
    for (const n of fs.readdirSync(results)) {
      const lower = n.toLowerCase();
      if (
        /\.(v|def|gds|sdc|spef|rpt|log|csv)$/i.test(n) ||
        /netlist|synth|metrics|summary/i.test(lower)
      ) {
        tryAdd(path.join(results, n), `results/${n}`);
      }
    }
  }

  const runDir = path.join(designs, "runs", "ace_run");
  if (fs.existsSync(runDir)) {
    const walk = (d: string, prefix: string, depth: number) => {
      if (depth > 3) return;
      let entries: string[] = [];
      try {
        entries = fs.readdirSync(d);
      } catch {
        return;
      }
      for (const e of entries) {
        const abs = path.join(d, e);
        let st: fs.Stats;
        try {
          st = fs.statSync(abs);
        } catch {
          continue;
        }
        if (st.isDirectory()) walk(abs, `${prefix}${e}/`, depth + 1);
        else if (st.size < 5_000_000 && /\.(v|def|sdc|rpt|json|log)$/i.test(e)) {
          tryAdd(abs, `run/${prefix}${e}`);
        }
      }
    };
    walk(path.join(runDir, "results"), "results/", 0);
  }

  if (!Object.keys(files).length) return null;
  const { manifest } = writeStageCheckpoint({
    designName: opts.designName,
    topModule: opts.topModule,
    pdk: opts.pdk,
    stage: opts.stage,
    ownerId: opts.ownerId,
    files,
  });
  return manifest;
}

export function clearCheckpoint(designSlug: string, ownerId: string): void {
  const dir = checkpointRoot(designSlug, ownerId);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* */
  }
}
