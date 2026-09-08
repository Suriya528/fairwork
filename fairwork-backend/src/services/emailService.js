const nodemailer = require("nodemailer");

/**
 * Production-ready email service for FairWork.
 *
 * Automatically checks for SMTP environment variables.
 * In development or test environments without SMTP credentials,
 * it falls back cleanly to console logging without throwing errors.
 */

const isConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter = null;
if (isConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (err) {
    console.error("[EmailService] Failed to initialize SMTP transporter:", err.message);
    transporter = null;
  }
}

const DEFAULT_FROM = process.env.EMAIL_FROM || '"FairWork" <noreply@fairwork.io>';
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

async function sendMail({ to, subject, html, text }) {
  if (transporter) {
    return transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      text,
      html,
    });
  }

  // Fallback for development / staging / test when SMTP is unconfigured
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n───────────────────────────────────────────────────`);
    console.log(`[DEV EMAIL DISPATCH] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text}`);
    console.log(`───────────────────────────────────────────────────\n`);
  }
  return { messageId: `mock-${Date.now()}`, mocked: true };
}

/**
 * Dispatches an email verification link to a user.
 */
async function sendVerificationEmail(to, token) {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const subject = "Verify your email address — FairWork";
  const text = `Welcome to FairWork!\n\nPlease verify your email address by clicking the link below:\n${verifyUrl}\n\nThis link will expire in 24 hours.\nIf you did not create a FairWork account, please ignore this email.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="margin-bottom: 24px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">FairWork</h2>
      </div>
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px; color: #ffffff;">Verify your email address</h1>
      <p style="font-size: 14px; line-height: 24px; color: #94a3b8; margin: 0 0 24px;">
        Thanks for signing up for FairWork. To protect escrow deposits, contracts, and platform interactions, please confirm your email address.
      </p>
      <div style="margin: 32px 0;">
        <a href="${verifyUrl}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">
        Or copy and paste this URL into your browser:<br/>
        <a href="${verifyUrl}" style="color: #818cf8; word-break: break-all;">${verifyUrl}</a>
      </p>
      <p style="font-size: 12px; color: #64748b; margin: 24px 0 0; border-top: 1px solid #1e293b; pt: 16px;">
        This link expires in 24 hours. If you did not create an account, no further action is required.
      </p>
    </div>
  `;

  return sendMail({ to, subject, html, text });
}

/**
 * Dispatches a password reset link to a user.
 */
async function sendPasswordResetEmail(to, token) {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Reset your FairWork password";
  const text = `A password reset was requested for your FairWork account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email; your account remains secure.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="margin-bottom: 24px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">FairWork</h2>
      </div>
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px; color: #ffffff;">Reset your password</h1>
      <p style="font-size: 14px; line-height: 24px; color: #94a3b8; margin: 0 0 24px;">
        We received a request to reset the password for your FairWork account. Click the button below to choose a new password.
      </p>
      <div style="margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">
        Or copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color: #818cf8; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; color: #64748b; margin: 24px 0 0; border-top: 1px solid #1e293b; pt: 16px;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendMail({ to, subject, html, text });
}

/**
 * Notifies an OAuth user that their account doesn't use password login.
 */
async function sendOAuthNoticeEmail(to, provider) {
  const providerName = provider === "google" ? "Google" : provider === "github" ? "GitHub" : "Social Login";
  const loginUrl = `${CLIENT_URL}/login`;

  const subject = `Sign in with ${providerName} — FairWork`;
  const text = `A password reset was requested for your FairWork account (${to}).\n\nYour account is linked to ${providerName} Sign-In and does not use a standalone password.\n\nPlease log in directly using your ${providerName} account:\n${loginUrl}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="margin-bottom: 24px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">FairWork</h2>
      </div>
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px; color: #ffffff;">Sign in with ${providerName}</h1>
      <p style="font-size: 14px; line-height: 24px; color: #94a3b8; margin: 0 0 24px;">
        A password reset was requested for your account, but you sign in using <strong>${providerName}</strong>. Your account does not have a separate password.
      </p>
      <div style="margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block;">
          Go to Sign In
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 24px 0 0; border-top: 1px solid #1e293b; pt: 16px;">
        If you did not request this, your account is still secure and no action is required.
      </p>
    </div>
  `;

  return sendMail({ to, subject, html, text });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOAuthNoticeEmail,
};
