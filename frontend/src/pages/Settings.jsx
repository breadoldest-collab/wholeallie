import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';
import { FileText, HelpCircle, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';

const MAX_DESC = 500;

export default function Settings() {
  const location = useLocation();
  const [description, setDescription] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  useEffect(() => { fetchSettings(); }, []);

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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

  const addFaq    = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);
  const removeFaq = (i) => setFaqs(prev => prev.filter((_, idx) => idx !== i));
  const changeFaq = (i, field, val) => {
    setFaqs(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
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
  const blurStyle  = (e) => {
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
          background: '#ffffff', border: '1px solid #10b981',
          color: '#10b981', fontWeight: 600, fontSize: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
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
              padding: '12px 16px', borderRadius: 12, fontSize: 14,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#ef4444',
            }}>
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading settings…</div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Business Description Card */}
              <div style={{
                background: '#fffdf5', border: '3px solid #252b3a',
                borderRadius: 28, padding: 24, boxShadow: '5px 5px 0 0 #252b3a',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: '#f1ebff', border: '3px solid #252b3a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={16} style={{ color: '#6434df' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Business Description</h2>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                        Context used by the AI to answer customer questions
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: description.length > MAX_DESC * 0.9 ? '#ef4444' : '#64748b',
                    background: '#f8fafc', border: '1px solid #eaecf0',
                    padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap',
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
                borderRadius: 28, padding: 24, boxShadow: '5px 5px 0 0 #252b3a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: '#e9fff5', border: '3px solid #252b3a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <HelpCircle size={16} style={{ color: '#252b3a' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        Frequently Asked Questions
                      </h2>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                        {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} configured
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addFaq}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 16px', borderRadius: 999, border: '3px solid #252b3a',
                      background: '#6434df', color: '#fff',
                      fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      boxShadow: '4px 4px 0 0 #252b3a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Plus size={15} /> Add FAQ
                  </button>
                </div>

                {/* Empty state */}
                {faqs.length === 0 ? (
                  <div style={{
                    border: '2px dashed #cbd5e1', borderRadius: 14,
                    padding: '40px 20px', textAlign: 'center',
                    color: '#64748b', fontSize: 14,
                  }}>
                    <HelpCircle size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                    No FAQs added yet.<br />
                    <span style={{ color: '#6434df', fontWeight: 700, cursor: 'pointer' }} onClick={addFaq}>
                      + Add your first FAQ
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {faqs.map((faq, i) => (
                      <div key={i} style={{
                        background: '#fffdf5', border: '3px solid #252b3a',
                        borderRadius: 18, padding: 16, position: 'relative', boxShadow: '4px 4px 0 0 rgba(37, 43, 58, 0.12)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, color: '#6434df',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
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
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Question */}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#6434df', marginTop: 10, flexShrink: 0 }}>Q:</span>
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
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginTop: 10, flexShrink: 0 }}>A:</span>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '12px 28px', borderRadius: 14, border: '3px solid #252b3a',
                    background: saving ? '#f1ebff' : '#6434df',
                    color: '#fff', fontSize: 15, fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    minWidth: 160, justifyContent: 'center',
                    boxShadow: '6px 6px 0 0 #252b3a',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    opacity: saving ? 0.85 : 1,
                  }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '8px 8px 0 0 #252b3a'; } }}
                  onMouseLeave={e => { if (!saving) { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '6px 6px 0 0 #252b3a'; } }}
                >
                  <Save size={16} />
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
