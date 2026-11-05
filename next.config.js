const createNextIntlPlugin = require('next-intl/plugin');
const SEASON_DATES = require('./src/lib/season-dates.json');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Which offer the site runs, decided once per build from today's Irish date
// (src/lib/season-dates.json), so a deploy on 27 Nov switches Black Friday on
// and one on 1 Dec switches to Christmas. NEXT_PUBLIC_SEASON in Vercel
// overrides it (Preview uses that to show an offer before its dates).
function seasonForToday() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });
  for (const [name, range] of Object.entries(SEASON_DATES)) {
    if (Array.isArray(range) && today >= range[0] && today <= range[1]) return name;
  }
  return '';
}
const SEASON = process.env.NEXT_PUBLIC_SEASON ?? seasonForToday();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_SEASON: SEASON === 'none' ? '' : SEASON },
  // Baseline security headers. No X-Frame-Options: the Telegram Mini App
  // (/miniapp) must stay embeddable in Telegram Web's iframe.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Allow Supabase Storage public URLs for gallery images.
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
