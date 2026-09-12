# Phase 0 & Phase 1 — Launch checklist

## Definitions

| Phase | Meaning |
|-------|---------|
| **Phase 0** | Ops / infra: env, Supabase schema, Clerk domains, Razorpay webhook, deploy |
| **Phase 1** | Product: session login unlocks Free; buy Pro/Max writes plan to account; Interview gated |

Verify live config (no secrets):

```bash
curl -s https://www.ace-seek.com/api/health | jq
```

`phase0.ready` should be `true` when all checks pass.

---

## Phase 0 — do on dashboards

### Supabase
- [ ] SQL Editor → run `docs/SUPABASE_SCHEMA.sql`
- [ ] Confirm tables: `profiles` (plan includes `max`), `subscriptions`
- [ ] Vercel has `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

### Clerk
- [ ] Production keys on Vercel
- [ ] Domain `clerk.ace-seek.com` + certs deployed
- [ ] Satellites / allowed: `vlsi`, `tools`, `openroad` (+ `portal` if needed)
- [ ] Paths: `/login`, `/signup`

### Razorpay
- [ ] Live/test keys on Vercel
- [ ] Webhook → `https://www.ace-seek.com/api/webhooks/razorpay`
- [ ] Secret → `RAZORPAY_WEBHOOK_SECRET`
- [ ] Events: `payment.captured`, `order.paid`, `payment.failed`

### Vercel
- [ ] All vars from `web/.env.example` set for Production
- [ ] Redeploy after env changes
- [ ] Domains: www, vlsi, tools, openroad, portal

### Privacy (optional but recommended)
- [ ] Cloudflare proxy on public hosts
- [ ] WHOIS privacy on domain
- [ ] No personal name/phone on marketing pages

---

## Phase 1 — smoke tests

1. [ ] `vlsi.ace-seek.com/login` — dark theme, sign in works  
2. [ ] Open a studio while logged out → sign-in wall  
3. [ ] Sign in → Free studios open; PlanPill shows Free  
4. [ ] Interview → sign-in required → catalog loads; locked Q has no solution until purchase  
5. [ ] Buy Pro on www (signed in) → Dashboard shows PRO + renew date  
6. [ ] Refresh vlsi → PlanPill Pro  
7. [ ] Buy Interview Masterclass → `hasInterviewMasterclass` on account → solutions load  
8. [ ] Sign out → locked again  

---

## Code status (repo)

| Item | Status |
|------|--------|
| Session `useEntitlements` + WorkstationAuthGuard | Done |
| `applyPlanToUser` + verify-payment + webhook | Done |
| Interview catalog/question APIs (server-only bank) | Done |
| Convert + OpenROAD export session gate | Done |
| `/api/health` Phase 0/1 flags | Done |
| `.env.example` | Done |
| Supabase SQL in your project | **You run** |
| Clerk satellites + Razorpay webhook | **You configure** |
