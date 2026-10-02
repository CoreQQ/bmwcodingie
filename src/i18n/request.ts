import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import en from '../../messages/en.json';

type Messages = Record<string, unknown>;

/**
 * English underneath every locale: a key that has not been translated yet
 * shows the English text instead of crashing the page. New sections can ship
 * in English first and be translated after.
 */
function withFallback(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = base[k];
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) && b && typeof b === 'object' && !Array.isArray(b)
        ? withFallback(b as Messages, v as Messages)
        : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const own = (await import(`../../messages/${locale}.json`)).default as Messages;

  return {
    locale,
    messages: locale === routing.defaultLocale ? own : withFallback(en as Messages, own),
  };
});
