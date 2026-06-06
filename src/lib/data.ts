import { getSupabase } from './supabase';
import { DEFAULT_CATALOG, DEFAULT_SETTINGS } from './defaults';
import type {
  Category,
  CategoryWithServices,
  GalleryItem,
  Service,
  SiteSettings,
} from './types';

// All reads degrade gracefully: if Supabase is not configured or a query
// fails, the site falls back to the bundled defaults so it never looks broken.

export async function getCatalog(): Promise<CategoryWithServices[]> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_CATALOG;

  try {
    const [{ data: cats, error: cErr }, { data: svcs, error: sErr }] = await Promise.all([
      sb.from('categories').select('*').order('sort_order', { ascending: true }),
      sb
        .from('services')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (cErr || sErr || !cats) return DEFAULT_CATALOG;

    const categories = cats as Category[];
    const services = (svcs ?? []) as Service[];

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
}

export async function getGallery(): Promise<GalleryItem[]> {
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
}

export async function getSettings(): Promise<SiteSettings> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_SETTINGS;

  try {
    const { data, error } = await sb
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error || !data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(data as Partial<SiteSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Build a clean wa.me link from a stored number. */
export function waLink(whatsapp: string, text?: string): string {
  const digits = whatsapp.replace(/[^\d]/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}
