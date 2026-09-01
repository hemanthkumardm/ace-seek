/**
 * Plan entitlements — Free / Pro / Max / Team
 *
 * Free  → try basic tools, hard locks on advanced features, daily caps (5 docs/day)
 * Pro   → most tools unlocked, soft limits (DPI, size, exports)
 * Max   → everything unlocked for an individual (no soft limits)
 * Team  → everything Max has + seats, shared vault, admin, priority support
 */
import type { UserPlan } from "@/lib/user-store";
import { findUserByApiKey, findUserByEmail } from "@/lib/user-store";
import { verifyIssuedApiKey, planFromApiKeyString, verifyTrialApiKey } from "@/lib/api-keys";

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
  | "vlsi_reports"
  | "openroad_scripts"
  | "openroad_run";

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
  canToc: boolean;

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

  // --- OpenROAD peer platform (openroad.ace-seek.com) ---
  /** Platform access (project upload + hub) */
  canAccessOpenroad: boolean;
  /** Pro: full Yosys/OpenROAD/OpenSTA script packs */
  canOpenroadScripts: boolean;
  /** Max: container / dry-run jobs */
  canOpenroadRun: boolean;
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
  docAllowedInputFormats: ["md", "tex", "docx", "pdf", "html", "odt", "plain", "rst"],
  docAllowedOutputFormats: ["pdf", "md", "tex", "docx", "html", "odt", "plain"],
  canEditablePdfDocx: true,
  canExactPdfDocx: true,
  canProEngine: true,
  maxExactDpi: 150,
  defaultExactDpi: 150,
  canDockerBackend: true,
  canWidePdf: true,
  canToc: true,

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
  canFormatDownload: true,

  canAccessTexBuilder: true,
  canTexAllTemplates: true,
  canTexStaTemplates: true,
  canTexDownload: true,
  canTexAlignExport: true,

  canAccessSanitizer: true,
  canSanitizerBatch: true,

  canAccessTableBuilder: true,
  maxTableRows: 100,
  canTableLandscapeExport: true,

  canAccessVlsi: true,
  canVlsiSdc: true,
  canVlsiTiming: true,
  canVlsiMmmc: true,
  canVlsiPower: true,
  canVlsiReports: true,
  canVlsiExportTcl: true,
  canVlsiEco: true,

  canAccessOpenroad: true,
  canOpenroadScripts: true,
  canOpenroadRun: true,
};

const FREE: Entitlements = {
  ...GUEST,
  tier: "free",
  label: "Free",
  maxConvertsPerDay: 20,
  maxInputBytes: 2_000_000,
  hasApiAccess: true,

  canAccessDocCompiler: true,
  docAllowedInputFormats: ["md", "tex", "docx", "pdf", "html", "odt", "plain", "rst"],
  docAllowedOutputFormats: ["pdf", "md", "tex", "docx", "html", "odt", "plain"],
  canEditablePdfDocx: true,
  canExactPdfDocx: false,
  canProEngine: false,
  maxExactDpi: 100,
  defaultExactDpi: 100,
  canDockerBackend: false,
  canWidePdf: false,
  canToc: false,

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
  canVlsiSdc: true,
  canVlsiTiming: false,
  canVlsiMmmc: false,
  canVlsiPower: false,
  canVlsiReports: true,
  canVlsiExportTcl: false,
  canVlsiEco: false,

  // Free: VLSI handoff download only; OpenROAD platform starts at Pro
  canAccessOpenroad: false,
  canOpenroadScripts: false,
  canOpenroadRun: false,
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
  canToc: true,

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

  // Pro: upload handoff + full script / local docker packs
  canAccessOpenroad: true,
  canOpenroadScripts: true,
  canOpenroadRun: false,
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
  canWidePdf: true,
  canToc: true,

  maxDiffChars: INF,

  maxTableRows: INF,

  canVlsiPower: true,
  canVlsiEco: true,
  canVlsiExportTcl: true,
  canVlsiSdc: true,
  canVlsiTiming: true,
  canVlsiMmmc: true,
  canVlsiReports: true,

  // Max: hosted OpenROAD runs (dry-run now; container workers when provisioned)
  canAccessOpenroad: true,
  canOpenroadScripts: true,
  canOpenroadRun: true,
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
  const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const isClusterWorker = process.env.AIC_FORCE_LOCAL === "1" || process.env.AIC_ROOT === "/app";
  
  // Dedicated EC2 computational cluster nodes always execute with full MAX capabilities
  if (isClusterWorker) {
    return {
      ...entitlementsForPlan("max"),
      name: "Cluster Worker Node",
      email: "worker@cluster.local",
    };
  }

  if (!apiKey || !apiKey.trim()) {
    if (isDev) {
      return {
        ...entitlementsForPlan("team"),
        name: "Local Developer",
        email: "dev@localhost",
      };
    }
    return entitlementsForPlan("guest");
  }
  // Keep original case for HMAC verification (Clerk user ids are case-sensitive).
  const raw = apiKey.trim();
  const shortcut = raw.toLowerCase();

  const trial = verifyTrialApiKey(raw);
  if (trial.ok) {
    return {
      ...entitlementsForPlan("max"),
      trialExpiresAt: trial.expiresAt,
    };
  }

  // Developer bypass / plan shortcuts — NEVER honor in production.
  // Empty key already elevates to team in development; production must use real keys.
  const allowShortcuts =
    isDev || process.env.ACE_ALLOW_PLAN_SHORTCUTS === "1";
  if (allowShortcuts) {
    if (
      shortcut === "dev" ||
      shortcut === "dev_key" ||
      shortcut === "admin" ||
      shortcut === "team" ||
      shortcut === "local"
    ) {
      return {
        ...entitlementsForPlan("team"),
        name: "Local Developer",
        email: "dev@localhost",
      };
    }
    if (shortcut === "max") return entitlementsForPlan("max");
    if (shortcut === "pro") return entitlementsForPlan("pro");
    if (shortcut === "free") return entitlementsForPlan("free");
  }

  // Demo / seeded users by email or key
  const byEmail = findUserByEmail(shortcut);
  if (byEmail) {
    return {
      ...entitlementsForPlan(byEmail.plan),
      email: byEmail.email,
      name: byEmail.name,
    };
  }

  const user = findUserByApiKey(raw);
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

  // Issued dashboard keys — original casing required for HMAC (do not lower-case user id)
  const issued = verifyIssuedApiKey(raw);
  if (issued.ok) {
    const tier = issued.plan === "trial" ? "max" : issued.plan;
    return entitlementsForPlan(tier);
  }

  // Cross-environment / proxy signature fallback (ensures 7-day trial and paid keys work across all backend nodes)
  const fallbackPlan = planFromApiKeyString(raw);
  if (fallbackPlan) {
    const tier = fallbackPlan === "trial" ? "max" : fallbackPlan;
    return entitlementsForPlan(tier);
  }

  // Fallback for dev mode
  if (isDev) {
    return {
      ...entitlementsForPlan("team"),
      name: "Local Developer",
      email: "dev@localhost",
    };
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
  toc: "pro",
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
  openroad_platform: "pro",
  openroad_scripts: "pro",
  openroad_run: "max",
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
      canToc: e.canToc,
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
    openroad: {
      access: e.canAccessOpenroad,
      scripts: e.canOpenroadScripts,
      run: e.canOpenroadRun,
    },
  };
}
