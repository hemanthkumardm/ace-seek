# Full-fledge cloud setup (no local as source of truth)

**Goal:** Ace-Seek runs multi-user / multi-device on **Clerk + Supabase + Vercel** (plus Stripe later).  
Engines (STA/SDC math) can stay in the **browser**; **identity + data** must be cloud.

**Related:** `AUTH_CLERK.md`, `CLOUD_STACK.md`, `web/.env.example`, `supabase/schema.sql`

---

## Goal definition

**Full fledge without local** means:

- No in-memory demo users  
- No “works only in this browser” as the main path  
- Login → projects → tools all live on **Clerk + Supabase + Vercel** (+ Stripe later)

---

## A. Accounts you create (do this first)

| # | Service | Action |
|---|---------|--------|
| 1 | **Clerk** | Create app → copy `pk_…` + `sk_…` → Paths: `/login`, `/signup`, after → `/dashboard` |
| 2 | **Supabase** | Create project → **SQL Editor** → run `supabase/schema.sql` → copy URL + **service_role** key |
| 3 | **Vercel** | Import repo → root `web` → add env vars → deploy |
| 4 | **Domain** | Apex + `www` + `vlsi.` / `doc.` / `tools.` → Vercel DNS |
| 5 | **Clerk domains** | Allow production URLs (`https://ace-seek.com`, subdomains) |
| 6 | *(later)* **Stripe** | Products Free/Pro/Team + webhook |
| 7 | *(later)* Resend / Sentry / PostHog / Upstash | Email, errors, analytics, rate limits |

---

## B. Env vars (production = Vercel, not only laptop)

```env
# Required for full cloud identity + projects
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_or_test_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # server only
ACE_API_KEY_PEPPER=<long-random-string>   # stable API keys

# Optional now
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://ace-seek.com
```

Without these on **Vercel**, production still falls back to local/demo behavior.

### Checklist after deploy

1. Sign up on live site  
2. Dashboard shows user  
3. SDC badge **CLOUD** after edit  
4. Other browser/device, same account → SDC still there  

---

## C. What’s already cloud-capable vs still local

| Area | Today | To be full cloud |
|------|--------|------------------|
| Auth | Clerk wired (legacy if no keys) | Keys on Vercel; **remove/disable legacy** login |
| SDC projects | Supabase API + auto-save | Keys + schema; force sign-in for `/vlsi/*` |
| SDC same-browser | localStorage fallback | Keep as **offline cache only**, not source of truth |
| MMMC / Power / Timing session | Mostly localStorage | Same pattern as SDC (`mmmc_projects`, `upf_projects`, reports) |
| Report Hub | localStorage cap | Supabase **Storage** + `report_index` table |
| ECO / API keys | Deterministic from Clerk id | OK; plan from Stripe → `profiles.plan` |
| PDF tools API key paste | localStorage key | Prefer Clerk session on subdomain |
| Demo user `engineer@…` | In-memory store | Delete path once Clerk is required |

---

## D. Product rules for “no local”

1. **Auth required** for VLSI studios (and maybe dashboard-only tools).  
2. **Cloud is source of truth**; localStorage = cache / offline draft.  
3. **No guest SDC** (or guest = ephemeral only, clear warning).  
4. **Plans** only from Stripe/Clerk metadata, not inventing keys in RAM.  
5. **One active project per studio** per user (already partly true for SDC).  

---

## E. Engineering work still needed (after keys work)

Do in this order:

### Phase 1 — Hard cutover (1–2 days)

- Require Clerk on production (no legacy auth).  
- SDC: load cloud first; local only as cache.  
- Protect `/vlsi/*` (and `/dashboard`) with Clerk.  
- Commit + push + Vercel auto-deploy.  

### Phase 2 — All studios cloud (few days)

- API + UI for **MMMC**, **Power/UPF**, **Timing ECO session** (tables already stubbed for MMMC/UPF).  
- Project switcher: list / rename / new project.  

### Phase 3 — Report Hub cloud

- Upload report → Supabase Storage  
- Metadata in Postgres  
- Open-in-studio from cloud id (not local transfer key)  

### Phase 4 — Money + ops

- Stripe Checkout + webhook → `profiles.plan` + Clerk metadata  
- Resend (welcome / invoice)  
- Sentry + PostHog  
- Upstash rate limits on `/api/convert`, `/api/compile`  

### Phase 5 — Polish

- Remove `user-store` demo path  
- Org/team (Clerk Orgs or Supabase `project_members`)  
- Pinecone only if you add AI search  

---

## F. Hands-on sequence this week

```text
Day 1  Clerk app + Supabase SQL + .env.local → npm run dev
       → Sign in, edit SDC, see CLOUD badge, open second browser

Day 2  Push git → Vercel → env vars → DNS
       → Same test on https://ace-seek.com

Day 3  Decide: require login for VLSI (enforce in code)

Day 4+ MMMC/Power/Reports cloud + Stripe
```

---

## G. What “done” looks like

| Check | Passes when |
|-------|-------------|
| Multi-user | Two emails, two isolated SDC sets |
| Multi-device | Same user, phone + laptop, same SDC |
| No laptop dependency | Works after wipe browser **if** signed in |
| Domain | `ace-seek.com` + `vlsi.` serve Vercel build |
| Paid path | Stripe test payment flips plan / API key tier |

---

## Bottom line

**You don’t need more free tools first.**  
You need:

1. **Configure** Clerk + Supabase + Vercel + domain (keys live, SQL run).  
2. **Use** the product until SDC shows **CLOUD** on two devices.  
3. **Then** code: require auth, cloud for MMMC/Power/Reports, kill legacy local auth.  

### Highest-leverage next code step

**Production mode:** require Clerk for `/vlsi/*`, cloud-first SDC (local only cache), disable legacy login.

### Free stack map (domain you own)

| Free tool | Role | Status in repo |
|-----------|------|----------------|
| **Clerk** | Multi-user multi-device login | Wired |
| **Supabase** | SDC projects (+ MMMC/UPF stubs) | SDC API wired |
| **Vercel** | Host + env secrets | You deploy |
| Stripe / Resend / PostHog / Sentry / Upstash | Billing, email, analytics, errors, rate limits | Later |
| Pinecone | AI search over dumps | Skip until needed |

---

## Quick links

| Doc | Content |
|-----|---------|
| `docs/AUTH_CLERK.md` | Clerk keys and paths |
| `docs/CLOUD_STACK.md` | Supabase + SDC cloud behavior |
| `supabase/schema.sql` | Postgres tables |
| `web/.env.example` | Env template |
