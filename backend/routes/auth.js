const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { z } = require('zod');
const Business = require('../models/Business');
const validate = require('../middleware/validate');

const registerSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(4, 'Verification code is required')
});

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'replace_with_a_long_random_secret' || secret === 'your_secret_key') {
    process.env.JWT_SECRET = 'faro-dev-secret-key';
    return process.env.JWT_SECRET;
  }
  return secret;
}

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    return false;
  }
  return true;
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // Fast timeouts so if host firewall (e.g. Render free tier) blocks port 587/465, it fails fast
  if (host.includes('gmail') || String(user).includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 8000,
    });
  }

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
    greetingTimeout: 4000,
    socketTimeout: 8000,
  });
}

// Resend HTTPS API (Port 443 - works everywhere, including Render free tier)
async function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress.includes('<') ? fromAddress : `"Allié" <${fromAddress}>`,
      to: [to],
      subject,
      html,
      text
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Resend error: ' + JSON.stringify(data));
  }
  return data;
}

// Brevo HTTPS API (Port 443 - works on Render free tier without custom domain)
async function sendViaBrevo({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'oldbreades@gmail.com';
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Allié', email: fromAddress },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Brevo error: ' + JSON.stringify(data));
  }
  return data;
}

async function sendEmailUniversal({ to, subject, html, text }) {
  // 1. Try Brevo HTTPS API first (sends to ANY email without requiring a custom domain)
  if (process.env.BREVO_API_KEY) {
    try {
      await sendViaBrevo({ to, subject, html, text });
      console.log(`[Email] Successfully delivered to ${to} via Brevo HTTP API.`);
      return true;
    } catch (err) {
      console.warn('[Email] Brevo delivery failed, falling back:', err.message);
    }
  }

  // 2. Try Resend HTTPS API if key configured
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend({ to, subject, html, text });
      console.log(`[Email] Successfully delivered to ${to} via Resend HTTP API.`);
      return true;
    } catch (err) {
      console.warn('[Email] Resend delivery failed, falling back:', err.message);
    }
  }

  // 3. Try Nodemailer SMTP
  const transporter = buildTransporter();
  if (transporter) {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'oldbreades@gmail.com';
    try {
      await transporter.sendMail({
        from: `"Allié" <${fromAddress}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`[Email] Successfully delivered to ${to} via SMTP.`);
      return true;
    } catch (err) {
      console.warn('[Email] SMTP delivery failed:', err.message);
      return false;
    }
  }

  console.warn('[Email] No email delivery provider (Brevo/Resend/SMTP) was able to send the email.');
  return false;
}

async function sendVerificationEmail(email, code) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Allié Account</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f7f6f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #252b3a;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 3px solid #252b3a; border-radius: 24px; box-shadow: 8px 8px 0px #252b3a; overflow: hidden;">
    <tr>
      <td style="padding: 28px 32px 20px; background: #fffdf5; border-bottom: 3px solid #252b3a;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="display: inline-flex; align-items: center;">
                <span style="display: inline-block; width: 34px; height: 34px; background: #9bf1cd; border: 2.5px solid #252b3a; border-radius: 10px; text-align: center; line-height: 34px; font-weight: 900; font-size: 18px; color: #252b3a;">A</span>
                <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.03em; color: #252b3a; vertical-align: middle; margin-left: 8px;">Allié</span>
              </div>
            </td>
            <td align="right">
              <span style="display: inline-block; background: #f1ebff; border: 2px solid #252b3a; border-radius: 999px; padding: 4px 12px; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #6434df;">Security</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 28px;">
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #252b3a;">Verify your email address</h1>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4d586d;">
          Thank you for signing up for <strong>Allié</strong>. Enter the 6-digit verification code below to activate your account and start managing your AI customer support:
        </p>

        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto; width: 100%;">
          <tr>
            <td align="center">
              <div style="display: inline-block; background: #f1ebff; border: 3px solid #252b3a; border-radius: 16px; padding: 16px 36px; box-shadow: 4px 4px 0px #252b3a;">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #252b3a;">${code}</span>
              </div>
            </td>
          </tr>
        </table>

        <div style="background: #fffdf5; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 14px 18px; margin: 24px 0 0;">
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
            ⏱️ <strong>Valid for 15 minutes.</strong> Never share this verification code with anyone. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background: #fafaf9; border-top: 2px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Allié AI Support Platform • Automated Security Notification
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await sendEmailUniversal({
    to: email,
    subject: `${code} is your Allié verification code`,
    text: `Your Allié verification code is: ${code}. It expires in 15 minutes.`,
    html,
  });
}

async function sendPasswordResetEmail(email, code) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Allié Password</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f7f6f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #252b3a;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 3px solid #252b3a; border-radius: 24px; box-shadow: 8px 8px 0px #252b3a; overflow: hidden;">
    <tr>
      <td style="padding: 28px 32px 20px; background: #fffdf5; border-bottom: 3px solid #252b3a;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="display: inline-flex; align-items: center;">
                <span style="display: inline-block; width: 34px; height: 34px; background: #9bf1cd; border: 2.5px solid #252b3a; border-radius: 10px; text-align: center; line-height: 34px; font-weight: 900; font-size: 18px; color: #252b3a;">A</span>
                <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.03em; color: #252b3a; vertical-align: middle; margin-left: 8px;">Allié</span>
              </div>
            </td>
            <td align="right">
              <span style="display: inline-block; background: #fee2e2; border: 2px solid #252b3a; border-radius: 999px; padding: 4px 12px; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #dc2626;">Password Reset</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 28px;">
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #252b3a;">Reset your password</h1>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4d586d;">
          We received a request to reset the password for your <strong>Allié</strong> account. Enter the 6-digit code below to set a new password:
        </p>

        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto; width: 100%;">
          <tr>
            <td align="center">
              <div style="display: inline-block; background: #f1ebff; border: 3px solid #252b3a; border-radius: 16px; padding: 16px 36px; box-shadow: 4px 4px 0px #252b3a;">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #252b3a;">${code}</span>
              </div>
            </td>
          </tr>
        </table>

        <div style="background: #fffdf5; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 14px 18px; margin: 24px 0 0;">
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
            ⏱️ <strong>Valid for 60 minutes.</strong> If you didn't request a password reset, you can safely ignore this email — your account remains completely secure.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background: #fafaf9; border-top: 2px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Allié AI Support Platform • Automated Security Notification
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await sendEmailUniversal({
    to: email,
    subject: `${code} is your Allié password reset code`,
    text: `Your Allié password reset code is: ${code}. It expires in 60 minutes.`,
    html,
  });
}

async function issueVerificationCode(business) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  business.verificationCode = code;
  business.verificationCodeExpiresAt = expiresAt;
  business.emailVerified = false;
  await business.save();

  const delivered = await sendVerificationEmail(business.email, code);
  return { code, expiresAt, delivered };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    if (!requireDb(res)) return;

    const { businessName, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const existing = await Business.findOne({ email: normalizedEmail });
    if (existing) {
      if (!existing.emailVerified) {
        // User attempted registration earlier but did not complete verification: allow updating password and resending code
        const passwordHash = await bcrypt.hash(password, 10);
        const formattedName = typeof businessName === 'string'
          ? businessName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : businessName;
        existing.businessName = formattedName;
        existing.passwordHash = passwordHash;
        await existing.save();

        const { code, delivered } = await issueVerificationCode(existing);
        return res.status(200).json({
          verificationRequired: true,
          delivered,
          message: delivered
            ? 'Account updated. A verification code has been sent to your inbox.'
            : `Email delivery unavailable on host firewall. Use code: ${code}`,
          email: existing.email,
          verificationCode: (!delivered || process.env.NODE_ENV !== 'production') ? code : undefined,
          businessId: existing._id,
          businessName: existing.businessName
        });
      }
      return res.status(409).json({ error: 'Email already registered. Please sign in or reset your password.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const formattedName = typeof businessName === 'string'
      ? businessName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : businessName;
    const newBusiness = new Business({
      businessName: formattedName,
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      verificationCode: '',
      verificationCodeExpiresAt: null
    });
    await newBusiness.save();

    const { code, delivered } = await issueVerificationCode(newBusiness);

    return res.status(201).json({
      verificationRequired: true,
      delivered,
      message: delivered
        ? 'Email verification required. A code has been sent to your inbox.'
        : `Email delivery unavailable on host firewall. Use verification code: ${code}`,
      email: newBusiness.email,
      verificationCode: (!delivered || process.env.NODE_ENV !== 'production') ? code : undefined,
      businessId: newBusiness._id,
      businessName: newBusiness.businessName
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    if (!requireDb(res)) return;

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const business = await Business.findOne({ email: normalizedEmail });
    if (!business) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, business.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!business.emailVerified) {
      const { code, delivered } = await issueVerificationCode(business);

      return res.status(403).json({
        verificationRequired: true,
        delivered,
        message: delivered
          ? 'Please verify your email before signing in. A verification code has been sent to your inbox.'
          : `Please verify your email. Code: ${code}`,
        email: business.email,
        verificationCode: (!delivered || process.env.NODE_ENV !== 'production') ? code : undefined
      });
    }

    const token = jwt.sign(
      { businessId: business._id },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      businessId: business._id,
      businessName: business.businessName,
      email: business.email,
      subscription: business.subscription || { plan: 'premium', status: 'active' }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/send-verification', validate(z.object({ email: z.string().email('Invalid email address') })), async (req, res) => {
  try {
    if (!requireDb(res)) return;

    const email = normalizeEmail(req.body.email);
    const business = await Business.findOne({ email });
    if (!business) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (business.emailVerified) {
      return res.status(200).json({ verified: true, message: 'This email is already verified.' });
    }

    const { code, delivered } = await issueVerificationCode(business);
    return res.status(200).json({
      verificationRequired: true,
      delivered,
      message: delivered
        ? 'A new verification code has been sent to your email.'
        : `Email delivery unavailable on host firewall. Verification code: ${code}`,
      email: business.email,
      verificationCode: (!delivered || process.env.NODE_ENV !== 'production') ? code : undefined
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unable to send verification code.' });
  }
});

router.post('/verify-email', validate(verifyCodeSchema), async (req, res) => {
  try {
    if (!requireDb(res)) return;

    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const business = await Business.findOne({ email: normalizedEmail });

    if (!business) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (business.emailVerified) {
      return res.status(200).json({ verified: true, message: 'Email already verified.' });
    }

    if (!business.verificationCode || !business.verificationCodeExpiresAt) {
      return res.status(400).json({ error: 'No verification code was issued for this account.' });
    }

    const now = new Date();
    if (now > new Date(business.verificationCodeExpiresAt)) {
      return res.status(410).json({ error: 'Verification code expired. Please request a new one.' });
    }

    if (String(business.verificationCode).trim() !== String(code).trim()) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    business.emailVerified = true;
    business.verificationCode = '';
    business.verificationCodeExpiresAt = null;
    await business.save();

    const token = jwt.sign(
      { businessId: business._id },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      verified: true,
      message: 'Email verified successfully.',
      token,
      businessId: business._id,
      businessName: business.businessName,
      email: business.email,
      subscription: business.subscription || { plan: 'premium', status: 'active' }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unable to verify email.' });
  }
});

// POST /api/auth/forgot-password — Send 6-digit password reset code to user email
router.post('/forgot-password', validate(z.object({ email: z.string().email('Invalid email address') })), async (req, res) => {
  try {
    if (!requireDb(res)) return;

    const email = normalizeEmail(req.body.email);
    const business = await Business.findOne({ email });

    if (!business) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const code = generateVerificationCode();
    business.resetPasswordCode = code;
    business.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await business.save();

    const delivered = await sendPasswordResetEmail(business.email, code);

    return res.status(200).json({
      success: true,
      delivered,
      email: business.email,
      message: delivered
        ? `A 6-digit password reset code has been sent to ${business.email}. Please check your inbox.`
        : `Email delivery to your inbox was unavailable on server host. Your 6-digit password reset code is: ${code}`,
      code: !delivered ? code : undefined,
      devCode: (!delivered || process.env.NODE_ENV !== 'production') ? code : undefined
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: err.message || 'Unable to process password reset request.' });
  }
});

// POST /api/auth/reset-password — Verify code and set new password
router.post('/reset-password', validate(z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(4, 'Verification code is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
})), async (req, res) => {
  try {
    if (!requireDb(res)) return;

    const { email, code, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const business = await Business.findOne({ email: normalizedEmail });

    if (!business || !business.resetPasswordCode || !business.resetPasswordExpiresAt) {
      return res.status(400).json({ error: 'No active password reset request was found for this email.' });
    }

    if (new Date() > new Date(business.resetPasswordExpiresAt)) {
      return res.status(410).json({ error: 'Reset code has expired. Please request a new code.' });
    }

    if (String(business.resetPasswordCode).trim() !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email.' });
    }

    business.passwordHash = await bcrypt.hash(newPassword, 10);
    business.resetPasswordCode = '';
    business.resetPasswordExpiresAt = null;
    await business.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: err.message || 'Unable to reset password.' });
  }
});

module.exports = router;
