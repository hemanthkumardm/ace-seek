import { NextRequest, NextResponse } from "next/server";
import { entitlementsFromApiKey } from "@/lib/entitlements";
import { buildOpenroadFlowScripts } from "@/lib/openroad-scripts-engine";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";

/**
 * Pro: build flow script file list (JSON). Zip is client-side for now.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      apiKey?: string;
      project?: OpenroadProjectState;
    };
    const apiKey =
      body.apiKey ||
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";

    const ent = entitlementsFromApiKey(apiKey);
    if (!ent.canAccessOpenroad || !ent.canOpenroadScripts) {
      return NextResponse.json(
        { error: "OpenROAD Scripts require Pro+.", tier: ent.tier },
        { status: 403 }
      );
    }

    if (!body.project) {
      return NextResponse.json({ error: "project required" }, { status: 400 });
    }

    const pack = buildOpenroadFlowScripts(body.project);
    return NextResponse.json({
      ok: true,
      files: pack.files.map((f) => ({
        filename: f.filename,
        bytes: f.content.length,
      })),
      // Full content for small packs
      contents: pack.files,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
