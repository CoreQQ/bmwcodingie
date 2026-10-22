import { XMAS, XMAS_ON } from '@/lib/season';
import { SantaHat } from './SantaHat';

/**
 * Site logo — transparent brand lockup served from /public/logo.webp (logo.png stays for JSON-LD).
 * Put the file at: public/logo.png (PNG with a transparent background).
 * During the Christmas offer a Santa hat sits on the car's roof (or on the "B").
 */
export function Logo({ className = 'h-9 w-auto' }: { className?: string }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt="BMW Coding — BMW coding, diagnostics & retrofits in Dublin and across Ireland"
      fetchPriority="high"
      width={384}
      height={384}
      className={`${className} select-none object-contain transition-transform duration-300 group-hover:scale-105`}
    />
  );
  if (!XMAS_ON || (XMAS.hat !== 'car' && XMAS.hat !== 'b')) return img;
  // Positions are fractions of the square logo, tuned on the artwork itself.
  const spot =
    XMAS.hat === 'car'
      ? { left: '51%', top: '12.5%', width: '22%', transform: 'rotate(-6deg)' }
      : { left: '7%', top: '52%', width: '16%', transform: 'rotate(-16deg)' };
  return (
    <span className="relative inline-block">
      {img}
      <SantaHat className="pointer-events-none absolute" style={spot} />
    </span>
  );
}
