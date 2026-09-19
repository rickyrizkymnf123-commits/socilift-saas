import React from 'react';

interface SociliftLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string | null;
  className?: string;
  showBadge?: boolean;
}

export function SociliftIcon({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: any;
  glow?: boolean;
  className?: string;
}) {
  // Ultra-minimal luxury monogram mark for places that only require an icon (like favicon/avatar)
  const sizes = {
    sm: 'text-xs w-7 h-7',
    md: 'text-sm w-8 h-8',
    lg: 'text-base w-10 h-10',
    xl: 'text-xl w-14 h-14',
  };

  return (
    <div
      className={`inline-flex items-center justify-center font-black rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 text-white shadow-md shadow-blue-500/10 ${sizes[size]} ${className}`}
    >
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 font-black">
        S+
      </span>
    </div>
  );
}

export default function SociliftLogo({
  size = 'md',
  subtitle,
  className = '',
  showBadge = true,
}: SociliftLogoProps) {
  const fontSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const badgeSizes = {
    sm: 'text-[8px] px-1.5 py-0.2',
    md: 'text-[9px] px-2 py-0.5',
    lg: 'text-[10px] px-2.5 py-0.5',
    xl: 'text-xs px-3 py-1',
  };

  return (
    <div className={`select-none ${className}`}>
      {/* Main Luxury Brand Typography */}
      <div className="flex items-center gap-2">
        <span
          className={`font-black tracking-[-0.03em] ${fontSizes[size]} text-white flex items-center gap-0.5`}
        >
          <span>Socilift</span>
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-sm shadow-blue-400 inline-block ml-0.5" />
        </span>

        {showBadge && (
          <span
            className={`font-black uppercase tracking-widest rounded-full bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 border border-blue-400/30 text-blue-300 shadow-xs backdrop-blur-xs ${badgeSizes[size]}`}
          >
            PLUS
          </span>
        )}
      </div>

      {/* Subtitle / Organization Name */}
      {subtitle !== undefined && (
        <span className="text-[11px] text-slate-400 block truncate font-medium tracking-wide mt-0.5">
          {subtitle || 'Socilift Media Agency'}
        </span>
      )}
    </div>
  );
}
