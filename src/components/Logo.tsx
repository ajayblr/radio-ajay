interface Props {
  size?: number;       // icon size in px
  variant?: 'icon' | 'full';  // icon only, or icon + wordmark
  className?: string;
}

export default function Logo({ size = 36, variant = 'full', className = '' }: Props) {
  if (variant === 'icon') {
    return <RadioIcon size={size} className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
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
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1DB954" />
          <stop offset="100%" stopColor="#17a349" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill="url(#bg-grad)" />

      {/* Subtle inner border */}
      <rect width="40" height="40" rx="10" fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Signal arcs — emanating from bottom-centre (20, 29) */}
      {/* Arc 1 — outermost */}
      <path
        d="M 9 28 A 13 13 0 0 1 31 28"
        stroke="url(#wave-grad)" strokeWidth="2.2"
        strokeLinecap="round" fill="none"
        opacity="0.45" filter="url(#glow)"
      />
      {/* Arc 2 */}
      <path
        d="M 12.5 28 A 9 9 0 0 1 27.5 28"
        stroke="url(#wave-grad)" strokeWidth="2.4"
        strokeLinecap="round" fill="none"
        opacity="0.7" filter="url(#glow)"
      />
      {/* Arc 3 — innermost */}
      <path
        d="M 16 28 A 5 5 0 0 1 24 28"
        stroke="url(#wave-grad)" strokeWidth="2.6"
        strokeLinecap="round" fill="none"
        filter="url(#glow)"
      />

      {/* Base dot */}
      <circle cx="20" cy="28" r="2.5" fill="#1DB954" filter="url(#glow)" />
      <circle cx="20" cy="28" r="1.2" fill="white" />

      {/* Antenna stem */}
      <line x1="20" y1="25.5" x2="20" y2="19" stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5" strokeLinecap="round" />
      {/* Antenna tip dot */}
      <circle cx="20" cy="18" r="1.8" fill="#1DB954" filter="url(#glow)" />
      <circle cx="20" cy="18" r="0.9" fill="white" />
    </svg>
  );
}

/* ── Wordmark ─────────────────────────────────────────────── */
function Wordmark({ iconSize }: { iconSize: number }) {
  const large = iconSize >= 32;
  return (
    <div className="flex flex-col leading-none select-none">
      <span
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: large ? '11px' : '9px',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1,
        }}
      >
        Radio
      </span>
      <span
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: large ? '18px' : '14px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          lineHeight: 1.15,
          marginTop: '2px',
        }}
      >
        Ajay
        <span style={{ color: '#1DB954' }}>.</span>
      </span>
    </div>
  );
}

/* Export icon separately for favicon / small uses */
export { RadioIcon };
