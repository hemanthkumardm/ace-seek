import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";
import { Boxes, Key } from "lucide-react";
import { mainSignupHref, SITE_URL } from "@/lib/site";

export const metadata = {
  title: "API Key Login · tools.ace-seek.com",
  description: "Authorize Tools suite with your Ace-Seek dashboard API key.",
};

export default function ToolsLoginPage() {
  return (
    <div className="m-shell py-10 md:py-16 space-y-8 font-mono max-w-2xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 brutal-badge brutal-badge-lime">
          <Key className="w-3.5 h-3.5" />
          TOOLS API KEY LOGIN
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
          <Boxes className="w-8 h-8 text-[var(--brutal-yellow)]" />
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
      <SubdomainAuthModal subdomainName="TOOLS" compact />
      <p className="text-center text-[11px] font-bold text-slate-400">
        <a href="/tools" className="underline hover:text-white">
          ← Back to Tools intro
        </a>
      </p>
    </div>
  );
}
