import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const EMAIL_PROVIDER_NOTE = 'A public email like @gmail.com or @outlook.com is a valid contact address, but it is not proof of identity unless it is verified through a secure account check.';

const getEmailMeta = (value = '') => {
  const email = String(value || '').trim();
  const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const publicProviderPattern = /@(gmail\.com|outlook\.com|hotmail\.com|yahoo\.com|icloud\.com|aol\.com|protonmail\.com)$/i;
  const isPublicProvider = isValidFormat && publicProviderPattern.test(email);

  return {
    email,
    isValidFormat,
    isPublicProvider,
    note: isPublicProvider ? EMAIL_PROVIDER_NOTE : '',
  };
};

const InputShell = ({ children }) => (
  <div className="rounded-[18px] border-[3px] border-[#252b3a] bg-[#fffdf5] shadow-[4px_4px_0_0_#252b3a] transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[5px_5px_0_0_#252b3a]">
    {children}
  </div>
);

// â”€â”€â”€ Split 6-box OTP Input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SplitOtpInput = ({ onComplete, disabled }) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  const focusBox = (index) => {
    const el = inputs.current[index];
    if (el) { el.focus(); el.select(); }
  };

  const handleChange = useCallback((index, value) => {
    // Allow paste of full code into any box
    const sanitized = value.replace(/\D/g, '');
    if (sanitized.length > 1) {
      // Paste path â€” distribute across boxes
      const chars = sanitized.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      chars.forEach((c, i) => { next[i] = c; });
      setDigits(next);
      const lastFilled = Math.min(chars.length, 5);
      focusBox(lastFilled);
      if (chars.length === 6) onComplete?.(chars.join(''));
      return;
    }
    // Single digit path
    const next = [...digits];
    next[index] = sanitized.slice(-1); // keep only the last char
    setDigits(next);
    if (sanitized) {
      if (index < 5) focusBox(index + 1);
    }
    const full = next.join('');
    if (full.length === 6 && !next.includes('')) onComplete?.(full);
  }, [digits, onComplete]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setDigits(next);
        focusBox(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      focusBox(index + 1);
    }
  }, [digits]);

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="6-digit verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="h-14 w-11 rounded-[14px] border-[3px] border-[#252b3a] bg-white text-center text-[22px] font-black text-[#252b3a] shadow-[3px_3px_0_0_#252b3a] outline-none transition-all duration-150 focus:border-[#6434df] focus:shadow-[3px_3px_0_0_#6434df] focus:-translate-y-0.5 disabled:opacity-50"
        />
      ))}
    </div>
  );
};

// â”€â”€â”€ Sign-In Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const SignInPage = ({
  title = <span className="font-light text-[#253044] tracking-tighter">Welcome</span>,
  description = 'Access your account and continue your journey with us',
  onSubmit,
  onResetPassword,
  onModeChange,
  errorMessage,
  statusMessage,
  isLoading = false,
  mode = 'login',
  resetStep = 1,
  resetCode = '',
  onToggleResetStep,
  onResetPasswordSubmit,
  verificationState = null,
  onVerifyEmail,
  onResendCode,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [inputCode, setInputCode] = useState(resetCode || '');
  const [resendCooldown, setResendCooldown] = useState(0);
  // Tracks the current split-OTP value so manual "Confirm" button can read it
  const [otpValue, setOtpValue] = useState('');

  // Ref to scroll into view when OTP panel appears
  const otpPanelRef = useRef(null);

  useEffect(() => {
    if (resetCode) setInputCode(resetCode);
  }, [resetCode]);

  // Start 60s cooldown whenever a new OTP is issued (email changes = new code sent)
  useEffect(() => {
    if (verificationState?.required) {
      setResendCooldown(60);
      // Scroll the OTP panel into view smoothly
      setTimeout(() => {
        otpPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  }, [verificationState?.email]);

  // Tick the countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const isRegister = mode === 'register';
  const emailMeta = getEmailMeta(emailValue);

  return (
    <div className="min-h-screen bg-[#fffdf5] px-4 py-8 text-[#253044] md:px-6">
      <div className="relative mx-auto max-w-[820px]">
        <div className="absolute -left-7 top-8 h-14 w-14 rounded-full border-[3px] border-[#252b3a] bg-[#9bf1cd] shadow-[8px_8px_0_0_#252b3a]" />
        <div className="absolute -right-8 top-20 h-16 w-16 rotate-12 rounded-[16px] border-[3px] border-[#252b3a] bg-[#ffd05b] shadow-[8px_8px_0_0_#252b3a]" />
        <div className="absolute bottom-10 left-10 h-12 w-12 rounded-full border-[3px] border-[#252b3a] bg-[#ff78c5] shadow-[6px_6px_0_0_#252b3a]" />

        <section className="relative overflow-hidden rounded-[32px] border-[3px] border-[#252b3a] bg-[#ffffff] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4 border-b-[3px] border-[#252b3a] pb-4">
            <Link to={localStorage.getItem('token') ? '/dashboard' : '/'} style={{ textDecoration: 'none' }} className="flex items-center">
              <span
                className="whitespace-nowrap text-[26px] sm:text-[32px] font-black tracking-[-0.05em] text-[#252b3a] leading-none inline-block hover:opacity-90 transition-opacity select-none"
                style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}
              >
                Allié
              </span>
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-[#252b3a] bg-[#e9fff5] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#253044]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6434df]" />
              secure
            </span>
          </div>

          <div className="mx-auto max-w-[620px]">
            <h1 className="text-[34px] font-black uppercase leading-[1.05] tracking-[-0.03em] text-[#252b3a] md:text-[46px] lg:text-[54px]">
              {title}
            </h1>
            <p className="mt-5 max-w-[500px] text-[15px] leading-[1.7] text-[#253044]/75 md:text-[17px]">
              {description}
            </p>

            {statusMessage && (
              <div className="mt-6 rounded-[18px] border-[3px] border-[#252b3a] bg-[#e9fff5] px-4 py-3 text-sm font-semibold text-[#0f7a57] shadow-[4px_4px_0_0_#252b3a]">
                {statusMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mt-6 rounded-[18px] border-[3px] border-[#252b3a] bg-[#fff0f7] px-4 py-3 text-sm font-medium text-[#253044] shadow-[4px_4px_0_0_#252b3a]">
                {errorMessage}
              </div>
            )}

            {/* â”€â”€ OTP Verification Panel â”€â”€ */}
            {verificationState?.required && (
              <div
                ref={otpPanelRef}
                className="mt-6 rounded-[20px] border-[3px] border-[#252b3a] bg-[#f1ebff] px-5 py-5 text-sm text-[#253044] shadow-[5px_5px_0_0_#252b3a]"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-black uppercase tracking-[-0.02em] text-[#252b3a]">
                      Check your inbox ðŸ“¬
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-[#253044]/75">
                      We sent a 6-digit code to{' '}
                      <span className="font-semibold text-[#6434df]">{verificationState.email}</span>
                    </p>
                  </div>
                  {/* Wrong email escape hatch */}
                  <button
                    type="button"
                    onClick={() => onModeChange?.(mode)}
                    className="shrink-0 rounded-full border-[2px] border-[#252b3a] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#253044] shadow-[2px_2px_0_0_#252b3a] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#252b3a]"
                  >
                    Wrong email?
                  </button>
                </div>

                {/* Error shown inline here, close to the boxes */}
                {errorMessage && (
                  <div className="mt-3 rounded-[12px] border-[2px] border-[#252b3a] bg-[#fff0f7] px-3 py-2 text-[12px] font-medium text-[#7c1d44]">
                    {errorMessage}
                  </div>
                )}

                {/* 6-box OTP input */}
                <div className="mt-5">
                  <SplitOtpInput
                    onComplete={(code) => { setOtpValue(code); onVerifyEmail?.(code); }}
                    disabled={isLoading}
                  />
                </div>

                {/* Verify button */}
                <button
                  type="button"
                  onClick={() => { if (otpValue.length === 6) onVerifyEmail?.(otpValue); }}
                  disabled={isLoading || otpValue.length < 6}
                  className="mt-4 flex w-full items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#6434df] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-[4px_4px_0_0_#252b3a] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#252b3a] disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Confirm & Continue â†’'
                  )}
                </button>

                {/* Resend with cooldown */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { onResendCode?.(); setResendCooldown(60); }}
                      disabled={isLoading || resendCooldown > 0}
                      className="text-[12px] font-semibold text-[#6434df] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Resend code
                    </button>
                    {resendCooldown > 0 && (
                      <span className="inline-flex items-center rounded-full border-[2px] border-[#252b3a] bg-[#ffd05b] px-2 py-0.5 text-[11px] font-black text-[#252b3a]">
                        {resendCooldown}s
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#253044]/50">Code expires in 60 min</span>
                </div>

                {/* Fun Fact Card while waiting for email */}
                <div className="mt-4 rounded-[16px] border-[2.5px] border-[#252b3a] bg-white p-3.5 shadow-[3px_3px_0_0_#252b3a]">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.14em] text-[#6434df] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span>💡</span> Did you know?
                    </span>
                    <span className="text-[10px] text-[#252b3a] font-black bg-[#ffd05b] px-2 py-0.5 rounded-full border border-[#252b3a]">
                      {FUN_FACTS[factIndex].tag}
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-5 text-[#253044]/90 font-medium">
                    <strong className="text-[#252b3a] font-bold">{FUN_FACTS[factIndex].person}:</strong> {FUN_FACTS[factIndex].fact}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[#252b3a]/10 pt-2 text-[10.5px] text-[#253044]/60">
                    <span>Checking email servers...</span>
                    <button
                      type="button"
                      onClick={() => setFactIndex((prev) => (prev + 1) % FUN_FACTS.length)}
                      className="font-bold text-[#6434df] hover:underline"
                    >
                      Next fact →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'reset' ? (
              <form className="mt-8 space-y-6" onSubmit={onResetPasswordSubmit}>
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#253044]/75">
                    Account Email Address
                  </label>
                  <InputShell>
                    <input
                      name="email"
                      type="email"
                      required
                      value={emailValue}
                      onChange={(event) => setEmailValue(event.target.value)}
                      placeholder="Enter your registered email address"
                      className="w-full bg-transparent px-4 py-3.5 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                    />
                  </InputShell>
                </div>

                {resetStep === 2 && (
                  <>
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#253044]/75">
                        6-Digit Verification Code
                      </label>
                      <InputShell>
                        <input
                          name="code"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          className="w-full bg-transparent px-4 py-3.5 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                        />
                      </InputShell>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#253044]/75">
                        New Password
                      </label>
                      <InputShell>
                        <div className="relative">
                          <input
                            name="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Enter new password (at least 6 characters)"
                            className="w-full bg-transparent px-4 py-3.5 pr-12 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute inset-y-0 right-3 flex items-center text-[#253044]/60 transition-colors hover:text-[#253044]"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </InputShell>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex w-full items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#6434df] px-5 py-4 text-[13px] font-bold uppercase tracking-[0.18em] text-white shadow-[6px_6px_0_0_#252b3a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#252b3a] disabled:opacity-60"
                >
                  {isLoading ? 'Processing...' : resetStep === 2 ? 'Save New Password' : 'Send Reset Code'}
                </button>

                {resetStep === 1 ? (
                  <div className="rounded-[18px] border-[3px] border-[#252b3a] bg-[#f1ebff] p-4 shadow-[4px_4px_0_0_#252b3a]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-bold text-[#252b3a]">Already have a 6-digit code?</p>
                        <p className="text-[12px] text-[#253044]/70">Enter your code directly to set a new password.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleResetStep?.(2)}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-[3px] border-[#252b3a] bg-[#ffd05b] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#252b3a] shadow-[3px_3px_0_0_#252b3a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#252b3a]"
                      >
                        Enter Code Directly â†’
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-[#253044]/80 px-1">
                    <span>Need to request a new code?</span>
                    <button
                      type="button"
                      onClick={() => onToggleResetStep?.(1)}
                      className="font-bold text-[#6434df] underline-offset-2 hover:underline"
                    >
                      Send code again
                    </button>
                  </div>
                )}

                <p className="mt-6 text-center text-[15px] text-[#253044]/75">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => onModeChange?.('login')}
                    className="font-bold text-[#6434df] underline-offset-2 hover:underline"
                  >
                    Back to sign in
                  </button>
                </p>
              </form>
            ) : (
              <>
                {!verificationState?.required && (
                  <form className="mt-8 space-y-7" onSubmit={onSubmit}>
                    {isRegister && (
                      <div>
                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#253044]/75">Business name</label>
                        <InputShell>
                          <input
                            name="businessName"
                            type="text"
                            required
                            placeholder="Enter your business name"
                            className="w-full bg-transparent px-4 py-3.5 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                          />
                        </InputShell>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#253044]/75">Email address</label>
                      <InputShell>
                        <input
                          name="email"
                          type="email"
                          required
                          value={emailValue}
                          onChange={(event) => setEmailValue(event.target.value)}
                          placeholder="Enter your email address"
                          className="w-full bg-transparent px-4 py-3.5 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                        />
                      </InputShell>
                      {emailMeta.isPublicProvider && (
                        <p className="mt-2 text-[12px] leading-5 text-[#253044]/70">
                          <span className="font-semibold text-[#6434df]">Note:</span> {emailMeta.note}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#253044]/75">Password</label>
                      <InputShell>
                        <div className="relative">
                          <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder={isRegister ? 'Create a password' : 'Enter your password'}
                            className="w-full bg-transparent px-4 py-3.5 pr-12 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute inset-y-0 right-3 flex items-center text-[#253044]/60 transition-colors hover:text-[#253044]"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </InputShell>
                    </div>

                    {isRegister && (
                      <div>
                        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#253044]/75">Confirm password</label>
                        <InputShell>
                          <input
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="Confirm your password"
                            className="w-full bg-transparent px-4 py-3.5 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                          />
                        </InputShell>
                      </div>
                    )}

                    {!isRegister && (
                      <div className="flex items-center justify-between gap-3 text-sm text-[#253044]">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input type="checkbox" name="rememberMe" className="h-4 w-4 rounded border-[2px] border-[#252b3a] accent-[#6434df]" />
                          <span className="font-medium">Keep me signed in</span>
                        </label>
                        <button type="button" onClick={onResetPassword} className="font-semibold text-[#6434df] underline-offset-2 hover:underline">
                          Reset password
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="mt-3 flex w-full items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#6434df] px-5 py-4 text-[13px] font-bold uppercase tracking-[0.18em] text-white shadow-[6px_6px_0_0_#252b3a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#252b3a] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6434df]"
                    >
                      {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Delivering OTP...</span>
                      </span>
                    ) : isRegister ? 'Create account' : 'Sign in'}
                    </button>
                  </form>
                )}

                <p className="mt-6 text-center text-[15px] text-[#253044]/75">
                  {isRegister ? 'Already have an account?' : 'New to our platform?'}{' '}
                  <button
                    type="button"
                    onClick={() => onModeChange?.(isRegister ? 'login' : 'register')}
                    className="font-bold text-[#6434df] underline-offset-2 hover:underline"
                  >
                    {isRegister ? 'Sign in' : 'Create account'}
                  </button>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
