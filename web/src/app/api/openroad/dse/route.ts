import { NextRequest, NextResponse } from "next/server";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import {
  startMeasuredDse,
  pollMeasuredDse,
  defaultDseVariants,
} from "@/lib/openroad-dse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — launch measured DSE (2–3 real container jobs).
 * GET  ?dseId= — poll variants + Pareto from extracted metrics.
 */
export async function GET(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner, ent } = gate;

  const proxied = await proxyOpenroadRequest(req, "/api/openroad/dse", {
    ownerId: owner.ownerId,
    method: "GET",
  });
  if (proxied) return proxied;

  if (!ent.canOpenroadRun) {
    return NextResponse.json(
      { error: "Measured DSE requires Max (openroad run)" },
      { status: 402 }
    );
  }

  const dseId = req.nextUrl.searchParams.get("dseId");
  if (!dseId) {
    return NextResponse.json({ error: "dseId required" }, { status: 400 });
  }

  const polled = pollMeasuredDse(owner.ownerId, dseId);
  if (!polled) {
    return NextResponse.json({ error: "DSE session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    measured: true,
    note: "Pareto from extracted job metrics (not Ace-Matrix analytic model).",
    ...polled,
  });
}

export async function POST(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner, ent } = gate;

  const proxied = await proxyOpenroadRequest(req, "/api/openroad/dse", {
    ownerId: owner.ownerId,
    method: "POST",
  });
  if (proxied) return proxied;

  if (!ent.canOpenroadRun) {
    return NextResponse.json(
      { error: "Measured DSE requires Max (openroad run)" },
      { status: 402 }
    );
  }

  const body = (await req.json()) as {
    project?: OpenroadProjectState;
    openlaneConfig?: Record<string, string | number | boolean>;
    untilStage?: string;
    basePeriodNs?: number;
    densities?: number[];
  };

  if (!body.project) {
    return NextResponse.json({ error: "project required" }, { status: 400 });
  }

  const densities =
    body.densities?.filter((d) => d > 0 && d < 1).slice(0, 3) ||
    [0.45, 0.55, 0.65];
  const period = body.basePeriodNs;
  const variants = densities.map((density, i) => ({
    id: `v${i}_${String(density).replace(".", "p")}`,
    label: `Density ${density}`,
    density,
    clockPeriodNs: period,
  }));

  const { session } = startMeasuredDse({
    owner,
    project: body.project,
    openlaneConfig: {
      ...(body.openlaneConfig || {}),
      ACE_FLOW_PROFILE: body.project.flowProfile || "legacy_pnr",
    },
    untilStage: body.untilStage || "placement",
    variants: variants.length ? variants : defaultDseVariants(period),
    basePeriodNs: period,
  });

  return NextResponse.json({
    ok: true,
    measured: true,
    dseId: session.dseId,
    session,
    message: `Launched ${session.variants.length} measured jobs until ${session.untilStage}`,
  });
}
