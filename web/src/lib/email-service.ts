/**
 * Production Transactional Email Service for Ace-Seek.
 * Dispatches HTML payment receipts, active license key delivery emails, and system notifications via Resend SDK.
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

    // Fallback audit logging if RESEND_API_KEY is not yet added in .env.local
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
