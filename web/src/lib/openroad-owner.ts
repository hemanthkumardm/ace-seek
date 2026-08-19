/**
 * Sprint A — multi-tenant OpenROAD isolation (EC2-ready).
 *
 * Layout under OPENROAD_JOBS_DIR:
 *   owners/<ownerId>/jobs/<jobOrPersistSlug>/
 *   owners/<ownerId>/checkpoints/<designSlug>/
 *   owners/<ownerId>/checkpoints/LATEST
 *   owners/<ownerId>/uploads/<uploadId>/
 *
 * Production: OPENROAD_JOBS_DIR must be set to a durable path (not /tmp).
 */

import { createHash } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { verifyIssuedApiKey } from "@/lib/api-keys";
import { entitlementsFromApiKey } from "@/lib/entitlements";

const OWNER_META = "owner.json";

export type OpenroadOwner = {
  ownerId: string;
  email?: string;
  name?: string;
  /** How identity was resolved */
  source: "issued_key" | "key_hash" | "local_dev";
};

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Durable jobs root — fail closed in production if missing / under /tmp */
export function getOpenroadJobsRoot(): string {
  const env = process.env.OPENROAD_JOBS_DIR?.trim();
  if (isProd()) {
    if (!env) {
      throw new Error(
        "OPENROAD_JOBS_DIR must be set in production (e.g. /data/ace-openroad-jobs on EC2 EBS)"
      );
    }
    const resolved = path.resolve(env);
    if (resolved === "/tmp" || resolved.startsWith("/tmp/")) {
      throw new Error(
        `OPENROAD_JOBS_DIR must not be under /tmp in production (got ${resolved})`
      );
    }
    return resolved;
  }
  return env || path.join(os.tmpdir(), "ace-openroad-jobs");
}

export function safeOwnerId(raw: string): string {
  return (raw || "anonymous")
    .replace(/[^a-zA-Z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "anonymous";
}

/** Extract API key from request (header preferred; query deprecated) */
export function apiKeyFromRequest(req: Request | NextRequest): string {
  const h =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  if (h.trim()) return h.trim();
  try {
    const url = new URL(req.url);
    return (url.searchParams.get("apiKey") || "").trim();
  } catch {
    return "";
  }
}

/**
 * Resolve stable owner id for isolation.
 * Issued Clerk/HMAC keys → real userId; otherwise hash of key; empty+dev → local_dev.
 */
export function resolveOpenroadOwner(apiKey: string): OpenroadOwner | null {
  const key = (apiKey || "").trim();
  if (!key) {
    if (!isProd()) {
      return { ownerId: "local_dev", name: "Local Developer", source: "local_dev" };
    }
    return null;
  }
  const issued = verifyIssuedApiKey(key);
  if (issued.ok) {
    return {
      ownerId: safeOwnerId(issued.userId),
      source: "issued_key",
    };
  }
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 24);
  return {
    ownerId: safeOwnerId(`key_${hash}`),
    name: "api-key-user",
    source: "key_hash",
  };
}

export function ownerRoot(ownerId: string): string {
  return path.join(getOpenroadJobsRoot(), "owners", safeOwnerId(ownerId));
}

export function ownerJobsDir(ownerId: string): string {
  return path.join(ownerRoot(ownerId), "jobs");
}

export function ownerCheckpointsDir(ownerId: string): string {
  return path.join(ownerRoot(ownerId), "checkpoints");
}

export function ownerUploadsDir(ownerId: string): string {
  return path.join(ownerRoot(ownerId), "uploads");
}

export function ownerJobDir(ownerId: string, jobOrSlug: string): string {
  const safe = jobOrSlug.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 96);
  return path.join(ownerJobsDir(ownerId), safe);
}

export function writeOwnerMeta(
  jobDir: string,
  owner: OpenroadOwner,
  extra?: Record<string, unknown>
): void {
  fs.mkdirSync(jobDir, { recursive: true });
  const meta = {
    ownerId: owner.ownerId,
    source: owner.source,
    email: owner.email || null,
    name: owner.name || null,
    createdAt: new Date().toISOString(),
    ...extra,
  };
  fs.writeFileSync(
    path.join(jobDir, OWNER_META),
    JSON.stringify(meta, null, 2),
    "utf8"
  );
}

export function readOwnerMeta(
  jobDir: string
): { ownerId: string } | null {
  try {
    const p = path.join(jobDir, OWNER_META);
    if (!fs.existsSync(p)) return null;
    const j = JSON.parse(fs.readFileSync(p, "utf8")) as { ownerId?: string };
    if (!j.ownerId) return null;
    return { ownerId: j.ownerId };
  } catch {
    return null;
  }
}

/** True if jobDir belongs to owner (via owner.json). */
export function jobDirOwnedBy(jobDir: string, ownerId: string): boolean {
  const meta = readOwnerMeta(jobDir);
  if (!meta) return false;
  return meta.ownerId === safeOwnerId(ownerId);
}

/**
 * Resolve a job directory for an owner. Prefer namespaced path;
 * optionally allow legacy flat dir only for local_dev migration read.
 */
export function resolveOwnedJobDir(
  ownerId: string,
  jobId: string
): string | null {
  const oid = safeOwnerId(ownerId);
  const safe = jobId.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 96);
  const modern = path.join(ownerJobsDir(oid), safe);
  if (fs.existsSync(modern)) {
    const metaPath = path.join(modern, OWNER_META);
    // Under owner tree: accept if meta matches, or meta not written yet (mid-create)
    if (!fs.existsSync(metaPath) || jobDirOwnedBy(modern, oid)) {
      return modern;
    }
    // Meta exists but wrong owner — refuse
    return null;
  }
  // Legacy flat layout — only for local_dev single-tenant migration
  if (oid === "local_dev") {
    const legacy = path.join(getOpenroadJobsRoot(), safe);
    if (fs.existsSync(legacy)) return legacy;
  }
  return null;
}

/** True if absPath is inside this owner's tree (jobs / checkpoints / uploads). */
export function pathUnderOwner(absPath: string, ownerId: string): boolean {
  const root = path.resolve(ownerRoot(ownerId));
  const abs = path.resolve(absPath);
  return abs === root || abs.startsWith(root + path.sep);
}

/** Require OpenROAD access + resolve owner — use in API routes */
export function requireOpenroadOwner(
  req: NextRequest,
  opts?: { needRun?: boolean }
):
  | { owner: OpenroadOwner; ent: ReturnType<typeof entitlementsFromApiKey>; apiKey: string }
  | NextResponse {
  let jobsRootOk = true;
  let jobsRootErr = "";
  try {
    getOpenroadJobsRoot();
  } catch (e) {
    jobsRootOk = false;
    jobsRootErr = e instanceof Error ? e.message : "OPENROAD_JOBS_DIR invalid";
  }
  if (!jobsRootOk) {
    return NextResponse.json({ error: jobsRootErr }, { status: 503 });
  }

  const apiKey = apiKeyFromRequest(req);
  const ent = entitlementsFromApiKey(apiKey);
  if (!ent.canAccessOpenroad) {
    return NextResponse.json(
      { error: "OpenROAD access required", tier: ent.tier },
      { status: 403 }
    );
  }
  if (opts?.needRun && !ent.canOpenroadRun) {
    return NextResponse.json(
      { error: "OpenROAD Run requires Max (or Team).", tier: ent.tier },
      { status: 403 }
    );
  }
  const owner = resolveOpenroadOwner(apiKey);
  if (!owner) {
    return NextResponse.json(
      { error: "Sign in or provide a valid x-api-key" },
      { status: 401 }
    );
  }
  return {
    owner: {
      ...owner,
      email: owner.email || ent.email,
      name: owner.name || ent.name,
    },
    ent,
    apiKey,
  };
}

export function mapKey(ownerId: string, jobId: string): string {
  return `${safeOwnerId(ownerId)}::${jobId}`;
}
