import type { ServicePage } from './servicePages';

// Service landings from the owner's SEO brief (section 13) that had no page
// yet. Each targets its own search intent — no city-swapped duplicates.
// Prices must match src/lib/pricing.ts and the WhatsApp agent's CORE_FACTS;
// anything not fixed there is "quoted after VIN check", never invented.
export const UPGRADE_LANDINGS: Record<string, ServicePage> = {
  'bmw-carplay-activation-ireland': {
    slug: 'bmw-carplay-activation-ireland',
    galleryMatch: ['carplay'],
    metaTitle: 'BMW CarPlay Activation Ireland | Remote or Mobile, Nationwide',
    metaDescription:
      'BMW Apple CarPlay activation anywhere in Ireland — remotely over an ENET cable or by mobile visit around Dublin. NBT Evo €150, iDrive 7 (MGU) €220. Pay once it works.',
    serviceName: 'BMW CarPlay Activation Ireland',
    eyebrow: 'Apple CarPlay · Remote · All of Ireland',
    h1: 'BMW CarPlay Activation Anywhere in Ireland',
    heroSub:
      'Cork, Galway, Limerick, Waterford or a farm in Donegal — if your BMW has the right head unit, CarPlay can usually be activated remotely. You plug a laptop into the car, we do the rest over the connection.',
    price: { amount: 150, text: 'From €150 (NBT Evo) · €220 on iDrive 7 (MGU)' },
    intro: [
      'You do not need to be near Dublin to get CarPlay on a BMW. CarPlay activation is software work, so on most NBT Evo and iDrive 7 cars it can be done remotely: you connect a Windows laptop to the OBD port with an ENET cable (around €15 online), open a screen-share, and we activate, test and hand back the car in one session.',
      'Before anything is booked we check your VIN. Roughly, BMWs from 2016 onwards with NBT Evo or iDrive 7 have good chances; older cars depend on which head unit was fitted, and some simply cannot run CarPlay without new hardware. If yours is one of those, we tell you straight away instead of selling you something that will not work.',
      'Around Dublin, Kildare, Wicklow and Meath we can also come to the car — handy if you would rather not set up a laptop.',
    ],
    includedHeading: 'What you get',
    included: [
      'Full Apple CarPlay — no trial period, no subscription',
      'Wireless CarPlay where your build supports it',
      'Compatibility checked from your VIN before you pay anything',
      'Remote session anywhere in Ireland, or a mobile visit around Dublin',
      'Tested with your iPhone before the session ends',
    ],
    modelsHeading: 'Which BMWs can get CarPlay',
    models: [
      'NBT Evo (iDrive 5/6, roughly 2016–2019) — €150; ID4 software may need the ID6 update first (+€50)',
      'MGU / iDrive 7 (G-series, roughly 2019+) — €220',
      'iDrive 8 / 8.5 — depends on software version; priced per car after VIN check',
      'Older CIC / NBT / EntryNav cars — usually need a head unit change; we confirm from VIN',
    ],
    process: [
      { title: 'Send your VIN', body: 'The last 7 characters are enough. We tell you which head unit you have and whether CarPlay will work.' },
      { title: 'Pick remote or visit', body: 'Remote: a Windows laptop and ENET cable. Mobile visit: we come to the car around Dublin.' },
      { title: 'Activate and test', body: 'We activate CarPlay, pair your iPhone and check wired and wireless where supported.' },
      { title: 'Pay once it works', body: 'You see CarPlay running on your screen before you pay.' },
    ],
    faqs: [
      { q: 'Can CarPlay really be activated remotely?', a: 'On most NBT Evo and iDrive 7 cars, yes. You connect a Windows laptop to the car with an ENET cable and we work over a screen-share. If your car needs anything physical, we tell you before booking.' },
      { q: 'What do I need for a remote session?', a: 'A Windows laptop with a stable internet connection, an ENET (Ethernet-to-OBD) cable, and the car parked with a battery charger or the engine able to keep the voltage up. We send a short checklist beforehand.' },
      { q: 'My BMW is from 2015 — will CarPlay work?', a: 'It depends on the head unit, not the year alone. Some 2015–2016 cars have NBT Evo and can be activated; others have NBT or EntryNav and cannot without new hardware. Your VIN tells us which.' },
      { q: 'Is there a yearly fee?', a: 'No. It is a one-off activation with no subscription.' },
    ],
    related: [
      { slug: 'apple-carplay-activation-dublin', label: 'CarPlay activation in Dublin' },
      { slug: 'bmw-fullscreen-carplay', label: 'fullscreen CarPlay' },
      { slug: 'bmw-id4-to-id6-upgrade', label: 'iDrive ID4 → ID6 update' },
      { slug: 'remote-bmw-coding-ireland', label: 'how remote coding works' },
    ],
    waMessage: 'Hi, I would like to check Apple CarPlay compatibility for my BMW. My VIN (last 7) is ',
    area: ['Ireland'],
  },

  'bmw-fullscreen-carplay': {
    slug: 'bmw-fullscreen-carplay',
    galleryMatch: ['fullscreen','carplay'],
    metaTitle: 'BMW Fullscreen CarPlay | Use the Whole Widescreen — Dublin & Ireland',
    metaDescription:
      'BMW fullscreen CarPlay on widescreen NBT Evo displays: CarPlay across the full 10.25" screen instead of a window. Compatibility checked from your VIN. Dublin & remote.',
    serviceName: 'BMW Fullscreen CarPlay',
    eyebrow: 'Apple CarPlay · Widescreen displays',
    h1: 'BMW Fullscreen CarPlay — Use the Whole Screen',
    heroSub:
      'On many BMWs with the 10.25" widescreen, CarPlay opens in a smaller window with a BMW panel beside it. Where your software supports it, we set CarPlay to fill the full width of the display.',
    price: { amount: 150, text: 'Included with CarPlay activation on supported cars · from €150' },
    intro: [
      'BMW’s widescreen displays are wide and short, and on NBT Evo cars CarPlay often appears as a box with a strip of BMW information next to it. Maps and album art end up smaller than they need to be.',
      'On supported builds the CarPlay view can be switched to use the whole display. Whether your car supports it depends on the head unit and its software level — some ID5 cars need the ID6 software update first. We check this from your VIN before you book, and if fullscreen is not possible on your build we say so.',
      'Cars with the smaller 6.5" or 8.8" screens already use most of the display for CarPlay, so fullscreen is mainly relevant to the 10.25" widescreen.',
    ],
    includedHeading: 'What changes',
    included: [
      'CarPlay across the full width of the widescreen display, where supported',
      'Larger maps, album art and messages',
      'Works with wired or wireless CarPlay, whichever your car has',
      'Done together with CarPlay activation, or on cars that already have CarPlay',
    ],
    modelsHeading: 'Where it applies',
    models: [
      'NBT Evo with the 10.25" widescreen (F-series, roughly 2016–2019)',
      'ID5 software may need the ID6 update first (+€50)',
      'iDrive 7 (MGU) already shows CarPlay large; split-screen options vary by version',
      'Exact support confirmed from your VIN',
    ],
    process: [
      { title: 'Send your VIN', body: 'We check the head unit, screen size and software level.' },
      { title: 'Update if needed', body: 'If your software is too old for fullscreen, we tell you what it takes before booking.' },
      { title: 'Activate and set fullscreen', body: 'Remote over ENET or at your car around Dublin.' },
      { title: 'Check it on your phone', body: 'We test it with your iPhone before you pay.' },
    ],
    faqs: [
      { q: 'Why is my CarPlay only in a small window?', a: 'On NBT Evo widescreen cars BMW shows CarPlay in a window by default. On supported software it can be set to fill the whole display.' },
      { q: 'Does fullscreen CarPlay work on every BMW?', a: 'No. It depends on the head unit, the screen and the software level. Your VIN tells us whether your car supports it, and we will not book work that cannot be done.' },
      { q: 'I already have CarPlay. Can you just make it fullscreen?', a: 'Often yes. Send your VIN and a photo of the CarPlay screen and we will confirm what is needed and the price.' },
    ],
    related: [
      { slug: 'bmw-carplay-activation-ireland', label: 'CarPlay activation across Ireland' },
      { slug: 'bmw-id4-to-id6-upgrade', label: 'iDrive ID4 → ID6 update' },
      { slug: 'bmw-android-auto-activation', label: 'Android Auto activation' },
    ],
    waMessage: 'Hi, I would like fullscreen CarPlay on my BMW. My VIN (last 7) is ',
  },

  'bmw-id4-to-id6-upgrade': {
    slug: 'bmw-id4-to-id6-upgrade',
    galleryMatch: ['id6','id4','idrive update'],
    metaTitle: 'BMW iDrive ID4 to ID6 Upgrade | NBT Evo Software Update — Ireland',
    metaDescription:
      'Update an NBT Evo BMW from ID4 or ID5 to the ID6 interface: the newer tile menu and the software level CarPlay needs. €50, usually done with CarPlay. Dublin & remote.',
    serviceName: 'BMW iDrive ID4 to ID6 Upgrade',
    eyebrow: 'iDrive software · NBT Evo',
    h1: 'BMW iDrive ID4 → ID6 Upgrade',
    heroSub:
      'Early NBT Evo cars shipped with the older ID4 or ID5 software. Updating the same head unit to ID6 gives you the newer tile-based menu, and it is often the step that makes CarPlay possible.',
    price: { amount: 50, text: '€50 · usually done together with CarPlay activation' },
    intro: [
      'ID4, ID5 and ID6 are software versions of the same NBT Evo head unit, not different hardware. Cars built around 2016–2017 often still run ID4, which looks dated and does not support CarPlay. Updating the software to ID6 brings the live-tile home screen and the newer menus, and opens the door to CarPlay activation.',
      'The update is done with dealer-level tools over an ENET connection — remotely with your own laptop, or at your car around Dublin. Your settings, radio presets and coding are checked afterwards.',
      'Important: this only applies to NBT Evo. The original NBT (iDrive 4, roughly 2013–2016) and older CIC units are different hardware and cannot be updated to ID6. Your VIN tells us which one you have.',
    ],
    includedHeading: 'What the update gives you',
    included: [
      'ID6 live-tile home screen and newer menus',
      'The software level needed for CarPlay on most NBT Evo cars',
      'Done on your existing head unit — no new hardware',
      'Settings and coding checked after the update',
    ],
    modelsHeading: 'Compatible cars',
    models: [
      'NBT Evo head units running ID4 or ID5 software',
      'F-series such as F20/F21, F22, F30/F31, F32/F33/F36, F10/F11, F15/F16, F48 — if fitted with NBT Evo',
      'Not possible on NBT (non-Evo), CIC or EntryNav units',
      'Confirmed from your VIN before booking',
    ],
    process: [
      { title: 'Send your VIN', body: 'We confirm it is NBT Evo and which software it runs now.' },
      { title: 'Remote or visit', body: 'Your laptop and an ENET cable, or we come to the car around Dublin.' },
      { title: 'Update to ID6', body: 'The head unit is updated with dealer-level tools; this takes a while, so the car needs a stable battery supply.' },
      { title: 'Add CarPlay if you like', body: 'Most people activate CarPlay in the same session.' },
    ],
    faqs: [
      { q: 'How do I know if I have ID4, ID5 or ID6?', a: 'ID6 has a home screen of live tiles; ID4 and ID5 open on a list menu. The surest way is the VIN — send us the last 7 characters.' },
      { q: 'Do I need ID6 for CarPlay?', a: 'On most NBT Evo cars running ID4, yes — CarPlay needs the newer software. ID5 cars can often be activated directly. We confirm from your VIN.' },
      { q: 'Can my NBT (iDrive 4) be upgraded to ID6?', a: 'No. NBT and NBT Evo are different hardware; ID6 only runs on NBT Evo. If you have NBT, we will tell you honestly what is and is not possible.' },
      { q: 'Is it reversible?', a: 'It is a software update to a newer official version. There is normally no reason to go back, and nothing physical is changed.' },
    ],
    related: [
      { slug: 'bmw-carplay-activation-ireland', label: 'CarPlay activation across Ireland' },
      { slug: 'bmw-fullscreen-carplay', label: 'fullscreen CarPlay' },
      { slug: 'bmw-idrive-upgrade-ireland', label: 'all iDrive upgrade options' },
      { slug: 'bmw-map-updates-fsc-codes', label: 'navigation map updates' },
    ],
    waMessage: 'Hi, I would like to update my BMW iDrive from ID4 to ID6. My VIN (last 7) is ',
  },

  'bmw-6wa-to-6wb-retrofit': {
    slug: 'bmw-6wa-to-6wb-retrofit',
    galleryMatch: ['6wb','cluster'],
    metaTitle: 'BMW 6WA to 6WB Retrofit | Digital Instrument Cluster — Dublin',
    metaDescription:
      'BMW 6WA to 6WB retrofit in Dublin: replace the analogue dials with the full digital instrument cluster, coded to your car. Mobile visit. Quoted after VIN check.',
    serviceName: 'BMW 6WA to 6WB Retrofit',
    eyebrow: 'Retrofit · Mobile visit · Dublin',
    h1: 'BMW 6WA → 6WB Digital Cluster Retrofit',
    heroSub:
      'Swap the analogue dials (6WA) for BMW’s full digital instrument cluster (6WB), with drive-mode layouts that change colour in Sport and Eco Pro. Fitted and coded so it works as if it came from the factory.',
    price: { text: 'Quoted per car after VIN check (depends on cluster and parts)' },
    intro: [
      '6WA and 6WB are BMW option codes. 6WA is the familiar cluster with analogue needles and a small display; 6WB is the full TFT digital cluster with themed layouts for Comfort, Sport and Eco Pro, and room for navigation and media information.',
      'The retrofit means fitting a 6WB cluster and then coding the car to accept it — vehicle order, cluster coding and checks on the rest of the system. This is physical work on the car, so it is done as a mobile visit, not remotely.',
      'Mileage is handled properly. The car keeps its own odometer reading; the replacement cluster must not show higher mileage than your car, and we never alter odometer readings. We help you source the right cluster for your build.',
    ],
    includedHeading: 'What the retrofit includes',
    included: [
      'Fitting the 6WB digital cluster in place of the 6WA unit',
      'Vehicle order and cluster coding so the car recognises it',
      'Drive-mode layouts (Comfort / Sport / Eco Pro) working',
      'Fault memory checked and cleared afterwards',
      'Advice on sourcing the correct cluster for your car',
    ],
    modelsHeading: 'Compatible cars',
    models: [
      'Many F-series models, e.g. F20/F21, F22, F30/F31/F34, F32/F33/F36 — depending on build date',
      'Some cars need extra modules or wiring; we check this first',
      'Not a remote job — mobile visit around Dublin, Kildare, Wicklow & Meath',
      'Compatibility and price confirmed from your VIN',
    ],
    process: [
      { title: 'Send your VIN', body: 'We check whether your build supports 6WB and what parts are needed.' },
      { title: 'Get a fixed quote', body: 'You get one price for the work before anything is ordered.' },
      { title: 'Fit and code', body: 'We come to the car, fit the cluster and code it.' },
      { title: 'Test drive check', body: 'Every layout and warning checked before you pay.' },
    ],
    faqs: [
      { q: 'What is the difference between 6WA and 6WB?', a: '6WA is the analogue cluster with a small screen; 6WB is the full digital cluster with themed layouts per drive mode.' },
      { q: 'Will my mileage change?', a: 'No. The car keeps its own mileage, and the replacement cluster must not show more than your car. We never alter odometer readings.' },
      { q: 'Can this be done remotely?', a: 'No — the cluster has to be physically fitted, so it is a mobile visit.' },
      { q: 'How much does it cost?', a: 'It depends on your car and on the cluster you get. Send your VIN and we will give a fixed price before anything is ordered.' },
    ],
    related: [
      { slug: 'bmw-retrofits-dublin', label: 'all BMW retrofits' },
      { slug: 'bmw-id4-to-id6-upgrade', label: 'iDrive ID4 → ID6 update' },
      { slug: 'bmw-f30-coding', label: 'F30 coding' },
    ],
    waMessage: 'Hi, I would like a 6WA to 6WB cluster retrofit on my BMW. My VIN (last 7) is ',
  },

  'bmw-idrive-upgrade-ireland': {
    slug: 'bmw-idrive-upgrade-ireland',
    galleryMatch: ['id6','idrive','screen upgrade','carplay'],
    metaTitle: 'BMW iDrive Upgrade Ireland | What Your iDrive Can Become',
    metaDescription:
      'BMW iDrive upgrades across Ireland by system: CIC, NBT, NBT Evo, iDrive 7 and 8. Software updates, CarPlay, maps and what really needs new hardware. Checked from your VIN.',
    serviceName: 'BMW iDrive Upgrade Ireland',
    eyebrow: 'iDrive · Every generation',
    h1: 'BMW iDrive Upgrades — What Your System Can Become',
    heroSub:
      'Which upgrade makes sense depends entirely on which iDrive you have. Here is what is realistic for each generation — and what would need new hardware.',
    intro: [
      'BMW has used several head units over the years: CIC, NBT, NBT Evo, MGU (iDrive 7) and iDrive 8. Some upgrades are pure software and quick; others need different hardware and are not worth doing on every car. We would rather tell you that than sell you the wrong job.',
      'Send the last 7 characters of your VIN and we will reply with the system you have and the upgrades that actually make sense for it, with prices.',
    ],
    includedHeading: 'Upgrades we do',
    included: [
      'ID4 / ID5 → ID6 software update on NBT Evo (€50)',
      'Apple CarPlay activation (NBT Evo €150 · iDrive 7 €220)',
      'Android Auto on iDrive 7 (€200); iDrive 8 per car',
      'Navigation map updates',
      'Japan-import conversions to EU radio, language and navigation (from €250)',
      'Coding: fullscreen CarPlay, video in motion (passenger use only), menus and more',
    ],
    modelsHeading: 'By system',
    models: [
      'CIC (roughly 2008–2013): maps and coding; CarPlay needs a different head unit',
      'NBT / iDrive 4 (roughly 2013–2016): maps and coding; CarPlay usually needs new hardware',
      'NBT Evo / iDrive 5–6 (roughly 2016–2019): ID6 update, CarPlay, fullscreen, maps',
      'MGU / iDrive 7 (roughly 2019+): CarPlay, Android Auto, maps, coding',
      'iDrive 8 / 8.5: checked per car — software version decides',
    ],
    process: [
      { title: 'Send your VIN', body: 'We identify the exact system and software level.' },
      { title: 'Get options and prices', body: 'Only upgrades that will work on your car, with the price for each.' },
      { title: 'Remote or visit', body: 'Software work remotely across Ireland, or at your car around Dublin.' },
      { title: 'Pay once it works', body: 'Everything is shown working before payment.' },
    ],
    faqs: [
      { q: 'How do I know which iDrive I have?', a: 'The quickest way is your VIN. Roughly: a list-style menu on an older car is CIC or NBT; a live-tile home screen is NBT Evo ID6; a curved or wide G-series display is iDrive 7 or 8.' },
      { q: 'Can you put a newer head unit in my older BMW?', a: 'Sometimes, but it involves hardware, wiring and coding, and is not cost-effective on every car. Send your VIN and we will tell you honestly whether it is worth it.' },
      { q: 'Can upgrades be done remotely?', a: 'Software updates, CarPlay activation and most coding, yes — with a Windows laptop and an ENET cable. Anything involving hardware needs a visit.' },
    ],
    related: [
      { slug: 'bmw-id4-to-id6-upgrade', label: 'ID4 → ID6 update' },
      { slug: 'bmw-carplay-activation-ireland', label: 'CarPlay activation across Ireland' },
      { slug: 'bmw-map-updates-fsc-codes', label: 'navigation map updates' },
      { slug: 'japan-import-bmw-conversion-ireland', label: 'Japan import conversion' },
    ],
    waMessage: 'Hi, I would like to know which iDrive upgrades are possible on my BMW. My VIN (last 7) is ',
    area: ['Ireland'],
  },
};
