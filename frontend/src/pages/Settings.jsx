import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';
import { FileText, HelpCircle, Plus, Trash2, Save, CheckCircle2, ClipboardPaste, ChevronDown, ChevronUp } from 'lucide-react';

const MAX_DESC = 500;

export default function Settings() {
  const location = useLocation();
  const [description, setDescription] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const bulkRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Auto-add prefillFaq from Dashboard "Add to FAQ" button
  useEffect(() => {
    if (!loading && location.state?.prefillFaq) {
      const { question, answer } = location.state.prefillFaq;
      setFaqs(prev => {
        const alreadyExists = prev.some(f => f.question === question);
        if (alreadyExists) return prev;
        return [...prev, { question, answer: answer || '' }];
      });
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    }
  }, [loading, location.state]);

  const fetchSettings = async () => {
    try {
      const res = await API.get('/api/settings');
      setDescription(res.data.description || '');
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      await API.post('/api/settings', { description, faqs });
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch {
      setErrorMsg('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);
  const removeFaq = (i) => setFaqs(prev => prev.filter((_, idx) => idx !== i));
  const changeFaq = (i, field, val) => {
    setFaqs(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  };

  /**
   * Bulk import parser – supports formats:
   *   Q: ... A: ...
   *   Q: ... \n A: ...
   *   "Question?" → "Answer"
   *   Numbered:  1. Question? \n Answer text
   *   Plain pairs: line 1 = question (ends with ?), line 2 = answer
   */
  const parseBulkFaqs = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [];

    // Try Q: / A: block format
    let i = 0;
    while (i < lines.length) {
      const qLine = lines[i];
      const aLine = lines[i + 1];

      const qMatch = qLine.match(/^(?:Q:|Question:|q\.)[\s*]*(.*)/i);
      const aMatch = aLine && aLine.match(/^(?:A:|Answer:|a\.)[\s*]*(.*)/i);

      if (qMatch && aMatch) {
        parsed.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
        i += 2;
        continue;
      }

      // Pipe-separated:  Question | Answer
      if (qLine.includes('|')) {
        const [q, a] = qLine.split('|').map(s => s.trim());
        if (q && a) { parsed.push({ question: q, answer: a }); i++; continue; }
      }

      // Numbered:  1. What is ...? → Answer on next line
      const numMatch = qLine.match(/^\d+[\.\)]\s*(.*\?)\s*$/);
      if (numMatch && aLine && !aLine.match(/^\d+[\.\)]/)) {
        parsed.push({ question: numMatch[1].trim(), answer: aLine });
        i += 2;
        continue;
      }

      // Plain question (ends with ?) followed by answer line
      if (qLine.endsWith('?') && aLine && !aLine.endsWith('?')) {
        parsed.push({ question: qLine, answer: aLine });
        i += 2;
        continue;
      }

      i++;
    }

    return parsed;
  };

  const handleBulkImport = () => {
    setBulkError('');
    if (!bulkText.trim()) { setBulkError('Please paste some FAQ text first.'); return; }
    const parsed = parseBulkFaqs(bulkText);
    if (parsed.length === 0) {
      setBulkError('Could not parse any Q&A pairs. Use format:\nQ: What are your hours?\nA: We are open 10am–10pm.');
      return;
    }
    setFaqs(prev => [...prev, ...parsed]);
    setBulkText('');
    setShowBulkImport(false);
  };

  const inputStyle = {
    width: '100%',
    background: '#fffdf5',
    border: '3px solid #252b3a',
    borderRadius: 14,
    padding: '12px 14px',
    color: '#252b3a',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: '4px 4px 0 0 #252b3a',
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = '#6434df';
    e.target.style.boxShadow = '4px 4px 0 0 #6434df';
  };
  const blurStyle = (e) => {
    e.target.style.borderColor = '#252b3a';
    e.target.style.boxShadow = '4px 4px 0 0 #252b3a';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fffdf5', fontFamily: 'var(--dp-typography-reading), sans-serif' }}>
      <Sidebar />

      {/* Success Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', borderRadius: 14,
          background: '#ffffff', border: '3px solid #252b3a',
          color: '#0f7a57', fontWeight: 800, fontSize: 14,
          boxShadow: '6px 6px 0 0 #252b3a',
          animation: 'slideDownToast 0.2s ease',
        }}>
          <style>{`@keyframes slideDownToast { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <CheckCircle2 size={18} />
          Settings saved!
        </div>
      )}

      <main style={{ flex: 1, padding: '32px 36px 40px', maxWidth: 1000, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <h1 style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#252b3a',
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 0.9,
              textTransform: 'uppercase',
              fontFamily: 'var(--dp-typography-display), sans-serif',
            }}>
              AI Support Settings
            </h1>
            <p style={{ fontSize: 17, color: '#4d586d', margin: '10px 0 0', lineHeight: 1.6 }}>
              Configure your knowledge base and FAQ pairs for the Gemini AI bot
            </p>
          </div>

          {errorMsg && (
            <div style={{
              padding: '12px 16px', borderRadius: 14,
              border: '3px solid #252b3a', background: '#fee2e2',
              color: '#991b1b', fontSize: 14, fontWeight: 700,
              boxShadow: '4px 4px 0 0 #252b3a',
            }}>
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{
                height: 160, borderRadius: 28, border: '3px solid #252b3a',
                background: '#fffdf5', boxShadow: '5px 5px 0 0 #252b3a',
              }} />
              <div style={{
                height: 220, borderRadius: 28, border: '3px solid #252b3a',
                background: '#fffdf5', boxShadow: '5px 5px 0 0 #252b3a',
              }} />
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Business Description Card */}
              <div style={{
                background: '#fffdf5', border: '3px solid #252b3a',
                borderRadius: 28, padding: 24, boxShadow: '6px 6px 0 0 #252b3a',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: '#f1ebff', border: '3px solid #252b3a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={18} style={{ color: '#6434df' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#252b3a', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                        Business Description
                      </h2>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                        Context used by the AI to answer customer questions
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: description.length > MAX_DESC * 0.9 ? '#ef4444' : '#252b3a',
                    background: '#ffffff', border: '2px solid #252b3a',
                    padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                    boxShadow: '2px 2px 0 0 #252b3a',
                  }}>
                    {description.length} / {MAX_DESC}
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={description}
                  maxLength={MAX_DESC}
                  onChange={e => setDescription(e.target.value)}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="We are a premium SaaS company offering 24/7 customer support. Our products include…"
                  style={{ ...inputStyle, resize: 'none', marginTop: 16, minHeight: 140, lineHeight: 1.7 }}
                />
              </div>

              {/* FAQs Card */}
              <div style={{
                background: '#fffdf5', border: '3px solid #252b3a',
                borderRadius: 28, padding: 24, boxShadow: '6px 6px 0 0 #252b3a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: '#e9fff5', border: '3px solid #252b3a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <HelpCircle size={18} style={{ color: '#252b3a' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#252b3a', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                        Frequently Asked Questions
                      </h2>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                        {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} configured
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Bulk Import Toggle */}
                    <button
                      type="button"
                      onClick={() => { setShowBulkImport(v => !v); setBulkError(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 16px', borderRadius: 999, border: '3px solid #252b3a',
                        background: showBulkImport ? '#252b3a' : '#fffdf5', color: showBulkImport ? '#fff' : '#252b3a',
                        fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                        boxShadow: '4px 4px 0 0 #252b3a', whiteSpace: 'nowrap',
                      }}
                    >
                      <ClipboardPaste size={14} />
                      Bulk Import
                      {showBulkImport ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={addFaq}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '10px 18px', borderRadius: 999, border: '3px solid #252b3a',
                        background: '#6434df', color: '#fff',
                        fontSize: 12, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                        boxShadow: '4px 4px 0 0 #252b3a', whiteSpace: 'nowrap',
                      }}
                    >
                      <Plus size={15} /> Add FAQ
                    </button>
                  </div>
                </div>

                {/* ── Bulk Import Panel ── */}
                {showBulkImport && (
                  <div style={{
                    background: '#f8f5ff', border: '3px solid #252b3a',
                    borderRadius: 18, padding: 20, marginBottom: 20,
                    boxShadow: '4px 4px 0 0 #252b3a',
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 900, color: '#252b3a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      📋 Paste FAQ Block
                    </p>
                    <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                      Paste any format —{' '}
                      <code style={{ background: '#ede9ff', padding: '1px 5px', borderRadius: 4 }}>Q: … A: …</code>{' '}
                      or{' '}
                      <code style={{ background: '#ede9ff', padding: '1px 5px', borderRadius: 4 }}>Question? | Answer</code>{' '}
                      or question on one line + answer on the next.
                    </p>
                    <textarea
                      ref={bulkRef}
                      rows={8}
                      value={bulkText}
                      onChange={e => { setBulkText(e.target.value); setBulkError(''); }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                      placeholder={`Q: What are your store timings?\nA: We are open every day from 10 AM to 11 PM.\n\nQ: Do you offer home delivery?\nA: Yes, via Swiggy and Zomato within a 5 km radius.\n\nWhat is your most popular item?\nOur Original Recipe Fried Chicken is a fan favourite!`}
                      style={{ ...inputStyle, resize: 'vertical', fontSize: 13, lineHeight: 1.6, fontFamily: 'monospace', marginBottom: 12 }}
                    />
                    {bulkError && (
                      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#dc2626', fontWeight: 700, whiteSpace: 'pre-line' }}>
                        ⚠ {bulkError}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleBulkImport}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '10px 20px', borderRadius: 999, border: '3px solid #252b3a',
                          background: '#6434df', color: '#fff',
                          fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                          boxShadow: '4px 4px 0 0 #252b3a',
                        }}
                      >
                        <ClipboardPaste size={14} /> Import FAQs
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBulkText(''); setBulkError(''); setShowBulkImport(false); }}
                        style={{
                          padding: '10px 18px', borderRadius: 999, border: '3px solid #252b3a',
                          background: '#fffdf5', color: '#252b3a',
                          fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                          boxShadow: '4px 4px 0 0 #252b3a',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {faqs.length === 0 ? (
                  <div style={{
                    border: '2.5px dashed #252b3a', borderRadius: 16,
                    padding: '36px 20px', textAlign: 'center',
                    color: '#64748b', fontSize: 14,
                    background: '#ffffff',
                  }}>
                    <HelpCircle size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                    No FAQs added yet.<br />
                    <span style={{ color: '#6434df', fontWeight: 800, cursor: 'pointer' }} onClick={addFaq}>
                      + Add your first FAQ
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {faqs.map((faq, i) => (
                      <div key={i} style={{
                        background: '#ffffff', border: '3px solid #252b3a',
                        borderRadius: 18, padding: 18, position: 'relative', boxShadow: '4px 4px 0 0 #252b3a',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 900, color: '#6434df',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                          }}>
                            FAQ #{i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFaq(i)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#94a3b8', display: 'flex', padding: 4, borderRadius: 6,
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                            title="Remove FAQ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Question */}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#6434df', marginTop: 10, flexShrink: 0 }}>Q:</span>
                          <input
                            type="text" required value={faq.question}
                            onChange={e => changeFaq(i, 'question', e.target.value)}
                            onFocus={focusStyle} onBlur={blurStyle}
                            placeholder="e.g. What is your refund policy?"
                            style={inputStyle}
                          />
                        </div>

                        {/* Answer */}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#64748b', marginTop: 10, flexShrink: 0 }}>A:</span>
                          <textarea
                            rows={2} required value={faq.answer}
                            onChange={e => changeFaq(i, 'answer', e.target.value)}
                            onFocus={focusStyle} onBlur={blurStyle}
                            placeholder="e.g. We offer full refunds within 30 days of purchase."
                            style={{ ...inputStyle, resize: 'vertical' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 32px', borderRadius: 9999, border: '3px solid #252b3a',
                    background: saving ? '#f1ebff' : '#6434df',
                    color: '#fff', fontSize: 15, fontWeight: 900,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    minWidth: 180, justifyContent: 'center',
                    boxShadow: '6px 6px 0 0 #252b3a',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    opacity: saving ? 0.85 : 1,
                  }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '8px 8px 0 0 #252b3a'; } }}
                  onMouseLeave={e => { if (!saving) { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '6px 6px 0 0 #252b3a'; } }}
                >
                  <Save size={18} />
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>

            </form>
          )}
        </div>
      </main>
    </div>
  );
}
