import type { PlanTier } from "@/lib/entitlements";
import { planRank } from "@/lib/entitlements";
import type { LearnLayer } from "@/lib/vlsi-curriculum";

/** Guest browsing Learn is treated as Free (beginner + standard). */
export function learnPlanRank(tier: PlanTier): number {
  if (tier === "guest") return planRank("free");
  return planRank(tier);
}

export const LAYER_MIN_PLAN: Record<LearnLayer, PlanTier> = {
  beginner: "free",
  standard: "free",
  expert: "pro",
  master: "max",
};

export function layerUnlocked(tier: PlanTier, layer: LearnLayer): boolean {
  return learnPlanRank(tier) >= planRank(LAYER_MIN_PLAN[layer]);
}
