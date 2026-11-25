import { NextResponse } from 'next/server';
import { findPlaces } from '@/lib/googleReviews';

export const runtime = 'nodejs';

// One-off helper to find the business's Google Place ID once the Places key
// is in place. Guarded by the shared diagnostics key.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || '';
  const allowed = [process.env.WHATSAPP_VERIFY_TOKEN, process.env.MANYCHAT_SECRET].filter(Boolean);
  if (!key || !allowed.includes(key)) return NextResponse.json({ ok: false }, { status: 401 });
  // ?id=<place id>: what Google returns for that listing (rating, count and
  // the shape of its reviews — not the texts), to see why reviews are or are
  // not shown on the site.
  const id = url.searchParams.get('id');
  if (id) {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY || '',
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews,googleMapsUri',
      },
      cache: 'no-store',
    });
    const d = (await res.json().catch(() => ({}))) as {
      displayName?: { text?: string };
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      error?: unknown;
      reviews?: { rating?: number; text?: { text?: string; languageCode?: string }; originalText?: { text?: string; languageCode?: string }; relativePublishTimeDescription?: string }[];
    };
    return NextResponse.json({
      status: res.status,
      error: d.error,
      name: d.displayName?.text,
      rating: d.rating,
      count: d.userRatingCount,
      maps: d.googleMapsUri,
      reviews: (d.reviews ?? []).map((r) => ({
        rating: r.rating,
        when: r.relativePublishTimeDescription,
        textLen: (r.text?.text ?? '').length,
        originalLen: (r.originalText?.text ?? '').length,
        lang: r.originalText?.languageCode ?? r.text?.languageCode,
      })),
    });
  }
  const q = url.searchParams.get('q') || 'BMW Coding Dublin';
  return NextResponse.json(await findPlaces(q));
}
