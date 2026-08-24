/**
 * Sprint 3 — optional S3/R2 offload for OpenLane curated results.
 * When OPENROAD_ARTIFACT_S3_BUCKET is unset, all helpers no-op / prefer local disk.
 */

import fs from "fs";
import path from "path";

export type RemoteArtifactManifest = {
  version: 1;
  bucket: string;
  prefix: string;
  uploadedAt: string;
  ownerId: string;
  jobId: string;
  files: { name: string; key: string; size: number }[];
};

export function isArtifactStoreEnabled(): boolean {
  return Boolean(process.env.OPENROAD_ARTIFACT_S3_BUCKET?.trim());
}

function bucket(): string {
  return (process.env.OPENROAD_ARTIFACT_S3_BUCKET || "").trim();
}

function prefixRoot(): string {
  const p = (process.env.OPENROAD_ARTIFACT_S3_PREFIX || "ace-openroad/").trim();
  return p.endsWith("/") ? p : `${p}/`;
}

async function getS3() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const endpoint = process.env.OPENROAD_ARTIFACT_S3_ENDPOINT?.trim() || undefined;
  const region =
    process.env.OPENROAD_ARTIFACT_S3_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    "auto";
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

function objectKey(ownerId: string, jobId: string, fileName: string): string {
  const safeOwner = ownerId.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 64);
  const safeJob = jobId.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 96);
  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${prefixRoot()}${safeOwner}/${safeJob}/${safeName}`;
}

function listCuratedFiles(jobDir: string): { abs: string; name: string }[] {
  const results = path.join(jobDir, "results");
  if (!fs.existsSync(results)) return [];
  const out: { abs: string; name: string }[] = [];
  for (const n of fs.readdirSync(results)) {
    if (!/\.(gds|gz|def|odb|v|sdc|spef|rpt|csv|log)$/i.test(n)) continue;
    const abs = path.join(results, n);
    try {
      if (!fs.statSync(abs).isFile()) continue;
      if (fs.statSync(abs).size > 500_000_000) continue; // skip >500MB
      out.push({ abs, name: n });
    } catch {
      /* */
    }
  }
  return out;
}

/** Upload curated results/ after job success. Never throws to caller. */
export async function uploadJobArtifacts(opts: {
  jobDir: string;
  ownerId: string;
  jobId: string;
}): Promise<RemoteArtifactManifest | null> {
  if (!isArtifactStoreEnabled()) return null;
  try {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3();
    const b = bucket();
    const files: RemoteArtifactManifest["files"] = [];
    for (const f of listCuratedFiles(opts.jobDir)) {
      const key = objectKey(opts.ownerId, opts.jobId, f.name);
      const body = fs.readFileSync(f.abs);
      await client.send(
        new PutObjectCommand({
          Bucket: b,
          Key: key,
          Body: body,
          ContentType: /\.gds/i.test(f.name)
            ? "application/octet-stream"
            : "text/plain; charset=utf-8",
        })
      );
      files.push({ name: f.name, key, size: body.length });
    }
    const man: RemoteArtifactManifest = {
      version: 1,
      bucket: b,
      prefix: prefixRoot(),
      uploadedAt: new Date().toISOString(),
      ownerId: opts.ownerId,
      jobId: opts.jobId,
      files,
    };
    fs.writeFileSync(
      path.join(opts.jobDir, "artifacts_remote.json"),
      JSON.stringify(man, null, 2),
      "utf8"
    );
    return man;
  } catch (e) {
    try {
      fs.appendFileSync(
        path.join(opts.jobDir, "run.log"),
        `\nACE-Seek: S3 upload failed: ${e instanceof Error ? e.message : e}\n`
      );
    } catch {
      /* */
    }
    return null;
  }
}

export function readRemoteArtifactManifest(
  jobDir: string
): RemoteArtifactManifest | null {
  try {
    const p = path.join(jobDir, "artifacts_remote.json");
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as RemoteArtifactManifest;
  } catch {
    return null;
  }
}

/** Signed GET URL for a remote artifact (or null). */
export async function signedArtifactUrl(
  jobDir: string,
  fileName: string,
  expiresInSec = 3600
): Promise<string | null> {
  if (!isArtifactStoreEnabled()) return null;
  const man = readRemoteArtifactManifest(jobDir);
  if (!man) return null;
  const entry = man.files.find(
    (f) => f.name === fileName || path.basename(f.name) === path.basename(fileName)
  );
  if (!entry) return null;
  try {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const client = await getS3();
    const cmd = new GetObjectCommand({ Bucket: man.bucket, Key: entry.key });
    return await getSignedUrl(client, cmd, { expiresIn: expiresInSec });
  } catch {
    return null;
  }
}
