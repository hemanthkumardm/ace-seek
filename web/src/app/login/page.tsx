"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { LogIn, Mail, Lock, Cpu, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      // Success: redirect to dashboard
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
    <div className="min-h-full flex flex-col">
      <SiteHeader />

      <main className="flex-1 m-shell py-16 md:py-24 flex justify-center items-center">
        <div className="w-full max-w-md">
          <div className="sk-panel p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="sk-icon-well mx-auto w-12 h-12 rounded-xl">
                <Cpu className="w-6 h-6 text-[var(--accent-cyan)]" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Terminal Authentication</h1>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Log in to access your user dashboard and API license keys.
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
                  placeholder="engineer@company.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Authenticate Session</span>
                  </>
                )}
              </button>
            </form>

            <div className="sk-recessed p-3 text-[11px] text-[var(--muted)] font-mono space-y-1">
              <p className="text-[var(--foreground)] font-bold">Demo Login Credentials:</p>
              <p>Email: <code>engineer@company.com</code></p>
              <p>Password: <code>password123</code></p>
            </div>

            <div className="pt-2 border-t border-[var(--bevel-shadow)] text-center text-xs text-[var(--muted)]">
              <span>Don&apos;t have an engineering identity? </span>
              <a
                href="/signup"
                className="text-[var(--accent-cyan)] font-semibold hover:underline"
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
