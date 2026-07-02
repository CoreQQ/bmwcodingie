// "How to find us" — single source of truth for the workshop location.
//
// Google's own pin routes arrivals into a dead-end road, so we never link the
// address. Instead we route to exact coordinates of the CORRECT entrance and
// (optionally) force the approach with a via-point.
//
/** The gate/door people should actually drive to (owner-provided pin). */
export const ENTRANCE = { lat: 53.3000625, lng: -6.4818572 };

/** Via-points forcing the correct approach (owner-provided pins, in order):
 *  1. the right road into the park, 2. the orange gates you drive through. */
export const VIA_POINTS: { lat: number; lng: number }[] = [
  { lat: 53.2966168, lng: -6.4813073 }, // correct approach road
  { lat: 53.2986419, lng: -6.4814552 }, // orange gates
];

export const ADDRESS_LINE = 'Grants View, Greenogue Business Park, Rathcoole, Co. Dublin';

/** Step-by-step directions shown on /find-us (owner-editable copy). */
export const STEPS: string[] = [
  'Take the N7 to the Rathcoole / Greenogue exit (Junction 4) and follow signs for Greenogue Business Park.',
  'Continue onto the main park road and along Grants View — do not turn where a sat-nav pin first suggests; that side road is a dead end.',
  'Ahead you will see large ORANGE GATES — drive straight through them.',
  'After the gates, keep to the RIGHT and follow the yard all the way to the end — our unit is right there. Stuck? Call or WhatsApp and we will guide you in.',
];

const dest = () => `${ENTRANCE.lat},${ENTRANCE.lng}`;

/** Google Maps driving directions to the exact entrance (not the broken pin). */
export function googleDirectionsUrl(): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${dest()}&travelmode=driving`;
  if (!VIA_POINTS.length) return base;
  const waypoints = VIA_POINTS.map((p) => `${p.lat},${p.lng}`).join('%7C');
  return `${base}&waypoints=${waypoints}`;
}

/** Apple Maps (default on iPhone) driving directions to the entrance. */
export function appleDirectionsUrl(): string {
  return `https://maps.apple.com/?daddr=${dest()}&dirflg=d`;
}

/** Keyless Google Maps embed centred on the entrance. */
export function mapEmbedUrl(): string {
  return `https://www.google.com/maps?q=${dest()}&z=15&output=embed`;
}
