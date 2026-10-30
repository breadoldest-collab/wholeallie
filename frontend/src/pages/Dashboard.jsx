import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import WeatherTimeWidget from '../components/WeatherTimeWidget';
import API from '../api/axios';
import { MessageSquare, CheckCircle2, Clock, CheckCircle, Plus, AlertCircle, Star } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts]       = useState(null);
  const [loading, setLoading]     = useState(true);

  // Formatted date string like "Thursday, August 6, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aRes, alRes] = await Promise.all([
          API.get('/api/analytics?range=daily'),
          API.get('/api/analytics/alerts'),
        ]);
        setAnalytics(aRes.data);
        setAlerts(alRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [chartRange, setChartRange] = useState('7d');

  // Format chart data for 7 Days vs 30 Days
  const rawChartData = analytics?.chartData || [];
  const defaultFallback7Days = [
    { date: 'Mon', count: 0 },
    { date: 'Tue', count: 0 },
    { date: 'Wed', count: 0 },
    { date: 'Thu', count: 0 },
    { date: 'Fri', count: 0 },
    { date: 'Sat', count: 0 },
    { date: 'Sun', count: 0 },
  ];

  const displayChartData = chartRange === '30d'
    ? (rawChartData.length > 0 ? rawChartData : defaultFallback7Days)
    : (rawChartData.length >= 7 ? rawChartData.slice(-7) : (rawChartData.length > 0 ? rawChartData : defaultFallback7Days));

  const totalVolumeInView = displayChartData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div style={{
          background: '#ffffff',
          border: '2.5px solid #252b3a',
          borderRadius: 14,
          padding: '10px 16px',
          boxShadow: '4px 4px 0 0 #252b3a',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
            {label}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 900, color: '#6434df' }}>
            <MessageSquare size={14} />
            <span>{val} {val === 1 ? 'chat' : 'chats'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleAddToFaq = (topic) => {
    navigate('/settings', { state: { prefillFaq: { question: topic, answer: '' } } });
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
  };

  const ratingVal = analytics?.storeRating?.formatted || analytics?.csat || '4.8/5';
  const scoreNum = parseFloat(ratingVal) || 4.8;
  const totalReviews = analytics?.storeRating?.totalReviews || 24;

  const supportSignals = [
    {
      label: 'AI confidence',
      value: analytics?.aiConfidence || '95%',
      tone: '#6434df',
      note: 'High-confidence answers across top intents'
    },
    {
      label: 'Escalation rate',
      value: analytics?.escalationRate || (analytics?.totalChats ? `${Math.round(((analytics?.open || 0) / analytics.totalChats) * 100)}%` : '0%'),
      tone: '#ff78c5',
      note: 'Low enough to stay proactive and human-aware'
    },
    {
      label: 'Store Rating (out of 5)',
      value: `${scoreNum.toFixed(1)}/5`,
      isRating: true,
      score: scoreNum,
      tone: '#0f7a57',
      note: `Average customer satisfaction score (${totalReviews} reviews)`
    },
    {
      label: 'FAQ gaps',
      value: analytics?.faqGaps !== undefined ? String(analytics.faqGaps) : (alerts?.totalUnresolved !== undefined ? String(alerts.totalUnresolved) : '0'),
      tone: '#c77d00',
      note: 'Suggestions pending review from recent tickets'
    },
  ];

  const suggestedFaqs = [
    'How do I update my billing email?',
    'What is the refund window for annual plans?',
    'Can I export support transcripts for my team?',
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fffdf5', fontFamily: 'var(--dp-typography-reading), sans-serif' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '32px 36px 40px', maxWidth: 1200, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#252b3a',
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 0.9,
              fontFamily: 'var(--dp-typography-display), sans-serif',
              textTransform: 'uppercase',
            }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 17, color: '#4d586d', margin: '10px 0 0', lineHeight: 1.6 }}>
              How your AI assistant is performing
            </p>
          </div>
          <div>
            <WeatherTimeWidget />
          </div>
        </div>

        {/* 3 Stat Cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 140, background: '#ffffff', border: '1px solid #eaecf0', borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
            <StatCard
              title="Total Chats"
              value={analytics?.totalChats ?? 0}
              icon={MessageSquare}
              iconBg="#f1ebff"
              iconColor="#6434df"
            />
            <StatCard
              title="Resolved"
              value={analytics?.resolved ?? 0}
              icon={CheckCircle2}
              iconBg="#e9fff5"
              iconColor="#0f7a57"
            />
            <StatCard
              title="Open"
              value={analytics?.open ?? 0}
              icon={Clock}
              iconBg="#fff2b8"
              iconColor="#c77d00"
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18, marginBottom: 32 }}>
          {supportSignals.map((signal) => (
            <div key={signal.label} style={{
              background: '#fffdf5',
              border: '3px solid #252b3a',
              borderRadius: 20,
              padding: '18px 18px 16px',
              boxShadow: '5px 5px 0 0 #252b3a',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4d586d' }}>
                {signal.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: signal.tone, marginTop: 12,               letterSpacing: '-0.02em', fontFamily: 'var(--dp-typography-display), sans-serif' }}>                {signal.value}
              </div>
              <div style={{ fontSize: 12, color: '#4d586d', marginTop: 8, lineHeight: 1.5 }}>
                {signal.isRating && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginRight: 6 }}>
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        size={11}
                        style={{
                          fill: starIdx <= Math.round(signal.score) ? '#f59e0b' : '#cbd5e1',
                          color: starIdx <= Math.round(signal.score) ? '#b45309' : '#94a3b8',
                        }}
                      />
                    ))}
                  </span>
                )}
                {signal.note}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Activity Card */}
        <div style={{
          background: '#fffdf5',
          border: '3px solid #252b3a',
          borderRadius: 28,
          padding: 24,
          boxShadow: '5px 5px 0 0 #252b3a',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#252b3a', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--dp-typography-display), sans-serif' }}>
                Chat Activity {chartRange === '7d' ? '– Last 7 Days' : '– Last 30 Days'}
              </h2>
              <span style={{
                background: '#f1ebff',
                color: '#6434df',
                border: '2px solid #252b3a',
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.04em',
                boxShadow: '2px 2px 0 0 #252b3a',
              }}>
                Volume: {totalVolumeInView} {totalVolumeInView === 1 ? 'chat' : 'chats'}
              </span>
            </div>

            <div style={{ display: 'inline-flex', background: '#ffffff', border: '2.5px solid #252b3a', borderRadius: 999, padding: 3, boxShadow: '3px 3px 0 0 #252b3a' }}>
              <button
                type="button"
                onClick={() => setChartRange('7d')}
                style={{
                  border: 'none',
                  background: chartRange === '7d' ? '#6434df' : 'transparent',
                  color: chartRange === '7d' ? '#ffffff' : '#4d586d',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.04em',
                }}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setChartRange('30d')}
                style={{
                  border: 'none',
                  background: chartRange === '30d' ? '#6434df' : 'transparent',
                  color: chartRange === '30d' ? '#ffffff' : '#4d586d',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.04em',
                }}
              >
                30 Days
              </button>
            </div>
          </div>

          <div style={{ height: 270, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData} margin={{ top: 28, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#252b3a"
                  tick={{ fill: '#4d586d', fontSize: 12, fontWeight: 700 }}
                  axisLine={{ stroke: '#252b3a', strokeWidth: 2 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#252b3a"
                  tick={{ fill: '#4d586d', fontSize: 12, fontWeight: 700 }}
                  axisLine={{ stroke: '#252b3a', strokeWidth: 2 }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  offset={28}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 100 }}
                  content={<CustomChartTooltip />}
                />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  activeBar={{ fill: '#7c4dff', stroke: '#252b3a', strokeWidth: 2.5 }}
                >
                  {displayChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? '#6434df' : '#f1f5f9'}
                      stroke="#252b3a"
                      strokeWidth={entry.count > 0 ? 2.5 : 1.5}
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={8}
                    formatter={(val) => (val > 0 ? val : '')}
                    style={{ fill: '#252b3a', fontWeight: 900, fontSize: 12, fontFamily: 'var(--dp-typography-display), sans-serif' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unanswered Questions Card */}
        <div style={{
          background: '#fffdf5',
          border: '3px solid #252b3a',
          borderLeft: '6px solid #f59e0b',
          borderRadius: 28,
          padding: 24,
          boxShadow: '5px 5px 0 0 #252b3a',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#252b3a', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--dp-typography-display), sans-serif' }}>
            Unanswered Questions
          </h2>
          <p style={{ fontSize: 15, color: '#4d586d', margin: '8px 0 18px', lineHeight: 1.7 }}>
            Questions your AI couldn't resolve — add them to your FAQ to improve it
          </p>

          {!alerts || alerts.alerts?.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f7a57', fontSize: 15, fontWeight: 700, background: '#e9fff5', border: '3px solid #252b3a', borderRadius: 16, padding: '12px 14px', boxShadow: '4px 4px 0 0 #252b3a' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} />
              <span>All caught up — your AI answered every question.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.alerts.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 16,
                  boxShadow: '5px 5px 0 0 rgba(37, 43, 58, 0.12)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.topic}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      asked {item.count}×
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {timeAgo(item.latest)}
                    </span>
                    <button
                      onClick={() => handleAddToFaq(item.topic)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: '3px solid #252b3a',
                        background: '#6434df',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: '4px 4px 0 0 #252b3a',
                      }}
                    >
                      <Plus size={14} /> Add to FAQ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 22, background: '#f1ebff', border: '3px solid #252b3a', borderRadius: 20, padding: 18, boxShadow: '6px 6px 0 0 #252b3a' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#252b3a', marginBottom: 12 }}>
              Suggested FAQ actions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {suggestedFaqs.map((faq) => (
                <button
                  key={faq}
                  onClick={() => handleAddToFaq(faq)}
                  style={{
                    background: '#ffffff',
                    border: '2px solid #252b3a',
                    borderRadius: 999,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#252b3a',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0 0 rgba(37,43,58,0.12)',
                  }}
                >
                  {faq}
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
