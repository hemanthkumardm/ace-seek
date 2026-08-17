# Ace-Seek — Final product verify, gaps & leftover work

**Date:** 2026-08-11  
**Branch:** `vlsi.ace-seek` (local **ahead of origin by 2 commits** + large uncommitted working tree)  
**Engines suite:** `npm run verify` → **403/403 assertions PASSED**  
**Typecheck:** `tsc --noEmit` → **clean** (no errors reported at verify time)

Related docs:

| Doc | Topic |
|-----|--------|
| `VLSI_PRODUCT_ROADMAP.md` | Phase A/B feature roadmap |
| `AUTH_CLERK.md` | Clerk setup |
| `CLOUD_STACK.md` | Supabase + SDC cloud |
| `FULL_FLEDGE_CLOUD.md` | Full cloud cutover plan |
| `SUBDOMAIN_ARCHITECTURE.md` | Main vs vlsi vs tools domains (ASIC focus; no FPGA product) |

---

## 1. Executive summary

| Layer | Status | Notes |
|-------|--------|--------|
| **VLSI / ASIC engines** (SDC, Timing, MMMC, UPF, ECO, Report Hub, Genus scripts) | **Strong / done for MVP** | Covered by 403 automated asserts; product focus is ASIC only |
| **FPGA platform** | **Removed** | No `/fpga/*`, no `fpga.ace-seek.com` product surface |
| **Tools suite** (doc compiler, diff, converters, TeX, etc.) | **MVP live** | Mostly client-side; API key gating uneven |
| **Main marketing site** (pricing, signup, dashboard shell) | **MVP** | Clerk login/signup wired; billing not real |
| **Auth (Clerk)** | **Wired, keys in `.env.local`** | Not proven on production deploy in this verify |
| **Cloud projects (Supabase)** | **Partial** | Schema + SDC API exist; env present locally; MMMC/UPF/Reports not cloud |
| **Subdomain productization** | **Mostly designed** | Intro pages + API login; brand home fixed; DNS/Vercel not verified here |
| **Ship readiness** | **Not production-complete** | Uncommitted code, no Stripe, localStorage still primary for many studios, git push blocked earlier |

**Bottom line:** Core **EDA intelligence product (engines + studios)** is in good shape for demos. **SaaS shell (billing, multi-device everything, clean deploy, kill demo auth)** is the main leftover.

---

## 2. Automated verification (engines)

```bash
cd web && npm run verify
# → 403/403 assertions passed
```

Covers (non-exhaustive):

- STA parse (Innovus / PT / Tempus fixtures, large paste)
- Graph merge, cone export, serialize
- SDC generate/parse/lint/CDC
- Diff (SDC + timing), corners
- ECO proposals + multi-vendor script emit (Genus depth: path groups, exceptions, full synth flow)
- MMMC configurator + Innovus fixture round-trip + SDC/Timing links
- UPF engine + pad_top fixture
- Report Hub classify/tags
- Cell ladder ECO without Liberty

**Not covered by suite:**

- Browser UI / E2E (Playwright/Cypress)
- Real Clerk sign-in / Supabase write on network
- Docker compile path / PDF convert workers under load
- Subdomain DNS rewrites on Vercel
- Stripe webhooks

---

## 3. Product surface map — done vs partial

### 3.1 Main domain (`ace-seek.com`)

| Surface | Status | Gaps |
|---------|--------|------|
| Home / marketing | Done | Needs production URLs for VLSI/Tools in env |
| Pricing / offers / advertise / blog / docs | Present (static-ish) | Not wired to real billing or CMS |
| Signup / Login | **Clerk** (`/signup`, `/login` catch-alls) | Legacy `/api/auth/*` + `user-store` still exist |
| Dashboard | Shows plan + API key | Plan not from Stripe; key HMAC depends on pepper |
| Clerk provider + `proxy.ts` | Done (Next 16) | Must set allowed origins for prod domains |

### 3.2 VLSI platform (`vlsi.ace-seek.com` → `/vlsi`)

| Surface | Status | Gaps |
|---------|--------|------|
| Brutalism intro | Done | — |
| API key login page | Done (`/vlsi/login`) | Optional harden: block workstation without key consistently |
| Workstation auth guard | Present in layout | Clerk session vs API key dual path; offline `ace_*` fallback is loose |
| SDC Studio | Strong | Cloud save if Supabase+Clerk; else localStorage; no project switcher UI |
| Timing Studio | Strong | ECO vendor scripts; uses last SDC from storage for pack; no cloud session |
| MMMC Studio | Strong configurator | **No cloud save**; local transfer only |
| Power Studio (UPF) | Strong configurator | **No cloud save** |
| Report Hub | Done (browser) | **localStorage only** (~1.2MB); no Storage |
| Genus ECO + full flow | Done | Other vendors still have PLACEHOLDERs |
| Brand → VLSI home | Fixed | Verify on live DNS |

### 3.3 Tools platform (`tools.ace-seek.com` → `/tools`)

| Surface | Status | Gaps |
|---------|--------|------|
| Brutalism intro | Done | — |
| API key login | Done (`/tools/login`) | — |
| Doc compiler / diff / converters / TeX / table / sanitizer / script-helper | Live | Key storage key name may differ (`ace_api_key` vs `ace_seek_api_key`) |
| Auth guard | Wired | Same dual-path caveats as VLSI |

### 3.4 Backend / infra (code)

| Piece | Status |
|-------|--------|
| `@clerk/nextjs` + `src/proxy.ts` | Done |
| Supabase admin client + `sdc_projects` API | Done |
| `supabase/schema.sql` (profiles, sdc, mmmc/upf stubs) | Done (must run in Supabase SQL) |
| Stripe / Resend / PostHog / Sentry / Upstash / Pinecone | **Not in codebase** |
| Vercel project / multi-domain DNS | **Operator step** (not verified here) |

---

## 4. Required upgrades (to call the product “full fledge”)

Ordered by **user impact** and **dependency**.

### P0 — Ship blockers (do first)

| # | Item | Why |
|---|------|-----|
| P0.1 | **Commit + push** all uncommitted work + docs + `misc/` + Supabase schema | Origin is stale; collaborators/Vercel won’t see cloud/auth/subdomain work |
| P0.2 | **Vercel deploy** with full env set (Clerk, Supabase, site/VLSI/Tools URLs) | Local-only keys don’t make production multi-device |
| P0.3 | **DNS** for `ace-seek.com`, `www`, `vlsi`, `tools` → Vercel | Subdomain architecture depends on it |
| P0.4 | **Clerk Dashboard** allowed origins + production keys (or test keys on preview) | Sign-in fails or loops otherwise |
| P0.5 | **Run `supabase/schema.sql`** on the Supabase project | SDC cloud API 500s without tables |
| P0.6 | **Unify API key storage key** (`ace_seek_api_key` everywhere; fix doc-compiler `ace_api_key`) | Tools vs VLSI auth desync |

### P1 — Product correctness / trust

| # | Item | Why |
|---|------|-----|
| P1.1 | **Cloud-first SDC** (localStorage = cache only); project list / rename UI | Multi-device was the stated goal |
| P1.2 | **Cloud save MMMC + UPF** (tables stubbed; need API + studio hooks) | Same as SDC |
| P1.3 | **Report Hub → Supabase Storage** + DB index | History dies with browser today |
| P1.4 | **Disable legacy auth** when Clerk configured (no in-memory `user-store` as source of truth) | Security / restarts wipe users |
| P1.5 | **Require auth on studios** (API key or signed-in + key) without loose offline bypass in prod | Guard currently soft-accepts `ace_*` on fetch failure |
| P1.6 | **Stripe Checkout + webhook → `profiles.plan` + Clerk metadata** | Pricing page is marketing-only |
| P1.7 | **E2E smoke** (signup → dashboard key → vlsi login → SDC edit → reload → cloud) | Engines pass ≠ product path works |

### P2 — Depth / polish

| # | Item | Why |
|---|------|-----|
| P2.1 | Fill **Yosys / OpenROAD / ICC2** ECO PLACEHOLDERs (if those users matter) | Genus is strong; others thin |
| P2.2 | Optional **Liberty parse** for cell ladder | B4 deferred on purpose |
| P2.3 | **Timing ECO session cloud** sync | localStorage only |
| P2.4 | Cross-studio **session graph** / shared design name UX | Fragmented state |
| P2.5 | **Resend** (welcome, key email), **Sentry**, **PostHog**, **Upstash** rate limits | Ops quality |
| P2.6 | Roadmap **B5–B8** (RTL CDC, SPEF SI, DFT, physical lite) | Optional product pillars |
| P2.7 | Refresh **VLSI_PRODUCT_ROADMAP.md** inventory table (still says UPF/Liberty “Planned”) | Docs drift |
| P2.8 | Remove dead paths (`sdc-studio/page-v1.tsx` if unused) | Hygiene |

### P3 — Nice later

- Clerk Organizations / team seats  
- Pinecone AI search over reports  
- Graphite/PR CI beyond local `verify`  
- Real multi-tenant RLS on Supabase (today: service role + Clerk `userId` filter)  

---

## 5. Leftover work checklist (actionable)

### 5.1 Operator (you) — no code

- [ ] Push branch: `git push origin vlsi.ace-seek` (auth required)  
- [ ] Confirm Supabase SQL ran; tables `profiles`, `sdc_projects` exist  
- [ ] Vercel: import `web/`, set env from `.env.example`  
- [ ] DNS: apex + `vlsi` + `tools`  
- [ ] Clerk: production domains + paths `/login`, `/signup`  
- [ ] Manual test: main signup → dashboard key → `vlsi…/login` → SDC CLOUD badge on two browsers  

### 5.2 Engineering — near term

- [ ] Commit remaining working tree (auth, subdomain, cloud, docs)  
- [ ] Fix dual API key localStorage names  
- [ ] Production flag: no legacy login, no soft API-key bypass  
- [ ] MMMC + UPF cloud POST/GET APIs (mirror SDC)  
- [ ] SDC project switcher UI  
- [ ] Report Hub upload to Storage  
- [ ] Stripe minimal Pro checkout  

### 5.3 Engineering — later / optional

- [ ] B5 RTL CDC engine  
- [ ] B6 SPEF SI  
- [ ] B7 DFT Studio  
- [ ] B8 Physical lite  
- [ ] Non-Genus ECO depth  
- [ ] Observability stack (Sentry/PostHog)  

---

## 6. Env readiness (local snapshot)

Present in `web/.env.local` at verify time (values redacted):

| Variable | Present |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes |
| `CLERK_SECRET_KEY` | Yes |
| Clerk path/after-sign URLs | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes (note: code often expects `ANON` name — confirm match) |
| `NEXT_PUBLIC_SITE_URL` / `VLSI_URL` / `TOOLS_URL` | Check if set for prod |
| `ACE_API_KEY_PEPPER` | Optional; falls back to Clerk secret |

**Action:** Align env **names** with `web/.env.example` (`NEXT_PUBLIC_SUPABASE_ANON_KEY` vs publishable key).

---

## 7. Git / release hygiene

| Item | State |
|------|--------|
| Last commits on branch | Genus ECO + full VLSI platform |
| Uncommitted | Large set: Clerk, Supabase, subdomain login/layouts, docs, proxy, etc. |
| `misc/` Genus docs | In prior commit |
| Remote push | Previously failed (no GitHub auth); branch may still be unpushed for latest |

**Required upgrade:** treat “committed + deployed + DNS green” as the release bar, not only local verify.

---

## 8. Risk register (short)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Demo users in RAM | High | Clerk-only in prod |
| SDC/MMMC lost on clear browser without cloud | High | Supabase + signed-in auto-save |
| API key accepted offline if starts with `ace_` | Medium | Prod: fail closed on validate error |
| Service role key exposure | Critical if leaked | Server-only env; never client |
| Roadmap docs stale | Low | Update inventory after ship |
| Free-tier Supabase/Clerk limits | Medium | Caps (already 20 SDC projects) |

---

## 9. Suggested completion order (4 tracks)

```text
Track A — Ship what you have
  1. Commit all WIP
  2. Push
  3. Vercel + DNS + Clerk + Supabase SQL
  4. Manual multi-device SDC test

Track B — Trust
  5. Kill legacy auth in prod
  6. Unify API keys + harden workstation guard
  7. Cloud MMMC + UPF + Report Hub

Track C — Money
  8. Stripe Pro + plan on profiles
  9. Resend key email

Track D — Optional depth
  10. B5–B8 / Liberty / non-Genus ECO as demand appears
```

---

## 10. Definition of “product complete” (MVP SaaS)

All must be true:

1. User signs up only on **ace-seek.com** (Clerk).  
2. Dashboard shows stable API key.  
3. **vlsi** / **tools** intro + API login work on real hostnames.  
4. SDC (and ideally MMMC/UPF) **survive** browser wipe when signed in.  
5. `npm run verify` green on CI.  
6. Main branch deployed; no required secrets only on laptop.  
7. At least one paid path (Stripe test mode OK).  

**Current estimate vs that bar:** engines ~**90%**; SaaS shell ~**40–50%**; overall shippable demo ~**70%**, production SaaS ~**not yet**.

---

## 11. Re-verify commands

```bash
cd web
npm run verify
npx tsc --noEmit
# After deploy:
# - https://www.ace-seek.com/signup
# - https://www.ace-seek.com/dashboard  (copy key)
# - https://vlsi.ace-seek.com/login  (paste key)
# - Edit SDC → second browser same account
```

---

*This file is the living “what’s left” snapshot as of the final verify pass. Update after Track A ship.*
