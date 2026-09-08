import { Suspense } from "react";
import { Route } from "lucide-react";
import { SubdomainClerkLogin } from "@/components/SubdomainClerkLogin";

export const metadata = {
  title: "Sign in · openroad.ace-seek.com",
  description: "Sign in to unlock OpenROAD studio with your Ace-Seek account.",
};

export default function OpenroadLoginPage() {
  return (
    <div className="m-shell py-10 md:py-16 space-y-8 font-mono max-w-2xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 brutal-badge brutal-badge-cyan">
          <Route className="w-3.5 h-3.5" />
          OPENROAD ACCOUNT LOGIN
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
          Sign in to continue
        </h1>
        <p className="text-xs md:text-sm text-slate-300 font-bold">
          Sign in with your Ace-Seek account to access OpenROAD studio.
        </p>
      </div>
      <Suspense fallback={<div className="text-center text-slate-400 text-xs">Loading…</div>}>
        <SubdomainClerkLogin path="/openroad/login" defaultRedirect="/openroad" />
      </Suspense>
      <p className="text-center text-[11px] font-bold text-slate-400">
        <a href="/openroad" className="underline hover:text-white">
          ← Back to OpenROAD intro
        </a>
      </p>
    </div>
  );
}
