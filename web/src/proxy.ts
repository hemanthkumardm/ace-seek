import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isApexHost, productHostSlug, HOST_TO_APP } from "@/lib/site";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const sk = process.env.CLERK_SECRET_KEY?.trim();
  return Boolean(pk && sk);
}

function applyHostRouting(req: NextRequest): NextResponse {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";
  const { pathname, search } = req.nextUrl;
  const slug = productHostSlug(host);

  // 1. CANONICAL PRICING REDIRECT:
  // If user visits /pricing on any subdomain (tools.ace-seek.com, vlsi.ace-seek.com, doc.tools.ace-seek.com),
  // redirect canonical 307 to apex https://www.ace-seek.com/pricing
  if (pathname === "/pricing" || pathname.startsWith("/pricing/")) {
    if (!isApexHost(host) && process.env.NODE_ENV === "production") {
      const canonicalPricingUrl = new URL(
        `${pathname}${search}`,
        "https://www.ace-seek.com"
      );
      return NextResponse.redirect(canonicalPricingUrl, 307);
    }
  }

  // 2. PLATFORM HOST ROUTING
  // Peer platforms share one deployment:
  //   vlsi.ace-seek.com      → /vlsi/*
  //   openroad.ace-seek.com  → /openroad/*
  //   tools.ace-seek.com     → /tools/*
  // Internal links keep the /vlsi|/openroad|/tools prefix so path mode and host
  // mode both work.
  if (slug === "openroad") {
    if (pathname === "/" || pathname === "") {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = "/openroad";
      return NextResponse.rewrite(rewriteUrl);
    }
    const openroadAliases: Record<string, string> = {
      "/login": "/openroad/login",
      "/project": "/openroad/project",
      "/upload": "/openroad/project",
      "/design": "/openroad/design",
      "/edit": "/openroad/design",
      "/scripts": "/openroad/scripts",
      "/export": "/openroad/scripts",
      "/run": "/openroad/studio",
      "/studio": "/openroad/studio",
      "/pnr": "/openroad/studio",
      "/jobs": "/openroad/studio",
    };
    const aliasTarget = openroadAliases[pathname];
    if (aliasTarget) {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = aliasTarget;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  if (slug && (pathname === "/" || pathname === "")) {
    if (slug === "tools") {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = "/tools";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (slug === "vlsi") {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = "/vlsi";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (slug === "openroad") {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = "/openroad";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (slug === "portal") {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = "/portal";
      return NextResponse.rewrite(rewriteUrl);
    }
    const targetPath = HOST_TO_APP[slug];
    if (targetPath) {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = targetPath;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}

export default function proxy(req: NextRequest, event: any) {
  // Large ODB binary upload — never buffer/parse body in middleware
  if (req.nextUrl.pathname.includes("/api/openroad/odb/upload")) {
    return NextResponse.next();
  }

  const hostResponse = applyHostRouting(req);
  if (hostResponse.status !== 200) {
    return hostResponse;
  }

  if (!isClerkConfigured()) {
    return hostResponse;
  }

  const clerkHandler = clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
    return hostResponse;
  });

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next static/image
     * - common static file extensions
     * - /api/openroad/odb/upload (large binary — must not buffer/truncate body)
     */
    "/((?!_next|api/openroad/odb/upload|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
