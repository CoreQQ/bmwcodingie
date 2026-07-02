import Link from 'next/link';
import { Wrench, Images, Inbox, FileText, ArrowRight, TrendingUp, CalendarDays } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card } from '@/components/admin/ui';
import {
  adminGetServices,
  adminGetGallery,
  adminGetBookings,
  adminGetCategories,
} from '@/lib/admin-data';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getBusinessStats, type BusinessStats } from '@/lib/stats';

export default async function AdminDashboard() {
  const sb = getSupabaseAdmin();
  const [services, gallery, bookings, categories, biz] = await Promise.all([
    adminGetServices(),
    adminGetGallery(),
    adminGetBookings(),
    adminGetCategories(),
    sb ? getBusinessStats(sb) : Promise.resolve(null as BusinessStats | null),
  ]);

  const newBookings = bookings.filter((b) => !b.handled).length;

  const stats = [
    { label: 'Services', value: services.length, href: '/admin/services', icon: Wrench },
    { label: 'Categories', value: categories.length, href: '/admin/categories', icon: FileText },
    { label: 'Gallery photos', value: gallery.length, href: '/admin/gallery', icon: Images },
    { label: 'New bookings', value: newBookings, href: '/admin/bookings', icon: Inbox },
  ];

  return (
    <AdminShell>
      <PageHeading title="Dashboard" sub="Manage everything that appears on bmwcoding.ie." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="h-full p-5 transition-colors hover:border-bmw/50">
                <Icon size={18} className="text-bmw" />
                <div className="mt-3 font-display text-4xl text-ink">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-faint">{s.label}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      {biz && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
              <TrendingUp size={16} className="text-bmw" /> Enquiries
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-display text-3xl text-ink">{biz.last7}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-faint">Last 7 days</div>
              </div>
              <div>
                <div className="font-display text-3xl text-ink">{biz.last30}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-faint">Last 30 days</div>
              </div>
              <div>
                <div className="font-display text-3xl text-ink">{biz.total}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-faint">All time</div>
              </div>
            </div>
            {biz.topServices.length > 0 && (
              <div className="mt-5 border-t border-white/5 pt-4">
                <h3 className="mb-2 text-[11px] uppercase tracking-wide text-faint">Most requested</h3>
                <ul className="space-y-1.5">
                  {biz.topServices.map((t) => (
                    <li key={t.service} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-muted">{t.service}</span>
                      <span className="font-mono text-xs text-ink">{t.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
              <CalendarDays size={16} className="text-bmw" /> Upcoming confirmed
              <span className="ml-auto font-mono text-xs text-faint">
                {biz.confirmedUpcoming} confirmed · {biz.pending} pending
              </span>
            </h2>
            {biz.nextBookings.length === 0 ? (
              <p className="text-sm text-muted">No confirmed slots coming up.</p>
            ) : (
              <ul className="space-y-2">
                {biz.nextBookings.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-white/5 pb-2 text-sm">
                    <span className="font-mono text-xs text-bmw">{b.slot_date} · {b.slot_time}</span>
                    <span className="text-ink">{b.name}</span>
                    {b.service && <span className="text-xs text-faint">{b.service}</span>}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/schedule" className="mt-4 inline-flex items-center gap-1.5 text-sm text-bmw hover:underline">
              Open schedule <ArrowRight size={14} />
            </Link>
          </Card>
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <QuickLink href="/admin/services" title="Edit services & prices" desc="Add, reorder, hide or re-price coding services." />
        <QuickLink href="/admin/gallery" title="Upload work photos" desc="Add before/after and iDrive screens to the gallery." />
        <QuickLink href="/admin/content" title="Hero, about & contacts" desc="Edit headline, blurbs and your phone / WhatsApp / Telegram." />
        <QuickLink href="/admin/bookings" title="Review enquiries" desc="See booking requests from the contact form." />
      </div>
    </AdminShell>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="flex items-center justify-between gap-4 p-5 transition-colors hover:border-bmw/50">
        <div>
          <div className="font-medium text-ink">{title}</div>
          <div className="mt-1 text-sm text-muted">{desc}</div>
        </div>
        <ArrowRight size={18} className="shrink-0 text-faint" />
      </Card>
    </Link>
  );
}
