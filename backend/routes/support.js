const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

function capitalizeWords(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

router.post('/verify', async (req, res) => {
  try {
    const { businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required.' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found.' });
    }

    const businessName = capitalizeWords(business.businessName) || 'Acme';

    return res.status(200).json({
      verified: true,
      publicAccess: true,
      businessId: business._id,
      businessName,
      logoUrl: business.logoUrl || '',
      botAvatarUrl: business.botAvatarUrl || business.logoUrl || '',
      location: business.location || { address: '', city: '', country: '', mapsUrl: '' },
      socialLinks: business.socialLinks || { website: '', instagram: '', twitter: '', facebook: '', linkedin: '' },
      storeContact: business.storeContact || { phone: '', supportEmail: '', hours: '' },
      storeRating: business.storeRating || { average: 4.8, totalReviews: 24 },
      redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/support/${business._id}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Public support access failed.' });
  }
});

module.exports = router;
