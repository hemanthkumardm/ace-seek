import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Return Policy | Ace-Seek",
  description: "Refund and Return policy for Ace-Seek SaaS plan subscriptions and API licenses.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-full flex flex-col font-mono bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 space-y-8 max-w-4xl mx-auto">
        <div className="sk-panel p-8 space-y-4 border-[var(--bevel-highlight)]">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well w-10 h-10">
              <RefreshCw className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Legal Compliance
              </span>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Refund & Return Policy
              </h1>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Last Updated: August 12, 2026 · Effective Date: August 12, 2026
          </p>
        </div>

        <div className="sk-panel p-8 space-y-6 text-xs leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              1. Digital Product Delivery
            </h2>
            <p>
              Ace-Seek provides digital software-as-a-service (SaaS) features, EDA workstations, and API licensing. Upon successful payment verification via Razorpay, your digital API key and tier entitlements are generated and issued instantly to your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. 7-Day Refund Policy
            </h2>
            <p>
              We offer a <strong>7-day money-back guarantee</strong> for all paid subscription tiers (Pro, Max, Team). If you experience technical defects, unexpected downtime, or service mismatch within 7 days of purchase, you are eligible for a full refund.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Refund Request Procedure
            </h2>
            <p>
              To request a refund:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-2">
              <li>Email our support team at <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a> within 7 days of purchase.</li>
              <li>Include your registered email address, plan tier name, and Razorpay Payment ID (e.g. <code>pay_xxxxxx</code>).</li>
              <li>Briefly describe the reason for your refund request.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              4. Processing Time & Method
            </h2>
            <p>
              Once approved, refunds are initiated back to the original payment source (UPI ID, Credit/Debit card, or NetBanking account used during checkout via Razorpay). Refunds typically reflect in your account within <strong>5 to 7 business days</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              5. Non-Refundable Cases
            </h2>
            <p>
              Refund requests submitted after 7 days from the transaction date or requests involving terms of service violations (such as API key abuse or automated quota scraping) are not eligible for a refund.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
