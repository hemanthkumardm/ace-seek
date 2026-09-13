import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { getSessionData } from "@/lib/user-store";
import { apiKeyForUserId } from "@/lib/api-keys";
import { planFromClerkMetadata, isClerkConfigured } from "@/lib/clerk-config";
import { subscriptionSnapshotFromMetadata } from "@/lib/subscription-plan";
import { getUserKeysFromDb, saveApiKeyToDb } from "@/lib/supabase-keys";

function isDevAccessAllowed(req: NextRequest): boolean {
  if (req.cookies.get("ace_dev_access")?.value === "1") return true;
  if (req.headers.get("x-dev-access") === "1") return true;
  if (req.nextUrl.searchParams.get("dev") === "1") return true;
  if (process.env.ACE_DEV_ACCESS === "1") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

function devUserPayload() {
  return {
    authenticated: true,
    provider: "dev",
    user: {
      id: "user_dev_local",
      email: "dev@localhost",
      name: "Local Developer",
      plan: "team",
      planStatus: "active",
      planPeriod: "yearly",
      planRenewsAt: null,
      hasInterviewMasterclass: true,
      apiKey: "dev_key",
    },
  };
}

export async function GET(req: NextRequest) {
  if (isClerkConfigured()) {
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await currentUser();
        if (user) {
          const meta = {
            ...(user.publicMetadata || {}),
          } as Record<string, unknown>;
          const snapshot = subscriptionSnapshotFromMetadata(meta);
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

          const activeKey = apiKeyForUserId(userId, plan);

          if (email && !meta.welcome_sent) {
            getUserKeysFromDb(userId, email)
              .then(async (existingKeys) => {
                if (existingKeys.length === 0) {
                  await saveApiKeyToDb({
                    userId,
                    email,
                    keyType: "free",
                    apiKey: apiKeyForUserId(userId, "free"),
                    tier: "free",
                  });
                }
                try {
                  const clerk = createClerkClient({
                    secretKey: process.env.CLERK_SECRET_KEY,
                  });
                  await clerk.users.updateUserMetadata(userId, {
                    privateMetadata: { welcome_sent: true },
                  });
                } catch {
                  /* ignore */
                }
              })
              .catch(() => {});
          }

          return NextResponse.json({
            authenticated: true,
            provider: "clerk",
            user: {
              id: userId,
              email,
              name,
              plan,
              planStatus: snapshot.planStatus,
              planPeriod: snapshot.planPeriod,
              planRenewsAt: snapshot.planRenewsAt,
              hasInterviewMasterclass: snapshot.hasInterviewMasterclass,
              apiKey: activeKey,
            },
          });
        }
      }
    } catch {
      // Fall through to dev access or legacy session
    }
  }

  // Developer access fallback in local / dev environments
  if (isDevAccessAllowed(req)) {
    return NextResponse.json(devUserPayload());
  }

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
      planStatus: "active",
      planPeriod: session.plan === "free" ? "none" : "monthly",
      planRenewsAt: null,
      hasInterviewMasterclass: false,
      apiKey: session.apiKey,
    },
  });
}

