/**
 * Ace-Seek site model
 *
 *   www.ace-seek.com        → primary command center (pricing, signup, dashboard, SEO)
 *   main.ace-seek.com       → optional alias of main marketing host
 *   vlsi.ace-seek.com       → ASIC authoring (SDC · Timing · MMMC · Power · Reports)
 *   openroad.ace-seek.com   → OpenROAD PnR automation (upload VLSI handoff → Pro scripts / Max runs)
 *   tools.ace-seek.com      → Tools platform intro + API-key login + workstations
 *
 * Apex ace-seek.com is NOT required (prefer www only).
 *
 * One Next.js app serves all hosts (path roots /vlsi, /openroad, /tools).
 *
 * Local (no DNS):
 *   /           → main
 *   /vlsi       → VLSI / ASIC intro
 *   /openroad   → OpenROAD PnR intro
 *   /tools      → Tools intro
 */

export type PlatformId = "vlsi" | "openroad" | "tools" | "portal";

/** Canonical main marketing / signup / dashboard host */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.ace-seek.com";

/** Absolute platform origins (production). Path-based fallbacks for local. */
export const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://portal.ace-seek.com"
    : "/portal");

export const VLSI_URL =
  process.env.NEXT_PUBLIC_VLSI_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://vlsi.ace-seek.com"
    : "/vlsi");

export const OPENROAD_URL =
  process.env.NEXT_PUBLIC_OPENROAD_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://openroad.ace-seek.com"
    : "/openroad");

export const TOOLS_URL =
  process.env.NEXT_PUBLIC_TOOLS_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://tools.ace-seek.com"
    : "/tools");

export const BRAND = {
  name: "Ace-Seek",
  tagline: "Automation and productivity for ASIC & engineering teams",
  description:
    "A specialized suite of micro-tools for ASIC / VLSI, OpenROAD PnR automation, STA, and technical documentation — one identity, many focused utilities.",
};

/**
 * Home of the current product shell.
 * On subdomain host (vlsi.ace-seek.com) → "/".
 * On main site path mode → "/vlsi", "/openroad", or "/tools".
 */
export function platformHomeHref(
  platform: PlatformId,
  host?: string | null
): string {
  const slug = productHostSlug(host);
  if (slug === platform) return "/";
  if (platform === "vlsi") {
    return typeof VLSI_URL === "string" && VLSI_URL.startsWith("http")
      ? VLSI_URL
      : "/vlsi";
  }
  if (platform === "openroad") {
    return typeof OPENROAD_URL === "string" && OPENROAD_URL.startsWith("http")
      ? OPENROAD_URL
      : "/openroad";
  }
  return typeof TOOLS_URL === "string" && TOOLS_URL.startsWith("http")
    ? TOOLS_URL
    : "/tools";
}

/** Login page for platform (API key only). */
export function platformLoginHref(
  platform: PlatformId,
  host?: string | null
): string {
  const home = platformHomeHref(platform, host);
  if (home === "/") return "/login";
  if (home.startsWith("http")) return `${home}/login`;
  return `${home}/login`;
}

/** Main site signup / pricing (never on subdomains). */
export function mainSignupHref(): string {
  return `${SITE_URL}/signup`;
}

export function mainDashboardHref(): string {
  return `${SITE_URL}/dashboard`;
}

export function mainPricingHref(): string {
  return `${SITE_URL}/pricing`;
}

/** True for product hosts like doc.ace-seek.com or doc.localhost */
export function productHostSlug(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  const m = h.match(/^([a-z0-9-]+)\.(?:localhost|ace-seek\.com)$/);
  if (!m) return null;
  const slug = m[1];
  // Main marketing hosts — not product subdomains
  if (slug === "www" || slug === "main" || slug === "ace-seek") return null;
  return slug;
}

/** True for main marketing site (not vlsi/tools product hosts). */
export function isApexHost(host: string | null | undefined): boolean {
  if (!host) return true;
  const h = host.split(":")[0].toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "ace-seek.com" ||
    h === "www.ace-seek.com" ||
    h === "main.ace-seek.com"
  );
}

export type ProductStatus = "live" | "soon";

export type Product = {
  id: string;
  /** Subdomain label, e.g. doc */
  slug: string;
  name: string;
  host: string;
  /** Internal Next path (local + rewrite target) */
  appPath: string;
  blurb: string;
  /** Longer product overview for marketing */
  overview: string;
  status: ProductStatus;
  /** Optional absolute origin override, e.g. https://doc.ace-seek.com */
  originEnv?: string;
};

function originFromEnv(envKey?: string): string {
  if (!envKey) return "";
  const v = process.env[envKey];
  return v ? v.replace(/\/$/, "") : "";
}

export const PRODUCTS: Product[] = [
  {
    id: "doc",
    slug: "doc",
    name: "Doc Compiler",
    host: "doc.tools.ace-seek.com",
    appPath: "/tools/doc-compiler",
    blurb: "Round-trip docs: MD ↔ PDF ↔ DOCX ↔ TeX ↔ HTML and more.",
    overview:
      "Pick any input and output format — Markdown, PDF, Word, TeX, HTML, ODT. Engineering notes with math and Tcl/SDC stay first-class on the Markdown path.",
    status: "live",
    originEnv: "NEXT_PUBLIC_DOC_URL",
  },
  {
    id: "diff",
    slug: "diff",
    name: "Visual Diff Comparator",
    host: "diff.tools.ace-seek.com",
    appPath: "/tools/diff-comparator",
    blurb: "Myers text/code diff — split & unified, word/char highlight, patch export.",
    overview:
      "Max-quality visual diff: aligned side-by-side or unified view, word/character highlights, collapse unchanged, jump changes, and unified .diff export.",
    status: "live",
  },
  {
    id: "convert",
    slug: "convert",
    name: "Multi-Format Converter Suite",
    host: "convert.tools.ace-seek.com",
    appPath: "/tools/format-converter",
    blurb: "JSON ↔ YAML ↔ TOML ↔ CSV, Base64, URL, Hex — live, local, copy/save.",
    overview:
      "Friendly bi-directional data converter: structured formats and text codecs, all in the browser.",
    status: "live",
  },
  {
    id: "sanitizer",
    slug: "sanitizer",
    name: "AI Output Sanitizer & Token Saver",
    host: "sanitizer.tools.ace-seek.com",
    appPath: "/tools/ai-sanitizer",
    blurb: "Clean raw LLM responses, strip prompt noise, and fix code fencing.",
    overview:
      "Strips AI conversational fluff, normalizes Markdown code blocks, and prepares raw ChatGPT/Claude responses for compilation.",
    status: "live",
  },
  {
    id: "tex",
    slug: "tex",
    name: "LaTeX Formula Builder & Formatter",
    host: "tex.tools.ace-seek.com",
    appPath: "/tools/tex-formatter",
    blurb: "Live KaTeX preview, STA templates, symbol palette, multi-format export.",
    overview:
      "Build and clean LaTeX math with live preview, VLSI/STA templates, unicode cleanup, and copy as $, $$, or raw TeX.",
    status: "live",
  },
  {
    id: "table",
    slug: "table",
    name: "Wide Table Geometry Builder",
    host: "table.tools.ace-seek.com",
    appPath: "/tools/table-builder",
    blurb: "Auto-fit wide data tables for landscape PDF compilation.",
    overview:
      "Generates and formats wide data tables with automatic geometry controls to prevent column truncation on PDF export.",
    status: "live",
  },
];

/** Public URL for a product (subdomain in prod, path in local). */
export function productHref(product: Product): string {
  const fromEnv = originFromEnv(product.originEnv);
  if (fromEnv) return fromEnv;

  // Explicit multi-product envs unset: in production builds, prefer real hosts
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL) {
    return `https://${product.host}`;
  }

  // Local / path-based
  return product.appPath;
}

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/** Host slug → internal rewrite path (app root). */
export const HOST_TO_APP: Record<string, string> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p.appPath])
);

// Platform subdomains (peer products — not nested under each other)
HOST_TO_APP.tools = "/tools";
HOST_TO_APP.vlsi = "/vlsi";
HOST_TO_APP.openroad = "/openroad";
HOST_TO_APP.portal = "/portal";

export type PricingTier = {
  id: string;
  name: string;
  price: string;
  period?: string;
  blurb: string;
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  features: string[];
};

export const PRICING: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Explore tools with core features. Advanced options stay locked.",
    cta: "Get started",
    ctaHref: "/signup?plan=free",
    features: [
      "Doc Compiler: MD → PDF / TeX / HTML",
      "Basic Diff (side-by-side)",
      "JSON ↔ YAML convert",
      "Basic LaTeX builder",
      "25 converts / day · soft size caps",
      "SDC Studio (view / limited) + Report Hub",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹1,299",
    period: "/ month",
    blurb: "Daily driver for STA notes, constraints, and utility workstations.",
    cta: "Start Pro",
    ctaHref: "/signup?plan=pro",
    highlighted: true,
    features: [
      "Exact look PDF → DOCX + Pro engine",
      "All doc formats (PDF/DOCX/ODT…)",
      "Diff: char highlight + .diff export",
      "Full format suite (TOML/CSV/Base64…)",
      "STA TeX templates · table landscape",
      "Timing + MMMC + TCL export",
      "OpenROAD: upload VLSI handoff + full flow scripts",
      "500 converts / day",
    ],
  },
  {
    id: "max",
    name: "Max",
    price: "₹2,499",
    period: "/ month",
    blurb: "Unlock everything for one power user — no soft limits.",
    cta: "Request 7-day trial",
    ctaHref: "/trial",
    features: [
      "Everything in Pro",
      "Unlimited converts & max file size",
      "Exact look up to 400 DPI",
      "Power Studio (UPF) + ECO paths",
      "OpenROAD Max runs (container / dry-run jobs)",
      "Priority queue · private vault",
      "All VLSI / ASIC workstations unlocked",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "₹3,999",
    period: "/ seat / mo",
    blurb: "Max features for the whole org — seats, shared workspaces, admin controls.",
    cta: "Contact sales",
    ctaHref: "/signup?plan=team",
    features: [
      "Everything in Max",
      "Shared workspace & seats",
      "Central billing & invoicing",
      "Enterprise identity options",
      "Invoice / PO support",
      "Team API keys & admin",
    ],
  },
];

export type ContentLink = {
  title: string;
  href: string;
  blurb: string;
  status: "live" | "soon";
};

export const CONTENT_HUB: ContentLink[] = [
  {
    title: "Blog",
    href: "/blog",
    blurb: "VLSI bottlenecks, SDC patterns, and doc-pipeline writeups.",
    status: "live",
  },
  {
    title: "Documentation",
    href: "/docs",
    blurb: "CLI reference, compiler flags, and product guides.",
    status: "live",
  },
  {
    title: "Open scripts",
    href: "/blog#scripts",
    blurb: "Automation snippets you can fork into your flow.",
    status: "soon",
  },
];

/** @deprecated use PRODUCTS + productHref */
export function toolsBase(): string {
  return "/tools";
}

/** @deprecated */
export function toolsPath(path = ""): string {
  const p = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/tools${p}`;
}

export const TOOLS = PRODUCTS.map((p) => ({
  name: p.name,
  path: p.appPath.replace(/^\/tools/, "") || "/",
  blurb: p.blurb,
  status: p.status,
}));
