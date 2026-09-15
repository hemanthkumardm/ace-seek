/**
 * AceForge — Ace-Seek cloud PnR flow profiles.
 * Legacy path remains the classic Docker RTL→GDS runner; AceForge adds
 * step-orchestrated Classic (block) and Chip (pad-ring) profiles.
 */

export type AceFlowProfileId = "legacy_pnr" | "ace_forge_classic" | "ace_forge_chip";

export type AceFlowProfileDef = {
  id: AceFlowProfileId;
  label: string;
  short: string;
  blurb: string;
  /** Backend key used by workers / spawn meta */
  backend: "legacy_ol" | "ace_forge";
  chipMode: boolean;
  badge: string;
};

export const ACE_FLOW_PROFILES: AceFlowProfileDef[] = [
  {
    id: "legacy_pnr",
    label: "Legacy Docker PnR",
    short: "Legacy",
    blurb:
      "Battle-tested container RTL→GDS with stage stops (synth→GDS). Default for Max jobs.",
    backend: "legacy_ol",
    chipMode: false,
    badge: "Stable",
  },
  {
    id: "ace_forge_classic",
    label: "AceForge Classic",
    short: "Classic",
    blurb:
      "Step-orchestrated AceFlow + OpenROAD: hermetic checkpoints, optional Ace-AutoMacro, fail-closed stages.",
    backend: "ace_forge",
    chipMode: false,
    badge: "AceForge",
  },
  {
    id: "ace_forge_chip",
    label: "AceForge Chip",
    short: "Chip",
    blurb:
      "Full-chip oriented AceForge profile with pad-ring intent, seal/IO emphasis, and package-ready floorplan hooks.",
    backend: "ace_forge",
    chipMode: true,
    badge: "AceForge · Chip",
  },
];

export function getFlowProfile(id: string | undefined | null): AceFlowProfileDef {
  return ACE_FLOW_PROFILES.find((p) => p.id === id) || ACE_FLOW_PROFILES[0];
}

export function isAceFlowProfileId(v: string): v is AceFlowProfileId {
  return ACE_FLOW_PROFILES.some((p) => p.id === v);
}
