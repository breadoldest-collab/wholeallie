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
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

async function sendVerificationEmail(email, code) {
  const transporter = buildTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'oldbreades@gmail.com';

  if (!transporter) {
    return false;
  }

  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Verify your Allié account email',
    text: `Your Allié verification code is: ${code}. It expires in 15 minutes.`,
    html: `<p>Your Allié verification code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`,
  });

  return true;
}

async function issueVerificationCode(business) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
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
      return res.status(409).json({ error: 'Email already registered' });
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
      message: delivered
        ? 'Email verification required. A code has been sent to your inbox.'
        : 'Email verification required. Use the code in development mode to continue.',
      email: newBusiness.email,
      verificationCode: process.env.NODE_ENV !== 'production' ? code : undefined,
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
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      business.verificationCode = code;
      business.verificationCodeExpiresAt = expiresAt;
      await business.save();

      return res.status(403).json({
        verificationRequired: true,
        message: 'Please verify your email before signing in.',
        email: business.email,
        verificationCode: process.env.NODE_ENV !== 'production' ? code : undefined
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
      message: delivered
        ? 'A new verification code has been sent to your email.'
        : 'A new verification code is ready in development mode.',
      email: business.email,
      verificationCode: process.env.NODE_ENV !== 'production' ? code : undefined
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

module.exports = router;
