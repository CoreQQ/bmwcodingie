import { priceParts, XMAS, XMAS_ON } from '@/lib/season';

/**
 * A price line as written ("From €150"), or — during the Christmas offer —
 * every amount struck through with the offer price beside it and a −10% tag.
 * No hooks, so it renders the same on the server and in client components.
 */
export function OfferPrice({ text, tag = true }: { text: string; tag?: boolean }) {
  if (!XMAS_ON) return <>{text}</>;
  const parts = priceParts(text);
  if (!parts.some((p) => 'was' in p)) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        'was' in p ? (
          <span key={i} className="whitespace-nowrap">
            <s className="text-faint decoration-[#e23b4a]/80 decoration-2">€{p.was}</s>{' '}
            <span className="text-ink">€{p.now}</span>
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
      {tag && (
        <span className="ml-2 inline-block translate-y-[-2px] rounded-sm bg-[#c8102e] px-1.5 py-0.5 align-middle font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
          −{XMAS.pct}%
        </span>
      )}
    </>
  );
}
