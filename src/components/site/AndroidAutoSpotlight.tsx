import { ArrowRight, Check, MessageCircle, ScanSearch } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PRICE_ITEMS } from '@/lib/pricing';
import { waHref } from '@/lib/waMessage';
import { OfferPrice } from './OfferPrice';

// The new product on the home page (owner, 30 Oct 2026): native Android Auto
// on NBT Evo with ID6. One claim people have been told is impossible, the
// price from pricing.ts, and the car's own widescreen drawn running it.

const GREEN = '#3ddc84';

/** The NBT Evo widescreen with an Android Auto-style layout — drawn, not a
 *  screenshot, and without Google's logos. */
function ScreenMock({ caption }: { caption: string }) {
  return (
    <figure className="min-w-0">
      <div className="rounded-[22px] border border-white/10 bg-gradient-to-b from-[#1a1d22] to-[#0d0f12] p-2.5 shadow-[0_30px_80px_-30px_rgba(61,220,132,0.35)]">
        <svg viewBox="0 0 640 240" className="block h-auto w-full rounded-[14px]" role="img" aria-label={caption}>
          <rect width="640" height="240" fill="#0b0d10" />
          {/* App rail */}
          <rect width="56" height="240" fill="#121519" />
          {[38, 86, 134, 182].map((y, i) => (
            <circle key={y} cx="28" cy={y} r="13" fill={['#4285f4', GREEN, '#fbbc04', '#ea4335'][i]} opacity="0.9" />
          ))}
          {/* Map */}
          <rect x="68" y="12" width="360" height="216" rx="12" fill="#1b2430" />
          <path d="M68 70 L428 40 M68 150 L428 175 M150 12 L190 228 M300 12 L270 228 M380 12 L410 228" stroke="#26313f" strokeWidth="10" />
          <path d="M110 205 C 170 170, 200 120, 260 118 S 360 80, 395 45" fill="none" stroke="#4285f4" strokeWidth="7" strokeLinecap="round" />
          <circle cx="110" cy="205" r="9" fill="#ffffff" />
          <circle cx="110" cy="205" r="5" fill="#4285f4" />
          <circle cx="395" cy="45" r="8" fill="#ea4335" />
          <rect x="80" y="22" width="150" height="40" rx="9" fill={GREEN} />
          <path d="M96 48 L104 34 L112 48" fill="none" stroke="#0b0d10" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="124" y="32" width="90" height="7" rx="3.5" fill="#0b0d10" opacity="0.75" />
          <rect x="124" y="45" width="60" height="6" rx="3" fill="#0b0d10" opacity="0.45" />
          {/* Media */}
          <rect x="440" y="12" width="188" height="120" rx="12" fill="#161a20" />
          <rect x="454" y="26" width="56" height="56" rx="8" fill="url(#art)" />
          <rect x="520" y="34" width="92" height="8" rx="4" fill="#e8eaed" />
          <rect x="520" y="50" width="64" height="7" rx="3.5" fill="#9aa0a6" />
          <rect x="454" y="98" width="160" height="5" rx="2.5" fill="#2b3038" />
          <rect x="454" y="98" width="96" height="5" rx="2.5" fill={GREEN} />
          {/* Call / message */}
          <rect x="440" y="142" width="188" height="86" rx="12" fill="#161a20" />
          <circle cx="474" cy="185" r="18" fill="#2b3038" />
          <rect x="502" y="172" width="96" height="8" rx="4" fill="#e8eaed" />
          <rect x="502" y="188" width="70" height="7" rx="3.5" fill="#9aa0a6" />
          <defs>
            <linearGradient id="art" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GREEN} />
              <stop offset="1" stopColor="#4285f4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <figcaption className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{caption}</figcaption>
    </figure>
  );
}

export async function AndroidAutoSpotlight({ whatsapp }: { whatsapp: string }) {
  const t = await getTranslations('AndroidAutoNew');
  const price = PRICE_ITEMS.find((i) => i.id === 'android-auto')?.price['nbt-evo'] ?? 250;
  const features = [t('f1'), t('f2'), t('f3'), t('f4')];

  return (
    <section id="android-auto" className="relative border-t border-white/5 py-14 md:py-20">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1013]/80 backdrop-blur-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(60% 55% at 85% 20%, ${GREEN}1f, transparent 70%)` }}
          />
          <div className="relative grid gap-10 p-6 md:grid-cols-12 md:items-center md:gap-12 md:p-10">
            <div className="min-w-0 md:col-span-6">
              <p className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-black" style={{ background: GREEN }}>
                  {t('badge')}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{t('eyebrow')}</span>
              </p>
              <h2 className="mt-4 text-balance font-display text-[clamp(2.2rem,6.4vw,4.2rem)] leading-[0.95] text-white">
                {t('title1')}
                <span className="mt-2 block text-[clamp(1.3rem,3.2vw,2rem)] leading-tight" style={{ color: GREEN }}>
                  {t('title2')}
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{t('body')}</p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: GREEN }} /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-3">
                <p className="font-display text-6xl font-bold leading-none text-white">
                  <OfferPrice text={`€${price}`} />
                </p>
                <p className="pb-1 text-sm text-muted">{t('priceNote')}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#vin-check" className="btn-primary">
                  <ScanSearch size={15} /> {t('ctaCheck')}
                </a>
                <a href={waHref(whatsapp, t('waMessage'))} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <MessageCircle size={15} /> {t('ctaWhatsapp')}
                </a>
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-faint">
                {t('needs')}{' '}
                <Link href="/bmw-android-auto-activation" className="inline-flex items-center gap-1 text-muted underline-offset-2 hover:text-ink hover:underline">
                  {t('ctaMore')} <ArrowRight size={12} />
                </Link>
              </p>
            </div>

            <div className="min-w-0 md:col-span-6">
              <ScreenMock caption={t('caption')} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
