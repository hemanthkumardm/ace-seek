import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, RefreshCw, Building, MapPin, Mail, Phone } from "lucide-react";

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
                <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Compliance Verified
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
              1. Digital Service Fulfillment
            </h2>
            <p>
              Ace-Seek Technologies (&quot;Ace-Seek&quot;) provides digital Software-as-a-Service (SaaS) subscriptions and API licensing for EDA workstations. Upon payment verification via Razorpay, digital API license keys and plan entitlements are issued instantly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. 7-Day Money Back Guarantee & Eligibility
            </h2>
            <p>
              We offer a <strong>7-day refund guarantee</strong> from the date of payment for all subscription plans (Pro, Max, Team). Customers who encounter technical issues or service mismatch may request a full refund within 7 calendar days of transaction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Refund Request Process
            </h2>
            <p>
              To initiate a refund, please send an email to <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a> with the following information:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li>Your registered email address.</li>
              <li>Your Razorpay Payment ID (e.g. <code>pay_xxxxxxxxxxxxxx</code>) or Order ID.</li>
              <li>Reason for refund request.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              4. Refund Processing Time & Payment Mode
            </h2>
            <p>
              Once your refund request is verified and approved:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>Refund Mode:</strong> Refunds are credited back to the <strong>original source of payment</strong> (UPI ID, Debit/Credit Card, Netbanking, or Wallet used during the transaction via Razorpay).</li>
              <li><strong>Refund Timeline:</strong> Refunds are processed within <strong>5 to 7 working days</strong> (5 to 7 business days) from the date of approval.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-[var(--bevel-shadow)]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-2">
              <Building className="w-4 h-4" /> Merchant Refund Contact Info
            </h2>
            <div className="sk-recessed p-4 space-y-2 text-slate-300 text-xs font-mono">
              <p><strong className="text-white">Legal Entity Name:</strong> Ace-Seek Technologies (Ace-Seek Inc.)</p>
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Registered Address:</strong> #102, Tech Park, Indiranagar, Bengaluru, Karnataka, India - 560038</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Support Email:</strong> <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a></p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Support Phone:</strong> <a href="tel:+919876543210" className="text-[var(--accent-cyan)] underline">+91 98765 43210</a></p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
