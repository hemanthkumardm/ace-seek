"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { UserPlus, Mail, User, Lock, Cpu, AlertCircle, Loader2 } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "free";
  const planLabel = plan === "pro" ? "Pro" : plan === "team" ? "Team" : "Free Tier";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, plan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="sk-panel p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="sk-icon-well mx-auto w-12 h-12 rounded-xl">
            <Cpu className="w-6 h-6 text-[var(--accent-cyan)]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Create Account</h1>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Selected tier:{" "}
            <span className="text-[var(--accent-cyan)] font-mono font-bold uppercase">
              {planLabel}
            </span>
          </p>
        </div>

        {error && (
          <div className="sk-recessed p-3 flex items-center gap-2 text-xs text-red-400 border-red-900/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>Work Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="sk-input w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hardware Engineer"
              className="sk-input w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="sk-input w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="sk-btn sk-btn-primary !text-xs w-full justify-center !py-2.5 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Account & Generating Key...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Initialize Identity & Generate Key</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[var(--bevel-shadow)] text-center text-xs text-[var(--muted)]">
          <span>Already registered? </span>
          <a
            href="/login"
            className="text-[var(--accent-cyan)] font-semibold hover:underline"
          >
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />

      <main className="flex-1 m-shell py-16 md:py-24 flex justify-center items-center">
        <Suspense fallback={<div className="sk-lcd p-6 font-mono text-xs">Loading form...</div>}>
          <SignupForm />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
