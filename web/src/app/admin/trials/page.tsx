"use client";

import React, { useCallback, useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  Shield,
  Loader2,
  Check,
  X,
  RefreshCw,
  Copy,
  KeyRound,
  Lock,
} from "lucide-react";

type TrialRow = {
  id: string;
  name: string;
  email: string;
  qualification: string;
  organization: string;
  affiliation: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  apiKey: string | null;
  trialExpiresAt: number | null;
  createdAt: number;
  reviewNote: string | null;
};

function fmt(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export default function AdminTrialsPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rows, setRows] = useState<TrialRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>("");
  const [copied, setCopied] = useState("");
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = status === "all" ? "" : `?status=${status}`;
      const res = await fetch(`/api/trial/admin${q}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setUnlocked(false);
        setRows([]);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Could not load requests");
      setUnlocked(true);
      setRows(data.requests || []);
    } catch (err: unknown) {
      setRows([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setError("");
    try {
      const res = await fetch("/api/trial/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Wrong secret");
      setUnlocked(true);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUnlocking(false);
    }
  };

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id + action);
    setError("");
    try {
      const res = await fetch("/api/trial/admin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note: note[id] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (data.mail === "sent") {
        setFlash(
          action === "approve"
            ? `Approved — Max API key emailed to ${data.request?.email || "applicant"}.`
            : `Rejected — decision emailed to ${data.request?.email || "applicant"}.`
        );
      } else {
        setFlash(
          `Saved as ${action}d, but email failed${data.mailError ? `: ${data.mailError}` : "."}`
        );
      }
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <main className="flex-1 m-shell py-10 space-y-6">
        <div className="sk-panel p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <Shield className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <h1 className="text-xl font-black">Max trial inbox</h1>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Review trial requests. Approve emails a 7-day Max API key from Ace-Seek Licensing.
          </p>
        </div>

        {!unlocked ? (
          <form onSubmit={unlock} className="sk-panel p-8 max-w-md mx-auto space-y-4">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Lock className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <h2 className="text-center text-base font-bold">Staff sign-in</h2>
            <p className="text-xs text-center text-[var(--muted)]">
              Enter the admin password to open the trial inbox.
            </p>
            <input
              type="password"
              className="sk-input w-full"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin password"
              autoComplete="current-password"
              required
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={unlocking}
              className="sk-btn sk-btn-primary !text-xs w-full justify-center"
            >
              {unlocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Sign in
            </button>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 items-end">
              <select
                className="sk-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
              <button type="button" onClick={() => void load()} className="sk-btn sk-btn-ghost !text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/trial/admin/login", { method: "DELETE", credentials: "include" });
                  setUnlocked(false);
                  setRows([]);
                  setSecret("");
                }}
                className="sk-btn sk-btn-ghost !text-xs"
              >
                Sign out
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {flash && <p className="text-xs text-[var(--accent-cyan)]">{flash}</p>}

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-cyan)]" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-xs text-[var(--muted)] font-mono">No requests in this view.</p>
            ) : (
              <ul className="space-y-4">
                {rows.map((r) => (
                  <li key={r.id} className="sk-panel p-5 space-y-3">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm">{r.name}</p>
                        <p className="font-mono text-xs text-[var(--accent-cyan)]">{r.email}</p>
                      </div>
                      <span className="sk-badge uppercase">{r.status}</span>
                    </div>
                    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-[var(--muted)]">
                      <div>
                        <dt className="uppercase tracking-wider text-[10px]">Organization</dt>
                        <dd className="text-[var(--foreground)]">{r.organization}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wider text-[10px]">Affiliation</dt>
                        <dd className="text-[var(--foreground)]">{r.affiliation}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wider text-[10px]">Qualification</dt>
                        <dd className="text-[var(--foreground)]">{r.qualification}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wider text-[10px]">Submitted</dt>
                        <dd className="text-[var(--foreground)]">{fmt(r.createdAt)}</dd>
                      </div>
                    </dl>
                    <p className="text-xs leading-relaxed sk-recessed p-3">{r.reason}</p>

                    {r.apiKey && (
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                        <code className="text-[11px] font-mono truncate flex-1">{r.apiKey}</code>
                        <button
                          type="button"
                          className="sk-btn sk-btn-ghost !text-[10px] !py-1"
                          onClick={() => copyKey(r.apiKey!)}
                        >
                          {copied === r.apiKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === r.apiKey ? "Copied" : "Copy key"}
                        </button>
                        {r.trialExpiresAt && (
                          <span className="text-[10px] font-mono text-[var(--muted)]">
                            until {fmt(r.trialExpiresAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {r.status === "pending" && (
                      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-[var(--bevel-shadow)]">
                        <input
                          className="sk-input flex-1 min-w-[180px]"
                          placeholder="Optional note to applicant"
                          value={note[r.id] || ""}
                          onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => void act(r.id, "approve")}
                          className="sk-btn sk-btn-primary !text-xs"
                        >
                          {busy === r.id + "approve" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve & email key
                        </button>
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => void act(r.id, "reject")}
                          className="sk-btn sk-btn-ghost !text-xs"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
