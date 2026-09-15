import { NextRequest, NextResponse } from "next/server";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import {
  startEqyJob,
  readEqyJob,
  whichEqy,
  type EqyMode,
} from "@/lib/openroad-eqy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?eqyId= — poll EQY job. Without id: report whether eqy is on PATH. */
export async function GET(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner, ent } = gate;

  const proxied = await proxyOpenroadRequest(req, "/api/openroad/eqy", {
    ownerId: owner.ownerId,
    method: "GET",
  });
  if (proxied) return proxied;

  if (!ent.canOpenroadRun) {
    return NextResponse.json(
      { error: "EQY jobs require Max (openroad run)" },
      { status: 402 }
    );
  }

  const eqyId = req.nextUrl.searchParams.get("eqyId");
  if (!eqyId) {
    const bin = whichEqy();
    return NextResponse.json({
      ok: true,
      eqyAvailable: Boolean(bin),
      eqyPath: bin,
      note: bin
        ? "eqy found — Studio can run fail-closed LEC jobs."
        : "eqy not on PATH — export pack + make lec-* locally, or enable AceForge ACE_FORGE_LEC when eqy is in the image.",
    });
  }

  const job = readEqyJob(owner.ownerId, eqyId);
  if (!job) {
    return NextResponse.json({ error: "EQY job not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, job });
}

/** POST { project, mode? } — start fail-closed EQY job */
export async function POST(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner, ent } = gate;

  const proxied = await proxyOpenroadRequest(req, "/api/openroad/eqy", {
    ownerId: owner.ownerId,
    method: "POST",
  });
  if (proxied) return proxied;

  if (!ent.canOpenroadRun) {
    return NextResponse.json(
      { error: "EQY jobs require Max (openroad run)" },
      { status: 402 }
    );
  }

  const body = (await req.json()) as {
    project?: OpenroadProjectState;
    mode?: EqyMode;
  };
  if (!body.project) {
    return NextResponse.json({ error: "project required" }, { status: 400 });
  }

  const job = startEqyJob({
    ownerId: owner.ownerId,
    project: body.project,
    mode: body.mode || "rtl_vs_synth",
  });

  return NextResponse.json({
    ok: true,
    job,
    message: job.message,
  });
}
