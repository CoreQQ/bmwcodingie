'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { waHref, waMessageFor } from '@/lib/waMessage';

/**
 * Always-there WhatsApp button for desktop. On phones the bottom action bar
 * carries WhatsApp instead, so this one stays out of the way there.
 */
export function WhatsAppFloat({ whatsapp }: { whatsapp: string }) {
  const path = usePathname() || '/';
  return (
    <a
      href={waHref(whatsapp, waMessageFor(path))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp us"
      className="fixed bottom-6 right-6 z-50 hidden h-14 items-center gap-2 bg-[#25D366] px-5 font-mono text-xs font-semibold uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-[#1ebe5b] md:inline-flex"
    >
      <MessageCircle size={18} /> WhatsApp us
    </a>
  );
}
