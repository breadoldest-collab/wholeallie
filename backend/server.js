require('dotenv').config();

if (!process.env.JWT_SECRET || ['replace_with_a_long_random_secret', 'your_secret_key'].includes(process.env.JWT_SECRET)) {
  process.env.JWT_SECRET = 'faro-dev-secret-key';
}

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const conversationsRoutes = require('./routes/conversations');
const settingsRoutes = require('./routes/settings');
const supportRoutes = require('./routes/support');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check
app.get('/', (req, res) => {
  res.json({ status: "Allié API running" });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

async function startServer() {
  if (!MONGODB_URI || MONGODB_URI === 'your_mongodb_atlas_uri') {
    console.error('MONGODB_URI is not set. Set it in backend/.env before starting the server.');
  } else {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000, family: 4 });
      console.log('Connected to MongoDB Atlas');
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
    }
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_secret_key') {
    console.warn('JWT_SECRET is missing or insecure. Set a strong secret in backend/.env.');
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
