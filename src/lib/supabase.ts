import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True when public Supabase credentials are present. */
export const supabaseConfigured = Boolean(url && anonKey);

/** True when the service role key is present (admin writes possible). */
export const supabaseAdminConfigured = Boolean(url && serviceKey);

/** Public, read-only client (anon key, respects RLS). Null if unconfigured. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  return createClient(url!, anonKey!, { auth: { persistSession: false } });
}

/** Privileged server-only client (service role, bypasses RLS). Null if unconfigured. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdminConfigured) return null;
  return createClient(url!, serviceKey!, { auth: { persistSession: false } });
}

export const GALLERY_BUCKET = process.env.SUPABASE_GALLERY_BUCKET || 'gallery';
