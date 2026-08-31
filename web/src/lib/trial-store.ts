import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateTrialApiKey, TRIAL_DURATION_MS } from "@/lib/api-keys";

export type TrialStatus = "pending" | "approved" | "rejected";

export type TrialAffiliation =
  | "student"
  | "faculty"
  | "researcher"
  | "professional"
  | "other";

export type TrialRequest = {
  id: string;
  name: string;
  email: string;
  qualification: string;
  organization: string;
  affiliation: TrialAffiliation;
  reason: string;
  status: TrialStatus;
  apiKey: string | null;
  plan: "max";
  trialStartsAt: number | null;
  trialExpiresAt: number | null;
  reviewedAt: number | null;
  reviewNote: string | null;
  createdAt: number;
  updatedAt: number;
};

export type TrialInput = {
  name: string;
  email: string;
  qualification: string;
  organization: string;
  affiliation: TrialAffiliation;
  reason: string;
};

const AFFILIATIONS: TrialAffiliation[] = [
  "student",
  "faculty",
  "researcher",
  "professional",
  "other",
];

const globalForTrials = globalThis as unknown as {
  __aceTrials: Map<string, TrialRequest>;
};

if (!globalForTrials.__aceTrials) {
  globalForTrials.__aceTrials = new Map<string, TrialRequest>();
}

const mem = globalForTrials.__aceTrials;

function dataFile(): string {
  return path.join(process.cwd(), ".data", "trial-requests.json");
}

function loadFileIntoMem() {
  try {
    const p = dataFile();
    if (!fs.existsSync(p)) return;
    const rows = JSON.parse(fs.readFileSync(p, "utf8")) as TrialRequest[];
    if (!Array.isArray(rows)) return;
    for (const t of rows) {
      if (t?.id) mem.set(t.id, t);
    }
  } catch (err) {
    console.warn("[trial-store] file load failed:", err);
  }
}

function saveFile() {
  try {
    const p = dataFile();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify([...mem.values()], null, 2));
  } catch (err) {
    console.warn("[trial-store] file save failed:", err);
  }
}

loadFileIntoMem();

function now() {
  return Date.now();
}

function newId(): string {
  return "tr" + crypto.randomBytes(8).toString("hex");
}

export function parseAffiliation(raw: unknown): TrialAffiliation {
  const s = String(raw || "").toLowerCase();
  return AFFILIATIONS.includes(s as TrialAffiliation) ? (s as TrialAffiliation) : "other";
}

function rowToTrial(row: Record<string, unknown>): TrialRequest {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    email: String(row.email || "").toLowerCase(),
    qualification: String(row.qualification || ""),
    organization: String(row.organization || ""),
    affiliation: parseAffiliation(row.affiliation),
    reason: String(row.reason || ""),
    status: (row.status as TrialStatus) || "pending",
    apiKey: row.api_key ? String(row.api_key) : null,
    plan: "max",
    trialStartsAt: row.trial_starts_at ? Date.parse(String(row.trial_starts_at)) : null,
    trialExpiresAt: row.trial_expires_at ? Date.parse(String(row.trial_expires_at)) : null,
    reviewedAt: row.reviewed_at ? Date.parse(String(row.reviewed_at)) : null,
    reviewNote: row.review_note ? String(row.review_note) : null,
    createdAt: row.created_at ? Date.parse(String(row.created_at)) : now(),
    updatedAt: row.updated_at ? Date.parse(String(row.updated_at)) : now(),
  };
}

function trialToRow(t: TrialRequest) {
  return {
    id: t.id,
    name: t.name,
    email: t.email,
    qualification: t.qualification,
    organization: t.organization,
    affiliation: t.affiliation,
    reason: t.reason,
    status: t.status,
    api_key: t.apiKey,
    plan: t.plan,
    trial_starts_at: t.trialStartsAt ? new Date(t.trialStartsAt).toISOString() : null,
    trial_expires_at: t.trialExpiresAt ? new Date(t.trialExpiresAt).toISOString() : null,
    reviewed_at: t.reviewedAt ? new Date(t.reviewedAt).toISOString() : null,
    review_note: t.reviewNote,
    created_at: new Date(t.createdAt).toISOString(),
    updated_at: new Date(t.updatedAt).toISOString(),
  };
}

function remember(t: TrialRequest): TrialRequest {
  mem.set(t.id, t);
  saveFile();
  return t;
}

async function persist(t: TrialRequest): Promise<void> {
  remember(t);
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    const { error } = await sb.from("trial_requests").upsert(trialToRow(t), { onConflict: "id" });
    if (error) {
      console.warn("[trial-store] supabase upsert failed:", error.message);
    }
  } catch (err) {
    console.warn("[trial-store] supabase upsert threw:", err);
  }
}

export function isTrialActive(t: TrialRequest | null | undefined): t is TrialRequest {
  if (!t || t.status !== "approved" || !t.apiKey || !t.trialExpiresAt) return false;
  return t.trialExpiresAt > now();
}

export async function createTrialRequest(input: TrialInput): Promise<TrialRequest> {
  const email = input.email.toLowerCase().trim();
  const existing = await findPendingByEmail(email);
  if (existing) {
    throw new Error("A trial request for this email is already pending review.");
  }

  const active = await getActiveTrialByEmail(email);
  if (active) {
    throw new Error("This email already has an active Max trial.");
  }

  const ts = now();
  const trial: TrialRequest = {
    id: newId(),
    name: input.name.trim(),
    email,
    qualification: input.qualification.trim(),
    organization: input.organization.trim(),
    affiliation: input.affiliation,
    reason: input.reason.trim(),
    status: "pending",
    apiKey: null,
    plan: "max",
    trialStartsAt: null,
    trialExpiresAt: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: ts,
    updatedAt: ts,
  };
  await persist(trial);
  return trial;
}

export async function listTrialRequests(status?: TrialStatus): Promise<TrialRequest[]> {
  const sb = getSupabaseAdmin();
  if (sb) {
    let q = sb.from("trial_requests").select("*").order("created_at", { ascending: false }).limit(200);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (!error && data) {
      const rows = data.map((r) => remember(rowToTrial(r as Record<string, unknown>)));
      return rows;
    }
  }
  const all = [...mem.values()].sort((a, b) => b.createdAt - a.createdAt);
  if (all.length) saveFile();
  return status ? all.filter((t) => t.status === status) : all;
}

export async function getTrialById(id: string): Promise<TrialRequest | null> {
  const cached = mem.get(id);
  if (cached) return cached;
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.from("trial_requests").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return remember(rowToTrial(data as Record<string, unknown>));
}

export async function findPendingByEmail(email: string): Promise<TrialRequest | null> {
  const normalized = email.toLowerCase().trim();
  for (const t of mem.values()) {
    if (t.email === normalized && t.status === "pending") return t;
  }
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("trial_requests")
    .select("*")
    .eq("email", normalized)
    .eq("status", "pending")
    .maybeSingle();
  if (!data) return null;
  return remember(rowToTrial(data as Record<string, unknown>));
}

export async function getActiveTrialByEmail(email: string): Promise<TrialRequest | null> {
  const normalized = email.toLowerCase().trim();
  const fromMem = [...mem.values()].find((t) => t.email === normalized && isTrialActive(t));
  if (fromMem) return fromMem;
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("trial_requests")
    .select("*")
    .eq("email", normalized)
    .eq("status", "approved")
    .order("trial_expires_at", { ascending: false })
    .limit(5);
  if (!data?.length) return null;
  for (const row of data) {
    const t = remember(rowToTrial(row as Record<string, unknown>));
    if (isTrialActive(t)) return t;
  }
  return null;
}

export async function findTrialByApiKey(apiKey: string): Promise<TrialRequest | null> {
  const key = apiKey.trim();
  if (!key) return null;
  for (const t of mem.values()) {
    if (t.apiKey === key) return t;
  }
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb.from("trial_requests").select("*").eq("api_key", key).maybeSingle();
  if (!data) return null;
  return remember(rowToTrial(data as Record<string, unknown>));
}

export function findTrialByApiKeySync(apiKey: string): TrialRequest | null {
  const key = apiKey.trim();
  for (const t of mem.values()) {
    if (t.apiKey === key) return t;
  }
  return null;
}

export async function approveTrialRequest(
  id: string,
  reviewNote?: string
): Promise<TrialRequest> {
  const trial = await getTrialById(id);
  if (!trial) throw new Error("Trial request not found.");
  if (trial.status === "approved" && isTrialActive(trial)) return trial;
  if (trial.status === "rejected") {
    throw new Error("This request was rejected. Submit a new request instead.");
  }

  const starts = now();
  const expires = starts + TRIAL_DURATION_MS;
  const next: TrialRequest = {
    ...trial,
    status: "approved",
    apiKey: generateTrialApiKey(trial.id, expires),
    trialStartsAt: starts,
    trialExpiresAt: expires,
    reviewedAt: starts,
    reviewNote: reviewNote?.trim() || trial.reviewNote,
    updatedAt: starts,
  };
  await persist(next);
  return next;
}

export async function rejectTrialRequest(
  id: string,
  reviewNote?: string
): Promise<TrialRequest> {
  const trial = await getTrialById(id);
  if (!trial) throw new Error("Trial request not found.");
  const ts = now();
  const next: TrialRequest = {
    ...trial,
    status: "rejected",
    reviewedAt: ts,
    reviewNote: reviewNote?.trim() || trial.reviewNote,
    updatedAt: ts,
  };
  await persist(next);
  return next;
}

export function publicTrialView(t: TrialRequest) {
  return {
    id: t.id,
    status: t.status,
    email: t.email,
    trialExpiresAt: t.trialExpiresAt,
  };
}
