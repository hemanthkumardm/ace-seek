/**
 * Resolve a stable user_id for OpenROAD cloud (Clerk or API key → profiles).
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseServerReady } from "@/lib/supabase/config";
import { getApiKeyRecordFromDb } from "@/lib/supabase-keys";
import { createHash } from "crypto";

function clerkOn(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

export async function ensureProfile(
  userId: string,
  email?: string,
  name?: string
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from("profiles").upsert(
    {
      id: userId,
      email: email || null,
      name: name || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

export async function resolveOpenroadUser(
  req: Request
): Promise<
  | { userId: string; email?: string; name?: string }
  | NextResponse
> {
  if (!isSupabaseServerReady()) {
    return NextResponse.json(
      { error: "Supabase not configured (set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 }
    );
  }

  // 1) Clerk session
  if (clerkOn()) {
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await currentUser();
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses[0]?.emailAddress;
        const name =
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          email;
        await ensureProfile(userId, email, name);
        return { userId, email, name };
      }
    } catch {
      /* fall through to API key */
    }
  }

  // 2) API key → user_api_keys.user_id
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  if (apiKey.trim()) {
    const rec = await getApiKeyRecordFromDb(apiKey.trim());
    if (rec?.user_id) {
      await ensureProfile(rec.user_id, rec.email, rec.email);
      return { userId: rec.user_id, email: rec.email, name: rec.email };
    }
    // Ephemeral guest profile for bare keys (dev / max local)
    const guestId = `key_${createHash("sha256").update(apiKey.trim()).digest("hex").slice(0, 24)}`;
    await ensureProfile(guestId, undefined, "api-key-user");
    return { userId: guestId, name: "api-key-user" };
  }

  return NextResponse.json(
    { error: "Sign in or provide x-api-key for cloud storage" },
    { status: 401 }
  );
}
