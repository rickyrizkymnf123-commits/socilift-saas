import React from 'react';

export type LogoVariant = 'ascend' | 'bolt' | 'prism' | 'wave' | 'minimal';

interface SociliftLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string | null;
  className?: string;
  variant?: LogoVariant;
}

export function SociliftIcon({
  size = 'md',
  variant = 'ascend',
  glow = true,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: LogoVariant;
  glow?: boolean;
  className?: string;
}) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-500/20 border border-blue-400/30 transition-all duration-200 hover:scale-105 hover:shadow-blue-500/40 ${sizeMap[size]} ${className}`}
    >
      {/* Concept 1 (Default): Ascend S - Linear / Raycast style geometric upward monogram */}
      {variant === 'ascend' && (
        <svg
          className={`${iconSizes[size]} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 16L12 4L20 16H14L12 11L10 16H4Z"
            fill="url(#asc-grad)"
          />
          <path
            d="M8 19L12 13L16 19H8Z"
            fill="#38BDF8"
          />
          <defs>
            <linearGradient id="asc-grad" x1="12" y1="4" x2="12" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#93C5FD" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Concept 2: Bolt Lift - Clean razor sharp lightning chevron */}
      {variant === 'bolt' && (
        <svg
          className={`${iconSizes[size]} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            fill="url(#bolt-grad)"
            stroke="#93C5FD"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient id="bolt-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#818CF8" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Concept 3: Prism Spark - Clean OpenAI/Perplexity geometric 4-point star */}
      {variant === 'prism' && (
        <svg
          className={`${iconSizes[size]} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
            fill="url(#prism-grad)"
          />
          <circle cx="12" cy="12" r="2.5" fill="#FFFFFF" />
          <defs>
            <linearGradient id="prism-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Concept 4: Wave Loop - Fluid infinite growth */}
      {variant === 'wave' && (
        <svg
          className={`${iconSizes[size]} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 15C6 11.5 9 8 13 8C17 8 18 5.5 18 4"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M6 20C6 18.5 7 16 11 16C15 16 18 12.5 18 9"
            stroke="#818CF8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Concept 5: Minimal Modern 'S' Monogram */}
      {variant === 'minimal' && (
        <svg
          className={`${iconSizes[size]} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 6C7 4.89543 7.89543 4 9 4H17C18.1046 4 19 4.89543 19 6V9C19 10.1046 18.1046 11 17 11H10C8.89543 11 8 11.8954 8 13V17C8 18.1046 8.89543 19 10 19H18C19.1046 19 20 18.1046 20 17"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export default function SociliftLogo({
  size = 'md',
  showWordmark = true,
  subtitle,
  variant = 'ascend',
  className = '',
}: SociliftLogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <SociliftIcon size={size} variant={variant} />

      {showWordmark && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-base tracking-tight block">
              Socilift
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PLUS
            </span>
          </div>

          {subtitle !== undefined && (
            <span className="text-[11px] text-slate-400 block truncate font-medium mt-0.5">
              {subtitle || 'SaaS Media Agency'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
