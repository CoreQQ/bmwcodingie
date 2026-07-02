import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CalendarCheck, Clock3, XCircle, CircleSlash, MessageCircle, Phone, Wrench, Car } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/site/Logo';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSettings, waLink } from '@/lib/data';
import type { Booking } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Private tracking link — keep it out of search engines.
export const metadata: Metadata = {
  title: 'Booking status',
  robots: { index: false, follow: false },
};

const STATUS_UI: Record<string, { icon: typeof CalendarCheck; cls: string; title: string; body: string }> = {
  pending: {
    icon: Clock3,
    cls: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    title: 'Awaiting confirmation',
    body: 'We’ve received your request and will confirm this slot by message shortly.',
  },
  confirmed: {
    icon: CalendarCheck,
    cls: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    title: 'Confirmed — see you there',
    body: 'Your slot is locked in. If anything changes, just message us.',
  },
  declined: {
    icon: XCircle,
    cls: 'text-red-400 border-red-400/30 bg-red-400/5',
    title: 'Slot unavailable',
    body: 'That time is no longer free — message us and we’ll find one that suits.',
  },
  cancelled: {
    icon: CircleSlash,
    cls: 'text-muted border-white/10 bg-white/5',
    title: 'Cancelled',
    body: 'This booking was cancelled. Want to rebook? We’re one message away.',
  },
};

function fmtDay(date: string | null): string {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export default async function BookingStatus({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const sb = getSupabaseAdmin();
  if (!sb) notFound();

  const { data } = await sb.from('bookings').select('*').eq('public_token', token).single();
  const b = data as Booking | null;
  if (!b) notFound();

  const settings = await getSettings();
  const ui = STATUS_UI[b.status] ?? STATUS_UI.pending;
  const Icon = ui.icon;
  const wa = waLink(settings.whatsapp, `Hi — it's ${b.name}, about my booking. `);

  return (
    <div className="grain relative flex min-h-screen flex-col items-center px-5 py-10">
      <div className="blueprint absolute inset-0 -z-10 opacity-40" />
      <div className="absolute inset-0 -z-10 hero-glow" />

      <Link href="/" className="mb-10">
        <Logo className="h-16 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className={`border p-6 text-center ${ui.cls}`}>
          <Icon size={40} className="mx-auto" />
          <h1 className="mt-4 font-display text-3xl text-ink">{ui.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{ui.body}</p>
        </div>

        <div className="mt-4 border border-white/10 bg-graphite-800">
          <div className="m-stripe h-1 w-full" />
          <div className="divide-y divide-white/5">
            {b.slot_date && (
              <Row icon={CalendarCheck} k="Slot" v={`${fmtDay(b.slot_date)}${b.slot_time ? ` · ${b.slot_time}` : ''}`} />
            )}
            {b.service && <Row icon={Wrench} k="Service" v={b.service} />}
            {b.bmw_model && <Row icon={Car} k="Car" v={b.bmw_model} />}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
            <MessageCircle size={15} /> WhatsApp
          </a>
          <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="btn-ghost justify-center">
            <Phone size={15} /> Call us
          </a>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-faint">
          BMW Coding · Dublin & Ireland
        </p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, k, v }: { icon: typeof CalendarCheck; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon size={15} className="shrink-0 text-bmw" />
      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{k}</span>
      <span className="ml-auto text-right text-sm text-ink">{v}</span>
    </div>
  );
}
