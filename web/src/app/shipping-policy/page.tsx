import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, Truck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Ace-Seek",
  description: "Shipping and digital service delivery policy for Ace-Seek SaaS platforms.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-full flex flex-col font-mono bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 space-y-8 max-w-4xl mx-auto">
        <div className="sk-panel p-8 space-y-4 border-[var(--bevel-highlight)]">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well w-10 h-10">
              <Truck className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Compliance Verified
              </span>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Shipping & Delivery Policy
              </h1>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Digital fulfillment policy for Ace-Seek SaaS products and API plan keys.
          </p>
        </div>

        <div className="sk-panel p-8 space-y-6 text-xs leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-2">
              <Zap className="w-4 h-4" /> 1. Digital Service Delivery
            </h2>
            <p>
              Ace-Seek is a purely digital Software-as-a-Service (SaaS) and Cloud API platform. We do not sell or ship physical products or physical goods. Therefore, no physical shipping fees, freight charges, or physical delivery tracking numbers apply.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              2. Delivery Timeline & Confirmation
            </h2>
            <p>
              Upon successful completion of payment via Razorpay and cryptographic HMAC signature verification:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong>Instant Fulfillment:</strong> Your digital API license key is generated instantly and rendered on your checkout confirmation modal.</li>
              <li><strong>Account Activation:</strong> The tier capabilities (Pro, Max, Team) are activated immediately across all Ace-Seek subdomains (www, vlsi, tools).</li>
              <li><strong>Email Receipt:</strong> A digital transaction receipt is dispatched to your registered email address within 5 minutes of payment.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
              3. Delivery Issues & Assistance
            </h2>
            <p>
              If you complete a payment and do not receive your digital API license key on screen or via email within 15 minutes, please check your spam folder or contact our support team with your Razorpay Payment ID:
            </p>
            <div className="sk-recessed p-4 font-mono text-xs space-y-1 text-slate-300">
              <p>• <strong>Support Email:</strong> <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline">support@ace-seek.com</a></p>
              <p>• <strong>Support Phone:</strong> <a href="tel:+918431670673" className="text-[var(--accent-cyan)] underline">+91 84316 70673</a></p>
              <p>• <strong>Registered Office:</strong> #21, 11th main road, 4th G cross, Kamakshipalya, Bangalore - 560079</p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
