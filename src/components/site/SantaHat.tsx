/** A Santa hat for the Christmas offer (drawn, not an emoji, so it looks the
 *  same on every phone). Decorative: hidden from screen readers. */
export function SantaHat({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden="true" focusable="false" className={className} style={style}>
      <path d="M9 42C11 27 21 12 37 8c9-2 17 1 20 9-6-1-11 2-13 8-2 6-1 12 1 17Z" fill="#d0202f" />
      <path d="M14 40c2-12 10-24 20-29-7 7-13 17-15 29Z" fill="#ef4b58" opacity=".7" />
      <path d="M45 42c-2-5-3-11-1-17 2-6 7-9 13-8-5 2-8 6-9 11-1 5-1 9 0 14Z" fill="#9e1320" opacity=".55" />
      <rect x="5" y="38" width="44" height="12" rx="6" fill="#f6f6f6" />
      <rect x="8" y="45" width="38" height="4" rx="2" fill="#d6d6d6" opacity=".8" />
      <circle cx="57" cy="19" r="6.5" fill="#f6f6f6" />
      <circle cx="59" cy="21" r="3.2" fill="#d6d6d6" opacity=".7" />
    </svg>
  );
}
