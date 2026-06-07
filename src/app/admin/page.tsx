import Link from 'next/link';
import { Wrench, Images, Inbox, FileText, ArrowRight } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card } from '@/components/admin/ui';
import {
  adminGetServices,
  adminGetGallery,
  adminGetBookings,
  adminGetCategories,
} from '@/lib/admin-data';

export default async function AdminDashboard() {
  const [services, gallery, bookings, categories] = await Promise.all([
    adminGetServices(),
    adminGetGallery(),
    adminGetBookings(),
    adminGetCategories(),
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
