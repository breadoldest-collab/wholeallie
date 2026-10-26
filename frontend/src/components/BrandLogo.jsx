export default function BrandLogo({ compact = false, showSubtitle = true, dark = false, className = '' }) {
  const textColor = dark ? '#f8f7f3' : '#111827';
  const subtitleColor = dark ? '#dfe7ff' : '#5b6475';

  return (
    <div className={`flex min-w-0 items-center ${compact ? 'gap-2.5 sm:gap-3' : 'gap-3 sm:gap-3.5'} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        aria-label="Allié logo"
        className={compact ? 'h-10 w-10 sm:h-12 sm:w-12' : 'h-12 w-12 sm:h-16 sm:w-16'}
        role="img"
      >
        <defs>
          <linearGradient id="allie-box" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f8fbff" />
            <stop offset="100%" stopColor="#edf3ff" />
          </linearGradient>
          <linearGradient id="allie-purple" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#5c56f5" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="allie-green" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        <rect x="10" y="10" width="100" height="100" rx="28" fill="url(#allie-box)" stroke="#111827" strokeWidth="5" />
        <path d="M34 90L57 28L80 90" fill="none" stroke="#111827" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 68H70" fill="none" stroke="#111827" strokeWidth="9" strokeLinecap="round" />
        <circle cx="83" cy="34" r="10" fill="url(#allie-green)" opacity="0.95" />
        <path d="M17 86C29 72 42 65 57 65" fill="none" stroke="url(#allie-purple)" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
      </svg>

      <div className="flex min-w-0 flex-col leading-none">
        <span
          className={compact ? 'whitespace-nowrap text-[1.1rem] font-black tracking-[-0.06em] sm:text-[1.35rem]' : 'whitespace-nowrap text-[1.65rem] font-black tracking-[-0.06em] sm:text-[2.5rem]'}
          style={{ color: textColor, fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}
        >
          Allié
        </span>
        {showSubtitle && (
          <span
            className={compact ? 'mt-1 inline-flex items-center gap-1.5 text-[0.48rem] uppercase tracking-[0.18em] sm:text-[0.56rem]' : 'mt-1 inline-flex items-center gap-1.5 text-[0.56rem] uppercase tracking-[0.18em] sm:text-[0.68rem]'}
            style={{ color: subtitleColor }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_0_2px_rgba(52,211,153,0.18)] sm:h-2 sm:w-2" />
            Allié AI
          </span>
        )}
      </div>
    </div>
  );
}
