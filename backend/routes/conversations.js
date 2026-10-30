const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Conversation = require('../models/Conversation');
const Business = require('../models/Business');
const { getGeminiApiKey } = require('../config/aiKeys');

router.use(authMiddleware);

// GET /api/conversations
router.get('/', async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    const conversations = await Conversation.find({ businessId: req.business })
      .sort({ isPinned: -1, createdAt: -1 });

    const result = conversations.map(conv => {
      const lastMsg = conv.messages && conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content
        : "";

      const hasFlagged = (conv.messages || []).some(m => m.flagged);
      const hasUnresolved = (conv.unresolvedTopics || []).length > 0;
      const isUrgent = conv.priority === 'urgent' || ['critical', 'high'].includes(conv.priority) || (conv.status !== 'resolved' && conv.rating === 'down');
      const isEscalated = Boolean(conv.isEscalated) || conv.priority === 'escalated' || isUrgent || hasFlagged || hasUnresolved;

      return {
        sessionId: conv.sessionId,
        customerName: conv.customerName,
        status: conv.status,
        priority: isUrgent ? 'urgent' : (isEscalated ? 'escalated' : (conv.priority || 'normal')),
        isEscalated,
        repliedByAdmin: Boolean(conv.repliedByAdmin),
        isPinned: Boolean(conv.isPinned),
        unresolvedTopics: conv.unresolvedTopics || [],
        rating: conv.rating,
        messageCount: conv.messages ? conv.messages.length : 0,
        createdAt: conv.createdAt,
        lastMessage: lastMsg
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json([]);
  }
});

// POST /api/conversations/assistant — Owner's Allié
router.post('/assistant', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Lean and fast telemetry query
    let openConvs = [];
    let resolvedConvs = [];
    let total = 0;
    let businessName = '';

    if (require('mongoose').connection.readyState === 1) {
      try {
        const [openData, resolvedData, totalCount, bus] = await Promise.all([
          Conversation.find({ businessId: req.business, status: 'open' })
            .select('sessionId customerName messages')
            .sort({ updatedAt: -1 })
            .limit(8)
            .lean(),
          Conversation.find({ businessId: req.business, status: 'resolved' })
            .select('sessionId rating messages')
            .sort({ updatedAt: -1 })
            .limit(4)
            .lean(),
          Conversation.countDocuments({ businessId: req.business }),
          req.business ? Business.findById(req.business).select('businessName').lean() : null,
        ]);

        openConvs = openData || [];
        resolvedConvs = resolvedData || [];
        total = totalCount || 0;
        if (bus) businessName = bus.businessName || '';
      } catch (dbErr) { /* skip */ }
    }

    // Build concise context summary (last 2 messages per session, max 100 chars)
    const openSummaries = openConvs.map(c => {
      const recent = (c.messages || []).slice(-2).map(m => {
        const snippet = String(m.content || '').slice(0, 100);
        return `${m.role.toUpperCase()}: ${snippet}`;
      }).join(' | ');
      return `Session [${c.sessionId}] (${c.customerName || 'Guest'}): ${recent || 'No recent messages'}`;
    }).join('\n');

    const resolvedSummaries = resolvedConvs.map(c => {
      const lastMsg = c.messages?.length > 0 ? String(c.messages[c.messages.length - 1].content || '').slice(0, 80) : '';
      return `Session [${c.sessionId}] Rating: ${c.rating || 'unrated'}${lastMsg ? `, Last: "${lastMsg}"` : ''}`;
    }).join('\n');

    const dbStatus = `STORE NAME: ${businessName || 'Allié Store'}\nTOTAL CONVERSATIONS: ${total}\nOPEN / PENDING CONVERSATIONS (${openConvs.length}):\n${openSummaries || 'None'}\n\nRESOLVED CONVERSATIONS (${resolvedConvs.length}):\n${resolvedSummaries || 'None'}`;

    const systemPrompt = `You are Owner's Allié, an intelligent, conversational executive AI assistant and operational copilot for the store owner of "${businessName || 'this store'}".
You have real-time access to their business conversation telemetry:

${dbStatus}

CRITICAL INSTRUCTIONS:
1. CONVERSATIONAL MEMORY: You are having an ongoing conversation with the store owner/admin. Always remember and maintain context of previous turns in this chat session (e.g. if the user told you their name, previous questions they asked, or instructions they gave). If the user asks "who am I" or refers back to what they said, accurately use what they told you earlier in this conversation!
2. STORE & CUSTOMER INTELLIGENCE: If the user asks about customer conversations, pending chats, customer sentiment, or store issues, use the real-time data above to provide concise, actionable insights.
3. GENERAL CAPABILITIES: If the user asks general questions (e.g. general knowledge, tech, math, advice, "who is X", personal introductions), answer helpfully, accurately, and politely as Owner's Allié.
4. FORMATTING RULES:
   - DO NOT use markdown asterisks (no **, no ***, no *).
   - Use clean bullet points (•) or clean section headers.
   - Keep answers sharp, fast, elegant, and readable.`;

    // Construct multi-turn contents for Gemini preserving conversational history
    const contents = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (!msg || !msg.content || typeof msg.content !== 'string') continue;
        const text = msg.content.trim();
        if (!text) continue;

        // Skip default greeting or stopped placeholder
        if (text.startsWith('Hi! I am') || text === '[Analysis stopped by admin]') {
          continue;
        }

        const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';

        if (role === 'user') {
          if (contents.length === 0 || contents[contents.length - 1].role === 'model') {
            contents.push({ role: 'user', parts: [{ text }] });
          } else {
            contents[contents.length - 1].parts[0].text += `\n${text}`;
          }
        } else {
          // Model turn: must follow a user turn in Gemini
          if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents.push({ role: 'model', parts: [{ text }] });
          }
        }
      }
    }

    // Append current user prompt as the final turn
    if (contents.length === 0 || contents[contents.length - 1].role === 'model') {
      contents.push({ role: 'user', parts: [{ text: prompt.trim() }] });
    } else {
      contents[contents.length - 1].parts[0].text += `\n${prompt.trim()}`;
    }

    const geminiApiKey = getGeminiApiKey('summary');
    const candidateModels = ['gemini-flash-lite-latest', 'gemini-flash-latest'];

    let reply = `You currently have ${openConvs.length} open conversations and ${total} total customer chats logged.`;

    let gotReply = false;
    for (const modelName of candidateModels) {
      if (gotReply) break;
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(7000), // 7s fast timeout to prevent long delays
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.6
            }
          })
        });
        if (response.ok) {
          const data = await response.json();
          const extracted = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (extracted) { reply = extracted.trim(); gotReply = true; }
        }
      } catch (apiErr) { /* try next model quickly */ }
    }

    return res.status(200).json({ reply, openCount: openConvs.length, total });
  } catch (err) {
    return res.status(200).json({
      reply: 'I am Owner\'s Allié, your store intelligence copilot. Ask me anything about managing customer support or store performance.',
      openCount: 0,
      total: 0
    });
  }
});

// GET /api/conversations/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({
      sessionId,
      businessId: req.business
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.status(200).json(conversation);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// PATCH /api/conversations/:sessionId/status
router.patch('/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, repliedByAdmin } = req.body;
    const conv = await Conversation.findOne({ sessionId, businessId: req.business });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (status) conv.status = status;
    if (repliedByAdmin !== undefined) conv.repliedByAdmin = repliedByAdmin;
    await conv.save();
    return res.status(200).json(conv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations/:sessionId/reply
router.post('/:sessionId/reply', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }
    const conv = await Conversation.findOne({ sessionId, businessId: req.business });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    conv.messages.push({
      role: 'ai',
      content: `[Staff Support]: ${message.trim()}`,
      urgency: 'normal',
      intent: 'staff_reply',
    });
    conv.repliedByAdmin = true;
    conv.status = 'resolved';
    await conv.save();

    return res.status(200).json(conv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/conversations/:sessionId/pin — Toggle pin status
router.patch('/:sessionId/pin', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conv = await Conversation.findOne({ sessionId, businessId: req.business });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    conv.isPinned = !conv.isPinned;
    await conv.save();
    return res.status(200).json({ sessionId: conv.sessionId, isPinned: conv.isPinned });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/conversations/:sessionId
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const deleted = await Conversation.findOneAndDelete({
      sessionId,
      businessId: req.business
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Conversation deleted successfully', sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;

