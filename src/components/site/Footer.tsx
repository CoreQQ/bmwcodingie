import { Instagram, Send, MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { SiteSettings } from '@/lib/types';
import { waLink } from '@/lib/data';
import { Link } from '@/i18n/navigation';
import { SERVICE_NAV } from '@/lib/servicePages';
import { LOCATION_NAV } from '@/lib/locationPages';
import { CHASSIS_NAV } from '@/lib/chassisPages';
import { Logo } from './Logo';

export async function Footer({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations('Footer');
  const year = new Date().getFullYear();
  const tg = settings.telegram.replace(/^@/, '');
  const ig = settings.instagram.replace(/^@/, '');

  return (
    <footer className="relative border-t border-white/8 pt-16">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid grid-cols-12 gap-y-10 pb-14">
          <div className="col-span-12 md:col-span-5">
            <Logo className="h-24 w-auto" />
            <p className="mt-4 max-w-sm text-sm text-muted">{t('pitch')}</p>
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
            <h4 className="label mb-4">{t('contactHeading')}</h4>
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
              <li>
                <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  {t('whatsappLine', { number: settings.whatsapp })}
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="label mb-4">{t('hoursHeading')}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>{t('hours1')}</li>
              <li>{t('hours2')}</li>
              <li>{t('hours3')}</li>
            </ul>
          </div>

          <div className="col-span-12 md:col-span-2">
            <h4 className="label mb-4">{t('navigateHeading')}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#services" className="hover:text-ink">{t('navServices')}</a></li>
              <li><a href="#process" className="hover:text-ink">{t('navHowItWorks')}</a></li>
              <li><a href="#work" className="hover:text-ink">{t('navWork')}</a></li>
              <li><a href="#about" className="hover:text-ink">{t('navAbout')}</a></li>
              <li><a href="#contact" className="hover:text-ink">{t('navBook')}</a></li>
            </ul>
          </div>
        </div>

        {/* SEO internal links — collapsible on phones, always open on md+ */}
        <LinkBlock title="BMW Coding Services" cols="sm:grid-cols-3 lg:grid-cols-4">
          <li>
            <Link href="/bmw-coding-price-calculator" className="text-bmw transition-colors hover:text-ink">
              Price calculator
            </Link>
          </li>
          {SERVICE_NAV.map((s) => (
            <li key={s.slug}>
              <Link href={`/${s.slug}`} className="transition-colors hover:text-ink">
                {s.label}
              </Link>
            </li>
          ))}
        </LinkBlock>

        <LinkBlock title="BMW Coding by Area" cols="sm:grid-cols-3 lg:grid-cols-6">
          <li>
            <Link href="/bmw-coding-dublin" className="transition-colors hover:text-ink">
              Dublin
            </Link>
          </li>
          {LOCATION_NAV.map((s) => (
            <li key={s.slug}>
              <Link href={`/${s.slug}`} className="transition-colors hover:text-ink">
                {s.label}
              </Link>
            </li>
          ))}
        </LinkBlock>

        <LinkBlock title="BMW Coding by Model" cols="sm:grid-cols-3 lg:grid-cols-4">
          {CHASSIS_NAV.map((s) => (
            <li key={s.slug}>
              <Link href={`/${s.slug}`} className="transition-colors hover:text-ink">
                {s.label}
              </Link>
            </li>
          ))}
        </LinkBlock>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/8 py-6 text-xs text-faint md:flex-row md:items-center">
          <span>{t('copyright', { year })}</span>
          <span className="font-mono">{t('trademark')}</span>
        </div>
      </div>
      <div className="m-stripe h-1 w-full" />
    </footer>
  );
}

/**
 * Footer link block: plain grid on md+, a <details> accordion on phones so
 * three SEO blocks don't take two screens of scrolling. Links stay in the
 * HTML either way, so crawlers see them on every viewport.
 */
function LinkBlock({
  title,
  cols,
  children,
}: {
  title: string;
  cols: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-white/8">
      {/* md+: always visible */}
      <div className="hidden py-8 md:block">
        <h3 className="label mb-4">{title}</h3>
        <ul className={`grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-muted ${cols}`}>{children}</ul>
      </div>
      {/* phones: collapsible */}
      <details className="group py-4 md:hidden">
        <summary className="label flex cursor-pointer list-none items-center justify-between py-2 [&::-webkit-details-marker]:hidden">
          {title}
          <span className="text-faint transition-transform duration-200 group-open:rotate-45">+</span>
        </summary>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 pb-3 pt-2 text-sm text-muted">{children}</ul>
      </details>
    </div>
  );
}
