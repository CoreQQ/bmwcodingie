export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Where the owner's "Open WhatsApp" buttons lead (bot, Mini App) — see
// bizChatLink in lib/phone.ts. A wa.me link cannot choose between the two
// WhatsApp apps: with both on the phone it opens the personal one. Each app
// has its own address, though, so this page opens the Business one:
//   iPhone  — whatsapp-smb://send?phone=…          (WhatsApp Business' scheme)
//   Android — intent://…;package=com.whatsapp.w4b  (falls back to wa.me)
//   desktop — straight to wa.me (one WhatsApp there)
// It tries at once and keeps two plain buttons on screen, because some
// in-app browsers only follow an app link after a tap.
//
// Nothing private here: the page shows the number from its own address and
// links only to WhatsApp, so it needs no key. Not indexed.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** +353871234567 → +353 87 123 4567; other countries in groups of three. */
function pretty(digits: string): string {
  const ie = /^353(\d{2})(\d{3})(\d{4})$/.exec(digits);
  if (ie) return `+353 ${ie[1]} ${ie[2]} ${ie[3]}`;
  return `+${digits.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
}

export async function GET(req: Request, { params }: { params: { phone: string } }) {
  const digits = (params.phone || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return new Response('Not a phone number.', { status: 400 });
  const text = (new URL(req.url).searchParams.get('t') || '').slice(0, 1000);
  const q = text ? encodeURIComponent(text) : '';

  const regular = `https://wa.me/${digits}${q ? `?text=${q}` : ''}`;
  const iosLink = `whatsapp-smb://send?phone=${digits}${q ? `&text=${q}` : ''}`;
  const androidLink =
    `intent://send?phone=${digits}${q ? `&text=${q}` : ''}` +
    `#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${encodeURIComponent(regular)};end`;

  const ua = req.headers.get('user-agent') || '';
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  // A desktop has one WhatsApp: no page needed.
  if (!isIos && !isAndroid) return Response.redirect(regular, 302);
  const business = isIos ? iosLink : androidLink;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="dark">
<title>Open in WhatsApp Business</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; display: grid; place-items: center; background: #0c0f14; color: #e8ecf1;
    font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px)); }
  main { width: 100%; max-width: 380px; text-align: center; }
  .label { margin: 0 0 10px; font: 600 11px/1 ui-monospace, Menlo, Consolas, monospace; letter-spacing: .16em; text-transform: uppercase; color: #93a0b1; }
  h1 { margin: 0 0 22px; font-size: 28px; line-height: 1.15; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 54px; margin: 0 0 10px; padding: 12px 16px;
    border-radius: 14px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.05); color: inherit;
    font: 600 16px/1.2 inherit; font-family: inherit; text-decoration: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .btn.primary { background: #25d366; border-color: #25d366; color: #05240e; }
  .btn:active { transform: scale(.985); }
  .btn:focus-visible { outline: 2px solid #8ab4ff; outline-offset: 2px; }
  .hint { margin: 14px 0 0; min-height: 2.9em; font-size: 13px; color: #93a0b1; }
  @media (prefers-reduced-motion: reduce) { .btn:active { transform: none; } }
</style>
</head>
<body>
<main>
  <p class="label">BMW Coding IE · customer chat</p>
  <h1>${esc(pretty(digits))}</h1>
  <a class="btn primary" id="biz" href="${esc(business)}">Open in WhatsApp Business</a>
  <a class="btn" href="${esc(regular)}">Open in regular WhatsApp</a>
  <button class="btn" id="copy" type="button">Copy number</button>
  <p class="hint" id="hint" role="status">Opening WhatsApp Business…</p>
</main>
<script>
(function () {
  var number = ${JSON.stringify(`+${digits}`)};
  var business = ${JSON.stringify(business).replace(/</g, '\\u003c')};
  var hint = document.getElementById('hint');
  var copy = document.getElementById('copy');
  // Try straight away; the buttons are for browsers that only follow an app link after a tap.
  var tried = false;
  function open() { if (tried) return; tried = true; try { window.location.href = business; } catch (e) {} }
  setTimeout(open, 80);
  setTimeout(function () { hint.textContent = 'Did not open? Tap the green button.'; }, 1800);
  function copied() { copy.textContent = 'Copied ' + number; setTimeout(function () { copy.textContent = 'Copy number'; }, 1600); }
  function oldCopy() {
    var t = document.createElement('textarea'); t.value = number; t.setAttribute('readonly', '');
    t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
    try { if (document.execCommand('copy')) copied(); } catch (e) {} document.body.removeChild(t);
  }
  copy.addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(number).then(copied, oldCopy);
    else oldCopy();
  });
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
