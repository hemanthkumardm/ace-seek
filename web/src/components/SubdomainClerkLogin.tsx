"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { isClerkConfiguredClient } from "@/lib/clerk-config-client";
import { SITE_URL } from "@/lib/site";

type Props = {
  /** Path mode login route, e.g. /login or /vlsi/login */
  path?: string;
  /** Fallback after sign-in when no ?redirect= */
  defaultRedirect?: string;
};

/**
 * Clerk sign-in / sign-up embed for product hosts (vlsi / tools / openroad / apex).
 * Redirect stays on the current host when possible.
 */
export function SubdomainClerkLogin({
  path = "/login",
  defaultRedirect = "/",
}: Props) {
  const params = useSearchParams();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const configured = isClerkConfiguredClient();

  const redirectUrl = useMemo(() => {
    const raw = params.get("redirect") || params.get("redirect_url");
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return defaultRedirect;
  }, [params, defaultRedirect]);

  if (!configured) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-100 space-y-2">
        <p className="font-bold">Clerk is not configured in this environment.</p>
        <p>
          Set <code className="text-amber-200">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="text-amber-200">CLERK_SECRET_KEY</code>, then add this host under
          Clerk Domains. Meanwhile use{" "}
          <a href={`${SITE_URL}/login`} className="underline text-white">
            {SITE_URL.replace(/^https?:\/\//, "")}/login
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex gap-2 text-[11px] font-mono font-bold">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
            mode === "sign-in"
              ? "bg-cyan-500 text-slate-950 border-cyan-400"
              : "bg-slate-900 text-slate-300 border-slate-700"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
            mode === "sign-up"
              ? "bg-cyan-500 text-slate-950 border-cyan-400"
              : "bg-slate-900 text-slate-300 border-slate-700"
          }`}
        >
          Create account
        </button>
      </div>

      {mode === "sign-in" ? (
        <SignIn
          routing="hash"
          forceRedirectUrl={redirectUrl}
          fallbackRedirectUrl={redirectUrl}
          signUpUrl="#sign-up"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-none border-2 border-black bg-slate-950",
            },
          }}
        />
      ) : (
        <SignUp
          routing="hash"
          forceRedirectUrl={redirectUrl}
          fallbackRedirectUrl={redirectUrl}
          signInUrl="#sign-in"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-none border-2 border-black bg-slate-950",
            },
          }}
        />
      )}


    </div>
  );
}
