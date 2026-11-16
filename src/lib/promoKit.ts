import { CALL_OUT, PRICE_ITEMS } from './pricing';
import { BF, BF_ON, BF_SOON, XMAS, XMAS_ON } from './season';

// Ready-to-post advertising texts for the owner (/promo in the bot, 16 Nov
// 2026 — the goal is twice the enquiries in December). Nearly every visitor
// today comes from a Google search or already knows the site; the places
// where Irish BMW owners and import dealers actually look — Adverts.ie,
// DoneDeal, Google Maps, the dealers themselves — have nothing from us.
//
// Built from pricing.ts and the running offer, so a text copied today always
// carries today's prices. Each link is tagged (utm_*), which is how an enquiry
// from that listing shows up as "📣 Ad source" on its card.

export type PromoText = { title: string; where: string; text: string };

const SITE = 'https://www.bmwcoding.ie';
const price = (id: string, unit: 'nbt-evo' | 'mgu') => PRICE_ITEMS.find((i) => i.id === id)?.price[unit] ?? 0;
const link = (path: string, source: string, campaign: string) =>
  `${SITE}${path}?utm_source=${source}&utm_medium=listing&utm_campaign=${campaign}`;

/** +353871234567 → +353 87 123 4567 */
function prettyPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  const ie = /^353(\d{2})(\d{3})(\d{4})$/.exec(d);
  return ie ? `+353 ${ie[1]} ${ie[2]} ${ie[3]}` : d ? `+${d}` : '';
}

/** One line about the offer that is running or announced; '' when there is none. */
function offerLine(): string {
  if (XMAS_ON) return `Christmas offer: ${XMAS.pct}% off the work until ${XMAS.until}.`;
  if (BF_ON) return `Black Friday: ${BF.pct}% off jobs done ${BF.dates}, and the Wi-Fi antenna is included with CarPlay.`;
  if (BF_SOON) return `Black Friday, ${BF.dates}: ${BF.pct}% off the work and the Wi-Fi antenna included with CarPlay — book a slot for those days now.`;
  return '';
}

export function promoTexts(whatsapp: string): PromoText[] {
  const phone = prettyPhone(whatsapp);
  const contact = phone ? `WhatsApp ${phone}` : 'WhatsApp us';
  const offer = offerLine();
  const carplayEvo = price('carplay', 'nbt-evo');
  const carplayMgu = price('carplay', 'mgu');
  const japanEvo = price('japan', 'nbt-evo');
  const japanMgu = price('japan', 'mgu');
  const callOut = `call-out €${CALL_OUT.base} around Dublin, €${CALL_OUT.perKm.toFixed(2)}/km beyond`;
  /** The body, the offer line when there is one, then how to get in touch. */
  const compose = (body: string[], closing: string[]) => [...body, ...(offer ? ['', offer] : []), '', ...closing].join('\n');

  return [
    {
      title: 'Listing — Apple CarPlay',
      where: 'Adverts.ie and DoneDeal → Car parts & accessories. Title: “BMW Apple CarPlay activation — mobile, Dublin & Ireland”. Price field: ' + carplayEvo + '. Add 3–4 of your own photos of CarPlay on a BMW screen.',
      text: compose([
        'Apple CarPlay activated on your BMW’s own screen. No box behind the dash, no subscription — a one-off activation.',
        '',
        `• €${carplayEvo} on NBT Evo (most 2016–2019 BMWs) · €${carplayMgu} on iDrive 7 (2020 onwards)`,
        `• I come to you: home or work (${callOut}). Remote activation anywhere in Ireland.`,
        '• Your car is checked from its VIN first, free. You pay only when you have seen it working.',
        '• Fullscreen CarPlay, Video in Motion and other coding can be done in the same visit.',
        '• F-Series and G-Series. Not possible on BMWs built before 2016.',
      ], [`Send your VIN: ${contact}`, `Or check your car here: ${link('/apple-carplay-activation-dublin', 'marketplace', 'carplay')}`]),
    },
    {
      title: 'Listing — Japanese import conversion',
      where: 'Adverts.ie and DoneDeal → Car parts & accessories. Title: “BMW Japanese import conversion — English, radio, maps, CarPlay”. Price field: ' + japanEvo + '.',
      text: compose([
        'BMW imported from Japan? I convert it for Ireland — properly, not just the language.',
        '',
        '• English menus, Irish radio stations, navigation with European maps',
        '• Apple CarPlay activation included in the price',
        `• €${japanEvo} on NBT Evo (most 2016–2019 cars) · €${japanMgu} on iDrive 7 (2020 onwards)`,
        `• Mobile: I come to you (${callOut}), or remotely across Ireland`,
        '• Checked from the VIN first. You pay when it is shown working.',
        '• BMW F-Series and G-Series only.',
      ], [`Send your VIN: ${contact}`, `More: ${link('/japan-import-bmw-conversion-ireland', 'marketplace', 'japan')}`]),
    },
    {
      title: 'Message to import dealers',
      where: 'Send from your own WhatsApp or email to dealers who sell BMWs from Japan — one personal message each, with their name. Not a mass mailing.',
      text: [
        'Hi, Alex here from BMW Coding IE in west Dublin.',
        '',
        'I convert Japanese-import BMWs to EU spec at the dealer’s premises: English menus, Irish radio, navigation with European maps, and Apple CarPlay activated — usually several cars in one visit, so they go on sale already converted.',
        '',
        `€${japanEvo} per car on NBT Evo (2016–2019), €${japanMgu} on iDrive 7 (2020 on), CarPlay included. You pay per car once it is shown working, and you get an invoice for each.`,
        '',
        'If you have BMWs from Japan in stock or on the way, send me the VINs and I will tell you what each one needs.',
        '',
        `${link('/japanese-import-bmw-conversion-for-dealers', 'dealer', 'japan')}`,
        phone ? `WhatsApp / call: ${phone}` : '',
      ]
        .filter((l, i, a) => l !== '' || a[i - 1] !== '')
        .join('\n')
        .trim(),
    },
    {
      title: 'Google Business Profile post',
      where: 'Google Maps app → your business → “Add update”. Add one photo. Button: “Learn more” with the link at the bottom. Post one a week — Google shows recent posts on the listing.',
      text: compose([
        'BMW from Japan, or a BMW without Apple CarPlay? Both are sorted in one visit, at your door.',
        '',
        `Apple CarPlay activation: €${carplayEvo} on NBT Evo (2016–2019 cars), €${carplayMgu} on iDrive 7.`,
        `Japan → EU conversion — English, Irish radio, EU maps, CarPlay included: €${japanEvo} / €${japanMgu}.`,
        'Mobile around Dublin, remote across Ireland. Checked from your VIN first; you pay when it works.',
      ], [link('/', 'google', 'gbp-post').replace('utm_medium=listing', 'utm_medium=organic')]),
    },
    {
      title: 'Instagram / Facebook caption',
      where: 'Under a short video or photo of the job you just finished (the screen before and after works best). Facebook: also post it in Irish BMW owner groups where the rules allow adverts.',
      text: compose([
        'Apple CarPlay on the car’s own screen — activated today, no box, no subscription. 📲',
        '',
        `€${carplayEvo} on most 2016–2019 BMWs. Japanese imports converted too: English, Irish radio, EU maps, CarPlay included, from €${japanEvo}.`,
        'I come to you around Dublin, or do it remotely anywhere in Ireland. Send your VIN and I will tell you what your car supports.',
      ], [`${contact} · bmwcoding.ie`, '', '#bmw #bmwireland #carplay #bmwcoding #dublin #japaneseimport #bmwf30 #bmwf10 #bmwg30']),
    },
  ];
}
