import { getGallery } from '@/lib/data';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

// Standalone Google image sitemap — Next 14's MetadataRoute.Sitemap drops the
// `images` field, so we emit the XML ourselves. Lists real work photos against
// the homepage so they can surface in Google Images. Refreshed daily.
export const revalidate = 86400;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const gallery = await getGallery().catch(() => []);
  const images = gallery
    .filter((g) => typeof g.image_url === 'string' && g.image_url.startsWith('http'))
    .slice(0, 100)
    .map(
      (g) =>
        `    <image:image><image:loc>${esc(g.image_url)}</image:loc>${
          g.caption ? `<image:title>${esc(g.caption)}</image:title>` : ''
        }</image:image>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
${images}
  </url>
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
