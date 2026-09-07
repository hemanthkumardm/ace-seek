# Account subscriptions (Pro / Max / Team)

Ace-Seek tracks paid plans like ChatGPT Plus / Cursor Pro: **the plan lives on the logged-in user**, not on a pasteable API key.

## Flow

1. User signs in (Clerk).
2. User buys Pro / Max / Team on `/pricing` (must be signed in).
3. Razorpay order notes include `user_id` + `plan`.
4. `/api/verify-payment` verifies HMAC, then `applyPlanToUser()` writes:
   - Clerk `publicMetadata.plan`, `planStatus`, `planRenewsAt`, …
   - Supabase `profiles.plan` + `subscriptions` row
5. Razorpay webhook does the same write (backup if the browser closes).
6. `/api/auth/me` + `useEntitlements` read the account plan on every host.

## Clerk metadata

```json
{
  "plan": "pro",
  "planStatus": "active",
  "planPeriod": "monthly",
  "planRenewsAt": "2026-10-07T00:00:00.000Z",
  "hasInterviewMasterclass": false,
  "lastPaymentId": "pay_…"
}
```

Effective entitlements use `effectivePlanFromMetadata()` — canceled / expired / past period → Free.

## Ops checklist (production)

1. Run updated `docs/SUPABASE_SCHEMA.sql` (profiles.max + subscriptions).
2. Razorpay Dashboard → Webhooks → `https://www.ace-seek.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `order.paid`, `payment.failed`, `subscription.cancelled`
3. Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, Clerk keys.
4. Smoke test: buy Pro on a test account → Dashboard shows Pro → vlsi PlanPill shows Pro after refresh.

## Interview Masterclass

One-time purchase sets `hasInterviewMasterclass: true` without changing SaaS plan.
