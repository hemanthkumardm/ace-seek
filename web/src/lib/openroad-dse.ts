/**
 * Measured DSE sessions — launch N real container jobs, Pareto from extracted metrics.
 */

import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { OpenroadProjectState } from "./openroad-project-hub";
import type { OpenroadOwner } from "./openroad-owner";
import { ownerRoot, safeOwnerId } from "./openroad-owner";
import { startOpenroadDockerJob, getDockerJob } from "./openroad-docker-runner";
import {
  computeMeasuredPareto,
  toMeasuredPpa,
  type MeasuredPpa,
} from "./openroad-compare";

export type DseVariantSpec = {
  id: string;
  label: string;
  density: number;
  clockPeriodNs?: number;
};

export type DseSession = {
  version: 1;
  dseId: string;
  ownerId: string;
  createdAt: string;
  untilStage: string;
  designName: string;
  topModule: string;
  flowProfile?: string;
  variants: {
    id: string;
    label: string;
    density: number;
    clockPeriodNs?: number;
    jobId: string;
  }[];
};

function dseDir(ownerId: string): string {
  return path.join(ownerRoot(safeOwnerId(ownerId)), "dse");
}

function dsePath(ownerId: string, dseId: string): string {
  return path.join(dseDir(ownerId), `${dseId}.json`);
}

export function defaultDseVariants(
  basePeriodNs: number | undefined
): DseVariantSpec[] {
  const p = basePeriodNs && basePeriodNs > 0 ? basePeriodNs : 10;
  return [
    { id: "lo", label: "Density 0.45", density: 0.45, clockPeriodNs: p },
    { id: "mid", label: "Density 0.55", density: 0.55, clockPeriodNs: p },
    { id: "hi", label: "Density 0.65", density: 0.65, clockPeriodNs: p },
  ];
}

export function startMeasuredDse(opts: {
  owner: OpenroadOwner;
  project: OpenroadProjectState;
  openlaneConfig?: Record<string, string | number | boolean>;
  untilStage?: string;
  variants?: DseVariantSpec[];
  basePeriodNs?: number;
}): { session: DseSession; error?: string } {
  const untilStage = opts.untilStage || "placement";
  const variants = (opts.variants?.length
    ? opts.variants
    : defaultDseVariants(opts.basePeriodNs)
  ).slice(0, 3);

  const dseId = `dse_${randomBytes(4).toString("hex")}`;
  const launched: DseSession["variants"] = [];

  for (const v of variants) {
    const cfg: Record<string, string | number | boolean> = {
      ...(opts.openlaneConfig || {}),
      PL_TARGET_DENSITY: v.density,
      ACE_FORCE_FRESH: 1, // each variant needs its own clean run
    };
    if (v.clockPeriodNs != null) {
      cfg.CLOCK_PERIOD = v.clockPeriodNs;
    }
    // Distinct persist by baking variant into a synthetic design tag via config
    cfg.ACE_DSE_VARIANT = v.id;

    const rec = startOpenroadDockerJob(opts.project, cfg, {
      untilStage,
      owner: opts.owner,
    });
    launched.push({
      id: v.id,
      label: v.label,
      density: v.density,
      clockPeriodNs: v.clockPeriodNs,
      jobId: rec.jobId,
    });
  }

  const session: DseSession = {
    version: 1,
    dseId,
    ownerId: opts.owner.ownerId,
    createdAt: new Date().toISOString(),
    untilStage,
    designName: opts.project.designName,
    topModule: opts.project.topModule,
    flowProfile: opts.project.flowProfile,
    variants: launched,
  };

  const dir = dseDir(opts.owner.ownerId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dsePath(opts.owner.ownerId, dseId), JSON.stringify(session, null, 2));

  return { session };
}

export function readDseSession(
  ownerId: string,
  dseId: string
): DseSession | null {
  try {
    const p = dsePath(ownerId, dseId);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as DseSession;
  } catch {
    return null;
  }
}

export function pollMeasuredDse(
  ownerId: string,
  dseId: string
): {
  session: DseSession;
  variants: MeasuredPpa[];
  pareto: MeasuredPpa[];
  allDone: boolean;
  anyFailed: boolean;
} | null {
  const session = readDseSession(ownerId, dseId);
  if (!session) return null;

  const variants: MeasuredPpa[] = session.variants.map((v) => {
    const job = getDockerJob(v.jobId, ownerId);
    return toMeasuredPpa({
      jobId: v.jobId,
      label: v.label,
      status: job?.status || "unknown",
      designName: job?.designName || session.designName,
      metrics: job?.metrics as Record<string, unknown> | undefined,
      logTail: job?.logTail,
      clockPeriodNs: v.clockPeriodNs,
      density: v.density,
    });
  });

  const measurable = variants.filter(
    (v) =>
      /succeed|done/i.test(v.status) &&
      (v.wnsNs != null || v.areaUm2 != null || v.powerMw != null)
  );
  const doneish = variants.filter((v) =>
    /succeed|done|fail|reject/i.test(v.status)
  );
  const allDone = doneish.length === variants.length && variants.length > 0;
  const anyFailed = variants.some((v) => /fail|reject/i.test(v.status));
  const pareto = computeMeasuredPareto(
    measurable.length ? measurable : variants.filter((v) => v.wnsNs != null)
  );

  return { session, variants, pareto, allDone, anyFailed };
}
