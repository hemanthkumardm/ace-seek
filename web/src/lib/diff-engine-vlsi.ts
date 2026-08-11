/**
 * VLSI Structural Diff & Delta Engine
 *
 * Provides specialized domain-aware structural comparison for:
 * 1. SDC Constraint States (Clocks, I/O delays, False Paths, Multicycles, Clock Groups)
 * 2. STA Timing Reports & Path Slacks (WNS/TNS deltas, path matching by signature, Δslack, Δarrival, Δrequired)
 * 3. ECO Proposal Effectiveness Verification (worked / partial / failed / unverified)
 */

import type {
  SdcStudioState,
  PrimaryClock,
  GeneratedClock,
  IoConstraint,
  MulticycleConstraint,
  FalsePathConstraint,
  ClockGroupRelation,
} from "./sdc-engine";

import type {
  TimingStudioState,
  TimingPath,
  EcoAction,
} from "./timing-engine";

// ---------------------------------------------------------------------------
// 1. SDC Structural Diff Types & Functions
// ---------------------------------------------------------------------------

export interface SdcClockDiff {
  name: string;
  type: "primary" | "generated";
  status: "added" | "removed" | "modified" | "unchanged";
  oldClock?: PrimaryClock | GeneratedClock;
  newClock?: PrimaryClock | GeneratedClock;
  periodDeltaNs?: number;
  targetsDelta?: boolean;
}

export interface SdcIoDiff {
  portName: string;
  clockName: string;
  delayType: "input" | "output";
  status: "added" | "removed" | "modified" | "unchanged";
  oldIo?: IoConstraint;
  newIo?: IoConstraint;
  maxNsDelta?: number;
  minNsDelta?: number;
}

export interface SdcExceptionDiff {
  id: string;
  type: "false_path" | "multicycle";
  spec: string;
  status: "added" | "removed" | "modified" | "unchanged";
  oldSpec?: FalsePathConstraint | MulticycleConstraint;
  newSpec?: FalsePathConstraint | MulticycleConstraint;
  cyclesDelta?: number;
}

export interface SdcGroupDiff {
  id: string;
  relationType: string;
  groups: string;
  status: "added" | "removed" | "unchanged";
  oldGroup?: ClockGroupRelation;
  newGroup?: ClockGroupRelation;
}

export interface SdcDiffResult {
  clocks: SdcClockDiff[];
  io: SdcIoDiff[];
  exceptions: SdcExceptionDiff[];
  groups: SdcGroupDiff[];
  stats: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    totalDeltas: number;
  };
}

export function diffSdcStates(
  stateA: SdcStudioState,
  stateB: SdcStudioState
): SdcDiffResult {
  const clocks: SdcClockDiff[] = [];
  const io: SdcIoDiff[] = [];
  const exceptions: SdcExceptionDiff[] = [];
  const groups: SdcGroupDiff[] = [];

  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;

  // --- Primary Clocks ---
  const clocksA = new Map(stateA.primaryClocks.map((c) => [c.name || c.id, c]));
  const clocksB = new Map(stateB.primaryClocks.map((c) => [c.name || c.id, c]));

  clocksA.forEach((clkA, name) => {
    const clkB = clocksB.get(name);
    if (!clkB) {
      clocks.push({ name, type: "primary", status: "removed", oldClock: clkA });
      removed++;
    } else {
      const pDelta = clkB.periodNs - clkA.periodNs;
      const targetsChanged = clkB.targets !== clkA.targets;
      const isMod = Math.abs(pDelta) > 0.0001 || targetsChanged;

      if (isMod) {
        clocks.push({
          name,
          type: "primary",
          status: "modified",
          oldClock: clkA,
          newClock: clkB,
          periodDeltaNs: pDelta,
          targetsDelta: targetsChanged,
        });
        modified++;
      } else {
        clocks.push({ name, type: "primary", status: "unchanged", oldClock: clkA, newClock: clkB });
        unchanged++;
      }
    }
  });

  clocksB.forEach((clkB, name) => {
    if (!clocksA.has(name)) {
      clocks.push({ name, type: "primary", status: "added", newClock: clkB });
      added++;
    }
  });

  // --- Generated Clocks ---
  const genA = new Map(stateA.generatedClocks.map((g) => [g.name || g.id, g]));
  const genB = new Map(stateB.generatedClocks.map((g) => [g.name || g.id, g]));

  genA.forEach((gA, name) => {
    const gB = genB.get(name);
    if (!gB) {
      clocks.push({ name, type: "generated", status: "removed", oldClock: gA });
      removed++;
    } else {
      const isMod = gA.divideBy !== gB.divideBy || gA.multiplyBy !== gB.multiplyBy || gA.masterClockId !== gB.masterClockId;
      if (isMod) {
        clocks.push({ name, type: "generated", status: "modified", oldClock: gA, newClock: gB });
        modified++;
      } else {
        clocks.push({ name, type: "generated", status: "unchanged", oldClock: gA, newClock: gB });
        unchanged++;
      }
    }
  });

  genB.forEach((gB, name) => {
    if (!genA.has(name)) {
      clocks.push({ name, type: "generated", status: "added", newClock: gB });
      added++;
    }
  });

  // --- I/O Constraints ---
  const ioKey = (i: IoConstraint) => `${i.portName}:${i.delayType}:${i.clockName}`;
  const ioA = new Map(stateA.ioConstraints.map((i) => [ioKey(i), i]));
  const ioB = new Map(stateB.ioConstraints.map((i) => [ioKey(i), i]));

  ioA.forEach((iA, key) => {
    const iB = ioB.get(key);
    if (!iB) {
      io.push({
        portName: iA.portName,
        clockName: iA.clockName,
        delayType: iA.delayType,
        status: "removed",
        oldIo: iA,
      });
      removed++;
    } else {
      const maxDelta = iB.maxNs - iA.maxNs;
      const minDelta = iB.minNs - iA.minNs;
      const isMod = Math.abs(maxDelta) > 0.0001 || Math.abs(minDelta) > 0.0001;

      if (isMod) {
        io.push({
          portName: iA.portName,
          clockName: iA.clockName,
          delayType: iA.delayType,
          status: "modified",
          oldIo: iA,
          newIo: iB,
          maxNsDelta: maxDelta,
          minNsDelta: minDelta,
        });
        modified++;
      } else {
        io.push({
          portName: iA.portName,
          clockName: iA.clockName,
          delayType: iA.delayType,
          status: "unchanged",
          oldIo: iA,
          newIo: iB,
        });
        unchanged++;
      }
    }
  });

  ioB.forEach((iB, key) => {
    if (!ioA.has(key)) {
      io.push({
        portName: iB.portName,
        clockName: iB.clockName,
        delayType: iB.delayType,
        status: "added",
        newIo: iB,
      });
      added++;
    }
  });

  // --- False Paths ---
  const fpKey = (f: FalsePathConstraint) => `${f.from || "*"}>${f.through || "*"}>${f.to || "*"}`;
  const fpA = new Map(stateA.falsePaths.map((f) => [fpKey(f), f]));
  const fpB = new Map(stateB.falsePaths.map((f) => [fpKey(f), f]));

  fpA.forEach((fA, key) => {
    const fB = fpB.get(key);
    if (!fB) {
      exceptions.push({ id: fA.id, type: "false_path", spec: key, status: "removed", oldSpec: fA });
      removed++;
    } else {
      exceptions.push({ id: fA.id, type: "false_path", spec: key, status: "unchanged", oldSpec: fA, newSpec: fB });
      unchanged++;
    }
  });

  fpB.forEach((fB, key) => {
    if (!fpA.has(key)) {
      exceptions.push({ id: fB.id, type: "false_path", spec: key, status: "added", newSpec: fB });
      added++;
    }
  });

  // --- Multicycles ---
  const mcKey = (m: MulticycleConstraint) => `${m.from || "*"}>${m.to || "*"}:${m.type}`;
  const mcA = new Map(stateA.multicycles.map((m) => [mcKey(m), m]));
  const mcB = new Map(stateB.multicycles.map((m) => [mcKey(m), m]));

  mcA.forEach((mA, key) => {
    const mB = mcB.get(key);
    if (!mB) {
      exceptions.push({ id: mA.id, type: "multicycle", spec: key, status: "removed", oldSpec: mA });
      removed++;
    } else {
      const cyclesDelta = mB.cycles - mA.cycles;
      if (cyclesDelta !== 0) {
        exceptions.push({
          id: mA.id,
          type: "multicycle",
          spec: key,
          status: "modified",
          oldSpec: mA,
          newSpec: mB,
          cyclesDelta,
        });
        modified++;
      } else {
        exceptions.push({ id: mA.id, type: "multicycle", spec: key, status: "unchanged", oldSpec: mA, newSpec: mB });
        unchanged++;
      }
    }
  });

  mcB.forEach((mB, key) => {
    if (!mcA.has(key)) {
      exceptions.push({ id: mB.id, type: "multicycle", spec: key, status: "added", newSpec: mB });
      added++;
    }
  });

  // --- Clock Groups ---
  const grpKey = (g: ClockGroupRelation) => `${g.group1Clocks.join(",")}:${g.group2Clocks.join(",")}`;
  const grpA = new Map(stateA.clockGroups.map((g) => [grpKey(g), g]));
  const grpB = new Map(stateB.clockGroups.map((g) => [grpKey(g), g]));

  grpA.forEach((gA, key) => {
    const gB = grpB.get(key);
    if (!gB) {
      groups.push({ id: gA.id, relationType: gA.relationType, groups: key, status: "removed", oldGroup: gA });
      removed++;
    } else {
      groups.push({ id: gA.id, relationType: gA.relationType, groups: key, status: "unchanged", oldGroup: gA, newGroup: gB });
      unchanged++;
    }
  });

  grpB.forEach((gB, key) => {
    if (!grpA.has(key)) {
      groups.push({ id: gB.id, relationType: gB.relationType, groups: key, status: "added", newGroup: gB });
      added++;
    }
  });

  return {
    clocks,
    io,
    exceptions,
    groups,
    stats: {
      added,
      removed,
      modified,
      unchanged,
      totalDeltas: added + removed + modified,
    },
  };
}

// ---------------------------------------------------------------------------
// 2. STA Timing Path Matching & Delta Types
// ---------------------------------------------------------------------------

export type PathDiffStatus =
  | "new_failing"
  | "fixed"
  | "regressed"
  | "improved"
  | "unchanged"
  | "added"
  | "removed";

export interface PathDiffPair {
  signature: string;
  startpoint: string;
  endpoint: string;
  type: "setup" | "hold";
  pathGroup: string;
  pathA: TimingPath | null;
  pathB: TimingPath | null;
  status: PathDiffStatus;
  deltaSlackNs: number;
  deltaArrivalNs: number;
  deltaRequiredNs: number;
}

export interface TimingDiffResult {
  deltaWns: number;
  deltaTns: number;
  deltaFailingCount: number;
  deltaWnsHold: number;
  deltaTnsHold: number;
  pairs: PathDiffPair[];
  counts: {
    regressed: number;
    improved: number;
    newFailing: number;
    fixed: number;
    unchanged: number;
    added: number;
    removed: number;
    totalMatched: number;
  };
}

/** Compute path signature for matching across reports */
export function pathSignature(p: TimingPath): string {
  return `${p.startpoint.trim()} -> ${p.endpoint.trim()} [${p.type}:${p.pathGroup}]`;
}

export function diffTimingStates(
  stateA: TimingStudioState,
  stateB: TimingStudioState
): TimingDiffResult {
  const deltaWns = parseFloat((stateB.wns - stateA.wns).toFixed(4));
  const deltaTns = parseFloat((stateB.tns - stateA.tns).toFixed(4));
  const deltaFailingCount = stateB.failingCount - stateA.failingCount;
  const deltaWnsHold = parseFloat((stateB.wnsHold - stateA.wnsHold).toFixed(4));
  const deltaTnsHold = parseFloat((stateB.tnsHold - stateA.tnsHold).toFixed(4));

  const mapA = new Map<string, TimingPath[]>();
  stateA.paths.forEach((p) => {
    const sig = pathSignature(p);
    const list = mapA.get(sig) || [];
    list.push(p);
    mapA.set(sig, list);
  });

  const mapB = new Map<string, TimingPath[]>();
  stateB.paths.forEach((p) => {
    const sig = pathSignature(p);
    const list = mapB.get(sig) || [];
    list.push(p);
    mapB.set(sig, list);
  });

  const allSignatures = new Set([...mapA.keys(), ...mapB.keys()]);
  const pairs: PathDiffPair[] = [];

  const counts = {
    regressed: 0,
    improved: 0,
    newFailing: 0,
    fixed: 0,
    unchanged: 0,
    added: 0,
    removed: 0,
    totalMatched: 0,
  };

  allSignatures.forEach((sig) => {
    const listA = mapA.get(sig) || [];
    const listB = mapB.get(sig) || [];

    const maxCount = Math.max(listA.length, listB.length);
    for (let i = 0; i < maxCount; i++) {
      const pA = listA[i] || null;
      const pB = listB[i] || null;

      if (pA && pB) {
        counts.totalMatched++;
        const deltaSlack = parseFloat((pB.slack - pA.slack).toFixed(4));
        const deltaArrival = parseFloat((pB.arrivalTime - pA.arrivalTime).toFixed(4));
        const deltaRequired = parseFloat((pB.requiredTime - pA.requiredTime).toFixed(4));

        let status: PathDiffStatus = "unchanged";
        if (pA.slack >= 0 && pB.slack < 0) {
          status = "new_failing";
          counts.newFailing++;
        } else if (pA.slack < 0 && pB.slack >= 0) {
          status = "fixed";
          counts.fixed++;
        } else if (deltaSlack < -0.005) {
          status = "regressed";
          counts.regressed++;
        } else if (deltaSlack > 0.005) {
          status = "improved";
          counts.improved++;
        } else {
          status = "unchanged";
          counts.unchanged++;
        }

        pairs.push({
          signature: sig,
          startpoint: pA.startpoint,
          endpoint: pA.endpoint,
          type: pA.type,
          pathGroup: pA.pathGroup,
          pathA: pA,
          pathB: pB,
          status,
          deltaSlackNs: deltaSlack,
          deltaArrivalNs: deltaArrival,
          deltaRequiredNs: deltaRequired,
        });
      } else if (pA && !pB) {
        counts.removed++;
        pairs.push({
          signature: sig,
          startpoint: pA.startpoint,
          endpoint: pA.endpoint,
          type: pA.type,
          pathGroup: pA.pathGroup,
          pathA: pA,
          pathB: null,
          status: "removed",
          deltaSlackNs: 0,
          deltaArrivalNs: 0,
          deltaRequiredNs: 0,
        });
      } else if (!pA && pB) {
        counts.added++;
        pairs.push({
          signature: sig,
          startpoint: pB.startpoint,
          endpoint: pB.endpoint,
          type: pB.type,
          pathGroup: pB.pathGroup,
          pathA: null,
          pathB: pB,
          status: "added",
          deltaSlackNs: 0,
          deltaArrivalNs: 0,
          deltaRequiredNs: 0,
        });
      }
    }
  });

  return {
    deltaWns,
    deltaTns,
    deltaFailingCount,
    deltaWnsHold,
    deltaTnsHold,
    pairs,
    counts,
  };
}

// ---------------------------------------------------------------------------
// 3. ECO Effectiveness Verification
// ---------------------------------------------------------------------------

export type EcoVerifyStatus = "worked" | "partial" | "failed" | "unverified";

export interface EcoVerificationResult {
  eco: EcoAction;
  status: EcoVerifyStatus;
  targetPathSignature?: string;
  slackBeforeNs?: number;
  slackAfterNs?: number;
  deltaSlackNs?: number;
  explanation: string;
}

export function evaluateEcoEffectiveness(
  proposals: EcoAction[],
  diff: TimingDiffResult
): EcoVerificationResult[] {
  return proposals.map((eco) => {
    // Find matching path in diff result by targeted pin/cell or startpoint/endpoint
    const targetPin = eco.target || "";
    const targetPair = diff.pairs.find((p) => {
      if (!targetPin) return false;
      const matchStart = p.startpoint.includes(targetPin) || targetPin.includes(p.startpoint);
      const matchEnd = p.endpoint.includes(targetPin) || targetPin.includes(p.endpoint);
      return matchStart || matchEnd || (p.pathA && p.pathA.steps.some((s) => s.point.includes(targetPin)));
    });

    if (!targetPair || !targetPair.pathA || !targetPair.pathB) {
      return {
        eco,
        status: "unverified",
        explanation: "Target path not found in Report B for verification.",
      };
    }

    const before = targetPair.pathA.slack;
    const after = targetPair.pathB.slack;
    const delta = targetPair.deltaSlackNs;

    if (after >= 0 || (before < 0 && delta >= Math.abs(before) * 0.8)) {
      return {
        eco,
        status: "worked",
        targetPathSignature: targetPair.signature,
        slackBeforeNs: before,
        slackAfterNs: after,
        deltaSlackNs: delta,
        explanation: `Path fixed/significantly improved (slack ${before.toFixed(3)} → ${after.toFixed(3)} ns).`,
      };
    }

    if (delta > 0.01) {
      return {
        eco,
        status: "partial",
        targetPathSignature: targetPair.signature,
        slackBeforeNs: before,
        slackAfterNs: after,
        deltaSlackNs: delta,
        explanation: `Slack improved (+${delta.toFixed(3)} ns), but path is still failing (${after.toFixed(3)} ns).`,
      };
    }

    return {
      eco,
      status: "failed",
      targetPathSignature: targetPair.signature,
      slackBeforeNs: before,
      slackAfterNs: after,
      deltaSlackNs: delta,
      explanation: `Slack did not improve (delta: ${delta.toFixed(3)} ns).`,
    };
  });
}
