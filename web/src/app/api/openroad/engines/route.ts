import { NextRequest, NextResponse } from "next/server";
import { spawnSync } from "child_process";
import path from "path";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EngineInfo = {
  name: string;
  available: boolean;
  description: string;
  tier: string;
  status: string;
  studio: string;
};

/** Catalog always returned (honest labels) even if Python registry fails on Vercel. */
const FALLBACK_ENGINES: EngineInfo[] = [
  {
    name: "macro_placer",
    available: true,
    description:
      "Ace-AutoMacro: electrostatic macro placement, legalization, halos, flightline/RUDY.",
    tier: "max",
    status: "production",
    studio:
      "Runs inside OpenLane floorplan when hard macros are present (ACE_AUTOMACRO=1).",
  },
  {
    name: "openlane_docker",
    available: true,
    description: "Hosted OpenLane Docker PnR (synth → GDS) — primary Studio path.",
    tier: "max",
    status: "production",
    studio: "POST /api/openroad/run mode=container",
  },
  {
    name: "ppa_optimizer",
    available: true,
    description:
      "Ace-Matrix PPA grid sweep — analytic/model DSE (not a live OpenLane multi-run).",
    tier: "max",
    status: "model_dse",
    studio: "Offline/model exploration only. Does not replace container PnR signoff.",
  },
  {
    name: "matrix_sweeper",
    available: true,
    description: "Parallel parameter sweeper used by PPAOptimizer (simulated PPA model).",
    tier: "max",
    status: "model_dse",
    studio: "Library used by ppa_optimizer — not a standalone Studio job.",
  },
  {
    name: "eqy_lec",
    available: true,
    description: "EQY formal LEC — export-pack / AceFlow fail-closed; Studio shows script preview only.",
    tier: "max",
    status: "production",
    studio: "Not run inside Studio UI — make lec-* locally or AceFlow with eqy on PATH.",
  },
  {
    name: "timing_optimizer",
    available: false,
    description: "Setup/hold slack repair (NOT SHIPPED — stub).",
    tier: "max",
    status: "stub",
    studio: "Unavailable. Use OpenLane/OpenSTA or AceFlow ECO script generator.",
  },
  {
    name: "congestion_resolver",
    available: false,
    description: "Standalone congestion resolver (NOT SHIPPED — stub).",
    tier: "max",
    status: "stub",
    studio: "Unavailable. Flightline/RUDY is inside Ace-AutoMacro today.",
  },
];

function probePythonRegistry(): EngineInfo[] | null {
  try {
    const repoRoot = path.resolve(process.cwd(), "..");
    const webRoot = process.cwd();
    // On Vercel, workers/ may not be next to web — try both
    const candidates = [repoRoot, path.join(webRoot, ".."), webRoot];
    for (const root of candidates) {
      const r = spawnSync(
        "python3",
        [
          "-c",
          "import json,sys; sys.path.insert(0,'.'); from workers.engines.registry import list_engines; print(json.dumps(list_engines()))",
        ],
        {
          cwd: root,
          encoding: "utf-8",
          timeout: 8000,
          env: { ...process.env, PYTHONPATH: root },
        }
      );
      if (r.status === 0 && r.stdout?.trim()) {
        const parsed = JSON.parse(r.stdout.trim()) as EngineInfo[];
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * GET /api/openroad/engines — honest engine availability for Studio.
 */
export async function GET(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;

    const proxied = await proxyOpenroadRequest(req, "/api/openroad/engines", {
      ownerId: gate.owner.ownerId,
      method: "GET",
    });
    if (proxied) return proxied;

    const fromPy = probePythonRegistry();
    const engines = fromPy?.length ? mergeWithCloudSpine(fromPy) : FALLBACK_ENGINES;

    return NextResponse.json({
      ok: true,
      source: fromPy ? "python_registry" : "fallback_catalog",
      cloudSpine: "OpenLane Docker (mode=container) is the production PnR path.",
      engines,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "engines probe failed",
        engines: FALLBACK_ENGINES,
        source: "fallback_catalog",
      },
      { status: 200 }
    );
  }
}

function mergeWithCloudSpine(list: EngineInfo[]): EngineInfo[] {
  const names = new Set(list.map((e) => e.name));
  const out = [...list];
  for (const extra of FALLBACK_ENGINES) {
    if (!names.has(extra.name)) out.push(extra);
  }
  return out;
}
