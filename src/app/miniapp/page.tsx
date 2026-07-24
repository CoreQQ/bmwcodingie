'use client';

import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';
import {
  CalendarDays, Check, X, Trash2, Ban, Phone, TrendingUp, RefreshCw,
  LockOpen, Clock3, Wrench, Star, Eye, EyeOff, Save, Plus, Users, MessageCircle,
} from 'lucide-react';
import type { Booking, Review } from '@/lib/types';
import type { BusinessStats } from '@/lib/stats';
import { windowsFor, windowsOverlap, WEEKDAY_LABELS, type HoursMap } from '@/lib/hours';

type ServiceRow = { id: number; title: string; price_label: string; visible: boolean; sort_order: number };

type PaymentRow = {
  id: number;
  amount: number;
  client: string | null;
  service: string | null;
  cost?: number | null;
  share_pct?: number | null;
  share_name?: string | null;
  created_at: string;
};

type Overview = {
  schedule: { day: string; bookings: Booking[] }[];
  blocked: string[];
  stats: BusinessStats;
  hours: HoursMap;
  slotDuration: number;
  services: ServiceRow[];
  reviews: Review[];
  payments?: PaymentRow[];
  reviewUrl?: string;
  attention?: { section: string; seconds: number }[];
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
  ['money', 'Money'],
  ['schedule', 'Schedule'],
  ['clients', 'Clients'],
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
      body: JSON.stringify({
        initData,
        adminKey: (typeof localStorage !== 'undefined' && localStorage.getItem('pult_key')) || undefined,
        ...payload,
      }),
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
        if (localStorage.getItem('pult_key')) {
          setDebugInfo('standalone app');
          void load();
        } else {
          setDebugInfo('standalone app · enter password');
          setState('noauth');
        }
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [load]);

  // Register the service worker so PULT installs as a standalone app.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

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
          <div className="mx-auto max-w-xs py-16 text-center">
            <p className="text-sm text-muted">Open from the Telegram bot — or sign in with the admin password:</p>
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const v = (new FormData(e.currentTarget).get('pw') as string)?.trim();
                if (!v) return;
                localStorage.setItem('pult_key', v);
                setState('boot');
                void load();
              }}
            >
              <input
                name="pw"
                type="password"
                placeholder="Admin password"
                className="w-full border border-white/10 bg-graphite-800/60 px-4 py-3 text-sm text-ink outline-none focus:border-bmw"
              />
              <button type="submit" className="w-full border border-bmw bg-bmw/15 px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-ink active:scale-95">
                Sign in
              </button>
            </form>
            {debugInfo && <p className="mt-4 font-mono text-[10px] text-faint">{debugInfo}</p>}
          </div>
        )}
        {state === 'error' && (
          <p className="py-16 text-center text-sm text-muted">Couldn&apos;t load — tap refresh.</p>
        )}

        {state === 'ready' && data && (
          <>
            {tab === 'today' && <TodayTab data={data} todayKey={todayKey} busy={busy} act={act} />}
            {tab === 'money' && <MoneyTab payments={data.payments ?? []} busy={busy} act={act} />}
            {tab === 'schedule' && <ScheduleTab data={data} busy={busy} act={act} />}
            {tab === 'clients' && <ClientsTab api={api} reviewUrl={data.reviewUrl} />}
            {tab === 'services' && <ServicesTab services={data.services} busy={busy} act={act} />}
            {tab === 'reviews' && <ReviewsTab reviews={data.reviews} busy={busy} act={act} />}
            {tab === 'hours' && <HoursTab hours={data.hours} slotDuration={data.slotDuration || 2} busy={busy} act={act} />}
            {tab === 'stats' && <StatsTab stats={data.stats} attention={data.attention} />}
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

/* ── Clients (CRM) ────────────────────────────────────────── */

type CrmJob = { date: string | null; created_at: string; service: string | null; bmw_model: string | null; status: string };
type CrmClient = {
  id: number | null; code: string | null; name: string; contact: string;
  jobs: CrmJob[]; enquiries: number; confirmed: number; totalPaid: number;
  lastActivity: string; banned: boolean; banReason: string | null; note: string | null;
};

function ClientsTab({
  api,
  reviewUrl,
}: {
  api: (p: Record<string, unknown>) => Promise<{ clients?: CrmClient[]; total?: number }>;
  reviewUrl?: string;
}) {
  const [list, setList] = useState<CrmClient[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const d = await api({ action: 'clients', q: query });
        setList(d.clients ?? []);
        setTotal(d.total ?? 0);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    void load('');
  }, [load]);

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(q);
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, number or C-007…"
          className="flex-1 border border-white/10 bg-graphite-800 px-3 py-2.5 text-sm outline-none focus:border-bmw"
        />
        <button type="submit" className="border border-white/10 px-4 text-sm text-muted active:scale-95">Go</button>
      </form>

      <p className="text-[11px] text-faint">
        {loading ? 'Loading…' : `${list.length}${list.length < total ? ` of ${total}` : ''} client${total === 1 ? '' : 's'}`}
      </p>

      {list.map((c) => {
        const key = c.contact;
        const isOpen = open === key;
        const first = c.name.trim().split(/\s+/)[0] || 'there';
        return (
          <div key={key} className={`border ${c.banned ? 'border-m-red/40' : 'border-white/8'} bg-graphite-800/60`}>
            <button
              onClick={() => setOpen(isOpen ? null : key)}
              className="flex w-full items-center gap-2 p-3 text-left active:bg-white/[0.02]"
            >
              <span className="flex-1 truncate">
                <span className="font-medium">{c.name}</span>
                {c.code && <span className="ml-2 font-mono text-[10px] text-bmw">{c.code}</span>}
                {c.banned && <span className="ml-2 text-[10px] text-m-red">⛔️</span>}
                <span className="block truncate text-[11px] text-faint">{c.contact}</span>
              </span>
              <span className="shrink-0 text-right">
                {c.totalPaid > 0 && <span className="block font-mono text-sm text-emerald-400">€{c.totalPaid.toFixed(0)}</span>}
                <span className="block font-mono text-[10px] text-faint">{c.enquiries} job{c.enquiries === 1 ? '' : 's'}</span>
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-white/5 p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  <a href={`tel:${c.contact.replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 border border-white/10 px-3 py-2 text-[11px] active:scale-95">
                    <Phone size={12} /> Call
                  </a>
                  <a
                    href={`https://wa.me/${c.contact.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-white/10 px-3 py-2 text-[11px] active:scale-95"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                  {reviewUrl && (
                    <button
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(`Hi ${first}! Thanks for trusting us with your BMW. If you have 30 seconds, a quick Google review would mean a lot: ${reviewUrl}`)
                          .then(() => getTg()?.HapticFeedback?.notificationOccurred('success'))
                      }
                      className="flex items-center gap-1.5 border border-white/10 px-3 py-2 text-[11px] active:scale-95"
                    >
                      <Star size={12} /> Ask review
                    </button>
                  )}
                  <BanToggle client={c} api={api} onDone={() => load(q)} />
                  <button
                    onClick={async () => {
                      const name = window.prompt('Client name (first + last):', c.name);
                      if (!name || !name.trim()) return;
                      await api({ action: 'renameClient', contact: c.contact, name: name.trim() });
                      getTg()?.HapticFeedback?.notificationOccurred('success');
                      void load(q);
                    }}
                    className="flex items-center gap-1.5 border border-white/10 px-3 py-2 text-[11px] active:scale-95"
                  >
                    ✏️ Rename
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Delete ${c.name} (${c.code ?? c.contact}) and their ${c.enquiries} booking(s)? Payments are kept.`)) return;
                      await api({ action: 'deleteClient', contact: c.contact });
                      getTg()?.HapticFeedback?.notificationOccurred('warning');
                      setOpen(null);
                      void load(q);
                    }}
                    className="flex items-center gap-1.5 border border-m-red/40 px-3 py-2 text-[11px] text-m-red active:scale-95"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                <NoteEditor client={c} api={api} onSaved={() => load(q)} />

                <p className="mt-3 mb-1 font-mono text-[10px] uppercase tracking-wider text-faint">History</p>
                <ul className="space-y-1">
                  {c.jobs.slice(0, 12).map((j, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-[11px] text-muted">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[j.status] ?? 'bg-faint'}`} />
                      <span className="text-faint">{(j.date || j.created_at).slice(0, 10)}</span>
                      <span className="truncate">{[j.service, j.bmw_model].filter(Boolean).join(' · ') || 'enquiry'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NoteEditor({
  client,
  api,
  onSaved,
}: {
  client: CrmClient;
  api: (p: Record<string, unknown>) => Promise<unknown>;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(client.note ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = note !== (client.note ?? '');
  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Private note (car quirks, deal, reminders)…"
        className="w-full resize-none border border-white/10 bg-graphite-800 px-3 py-2 text-xs outline-none focus:border-bmw"
      />
      {dirty && (
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await api({ action: 'clientNote', contact: client.contact, note });
              getTg()?.HapticFeedback?.notificationOccurred('success');
              onSaved();
            } finally {
              setSaving(false);
            }
          }}
          className="mt-1.5 flex items-center gap-1.5 border border-bmw/50 bg-bmw/10 px-3 py-1.5 text-[11px] text-ink active:scale-95"
        >
          <Save size={12} /> Save note
        </button>
      )}
    </div>
  );
}

function BanToggle({
  client,
  api,
  onDone,
}: {
  client: CrmClient;
  api: (p: Record<string, unknown>) => Promise<unknown>;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const reason = client.banned ? '' : (window.prompt('Ban reason (optional):') ?? '');
          await api({ action: 'setBan', contact: client.contact, banned: !client.banned, reason });
          getTg()?.HapticFeedback?.notificationOccurred('warning');
          onDone();
        } finally {
          setBusy(false);
        }
      }}
      className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] active:scale-95 ${
        client.banned ? 'border-emerald-500/40 text-emerald-400' : 'border-m-red/40 text-m-red'
      }`}
    >
      <Ban size={12} /> {client.banned ? 'Unban' : 'Ban'}
    </button>
  );
}

/* ── Stats ────────────────────────────────────────────────── */

function fmtAttention(v: number): string {
  if (v >= 3600) return `${Math.floor(v / 3600)}h ${Math.round((v % 3600) / 60)}m`;
  return `${Math.max(1, Math.round(v / 60))}m`;
}

function StatsTab({ stats, attention }: { stats: BusinessStats; attention?: { section: string; seconds: number }[] }) {
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
      {stats.paymentsCount > 0 && (
        <div className="border border-white/8 bg-graphite-800/40 p-4">
          <h2 className="label mb-3">💶 Revenue</h2>
          <p className="text-sm text-muted">
            <span className="font-display text-2xl text-ink">€{stats.revenue7.toFixed(0)}</span> this week ·{' '}
            <span className="font-display text-2xl text-ink">€{stats.revenue30.toFixed(0)}</span> this month
          </p>
          <p className="mt-2 text-[11px] text-faint">Net after costs & shares: 💰 Money in the bot chat</p>
        </div>
      )}
      {!!attention?.length && (
        <div className="border border-white/8 bg-graphite-800/40 p-4">
          <h2 className="label mb-3">⏱ Attention by section · 7d</h2>
          <ul className="space-y-2">
            {attention.map((a) => {
              const max = attention[0].seconds || 1;
              return (
                <li key={a.section} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-muted">{a.section}</span>
                    <span className="shrink-0 font-mono text-xs">{fmtAttention(a.seconds)}</span>
                  </div>
                  <div className="mt-1 h-1 w-full bg-white/5">
                    <div className="h-1 bg-bmw" style={{ width: `${Math.max(4, (a.seconds / max) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
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


// ── Money: full per-job accounting ──
// paid − costs = net; share % of net is owed to the partner; rest is yours.
function payShare(p: PaymentRow): number {
  return Math.round((Number(p.amount || 0) - Number(p.cost || 0)) * Number(p.share_pct || 0)) / 100;
}
function payNet(p: PaymentRow): number {
  return Number(p.amount || 0) - Number(p.cost || 0);
}

function MoneyTab({ payments, busy, act }: { payments: PaymentRow[]; busy: boolean; act: Act }) {
  const [form, setForm] = useState({ client: '', amount: '', service: '', cost: '', share: '25', shareName: '' });
  const since30 = Date.now() - 30 * 86400000;
  const month = payments.filter((p) => new Date(p.created_at).getTime() >= since30);
  const sum = (f: (p: PaymentRow) => number, list: PaymentRow[]) => list.reduce((a, p) => a + f(p), 0);
  const gross = sum((p) => Number(p.amount || 0), month);
  const costs = sum((p) => Number(p.cost || 0), month);
  const shares = sum(payShare, month);
  const owed = new Map<string, number>();
  for (const p of month) {
    const sh = payShare(p);
    if (sh > 0) owed.set((p.share_name || 'partner').trim(), (owed.get((p.share_name || 'partner').trim()) ?? 0) + sh);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {([
          [`€${gross.toFixed(0)}`, 'Received · 30d'],
          [`€${costs.toFixed(0)}`, 'Costs · 30d'],
          [`€${(gross - costs).toFixed(0)}`, 'Net profit · 30d'],
          [`€${shares.toFixed(2)}`, 'To pay out · 30d'],
        ] as const).map(([n, label]) => (
          <div key={label} className="border border-white/8 bg-graphite-800/40 p-4 text-center">
            <div className="font-display text-2xl">{n}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
          </div>
        ))}
      </div>

      {owed.size > 0 && (
        <div className="border border-white/8 bg-graphite-800/40 p-4">
          <h2 className="label mb-2">🤝 Owed this month</h2>
          {[...owed].map(([k, v]) => (
            <p key={k} className="text-sm text-muted">{k}: <span className="text-ink">€{v.toFixed(2)}</span></p>
          ))}
        </div>
      )}

      <form
        className="space-y-2 border border-white/8 bg-graphite-800/40 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const amount = parseFloat(form.amount.replace(',', '.'));
          if (!amount) return;
          void act({
            action: 'addPayment',
            amount,
            client: form.client,
            service: form.service,
            cost: parseFloat(form.cost.replace(',', '.')) || 0,
            share_pct: parseFloat(form.share) || 0,
            share_name: form.shareName,
          });
          setForm({ client: '', amount: '', service: '', cost: '', share: '25', shareName: '' });
        }}
      >
        <h2 className="label mb-1">＋ Log a job</h2>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Client" className="border border-white/10 bg-graphite-900 px-3 py-2.5 text-sm outline-none focus:border-bmw" />
          <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Paid €" inputMode="decimal" className="border border-white/10 bg-graphite-900 px-3 py-2.5 text-sm outline-none focus:border-bmw" />
          <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Service" className="border border-white/10 bg-graphite-900 px-3 py-2.5 text-sm outline-none focus:border-bmw" />
          <input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="Costs € (FSC, parts)" inputMode="decimal" className="border border-white/10 bg-graphite-900 px-3 py-2.5 text-sm outline-none focus:border-bmw" />
          <input value={form.share} onChange={(e) => setForm({ ...form, share: e.target.value })} placeholder="Share %" inputMode="numeric" className="border border-white/10 bg-graphite-900 px-3 py-2.5 text-sm outline-none focus:border-bmw" />
          <input value={form.shareName} onChange={(e) => setForm({ ...form, shareName: e.target.value })} placeholder="Share to (name)" className="border border-white/10 bg-graphite-900 px-3 py-2.5 text-sm outline-none focus:border-bmw" />
        </div>
        <button type="submit" disabled={busy} className="w-full border border-bmw bg-bmw/15 px-4 py-3 font-mono text-[11px] uppercase tracking-widest active:scale-95 disabled:opacity-50">
          Save job
        </button>
      </form>

      <div className="space-y-2">
        {payments.map((p) => {
          const share = payShare(p);
          const net = payNet(p);
          const d = new Date(p.created_at).toLocaleDateString('en-IE', { day: '2-digit', month: 'short' });
          return (
            <div key={p.id} className="border border-white/8 bg-graphite-800/40 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-ink">{p.client || '—'}{p.service ? ` · ${p.service}` : ''}</span>
                <span className="shrink-0 font-mono text-[10px] text-faint">{d}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
                <span className="text-ink">💶 €{Number(p.amount).toFixed(0)}</span>
                {Number(p.cost || 0) > 0 && <span className="text-faint">− €{Number(p.cost).toFixed(0)} costs</span>}
                <span className="text-emerald-400/90">net €{net.toFixed(2)}</span>
                {share > 0 && <span className="text-amber-400/90">🤝 €{share.toFixed(2)}{p.share_name ? ` → ${p.share_name}` : ''}</span>}
                {share > 0 && <span className="text-bmw">yours €{(net - share).toFixed(2)}</span>}
                <button
                  onClick={() => { if (window.confirm('Delete this payment?')) void act({ action: 'delPayment', id: p.id }, 'warning'); }}
                  className="ml-auto text-m-red/80 active:scale-95"
                  aria-label="Delete payment"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {!payments.length && <p className="py-8 text-center text-sm text-faint">No payments yet — log the first job above.</p>}
      </div>
    </div>
  );
}
