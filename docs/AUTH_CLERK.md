# Clerk authentication setup (Ace-Seek)

## Is Clerk free?

Yes for early product use. Clerk’s **Hobby** plan is free (generous MAU limit for launch; check [clerk.com/pricing](https://clerk.com/pricing) for current numbers). Paid tiers add org features, higher MAU, and advanced controls.

## What this gives you

| Capability | Without Clerk | With Clerk |
|------------|---------------|------------|
| Multi-user accounts | In-memory demo only (lost on restart) | Real users in Clerk |
| Multi-device login | No | Same email → same session anywhere |
| Password reset / OAuth | No | Built-in |
| Dashboard API key | Random per signup in RAM | **Deterministic** per user id + plan |

**Not included yet:** cloud-synced SDC/Timing projects (needs Supabase or similar next). Auth is the first step.

## Setup (5 minutes)

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy **Publishable key** + **Secret key**.
3. In `web/`:

```bash
cp .env.example .env.local
# edit .env.local with your keys
npm run dev
```

4. Clerk Dashboard → **Paths**:
   - Sign-in: `/login`
   - Sign-up: `/signup`
   - After sign-in / sign-up: `/dashboard`

5. For production domains, add `ace-seek.com` and subdomains under Clerk **Domains**.

## Local without keys

If keys are missing:

- Host routing still works
- Login/signup use the **legacy** demo user (`engineer@company.com` / `password123`)
- Engine verify (`npm run verify`) does not need Clerk

## Plan metadata (Pro / Team)

Default plan is **free**. To mark a user Pro/Team in Clerk Dashboard → Users → Public metadata:

```json
{ "plan": "pro" }
```

API keys embed the plan prefix (`ace_pro_usr_…`). Changing plan regenerates the key formula (same pepper + new plan).

## Subdomain API keys

Dashboard shows a stable key: `ace_{free|pro|team}_usr_<id>_<hmac>`.

Paste into tools / VLSI “API Key Authorization”. Verification uses HMAC (`ACE_API_KEY_PEPPER` or `CLERK_SECRET_KEY`).

## Next (multi-device **projects**)

1. **Done:** localStorage auto-restore on SDC remount  
2. **Done:** Supabase `sdc_projects` + API — see `CLOUD_STACK.md`  
3. Later: MMMC/UPF cloud, Stripe plan → `profiles.plan`  
