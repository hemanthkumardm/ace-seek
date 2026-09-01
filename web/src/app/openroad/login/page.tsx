import type { Metadata } from "next";
import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";

export const metadata: Metadata = {
  title: "API Key Login · openroad.ace-seek.com",
  description: "Authorize OpenROAD PnR with your Ace-Seek API key.",
};

export default function OpenroadLoginPage() {
  return (
    <div className="m-shell py-12 max-w-xl mx-auto">
      <div className="mb-6 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
          openroad.ace-seek.com
        </p>
        <h1 className="text-2xl font-black uppercase text-slate-900">
          API Key Login
        </h1>
        <p className="text-xs text-slate-600 font-bold">
          Signup and keys are on www.ace-seek.com — paste your key here to use
          Project · Scripts · Run.
        </p>
      </div>
      <SubdomainAuthModal subdomainName="OPENROAD" compact />
    </div>
  );
}
