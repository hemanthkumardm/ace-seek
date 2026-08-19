/**
 * Lightweight DEF geometry parse for Studio chip snapshots.
 * Source of truth for "Result" mode after floorplan+ (not synthetic cells).
 */

export type ChipSnapshotMode = "intent" | "result" | "empty";

export interface DefBox {
  llx: number;
  lly: number;
  urx: number;
  ury: number;
}

export type DefCellRole = "endcap" | "tap" | "decap" | "std" | "other";

export interface DefComponent {
  name: string;
  master: string;
  x: number;
  y: number;
  orient: string;
  role: DefCellRole;
}

export interface DefPin {
  name: string;
  x: number;
  y: number;
  direction: "INPUT" | "OUTPUT" | "INOUT" | "UNKNOWN";
}

/** SPECIALNETS PDN strap / followpin segment (µm) */
export interface DefPdnSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  layer: string;
  widthUm: number;
  net: string;
}

export interface DefGeometry {
  unitsMicrons: number;
  die: DefBox;
  core: DefBox | null;
  /** Sampled for display (may be subset of componentCount) */
  components: DefComponent[];
  pins: DefPin[];
  /** Power mesh from SPECIALNETS (sampled) */
  pdn: DefPdnSeg[];
  componentCount: number;
  pinCount: number;
  pdnCount: number;
  counts: { endcap: number; tap: number; decap: number; other: number };
  /** True if parser truncated components for UI */
  sampled: boolean;
  sourceNote: string;
}

export function classifyDefCellRole(
  name: string,
  master: string
): DefCellRole {
  const s = `${name} ${master}`.toLowerCase();
  if (/phy_edge|endcap|end_cap|welltap.*edge/.test(s)) return "endcap";
  if (/tapvpwr|tapvgnd|tapcell|tap_tap|__tap|tap_/.test(s)) return "tap";
  if (/decap|filler|fill_/.test(s)) return "decap";
  if (/^_|^u\d|sky130|gf180|asap7|hd__|hs__/.test(s)) return "std";
  return "other";
}

function dbuToUm(v: number, units: number): number {
  return units > 0 ? v / units : v;
}

/**
 * Parse DIEAREA, UNITS, COMPONENTS (sampled), PINS, and approximate CORE from rows.
 * Line-based scan only — never uses nested [\s\S]*? (avoids catastrophic backtracking).
 */
export function parseDefGeometry(
  defText: string,
  opts?: { maxCells?: number }
): DefGeometry | null {
  if (!defText?.trim()) return null;
  // Cap parse cost on huge DEFs
  const maxChars = 8_000_000;
  const text =
    defText.length > maxChars ? defText.slice(0, maxChars) : defText;

  let units = 1000;
  const unitsM = text.match(/UNITS\s+DISTANCE\s+MICRONS\s+(\d+)\s*;/i);
  if (unitsM) units = parseInt(unitsM[1], 10) || 1000;

  const dieM = text.match(
    /DIEAREA\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)\s*;/i
  );
  if (!dieM) return null;

  const die: DefBox = {
    llx: dbuToUm(parseFloat(dieM[1]), units),
    lly: dbuToUm(parseFloat(dieM[2]), units),
    urx: dbuToUm(parseFloat(dieM[3]), units),
    ury: dbuToUm(parseFloat(dieM[4]), units),
  };
  if (!(die.urx > die.llx && die.ury > die.lly)) return null;

  let core: DefBox | null = null;
  const coreM = text.match(
    /COREAREA\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)\s*;/i
  );
  if (coreM) {
    core = {
      llx: dbuToUm(parseFloat(coreM[1]), units),
      lly: dbuToUm(parseFloat(coreM[2]), units),
      urx: dbuToUm(parseFloat(coreM[3]), units),
      ury: dbuToUm(parseFloat(coreM[4]), units),
    };
  }

  // Spatial sample across the die (not "first N only" — that clusters one edge)
  const maxEndcap = 1028;
  const maxTap = 2400;
  const maxDecap = 600;
  const maxOther = 1200; // placed stdcells after placement
  const maxPdn = 4000;
  // Expected totals for stride (sky130-ish); refined as we see more
  const expect = { endcap: 1100, tap: 28000, decap: 2000, other: 12000 };
  const components: DefComponent[] = [];
  const pins: DefPin[] = [];
  const pdn: DefPdnSeg[] = [];
  let componentCount = 0;
  let pinCount = 0;
  let pdnCount = 0;
  let sampled = false;
  const kept = { endcap: 0, tap: 0, decap: 0, other: 0 };
  const seenRole = { endcap: 0, tap: 0, decap: 0, other: 0 };

  // Section flags + pending multi-line component/pin
  let section: "none" | "components" | "pins" | "specialnets" = "none";
  let pendingComp: { name: string; master: string } | null = null;
  let pendingPin: {
    name: string;
    direction: DefPin["direction"];
  } | null = null;
  let currentPdnNet = "";
  let rowMinX = Infinity;
  let rowMinY = Infinity;
  let rowMaxX = -Infinity;
  let rowMaxY = -Infinity;
  let rows = 0;

  const placeRe =
    /\+\s*(?:PLACED|FIXED|COVER)\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)\s*(\w+)?/i;
  const placeLooseRe =
    /(?:PLACED|FIXED|COVER)\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)\s*(\w+)?/i;
  const startCompRe = /^\s*-\s+(\S+)\s+(\S+)/;
  const startPinRe = /^\s*-\s+(\S+)/;
  const rowRe =
    /^ROW\s+\S+\s+\S+\s+([-\d.]+)\s+([-\d.]+)\s+\w+\s+DO\s+(\d+)\s+BY\s+(\d+)\s+STEP\s+([-\d.]+)\s+([-\d.]+)/i;
  // SPECIALNETS: "+ ROUTED met1 480 + SHAPE FOLLOWPIN ( x1 y1 ) ( x2 y2 )"
  // or "NEW met4 1600 + SHAPE STRIPE ( x1 y1 ) ( x2 y2 )"
  const pdnSegRe =
    /(?:\+?\s*ROUTED|NEW)\s+(\w+)\s+(\d+)\s+(?:\+\s*SHAPE\s+\w+\s+)?\(\s*([-\d.]+)\s+([-\d.]+)\s*\)\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i;

  const tryKeepComp = (
    name: string,
    master: string,
    x: number,
    y: number,
    orient: string
  ) => {
    const role = classifyDefCellRole(name, master);
    const bucket =
      role === "endcap"
        ? "endcap"
        : role === "tap"
          ? "tap"
          : role === "decap"
            ? "decap"
            : "other";
    seenRole[bucket]++;
    const limit =
      bucket === "endcap"
        ? maxEndcap
        : bucket === "tap"
          ? maxTap
          : bucket === "decap"
            ? maxDecap
            : maxOther;
    // Stride from the start so samples spread across the whole die.
    // Endcaps are few (~1k) — keep almost all (stride 1).
    const stride =
      bucket === "endcap"
        ? 1
        : Math.max(1, Math.ceil(expect[bucket] / Math.max(1, limit)));
    if ((seenRole[bucket] - 1) % stride !== 0) {
      sampled = true;
      return;
    }
    if (kept[bucket] >= limit) {
      sampled = true;
      return;
    }
    components.push({ name, master, x, y, orient, role });
    kept[bucket]++;
  };

  // Split once — O(n) line walk, no recursive regex
  const lines = text.split(/\r?\n/);
  const lineLimit = Math.min(lines.length, 600_000);

  for (let i = 0; i < lineLimit; i++) {
    const line = lines[i];
    if (!line) continue;
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("//")) continue;

    // Section headers
    const compHead = t.match(/^COMPONENTS\s+(\d+)\s*;/i);
    if (compHead) {
      section = "components";
      componentCount = parseInt(compHead[1], 10) || 0;
      pendingComp = null;
      continue;
    }
    if (/^END\s+COMPONENTS\b/i.test(t)) {
      section = "none";
      pendingComp = null;
      continue;
    }
    const pinHead = t.match(/^PINS\s+(\d+)\s*;/i);
    if (pinHead) {
      section = "pins";
      pinCount = parseInt(pinHead[1], 10) || 0;
      pendingPin = null;
      continue;
    }
    if (/^END\s+PINS\b/i.test(t)) {
      section = "none";
      pendingPin = null;
      continue;
    }
    const snHead = t.match(/^SPECIALNETS\s+(\d+)\s*;/i);
    if (snHead) {
      section = "specialnets";
      currentPdnNet = "";
      continue;
    }
    if (/^END\s+SPECIALNETS\b/i.test(t)) {
      section = "none";
      currentPdnNet = "";
      continue;
    }

    // ROW for core estimate
    if (!core && rows < 4000 && t.startsWith("ROW")) {
      const rm = t.match(rowRe);
      if (rm) {
        rows++;
        const x = dbuToUm(parseFloat(rm[1]), units);
        const y = dbuToUm(parseFloat(rm[2]), units);
        const doN = parseInt(rm[3], 10) || 1;
        const byN = parseInt(rm[4], 10) || 1;
        const stepX = dbuToUm(parseFloat(rm[5]), units);
        const stepY = dbuToUm(parseFloat(rm[6]), units);
        const x2 = x + Math.max(0, doN - 1) * stepX + Math.abs(stepX || 0.5);
        const y2 = y + Math.max(0, byN - 1) * stepY + Math.abs(stepY || 1.5);
        rowMinX = Math.min(rowMinX, x);
        rowMinY = Math.min(rowMinY, y);
        rowMaxX = Math.max(rowMaxX, x2);
        rowMaxY = Math.max(rowMaxY, y2);
      }
      continue;
    }

    if (section === "specialnets") {
      // Net name line: - VPWR ( ... ) + USE POWER
      if (t.startsWith("-")) {
        const nm = t.match(/^-\s+(\S+)/);
        if (nm) currentPdnNet = nm[1];
      }
      // One or more segments may appear on long lines — scan globally without /g lastIndex bugs
      let searchFrom = 0;
      const upper = t.toUpperCase();
      while (searchFrom < t.length) {
        const slice = t.slice(searchFrom);
        const pm = slice.match(pdnSegRe);
        if (!pm || pm.index == null) break;
        pdnCount++;
        const absIdx = searchFrom + pm.index;
        // Stride from start so straps cover the full die (not only first rails)
        const pdnStride = Math.max(1, Math.ceil(25000 / maxPdn));
        if ((pdnCount - 1) % pdnStride === 0 && pdn.length < maxPdn) {
          pdn.push({
            layer: pm[1],
            widthUm: dbuToUm(parseFloat(pm[2]), units),
            x1: dbuToUm(parseFloat(pm[3]), units),
            y1: dbuToUm(parseFloat(pm[4]), units),
            x2: dbuToUm(parseFloat(pm[5]), units),
            y2: dbuToUm(parseFloat(pm[6]), units),
            net: currentPdnNet || "PDN",
          });
        } else {
          sampled = true;
        }
        searchFrom = absIdx + pm[0].length;
        if (pm[0].length === 0) searchFrom++;
        void upper;
      }
      continue;
    }

    if (section === "components") {
      const sm = t.match(startCompRe);
      if (sm && t.startsWith("-")) {
        pendingComp = { name: sm[1], master: sm[2] };
        const pm = t.match(placeRe) || t.match(placeLooseRe);
        if (pm && pendingComp) {
          tryKeepComp(
            pendingComp.name,
            pendingComp.master,
            dbuToUm(parseFloat(pm[1]), units),
            dbuToUm(parseFloat(pm[2]), units),
            pm[3] || "N"
          );
          pendingComp = null;
        }
        continue;
      }
      if (pendingComp) {
        const pm = t.match(placeRe) || t.match(placeLooseRe);
        if (pm) {
          tryKeepComp(
            pendingComp.name,
            pendingComp.master,
            dbuToUm(parseFloat(pm[1]), units),
            dbuToUm(parseFloat(pm[2]), units),
            pm[3] || "N"
          );
          pendingComp = null;
        } else if (/\bUNPLACED\b/i.test(t) || /;\s*$/.test(t)) {
          pendingComp = null;
        }
      }
      continue;
    }

    if (section === "pins") {
      if (t.startsWith("-")) {
        const sm = t.match(startPinRe);
        if (sm) {
          pendingPin = { name: sm[1], direction: "UNKNOWN" };
        }
      }
      if (pendingPin) {
        const dirM = t.match(/DIRECTION\s+(INPUT|OUTPUT|INOUT)/i);
        if (dirM) {
          pendingPin.direction =
            dirM[1].toUpperCase() as DefPin["direction"];
        }
        const pm = t.match(placeLooseRe);
        if (pm) {
          if (pins.length < 512) {
            pins.push({
              name: pendingPin.name,
              x: dbuToUm(parseFloat(pm[1]), units),
              y: dbuToUm(parseFloat(pm[2]), units),
              direction: pendingPin.direction,
            });
          }
          pendingPin = null;
        } else if (t.endsWith(";") && !t.includes("+")) {
          pendingPin = null;
        }
      }
    }
  }

  if (!core && rows > 0 && Number.isFinite(rowMinX) && rowMaxX > rowMinX) {
    core = {
      llx: rowMinX,
      lly: rowMinY,
      urx: rowMaxX,
      ury: rowMaxY,
    };
  }

  if (componentCount === 0) componentCount = components.length;
  if (
    components.length <
    seenRole.endcap + seenRole.tap + seenRole.decap + seenRole.other
  )
    sampled = true;
  if (pinCount === 0) pinCount = pins.length;

  // Component bbox for thin/missing core
  if (components.length) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of components) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x);
      maxY = Math.max(maxY, c.y);
    }
    const pad = Math.max(1, (die.urx - die.llx) * 0.02);
    const bbox: DefBox = {
      llx: Math.max(die.llx, minX - pad),
      lly: Math.max(die.lly, minY - pad),
      urx: Math.min(die.urx, maxX + pad),
      ury: Math.min(die.ury, maxY + pad),
    };
    const coreThin =
      !core ||
      core.urx - core.llx < (die.urx - die.llx) * 0.15 ||
      core.ury - core.lly < (die.ury - die.lly) * 0.15;
    if (coreThin && bbox.urx > bbox.llx && bbox.ury > bbox.lly) {
      core = bbox;
    }
  }

  if (!core) {
    const dw = die.urx - die.llx;
    const dh = die.ury - die.lly;
    core = {
      llx: die.llx + dw * 0.05,
      lly: die.lly + dh * 0.05,
      urx: die.urx - dw * 0.05,
      ury: die.ury - dh * 0.05,
    };
  }

  const counts = {
    endcap: seenRole.endcap,
    tap: seenRole.tap,
    decap: seenRole.decap,
    other: seenRole.other,
  };

  return {
    unitsMicrons: units,
    die,
    core,
    components,
    pins,
    pdn,
    componentCount: componentCount || components.length,
    pinCount: pinCount || pins.length,
    pdnCount,
    counts,
    sampled,
    sourceNote: [
      `tap=${counts.tap}`,
      `endcap=${counts.endcap}`,
      `decap=${counts.decap}`,
      `pdn=${pdnCount}`,
      sampled ? `(shown ${components.length} cells / ${pdn.length} straps)` : "",
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export type ChipCellKind =
  | "std"
  | "macro"
  | "io"
  | "clk"
  | "tap"
  | "endcap"
  | "decap";

export interface ChipSnapshotV2 {
  dieW: number;
  dieH: number;
  coreX: number;
  coreY: number;
  coreW: number;
  coreH: number;
  cells: {
    x: number;
    y: number;
    w: number;
    h: number;
    kind: ChipCellKind;
  }[];
  /** Die-relative 0–1 segments (power mesh + optional signal) */
  routes: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    layer: number;
    /** pdn power / ground / signal */
    kind?: "power" | "ground" | "signal";
    width?: number;
  }[];
  stage: string;
  /** intent = form DIE/CORE; result = parsed DEF; empty = no geometry */
  mode: ChipSnapshotMode;
  /** Human-readable provenance */
  sourceLabel: string;
  /** Optional stats */
  stats?: {
    componentCount?: number;
    pinCount?: number;
    sampled?: boolean;
    defName?: string;
    tapCount?: number;
    endcapCount?: number;
    decapCount?: number;
    pdnCount?: number;
  };
}

function roleToKind(role: DefCellRole, master: string, inst: string): ChipCellKind {
  if (role === "endcap") return "endcap";
  if (role === "tap") return "tap";
  if (role === "decap") return "decap";
  const m = `${master} ${inst}`.toLowerCase();
  if (/pad|gpio|io_|_io|corner/.test(m)) return "io";
  if (/clk|clock|clkbuf|clkgate/.test(m)) return "clk";
  if (/ram|rom|sram|macro/.test(m)) return "macro";
  return "std";
}

function layerIndex(layer: string): number {
  const m = layer.match(/(\d+)/);
  if (m) return Math.max(0, parseInt(m[1], 10) - 1);
  if (/li1|local/i.test(layer)) return 0;
  return 0;
}

/** Estimate cell size in µm (no LEF) — keep taps small so they don't form a solid blob */
function estimateCellUm(kind: ChipCellKind, dieW: number): { w: number; h: number } {
  // sky130 hd site ~0.46 × 2.72 µm; scale slightly for visibility
  if (kind === "macro") return { w: Math.max(8, dieW * 0.04), h: Math.max(8, dieW * 0.04) };
  if (kind === "io") return { w: Math.max(3, dieW * 0.01), h: Math.max(3, dieW * 0.01) };
  if (kind === "clk") return { w: 0.92, h: 2.72 };
  if (kind === "endcap") return { w: 1.38, h: 2.72 };
  if (kind === "tap") return { w: 0.46, h: 2.72 };
  if (kind === "decap") return { w: 1.38, h: 2.72 };
  return { w: 0.92, h: 2.72 };
}

function boxFromDieCoreStrings(
  dieArea: string,
  coreArea: string
): { die: DefBox; core: DefBox } | null {
  const parse = (s: string): DefBox | null => {
    const p = s.trim().split(/\s+/).map(Number);
    if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) return null;
    if (!(p[2] > p[0] && p[3] > p[1])) return null;
    return { llx: p[0], lly: p[1], urx: p[2], ury: p[3] };
  };
  const die = parse(dieArea);
  if (!die) return null;
  const core =
    parse(coreArea) ||
    ({
      llx: die.llx + (die.urx - die.llx) * 0.05,
      lly: die.lly + (die.ury - die.lly) * 0.05,
      urx: die.urx - (die.urx - die.llx) * 0.05,
      ury: die.ury - (die.ury - die.lly) * 0.05,
    } as DefBox);
  return { die, core };
}

/** Intent snapshot: DIE/CORE from Studio floorplan inputs only */
export function chipFromIntent(
  dieArea: string,
  coreArea: string,
  stage: string
): ChipSnapshotV2 {
  const boxes = boxFromDieCoreStrings(dieArea, coreArea);
  if (!boxes) {
    return {
      dieW: 0,
      dieH: 0,
      coreX: 0,
      coreY: 0,
      coreW: 0,
      coreH: 0,
      cells: [],
      routes: [],
      stage,
      mode: "empty",
      sourceLabel: "No die area — set Floorplan DIE_AREA / CORE_AREA",
    };
  }
  const { die, core } = boxes;
  return {
    dieW: die.urx - die.llx,
    dieH: die.ury - die.lly,
    coreX: core.llx - die.llx,
    coreY: core.lly - die.lly,
    coreW: Math.max(1, core.urx - core.llx),
    coreH: Math.max(1, core.ury - core.lly),
    cells: [],
    routes: [],
    stage,
    mode: "intent",
    sourceLabel: "Intent · DIE/CORE from floorplan inputs (not OpenLane DEF yet)",
  };
}

/** Result snapshot: geometry from parsed DEF (checkpoint / job truth) */
export function chipFromDef(
  def: DefGeometry,
  stage: string,
  opts?: { defName?: string }
): ChipSnapshotV2 {
  const die = def.die;
  const core = def.core || {
    llx: die.llx + (die.urx - die.llx) * 0.05,
    lly: die.lly + (die.ury - die.lly) * 0.05,
    urx: die.urx - (die.urx - die.llx) * 0.05,
    ury: die.ury - (die.ury - die.lly) * 0.05,
  };
  const dieW = die.urx - die.llx;
  const dieH = die.ury - die.lly;
  const coreW = Math.max(1e-6, core.urx - core.llx);
  const coreH = Math.max(1e-6, core.ury - core.lly);
  const coreX = core.llx - die.llx;
  const coreY = core.lly - die.lly;

  const cells: ChipSnapshotV2["cells"] = [];

  // Draw order later: std/tap under, endcap/io on top — sort here
  const rawCells: ChipSnapshotV2["cells"] = [];
  for (const c of def.components) {
    const kind = roleToKind(c.role, c.master, c.name);
    const sz = estimateCellUm(kind, dieW);
    // Core-relative 0–1 (DEF µm within core)
    const x = (c.x - core.llx) / coreW;
    const y = (c.y - core.lly) / coreH;
    rawCells.push({
      x: Math.max(-0.02, Math.min(1.02, x)),
      y: Math.max(-0.02, Math.min(1.02, y)),
      w: Math.min(0.05, Math.max(0.0002, sz.w / coreW)),
      h: Math.min(0.05, Math.max(0.0004, sz.h / coreH)),
      kind,
    });
  }

  for (const p of def.pins) {
    const x = (p.x - core.llx) / coreW;
    const y = (p.y - core.lly) / coreH;
    const isClk = /clk|clock/i.test(p.name);
    rawCells.push({
      x: Math.max(-0.05, Math.min(1.05, x)),
      y: Math.max(-0.05, Math.min(1.05, y)),
      w: 0.012,
      h: 0.012,
      kind: isClk ? "clk" : "io",
    });
  }
  const kindOrder: Record<string, number> = {
    std: 0,
    tap: 1,
    decap: 2,
    clk: 3,
    endcap: 4,
    macro: 5,
    io: 6,
  };
  rawCells.sort(
    (a, b) => (kindOrder[a.kind] ?? 0) - (kindOrder[b.kind] ?? 0)
  );
  cells.push(...rawCells);

  // PDN mesh: die-relative 0–1 so straps align with die box
  const routes: ChipSnapshotV2["routes"] = [];
  for (const s of def.pdn) {
    const net = s.net.toUpperCase();
    const kind: "power" | "ground" | "signal" = /VSS|GND|VGND|VNB|GROUND/.test(
      net
    )
      ? "ground"
      : /VDD|VPWR|VPB|POWER|VCC/.test(net)
        ? "power"
        : "signal";
    routes.push({
      x1: (s.x1 - die.llx) / dieW,
      y1: (s.y1 - die.lly) / dieH,
      x2: (s.x2 - die.llx) / dieW,
      y2: (s.y2 - die.lly) / dieH,
      layer: layerIndex(s.layer),
      kind,
      width: Math.max(0.001, s.widthUm / dieW),
    });
  }

  const name = opts?.defName || "layout.def";
  return {
    dieW,
    dieH,
    coreX,
    coreY,
    coreW,
    coreH,
    cells,
    routes,
    stage,
    mode: "result",
    sourceLabel: `Result · ${name} · ${def.sourceNote}`,
    stats: {
      componentCount: def.componentCount,
      pinCount: def.pinCount,
      sampled: def.sampled,
      defName: name,
      tapCount: def.counts.tap,
      endcapCount: def.counts.endcap,
      decapCount: def.counts.decap,
      pdnCount: def.pdnCount,
    },
  };
}

/**
 * Prefer DEF result when available; else intent from form inputs.
 * Rule: checkpoint/DEF = truth · form = intent · canvas = view.
 */
export function buildChipSnapshot(opts: {
  dieArea: string;
  coreArea: string;
  stage: string;
  defText?: string | null;
  defName?: string;
  maxCells?: number;
}): ChipSnapshotV2 {
  if (opts.defText?.trim()) {
    try {
      const geo = parseDefGeometry(opts.defText, { maxCells: opts.maxCells });
      if (geo) {
        return chipFromDef(geo, opts.stage, { defName: opts.defName });
      }
    } catch {
      // Fall back to intent — never crash Studio on bad/huge DEF
      const intent = chipFromIntent(opts.dieArea, opts.coreArea, opts.stage);
      return {
        ...intent,
        sourceLabel:
          (intent.sourceLabel || "Intent") +
          " · DEF parse failed (fell back to inputs)",
      };
    }
  }
  return chipFromIntent(opts.dieArea, opts.coreArea, opts.stage);
}
