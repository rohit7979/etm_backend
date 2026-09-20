import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Determine if SMTP is configured
const isSmtpConfigured = Boolean(env.SMTP_USER && env.SMTP_PASS);

// Create reusable transporter
const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(env.SMTP_PORT) || 587,
      secure: env.SMTP_SECURE === 'true' || Number(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

function getSenderAddress(): string {
  if (env.EMAIL_FROM) {
    return env.EMAIL_FROM;
  }
  if (env.SMTP_USER) {
    return `"Employee Training Platform" <${env.SMTP_USER}>`;
  }
  return '"Employee Training Platform" <no-reply@etm.local>';
}

/**
 * Sends an invitation email to a newly provisioned Company Admin.
 */
export async function sendAdminInviteEmail(
  to: string,
  inviteLink: string,
  recipientName?: string
): Promise<{ success: boolean; id?: string }> {
  const name = recipientName || 'Administrator';
  const from = getSenderAddress();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 28px; }
          .badge { display: inline-block; background-color: #fee2e2; color: #b91c1c; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
          h1 { color: #0f172a; font-size: 22px; font-weight: 700; margin-top: 14px; margin-bottom: 8px; }
          p { font-size: 15px; line-height: 1.6; color: #475569; margin: 12px 0; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { background-color: #c52031; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
          .link-fallback { word-break: break-all; font-size: 12px; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">ETM Platform Invitation</span>
            <h1>Welcome to Employee Training Management</h1>
          </div>
          <p>Hello <strong>${name}</strong>,</p>
          <p>You have been invited as a <strong>Company Administrator</strong> on the Employee Training Management System (ETM). You now have full access to manage your organization's training programs, assign modules, and track employee progress.</p>
          <p>Please click the button below to accept your invitation and set up your secure password:</p>
          
          <div class="btn-container">
            <a href="${inviteLink}" class="btn" target="_blank">Accept Invitation & Set Password</a>
          </div>

          <p>This single-use invitation link will expire in <strong>48 hours</strong>.</p>
          <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:</p>
          <div class="link-fallback">${inviteLink}</div>

          <div class="footer">
            <p>If you were not expecting this invitation, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Employee Training Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Always log the link for developers and local testing
  console.log('\n======================================================');
  console.log(`📨 [EMAIL SERVICE] Admin Invite dispatched to: ${to}`);
  console.log(`🔗 [INVITE LINK]: ${inviteLink}`);
  console.log('======================================================\n');

  if (!transporter) {
    console.warn('⚠️ [EMAIL SERVICE] SMTP credentials (SMTP_USER / SMTP_PASS) not configured in .env. Email was not dispatched via SMTP.');
    console.log('💡 [EMAIL SERVICE] Development Tip: The user was created! Use the [INVITE LINK] logged above to continue testing locally.');
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'You have been invited to manage your organization on ETM',
      html,
    });

    console.log(`✅ [EMAIL SERVICE] Email successfully delivered via Nodemailer. Message ID: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error('❌ [EMAIL SERVICE] Nodemailer failed to send invite email:', err?.message || err);
    if (err?.code === 'EAUTH') {
      console.warn('⚠️ [EMAIL SERVICE] Gmail Authentication Error: Ensure 2-Step Verification is ON and you are using a 16-character Google App Password (not your Gmail login password).');
    }
    console.log('💡 [EMAIL SERVICE] Development Tip: The user was still created! Use the [INVITE LINK] logged above to continue testing locally.');
    return { success: false };
  }
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  recipientName?: string
): Promise<{ success: boolean; id?: string }> {
  const name = recipientName || 'User';
  const from = getSenderAddress();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 28px; }
          .badge { display: inline-block; background-color: #fef3c7; color: #b45309; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
          h1 { color: #0f172a; font-size: 22px; font-weight: 700; margin-top: 14px; margin-bottom: 8px; }
          p { font-size: 15px; line-height: 1.6; color: #475569; margin: 12px 0; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { background-color: #c52031; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
          .link-fallback { word-break: break-all; font-size: 12px; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Password Reset</span>
            <h1>Reset Your ETM Password</h1>
          </div>
          <p>Hello <strong>${name}</strong>,</p>
          <p>We received a request to reset your password for your Employee Training Management System (ETM) account.</p>
          <p>Click the button below to choose a new password:</p>
          
          <div class="btn-container">
            <a href="${resetLink}" class="btn" target="_blank">Reset My Password</a>
          </div>

          <p>This link is valid for <strong>1 hour</strong> and can only be used once.</p>
          <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:</p>
          <div class="link-fallback">${resetLink}</div>

          <div class="footer">
            <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>&copy; ${new Date().getFullYear()} Employee Training Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Always log the link for developers and local testing
  console.log('\n======================================================');
  console.log(`📨 [EMAIL SERVICE] Password Reset dispatched to: ${to}`);
  console.log(`🔗 [RESET LINK]: ${resetLink}`);
  console.log('======================================================\n');

  if (!transporter) {
    console.warn('⚠️ [EMAIL SERVICE] SMTP credentials (SMTP_USER / SMTP_PASS) not configured in .env. Email was not dispatched via SMTP.');
    console.log('💡 [EMAIL SERVICE] Development Tip: Use the [RESET LINK] logged above to continue testing locally.');
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Reset your password - Employee Training Management',
      html,
    });

    console.log(`✅ [EMAIL SERVICE] Reset email successfully delivered via Nodemailer. Message ID: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error('❌ [EMAIL SERVICE] Nodemailer failed to send password reset email:', err?.message || err);
    if (err?.code === 'EAUTH') {
      console.warn('⚠️ [EMAIL SERVICE] Gmail Authentication Error: Ensure 2-Step Verification is ON and you are using a 16-character Google App Password (not your Gmail login password).');
    }
    console.log('💡 [EMAIL SERVICE] Development Tip: Use the [RESET LINK] logged above to continue testing locally.');
    return { success: false };
  }
}
