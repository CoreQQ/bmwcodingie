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
        'X-Goog-FieldMask':
          'displayName,rating,userRatingCount,reviews,googleMapsUri,businessStatus,primaryType,primaryTypeDisplayName,types,formattedAddress,websiteUri,nationalPhoneNumber,regularOpeningHours,pureServiceAreaBusiness,photos',
      },
      cache: 'no-store',
    });
    const d = (await res.json().catch(() => ({}))) as {
      businessStatus?: string;
      primaryType?: string;
      primaryTypeDisplayName?: { text?: string };
      types?: string[];
      formattedAddress?: string;
      websiteUri?: string;
      nationalPhoneNumber?: string;
      regularOpeningHours?: { weekdayDescriptions?: string[] };
      pureServiceAreaBusiness?: boolean;
      photos?: unknown[];
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
      status_: d.businessStatus,
      category: d.primaryTypeDisplayName?.text ?? d.primaryType,
      types: d.types,
      address: d.formattedAddress,
      serviceAreaOnly: d.pureServiceAreaBusiness,
      website: d.websiteUri,
      phone: d.nationalPhoneNumber ? 'set' : 'missing',
      hours: d.regularOpeningHours?.weekdayDescriptions,
      photos: d.photos?.length ?? 0,
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
  // ?near=dublin: rank the results as someone in Dublin would see them, and
  // say where our own listing (GOOGLE_PLACE_ID) comes, if at all.
  if (url.searchParams.get('near') === 'dublin') {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY || '',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: q,
        pageSize: 20,
        regionCode: 'IE',
        locationBias: { circle: { center: { latitude: 53.3498, longitude: -6.2603 }, radius: 25000 } },
      }),
      cache: 'no-store',
    });
    const d = (await res.json().catch(() => ({}))) as {
      places?: { id: string; displayName?: { text?: string }; rating?: number; userRatingCount?: number; primaryTypeDisplayName?: { text?: string }; formattedAddress?: string }[];
    };
    const ours = process.env.GOOGLE_PLACE_ID;
    const list = (d.places ?? []).map((p, i) => ({
      rank: i + 1,
      ours: p.id === ours,
      name: p.displayName?.text,
      rating: p.rating,
      reviews: p.userRatingCount,
      category: p.primaryTypeDisplayName?.text,
      area: (p.formattedAddress ?? '').split(',').slice(-3).join(',').trim(),
    }));
    return NextResponse.json({ q, oursAt: list.find((p) => p.ours)?.rank ?? null, results: list });
  }
  return NextResponse.json(await findPlaces(q));
}
