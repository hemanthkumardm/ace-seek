import { NextRequest, NextResponse } from "next/server";

/**
 * Host-based routing, Protected Dashboard Route & Auth Cookie validation:
 *
 *   ace-seek.com/dashboard -> Protected Route (Redirects unauthenticated users to /login)
 *   doc.ace-seek.com/*     -> /tools/md-to-pdf
 *   timing.ace-seek.com/*  -> /tools/sdc-calculator
 *   scripts.ace-seek.com/* -> /tools/script-helper
 *   tools.ace-seek.com/*   -> /tools/*
 */

const HOST_APP_ROOT: Record<string, string> = {
  doc: "/tools/md-to-pdf",
  diff: "/tools/diff-comparator",
  convert: "/tools/format-converter",
  sanitizer: "/tools/ai-sanitizer",
  tex: "/tools/tex-formatter",
  table: "/tools/table-builder",
  timing: "/tools/sdc-calculator",
  scripts: "/tools/script-helper",
  tools: "/tools",
};

function hostSlug(host: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  const m = h.match(/^([a-z0-9-]+)\.(?:localhost|ace-seek\.com)$/);
  if (!m) return null;
  const slug = m[1];
  if (slug === "www") return null;
  return slug;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("ace_seek_session")?.value;

  // ROUTE PROTECTION: /dashboard requires logged-in session
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!sessionCookie) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-ace-user-tier", sessionCookie ? "authenticated" : "guest");

  const slug = hostSlug(host);
  if (!slug || !(slug in HOST_APP_ROOT)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  requestHeaders.set("x-ace-subdomain-slug", slug);
  const appRoot = HOST_APP_ROOT[slug];

  if (pathname === appRoot || pathname.startsWith(`${appRoot}/`)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (slug === "tools") {
    if (pathname === "/tools" || pathname.startsWith("/tools/")) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/tools" : `/tools${pathname}`;
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  const url = req.nextUrl.clone();
  if (pathname === "/") {
    url.pathname = appRoot;
  } else {
    url.pathname = `${appRoot}${pathname}`;
  }
  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
