/**
 * Sprint B — OpenROAD Storage Garbage Collection (GC) & Quota Enforcement.
 *
 * Automatically manages disk footprint under $OPENROAD_JOBS_DIR/owners/<ownerId>/:
 * 1. Prunes inactive (done/failed) jobs older than OPENROAD_JOB_RETENTION_HOURS (default: 72h).
 * 2. Prunes temporary ODB uploads older than OPENROAD_UPLOAD_RETENTION_HOURS (default: 24h).
 * 3. Never deletes active (queued, preparing, running, collecting) jobs.
 * 4. Computes per-owner disk storage metrics and enforces tenant quotas.
 */

import fs from "fs";
import path from "path";
import {
  getOpenroadJobsRoot,
  ownerRoot,
  ownerJobsDir,
  ownerUploadsDir,
  ownerCheckpointsDir,
  safeOwnerId,
  readOwnerMeta,
} from "./openroad-owner";
import { abortOpenroadJob } from "./openroad-docker-runner";

export type StorageUsage = {
  ownerId: string;
  totalBytes: number;
  totalFormatted: string;
  jobsCount: number;
  uploadsCount: number;
  checkpointsCount: number;
  lastUpdated: string;
};

export type GCOptions = {
  dryRun?: boolean;
  targetOwnerId?: string;
  jobMaxAgeHours?: number;
  uploadMaxAgeHours?: number;
};

export type GCReport = {
  timestamp: string;
  dryRun: boolean;
  scannedOwners: number;
  prunedJobs: number;
  prunedUploads: number;
  reclaimedBytes: number;
  reclaimedFormatted: string;
  errors: string[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getDirSize(dirPath: string): number {
  let size = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          size += getDirSize(fullPath);
        } else if (entry.isFile()) {
          size += fs.statSync(fullPath).size;
        }
      } catch {
        /* ignore unreadable files */
      }
    }
  } catch {
    return 0;
  }
  return size;
}

export function getOwnerStorageUsage(ownerId: string): StorageUsage {
  const oid = safeOwnerId(ownerId);
  const root = ownerRoot(oid);
  let totalBytes = 0;
  let jobsCount = 0;
  let uploadsCount = 0;
  let checkpointsCount = 0;

  try {
    if (fs.existsSync(root)) {
      totalBytes = getDirSize(root);

      const jDir = ownerJobsDir(oid);
      if (fs.existsSync(jDir)) {
        jobsCount = fs.readdirSync(jDir).filter((f) => {
          try {
            return fs.statSync(path.join(jDir, f)).isDirectory();
          } catch {
            return false;
          }
        }).length;
      }

      const uDir = ownerUploadsDir(oid);
      if (fs.existsSync(uDir)) {
        uploadsCount = fs.readdirSync(uDir).length;
      }

      const cDir = ownerCheckpointsDir(oid);
      if (fs.existsSync(cDir)) {
        checkpointsCount = fs.readdirSync(cDir).filter((f) => f !== "LATEST").length;
      }
    }
  } catch {
    /* fallback to zeroes */
  }

  return {
    ownerId: oid,
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    jobsCount,
    uploadsCount,
    checkpointsCount,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Checks if tenant is within quota before creating large allocations.
 * Defaults: Free (500MB), Pro (5GB), Max/Team (25GB).
 */
/** Soft quotas by plan — pay more = keep more silicon on disk. */
export function quotaBytesForTier(tier?: string): number {
  const envOverride = Number(process.env.OPENROAD_OWNER_QUOTA_GB);
  if (Number.isFinite(envOverride) && envOverride > 0) {
    return Math.floor(envOverride * 1024 * 1024 * 1024);
  }
  switch ((tier || "").toLowerCase()) {
    case "team":
    case "max":
      return 25 * 1024 * 1024 * 1024;
    case "pro":
      return 10 * 1024 * 1024 * 1024;
    case "free":
    case "guest":
    default:
      return 2 * 1024 * 1024 * 1024;
  }
}

export function checkOwnerStorageQuota(
  ownerId: string,
  quotaBytes: number = 5 * 1024 * 1024 * 1024
): { allowed: boolean; usage: StorageUsage; quotaBytes: number; quotaFormatted: string } {
  const usage = getOwnerStorageUsage(ownerId);
  return {
    allowed: usage.totalBytes < quotaBytes,
    usage,
    quotaBytes,
    quotaFormatted: formatBytes(quotaBytes),
  };
}

/**
 * Run Garbage Collection across owner directories.
 */
export function runOpenroadGarbageCollection(opts?: GCOptions): GCReport {
  const now = Date.now();
  const dryRun = Boolean(opts?.dryRun);
  const jobMaxAgeMs = (opts?.jobMaxAgeHours ?? Number(process.env.OPENROAD_JOB_RETENTION_HOURS || 72)) * 3600 * 1000;
  const uploadMaxAgeMs = (opts?.uploadMaxAgeHours ?? Number(process.env.OPENROAD_UPLOAD_RETENTION_HOURS || 24)) * 3600 * 1000;

  let scannedOwners = 0;
  let prunedJobs = 0;
  let prunedUploads = 0;
  let reclaimedBytes = 0;
  const errors: string[] = [];

  try {
    const jobsRoot = getOpenroadJobsRoot();
    const ownersBase = path.join(jobsRoot, "owners");
    if (!fs.existsSync(ownersBase)) {
      return {
        timestamp: new Date().toISOString(),
        dryRun,
        scannedOwners: 0,
        prunedJobs: 0,
        prunedUploads: 0,
        reclaimedBytes: 0,
        reclaimedFormatted: "0 B",
        errors: [],
      };
    }

    const ownerDirs = opts?.targetOwnerId
      ? [safeOwnerId(opts.targetOwnerId)]
      : fs.readdirSync(ownersBase);

    for (const oid of ownerDirs) {
      const oRoot = path.join(ownersBase, oid);
      try {
        if (!fs.statSync(oRoot).isDirectory()) continue;
      } catch {
        continue;
      }
      scannedOwners += 1;

      // 1. Prune old inactive jobs
      const jDir = path.join(oRoot, "jobs");
      if (fs.existsSync(jDir)) {
        try {
          const jobEntries = fs.readdirSync(jDir);
          for (const jName of jobEntries) {
            const jPath = path.join(jDir, jName);
            try {
              const st = fs.statSync(jPath);
              if (!st.isDirectory()) continue;

              const statusFile = path.join(jPath, "status.json");
              let isFinished = true;
              let fileTime = st.mtimeMs;

              if (fs.existsSync(statusFile)) {
                try {
                  const statJson = JSON.parse(fs.readFileSync(statusFile, "utf8"));
                  const phase = String(statJson.status || "");
                  if (phase === "queued" || phase === "preparing" || phase === "running" || phase === "collecting") {
                    isFinished = false;
                  }
                  if (statJson.updatedAt) {
                    fileTime = new Date(statJson.updatedAt).getTime();
                  }
                } catch {
                  /* fallback to mtime */
                }
              }

              if (isFinished && now - fileTime > jobMaxAgeMs) {
                const sz = getDirSize(jPath);
                if (!dryRun) {
                  fs.rmSync(jPath, { recursive: true, force: true });
                }
                prunedJobs += 1;
                reclaimedBytes += sz;
              }
            } catch (err) {
              errors.push(`Failed inspecting job ${jPath}: ${String(err)}`);
            }
          }
        } catch (err) {
          errors.push(`Failed reading jobs dir ${jDir}: ${String(err)}`);
        }
      }

      // 2. Prune old temporary uploads
      const uDir = path.join(oRoot, "uploads");
      if (fs.existsSync(uDir)) {
        try {
          const uploadEntries = fs.readdirSync(uDir);
          for (const uName of uploadEntries) {
            const uPath = path.join(uDir, uName);
            try {
              const st = fs.statSync(uPath);
              if (now - st.mtimeMs > uploadMaxAgeMs) {
                const sz = st.isDirectory() ? getDirSize(uPath) : st.size;
                if (!dryRun) {
                  fs.rmSync(uPath, { recursive: true, force: true });
                }
                prunedUploads += 1;
                reclaimedBytes += sz;
              }
            } catch (err) {
              errors.push(`Failed inspecting upload ${uPath}: ${String(err)}`);
            }
          }
        } catch (err) {
          errors.push(`Failed reading uploads dir ${uDir}: ${String(err)}`);
        }
      }
    }
  } catch (err) {
    errors.push(`GC root error: ${String(err)}`);
  }

  return {
    timestamp: new Date().toISOString(),
    dryRun,
    scannedOwners,
    prunedJobs,
    prunedUploads,
    reclaimedBytes,
    reclaimedFormatted: formatBytes(reclaimedBytes),
    errors,
  };
}

/**
 * Completely wipe all jobs, checkpoints, and uploads for an owner.
 * Triggered on user "Clear all / Reset" action.
 */
export function purgeOwnerStorage(ownerId: string): { success: boolean; bytesDeleted: number; message: string } {
  const oid = safeOwnerId(ownerId);
  const root = ownerRoot(oid);

  if (!fs.existsSync(root)) {
    return { success: true, bytesDeleted: 0, message: "Storage already empty." };
  }

  const bytesDeleted = getDirSize(root);

  try {
    // 1. Purge jobs
    const jDir = ownerJobsDir(oid);
    if (fs.existsSync(jDir)) {
      const entries = fs.readdirSync(jDir);
      for (const e of entries) {
        abortOpenroadJob(e);
      }
      fs.rmSync(jDir, { recursive: true, force: true });
      fs.mkdirSync(jDir, { recursive: true });
    }

    // 2. Purge checkpoints
    const cDir = ownerCheckpointsDir(oid);
    if (fs.existsSync(cDir)) {
      fs.rmSync(cDir, { recursive: true, force: true });
      fs.mkdirSync(cDir, { recursive: true });
    }

    // 3. Purge uploads
    const uDir = ownerUploadsDir(oid);
    if (fs.existsSync(uDir)) {
      fs.rmSync(uDir, { recursive: true, force: true });
      fs.mkdirSync(uDir, { recursive: true });
    }

    return {
      success: true,
      bytesDeleted,
      message: `Cleared ${formatBytes(bytesDeleted)} of tenant data.`,
    };
  } catch (err) {
    return {
      success: false,
      bytesDeleted: 0,
      message: `Failed to clear storage: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
