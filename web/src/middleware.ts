import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isApexHost } from "@/lib/site";

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

  // 1. CANONICAL PRICING REDIRECT:
  // If user visits /pricing on any subdomain (tools.ace-seek.com or vlsi.ace-seek.com),
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

  return NextResponse.next();
}

export default function middleware(req: NextRequest, event: any) {
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
