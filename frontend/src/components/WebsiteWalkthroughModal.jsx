import { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bot,
  MessageSquare,
  BarChart3,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sliders,
  Send,
  User,
  ExternalLink
} from 'lucide-react';
import GradientButton from './ui/gradient-button';

const CHAPTERS = [
  {
    id: 'chat',
    time: 0,
    duration: 35,
    title: 'AI Customer Live Chat',
    tag: 'Chapter 01',
    icon: MessageSquare,
  },
  {
    id: 'inbox',
    time: 35,
    duration: 35,
    title: 'Live Inbox & Handoff',
    tag: 'Chapter 02',
    icon: User,
  },
  {
    id: 'copilot',
    time: 70,
    duration: 35,
    title: 'AI Copilot & Telemetry',
    tag: 'Chapter 03',
    icon: BarChart3,
  },
  {
    id: 'branding',
    time: 105,
    duration: 35,
    title: 'QR Code & Custom Branding',
    tag: 'Chapter 04',
    icon: QrCode,
  },
];

const TOTAL_DURATION = 140; // 2 minutes 20 seconds

export default function WebsiteWalkthroughModal({ isOpen, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const progressRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && isOpen) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Video playback timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.5 * playbackSpeed;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed]);

  // Sync active chapter with current time
  useEffect(() => {
    let currentIdx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (currentTime >= CHAPTERS[i].time) {
        currentIdx = i;
      }
    }
    setActiveChapterIndex(currentIdx);
  }, [currentTime]);

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const jumpToChapter = (idx) => {
    setCurrentTime(CHAPTERS[idx].time);
    setActiveChapterIndex(idx);
    setIsPlaying(true);
  };

  const handleSeek = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(pct * TOTAL_DURATION);
  };

  const progressPercent = (currentTime / TOTAL_DURATION) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(37, 43, 58, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '94vh',
          background: '#fffdf5',
          border: '4px solid #252b3a',
          borderRadius: 28,
          boxShadow: '12px 12px 0 0 #252b3a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Window Bar */}
        <div
          style={{
            background: '#ffffff',
            borderBottom: '3px solid #252b3a',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff78c5', border: '2px solid #252b3a' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffd05b', border: '2px solid #252b3a' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#9bf1cd', border: '2px solid #252b3a' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: '#ff4365',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  border: '1.5px solid #252b3a',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
                Platform Tour
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#252b3a' }}>
                Allié Complete System Walkthrough
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#64748b',
                background: '#f1f5f9',
                padding: '4px 8px',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
              }}
            >
              HD 1080p
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#fffdf5',
                border: '2px solid #252b3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '2px 2px 0 0 #252b3a',
                color: '#252b3a',
                transition: 'all 0.15s ease',
              }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chapter Navigation Tabs */}
        <div
          style={{
            background: '#f8f6ee',
            borderBottom: '3px solid #252b3a',
            padding: '8px 16px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
          }}
        >
          {CHAPTERS.map((ch, idx) => {
            const Icon = ch.icon;
            const isActive = activeChapterIndex === idx;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jumpToChapter(idx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: isActive ? '#ff4365' : '#ffffff',
                  color: isActive ? '#ffffff' : '#252b3a',
                  border: '2px solid #252b3a',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: isActive ? '3px 3px 0 0 #252b3a' : '2px 2px 0 0 #cbd5e1',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={12} />
                <span>{ch.tag}: {ch.title}</span>
              </button>
            );
          })}
        </div>

        {/* Video Canvas Simulation Area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#252b3a',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* Chapter 1: AI Customer Live Chat */}
          {activeChapterIndex === 0 && (
            <div
              style={{
                flex: 1,
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e2430 0%, #2a3245 100%)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 24,
                  boxShadow: '8px 8px 0 0 rgba(0,0,0,0.45)',
                  overflow: 'hidden',
                }}
              >
                {/* Chat Header */}
                <div
                  style={{
                    padding: '14px 18px',
                    background: '#ffffff',
                    borderBottom: '2.5px solid #252b3a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#9bf1cd',
                        border: '2px solid #252b3a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Bot size={20} color="#252b3a" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#252b3a' }}>Allié Live Assistant</div>
                      <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                        Active on your store
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#ffd05b',
                      border: '1.5px solid #252b3a',
                      padding: '3px 8px',
                      borderRadius: 999,
                      color: '#252b3a',
                    }}
                  >
                    AI Copilot Active
                  </span>
                </div>

                {/* Chat Messages */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Customer message */}
                  <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>Visitor (Order #9421)</div>
                    <div
                      style={{
                        background: '#ffffff',
                        border: '2px solid #252b3a',
                        borderRadius: '16px 16px 16px 4px',
                        padding: '12px 14px',
                        fontSize: 13,
                        color: '#252b3a',
                        lineHeight: 1.5,
                        boxShadow: '3px 3px 0 0 #252b3a',
                      }}
                    >
                      Hey! Can I change the shipping address for my order, and what is your returns policy?
                    </div>
                  </div>

                  {/* AI Instant reply */}
                  <div style={{ alignSelf: 'flex-end', maxWidth: '88%' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ff4365', textAlign: 'right', marginBottom: 4 }}>Allié AI • Instant (0.3s)</div>
                    <div
                      style={{
                        background: '#f1ebff',
                        border: '2px solid #252b3a',
                        borderRadius: '16px 16px 4px 16px',
                        padding: '12px 14px',
                        fontSize: 13,
                        color: '#252b3a',
                        lineHeight: 1.5,
                        boxShadow: '3px 3px 0 0 #252b3a',
                      }}
                    >
                      Yes absolutely! Since Order #9421 hasn't shipped yet, I've reserved it for an address update. Also, all items carry a <strong>30-day hassle-free return window</strong> with free exchange!
                    </div>
                  </div>

                  {/* Resolution banner */}
                  <div
                    style={{
                      background: '#9bf1cd',
                      border: '2px solid #252b3a',
                      borderRadius: 12,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '2px 2px 0 0 #252b3a',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#252b3a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#059669" />
                      Issue Solved without Human Agent
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#252b3a' }}>
                      Resolution: 1m 15s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 2: Live Inbox & Team Routing */}
          {activeChapterIndex === 1 && (
            <div
              style={{
                flex: 1,
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: '1fr 1.3fr',
                gap: 16,
                background: 'linear-gradient(135deg, #1e2430 0%, #2a3245 100%)',
              }}
            >
              {/* Left Inbox List */}
              <div
                style={{
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 20,
                  padding: 14,
                  boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#252b3a' }}>Unified Inbox</div>
                  <span style={{ fontSize: 10, fontWeight: 800, background: '#ffd05b', padding: '2px 6px', borderRadius: 6, border: '1.5px solid #252b3a' }}>3 Active</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Sarah Miller', issue: 'Exchange query for jacket', status: 'AI Handled', color: '#9bf1cd' },
                    { name: 'David Cho', issue: 'Delivery tracking inquiry', status: 'Priority Escalation', color: '#ff78c5' },
                    { name: 'Elena Rostova', issue: 'Bulk order discount', status: 'AI Handled', color: '#9bf1cd' },
                  ].map((conv, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        background: i === 1 ? '#f1ebff' : '#ffffff',
                        border: '2px solid #252b3a',
                        cursor: 'pointer',
                        boxShadow: '2px 2px 0 0 #252b3a',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#252b3a' }}>{conv.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, background: conv.color, border: '1px solid #252b3a', borderRadius: 999, padding: '1px 6px' }}>{conv.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{conv.issue}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Conversation Inspector */}
              <div
                style={{
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 20,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #252b3a', paddingBottom: 10, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#252b3a' }}>David Cho (Escalation)</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Seattle, WA • Customer Lifetime Value: $380</div>
                    </div>
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#ff4365',
                        color: '#ffffff',
                        border: '2px solid #252b3a',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '2px 2px 0 0 #252b3a',
                      }}
                    >
                      Take Over Chat →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ background: '#ffffff', border: '1.5px solid #252b3a', padding: 8, borderRadius: 8 }}>
                      <strong>Customer:</strong> My package says delivered yesterday, but I don't see it at my porch.
                    </div>
                    <div style={{ background: '#f1ebff', border: '1.5px solid #252b3a', padding: 8, borderRadius: 8 }}>
                      <strong>Allié Copilot:</strong> I checked carrier tracking — photo delivery was taken at Parcel Locker #4. Notifying customer now.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#e9fff5', border: '2px solid #252b3a', borderRadius: 10, padding: 8, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#252b3a' }}>⚡ Human Rep & AI Co-pilot Working Together</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#059669' }}>Live Synced</span>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 3: AI Copilot & Telemetry */}
          {activeChapterIndex === 2 && (
            <div
              style={{
                flex: 1,
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                background: 'linear-gradient(135deg, #1e2430 0%, #2a3245 100%)',
              }}
            >
              <div style={{ background: '#fffdf5', border: '3px solid #252b3a', borderRadius: 20, padding: 18, boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Response Time</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#252b3a', margin: '8px 0' }}>0.4s</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>↑ 94% faster than human-only queue</div>
              </div>

              <div style={{ background: '#fffdf5', border: '3px solid #252b3a', borderRadius: 20, padding: 18, boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Customer Sentiment</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#ff4365', margin: '8px 0' }}>98.2%</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#252b3a' }}>Positive rating across 1,420 chats</div>
              </div>

              <div style={{ background: '#fffdf5', border: '3px solid #252b3a', borderRadius: 20, padding: 18, boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>AI Auto-Resolution</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#252b3a', margin: '8px 0' }}>82.4%</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Tickets resolved without escalation</div>
              </div>

              <div
                style={{
                  gridColumn: 'span 3',
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 20,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ffd05b', border: '2px solid #252b3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={22} color="#252b3a" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#252b3a' }}>Automated FAQ Discovery</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Allié detected 4 recurring questions this week and drafted instant answers for review.</div>
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: '#252b3a',
                    color: '#ffffff',
                    border: '2px solid #252b3a',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Review FAQs
                </button>
              </div>
            </div>
          )}

          {/* Chapter 4: QR Code & Custom Branding */}
          {activeChapterIndex === 3 && (
            <div
              style={{
                flex: 1,
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: 16,
                background: 'linear-gradient(135deg, #1e2430 0%, #2a3245 100%)',
              }}
            >
              {/* Branding Customizer */}
              <div
                style={{
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#252b3a', marginBottom: 12 }}>
                  Instant Brand Customization
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ff78c5', border: '3px solid #252b3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#ffffff' }}>
                    A
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#252b3a' }}>Allié Coffee & Bakery</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Custom logo, welcome greeting & brand tone live</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#ffd05b', border: '1px solid #252b3a' }}>Circle Avatar</span>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#9bf1cd', border: '1px solid #252b3a' }}>Squircle Support</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8f6ee', border: '2px solid #252b3a', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>One-Click Website Embed</div>
                  <code style={{ fontSize: 11, color: '#252b3a', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #252b3a', display: 'block', wordBreak: 'break-all' }}>
                    &lt;script src="https://wholeallie.vercel.app/widget.js" data-id="allie-demo"&gt;&lt;/script&gt;
                  </code>
                </div>
              </div>

              {/* Instant QR Stand */}
              <div
                style={{
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 20,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: '6px 6px 0 0 rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 16,
                    background: '#ffffff',
                    border: '3px solid #252b3a',
                    padding: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '3px 3px 0 0 #252b3a',
                    marginBottom: 10,
                  }}
                >
                  <QrCode size={84} color="#252b3a" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#252b3a' }}>Counter Stand QR</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Scan to open live support without app download</div>
              </div>
            </div>
          )}
        </div>

        {/* Video Scrubber & Playback Controls Bar */}
        <div
          style={{
            background: '#ffffff',
            borderTop: '3px solid #252b3a',
            padding: '14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Progress Bar (Clickable / Scrubbable) */}
          <div
            ref={progressRef}
            onClick={handleSeek}
            style={{
              position: 'relative',
              height: 10,
              background: '#e2e8f0',
              borderRadius: 999,
              cursor: 'pointer',
              overflow: 'hidden',
              border: '1.5px solid #252b3a',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #ff4365 0%, #ff78c5 50%, #ffd05b 100%)',
                borderRadius: 999,
                transition: isPlaying ? 'width 0.5s linear' : 'none',
              }}
            />
          </div>

          {/* Controls Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: '#252b3a',
                  color: '#ffffff',
                  border: '2px solid #252b3a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 0 #cbd5e1',
                }}
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTime(0);
                  setActiveChapterIndex(0);
                  setIsPlaying(true);
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: '#fffdf5',
                  color: '#252b3a',
                  border: '2px solid #252b3a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 0 #252b3a',
                }}
                title="Restart Tour"
              >
                <RotateCcw size={16} />
              </button>

              <span style={{ fontSize: 13, fontWeight: 800, color: '#252b3a', fontFamily: 'monospace' }}>
                {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
              </span>

              <button
                type="button"
                onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: '#fffdf5',
                  border: '2px solid #252b3a',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#252b3a',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 0 #252b3a',
                }}
              >
                {playbackSpeed}x Speed
              </button>
            </div>

            {/* Bottom Right CTA in player */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'none', mdDisplay: 'inline' }}>
                Ready to try?
              </span>
              <GradientButton to="/register" size="sm" variant="glow" onClick={onClose}>
                Try Now — Free Setup →
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
