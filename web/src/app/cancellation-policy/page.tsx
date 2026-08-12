import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation Policy | Ace-Seek",
  description: "Cancellation policy detailing how to cancel paid plan subscriptions on Ace-Seek.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-full flex flex-col font-mono bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 space-y-8 max-w-4xl mx-auto">
        <div className="sk-panel p-8 space-y-4 border-[var(--bevel-highlight)]">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well w-10 h-10">
              <XCircle className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Legal Compliance
              </span>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Cancellation Policy
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
              1. Subscription Cancellation
            </h2>
            <p>
              Users can cancel or downgrade their active subscription plan at any time. You are never locked into long-term contracts, and there are no cancellation fees.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. How to Cancel
            </h2>
            <p>
              You may cancel your plan through either of the following methods:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>Self-Service:</strong> Log into your User Dashboard at <code>www.ace-seek.com/dashboard</code> and manage your plan status under Account Control Deck.</li>
              <li><strong>Support Request:</strong> Email <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a> with subject line &quot;Cancel Plan&quot; from your registered email.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Effective Date of Cancellation
            </h2>
            <p>
              When you submit a cancellation request, your paid tier capabilities (higher rate limits, cloud workstation sync) will remain active until the conclusion of your current billing period. Once the period ends, your account automatically reverts to the Free tier.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              4. Combining Cancellation with Refund
            </h2>
            <p>
              If you cancel within 7 days of initial purchase and meet the criteria outlined in our <a href="/refund-policy" className="text-[var(--accent-cyan)] underline">Refund & Return Policy</a>, you may request a full refund simultaneously with your cancellation.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
