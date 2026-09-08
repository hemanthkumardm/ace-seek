"use client";

import React, { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  Megaphone,
  Users,
  Eye,
  Target,
  Send,
  CheckCircle2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const PACKAGES = [
  {
    title: "Product host banner",
    price: "Custom quote",
    blurb:
      "Placement on VLSI, Tools, or OpenROAD product shells — seen by engineers while they work.",
    points: [
      "Targeted placement on product headers or catalog cards",
      "Monthly reporting on impressions (when tracking is enabled)",
    ],
  },
  {
    title: "Sponsored technical post",
    price: "Custom quote",
    blurb:
      "Co-branded case study or workflow article on ace-seek.com for EDA / semiconductor audiences.",
    points: [
      "SEO-friendly technical content on your keywords",
      "Permanent link to your product or docs site",
    ],
  },
];

export default function AdvertisePage() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Ace-Seek advertising inquiry — ${company || "Company"}`);
    const body = encodeURIComponent(
      `Company: ${company}\nEmail: ${email}\n\nMessage:\n${message || "(none)"}\n`
    );
    window.location.href = `mailto:advertise@ace-seek.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="advertise" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-12">
        <div className="sk-panel p-8 md:p-12 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <Megaphone className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Advertise
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Reach semiconductor & EDA engineers
          </h1>

          <p className="text-xs md:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Put your IP, tools, or cloud platform in front of people actively using SDC, STA,
            PnR, and documentation workflows on Ace-Seek.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="sk-panel p-6 space-y-3 text-center">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Users className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <p className="text-lg font-black font-mono text-[var(--foreground)]">
              VLSI · Tools · OpenROAD
            </p>
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Product hosts</p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Placement where engineers already work — not generic banner networks.
            </p>
          </div>

          <div className="sk-panel p-6 space-y-3 text-center">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Eye className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <p className="text-lg font-black font-mono text-[var(--foreground)]">
              High intent
            </p>
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Technical audience</p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Readers seeking timing closure, constraints, synthesis, and doc tooling.
            </p>
          </div>

          <div className="sk-panel p-6 space-y-3 text-center">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Target className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <p className="text-lg font-black font-mono text-[var(--foreground)]">
              Custom packages
            </p>
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Flexible</p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Banners, sponsored posts, or co-branded Learn / Interview placements.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight border-b border-[var(--bevel-shadow)] pb-3">
            Packages
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {PACKAGES.map((pkg) => (
              <div key={pkg.title} className="sk-panel p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold">{pkg.title}</h3>
                  <span className="sk-badge sk-badge-live shrink-0">{pkg.price}</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{pkg.blurb}</p>
                <ul className="space-y-2 text-xs text-[var(--muted)]">
                  {pkg.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="sk-panel p-8 space-y-6 max-w-xl mx-auto">
          <div className="text-center space-y-2">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Send className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <h3 className="text-lg font-bold">Request a media kit</h3>
            <p className="text-xs text-[var(--muted)]">
              Opens your email client to{" "}
              <span className="font-mono text-[var(--accent-cyan)]">advertise@ace-seek.com</span>
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-[var(--muted)]">
                If your mail app opened, send the draft and we&apos;ll reply with rates and
                availability.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="sk-btn sk-btn-ghost !text-xs"
              >
                Send another
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[var(--muted)]">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Cadence, Synopsys, Ansys"
                  className="sk-input w-full"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[var(--muted)]">
                  Work email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marketing@company.com"
                  className="sk-input w-full"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[var(--muted)]">
                  What are you looking for? (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Banner on VLSI, sponsored post, Interview sponsorship…"
                  className="sk-input w-full min-h-[88px] resize-y"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="sk-btn sk-btn-primary !text-xs w-full justify-center !py-2.5"
              >
                <span>Request media kit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
