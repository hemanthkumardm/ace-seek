# Free cloud stack setup (Ace-Seek)

Domain you already own + free tiers:

| Service | Role |
|---------|------|
| **Clerk** | Multi-user multi-device login |
| **Supabase** | SDC (and later MMMC/UPF) project JSON |
| **Vercel** | Host Next.js + env secrets |
| Stripe / Resend / PostHog / Sentry / Upstash | Later (billing, email, analytics, errors, rate limits) |

## 1. Clerk

See `AUTH_CLERK.md`. Keys in `web/.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## 2. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/schema.sql`.
3. **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional client)
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**, never expose to browser)

Auth model: **Clerk user id** is `profiles.id`. API routes use the service role and **always filter by Clerk `userId`**.

## 3. SDC multi-device behavior

| Situation | Behavior |
|-----------|----------|
| No Supabase / not signed in | `localStorage` auto-restore when leaving Timing and coming back |
| Clerk + Supabase | Active project saved ~1.6s after edits; loads cloud on open |
| Free cap | 20 SDC projects / user (reuses latest if over cap) |

UI badge on SDC Studio: **LOCAL** | **SYNC…** | **CLOUD**.

## 4. Vercel + domain

1. Import GitHub repo → Vercel.
2. Root directory: `web` (or monorepo setting).
3. Add all env vars from `.env.example`.
4. Domain: add `ace-seek.com` + `www` + product hosts (`vlsi.`, `doc.`, …).
5. Clerk Dashboard → allow those production URLs.

## 5. Verify without cloud

```bash
cd web && npm run verify
```

Engines do not need Clerk/Supabase. Cloud APIs return 401/503 until configured.

## Next

- MMMC / Power cloud tables (schema already has stubs)
- Stripe → `profiles.plan`
- Report Hub blobs in Supabase Storage  
