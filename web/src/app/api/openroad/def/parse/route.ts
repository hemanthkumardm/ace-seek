import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DefComponent {
  id: number;
  name: string;
  cellType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  orient: string;
  status: string;
  isMacro: boolean;
}

interface DefParseResult {
  ok: boolean;
  filename: string;
  designName: string;
  unitsDbu: number;
  dieArea: { llx: number; lly: number; urx: number; ury: number; widthUm: number; heightUm: number };
  totalComponents: number;
  placedComponents: number;
  macroCount: number;
  components: DefComponent[];
  parseTimeMs: number;
}

export function parseDefText(text: string, filename = "design.def"): DefParseResult {
  const t0 = performance.now();
  let designName = "unknown_design";
  let unitsDbu = 1000.0;
  let dieArea = { llx: 0, lly: 0, urx: 1000, ury: 1000, widthUm: 1000, heightUm: 1000 };

  const components: DefComponent[] = [];
  const lines = text.split(/\r?\n/);
  let inComponents = false;
  let componentCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("DESIGN")) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) designName = parts[1].replace(";", "");
    } else if (line.startsWith("UNITS DISTANCE MICRONS")) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const u = parseFloat(parts[3]);
        if (!isNaN(u) && u > 0) unitsDbu = u;
      }
    } else if (line.startsWith("DIEAREA")) {
      // Matches: DIEAREA ( 0 0 ) ( 2600000 2600000 ) ;
      const nums = line.match(/[-]?\d+/g);
      if (nums && nums.length >= 4) {
        const llx = parseFloat(nums[0]) / unitsDbu;
        const lly = parseFloat(nums[1]) / unitsDbu;
        const urx = parseFloat(nums[2]) / unitsDbu;
        const ury = parseFloat(nums[3]) / unitsDbu;
        dieArea = {
          llx,
          lly,
          urx,
          ury,
          widthUm: Math.abs(urx - llx),
          heightUm: Math.abs(ury - lly),
        };
      }
    } else if (line.startsWith("COMPONENTS")) {
      inComponents = true;
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        componentCount = parseInt(parts[1], 10) || 0;
      }
    } else if (inComponents && line.startsWith("END COMPONENTS")) {
      inComponents = false;
    } else if (inComponents && line.startsWith("-")) {
      // - inst_name cell_type + PLACED ( x y ) orient ;
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const name = parts[1];
        const cellType = parts[2];
        let x = 0;
        let y = 0;
        let orient = "N";
        let status = "UNPLACED";

        const mPos = line.match(/\+\s*(PLACED|FIXED|COVER|UNPLACED)\s*\(\s*([-\d]+)\s+([-\d]+)\s*\)\s*([A-Za-z0-9_]+)?/);
        if (mPos) {
          status = mPos[1];
          x = parseFloat(mPos[2]) / unitsDbu;
          y = parseFloat(mPos[3]) / unitsDbu;
          orient = mPos[4] || "N";
        }

        const isMacro =
          /sram|ram|macro|mem|rom|pll|phy/i.test(cellType) ||
          /macro/i.test(name);

        // Cell dimensions: default to 2.72 row height for standard cells, or 80x80 for macros
        let w = isMacro ? 80.0 : 2.5;
        let h = isMacro ? 80.0 : 2.72;

        // Custom dimension tag if annotated in line (e.g. size=( 75.0 x 71.3 ))
        const sizeMatch = line.match(/size=\(\s*([\d.]+)\s*x\s*([\d.]+)\s*\)/i);
        if (sizeMatch) {
          w = parseFloat(sizeMatch[1]);
          h = parseFloat(sizeMatch[2]);
        }

        components.push({
          id: components.length,
          name,
          cellType,
          x,
          y,
          w,
          h,
          orient,
          status,
          isMacro,
        });
      }
    }
  }

  const t1 = performance.now();
  const placedCount = components.filter((c) => c.status !== "UNPLACED").length;
  const macroCount = components.filter((c) => c.isMacro).length;

  return {
    ok: true,
    filename,
    designName,
    unitsDbu,
    dieArea,
    totalComponents: components.length || componentCount,
    placedComponents: placedCount,
    macroCount,
    components,
    parseTimeMs: Math.round((t1 - t0) * 100) / 100,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let defText = "";
    let filename = "uploaded.def";

    if (ct.includes("application/json")) {
      const body = await req.json();
      if (body.filePath) {
        const resolved = path.resolve(body.filePath);
        if (fs.existsSync(resolved)) {
          defText = fs.readFileSync(resolved, "utf8");
          filename = path.basename(resolved);
        } else {
          return NextResponse.json({ error: `File not found: ${resolved}` }, { status: 404 });
        }
      } else if (body.text) {
        defText = body.text;
        filename = body.filename || filename;
      }
    } else {
      defText = await req.text();
      filename = req.headers.get("x-filename") || filename;
    }

    if (!defText.trim()) {
      return NextResponse.json({ error: "Empty DEF payload" }, { status: 400 });
    }

    const result = parseDefText(defText, filename);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "DEF parse error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const fileQuery = req.nextUrl.searchParams.get("preset");
  let targetPath = "/Users/hemanth/Desktop/ace-seek/artifacts/soc_100_macros_placed.def";

  if (fileQuery === "ibex") {
    targetPath = "/Users/hemanth/Desktop/ibex-sky130-openroad-tapeout/outputs/placement_top.def";
  }

  if (!fs.existsSync(targetPath)) {
    return NextResponse.json({ error: `DEF file not found: ${targetPath}` }, { status: 404 });
  }

  const defText = fs.readFileSync(targetPath, "utf8");
  const result = parseDefText(defText, path.basename(targetPath));
  return NextResponse.json(result);
}
