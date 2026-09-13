import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get("redirect") || "/openroad/studio";
  const res = NextResponse.redirect(new URL(redirect, req.url));
  res.cookies.set("ace_dev_access", "1", {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  return res;
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({
    ok: true,
    message: "Developer access granted (Plan: Team / Unlimited)",
    plan: "team",
  });
  res.cookies.set("ace_dev_access", "1", {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  return res;
}
