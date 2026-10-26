import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';
import {
  Palette,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Bot,
  QrCode,
  ShieldCheck,
  Eye,
  Trash2,
  ExternalLink
} from 'lucide-react';

const PRESET_LOGOS = [
  {
    name: 'Neo Purple',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cyber Mint',
    url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Minimal Orange',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Electric Blue',
    url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=160&auto=format&fit=crop&q=80',
  },
];

export default function Customization() {
  const [logoUrl, setLogoUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [logoShape, setLogoShape] = useState('circle'); // circle, squircle, square
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const businessName = localStorage.getItem('businessName') || 'My Business';
  const businessId = localStorage.getItem('businessId') || '';
  const initial = businessName.charAt(0).toUpperCase();
  const supportUrl = businessId ? `${window.location.origin}/support/${businessId}` : '';

  useEffect(() => {
    fetchCurrentBranding();
  }, []);

  const fetchCurrentBranding = async () => {
    try {
      const res = await API.get('/api/settings');
      if (res.data?.logoUrl) {
        setLogoUrl(res.data.logoUrl);
        setUrlInput(res.data.logoUrl);
        localStorage.setItem('businessLogo', res.data.logoUrl);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File size must be under 2MB.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setLogoUrl(dataUrl);
      setUrlInput('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter an image URL.');
      return;
    }
    setErrorMsg('');
    setLogoUrl(urlInput.trim());
  };

  const handleResetLogo = () => {
    setLogoUrl('');
    setUrlInput('');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const currentRes = await API.get('/api/settings');
      await API.post('/api/settings', {
        description: currentRes.data?.description || '',
        faqs: currentRes.data?.faqs || [],
        logoUrl: logoUrl || '',
      });

      if (logoUrl) {
        localStorage.setItem('businessLogo', logoUrl);
      } else {
        localStorage.removeItem('businessLogo');
      }

      // Notify Sidebar and any other components immediately
      window.dispatchEvent(new Event('brandingUpdated'));

      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch (err) {
      setErrorMsg('Failed to save branding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getBorderRadius = () => {
    if (logoShape === 'circle') return '50%';
    if (logoShape === 'squircle') return '14px';
    return '6px';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fffdf5', fontFamily: 'var(--dp-typography-reading), sans-serif' }}>
      <Sidebar />

      {/* Success Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
            borderRadius: 14,
            background: '#ffffff',
            border: '3px solid #252b3a',
            color: '#10b981',
            fontWeight: 800,
            fontSize: 14,
            boxShadow: '6px 6px 0 0 #252b3a',
            animation: 'slideDownToast 0.2s ease',
          }}
        >
          <style>{`@keyframes slideDownToast { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <CheckCircle2 size={20} style={{ color: '#10b981' }} />
          Company Logo & Branding Saved!
        </div>
      )}

      <main style={{ flex: 1, padding: '32px 36px 40px', maxWidth: 1040, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Page Title */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: '#f1ebff', border: '2px solid #252b3a', boxShadow: '2px 2px 0 0 #252b3a', marginBottom: 10 }}>
              <Palette size={14} style={{ color: '#6434df' }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#252b3a' }}>
                Admin Customization
              </span>
            </div>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#252b3a',
                margin: 0,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                textTransform: 'uppercase',
                fontFamily: 'var(--dp-typography-display), sans-serif',
              }}
            >
              Company Logo & Branding
            </h1>
            <p style={{ fontSize: 16, color: '#4d586d', margin: '10px 0 0', lineHeight: 1.5 }}>
              Upload your company logo to customize your admin sidebar, public customer chat widget, and QR code badges.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                background: '#fef2f2',
                border: '3px solid #ef4444',
                color: '#b91c1c',
                boxShadow: '4px 4px 0 0 #ef4444',
              }}
            >
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Loading customization settings…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Main Customization Section */}
              <div
                style={{
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 28,
                  padding: 26,
                  boxShadow: '6px 6px 0 0 #252b3a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: '#9bf1cd',
                        border: '3px solid #252b3a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '2px 2px 0 0 #252b3a',
                      }}
                    >
                      <ImageIcon size={18} style={{ color: '#252b3a' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                        Company Logo Upload
                      </h2>
                      <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                        Provide an image file or direct image URL for your business
                      </p>
                    </div>
                  </div>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: '2px solid #ef4444',
                        borderRadius: 10,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '2px 2px 0 0 #ef4444',
                      }}
                    >
                      <RotateCcw size={13} />
                      Reset to Default
                    </button>
                  )}
                </div>

                {/* Upload & URL Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                  {/* Drag & Drop File Upload */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: dragActive ? '#f1ebff' : '#ffffff',
                      border: `3px dashed ${dragActive ? '#6434df' : '#252b3a'}`,
                      borderRadius: 20,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: dragActive ? '6px 6px 0 0 #6434df' : '4px 4px 0 0 #252b3a',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e.target.files?.[0])}
                    />

                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: '#f1ebff',
                        border: '3px solid #252b3a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6434df',
                        marginBottom: 12,
                        boxShadow: '2px 2px 0 0 #252b3a',
                      }}
                    >
                      <Upload size={24} />
                    </div>

                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#252b3a' }}>
                      Click to upload or drag & drop
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                      PNG, JPG, SVG, WebP up to 2MB
                    </p>
                  </div>

                  {/* Image URL Input & Presets */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '3px solid #252b3a',
                      borderRadius: 20,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '4px 4px 0 0 #252b3a',
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#252b3a', marginBottom: 8 }}>
                        Or Enter Image URL
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          style={{
                            flex: 1,
                            background: '#fffdf5',
                            border: '2px solid #252b3a',
                            borderRadius: 12,
                            padding: '10px 12px',
                            fontSize: 13,
                            color: '#252b3a',
                            outline: 'none',
                            boxShadow: '2px 2px 0 0 #252b3a',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          style={{
                            background: '#252b3a',
                            color: '#ffffff',
                            border: '2px solid #252b3a',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0 0 #cbd5e1',
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Presets */}
                    <div style={{ marginTop: 16 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                        Quick Presets
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {PRESET_LOGOS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setLogoUrl(preset.url);
                              setUrlInput(preset.url);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 9px',
                              borderRadius: 999,
                              background: logoUrl === preset.url ? '#f1ebff' : '#fffdf5',
                              border: '2px solid #252b3a',
                              cursor: 'pointer',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#252b3a' }}>
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Shape Switcher */}
                <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderTop: '2px solid #252b3a', paddingTop: 18 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#252b3a' }}>
                    Avatar Display Shape:
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: 'circle', label: 'Circle (50%)' },
                      { id: 'squircle', label: 'Squircle' },
                      { id: 'square', label: 'Square' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLogoShape(opt.id)}
                        style={{
                          background: logoShape === opt.id ? '#6434df' : '#ffffff',
                          color: logoShape === opt.id ? '#ffffff' : '#252b3a',
                          border: '2px solid #252b3a',
                          borderRadius: 999,
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '2px 2px 0 0 #252b3a',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Live Preview Studio */}
              <div
                style={{
                  background: '#fffdf5',
                  border: '3px solid #252b3a',
                  borderRadius: 28,
                  padding: 26,
                  boxShadow: '6px 6px 0 0 #252b3a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: '#f1ebff',
                      border: '3px solid #252b3a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '2px 2px 0 0 #252b3a',
                    }}
                  >
                    <Eye size={18} style={{ color: '#6434df' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                      Live Preview Studio
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                      See how your custom logo appears across your admin sidebar and customer touchpoints
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                  {/* Preview 1: Sidebar Profile Card */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '3px solid #252b3a',
                      borderRadius: 20,
                      padding: 16,
                      boxShadow: '4px 4px 0 0 #252b3a',
                    }}
                  >
                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
                      1. In Sidebar Profile
                    </p>
                    <div
                      style={{
                        padding: 12,
                        background: '#fffdf5',
                        border: '2px solid #252b3a',
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: getBorderRadius(),
                          background: '#252b3a',
                          border: '2px solid #252b3a',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 16,
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '2px 2px 0 0 #252b3a',
                        }}
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#252b3a' }}>
                          {businessName}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#4d586d' }}>
                          Admin Account
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview 2: Customer Chat Header */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '3px solid #252b3a',
                      borderRadius: 20,
                      padding: 16,
                      boxShadow: '4px 4px 0 0 #252b3a',
                    }}
                  >
                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
                      2. Customer Chat Header
                    </p>
                    <div
                      style={{
                        padding: 12,
                        background: '#f1ebff',
                        border: '2px solid #252b3a',
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: getBorderRadius(),
                          background: '#9bf1cd',
                          border: '2px solid #252b3a',
                          color: '#252b3a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 16,
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '2px 2px 0 0 #252b3a',
                        }}
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Bot size={22} />
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#252b3a' }}>
                            {businessName}
                          </p>
                          <span style={{ fontSize: 9, fontWeight: 800, background: '#e9fff5', border: '1px solid #252b3a', padding: '1px 5px', borderRadius: 999 }}>
                            Verified
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: '#4d586d' }}>
                          Allié AI Support Assistant
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview 3: QR Code Center Badge */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '3px solid #252b3a',
                      borderRadius: 20,
                      padding: 16,
                      boxShadow: '4px 4px 0 0 #252b3a',
                    }}
                  >
                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
                      3. QR Code Badge
                    </p>
                    <div
                      style={{
                        padding: 12,
                        background: '#fffdf5',
                        border: '2px solid #252b3a',
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: getBorderRadius(),
                          background: '#f1ebff',
                          border: '3px solid #252b3a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#252b3a',
                          fontWeight: 900,
                          fontSize: 18,
                          overflow: 'hidden',
                          boxShadow: '3px 3px 0 0 #252b3a',
                        }}
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#4d586d' }}>
                        Brand Badge in QR Center
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Actions Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  padding: '20px 24px',
                  background: '#f1ebff',
                  border: '3px solid #252b3a',
                  borderRadius: 24,
                  boxShadow: '5px 5px 0 0 #252b3a',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#252b3a' }}>
                    Ready to publish your branding?
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#4d586d' }}>
                    Changes take effect across the sidebar and your public customer widget immediately.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#6434df',
                    color: '#ffffff',
                    border: '3px solid #252b3a',
                    borderRadius: 16,
                    padding: '14px 28px',
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '4px 4px 0 0 #252b3a',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <Sparkles size={18} />
                  <span>{saving ? 'Saving Branding…' : 'Save Logo & Branding'}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
