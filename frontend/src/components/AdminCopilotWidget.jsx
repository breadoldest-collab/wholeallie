import { useState } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, Clock, RefreshCw } from 'lucide-react';
import API from '../api/axios';
import AITextLoading from './ui/ai-text-loading';

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
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I am your AI Conversation Assistant. Ask me about pending chats, customer issues, or request a summary of today\'s conversations!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (userPrompt) => {
    const query = userPrompt || input.trim();
    if (!query || loading) return;

    if (!userPrompt) setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await API.post('/api/conversations/assistant', { prompt: query });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reply || 'Here is your conversation summary.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble fetching the conversation insights. Please try again.' },
      ]);
    } finally {
      setLoading(false);
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
          <span>AI Copilot</span>
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
            bottom: 28,
            right: 28,
            width: 380,
            height: 520,
            maxHeight: 'calc(100vh - 60px)',
            background: '#fffdf5',
            border: '3px solid #252b3a',
            borderRadius: 22,
            boxShadow: '12px 12px 0 0 #252b3a',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--dp-typography-reading), sans-serif',
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
                  AI Admin Copilot
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.85, fontWeight: 500 }}>
                  Real-time Conversation Intelligence
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: '#ffffff',
                border: '2px solid #252b3a',
                color: '#252b3a',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                boxShadow: '2px 2px 0 0 rgba(37,43,58,0.12)',
              }}
            >
              <X size={18} />
            </button>
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
              <div style={{ paddingLeft: 38 }}>
                <AITextLoading
                  texts={[
                    "Thinking...",
                    "Analyzing...",
                    "Responding...",
                  ]}
                  className="text-xs font-semibold text-slate-600"
                  interval={400}
                />
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: 12,
              borderTop: '1px solid #eaecf0',
              background: '#ffffff',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about pending chats..."
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
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '3px solid #252b3a',
                background: loading || !input.trim() ? '#f1ebff' : '#6434df',
                color: loading || !input.trim() ? '#252b3a' : '#ffffff',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '3px 3px 0 0 rgba(37,43,58,0.12)',
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
