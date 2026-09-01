# Staging Environment Deployment & Isolation Guide

This document outlines the architecture, environment isolation, and deployment instructions for the **Ace-Seek Staging Environment**.

---

## 🛠️ Architecture Overview

The staging environment mirrors production while preventing test transactions from polluting live analytics, user accounts, or financial reporting.

| Property | Staging Environment | Production Environment |
| :--- | :--- | :--- |
| **Main URL** | `https://staging.ace-seek.com` | `https://www.ace-seek.com` |
| **VLSI Studio** | `https://staging-vlsi.ace-seek.com` | `https://vlsi.ace-seek.com` |
| **Tools Subdomain** | `https://staging-tools.ace-seek.com` | `https://tools.ace-seek.com` |
| **Razorpay Mode** | **Test Mode** (`rzp_test_...`) | **Live Mode** (`rzp_live_...`) |
| **Database** | Supabase Staging Schema | Supabase Production Cluster |
| **Auth Domain** | Clerk Sandbox Instance | Clerk Production Instance |

---

## ⚙️ Environment Configuration

1. Copy `.env.staging` to your staging server environment:
   ```bash
   cp web/.env.staging web/.env.local
   ```
2. Build and launch the staging instance:
   ```bash
   npm run build
   npm run start
   ```

---

## 🧪 Running Automated CI E2E Tests on Staging

To run the automated E2E smoke test suite against staging:

```bash
TEST_BASE_URL=https://staging.ace-seek.com npx tsx web/scripts/e2e-flow.test.ts
```

---

## 📡 Webhook Configuration (Staging)

Configure Razorpay Webhook in the Razorpay Dashboard (Test Mode):
- **URL**: `https://staging.ace-seek.com/api/webhooks/razorpay`
- **Secret**: `whsec_staging_ace_seek_2026`
- **Events**: `payment.captured`, `order.paid`
