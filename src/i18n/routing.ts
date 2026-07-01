import { defineRouting } from 'next-intl/routing';

export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  pl: 'Polski',
  lt: 'Lietuvių',
  ro: 'Română',
};

export const routing = defineRouting({
  locales: ['en', 'ru', 'uk', 'pl', 'lt', 'ro'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // Don't auto-redirect / set a locale cookie per request — that Set-Cookie
  // makes every response uncacheable at the edge (slow TTFB). The language
  // switcher still works via the URL prefix.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
