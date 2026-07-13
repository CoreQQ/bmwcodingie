// Country gating for interactive endpoints. Pages stay open to the world —
// Googlebot/Bing/GPT crawl from the US and geo-blocking them would kill SEO.
// Vercel stamps every request with x-vercel-ip-country.

const ALLOWED = new Set(['IE', 'GB']); // service area: Ireland + UK-plated cars

export function requestCountry(req: Request): string {
  return (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
}

/** True for the service area — and for unknown (local dev, some proxies). */
export function isServiceArea(req: Request): boolean {
  const c = requestCountry(req);
  return !c || ALLOWED.has(c);
}
