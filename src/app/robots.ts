import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://bmwcoding.ie';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/payment', '/api', '/*/payment'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
