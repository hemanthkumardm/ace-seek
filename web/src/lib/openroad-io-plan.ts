/**
 * Interactive IO planner — parse top-module ports from RTL,
 * assign to die sides N/S/E/W, emit OpenLane pin_order.cfg.
 */

import type { OpenroadProjectState } from "./openroad-project-hub";

export type PinSide = "N" | "S" | "E" | "W";

export type PortDir = "input" | "output" | "inout";

export interface RtlPort {
  name: string;
  direction: PortDir;
  /** Bus bounds if present */
  msb?: number;
  lsb?: number;
  /** Expanded pin names for pin_order (bus → name[i]) */
  pins: string[];
}

export interface IoPlanAssignment {
  topModule: string;
  ports: RtlPort[];
  /** Ordered pin lists per side (pin_order order = list order) */
  order: Record<PinSide, string[]>;
  updatedAt: string;
}

export const PIN_SIDES: PinSide[] = ["N", "E", "S", "W"];

export const SIDE_LABEL: Record<PinSide, string> = {
  N: "North",
  E: "East",
  S: "South",
  W: "West",
};

/** Strip comments and strings enough to find module port lists */
function stripVerilogNoise(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function expandPins(name: string, msb?: number, lsb?: number): string[] {
  if (msb == null || lsb == null || !Number.isFinite(msb) || !Number.isFinite(lsb)) {
    return [name];
  }
  const hi = Math.max(msb, lsb);
  const lo = Math.min(msb, lsb);
  // Order MSB→LSB (common for pin order files)
  const out: string[] = [];
  if (msb >= lsb) {
    for (let i = msb; i >= lsb; i--) out.push(`${name}[${i}]`);
  } else {
    for (let i = msb; i <= lsb; i++) out.push(`${name}[${i}]`);
  }
  // guard huge buses
  if (out.length > 512) {
    return [name];
  }
  void hi;
  void lo;
  return out;
}

function parseDir(tok: string): PortDir | null {
  const t = tok.toLowerCase();
  if (t === "input") return "input";
  if (t === "output") return "output";
  if (t === "inout") return "inout";
  return null;
}

/**
 * Parse ANSI-style module ports for `topModule` from one or more RTL sources.
 * Handles: input clk, input wire [7:0] data, output reg q, etc.
 */
export function parseModulePorts(
  rtlSources: { name: string; content: string }[],
  topModule: string
): RtlPort[] {
  const top = (topModule || "top").trim();
  if (!top) return [];

  let body = "";
  for (const f of rtlSources) {
    const clean = stripVerilogNoise(f.content);
    // module top #(...) ( ports ) ;  OR  module top ( ports );
    const re = new RegExp(
      `\\bmodule\\s+${escapeRe(top)}\\s*(?:#\\s*\\([^)]*\\)\\s*)?\\(([^;]*?)\\)\\s*;`,
      "i"
    );
    const m = clean.match(re);
    if (m) {
      body = m[1];
      break;
    }
  }
  if (!body) {
    // Fallback: first module found
    for (const f of rtlSources) {
      const clean = stripVerilogNoise(f.content);
      const m = clean.match(
        /\bmodule\s+\w+\s*(?:#\s*\([^)]*\)\s*)?\(([^;]*?)\)\s*;/i
      );
      if (m) {
        body = m[1];
        break;
      }
    }
  }
  if (!body.trim()) return [];

  const ports: RtlPort[] = [];
  const seen = new Set<string>();

  // Split on commas that are not inside []
  const chunks = splitPortList(body);
  let pendingDir: PortDir | null = null;
  let pendingRange: { msb: number; lsb: number } | null = null;

  for (const raw of chunks) {
    let s = raw.trim();
    if (!s || s.startsWith("/*")) continue;
    // drop attributes (* ... *)
    s = s.replace(/\(\*[\s\S]*?\*\)/g, " ").trim();
    if (!s) continue;

    // direction token(s)
    const dirMatch = s.match(/^\s*(input|output|inout)\b/i);
    if (dirMatch) {
      pendingDir = parseDir(dirMatch[1]);
      s = s.slice(dirMatch[0].length).trim();
    }
    // optional wire/reg/logic/signed
    s = s.replace(/^\s*(wire|reg|logic|signed|unsigned|tri|wand|wor)\b/i, "").trim();
    s = s.replace(/^\s*(wire|reg|logic|signed|unsigned)\b/i, "").trim();

    // bus range [msb:lsb]
    const rangeM = s.match(/^\[\s*(-?\d+)\s*:\s*(-?\d+)\s*\]/);
    if (rangeM) {
      pendingRange = {
        msb: parseInt(rangeM[1], 10),
        lsb: parseInt(rangeM[2], 10),
      };
      s = s.slice(rangeM[0].length).trim();
    }

    // name (maybe with = default)
    const nameM = s.match(/^([A-Za-z_]\w*)/);
    if (!nameM) continue;
    const name = nameM[1];
    if (/^(input|output|inout|wire|reg|logic)$/i.test(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);

    const dir = pendingDir || "inout";
    const msb = pendingRange?.msb;
    const lsb = pendingRange?.lsb;
    ports.push({
      name,
      direction: dir,
      msb,
      lsb,
      pins: expandPins(name, msb, lsb),
    });

    // For "input a, b, c" style — keep dir; clear range after each name
    pendingRange = null;
  }

  return ports;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitPortList(body: string): string[] {
  const parts: string[] = [];
  let cur = "";
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "[") depth++;
    if (ch === "]") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

/** Collect non-testbench RTL from project */
export function projectRtlSources(
  project: OpenroadProjectState
): { name: string; content: string }[] {
  return project.files
    .filter((f) => {
      if (!/\.(v|sv)$/i.test(f.name)) return false;
      const base = f.name.split("/").pop()?.toLowerCase() || "";
      if (base.startsWith("tb_") || base.startsWith("tb.") || /_tb\./.test(base))
        return false;
      if (/\/tb\//i.test(f.name)) return false;
      return true;
    })
    .map((f) => ({ name: f.name, content: f.content || "" }));
}

export function parsePortsFromProject(
  project: OpenroadProjectState
): RtlPort[] {
  return parseModulePorts(
    projectRtlSources(project),
    project.topModule || "top"
  );
}

/** Flat list of all expanded pin names */
export function allPins(ports: RtlPort[]): string[] {
  return ports.flatMap((p) => p.pins);
}

export function emptyOrder(): Record<PinSide, string[]> {
  return { N: [], E: [], S: [], W: [] };
}

export function findPinSide(
  order: Record<PinSide, string[]>,
  pin: string
): PinSide | null {
  for (const s of PIN_SIDES) {
    if (order[s].includes(pin)) return s;
  }
  return null;
}

export function unplacedPins(
  ports: RtlPort[],
  order: Record<PinSide, string[]>
): string[] {
  const placed = new Set(PIN_SIDES.flatMap((s) => order[s]));
  return allPins(ports).filter((p) => !placed.has(p));
}

/**
 * Heuristic auto-place:
 * - clk / clock / rst / reset → West
 * - remaining inputs → North then West
 * - outputs → South then East
 * - inouts → East
 */
export function autoPlacePorts(ports: RtlPort[]): Record<PinSide, string[]> {
  const order = emptyOrder();
  const inputs: string[] = [];
  const outputs: string[] = [];
  const clocks: string[] = [];
  const resets: string[] = [];
  const inouts: string[] = [];

  for (const p of ports) {
    const n = p.name.toLowerCase();
    const isClk = /\b(clk|clock|ck)\b|^clk|^clock|^ck/i.test(n) || n === "clk" || n.startsWith("clk");
    const isRst =
      /\b(rst|reset|rstn|resetn|rst_n)\b/i.test(n) ||
      n.startsWith("rst") ||
      n.startsWith("reset");
    if (isClk) clocks.push(...p.pins);
    else if (isRst) resets.push(...p.pins);
    else if (p.direction === "output") outputs.push(...p.pins);
    else if (p.direction === "inout") inouts.push(...p.pins);
    else inputs.push(...p.pins);
  }

  order.W.push(...clocks, ...resets);

  // split inputs N / W leftover, outputs S / E
  const halfIn = Math.ceil(inputs.length / 2) || 0;
  order.N.push(...inputs.slice(0, halfIn));
  order.W.push(...inputs.slice(halfIn));

  const halfOut = Math.ceil(outputs.length / 2) || 0;
  order.S.push(...outputs.slice(0, halfOut));
  order.E.push(...outputs.slice(halfOut), ...inouts);

  return order;
}

/** Move pin to a side (append). Removes from previous side. */
export function assignPin(
  order: Record<PinSide, string[]>,
  pin: string,
  side: PinSide,
  index?: number
): Record<PinSide, string[]> {
  const next = emptyOrder();
  for (const s of PIN_SIDES) {
    next[s] = order[s].filter((p) => p !== pin);
  }
  if (index == null || index < 0 || index >= next[side].length) {
    next[side] = [...next[side], pin];
  } else {
    const arr = [...next[side]];
    arr.splice(index, 0, pin);
    next[side] = arr;
  }
  return next;
}

export function removePin(
  order: Record<PinSide, string[]>,
  pin: string
): Record<PinSide, string[]> {
  const next = emptyOrder();
  for (const s of PIN_SIDES) {
    next[s] = order[s].filter((p) => p !== pin);
  }
  return next;
}

export function movePinInSide(
  order: Record<PinSide, string[]>,
  side: PinSide,
  pin: string,
  dir: -1 | 1
): Record<PinSide, string[]> {
  const arr = [...order[side]];
  const i = arr.indexOf(pin);
  if (i < 0) return order;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return order;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return { ...order, [side]: arr };
}

/**
 * OpenLane odbpy/io_place.py treats each pin line as a **regex** and rejects
 * any line with >1 whitespace-separated token. Freeform comments like
 * `# Ace-Seek …` become `['#','Ace-Seek',…]` → "Only one entry allowed per line."
 * Only exact directives `#N/#E/#S/#W` (optional R) / `#BUS_SORT` are allowed.
 *
 * Also escape regex metacharacters so `irq[31]` matches literally, not a class.
 */
export function escapePinOrderRegex(pin: string): string {
  return pin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function unescapePinOrderRegex(token: string): string {
  return token.replace(/\\([.*+?^${}()|[\]\\])/g, "$1");
}

/**
 * OpenLane pin_order.cfg format (strict):
 *   #N
 *   port_a
 *   port_b\[0\]
 *   #E
 *   ...
 * No freeform comments.
 */
export function buildPinOrderCfg(
  order: Record<PinSide, string[]>,
  _opts?: { comment?: string }
): string {
  const lines: string[] = [];
  for (const side of PIN_SIDES) {
    lines.push(`#${side}`);
    for (const pin of order[side]) {
      const name = pin.trim();
      if (!name) continue;
      lines.push(escapePinOrderRegex(name));
    }
  }
  return lines.join("\n") + "\n";
}

/** Parse pin_order.cfg back into side order */
export function parsePinOrderCfg(text: string): Record<PinSide, string[]> {
  const order = emptyOrder();
  let cur: PinSide | null = null;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("//")) continue;
    // Skip OpenLane-illegal freeform comments (`# something`) — keep `#N` etc.
    if (/^#\s+\S/.test(t)) continue;
    const sideM = t.match(/^#\s*([NESW])R?\s*$/i);
    if (sideM) {
      cur = sideM[1].toUpperCase() as PinSide;
      continue;
    }
    if (t.startsWith("#")) continue;
    if (cur) order[cur].push(unescapePinOrderRegex(t.split(/\s+/)[0]));
  }
  return order;
}

export function serializeIoPlan(plan: IoPlanAssignment): string {
  return JSON.stringify(plan);
}

export function parseIoPlanJson(raw: string | undefined | null): IoPlanAssignment | null {
  if (!raw?.trim()) return null;
  try {
    const j = JSON.parse(raw) as IoPlanAssignment;
    if (!j || typeof j !== "object") return null;
    const order = emptyOrder();
    for (const s of PIN_SIDES) {
      order[s] = Array.isArray(j.order?.[s])
        ? (j.order[s] as string[]).map(String)
        : [];
    }
    return {
      topModule: String(j.topModule || "top"),
      ports: Array.isArray(j.ports) ? j.ports : [],
      order,
      updatedAt: String(j.updatedAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

/** Merge current RTL ports with saved order (drop stale pins, keep placement) */
export function reconcilePlan(
  ports: RtlPort[],
  saved: IoPlanAssignment | null
): IoPlanAssignment {
  const pinSet = new Set(allPins(ports));
  const order = emptyOrder();
  if (saved) {
    for (const s of PIN_SIDES) {
      order[s] = (saved.order[s] || []).filter((p) => pinSet.has(p));
    }
  }
  return {
    topModule: saved?.topModule || "top",
    ports,
    order,
    updatedAt: new Date().toISOString(),
  };
}

export function planSummary(plan: IoPlanAssignment): string {
  const total = allPins(plan.ports).length;
  const placed = PIN_SIDES.reduce((n, s) => n + plan.order[s].length, 0);
  const parts = PIN_SIDES.map((s) => `${s}:${plan.order[s].length}`).join(" ");
  return `${placed}/${total} pins placed · ${parts}`;
}

export function planIsComplete(plan: IoPlanAssignment): boolean {
  const total = allPins(plan.ports).length;
  if (total === 0) return false;
  const placed = PIN_SIDES.reduce((n, s) => n + plan.order[s].length, 0);
  return placed === total;
}

/** StageInputs key for JSON blob */
export const IO_PLAN_JSON_KEY = "IO_PLAN_JSON";
export const PIN_ORDER_CFG_NAME = "pin_order.cfg";
