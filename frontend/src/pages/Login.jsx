import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignInPage } from '../components/ui/sign-in';
import API from '../api/axios';

const sampleTestimonials = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Allié transformed our customer support response times by 80% overnight."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "The Gemini AI integration handles complex customer queries effortlessly."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",
    name: "Elena Rostova",
    handle: "@elenacx",
    text: "Intuitive dashboard, live analytics, and zero-effort customer setup."
  }
];

export default function Login({ initialMode = 'login' }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [verificationState, setVerificationState] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextMode = params.get('mode') === 'register' ? 'register' : initialMode;
    setMode(nextMode);
  }, [initialMode, location.search]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      if (mode === 'register') {
        const businessName = formData.get('businessName');
        const confirmPassword = formData.get('confirmPassword');

        if (!businessName || !String(businessName).trim()) {
          throw new Error('Business name is required');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const res = await API.post('/api/auth/register', {
          businessName: String(businessName).trim(),
          email,
          password,
        });

        if (res.data.verificationRequired) {
          setVerificationState({
            required: true,
            email,
            devCode: res.data.verificationCode || '',
            message: res.data.message || 'We sent a verification code to your email.'
          });
          setMode('register');
          return;
        }

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('businessId', res.data.businessId);
        localStorage.setItem('businessName', res.data.businessName || String(businessName).trim());
        localStorage.setItem('userEmail', email);
        navigate('/dashboard');
        return;
      }

      const res = await API.post('/api/auth/login', { email, password });
      if (res.data.verificationRequired) {
        setVerificationState({
          required: true,
          email,
          devCode: res.data.verificationCode || '',
          message: res.data.message || 'Please verify your email before continuing.'
        });
        setMode('register');
        return;
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('businessId', res.data.businessId);
      localStorage.setItem('businessName', res.data.businessName || '');
      localStorage.setItem('userEmail', email);
      navigate('/dashboard');
    } catch (err) {
      setVerificationState(null);
      setError(err.response?.data?.error || err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (code) => {
    if (!verificationState?.email) return;
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/api/auth/verify-email', {
        email: verificationState.email,
        code,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('businessId', res.data.businessId);
      localStorage.setItem('businessName', res.data.businessName || '');
      localStorage.setItem('userEmail', verificationState.email);
      setVerificationState(null);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!verificationState?.email) return;
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/api/auth/send-verification', {
        email: verificationState.email,
      });
      setVerificationState({
        required: true,
        email: verificationState.email,
        devCode: res.data.verificationCode || '',
        message: res.data.message || 'A new verification code has been sent.'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to resend the verification code.');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'register'
    ? (
        <span className="block font-black uppercase leading-[0.78] tracking-[-0.04em] text-[#252b3a]">
          <span className="block">Create your</span>
            <span className="block text-[#6434df]">Allié</span>
          <span className="block">Account</span>
        </span>
      )
    : (
        <span className="block font-black uppercase leading-[0.78] tracking-[-0.04em] text-[#252b3a]">
          <span className="block">Sign in to</span>
            <span className="block text-[#6434df]">Allié</span>
        </span>
      );

  return (
    <SignInPage
      mode={mode}
      title={verificationState?.required ? 'Verify your email' : title}
      description={verificationState?.required
        ? `We sent a 6-digit code to ${verificationState.email}. Enter it to confirm this address before you continue.`
        : mode === 'register'
          ? 'Set up your business profile and start managing AI support in minutes.'
          : 'Access your AI support dashboard and manage real-time customer chats'}
      heroImageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80"
      testimonials={sampleTestimonials}
      onSubmit={handleAuth}
      onGoogleSignIn={() => alert('Google Sign-In integration ready')}
      onModeChange={(nextMode) => {
        setVerificationState(null);
        setMode(nextMode);
      }}
      onResetPassword={() => alert('Password reset link sent to your email')}
      errorMessage={error}
      isLoading={loading}
      verificationState={verificationState}
      onVerifyEmail={handleVerifyEmail}
      onResendCode={handleResendCode}
    />
  );
}
