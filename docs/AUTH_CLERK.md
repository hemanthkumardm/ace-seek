# Clerk authentication setup (Ace-Seek)

## Is Clerk free?

Yes for early product use. Clerk’s **Hobby** plan is free (generous MAU limit for launch; check [clerk.com/pricing](https://clerk.com/pricing) for current numbers). Paid tiers add org features, higher MAU, and advanced controls.

## Access model (current)

| Who | How they unlock |
|-----|-----------------|
| **Not logged in** | Marketing / product intros only. Studios & tools show **Sign in**. |
| **Logged in** | Plan from Clerk `publicMetadata.plan` (`free` \| `pro` \| `max` \| `team`). Free tier works with **no API key paste**. |
| **Scripts / CI** | Optional dashboard API token (`x-api-key`) for automation only. |

**Plan is tracked from login, not from the API key string.**  
Keys may still be derived for automation, but FeatureLock / entitlements in the browser follow the account session (`GET /api/auth/me`).

## What this gives you

| Capability | Without Clerk | With Clerk |
|------------|---------------|------------|
| Multi-user accounts | In-memory demo only | Real users in Clerk |
| Multi-device login | No | Same email → same session |
| Password reset / OAuth | No | Built-in |
| Plan for tools | Paste `ace_*` key | Session plan (metadata) |

## Setup

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy **Publishable key** + **Secret key** into `web/.env.local`.
3. Clerk Dashboard → **Paths**:
   - Sign-in: `/login`
   - Sign-up: `/signup`
   - After sign-in / sign-up: `/dashboard` (apex) or product redirect
4. **Domains** (required for subdomain login without bouncing to apex):
   - Primary: `ace-seek.com` + Frontend API `clerk.ace-seek.com`
   - Add satellites / allowed apps: `tools.ace-seek.com`, `vlsi.ace-seek.com`, `openroad.ace-seek.com`

## Plan metadata (subscriptions)

Default plan is **free**. **Paid upgrades are written automatically** by Razorpay verify + webhook via `applyPlanToUser()` — see `docs/SUBSCRIPTIONS.md`.

Manual override (support): Clerk Dashboard → Users → Public metadata:

```json
{
  "plan": "pro",
  "planStatus": "active",
  "planPeriod": "monthly",
  "planRenewsAt": "2026-10-07T00:00:00.000Z"
}
```

Values: `free` | `pro` | `max` | `team`.  
`planStatus` must be `active` or `trialing` for paid entitlements (expired/canceled → Free).

## API keys (automation only)

Dashboard still shows a derived token `ace_{plan}_usr_…` for scripts.  
Browser workstations should **sign in**, not paste this key.

## Local without keys

If Clerk env keys are missing:

- Host routing still works
- Login widgets show a configure hint
- Prefer Development `pk_test_` / `sk_test_` for localhost

## Related code

- `useEntitlements` → session via `/api/auth/me`
- `WorkstationAuthGuard` → requires signed-in account
- `SubdomainClerkLogin` → Clerk on vlsi / tools / openroad `/login`
