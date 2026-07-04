import { ADDRESS_LINE, googleDirectionsUrl } from './directions';

// Canned replies the owner sends customers many times a day. Shown by the
// /reply command as tap-to-copy blocks. Plain text — they go into WhatsApp.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export type CannedReply = { key: string; label: string; text: string };

export const CANNED_REPLIES: CannedReply[] = [
  {
    key: 'directions',
    label: '📍 How to find us',
    text: `We're at ${ADDRESS_LINE}. Don't follow the sat-nav pin — it leads to a dead end! Use this route instead: ${googleDirectionsUrl()} — you'll see large ORANGE GATES, drive straight through them and keep RIGHT to the very end of the yard. Full guide with photos: ${SITE}/find-us — stuck? Just call and we'll guide you in.`,
  },
  {
    key: 'remote',
    label: '💻 Remote coding prep',
    text: `For remote coding you'll need: 1) a Windows laptop, 2) an ENET (OBD) cable — about €15-20 on Amazon/AliExpress, search "ENET BMW cable". Plug it into the OBD port under the dash, connect the laptop, and we do the rest over a screen-share at a time that suits you. Takes about 30-60 minutes.`,
  },
  {
    key: 'payment',
    label: '💶 Payment details',
    text: `Payment on completion — card, cash or bank transfer. Transfer details: IBAN IE53AIBK93334153254033 · BIC AIBKIE2D · Oleksandr Rudenko (please put your name in the reference). All fields tap-to-copy here: ${SITE}/payment`,
  },
  {
    key: 'book',
    label: '📅 How to book',
    text: `You can pick a slot that suits you right on the site: ${SITE}/#contact — we work Mon-Fri 19:00-23:00 and Sat-Sun 11:00-23:00. Or just tell me a day and time here and I'll pencil you in.`,
  },
  {
    key: 'checkcar',
    label: '🚗 Need car details',
    text: `To confirm exactly what's possible on your car, send me: the model, the year, and ideally the VIN (last 7 characters are enough). I'll check your build and tell you straight what it supports and the price.`,
  },
  {
    key: 'warranty',
    label: '🛡 Warranty question',
    text: `Coding changes software settings that already exist in the car — it's fully reversible and we can return everything to factory before any dealer visit. You see each feature working before you pay.`,
  },
];

export function getReply(key: string): CannedReply | undefined {
  return CANNED_REPLIES.find((r) => r.key === key);
}
