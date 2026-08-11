/**
 * ECO Session Model & Predicted Timing Calculation Engine.
 * Provides local storage persistence and multi-action diminishing returns metrics modeling.
 */

import { EcoAction, SolverStage, TimingPath } from "./timing-engine";
import { EcoVendor } from "./eco-scripts/index";

export const ECO_SESSION_STORAGE_KEY = "ace_seek_eco_session_v1";

export interface EcoSession {
  id: string;
  name: string;
  stage: SolverStage;
  vendor: EcoVendor;
  selectedActionIds: string[];
  pathIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PredictedTimingMetrics {
  baselineWnsSetup: number;
  baselineTnsSetup: number;
  baselineWnsHold: number;
  baselineTnsHold: number;

  predictedWnsSetup: number;
  predictedTnsSetup: number;
  predictedWnsHold: number;
  predictedTnsHold: number;

  effectiveTotalGainNs: number;
  selectedActionCount: number;
  targetedPathCount: number;
}

/**
 * Calculate predicted timing metrics (WNS/TNS) from selected ECO actions
 * applying a diminishing returns model for repeated target interventions.
 */
export function computePredictedMetrics(
  paths: TimingPath[],
  selectedActions: EcoAction[]
): PredictedTimingMetrics {
  let baselineWnsSetup = Infinity;
  let baselineTnsSetup = 0;
  let baselineWnsHold = Infinity;
  let baselineTnsHold = 0;

  paths.forEach((p) => {
    if (p.type === "hold") {
      if (p.slack < baselineWnsHold) baselineWnsHold = p.slack;
      if (p.slack < 0) baselineTnsHold += p.slack;
    } else {
      if (p.slack < baselineWnsSetup) baselineWnsSetup = p.slack;
      if (p.slack < 0) baselineTnsSetup += p.slack;
    }
  });

  if (baselineWnsSetup === Infinity) baselineWnsSetup = 0;
  if (baselineWnsHold === Infinity) baselineWnsHold = 0;

  if (!selectedActions || selectedActions.length === 0 || paths.length === 0) {
    return {
      baselineWnsSetup: parseFloat(baselineWnsSetup.toFixed(4)),
      baselineTnsSetup: parseFloat(baselineTnsSetup.toFixed(4)),
      baselineWnsHold: parseFloat(baselineWnsHold.toFixed(4)),
      baselineTnsHold: parseFloat(baselineTnsHold.toFixed(4)),
      predictedWnsSetup: parseFloat(baselineWnsSetup.toFixed(4)),
      predictedTnsSetup: parseFloat(baselineTnsSetup.toFixed(4)),
      predictedWnsHold: parseFloat(baselineWnsHold.toFixed(4)),
      predictedTnsHold: parseFloat(baselineTnsHold.toFixed(4)),
      effectiveTotalGainNs: 0,
      selectedActionCount: 0,
      targetedPathCount: 0,
    };
  }

  // Diminishing returns model:
  // Track action count per target.
  // 1st action on target: 100% gain, 2nd: 50% gain, 3rd: 25% gain, etc.
  const targetUsageMap = new Map<string, number>();
  let effectiveTotalGainNs = 0;
  const targetPaths = new Set<string>();

  const pathGainMap = new Map<string, number>();

  selectedActions.forEach((action) => {
    const targetKey = (action.target || "global").toLowerCase();
    const prevCount = targetUsageMap.get(targetKey) || 0;
    targetUsageMap.set(targetKey, prevCount + 1);

    const attenuation = Math.pow(0.5, prevCount);
    const effGain = action.estGainNs * attenuation;
    effectiveTotalGainNs += effGain;

    // Distribute gain to paths targeting or ending at this pin/net/startpoint
    paths.forEach((p) => {
      const pTargetMatch =
        p.endpoint.toLowerCase().includes(targetKey) ||
        p.startpoint.toLowerCase().includes(targetKey) ||
        targetKey.includes(p.id.toLowerCase());

      if (pTargetMatch || selectedActions.length <= 2) {
        targetPaths.add(p.id);
        const currentGain = pathGainMap.get(p.id) || 0;
        pathGainMap.set(p.id, currentGain + effGain);
      }
    });
  });

  // Calculate predicted slacks
  let predictedWnsSetup = Infinity;
  let predictedTnsSetup = 0;
  let predictedWnsHold = Infinity;
  let predictedTnsHold = 0;

  paths.forEach((p) => {
    const gain = pathGainMap.get(p.id) || (selectedActions.length > 0 ? effectiveTotalGainNs * 0.2 : 0);
    const newSlack = p.slack + gain;

    if (p.type === "hold") {
      if (newSlack < predictedWnsHold) predictedWnsHold = newSlack;
      if (newSlack < 0) predictedTnsHold += newSlack;
    } else {
      if (newSlack < predictedWnsSetup) predictedWnsSetup = newSlack;
      if (newSlack < 0) predictedTnsSetup += newSlack;
    }
  });

  if (predictedWnsSetup === Infinity) predictedWnsSetup = 0;
  if (predictedWnsHold === Infinity) predictedWnsHold = 0;

  return {
    baselineWnsSetup: parseFloat(baselineWnsSetup.toFixed(4)),
    baselineTnsSetup: parseFloat(baselineTnsSetup.toFixed(4)),
    baselineWnsHold: parseFloat(baselineWnsHold.toFixed(4)),
    baselineTnsHold: parseFloat(baselineTnsHold.toFixed(4)),
    predictedWnsSetup: parseFloat(predictedWnsSetup.toFixed(4)),
    predictedTnsSetup: parseFloat(predictedTnsSetup.toFixed(4)),
    predictedWnsHold: parseFloat(predictedWnsHold.toFixed(4)),
    predictedTnsHold: parseFloat(predictedTnsHold.toFixed(4)),
    effectiveTotalGainNs: parseFloat(effectiveTotalGainNs.toFixed(4)),
    selectedActionCount: selectedActions.length,
    targetedPathCount: targetPaths.size,
  };
}

/**
 * Load saved EcoSession from localStorage.
 */
export function loadEcoSession(): EcoSession | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const data = localStorage.getItem(ECO_SESSION_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as EcoSession;
  } catch {
    return null;
  }
}

/**
 * Save EcoSession to localStorage.
 */
export function saveEcoSession(session: EcoSession): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const updated = {
      ...session,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ECO_SESSION_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save ECO session to localStorage:", err);
  }
}

/**
 * Clear EcoSession from localStorage.
 */
export function clearEcoSession(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(ECO_SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear ECO session:", err);
  }
}

/**
 * Create a new default EcoSession.
 */
export function createDefaultEcoSession(
  stage: SolverStage = "synthesis",
  vendor: EcoVendor = "genus"
): EcoSession {
  const now = new Date().toISOString();
  return {
    id: `eco_sess_${Date.now()}`,
    name: `ECO Session (${stage.toUpperCase()})`,
    stage,
    vendor,
    selectedActionIds: [],
    pathIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
