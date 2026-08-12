"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
} from "lucide-react";
import { SITE_URL } from "@/lib/site";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

type Props = {
  planName: string;
  price: string;
  isOpen: boolean;
  onClose: () => void;
};

export function CheckoutModal({ planName, price, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [purchasedKey, setPurchasedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load Razorpay Standard Checkout Script dynamically
    if (typeof window === "undefined") return;
    if (document.getElementById("razorpay-checkout-script")) return;

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (!isOpen) return null;

  const handleRazorpayCheckout = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Create order on backend
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName.toLowerCase() }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to initialize payment order.");
      }

      const keyId =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_TOnIrR5FKF2D5n";

      if (typeof window.Razorpay === "undefined") {
        throw new Error(
          "Razorpay SDK is loading. Please try clicking pay again in a moment."
        );
      }

      // 2. Configure & open Razorpay Standard Checkout Modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Ace-Seek Platform",
        description: `${planName} Plan License Subscription`,
        image: "https://www.ace-seek.com/icon.svg",
        order_id: orderData.order_id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          setLoading(true);
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planName.toLowerCase(),
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success && verifyData.apiKey) {
              // Store new key in localStorage & notify application
              localStorage.setItem("ace_seek_api_key", verifyData.apiKey);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("ace_key_updated"));
              }
              setPurchasedKey(verifyData.apiKey);
            } else {
              setErrorMessage(
                verifyData.error || "Payment verification failed."
              );
            }
          } catch {
            setErrorMessage("Network error during payment verification.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        prefill: {
          name: "Engineering Team",
          email: "team@ace-seek.com",
        },
        theme: {
          color: "#06b6d4",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp: { error?: { description?: string } }) {
        setErrorMessage(
          resp.error?.description || "Payment failed or was declined."
        );
        setLoading(false);
      });
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!purchasedKey) return;
    navigator.clipboard.writeText(purchasedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-6 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Success Screen after Razorpay Payment Verification */}
        {purchasedKey ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Payment Verified
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {planName} Plan Activated!
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your Razorpay transaction was verified successfully. Your <strong className="text-cyan-400">{planName}</strong> plan API license key is active:
            </p>

            <div className="rounded-xl border border-emerald-500/30 bg-black/80 p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-emerald-400" /> Active API Key
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px] font-mono"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? "COPIED" : "COPY KEY"}
                </button>
              </div>
              <p className="text-xs font-mono text-emerald-300 break-all bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
                {purchasedKey}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-cyan)] px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-cyan-300 transition-all shadow-md"
              >
                <span>Access Workstations Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Razorpay Checkout Prompt */
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Razorpay Standard Checkout
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {planName} Plan — {price}
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Upgrade to the <strong className="text-cyan-400">{planName}</strong> plan using Razorpay secure checkout (Credit/Debit Card, UPI, NetBanking, Wallets).
              </p>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 text-[11px] text-slate-300 space-y-1">
                <span className="font-bold flex items-center gap-1 text-cyan-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Instant License Entitlement
                </span>
                <p className="text-slate-400">
                  Upon payment verification, your workspace unlocks instantly across all product subdomains (<span className="text-cyan-300 font-mono">www, vlsi, tools</span>).
                </p>
              </div>

              <ul className="space-y-2 pt-1 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>HMAC cryptographic signature verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Supports UPI, Cards, NetBanking, and Wallets</span>
                </li>
              </ul>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-rose-950/60 border border-rose-500/50 p-3 text-xs font-bold text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-cyan)] px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-cyan-300 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Order…</span>
                  </>
                ) : (
                  <>
                    <span>Pay with Razorpay ({price})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
