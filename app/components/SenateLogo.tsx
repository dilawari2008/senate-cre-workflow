'use client';

interface SenateLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function SenateLogo({
  variant = 'dark',
  size = 'md',
  showTagline = false,
}: SenateLogoProps) {
  const isDark = variant === 'dark';

  const sizes = {
    sm: { icon: 'h-7 w-7 text-xs', text: 'text-base', tagline: 'text-[9px]' },
    md: { icon: 'h-9 w-9 text-sm', text: 'text-xl', tagline: 'text-[10px]' },
    lg: { icon: 'h-12 w-12 text-base', text: 'text-3xl', tagline: 'text-xs' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* Icon mark */}
      <div
        className={`${s.icon} flex items-center justify-center rounded-xl font-bold text-white bg-gradient-to-br from-orange-600 to-amber-700`}
      >
        S
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`${s.text} font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            SENATE
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-widest ${
              isDark
                ? 'bg-white/10 text-orange-200'
                : 'bg-orange-600/10 text-orange-700'
            }`}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <span
            className={`${s.tagline} tracking-wide ${
              isDark ? 'text-orange-200/70' : 'text-gray-500'
            }`}
          >
            Governance Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
