import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";
import { Cpu, Key } from "lucide-react";
import { mainSignupHref, SITE_URL } from "@/lib/site";

export const metadata = {
  title: "API Key Login · vlsi.ace-seek.com",
  description: "Authorize VLSI studios with your Ace-Seek dashboard API key.",
};

/**
 * Subdomain login — API key only. Signup lives on ace-seek.com.
 * On host vlsi.ace-seek.com this is /login (rewritten from /vlsi/login).
 */
export default function VlsiLoginPage() {
  return (
    <div className="m-shell py-10 md:py-16 space-y-8 font-mono max-w-2xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 brutal-badge brutal-badge-cyan">
          <Key className="w-3.5 h-3.5" />
          VLSI API KEY LOGIN
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
          <Cpu className="w-8 h-8 text-[var(--brutal-yellow)]" />
          Enter workstation
        </h1>
        <p className="text-xs md:text-sm text-slate-300 font-bold">
          Paste the API key from{" "}
          <a href={SITE_URL} className="text-[var(--brutal-cyan)] underline">
            ace-seek.com
          </a>{" "}
          dashboard. New accounts:{" "}
          <a href={mainSignupHref()} className="text-[var(--brutal-yellow)] underline">
            sign up on main site only
          </a>
          .
        </p>
      </div>
      <SubdomainAuthModal subdomainName="VLSI" compact />
      <p className="text-center text-[11px] font-bold text-slate-400">
        <a href="/vlsi" className="underline hover:text-white">
          ← Back to VLSI intro
        </a>
      </p>
    </div>
  );
}
