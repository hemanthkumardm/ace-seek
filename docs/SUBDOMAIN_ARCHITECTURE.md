# Ace-Seek Subdomain & Multi-Domain Architecture

## 1. Domain topology (canonical)

| Host | Role | App path |
|------|------|----------|
| **`www.ace-seek.com`** | **Primary** main site: pricing, marketing, signup, dashboard, API keys | `/` |
| `main.ace-seek.com` | Optional alias of main | `/` |
| **`vlsi.ace-seek.com`** | ASIC authoring (SDC · Timing · MMMC · Power · OpenROAD export) | `/vlsi` |
| **`openroad.ace-seek.com`** | OpenROAD PnR automation (upload handoff → Pro scripts / Max runs) | `/openroad` |
| **`tools.ace-seek.com`** | Tools intro + API-key login + workstations | `/tools` |
| `ace-seek.com` (apex) | **Not used** — skip apex DNS / Invalid Config is fine | — |

### Product model (important)

Three **peer platforms**, one Next.js deployment under `ace-seek/web`:

```
www  ── pricing · signup · dashboard · API keys
 │
 ├── vlsi      ── Reports · SDC · Timing · MMMC · Power · OpenROAD handoff
 ├── openroad  ── Project · Scripts (Pro) · Run (Max)
 └── tools     ── Doc · Diff · Convert · Sanitizer · TeX · Tables
```

**Do not:**

- Ship an FPGA product host or `/fpga/*` surface
- Maintain a second full app clone for production
- Put signup on product subdomains

**Do:**

- Author constraints on VLSI; run OpenROAD automation on `openroad` peer
- Share Clerk, API keys, Razorpay, Supabase, entitlements across platforms
- Use `NEXT_PUBLIC_VLSI_URL` / `NEXT_PUBLIC_OPENROAD_URL` / `NEXT_PUBLIC_TOOLS_URL`
- See `OPENROAD_PLATFORM.md`

---

## 2. Identity model

- **Sign up / dashboard / get API key** → only on **www.ace-seek.com**
- **Subdomain login** → paste API key only (`/login` on vlsi / tools)
- Studios require a **validated API key** (not Clerk session alone)

---

## 3. Environment (Vercel + local)

```env
NEXT_PUBLIC_SITE_URL=https://www.ace-seek.com
NEXT_PUBLIC_VLSI_URL=https://vlsi.ace-seek.com
NEXT_PUBLIC_OPENROAD_URL=https://openroad.ace-seek.com
NEXT_PUBLIC_TOOLS_URL=https://tools.ace-seek.com
```

Redeploy after changing Vercel env vars.  
`NEXT_PUBLIC_FPGA_URL` is **retired** — remove from env if still present.

---

## 4. DNS (Spaceship / Cloudflare / GoDaddy)

| Type | Name | Value |
|------|------|--------|
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `vlsi` | `cname.vercel-dns.com` |
| CNAME | `openroad` | `cname.vercel-dns.com` |
| CNAME | `tools` | `cname.vercel-dns.com` |
| CNAME | `main` | `cname.vercel-dns.com` (optional) |

**Do not** require apex `@` A record if you only use **www**.  
Remove any `fpga` CNAME if it was added earlier.

---

## 5. Vercel Domains

Add and mark **Valid**:

- `www.ace-seek.com` ← primary production domain  
- `vlsi.ace-seek.com`  
- `openroad.ace-seek.com`  
- `tools.ace-seek.com`  
- Optional: `main.ace-seek.com`  

Remove `fpga.ace-seek.com` if previously added.

---

## 6. Clerk

In Clerk Dashboard → Domains / allowed origins, include:

- `https://www.ace-seek.com`
- `https://vlsi.ace-seek.com`
- `https://openroad.ace-seek.com`
- `https://tools.ace-seek.com`
- (optional `https://main.ace-seek.com`)

Remove FPGA host origins if present.

---

## 7. Local paths & middleware rewrites

| Path / host | Same as |
|-------------|---------|
| `/` | Main (www) |
| `/vlsi` · `vlsi.ace-seek.com/` | VLSI / ASIC intro |
| `/openroad` · `openroad.ace-seek.com/` | OpenROAD PnR intro |
| `/tools` · `tools.ace-seek.com/` | Tools intro |

Internal links always use the full path prefix (`/vlsi/sdc-studio`, `/openroad/project`) so local path mode works without DNS.
