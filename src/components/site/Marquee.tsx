// Infinite scrolling brand band — feature/product names are locale-neutral
// tech terms, so no i18n is needed. Pure CSS animation, pauses on hover and
// under prefers-reduced-motion.
const TERMS = [
  'Apple CarPlay',
  'ISTA Diagnostics',
  'Ambient Lighting',
  'Video in Motion',
  'M View',
  'Japan → EU',
  'Hidden Features',
  'Cruise Control',
  'Sport Displays',
  'FSC & Maps',
  'Android Auto',
  'Comfort Access',
];

function Half() {
  return (
    <div className="flex items-center" aria-hidden="true">
      {TERMS.map((term, i) => (
        <span key={term} className="flex items-center">
          <span
            className={`whitespace-nowrap px-6 font-display text-2xl uppercase tracking-wider md:px-9 md:text-4xl ${
              i % 2 ? 'text-outline' : 'text-ink/90'
            }`}
          >
            {term}
          </span>
          <span className="m-stripe h-2 w-2 rotate-45" />
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="marquee border-y border-white/5 bg-graphite-800/40 py-5 md:py-6">
      <div className="marquee-track">
        <Half />
        <Half />
      </div>
    </div>
  );
}
