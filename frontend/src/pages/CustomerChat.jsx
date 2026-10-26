import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Bot,
  ThumbsUp,
  ThumbsDown,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  HelpCircle,
  Package,
  CreditCard,
  X,
  MessageSquare,
  ShieldCheck,
  Store,
  MapPin,
  Globe,
  Phone,
  Clock,
  Compass,
  Share2,
  Mail,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Layers,
  User,
  Star
} from 'lucide-react';
import AITextLoading from '../components/ui/ai-text-loading';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function capitalizeBusinessName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function CustomerChat() {
  const { businessId } = useParams();
  const isDebugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'true';
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `allie_chat_session_${businessId || 'default'}`;
      const saved = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
      if (saved) {
        localStorage.setItem(storageKey, saved);
        return saved;
      }
      const newId = 'sess_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(storageKey, newId);
      sessionStorage.setItem(storageKey, newId);
      return newId;
    }
    return 'sess_' + Math.random().toString(36).substring(2, 9);
  });


  const [tabId] = useState(() => 'tab_' + Math.random().toString(36).substring(2, 10));
  const [isDuplicateTab, setIsDuplicateTab] = useState(false);

  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    botAvatar: '',
    location: null,
    socialLinks: null,
    storeContact: null,
  });

  const aiName = businessInfo.name ? `${businessInfo.name}’s Allié` : 'Allié';

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Hello! How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [copiedId, setCopiedId] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  // 1. Single Instance / Single Tab Concurrency Protection
  useEffect(() => {
    if (!businessId || typeof window === 'undefined') return;

    const lockKey = `active_chat_tab_${businessId}`;
    const channelName = `allie_chat_channel_${businessId}`;

    const claimLock = () => {
      localStorage.setItem(lockKey, tabId);
      setIsDuplicateTab(false);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'LOCK_CLAIMED', tabId });
      }
    };

    // Check existing lock
    const currentLockHolder = localStorage.getItem(lockKey);
    if (currentLockHolder && currentLockHolder !== tabId) {
      // Another tab already holds the active session
      setIsDuplicateTab(true);
    } else {
      claimLock();
    }

    // Set up BroadcastChannel
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(channelName);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        if (event.data.type === 'LOCK_CLAIMED' && event.data.tabId !== tabId) {
          // Another tab was focused or claimed the session
          setIsDuplicateTab(true);
        }
      };
    }

    // Storage event for cross-tab sync
    const handleStorage = (e) => {
      if (e.key === lockKey && e.newValue && e.newValue !== tabId) {
        setIsDuplicateTab(true);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (localStorage.getItem(lockKey) === tabId) {
        localStorage.removeItem(lockKey);
      }
    };
  }, [businessId, tabId]);

  const handleTakeoverSession = () => {
    if (!businessId) return;
    const lockKey = `active_chat_tab_${businessId}`;
    localStorage.setItem(lockKey, tabId);
    setIsDuplicateTab(false);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'LOCK_CLAIMED', tabId });
    }
  };

  // 2. Fetch Business & Store Profile details
  useEffect(() => {
    if (!businessId) return;
    axios.post(`${API_BASE}/api/support/verify`, { businessId })
      .then(res => {
        if (res.data) {
          const bName = capitalizeBusinessName(res.data.businessName) || 'Acme';
          setBusinessInfo({
            name: bName,
            botAvatar: res.data.botAvatarUrl || res.data.logoUrl || '',
            location: res.data.location || null,
            socialLinks: res.data.socialLinks || null,
            storeContact: res.data.storeContact || null,
            storeRating: res.data.storeRating || { average: 4.8, totalReviews: 24 },
          });

          // Personalize greeting if no prior conversation messages exist
          setMessages(prev => {
            if (prev && prev.length > 1) return prev;
            return [
              {
                role: 'ai',
                content: `Hello! I am ${bName}’s Allié. How can I help you today?`,
              },
            ];
          });
        }
      })
      .catch(err => console.error('Error fetching support business info:', err));
  }, [businessId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Real-time live sync for staff replies and updates from admin dashboard
  useEffect(() => {
    if (!sessionId) return;
    const fetchLatest = () => {
      axios.get(`${API_BASE}/api/chat/messages/${sessionId}`)
        .then(res => {
          if (res.data?.messages && Array.isArray(res.data.messages) && res.data.messages.length > 0) {
            const formatted = res.data.messages.map(m => ({
              role: m.role,
              content: m.content,
              intent: m.intent,
              flagged: m.flagged,
            }));
            setMessages(prev => {
              // Restore full conversation history if only greeting is currently shown
              if (!prev || prev.length <= 1) {
                return formatted;
              }
              if (formatted.length > prev.length) {
                return formatted;
              }
              const lastLocal = prev[prev.length - 1];
              const lastServer = formatted[formatted.length - 1];
              if (lastServer && lastLocal && lastServer.content !== lastLocal.content) {
                return formatted;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 2500);
    return () => clearInterval(interval);
  }, [sessionId]);

  const starterChips = [
    { label: 'Store Hours & Location', query: `What are ${businessInfo.name || 'your store'}’s physical location and working hours?`, icon: MapPin },
    { label: 'Product & Order Support', query: 'Can you help me check order status and product availability?', icon: Package },
    { label: 'Return & Exchange Policy', query: 'What is your return, exchange, or refund policy?', icon: HelpCircle },
    { label: 'Payment & Helpline', query: 'What payment options do you support, and how do I speak to support?', icon: CreditCard },
  ];

  const handleSend = async (manualText = null) => {
    const textToSend = (manualText || input).trim();
    if (!textToSend || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!manualText) setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, {
        businessId,
        sessionId,
        message: textToSend,
        userMessage: textToSend,
      });

      const aiResponse = {
        role: 'ai',
        content: response.data.reply || "I'm having trouble processing that right now. Please try again.",
        flagged: response.data.flagged || false,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: 'Sorry, I am having trouble connecting right now. Please try again shortly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgIndex, rating) => {
    setFeedbackGiven(prev => ({ ...prev, [msgIndex]: rating }));
    try {
      await axios.post(`${API_BASE}/api/chat/feedback`, {
        sessionId,
        rating,
      });
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  const resetSession = () => {
    const newId = 'sess_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newId);
    if (typeof window !== 'undefined') {
      const storageKey = `allie_chat_session_${businessId || 'default'}`;
      localStorage.setItem(storageKey, newId);
      sessionStorage.setItem(storageKey, newId);
    }
    setMessages([
      {
        role: 'ai',
        content: businessInfo.name
          ? `Hello! I am ${businessInfo.name}’s Allié. How can I help you today?`
          : 'Hello! I am Allié. How can I help you today?',
      },
    ]);
    setFeedbackGiven({});
  };

  // If a duplicate tab was opened, show single instance protection screen
  if (isDuplicateTab) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#fffdf5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
          fontFamily: 'var(--dp-typography-reading), sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 500,
            width: '100%',
            background: '#ffffff',
            border: '3px solid #252b3a',
            borderRadius: 24,
            padding: 32,
            boxShadow: '8px 8px 0 0 #252b3a',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: '#fef08a',
              border: '3px solid #252b3a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0 0 #252b3a',
              marginBottom: 18,
            }}
          >
            <ShieldAlert size={28} style={{ color: '#854d0e' }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#252b3a', margin: '0 0 10px', textTransform: 'uppercase' }}>
            Session Active in Another Tab
          </h2>

          <p style={{ fontSize: 14, color: '#4d586d', lineHeight: 1.6, margin: '0 0 24px' }}>
            To prevent duplicated messages and ensure continuous conversation state, only <strong>1 active chat instance</strong> is permitted at a time.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={handleTakeoverSession}
              style={{
                background: '#6434df',
                color: '#ffffff',
                border: '3px solid #252b3a',
                borderRadius: 14,
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '4px 4px 0 0 #252b3a',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              Use Chat in This Window
            </button>

            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              Or return to your previous tab to continue chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#fffdf5',
        fontFamily: 'var(--dp-typography-reading), sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 1. TOP HEADER BAR (Edge-to-Edge Full Screen) */}
      <header
        style={{
          height: 68,
          borderBottom: '3px solid #252b3a',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxSizing: 'border-box',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: '#9bf1cd',
              border: '3px solid #252b3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0 0 #252b3a',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {businessInfo.botAvatar ? (
              <img
                src={businessInfo.botAvatar}
                alt={businessInfo.name || 'Assistant'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Bot size={22} style={{ color: '#252b3a' }} />
            )}
            {/* Live Indicator */}
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #ffffff',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  margin: 0,
                  color: '#252b3a',
                  letterSpacing: '-0.02em',
                }}
              >
                {aiName}
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#e9fff5',
                  color: '#0f7a57',
                  border: '2px solid #252b3a',
                  boxShadow: '2px 2px 0 0 #252b3a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles size={11} /> AI Assistant
              </span>
            </div>

            {isDebugMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>
                  ID: {sessionId}
                </span>
                <button
                  type="button"
                  onClick={copySessionId}
                  title="Copy Session ID"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  {copiedId ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                  {copiedId ? 'Copied' : ''}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Creative Store Hub Button */}
          <button
            type="button"
            onClick={() => setStoreDrawerOpen(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: storeDrawerOpen ? '#6434df' : '#ffd05b',
              color: storeDrawerOpen ? '#ffffff' : '#252b3a',
              border: '3px solid #252b3a',
              borderRadius: 12,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '3px 3px 0 0 #252b3a',
              transition: 'all 0.15s ease',
            }}
          >
            <Store size={15} />
            <span>Store Hub & Map</span>
            {businessInfo.location?.city && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: 999,
                  background: storeDrawerOpen ? '#ffd05b' : '#ffffff',
                  color: '#252b3a',
                  border: '1px solid #252b3a',
                }}
              >
                {businessInfo.location.city}
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: 999,
                background: '#fffbeb',
                color: '#b45309',
                border: '1px solid #f59e0b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Star size={9} style={{ fill: '#f59e0b', color: '#b45309' }} />
              {businessInfo.storeRating?.average?.toFixed(1) || '4.8'}/5
            </span>
          </button>

          <button
            type="button"
            onClick={resetSession}
            title="Start a new chat conversation"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ffffff',
              color: '#252b3a',
              border: '3px solid #252b3a',
              borderRadius: 12,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '3px 3px 0 0 #252b3a',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* 2. BODY SPLIT: MAIN FULL-SCREEN CHAT STREAM + COLLAPSIBLE STORE HUB */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Main Chat Stream Container */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            background: '#fffdf5',
          }}
        >
          {/* Scrollable Conversation Thread (Centered with comfortable reading width) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 840,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* Quick Starter Topics (Shows when chat is just started) */}
              {messages.length <= 2 && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '3px solid #252b3a',
                    borderRadius: 20,
                    padding: 18,
                    boxShadow: '4px 4px 0 0 #252b3a',
                    marginBottom: 10,
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 900, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Popular Customer Topics for {businessInfo.name || 'Store'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {starterChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(chip.query)}
                        style={{
                          background: '#fffdf5',
                          border: '2px solid #252b3a',
                          borderRadius: 12,
                          padding: '8px 14px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#252b3a',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '2px 2px 0 0 #252b3a',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translate(-2px, -2px)';
                          e.currentTarget.style.boxShadow = '4px 4px 0 0 #252b3a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '2px 2px 0 0 #252b3a';
                        }}
                      >
                        <chip.icon size={13} style={{ color: '#6434df' }} />
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isStaff = !isUser && (msg.intent === 'staff_reply' || (typeof msg.content === 'string' && msg.content.startsWith('[Staff Support]:')));
                const displayContent = typeof msg.content === 'string' ? msg.content.replace(/^\[Staff Support\]:\s*/, '') : msg.content;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {/* Message Sender Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingLeft: isUser ? 0 : 6, paddingRight: isUser ? 6 : 0 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: isStaff ? '#0f7a57' : '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        {isUser ? 'You' : (isStaff ? `Support Staff (${businessInfo.name || 'Acme'})` : aiName)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: isUser ? '85%' : '90%' }}>
                      {!isUser && (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: isStaff ? '#ffd05b' : '#9bf1cd',
                            border: '2px solid #252b3a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '2px 2px 0 0 #252b3a',
                            flexShrink: 0,
                            overflow: 'hidden',
                            marginTop: 2,
                          }}
                        >
                          {isStaff ? (
                            <User size={16} style={{ color: '#252b3a' }} />
                          ) : businessInfo.botAvatar ? (
                            <img src={businessInfo.botAvatar} alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Bot size={16} style={{ color: '#252b3a' }} />
                          )}
                        </div>
                      )}

                      <div
                        style={{
                          padding: '14px 18px',
                          borderRadius: isUser ? '20px 20px 6px 20px' : '6px 20px 20px 20px',
                          fontSize: 14,
                          lineHeight: 1.6,
                          background: isUser ? '#6434df' : '#ffffff',
                          color: isUser ? '#ffffff' : '#252b3a',
                          border: '3px solid #252b3a',
                          borderLeft: isUser ? '3px solid #252b3a' : (isStaff ? '6px solid #10b981' : '6px solid #6434df'),
                          boxShadow: '4px 4px 0 0 #252b3a',
                          wordBreak: 'break-word',
                        }}
                      >
                        {displayContent}
                      </div>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => copyMessage(msg.content, idx)}
                          title="Copy message"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: 4,
                            marginTop: 6,
                          }}
                        >
                          {copiedMsgIdx === idx ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>

                    {/* AI Feedback & Action Row */}
                    {!isUser && idx > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginLeft: 42 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Helpful?</span>
                        <button
                          type="button"
                          onClick={() => handleFeedback(idx, 'up')}
                          disabled={!!feedbackGiven[idx]}
                          style={{
                            background: feedbackGiven[idx] === 'up' ? '#e9fff5' : 'transparent',
                            border: '1.5px solid #252b3a',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: feedbackGiven[idx] === 'up' ? '#0f7a57' : '#252b3a',
                          }}
                        >
                          <ThumbsUp size={11} /> Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(idx, 'down')}
                          disabled={!!feedbackGiven[idx]}
                          style={{
                            background: feedbackGiven[idx] === 'down' ? '#fee2e2' : 'transparent',
                            border: '1.5px solid #252b3a',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: feedbackGiven[idx] === 'down' ? '#b91c1c' : '#252b3a',
                          }}
                        >
                          <ThumbsDown size={11} /> No
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* AI Processing Animation */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#9bf1cd',
                      border: '2px solid #252b3a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '2px 2px 0 0 #252b3a',
                    }}
                  >
                    <Bot size={16} style={{ color: '#252b3a' }} />
                  </div>
                  <div
                    style={{
                      padding: '12px 18px',
                      borderRadius: '6px 20px 20px 20px',
                      background: '#ffffff',
                      border: '3px solid #252b3a',
                      borderLeft: '6px solid #6434df',
                      boxShadow: '4px 4px 0 0 #252b3a',
                    }}
                  >
                    <AITextLoading
                      texts={[
                        `${aiName} is checking store catalog...`,
                        'Formulating answer...',
                        'Almost ready...',
                      ]}
                      interval={1500}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Dock Input Bar (Full width, centered input box) */}
          <div
            style={{
              padding: '16px 24px 20px',
              borderTop: '3px solid #252b3a',
              background: '#ffffff',
              boxSizing: 'border-box',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                width: '100%',
                maxWidth: 840,
                margin: '0 auto',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  placeholder={`Ask ${aiName} about products, location, policies, or store hours...`}
                  style={{
                    width: '100%',
                    background: '#fffdf5',
                    border: '3px solid #252b3a',
                    borderRadius: 16,
                    padding: '14px 44px 14px 18px',
                    fontSize: 15,
                    color: '#252b3a',
                    outline: 'none',
                    boxShadow: '4px 4px 0 0 #252b3a',
                    boxSizing: 'border-box',
                  }}
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    style={{
                      position: 'absolute',
                      right: 14,
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  background: loading || !input.trim() ? '#f1ebff' : '#6434df',
                  color: loading || !input.trim() ? '#252b3a' : '#ffffff',
                  border: '3px solid #252b3a',
                  borderRadius: 16,
                  padding: '14px 22px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '4px 4px 0 0 #252b3a',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>

            <p style={{ textAlign: 'center', margin: '8px 0 0', fontSize: 11, color: '#94a3b8' }}>
              AI assistant for {businessInfo.name || 'Acme'}. It can make mistakes.
            </p>
          </div>
        </main>

        {/* 3. CREATIVE SLIDE-OUT STORE DETAILS & LOCATION HUB */}
        <aside
          style={{
            width: storeDrawerOpen ? 380 : 0,
            maxWidth: '90vw',
            height: '100%',
            background: '#fffdf5',
            borderLeft: storeDrawerOpen ? '3px solid #252b3a' : 'none',
            transition: 'width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            zIndex: 9,
          }}
        >
          <div style={{ width: 380, height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 20, boxSizing: 'border-box', gap: 16 }}>
            {/* Hub Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #252b3a', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#ffd05b',
                    border: '2px solid #252b3a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  <Store size={18} style={{ color: '#252b3a' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#252b3a' }}>
                    {businessInfo.name || 'Store'} Hub
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Storefront, Map & Channels</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStoreDrawerOpen(false)}
                style={{
                  background: '#ffffff',
                  border: '2px solid #252b3a',
                  borderRadius: 8,
                  padding: 6,
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Store Rating Card (Average out of 5) */}
            <div
              style={{
                background: '#fffbeb',
                border: '2px solid #252b3a',
                borderRadius: 16,
                padding: 16,
                boxShadow: '3px 3px 0 0 #252b3a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#854d0e' }}>
                  Store Rating
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309' }}>
                  {businessInfo.storeRating?.totalReviews || 24} Verified Reviews
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#252b3a', fontFamily: 'var(--dp-typography-display), sans-serif' }}>
                  {businessInfo.storeRating?.average?.toFixed(1) || '4.8'}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        size={15}
                        style={{
                          fill: starIdx <= Math.round(businessInfo.storeRating?.average || 4.8) ? '#f59e0b' : '#cbd5e1',
                          color: starIdx <= Math.round(businessInfo.storeRating?.average || 4.8) ? '#b45309' : '#94a3b8',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: '#854d0e', fontWeight: 700 }}>
                    Average Customer Satisfaction (out of 5)
                  </span>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #252b3a',
                borderRadius: 16,
                padding: 16,
                boxShadow: '3px 3px 0 0 #252b3a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin size={16} style={{ color: '#6434df' }} />
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  Store Location
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#252b3a', lineHeight: 1.4 }}>
                {businessInfo.location?.address || 'Store address not set yet.'}
              </p>
              {(businessInfo.location?.city || businessInfo.location?.country) && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4d586d' }}>
                  {businessInfo.location.city} {businessInfo.location.country}
                </p>
              )}

              {businessInfo.location?.mapsUrl && (
                <a
                  href={businessInfo.location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f1ebff',
                    color: '#6434df',
                    border: '2px solid #252b3a',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                    marginTop: 12,
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  <Compass size={14} />
                  <span>Get Directions on Google Maps</span>
                </a>
              )}
            </div>

            {/* Operating Hours */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #252b3a',
                borderRadius: 16,
                padding: 16,
                boxShadow: '3px 3px 0 0 #252b3a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                    Store Hours
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#e9fff5',
                    color: '#0f7a57',
                    border: '1px solid #0f7a57',
                  }}
                >
                  Open Today
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#252b3a' }}>
                {businessInfo.storeContact?.hours || 'Standard Business Hours (9:00 AM - 6:00 PM)'}
              </p>
            </div>

            {/* Direct Helpline & Support Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {businessInfo.storeContact?.phone && (
                <a
                  href={`tel:${businessInfo.storeContact.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#e9fff5',
                    border: '2px solid #252b3a',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#0f7a57',
                    textDecoration: 'none',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={15} />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{businessInfo.storeContact.phone}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Call</span>
                </a>
              )}

              {businessInfo.storeContact?.supportEmail && (
                <a
                  href={`mailto:${businessInfo.storeContact.supportEmail}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    border: '2px solid #252b3a',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#252b3a',
                    textDecoration: 'none',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={15} style={{ color: '#6434df' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, wordBreak: 'break-all' }}>{businessInfo.storeContact.supportEmail}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Email</span>
                </a>
              )}
            </div>

            {/* Social Media & Media Links */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #252b3a',
                borderRadius: 16,
                padding: 16,
                boxShadow: '3px 3px 0 0 #252b3a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Share2 size={16} style={{ color: '#252b3a' }} />
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  Media & Online Channels
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {businessInfo.socialLinks?.website && (
                  <a
                    href={businessInfo.socialLinks.website.startsWith('http') ? businessInfo.socialLinks.website : `https://${businessInfo.socialLinks.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#f1ebff',
                      color: '#6434df',
                      border: '2px solid #252b3a',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    <Globe size={13} />
                    <span>Website</span>
                  </a>
                )}
                {businessInfo.socialLinks?.instagram && (
                  <a
                    href={businessInfo.socialLinks.instagram.startsWith('http') ? businessInfo.socialLinks.instagram : `https://instagram.com/${businessInfo.socialLinks.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fffdf5',
                      color: '#e1306c',
                      border: '2px solid #252b3a',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    <Share2 size={13} />
                    <span>Instagram</span>
                  </a>
                )}
                {businessInfo.socialLinks?.twitter && (
                  <a
                    href={businessInfo.socialLinks.twitter.startsWith('http') ? businessInfo.socialLinks.twitter : `https://x.com/${businessInfo.socialLinks.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fffdf5',
                      color: '#252b3a',
                      border: '2px solid #252b3a',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    <Share2 size={13} />
                    <span>Twitter/X</span>
                  </a>
                )}
                {businessInfo.socialLinks?.facebook && (
                  <a
                    href={businessInfo.socialLinks.facebook.startsWith('http') ? businessInfo.socialLinks.facebook : `https://${businessInfo.socialLinks.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fffdf5',
                      color: '#1877f2',
                      border: '2px solid #252b3a',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    <Share2 size={13} />
                    <span>Facebook</span>
                  </a>
                )}
                {businessInfo.socialLinks?.linkedin && (
                  <a
                    href={businessInfo.socialLinks.linkedin.startsWith('http') ? businessInfo.socialLinks.linkedin : `https://${businessInfo.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fffdf5',
                      color: '#0a66c2',
                      border: '2px solid #252b3a',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    <Share2 size={13} />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Prompt Button: Ask About Store */}
            <button
              type="button"
              onClick={() => {
                handleSend(`Can you tell me more about ${businessInfo.name || 'your store'} and how to visit you?`);
                setStoreDrawerOpen(false);
              }}
              style={{
                background: '#6434df',
                color: '#ffffff',
                border: '2px solid #252b3a',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '3px 3px 0 0 #252b3a',
                marginTop: 'auto',
              }}
            >
              <Sparkles size={15} />
              <span>Ask AI About Store Details</span>
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
