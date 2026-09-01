import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ShieldCheck, Mail, Phone, MapPin, Building, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Ace-Seek",
  description: "Contact information, support email, phone number, and registered address for Ace-Seek.",
};

export default function ContactUsPage() {
  return (
    <div className="min-h-full flex flex-col font-mono bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main className="flex-1 m-shell py-12 space-y-8 max-w-4xl mx-auto">
        <div className="sk-panel p-8 space-y-4 border-[var(--bevel-highlight)]">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well w-10 h-10">
              <Mail className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Compliance Verified
              </span>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Contact Us
              </h1>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Official contact channels and registered business details for Ace-Seek.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 font-mono">
          <div className="sk-panel p-6 space-y-4">
            <h2 className="text-sm font-bold text-[var(--accent-cyan)] uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4" /> Merchant & Legal Entity
            </h2>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Legal Name:</strong> Ace-Seek Technologies (Ace-Seek Inc.)
              </p>
              <p>
                <strong className="text-white">Business Type:</strong> Software-as-a-Service (SaaS) & EDA Tools Platform
              </p>
              <p>
                <strong className="text-white">Operating Portal:</strong> www.ace-seek.com
              </p>
            </div>
          </div>

          <div className="sk-panel p-6 space-y-4">
            <h2 className="text-sm font-bold text-[var(--accent-cyan)] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Support Hours
            </h2>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Operating Days:</strong> Monday to Saturday
              </p>
              <p>
                <strong className="text-white">Working Hours:</strong> 09:00 AM to 07:00 PM IST
              </p>
              <p>
                <strong className="text-white">Response Time:</strong> Within 24 business hours
              </p>
            </div>
          </div>
        </div>

        <div className="sk-panel p-8 space-y-6 text-xs text-slate-300">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[var(--accent-cyan)]">
            Communication Channels
          </h2>

          <div className="grid gap-6 sm:grid-cols-3 font-mono">
            <div className="sk-recessed p-4 space-y-2">
              <Mail className="w-5 h-5 text-[var(--accent-cyan)]" />
              <span className="font-bold text-white text-xs block">Email Support</span>
              <a href="mailto:support@ace-seek.com" className="text-[var(--accent-cyan)] underline text-[11px] block break-all">
                support@ace-seek.com
              </a>
            </div>

            <div className="sk-recessed p-4 space-y-2">
              <Phone className="w-5 h-5 text-[var(--accent-cyan)]" />
              <span className="font-bold text-white text-xs block">Phone Support</span>
              <a href="tel:+918431670673" className="text-[var(--accent-cyan)] underline text-[11px] block">
                +91 84316 70673
              </a>
            </div>

            <div className="sk-recessed p-4 space-y-2">
              <MapPin className="w-5 h-5 text-[var(--accent-cyan)]" />
              <span className="font-bold text-white text-xs block">Registered Address</span>
              <p className="text-slate-400 text-[11px]">
                #21, 11th main road, 4th G cross, Kamakshipalya, Bangalore - 560079
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
