import { OFFER, OFFER_ON, priceParts } from '@/lib/season';

/**
 * A price line as written ("From €150"), or — during an offer (Black Friday,
 * Christmas) — every amount struck through with the offer price beside it and
 * a −10% tag. No hooks, so it renders the same on the server and in client
 * components.
 */
export function OfferPrice({ text, tag = true }: { text: string; tag?: boolean }) {
  if (!OFFER_ON) return <>{text}</>;
  const parts = priceParts(text);
  if (!parts.some((p) => 'was' in p)) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        'was' in p ? (
          <span key={i} className="whitespace-nowrap">
            <s className="text-faint decoration-2" style={{ textDecorationColor: OFFER.accent }}>
              €{p.was}
            </s>{' '}
            <span className="text-ink">€{p.now}</span>
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
      {tag && (
        <span
          className="ml-2 inline-block translate-y-[-2px] rounded-sm px-1.5 py-0.5 align-middle font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={
            OFFER.tag === 'outline'
              ? { border: `1px solid ${OFFER.accent}`, color: OFFER.accent }
              : { background: OFFER.accent, color: '#0c0f14' }
          }
        >
          −{OFFER.pct}%
        </span>
      )}
    </>
  );
}
