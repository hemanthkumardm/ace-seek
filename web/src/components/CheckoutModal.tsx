"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Cpu,
} from "lucide-react";

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
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: string,
    callback: (response: { error?: { description?: string } }) => void
  ) => void;
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
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
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

export function CheckoutModal({
  planId,
  planName,
  price,
  isOpen,
  onClose,
}: CheckoutModalProps) {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activatedPlan, setActivatedPlan] = useState<string | null>(null);
  const [renewsAt, setRenewsAt] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
    } else {
      setErrorMessage(null);
      setActivatedPlan(null);
      setRenewsAt(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    try {
      if (!user) {
        setErrorMessage("Sign in required before checkout.");
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const isLoadedSdk = await loadRazorpayScript();
      if (!isLoadedSdk || typeof window === "undefined" || !window.Razorpay) {
        setErrorMessage(
          "Razorpay SDK failed to load. Please check your network connection."
        );
        setLoading(false);
        return;
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      const orderData = await res.json();
      if (res.status === 401) {
        setErrorMessage("Session expired. Please sign in again, then retry.");
        setLoading(false);
        return;
      }

      const orderId = orderData.orderId || orderData.order_id;
      const keyId = orderData.keyId || orderData.key_id;

      if (!res.ok || !orderId) {
        setErrorMessage(orderData.error || "Failed to create payment order.");
        setLoading(false);
        return;
      }

      const prefillObj: { name?: string; email?: string; contact?: string } = {};
      const userFullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      if (userFullName) prefillObj.name = userFullName;
      if (user.primaryEmailAddress?.emailAddress) {
        prefillObj.email = user.primaryEmailAddress.emailAddress;
      }
      if (user.primaryPhoneNumber?.phoneNumber) {
        prefillObj.contact = user.primaryPhoneNumber.phoneNumber;
      }

      const options: RazorpayOptions = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Ace-Seek Technologies",
        description: `Subscription — ${planName}`,
        order_id: orderId,
        remember_customer: false,
        prefill: prefillObj,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              try {
                await user.reload();
              } catch {
                /* ignore */
              }
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("ace_seek_auth_updated"));
              }
              setActivatedPlan(String(verifyData.plan || planId).toUpperCase());
              setRenewsAt(
                typeof verifyData.planRenewsAt === "string"
                  ? verifyData.planRenewsAt
                  : null
              );
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
        theme: { color: "#06b6d4" },
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

  const signedIn = Boolean(isLoaded && user);

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

        {activatedPlan ? (
          <div className="space-y-6 text-center py-2">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">You&apos;re on {activatedPlan}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your subscription is active. Open VLSI, Tools, or OpenROAD to get
                started.
              </p>
              {renewsAt && (
                <p className="text-[11px] font-mono text-cyan-300/90">
                  Renews / period end:{" "}
                  {new Date(renewsAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="sk-btn sk-btn-primary w-full justify-center !py-2.5 !text-xs inline-flex items-center gap-2"
                onClick={onClose}
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
              <a
                href="https://vlsi.ace-seek.com"
                className="sk-btn sk-btn-ghost w-full justify-center !py-2.5 !text-xs inline-flex items-center gap-2"
              >
                <Cpu className="w-4 h-4" />
                Open VLSI
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : !signedIn ? (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Sign in required
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                Log in to buy {planName}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your subscription is linked to your Ace-Seek account after payment.
              </p>
            </div>
            <Link
              href={`/login?redirect=${encodeURIComponent("/pricing")}`}
              className="sk-btn sk-btn-primary w-full justify-center !py-3 font-bold !text-xs"
            >
              Sign in to continue
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Secure checkout
                </span>
              </div>
              <h3 className="text-xl font-black text-white">Upgrade to {planName}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Charged to{" "}
                <span className="text-slate-200 font-mono">
                  {user?.primaryEmailAddress?.emailAddress || "your account"}
                </span>
                . Plan activates on this account instantly after payment.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">TOTAL DUE</span>
              <span className="text-xl font-black text-white">{price}</span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 font-mono">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="sk-btn sk-btn-primary w-full justify-center !py-3 font-bold !text-xs tracking-wider disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>Pay with Razorpay</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
