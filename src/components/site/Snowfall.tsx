import { XMAS_ON } from '@/lib/season';

// Fixed flake positions (no Math.random in render — the server and browser
// must draw the same thing). Left %, size px, duration s, delay s, drift px.
const FLAKES: [number, number, number, number, number][] = [
  [4, 3, 11, -2, 18], [11, 2, 14, -9, -12], [17, 4, 12, -5, 22], [24, 2, 16, -1, -16],
  [31, 3, 13, -11, 14], [38, 2, 15, -6, -20], [45, 4, 12, -3, 12], [52, 2, 17, -12, -14],
  [58, 3, 13, -8, 20], [64, 2, 14, -4, -18], [71, 4, 11, -10, 16], [77, 2, 16, -2, -12],
  [83, 3, 12, -7, 18], [89, 2, 15, -13, -16], [95, 3, 13, -5, 14], [8, 2, 18, -15, 10],
  [28, 3, 19, -16, -10], [49, 2, 18, -14, 12], [67, 3, 20, -17, -8], [86, 2, 19, -18, 10],
];

/**
 * Light snowfall behind a hero during the Christmas offer. Decorative only:
 * no pointer events, hidden from screen readers, and off for anyone who asks
 * for reduced motion (globals.css).
 */
export function Snowfall() {
  if (!XMAS_ON) return null;
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
