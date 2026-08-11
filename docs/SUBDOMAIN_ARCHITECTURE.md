# Ace-Seek Subdomain & Multi-Domain Architecture

## 1. Domain topology

| Host | Role |
|------|------|
| **`www.ace-seek.com`** | **Primary** main site: pricing, marketing, signup, dashboard, API keys |
| `main.ace-seek.com` | Optional alias of main (if added in Vercel) |
| **`vlsi.ace-seek.com`** | VLSI intro + API-key login + studios |
| **`tools.ace-seek.com`** | Tools intro + API-key login + workstations |
| `ace-seek.com` (apex) | **Not used** — skip apex DNS / Invalid Config is fine |

---

## 2. Identity model

- **Sign up / dashboard / get API key** → only on **www.ace-seek.com**
- **Subdomain login** → paste API key only (`/login` on vlsi/tools)
- No signup forms on subdomains

---

## 3. Environment (Vercel + local)

```env
NEXT_PUBLIC_SITE_URL=https://www.ace-seek.com
NEXT_PUBLIC_VLSI_URL=https://vlsi.ace-seek.com
NEXT_PUBLIC_TOOLS_URL=https://tools.ace-seek.com
```

Redeploy after changing Vercel env vars.

---

## 4. DNS (Spaceship) — recommended set

| Type | Name | Value |
|------|------|--------|
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `vlsi` | `cname.vercel-dns.com` |
| CNAME | `tools` | `cname.vercel-dns.com` |
| CNAME | `main` | `cname.vercel-dns.com` (optional) |

**Do not** require apex `@` A record if you only use **www**.

---

## 5. Vercel Domains

Add and mark **Valid**:

- `www.ace-seek.com` ← primary production domain  
- `vlsi.ace-seek.com`  
- `tools.ace-seek.com`  
- Optional: `main.ace-seek.com`  

You can **remove** `ace-seek.com` from the project if it stays Invalid, or leave it unconfigured.

---

## 6. Clerk

In Clerk Dashboard → Domains / allowed origins, include:

- `https://www.ace-seek.com`
- `https://vlsi.ace-seek.com`
- `https://tools.ace-seek.com`
- (optional `https://main.ace-seek.com`)

---

## 7. Local paths

| Path | Same as |
|------|---------|
| `/` | Main (www) |
| `/vlsi` | VLSI intro |
| `/tools` | Tools intro |
