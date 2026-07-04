'use client';

import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';
import {
  CalendarDays, Check, X, Trash2, Ban, Phone, TrendingUp, RefreshCw,
  LockOpen, Clock3, Wrench, Star, Eye, EyeOff, Save, Plus,
} from 'lucide-react';
import type { Booking, Review } from '@/lib/types';
import type { BusinessStats } from '@/lib/stats';
import { windowsFor, windowsOverlap, WEEKDAY_LABELS, type HoursMap } from '@/lib/hours';

type ServiceRow = { id: number; title: string; price_label: string; visible: boolean; sort_order: number };

type Overview = {
  schedule: { day: string; bookings: Booking[] }[];
  blocked: string[];
  stats: BusinessStats;
  hours: HoursMap;
  slotDuration: number;
  services: ServiceRow[];
  reviews: Review[];
  reviewUrl?: string;
};

type TgWebApp = {
  initData: string;
  platform?: string;
  version?: string;
  ready: () => void;
  expand: () => void;
  HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (t: string) => void };
};

// Fallbacks for clients where telegram-web-app.js hasn't populated initData.
function recoverInitData(): string {
  try {
    const early = sessionStorage.getItem('__tg_hash');
    if (early) {
      const fromEarly = new URLSearchParams(early).get('tgWebAppData');
      if (fromEarly) return fromEarly;
    }
    const hash = window.location.hash.slice(1);
    const fromHash = new URLSearchParams(hash).get('tgWebAppData');
    if (fromHash) return fromHash;
    const stored = sessionStorage.getItem('__telegram__initParams');
    if (stored) {
      const parsed = JSON.parse(stored) as { tgWebAppData?: string };
      if (parsed.tgWebAppData) return parsed.tgWebAppData;
    }
  } catch { /* ignore */ }
  return '';
}

const getTg = (): TgWebApp | undefined =>
  (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;

function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });
}

const STATUS_DOT: Record<string, string> = { confirmed: 'bg-emerald-400', pending: 'bg-amber-400' };

type Act = (p: Record<string, unknown>, h?: 'success' | 'warning') => Promise<void>;

const TABS = [
  ['today', 'Today'],
  ['schedule', 'Schedule'],
  ['services', 'Services'],
  ['reviews', 'Reviews'],
  ['hours', 'Hours'],
  ['stats', 'Stats'],
] as const;
type Tab = (typeof TABS)[number][0];

export default function MiniApp() {
  const [tab, setTab] = useState<Tab>('today');
  const [data, setData] = useState<Overview | null>(null);
  const [state, setState] = useState<'boot' | 'noauth' | 'ready' | 'error'>('boot');
  const [busy, setBusy] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const api = useCallback(async (payload: Record<string, unknown>) => {
    const tg = getTg();
    const initData = tg?.initData || recoverInitData();
    const res = await fetch('/api/miniapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, ...payload }),
    });
    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = [j.reason, j.userId ? `id ${j.userId}` : ''].filter(Boolean).join(' · ');
      } catch { /* ignore */ }
      throw new Error(`${res.status}|${detail}`);
    }
    return res.json();
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await api({ action: 'overview' });
      setData(d);
      setState('ready');
    } catch (e) {
      const [code, detail] = (e as Error).message.split('|');
      if (detail) setDebugInfo((d) => `${d} · ${detail}`.replace(/^ · /, ''));
      setState(code === '401' ? 'noauth' : 'error');
    }
  }, [api]);

  useEffect(() => {
    let tries = 0;
    const t = window.setInterval(() => {
      const tg = getTg();
      tries += 1;
      if (tg) {
        window.clearInterval(t);
        tg.ready();
        tg.expand();
        const hasAuth = Boolean(tg.initData || recoverInitData());
        setDebugInfo(`${tg.platform ?? '?'} · v${tg.version ?? '?'} · auth:${hasAuth ? 'yes' : 'none'}`);
        if (!hasAuth) setState('noauth');
        else void load();
      } else if (tries > 40) {
        window.clearInterval(t);
        setDebugInfo('no telegram script');
        setState('noauth');
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [load]);

  const act: Act = async (payload, haptic = 'success') => {
    if (busy) return;
    setBusy(true);
    try {
      await api(payload);
      getTg()?.HapticFeedback?.notificationOccurred(haptic);
      await load();
    } catch {
      getTg()?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setBusy(false);
    }
  };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-graphite-900 pb-24 text-ink">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />

      <div className="sticky top-0 z-10 border-b border-white/5 bg-graphite-900/95 backdrop-blur">
        <div className="m-stripe h-[3px] w-full" />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-display text-xl tracking-wide">BMW CODING · PULT</span>
          <button
            onClick={() => void load()}
            aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center border border-white/10 text-muted active:scale-95"
          >
            <RefreshCw size={15} className={state === 'boot' ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex overflow-x-auto border-t border-white/5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                getTg()?.HapticFeedback?.impactOccurred('light');
              }}
              className={`shrink-0 px-4 py-3 font-mono text-[11px] uppercase tracking-widest ${
                tab === key ? 'border-b-2 border-bmw text-ink' : 'text-faint'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {state === 'boot' && <p className="py-16 text-center text-sm text-muted">Loading…</p>}
        {state === 'noauth' && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted">Open this app from the bot&apos;s menu button in Telegram.</p>
            {debugInfo && <p className="mt-4 font-mono text-[10px] text-faint">{debugInfo}</p>}
          </div>
        )}
        {state === 'error' && (
          <p className="py-16 text-center text-sm text-muted">Couldn&apos;t load — tap refresh.</p>
        )}

        {state === 'ready' && data && (
          <>
            {tab === 'today' && <TodayTab data={data} todayKey={todayKey} busy={busy} act={act} />}
            {tab === 'schedule' && <ScheduleTab data={data} busy={busy} act={act} />}
            {tab === 'services' && <ServicesTab services={data.services} busy={busy} act={act} />}
            {tab === 'reviews' && <ReviewsTab reviews={data.reviews} busy={busy} act={act} />}
            {tab === 'hours' && <HoursTab hours={data.hours} slotDuration={data.slotDuration || 2} busy={busy} act={act} />}
            {tab === 'stats' && <StatsTab stats={data.stats} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Bookings ─────────────────────────────────────────────── */

function BookingCard({ b, data, busy, act }: { b: Booking; data: Overview; busy: boolean; act: Act }) {
  const [reschedule, setReschedule] = useState(false);
  const [pickDay, setPickDay] = useState('');

  // Windows already taken by OTHER confirmed bookings.
  const taken = new Set(
    data.schedule.flatMap((d) =>
      d.bookings
        .filter((x) => x.status === 'confirmed' && x.id !== b.id)
        .map((x) => `${d.day}|${x.slot_time}`),
    ),
  );
  const blocked = new Set(data.blocked);
  const days = data.schedule.map((d) => d.day).filter((d) => !blocked.has(d));

  return (
    <div className="border border-white/8 bg-graphite-800/60 p-4">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[b.status] ?? 'bg-faint'}`} />
        <span className="font-mono text-xs text-bmw">{b.slot_time || '—'}</span>
        <span className="truncate font-medium">{b.name}</span>
        {b.contact && (
          <a
            href={`tel:${b.contact.replace(/[^\d+]/g, '')}`}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center border border-white/10 text-muted active:scale-95"
            aria-label="Call"
          >
            <Phone size={13} />
          </a>
        )}
      </div>
      {(b.service || b.bmw_model) && (
        <p className="mt-1.5 truncate text-xs text-muted">
          {[b.bmw_model, b.service].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {b.status === 'pending' && (
          <>
            <ActionBtn primary disabled={busy} onClick={() => void act({ action: 'setStatus', id: b.id, status: 'confirmed' })}>
              <Check size={13} /> Confirm
            </ActionBtn>
            <ActionBtn disabled={busy} onClick={() => void act({ action: 'setStatus', id: b.id, status: 'declined' }, 'warning')}>
              <X size={13} /> Decline
            </ActionBtn>
          </>
        )}
        {b.status === 'confirmed' && (
          <>
            <ActionBtn disabled={busy} onClick={() => void act({ action: 'setStatus', id: b.id, status: 'cancelled' }, 'warning')}>
              <Trash2 size={13} /> Free slot
            </ActionBtn>
            {data.reviewUrl && (
              <ActionBtn
                onClick={() => {
                  const first = b.name.trim().split(/\s+/)[0] || 'there';
                  const svc = b.service ? ` — hope the ${b.service} is treating you well` : '';
                  void navigator.clipboard
                    .writeText(`Hi ${first}! Thanks for trusting us with your BMW${svc}. If you have 30 seconds, a quick Google review would mean a lot: ${data.reviewUrl}`)
                    .then(() => getTg()?.HapticFeedback?.notificationOccurred('success'));
                }}
              >
                <Star size={13} /> Ask review
              </ActionBtn>
            )}
          </>
        )}
        <ActionBtn disabled={busy} onClick={() => { setReschedule((v) => !v); setPickDay(''); }}>
          <Clock3 size={13} /> Move
        </ActionBtn>
      </div>

      {reschedule && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-faint">New day</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setPickDay(d)}
                className={`shrink-0 border px-2.5 py-1.5 font-mono text-[10px] ${
                  pickDay === d ? 'border-bmw bg-bmw/10 text-ink' : 'border-white/10 text-muted'
                }`}
              >
                {dayLabel(d)}
              </button>
            ))}
          </div>
          {pickDay && (
            <>
              <p className="mb-2 mt-3 font-mono text-[10px] uppercase tracking-wider text-faint">New time</p>
              <div className="flex flex-wrap gap-1.5">
                {windowsFor(data.hours, new Date(`${pickDay}T00:00:00`).getDay(), data.slotDuration || 2).map((w) => {
                  const isTaken = [...taken].some((entry) => {
                    const sep = entry.indexOf('|');
                    return entry.slice(0, sep) === pickDay && windowsOverlap(entry.slice(sep + 1), w);
                  });
                  return (
                    <button
                      key={w}
                      disabled={busy || isTaken}
                      onClick={() => {
                        setReschedule(false);
                        void act({ action: 'reschedule', id: b.id, slot_date: pickDay, slot_time: w });
                      }}
                      className={`border px-2.5 py-1.5 font-mono text-[10px] ${
                        isTaken ? 'border-white/5 text-faint line-through' : 'border-white/10 text-muted active:scale-95'
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children, onClick, disabled, primary,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wider active:scale-95 disabled:opacity-50 ${
        primary ? 'bg-bmw text-white' : 'border border-white/10 text-muted'
      }`}
    >
      {children}
    </button>
  );
}

function TodayTab({ data, todayKey, busy, act }: { data: Overview; todayKey: string; busy: boolean; act: Act }) {
  const todays = data.schedule.find((d) => d.day === todayKey);
  const upcoming = data.schedule.filter((d) => d.day !== todayKey && d.bookings.length > 0).slice(0, 5);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="label mb-2">Today · {dayLabel(todayKey)}</h2>
        {todays && todays.bookings.length > 0 ? (
          <div className="space-y-2">
            {todays.bookings.map((b) => <BookingCard key={b.id} b={b} data={data} busy={busy} act={act} />)}
          </div>
        ) : (
          <p className="border border-white/8 bg-graphite-800/40 p-4 text-sm text-muted">Nothing booked today.</p>
        )}
      </div>
      <div>
        <h2 className="label mb-2">Coming up</h2>
        <div className="space-y-2">
          {upcoming.flatMap((d) =>
            d.bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5 border border-white/8 bg-graphite-800/40 px-4 py-3 text-sm">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[b.status] ?? 'bg-faint'}`} />
                <span className="font-mono text-xs text-bmw">{dayLabel(d.day)}</span>
                <span className="font-mono text-xs text-faint">{b.slot_time}</span>
                <span className="truncate">{b.name}</span>
              </div>
            )),
          )}
          {upcoming.length === 0 && (
            <p className="border border-white/8 bg-graphite-800/40 p-4 text-sm text-muted">No upcoming bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({ data, busy, act }: { data: Overview; busy: boolean; act: Act }) {
  const blocked = new Set(data.blocked);
  return (
    <div className="space-y-2">
      {data.schedule.map(({ day, bookings }) => {
        const isBlocked = blocked.has(day);
        return (
          <div key={day} className={`border border-white/8 bg-graphite-800/40 p-3.5 ${isBlocked ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-2.5">
              <CalendarDays size={14} className={isBlocked ? 'text-faint' : 'text-bmw'} />
              <span className="text-sm font-medium">{dayLabel(day)}</span>
              {isBlocked && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] uppercase text-red-400">blocked</span>}
              {!isBlocked && bookings.length === 0 && <span className="text-[11px] text-faint">free</span>}
              <button
                disabled={busy}
                onClick={() => void act({ action: 'toggleBlock', day }, 'warning')}
                className="ml-auto flex h-8 items-center gap-1.5 border border-white/10 px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted active:scale-95 disabled:opacity-50"
              >
                {isBlocked ? <LockOpen size={12} /> : <Ban size={12} />}
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
            {bookings.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                {bookings.map((b) => <BookingCard key={b.id} b={b} data={data} busy={busy} act={act} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Services ─────────────────────────────────────────────── */

function ServiceRowCard({ s, busy, act }: { s: ServiceRow; busy: boolean; act: Act }) {
  const [title, setTitle] = useState(s.title);
  const [price, setPrice] = useState(s.price_label);
  const dirty = title !== s.title || price !== s.price_label;
  return (
    <div className={`border border-white/8 bg-graphite-800/40 p-3.5 ${s.visible ? '' : 'opacity-50'}`}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border-0 bg-transparent p-0 text-sm font-medium text-ink outline-none"
      />
      <div className="mt-2.5 flex items-center gap-2">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-28 border border-white/10 bg-graphite-900 px-2 py-1.5 font-mono text-xs text-bmw outline-none focus:border-bmw"
        />
        <button
          disabled={busy}
          onClick={() => void act({ action: 'updateService', id: s.id, visible: !s.visible }, 'warning')}
          className="flex h-8 w-8 items-center justify-center border border-white/10 text-muted active:scale-95 disabled:opacity-50"
          aria-label={s.visible ? 'Hide' : 'Show'}
        >
          {s.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        {dirty && (
          <button
            disabled={busy}
            onClick={() => void act({ action: 'updateService', id: s.id, title, price_label: price })}
            className="ml-auto flex items-center gap-1.5 bg-bmw px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-white active:scale-95 disabled:opacity-50"
          >
            <Save size={12} /> Save
          </button>
        )}
      </div>
    </div>
  );
}

function ServicesTab({ services, busy, act }: { services: ServiceRow[]; busy: boolean; act: Act }) {
  return (
    <div className="space-y-2">
      <p className="mb-3 flex items-center gap-2 text-xs text-faint">
        <Wrench size={13} className="text-bmw" /> Edit titles and prices — changes go live on the site immediately.
      </p>
      {services.map((s) => <ServiceRowCard key={s.id} s={s} busy={busy} act={act} />)}
    </div>
  );
}

/* ── Reviews ──────────────────────────────────────────────── */

function ReviewsTab({ reviews, busy, act }: { reviews: Review[]; busy: boolean; act: Act }) {
  const [author, setAuthor] = useState('');
  const [car, setCar] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  return (
    <div className="space-y-4">
      <div className="border border-white/8 bg-graphite-800/40 p-4">
        <h2 className="label mb-3 flex items-center gap-2"><Plus size={13} className="text-bmw" /> Add review</h2>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author"
          className="mb-2 w-full border border-white/10 bg-graphite-900 px-3 py-2 text-sm outline-none focus:border-bmw" />
        <input value={car} onChange={(e) => setCar(e.target.value)} placeholder="Car (optional)"
          className="mb-2 w-full border border-white/10 bg-graphite-900 px-3 py-2 text-sm outline-none focus:border-bmw" />
        <div className="mb-2 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star size={20} className={n <= rating ? 'fill-bmw text-bmw' : 'text-graphite-500'} />
            </button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="What they said…"
          className="mb-3 w-full border border-white/10 bg-graphite-900 px-3 py-2 text-sm outline-none focus:border-bmw" />
        <ActionBtn primary disabled={busy || !author.trim() || !text.trim()}
          onClick={() => { void act({ action: 'addReview', author, car, rating, body: text }); setAuthor(''); setCar(''); setText(''); setRating(5); }}>
          <Plus size={13} /> Add
        </ActionBtn>
      </div>

      <div className="space-y-2">
        {reviews.map((r) => (
          <div key={r.id} className={`border border-white/8 bg-graphite-800/40 p-3.5 ${r.visible ? '' : 'opacity-50'}`}>
            <div className="flex items-center gap-2">
              <span className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="fill-bmw text-bmw" />)}
              </span>
              <span className="truncate text-sm font-medium">{r.author}</span>
              <button
                disabled={busy}
                onClick={() => void act({ action: 'updateReview', id: r.id, visible: !r.visible }, 'warning')}
                className="ml-auto flex h-8 w-8 items-center justify-center border border-white/10 text-muted active:scale-95"
                aria-label={r.visible ? 'Hide' : 'Show'}
              >
                {r.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button
                disabled={busy}
                onClick={() => void act({ action: 'deleteReview', id: r.id }, 'warning')}
                className="flex h-8 w-8 items-center justify-center border border-white/10 text-red-400 active:scale-95"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{r.body}</p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="border border-white/8 bg-graphite-800/40 p-4 text-sm text-muted">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}

/* ── Hours ────────────────────────────────────────────────── */

function HourRow({ weekday, value, busy, act }: { weekday: number; value: [number, number] | null; busy: boolean; act: Act }) {
  const [open, setOpen] = useState(value ? value[0] : 19);
  const [close, setClose] = useState(value ? value[1] : 23);
  const closed = value === null;
  const dirty = value !== null && (open !== value[0] || close !== value[1]);
  const opts = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className={`border border-white/8 bg-graphite-800/40 p-3.5 ${closed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm font-medium">{WEEKDAY_LABELS[weekday]}</span>
        {!closed && (
          <>
            <select value={open} onChange={(e) => setOpen(Number(e.target.value))}
              className="border border-white/10 bg-graphite-900 px-1.5 py-1.5 font-mono text-xs outline-none">
              {opts.slice(0, 23).map((h) => <option key={h} value={h} className="bg-graphite-800">{String(h).padStart(2, '0')}:00</option>)}
            </select>
            <span className="text-faint">–</span>
            <select value={close} onChange={(e) => setClose(Number(e.target.value))}
              className="border border-white/10 bg-graphite-900 px-1.5 py-1.5 font-mono text-xs outline-none">
              {opts.slice(1).map((h) => <option key={h} value={h} className="bg-graphite-800">{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </>
        )}
        {closed && <span className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] uppercase text-red-400">closed</span>}
        <div className="ml-auto flex gap-1.5">
          {dirty && close - open >= 2 && (
            <button disabled={busy}
              onClick={() => void act({ action: 'setHours', weekday, open_hour: open, close_hour: close, closed: false })}
              className="flex items-center gap-1 bg-bmw px-2.5 py-1.5 font-mono text-[10px] uppercase text-white active:scale-95">
              <Save size={11} /> Save
            </button>
          )}
          <button disabled={busy}
            onClick={() => void act({ action: 'setHours', weekday, open_hour: open, close_hour: close, closed: !closed }, 'warning')}
            className="border border-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase text-muted active:scale-95">
            {closed ? 'Open day' : 'Close day'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoursTab({ hours, slotDuration, busy, act }: { hours: HoursMap; slotDuration: number; busy: boolean; act: Act }) {
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  return (
    <div className="space-y-2">
      <div className="mb-4 border border-white/8 bg-graphite-800/40 p-4">
        <h2 className="label mb-3">Slot length</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((d) => (
            <button
              key={d}
              disabled={busy || d === slotDuration}
              onClick={() => void act({ action: 'setSlotDuration', duration: d })}
              className={`flex-1 border px-3 py-2.5 font-mono text-xs ${
                d === slotDuration ? 'border-bmw bg-bmw/10 text-ink' : 'border-white/10 text-muted active:scale-95'
              }`}
            >
              {d}h
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Windows start every hour and last this long — applies to the site picker, moves and the bot.
        </p>
      </div>
      <p className="mb-3 text-xs text-faint">
        Booking windows run inside these hours. Changes apply to the site&apos;s slot picker instantly.
      </p>
      {order.map((wd) => <HourRow key={wd} weekday={wd} value={hours[wd] ?? null} busy={busy} act={act} />)}
    </div>
  );
}

/* ── Stats ────────────────────────────────────────────────── */

function StatsTab({ stats }: { stats: BusinessStats }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {([[stats.last7, '7 days'], [stats.last30, '30 days'], [stats.total, 'All time']] as const).map(([n, label]) => (
          <div key={label} className="border border-white/8 bg-graphite-800/40 p-4 text-center">
            <div className="font-display text-3xl">{n}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
          </div>
        ))}
      </div>
      <div className="border border-white/8 bg-graphite-800/40 p-4">
        <h2 className="label mb-3 flex items-center gap-2"><TrendingUp size={13} className="text-bmw" /> Slots</h2>
        <p className="text-sm text-muted">✅ {stats.confirmedUpcoming} confirmed upcoming · ⏳ {stats.pending} pending</p>
      </div>
      {stats.topServices.length > 0 && (
        <div className="border border-white/8 bg-graphite-800/40 p-4">
          <h2 className="label mb-3">Most requested</h2>
          <ul className="space-y-2">
            {stats.topServices.map((t) => (
              <li key={t.service} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-muted">{t.service}</span>
                <span className="font-mono text-xs">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
