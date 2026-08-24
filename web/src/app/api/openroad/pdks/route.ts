import { NextRequest, NextResponse } from "next/server";
import { probePdkAvailability } from "@/lib/openroad-pdk";
import { OPENROAD_PDKS } from "@/lib/openroad-pdk-catalog";
import { toolsDiagnostics } from "@/lib/openroad-docker-tools";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List PDK presets + availability for Project / Studio UI (no host paths). */
export async function GET(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;

    const proxied = await proxyOpenroadRequest(req, "/api/openroad/pdks", {
      ownerId: gate.owner.ownerId,
      method: "GET",
    });
    if (proxied) return proxied;

    const availability = probePdkAvailability().map((a) => ({
      id: a.id,
      label: a.label,
      short: a.short,
      runner: a.runner,
      available: a.available,
      detail: a.detail, // already user-facing (no paths)
    }));

    const diag = toolsDiagnostics();
    // User-facing tools status only — no ACE_TOOLS_MODE / docker-sock details
    const toolsReady = Boolean(diag.dockerAvailable || diag.hostTools?.ok);

    return NextResponse.json({
      toolsReady,
      catalog: OPENROAD_PDKS.map((p) => ({
        id: p.id,
        label: p.label,
        short: p.short,
        description: p.description,
        runner: p.runner,
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
