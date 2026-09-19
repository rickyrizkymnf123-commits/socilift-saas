import React from 'react';

interface SociliftLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string | null;
  className?: string;
  glow?: boolean;
}

export function SociliftIcon({
  size = 'md',
  className = '',
  glow = true,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const containerSizes = {
    sm: 'p-1 rounded-lg',
    md: 'p-1.5 rounded-xl',
    lg: 'p-2 rounded-2xl',
    xl: 'p-3 rounded-3xl',
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 ${containerSizes[size]} ${
        glow ? 'shadow-lg shadow-blue-500/30' : ''
      } border border-blue-400/30 transition-transform duration-200 hover:scale-105 select-none ${className}`}
    >
      <svg
        className={sizeMap[size]}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sl-quantum-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="sl-quantum-core" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <filter id="sl-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagon Quantum Shield */}
        <path
          d="M32 5L55 18.5V45.5L32 59L9 45.5V18.5L32 5Z"
          fill="url(#sl-quantum-bg)"
          fillOpacity="0.25"
          stroke="url(#sl-quantum-bg)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Neural Grid Lines */}
        <path
          d="M32 13L47 22V42L32 51L17 42V22L32 13Z"
          stroke="#93C5FD"
          strokeWidth="1.2"
          strokeDasharray="2.5 2.5"
          opacity="0.8"
        />

        {/* Ascending Futuristic Beam / Rocket Wing */}
        <path
          d="M32 14L44 26L37 26L42 38L32 32L22 38L27 26L20 26L32 14Z"
          fill="url(#sl-quantum-core)"
          filter="url(#sl-glow-filter)"
        />

        {/* Orbit Quantum Spark */}
        <circle cx="47" cy="18.5" r="3.5" fill="#FDE047" filter="url(#sl-glow-filter)" />
        <circle cx="17" cy="45.5" r="2.5" fill="#38BDF8" />
      </svg>
    </div>
  );
}

export default function SociliftLogo({
  size = 'md',
  showWordmark = true,
  subtitle,
  className = '',
  glow = true,
}: SociliftLogoProps) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  const badgeSizes = {
    sm: 'text-[8px] px-1 py-0.2',
    md: 'text-[9px] px-1.5 py-0.5',
    lg: 'text-[11px] px-2 py-0.5',
    xl: 'text-xs px-2.5 py-1',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <SociliftIcon size={size} glow={glow} />

      {showWordmark && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-white ${textSizes[size]} truncate block font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-200`}
            >
              Socilift
            </span>
            <span
              className={`font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xs border border-blue-400/40 shrink-0 ${badgeSizes[size]}`}
            >
              Plus
            </span>
          </div>

          {subtitle !== undefined && (
            <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate font-medium mt-0.5">
              {subtitle || 'SaaS Media Agency'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
