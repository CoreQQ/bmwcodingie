import type { ServicePage } from './servicePages';

// Standalone service landings that don't fit the chassis or county templates:
// high-intent searches with their own dedicated pages.
export const EXTRA_LANDINGS: Record<string, ServicePage> = {
  'bmw-hidden-features': {
    slug: 'bmw-hidden-features',
    metaTitle: "BMW Hidden Features Coding Dublin | Enable What's Already in Your Car",
    metaDescription: 'Enable BMW hidden features in Dublin or remotely across Ireland: Video in Motion, digital speed, folding mirrors, welcome lights and more. Reversible, pay on completion.',
    serviceName: 'BMW Hidden Features Coding',
    eyebrow: 'Coding · All F & G series',
    h1: 'BMW Hidden Features — What Your Car Can Already Do',
    heroSub:
      'Your BMW left the factory with dozens of features switched off in software. We enable them in Dublin — at your car, at our workshop off the N7, or remotely anywhere in Ireland.',
    intro: [
      'Every BMW ships with one software image and the options are simply toggled per market and spec. Hidden features coding turns on what is already in the car: no parts, no cutting, fully reversible. A typical session enables a personalised mix in under an hour.',
      'Send your model, year and VIN and we reply with the exact list your build supports — then you pick. You watch each feature demonstrated on the car before you pay.',
    ],
    includedHeading: 'Favourite hidden features',
    included: [
      'Video in Motion — full menus while driving',
      'Digital speed readout and sport displays in the cluster',
      'Auto-folding mirrors on lock · one-touch comfort windows',
      'Welcome light show and ambient lighting behaviour',
      'Seatbelt gong off · legal disclaimers off',
      'Auto Start/Stop memory — stays how you left it',
      'Enhanced Bluetooth, USB video playback and more',
    ],
    modelsHeading: 'Works on',
    models: [
      'All F-series (2010–2019) — full hidden-feature set',
      'All G-series (2017+) — iDrive 7/8 feature unlocks',
      'E-series on request — send the build',
      'Exact list confirmed from your VIN before booking',
    ],
    process: [
      { title: 'Send your build', body: 'Model, year and VIN — we reply with the feature list your car supports and a bundle price.' },
      { title: 'Pick your mix', body: 'Choose the features you want; bundles are priced together, not per toggle.' },
      { title: 'Code and demo', body: 'In person or remote over ENET — every feature demonstrated working before payment.' },
      { title: 'Reversible forever', body: 'Any setting can be returned to factory at any time.' },
    ],
    faqs: [
      { q: 'How many features can be enabled in one session?', a: 'As many as your build supports — a typical session enables 5–15. Bundles are priced as one job, so adding features costs little once we are connected.' },
      { q: 'Will hidden features affect my warranty or NCT?', a: 'The changes are software settings BMW themselves use in other markets, and everything is reversible before a dealer visit. Nothing we enable interferes with the NCT.' },
      { q: 'Can it be done remotely?', a: 'Yes — a Windows laptop and a €15 ENET cable is all you need, and we code over screen share anywhere in Ireland.' },
    ],
    related: [
      { slug: 'bmw-coding-list', label: 'the full coding list' },
      { slug: 'bmw-f-series-coding', label: 'F-series coding' },
      { slug: 'bmw-g-series-coding', label: 'G-series coding' },
    ],
    waMessage: "Hi — I'd like hidden features enabled on my BMW. It's a ",
  },
  'bmw-reverse-camera-retrofit': {
    slug: 'bmw-reverse-camera-retrofit',
    metaTitle: 'BMW Reverse Camera Retrofit Dublin | Factory-Style, Coded into iDrive',
    metaDescription: 'Factory-style BMW reverse camera retrofits in Dublin: OEM camera, proper wiring and iDrive coding with guidance lines. F and G series. See it working, pay on completion.',
    serviceName: 'BMW Reverse Camera Retrofit',
    eyebrow: 'Retrofit · Dublin & Ireland',
    h1: 'BMW Reverse Camera Retrofit — Genuine Look, Coded Right',
    heroSub:
      'Factory-style rear-view camera retrofits for F and G series BMWs in Dublin: proper camera, proper wiring, coded into iDrive so it works exactly like it left the factory that way.',
    intro: [
      'A camera retrofit has two halves: the hardware (camera, trunk-lid wiring, harness to the head unit) and the software (coding the car so iDrive shows guidance lines and switches automatically in reverse). We do both — no aftermarket screens, no taped-on modules.',
      'Done at our workshop off the N7 (Greenogue, Rathcoole). Most retrofits are same-day; you see it working and pay on completion.',
    ],
    includedHeading: 'What the retrofit includes',
    included: [
      'OEM-style rear camera fitted in the trunk handle strip',
      'Wiring from trunk lid to the head unit, routed factory-style',
      'Coding: automatic reverse switching + moving guidance lines',
      'Parking sensors integrated on cars that have PDC',
      'Full function demo before payment',
    ],
    modelsHeading: 'Typical cars',
    models: [
      'F30 / F31 / F32 3 & 4 Series — the most common retrofit',
      'F10 / F11 5 Series and F25 X3',
      'G20 / G30 with iDrive 7 — camera and view options',
      'Send your build for a firm parts + labour quote',
    ],
    process: [
      { title: 'Confirm the build', body: 'Model, year, head unit — we confirm the right camera kit and quote parts + labour.' },
      { title: 'Book the workshop slot', body: 'Camera retrofits are done at Greenogue (off the N7) — usually one visit.' },
      { title: 'Fit, wire, code', body: 'Hardware in, then the car is coded so iDrive behaves exactly like factory.' },
      { title: 'Demo and pay', body: 'Reverse in, see the lines move, pay on completion.' },
    ],
    faqs: [
      { q: 'How much does a reverse camera retrofit cost?', a: 'Depends on the chassis and head unit — parts plus fitting and coding are quoted as one price up front from your build. Send the year and VIN for an exact figure.' },
      { q: 'Will it look factory?', a: 'Yes — the camera sits in the factory position in the trunk-handle strip and iDrive switches views automatically, with guidance lines, exactly like an original-equipment car.' },
      { q: 'Can you do it remotely?', a: 'The coding half, yes — but a camera retrofit needs hardware fitted, so this one is an in-person job at the workshop.' },
    ],
    related: [
      { slug: 'bmw-retrofits-dublin', label: 'all BMW retrofits' },
      { slug: 'apple-carplay-activation-dublin', label: 'CarPlay activation' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
    ],
    waMessage: "Hi — I'm interested in a reverse camera retrofit for my BMW. It's a ",
  },
  'bmw-cruise-control-retrofit': {
    slug: 'bmw-cruise-control-retrofit',
    metaTitle: 'BMW Cruise Control Retrofit & Activation Dublin | Coding or Parts',
    metaDescription: 'Cruise control for your BMW: free VIN check tells you if coding alone enables it or which genuine parts are needed. Dublin workshop or remote coding across Ireland.',
    serviceName: 'BMW Cruise Control Retrofit',
    eyebrow: 'Retrofit · Dublin & Ireland',
    h1: 'BMW Cruise Control Activation & Retrofit',
    heroSub:
      'Many BMWs have cruise control hardware already in the car — it just needs coding. Others need a stalk or steering-wheel buttons. Either way, we sort it in Dublin or remotely.',
    intro: [
      'On a surprising number of F and G series cars, cruise control is a software option: the DSC and steering wheel already support it, and coding enables the function. Where hardware is missing (a stalk or multifunction buttons), we fit genuine parts and then code the car.',
      'Send your VIN and we tell you straight which case your car is — coding-only (cheaper) or parts + coding — with a firm price for each.',
    ],
    includedHeading: 'What we enable',
    included: [
      'Standard cruise control activation by coding (where supported)',
      'Multifunction steering-wheel button retrofits',
      'Cruise stalk fitting on cars that use one',
      'Speed limiter function where the build supports it',
      'Full demo on a road test before payment',
    ],
    modelsHeading: 'Coding-only vs parts',
    models: [
      'Many F-series with multifunction wheels: coding-only',
      'Base wheels without buttons: buttons or stalk + coding',
      'G-series: often option-coding on existing hardware',
      'We confirm which case yours is from the VIN — free',
    ],
    process: [
      { title: 'VIN check', body: 'We read the option list from your VIN and tell you if coding alone will do it.' },
      { title: 'Parts if needed', body: 'Genuine buttons or stalk sourced and quoted before you commit.' },
      { title: 'Fit and code', body: 'At the car, at the workshop off the N7, or coding-only jobs remotely.' },
      { title: 'Road test', body: 'You test cruise working before you pay.' },
    ],
    faqs: [
      { q: 'My steering wheel has no cruise buttons — is it still possible?', a: 'Usually yes: we retrofit the multifunction buttons or stalk and then code the function. The VIN check tells us exactly which parts your car needs.' },
      { q: 'How much does cruise control activation cost?', a: 'Coding-only activations are the cheapest case; parts + coding depends on which hardware your car needs. Both are quoted firmly up front from the VIN — no surprises.' },
      { q: 'Can distance-keeping (ACC) be added?', a: 'Active Cruise Control needs a front radar the car was built with — we are honest about this: if your car lacks the radar, we will say so rather than sell you a half-solution.' },
    ],
    related: [
      { slug: 'bmw-retrofits-dublin', label: 'all BMW retrofits' },
      { slug: 'bmw-hidden-features', label: 'hidden features coding' },
      { slug: 'bmw-coding-list', label: 'the full coding list' },
    ],
    waMessage: "Hi — I'd like cruise control on my BMW. It's a ",
  },
};
