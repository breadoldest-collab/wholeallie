import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, Clock, RefreshCw, Maximize2, Minimize2, Square } from 'lucide-react';
import API from '../api/axios';
import AITextLoading from './ui/ai-text-loading';

const CREATIVE_THINKING_MESSAGES = [
  "Consulting the support stars...",
  "Sifting through customer insights...",
  "Connecting the neural dots...",
  "Analyzing store telemetry...",
  "Crunching customer sentiment...",
  "Checking the conversation pulse...",
  "Brewing fresh intelligence...",
  "Synthesizing conversational memory...",
  "Pondering the smartest answer...",
  "Scanning recent store chatter...",
  "Cross-referencing customer history...",
  "Translating data into insights...",
  "Polishing actionable recommendations...",
  "Deciphering customer signals...",
  "Synthesizing business context...",
  "Tuning into your store frequency...",
  "Unlocking conversational intelligence...",
  "Formulating the perfect response...",
  "Distilling chat analytics...",
  "Thinking through the details...",
];

function shuffleThinking(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const cleanText = (txt) => {
  if (!txt) return '';
  return txt
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
};

export default function AdminCopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I am Owner's Allié, your intelligent store copilot. Ask me about pending chats, customer issues, or request a summary of today's conversations!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingTexts, setThinkingTexts] = useState(() => shuffleThinking(CREATIVE_THINKING_MESSAGES));
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '[Analysis stopped by admin]' },
    ]);
  };

  const handleSend = async (userPrompt) => {
    const query = (userPrompt || input).trim();
    if (!query) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!userPrompt) setInput('');

    // Prepare full conversation history for multi-turn conversational memory
    const historyPayload = messages
      .filter((m) => m && m.content && m.content !== '[Analysis stopped by admin]')
      .slice(-12)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

    // Randomize creative thinking thoughts for this turn
    setThinkingTexts(shuffleThinking(CREATIVE_THINKING_MESSAGES));

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await API.post('/api/conversations/assistant', {
        prompt: query,
        history: historyPayload,
      }, {
        signal: controller.signal,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reply || 'Here is your conversation summary.' },
      ]);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble fetching the conversation insights. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const quickChips = [
    { label: 'Summarize pending chats', prompt: 'Summarize all pending and open customer conversations.' },
    { label: 'How many open chats?', prompt: 'How many open conversations are currently pending review?' },
    { label: 'What are common issues?', prompt: 'What are the main issues customers are asking about today?' },
  ];

  return (
    <>
      {/* ── Floating Launcher Button ──────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            borderRadius: 9999,
            background: '#6434df',
            color: '#ffffff',
            border: '3px solid #252b3a',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '6px 6px 0 0 #252b3a',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translate(0, 0)')}
        >
          <Sparkles size={18} />
          <span>Owner's Allié</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#9bf1cd',
              display: 'inline-block',
              border: '2px solid #252b3a',
            }}
          />
        </button>
      )}

      {/* ── Assistant Chat Modal / Drawer ─────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: isExpanded ? 'min(840px, calc(100vw - 36px))' : 400,
            height: isExpanded ? 'min(760px, calc(100vh - 48px))' : 540,
            minWidth: 340,
            minHeight: 440,
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 36px)',
            resize: 'both',
            overflow: 'hidden',
            background: '#fffdf5',
            border: '3px solid #252b3a',
            borderRadius: 22,
            boxShadow: '12px 12px 0 0 #252b3a',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--dp-typography-reading), sans-serif',
            transition: 'width 0.2s ease, height 0.2s ease',
            animation: 'slideUp 0.2s ease',
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: '#f1ebff',
              color: '#252b3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '3px solid #252b3a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#9bf1cd',
                  border: '3px solid #252b3a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                  Owner's Allié
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.85, fontWeight: 500 }}>
                  Store Intelligence &amp; Operations Copilot
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? 'Restore standard size' : "Expand / Maximize Owner's Allié"}
                style={{
                  background: '#ffffff',
                  border: '2px solid #252b3a',
                  color: '#252b3a',
                  cursor: 'pointer',
                  padding: 5,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0 0 rgba(37,43,58,0.12)',
                }}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Owner's Allié"
                style={{
                  background: '#ffffff',
                  border: '2px solid #252b3a',
                  color: '#252b3a',
                  cursor: 'pointer',
                  padding: 5,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0 0 rgba(37,43,58,0.12)',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Chips */}
          <div
            style={{
              padding: '10px 14px',
              background: '#f8fafc',
              borderBottom: '1px solid #eaecf0',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.prompt)}
                disabled={loading}
                style={{
                  padding: '5px 10px',
                  borderRadius: 9999,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#252b3a';
                  e.currentTarget.style.color = '#252b3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: '#ffffff',
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: msg.role === 'user' ? '#6434df' : '#9bf1cd',
                    border: '2px solid #252b3a',
                    color: msg.role === 'user' ? '#ffffff' : '#252b3a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {msg.role === 'user' ? 'U' : <Bot size={14} />}
                </div>

                <div
                  style={{
                    background: msg.role === 'user' ? '#6434df' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : '#252b3a',
                    border: '3px solid #252b3a',
                    borderLeft: msg.role === 'user' ? '3px solid #252b3a' : '6px solid #6434df',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                    maxWidth: '82%',
                    boxShadow: '4px 4px 0 0 rgba(37,43,58,0.12)',
                  }}
                >
                  {cleanText(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '2px 0',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#f1ebff',
                    border: '2px solid #252b3a',
                    color: '#6434df',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '2px 2px 0 0 rgba(37,43,58,0.12)',
                  }}
                >
                  <Sparkles size={14} className="text-[#6434df]" />
                </div>
                <div
                  style={{
                    background: '#fffdf5',
                    border: '2px solid #252b3a',
                    borderLeft: '4px solid #6434df',
                    borderRadius: '4px 14px 14px 14px',
                    padding: '8px 14px',
                    boxShadow: '3px 3px 0 0 rgba(37,43,58,0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    minHeight: 36,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#6434df',
                      display: 'inline-block',
                    }}
                  />
                  <AITextLoading
                    texts={thinkingTexts}
                    interval={1800}
                    className="text-xs font-bold text-[#6434df]"
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: 12,
              borderTop: '2px solid #252b3a',
              background: '#ffffff',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Owner's Allié about chats, store issues, or general questions..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '2px solid #252b3a',
                fontSize: 13,
                outline: 'none',
                color: '#252b3a',
                boxShadow: '3px 3px 0 0 rgba(37,43,58,0.12)',
              }}
            />

            {loading && (
              <button
                type="button"
                onClick={handleStop}
                title="Stop AI analysis"
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '3px solid #252b3a',
                  background: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  boxShadow: '3px 3px 0 0 #252b3a',
                  flexShrink: 0,
                }}
              >
                <Square size={13} style={{ fill: '#ffffff' }} />
                <span>Stop</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim()}
              title="Send prompt to Owner's Allié"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '3px solid #252b3a',
                background: !input.trim() ? '#f1ebff' : '#6434df',
                color: !input.trim() ? '#252b3a' : '#ffffff',
                cursor: !input.trim() ? 'not-allowed' : 'pointer',
                opacity: !input.trim() ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '3px 3px 0 0 #252b3a',
                flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
