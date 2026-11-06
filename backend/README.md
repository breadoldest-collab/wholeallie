# Allié — Backend Service API

The backend API for **Allié**, an AI customer support SaaS platform. Built with Node.js, Express 5, Mongoose, and Google Gemini.

---

## Architecture Overview

```text
backend/
├── config/              # Google Gemini API key management and model selectors
├── data/                # Urgency and intent classification keyword rules
├── middleware/          # JWT validation and Zod request schema validation
├── models/
│   ├── Business.js      # Business tenant schema (auth, store info, FAQs, branding)
│   └── Conversation.js  # Conversation sessions, transcripts, ratings, and escalation status
├── routes/
│   ├── analytics.js     # Real-time metrics, CSAT calculation, and trend charts
│   ├── auth.js          # Authentication, JWT issuance, and multi-tier email OTP delivery
│   ├── chat.js          # Gemini conversational agent, context injection, urgency detector
│   ├── conversations.js # Conversation desk controller, Gemini summarizer, staff replies
│   ├── settings.js      # Business configuration, bulk FAQ ingestion, branding
│   └── support.js       # Public support widget verification endpoint
└── server.js            # Express application bootstrap & MongoDB Atlas connection
```

---

## Core Systems

### 1. Context-Grounded AI Engine (`routes/chat.js`)
- Dynamically injects store profile, description, operating hours, delivery rules, and FAQs into the Gemini system instruction prompt.
- Maintains multi-turn context and customer memory across conversations.
- Employs deterministic fallback responses if the external LLM times out.

### 2. Urgency Detection & Escalation Matrix (`data/urgency-training.json`)
- Evaluates every customer message across 4 severity tiers (`critical`, `high`, `medium`, `low`) with intent tagging (`security`, `billing`, `order`, `account`, `technical`, `return`).
- Flags conversations requiring immediate human staff intervention when critical keywords or explicit human agent requests are detected.

### 3. Multi-Tier Email Verification Pipeline (`routes/auth.js`)
- Automatically cascades across three delivery tiers:
  1. **Brevo HTTP API** (Port 443 HTTPS)
  2. **Resend HTTP API** (Port 443 HTTPS)
  3. **SMTP Nodemailer** (Port 587/465)
- Guarantees 6-digit OTP delivery even on serverless and container hosts that restrict raw outbound SMTP ports.
- Delivers clean NxtWave formatting to trigger Gmail's 1-click Quick Action "Copy code" button.

### 4. Real-Time Telemetry & Admin Copilot (`routes/conversations.js`)
- Supplies store owners with an administrative AI copilot (`Owner's Allié`) that queries live conversation metrics, resolution rates, and customer sentiment to deliver operational insights.

---

## Environment Variables

Create `.env` in this directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cxbot?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_jwt_secret

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Email Verification (Brevo / Resend / SMTP)
BREVO_API_KEY=your_brevo_api_key
RESEND_API_KEY=your_resend_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=https://wholeallie.vercel.app
```

---

## Running Locally

```bash
npm install
node server.js
```

Server listens on `http://localhost:5000`.
