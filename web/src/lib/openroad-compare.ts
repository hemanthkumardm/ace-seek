/**
 * Compare two OpenROAD jobs + Pareto helpers for measured DSE.
 */

export type MeasuredPpa = {
  jobId: string;
  label?: string;
  status: string;
  designName?: string;
  wnsNs?: number;
  tnsNs?: number;
  areaUm2?: number;
  powerMw?: number;
  utilizationPct?: number;
  cellCount?: number;
  wirelengthUm?: number;
  /** Optional clock period used for the variant (ns) */
  clockPeriodNs?: number;
  /** Optional density target */
  density?: number;
  logSnippet?: string;
};

export type RunCompareResult = {
  a: MeasuredPpa;
  b: MeasuredPpa;
  deltas: {
    wnsNs?: number;
    tnsNs?: number;
    areaUm2?: number;
    powerMw?: number;
    utilizationPct?: number;
    cellCount?: number;
  };
  verdict: string;
  logDiff: { onlyA: string[]; onlyB: string[]; sharedHints: string[] };
};

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

export function toMeasuredPpa(input: {
  jobId: string;
  status: string;
  designName?: string;
  label?: string;
  metrics?: Record<string, unknown> | null;
  logTail?: string;
  clockPeriodNs?: number;
  density?: number;
}): MeasuredPpa {
  const m = input.metrics || {};
  return {
    jobId: input.jobId,
    label: input.label,
    status: input.status,
    designName: input.designName,
    wnsNs: num(m.wnsNs),
    tnsNs: num(m.tnsNs),
    areaUm2: num(m.areaUm2),
    powerMw: num(m.powerMw),
    utilizationPct: num(m.utilizationPct),
    cellCount: num(m.cellCount),
    wirelengthUm: num(m.wirelengthUm),
    clockPeriodNs: input.clockPeriodNs,
    density: input.density,
    logSnippet: (input.logTail || "").slice(-2500),
  };
}

function delta(a?: number, b?: number): number | undefined {
  if (a == null || b == null) return undefined;
  return Math.round((b - a) * 1000) / 1000;
}

export function compareRuns(a: MeasuredPpa, b: MeasuredPpa): RunCompareResult {
  const deltas = {
    wnsNs: delta(a.wnsNs, b.wnsNs),
    tnsNs: delta(a.tnsNs, b.tnsNs),
    areaUm2: delta(a.areaUm2, b.areaUm2),
    powerMw: delta(a.powerMw, b.powerMw),
    utilizationPct: delta(a.utilizationPct, b.utilizationPct),
    cellCount: delta(a.cellCount, b.cellCount),
  };

  const bits: string[] = [];
  if (deltas.wnsNs != null) {
    bits.push(
      deltas.wnsNs > 0
        ? `B better WNS by ${deltas.wnsNs.toFixed(3)} ns`
        : deltas.wnsNs < 0
          ? `A better WNS by ${(-deltas.wnsNs).toFixed(3)} ns`
          : "WNS tied"
    );
  }
  if (deltas.areaUm2 != null) {
    bits.push(
      deltas.areaUm2 < 0
        ? `B smaller area (${deltas.areaUm2.toFixed(0)} µm²)`
        : deltas.areaUm2 > 0
          ? `A smaller area (${(-deltas.areaUm2).toFixed(0)} µm²)`
          : "Area tied"
    );
  }
  if (deltas.powerMw != null) {
    bits.push(
      deltas.powerMw < 0
        ? `B lower power (${deltas.powerMw.toFixed(3)} mW)`
        : deltas.powerMw > 0
          ? `A lower power (${(-deltas.powerMw).toFixed(3)} mW)`
          : "Power tied"
    );
  }
  if (!bits.length) bits.push("Insufficient measured metrics to score — wait for reports.");

  const linesA = new Set(
    (a.logSnippet || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /ACE-Seek:|WNS|TNS|error|FAILED|RESUME_|FRESH_/i.test(l))
  );
  const linesB = new Set(
    (b.logSnippet || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /ACE-Seek:|WNS|TNS|error|FAILED|RESUME_|FRESH_/i.test(l))
  );
  const onlyA = [...linesA].filter((l) => !linesB.has(l)).slice(-12);
  const onlyB = [...linesB].filter((l) => !linesA.has(l)).slice(-12);
  const sharedHints = [...linesA].filter((l) => linesB.has(l)).slice(-8);

  return {
    a,
    b,
    deltas,
    verdict: bits.join(" · "),
    logDiff: { onlyA, onlyB, sharedHints },
  };
}

/** Maximize WNS; minimize power & area. Frequency derived from period if present. */
export function computeMeasuredPareto(candidates: MeasuredPpa[]): MeasuredPpa[] {
  const enriched = candidates.map((c) => ({
    ...c,
    frequency_mhz:
      c.clockPeriodNs && c.clockPeriodNs > 0 ? 1000 / c.clockPeriodNs : 0,
    wns_ns: c.wnsNs ?? -999,
    total_power_mw: c.powerMw ?? 999,
    area_um2: c.areaUm2 ?? 9e9,
  }));

  const frontier: MeasuredPpa[] = [];
  for (let i = 0; i < enriched.length; i++) {
    const a = enriched[i];
    let dominated = false;
    for (let j = 0; j < enriched.length; j++) {
      if (i === j) continue;
      const b = enriched[j];
      const ge =
        b.frequency_mhz >= a.frequency_mhz &&
        b.wns_ns >= a.wns_ns &&
        b.total_power_mw <= a.total_power_mw &&
        b.area_um2 <= a.area_um2;
      const strict =
        b.frequency_mhz > a.frequency_mhz ||
        b.wns_ns > a.wns_ns ||
        b.total_power_mw < a.total_power_mw ||
        b.area_um2 < a.area_um2;
      if (ge && strict) {
        dominated = true;
        break;
      }
    }
    if (!dominated) frontier.push(candidates[i]);
  }
  return frontier;
}
