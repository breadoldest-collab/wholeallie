# Allié — Frontend Client

The frontend application for **Allié**, an AI customer support SaaS platform. Built with React 19, Vite, and Tailwind CSS.

---

## Key Frontend Features

- **Neo-Brutalist Design System**: Custom design tokens with crisp `#252b3a` dark borders, tactile drop shadows, and responsive layout across desktop and mobile.
- **Dual-Stream Conversation Desk**: Dynamic separation between AI Handled automations and Human Support escalations with live transcripts and staff response stream.
- **Owner's Allié Executive Copilot**: Expandable AI operational assistant interface with multi-turn memory and real-time store telemetry query support.
- **Interactive Walkthrough Tour**: Integrated multi-chapter visual demo walking prospective users through core capabilities.
- **Bulk FAQ Ingestion**: Multi-format question & answer parser supporting `Q: / A:`, pipe-separated, and natural text blocks.
- **Configurable Vector QR Code Suite**: 8 dot/corner geometry options and 8 brand color swatches with print-ready counter display layout.
- **Atmospheric Weather Telemetry**: Real-time vector weather and localized day/night clock using Open-Meteo.
- **Executive Analytics**: Conversation trend charts and CSAT score tracking using Recharts.

---

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4, Custom CSS tokens
- **Data Visualization**: Recharts 3
- **Routing & Networking**: React Router DOM 7, Axios
- **Icons & Animation**: Lucide React, Framer Motion
- **QR Generation**: qr-code-styling

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- Running [Backend Service](../backend)

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `frontend/` directory (or configure in your Vercel deployment settings):

```env
# URL of your deployed backend API (defaults to http://localhost:5000 in dev)
VITE_API_URL=http://localhost:5000
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## Deployment

### Deploying to Vercel
1. Import repository into **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: Your live backend API URL (e.g. `https://wholeallie-backend.onrender.com`).
4. SPA routing is pre-configured via `vercel.json`.
