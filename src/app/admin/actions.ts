'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, GALLERY_BUCKET } from '@/lib/supabase';
import { ADMIN_COOKIE, checkPassword, sessionToken } from '@/lib/auth';
import { notifyEvent } from '@/lib/telegram';

/** Best-effort client IP from the request headers (server action context). */
function requestIp(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function refreshSite() {
  // 'layout' cascades the revalidation to every route under the root layout,
  // which covers all localized homepages (/, /ru, /uk, …) and /models.
  revalidatePath('/', 'layout');
}

// ─────────────────────────── Auth ───────────────────────────

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) {
    await notifyEvent({
      emoji: '⚠️',
      title: 'Failed admin login attempt',
      rows: [['IP', requestIp()]],
      note: 'Wrong password entered on /admin/login.',
    });
    redirect('/admin/login?error=1');
  }
  const token = await sessionToken();
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
  await notifyEvent({ emoji: '🔐', title: 'Admin signed in', rows: [['IP', requestIp()]] });
  redirect('/admin');
}

export async function logout() {
  cookies().delete(ADMIN_COOKIE);
  redirect('/admin/login');
}

// ─────────────────────────── Services ───────────────────────────

export async function createService(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('services').insert({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    price_label: String(formData.get('price_label') ?? 'On request').trim(),
    category_id: numOrNull(formData.get('category_id')),
    mobile_available: formData.get('mobile_available') === 'on',
    visible: true,
    sort_order: Number(formData.get('sort_order') ?? 0) || 0,
  });
  revalidatePath('/admin/services');
  refreshSite();
}

export async function updateService(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const id = Number(formData.get('id'));
  await sb
    .from('services')
    .update({
      title: String(formData.get('title') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      price_label: String(formData.get('price_label') ?? 'On request').trim(),
      category_id: numOrNull(formData.get('category_id')),
      mobile_available: formData.get('mobile_available') === 'on',
      visible: formData.get('visible') === 'on',
      sort_order: Number(formData.get('sort_order') ?? 0) || 0,
    })
    .eq('id', id);
  revalidatePath('/admin/services');
  refreshSite();
}

export async function deleteService(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('services').delete().eq('id', Number(formData.get('id')));
  revalidatePath('/admin/services');
  refreshSite();
}

export async function updateServiceTranslation(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const id = Number(formData.get('id'));
  const locale = String(formData.get('locale') ?? '').trim();
  if (!locale) return;
  await mergeTranslation(sb, 'services', id, locale, {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    price_label: String(formData.get('price_label') ?? '').trim(),
  });
  revalidatePath('/admin/services');
  refreshSite();
}

// ─────────────────────────── Categories ───────────────────────────

export async function createCategory(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const name = String(formData.get('name') ?? '').trim();
  await sb.from('categories').insert({
    name,
    slug: slugify(String(formData.get('slug') ?? name)),
    sort_order: Number(formData.get('sort_order') ?? 0) || 0,
  });
  revalidatePath('/admin/categories');
  refreshSite();
}

export async function updateCategory(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from('categories')
    .update({
      name: String(formData.get('name') ?? '').trim(),
      sort_order: Number(formData.get('sort_order') ?? 0) || 0,
    })
    .eq('id', Number(formData.get('id')));
  revalidatePath('/admin/categories');
  refreshSite();
}

export async function deleteCategory(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('categories').delete().eq('id', Number(formData.get('id')));
  revalidatePath('/admin/categories');
  refreshSite();
}

export async function updateCategoryTranslation(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const id = Number(formData.get('id'));
  const locale = String(formData.get('locale') ?? '').trim();
  if (!locale) return;
  await mergeTranslation(sb, 'categories', id, locale, {
    name: String(formData.get('name') ?? '').trim(),
  });
  revalidatePath('/admin/categories');
  refreshSite();
}

// ─────────────────────────── Gallery ───────────────────────────

export async function uploadGalleryImage(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return;

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await sb.storage
    .from(GALLERY_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (upErr) {
    console.error('[gallery] upload failed:', upErr.message);
    return;
  }

  const { data } = sb.storage.from(GALLERY_BUCKET).getPublicUrl(path);

  const caption = String(formData.get('caption') ?? '').trim();
  await sb.from('gallery').insert({
    image_url: data.publicUrl,
    caption,
    visible: true,
    sort_order: Number(formData.get('sort_order') ?? 0) || 0,
  });

  await notifyEvent({
    emoji: '🖼',
    title: 'New gallery image uploaded',
    rows: [
      ['File', file.name || path],
      ['Size', `${Math.round(file.size / 1024)} KB`],
      ['Caption', caption || '—'],
    ],
  });

  revalidatePath('/admin/gallery');
  refreshSite();
}

export async function updateGalleryItem(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from('gallery')
    .update({
      caption: String(formData.get('caption') ?? '').trim(),
      sort_order: Number(formData.get('sort_order') ?? 0) || 0,
      visible: formData.get('visible') === 'on',
    })
    .eq('id', Number(formData.get('id')));
  revalidatePath('/admin/gallery');
  refreshSite();
}

export async function deleteGalleryItem(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const id = Number(formData.get('id'));
  const url = String(formData.get('image_url') ?? '');

  // Best-effort: remove the file from storage too.
  const marker = `/${GALLERY_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const objectPath = url.slice(idx + marker.length);
    await sb.storage.from(GALLERY_BUCKET).remove([objectPath]);
  }

  await sb.from('gallery').delete().eq('id', id);
  revalidatePath('/admin/gallery');
  refreshSite();
}

// ─────────────────────────── Settings / content ───────────────────────────

export async function updateSettings(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from('site_settings')
    .update({
      hero_title: String(formData.get('hero_title') ?? '').trim(),
      hero_subtitle: String(formData.get('hero_subtitle') ?? '').trim(),
      about_text: String(formData.get('about_text') ?? '').trim(),
      service_area: String(formData.get('service_area') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      whatsapp: String(formData.get('whatsapp') ?? '').trim(),
      telegram: String(formData.get('telegram') ?? '').trim(),
      instagram: String(formData.get('instagram') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
    })
    .eq('id', 1);
  revalidatePath('/admin/content');
  refreshSite();
}

export async function updateSettingsTranslation(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const locale = String(formData.get('locale') ?? '').trim();
  if (!locale) return;
  await mergeTranslation(sb, 'site_settings', 1, locale, {
    hero_subtitle: String(formData.get('hero_subtitle') ?? '').trim(),
    about_text: String(formData.get('about_text') ?? '').trim(),
    service_area: String(formData.get('service_area') ?? '').trim(),
  });
  revalidatePath('/admin/content');
  refreshSite();
}

// ─────────────────────────── Car models ───────────────────────────

export async function createCarModel(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) redirect('/admin/models?err=' + encodeURIComponent('Database is not configured.'));
  const { error } = await sb.from('car_models').insert({
    chassis_code: String(formData.get('chassis_code') ?? '').trim().toUpperCase(),
    label: String(formData.get('label') ?? '').trim(),
    year_from: Number(formData.get('year_from') ?? 0) || 0,
    year_to: numOrNull(formData.get('year_to')),
    sort_order: Number(formData.get('sort_order') ?? 0) || 0,
  });
  // Never fail silently: a swallowed error looks exactly like a saved model.
  if (error) redirect('/admin/models?err=' + encodeURIComponent(error.message));
  revalidatePath('/admin/models');
  refreshSite();
}

export async function updateCarModel(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from('car_models')
    .update({
      chassis_code: String(formData.get('chassis_code') ?? '').trim().toUpperCase(),
      label: String(formData.get('label') ?? '').trim(),
      year_from: Number(formData.get('year_from') ?? 0) || 0,
      year_to: numOrNull(formData.get('year_to')),
      sort_order: Number(formData.get('sort_order') ?? 0) || 0,
    })
    .eq('id', Number(formData.get('id')));
  if (error) redirect('/admin/models?err=' + encodeURIComponent(error.message));
  revalidatePath('/admin/models');
  refreshSite();
}

export async function deleteCarModel(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from('car_models').delete().eq('id', Number(formData.get('id')));
  if (error) redirect('/admin/models?err=' + encodeURIComponent(error.message));
  revalidatePath('/admin/models');
  refreshSite();
}

export async function saveCompatibility(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const modelId = Number(formData.get('model_id'));

  const rows: { model_id: number; service_id: number; status: string; note: string }[] = [];
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^status_(\d+)$/);
    if (!m) continue;
    const serviceId = Number(m[1]);
    rows.push({
      model_id: modelId,
      service_id: serviceId,
      status: String(value),
      note: String(formData.get(`note_${serviceId}`) ?? '').trim(),
    });
  }

  if (rows.length > 0) {
    await sb.from('model_compatibility').upsert(rows, { onConflict: 'model_id,service_id' });
  }
  revalidatePath(`/admin/models/${modelId}`);
  refreshSite();
}

// ─────────────────────────── Bookings ───────────────────────────

// ─────────────────────────── Schedule ───────────────────────────

export async function toggleBlockedDay(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const day = String(formData.get('day') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  if (formData.get('blocked') === 'true') {
    await sb.from('blocked_dates').delete().eq('day', day);
  } else {
    await sb.from('blocked_dates').upsert({ day });
  }
  revalidatePath('/admin/schedule');
}

// ─────────────────────────── Reviews ───────────────────────────

export async function createReview(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const rating = Math.max(1, Math.min(5, Number(formData.get('rating') ?? 5) || 5));
  await sb.from('reviews').insert({
    author: String(formData.get('author') ?? '').trim(),
    car: String(formData.get('car') ?? '').trim(),
    rating,
    body: String(formData.get('body') ?? '').trim(),
    visible: true,
    sort_order: Number(formData.get('sort_order') ?? 0) || 0,
  });
  revalidatePath('/admin/reviews');
  refreshSite();
}

export async function updateReview(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const rating = Math.max(1, Math.min(5, Number(formData.get('rating') ?? 5) || 5));
  await sb
    .from('reviews')
    .update({
      author: String(formData.get('author') ?? '').trim(),
      car: String(formData.get('car') ?? '').trim(),
      rating,
      body: String(formData.get('body') ?? '').trim(),
      visible: formData.get('visible') === 'on' || formData.get('visible') === 'true',
      sort_order: Number(formData.get('sort_order') ?? 0) || 0,
    })
    .eq('id', Number(formData.get('id')));
  revalidatePath('/admin/reviews');
  refreshSite();
}

export async function deleteReview(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('reviews').delete().eq('id', Number(formData.get('id')));
  revalidatePath('/admin/reviews');
  refreshSite();
}

export async function toggleBookingHandled(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from('bookings')
    .update({ handled: formData.get('handled') === 'true' })
    .eq('id', Number(formData.get('id')));
  revalidatePath('/admin/bookings');
}

export async function deleteBooking(formData: FormData) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('bookings').delete().eq('id', Number(formData.get('id')));
  revalidatePath('/admin/bookings');
}

// ─────────────────────────── helpers ───────────────────────────

/** Read-merge-write one locale's fields into a row's `translations` jsonb column. */
async function mergeTranslation(
  sb: SupabaseClient,
  table: string,
  id: number,
  locale: string,
  fields: Record<string, string>,
) {
  const { data } = await sb.from(table).select('translations').eq('id', id).single();
  const translations = (data?.translations as Record<string, Record<string, string>>) ?? {};
  await sb
    .from(table)
    .update({ translations: { ...translations, [locale]: { ...translations[locale], ...fields } } })
    .eq('id', id);
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return v === null || v === '' || Number.isNaN(n) ? null : n;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || `cat-${Date.now()}`;
}
