/**
 * PnR coach — classify OpenLane/OpenROAD stage logs + metrics into actionable tips.
 * Pure helpers (no Node fs). Safe for client + server.
 */

export type CoachSeverity = "info" | "warn" | "critical" | "ok";

export type CoachTip = {
  id: string;
  severity: CoachSeverity;
  stage?: string;
  headline: string;
  tip: string;
  evidence?: string;
};

export type CoachMetrics = {
  wnsNs?: number | null;
  tnsNs?: number | null;
  areaUm2?: number | null;
  powerMw?: number | null;
  utilizationPct?: number | null;
  cellCount?: number | null;
  status?: string | null;
};

type Rule = {
  id: string;
  severity: CoachSeverity;
  stage?: string;
  pattern: RegExp;
  headline: string;
  tip: string;
};

const LOG_RULES: Rule[] = [
  {
    id: "automacro_bypass",
    severity: "info",
    stage: "floorplan",
    pattern: /zero hard macros|bypassing Ace-AutoMacro|ACE_AUTOMACRO=0/i,
    headline: "Ace-AutoMacro bypassed",
    tip: "No hard macros (or AutoMacro off). Stdcell-only floorplan is expected — turn AutoMacro on in Engines if you add SRAM/macros.",
  },
  {
    id: "automacro_placed",
    severity: "ok",
    stage: "floorplan",
    pattern: /Ace-AutoMacro placed and locked macros/i,
    headline: "Ace-AutoMacro placed macros",
    tip: "Macros locked with halos. Check ace_automacro.log and confirm PDN rings still clear the halo keepouts.",
  },
  {
    id: "automacro_skip",
    severity: "warn",
    stage: "floorplan",
    pattern: /Ace-AutoMacro notice: skipped|ace_macro_placer engine not present/i,
    headline: "Ace-AutoMacro skipped",
    tip: "Engine missing or CLI failed. Confirm ace_macro_placer is in the worker image, or disable AutoMacro and place macros manually.",
  },
  {
    id: "resume_required",
    severity: "critical",
    stage: "flow",
    pattern: /RESUME_REQUIRED_FAILED|refusing to wipe|ACE_FORCE_FRESH/i,
    headline: "Resume / overwrite blocked",
    tip: "Strict resume prevented wiping ace_run. Re-run with Force fresh, or resume from the last checkpoint stage.",
  },
  {
    id: "pdn_no_space",
    severity: "critical",
    stage: "powerplan",
    pattern: /no space for.*(?:pdn|power)|PDN.*fail|core ring.*fit|FP_PDN.*error/i,
    headline: "PDN ring / strap fit issue",
    tip: "Widen die−core halo (DIE_AREA vs CORE_AREA), reduce ring width/pitch, or lower core utilization so rings fit.",
  },
  {
    id: "congestion",
    severity: "warn",
    stage: "placement",
    pattern: /congestion|overflow|GRT-011[0-9]|detailed routing.*fail|DRT-0/i,
    headline: "Routing congestion signals",
    tip: "Lower PL_TARGET_DENSITY, add placement density screens, or enlarge the die. Re-run place → CTS → route after changes.",
  },
  {
    id: "antenna",
    severity: "warn",
    stage: "routing",
    pattern: /antenna violation|ANTENNA|diode insertion/i,
    headline: "Antenna / diode activity",
    tip: "Enable diode insertion or add jumpers on long poly/metal. Re-check after incremental route.",
  },
  {
    id: "drc",
    severity: "critical",
    stage: "signoff",
    pattern: /DRC.*(error|fail|violat)|Magic DRC|KLayout.*error/i,
    headline: "DRC failures in signoff",
    tip: "Open the DRC report artifact, fix spacing/width/enclosure, then re-run route → signoff. Do not treat GDS as tapeout-ready.",
  },
  {
    id: "lvs",
    severity: "critical",
    stage: "signoff",
    pattern: /LVS.*(fail|mismatch|error)|netlist.*disagree/i,
    headline: "LVS mismatch",
    tip: "Compare extracted vs schematic netlist. Check pin names, fill/decap connectivity, and power rail ties before re-streaming GDS.",
  },
  {
    id: "timing_setup",
    severity: "warn",
    stage: "cts",
    pattern: /setup.*violat|negative slack|WNS\s*=?\s*-/i,
    headline: "Setup / WNS pressure in logs",
    tip: "Relax CLOCK_PERIOD slightly, reduce density, or run timing ECO (repair_timing / buffer move). Use the Timing tab for path-level advice.",
  },
  {
    id: "timing_hold",
    severity: "warn",
    stage: "cts",
    pattern: /hold.*violat|hold slack/i,
    headline: "Hold violations mentioned",
    tip: "Insert hold buffers on short paths, check useful skew after CTS, and verify FF→FF min delay corners.",
  },
  {
    id: "synth_unmapped",
    severity: "critical",
    stage: "synthesis",
    pattern: /unmapped|black.?box|Cannot find cell|Yosys.*ERROR/i,
    headline: "Synth mapping / blackbox issue",
    tip: "Confirm liberty + liberty cells match the PDK, fix missing modules, and re-run synthesis before floorplan.",
  },
  {
    id: "sdc_clock",
    severity: "warn",
    stage: "synthesis",
    pattern: /no clock|create_clock|SDC.*missing|clock port/i,
    headline: "Clock / SDC warning",
    tip: "Upload an SDC with create_clock on the real clock port, or set CLOCK_PORT / CLOCK_PERIOD in the Synthesis stage panel.",
  },
  {
    id: "fresh_run",
    severity: "info",
    stage: "flow",
    pattern: /ACE_FORCE_FRESH|FRESH_|starting clean|wiping ace_run/i,
    headline: "Fresh run requested",
    tip: "This job rebuilt from RTL instead of resuming. Expect longer runtime; checkpoints from prior stages are not reused.",
  },
];

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

/** Dedupe by id; keep highest severity. */
function mergeTips(tips: CoachTip[]): CoachTip[] {
  const rank: Record<CoachSeverity, number> = {
    critical: 0,
    warn: 1,
    info: 2,
    ok: 3,
  };
  const map = new Map<string, CoachTip>();
  for (const t of tips) {
    const prev = map.get(t.id);
    if (!prev || rank[t.severity] < rank[prev.severity]) map.set(t.id, t);
  }
  return [...map.values()].sort(
    (a, b) => rank[a.severity] - rank[b.severity]
  );
}

export function coachFromLog(
  logText: string,
  opts?: { maxTips?: number }
): CoachTip[] {
  const text = logText || "";
  const lines = text.split(/\r?\n/);
  const tips: CoachTip[] = [];
  for (const rule of LOG_RULES) {
    let evidence: string | undefined;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (rule.pattern.test(lines[i])) {
        evidence = lines[i].trim().slice(0, 200);
        break;
      }
    }
    if (!evidence && !rule.pattern.test(text)) continue;
    tips.push({
      id: rule.id,
      severity: rule.severity,
      stage: rule.stage,
      headline: rule.headline,
      tip: rule.tip,
      evidence: evidence || undefined,
    });
  }
  const max = opts?.maxTips ?? 8;
  return mergeTips(tips).slice(0, max);
}

export function coachFromMetrics(metrics: CoachMetrics): CoachTip[] {
  const tips: CoachTip[] = [];
  const wns = num(metrics.wnsNs);
  const util = num(metrics.utilizationPct);
  const status = (metrics.status || "").toLowerCase();

  if (/fail|reject/.test(status)) {
    tips.push({
      id: "job_failed",
      severity: "critical",
      headline: "Job failed",
      tip: "Open the Signoff Log tab and Artifacts for the failing stage. Fix the first ERROR, then resume from that stage (or Force fresh).",
    });
  }

  if (wns != null && wns < -0.05) {
    tips.push({
      id: "metric_wns_neg",
      severity: "critical",
      headline: `WNS ${wns.toFixed(3)} ns (setup)`,
      tip: "Design is timing-critical. Try lower density, slightly longer CLOCK_PERIOD, or Timing-tab ECO buffers on the worst paths.",
      evidence: `wnsNs=${wns}`,
    });
  } else if (wns != null && wns < 0) {
    tips.push({
      id: "metric_wns_tight",
      severity: "warn",
      headline: `WNS ${wns.toFixed(3)} ns (tight)`,
      tip: "Near-zero slack — avoid raising density; consider modest period relief or CTS useful skew before signoff.",
      evidence: `wnsNs=${wns}`,
    });
  } else if (wns != null && wns >= 0) {
    tips.push({
      id: "metric_wns_ok",
      severity: "ok",
      headline: `WNS ${wns.toFixed(3)} ns`,
      tip: "Setup slack is non-negative at this stage — still verify hold and multi-corner reports before tapeout claims.",
      evidence: `wnsNs=${wns}`,
    });
  }

  if (util != null && util > 75) {
    tips.push({
      id: "metric_util_high",
      severity: "warn",
      headline: `Utilization ~${util.toFixed(1)}%`,
      tip: "High util often causes congestion. Enlarge die/core or lower FP_CORE_UTIL / PL_TARGET_DENSITY before route.",
      evidence: `utilizationPct=${util}`,
    });
  }

  return tips;
}

export function buildPnrCoach(input: {
  logText?: string;
  metrics?: CoachMetrics | null;
  maxTips?: number;
}): CoachTip[] {
  const fromLog = coachFromLog(input.logText || "", { maxTips: 12 });
  const fromMetrics = coachFromMetrics(input.metrics || {});
  return mergeTips([...fromMetrics, ...fromLog]).slice(0, input.maxTips ?? 8);
}
