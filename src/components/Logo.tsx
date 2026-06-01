interface Props {
  size?: number;
  variant?: 'icon' | 'full';
  className?: string;
}

export default function Logo({ size = 36, variant = 'full', className = '' }: Props) {
  if (variant === 'icon') {
    return <RadioIcon size={size} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <RadioIcon size={size} />
      <Wordmark iconSize={size} />
    </div>
  );
}

/* ── Icon ─────────────────────────────────────────────────── */
function RadioIcon({ size, className = '' }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="RadioAjay logo"
    >
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d1b69" />
          <stop offset="100%" stopColor="#0c0c1e" />
        </linearGradient>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="dot-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill="url(#bg-grad)" />
      <rect width="40" height="40" rx="10" fill="none"
        stroke="rgba(168,85,247,0.25)" strokeWidth="1" />

      {/* Signal arcs */}
      <path d="M 7 28 A 15 15 0 0 1 33 28"
        stroke="url(#arc-grad)" strokeWidth="2"
        strokeLinecap="round" fill="none"
        opacity="0.35" filter="url(#glow)" />
      <path d="M 11 28 A 11 11 0 0 1 29 28"
        stroke="url(#arc-grad)" strokeWidth="2.3"
        strokeLinecap="round" fill="none"
        opacity="0.65" filter="url(#glow)" />
      <path d="M 15.5 28 A 6.5 6.5 0 0 1 24.5 28"
        stroke="url(#arc-grad)" strokeWidth="2.6"
        strokeLinecap="round" fill="none"
        filter="url(#glow)" />

      {/* Base dot */}
      <circle cx="20" cy="28" r="2.8" fill="url(#dot-grad)" filter="url(#glow-strong)" />
      <circle cx="20" cy="28" r="1.1" fill="white" />

      {/* Antenna stem */}
      <line x1="20" y1="25.2" x2="20" y2="19"
        stroke="rgba(168,85,247,0.5)" strokeWidth="1.4" strokeLinecap="round" />

      {/* Antenna tip */}
      <circle cx="20" cy="18" r="2.2" fill="url(#dot-grad)" filter="url(#glow-strong)" />
      <circle cx="20" cy="18" r="0.9" fill="white" />
    </svg>
  );
}

/* ── Wordmark ─────────────────────────────────────────────── */
function Wordmark({ iconSize }: { iconSize: number }) {
  const large = iconSize >= 32;
  return (
    <span
      className="select-none whitespace-nowrap"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: large ? '19px' : '14px',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        background: 'linear-gradient(90deg, #c084fc 0%, #38bdf8 45%, #34d399 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      Radio<span style={{ fontWeight: 900 }}>Ajay</span>
    </span>
  );
}

export { RadioIcon };
