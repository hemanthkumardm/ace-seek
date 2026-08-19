import { NextRequest, NextResponse } from "next/server";
import { probePdkAvailability, defaultOrfsRoot, defaultPdkRoot } from "@/lib/openroad-pdk";
import { OPENROAD_PDKS } from "@/lib/openroad-pdk-catalog";
import { toolsDiagnostics } from "@/lib/openroad-docker-tools";
import { getOpenroadJobsRoot, requireOpenroadOwner } from "@/lib/openroad-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List PDK presets + host availability + ACE_TOOLS_MODE for Project / Studio UI */
export async function GET(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;

    const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
    const externalOpenroadUrl = (
      process.env.OPENROAD_API_URL ||
      process.env.DOC_COMPILER_API_URL ||
      process.env.BACKEND_API_URL ||
      process.env.EC2_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL
    )?.replace(/\/$/, "");

    if (externalOpenroadUrl && (!process.env.AIC_FORCE_LOCAL || isVercel)) {
      try {
        const targetUrl = new URL(`${externalOpenroadUrl}/api/openroad/pdks`);
        req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));
        const res = await fetch(targetUrl.toString(), {
          headers: {
            ...(req.headers.get("x-api-key") ? { "x-api-key": req.headers.get("x-api-key")! } : {}),
            ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
          },
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err) {
        /* fallback to local evaluation */
      }
    }

    let jobsRoot: string | null = null;
    let jobsRootError: string | null = null;
    try {
      jobsRoot = getOpenroadJobsRoot();
    } catch (e) {
      jobsRootError = e instanceof Error ? e.message : "OPENROAD_JOBS_DIR invalid";
    }

    const availability = probePdkAvailability();
    const isPrivileged = gate.ent.tier === "team" || gate.ent.tier === "max";

    const diag = toolsDiagnostics();
    return NextResponse.json({
      pdkRoot: isPrivileged ? defaultPdkRoot() : "[configured]",
      orfsRoot: isPrivileged ? (defaultOrfsRoot() || null) : null,
      jobsRoot: isPrivileged ? jobsRoot : (jobsRoot ? "[active]" : null),
      jobsRootError,
      tools: {
        mode: diag.effectiveMode,
        reason: diag.reason,
        docker: diag.dockerAvailable,
        hostOk: diag.hostTools.ok,
      },
      catalog: OPENROAD_PDKS.map((p) => ({
        id: p.id,
        label: p.label,
        short: p.short,
        description: p.description,
        runner: p.runner,
        openlanePdk: p.openlanePdk,
        orfsPlatform: p.orfsPlatform,
        installHint: p.installHint,
      })),
      availability,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "pdk probe failed" },
      { status: 500 }
    );
  }
}
