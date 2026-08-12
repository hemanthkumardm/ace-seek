import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, FileText, Building, MapPin, Mail, Phone } from "lucide-react";

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
                <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Compliance Verified
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
              1. Acceptance of Terms & Merchant Details
            </h2>
            <p>
              By accessing or using the website <strong>www.ace-seek.com</strong> and its subdomains (vlsi.ace-seek.com, tools.ace-seek.com), you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you (the user) and <strong>Ace-Seek Technologies</strong> (&quot;Ace-Seek&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. Services Offered
            </h2>
            <p>
              Ace-Seek operates an apex Software-as-a-Service (SaaS) ecosystem providing Electronic Design Automation (EDA) helper tools, SDC constraints analysis, timing closure workstations, document compilers, and API services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Account Registration & API Keys
            </h2>
            <p>
              Access to paid subscription tiers (Pro, Max, Team) requires an active API license key issued automatically upon successful payment. Users are responsible for maintaining the security of their API key and account credentials. Commercial resale or unauthorized sharing of API keys is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              4. Payment Terms & Billing Gateway
            </h2>
            <p>
              All online payments for subscription plans and API access are processed securely via our merchant payment gateway partner, <strong>Razorpay</strong>. Prices are quoted in Indian Rupees (INR). Payments are charged on a monthly or one-time plan basis as selected by the user during checkout.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              5. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in <strong>Bengaluru, Karnataka, India</strong>.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-[var(--bevel-shadow)]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-2">
              <Building className="w-4 h-4" /> Merchant & Support Contact Details
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
