"use client";

import React, { useEffect, useState } from "react";
import { Heart, Loader2, X, CheckCircle2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type RzpInstance = {
  open: () => void;
  on: (
    event: string,
    cb: (r: { error?: { description?: string } }) => void
  ) => void;
};

function getRazorpayCtor():
  | (new (options: Record<string, unknown>) => RzpInstance)
  | undefined {
  return (window as unknown as { Razorpay?: new (o: Record<string, unknown>) => RzpInstance })
    .Razorpay;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && getRazorpayCtor()) {
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

/** Footer donate — button label has no amount; modal collects INR (≥ ₹1). */
export function DonateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
      >
        <Heart className="w-3.5 h-3.5" />
        Donate
      </button>
      {open ? <DonateModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function DonateModal({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void loadRazorpayScript();
  }, []);

  const pay = async () => {
    const amountInRupees = Math.round(Number(amountStr) * 100) / 100;
    if (!Number.isFinite(amountInRupees) || amountInRupees < 1) {
      setError("Please enter a valid contribution of at least ₹1.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const okSdk = await loadRazorpayScript();
      const RazorpayCtor = getRazorpayCtor();
      if (!okSdk || !RazorpayCtor) {
        throw new Error("Payment system could not load. Try again.");
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: "donate",
          amount: amountInRupees,
        }),
      });
      const orderData = await res.json();
      if (!res.ok || !(orderData.orderId || orderData.order_id)) {
        throw new Error(orderData.error || "Could not start donation.");
      }

      const orderId = orderData.orderId || orderData.order_id;
      const keyId = orderData.keyId || orderData.key_id;
      const amountLabel = `₹${amountInRupees.toLocaleString("en-IN")}`;

      const prefill: { name?: string; email?: string; contact?: string } = {};
      if (user) {
        const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
        if (full) prefill.name = full;
        if (user.primaryEmailAddress?.emailAddress) {
          prefill.email = user.primaryEmailAddress.emailAddress;
        }
        if (user.primaryPhoneNumber?.phoneNumber) {
          prefill.contact = user.primaryPhoneNumber.phoneNumber;
        }
      }

      const rzp = new RazorpayCtor({
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Ace-Seek",
        description: `Ace-Seek donation · ${amountLabel}`,
        order_id: orderId,
        prefill,
        theme: { color: "#f43f5e" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId: "donate",
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              setError(verifyData.error || "Donation verification failed.");
              setLoading(false);
              return;
            }
            setDone(true);
          } catch {
            setError("Network error while confirming donation.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", (resp) => {
        setError(resp.error?.description || "Donation was declined.");
        setLoading(false);
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Donation failed.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl p-6 space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Thank you</h3>
              <p className="text-sm text-slate-400 mt-1">
                Your support helps keep Ace-Seek building for VLSI engineers.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 pr-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Support Ace-Seek</h3>
                <p className="text-xs text-slate-400">
                  Optional contribution — choose any amount that works for you.
                </p>
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Your contribution (INR)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                step={1}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </label>

            {error && (
              <p className="text-xs font-semibold text-rose-400">{error}</p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => void pay()}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Working…
                </>
              ) : (
                "Continue"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
