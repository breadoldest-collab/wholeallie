# Allié — Frontend Client

The frontend client for the **Allié** AI Customer Support platform. Built with React 19, Vite, and Tailwind CSS.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- Running [Backend Service](../backend)

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `frontend/` directory (or configure in deployment settings):

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

## 🌐 Deployment

### Deploying to Vercel
1. Import the repository into **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: Your live backend URL (e.g. `https://your-backend.onrender.com`).
4. Click **Deploy**. SPA routing rules are already configured via `vercel.json`.

### Deploying to Netlify
1. Import repository and set base directory to `frontend`.
2. Build command: `npm run build`, publish directory: `dist`.
3. SPA routing redirect rules are configured in `public/_redirects`.
