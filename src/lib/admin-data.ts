import { getSupabaseAdmin } from './supabase';
import type { Booking, Category, GalleryItem, Service, SiteSettings } from './types';
import { DEFAULT_SETTINGS } from './defaults';

export async function adminGetCategories(): Promise<Category[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb.from('categories').select('*').order('sort_order');
  return (data ?? []) as Category[];
}

export async function adminGetServices(): Promise<Service[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from('services')
    .select('*')
    .order('category_id')
    .order('sort_order');
  return (data ?? []) as Service[];
}

export async function adminGetGallery(): Promise<GalleryItem[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb.from('gallery').select('*').order('sort_order');
  return (data ?? []) as GalleryItem[];
}

export async function adminGetBookings(): Promise<Booking[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as Booking[];
}

export async function adminGetSettings(): Promise<SiteSettings> {
  const sb = getSupabaseAdmin();
  if (!sb) return DEFAULT_SETTINGS;
  const { data } = await sb.from('site_settings').select('*').eq('id', 1).single();
  return { ...DEFAULT_SETTINGS, ...(data as Partial<SiteSettings> | null) };
}
