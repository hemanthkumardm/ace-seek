import { NextRequest, NextResponse } from "next/server";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import {
  runOpenroadGarbageCollection,
  getOwnerStorageUsage,
  checkOwnerStorageQuota,
} from "@/lib/openroad-gc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/openroad/gc
 * Returns caller storage usage and quota metrics.
 */
export async function GET(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;
    const { owner, ent } = gate;

    // Quotas: Max/Team: 25GB, Pro: 10GB, Free/Trial: 2GB
    const quotaBytes =
      ent.tier === "team" || ent.tier === "max"
        ? 25 * 1024 * 1024 * 1024
        : ent.tier === "pro"
          ? 10 * 1024 * 1024 * 1024
          : 2 * 1024 * 1024 * 1024;

    const quotaInfo = checkOwnerStorageQuota(owner.ownerId, quotaBytes);

    return NextResponse.json({
      ok: true,
      ownerId: owner.ownerId,
      tier: ent.tier,
      usage: quotaInfo.usage,
      quotaBytes: quotaInfo.quotaBytes,
      quotaFormatted: quotaInfo.quotaFormatted,
      allowed: quotaInfo.allowed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed getting storage info" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/openroad/gc
 * Triggers storage garbage collection (prunes expired runs & uploads).
 */
export async function POST(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;
    const { owner, ent } = gate;

    const body = (await req.json().catch(() => ({}))) as {
      dryRun?: boolean;
      jobMaxAgeHours?: number;
      uploadMaxAgeHours?: number;
      allOwners?: boolean;
    };

    // Only team / internal admin can run host-wide GC across all owners
    const isTeam = ent.tier === "team" || ent.tier === "max";
    const targetOwnerId = body.allOwners && isTeam ? undefined : owner.ownerId;

    const report = runOpenroadGarbageCollection({
      dryRun: Boolean(body.dryRun),
      targetOwnerId,
      jobMaxAgeHours: body.jobMaxAgeHours,
      uploadMaxAgeHours: body.uploadMaxAgeHours,
    });

    const currentUsage = getOwnerStorageUsage(owner.ownerId);

    return NextResponse.json({
      ok: true,
      report,
      currentUsage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GC execution failed" },
      { status: 500 }
    );
  }
}
