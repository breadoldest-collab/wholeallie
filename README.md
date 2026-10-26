# Allié — AI-Powered Customer Support Platform

**Allié** is a full-stack, AI-powered customer support copilot and business management platform. Designed for modern businesses, Allié combines a customer-facing conversational agent powered by Google Gemini with a real-time analytics dashboard, knowledge base management, and conversation triaging tools.

---

## ✨ Features

- **🤖 Intelligent Customer Chatbot (Allié)**
  - Natural conversation powered by Google Gemini (`gemini-flash-lite-latest` / `gemini-3.5-flash-lite`).
  - Contextual memory for customer names and session continuity.
  - Urgency and intent classification (`critical`, `high`, `medium`, `normal`, `low`) for rapid escalation.
  - Customer satisfaction feedback (thumbs up / thumbs down) tracked in real-time.
  - Light and Dark mode support with smooth animations.

- **📊 Comprehensive Business Dashboard**
  - High-level KPIs: Total chats, resolution rate, customer satisfaction (CSAT), and active ticket volume.
  - Interactive activity charts (hourly, daily, and yearly conversation trends powered by Recharts).
  - Urgent unresolved ticket highlighting and admin copilot tooling.

- **💬 Conversation History & AI Summarization**
  - Full transcript inspection for all customer interactions.
  - One-click Gemini AI summaries for rapid ticket handoffs.
  - Filter and search by status, priority, and date.

- **⚙️ Knowledge Base & Customization**
  - Configure company description and business FAQs directly from the settings panel.
  - Real-time FAQ syncing to provide Allié with immediate domain knowledge.
  - Dedicated public support link (`/support/:businessId`) and downloadable QR code for embedding.

- **🔐 Enterprise-Ready Authentication**
  - Secure signup and login with JWT and bcrypt password hashing.
  - Email verification workflow supported via Nodemailer (SMTP).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Animations**: [Lucide React](https://lucide.dev/), [Framer Motion](https://motion.dev/)
- **Charts & Tables**: [Recharts](https://recharts.org/), [TanStack Table](https://tanstack.com/table)
- **Routing & HTTP**: React Router DOM 7, Axios

### Backend
- **Server**: Node.js & [Express.js 5](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with Mongoose 9
- **AI Engine**: Google Gemini API via REST endpoints
- **Auth & Security**: JSON Web Tokens (JWT), bcrypt, CORS, Zod validation
- **Email Service**: Nodemailer (SMTP)

---

## 📁 Project Structure

```text
Bottted/
├── backend/
│   ├── config/          # AI key configurations & fallbacks
│   ├── data/            # Urgency & intent training dataset
│   ├── middleware/      # JWT authentication middleware
│   ├── models/          # Mongoose models (Business, Conversation)
│   ├── routes/          # Express API routes (auth, chat, analytics, conversations, settings, support)
│   ├── server.js        # Main server entry point
│   ├── .env.example     # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios client with JWT interceptors
│   │   ├── components/  # Reusable UI components, Sidebar, BrandLogo, Copilot
│   │   ├── pages/       # Dashboard, Conversations, CustomerChat, Settings, Login
│   │   ├── App.jsx      # Route definitions
│   │   └── main.jsx     # App bootstrap
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB instance)
- [Google Gemini API Key](https://aistudio.google.com/)

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret

   # Gemini API Credentials
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_AGENT_API_KEY=your_gemini_api_key
   GEMINI_SUMMARY_API_KEY=your_gemini_api_key
   GEMINI_SUMMARIZER_API_KEY=your_gemini_api_key

   # SMTP Email Verification (Optional for local dev)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

5. Start the backend server:
   ```bash
   node server.js
   ```
   *The server runs on [http://localhost:5000](http://localhost:5000).*

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set frontend environment variables in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 🔌 API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new business account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | No |
| `POST` | `/api/auth/verify-code` | Verify account via email OTP | No |
| `POST` | `/api/chat/message` | Send customer prompt & receive Allié response | No |
| `POST` | `/api/chat/feedback` | Submit thumbs up/down rating for conversation | No |
| `GET` | `/api/analytics` | Fetch KPIs and hourly/daily/yearly trend charts | Yes |
| `GET` | `/api/conversations` | List conversation sessions with filters | Yes |
| `POST` | `/api/conversations/:id/summary` | Generate AI summary for a conversation | Yes |
| `GET` | `/api/settings` | Get business details, FAQs, and public widget config | Yes |
| `PUT` | `/api/settings` | Update company description and FAQs | Yes |
| `POST` | `/api/support/verify` | Validate public business widget access | No |

---

## 📄 License

This project is licensed under the ISC License.
