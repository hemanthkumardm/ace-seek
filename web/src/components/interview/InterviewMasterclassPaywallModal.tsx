"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  CreditCard,
  Building2,
  GraduationCap,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  INTERVIEW_BUNDLE_PRICING,
  COMPANIES_METADATA,
} from "@/lib/vlsi-interview-masterclass-data";
import { unlockMasterclass } from "@/lib/interview-access-service";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function InterviewMasterclassPaywallModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useUser();
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unlockedSuccess, setUnlockedSuccess] = useState(false);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmailInput(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      setErrorMessage(null);
      setUnlockedSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
        setErrorMessage("Razorpay payment gateway failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // 1. Create order on server
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "interview_bundle",
          amount: 2499,
          email: emailInput || user?.primaryEmailAddress?.emailAddress,
          userId: user?.id,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        setErrorMessage(orderData.error || "Failed to create payment order.");
        setLoading(false);
        return;
      }

      const orderId = orderData.orderId;
      const keyId = orderData.keyId;

      // 2. Configure and open Razorpay popup
      const options: RazorpayOptions = {
        key: keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "Ace-Seek Semiconductor",
        description: "VLSI Interview Masterclass (Lifetime Access)",
        order_id: orderId,
        prefill: {
          name: user?.fullName || "Semiconductor Engineer",
          email: emailInput || user?.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "#f59e0b", // Amber gold
        },
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: "interview_bundle",
                userId: user?.id,
                email: emailInput || user?.primaryEmailAddress?.emailAddress,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              unlockMasterclass(
                response.razorpay_payment_id,
                emailInput || user?.primaryEmailAddress?.emailAddress || verifyData.email,
                typeof verifyData.apiKey === "string" ? verifyData.apiKey : undefined
              );
              setUnlockedSuccess(true);
              if (onSuccess) onSuccess();
            } else {
              setErrorMessage(verifyData.error || "Signature verification failed.");
            }
          } catch {
            setErrorMessage("Failed to verify payment with server.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const Rzp = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void } }).Razorpay;
      const rzp = new Rzp(options);
      rzp.on("payment.failed", (resp) => {
        setErrorMessage(resp.error?.description || "Payment failed. Please try another card or UPI.");
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Payment initialization failed.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0a0f1d] border-2 border-amber-400/50 shadow-2xl p-6 md:p-8 space-y-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {unlockedSuccess ? (
          /* SUCCESS CELEBRATION STATE */
          <div className="text-center py-6 space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider">
                Payment Verified · Access Activated
              </span>
              <h3 className="text-2xl font-black text-white">
                Masterclass Lifetime Access Unlocked! 🎉
              </h3>
            </div>

            <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              All technical domains (Logic Synthesis &amp; SDC, CDC &amp; Metastability, Static Timing, Physical Design), full KaTeX step-by-step derivations, Tcl scripts, and onsite follow-up questions are now permanently unlocked for you.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-mono font-black text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/50 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explore All Solutions Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* CHECKOUT VIEW */
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-black bg-amber-400 text-slate-950">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{INTERVIEW_BUNDLE_PRICING.badge}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                Unlock Complete Interview Prep Masterclass
              </h2>
              <p className="text-xs md:text-sm text-slate-300">
                One-time payment for lifetime access across all technical domain interview tracks.
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-400/40 flex items-baseline justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 line-through mr-2 font-mono">
                  {INTERVIEW_BUNDLE_PRICING.originalPrice}
                </span>
                <span className="text-2xl md:text-3xl font-black text-amber-300 font-mono">
                  {INTERVIEW_BUNDLE_PRICING.offerPrice}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ one-time</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300">
                (or {INTERVIEW_BUNDLE_PRICING.offerPriceUsd} USD)
              </span>
            </div>

            {/* Value Highlights */}
            <div className="space-y-2 text-xs">
              <span className="font-mono font-bold uppercase text-slate-400 text-[11px] block">
                Everything Included in Lifetime Access:
              </span>
              <ul className="space-y-2">
                {[
                  "Complete Mathematical Derivations rendered with KaTeX (STA, Power, BER, Math)",
                  "Logic Synthesis & SDC Mastery (Genus 10+ Year Interview Playbook, syn_generic/map/opt)",
                  "Clock Domain Crossing (CDC) & Metastability (MTBF, Pulse Sync, Async FIFO Gray Pointers)",
                  "Production Tcl scripts and diagnostic check_design checklists",
                  "Common Interview Traps & Pitfalls + Onsite Follow-Up Questions",
                  "Lifetime Access with Free Future Domain & Question Additions",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-slate-300 block">
                Receipt &amp; Account Email:
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500 text-rose-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* CTA Pay Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-mono font-black text-xs md:text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Gateway…</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹2,499 &amp; Unlock Lifetime Access</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-bit Encrypted</span>
                </span>
                <span>•</span>
                <span>UPI, Cards, NetBanking, Int'l</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
