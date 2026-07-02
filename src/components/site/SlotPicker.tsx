'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

// Booking availability: weekdays 19:00–23:00 (evenings), weekends 11:00–23:00.
// Mirror this in the structured data and footer hours if it changes.
const HOURS: Record<number, [number, number] | null> = {
  0: [11, 23], // Sun
  1: [19, 23], // Mon
  2: [19, 23], // Tue
  3: [19, 23], // Wed
  4: [19, 23], // Thu
  5: [19, 23], // Fri
  6: [11, 23], // Sat
};

const pad = (n: number) => String(n).padStart(2, '0');

function windowsFor(weekday: number): string[] {
  const r = HOURS[weekday];
  if (!r) return [];
  const out: string[] = [];
  for (let h = r[0]; h + 2 <= r[1]; h += 2) out.push(`${pad(h)}:00–${pad(h + 2)}:00`);
  return out;
}

/** Local YYYY-MM-DD (avoids the UTC off-by-one of toISOString). */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type SlotValue = { date: string; time: string };

export function SlotPicker({
  value,
  onChange,
}: {
  value: SlotValue;
  onChange: (v: SlotValue) => void;
}) {
  const t = useTranslations('Contact');
  const locale = useLocale();

  // The date list depends on "today", which differs between the statically
  // prerendered HTML (server timezone) and the visitor's browser. Rendering it
  // only after mount keeps server and first client render identical, avoiding a
  // hydration mismatch that would otherwise crash the page near date boundaries.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Slots already taken (confirmed bookings) and owner-blocked days.
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    fetch('/api/slots')
      .then((r) => r.json())
      .then((d: { taken?: { date: string; time: string }[]; blocked?: string[] }) => {
        if (!alive) return;
        if (Array.isArray(d.taken)) setTaken(new Set(d.taken.map((s) => `${s.date}|${s.time}`)));
        if (Array.isArray(d.blocked)) setBlocked(new Set(d.blocked));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Next ~2 weeks of bookable days (every day has evening/weekend slots).
  const days = useMemo(() => {
    const out: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 1; i <= 24 && out.length < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (HOURS[d.getDay()]) out.push(d);
    }
    return out;
  }, []);

  const selectedDay = value.date ? new Date(`${value.date}T00:00:00`) : null;
  const times = selectedDay ? windowsFor(selectedDay.getDay()) : [];

  return (
    <div className="border border-white/10 bg-graphite-900/60 p-4">
      <div className="flex items-center gap-2">
        <CalendarClock size={16} className="text-bmw" />
        <span className="label">{t('slotHeading')}</span>
        <span className="text-[11px] text-faint">· {t('slotOptional')}</span>
      </div>

      {!mounted ? (
        // Placeholder that matches the server render until the client mounts.
        <div className="mt-3 h-[62px] w-full animate-pulse rounded bg-white/5" aria-hidden="true" />
      ) : (
        <>
      {/* Date chips */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.filter((d) => !blocked.has(ymd(d))).map((d) => {
          const key = ymd(d);
          const active = value.date === key;
          // Dim a day whose every window is already taken.
          const dayWindows = windowsFor(d.getDay());
          const full = dayWindows.length > 0 && dayWindows.every((w) => taken.has(`${key}|${w}`));
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ date: key, time: '' })}
              aria-pressed={active}
              className={`relative flex shrink-0 flex-col items-center gap-0.5 border px-3 py-2 transition-colors ${
                active
                  ? 'border-bmw bg-bmw/10 text-ink'
                  : `border-white/10 hover:border-white/25 ${full ? 'text-faint opacity-50' : 'text-muted'}`
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {d.toLocaleDateString(locale, { weekday: 'short' })}
              </span>
              <span className={`text-base leading-none ${full && !active ? 'text-faint' : 'text-ink'}`}>
                {d.getDate()}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                {d.toLocaleDateString(locale, { month: 'short' })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time-window chips for the selected day */}
      {selectedDay && (
        <div className="mt-3">
          <span className="label mb-2 block">{t('slotTimePrompt')}</span>
          <div className="flex flex-wrap gap-2">
            {times.map((w) => {
              const active = value.time === w;
              const isTaken = taken.has(`${value.date}|${w}`);
              return (
                <button
                  key={w}
                  type="button"
                  disabled={isTaken}
                  onClick={() => onChange({ date: value.date, time: w })}
                  aria-pressed={active}
                  className={`flex items-center gap-2 border px-3 py-2 font-mono text-xs transition-colors ${
                    isTaken
                      ? 'cursor-not-allowed border-white/5 text-faint line-through opacity-50'
                      : active
                        ? 'border-bmw bg-bmw/10 text-ink'
                        : 'border-white/10 text-muted hover:border-white/25'
                  }`}
                >
                  {w}
                  {isTaken && <span className="no-underline">· {t('slotTaken')}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-faint">{t('slotNote')}</p>
    </div>
  );
}
