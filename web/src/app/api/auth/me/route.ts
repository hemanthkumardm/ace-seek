import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSessionData } from "@/lib/user-store";
import { apiKeyForUserId } from "@/lib/api-keys";
import { planFromClerkMetadata } from "@/lib/clerk-config";

function clerkEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

export async function GET(req: NextRequest) {
  // Prefer Clerk multi-device session
  if (clerkEnabled()) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
      const user = await currentUser();
      if (!user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      const meta = {
        ...(user.publicMetadata || {}),
        ...(user.privateMetadata || {}),
      } as Record<string, unknown>;
      const plan = planFromClerkMetadata(meta);
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        "";
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        email ||
        "Engineer";

      return NextResponse.json({
        authenticated: true,
        provider: "clerk",
        user: {
          id: userId,
          email,
          name,
          plan,
          apiKey: apiKeyForUserId(userId, plan),
        },
      });
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }

  // Legacy cookie session (local demo without Clerk keys)
  const token = req.cookies.get("ace_seek_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = getSessionData(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    provider: "legacy",
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      plan: session.plan,
      apiKey: session.apiKey,
    },
  });
}
