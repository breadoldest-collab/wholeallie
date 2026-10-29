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

function renderCodeTiles(code) {
  const digits = String(code || '').trim().split('').slice(0, 6);
  while (digits.length < 6) digits.push('•');

  return digits.map(digit => `
    <td align="center" valign="middle" style="padding: 0 3px;">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td align="center" valign="middle" style="width: 44px; height: 56px; min-width: 44px; max-width: 44px; background: #ffffff; border: 2.5px solid #252b3a; border-right: 4.5px solid #252b3a; border-bottom: 4.5px solid #252b3a; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 900; color: #252b3a; line-height: 56px; text-align: center;">
            ${digit}
          </td>
        </tr>
      </table>
    </td>
  `).join('');
}

function buildAllieEmailHtml({
  preheader,
  badgeText,
  badgeBg,
  badgeColor,
  titlePre,
  titleHighlight,
  description,
  code,
  expiryMinutes = 60,
  ctaText,
  ctaUrl = 'https://wholeallie.vercel.app/login'
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${titlePre} ${titleHighlight}</title>
</head>
<body style="margin: 0; padding: 36px 14px; background-color: #fffdf5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #252b3a; -webkit-font-smoothing: antialiased;">
  <!-- Hidden preheader for email preview snippets -->
  <div style="display: none; font-size: 1px; color: #fffdf5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader || `Your 6-digit Allié security code is ${code}. Valid for ${expiryMinutes} minutes.`}
  </div>

  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 3px solid #252b3a; border-right: 7px solid #252b3a; border-bottom: 7px solid #252b3a; border-radius: 24px; box-shadow: 8px 8px 0px #252b3a; overflow: hidden; border-collapse: separate;">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 24px 28px 20px; background: #fffdf5; border-bottom: 3px solid #252b3a;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td valign="middle">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="width: 42px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" valign="middle" style="width: 40px; height: 40px; background: #9bf1cd; border: 2.5px solid #252b3a; border-right: 4px solid #252b3a; border-bottom: 4px solid #252b3a; border-radius: 12px; font-size: 22px; font-weight: 900; color: #252b3a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 40px; text-align: center;">
                          A
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left: 12px; line-height: 1.1;">
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.05em; color: #252b3a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Allié
                    </span>
                    <div style="margin-top: 3px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #5b6475; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #34d399; margin-right: 4px; vertical-align: middle;"></span>ALLIÉ AI
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" valign="middle">
              <table border="0" cellpadding="0" cellspacing="0" align="right">
                <tr>
                  <td align="center" style="background: ${badgeBg}; border: 2.5px solid #252b3a; border-right: 4px solid #252b3a; border-bottom: 4px solid #252b3a; border-radius: 9999px; padding: 6px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: ${badgeColor}; white-space: nowrap;">
                    ${badgeText}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 34px 30px 28px; background: #ffffff;">
        <!-- Two-tone Heading -->
        <h1 style="margin: 0 0 14px; font-size: 30px; font-weight: 900; line-height: 1.1; letter-spacing: -0.03em; text-transform: uppercase; color: #252b3a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${titlePre} <span style="color: #6434df;">${titleHighlight}</span>
        </h1>

        <!-- Subtext -->
        <p style="margin: 0 0 26px; font-size: 15px; line-height: 1.65; color: #4d586d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${description}
        </p>

        <!-- Neo-brutalist Code Tiles Container -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 26px; background: #f1ebff; border: 2.5px solid #252b3a; border-right: 5.5px solid #252b3a; border-bottom: 5.5px solid #252b3a; border-radius: 20px; box-shadow: 4px 4px 0px #252b3a;">
          <tr>
            <td align="center" style="padding: 22px 14px 20px;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: #6434df; margin-bottom: 14px;">
                One-Time Authorization Code
              </div>
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  ${renderCodeTiles(code)}
                </tr>
              </table>
              <div style="margin-top: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 700; color: #6c5fa7; letter-spacing: 0.04em;">
                Expires in ${expiryMinutes} minutes &bull; Single-use only
              </div>
            </td>
          </tr>
        </table>

        <!-- Neo-brutalist Primary CTA Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background: #6434df; border: 3px solid #252b3a; border-right: 6px solid #252b3a; border-bottom: 6px solid #252b3a; border-radius: 9999px; box-shadow: 4px 4px 0px #252b3a;">
                    <a href="${ctaUrl}" target="_blank" style="display: block; padding: 15px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: #ffffff; text-decoration: none; white-space: nowrap;">
                      ${ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Security Note Box -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #e9fff5; border: 2.5px solid #252b3a; border-right: 5px solid #252b3a; border-bottom: 5px solid #252b3a; border-radius: 16px; box-shadow: 3px 3px 0px #252b3a; margin: 10px 0 0;">
          <tr>
            <td style="padding: 15px 18px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" style="width: 28px; font-size: 20px; line-height: 1;">
                    🛡️
                  </td>
                  <td valign="top" style="padding-left: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12.5px; line-height: 1.55; color: #253044;">
                    <strong style="color: #0f7a57;">Security Guarantee:</strong> This verification code is valid for ${expiryMinutes} minutes. If you did not request this, you can safely disregard this email — your account remains completely protected.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Brand Footer -->
    <tr>
      <td style="padding: 24px 30px 26px; background: #fffdf5; border-top: 3px solid #252b3a; text-align: center;">
        <p style="margin: 0 0 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 900; letter-spacing: 0.04em; color: #252b3a;">
          Allié AI Support Platform
        </p>
        <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #64748b;">
          Automated security notification &bull; Please do not reply directly to this email
        </p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 800; color: #6434df;">
          <a href="https://wholeallie.vercel.app" target="_blank" style="color: #6434df; text-decoration: none;">Website</a> &nbsp;&bull;&nbsp; 
          <a href="https://wholeallie.vercel.app/login" target="_blank" style="color: #6434df; text-decoration: none;">Sign In</a> &nbsp;&bull;&nbsp; 
          <a href="https://wholeallie.vercel.app/dashboard" target="_blank" style="color: #6434df; text-decoration: none;">Dashboard</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendVerificationEmail(email, code) {
  const html = buildAllieEmailHtml({
    preheader: `Your Allié account verification code is ${code}. Activate your workspace now.`,
    badgeText: '● VERIFY ACCOUNT',
    badgeBg: '#e9fff5',
    badgeColor: '#0f7a57',
    titlePre: 'Verify your',
    titleHighlight: 'Account',
    description: 'Welcome to <strong>Allié</strong>! Enter the 6-digit verification passcode below to activate your account and start managing your AI customer operations workspace:',
    code,
    expiryMinutes: 60,
    ctaText: 'Open Allié & Verify',
    ctaUrl: 'https://wholeallie.vercel.app/login'
  });

  return await sendEmailUniversal({
    to: email,
    subject: `${code} is your Allié verification code`,
    text: `Your Allié verification code is: ${code}. It expires in 60 minutes. Use it at https://wholeallie.vercel.app/login`,
    html,
  });
}

async function sendPasswordResetEmail(email, code) {
  const html = buildAllieEmailHtml({
    preheader: `Your Allié password reset code is ${code}. Valid for 60 minutes.`,
    badgeText: '● SECURE RESET',
    badgeBg: '#ffd05b',
    badgeColor: '#252b3a',
    titlePre: 'Reset your',
    titleHighlight: 'Password',
    description: 'We received a request to reset the password for your <strong>Allié</strong> account. Enter the 6-digit one-time code below to create a new password:',
    code,
    expiryMinutes: 60,
    ctaText: 'Open Allié & Enter Code',
    ctaUrl: 'https://wholeallie.vercel.app/login'
  });

  return await sendEmailUniversal({
    to: email,
    subject: `${code} is your Allié password reset code`,
    text: `Your Allié password reset code is: ${code}. It expires in 60 minutes. Enter your code at https://wholeallie.vercel.app/login`,
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
