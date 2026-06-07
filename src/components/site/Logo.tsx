export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="BMW Coding IE"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <clipPath id="bmwcoding-mark-tile">
          <rect x="2" y="2" width="96" height="96" rx="20" />
        </clipPath>
      </defs>
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="20"
        fill="#0A0B0D"
        stroke="#ffffff"
        strokeOpacity="0.12"
        strokeWidth="2"
      />
      <g clipPath="url(#bmwcoding-mark-tile)" transform="rotate(-20 50 50)">
        <rect x="21" y="-30" width="18" height="160" fill="#2E9BE6" />
        <rect x="39" y="-30" width="18" height="160" fill="#0A4FB0" />
        <rect x="57" y="-30" width="18" height="160" fill="#E2001A" />
      </g>
    </svg>
  );
}

export function Logo({
  subtitle,
  markClass = 'h-9 w-9',
  textClass = 'text-2xl',
}: {
  subtitle?: string;
  markClass?: string;
  textClass?: string;
}) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className={`${markClass} shrink-0 transition-transform duration-300 group-hover:scale-105`} />
      <span className="leading-none">
        <span className={`block font-display ${textClass} tracking-wide text-ink`}>
          BMW CODING <span className="text-m-blue">IE</span>
        </span>
        {subtitle && (
          <span className="label block leading-none text-faint">{subtitle}</span>
        )}
      </span>
    </span>
  );
}
