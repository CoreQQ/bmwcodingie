import { NextResponse } from 'next/server';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { estimateHeadUnit } from '@/lib/headUnit';

export const runtime = 'nodejs';

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

// Decodes a VIN via the free, key-less NHTSA vPIC API and returns just the
// fields we show. Never throws; returns { ok:false } on any failure.
export async function GET(req: Request) {
  if (isRateLimited(`vin:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  const vin = (new URL(req.url).searchParams.get('vin') || '').trim().toUpperCase();
  if (!VIN_RE.test(vin)) {
    return NextResponse.json({ ok: false, error: 'invalid_vin' });
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return NextResponse.json({ ok: false, error: 'lookup_failed' });
    const data = await res.json();
    const r = data?.Results?.[0] ?? {};

    const make = String(r.Make ?? '').trim();
    const isBmw = /bmw/i.test(make);
    const clean = (v: unknown) => {
      const s = String(v ?? '').trim();
      return s && s !== '0' ? s : '';
    };
    const displacement = clean(r.DisplacementL);
    const series = clean(r.Series) || clean(r.Series2);
    const year = clean(r.ModelYear);

    return NextResponse.json({
      ok: true,
      isBmw,
      make,
      model: clean(r.Model),
      series,
      year,
      body: clean(r.BodyClass),
      fuel: clean(r.FuelTypePrimary),
      engine: displacement ? `${displacement}L${r.FuelTypePrimary ? ` ${clean(r.FuelTypePrimary)}` : ''}` : '',
      headUnit: isBmw ? estimateHeadUnit(year, series || clean(r.Model)) : '',
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'lookup_failed' });
  }
}
