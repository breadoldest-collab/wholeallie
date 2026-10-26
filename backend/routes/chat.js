const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Business = require('../models/Business');
const Conversation = require('../models/Conversation');
const { getGeminiApiKey } = require('../config/aiKeys');
const urgencyTrainingData = require('../data/urgency-training.json');

const inMemoryConversationStore = new Map();
const userNameMemoryStore = new Map();
const sessionStateStore = new Map();

const CANT_ANSWER_PHRASES = [
  "connect you with our team",
  "don't have information",
  "reach out to",
  "unable to help",
  "contact our team",
  "not able to answer",
];

const GREETING_WORDS = ["hi", "hello", "hey", "good morning", "good afternoon", "greetings", "howdy", "hi there", "hello there"];

function capitalizeBusinessName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function normalizeMessage(message) {
  return String(message || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMentionedEmail(userMessage = '') {
  const match = String(userMessage || '').match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\.[a-z]{2,})?/i);
  return match ? match[0].trim() : '';
}

function getEmailVerificationNote(userMessage) {
  const email = extractMentionedEmail(userMessage);
  if (!email) return null;

  const domain = email.split('@')[1]?.toLowerCase() || '';
  const isGmailLike = /(?:^|\.)gmail\.com$/i.test(domain) || /(?:^|\.)outlook\.com$/i.test(domain) || /(?:^|\.)yahoo\.com$/i.test(domain);

  return {
    email,
    isValidFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    isProviderLikeGmail: isGmailLike,
    isVerified: false,
    note: 'This looks like a valid email format, but it is not verified as real unless we confirm it through a secure support check. A Gmail or other public address alone is not proof of identity.'
  };
}

function extractKnownUserName(messages = []) {
  const messageList = Array.isArray(messages) ? messages : [];
  for (let i = messageList.length - 1; i >= 0; i -= 1) {
    const entry = messageList[i];
    if (!entry || entry.role !== 'user' || typeof entry.content !== 'string') continue;
    const match = entry.content.match(/(?:my name is|i am|i['’]?m|i'm|call me|you can call me|^am)\s+([a-z][a-z' -]{1,30})/i);
    if (match && match[1]) return match[1].trim();
  }
  return '';
}

function persistSessionState(sessionId, conversation) {
  const customerName = typeof conversation?.customerName === 'string' ? conversation.customerName.trim() : '';
  sessionStateStore.set(sessionId, {
    sessionId,
    customerName,
    messages: Array.isArray(conversation?.messages) ? conversation.messages : [],
  });
  if (customerName) {
    userNameMemoryStore.set(sessionId, customerName);
  }
}

function resolveRememberedName(sessionId, messages = [], conversation = null) {
  const sessionMemory = sessionStateStore.get(sessionId);
  const storedName = sessionMemory && typeof sessionMemory.customerName === 'string' ? sessionMemory.customerName.trim() : '';
  const memoryName = storedName && !/^customer$/i.test(storedName) ? storedName : '';
  if (memoryName) return memoryName;

  if (conversation && typeof conversation.customerName === 'string') {
    const convName = conversation.customerName.trim();
    if (convName && !/^customer$/i.test(convName)) return convName;
  }

  const directSessionName = userNameMemoryStore.get(sessionId);
  if (directSessionName && !/^customer$/i.test(directSessionName)) return directSessionName;

  const remembered = extractKnownUserName(messages);
  if (remembered && !/^customer$/i.test(remembered)) {
    userNameMemoryStore.set(sessionId, remembered);
    if (conversation) conversation.customerName = remembered;
    persistSessionState(sessionId, conversation);
    return remembered;
  }

  return '';
}

function getRememberedIdentityResponse(userMessage, rememberedName) {
  const normalized = normalizeMessage(userMessage);
  if (!rememberedName) return null;

  if (
    normalized.includes('who am i') ||
    normalized.includes('what is my name') ||
    normalized.includes('what is my identity') ||
    normalized.includes('do you know my name') ||
    normalized.includes('who am i ') ||
    normalized.includes('who am i?')
  ) {
    return `You told me your name is ${rememberedName}.`;
  }

  if (
    normalized.includes('didnt i say my name') ||
    normalized.includes('did i not say my name') ||
    normalized.includes('i already told you my name') ||
    normalized.includes('remember my name') ||
    normalized.includes('you forgot my name') ||
    normalized.includes('didnt i say my name')
  ) {
    return `Yes — you told me your name is ${rememberedName}.`;
  }

  return null;
}

function buildUrgencyTrainingExamples() {
  return urgencyTrainingData
    .map(example => `"${example.text}" -> urgency: ${example.urgency}, intent: ${example.intent}, action: ${example.action}`)
    .join('\n');
}

function classifyMessageUrgency(userMessage) {
  const message = normalizeMessage(userMessage);
  const thresholdMap = [
    { urgency: 'critical', keywords: ['hacked', 'security breach', 'security issue', 'fraud', 'abuse', 'service is down', 'outage', 'cannot access', 'not working at all', 'website is crashing', 'all customers'] },
    { urgency: 'high', keywords: ['charged twice', 'refund', 'failed payment', 'duplicate charge', 'locked out', 'damaged', 'never arrived', 'not received', 'card was charged', 'urgent'] },
    { urgency: 'medium', keywords: ['delayed', 'login', 'cancel subscription', 'crashing', 'freezing', 'slow', 'damaged product', 'partial outage'] },
    { urgency: 'low', keywords: ['policy', 'invoice', 'what is', 'how do i', 'return policy', 'billing email', 'track order', 'where is my order'] },
  ];

  const intentMap = [
    { keywords: ['hacked', 'security', 'fraud', 'abuse'], intent: 'security' },
    { keywords: ['charged', 'invoice', 'payment', 'refund', 'billing', 'charge'], intent: 'billing' },
    { keywords: ['order', 'shipment', 'delivery', 'package', 'arrived', 'track'], intent: 'order' },
    { keywords: ['login', 'account', 'password', 'subscription'], intent: 'account' },
    { keywords: ['down', 'crashing', 'freeze', 'not working', 'outage', 'service'], intent: 'technical' },
    { keywords: ['return', 'policy', 'damaged'], intent: 'return' },
  ];

  let bestUrgency = 'low';
  let bestScore = -1;

  thresholdMap.forEach(rule => {
    const score = rule.keywords.reduce((count, keyword) => count + (message.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestUrgency = rule.urgency;
    }
  });

  const matchedIntent = intentMap.find(rule => rule.keywords.some(keyword => message.includes(keyword))) || { intent: 'general' };
  const actionMap = {
    critical: 'escalate_immediately',
    high: 'human_needed',
    medium: 'human_needed',
    low: 'auto_reply',
  };

  return {
    urgency: bestUrgency,
    intent: matchedIntent.intent,
    action: actionMap[bestUrgency] || 'auto_reply',
    confidence: bestScore > 0 ? 'moderate' : 'low',
  };
}

function getSmartFallbackReply(userMessage, business, previousMessages = []) {
  const bName = capitalizeBusinessName(business?.businessName) || 'Acme';
  const msg = userMessage.toLowerCase();
  const priorUserMessages = (previousMessages || [])
    .filter(entry => entry?.role === 'user' && typeof entry?.content === 'string')
    .map(entry => entry.content.trim())
    .filter(Boolean);

  const lastUserMessage = priorUserMessages[priorUserMessages.length - 1] || '';
  const rememberedName = extractKnownUserName(previousMessages);

  if (msg.includes('what was my last message') || msg.includes('what did i just say') || msg.includes('what did i ask')) {
    return lastUserMessage ? `Your last message was: "${lastUserMessage}".` : 'I do not have a previous message in this chat yet.';
  }

  if (msg.includes('my name') || msg.includes('what is my name') || msg.includes('who am i')) {
    if (rememberedName) {
      return `You told me your name is ${rememberedName}.`;
    }
    return 'I do not know your name yet. Tell me your name and I will remember it.';
  }

  // 1. FAQ Matcher
  if (business?.faqs?.length) {
    for (const faq of business.faqs) {
      const q = faq.question.toLowerCase();
      const keywords = q.split(' ').filter(w => w.length > 3);
      if (keywords.length > 0 && keywords.some(kw => msg.includes(kw))) {
        return faq.answer;
      }
    }
  }

  // 2. Bill / Invoice / Payment Intent
  if (msg.includes('bill') || msg.includes('invoice') || msg.includes('payment') || msg.includes('receipt') || msg.includes('charge')) {
    return "Yes, absolutely! You can share your bill details or invoice number right here. If you need payment processing or refund help, I can also log this for our team.";
  }

  // 3. Identity / Who are you / Who am I
  if (msg.includes('who am i') || msg.includes('who are you') || msg.includes('what is this') || msg.includes('ai?')) {
    const aiName = `${bName}’s Allié`;
    return `I am ${aiName}, the dedicated AI support assistant for ${bName}. How can I assist you today?`;
  }

  // 4. Store Hours / Operating Timing Intent
  if (msg.includes('hour') || msg.includes('time') || msg.includes('open') || msg.includes('close') || msg.includes('timing')) {
    if (business?.storeContact?.hours) {
      return `Our store operating hours are: ${business.storeContact.hours}. Feel free to drop by or reach out during these times!`;
    }
  }

  // 5. Store Location / Address / Directions Intent
  if (msg.includes('location') || msg.includes('where') || msg.includes('address') || msg.includes('map') || msg.includes('directions')) {
    if (business?.location?.address) {
      const city = business.location.city ? `, ${business.location.city}` : '';
      const country = business.location.country ? ` (${business.location.country})` : '';
      const map = business.location.mapsUrl ? ` Directions link: ${business.location.mapsUrl}` : '';
      return `Our store is located at: ${business.location.address}${city}${country}.${map}`;
    }
  }

  // 6. Contact / Phone / Email Support Intent
  if (msg.includes('contact') || msg.includes('support') || msg.includes('phone') || msg.includes('call') || msg.includes('email') || msg.includes('helpline')) {
    const p = business?.storeContact?.phone ? `Helpline: ${business.storeContact.phone}` : '';
    const e = business?.storeContact?.supportEmail ? `Email: ${business.storeContact.supportEmail}` : '';
    if (p || e) {
      return `You can directly reach our customer care team at: ${[p, e].filter(Boolean).join(' | ')}.`;
    }
    return `Our support team is ready to assist! You can share your question or contact info here, and we'll follow up with you.`;
  }

  // 7. Identity / Who are you
  if (msg.includes('who am i') || msg.includes('who are you') || msg.includes('what is this') || msg.includes('ai?')) {
    return `I am ${bName}’s Allié, your dedicated customer support assistant for ${bName}. How can I help you today?`;
  }

  // 8. Default intelligent response for any query
  return `As ${bName}’s Allié, I am happy to help with your inquiry about "${userMessage}". Feel free to ask any question about ${bName}'s products, store hours, or services!`;
}

function getOrCreateSessionConversation(sessionId, businessId) {
  const existing = inMemoryConversationStore.get(sessionId);
  if (existing) {
    existing.businessId = businessId;
    if (!Array.isArray(existing.messages)) existing.messages = [];
    if (!Array.isArray(existing.unresolvedTopics)) existing.unresolvedTopics = [];
    return existing;
  }

  const created = {
    businessId,
    sessionId,
    customerName: '',
    messages: [],
    unresolvedTopics: [],
    _isPlain: true,
  };

  inMemoryConversationStore.set(sessionId, created);
  persistSessionState(sessionId, created);
  return created;
}

// Handler supporting both POST /api/chat and POST /api/chat/message
async function handleChatMessage(req, res) {
  try {
    const sessionId = req.body.sessionId;
    const businessId = req.body.businessId;
    const userMessage = (req.body.userMessage || req.body.message || '').trim();

    if (!sessionId || !userMessage || !businessId) {
      return res.status(400).json({ error: 'sessionId, message, and businessId are required' });
    }

    // Strip punctuation to normalize greetings (e.g., "hi'", "hi!", "hello...")
    const normalized = userMessage.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const isGreeting = GREETING_WORDS.some(w => normalized === w || normalized.startsWith(w + " "));

    const dbReady = mongoose.connection.readyState === 1;

    let business = null;
    if (dbReady) {
      try {
        business = await Business.findById(businessId);
      } catch (dbErr) {
        // Skip DB if error
      }
    }

    const businessName = capitalizeBusinessName(business?.businessName) || 'Acme';
    const description = business?.description || 'We provide 24/7 customer support.';
    const faqList = (business?.faqs || [])
      .map(faq => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join('\n\n');

    let conversation = inMemoryConversationStore.get(sessionId) || null;
    if (dbReady) {
      try {
        const dbConversation = await Conversation.findOne({ sessionId });
        if (dbConversation) {
          conversation = conversation && Array.isArray(conversation.messages) && conversation.messages.length > (dbConversation.messages || []).length
            ? conversation
            : dbConversation;
        }
      } catch (dbErr) { /* skip */ }
    }

    if (!conversation) {
      conversation = getOrCreateSessionConversation(sessionId, businessId);
    }

    if (conversation && !Array.isArray(conversation.messages)) {
      conversation.messages = [];
    }
    if (conversation && !Array.isArray(conversation.unresolvedTopics)) {
      conversation.unresolvedTopics = [];
    }
    persistSessionState(sessionId, conversation);

    // ── Prepare response ──────────────────────────────────────────────────────
    const urgencyInfo = classifyMessageUrgency(userMessage);
    let aiReplyText = '';

   const rememberedName = resolveRememberedName(sessionId, conversation.messages || [], conversation);
   const rememberedIdentityResponse = getRememberedIdentityResponse(userMessage, rememberedName);

   const nameMatch = userMessage.match(/(?:my name is|i am|i['’]?m|i'm|call me|you can call me|^am)\s+([a-z][a-z' -]{1,30})/i);
   if (nameMatch && nameMatch[1]) {
     const extractedName = nameMatch[1].trim();
     conversation.customerName = extractedName;
     persistSessionState(sessionId, conversation);
   }

   if (isGreeting) {
     aiReplyText = `Hello! Welcome to ${businessName}. How can I help you today?`;
   } else if (rememberedIdentityResponse) {
     aiReplyText = rememberedIdentityResponse;
   } else {
     const systemPrompt = `You are ${businessName ? `${businessName}’s Allié` : `Allié`}, the dedicated AI customer assistant for ${businessName}.
   
STORE KNOWLEDGE BASE & OVERVIEW:
${description}
   
FAQS:
${faqList || "None provided"}
   
USER MEMORY:
${rememberedName ? `The user previously told you their name is ${rememberedName}. Use it naturally when relevant.` : 'No remembered user name yet.'}
   
URGENT SUPPORT TRAINING DATA:
${buildUrgencyTrainingExamples()}
   
PRIORITY RULES:
- If the customer message is about a service outage, account compromise, security issue, fraud, or a total outage, classify as critical.
- If the message is about duplicate payment, refund dispute, missing order, failed payment, or lockout, classify as high.
- If the message is about delayed shipment, login trouble, partial service issues, or recurring bugs, classify as medium.
- If the message is informational or an FAQ, classify as low.
- When a message is critical or high urgency, do not give a generic answer. Acknowledge urgency and suggest human follow-up or escalation.
   
YOUR INSTRUCTIONS:
1. You are ${businessName}’s Allié, the dedicated AI assistant for ${businessName}. Your name is ${businessName}’s Allié. Always capitalize the company name properly as "${businessName}" (never write it in lowercase).
2. You can answer ANYTHING the user asks (general knowledge, science, math, technology, recommendations, store questions, products, policies, or general conversation).
3. For questions about store products, FAQs, shipping, or business details, use the STORE KNOWLEDGE BASE above.
4. For any other query, question, or task, answer helpfully, accurately, and intelligently as ${businessName}’s Allié.
5. Keep answers engaging, polite, and concise (1-4 sentences).
6. Detect the customer urgency: ${urgencyInfo.urgency} and intent: ${urgencyInfo.intent}. Use this to shape the answer and escalation tone.
7. If the user asks who you are, say: "I am ${businessName ? `${businessName}’s Allié` : `Allié`}, the AI support assistant for ${businessName}."
8. If the user asks who they are, or asks about their name, use the USER MEMORY above and answer naturally.`;
 
     const history = (conversation.messages || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const geminiApiKey = getGeminiApiKey('agent');
      const candidateModels = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite'];

      for (const modelName of candidateModels) {
        if (aiReplyText) break;
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000), // 10-second timeout
            body: JSON.stringify({
              contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const extracted = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (extracted) {
              aiReplyText = extracted.trim();
            }
          }
        } catch (apiErr) {
          // Timeout or API error -> fallback immediately
        }
      }

      if (!aiReplyText) {
        aiReplyText = getSmartFallbackReply(userMessage, business, conversation.messages || []);
      }
    }

    // ── Flag unresolved ONLY if explicitly matched AND NOT a greeting ───────
    const cantAnswer = !isGreeting && CANT_ANSWER_PHRASES.some(phrase =>
      aiReplyText.toLowerCase().includes(phrase)
    );

    if (cantAnswer) {
      conversation.unresolvedTopics.push({
        question: userMessage,
        timestamp: new Date(),
      });
    }

    const isEscalated = cantAnswer ||
      urgencyInfo.action === 'escalate_immediately' ||
      urgencyInfo.action === 'human_needed' ||
      ['critical', 'high'].includes(urgencyInfo.urgency) ||
      /(?:speak|talk|reach|connect|representative|human|agent|support team|outage|refund|chargeback|dispute|damaged|broken|lawyer|sue)/i.test(userMessage) ||
      /(?:flagged with high priority|human representative will be in touch|connect you with|touch with you shortly)/i.test(aiReplyText);

    const isUrgent = ['critical', 'high'].includes(urgencyInfo.urgency) || /(?:urgent|emergency|asap|outage|fraud|stolen|compromised)/i.test(userMessage);

    conversation.isEscalated = isEscalated;
    conversation.priority = isUrgent ? 'urgent' : (isEscalated ? 'escalated' : urgencyInfo.urgency);

    conversation.messages.push({
      role: 'user',
      content: userMessage,
      urgency: urgencyInfo.urgency,
      intent: urgencyInfo.intent,
    });
    conversation.messages.push({
      role: 'ai',
      content: aiReplyText,
      flagged: cantAnswer || isEscalated,
      urgency: urgencyInfo.urgency,
      intent: urgencyInfo.intent,
    });
    persistSessionState(sessionId, conversation);

    if (dbReady) {
      try {
        let dbConv = await Conversation.findOne({ sessionId });
        if (!dbConv) {
          dbConv = new Conversation({
            businessId,
            sessionId,
            customerName: conversation.customerName || 'Customer',
            priority: conversation.priority || (isUrgent ? 'urgent' : (isEscalated ? 'escalated' : 'normal')),
            status: isEscalated ? 'open' : 'resolved',
            isEscalated: isEscalated,
            repliedByAdmin: false,
            messages: conversation.messages,
            unresolvedTopics: conversation.unresolvedTopics || [],
          });
        } else {
          dbConv.messages = conversation.messages;
          dbConv.unresolvedTopics = conversation.unresolvedTopics || [];
          if (isEscalated) {
            dbConv.isEscalated = true;
            dbConv.status = 'open';
          }
          if (isUrgent) {
            dbConv.priority = 'urgent';
          } else if (isEscalated && dbConv.priority !== 'urgent') {
            dbConv.priority = 'escalated';
          }
          if (conversation.customerName) dbConv.customerName = conversation.customerName;
        }
        await dbConv.save();
        conversation._id = dbConv._id;
      } catch (saveErr) {
        console.warn('Conversation save failed:', saveErr.message);
      }
    }

    inMemoryConversationStore.set(sessionId, conversation);
    if (userNameMemoryStore.has(sessionId)) {
      const storedName = userNameMemoryStore.get(sessionId);
      if (storedName && Array.isArray(conversation.messages)) {
        conversation.messages = conversation.messages.map(msg => {
          if (msg && msg.role === 'user' && typeof msg.content === 'string' && /(?:my name is|i am|i'm|call me|you can call me)/i.test(msg.content)) {
            return { ...msg, content: msg.content.replace(/(?:my name is|i am|i'm|call me|you can call me)\s+([a-z][a-z' -]{1,30})/i, `my name is ${storedName}`) };
          }
          return msg;
        });
      }
    }

    return res.status(200).json({
      reply: aiReplyText,
      flagged: cantAnswer,
      urgency: urgencyInfo.urgency,
      intent: urgencyInfo.intent,
      recommendedAction: urgencyInfo.action,
      sessionId: conversation.sessionId,
    });

  } catch (err) {
    console.error('Chat error:', err);
    return res.status(200).json({
      reply: "Hello! How can I help you today?",
      flagged: false,
      sessionId: req.body.sessionId || 'sess_default',
    });
  }
}

router.post('/', handleChatMessage);
router.post('/message', handleChatMessage);

// POST /api/chat/feedback
router.post('/feedback', async (req, res) => {
  try {
    const { sessionId, rating } = req.body;

    if (!sessionId || !['up', 'down'].includes(rating)) {
      return res.status(400).json({ error: 'sessionId and rating (up|down) are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { sessionId },
      { rating },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.status(200).json({ sessionId, rating: conversation.rating });
  } catch (err) {
    console.error('Feedback error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/chat/messages/:sessionId — Customer live message sync
router.get('/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    let messages = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const dbConv = await Conversation.findOne({ sessionId });
        if (dbConv && Array.isArray(dbConv.messages)) {
          messages = dbConv.messages;
        }
      } catch (dbErr) { /* skip */ }
    }

    if (!messages.length) {
      const memConv = inMemoryConversationStore.get(sessionId);
      if (memConv && Array.isArray(memConv.messages)) {
        messages = memConv.messages;
      }
    }

    return res.status(200).json({ messages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
