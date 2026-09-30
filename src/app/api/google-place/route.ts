import { NextResponse } from 'next/server';
import { findPlaces } from '@/lib/googleReviews';

export const runtime = 'nodejs';

// One-off helper to find the business's Google Place ID once the Places key
// is in place. Guarded by the shared diagnostics key.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!process.env.MANYCHAT_SECRET || url.searchParams.get('key') !== process.env.MANYCHAT_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const q = url.searchParams.get('q') || 'BMW Coding Dublin';
  return NextResponse.json(await findPlaces(q));
}
