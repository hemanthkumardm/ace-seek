import { NextRequest, NextResponse } from "next/server";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";
import { stopOpenroadOdbGui } from "@/lib/openroad-odb-viewer";
import { requireOpenroadOwner } from "@/lib/openroad-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/openroad/odb/close
 * Body: { sessionId: string }
 * Gracefully shuts down the dedicated Xvfb display, VNC server, websockify, and OpenROAD GUI container.
 */
export async function POST(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;
    const { owner } = gate;

    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: string;
    };

    const proxied = await proxyOpenroadRequest(req, "/api/openroad/odb/close", {
      ownerId: owner.ownerId,
      body,
      method: "POST",
    });
    if (proxied) return proxied;

    if (!body.sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const closed = stopOpenroadOdbGui(body.sessionId);
    return NextResponse.json({
      ok: true,
      sessionId: body.sessionId,
      closed,
      message: `OpenROAD GUI session ${body.sessionId} closed and resources reclaimed.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "odb close failed" },
      { status: 500 }
    );
  }
}
