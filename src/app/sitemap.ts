import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const PATHS = [
  { path: '', priority: 1 },
  { path: '/models', priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://bmwcoding.ie';

  function localeUrl(locale: string, path: string) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    return `${base}${prefix}${path}`;
  }

  return PATHS.flatMap(({ path, priority }) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, localeUrl(l, path)]),
        ),
      },
    })),
  );
}
