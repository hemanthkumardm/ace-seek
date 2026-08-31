/**
 * Plan entitlements — Free / Pro / Max / Team
 *
 * Free  → try basic tools, hard locks on advanced features, daily caps
 * Pro   → most tools unlocked, soft limits (DPI, size, exports)
 * Max   → everything unlocked for an individual (no soft limits)
 * Team  → everything Max has + seats, shared vault, SSO, priority support
 */
import type { UserPlan } from "@/lib/user-store";
import { findUserByApiKey } from "@/lib/user-store";
import { verifyIssuedApiKey, verifyTrialApiKey } from "@/lib/api-keys";

export type PlanTier = UserPlan | "guest";

export type ToolId =
  | "doc_compiler"
  | "diff"
  | "format_converter"
  | "tex_builder"
  | "ai_sanitizer"
  | "table_builder"
  | "vlsi_sdc"
  | "vlsi_timing"
  | "vlsi_mmmc"
  | "vlsi_power"
  | "vlsi_reports";

export type Entitlements = {
  tier: PlanTier;
  email?: string;
  name?: string;
  label: string;
  trialExpiresAt?: number;

  // --- platform ---
  maxConvertsPerDay: number;
  maxInputBytes: number;
  hasApiAccess: boolean;
  hasPriorityQueue: boolean;
  hasPrivateVault: boolean;
  hasTeamSeats: boolean;
  hasSso: boolean;
  hasSharedWorkspace: boolean;

  // --- doc compiler ---
  canAccessDocCompiler: boolean;
  docAllowedInputFormats: string[];
  docAllowedOutputFormats: string[];
  canEditablePdfDocx: boolean;
  canExactPdfDocx: boolean;
  canProEngine: boolean;
  maxExactDpi: number;
  defaultExactDpi: number;
  canDockerBackend: boolean;
  canWidePdf: boolean;

  // --- diff ---
  canAccessDiff: boolean;
  canDiffUnified: boolean;
  canDiffCharHighlight: boolean;
  canDiffPatchExport: boolean;
  canDiffFileUpload: boolean;
  maxDiffChars: number;

  // --- format converter ---
  canAccessFormatConverter: boolean;
  formatAllowedFrom: string[];
  formatAllowedTo: string[];
  canFormatLive: boolean;
  canFormatDetect: boolean;
  canFormatDownload: boolean;

  // --- tex builder ---
  canAccessTexBuilder: boolean;
  canTexAllTemplates: boolean;
  canTexStaTemplates: boolean;
  canTexDownload: boolean;
  canTexAlignExport: boolean;

  // --- sanitizer ---
  canAccessSanitizer: boolean;
  canSanitizerBatch: boolean;

  // --- table builder ---
  canAccessTableBuilder: boolean;
  maxTableRows: number;
  canTableLandscapeExport: boolean;

  // --- VLSI ---
  canAccessVlsi: boolean;
  canVlsiSdc: boolean;
  canVlsiTiming: boolean;
  canVlsiMmmc: boolean;
  canVlsiPower: boolean;
  canVlsiReports: boolean;
  canVlsiExportTcl: boolean;
  canVlsiEco: boolean;
};

const INF = Number.POSITIVE_INFINITY;

const GUEST: Entitlements = {
  tier: "guest",
  label: "Guest",
  maxConvertsPerDay: 3,
  maxInputBytes: 50_000,
  hasApiAccess: false,
  hasPriorityQueue: false,
  hasPrivateVault: false,
  hasTeamSeats: false,
  hasSso: false,
  hasSharedWorkspace: false,

  canAccessDocCompiler: true,
  docAllowedInputFormats: ["md"],
  docAllowedOutputFormats: ["pdf", "md"],
  canEditablePdfDocx: false,
  canExactPdfDocx: false,
  canProEngine: false,
  maxExactDpi: 72,
  defaultExactDpi: 72,
  canDockerBackend: false,
  canWidePdf: false,

  canAccessDiff: true,
  canDiffUnified: false,
  canDiffCharHighlight: false,
  canDiffPatchExport: false,
  canDiffFileUpload: false,
  maxDiffChars: 8_000,

  canAccessFormatConverter: true,
  formatAllowedFrom: ["json", "text"],
  formatAllowedTo: ["json", "yaml", "text"],
  canFormatLive: true,
  canFormatDetect: false,
  canFormatDownload: false,

  canAccessTexBuilder: true,
  canTexAllTemplates: false,
  canTexStaTemplates: false,
  canTexDownload: false,
  canTexAlignExport: false,

  canAccessSanitizer: true,
  canSanitizerBatch: false,

  canAccessTableBuilder: true,
  maxTableRows: 20,
  canTableLandscapeExport: false,

  canAccessVlsi: false,
  canVlsiSdc: false,
  canVlsiTiming: false,
  canVlsiMmmc: false,
  canVlsiPower: false,
  canVlsiReports: false,
  canVlsiExportTcl: false,
  canVlsiEco: false,
};

const FREE: Entitlements = {
  ...GUEST,
  tier: "free",
  label: "Free",
  maxConvertsPerDay: 25,
  maxInputBytes: 200_000,
  hasApiAccess: true,

  canAccessDocCompiler: true,
  docAllowedInputFormats: ["md", "tex", "plain", "html"],
  docAllowedOutputFormats: ["pdf", "md", "tex", "html", "plain"],
  canEditablePdfDocx: true, // basic only
  canExactPdfDocx: false,
  canProEngine: false,
  maxExactDpi: 100,
  defaultExactDpi: 100,
  canDockerBackend: false,
  canWidePdf: false,

  canAccessDiff: true,
  canDiffUnified: true,
  canDiffCharHighlight: false,
  canDiffPatchExport: false,
  canDiffFileUpload: true,
  maxDiffChars: 50_000,

  canAccessFormatConverter: true,
  formatAllowedFrom: ["json", "yaml", "text", "base64"],
  formatAllowedTo: ["json", "yaml", "text", "base64"],
  canFormatLive: true,
  canFormatDetect: true,
  canFormatDownload: false,

  canAccessTexBuilder: true,
  canTexAllTemplates: false,
  canTexStaTemplates: false,
  canTexDownload: false,
  canTexAlignExport: false,

  canAccessSanitizer: true,
  canSanitizerBatch: false,

  canAccessTableBuilder: true,
  maxTableRows: 50,
  canTableLandscapeExport: false,

  canAccessVlsi: true,
  canVlsiSdc: true, // limited studio
  canVlsiTiming: false,
  canVlsiMmmc: false,
  canVlsiPower: false,
  canVlsiReports: true,
  canVlsiExportTcl: false,
  canVlsiEco: false,
};

const PRO: Entitlements = {
  ...FREE,
  tier: "pro",
  label: "Pro",
  maxConvertsPerDay: 500,
  maxInputBytes: 2_000_000,
  hasPriorityQueue: true,
  hasPrivateVault: true,

  docAllowedInputFormats: ["md", "tex", "docx", "pdf", "html", "odt", "plain", "rst"],
  docAllowedOutputFormats: ["pdf", "md", "tex", "docx", "html", "odt", "plain"],
  canEditablePdfDocx: true,
  canExactPdfDocx: true,
  canProEngine: true,
  maxExactDpi: 300,
  defaultExactDpi: 200,
  canDockerBackend: true,
  canWidePdf: true,

  canDiffCharHighlight: true,
  canDiffPatchExport: true,
  maxDiffChars: 500_000,

  formatAllowedFrom: ["json", "yaml", "toml", "csv", "base64", "url", "hex", "text", "query"],
  formatAllowedTo: ["json", "yaml", "toml", "csv", "base64", "url", "hex", "text", "query"],
  canFormatDownload: true,

  canTexAllTemplates: true,
  canTexStaTemplates: true,
  canTexDownload: true,
  canTexAlignExport: true,

  canSanitizerBatch: true,

  maxTableRows: 500,
  canTableLandscapeExport: true,

  canVlsiSdc: true,
  canVlsiTiming: true,
  canVlsiMmmc: true,
  canVlsiPower: false,
  canVlsiReports: true,
  canVlsiExportTcl: true,
  canVlsiEco: false,
};

const MAX: Entitlements = {
  ...PRO,
  tier: "max",
  label: "Max",
  maxConvertsPerDay: INF,
  maxInputBytes: 20_000_000,
  hasPriorityQueue: true,
  hasPrivateVault: true,

  maxExactDpi: 400,
  defaultExactDpi: 300,
  canProEngine: true,
  canExactPdfDocx: true,

  maxDiffChars: INF,

  maxTableRows: INF,

  canVlsiPower: true,
  canVlsiEco: true,
  canVlsiExportTcl: true,
  canVlsiSdc: true,
  canVlsiTiming: true,
  canVlsiMmmc: true,
  canVlsiReports: true,
};

const TEAM: Entitlements = {
  ...MAX,
  tier: "team",
  label: "Team",
  hasTeamSeats: true,
  hasSso: true,
  hasSharedWorkspace: true,
  hasApiAccess: true,
};

export function entitlementsForPlan(plan: PlanTier): Entitlements {
  switch (plan) {
    case "team":
      return { ...TEAM };
    case "max":
      return { ...MAX };
    case "pro":
      return { ...PRO };
    case "free":
      return { ...FREE };
    default:
      return { ...GUEST };
  }
}

export function entitlementsFromApiKey(apiKey: string | null | undefined): Entitlements {
  if (!apiKey || !apiKey.trim()) return entitlementsForPlan("guest");
  const key = apiKey.trim();

  const user = findUserByApiKey(key);
  if (user) {
    return {
      ...entitlementsForPlan(user.plan),
      email: user.email,
      name: user.name,
    };
  }

  const trial = verifyTrialApiKey(key);
  if (trial.ok) {
    return {
      ...entitlementsForPlan("max"),
      trialExpiresAt: trial.expiresAt,
    };
  }

  const issued = verifyIssuedApiKey(key);
  if (issued.ok) {
    return entitlementsForPlan(issued.plan);
  }

  return entitlementsForPlan("guest");
}

/** Paid individual+ (pro, max, team) */
export function isPremiumPlan(tier: PlanTier): boolean {
  return tier === "pro" || tier === "max" || tier === "team";
}

/** Fully unlocked individual or team */
export function isMaxOrTeam(tier: PlanTier): boolean {
  return tier === "max" || tier === "team";
}

export function planRank(tier: PlanTier): number {
  switch (tier) {
    case "team":
      return 4;
    case "max":
      return 3;
    case "pro":
      return 2;
    case "free":
      return 1;
    default:
      return 0;
  }
}

/** Human-readable feature → minimum plan */
export const FEATURE_MIN_PLAN: Record<string, PlanTier> = {
  exact_pdf_docx: "pro",
  pro_engine: "pro",
  docker_backend: "pro",
  wide_pdf: "pro",
  diff_patch_export: "pro",
  diff_char_highlight: "pro",
  format_toml_csv: "pro",
  format_download: "pro",
  tex_sta_templates: "pro",
  tex_download: "pro",
  table_landscape: "pro",
  vlsi_timing: "pro",
  vlsi_mmmc: "pro",
  vlsi_export_tcl: "pro",
  vlsi_power: "max",
  vlsi_eco: "max",
  unlimited_converts: "max",
  team_seats: "team",
  sso: "team",
  shared_workspace: "team",
};

export function minPlanForFeature(feature: string): PlanTier {
  return FEATURE_MIN_PLAN[feature] || "pro";
}

export function planLabel(tier: PlanTier): string {
  return entitlementsForPlan(tier).label;
}

/** Serialize safe subset for API / client */
export function publicEntitlements(e: Entitlements) {
  return {
    tier: e.tier,
    label: e.label,
    email: e.email,
    name: e.name,
    trialExpiresAt: e.trialExpiresAt || null,
    maxConvertsPerDay: e.maxConvertsPerDay === INF ? null : e.maxConvertsPerDay,
    maxInputBytes: e.maxInputBytes === INF ? null : e.maxInputBytes,
    hasApiAccess: e.hasApiAccess,
    hasPriorityQueue: e.hasPriorityQueue,
    hasPrivateVault: e.hasPrivateVault,
    hasTeamSeats: e.hasTeamSeats,
    hasSso: e.hasSso,
    hasSharedWorkspace: e.hasSharedWorkspace,
    doc: {
      access: e.canAccessDocCompiler,
      inputFormats: e.docAllowedInputFormats,
      outputFormats: e.docAllowedOutputFormats,
      editablePdfDocx: e.canEditablePdfDocx,
      exactPdfDocx: e.canExactPdfDocx,
      proEngine: e.canProEngine,
      maxExactDpi: e.maxExactDpi,
      defaultExactDpi: e.defaultExactDpi,
      dockerBackend: e.canDockerBackend,
      widePdf: e.canWidePdf,
    },
    diff: {
      access: e.canAccessDiff,
      unified: e.canDiffUnified,
      charHighlight: e.canDiffCharHighlight,
      patchExport: e.canDiffPatchExport,
      fileUpload: e.canDiffFileUpload,
      maxChars: e.maxDiffChars === INF ? null : e.maxDiffChars,
    },
    format: {
      access: e.canAccessFormatConverter,
      from: e.formatAllowedFrom,
      to: e.formatAllowedTo,
      live: e.canFormatLive,
      detect: e.canFormatDetect,
      download: e.canFormatDownload,
    },
    tex: {
      access: e.canAccessTexBuilder,
      allTemplates: e.canTexAllTemplates,
      staTemplates: e.canTexStaTemplates,
      download: e.canTexDownload,
      alignExport: e.canTexAlignExport,
    },
    sanitizer: {
      access: e.canAccessSanitizer,
      batch: e.canSanitizerBatch,
    },
    table: {
      access: e.canAccessTableBuilder,
      maxRows: e.maxTableRows === INF ? null : e.maxTableRows,
      landscape: e.canTableLandscapeExport,
    },
    vlsi: {
      access: e.canAccessVlsi,
      sdc: e.canVlsiSdc,
      timing: e.canVlsiTiming,
      mmmc: e.canVlsiMmmc,
      power: e.canVlsiPower,
      reports: e.canVlsiReports,
      exportTcl: e.canVlsiExportTcl,
      eco: e.canVlsiEco,
    },
  };
}
