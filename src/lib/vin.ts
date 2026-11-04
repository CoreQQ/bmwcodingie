// The full VIN, 17 characters (owner, 4 Nov 2026 — it used to be the last 7).
// A VIN never contains I, O or Q, so when people type those they mean 1 and 0.

export const VIN_LENGTH = 17;

export function cleanVin(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/[OQ]/g, '0')
    .replace(/I/g, '1');
}

export const isFullVin = (vin: string) => vin.length === VIN_LENGTH;
