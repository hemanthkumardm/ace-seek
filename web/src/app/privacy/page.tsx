import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, Lock, Building, MapPin, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Ace-Seek",
  description: "Privacy Policy detailing data collection, processing, and protection on Ace-Seek.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full flex flex-col font-mono bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 space-y-8 max-w-4xl mx-auto">
        <div className="sk-panel p-8 space-y-4 border-[var(--bevel-highlight)]">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well w-10 h-10">
              <Lock className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Compliance Verified
              </span>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Privacy Policy
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
              1. Information We Collect
            </h2>
            <p>
              Ace-Seek Technologies (&quot;Ace-Seek&quot;, &quot;we&quot;, &quot;us&quot;) respects customer privacy. We collect customer information to provide SaaS services and process subscriptions:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>Personal Identity Data:</strong> Name, email address, and phone number provided during registration or checkout.</li>
              <li><strong>Payment Data:</strong> Payment status, order ID, and transaction ID. Payment card credentials, UPI passwords, and bank login details are collected securely by <strong>Razorpay Payment Gateway</strong> and are NEVER stored on Ace-Seek servers.</li>
              <li><strong>Usage & Telemetry Data:</strong> IP address, device browser type, API key quota usage, and system performance logs.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. How We Use Information
            </h2>
            <p>
              We use collected data to issue API license keys, authenticate users across subdomains (www, vlsi, tools), process payments via Razorpay, send service updates, and maintain platform security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Data Security & Razorpay Compliance
            </h2>
            <p>
              We enforce SSL/TLS encryption (HTTPS) across all endpoints. Online transactions are executed via <strong>Razorpay Payment Gateway</strong>, adhering to PCI-DSS Level 1 compliance standards. Cryptographic HMAC signatures are verified to prevent payment tampering.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              4. Data Disclosure & Third Parties
            </h2>
            <p>
              We do not sell, rent, or trade customer data to third parties. Data is shared only with trusted infrastructure providers (e.g. Razorpay for billing, Clerk for authentication) as necessary to fulfill services.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-[var(--bevel-shadow)]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-2">
              <Building className="w-4 h-4" /> Privacy Contact Information
            </h2>
            <div className="sk-recessed p-4 space-y-2 text-slate-300 text-xs font-mono">
              <p><strong className="text-white">Legal Entity Name:</strong> Ace-Seek Technologies (Ace-Seek Inc.)</p>
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Registered Address:</strong> #21, 11th main road, 4th G cross, Kamakshipalya, Bangalore - 560079</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Support Email:</strong> <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a></p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Support Phone:</strong> <a href="tel:+918431670673" className="text-[var(--accent-cyan)] underline">+91 84316 70673</a></p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
