import { adminNotifyEmails, escapeHtml, sendMail, type MailResult } from "@/lib/mail";
import type { TrialRequest } from "@/lib/trial-store";
import { SITE_URL } from "@/lib/site";

function fmtDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function wrap(title: string, inner: string): string {
  return `<!doctype html>
<html><body style="font-family:Inter,system-ui,sans-serif;background:#0c0f14;color:#e2e8f0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#161b24;border:1px solid #334155;border-radius:12px;padding:28px">
    <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#22d3ee;margin:0 0 12px">Ace-Seek</p>
    <h1 style="font-size:20px;margin:0 0 16px;color:#f8fafc">${escapeHtml(title)}</h1>
    ${inner}
    <p style="font-size:12px;color:#64748b;margin:28px 0 0">This is an automated message from ace-seek.com.</p>
  </div>
</body></html>`;
}

export async function sendTrialReceivedMail(t: TrialRequest): Promise<MailResult> {
  const html = wrap(
    "We received your Max trial request",
    `<p>Hi ${escapeHtml(t.name)},</p>
     <p>Thanks for requesting a <strong>7-day Max trial</strong>.</p>
     <p>We’ll <strong>verify</strong> your college / company details. If the request is approved, we’ll email your Ace-Seek <strong>Max API key</strong> to <strong>${escapeHtml(t.email)}</strong> within <strong>7 days</strong>.</p>
     <p>If we cannot verify the request, we’ll email you that decision as well. No key is issued until approval. You can keep using the Free plan in the meantime.</p>
     <p style="color:#94a3b8;font-size:13px">Request ID: <code>${escapeHtml(t.id)}</code></p>`
  );
  return sendMail({
    to: t.email,
    subject: "Ace-Seek: we’ll verify your Max trial and share the API key within 7 days",
    html,
    text: `Hi ${t.name},\n\nWe received your 7-day Max trial request.\n\nWe'll verify your details. If approved, we'll email your Max API key to ${t.email} within 7 days. If we cannot verify, we'll email you that as well.\n\nNo key is issued until approval.\nRequest ID: ${t.id}\n`,
  });
}

export async function sendTrialAdminNotify(t: TrialRequest): Promise<MailResult> {
  const to = adminNotifyEmails();
  if (!to.length) {
    return { sent: false, skipped: true, error: "No @ace-seek.com notify mailbox" };
  }
  const adminUrl = `${SITE_URL}/admin/trials`;
  const html = wrap(
    "New Max trial request",
    `<p><strong>${escapeHtml(t.name)}</strong> asked for a 7-day Max trial.</p>
     <table style="font-size:13px;color:#cbd5e1;border-collapse:collapse">
       <tr><td style="padding:4px 12px 4px 0;color:#64748b">Email</td><td>${escapeHtml(t.email)}</td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#64748b">Organization</td><td>${escapeHtml(t.organization)}</td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#64748b">Affiliation</td><td>${escapeHtml(t.affiliation)}</td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#64748b">Qualification</td><td>${escapeHtml(t.qualification)}</td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#64748b">Why</td><td>${escapeHtml(t.reason)}</td></tr>
     </table>
     <p><a href="${adminUrl}" style="color:#22d3ee">Review in admin →</a></p>`
  );
  return sendMail({
    to,
    subject: `Max trial request: ${t.name} (${t.organization})`,
    html,
    text: `New trial request from ${t.name} <${t.email}>\nOrg: ${t.organization}\n${t.qualification}\n${t.reason}\n\n${adminUrl}\n`,
  });
}

export async function sendTrialApprovedMail(t: TrialRequest): Promise<MailResult> {
  if (!t.apiKey) return { sent: false, error: "No API key on approved trial" };
  const html = wrap(
    "Your Ace-Seek Max trial API key",
    `<p>Hi ${escapeHtml(t.name)},</p>
     <p>Your details were verified. Here is your <strong>Max</strong> API key — valid for <strong>7 days</strong> (until ${escapeHtml(fmtDate(t.trialExpiresAt))} IST).</p>
     <p style="background:#0a0d12;border:1px solid #334155;border-radius:8px;padding:14px;font-family:ui-monospace,monospace;font-size:13px;word-break:break-all;color:#22d3ee">${escapeHtml(t.apiKey)}</p>
     <ol style="color:#cbd5e1;font-size:14px;padding-left:18px">
       <li>Copy the key.</li>
       <li>Open <a href="https://vlsi.ace-seek.com/login" style="color:#22d3ee">vlsi.ace-seek.com</a> or <a href="https://tools.ace-seek.com/login" style="color:#22d3ee">tools.ace-seek.com</a>.</li>
       <li>Paste it into API Key Authorization to unlock Max.</li>
     </ol>
     <p style="font-size:13px;color:#94a3b8">After the trial ends the key stops working and you return to Free unless you subscribe.</p>`
  );
  return sendMail({
    to: t.email,
    subject: "Your Ace-Seek Max trial API key (valid 7 days)",
    html,
    text: `Hi ${t.name},\n\nYour Max trial was approved. API key (valid until ${fmtDate(t.trialExpiresAt)} IST):\n\n${t.apiKey}\n\nPaste it on vlsi.ace-seek.com or tools.ace-seek.com.\n`,
  });
}

export async function sendTrialRejectedMail(t: TrialRequest): Promise<MailResult> {
  const extra = t.reviewNote
    ? `<p><strong>Note from Ace-Seek:</strong> ${escapeHtml(t.reviewNote)}</p>`
    : "";
  const html = wrap(
    "We could not approve your Max trial",
    `<p>Hi ${escapeHtml(t.name)},</p>
     <p>We reviewed your 7-day Max trial request for <strong>${escapeHtml(t.email)}</strong> and could not verify / approve it at this time.</p>
     ${extra}
     <p>You can keep using the <strong>Free</strong> plan. If you think this is a mistake, reply to this email or write to <a href="mailto:licensing@ace-seek.com" style="color:#22d3ee">licensing@ace-seek.com</a>.</p>
     <p style="color:#94a3b8;font-size:13px">Request ID: <code>${escapeHtml(t.id)}</code></p>`
  );
  return sendMail({
    to: t.email,
    subject: "Ace-Seek Max trial: we could not approve this request",
    html,
    text: `Hi ${t.name},\n\nWe reviewed your 7-day Max trial request and could not verify / approve it at this time.\n${t.reviewNote ? `\nNote: ${t.reviewNote}\n` : ""}\nYou can keep using the Free plan. If this is a mistake, reply to licensing@ace-seek.com.\n\nRequest ID: ${t.id}\n`,
  });
}
