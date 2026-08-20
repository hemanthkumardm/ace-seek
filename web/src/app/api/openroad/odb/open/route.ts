import { NextRequest, NextResponse } from "next/server";
import type { FlowStageId } from "@/lib/openroad-flow-model";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import {
  findLatestJobDir,
  findStageOdb,
  startOpenroadOdbGui,
  validateOdbReadable,
} from "@/lib/openroad-odb-viewer";
import {
  pathUnderOwner,
  requireOpenroadOwner,
  resolveOwnedJobDir,
} from "@/lib/openroad-owner";
import path from "path";

/**
 * POST { stage?, jobId?, odbPath?, designHint? }
 * Opens stage ODB (or explicit path) in Docker OpenROAD GUI.
 * Sprint A: only ODBs under the caller's owner tree.
 */
export async function POST(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;
    const { owner } = gate;

    const body = (await req.json()) as {
      stage?: FlowStageId | string;
      jobId?: string;
      odbPath?: string;
      designHint?: string;
    };

    const proxied = await proxyOpenroadRequest(req, "/api/openroad/odb/open", {
      ownerId: owner.ownerId,
      body,
      method: "POST",
    });
    if (proxied) return proxied;

    let odbAbs: string | null = null;
    let label = "";

    if (body.odbPath) {
      odbAbs = path.resolve(body.odbPath);
      if (!pathUnderOwner(odbAbs, owner.ownerId)) {
        return NextResponse.json(
          {
            error:
              "odbPath must be under your owner job/upload tree (cross-tenant paths blocked)",
          },
          { status: 403 }
        );
      }
      label = path.basename(odbAbs);
    } else {
      let jobDir: string | null = null;
      if (body.jobId) {
        jobDir = resolveOwnedJobDir(owner.ownerId, body.jobId);
      }
      if (!jobDir) {
        jobDir = findLatestJobDir(owner.ownerId, body.designHint);
      }
      if (!jobDir) {
        return NextResponse.json(
          {
            error:
              "No OpenLane job directory found. Run Floorplan/Placement first, or upload an ODB.",
          },
          { status: 404 }
        );
      }
      const stage = body.stage || "placement";
      const found = findStageOdb(jobDir, stage);
      if (!found) {
        return NextResponse.json(
          {
            error: `No ODB for stage '${stage}' under ${jobDir}. Finish that stage first.`,
            jobDir,
          },
          { status: 404 }
        );
      }
      odbAbs = found.path;
      label = found.label;
    }

    const check = validateOdbReadable(odbAbs);
    if (!check.ok) {
      return NextResponse.json(
        {
          error: check.message,
          odb: odbAbs,
          label,
          hint: "ODB on disk is unreadable (truncated upload or version mismatch).",
        },
        { status: 422 }
      );
    }

    const hostHeader = req.headers.get("host") || undefined;
    const result = startOpenroadOdbGui(odbAbs, owner, hostHeader);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, ...result },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ...result,
      label,
      validated: check.message,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "odb open failed" },
      { status: 500 }
    );
  }
}
