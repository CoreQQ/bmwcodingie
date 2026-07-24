import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'PULT — BMW Coding',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'PULT', statusBarStyle: 'black-translucent' },
  icons: { apple: '/logo.png' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0A0B0D' };

// Captures Telegram's launch hash before ANY framework code runs — Next's
// hydration/router can touch the URL, and the tgWebAppData payload must not
// be lost. A plain inline <script> executes during HTML parsing.
export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var h=location.hash.slice(1);if(h.indexOf('tgWebAppData')!==-1){sessionStorage.setItem('__tg_hash',h);}}catch(e){}`,
        }}
      />
      {children}
    </>
  );
}
