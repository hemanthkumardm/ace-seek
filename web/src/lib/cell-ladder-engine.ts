/**
 * Report-driven cell ladder (B4 alternative — no Liberty required).
 *
 * Mines cell names from STA path steps, groups by family / drive / VT,
 * and suggests next-stronger or LVT twins for ECO size_cell.
 */

import type { TimingPath, TimingStep } from "./timing-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CellNameStyle = "d_drive" | "x_suffix" | "trail_digit" | "opaque";

export interface ParsedCellName {
  raw: string;
  /** Grouping key: same footprint without drive/VT */
  familyKey: string;
  /** Drive strength as number (higher = stronger) */
  drive: number;
  driveToken: string;
  vt?: string;
  style: CellNameStyle;
  /** Rebuild cell name for a new drive / VT */
  rebuild: (drive: number, vt?: string | null) => string;
}

export interface CellSighting {
  cell: string;
  instance: string;
  delayNs: number;
  pathId: string;
  parsed: ParsedCellName | null;
}

export interface DriveLadder {
  familyKey: string;
  style: CellNameStyle;
  /** Sorted unique drives seen (or inferred chain) */
  drives: number[];
  /** drive → cells seen at that strength (any VT) */
  byDrive: Record<number, string[]>;
  /** All VT variants seen for this family */
  vts: string[];
  /** Example cells */
  examples: string[];
  seenCount: number;
}

export interface CellSizeCandidate {
  fromCell: string;
  toCell: string;
  fromDrive: number;
  toDrive: number;
  direction: "up" | "down";
  driveStep: number;
  /** Estimated delay multiplier vs current cell */
  delayMultiplier: number;
  /** Estimated area multiplier */
  areaMultiplier: number;
  note: string;
}

export interface CellLadderCatalog {
  builtAt: number;
  sightings: CellSighting[];
  ladders: DriveLadder[];
  /** cell name → count */
  cellCounts: Record<string, number>;
  uniqueCells: string[];
  uniqueInstances: number;
}

export type EcoCellPickSource = "seen" | "inferred" | "none";

export interface EcoCellPick {
  fromCell: string;
  toCell: string;
  instance: string;
  familyKey: string;
  source: EcoCellPickSource;
  kind: "upsize" | "downsize" | "lvt" | "hvt";
  detail: string;
}

// ---------------------------------------------------------------------------
// Name parsing
// ---------------------------------------------------------------------------

const VT_RE = /(ULVT|ELVT|LVT|SVT|HVT|RVT)$/i;

/**
 * Parse common standard cell naming into family + drive + VT.
 * Supports:
 *  - D-drive style: BUFFD4, ND2D1, INVSKND10
 *  - X-suffix: AND2X2, BUFX4, BUF_X4
 *  - Trailing digits: INVD1, CKBD8
 */
export function parseCellName(raw: string): ParsedCellName | null {
  const cell = (raw || "").trim().replace(/[()]/g, "");
  if (!cell || cell.length < 2) return null;
  // Skip pure hierarchical garbage
  if (cell.includes("/") && !/[A-Za-z]{2,}\d/.test(cell)) return null;

  // Prefer leaf cell if "inst (CELL)" already stripped; also strip lib/
  let name = cell.includes("/") ? cell.split("/").pop()! : cell;
  name = name.replace(/^\\/, "");

  let vt: string | undefined;
  let base = name;
  const vtMatch = base.match(VT_RE);
  if (vtMatch) {
    vt = vtMatch[1].toUpperCase();
    base = base.slice(0, -vtMatch[1].length);
  }

  // 1) X-suffix: AND2X2, BUF_X4, BUFX8
  const xMatch = base.match(/^(.*?)(_)?X(\d+)$/i);
  if (xMatch) {
    const prefix = xMatch[1];
    const us = xMatch[2] || "";
    const drive = parseInt(xMatch[3], 10);
    if (drive > 0 && prefix.length >= 1) {
      const familyKey = `${prefix.toUpperCase()}|X|${us ? "_" : ""}`;
      return {
        raw: name,
        familyKey,
        drive,
        driveToken: `X${drive}`,
        vt,
        style: "x_suffix",
        rebuild: (d, vtNew) => {
          const v =
            vtNew === null ? "" : vtNew !== undefined ? vtNew : vt || "";
          return `${prefix}${us}X${d}${v}`;
        },
      };
    }
  }

  // 2) D-drive style ...D<drive><suffix> e.g. BUFFD4, ND2D1
  //    Prefer D before tech tokens
  const dMatch = base.match(/^(.*?)D(\d+)([A-Z].*)?$/i);
  if (dMatch && dMatch[2]) {
    const prefix = dMatch[1];
    const drive = parseInt(dMatch[2], 10);
    const suffix = dMatch[3] || "";
    // Avoid matching random D mid-name with nonsense prefix
    if (drive > 0 && prefix.length >= 1 && prefix.length <= 24) {
      const familyKey = `${prefix.toUpperCase()}|D|${suffix.toUpperCase()}`;
      return {
        raw: name,
        familyKey,
        drive,
        driveToken: `D${drive}`,
        vt,
        style: "d_drive",
        rebuild: (d, vtNew) => {
          const v =
            vtNew === null ? "" : vtNew !== undefined ? vtNew : vt || "";
          return `${prefix}D${d}${suffix}${v}`;
        },
      };
    }
  }

  // 3) Trailing digits only: CKBD8, INV1 (weak)
  const tMatch = base.match(/^(.*?)(\d+)$/);
  if (tMatch && tMatch[1].length >= 2) {
    const prefix = tMatch[1];
    const drive = parseInt(tMatch[2], 10);
    if (drive > 0 && drive < 1000) {
      const familyKey = `${prefix.toUpperCase()}|T|`;
      return {
        raw: name,
        familyKey,
        drive,
        driveToken: String(drive),
        vt,
        style: "trail_digit",
        rebuild: (d, vtNew) => {
          const v =
            vtNew === null ? "" : vtNew !== undefined ? vtNew : vt || "";
          return `${prefix}${d}${v}`;
        },
      };
    }
  }

  // Opaque — still catalog the raw name
  return {
    raw: name,
    familyKey: `OPAQUE|${name.toUpperCase()}`,
    drive: 0,
    driveToken: "",
    vt,
    style: "opaque",
    rebuild: () => name,
  };
}

// ---------------------------------------------------------------------------
// Catalog from paths
// ---------------------------------------------------------------------------

function instanceFromStep(step: TimingStep): string {
  // "u_core/u_buf/Y" → prefer instance without pin if possible
  const p = step.point || "";
  // strip trailing pin after last /
  // keep hierarchical path
  return p.replace(/\/([A-Za-z_][A-Za-z0-9_]*)$/i, (m, pin) => {
    // common pin names
    if (
      /^(Y|Z|ZN|Q|QN|D|A|A1|A2|A3|B|B1|B2|C|I|O|PAD|CP|CK|CLK)$/i.test(pin)
    ) {
      return "";
    }
    return m;
  }).replace(/\/$/, "") || p;
}

export function collectSightingsFromPaths(
  paths: TimingPath[]
): CellSighting[] {
  const out: CellSighting[] = [];
  for (const path of paths) {
    for (const step of path.steps) {
      if (!step.cell) continue;
      if (
        step.kind === "clock" ||
        step.kind === "clock_network" ||
        step.kind === "summary" ||
        step.kind === "constraint"
      ) {
        continue;
      }
      const parsed = parseCellName(step.cell);
      out.push({
        cell: step.cell.replace(/[()]/g, "").trim(),
        instance: instanceFromStep(step),
        delayNs: step.incr || 0,
        pathId: path.id,
        parsed,
      });
    }
    // schematic nodes as backup
    for (const n of path.schematic.nodes) {
      if (!n.cell) continue;
      if (out.some((s) => s.instance === n.label && s.cell === n.cell)) continue;
      out.push({
        cell: n.cell.replace(/[()]/g, "").trim(),
        instance: n.label,
        delayNs: n.delayNs || 0,
        pathId: path.id,
        parsed: parseCellName(n.cell),
      });
    }
  }
  return out;
}

export function buildCellLadderCatalog(
  paths: TimingPath[]
): CellLadderCatalog {
  const sightings = collectSightingsFromPaths(paths);
  const cellCounts: Record<string, number> = {};
  const instSet = new Set<string>();
  const ladderMap = new Map<string, DriveLadder>();

  for (const s of sightings) {
    cellCounts[s.cell] = (cellCounts[s.cell] || 0) + 1;
    if (s.instance) instSet.add(s.instance);
    const p = s.parsed;
    if (!p || p.style === "opaque" || p.drive <= 0) continue;

    let ladder = ladderMap.get(p.familyKey);
    if (!ladder) {
      ladder = {
        familyKey: p.familyKey,
        style: p.style,
        drives: [],
        byDrive: {},
        vts: [],
        examples: [],
        seenCount: 0,
      };
      ladderMap.set(p.familyKey, ladder);
    }
    ladder.seenCount++;
    if (!ladder.byDrive[p.drive]) ladder.byDrive[p.drive] = [];
    if (!ladder.byDrive[p.drive].includes(s.cell)) {
      ladder.byDrive[p.drive].push(s.cell);
    }
    if (p.vt && !ladder.vts.includes(p.vt)) ladder.vts.push(p.vt);
    if (ladder.examples.length < 6 && !ladder.examples.includes(s.cell)) {
      ladder.examples.push(s.cell);
    }
  }

  const ladders = [...ladderMap.values()].map((L) => {
    const drives = Object.keys(L.byDrive)
      .map(Number)
      .sort((a, b) => a - b);
    return { ...L, drives };
  });
  ladders.sort((a, b) => b.seenCount - a.seenCount);

  return {
    builtAt: Date.now(),
    sightings,
    ladders,
    cellCounts,
    uniqueCells: Object.keys(cellCounts).sort(),
    uniqueInstances: instSet.size,
  };
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

const VT_FAST_ORDER = ["ULVT", "ELVT", "LVT", "SVT", "RVT", "HVT"];

function nextDriveValue(drives: number[], current: number): number | null {
  const higher = drives.filter((d) => d > current).sort((a, b) => a - b);
  if (higher.length) return higher[0];
  return null;
}

function inferNextDrive(current: number): number {
  // Prefer powers-of-two-ish ladder used by stdcells
  const chain = [1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32];
  const next = chain.find((d) => d > current);
  return next || current * 2;
}

function pickCellAtDrive(
  ladder: DriveLadder,
  drive: number,
  preferVt?: string
): string | null {
  const list = ladder.byDrive[drive] || [];
  if (!list.length) return null;
  if (preferVt) {
    const hit = list.find((c) =>
      c.toUpperCase().endsWith(preferVt.toUpperCase())
    );
    if (hit) return hit;
  }
  return list[0];
}

/**
 * Suggest upsize for a specific instance/cell using catalog.
 */
export function suggestUpsize(
  catalog: CellLadderCatalog,
  fromCell: string,
  instance: string,
  opts?: { allowInfer?: boolean }
): EcoCellPick | null {
  const allowInfer = opts?.allowInfer !== false;
  const parsed = parseCellName(fromCell);
  if (!parsed || parsed.drive <= 0) return null;

  const ladder = catalog.ladders.find((l) => l.familyKey === parsed.familyKey);
  const seenNext = ladder ? nextDriveValue(ladder.drives, parsed.drive) : null;

  if (seenNext != null && ladder) {
    const toCell =
      pickCellAtDrive(ladder, seenNext, parsed.vt) ||
      parsed.rebuild(seenNext, parsed.vt);
    const source: EcoCellPickSource = ladder.byDrive[seenNext]
      ? "seen"
      : "inferred";
    return {
      fromCell,
      toCell,
      instance,
      familyKey: parsed.familyKey,
      source,
      kind: "upsize",
      detail: `Drive ${parsed.drive} → ${seenNext} (${source} in report catalog)`,
    };
  }

  if (!allowInfer) return null;

  const inferred = inferNextDrive(parsed.drive);
  if (inferred <= parsed.drive) return null;
  const toCell = parsed.rebuild(inferred, parsed.vt);
  return {
    fromCell,
    toCell,
    instance,
    familyKey: parsed.familyKey,
    source: "inferred",
    kind: "upsize",
    detail: `Inferred drive ${parsed.drive} → ${inferred} (not seen in report; verify in lib)`,
  };
}

/**
 * Suggest faster VT (LVT) keeping same drive.
 */
export function suggestLvt(
  catalog: CellLadderCatalog,
  fromCell: string,
  instance: string,
  opts?: { allowInfer?: boolean }
): EcoCellPick | null {
  const allowInfer = opts?.allowInfer !== false;
  const parsed = parseCellName(fromCell);
  if (!parsed || parsed.drive <= 0) return null;

  const curVt = (parsed.vt || "SVT").toUpperCase();
  const curIdx = VT_FAST_ORDER.indexOf(curVt);
  // Already fastest
  if (curIdx === 0) return null;

  const ladder = catalog.ladders.find((l) => l.familyKey === parsed.familyKey);
  const sameDrive = ladder?.byDrive[parsed.drive] || [];

  // Prefer seen faster VT at same drive
  for (const vt of VT_FAST_ORDER) {
    const vtIdx = VT_FAST_ORDER.indexOf(vt);
    if (curIdx >= 0 && vtIdx >= curIdx) continue; // not faster
    if (curIdx < 0 && vt === curVt) continue;
    const hit = sameDrive.find((c) => c.toUpperCase().endsWith(vt));
    if (hit && hit !== fromCell) {
      return {
        fromCell,
        toCell: hit,
        instance,
        familyKey: parsed.familyKey,
        source: "seen",
        kind: "lvt",
        detail: `VT ${curVt} → ${vt} (seen in report at same drive)`,
      };
    }
  }

  if (!allowInfer) return null;

  // Infer LVT if not already
  if (curVt === "LVT" || curVt === "ULVT" || curVt === "ELVT") return null;
  const toCell = parsed.rebuild(parsed.drive, "LVT");
  if (toCell === fromCell) return null;
  return {
    fromCell,
    toCell,
    instance,
    familyKey: parsed.familyKey,
    source: "inferred",
    kind: "lvt",
    detail: `Inferred ${curVt} → LVT (not seen in report; verify in lib)`,
  };
}

/**
 * Pick hottest gate on path and suggest upsize + optional lvt picks.
 */
export function suggestEcoCellPicksForPath(
  path: TimingPath,
  catalog?: CellLadderCatalog
): { upsize: EcoCellPick | null; lvt: EcoCellPick | null; catalog: CellLadderCatalog } {
  const cat = catalog || buildCellLadderCatalog([path]);

  // Prefer high-delay cell steps
  const candidates = path.steps
    .filter(
      (s) =>
        s.cell &&
        (s.kind === "cell" || s.kind === "launch_ff" || s.kind === "other")
    )
    .map((s) => ({
      cell: s.cell!.replace(/[()]/g, "").trim(),
      instance: instanceFromStep(s),
      delay: s.incr || 0,
    }))
    .sort((a, b) => b.delay - a.delay);

  // Fallback schematic
  if (!candidates.length) {
    for (const n of path.schematic.nodes) {
      if (n.cell && (n.role === "gate" || n.role === "pad")) {
        candidates.push({
          cell: n.cell,
          instance: n.label,
          delay: n.delayNs,
        });
      }
    }
    candidates.sort((a, b) => b.delay - a.delay);
  }

  let upsize: EcoCellPick | null = null;
  let lvt: EcoCellPick | null = null;

  for (const c of candidates.slice(0, 6)) {
    if (!upsize) {
      const u = suggestUpsize(cat, c.cell, c.instance);
      if (u) upsize = u;
    }
    if (!lvt) {
      const l = suggestLvt(cat, c.cell, c.instance);
      if (l) lvt = l;
    }
    if (upsize && lvt) break;
  }

  return { upsize, lvt, catalog: cat };
}

export function summarizeCatalog(cat: CellLadderCatalog): string {
  return `${cat.uniqueCells.length} cells · ${cat.ladders.length} families · ${cat.uniqueInstances} instances`;
}
