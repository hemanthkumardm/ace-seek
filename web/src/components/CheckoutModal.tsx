"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { X, ShieldCheck, CheckCircle2, Loader2, Copy, Check } from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  remember_customer?: boolean;
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

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
}

interface CheckoutModalProps {
  planId: string;
  planName: string;
  price: string;
  isOpen: boolean;
  onClose: () => void;
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

export function CheckoutModal({ planId, planName, price, isOpen, onClose }: CheckoutModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [purchasedKey, setPurchasedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
    } else {
      setErrorMessage(null);
      setPurchasedKey(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
        setErrorMessage("Razorpay SDK failed to load. Please check your network connection.");
        setLoading(false);
        return;
      }

      // 2. Create Razorpay order on server
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const orderData = await res.json();
      const orderId = orderData.orderId || orderData.order_id;
      const keyId = orderData.keyId || orderData.key_id;

      if (!res.ok || !orderId) {
        setErrorMessage(orderData.error || "Failed to create payment order.");
        setLoading(false);
        return;
      }

      // Construct prefill object without default phone numbers
      const prefillObj: { name?: string; email?: string; contact?: string } = {};
      const userFullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
      if (userFullName) prefillObj.name = userFullName;
      if (user?.primaryEmailAddress?.emailAddress) prefillObj.email = user.primaryEmailAddress.emailAddress;
      if (user?.primaryPhoneNumber?.phoneNumber) prefillObj.contact = user.primaryPhoneNumber.phoneNumber;

      const options: RazorpayOptions = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Ace-Seek Technologies",
        description: `Subscription for ${planName} Plan`,
        order_id: orderId,
        remember_customer: false,
        prefill: prefillObj,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success && verifyData.apiKey) {
              localStorage.setItem("ace_seek_api_key", verifyData.apiKey);
              window.dispatchEvent(new Event("ace_key_updated"));
              setPurchasedKey(verifyData.apiKey);
            } else {
              setErrorMessage(verifyData.error || "Payment verification failed.");
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
        theme: {
          color: "#06b6d4",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp: { error?: { description?: string } }) {
        setErrorMessage(resp.error?.description || "Payment failed or was declined.");
        setLoading(false);
      });
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!purchasedKey) return;
    navigator.clipboard.writeText(purchasedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {purchasedKey ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Payment Successful!</h3>
              <p className="text-xs text-slate-400">
                Your <span className="text-cyan-400 font-bold">{planName} Plan</span> key has been generated and dispatched to your email.
              </p>
            </div>

            <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Your New Pro API License Key:
              </span>
              <div className="font-mono text-xs text-cyan-300 font-bold break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {purchasedKey}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopyKey}
                className="sk-btn sk-btn-primary flex-1 justify-center !py-2.5 !text-xs"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied Key</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Key</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="sk-btn sk-btn-ghost flex-1 justify-center !py-2.5 !text-xs"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Razorpay Secure Checkout
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                Upgrade to {planName}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock 500 converts/day, exact PDF&rarr;DOCX, and full VLSI Studio features.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">TOTAL DUE:</span>
              <span className="text-xl font-black text-white">{price}</span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 font-mono">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="sk-btn sk-btn-primary w-full justify-center !py-3 font-bold !text-xs tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Payment Gateway...</span>
                  </>
                ) : (
                  <span>Proceed to Pay {price} &rarr;</span>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 font-mono">
                Encrypted 256-bit SSL transaction via Razorpay Gateway.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
