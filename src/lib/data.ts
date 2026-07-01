import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { getSupabase } from './supabase';
import { DEFAULT_CATALOG, DEFAULT_SETTINGS } from './defaults';
import type {
  CarModel,
  Category,
  CategoryWithServices,
  GalleryItem,
  ModelCompatibility,
  Review,
  Service,
  SiteSettings,
} from './types';

const DEFAULT_LOCALE = 'en';

/** Overlay a locale's translation object onto a base record, skipping empty values. */
function withTranslation<T extends { translations?: Record<string, Record<string, unknown>> }>(
  item: T,
  locale: string,
): T {
  if (locale === DEFAULT_LOCALE) return item;
  const override = item.translations?.[locale];
  if (!override) return item;
  const merged = { ...item } as T;
  for (const [key, value] of Object.entries(override)) {
    if (value) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

// All reads degrade gracefully: if Supabase is not configured or a query
// fails, the site falls back to the bundled defaults so it never looks broken.
// cache() deduplicates calls within the same request (e.g. layout + page both
// calling getSettings no longer results in two Supabase round-trips).

export const getCatalog = cache(async (): Promise<CategoryWithServices[]> => {
  const sb = getSupabase();
  if (!sb) return DEFAULT_CATALOG;

  try {
    const [{ data: cats, error: cErr }, { data: svcs, error: sErr }, locale] = await Promise.all([
      sb.from('categories').select('*').order('sort_order', { ascending: true }),
      sb
        .from('services')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true }),
      getLocale(),
    ]);

    if (cErr || sErr || !cats) return DEFAULT_CATALOG;

    const categories = (cats as Category[]).map((c) => withTranslation(c, locale));
    const services = ((svcs ?? []) as Service[]).map((s) => withTranslation(s, locale));

    const grouped: CategoryWithServices[] = categories
      .map((c) => ({
        ...c,
        services: services.filter((s) => s.category_id === c.id),
      }))
      .filter((c) => c.services.length > 0);

    return grouped.length > 0 ? grouped : DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
});

export const getGallery = cache(async (): Promise<GalleryItem[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('gallery')
      .select('*')
      .eq('visible', true)
      .order('sort_order', { ascending: true });
    if (error || !data) return [];
    return data as GalleryItem[];
  } catch {
    return [];
  }
});

export const getReviews = cache(async (): Promise<Review[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('reviews')
      .select('*')
      .eq('visible', true)
      .order('sort_order', { ascending: true });
    if (error || !data) return [];
    return data as Review[];
  } catch {
    return [];
  }
});

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const sb = getSupabase();
  if (!sb) return DEFAULT_SETTINGS;

  try {
    const [{ data, error }, locale] = await Promise.all([
      sb.from('site_settings').select('*').eq('id', 1).single(),
      getLocale(),
    ]);
    if (error || !data) return DEFAULT_SETTINGS;
    const merged: SiteSettings = { ...DEFAULT_SETTINGS, ...(data as Partial<SiteSettings>) };
    return withTranslation(merged, locale);
  } catch {
    return DEFAULT_SETTINGS;
  }
});

export const getCarModels = cache(async (): Promise<CarModel[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb.from('car_models').select('*').order('sort_order');
    if (error || !data) return [];
    return data as CarModel[];
  } catch {
    return [];
  }
});

export const getCompatibility = cache(async (): Promise<ModelCompatibility[]> => {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb.from('model_compatibility').select('*');
    if (error || !data) return [];
    return data as ModelCompatibility[];
  } catch {
    return [];
  }
});

/** Build a clean wa.me link from a stored number. Returns '#' if number is empty. */
export function waLink(whatsapp: string, text?: string): string {
  const digits = whatsapp.replace(/[^\d]/g, '');
  if (!digits) return '#';
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}
