"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Cpu, Sparkles, Building2, ArrowRight } from "lucide-react";

function SignupContent() {
  const searchParams = useSearchParams();
  const isGrant = searchParams.get("grant") === "1";
  const requestedPlan = searchParams.get("plan");
  const isTeamGrant = isGrant || requestedPlan === "team";

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 md:py-20 flex flex-col items-center gap-6">
        {isTeamGrant && (
          <div className="w-full max-w-md bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-5 text-xs space-y-2 text-cyan-200 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm">
              <Building2 className="w-4 h-4 text-[var(--accent-cyan)]" />
              <span>Startup & Academic Grant — Team Tier</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Applying for sponsored Team access? Create your account below to register your engineer profile.
            </p>
            <div className="pt-2 border-t border-cyan-800/40 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Already have an account?</span>
              <a
                href="/trial?grant=1&plan=team"
                className="font-bold text-[var(--accent-cyan)] hover:underline inline-flex items-center gap-1"
              >
                Submit Grant Application <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        <div className="text-center space-y-2 max-w-md">
          <div className="sk-icon-well mx-auto w-12 h-12 rounded-xl">
            {isTeamGrant ? (
              <Sparkles className="w-6 h-6 text-[var(--accent-cyan)]" />
            ) : (
              <Cpu className="w-6 h-6 text-[var(--accent-cyan)]" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isTeamGrant ? "Create Grant Candidate Account" : "Create account"}
          </h1>
          <p className="text-xs text-[var(--muted)]">
            New accounts start on Free. Max is a 7-day trial —{" "}
            <a href="/trial" className="text-[var(--accent-cyan)] hover:underline">
              request access
            </a>
            , we verify, then unlock Max on your account.
          </p>
        </div>

        <div className="w-full max-w-md flex justify-center">
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            forceRedirectUrl={isTeamGrant ? "/trial?grant=1&plan=team" : "/dashboard"}
            fallbackRedirectUrl={isTeamGrant ? "/trial?grant=1&plan=team" : "/dashboard"}
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-none border-2 border-black",
              },
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full flex flex-col items-center justify-center p-12">
          <Cpu className="w-8 h-8 animate-pulse text-[var(--accent-cyan)]" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
