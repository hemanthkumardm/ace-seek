/**
 * User-facing OpenROAD logs — strip host paths and noisy tool noise;
 * expose friendly progress summaries for Studio.
 */

const ABS_PATH =
  /(?:^|[\s="'(:])((?:\/(?:home|data|tmp|var|opt|root|usr|openlane|app|Users)[^\s"'\)\]]+)|(?:[A-Za-z]:\\[^\s"'\)\]]+))/g;

const NOISE =
  /^(?:\+|set -e|export |which |ls -la|mkdir -p|cd \/|DOCKER|Image:|Job dir:|PDK_ROOT=|OPENROAD_|ACE_OPENLANE_|ACE_EXTERNAL_|OPENLANE_|DESIGN_SLUG=|RUN_DIR=|=== OpenLane env ===)/i;

/** Redact absolute paths and replace with short tokens. */
export function sanitizeOpenroadLogLine(line: string): string {
  let s = line.replace(/\r/g, "");
  s = s.replace(ABS_PATH, (full, pathPart: string) => {
    const prefix = full.slice(0, full.length - pathPart.length);
    const base = pathPart.split(/[/\\]/).filter(Boolean).pop() || "file";
    return `${prefix}<${base}>`;
  });
  // Collapse leftover long path-looking segments
  s = s.replace(/\/[a-zA-Z0-9._-]{2,}(?:\/[a-zA-Z0-9._-]+){3,}/g, (m) => {
    const base = m.split("/").filter(Boolean).pop() || "path";
    return `<${base}>`;
  });
  return s.trimEnd();
}

export function sanitizeOpenroadLogText(text: string): string {
  if (!text) return "";
  return text
    .split(/\r?\n/)
    .map(sanitizeOpenroadLogLine)
    .filter((l) => {
      const t = l.trim();
      if (!t) return false;
      if (NOISE.test(t)) return false;
      if (/^#{3,}/.test(t)) return false;
      return true;
    })
    .join("\n");
}

/** Map raw status/log → short user progress line. */
export function friendlyOpenroadProgress(opts: {
  status?: string;
  stage?: string;
  message?: string;
  log?: string;
}): string {
  const stage = (opts.stage || "flow").replace(/_/g, " ");
  const st = (opts.status || "").toLowerCase();
  const log = opts.log || "";
  const msg = opts.message || "";

  if (st === "queued") return `Queued — ${stage} will start when a slot is free…`;
  if (st === "preparing") return `Preparing ${stage}…`;
  if (st === "rejected") return sanitizeOpenroadLogLine(msg || `${stage} could not start`);
  if (st === "failed") {
    if (/quota/i.test(msg)) return msg;
    if (/PDK|not found|not runnable/i.test(msg + log))
      return `${stage} failed — process kit not available. Try SkyWater 130nm or contact support.`;
    return sanitizeOpenroadLogLine(msg || `${stage} failed — see log for details`);
  }
  if (st === "succeeded") {
    if (/GDS|gds/i.test(msg + log)) return `${stage} finished — layout (GDS) ready`;
    return `${stage} finished successfully`;
  }

  // Running — pick last meaningful ACE-Seek / OpenLane milestone
  const milestones: { re: RegExp; label: string }[] = [
    { re: /skip synthesis \(external/i, label: "Using your synthesis netlist…" },
    { re: /=== step synthesis/i, label: "Running synthesis…" },
    { re: /=== step floorplan/i, label: "Running floorplan…" },
    { re: /=== step placement|Running placement/i, label: "Running placement…" },
    { re: /=== step cts|Clock tree/i, label: "Building clock tree…" },
    { re: /=== step routing|Global routing|Detailed routing/i, label: "Routing…" },
    { re: /Magic|GDS|streamout/i, label: "Writing layout (GDS)…" },
    { re: /Number of cells/i, label: "Synthesis stats ready…" },
    { re: /stopped after/i, label: `${stage} wrapping up…` },
  ];
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (milestones[i].re.test(log) || milestones[i].re.test(msg)) {
      return milestones[i].label;
    }
  }
  if (st === "running" || st === "collecting") {
    return `${stage} is running…`;
  }
  const cleaned = sanitizeOpenroadLogLine(msg);
  if (cleaned && !/\//.test(cleaned) && cleaned.length < 120) return cleaned;
  return stage ? `Working on ${stage}…` : "Working…";
}

/** Keep only high-signal lines for the user log panel. */
export function userFacingLogLines(text: string, maxLines = 200): string[] {
  const cleaned = sanitizeOpenroadLogText(text);
  const prefer =
    /ACE-Seek:|step |OK|FAILED|error|warn|Number of cells|wns|tns|Design area|Total\s+|GDS|stopped after|Queued|Preparing|OpenLane|Yosys|Verilator|lint|VCD|SUCCESS|FAIL/i;
  const lines = cleaned.split("\n").filter((l) => l.trim());
  const picked = lines.filter((l) => prefer.test(l));
  const use = picked.length >= 3 ? picked : lines;
  return use.slice(-maxLines);
}
