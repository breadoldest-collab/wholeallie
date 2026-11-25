const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Conversation = require('../models/Conversation');
const Business = require('../models/Business');
const { getGeminiApiKey } = require('../config/aiKeys');
const {
  isEscalationRequestedByUser,
  isCriticalIssueMessage,
  isEscalationConfirmedByAi,
} = require('../utils/escalation');

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
      const msgs = conv.messages || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].content : "";

      const userAskedHuman = msgs.some(m => m.role === 'user' && (isEscalationRequestedByUser(m.content || '') || isCriticalIssueMessage(m.content || '')));
      const aiConfirmedEscalation = msgs.some(m => m.role === 'ai' && isEscalationConfirmedByAi(m.content || ''));
      const hasUnresolved = (conv.unresolvedTopics || []).length > 0;
      const hasNegativeRating = conv.status !== 'resolved' && conv.rating === 'down';
      const repliedByAdmin = Boolean(conv.repliedByAdmin);

      // Preserve persisted escalation from DB and also detect from transcript/rating/unresolved signals
      const isEscalated = Boolean(conv.isEscalated) || userAskedHuman || aiConfirmedEscalation || hasUnresolved || hasNegativeRating;
      const isUrgent = isEscalated && (
        ['urgent', 'critical'].includes(conv.priority) ||
        msgs.some(m => m.role === 'user' && isCriticalIssueMessage(m.content || '')) ||
        hasNegativeRating
      );
      const effectiveStatus = conv.status === 'resolved'
        ? 'resolved'
        : (conv.status === 'pending' || (isEscalated && !repliedByAdmin) ? 'pending' : (conv.status || 'open'));

      return {
        sessionId: conv.sessionId,
        customerName: conv.customerName,
        status: effectiveStatus,
        priority: isUrgent ? 'urgent' : (isEscalated ? 'escalated' : 'normal'),
        isEscalated,
        repliedByAdmin,
        isPinned: Boolean(conv.isPinned),
        unresolvedTopics: conv.unresolvedTopics || [],
        rating: conv.rating,
        messageCount: msgs.length,
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
          Conversation.find({ businessId: req.business, status: { $in: ['open', 'pending'] } })
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
1. CONVERSATIONAL MEMORY: You are having an ongoing conversation with the store owner/admin. Always remember and maintain context of previous turns in this chat session (e.g. their name or earlier instructions).
2. STORE & ALLIÉ SCOPE ONLY: You must ONLY answer questions related to "${businessName || 'this store'}" (store performance, customer conversations, escalations, unresolved FAQs, ratings, support workflow) and the services/features that Allié provides (AI support portal, Knowledge Base & FAQs, QR studio, Brand Theme customization, live human escalation, staff replies, and analytics).
3. OFF-TOPIC REFUSAL: If the owner asks general knowledge, trivia, coding, math, or topics unrelated to their store or Allié, politely decline in 1-2 sentences and redirect them to their store operations or Allié services.
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
              temperature: 0.3
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

    const convObj = conversation.toObject ? conversation.toObject() : conversation;
    const msgs = convObj.messages || [];
    const userAskedHuman = msgs.some(m => m.role === 'user' && (isEscalationRequestedByUser(m.content || '') || isCriticalIssueMessage(m.content || '')));
    const aiConfirmedEscalation = msgs.some(m => m.role === 'ai' && isEscalationConfirmedByAi(m.content || ''));
    const hasUnresolved = (convObj.unresolvedTopics || []).length > 0;
    const hasNegativeRating = convObj.status !== 'resolved' && convObj.rating === 'down';

    if (!convObj.isEscalated && (userAskedHuman || aiConfirmedEscalation || hasUnresolved || hasNegativeRating)) {
      convObj.isEscalated = true;
      if (convObj.priority === 'normal') convObj.priority = 'escalated';
    } else if (!convObj.isEscalated && !userAskedHuman && !aiConfirmedEscalation && !hasUnresolved && !hasNegativeRating && !convObj.repliedByAdmin) {
      convObj.isEscalated = false;
      convObj.priority = 'normal';
      convObj.messages = msgs.map(m => ({ ...m, flagged: false }));
    }

    return res.status(200).json(convObj);
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
    if (status) {
      conv.status = status;
      if (status === 'resolved') {
        conv.repliedByAdmin = true;
      } else if (status === 'pending') {
        conv.repliedByAdmin = false;
        conv.isEscalated = true;
      }
    }
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

