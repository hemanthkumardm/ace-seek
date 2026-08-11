"use client";

import { SignUp } from "@clerk/nextjs";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Cpu } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 md:py-20 flex flex-col items-center gap-6">
        <div className="text-center space-y-2 max-w-md">
          <div className="sk-icon-well mx-auto w-12 h-12 rounded-xl">
            <Cpu className="w-6 h-6 text-[var(--accent-cyan)]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Create account</h1>
          <p className="text-xs text-[var(--muted)]">
            Free Hobby Clerk auth — works across devices.
          </p>
        </div>
        <div className="w-full max-w-md flex justify-center">
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            forceRedirectUrl="/dashboard"
            fallbackRedirectUrl="/dashboard"
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
