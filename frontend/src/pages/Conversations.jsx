import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import AdminCopilotWidget from '../components/AdminCopilotWidget';
import API from '../api/axios';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  X,
  User,
  Bot,
  Search,
  Sparkles,
  RefreshCw,
  Send,
  AlertCircle,
  Copy,
  Check,
  ShieldAlert,
  Trash2,
  Pin,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Maximize2,
  Minimize2,
  ArrowDown
} from 'lucide-react';

const cleanText = (txt) => {
  if (!txt) return '';
  return txt
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
};

export default function Conversations() {
  const [conversations, setConversations]             = useState([]);
  const [selectedSession, setSelectedSession]         = useState(null);
  const [activeConversation, setActiveConversation]   = useState(null);
  const [loading, setLoading]                         = useState(true);
  const [loadingDetail, setLoadingDetail]             = useState(false);
  const [searchTerm, setSearchTerm]                   = useState('');
  const [summary, setSummary]                         = useState('');
  const [summarizing, setSummarizing]                 = useState(false);
  
  // Separation of AI vs Human: 'all' | 'ai' | 'human'
  const [channelTab, setChannelTab]                   = useState('all');
  // Secondary status filter: 'all' | 'needs_reply' | 'resolved'
  const [statusFilter, setStatusFilter]               = useState('all');

  const [adminReplyText, setAdminReplyText]           = useState('');
  const [sendingReply, setSendingReply]               = useState(false);
  const [copiedSession, setCopiedSession]             = useState(false);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState(null);
  const [isDeleting, setIsDeleting]                   = useState(false);

  // UX Features: Ref, Minimizing List, Extending Workspace
  const workspaceRef                                  = useRef(null);
  const [isTableMinimized, setIsTableMinimized]       = useState(false);
  const [isWorkspaceExtended, setIsWorkspaceExtended] = useState(false);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    try {
      const res = await API.get('/api/conversations');
      setConversations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRow = async (sessionId) => {
    setSelectedSession(sessionId);
    setLoadingDetail(true);
    setSummary('');
    setAdminReplyText('');

    // Smoothly scroll down itself to the conversation workspace
    setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    try {
      const [detailRes, summaryRes] = await Promise.all([
        API.get(`/api/conversations/${sessionId}`),
        API.post('/api/conversations/assistant', {
          prompt: `Give a clean structured summary for session ${sessionId}. Bullet point 1: Customer query/intent. Bullet point 2: Current resolution status & next steps.`
        }).catch(() => null)
      ]);
      setActiveConversation(detailRes.data);
      if (summaryRes?.data?.reply) {
        setSummary(summaryRes.data.reply);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTogglePin = async (sessionId, e) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic state update
      setConversations(prev => {
        const updated = prev.map(c => c.sessionId === sessionId ? { ...c, isPinned: !c.isPinned } : c);
        return [...updated].sort((a, b) => {
          if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });

      if (activeConversation && activeConversation.sessionId === sessionId) {
        setActiveConversation(prev => ({ ...prev, isPinned: !prev.isPinned }));
      }

      await API.patch(`/api/conversations/${sessionId}/pin`);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      fetchConversations();
    }
  };

  const handleManualSummary = async () => {
    if (!selectedSession || summarizing) return;
    setSummarizing(true);
    try {
      const res = await API.post('/api/conversations/assistant', {
        prompt: `Summarize session ${selectedSession} clearly with concise bullet points.`
      });
      setSummary(res.data.reply || 'Summary generated.');
    } catch (err) {
      setSummary('Could not generate summary at this time.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSendAdminReply = async (resolveTicket = true) => {
    if (!adminReplyText.trim() || !selectedSession || sendingReply) return;
    setSendingReply(true);
    try {
      await API.post(`/api/conversations/${selectedSession}/reply`, { message: adminReplyText.trim() });
      if (resolveTicket) {
        await API.patch(`/api/conversations/${selectedSession}/status`, { status: 'resolved', repliedByAdmin: true });
      }
      setAdminReplyText('');
      const detailRes = await API.get(`/api/conversations/${selectedSession}`);
      setActiveConversation(detailRes.data);
      fetchConversations();
    } catch (err) {
      console.error('Staff reply failed:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleStatus = async (newStatus) => {
    if (!selectedSession) return;
    try {
      await API.patch(`/api/conversations/${selectedSession}/status`, { status: newStatus, repliedByAdmin: true });
      const detailRes = await API.get(`/api/conversations/${selectedSession}`);
      setActiveConversation(detailRes.data);
      fetchConversations();
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
  };

  const executeDeleteConversation = async (sessionId) => {
    if (!sessionId || isDeleting) return;
    setIsDeleting(true);
    try {
      await API.delete(`/api/conversations/${sessionId}`);
      setConversations(prev => prev.filter(c => c.sessionId !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setActiveConversation(null);
        setSummary('');
      }
    } catch (err) {
      console.error('Delete conversation failed:', err);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteSession(null);
    }
  };

  const copySessionId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  // Human vs AI Classification
  const isHumanNeeded = (conv) => {
    return Boolean(conv.isEscalated) ||
      conv.priority === 'urgent' ||
      conv.priority === 'escalated' ||
      ['critical', 'high'].includes(conv.priority) ||
      (conv.unresolvedTopics && conv.unresolvedTopics.length > 0) ||
      Boolean(conv.repliedByAdmin);
  };

  const isConvUnreplied = (conv) => isHumanNeeded(conv) && !conv.repliedByAdmin && conv.status !== 'resolved';

  // Counts
  const totalCount = conversations.length;
  const humanCount = conversations.filter(isHumanNeeded).length;
  const aiCount = totalCount - humanCount;
  const unrepliedHumanCount = conversations.filter(isConvUnreplied).length;

  // Filtering & Sorting (Pinned stay strictly at the top)
  const filtered = conversations.filter(conv => {
    const matchesSearch =
      conv.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.customerName && conv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // 1. Channel Filter
    if (channelTab === 'ai' && isHumanNeeded(conv)) return false;
    if (channelTab === 'human' && !isHumanNeeded(conv)) return false;

    // 2. Status Filter
    if (statusFilter === 'needs_reply') return isConvUnreplied(conv);
    if (statusFilter === 'resolved') return conv.status === 'resolved';

    return true;
  }).sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fffdf5', fontFamily: 'var(--dp-typography-reading), sans-serif' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '28px 36px 40px', maxWidth: 1240, margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
        
        {/* 1. CLEAN HEADER BAR */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{
              fontSize: 34,
              fontWeight: 900,
              color: '#252b3a',
              margin: 0,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              fontFamily: 'var(--dp-typography-display), sans-serif',
            }}>
              Conversations Desk
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
              Clear separation between automated AI chats and tickets requiring human staff
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search session, inquiry, or customer..."
              style={{
                width: 280,
                background: '#ffffff',
                border: '2.5px solid #252b3a',
                borderRadius: 12,
                padding: '10px 14px 10px 38px',
                fontSize: 13,
                color: '#252b3a',
                outline: 'none',
                boxShadow: '3px 3px 0 0 #252b3a',
              }}
            />
          </div>
        </div>

        {/* 2. TOP SEGMENTED SWITCH: AI CHAT vs HUMAN CHAT SEPARATION */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          background: '#ffffff',
          border: '3px solid #252b3a',
          borderRadius: 16,
          padding: '10px 14px',
          boxShadow: '4px 4px 0 0 #252b3a',
        }}>
          {/* Primary Channel Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginRight: 6 }}>
              Channel:
            </span>

            {/* Tab: All */}
            <button
              type="button"
              onClick={() => setChannelTab('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                border: '2px solid #252b3a',
                background: channelTab === 'all' ? '#252b3a' : '#fffdf5',
                color: channelTab === 'all' ? '#ffffff' : '#252b3a',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>All Chats</span>
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 6,
                background: channelTab === 'all' ? '#4a5568' : '#e2e8f0',
                color: channelTab === 'all' ? '#ffffff' : '#252b3a',
              }}>
                {totalCount}
              </span>
            </button>

            {/* Tab: AI Handled */}
            <button
              type="button"
              onClick={() => setChannelTab('ai')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                border: '2px solid #252b3a',
                background: channelTab === 'ai' ? '#9bf1cd' : '#fffdf5',
                color: '#252b3a',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: channelTab === 'ai' ? '2px 2px 0 0 #252b3a' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Bot size={14} style={{ color: '#0f7a57' }} />
              <span>AI Handled</span>
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 6,
                background: channelTab === 'ai' ? '#ffffff' : '#e2e8f0',
                color: '#0f7a57',
                fontWeight: 900,
              }}>
                {aiCount}
              </span>
            </button>

            {/* Tab: Human Support / Escalated */}
            <button
              type="button"
              onClick={() => setChannelTab('human')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                border: '2px solid #252b3a',
                background: channelTab === 'human' ? '#ffd05b' : '#fffdf5',
                color: '#252b3a',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: channelTab === 'human' ? '2px 2px 0 0 #252b3a' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <User size={14} style={{ color: '#854d0e' }} />
              <span>Human Support</span>
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 6,
                background: channelTab === 'human' ? '#ffffff' : '#e2e8f0',
                color: '#854d0e',
                fontWeight: 900,
              }}>
                {humanCount}
              </span>

              {unrepliedHumanCount > 0 && (
                <span style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 999,
                  background: '#ff3366',
                  color: '#ffffff',
                  fontWeight: 900,
                  marginLeft: 2,
                }}>
                  {unrepliedHumanCount} waiting
                </span>
              )}
            </button>
          </div>

          {/* Secondary Quick Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginRight: 4 }}>
              Status:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'needs_reply', label: 'Needs Staff Reply' },
              { id: 'resolved', label: 'Resolved' },
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 8,
                  border: statusFilter === st.id ? '2px solid #252b3a' : '1.5px solid #cbd5e1',
                  background: statusFilter === st.id ? '#f1ebff' : 'transparent',
                  color: statusFilter === st.id ? '#6434df' : '#64748b',
                  fontSize: 12,
                  fontWeight: statusFilter === st.id ? 800 : 600,
                  cursor: 'pointer',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. EXTENDIBLE / MINIMIZABLE CONVERSATIONS LIST */}
        {isTableMinimized && selectedSession ? (
          /* Minimized Compact Bar */
          <div style={{
            background: '#ffffff',
            border: '3px solid #252b3a',
            borderRadius: 16,
            padding: '12px 20px',
            boxShadow: '4px 4px 0 0 #252b3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                Active Conversation:
              </span>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                {activeConversation?.customerName || 'Customer'}
              </span>
              <span style={{
                fontFamily: 'monospace',
                fontSize: 11,
                fontWeight: 800,
                background: '#f1ebff',
                color: '#6434df',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid #6434df',
              }}>
                {selectedSession}
              </span>
              {activeConversation?.isPinned && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 900,
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #f59e0b',
                  borderRadius: 999,
                  padding: '1px 6px',
                }}>
                  <Pin size={10} style={{ fill: '#f59e0b', color: '#b45309' }} /> PINNED
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTableMinimized(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 10,
                border: '2px solid #252b3a',
                background: '#fffdf5',
                color: '#252b3a',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '2px 2px 0 0 #252b3a',
              }}
            >
              <ChevronDown size={14} />
              <span>Show All Conversations ({filtered.length})</span>
            </button>
          </div>
        ) : (
          /* Full Table with Extendible Arrows & Minimizer */
          <div style={{
            background: '#ffffff',
            border: '3px solid #252b3a',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '6px 6px 0 0 #252b3a',
          }}>
            {/* Table Header Controls */}
            {selectedSession && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 18px',
                background: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>
                  Click any conversation row to view or scroll directly to its workspace
                </span>
                <button
                  type="button"
                  onClick={() => setIsTableMinimized(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #252b3a',
                    background: '#ffffff',
                    color: '#252b3a',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '1.5px 1.5px 0 0 #252b3a',
                  }}
                >
                  <ChevronUp size={12} />
                  <span>Minimize List (Focus Workspace)</span>
                </button>
              </div>
            )}

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                Loading conversations...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                <MessageSquare size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                No conversations found matching this view.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2.5px solid #252b3a' }}>
                      <th style={{ width: 42, padding: '12px 10px', textAlign: 'center', color: '#64748b', fontSize: 11, fontWeight: 900 }}>
                        <ArrowDown size={13} style={{ margin: '0 auto' }} />
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'left', color: '#252b3a', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Customer & Inquiry
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'left', color: '#252b3a', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Handler
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'left', color: '#252b3a', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'left', color: '#252b3a', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Rating
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'left', color: '#252b3a', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Time
                      </th>
                      <th style={{ padding: '12px 18px', textAlign: 'right', color: '#252b3a', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(conv => {
                      const isSelected = selectedSession === conv.sessionId;
                      const human = isHumanNeeded(conv);
                      const unreplied = isConvUnreplied(conv);
                      const isPinned = Boolean(conv.isPinned);

                      return (
                        <tr
                          key={conv.sessionId}
                          onClick={() => handleSelectRow(conv.sessionId)}
                          style={{
                            borderBottom: '1.5px solid #e2e8f0',
                            borderLeft: isSelected
                              ? '5px solid #6434df'
                              : isPinned
                              ? '5px solid #ffd05b'
                              : '5px solid transparent',
                            cursor: 'pointer',
                            background: isSelected ? '#f1ebff' : isPinned ? '#fffdf0' : '#ffffff',
                            transition: 'background 0.12s ease',
                          }}
                        >
                          {/* Extendible Arrow Column */}
                          <td style={{ width: 42, padding: '14px 10px', textAlign: 'center' }}>
                            {isSelected ? (
                              <ChevronDown size={16} style={{ color: '#6434df', strokeWidth: 3 }} />
                            ) : (
                              <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                            )}
                          </td>

                          {/* Customer & Inquiry */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                                {conv.customerName || 'Customer'}
                              </span>

                              {isPinned && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontSize: 10,
                                  fontWeight: 900,
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #f59e0b',
                                  borderRadius: 999,
                                  padding: '1px 6px',
                                }}>
                                  <Pin size={9} style={{ fill: '#f59e0b', color: '#b45309' }} /> PINNED
                                </span>
                              )}

                              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6434df' }}>
                                {conv.sessionId}
                              </span>
                            </div>

                            {conv.lastMessage && (
                              <p style={{
                                margin: '3px 0 0',
                                fontSize: 12,
                                color: '#64748b',
                                maxWidth: 360,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {conv.lastMessage}
                              </p>
                            )}
                          </td>

                          {/* Handler Tag: AI vs Human */}
                          <td style={{ padding: '14px 18px' }}>
                            {human ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: unreplied ? '#fee2e2' : '#fef9c3',
                                color: unreplied ? '#991b1b' : '#854d0e',
                                border: '1.5px solid #252b3a',
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}>
                                <User size={12} />
                                {unreplied ? 'Needs Staff' : 'Staff Handled'}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: '#ecfdf5',
                                color: '#065f46',
                                border: '1.5px solid #252b3a',
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}>
                                <Bot size={12} />
                                AI Resolved
                              </span>
                            )}
                          </td>

                          {/* Single Unified Status Badge */}
                          <td style={{ padding: '14px 18px' }}>
                            {conv.status === 'resolved' ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 9px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                background: '#e9fff5',
                                color: '#0f7a57',
                                border: '1.5px solid #252b3a',
                              }}>
                                <CheckCircle2 size={12} /> Resolved
                              </span>
                            ) : unreplied ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 9px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                background: '#ff3366',
                                color: '#ffffff',
                                border: '1.5px solid #252b3a',
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
                                Awaiting Staff
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 9px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1.5px solid #252b3a',
                              }}>
                                <Clock size={12} /> Open
                              </span>
                            )}
                          </td>

                          {/* Rating */}
                          <td style={{ padding: '14px 18px' }}>
                            {conv.rating === 'up' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                                <ThumbsUp size={13} /> Positive
                              </span>
                            )}
                            {conv.rating === 'down' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, fontWeight: 700 }}>
                                <ThumbsDown size={13} /> Negative
                              </span>
                            )}
                            {!conv.rating && (
                              <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12 }}>
                            {conv.createdAt
                              ? new Date(conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' +
                                new Date(conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                              : 'N/A'}
                          </td>

                          {/* Action Buttons: Pin & Delete */}
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {/* Pin Button */}
                              <button
                                type="button"
                                onClick={(e) => handleTogglePin(conv.sessionId, e)}
                                title={isPinned ? 'Unpin conversation' : 'Pin conversation to top'}
                                style={{
                                  background: isPinned ? '#fef3c7' : 'transparent',
                                  border: isPinned ? '1.5px solid #f59e0b' : '1.5px solid transparent',
                                  borderRadius: 8,
                                  padding: '6px 8px',
                                  color: isPinned ? '#b45309' : '#94a3b8',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isPinned) {
                                    e.currentTarget.style.color = '#f59e0b';
                                    e.currentTarget.style.background = '#fffbeb';
                                    e.currentTarget.style.borderColor = '#f59e0b';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isPinned) {
                                    e.currentTarget.style.color = '#94a3b8';
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'transparent';
                                  }
                                }}
                              >
                                <Pin size={14} style={{ fill: isPinned ? '#f59e0b' : 'none' }} />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteSession(conv.sessionId);
                                }}
                                title="Delete conversation"
                                style={{
                                  background: 'transparent',
                                  border: '1.5px solid transparent',
                                  borderRadius: 8,
                                  padding: '6px 8px',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#e11d48';
                                  e.currentTarget.style.background = '#ffe4e6';
                                  e.currentTarget.style.borderColor = '#252b3a';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#94a3b8';
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = 'transparent';
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. CONVERSATION WORKSPACE: EXTENDIBLE & AUTO-SCROLLED */}
        {selectedSession && activeConversation && (
          <div
            ref={workspaceRef}
            style={{
              background: '#ffffff',
              border: '3px solid #252b3a',
              borderRadius: 22,
              padding: 24,
              boxShadow: '8px 8px 0 0 #252b3a',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              scrollMarginTop: 24,
            }}
          >
            {/* Header Strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      Conversation Workspace
                    </h2>
                    
                    <span style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      background: '#f1ebff',
                      color: '#6434df',
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: '1px solid #6434df',
                    }}>
                      {selectedSession}
                    </span>

                    <button
                      type="button"
                      onClick={() => copySessionId(selectedSession)}
                      title="Copy Session ID"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#64748b' }}
                    >
                      {copiedSession ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>

                    {activeConversation.isPinned && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 900,
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #f59e0b',
                        borderRadius: 999,
                        padding: '1px 7px',
                      }}>
                        <Pin size={10} style={{ fill: '#f59e0b', color: '#b45309' }} /> PINNED TICKET
                      </span>
                    )}
                  </div>
                  
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                    Customer: <strong>{activeConversation.customerName || 'Customer'}</strong> · Channel:{' '}
                    <strong>{isHumanNeeded(activeConversation) ? 'Human Support' : 'AI Handled'}</strong> · Status:{' '}
                    <strong>{activeConversation.status || 'open'}</strong>
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Pin in workspace */}
                <button
                  type="button"
                  onClick={() => handleTogglePin(selectedSession)}
                  title={activeConversation.isPinned ? 'Unpin this conversation' : 'Pin this conversation to top'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 12px',
                    borderRadius: 10,
                    border: '2px solid #252b3a',
                    background: activeConversation.isPinned ? '#fef3c7' : '#ffffff',
                    color: activeConversation.isPinned ? '#92400e' : '#252b3a',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  <Pin size={13} style={{ fill: activeConversation.isPinned ? '#f59e0b' : 'none' }} />
                  <span>{activeConversation.isPinned ? 'Pinned' : 'Pin Ticket'}</span>
                </button>

                {/* Extend / Maximize Stream Toggle with Arrow */}
                <button
                  type="button"
                  onClick={() => setIsWorkspaceExtended(prev => !prev)}
                  title={isWorkspaceExtended ? 'Collapse message stream height' : 'Extend message stream height'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 12px',
                    borderRadius: 10,
                    border: '2px solid #252b3a',
                    background: '#fffdf5',
                    color: '#252b3a',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  {isWorkspaceExtended ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  <span>{isWorkspaceExtended ? 'Collapse Stream' : 'Extend Stream'}</span>
                </button>

                {/* AI Summary */}
                <button
                  type="button"
                  onClick={handleManualSummary}
                  disabled={summarizing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 10,
                    border: '2px solid #252b3a',
                    background: '#f1ebff',
                    color: '#6434df',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: summarizing ? 'not-allowed' : 'pointer',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  <Sparkles size={13} />
                  <span>{summarizing ? 'Summarizing...' : 'AI Summary'}</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSession(selectedSession)}
                  title="Delete conversation"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 12px',
                    borderRadius: 10,
                    border: '2px solid #252b3a',
                    background: '#ffe4e6',
                    color: '#e11d48',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 #252b3a',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => { setSelectedSession(null); setActiveConversation(null); setSummary(''); }}
                  style={{
                    background: '#fffdf5',
                    border: '2px solid #252b3a',
                    color: '#252b3a',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* AI Summary Banner */}
            {summary && (
              <div style={{
                background: '#f8f5ff',
                border: '2.5px solid #252b3a',
                borderLeft: '6px solid #6434df',
                borderRadius: 14,
                padding: '12px 16px',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#252b3a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6434df', marginBottom: 4 }}>
                  <Sparkles size={12} /> AI Executive Summary
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>{cleanText(summary)}</div>
              </div>
            )}

            {/* SEPARATED MESSAGE STREAM (EXTENDIBLE WITH ARROW/TOGGLE) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  Live Message Stream ({activeConversation.messages?.length || 0} messages)
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  AI and Human staff messages are labeled clearly below
                </span>
              </div>

              <div style={{
                background: '#fffdf5',
                border: '2.5px solid #252b3a',
                borderRadius: 16,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                maxHeight: isWorkspaceExtended ? 580 : 380,
                minHeight: 260,
                overflowY: 'auto',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
                transition: 'max-height 0.25s ease',
              }}>
                {activeConversation.messages?.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isStaff = !isUser && (
                    msg.intent === 'staff_reply' ||
                    (typeof msg.content === 'string' && msg.content.startsWith('[Staff Support]:'))
                  );
                  const isAiBot = !isUser && !isStaff;
                  const displayContent = typeof msg.content === 'string'
                    ? msg.content.replace(/^\[Staff Support\]:\s*/, '')
                    : msg.content;

                  const isEscalationTrigger = isAiBot && (
                    msg.flagged ||
                    Boolean(activeConversation.isEscalated && idx === activeConversation.messages.length - 2)
                  );

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      
                      {/* Escalation Divider if bot flagged or escalated */}
                      {isEscalationTrigger && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          margin: '8px 0',
                        }}>
                          <div style={{ flex: 1, height: 1.5, background: '#cbd5e1' }} />
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 10,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            background: '#ffe4e6',
                            color: '#e11d48',
                            border: '1.5px solid #252b3a',
                            borderRadius: 999,
                            padding: '3px 10px',
                          }}>
                            <ShieldAlert size={11} /> Escalated to Human Support
                          </span>
                          <div style={{ flex: 1, height: 1.5, background: '#cbd5e1' }} />
                        </div>
                      )}

                      {/* Message Container */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                      }}>
                        {/* Sender Label */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 3,
                          paddingLeft: isUser ? 0 : 4,
                          paddingRight: isUser ? 4 : 0,
                        }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: isUser ? '#6434df' : isStaff ? '#065f46' : '#252b3a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            {isUser && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <User size={11} /> Customer
                              </span>
                            )}
                            {isAiBot && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Bot size={11} /> Acme’s Allié (AI Assistant)
                              </span>
                            )}
                            {isStaff && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <ShieldAlert size={11} /> Acme Support Staff (Human Agent)
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          maxWidth: isUser ? '80%' : '85%',
                        }}>
                          {!isUser && (
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: isStaff ? '#ffd05b' : '#9bf1cd',
                              border: '2px solid #252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 2,
                            }}>
                              {isStaff ? <User size={14} style={{ color: '#252b3a' }} /> : <Bot size={14} style={{ color: '#252b3a' }} />}
                            </div>
                          )}

                          <div style={{
                            padding: '10px 15px',
                            borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                            fontSize: 13,
                            lineHeight: 1.5,
                            background: isUser ? '#6434df' : isStaff ? '#f0fdf4' : '#ffffff',
                            color: isUser ? '#ffffff' : '#252b3a',
                            border: '2px solid #252b3a',
                            borderLeft: isUser
                              ? '2px solid #252b3a'
                              : isStaff
                              ? '5px solid #10b981'
                              : '5px solid #6434df',
                            boxShadow: '2px 2px 0 0 #252b3a',
                            wordBreak: 'break-word',
                          }}>
                            {displayContent}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STAFF REPLY & ACTION BOX */}
            <div style={{
              background: '#f8fafc',
              border: '2.5px solid #252b3a',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#252b3a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Send size={13} style={{ color: '#6434df' }} />
                  Reply as Support Staff (Acme)
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {activeConversation.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus('resolved')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: '1.5px solid #252b3a',
                        background: '#e9fff5',
                        color: '#0f7a57',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={12} /> Mark Resolved
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus('open')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: '1.5px solid #252b3a',
                        background: '#f1ebff',
                        color: '#6434df',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={12} /> Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <textarea
                  value={adminReplyText}
                  onChange={e => setAdminReplyText(e.target.value)}
                  placeholder="Type official reply to send directly to this customer's screen..."
                  rows={2}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '2px solid #252b3a',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#252b3a',
                    resize: 'none',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleSendAdminReply(true)}
                    disabled={sendingReply || !adminReplyText.trim()}
                    style={{
                      background: sendingReply || !adminReplyText.trim() ? '#e2e8f0' : '#10b981',
                      color: sendingReply || !adminReplyText.trim() ? '#94a3b8' : '#ffffff',
                      border: '2px solid #252b3a',
                      borderRadius: 10,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: sendingReply || !adminReplyText.trim() ? 'not-allowed' : 'pointer',
                      boxShadow: '2px 2px 0 0 #252b3a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Reply & Resolve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendAdminReply(false)}
                    disabled={sendingReply || !adminReplyText.trim()}
                    style={{
                      background: sendingReply || !adminReplyText.trim() ? '#e2e8f0' : '#6434df',
                      color: sendingReply || !adminReplyText.trim() ? '#94a3b8' : '#ffffff',
                      border: '2px solid #252b3a',
                      borderRadius: 10,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: sendingReply || !adminReplyText.trim() ? 'not-allowed' : 'pointer',
                      boxShadow: '2px 2px 0 0 #252b3a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Send size={13} />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Floating AI Admin Copilot Widget */}
        <AdminCopilotWidget />

        {/* Delete Confirmation Modal */}
        {confirmDeleteSession && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(37,43,58,0.5)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
            onClick={() => !isDeleting && setConfirmDeleteSession(null)}
          >
            <div
              style={{
                background: '#ffffff',
                border: '3px solid #252b3a',
                borderRadius: 20,
                padding: 26,
                maxWidth: 440,
                width: '100%',
                boxShadow: '8px 8px 0 0 #252b3a',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#ffe4e6',
                  border: '2px solid #252b3a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e11d48',
                  flexShrink: 0,
                }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#252b3a', margin: 0 }}>
                    Delete Conversation?
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                    This action will permanently remove this record.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete session{' '}
                <code style={{ background: '#f1ebff', color: '#6434df', padding: '2px 6px', borderRadius: 6, fontWeight: 800, fontFamily: 'monospace' }}>
                  {confirmDeleteSession}
                </code>
                {' '}and all of its customer chat messages?
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSession(null)}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '2px solid #252b3a',
                    background: '#ffffff',
                    color: '#252b3a',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => executeDeleteConversation(confirmDeleteSession)}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 10,
                    border: '2px solid #252b3a',
                    background: isDeleting ? '#94a3b8' : '#e11d48',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    boxShadow: '2px 2px 0 0 #252b3a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={14} />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
