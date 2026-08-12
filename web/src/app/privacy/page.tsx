import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, Lock } from "lucide-react";

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
                <ShieldCheck className="w-3.5 h-3.5" /> Legal Compliance
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
              When you use Ace-Seek, we collect information necessary to deliver our services:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>Account Credentials:</strong> Name, email address, and authentication provider metadata.</li>
              <li><strong>Payment Information:</strong> Payment authorization status, order ID, and transaction ID processed via Razorpay. (We do NOT store credit card details or bank passwords).</li>
              <li><strong>Usage Telemetry:</strong> API key requests, workstation diagnostic telemetry, and rate limit counters.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. How We Use Your Data
            </h2>
            <p>
              Your data is used strictly for issuing API license keys, enforcing plan rate limits, processing payments, and improving system performance. We do not sell or trade user data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Razorpay Payment Security
            </h2>
            <p>
              All online transactions are securely handled by <strong>Razorpay Payment Gateway</strong>, which adheres to PCI-DSS Level 1 security standards. Cryptographic HMAC signatures are verified on our servers to ensure transaction integrity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              4. Data Retention & Security
            </h2>
            <p>
              We implement industry-standard encryption (HTTPS/TLS) and secure key storage. User project files processed in memory or synced across workstations are restricted to your account key.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              5. Contact Us
            </h2>
            <p>
              If you have privacy concerns or wish to request data deletion, contact us at:{" "}
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
