/**
 * Ace-Seek site model
 *
 *   ace-seek.com          → command center (marketing, auth, billing, dashboard, SEO)
 *   doc.ace-seek.com      → MD → PDF compiler
 *   timing.ace-seek.com   → SDC / timing utilities
 *   (future micro-SaaS on their own subdomains)
 *
 * Local (no DNS):
 *   /                     → command center
 *   /tools/md-to-pdf      → doc product
 *   /tools/sdc-calculator → timing product
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://ace-seek.com";

export const BRAND = {
  name: "Ace-Seek",
  tagline: "Automation and productivity for hardware & engineering teams",
  description:
    "A specialized suite of micro-tools for VLSI, STA, and technical documentation — one identity, many focused utilities.",
};

/** True for product hosts like doc.ace-seek.com or doc.localhost */
export function productHostSlug(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  const m = h.match(/^([a-z0-9-]+)\.(?:localhost|ace-seek\.com)$/);
  if (!m) return null;
  const slug = m[1];
  if (slug === "www" || slug === "ace-seek") return null;
  return slug;
}

export function isApexHost(host: string | null | undefined): boolean {
  if (!host) return true;
  const h = host.split(":")[0].toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "ace-seek.com" ||
    h === "www.ace-seek.com"
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
    name: "AI Markdown → PDF Compiler",
    host: "doc.tools.ace-seek.com",
    appPath: "/tools/md-to-pdf",
    blurb: "Compile AI Markdown notes + LaTeX math + code syntax → publication PDF.",
    overview:
      "Convert raw LLM Markdown outputs into production-grade PDFs with TeX math, code syntax, tables, and Mermaid diagrams without burning LLM tokens.",
    status: "live",
    originEnv: "NEXT_PUBLIC_DOC_URL",
  },
  {
    id: "diff",
    slug: "diff",
    name: "Visual Diff Comparator",
    host: "diff.tools.ace-seek.com",
    appPath: "/tools/diff-comparator",
    blurb: "Side-by-side text, Markdown, and code comparison tool.",
    overview:
      "Visual line-by-line diff inspector highlighting additions, deletions, and structural code changes side by side.",
    status: "live",
  },
  {
    id: "convert",
    slug: "convert",
    name: "Multi-Format Converter Suite",
    host: "convert.tools.ace-seek.com",
    appPath: "/tools/format-converter",
    blurb: "Bi-directional JSON ↔ YAML ↔ TOML, CSV ↔ JSON, Base64 converter.",
    overview:
      "Convert configuration files, data formats, and Base64 encoding instantly in 1 click without server data transmission.",
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
    blurb: "Visual & text LaTeX math formula generator and equation cleaner.",
    overview:
      "Generates, cleans, and normalizes inline $E=mc^2$ and display math equations for TeX document processing.",
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

// Also accept legacy tools.* → tools hub
HOST_TO_APP.tools = "/tools";

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
    blurb: "Try the suite. Enough for personal notes and light compiles.",
    cta: "Get started",
    ctaHref: "/signup",
    features: [
      "Doc Compiler with fair-use limits",
      "Community templates",
      "1 workspace",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$16",
    period: "/ month",
    blurb: "For engineers who live in STA notes and constraints daily.",
    cta: "Start Pro",
    ctaHref: "/signup?plan=pro",
    highlighted: true,
    features: [
      "Unlimited Doc compiles*",
      "Priority TeX queue",
      "Timing tools when live",
      "Private snippet vault",
      "API access (beta)",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$49",
    period: "/ seat / mo",
    blurb: "Shared identity, billing, and playbooks for hardware teams.",
    cta: "Contact sales",
    ctaHref: "/signup?plan=team",
    features: [
      "Everything in Pro",
      "Shared workspace & templates",
      "Central billing (Stripe)",
      "SSO roadmap",
      "Invoice / PO support",
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
