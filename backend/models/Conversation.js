const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "ai"], required: true },
  content: { type: String, required: true },
  urgency: { type: String, enum: ["critical", "high", "medium", "low", "normal"], default: "normal" },
  intent: { type: String, default: "general" },
  timestamp: { type: Date, default: Date.now }
});

const UnresolvedTopicSchema = new mongoose.Schema({
  question: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  sessionId: { type: String, required: true, unique: true },
  customerName: { type: String, default: "Customer" },
  status: { type: String, enum: ["open", "resolved"], default: "open" },
  rating: { type: String, enum: ["up", "down", null], default: null },
  priority: { type: String, enum: ["critical", "high", "medium", "low", "normal", "urgent", "escalated"], default: "normal" },
  isEscalated: { type: Boolean, default: false },
  repliedByAdmin: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  messages: [MessageSchema],
  unresolvedTopics: [UnresolvedTopicSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', ConversationSchema);
