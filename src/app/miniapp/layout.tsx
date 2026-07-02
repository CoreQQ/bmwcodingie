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
