import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 uses proxy.ts (not middleware.ts) for Clerk.
 * @see https://clerk.com/docs/nextjs/getting-started/quickstart
 */

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const isPublicMarketingRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/pricing(.*)",
  "/offers(.*)",
  "/advertise(.*)",
  "/blog(.*)",
  "/docs(.*)",
  "/contact(.*)",
  "/contact-us(.*)",
  "/shipping-policy(.*)",
  "/shipping-and-delivery-policy(.*)",
  "/terms(.*)",
  "/terms-and-conditions(.*)",
  "/privacy(.*)",
  "/privacy-policy(.*)",
  "/refund-policy(.*)",
  "/refunds(.*)",
  "/cancellation-policy(.*)",
  "/cancellations(.*)",
  "/vlsi/login(.*)",
  "/tools/login(.*)",
  "/api/webhooks/razorpay(.*)",
  "/icon.svg",
]);

const HOST_APP_ROOT: Record<string, string> = {
  doc: "/tools/doc-compiler",
  diff: "/tools/diff-comparator",
  convert: "/tools/format-converter",
  sanitizer: "/tools/ai-sanitizer",
  tex: "/tools/tex-formatter",
  table: "/tools/table-builder",
  scripts: "/tools/script-helper",
  tools: "/tools",
  vlsi: "/vlsi",
};

function hostSlug(host: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  const m = h.match(/^([a-z0-9-]+)\.(?:localhost|ace-seek\.com)$/);
  if (!m) return null;
  const slug = m[1];
  if (slug === "www") return null;
  return slug;
}

function applyHostRouting(
  req: NextRequest,
  authenticated: boolean
): NextResponse {
  const host = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  // Never rewrite Clerk internal / API / static paths
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/__clerk")
  ) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(
    "x-ace-user-tier",
    authenticated ? "authenticated" : "guest"
  );

  const slug = hostSlug(host);
  if (!slug || !(slug in HOST_APP_ROOT)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  requestHeaders.set("x-ace-subdomain-slug", slug);
  const appRoot = HOST_APP_ROOT[slug];

  if (pathname === appRoot || pathname.startsWith(`${appRoot}/`)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (slug === "tools") {
    if (pathname === "/tools" || pathname.startsWith("/tools/")) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/tools" : `/tools${pathname}`;
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  const url = req.nextUrl.clone();
  if (pathname === "/") {
    url.pathname = appRoot;
  } else {
    url.pathname = `${appRoot}${pathname}`;
  }
  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
}

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") || "";
  const slug = hostSlug(host);
  const { pathname } = req.nextUrl;

  const isSubdomain = Boolean(slug && slug in HOST_APP_ROOT);
  const isDashboard = pathname.startsWith("/dashboard");
  const isPublicPage = isPublicMarketingRoute(req);

  // Require login for /dashboard OR any product subdomain (vlsi, tools, doc, diff, etc.) that is not an explicit public route
  if ((isDashboard || (isSubdomain && !isPublicPage)) && !pathname.startsWith("/api")) {
    await auth.protect();
  }

  const session = await auth();
  return applyHostRouting(
    req as unknown as NextRequest,
    Boolean(session.userId)
  );
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path (required)
    "/__clerk/:path*",
    "/__clerk/(.*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
