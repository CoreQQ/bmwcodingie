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
});

export type Locale = (typeof routing.locales)[number];
