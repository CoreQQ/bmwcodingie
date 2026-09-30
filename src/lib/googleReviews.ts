// Live rating and reviews from the business's Google Maps listing, via the
// Places API (New). Optional: without GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID
// everything here returns null and the site simply shows nothing.
//
// Honesty: this shows exactly what Google returns — the real average, the real
// count and Google's own choice of reviews, low ratings included. Filtering out
// bad reviews would break both Google's terms and the site's own rule.

export type GoogleReview = {
  author: string;
  authorUrl?: string;
  rating: number;
  text: string;
  when: string;
};

export type GoogleRating = {
  rating: number;
  count: number;
  mapsUrl?: string;
  reviews: GoogleReview[];
};

const API = 'https://places.googleapis.com/v1';

export async function getGoogleRating(): Promise<GoogleRating | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;
  try {
    const res = await fetch(`${API}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri',
      },
      // Hourly: fresh enough to feel live, and a few hundred calls a month.
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error('[googleReviews]', res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const d = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      reviews?: {
        rating?: number;
        relativePublishTimeDescription?: string;
        text?: { text?: string };
        originalText?: { text?: string };
        authorAttribution?: { displayName?: string; uri?: string };
      }[];
    };
    if (typeof d.rating !== 'number' || !d.userRatingCount) return null;
    return {
      rating: d.rating,
      count: d.userRatingCount,
      mapsUrl: d.googleMapsUri,
      reviews: (d.reviews ?? [])
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? 'Google user',
          authorUrl: r.authorAttribution?.uri,
          rating: r.rating ?? 0,
          text: (r.originalText?.text ?? r.text?.text ?? '').trim(),
          when: r.relativePublishTimeDescription ?? '',
        }))
        .filter((r) => r.text),
    };
  } catch (e) {
    console.error('[googleReviews] fetch failed', e);
    return null;
  }
}

/** Candidate listings for a search — used once, to find the right Place ID. */
export async function findPlaces(query: string) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { error: 'GOOGLE_PLACES_API_KEY is not set' };
  const res = await fetch(`${API}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri',
    },
    body: JSON.stringify({ textQuery: query }),
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  return res.ok ? body : { error: `${res.status}`, body };
}
