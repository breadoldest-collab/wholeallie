import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import BrandLogo from '../BrandLogo';

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

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

const InputShell = ({ children }) => (
  <div className="rounded-[18px] border-[3px] border-[#252b3a] bg-[#fffdf5] shadow-[4px_4px_0_0_#252b3a] transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[5px_5px_0_0_#252b3a]">
    {children}
  </div>
);

export const SignInPage = ({
  title = <span className="font-light text-[#253044] tracking-tighter">Welcome</span>,
  description = 'Access your account and continue your journey with us',
  onSubmit,
  onGoogleSignIn,
  onResetPassword,
  onModeChange,
  errorMessage,
  isLoading = false,
  mode = 'login',
  verificationState = null,
  onVerifyEmail,
  onResendCode,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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
            <BrandLogo compact showSubtitle={false} className="gap-2.5" />
            <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-[#252b3a] bg-[#e9fff5] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#253044]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6434df]" />
              secure
            </span>
          </div>

          <div className="mx-auto max-w-[620px]">
            <h1 className="text-[34px] font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#252b3a] md:text-[48px] lg:text-[58px]">
              {title}
            </h1>
            <p className="mt-5 max-w-[500px] text-[15px] leading-[1.7] text-[#253044]/75 md:text-[17px]">
              {description}
            </p>

            {errorMessage && (
              <div className="mt-6 rounded-[18px] border-[3px] border-[#252b3a] bg-[#fff0f7] px-4 py-3 text-sm font-medium text-[#253044] shadow-[4px_4px_0_0_#252b3a]">
                {errorMessage}
              </div>
            )}

            {verificationState?.required && (
              <div className="mt-6 rounded-[18px] border-[3px] border-[#252b3a] bg-[#f1ebff] px-4 py-4 text-sm text-[#253044] shadow-[4px_4px_0_0_#252b3a]">
                <p className="font-semibold">Check your inbox.</p>
                <p className="mt-2 leading-6 text-[#253044]/80">{verificationState.message || 'We sent a 6-digit code to your email.'}</p>
                <p className="mt-2 font-medium text-[#6434df]">{verificationState.email}</p>
                {verificationState.devCode && (
                  <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#253044]/70">
                    Dev code: {verificationState.devCode}
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-[14px] border-[3px] border-[#252b3a] bg-white px-3 py-2.5 text-[15px] text-[#253044] placeholder:text-[#253044]/45 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onVerifyEmail?.(verificationCode)}
                    disabled={!verificationCode.trim() || isLoading}
                    className="rounded-full border-[3px] border-[#252b3a] bg-[#6434df] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[4px_4px_0_0_#252b3a] disabled:opacity-60"
                  >
                    Verify
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onResendCode}
                  disabled={isLoading}
                  className="mt-3 text-[12px] font-semibold text-[#6434df] underline-offset-2 hover:underline disabled:opacity-60"
                >
                  Resend code
                </button>
              </div>
            )}

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
                disabled={isLoading || (emailMeta.isPublicProvider && !emailMeta.isValidFormat)}
                className="mt-3 flex w-full items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#6434df] px-5 py-4 text-[13px] font-bold uppercase tracking-[0.18em] text-white shadow-[6px_6px_0_0_#252b3a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#252b3a] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6434df]"
              >
                {isLoading ? 'Processing...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="relative my-7 flex items-center justify-center">
              <span className="h-[3px] w-full bg-[#252b3a]" />
              <span className="absolute bg-[#fffdf5] px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#253044]/65">
                or continue with
              </span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-full border-[3px] border-[#252b3a] bg-[#fffdf5] px-5 py-4 text-[15px] font-semibold text-[#253044] shadow-[6px_6px_0_0_#252b3a] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6434df]"
            >
              <GoogleIcon />
              Continue with Google
            </button>

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
          </div>
        </section>
      </div>
    </div>
  );
};
