"use client";

import React, { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  KeyRound,
  GraduationCap,
  Building2,
  Mail,
  User,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";

const QUALIFICATIONS = [
  "Undergraduate (B.E. / B.Tech / B.Sc)",
  "Master's (M.E. / M.Tech / M.Sc)",
  "PhD / Research scholar",
  "Faculty / Professor",
  "Working professional",
  "Other",
];

const AFFILIATIONS: { id: string; label: string }[] = [
  { id: "student", label: "College student" },
  { id: "faculty", label: "Faculty" },
  { id: "researcher", label: "University researcher" },
  { id: "professional", label: "Company / industry" },
  { id: "other", label: "Other" },
];

const PUBLIC_MAIL =
  /@(gmail|googlemail|yahoo|outlook|hotmail|live|icloud|proton|aol|gmx|yandex|rediffmail|mail)\./i;

export default function TrialRequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [mailError, setMailError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    qualification: QUALIFICATIONS[0],
    organization: "",
    affiliation: "student",
    reason: "",
  });

  const publicMail = form.email.length > 5 && PUBLIC_MAIL.test(form.email);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async () => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/trial/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit request.");
      setMailSent(data.mail?.applicant === "sent");
      setMailError(data.mail?.error || "");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void submit();
  };

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="pricing" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-10">
        <div className="sk-panel p-8 md:p-12 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <KeyRound className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              7-day Max trial
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Request Max access — we verify, then email your API key
          </h1>
          <p className="text-xs md:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Max is not turned on automatically. Tell us who you are (college or company
            email). After we verify, we email a Max API key to that address. Keys last
            7 days from approval.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "1. Request",
              body: "Name, college/company email, qualification, and why you need Max.",
            },
            {
              icon: ShieldCheck,
              title: "2. We verify",
              body: "Manual review. You’ll get a mail saying we’ll share the key within 7 days.",
            },
            {
              icon: KeyRound,
              title: "3. Key by email",
              body: "Once approved, the Max API key is sent to your college/company inbox.",
            },
          ].map((s) => (
            <div key={s.title} className="sk-panel p-5 space-y-2">
              <div className="flex items-center gap-2">
                <s.icon className="w-4 h-4 text-[var(--accent-cyan)]" />
                <h2 className="text-sm font-bold">{s.title}</h2>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {done ? (
          <div className="sk-panel p-8 md:p-10 max-w-xl mx-auto space-y-4 text-center">
            <div className="sk-icon-well mx-auto w-12 h-12">
              <CheckCircle2 className="w-6 h-6 text-[var(--accent-cyan)]" />
            </div>
            <h2 className="text-xl font-bold">Request received</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              We’ll verify your details and share the Max API key to{" "}
              <span className="font-mono text-[var(--accent-cyan)]">{form.email}</span>{" "}
              within 7 days. If we cannot approve, you’ll get an email for that too.
            </p>
            {mailSent ? (
              <p className="text-xs text-[var(--accent-cyan)] leading-relaxed">
                Confirmation mail sent from licensing@ace-seek.com — check inbox and spam.
              </p>
            ) : (
              <p className="text-xs text-amber-300 leading-relaxed">
                Your request is saved. If the confirmation email is delayed, we still
                review it and send the API key after approval.
              </p>
            )}
            <p className="text-xs text-[var(--muted)] flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              No key is issued until approval. Free plan still works today.
            </p>
            <a href="/pricing" className="sk-btn sk-btn-ghost !text-xs inline-flex">
              Back to pricing
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="sk-panel p-8 space-y-5 max-w-xl mx-auto"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--muted)] flex items-center gap-1.5">
                <User className="w-3 h-3" /> Full name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="sk-input w-full"
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--muted)] flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> College / company email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="sk-input w-full"
                placeholder="you@university.edu  or  you@company.com"
                required
                autoComplete="email"
              />
              {publicMail && (
                <p className="text-[11px] text-amber-400 leading-relaxed">
                  Personal inboxes (Gmail, Outlook, …) are harder to verify. A college or
                  company address is strongly preferred — we may reject unverifiable mail.
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[var(--muted)] flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" /> Qualification
                </label>
                <select
                  name="qualification"
                  value={form.qualification}
                  onChange={onChange}
                  className="sk-input w-full"
                >
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[var(--muted)]">
                  Affiliation
                </label>
                <select
                  name="affiliation"
                  value={form.affiliation}
                  onChange={onChange}
                  className="sk-input w-full"
                >
                  {AFFILIATIONS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--muted)] flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> College / university / company
              </label>
              <input
                name="organization"
                value={form.organization}
                onChange={onChange}
                className="sk-input w-full"
                placeholder="e.g. NITK Surathkal, IIT Madras, Qualcomm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--muted)]">
                Why do you need Max?
              </label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={onChange}
                className="sk-input w-full min-h-[120px] resize-y"
                placeholder="Course / project / job — what you’ll use SDC, timing, docs for…"
                required
                minLength={30}
              />
              <p className="text-[10px] font-mono text-[var(--muted)]">
                {form.reason.length}/2000 · min 30 characters
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="sk-btn sk-btn-primary !text-xs w-full justify-center !py-2.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit trial request</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed text-center">
              Submitting does not unlock Max. You will get a confirmation mail, then the
              API key only after we approve.
            </p>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
