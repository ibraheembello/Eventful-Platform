interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 54"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      {/* Calendar body */}
      <rect x="4" y="10" width="44" height="40" rx="10" fill="url(#logo-grad)" />
      {/* Calendar pins */}
      <rect x="14" y="4" width="4" height="12" rx="2" fill="url(#logo-grad)" />
      <rect x="34" y="4" width="4" height="12" rx="2" fill="url(#logo-grad)" />
      {/* Divider line */}
      <rect x="4" y="22" width="44" height="2" fill="white" opacity={0.3} />
      {/* Ticket notches */}
      <circle cx="4" cy="35" r="5" fill="currentColor" className="text-[rgb(var(--bg-primary))]" />
      <circle cx="48" cy="35" r="5" fill="currentColor" className="text-[rgb(var(--bg-primary))]" />
      {/* QR dots */}
      <rect x="16" y="28" width="5" height="5" rx="1" fill="white" opacity={0.9} />
      <rect x="24" y="28" width="5" height="5" rx="1" fill="white" opacity={0.9} />
      <rect x="32" y="28" width="5" height="5" rx="1" fill="white" opacity={0.9} />
      <rect x="16" y="36" width="5" height="5" rx="1" fill="white" opacity={0.7} />
      <rect x="24" y="36" width="5" height="5" rx="1" fill="white" opacity={0.7} />
      <rect x="32" y="36" width="5" height="5" rx="1" fill="white" opacity={0.5} />
    </svg>
  );
}

export function LogoFull({ size = 32, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} />
      <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
        Eventful
      </span>
    </span>
  );
}
