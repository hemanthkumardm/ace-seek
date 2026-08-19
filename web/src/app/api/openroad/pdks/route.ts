import { NextRequest, NextResponse } from "next/server";
import { probePdkAvailability, defaultOrfsRoot, defaultPdkRoot } from "@/lib/openroad-pdk";
import { OPENROAD_PDKS } from "@/lib/openroad-pdk-catalog";
import { toolsDiagnostics } from "@/lib/openroad-docker-tools";
import { getOpenroadJobsRoot, requireOpenroadOwner } from "@/lib/openroad-owner";

/** List PDK presets + host availability + ACE_TOOLS_MODE for Project / Studio UI */
export async function GET(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;

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
