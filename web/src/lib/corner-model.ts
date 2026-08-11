/**
 * VLSI Corner & Operating Condition Registry Engine.
 *
 * Provides domain-aware parsing for PVT (Process, Voltage, Temperature) corners,
 * RC parasitic extraction modes, and multi-corner operating conditions from EDA reports
 * (Genus, Innovus, Tempus, PrimeTime, OpenSTA).
 */

export type CornerId = string;

export interface OperatingCondition {
  name: string;
  process?: string;       // e.g. "ssgnp", "ss", "ff", "tt", "slow", "fast"
  voltageV?: number;      // Core operating voltage in Volts (e.g. 0.72, 0.9, 1.08)
  tempC?: number;         // Temperature in Celsius (e.g. -40, 25, 125)
  rcCorner?: string;      // RC extraction mode e.g. "cmax", "cmin", "rcmax", "rcmin", "typical"
  rawString: string;
}

export interface CornerSummary {
  id: CornerId;
  name: string;
  operatingCondition?: OperatingCondition;
  pathCount: number;
  wns: number;
  tns: number;
  wnsHold: number;
  tnsHold: number;
  failingCount: number;
}

/**
 * Parse raw operating condition / corner string into structured PVT object.
 * Examples:
 * - "ssgnp0p72v1p62vm40c (balanced_tree)" -> process: "ssgnp", voltageV: 0.72, tempC: -40
 * - "slow_125c_0.9v" -> process: "slow", voltageV: 0.9, tempC: 125
 * - "SS_0.72V_m40C_Cmax" -> process: "ss", voltageV: 0.72, tempC: -40, rcCorner: "cmax"
 */
export function parseOperatingCondition(raw: string): OperatingCondition {
  const clean = (raw || "").trim();
  if (!clean) {
    return {
      name: "default_corner",
      rawString: raw,
    };
  }

  // Remove trailing descriptions in parentheses e.g. "(balanced_tree)"
  const name = clean.replace(/\s*\([^)]*\)/g, "").trim();
  const lower = name.toLowerCase();

  let process: string | undefined;
  let voltageV: number | undefined;
  let tempC: number | undefined;
  let rcCorner: string | undefined;

  // 1. Process corner detection
  const procMatch = lower.match(
    /(?:^|[^a-z0-9])(ssgnp|ssg|ffg|tt|ss|ff|sf|fs|slow|fast|typical|worst|best)(?=[0-9p._\-\s\(\)]|$)/i
  );
  if (procMatch) {
    process = procMatch[1].toLowerCase();
  }

  // 2. Voltage detection:
  // e.g. "0p72v", "1p08v", "0.9v", "0v72", "0p72"
  const vMatch1 = lower.match(/(\d+)[p\.](\d+)\s*v/i);
  if (vMatch1) {
    voltageV = parseFloat(`${vMatch1[1]}.${vMatch1[2]}`);
  } else {
    const vMatch2 = lower.match(/(?:^|[^a-z0-9])(\d+(?:\.\d+)?)\s*v(?:$|[^a-z0-9])/i);
    if (vMatch2) {
      voltageV = parseFloat(vMatch2[1]);
    } else {
      // Check embedded 0p72 without explicit 'v' suffix after process e.g. ssgnp0p72
      const vMatch3 = lower.match(/(?:ssgnp|ssg|ffg|ss|ff|tt)(\d+)[p\.](\d+)/i);
      if (vMatch3) {
        voltageV = parseFloat(`${vMatch3[1]}.${vMatch3[2]}`);
      }
    }
  }

  // 3. Temperature detection:
  // e.g. "m40c", "125c", "-40c", "m40", "c125", "25c"
  const tMatch1 = lower.match(/(?:^|[^a-z0-9])(m\d+|\-\d+|\d+)\s*c(?:$|[^a-z0-9])/i);
  if (tMatch1) {
    const val = tMatch1[1].toLowerCase();
    tempC = val.startsWith("m") ? -parseInt(val.slice(1), 10) : parseInt(val, 10);
  } else {
    const tMatch2 = lower.match(/vm(\d+)c/i);
    if (tMatch2) {
      tempC = -parseInt(tMatch2[1], 10);
    } else {
      const tMatch3 = lower.match(/v(\d+)c/i);
      if (tMatch3) {
        tempC = parseInt(tMatch3[1], 10);
      }
    }
  }

  // 4. RC Corner detection
  const rcMatch = lower.match(/(?:^|[^a-z0-9])(cmax|cmin|rcmax|rcmin|cworst|cbest|typical_rc|rc_worst)(?:$|[^a-z0-9])/i);
  if (rcMatch) {
    rcCorner = rcMatch[1].toLowerCase();
  }

  return {
    name,
    process,
    voltageV,
    tempC,
    rcCorner,
    rawString: raw,
  };
}

/**
 * Derive a clean, consistent CornerId from raw text or OperatingCondition.
 */
export function deriveCornerId(rawOrOpCond: string | OperatingCondition): CornerId {
  const op = typeof rawOrOpCond === "string" ? parseOperatingCondition(rawOrOpCond) : rawOrOpCond;
  if (!op.name || op.name === "default_corner") return "default_corner";
  return op.name.replace(/[^a-zA-Z0-9_\-]/g, "_").toLowerCase();
}

/**
 * Extract operating condition / corner string from a timing block or report header.
 */
export function extractCornerFromBlock(
  blockText: string,
  globalCorner?: string
): string {
  if (!blockText) return globalCorner || "default_corner";

  // Scan block for corner/scenario headers
  const opMatch = blockText.match(/(?:Operating conditions|Operating Condition):\s*(.*)/i);
  if (opMatch && opMatch[1].trim()) return opMatch[1].trim();

  const scenMatch = blockText.match(/(?:Scenario|Corner|Analysis View):\s*(.*)/i);
  if (scenMatch && scenMatch[1].trim()) return scenMatch[1].trim();

  return globalCorner || "default_corner";
}

/**
 * Build aggregated corner summaries from a list of paths.
 */
export function aggregateCornerSummaries<T extends { corner?: string; slack: number; type: "setup" | "hold" }>(
  paths: T[]
): CornerSummary[] {
  const map = new Map<string, CornerSummary>();

  paths.forEach((p) => {
    const rawCorner = p.corner || "default_corner";
    const id = deriveCornerId(rawCorner);
    let summary = map.get(id);

    if (!summary) {
      summary = {
        id,
        name: rawCorner,
        operatingCondition: parseOperatingCondition(rawCorner),
        pathCount: 0,
        wns: Infinity,
        tns: 0,
        wnsHold: Infinity,
        tnsHold: 0,
        failingCount: 0,
      };
      map.set(id, summary);
    }

    summary.pathCount++;
    if (p.slack < 0) summary.failingCount++;

    if (p.type === "hold") {
      if (p.slack < summary.wnsHold) summary.wnsHold = p.slack;
      if (p.slack < 0) summary.tnsHold += p.slack;
    } else {
      if (p.slack < summary.wns) summary.wns = p.slack;
      if (p.slack < 0) summary.tns += p.slack;
    }
  });

  const summaries = Array.from(map.values()).map((s) => ({
    ...s,
    wns: s.wns === Infinity ? 0 : parseFloat(s.wns.toFixed(4)),
    tns: parseFloat(s.tns.toFixed(4)),
    wnsHold: s.wnsHold === Infinity ? 0 : parseFloat(s.wnsHold.toFixed(4)),
    tnsHold: parseFloat(s.tnsHold.toFixed(4)),
  }));

  return summaries;
}

/** Extract Analysis View or Scenario name from a raw STA path block */
export function extractViewNameFromBlock(block: string): string | undefined {
  // Cadence / Innovus / Tempus: "Analysis View: func_setup_view" or "Analysis view : ..."
  const patterns = [
    /(?:Analysis\s+View|AnalysisView)\s*:\s*[{"]?([A-Za-z0-9_.\-]+)[}"]?/i,
    /(?:^|\n)\s*View\s*:\s*[{"]?([A-Za-z0-9_.\-]+)[}"]?/im,
    /(?:Scenario|scenario)\s*:\s*[{"]?([A-Za-z0-9_.\-]+)[}"]?/i,
    /(?:MMMC\s+View|mmmc_view)\s*:\s*[{"]?([A-Za-z0-9_.\-]+)[}"]?/i,
  ];
  for (const re of patterns) {
    const match = block.match(re);
    if (match?.[1]) return match[1];
  }
  return undefined;
}
