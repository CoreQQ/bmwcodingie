import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { buildVehicleReportPdf, type ReportSection } from '@/lib/vehicleReport';
import { estimateHeadUnit } from '@/lib/headUnit';

export const runtime = 'nodejs';

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

const SKIP = new Set(['', 'Not Applicable', '0', 'null']);

// [NHTSA field, friendly label, section]
const FIELDS: [string, string, string][] = [
  ['Make', 'Make', 'Vehicle'],
  ['Model', 'Model', 'Vehicle'],
  ['Series', 'Series', 'Vehicle'],
  ['Trim', 'Trim', 'Vehicle'],
  ['ModelYear', 'Year', 'Vehicle'],
  ['BodyClass', 'Body', 'Vehicle'],
  ['VehicleType', 'Type', 'Vehicle'],
  ['Doors', 'Doors', 'Vehicle'],
  ['EngineCylinders', 'Cylinders', 'Engine & drivetrain'],
  ['DisplacementL', 'Displacement (L)', 'Engine & drivetrain'],
  ['EngineHP', 'Horsepower', 'Engine & drivetrain'],
  ['FuelTypePrimary', 'Fuel', 'Engine & drivetrain'],
  ['DriveType', 'Drive', 'Engine & drivetrain'],
  ['TransmissionStyle', 'Transmission', 'Engine & drivetrain'],
  ['Manufacturer', 'Manufacturer', 'Manufacture'],
  ['PlantCity', 'Plant city', 'Manufacture'],
  ['PlantCountry', 'Plant country', 'Manufacture'],
  ['AirBagLocFront', 'Front airbags', 'Safety & equipment'],
  ['AirBagLocSide', 'Side airbags', 'Safety & equipment'],
  ['AirBagLocKnee', 'Knee airbags', 'Safety & equipment'],
  ['AirBagLocCurtain', 'Curtain airbags', 'Safety & equipment'],
  ['Pretensioner', 'Seatbelt pretensioners', 'Safety & equipment'],
  ['SeatBeltsAll', 'Seat belts', 'Safety & equipment'],
  ['TPMS', 'Tyre pressure monitoring', 'Safety & equipment'],
  ['ABS', 'ABS', 'Safety & equipment'],
  ['GVWR', 'Gross weight rating', 'Safety & equipment'],
];

export async function GET(req: Request) {
  if (isRateLimited(`vinrep:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return new Response('Too many requests', { status: 429 });
  }
  const vin = (new URL(req.url).searchParams.get('vin') || '').trim().toUpperCase();
  if (!VIN_RE.test(vin)) return new Response('Invalid VIN', { status: 400 });

  let r: Record<string, unknown> = {};
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return new Response('Lookup failed', { status: 502 });
    r = (await res.json())?.Results?.[0] ?? {};
  } catch {
    return new Response('Lookup failed', { status: 502 });
  }

  if (!/bmw/i.test(String(r.Make ?? ''))) {
    return new Response('Not a BMW VIN', { status: 422 });
  }

  const val = (k: string) => {
    const s = String(r[k] ?? '').trim();
    return SKIP.has(s) ? '' : s;
  };

  const bySection = new Map<string, [string, string][]>();
  for (const [key, label, section] of FIELDS) {
    const v = val(key);
    if (!v) continue;
    const arr = bySection.get(section) ?? [];
    arr.push([label, v]);
    bySection.set(section, arr);
  }
  // Add the estimated head unit to the Vehicle section.
  const headUnit = estimateHeadUnit(val('ModelYear'), val('Series') || val('Model'));
  if (headUnit) {
    const veh = bySection.get('Vehicle') ?? [];
    veh.push(['Likely head unit (est.)', headUnit]);
    bySection.set('Vehicle', veh);
  }

  const sections: ReportSection[] = [...bySection.entries()].map(([title, rows]) => ({ title, rows }));

  const title = [val('Make') || 'BMW', val('Model'), val('Series'), val('ModelYear')]
    .filter(Boolean)
    .join(' · ');
  const date = new Date().toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' });

  const bytes = await buildVehicleReportPdf({
    vin,
    date,
    title,
    sections,
    website: SITE_URL.replace(/^https?:\/\//, ''),
  });

  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="BMW-${vin}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
