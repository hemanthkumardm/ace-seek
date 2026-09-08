import { Suspense } from "react";
import { Boxes } from "lucide-react";
import { SubdomainClerkLogin } from "@/components/SubdomainClerkLogin";

export const metadata = {
  title: "Sign in · tools.ace-seek.com",
  description: "Sign in to unlock Ace-Seek tools with your account plan.",
};

export default function ToolsLoginPage() {
  return (
    <div className="m-shell py-10 md:py-16 space-y-8 font-mono max-w-2xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 brutal-badge brutal-badge-lime">
          <Boxes className="w-3.5 h-3.5" />
          TOOLS ACCOUNT LOGIN
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
          <Boxes className="w-8 h-8 text-[var(--brutal-yellow)]" />
          Sign in to continue
        </h1>
        <p className="text-xs md:text-sm text-slate-300 font-bold">
          Sign in with your Ace-Seek account to access the tools suite.
        </p>
      </div>
      <Suspense fallback={<div className="text-center text-slate-400 text-xs">Loading…</div>}>
        <SubdomainClerkLogin path="/tools/login" defaultRedirect="/tools" />
      </Suspense>
      <p className="text-center text-[11px] font-bold text-slate-400">
        <a href="/tools" className="underline hover:text-white">
          ← Back to Tools intro
        </a>
      </p>
    </div>
  );
}
