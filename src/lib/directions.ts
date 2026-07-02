// "How to find us" — single source of truth for the workshop location.
//
// Google's own pin routes arrivals into a dead-end road, so we never link the
// address. Instead we route to exact coordinates of the CORRECT entrance and
// (optionally) force the approach with a via-point.
//
/** The gate/door people should actually drive to (owner-provided pin). */
export const ENTRANCE = { lat: 53.3000625, lng: -6.4818572 };

/** Via-point on the correct approach road (owner-provided) — forces the
 *  route to come in the right way instead of the dead-end side. */
export const APPROACH: { lat: number; lng: number } | null = { lat: 53.2966168, lng: -6.4813073 };

export const ADDRESS_LINE = 'Grants View, Greenogue Business Park, Rathcoole, Co. Dublin';

/** Step-by-step directions shown on /find-us (owner-editable copy). */
export const STEPS: string[] = [
  'Take the N7 to the Rathcoole / Greenogue exit (Junction 4) and follow signs for Greenogue Business Park.',
  'At the entrance to the park, continue onto the main park road — do not turn where the sat-nav first suggests; that side road is a dead end.',
  'Follow the road to Grants View and continue to our unit.',
  'Look for the BMW Coding unit — if in doubt, call or WhatsApp us and we will guide you in; we are 30 seconds away.',
];

const dest = () => `${ENTRANCE.lat},${ENTRANCE.lng}`;

/** Google Maps driving directions to the exact entrance (not the broken pin). */
export function googleDirectionsUrl(): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${dest()}&travelmode=driving`;
  return APPROACH ? `${base}&waypoints=${APPROACH.lat},${APPROACH.lng}` : base;
}

/** Apple Maps (default on iPhone) driving directions to the entrance. */
export function appleDirectionsUrl(): string {
  return `https://maps.apple.com/?daddr=${dest()}&dirflg=d`;
}

/** Keyless Google Maps embed centred on the entrance. */
export function mapEmbedUrl(): string {
  return `https://www.google.com/maps?q=${dest()}&z=15&output=embed`;
}
