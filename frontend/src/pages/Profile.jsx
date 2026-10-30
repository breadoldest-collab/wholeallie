import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';
import QRCodeStyling from 'qr-code-styling';
import {
  User,
  Image as ImageIcon,
  QrCode,
  Link as LinkIcon,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Code,
  Building,
  Mail,
  Hash,
  Eye,
  Sliders,
  CheckSquare,
  Bot,
  Store,
  MapPin,
  Globe,
  Phone,
  Clock,
  Share2,
  Compass
} from 'lucide-react';

const PRESET_COMPANY_LOGOS = [
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

const PRESET_BOT_AVATARS = [
  {
    name: 'Allié Bot',
    url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cyber Spark',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Smart Assistant',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Friendly AI',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80',
  },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('photo'); // 'photo' | 'qr' | 'links' | 'misc'
  const [avatarSubTab, setAvatarSubTab] = useState('sidebar'); // 'sidebar' | 'bot'

  // Company / Sidebar Avatar
  const [logoUrl, setLogoUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [logoShape, setLogoShape] = useState('circle'); // 'circle' | 'squircle' | 'square'

  // Customer Chatbot Avatar
  const [botAvatarUrl, setBotAvatarUrl] = useState('');
  const [botUrlInput, setBotUrlInput] = useState('');
  const [botShape, setBotShape] = useState('circle'); // 'circle' | 'squircle' | 'square'
  const [useSameAvatar, setUseSameAvatar] = useState(false);

  // Store Profile, Location & Media Links
  const [location, setLocation] = useState({
    address: '',
    city: '',
    country: '',
    mapsUrl: '',
  });
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    instagram: '',
    twitter: '',
    facebook: '',
    linkedin: '',
  });
  const [storeContact, setStoreContact] = useState({
    phone: '',
    supportEmail: '',
    hours: '',
  });

  const [qrStyle, setQrStyle] = useState('rounded'); // 'classic' | 'rounded' | 'dots' | 'premium'
  const [qrColor, setQrColor] = useState('#252b3a');
  const [showCenterLogo, setShowCenterLogo] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [dragActiveBot, setDragActiveBot] = useState(false);

  const fileInputRef = useRef(null);
  const botFileInputRef = useRef(null);
  const qrRef = useRef(null);
  const qrCodeInstanceRef = useRef(null);

  const [businessName, setBusinessName] = useState(() => localStorage.getItem('businessName') || 'My Business');
  const businessId = localStorage.getItem('businessId') || '';
  const userEmail = localStorage.getItem('userEmail') || 'admin@allie.io';
  const initial = (businessName || 'M').charAt(0).toUpperCase();
  const supportUrl = businessId ? `${window.location.origin}/support/${businessId}` : '';

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await API.get('/api/settings');
      if (res.data?.businessName) {
        setBusinessName(res.data.businessName);
        localStorage.setItem('businessName', res.data.businessName);
      }
      const loadedLogo = res.data?.logoUrl || '';
      const loadedBot = res.data?.botAvatarUrl || '';

      if (loadedLogo) {
        setLogoUrl(loadedLogo);
        setUrlInput(loadedLogo);
        localStorage.setItem('businessLogo', loadedLogo);
      }
      if (loadedBot) {
        setBotAvatarUrl(loadedBot);
        setBotUrlInput(loadedBot);
        localStorage.setItem('botAvatar', loadedBot);
      }

      if (res.data?.location) {
        setLocation({
          address: res.data.location.address || '',
          city: res.data.location.city || '',
          country: res.data.location.country || '',
          mapsUrl: res.data.location.mapsUrl || '',
        });
      }
      if (res.data?.socialLinks) {
        setSocialLinks({
          website: res.data.socialLinks.website || '',
          instagram: res.data.socialLinks.instagram || '',
          twitter: res.data.socialLinks.twitter || '',
          facebook: res.data.socialLinks.facebook || '',
          linkedin: res.data.socialLinks.linkedin || '',
        });
      }
      if (res.data?.storeContact) {
        setStoreContact({
          phone: res.data.storeContact.phone || '',
          supportEmail: res.data.storeContact.supportEmail || '',
          hours: res.data.storeContact.hours || '',
        });
      }

      // If bot avatar is empty or matches the logo, default to linked mode
      if (loadedLogo && (!loadedBot || loadedBot === loadedLogo)) {
        setUseSameAvatar(true);
      } else {
        setUseSameAvatar(false);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-generate QR Code whenever options change
  useEffect(() => {
    if (!supportUrl || !qrRef.current) return;

    const styleMap = {
      classic: { dots: 'square', corners: 'square' },
      rounded: { dots: 'rounded', corners: 'rounded' },
      dots: { dots: 'dots', corners: 'dot' },
      premium: { dots: 'extra-rounded', corners: 'extra-rounded' },
    };

    const currentStyle = styleMap[qrStyle] || styleMap.rounded;
    qrRef.current.innerHTML = '';

    const qrCode = new QRCodeStyling({
      width: 240,
      height: 240,
      margin: 10,
      data: supportUrl,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H',
      },
      dotsOptions: {
        color: qrColor,
        type: currentStyle.dots,
      },
      cornersSquareOptions: {
        color: qrColor,
        type: currentStyle.corners,
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      ...(showCenterLogo && logoUrl
        ? {
            image: logoUrl,
            imageOptions: {
              crossOrigin: 'anonymous',
              margin: 6,
              imageSize: 0.35,
            },
          }
        : {}),
    });

    qrCode.append(qrRef.current);
    qrCodeInstanceRef.current = qrCode;

    return () => {
      if (qrRef.current) qrRef.current.innerHTML = '';
    };
  }, [supportUrl, qrStyle, qrColor, showCenterLogo, logoUrl, activeTab]);

  const handleToggleSameAvatar = (checked) => {
    setUseSameAvatar(checked);
    if (checked) {
      setBotAvatarUrl(logoUrl);
      setBotUrlInput(urlInput);
      setBotShape(logoShape);
      setAvatarSubTab('sidebar');
    }
  };

  const handleFileUpload = (file, target = 'logo') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be under 5MB.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (target === 'logo') {
        setLogoUrl(dataUrl);
        setUrlInput('');
        if (useSameAvatar) {
          setBotAvatarUrl(dataUrl);
          setBotUrlInput('');
        }
      } else {
        setBotAvatarUrl(dataUrl);
        setBotUrlInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragLogo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveLogo(true);
    } else if (e.type === 'dragleave') {
      setDragActiveLogo(false);
    }
  };

  const handleDropLogo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLogo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], 'logo');
    }
  };

  const handleDragBot = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveBot(true);
    } else if (e.type === 'dragleave') {
      setDragActiveBot(false);
    }
  };

  const handleDropBot = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveBot(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], 'bot');
    }
  };

  const handleApplyUrl = (target = 'logo') => {
    if (target === 'logo') {
      if (!urlInput.trim()) {
        setErrorMsg('Please enter an image URL.');
        return;
      }
      setErrorMsg('');
      setLogoUrl(urlInput.trim());
      if (useSameAvatar) {
        setBotAvatarUrl(urlInput.trim());
      }
    } else {
      if (!botUrlInput.trim()) {
        setErrorMsg('Please enter an image URL.');
        return;
      }
      setErrorMsg('');
      setBotAvatarUrl(botUrlInput.trim());
    }
  };

  const handleResetLogo = (target = 'logo') => {
    if (target === 'logo') {
      setLogoUrl('');
      setUrlInput('');
      if (useSameAvatar) {
        setBotAvatarUrl('');
        setBotUrlInput('');
      }
    } else {
      setBotAvatarUrl('');
      setBotUrlInput('');
    }
  };

  const handleDownloadQr = () => {
    if (qrCodeInstanceRef.current) {
      qrCodeInstanceRef.current.download({
        name: `${businessName.toLowerCase().replace(/\s+/g, '-')}-support-qr`,
        extension: 'png',
      });
    }
  };

  const handlePrintQr = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    if (!supportUrl) return;
    try {
      await navigator.clipboard.writeText(supportUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const embedCode = `<iframe\n  src="${supportUrl}"\n  width="400"\n  height="600"\n  style="border: 3px solid #252b3a; border-radius: 20px; box-shadow: 6px 6px 0 0 #252b3a;"\n  title="Customer Support Chat"\n></iframe>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyId = async () => {
    if (!businessId) return;
    try {
      await navigator.clipboard.writeText(businessId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');

    const effectiveBotAvatar = useSameAvatar ? logoUrl : botAvatarUrl;

    try {
      const currentRes = await API.get('/api/settings');
      await API.post('/api/settings', {
        businessName: businessName.trim() || 'My Business',
        description: currentRes.data?.description || '',
        faqs: currentRes.data?.faqs || [],
        logoUrl: logoUrl || '',
        botAvatarUrl: effectiveBotAvatar || '',
        location,
        socialLinks,
        storeContact,
      });

      if (businessName.trim()) {
        localStorage.setItem('businessName', businessName.trim());
      }

      if (logoUrl) {
        localStorage.setItem('businessLogo', logoUrl);
      } else {
        localStorage.removeItem('businessLogo');
      }

      if (effectiveBotAvatar) {
        localStorage.setItem('botAvatar', effectiveBotAvatar);
      } else {
        localStorage.removeItem('botAvatar');
      }

      window.dispatchEvent(new Event('brandingUpdated'));

      setToastMessage('Profile and avatars saved successfully!');
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch (err) {
      setErrorMsg('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getBorderRadius = (shape = 'circle') => {
    if (shape === 'circle') return '50%';
    if (shape === 'squircle') return '16px';
    return '8px';
  };

  const tabs = [
    { id: 'photo', label: 'Company Photo & Logo', icon: ImageIcon },
    { id: 'store', label: 'Store Profile & Location', icon: Store },
    { id: 'qr', label: 'QR Code Studio', icon: QrCode },
    { id: 'links', label: 'Links & Embedding', icon: LinkIcon },
    { id: 'misc', label: 'Business Details & Misc', icon: Building },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fffdf5', fontFamily: 'var(--dp-typography-reading), sans-serif' }}>
      <Sidebar />

      {/* Printable styles */}
      <style>{`
        @media print {
          aside, nav, .profile-nav-tabs, .profile-header-actions, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 auto !important;
          }
          .printable-qr-poster {
            display: block !important;
            margin: 40px auto !important;
            text-align: center !important;
          }
        }
      `}</style>

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
          {toastMessage}
        </div>
      )}

      <main style={{ flex: 1, padding: '32px 36px 40px', maxWidth: 1060, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: '#f1ebff',
                  border: '2px solid #252b3a',
                  boxShadow: '2px 2px 0 0 #252b3a',
                  marginBottom: 10,
                }}
              >
                <User size={13} style={{ color: '#6434df' }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#252b3a' }}>
                  Business Profile & Branding
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
                Profile Customization
              </h1>
              <p style={{ fontSize: 16, color: '#4d586d', margin: '10px 0 0', lineHeight: 1.5 }}>
                Customize your company photos, interactive QR code styles, public links, and miscellaneous store parameters.
              </p>
            </div>

            <div className="profile-header-actions">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#6434df',
                  color: '#ffffff',
                  border: '3px solid #252b3a',
                  borderRadius: 14,
                  padding: '12px 22px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '4px 4px 0 0 #252b3a',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.transform = 'translate(-2px, -2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <Sparkles size={16} />
                <span>{saving ? 'Saving Changes…' : 'Save Profile'}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                background: '#fef2f2',
                border: '3px solid #ef4444',
                color: '#b91c1c',
                boxShadow: '4px 4px 0 0 #ef4444',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Navigation Tabs */}
          <div
            className="profile-nav-tabs"
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              borderBottom: '3px solid #252b3a',
              paddingBottom: 14,
            }}
          >
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: isActive ? 800 : 700,
                    cursor: 'pointer',
                    background: isActive ? '#f1ebff' : '#ffffff',
                    color: '#252b3a',
                    border: '3px solid #252b3a',
                    boxShadow: isActive ? '4px 4px 0 0 #252b3a' : '2px 2px 0 0 #252b3a',
                    transform: isActive ? 'translate(-2px, -2px)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? '#6434df' : '#252b3a' }} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'pulseProfileSkeleton 1.8s ease-in-out infinite' }}>
              <style>{`
                @keyframes pulseProfileSkeleton {
                  0%, 100% { opacity: 0.95; }
                  50% { opacity: 0.55; }
                }
              `}</style>
              <div style={{
                background: '#fffdf5', border: '3px solid #252b3a',
                borderRadius: 28, padding: 26, boxShadow: '6px 6px 0 0 #252b3a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: '#e9fff5', border: '3px solid #252b3a' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ width: 170, height: 18, background: '#e2e8f0', borderRadius: 6 }} />
                    <div style={{ width: 250, height: 12, background: '#f1f5f9', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ height: 48, borderRadius: 14, border: '3px solid #252b3a', background: '#ffffff', boxShadow: '3px 3px 0 0 rgba(37,43,58,0.1)' }} />
              </div>
            </div>
          ) : (
            <div>

              {/* TAB 1: Company Photo & Logo */}
              {activeTab === 'photo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Company Name Editor */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '3px solid #252b3a',
                      borderRadius: 22,
                      padding: '18px 22px',
                      boxShadow: '4px 4px 0 0 #252b3a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Building size={16} style={{ color: '#6434df' }} />
                        <label style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#252b3a' }}>
                          Company / Business Name
                        </label>
                      </div>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Acme Studio, Lime Stores, etc."
                        style={{
                          width: '100%',
                          maxWidth: 440,
                          background: '#fffdf5',
                          border: '2px solid #252b3a',
                          borderRadius: 12,
                          padding: '10px 14px',
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#252b3a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
                        Your AI chatbot will be named: <strong>{businessName ? `${businessName}’s Allié` : 'Allié'}</strong>.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#252b3a', background: '#ffd05b', padding: '6px 14px', borderRadius: 999, border: '2px solid #252b3a', boxShadow: '2px 2px 0 0 #252b3a' }}>
                        Assistant: {businessName ? `${businessName}’s Allié` : 'Allié'}
                      </span>
                    </div>
                  </div>

                  {/* Sync / Separate Avatars Tick Box Toggle */}
                  <div
                    onClick={() => handleToggleSameAvatar(!useSameAvatar)}
                    style={{
                      background: useSameAvatar ? '#f1ebff' : '#ffffff',
                      border: '3px solid #252b3a',
                      borderRadius: 22,
                      padding: '16px 20px',
                      boxShadow: '4px 4px 0 0 #252b3a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: useSameAvatar ? 'translate(-1px, -1px)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          border: '3px solid #252b3a',
                          background: useSameAvatar ? '#6434df' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '2px 2px 0 0 #252b3a',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {useSameAvatar && <Check size={18} color="#ffffff" strokeWidth={3.5} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#252b3a' }}>
                          Keep the same avatar for both Sidebar & Customer Chatbot
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {useSameAvatar
                            ? "Synchronized: Your company logo is automatically mirrored to the support chatbot. Uncheck to give your bot its own mascot."
                            : "Separate Mode: Official company logo for sidebar, and a dedicated mascot/avatar for your chatbot."}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '5px 12px',
                        borderRadius: 999,
                        background: useSameAvatar ? '#6434df' : '#fef08a',
                        color: useSameAvatar ? '#ffffff' : '#854d0e',
                        border: '2px solid #252b3a',
                        boxShadow: '2px 2px 0 0 #252b3a',
                        flexShrink: 0,
                      }}
                    >
                      {useSameAvatar ? 'Same Logo (Linked)' : 'Separate Mascot Mode'}
                    </span>
                  </div>

                  {/* Sub-Tab Switcher: Sidebar Avatar vs Customer Chatbot Avatar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <button
                      type="button"
                      onClick={() => setAvatarSubTab('sidebar')}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 20,
                        border: '3px solid #252b3a',
                        background: avatarSubTab === 'sidebar' ? '#f1ebff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        boxShadow: avatarSubTab === 'sidebar' ? '5px 5px 0 0 #6434df' : '3px 3px 0 0 #252b3a',
                        transform: avatarSubTab === 'sidebar' ? 'translate(-2px, -2px)' : 'none',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: avatarSubTab === 'sidebar' ? '#6434df' : '#e2e8f0',
                          border: '2px solid #252b3a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: avatarSubTab === 'sidebar' ? '#ffffff' : '#252b3a',
                          boxShadow: '2px 2px 0 0 #252b3a',
                          flexShrink: 0,
                        }}
                      >
                        <Building size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#252b3a' }}>1. Sidebar Avatar</span>
                          {logoUrl && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: '#dcfce7', color: '#166534', border: '1px solid #166534' }}>
                              Configured
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                          Company identity & dashboard user badge
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (useSameAvatar) {
                          setAvatarSubTab('sidebar');
                        } else {
                          setAvatarSubTab('bot');
                        }
                      }}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 20,
                        border: '3px solid #252b3a',
                        background: avatarSubTab === 'bot' ? '#f1ebff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        boxShadow: avatarSubTab === 'bot' ? '5px 5px 0 0 #6434df' : '3px 3px 0 0 #252b3a',
                        transform: avatarSubTab === 'bot' ? 'translate(-2px, -2px)' : 'none',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        opacity: useSameAvatar ? 0.75 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: avatarSubTab === 'bot' ? '#9bf1cd' : '#e2e8f0',
                          border: '2px solid #252b3a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#252b3a',
                          boxShadow: '2px 2px 0 0 #252b3a',
                          flexShrink: 0,
                        }}
                      >
                        <Bot size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#252b3a' }}>2. Customer Chatbot</span>
                          {useSameAvatar ? (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: '#f1ebff', color: '#6434df', border: '1px solid #6434df' }}>
                              Linked
                            </span>
                          ) : (
                            botAvatarUrl && (
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: '#dcfce7', color: '#166534', border: '1px solid #166534' }}>
                                Mascot
                              </span>
                            )
                          )}
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                          {useSameAvatar ? 'Currently mirrors Company Logo' : 'Live support widget & AI assistant mascot'}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* SUB-SECTION 1: Company / Sidebar Avatar Editor */}
                  {avatarSubTab === 'sidebar' && (
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
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: '#f1ebff',
                              border: '3px solid #252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <Building size={20} style={{ color: '#6434df' }} />
                          </div>
                          <div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                              Company Logo & Sidebar Avatar
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                              Set your business logo or photo displayed in your internal dashboard and sidebar
                            </p>
                          </div>
                        </div>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => handleResetLogo('logo')}
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
                            Reset to Initial
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {/* Drag & Drop File Upload */}
                        <div
                          onDragEnter={handleDragLogo}
                          onDragLeave={handleDragLogo}
                          onDragOver={handleDragLogo}
                          onDrop={handleDropLogo}
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            background: dragActiveLogo ? '#f1ebff' : '#ffffff',
                            border: `3px dashed ${dragActiveLogo ? '#6434df' : '#252b3a'}`,
                            borderRadius: 20,
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: dragActiveLogo ? '6px 6px 0 0 #6434df' : '4px 4px 0 0 #252b3a',
                          }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(e.target.files?.[0], 'logo')}
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
                            Upload company photo
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                            Drag & drop or browse (PNG, JPG, SVG up to 5MB)
                          </p>
                        </div>

                        {/* URL & Presets */}
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
                              Or Enter Direct Image URL / Base64
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                placeholder="https://... or data:image/..."
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
                                onClick={() => handleApplyUrl('logo')}
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

                          <div style={{ marginTop: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                              Company Presets
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {PRESET_COMPANY_LOGOS.map((preset) => (
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
                                    padding: '5px 10px',
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

                      {/* Shape Controls */}
                      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderTop: '2px solid #252b3a', paddingTop: 18 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#252b3a' }}>
                          Sidebar Avatar Shape:
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[
                            { id: 'circle', label: 'Circle' },
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
                  )}

                  {/* SUB-SECTION 2: Customer Chatbot Avatar Editor */}
                  {avatarSubTab === 'bot' && (
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
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: '#9bf1cd',
                              border: '3px solid #252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <Bot size={20} style={{ color: '#252b3a' }} />
                          </div>
                          <div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                              Customer Support Chatbot Avatar
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                              Customize the assistant face seen by your visitors in the public live chat widget
                            </p>
                          </div>
                        </div>

                        {botAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => handleResetLogo('bot')}
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
                            Reset to Default Bot
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {/* Drag & Drop File Upload */}
                        <div
                          onDragEnter={handleDragBot}
                          onDragLeave={handleDragBot}
                          onDragOver={handleDragBot}
                          onDrop={handleDropBot}
                          onClick={() => botFileInputRef.current?.click()}
                          style={{
                            background: dragActiveBot ? '#f1ebff' : '#ffffff',
                            border: `3px dashed ${dragActiveBot ? '#6434df' : '#252b3a'}`,
                            borderRadius: 20,
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: dragActiveBot ? '6px 6px 0 0 #6434df' : '4px 4px 0 0 #252b3a',
                          }}
                        >
                          <input
                            ref={botFileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(e.target.files?.[0], 'bot')}
                          />

                          <div
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 16,
                              background: '#9bf1cd',
                              border: '3px solid #252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#252b3a',
                              marginBottom: 12,
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <Upload size={24} />
                          </div>

                          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#252b3a' }}>
                            Upload chatbot avatar
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                            Drag & drop or browse (PNG, JPG, SVG up to 5MB)
                          </p>
                        </div>

                        {/* URL & Presets */}
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
                              Or Enter Direct Image URL / Base64
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                placeholder="https://... or data:image/..."
                                value={botUrlInput}
                                onChange={(e) => setBotUrlInput(e.target.value)}
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
                                onClick={() => handleApplyUrl('bot')}
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

                          <div style={{ marginTop: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                              Bot Persona Presets
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {PRESET_BOT_AVATARS.map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => {
                                    setBotAvatarUrl(preset.url);
                                    setBotUrlInput(preset.url);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 10px',
                                    borderRadius: 999,
                                    background: botAvatarUrl === preset.url ? '#f1ebff' : '#fffdf5',
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

                      {/* Shape Controls */}
                      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderTop: '2px solid #252b3a', paddingTop: 18 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#252b3a' }}>
                          Chatbot Avatar Shape:
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[
                            { id: 'circle', label: 'Circle' },
                            { id: 'squircle', label: 'Squircle' },
                            { id: 'square', label: 'Square' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setBotShape(opt.id)}
                              style={{
                                background: botShape === opt.id ? '#6434df' : '#ffffff',
                                color: botShape === opt.id ? '#ffffff' : '#252b3a',
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
                  )}

                  {/* Live Appearance Previews (Independent previews for both!) */}
                  <div
                    style={{
                      background: '#fffdf5',
                      border: '3px solid #252b3a',
                      borderRadius: 28,
                      padding: 26,
                      boxShadow: '6px 6px 0 0 #252b3a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Eye size={18} style={{ color: '#6434df' }} />
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#252b3a' }}>
                          Live Avatar Previews (Real-Time)
                        </h3>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                        Each updates independently based on your settings above
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                      {/* Left: Sidebar Avatar Preview */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '2px solid #252b3a',
                          borderRadius: 20,
                          padding: 18,
                          boxShadow: '4px 4px 0 0 #252b3a',
                          borderTop: avatarSubTab === 'sidebar' ? '5px solid #6434df' : '2px solid #252b3a',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                            In Sidebar Avatar
                          </p>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#f1ebff', color: '#6434df', border: '1px solid #6434df' }}>
                            Company Identity
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: getBorderRadius(logoShape),
                              background: '#252b3a',
                              border: '2px solid #252b3a',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              overflow: 'hidden',
                              boxShadow: '2px 2px 0 0 #252b3a',
                              flexShrink: 0,
                            }}
                          >
                            {logoUrl ? (
                              <img src={logoUrl} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              initial
                            )}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#252b3a' }}>{businessName}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{userEmail}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Customer Chat Widget Preview */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '2px solid #252b3a',
                          borderRadius: 20,
                          padding: 18,
                          boxShadow: '4px 4px 0 0 #252b3a',
                          borderTop: (!useSameAvatar && avatarSubTab === 'bot') ? '5px solid #10b981' : '2px solid #252b3a',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                            In Customer Chat Widget
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: useSameAvatar ? '#f1ebff' : '#e9fff5',
                              color: useSameAvatar ? '#6434df' : '#0f7a57',
                              border: `1px solid ${useSameAvatar ? '#6434df' : '#0f7a57'}`,
                            }}
                          >
                            {useSameAvatar ? 'Mirrored Company Logo' : 'Custom Mascot'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: getBorderRadius(useSameAvatar ? logoShape : botShape),
                              background: '#9bf1cd',
                              border: '2px solid #252b3a',
                              color: '#252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              overflow: 'hidden',
                              boxShadow: '2px 2px 0 0 #252b3a',
                              flexShrink: 0,
                            }}
                          >
                            {useSameAvatar ? (
                              logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                initial
                              )
                            ) : (
                              botAvatarUrl ? (
                                <img src={botAvatarUrl} alt="Bot Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Bot size={24} style={{ color: '#252b3a' }} />
                              )
                            )}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#252b3a' }}>{businessName}</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                              Online Assistant
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Store Profile, Location & Media Links */}
              {activeTab === 'store' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Top: Introduction Card */}
                  <div
                    style={{
                      background: '#fffdf5',
                      border: '3px solid #252b3a',
                      borderRadius: 28,
                      padding: 26,
                      boxShadow: '6px 6px 0 0 #252b3a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: '#ffd05b',
                            border: '3px solid #252b3a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '2px 2px 0 0 #252b3a',
                          }}
                        >
                          <Store size={22} style={{ color: '#252b3a' }} />
                        </div>
                        <div>
                          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#252b3a', margin: 0, textTransform: 'uppercase' }}>
                            Store Location & Media Profile
                          </h2>
                          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                            Configure your physical store address, map navigation links, customer helpline, and social media channels.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {location.mapsUrl && (
                          <a
                            href={location.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#ffffff',
                              color: '#252b3a',
                              border: '2px solid #252b3a',
                              borderRadius: 10,
                              padding: '8px 14px',
                              fontSize: 12,
                              fontWeight: 800,
                              textDecoration: 'none',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <Compass size={14} style={{ color: '#6434df' }} />
                            <span>Preview Map</span>
                          </a>
                        )}
                        {socialLinks.website && (
                          <a
                            href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#ffffff',
                              color: '#252b3a',
                              border: '2px solid #252b3a',
                              borderRadius: 10,
                              padding: '8px 14px',
                              fontSize: 12,
                              fontWeight: 800,
                              textDecoration: 'none',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <Globe size={14} style={{ color: '#10b981' }} />
                            <span>Visit Site</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Grid: Form Inputs on Left, Live Customer Profile Preview on Right */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                    
                    {/* Left Column: Location & Contact */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      
                      {/* Section 1: Physical Store Location */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '3px solid #252b3a',
                          borderRadius: 24,
                          padding: 24,
                          boxShadow: '6px 6px 0 0 #252b3a',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: '#e9fff5',
                              border: '2px solid #252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <MapPin size={18} style={{ color: '#0f7a57' }} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#252b3a', margin: 0 }}>
                              Physical Store Location
                            </h3>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                              Where can customers find your storefront or office?
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#252b3a', marginBottom: 6, textTransform: 'uppercase' }}>
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={location.address}
                              onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="e.g. 742 Evergreen Terrace, Suite 101"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                background: '#fffdf5',
                                border: '2px solid #252b3a',
                                borderRadius: 12,
                                padding: '10px 14px',
                                fontSize: 14,
                                color: '#252b3a',
                                outline: 'none',
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#252b3a', marginBottom: 6, textTransform: 'uppercase' }}>
                                City / State
                              </label>
                              <input
                                type="text"
                                value={location.city}
                                onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="e.g. San Francisco, CA"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '10px 14px',
                                  fontSize: 14,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#252b3a', marginBottom: 6, textTransform: 'uppercase' }}>
                                Country / Postal Code
                              </label>
                              <input
                                type="text"
                                value={location.country}
                                onChange={(e) => setLocation(prev => ({ ...prev, country: e.target.value }))}
                                placeholder="e.g. United States, 94107"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '10px 14px',
                                  fontSize: 14,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 800, color: '#252b3a', textTransform: 'uppercase' }}>
                                Google Maps or Directions Link
                              </label>
                              {location.mapsUrl && (
                                <a
                                  href={location.mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: 11, fontWeight: 700, color: '#6434df', textDecoration: 'underline' }}
                                >
                                  Test Link
                                </a>
                              )}
                            </div>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={location.mapsUrl}
                                onChange={(e) => setLocation(prev => ({ ...prev, mapsUrl: e.target.value }))}
                                placeholder="https://maps.google.com/?q=..."
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '10px 14px 10px 38px',
                                  fontSize: 13,
                                  fontFamily: 'monospace',
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                              <Compass size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#64748b' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Store Contact & Operating Hours */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '3px solid #252b3a',
                          borderRadius: 24,
                          padding: 24,
                          boxShadow: '6px 6px 0 0 #252b3a',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: '#f1ebff',
                              border: '2px solid #252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <Phone size={18} style={{ color: '#6434df' }} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#252b3a', margin: 0 }}>
                              Store Contact & Hours
                            </h3>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                              Direct phone helpline, public support email, and store timings
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#252b3a', marginBottom: 6, textTransform: 'uppercase' }}>
                                Customer Care Phone
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  value={storeContact.phone}
                                  onChange={(e) => setStoreContact(prev => ({ ...prev, phone: e.target.value }))}
                                  placeholder="+1 (555) 234-5678"
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    background: '#fffdf5',
                                    border: '2px solid #252b3a',
                                    borderRadius: 12,
                                    padding: '10px 14px 10px 38px',
                                    fontSize: 14,
                                    color: '#252b3a',
                                    outline: 'none',
                                  }}
                                />
                                <Phone size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#64748b' }} />
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#252b3a', marginBottom: 6, textTransform: 'uppercase' }}>
                                Support Email
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="email"
                                  value={storeContact.supportEmail}
                                  onChange={(e) => setStoreContact(prev => ({ ...prev, supportEmail: e.target.value }))}
                                  placeholder="help@yourbrand.com"
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    background: '#fffdf5',
                                    border: '2px solid #252b3a',
                                    borderRadius: 12,
                                    padding: '10px 14px 10px 38px',
                                    fontSize: 14,
                                    color: '#252b3a',
                                    outline: 'none',
                                  }}
                                />
                                <Mail size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#64748b' }} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#252b3a', marginBottom: 6, textTransform: 'uppercase' }}>
                              Store Operating Hours
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={storeContact.hours}
                                onChange={(e) => setStoreContact(prev => ({ ...prev, hours: e.target.value }))}
                                placeholder="e.g. Mon-Fri: 9:00 AM - 8:00 PM, Sat: 10:00 AM - 6:00 PM"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '10px 14px 10px 38px',
                                  fontSize: 14,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                              <Clock size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#64748b' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Social Media Links & Customer Profile Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      
                      {/* Section 3: Social Media & Related Links */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '3px solid #252b3a',
                          borderRadius: 24,
                          padding: 24,
                          boxShadow: '6px 6px 0 0 #252b3a',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: '#ffd05b',
                              border: '2px solid #252b3a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '2px 2px 0 0 #252b3a',
                            }}
                          >
                            <Share2 size={18} style={{ color: '#252b3a' }} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#252b3a', margin: 0 }}>
                              Media & Social Links
                            </h3>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                              Public channels for marketing, product catalogs, and community
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#252b3a', marginBottom: 4, textTransform: 'uppercase' }}>
                              Official Website URL
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={socialLinks.website}
                                onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://yourstore.com"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '8px 12px 8px 36px',
                                  fontSize: 13,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                              <Globe size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#64748b' }} />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#252b3a', marginBottom: 4, textTransform: 'uppercase' }}>
                              Instagram Profile
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={socialLinks.instagram}
                                onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                                placeholder="https://instagram.com/yourstore or @yourstore"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '8px 12px 8px 36px',
                                  fontSize: 13,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                              <Share2 size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#e1306c' }} />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#252b3a', marginBottom: 4, textTransform: 'uppercase' }}>
                              Twitter / X Profile
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={socialLinks.twitter}
                                onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                                placeholder="https://x.com/yourhandle"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '8px 12px 8px 36px',
                                  fontSize: 13,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                              <Share2 size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#252b3a' }} />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#252b3a', marginBottom: 4, textTransform: 'uppercase' }}>
                                Facebook Page
                              </label>
                              <input
                                type="text"
                                value={socialLinks.facebook}
                                onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                                placeholder="facebook.com/yourpage"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '8px 12px',
                                  fontSize: 13,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#252b3a', marginBottom: 4, textTransform: 'uppercase' }}>
                                LinkedIn / Media
                              </label>
                              <input
                                type="text"
                                value={socialLinks.linkedin}
                                onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                                placeholder="linkedin.com/company/..."
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: '#fffdf5',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '8px 12px',
                                  fontSize: 13,
                                  color: '#252b3a',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Live Customer Store Profile Card Preview */}
                      <div
                        style={{
                          background: '#fffdf5',
                          border: '3px solid #252b3a',
                          borderRadius: 24,
                          padding: 22,
                          boxShadow: '6px 6px 0 0 #252b3a',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                            Customer Store Card Preview
                          </p>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: '#e9fff5', color: '#0f7a57', border: '1px solid #0f7a57' }}>
                            Live Preview
                          </span>
                        </div>

                        {/* Visual Store Card */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '3px solid #252b3a',
                            borderRadius: 18,
                            padding: 18,
                            boxShadow: '4px 4px 0 0 #252b3a',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: getBorderRadius(logoShape),
                                background: '#252b3a',
                                border: '2px solid #252b3a',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: 20,
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {logoUrl ? (
                                <img src={logoUrl} alt="Store Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                initial
                              )}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#252b3a' }}>
                                {businessName}
                              </h4>
                              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                                {location.city ? `${location.city}${location.country ? `, ${location.country}` : ''}` : 'Store Location'}
                              </p>
                            </div>
                          </div>

                          {location.address && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #eaecf0', marginBottom: 10 }}>
                              <MapPin size={15} style={{ color: '#6434df', marginTop: 2, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: '#252b3a', fontWeight: 600 }}>
                                {location.address}
                              </span>
                            </div>
                          )}

                          {storeContact.hours && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #eaecf0', marginBottom: 12 }}>
                              <Clock size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: '#252b3a', fontWeight: 600 }}>
                                {storeContact.hours}
                              </span>
                            </div>
                          )}

                          {/* Quick Action Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '2px dashed #e2e8f0' }}>
                            {storeContact.phone && (
                              <a
                                href={`tel:${storeContact.phone}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#e9fff5',
                                  color: '#0f7a57',
                                  border: '2px solid #252b3a',
                                  borderRadius: 8,
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                }}
                              >
                                <Phone size={12} />
                                {storeContact.phone}
                              </a>
                            )}
                            {location.mapsUrl && (
                              <a
                                href={location.mapsUrl}
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
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                }}
                              >
                                <Compass size={12} />
                                Directions
                              </a>
                            )}
                            {socialLinks.website && (
                              <a
                                href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#ffffff',
                                  color: '#252b3a',
                                  border: '2px solid #252b3a',
                                  borderRadius: 8,
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                }}
                              >
                                <Globe size={12} />
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QR Code Studio */}
              {activeTab === 'qr' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#f1ebff',
                            border: '3px solid #252b3a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '2px 2px 0 0 #252b3a',
                          }}
                        >
                          <QrCode size={20} style={{ color: '#6434df' }} />
                        </div>
                        <div>
                          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                            Support QR Code Studio
                          </h2>
                          <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                            Customize your high-resolution customer support QR code for printed materials and stickers
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          type="button"
                          onClick={handleDownloadQr}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#252b3a',
                            color: '#ffffff',
                            border: '2px solid #252b3a',
                            borderRadius: 12,
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0 0 #cbd5e1',
                          }}
                        >
                          <Download size={14} />
                          Download PNG
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintQr}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#ffffff',
                            color: '#252b3a',
                            border: '2px solid #252b3a',
                            borderRadius: 12,
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0 0 #252b3a',
                          }}
                        >
                          <Printer size={14} />
                          Print Poster
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
                      {/* Generated QR Box */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '3px solid #252b3a',
                          borderRadius: 24,
                          padding: 20,
                          boxShadow: '6px 6px 0 0 #252b3a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <div ref={qrRef} style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        <p style={{ margin: '12px 0 0', fontSize: 13, fontWeight: 800, color: '#252b3a' }}>
                          Scan to chat with {businessName}
                        </p>
                      </div>

                      {/* Customization Options */}
                      <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Style Selector */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#252b3a', marginBottom: 8 }}>
                            QR Pattern Style
                          </label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                              { id: 'rounded', label: 'Rounded' },
                              { id: 'dots', label: 'Dots' },
                              { id: 'classic', label: 'Classic' },
                              { id: 'premium', label: 'Extra Rounded' },
                            ].map((style) => (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => setQrStyle(style.id)}
                                style={{
                                  background: qrStyle === style.id ? '#6434df' : '#ffffff',
                                  color: qrStyle === style.id ? '#ffffff' : '#252b3a',
                                  border: '2px solid #252b3a',
                                  borderRadius: 12,
                                  padding: '8px 16px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  boxShadow: '2px 2px 0 0 #252b3a',
                                }}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color Options */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#252b3a', marginBottom: 8 }}>
                            QR Color
                          </label>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {['#252b3a', '#6434df', '#0f766e', '#b91c1c', '#1e3a8a'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setQrColor(c)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: c,
                                  border: qrColor === c ? '3px solid #6434df' : '2px solid #252b3a',
                                  boxShadow: qrColor === c ? '0 0 0 2px #fff, 0 0 0 4px #6434df' : '2px 2px 0 0 #252b3a',
                                  cursor: 'pointer',
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Center Logo Toggle */}
                        {logoUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f1ebff', border: '2px solid #252b3a', borderRadius: 14, padding: '10px 14px' }}>
                            <input
                              type="checkbox"
                              id="centerLogo"
                              checked={showCenterLogo}
                              onChange={(e) => setShowCenterLogo(e.target.checked)}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6434df' }}
                            />
                            <label htmlFor="centerLogo" style={{ fontSize: 13, fontWeight: 800, color: '#252b3a', cursor: 'pointer' }}>
                              Embed Company Logo in QR Center
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Links & Embedding */}
              {activeTab === 'links' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Public Link Card */}
                  <div
                    style={{
                      background: '#fffdf5',
                      border: '3px solid #252b3a',
                      borderRadius: 28,
                      padding: 26,
                      boxShadow: '6px 6px 0 0 #252b3a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#9bf1cd',
                          border: '3px solid #252b3a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '2px 2px 0 0 #252b3a',
                        }}
                      >
                        <LinkIcon size={20} style={{ color: '#252b3a' }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                          Dedicated Customer Support URL
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                          Direct link to your store’s AI customer assistant
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        background: '#ffffff',
                        border: '3px solid #252b3a',
                        borderRadius: 16,
                        padding: '12px 16px',
                        boxShadow: '4px 4px 0 0 #252b3a',
                      }}
                    >
                      <span style={{ fontSize: 14, fontFamily: 'monospace', color: '#252b3a', fontWeight: 700, wordBreak: 'break-all' }}>
                        {supportUrl}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: copiedLink ? '#dcfce7' : '#6434df',
                            color: copiedLink ? '#10b981' : '#ffffff',
                            border: '2px solid #252b3a',
                            borderRadius: 10,
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0 0 #252b3a',
                          }}
                        >
                          {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                        <a
                          href={supportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#ffffff',
                            color: '#252b3a',
                            border: '2px solid #252b3a',
                            borderRadius: 10,
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            textDecoration: 'none',
                            boxShadow: '2px 2px 0 0 #252b3a',
                          }}
                        >
                          <ExternalLink size={14} />
                          <span>Open Chat</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* HTML Iframe Embed Code */}
                  <div
                    style={{
                      background: '#fffdf5',
                      border: '3px solid #252b3a',
                      borderRadius: 28,
                      padding: 26,
                      boxShadow: '6px 6px 0 0 #252b3a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#f1ebff',
                            border: '3px solid #252b3a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '2px 2px 0 0 #252b3a',
                          }}
                        >
                          <Code size={20} style={{ color: '#6434df' }} />
                        </div>
                        <div>
                          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                            Website Embed Code (Iframe)
                          </h2>
                          <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                            Paste this snippet into any HTML page, Shopify, WordPress, or Webflow site
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyEmbed}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: copiedEmbed ? '#dcfce7' : '#252b3a',
                          color: copiedEmbed ? '#10b981' : '#ffffff',
                          border: '2px solid #252b3a',
                          borderRadius: 10,
                          padding: '8px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '2px 2px 0 0 #cbd5e1',
                        }}
                      >
                        {copiedEmbed ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedEmbed ? 'Code Copied!' : 'Copy HTML'}</span>
                      </button>
                    </div>

                    <pre
                      style={{
                        background: '#1e293b',
                        color: '#f8fafc',
                        padding: 16,
                        borderRadius: 16,
                        border: '3px solid #252b3a',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        overflowX: 'auto',
                        margin: 0,
                        lineHeight: 1.6,
                        boxShadow: '4px 4px 0 0 #252b3a',
                      }}
                    >
                      {embedCode}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 4: Business Details & Misc */}
              {activeTab === 'misc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div
                    style={{
                      background: '#fffdf5',
                      border: '3px solid #252b3a',
                      borderRadius: 28,
                      padding: 26,
                      boxShadow: '6px 6px 0 0 #252b3a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#9bf1cd',
                          border: '3px solid #252b3a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '2px 2px 0 0 #252b3a',
                        }}
                      >
                        <Building size={20} style={{ color: '#252b3a' }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#252b3a', margin: 0 }}>
                          Company Profile & Identification
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                          Core account metadata and platform identifiers
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                      <div style={{ background: '#ffffff', border: '2px solid #252b3a', borderRadius: 18, padding: 16, boxShadow: '3px 3px 0 0 #252b3a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', marginBottom: 4 }}>
                          <Building size={14} />
                          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Business Name
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#252b3a' }}>
                          {businessName}
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '2px solid #252b3a', borderRadius: 18, padding: 16, boxShadow: '3px 3px 0 0 #252b3a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', marginBottom: 4 }}>
                          <Mail size={14} />
                          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Admin Email
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#252b3a' }}>
                          {userEmail}
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '2px solid #252b3a', borderRadius: 18, padding: 16, boxShadow: '3px 3px 0 0 #252b3a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Hash size={14} />
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              Store ID
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyId}
                            style={{ background: 'none', border: 'none', color: copiedId ? '#10b981' : '#6434df', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}
                          >
                            {copiedId ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#252b3a' }}>
                          {businessId || 'Not found'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
