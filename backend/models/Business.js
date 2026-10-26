const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: '' },
  verificationCodeExpiresAt: { type: Date, default: null },
  description: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  botAvatarUrl: { type: String, default: "" },
  location: {
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    mapsUrl: { type: String, default: "" },
  },
  socialLinks: {
    website: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    facebook: { type: String, default: "" },
    linkedin: { type: String, default: "" },
  },
  storeContact: {
    phone: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    hours: { type: String, default: "" },
  },
  storeRating: {
    average: { type: Number, default: 4.8 },
    totalReviews: { type: Number, default: 24 }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'pro', 'premium', 'enterprise'], default: 'premium' },
    status: { type: String, enum: ['active', 'trial', 'past_due', 'canceled'], default: 'active' },
    currentPeriodEnd: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
  },
  faqs: [FAQSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', BusinessSchema);
