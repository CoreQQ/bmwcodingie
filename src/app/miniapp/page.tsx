'use client';

import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';
import {
  CalendarDays,
  Check,
  X,
  Trash2,
  Ban,
  Phone,
  TrendingUp,
  RefreshCw,
  LockOpen,
} from 'lucide-react';
import type { Booking } from '@/lib/types';
import type { BusinessStats } from '@/lib/stats';

type Overview = {
  schedule: { day: string; bookings: Booking[] }[];
  blocked: string[];
  stats: BusinessStats;
};

type TgWebApp = {
  initData: string;
  platform?: string;
  version?: string;
  ready: () => void;
  expand: () => void;
  HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (t: string) => void };
};

// Fallbacks for clients where telegram-web-app.js hasn't populated initData:
// the raw payload lives in the URL fragment (#tgWebAppData=...) and, on
// reloads, in sessionStorage under __telegram__initParams.
function recoverInitData(): string {
  try {
    const hash = window.location.hash.slice(1);
    const fromHash = new URLSearchParams(hash).get('tgWebAppData');
    if (fromHash) return fromHash;
    const stored = sessionStorage.getItem('__telegram__initParams');
    if (stored) {
      const parsed = JSON.parse(stored) as { tgWebAppData?: string };
      if (parsed.tgWebAppData) return parsed.tgWebAppData;
    }
  } catch {
    /* ignore */
  }
  return '';
}

const getTg = (): TgWebApp | undefined =>
  (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;

function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });
}

const STATUS_DOT: Record<string, string> = {
  confirmed: 'bg-emerald-400',
  pending: 'bg-amber-400',
};

export default function MiniApp() {
  const [tab, setTab] = useState<'today' | 'schedule' | 'stats'>('today');
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

  // Wait for the Telegram script, then authenticate and load.
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

  async function act(payload: Record<string, unknown>, haptic: 'success' | 'warning' = 'success') {
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
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-graphite-900 pb-24 text-ink">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />

      {/* Header */}
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
        {/* Tabs */}
        <div className="grid grid-cols-3 border-t border-white/5">
          {(
            [
              ['today', 'Today'],
              ['schedule', 'Schedule'],
              ['stats', 'Stats'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                getTg()?.HapticFeedback?.impactOccurred('light');
              }}
              className={`py-3 font-mono text-[11px] uppercase tracking-widest ${
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
            <p className="text-sm text-muted">
              Open this app from the bot&apos;s menu button in Telegram.
            </p>
            <p className="mt-2 text-xs text-faint">
              Tip: the menu-button URL must start with <span className="text-muted">https://www.</span>
            </p>
            {debugInfo && <p className="mt-4 font-mono text-[10px] text-faint">{debugInfo}</p>}
          </div>
        )}
        {state === 'error' && (
          <p className="py-16 text-center text-sm text-muted">Couldn&apos;t load — pull the refresh button.</p>
        )}

        {state === 'ready' && data && tab === 'today' && (
          <TodayTab data={data} todayKey={todayKey} busy={busy} act={act} />
        )}
        {state === 'ready' && data && tab === 'schedule' && (
          <ScheduleTab data={data} busy={busy} act={act} />
        )}
        {state === 'ready' && data && tab === 'stats' && <StatsTab stats={data.stats} />}
      </div>
    </div>
  );
}

function BookingCard({
  b,
  busy,
  act,
}: {
  b: Booking;
  busy: boolean;
  act: (p: Record<string, unknown>, h?: 'success' | 'warning') => Promise<void>;
}) {
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
      <div className="mt-3 grid grid-cols-3 gap-2">
        {b.status === 'pending' && (
          <>
            <button
              disabled={busy}
              onClick={() => void act({ action: 'setStatus', id: b.id, status: 'confirmed' })}
              className="flex items-center justify-center gap-1.5 bg-bmw py-2 font-mono text-[10px] uppercase tracking-wider text-white active:scale-95 disabled:opacity-50"
            >
              <Check size={13} /> Confirm
            </button>
            <button
              disabled={busy}
              onClick={() => void act({ action: 'setStatus', id: b.id, status: 'declined' }, 'warning')}
              className="flex items-center justify-center gap-1.5 border border-white/10 py-2 font-mono text-[10px] uppercase tracking-wider text-muted active:scale-95 disabled:opacity-50"
            >
              <X size={13} /> Decline
            </button>
          </>
        )}
        {b.status === 'confirmed' && (
          <button
            disabled={busy}
            onClick={() => void act({ action: 'setStatus', id: b.id, status: 'cancelled' }, 'warning')}
            className="flex items-center justify-center gap-1.5 border border-white/10 py-2 font-mono text-[10px] uppercase tracking-wider text-muted active:scale-95 disabled:opacity-50"
          >
            <Trash2 size={13} /> Free slot
          </button>
        )}
      </div>
    </div>
  );
}

function TodayTab({
  data,
  todayKey,
  busy,
  act,
}: {
  data: Overview;
  todayKey: string;
  busy: boolean;
  act: (p: Record<string, unknown>, h?: 'success' | 'warning') => Promise<void>;
}) {
  const days = data.schedule.filter((d) => d.bookings.length > 0).slice(0, 5);
  const todays = data.schedule.find((d) => d.day === todayKey);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="label mb-2">Today · {dayLabel(todayKey)}</h2>
        {todays && todays.bookings.length > 0 ? (
          <div className="space-y-2">
            {todays.bookings.map((b) => (
              <BookingCard key={b.id} b={b} busy={busy} act={act} />
            ))}
          </div>
        ) : (
          <p className="border border-white/8 bg-graphite-800/40 p-4 text-sm text-muted">
            Nothing booked today.
          </p>
        )}
      </div>

      <div>
        <h2 className="label mb-2">Coming up</h2>
        <div className="space-y-2">
          {days
            .filter((d) => d.day !== todayKey)
            .flatMap((d) =>
              d.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-2.5 border border-white/8 bg-graphite-800/40 px-4 py-3 text-sm">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[b.status] ?? 'bg-faint'}`} />
                  <span className="font-mono text-xs text-bmw">{dayLabel(d.day)}</span>
                  <span className="font-mono text-xs text-faint">{b.slot_time}</span>
                  <span className="truncate">{b.name}</span>
                </div>
              )),
            )}
          {days.filter((d) => d.day !== todayKey).length === 0 && (
            <p className="border border-white/8 bg-graphite-800/40 p-4 text-sm text-muted">
              No upcoming bookings yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({
  data,
  busy,
  act,
}: {
  data: Overview;
  busy: boolean;
  act: (p: Record<string, unknown>, h?: 'success' | 'warning') => Promise<void>;
}) {
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
              {isBlocked && (
                <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] uppercase text-red-400">blocked</span>
              )}
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
                {bookings.map((b) => (
                  <BookingCard key={b.id} b={b} busy={busy} act={act} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatsTab({ stats }: { stats: BusinessStats }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            [stats.last7, '7 days'],
            [stats.last30, '30 days'],
            [stats.total, 'All time'],
          ] as const
        ).map(([n, label]) => (
          <div key={label} className="border border-white/8 bg-graphite-800/40 p-4 text-center">
            <div className="font-display text-3xl">{n}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
          </div>
        ))}
      </div>

      <div className="border border-white/8 bg-graphite-800/40 p-4">
        <h2 className="label mb-3 flex items-center gap-2">
          <TrendingUp size={13} className="text-bmw" /> Slots
        </h2>
        <p className="text-sm text-muted">
          ✅ {stats.confirmedUpcoming} confirmed upcoming · ⏳ {stats.pending} pending
        </p>
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
