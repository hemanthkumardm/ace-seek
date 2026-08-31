import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { adminNotifyEmails, isAceSeekMailbox } from "@/lib/mail";

function adminSecret(): string {
  return (process.env.ACE_ADMIN_SECRET || "").trim();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || !isAceSeekMailbox(email)) return false;
  const want = email.toLowerCase().trim();
  return adminNotifyEmails().includes(want);
}

export const ADMIN_COOKIE = "ace_admin";

function secretFromRequest(req: NextRequest): string {
  const header = req.headers.get("x-ace-admin-secret")?.trim() || "";
  if (header) return header;
  const authz = req.headers.get("authorization") || "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value?.trim() || "";
  if (cookie) return cookie;
  return req.nextUrl.searchParams.get("secret")?.trim() || "";
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}

export function configuredAdminSecret(): string {
  return adminSecret();
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ ok: true; via: "secret" | "clerk" } | NextResponse> {
  const secret = adminSecret();
  const provided = secretFromRequest(req);
  if (secret && provided && provided === secret) {
    return { ok: true, via: "secret" };
  }

  try {
    const { userId } = await auth();
    if (userId) {
      const user = await currentUser();
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses[0]?.emailAddress ||
        "";
      if (isAdminEmail(email)) return { ok: true, via: "clerk" };
    }
  } catch {
    /* clerk not configured */
  }

  return NextResponse.json(
    { error: "Staff sign-in required." },
    { status: 401 }
  );
}
