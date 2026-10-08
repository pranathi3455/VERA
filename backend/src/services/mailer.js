import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import supabase from './supabaseClient.js';

dotenv.config();

// Create reusable transporter if SMTP environment variables are configured
const createTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '465', 10);
  let user = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || '').replace(/["']/g, '').trim();
  let pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/["']/g, '').replace(/\s+/g, '').trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass) {
    if (user.endsWith('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }

    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
      });
    }
  }

  return null;
};

/**
 * Dispatch verification OTP email to user's real email address
 * 
 * Strategy:
 * 1. If SMTP / Gmail credentials are configured in backend/.env, send luxury branded VERA HTML email via Nodemailer.
 * 2. If SMTP is not configured or throws, automatically dispatch via Supabase Auth signInWithOtp to recipient.
 */
export const sendVerificationEmail = async (recipientEmail, otpCode) => {
  const normalizedEmail = recipientEmail.toLowerCase().trim();
  const transporter = createTransporter();

  // 1. Try Nodemailer if SMTP configured
  if (transporter) {
    try {
      const fromAddress = process.env.SMTP_FROM || `\"VERA Security\" <${process.env.SMTP_USER || 'security@vera.ai'}>`;
      
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VERA 2-Step Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0818;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0d0818;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background: #171126;
      border: 1px solid rgba(168, 85, 247, 0.28);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      padding: 36px 32px 28px;
      text-align: center;
      background: linear-gradient(180deg, rgba(168, 85, 247, 0.15) 0%, rgba(23, 17, 38, 0) 100%);
      border-bottom: 1px solid rgba(168, 85, 247, 0.15);
    }
    .brand {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 0.35em;
      color: #c084fc;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .tagline {
      font-size: 11px;
      letter-spacing: 0.18em;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .body {
      padding: 36px 32px;
      text-align: center;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }
    .code-container {
      background: rgba(168, 85, 247, 0.08);
      border: 1.5px dashed #a855f7;
      border-radius: 14px;
      padding: 22px 20px;
      margin: 0 auto 28px;
      display: inline-block;
      min-width: 240px;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #c084fc;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .code-digits {
      font-size: 40px;
      font-weight: 800;
      letter-spacing: 0.28em;
      color: #ffffff;
      font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;
    }
    .expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .notice {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      text-align: left;
      margin-bottom: 10px;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(0, 0, 0, 0.25);
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="brand">V E R A</div>
        <div class="tagline">Understand &bull; Analyze &bull; Decide</div>
      </div>
      <div class="body">
        <div class="title">2-Step Verification Code</div>
        <div class="text">
          A request to sign in to your VERA account was initiated for <strong>${normalizedEmail}</strong>.<br/>
          Enter the verification code below on the sign-in screen:
        </div>
        
        <div class="code-container">
          <div class="code-label">Verification Code</div>
          <div class="code-digits">${otpCode}</div>
          <div class="expiry">Expires in 10 minutes</div>
        </div>

        <div class="notice">
          &#x1F512; <strong>Security Notice:</strong> Never share this verification code with anyone. VERA engineers will never ask for your 2-Step Verification code.
        </div>
      </div>
      <div class="footer">
        If you did not initiate this sign-in attempt, someone may be trying to access your account.<br/>
        &copy; ${new Date().getFullYear()} VERA Intelligence Platform. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
      `;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject: `VERA Verification Code: ${otpCode}`,
        text: `Your VERA 2-Step Verification code is ${otpCode}. It expires in 10 minutes. Enter this code on the sign-in screen to complete verification.`,
        html: htmlContent
      });

      console.log(`[SMTP Mailer] Verification email successfully sent to ${normalizedEmail} (Message ID: ${info.messageId})`);
      return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId
      };
    } catch (smtpErr) {
      console.warn(`[SMTP Mailer Warning] Failed to send via SMTP (${smtpErr.message}). Falling back to Supabase Auth...`);
    }
  }

  // 2. Dispatch via Supabase Auth signInWithOtp
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail
      });

      if (error) {
        console.warn(`[Supabase Auth Mailer] signInWithOtp returned error:`, error.message);
        return {
          success: false,
          provider: 'supabase',
          error: error.message
        };
      }

      console.log(`[Supabase Auth Mailer] OTP email successfully dispatched to ${normalizedEmail}`);
      return {
        success: true,
        provider: 'supabase'
      };
    } catch (sbErr) {
      console.error(`[Supabase Auth Mailer Exception]:`, sbErr.message);
      return {
        success: false,
        provider: 'supabase',
        error: sbErr.message
      };
    }
  }

  return {
    success: false,
    provider: 'none',
    error: 'No active email provider configured'
  };
};
