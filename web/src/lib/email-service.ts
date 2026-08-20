/**
 * Production Transactional Email Service for Ace-Seek.
 * Dispatches HTML payment receipts, onboarding welcome emails with dual API keys, and license notifications via Resend SDK.
 */

import { Resend } from "resend";
import { logger } from "./telemetry";

export interface LicenseKeyEmailPayload {
  toEmail: string;
  customerName?: string;
  planName: string;
  apiKey: string;
  paymentId: string;
  amountFormatted: string;
}

export interface WelcomeTrialEmailPayload {
  toEmail: string;
  customerName?: string;
  freeKey: string;
  trialKey: string;
}

/**
 * Generate a beautifully styled, responsive HTML payment receipt & license email
 */
export function generateLicenseEmailHTML(payload: LicenseKeyEmailPayload): string {
  const { customerName, planName, apiKey, paymentId, amountFormatted } = payload;
  const name = customerName || "Valued Engineer";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Ace-Seek License Key & Receipt</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { border-b: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #06b6d4; text-transform: uppercase; }
    .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 8px; margin-bottom: 0; }
    .badge { display: inline-block; background: rgba(6, 182, 212, 0.15); color: #22d3ee; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid rgba(6, 182, 212, 0.3); }
    .key-box { background: #020617; border: 1px solid #06b6d4; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 14px; color: #38bdf8; word-break: break-all; margin: 20px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #cbd5e1; }
    .details-table td { padding: 8px 0; border-bottom: 1px dashed #334155; }
    .details-table td:last-child { text-align: right; font-weight: 600; color: #ffffff; }
    .btn { display: block; width: 100%; text-align: center; background: #06b6d4; color: #000000; font-weight: 800; font-size: 13px; text-transform: uppercase; text-decoration: none; padding: 12px 0; border-radius: 8px; margin-top: 24px; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Ace-Seek Technologies</div>
      <h1 class="title">Payment Confirmation & License Delivery</h1>
    </div>
    
    <span class="badge">Razorpay Verified Order</span>
    
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Hello <strong>${name}</strong>,<br>
      Thank you for subscribing to the <strong>${planName} Plan</strong> on Ace-Seek. Your payment was successfully processed.
    </p>

    <div style="margin-top: 20px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
      Your Active API License Key:
    </div>
    <div class="key-box">
      ${apiKey}
    </div>

    <table class="details-table">
      <tr>
        <td>Plan Tier</td>
        <td>${planName}</td>
      </tr>
      <tr>
        <td>Amount Paid</td>
        <td>${amountFormatted}</td>
      </tr>
      <tr>
        <td>Razorpay Payment ID</td>
        <td><code>${paymentId}</code></td>
      </tr>
      <tr>
        <td>Supported Workstations</td>
        <td>VLSI SDC Studio, MMMC, Power & Timing Engine</td>
      </tr>
    </table>

    <a href="https://www.ace-seek.com/dashboard" class="btn">Access Dashboard & Workstations &rarr;</a>

    <div class="footer">
      Ace-Seek Technologies (Ace-Seek Inc.)<br>
      #21, 11th main road, 4th G cross, Kamakshipalya, Bangalore - 560079<br>
      Need help? Contact support@ace-seek.com or +91 84316 70673
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate responsive HTML welcome email delivering Free API key + 7-Day Pro Trial Key
 */
export function generateWelcomeEmailHTML(payload: WelcomeTrialEmailPayload): string {
  const { customerName, freeKey, trialKey } = payload;
  const name = customerName || "Valued Engineer";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ace-Seek — Your API Keys</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 620px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 36px; box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.6); }
    .header { border-bottom: 1px solid #334155; padding-bottom: 24px; margin-bottom: 28px; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: 1.5px; color: #06b6d4; text-transform: uppercase; }
    .title { font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 10px; margin-bottom: 0; }
    .badge-onboarding { display: inline-block; background: rgba(6, 182, 212, 0.15); color: #22d3ee; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 5px 12px; border-radius: 9999px; margin-bottom: 20px; border: 1px solid rgba(6, 182, 212, 0.3); }
    .badge-trial { display: inline-block; background: rgba(234, 179, 8, 0.15); color: #facc15; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(234, 179, 8, 0.3); }
    .badge-free { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3); }
    .key-card { background: #020617; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .key-card-trial { border: 1px solid #eab308; }
    .key-card-free { border: 1px solid #10b981; }
    .key-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .key-box { font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; word-break: break-all; padding: 12px; border-radius: 6px; background: #090d16; margin-top: 8px; }
    .key-box-trial { color: #fef08a; border: 1px dashed rgba(234, 179, 8, 0.4); }
    .key-box-free { color: #6ee7b7; border: 1px dashed rgba(16, 185, 129, 0.4); }
    .note-text { font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-top: 8px; }
    .cta-container { display: flex; gap: 12px; margin-top: 28px; }
    .btn-primary { flex: 1; text-align: center; background: #06b6d4; color: #000000; font-weight: 800; font-size: 13px; text-transform: uppercase; text-decoration: none; padding: 14px 0; border-radius: 8px; }
    .btn-secondary { flex: 1; text-align: center; background: #1e293b; color: #f8fafc; font-weight: 700; font-size: 13px; text-transform: uppercase; text-decoration: none; padding: 14px 0; border-radius: 8px; border: 1px solid #334155; }
    .footer { text-align: center; margin-top: 36px; font-size: 11px; color: #64748b; line-height: 1.6; border-top: 1px solid #1e293b; padding-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Ace-Seek Technologies</div>
      <h1 class="title">Welcome! Your Access Keys are Ready</h1>
    </div>

    <span class="badge-onboarding">New Engineer Onboarding</span>

    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
      Hello <strong>${name}</strong>,<br>
      Welcome to Ace-Seek! Your account has been provisioned with <strong>2 API License Keys</strong> to access our VLSI EDA Studios and Document Compiler utilities.
    </p>

    <!-- KEY 1: PRO TRIAL KEY -->
    <div class="key-card key-card-trial">
      <div class="key-label">
        <span>1. Pro Tier — 7-Day Trial Key</span>
        <span class="badge-trial">7-Day Free Trial</span>
      </div>
      <div class="key-box key-box-trial">
        ${trialKey}
      </div>
      <div class="note-text">
        ⚡ <strong>Activation Rule</strong>: Your 7-day trial timer begins <strong>from your registration / login date</strong>. Enjoy 500 converts/day, exact look PDF→DOCX, and full VLSI studio features for 7 full days.
      </div>
    </div>

    <!-- KEY 2: PERMANENT FREE KEY -->
    <div class="key-card key-card-free">
      <div class="key-label">
        <span>2. Free Tier — Permanent API Key</span>
        <span class="badge-free">Permanent Free</span>
      </div>
      <div class="key-box key-box-free">
        ${freeKey}
      </div>
      <div class="note-text">
        🔒 <strong>Permanent Access</strong>: This key never expires. Gives you 25 daily document conversions, SDC Studio viewer, and basic EDA utilities forever.
      </div>
    </div>

    <!-- ACTION BUTTONS -->
    <div class="cta-container">
      <a href="https://tools.ace-seek.com/tools/doc-compiler" class="btn-primary">Launch Doc Compiler &rarr;</a>
      <a href="https://vlsi.ace-seek.com/vlsi/sdc-studio" class="btn-secondary">Launch VLSI Studio &rarr;</a>
    </div>

    <div class="footer">
      <strong>Ace-Seek Technologies Inc.</strong><br>
      Apex SaaS Portal for Hardware & VLSI Engineering<br>
      #21, 11th main road, 4th G cross, Kamakshipalya, Bangalore - 560079<br>
      Need assistance? Contact support@ace-seek.com or +91 84316 70673
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send license key email notification using Resend SDK.
 */
export async function sendLicenseDeliveryEmail(payload: LicenseKeyEmailPayload): Promise<{ success: boolean; id?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    logger.info("email.dispatch_attempt", {
      to: payload.toEmail,
      plan: payload.planName,
      paymentId: payload.paymentId,
    });

    if (apiKey) {
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "Ace-Seek Licensing <licensing@ace-seek.com>";

      const response = await resend.emails.send({
        from: fromEmail,
        to: [payload.toEmail],
        subject: `Your Ace-Seek ${payload.planName} License Key & Payment Receipt`,
        html: generateLicenseEmailHTML(payload),
      });

      if (response.error) {
        logger.error("email.resend_error", { error: response.error }, new Error("Resend SDK error"));
        return { success: false };
      }

      logger.info("email.delivered", { id: response.data?.id, to: payload.toEmail });
      return { success: true, id: response.data?.id };
    }

    logger.info("email.mock_delivered", {
      to: payload.toEmail,
      keyPrefix: payload.apiKey.slice(0, 15),
      notice: "Add RESEND_API_KEY=re_xxxxxxxxx to your .env.local to send live emails.",
    });

    return { success: true, id: `audit_log_${Date.now()}` };
  } catch (err: unknown) {
    logger.error("email.dispatch_failed", { payload }, err);
    return { success: false };
  }
}

/**
 * Send welcome email with Free API Key + 7-Day Pro Trial Key using Resend SDK.
 */
export async function sendWelcomeTrialEmail(payload: WelcomeTrialEmailPayload): Promise<{ success: boolean; id?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    logger.info("welcome_email.dispatch_attempt", {
      to: payload.toEmail,
    });

    if (apiKey) {
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "Ace-Seek Licensing <licensing@ace-seek.com>";

      const response = await resend.emails.send({
        from: fromEmail,
        to: [payload.toEmail],
        subject: "Welcome to Ace-Seek! Your Permanent Free & 7-Day Pro Trial API Keys",
        html: generateWelcomeEmailHTML(payload),
      });

      if (response.error) {
        logger.error("welcome_email.resend_error", { error: response.error }, new Error("Resend SDK error"));
        return { success: false };
      }

      logger.info("welcome_email.delivered", { id: response.data?.id, to: payload.toEmail });
      return { success: true, id: response.data?.id };
    }

    logger.info("welcome_email.mock_delivered", {
      to: payload.toEmail,
      freeKeyPrefix: payload.freeKey.slice(0, 15),
      trialKeyPrefix: payload.trialKey.slice(0, 15),
    });

    return { success: true, id: `welcome_log_${Date.now()}` };
  } catch (err: unknown) {
    logger.error("welcome_email.dispatch_failed", { payload }, err);
    return { success: false };
  }
}

export interface PortalQuoteEmailPayload {
  name: string;
  email: string;
  phone?: string;
  category: string;
  description: string;
}

/**
 * Send portal quote lead notification to admin + auto-reply confirmation to client.
 */
export async function sendPortalQuoteNotificationEmail(payload: PortalQuoteEmailPayload): Promise<{ success: boolean }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "dnhcmanthkumar7@gmail.com";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Ace-Seek Portal <portal@ace-seek.com>";

    logger.info("portal_quote.dispatch_attempt", {
      from: payload.email,
      name: payload.name,
      category: payload.category,
    });

    const adminHtml = `
      <div style="font-family: monospace, sans-serif; background: #090d16; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px;">
        <h2 style="color: #38bdf8; margin-top: 0;">🚀 New Portal Quote Request Received</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; color: #cbd5e1; font-size: 13px;">
          <tr><td style="padding: 6px 0; color: #94a3b8;">Client Name:</td><td style="font-weight: bold; color: #ffffff;">${payload.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #94a3b8;">Email Address:</td><td style="font-weight: bold; color: #38bdf8;"><a href="mailto:${payload.email}" style="color: #38bdf8;">${payload.email}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #94a3b8;">Phone / WhatsApp:</td><td style="font-weight: bold; color: #10b981;"><a href="tel:${payload.phone || ""}" style="color: #10b981;">${payload.phone || "Not provided"}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #94a3b8;">Requested Category:</td><td style="font-weight: bold; color: #f59e0b;">${payload.category}</td></tr>
        </table>
        <div style="background: #020617; border: 1px solid #334155; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong style="color: #94a3b8; display: block; margin-bottom: 8px;">Project Scope / Description:</strong>
          <p style="white-space: pre-wrap; margin: 0; color: #f1f5f9; line-height: 1.5;">${payload.description || "(No description provided)"}</p>
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 20px;">Timestamp: ${new Date().toISOString()} · Ace-Seek Portal Lead Engine</p>
      </div>
    `;

    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: fromEmail,
        to: [adminEmail],
        replyTo: payload.email,
        subject: `🚀 [Ace-Seek Portal Quote] ${payload.name} - ${payload.category}`,
        html: adminHtml,
      });

      // Auto-reply to client
      if (payload.email) {
        await resend.emails.send({
          from: fromEmail,
          to: [payload.email],
          subject: `Quote Request Received · Ace-Seek Solutions (${payload.category})`,
          html: `
            <div style="font-family: sans-serif; background: #090d16; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 550px;">
              <h2 style="color: #22d3ee; margin-top: 0;">We've Received Your Project Request!</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Hi <strong>${payload.name}</strong>,<br><br>
                Thank you for reaching out to Ace-Seek regarding <strong>${payload.category}</strong>. Our engineering leads are reviewing your project requirements and will get in touch with you shortly.
              </p>
              <div style="background: #0f172a; border: 1px solid #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #94a3b8;">Want an instant response?</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold;">
                  <a href="https://wa.me/918431670673?text=${encodeURIComponent(`Hi Ace-Seek, I just submitted a quote request for ${payload.category}`)}" style="color: #10b981; text-decoration: none;">
                    💬 Connect directly on WhatsApp (+91 84316 70673) &rarr;
                  </a>
                </p>
              </div>
              <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Ace-Seek Inc. · www.ace-seek.com · portal.ace-seek.com</p>
            </div>
          `,
        });
      }
    }

    return { success: true };
  } catch (err) {
    logger.error("portal_quote.dispatch_failed", { payload }, err);
    return { success: false };
  }
}

