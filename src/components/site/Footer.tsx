import { Instagram, Send, MessageCircle } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { waLink } from '@/lib/data';

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const tg = settings.telegram.replace(/^@/, '');
  const ig = settings.instagram.replace(/^@/, '');

  return (
    <footer className="relative border-t border-white/8 pt-16">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid grid-cols-12 gap-y-10 pb-14">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="m-stripe-v h-8 w-1.5" />
              <span className="font-display text-3xl tracking-wide text-ink">BMW CODING IE</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted">
              Independent BMW coding, diagnostics and retrofits across Dublin and Ireland — in
              person or remotely over ENET.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={`https://instagram.com/${ig}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center border border-white/10 text-muted transition-colors hover:border-bmw hover:text-ink"
              >
                <Instagram size={18} />
              </a>
              <a
                href={`https://t.me/${tg}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="flex h-10 w-10 items-center justify-center border border-white/10 text-muted transition-colors hover:border-bmw hover:text-ink"
              >
                <Send size={18} />
              </a>
              <a
                href={waLink(settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center border border-white/10 text-muted transition-colors hover:border-bmw hover:text-ink"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div className="col-span-6 md:col-span-3">
            <h4 className="label mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="hover:text-ink">
                  {settings.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="hover:text-ink">
                  {settings.email}
                </a>
              </li>
              <li>WhatsApp {settings.whatsapp}</li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="label mb-4">Hours</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>Mon–Fri · 09:00–19:00</li>
              <li>Sat · 10:00–16:00</li>
              <li>Sun · By appointment</li>
            </ul>
          </div>

          <div className="col-span-12 md:col-span-2">
            <h4 className="label mb-4">Navigate</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#services" className="hover:text-ink">Services</a></li>
              <li><a href="#work" className="hover:text-ink">Work</a></li>
              <li><a href="#process" className="hover:text-ink">How it works</a></li>
              <li><a href="#contact" className="hover:text-ink">Book</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/8 py-6 text-xs text-faint md:flex-row md:items-center">
          <span>© {year} BMW Coding IE · Dublin, Ireland</span>
          <span className="font-mono">
            Not affiliated with or endorsed by BMW AG. BMW is a trademark of its owner.
          </span>
        </div>
      </div>
      <div className="m-stripe m-stripe-anim h-1 w-full" />
    </footer>
  );
}
