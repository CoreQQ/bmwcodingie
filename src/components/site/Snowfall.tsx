import { XMAS, XMAS_ON } from '@/lib/season';

// Flake positions come from a fixed-seed generator, never Math.random in
// render: the server and the browser must draw exactly the same thing.
// [left %, size px, duration s, delay s, drift px]
function flakes(count: number): [number, number, number, number, number][] {
  // Park–Miller: every product stays below 2^53, so the numbers are exact
  // and identical in Node and in any browser.
  let seed = 20261225;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => [
    Math.round(rnd() * 98 + 1),
    2 + Math.round(rnd() * 2),
    11 + Math.round(rnd() * 9),
    -Math.round(rnd() * 18),
    Math.round(rnd() * 40 - 20),
  ]);
}
const COUNT = { off: 0, light: 20, medium: 36, heavy: 64 } as const;
const FLAKES = flakes(COUNT[XMAS.snow]);

/**
 * Snowfall behind a hero during the Christmas offer. Decorative only:
 * no pointer events, hidden from screen readers, and off for anyone who asks
 * for reduced motion (globals.css).
 */
export function Snowfall() {
  if (!XMAS_ON || !FLAKES.length) return null;
  return (
    <div aria-hidden="true" className="snowfall pointer-events-none absolute inset-0 overflow-hidden">
      {FLAKES.map(([left, size, dur, delay, drift], i) => (
        <span
          key={i}
          className="snowflake"
          style={
            {
              left: `${left}%`,
              width: size,
              height: size,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              '--drift': `${drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** A soft red glow in the top corner of a hero (owner's choice). */
export function XmasGlow() {
  if (!XMAS_ON || !XMAS.glow) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ background: 'radial-gradient(70% 45% at 18% 8%, rgba(200, 16, 46, 0.30), transparent 70%)' }}
    />
  );
}

const BULBS = ['#e2263b', '#ffd36b', '#2fbf71', '#ffffff'];

/** A string of lights along the top edge of the header — inside its top
 *  padding, so nothing on the page moves. */
export function Garland() {
  if (!XMAS_ON || !XMAS.garland) return null;
  return (
    <div aria-hidden="true" className="garland pointer-events-none absolute inset-x-0 top-0 flex h-3 items-start justify-around overflow-hidden">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="garland-bulb"
          style={{ background: BULBS[i % 4], boxShadow: `0 0 8px ${BULBS[i % 4]}`, animationDelay: `${(i % 5) * 0.4}s` }}
        />
      ))}
    </div>
  );
}
