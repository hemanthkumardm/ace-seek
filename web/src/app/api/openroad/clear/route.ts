import { NextRequest, NextResponse } from "next/server";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { purgeOwnerStorage, getOwnerStorageUsage } from "@/lib/openroad-gc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/openroad/clear
 * Authenticated server-side wipe of all jobs, checkpoints, and uploads for the calling tenant.
 */
export async function POST(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;
    const { owner } = gate;

    const result = purgeOwnerStorage(owner.ownerId);
    const usage = getOwnerStorageUsage(owner.ownerId);

    return NextResponse.json({
      ok: result.success,
      message: result.message,
      bytesDeleted: result.bytesDeleted,
      usage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Clear failed" },
      { status: 500 }
    );
  }
}
