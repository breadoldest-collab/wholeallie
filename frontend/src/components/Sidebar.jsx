import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import QRCodeStyling from 'qr-code-styling';
import { LayoutDashboard, MessageSquare, Settings, LogOut, X, Copy, Check, Hash, Store, FileText, HelpCircle, QrCode, ExternalLink, Sparkles, User } from 'lucide-react';
import API from '../api/axios';

export default function Sidebar() {
  const location = useLocation();
  const navigate  = useNavigate();

  const businessName = localStorage.getItem('businessName') || 'My Business';
  const businessId   = localStorage.getItem('businessId')   || '';
  const userEmail    = localStorage.getItem('userEmail')    || 'admin@allie.io';
  const initial      = businessName.charAt(0).toUpperCase();
  const supportUrl   = businessId ? `${window.location.origin}/support/${businessId}` : '';
  const qrUrl        = supportUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(supportUrl)}` : '';

  const [customLogo, setCustomLogo]   = useState(() => localStorage.getItem('businessLogo') || '');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile]         = useState(null);

  const [analytics, setAnalytics]     = useState(null);
  const [copied, setCopied]           = useState(false);
  const [alertCount, setAlertCount]   = useState(0);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrStyle, setQrStyle]         = useState('rounded');
  const bottomRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    API.get('/api/analytics/alerts')
      .then(res => setAlertCount(res.data.totalUnresolved || 0))
      .catch(() => {});

    API.get('/api/settings')
      .then(res => {
        if (res.data?.logoUrl) {
          setCustomLogo(res.data.logoUrl);
          localStorage.setItem('businessLogo', res.data.logoUrl);
        }
      })
      .catch(() => {});

    const onBrandingUpdate = () => {
      setCustomLogo(localStorage.getItem('businessLogo') || '');
    };
    window.addEventListener('brandingUpdated', onBrandingUpdate);
    return () => window.removeEventListener('brandingUpdated', onBrandingUpdate);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const fetchData = async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          API.get('/api/settings'),
          API.get('/api/analytics?range=daily'),
        ]);
        setProfile(sRes.data);
        setAnalytics(aRes.data);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [profileOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (bottomRef.current && !bottomRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  useEffect(() => {
    if (!qrModalOpen || !supportUrl || !qrRef.current) return;

    const styleMap = {
      classic: { dots: 'square', corners: 'square' },
      rounded: { dots: 'rounded', corners: 'rounded' },
      dots: { dots: 'dots', corners: 'dot' },
      premium: { dots: 'extra-rounded', corners: 'extra-rounded' },
    };

    const currentStyle = styleMap[qrStyle] || styleMap.rounded;
    qrRef.current.innerHTML = '';

    const qrCode = new QRCodeStyling({
      width: 260,
      height: 260,
      margin: 12,
      data: supportUrl,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'M',
      },
      dotsOptions: {
        color: '#1f2937',
        type: currentStyle.dots
      },
      cornersSquareOptions: {
        color: '#1f2937',
        type: currentStyle.corners
      },
      backgroundOptions: {
        color: '#ffffff'
      }
    });

    qrCode.append(qrRef.current);

    return () => {
      if (qrRef.current) qrRef.current.innerHTML = '';
    };
  }, [qrModalOpen, qrStyle, supportUrl]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('businessId');
    localStorage.removeItem('businessName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(supportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQr = () => {
    window.print();
  };

  const navItems = [
    { name: 'Dashboard',     path: '/dashboard',     icon: LayoutDashboard, alert: alertCount > 0 },
    { name: 'Conversations', path: '/conversations', icon: MessageSquare },
    { name: 'Settings',      path: '/settings',      icon: Settings },
    { name: 'Profile',       path: '/profile',       icon: User },
  ];

  return (
    <>
      {qrModalOpen && (
        <div
          onClick={() => setQrModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              background: '#fffdf5',
              border: '3px solid #252b3a',
              borderRadius: 28,
              boxShadow: '12px 12px 0 0 #252b3a',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4d586d' }}>
                  Support Widget
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: 28, color: '#252b3a' }}>{businessName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#252b3a', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <style>{`@media print { .qr-widget-actions, .qr-widget-style-row { display: none !important; } .qr-widget-card { box-shadow: none !important; border: 0 !important; } }`}</style>

            <div className="qr-widget-card" style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 270, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div ref={qrRef} style={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: '#f1ebff',
                  border: '3px solid #252b3a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#252b3a',
                  fontWeight: 900,
                  fontSize: 20,
                  boxShadow: '4px 4px 0 0 #252b3a',
                }}>
                  {businessName?.charAt(0)?.toUpperCase() || 'F'}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: '#4d586d', textTransform: 'uppercase' }}>
                  Public support URL
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12,
                  padding: '10px 12px',
                }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all' }}>{supportUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{ background: 'none', border: 'none', color: copied ? '#10b981' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="qr-widget-style-row" style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { id: 'classic', label: 'Classic' },
                    { id: 'rounded', label: 'Rounded' },
                    { id: 'dots', label: 'Dots' },
                    { id: 'premium', label: 'Premium' },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setQrStyle(option.id)}
                      style={{
                        border: qrStyle === option.id ? '2px solid #252b3a' : '2px solid #cbd5e1',
                        background: qrStyle === option.id ? '#6434df' : '#ffffff',
                        color: qrStyle === option.id ? '#ffffff' : '#252b3a',
                        borderRadius: 999,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="qr-widget-actions" style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handlePrintQr}
                    style={{
                      background: '#252b3a', color: '#fff', border: '2px solid #252b3a', borderRadius: 12,
                      padding: '10px 14px', fontWeight: 800, cursor: 'pointer', boxShadow: '3px 3px 0 0 #cbd5e1',
                    }}
                  >
                    Print QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(false)}
                    style={{
                      background: '#fff', color: '#252b3a', border: '2px solid #252b3a', borderRadius: 12,
                      padding: '10px 14px', fontWeight: 800, cursor: 'pointer', boxShadow: '3px 3px 0 0 #252b3a',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside style={{
        width: 240,
        minWidth: 240,
        background: '#fffdf5',
        borderRight: '3px solid #252b3a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '22px 16px 18px',
        minHeight: '100vh',
        height: '100vh',
        overflowY: 'auto',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        boxSizing: 'border-box',
        fontFamily: 'var(--dp-typography-reading), sans-serif',
      }}>
      <div>
        <div style={{ padding: '0 8px', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 16,
            border: '3px solid #252b3a',
            background: '#fffdf5',
            boxShadow: '4px 4px 0 0 #252b3a',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              background: '#9bf1cd',
              border: '3px solid #252b3a',
              color: '#252b3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 15,
              overflow: 'hidden',
              fontFamily: 'var(--dp-typography-display), sans-serif',
            }}>
              {customLogo ? (
                <img
                  src={customLogo}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                'A'
              )}
            </div>
            <span style={{
              fontSize: 20,
              fontWeight: 900,
              color: '#252b3a',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--dp-typography-display), sans-serif',
            }}>
              Allié
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navItems.map(({ name, path, icon: Icon, alert }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: isActive ? 700 : 600,
                  textDecoration: 'none',
                  color: isActive ? '#252b3a' : '#4d586d',
                  background: isActive ? '#f1ebff' : 'transparent',
                  border: isActive ? '3px solid #252b3a' : '3px solid transparent',
                  boxShadow: isActive ? '4px 4px 0 0 #252b3a' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ position: 'relative', display: 'flex' }}>
                  <Icon size={18} style={{ color: isActive ? '#252b3a' : '#4d586d' }} />
                  {alert && (
                    <span style={{
                      position: 'absolute', top: -3, right: -4,
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#ef4444',
                      border: '2px solid #fffdf5',
                    }} />
                  )}
                </div>
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div ref={bottomRef} style={{ position: 'relative' }}>
        {/* Profile Popover */}
        {profileOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #eaecf0',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            zIndex: 100,
            animation: 'fadePop 0.18s ease',
            width: 260,
          }}>
            <style>{`@keyframes fadePop { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
            
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              background: '#f1ebff',
              borderBottom: '3px solid #252b3a',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#9bf1cd', color: '#252b3a', border: '3px solid #252b3a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800,
                }}>
                  {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{businessName}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: '#64748b' }}>Admin</p>
                </div>
              </div>
              <button onClick={() => setProfileOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Hash size={13} style={{ color: '#94a3b8' }} />
                  <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{businessId.slice(0, 14)}…</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Store size={13} style={{ color: '#94a3b8' }} />
                  <span>{businessName}</span>
                </div>
                {profile?.faqs && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HelpCircle size={13} style={{ color: '#94a3b8' }} />
                    <span>{profile.faqs.length} FAQs</span>
                  </div>
                )}
              </div>

              {/* Widget URL */}
              <div style={{ borderTop: '1px solid #eaecf0', marginTop: 10, paddingTop: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Widget Link</p>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#f8fafc', border: '1px solid #eaecf0', borderRadius: 8, padding: '6px 8px',
                }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {supportUrl}
                  </span>
                  <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? '#10b981' : '#64748b', cursor: 'pointer' }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    border: '2px solid #252b3a',
                    borderRadius: 10,
                    background: '#f1ebff',
                    color: '#252b3a',
                    fontWeight: 800,
                    fontSize: 11,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 #252b3a',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Open QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Card Row */}
        <div style={{
          borderTop: '3px solid #252b3a',
          paddingTop: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => navigate('/profile')}
            title="Go to Profile & Branding"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
              flex: 1,
              minWidth: 0,
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#252b3a',
              border: '2px solid #252b3a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {customLogo ? (
                <img
                  src={customLogo}
                  alt={businessName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                initial
              )}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#252b3a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {businessName}
                </p>
                <span style={{
                  background: '#f1ebff',
                  color: '#6434df',
                  border: '1.5px solid #252b3a',
                  borderRadius: 999,
                  padding: '1px 6px',
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  boxShadow: '1px 1px 0 0 #252b3a',
                  flexShrink: 0,
                }}>
                  PREMIUM
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#4d586d', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userEmail}
              </p>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            <button
              onClick={handleLogout}
              title="Log Out"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
