// Search snippets: Google shows ~60 characters of a title and ~155 of a
// description. Longer ones are cut mid-word, and every page used to also get
// " | BMW Coding" appended by the layout template — model pages reached 120.

const BRAND = ' | BMW Coding';

/** A title that fits the result line; brand appended only when there is room. */
export function seoTitle(raw: string, max = 62): string {
  let t = raw.replace(/\s*\|\s*BMW Coding\s*$/i, '').trim();
  if (t.length > max && t.includes(' | ')) t = t.split(' | ')[0].trim();
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '').replace(/[\s,·—–-]+$/, '');
  return t.length + BRAND.length <= max ? t + BRAND : t;
}

/** A description cut at a word boundary instead of mid-word by Google. */
export function seoDescription(raw: string, max = 158): string {
  const d = raw.replace(/\s+/g, ' ').trim();
  if (d.length <= max) return d;
  const cut = d.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[\s,;:·—–-]+$/, '');
  return `${cut}…`;
}
