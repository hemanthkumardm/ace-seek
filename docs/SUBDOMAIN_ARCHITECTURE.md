# Ace-Seek Subdomain & Multi-Domain Architecture

This document specifies the multi-domain routing, identity model, and subdomain setup for Ace-Seek.

---

## 1. Domain Topology

| Host | Role | Routing / Target |
|------|------|------------------|
| **`ace-seek.com`** (Apex) | Pricing, marketing, user signup, dashboard, API license key generation | Main Next.js App Router |
| **`vlsi.ace-seek.com`** | Neo-Brutalism intro page + API Key login + VLSI Workstations (SDC, Timing, MMMC, Power, Reports) | Rewritten to `/vlsi` |
| **`tools.ace-seek.com`** | Neo-Brutalism intro page + API Key login + Developer Tools (Compiler, Diff, Converter, Sanitizer, TeX, Table) | Rewritten to `/tools` |

---

## 2. Identity & Authentication Model

- **Sign Up**: Centralized on the main domain (`https://ace-seek.com/signup`). No direct signup is performed on subdomains.
- **Login on Subdomains**:
  1. **Clerk SSO**: Session cookie shared across `.ace-seek.com`.
  2. **API Key Authorization**: Users paste their Dashboard API License Key (`ace_free_usr_...` / `ace_pro_usr_...`) on `/vlsi/login` or `/tools/login`.
- **API Key Validation**: Standardized via `/api/validate-key`.

---

## 3. Environment Variables

Set the following environment variables in Vercel / `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://ace-seek.com
NEXT_PUBLIC_VLSI_URL=https://vlsi.ace-seek.com
NEXT_PUBLIC_TOOLS_URL=https://tools.ace-seek.com
```

---

## 4. Vercel & DNS Setup

1. **Vercel Project**: Single Next.js project pointed to root directory `web`.
2. **DNS CNAME Records**:
   - `vlsi.ace-seek.com` $\rightarrow$ `cname.vercel-dns.com`
   - `tools.ace-seek.com` $\rightarrow$ `cname.vercel-dns.com`
3. **Clerk Dashboard**:
   - Enable production domain `ace-seek.com` and include subdomains in allowed origins.
