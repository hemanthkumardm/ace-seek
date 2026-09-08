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

/** Dark theme matching VLSI / Tools carbon shells */
const clerkDarkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: "#22d3ee",
    colorBackground: "#0f172a",
    colorInputBackground: "#020617",
    colorInputText: "#f8fafc",
    colorText: "#e2e8f0",
    colorTextSecondary: "#94a3b8",
    colorDanger: "#f87171",
    colorSuccess: "#34d399",
    colorNeutral: "#94a3b8",
    borderRadius: "0.75rem",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  elements: {
    rootBox: "mx-auto w-full max-w-md",
    card: "shadow-none border border-slate-700 bg-slate-950 !text-slate-100",
    headerTitle: "!text-white font-black",
    headerSubtitle: "!text-slate-400",
    socialButtonsBlockButton:
      "!bg-slate-900 !border !border-slate-700 !text-slate-100 hover:!bg-slate-800",
    socialButtonsBlockButtonText: "!text-slate-100",
    dividerLine: "!bg-slate-700",
    dividerText: "!text-slate-500",
    formFieldLabel: "!text-slate-300",
    formFieldInput:
      "!bg-slate-950 !border !border-slate-700 !text-white placeholder:!text-slate-500 focus:!border-cyan-400",
    formButtonPrimary:
      "!bg-cyan-400 !text-slate-950 hover:!bg-cyan-300 !font-bold !shadow-none",
    footerActionLink: "!text-cyan-400 hover:!text-cyan-300",
    footerActionText: "!text-slate-400",
    identityPreviewText: "!text-slate-200",
    identityPreviewEditButton: "!text-cyan-400",
    formFieldInputShowPasswordButton: "!text-slate-400",
    alertText: "!text-slate-200",
    formFieldErrorText: "!text-rose-400",
  },
} as const;

function safeRedirect(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  // Never bounce back onto auth pages (fixes ?redirect=/login loops)
  if (
    raw === "/login" ||
    raw.endsWith("/login") ||
    raw.startsWith("/signup") ||
    raw.includes("/login?")
  ) {
    return fallback;
  }
  return raw;
}

/**
 * Clerk sign-in / sign-up embed for product hosts (vlsi / tools / openroad / apex).
 * Dark-themed to match Ace-Seek product shells.
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
    return safeRedirect(raw, defaultRedirect);
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
    <div className="w-full flex flex-col items-center gap-4" data-clerk-dark>
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

      <div className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 p-2 sm:p-3">
        {mode === "sign-in" ? (
          <SignIn
            routing="hash"
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl={redirectUrl}
            signUpUrl="#sign-up"
            appearance={clerkDarkAppearance}
          />
        ) : (
          <SignUp
            routing="hash"
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl={redirectUrl}
            signInUrl="#sign-in"
            appearance={clerkDarkAppearance}
          />
        )}
      </div>
    </div>
  );
}
