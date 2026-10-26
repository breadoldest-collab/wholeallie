const express = require('express');
const router = express.Router();
const { z } = require('zod');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const Business = require('../models/Business');

const settingsSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').optional(),
  description: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  botAvatarUrl: z.string().optional().default(""),
  location: z.object({
    address: z.string().optional().default(""),
    city: z.string().optional().default(""),
    country: z.string().optional().default(""),
    mapsUrl: z.string().optional().default("")
  }).optional().default({ address: '', city: '', country: '', mapsUrl: '' }),
  socialLinks: z.object({
    website: z.string().optional().default(""),
    instagram: z.string().optional().default(""),
    twitter: z.string().optional().default(""),
    facebook: z.string().optional().default(""),
    linkedin: z.string().optional().default("")
  }).optional().default({ website: '', instagram: '', twitter: '', facebook: '', linkedin: '' }),
  storeContact: z.object({
    phone: z.string().optional().default(""),
    supportEmail: z.string().optional().default(""),
    hours: z.string().optional().default("")
  }).optional().default({ phone: '', supportEmail: '', hours: '' }),
  faqs: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required')
  })).optional().default([])
});

router.use(authMiddleware);

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const defaultData = {
      description: '',
      logoUrl: '',
      botAvatarUrl: '',
      businessName: '',
      location: { address: '', city: '', country: '', mapsUrl: '' },
      socialLinks: { website: '', instagram: '', twitter: '', facebook: '', linkedin: '' },
      storeContact: { phone: '', supportEmail: '', hours: '' },
      faqs: []
    };
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json(defaultData);
    }
    const business = await Business.findById(req.business);
    if (!business) {
      return res.status(200).json(defaultData);
    }
    return res.status(200).json({
      description: business.description || '',
      logoUrl: business.logoUrl || '',
      botAvatarUrl: business.botAvatarUrl || '',
      businessName: business.businessName || '',
      location: business.location || defaultData.location,
      socialLinks: business.socialLinks || defaultData.socialLinks,
      storeContact: business.storeContact || defaultData.storeContact,
      subscription: business.subscription || { plan: 'premium', status: 'active', currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      faqs: business.faqs || []
    });
  } catch (err) {
    return res.status(200).json({
      description: '',
      logoUrl: '',
      botAvatarUrl: '',
      businessName: '',
      location: { address: '', city: '', country: '', mapsUrl: '' },
      socialLinks: { website: '', instagram: '', twitter: '', facebook: '', linkedin: '' },
      storeContact: { phone: '', supportEmail: '', hours: '' },
      faqs: []
    });
  }
});

function capitalizeBusinessName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// POST /api/settings
router.post('/', validate(settingsSchema), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    }
    const { businessName, description, logoUrl, botAvatarUrl, location, socialLinks, storeContact, faqs } = req.body;
    const updateData = {};
    if (businessName !== undefined && businessName.trim()) {
      updateData.businessName = capitalizeBusinessName(businessName);
    }
    if (description !== undefined) updateData.description = description;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (botAvatarUrl !== undefined) updateData.botAvatarUrl = botAvatarUrl;
    if (location !== undefined) updateData.location = location;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (storeContact !== undefined) updateData.storeContact = storeContact;
    if (faqs !== undefined) updateData.faqs = faqs;

    const business = await Business.findByIdAndUpdate(
      req.business,
      updateData,
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    return res.status(200).json({
      description: business.description,
      logoUrl: business.logoUrl || '',
      botAvatarUrl: business.botAvatarUrl || '',
      businessName: business.businessName || '',
      location: business.location || { address: '', city: '', country: '', mapsUrl: '' },
      socialLinks: business.socialLinks || { website: '', instagram: '', twitter: '', facebook: '', linkedin: '' },
      storeContact: business.storeContact || { phone: '', supportEmail: '', hours: '' },
      faqs: business.faqs
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
