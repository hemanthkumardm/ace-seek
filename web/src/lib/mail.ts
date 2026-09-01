/**
 * Thin Resend HTTP client. Missing API key is non-fatal — callers still succeed.
 */

export type MailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type MailResult = {
  sent: boolean;
  skipped?: boolean;
  error?: string;
  id?: string;
};

/** Canonical product mailbox on verified ace-seek.com. Never a personal inbox. */
export const ACE_SEEK_FROM_EMAIL = "licensing@ace-seek.com";

function fromAddress(): string {
  const raw = (
    process.env.RESEND_FROM_EMAIL || `Ace-Seek Licensing <${ACE_SEEK_FROM_EMAIL}>`
  ).trim();
  return raw.replace(/^["']|["']$/g, "");
}

/** Pull `licensing@ace-seek.com` from `Ace-Seek Licensing <licensing@ace-seek.com>`. */
export function mailboxFromAddress(raw: string): string {
  const trimmed = raw.replace(/^["']|["']$/g, "").trim();
  const angled = trimmed.match(/<([^>]+)>/);
  return (angled ? angled[1] : trimmed).trim().toLowerCase();
}

export function isAceSeekMailbox(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim().endsWith("@ace-seek.com");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resendKey(): string {
  return (process.env.RESEND_API_KEY || "").trim();
}

export function isResendReady(): boolean {
  const apiKey = resendKey();
  return Boolean(
    apiKey &&
      apiKey.startsWith("re_") &&
      apiKey.length >= 20 &&
      !apiKey.includes("staging") &&
      !apiKey.endsWith("...")
  );
}

async function postResend(
  apiKey: string,
  from: string,
  msg: MailMessage
): Promise<MailResult> {
  const to = Array.isArray(msg.to) ? msg.to : [msg.to];
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: ACE_SEEK_FROM_EMAIL,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { sent: false, error: data.message || `Resend HTTP ${res.status}` };
    }
    return { sent: true, id: data.id };
  } catch (err: unknown) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendMail(msg: MailMessage): Promise<MailResult> {
  if (!isResendReady()) {
    return {
      sent: false,
      skipped: true,
      error:
        "Mail is not configured on this server.",
    };
  }
  return postResend(resendKey(), fromAddress(), msg);
}

export function adminNotifyEmails(): string[] {
  const dedicated = process.env.ACE_TRIAL_NOTIFY_EMAIL?.trim();
  const listed = (process.env.ACE_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fromMailbox = mailboxFromAddress(fromAddress());
  const all = [
    dedicated,
    ...listed,
    fromMailbox,
    ACE_SEEK_FROM_EMAIL,
    "support@ace-seek.com",
  ]
    .filter(Boolean)
    .map((e) => String(e).toLowerCase().trim())
    .filter(isAceSeekMailbox);
  return [...new Set(all)];
}
