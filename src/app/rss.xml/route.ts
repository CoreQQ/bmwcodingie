import { BLOG_POSTS } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

// RSS feed for the guides — helps aggregators and crawlers discover new
// content the moment it ships.
export const revalidate = 3600;

export function GET() {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = [...BLOG_POSTS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid>${SITE_URL}/blog/${p.slug}</guid>
      <pubDate>${new Date(`${p.date}T09:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BMW Coding IE — Guides</title>
    <link>${SITE_URL}/blog</link>
    <description>BMW coding, diagnostics and retrofit guides from Dublin, Ireland.</description>
    <language>en-IE</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
