"use client";

import React from "react";
import { CreditCard, Sparkles, X, Mail, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { SITE_URL } from "@/lib/site";

type Props = {
  planName: string;
  price: string;
  isOpen: boolean;
  onClose: () => void;
};

export function CheckoutModal({ planName, price, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const hasStripe = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  const handleCheckout = () => {
    if (hasStripe) {
      // Redirect to Stripe checkout route
      window.location.href = `/api/billing/checkout?plan=${planName.toLowerCase()}`;
    } else {
      // Redirect to signup with plan metadata
      window.location.href = `${SITE_URL}/signup?plan=${planName.toLowerCase()}&activated=early_access`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-6 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Plan Activation
            </span>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              {planName} Plan — {price}
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            You are activating the <strong className="text-cyan-400">{planName}</strong> plan for your Ace-Seek account.
          </p>

          {!hasStripe && (
            <div className="rounded-lg bg-slate-900/80 border border-amber-500/30 p-3 text-[11px] text-amber-300 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Early Access Activation Mode
              </span>
              <p className="text-slate-400">
                Self-serve Stripe card checkout is in preview. Account activation grants full access via your Dashboard API key.
              </p>
            </div>
          )}

          <ul className="space-y-2 pt-1 text-[11px] text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Includes full access to VLSI & Tools product subdomains</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Instant API key issuance upon sign-up</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCheckout}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-cyan)] px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-cyan-300 transition-all shadow-md"
          >
            <span>{hasStripe ? "Proceed to Stripe Checkout" : "Continue to Free Account Setup"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <a
            href="mailto:support@ace-seek.com?subject=Enterprise%20Billing%20Inquiry"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 hover:bg-slate-700 transition-all"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Contact Sales</span>
          </a>
        </div>
      </div>
    </div>
  );
}
