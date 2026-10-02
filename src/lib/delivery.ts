import type { Service } from './types';

// How a service is delivered. "Remote OK" used to be printed from the
// "mobile_available" flag, so hardware retrofits — which need hands on the car
// — were advertised as doable remotely. Each service now has exactly one of:
//   remote  — can be done entirely over ENET
//   mobile  — needs physical access to the car
//   both    — either works
// An explicit `delivery` column (when the migration has run and Alex has set
// it) always wins; otherwise it is inferred conservatively from the wording,
// so anything that sounds like fitting parts is never shown as remote.
export type Delivery = 'remote' | 'mobile' | 'both';

const HARDWARE =
  /retrofit|install|fitted|fitting|camera|ambient|antenna|cluster|6wb|6wa|heated|sensor|parts|hardware|wiring|harness|id4|id6|idrive 4|idrive 6|flash/i;

export function deliveryFor(s: Pick<Service, 'title' | 'description'> & { delivery?: string | null }): Delivery {
  const set = (s.delivery ?? '').toLowerCase();
  if (set === 'remote' || set === 'mobile' || set === 'both') return set;
  return HARDWARE.test(`${s.title} ${s.description}`) ? 'mobile' : 'both';
}
