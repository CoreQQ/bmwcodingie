'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wrench,
  FolderTree,
  Images,
  FileText,
  Inbox,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { logout } from '@/app/admin/actions';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Services', icon: Wrench },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/gallery', label: 'Gallery', icon: Images },
  { href: '/admin/content', label: 'Content & Contacts', icon: FileText },
  { href: '/admin/bookings', label: 'Bookings', icon: Inbox },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href));
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
              active ? 'bg-bmw/15 text-ink' : 'text-muted hover:bg-white/5 hover:text-ink'
            }`}
          >
            <Icon size={17} className={active ? 'text-bmw' : ''} />
            {l.label}
          </Link>
        );
      })}

      <div className="my-3 h-px bg-white/8" />

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-ink"
      >
        <ExternalLink size={17} /> View site
      </a>
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <LogOut size={17} /> Log out
        </button>
      </form>
    </nav>
  );
}
