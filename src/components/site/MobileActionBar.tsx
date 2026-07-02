'use client';

import { useEffect, useState } from 'react';
import { Phone, MessageCircle, CalendarCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// App-style sticky action bar for phones: Book / WhatsApp / Call always within
// thumb reach. Slides in after the hero (its own CTAs come first) and slides
// away while the booking form is on screen.
export function MobileActionBar({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const tC = useTranslations('Contact');
  const tH = useTranslations('Header');
  const [show, setShow] = useState(false);

  useEffect(() => {
    let pastHero = false;
    let contactVisible = false;
    const update = () => setShow(pastHero && !contactVisible);

    const onScroll = () => {
      const next = window.scrollY > 480;
      if (next !== pastHero) {
        pastHero = next;
        update();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const contact = document.getElementById('contact');
    let io: IntersectionObserver | undefined;
    if (contact) {
      io = new IntersectionObserver(
        ([e]) => {
          contactVisible = e.isIntersecting;
          update();
        },
        { threshold: 0.15 },
      );
      io.observe(contact);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, []);

  const digits = whatsapp.replace(/[^\d]/g, '');
  const wa = digits ? `https://wa.me/${digits}?text=${encodeURIComponent('Hi — I have a BMW and I need coding.')}` : '#';

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="m-stripe h-[2px] w-full" />
      <div
        className="grid grid-cols-3 gap-px border-t border-white/5 bg-graphite-900/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="flex items-center justify-center gap-2 py-3.5 font-mono text-[11px] uppercase tracking-wider text-muted active:bg-white/5"
        >
          <Phone size={15} className="text-bmw" /> {tC('call')}
        </a>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 font-mono text-[11px] uppercase tracking-wider text-muted active:bg-white/5"
        >
          <MessageCircle size={15} className="text-bmw" /> {tC('whatsapp')}
        </a>
        <Link
          href="/#contact"
          className="flex items-center justify-center gap-2 bg-bmw py-3.5 font-mono text-[11px] uppercase tracking-wider text-white active:bg-bmw-dark"
        >
          <CalendarCheck size={15} /> {tH('bookNow')}
        </Link>
      </div>
    </div>
  );
}
