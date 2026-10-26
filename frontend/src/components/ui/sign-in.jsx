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

const InputShell = ({ children }) => (
  <div className="rounded-[18px] border-[3px] border-[#252b3a] bg-[#fffdf5] shadow-[4px_4px_0_0_#252b3a] transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[5px_5px_0_0_#252b3a]">
    {children}
  </div>
);

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
  onToggleResetStep,
  onResetPasswordSubmit,
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
                          placeholder="Enter 6-digit code from email"
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
                        Enter Code Directly →
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
