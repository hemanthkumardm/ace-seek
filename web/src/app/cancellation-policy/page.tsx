import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, XCircle, Building, MapPin, Mail, Phone } from "lucide-react";

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
                <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Compliance Verified
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
              1. Subscription Cancellation Rights
            </h2>
            <p>
              Ace-Seek Technologies (&quot;Ace-Seek&quot;) allows customers to cancel subscription plans at any time. There are no lock-in contracts or cancellation penalties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. How to Request Cancellation
            </h2>
            <p>
              You can cancel your subscription plan through:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>User Dashboard:</strong> Log in at <code>www.ace-seek.com/dashboard</code> and manage active plan status.</li>
              <li><strong>Email Support:</strong> Send a request to <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a> or call <a href="tel:+91 84316 70673" className="text-[var(--accent-cyan)] underline">+91 84316 70673</a> with your account email and Razorpay Payment ID.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Cancellation Timeline & Access Retention
            </h2>
            <p>
              Cancellation requests processed before the end of your current billing cycle take effect at the conclusion of that period. Your paid tier features remain fully accessible until the current billing cycle expires.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-[var(--bevel-shadow)]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-2">
              <Building className="w-4 h-4" /> Cancellation Support Contact
            </h2>
            <div className="sk-recessed p-4 space-y-2 text-slate-300 text-xs font-mono">
              <p><strong className="text-white">Legal Entity Name:</strong> Ace-Seek Technologies (Ace-Seek Inc.)</p>
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Registered Address:</strong> #21, 11th main road, 4th G cross, kamakshipalya, Bangalore - 560079</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Support Email:</strong> <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a></p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> <strong className="text-white">Support Phone:</strong> <a href="tel:+919876543210" className="text-[var(--accent-cyan)] underline">+91 84316 70673</a></p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
