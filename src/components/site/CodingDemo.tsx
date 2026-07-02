'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Reveal } from './Reveal';

// Interactive "what coding feels like" demo: a stylised cluster + iDrive
// screen where visitors flip real coding options and watch the car react.
// Pure CSS transitions — no timers, so it stays hydration-safe and cheap.

const AMBIENT_COLORS = [
  { name: 'blue', value: '#1C69D4' },
  { name: 'ice', value: '#2E9BE6' },
  { name: 'orange', value: '#FF7A00' },
  { name: 'red', value: '#E2001A' },
  { name: 'green', value: '#2FBF71' },
  { name: 'purple', value: '#8B5CF6' },
];

// 270° dial from 135° to 405° (SVG degrees, clockwise from +x axis)
const ARC = 'M 43.4 156.6 A 80 80 0 1 1 156.6 156.6';
const TICKS = Array.from({ length: 28 }, (_, i) => {
  const a = ((135 + (270 / 27) * i) * Math.PI) / 180;
  const major = i % 3 === 0;
  const r1 = major ? 68 : 72;
  return {
    x1: 100 + r1 * Math.cos(a),
    y1: 100 + r1 * Math.sin(a),
    x2: 100 + 78 * Math.cos(a),
    y2: 100 + 78 * Math.sin(a),
    major,
  };
});

function Gauge({
  value,
  sport,
  unit,
  center,
}: {
  value: number; // 0..1
  sport: boolean;
  unit: string;
  center?: ReactNode;
}) {
  const color = sport ? '#E2001A' : '#2E9BE6';
  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-full">
        <path d={ARC} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <path
          d={ARC}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${value * 100} 100`}
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.34,1.3,0.5,1), stroke 0.5s ease' }}
        />
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)'}
            strokeWidth={t.major ? 2 : 1}
          />
        ))}
        <g
          className="demo-needle"
          style={{ transform: `rotate(${value * 270 - 135}deg)`, transformOrigin: '100px 100px' }}
        >
          <polygon points="97,100 100,32 103,100" fill={color} style={{ transition: 'fill 0.5s ease' }} />
        </g>
        <circle cx="100" cy="100" r="7" fill="#16191D" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1">
        {center}
        <span className="font-mono text-[10px] uppercase tracking-widest text-faint">{unit}</span>
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-center justify-between gap-3 border px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest transition-all duration-300 active:scale-[0.98] ${
        active
          ? 'border-m-blue/60 bg-bmw/10 text-ink'
          : 'border-white/10 bg-graphite-800/60 text-muted hover:border-white/25 hover:text-ink'
      }`}
    >
      <span>{label}</span>
      <span
        className={`relative h-4 w-8 shrink-0 rounded-full transition-colors duration-300 ${
          active ? 'bg-bmw' : 'bg-graphite-500'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-300 ${
            active ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export function CodingDemo() {
  const t = useTranslations('Demo');
  const [sport, setSport] = useState(false);
  const [digital, setDigital] = useState(false);
  const [vim, setVim] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const [ambientColor, setAmbientColor] = useState(AMBIENT_COLORS[0].value);
  const [welcomeKey, setWelcomeKey] = useState(0);

  const speed = sport ? 0.62 : 0.28;
  const revs = sport ? 0.7 : 0.22;

  return (
    <section className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-10 flex items-center gap-3">
          <span className="label">{t('eyebrow')}</span>
          <span className="m-stripe h-[2px] w-10" />
        </div>
        <h2 className="mb-4 max-w-3xl font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
          {t('heading')}
        </h2>
        <p className="mb-12 max-w-xl text-sm leading-relaxed text-muted">{t('intro')}</p>

        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Dashboard mockup */}
            <div className="lg:col-span-7">
              <div
                className={`relative overflow-hidden rounded-2xl border bg-graphite-800/80 p-4 transition-all duration-500 md:p-6 ${
                  sport ? 'border-m-red/30' : 'border-white/10'
                }`}
                style={
                  ambient
                    ? { boxShadow: `0 24px 80px -28px ${ambientColor}` }
                    : undefined
                }
              >
                {welcomeKey > 0 && <div key={welcomeKey} className="demo-welcome z-10" />}

                {/* Instrument cluster */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/5 bg-graphite-900 p-3 md:gap-6 md:p-5">
                  <Gauge
                    value={speed}
                    sport={sport}
                    unit="km/h"
                    center={
                      <span
                        className={`font-display text-3xl leading-none transition-opacity duration-500 md:text-4xl ${
                          digital ? 'opacity-100 text-ink' : 'opacity-0'
                        }`}
                      >
                        {sport ? 132 : 87}
                      </span>
                    }
                  />
                  <Gauge value={revs} sport={sport} unit="rpm ×1000" />
                </div>

                {/* iDrive screen */}
                <div className="mt-3 overflow-hidden rounded-xl border border-white/5 bg-graphite-900 md:mt-4">
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
                      iDrive
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-400/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400/90" />
                      {t('moving')}
                    </span>
                  </div>
                  <div className="relative flex h-32 items-center justify-center md:h-40">
                    {vim ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bmw/20 via-graphite-800 to-m-red/10 [background-size:200%_200%] animate-gradient-pan">
                        <div className="flex flex-col items-center gap-3">
                          <div className="demo-eq flex h-8 items-end gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <span
                                key={i}
                                className="w-1.5 rounded-sm bg-m-blue"
                                style={{ height: '100%', animationDelay: `${i * 0.12}s` }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/80">
                            ▶ Now playing
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-4 right-4 h-1 overflow-hidden rounded-full bg-white/10">
                          <div className="demo-progress h-full rounded-full bg-m-blue" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-6 text-center">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-faint" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="5" y="10" width="14" height="10" rx="1.5" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                        <span className="text-xs text-muted">{t('vimLocked')}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
                          → {t('vimHint')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ambient light strip */}
                <div
                  className="mt-3 h-1.5 rounded-full transition-all duration-700 md:mt-4"
                  style={
                    ambient
                      ? { background: ambientColor, boxShadow: `0 0 24px 2px ${ambientColor}` }
                      : { background: 'rgba(255,255,255,0.06)' }
                  }
                />
              </div>
            </div>

            {/* Controls */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <ToggleChip label={t('sport')} active={sport} onClick={() => setSport((v) => !v)} />
                <ToggleChip label={t('digital')} active={digital} onClick={() => setDigital((v) => !v)} />
                <ToggleChip label={t('vim')} active={vim} onClick={() => setVim((v) => !v)} />
                <ToggleChip label={t('ambient')} active={ambient} onClick={() => setAmbient((v) => !v)} />
                <button
                  type="button"
                  onClick={() => setWelcomeKey((k) => k + 1)}
                  className="flex items-center justify-between gap-3 border border-white/10 bg-graphite-800/60 px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-muted transition-all duration-300 hover:border-white/25 hover:text-ink active:scale-[0.98]"
                >
                  <span>{t('welcome')}</span>
                  <span aria-hidden>✦</span>
                </button>
              </div>

              {/* Ambient colours */}
              <div
                className={`mt-4 flex items-center gap-3 transition-opacity duration-300 ${
                  ambient ? 'opacity-100' : 'pointer-events-none opacity-30'
                }`}
              >
                {AMBIENT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    onClick={() => setAmbientColor(c.value)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform duration-200 active:scale-90 ${
                      ambientColor === c.value ? 'scale-110 border-white' : 'border-transparent'
                    }`}
                    style={{ background: c.value, boxShadow: `0 0 12px -2px ${c.value}` }}
                  />
                ))}
              </div>

              <Link href="/#contact" className="btn-primary mt-8 w-full sm:w-auto">
                {t('cta')} →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
