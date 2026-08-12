import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions | Ace-Seek",
  description: "Terms and Conditions governing the use of Ace-Seek SaaS portal and services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-full flex flex-col font-mono bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 space-y-8 max-w-4xl mx-auto">
        <div className="sk-panel p-8 space-y-4 border-[var(--bevel-highlight)]">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well w-10 h-10">
              <FileText className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Legal Compliance
              </span>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Terms and Conditions
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
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Ace-Seek platform (www.ace-seek.com, vlsi.ace-seek.com, tools.ace-seek.com), you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. Services Offered
            </h2>
            <p>
              Ace-Seek provides cloud-based Electronic Design Automation (EDA) helper utilities, VLSI timing & SDC analysis workstations, document compilation engines, and associated API services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. User Accounts & API Keys
            </h2>
            <p>
              Access to paid tiers (Pro, Max, Team) requires an active license API key issued upon payment verification. You are responsible for maintaining the confidentiality of your credentials and API key. Unauthorized distribution or commercial resale of API keys is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              4. Payment Terms & Billing
            </h2>
            <p>
              All payments for paid subscription plans are processed securely via our payment gateway partner, <strong>Razorpay</strong>. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              5. Intellectual Property
            </h2>
            <p>
              All content, software, logos, trademarks, and algorithms on Ace-Seek are the exclusive intellectual property of Ace-Seek Inc. User-uploaded files (SDC scripts, timing reports, TeX code) remain the property of the user.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              6. Limitation of Liability
            </h2>
            <p>
              Ace-Seek is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Ace-Seek Inc. shall not be liable for any indirect, incidental, or consequential damages resulting from platform downtime or data processing errors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              7. Contact & Support
            </h2>
            <p>
              For legal or billing inquiries, please contact our support team at:{" "}
              <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">
                support@ace-seek.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
