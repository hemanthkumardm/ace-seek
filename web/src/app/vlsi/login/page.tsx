import { Suspense } from "react";
import { Cpu } from "lucide-react";
import { SubdomainClerkLogin } from "@/components/SubdomainClerkLogin";

export const metadata = {
  title: "Sign in · vlsi.ace-seek.com",
  description: "Sign in to unlock VLSI studios with your Ace-Seek account plan.",
};

/**
 * Subdomain login — Clerk account on this host.
 * Plan (Free/Pro/Max/Team) comes from the logged-in user, not an API key paste.
 */
export default function VlsiLoginPage() {
  return (
    <div className="m-shell py-10 md:py-16 space-y-8 font-mono max-w-2xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 brutal-badge brutal-badge-cyan">
          <Cpu className="w-3.5 h-3.5" />
          VLSI ACCOUNT LOGIN
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
          <Cpu className="w-8 h-8 text-[var(--brutal-yellow)]" />
          Sign in to continue
        </h1>
        <p className="text-xs md:text-sm text-slate-300 font-bold">
          Free tier unlocks automatically after login. No API key paste required in
          the browser — your plan lives on your account.
        </p>
      </div>
      <Suspense fallback={<div className="text-center text-slate-400 text-xs">Loading…</div>}>
        <SubdomainClerkLogin path="/vlsi/login" defaultRedirect="/vlsi" />
      </Suspense>
      <p className="text-center text-[11px] font-bold text-slate-400">
        <a href="/vlsi" className="underline hover:text-white">
          ← Back to VLSI intro
        </a>
      </p>
    </div>
  );
}
