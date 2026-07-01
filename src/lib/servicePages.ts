import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export type ServiceFaq = { q: string; a: string };
export type RelatedLink = { slug: string; label: string };

export type ServicePage = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  serviceName: string;
  eyebrow: string;
  h1: string;
  heroSub: string;
  intro: string[];
  includedHeading: string;
  included: string[];
  modelsHeading: string;
  models: string[];
  process: { title: string; body: string }[];
  faqs: ServiceFaq[];
  related: RelatedLink[];
  /** Short, pre-filled WhatsApp message for this service. */
  waMessage: string;
};

// Reusable honest closing note shown on every page.
const HONEST_NOTE =
  'What is possible depends on your exact model, year, head unit (NBT, NBT Evo or MGU) and software version, plus any installed hardware. We confirm compatibility from your model, year and VIN before any work starts.';

export const SERVICE_PAGES: Record<string, ServicePage> = {
  'bmw-coding-dublin': {
    slug: 'bmw-coding-dublin',
    metaTitle: 'BMW Coding Dublin | Hidden Features, iDrive Coding & Retrofits',
    metaDescription:
      'BMW coding in Dublin for F-Series and G-Series models. Hidden features, iDrive coding, comfort functions, ISTA diagnostics and retrofits. In-person and remote options.',
    serviceName: 'BMW Coding',
    eyebrow: 'BMW Coding · Dublin & Ireland',
    h1: 'BMW Coding Dublin — Hidden Features, iDrive Coding & Retrofits',
    heroSub:
      'Independent BMW coding in Dublin for F-Series and G-Series cars. We enable hidden features, fine-tune iDrive and comfort functions, and back it with ISTA diagnostics — in person around Dublin or remotely across Ireland where supported.',
    intro: [
      'BMW coding changes software parameters that already live inside your car. Instead of swapping parts, we adjust how the existing control units behave — enabling features that are dormant from the factory, tidying up convenience functions, and tailoring the car to how you actually drive it. Everything we change is reversible, and we can return any setting to factory before a dealer visit.',
      'We are an independent BMW coding team based in Dublin. Most work is done in person across Dublin, Kildare, Wicklow and Meath, and remote BMW coding is available across Ireland when your car and connection support it. You pay on completion, once the feature has been shown working on your car.',
    ],
    includedHeading: 'What BMW coding can enable',
    included: [
      'Apple CarPlay and, where supported, Android Auto activation',
      'Video in Motion and full screen functions while moving',
      'Comfort Access tweaks, auto-folding mirrors and one-touch windows',
      'Welcome / Coming Home lighting and ambient lighting coding',
      'Sport displays, M View instrument layouts and digital gauges',
      'Speed limit display, traffic sign recognition and Start/Stop memory',
      'Hidden menus, service functions and bespoke coding to your spec',
    ],
    modelsHeading: 'BMW models and systems we code',
    models: [
      'F-Series: F20, F21, F30, F31, F32, F36, F10, F11, F80, F82 and related chassis',
      'G-Series: G20, G30, G31, G01, G05 and other current platforms',
      'Head units: NBT, NBT Evo and MGU (iDrive 6, 7 and 8)',
      'Tooling: ISTA / Rheingold, E-Sys with PSdZData, BimmerCode and ENET / OBD',
    ],
    process: [
      { title: 'Send your details', body: 'Message us your model, year, VIN-derived build and what you want enabled. We confirm what is realistic on your exact car before you commit to anything.' },
      { title: 'In person or remote', body: 'We come to the car around Dublin, or you connect a laptop and ENET cable for remote coding anywhere in Ireland where supported.' },
      { title: 'Code and verify', body: 'We apply the coding, show each feature working, and document anything worth noting. Diagnostics and conversion prices are agreed up front.' },
      { title: 'Pay on completion', body: 'You see the result before you pay. Card or cash, no dealer queue and no upfront deposit.' },
    ],
    faqs: [
      { q: 'Which BMW models do you code?', a: 'F-Series and G-Series cars with NBT, NBT Evo and MGU head units (iDrive 6/7/8). Send your model, year and VIN-derived build and we will confirm exactly what is possible on your car.' },
      { q: 'Will coding affect my BMW warranty?', a: 'Coding adjusts software values that already exist in the car and is reversible. We can return any setting to factory before a dealer visit, and we will tell you up front if a request is likely to be flagged.' },
      { q: 'Can BMW coding be done remotely?', a: 'Yes, for many functions. You connect a laptop with an ENET cable to the OBD port and we code over the connection. Some coding and all hardware retrofits need to be done in person.' },
      { q: 'How long does BMW coding take?', a: 'Most coding sessions take from thirty minutes to a couple of hours depending on how many features are involved and whether diagnostics are needed first.' },
    ],
    related: [
      { slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay activation' },
      { slug: 'bmw-diagnostics-dublin', label: 'BMW diagnostics with ISTA' },
      { slug: 'bmw-retrofits-dublin', label: 'BMW retrofits in Dublin' },
      { slug: 'remote-bmw-coding-ireland', label: 'remote BMW coding across Ireland' },
    ],
    waMessage: 'Hi — I’d like BMW coding in Dublin. My car is a ',
  },

  'apple-carplay-activation-dublin': {
    slug: 'apple-carplay-activation-dublin',
    metaTitle: 'BMW Apple CarPlay Activation Dublin | Wireless CarPlay Coding',
    metaDescription:
      'Activate BMW Apple CarPlay in Dublin. Wireless CarPlay, NBT Evo, MGU and supported iDrive systems. Remote and in-person activation available.',
    serviceName: 'BMW Apple CarPlay Activation',
    eyebrow: 'Apple CarPlay · Dublin & Ireland',
    h1: 'BMW Apple CarPlay Activation Dublin — Wireless CarPlay Coding',
    heroSub:
      'Full Apple CarPlay activation for supported BMWs in Dublin and across Ireland. Wired or wireless CarPlay enabled on NBT, NBT Evo and MGU head units, in person or remotely over ENET.',
    intro: [
      'Many BMWs already have the hardware for Apple CarPlay but ship with it locked or trial-limited. We enable full, unrestricted CarPlay through coding — no subscription, no annual fee — so your iPhone connects every time you get in the car. On most NBT Evo and MGU systems this includes wireless CarPlay, with wired activation on systems that support it.',
      'Activation is available in person around Dublin and the surrounding counties, or remotely across Ireland when your car and connection allow it. We confirm your head unit and software version first so you know exactly what your car will get before booking.',
    ],
    includedHeading: 'What CarPlay activation includes',
    included: [
      'Full Apple CarPlay enabled — no trial limit, no subscription',
      'Wireless CarPlay on supported NBT Evo and MGU systems',
      'Wired CarPlay where the system supports it',
      'CarPlay integrated into the native iDrive interface',
      'Android Auto assessed and enabled where the system supports it',
      'A quick check that everything connects before you pay',
    ],
    modelsHeading: 'Supported head units and models',
    models: [
      'NBT Evo (ID5/ID6) — wired and wireless CarPlay on most builds',
      'MGU (iDrive 7/8) — wireless CarPlay; Android Auto on supported builds',
      'NBT — assessed per car; CarPlay support depends on build and hardware',
      'Common platforms: F30, F31, F32, F36, F10, G20, G30, G01, G05 and related',
    ],
    process: [
      { title: 'Confirm your system', body: 'Send your model, year and VIN-derived build. We identify your head unit and tell you whether wired, wireless or both are possible.' },
      { title: 'Book in or go remote', body: 'We meet the car around Dublin, or you connect a laptop and ENET cable for remote activation across Ireland where supported.' },
      { title: 'Activate and pair', body: 'We code CarPlay on, pair your iPhone and confirm it works on your screen before anything else.' },
      { title: 'Pay on completion', body: 'You only pay once CarPlay is running on your car. Activation starts from €120.' },
    ],
    faqs: [
      { q: 'Can you activate Apple CarPlay on my BMW?', a: 'On most NBT Evo and MGU systems, yes. Send your model, year and VIN-derived build and we will confirm whether wired, wireless or both are supported on your exact car.' },
      { q: 'Is wireless CarPlay included?', a: 'On supported NBT Evo and MGU head units, wireless CarPlay is included. Some older systems support wired CarPlay only — we confirm this before booking.' },
      { q: 'Is there a subscription after activation?', a: 'No. We enable full CarPlay through coding, so there is no trial limit and no annual fee once it is activated.' },
      { q: 'Can you also activate Android Auto?', a: 'Android Auto depends on the system — it is available on iDrive 7 (MGU) and assessed per car on other head units. Ask us with your build and we will check.' },
    ],
    related: [
      { slug: 'bmw-android-auto-activation', label: 'BMW Android Auto activation' },
      { slug: 'bmw-map-updates-fsc-codes', label: 'BMW map updates and FSC codes' },
      { slug: 'remote-bmw-coding-ireland', label: 'remote BMW coding across Ireland' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
    ],
    waMessage: 'Hi — I’d like Apple CarPlay activation on my BMW. My car is a ',
  },

  'bmw-android-auto-activation': {
    slug: 'bmw-android-auto-activation',
    metaTitle: 'BMW Android Auto Activation Ireland | iDrive 7 & MGU Coding',
    metaDescription:
      'BMW Android Auto activation for supported iDrive systems. Available in Dublin and remotely across Ireland where compatible.',
    serviceName: 'BMW Android Auto Activation',
    eyebrow: 'Android Auto · Dublin & Ireland',
    h1: 'BMW Android Auto Activation Ireland — iDrive 7 & MGU Coding',
    heroSub:
      'Android Auto activation for supported BMW iDrive systems in Dublin and across Ireland. Enabled through coding on MGU (iDrive 7) where the hardware and software allow it.',
    intro: [
      'Android Auto support on BMW arrived later than CarPlay and is tied closely to the head unit and software version. Where it is supported, we enable Android Auto through coding so your Android phone integrates into the native iDrive screen — maps, media and messages in the car’s own interface.',
      'Because compatibility is narrower than CarPlay, an honest compatibility check matters here. Send your model, year and VIN-derived build and we will tell you straight whether Android Auto is possible on your car before you book. Activation is available in person around Dublin or remotely across Ireland where supported.',
    ],
    includedHeading: 'What Android Auto activation includes',
    included: [
      'Android Auto enabled on supported MGU (iDrive 7) systems',
      'Integration into the native iDrive interface',
      'A clear compatibility check before booking',
      'Pairing and a working confirmation before you pay',
      'CarPlay activation handled in the same session if you want both',
    ],
    modelsHeading: 'Supported systems',
    models: [
      'MGU (iDrive 7) — Android Auto supported on most builds',
      'NBT Evo (iDrive 6) — assessed per car; support is limited and build-dependent',
      'Tooling: E-Sys with PSdZData and ENET / OBD',
      'Common platforms: G20, G30, G01, G05 and related G-Series cars',
    ],
    process: [
      { title: 'Compatibility check', body: 'Send your model, year and VIN-derived build. We confirm whether your iDrive supports Android Auto before anything is booked.' },
      { title: 'In person or remote', body: 'We come to the car around Dublin, or you connect a laptop and ENET cable for remote activation across Ireland where supported.' },
      { title: 'Activate and pair', body: 'We code Android Auto on, pair your phone and confirm it works on the iDrive screen.' },
      { title: 'Pay on completion', body: 'You pay once it is shown working. Activation starts from €120.' },
    ],
    faqs: [
      { q: 'Can you activate Android Auto on BMW iDrive?', a: 'On iDrive 7 (MGU) it is supported on most builds. On other head units it is limited and assessed per car — send your build and we will confirm before booking.' },
      { q: 'Why is Android Auto more limited than CarPlay?', a: 'BMW added Android Auto support later and tied it to specific head units and software. CarPlay is available on a wider range of systems, so compatibility needs checking for Android Auto first.' },
      { q: 'Can I have both CarPlay and Android Auto?', a: 'Where your system supports both, yes — we can activate them in the same session. We confirm what your exact car supports beforehand.' },
      { q: 'Can this be done remotely?', a: 'Yes, where supported. You connect a laptop and ENET cable to the OBD port and we activate over the connection.' },
    ],
    related: [
      { slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay activation' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'remote-bmw-coding-ireland', label: 'remote BMW coding across Ireland' },
      { slug: 'bmw-map-updates-fsc-codes', label: 'BMW map updates and FSC codes' },
    ],
    waMessage: 'Hi — I’d like Android Auto activation on my BMW. My car is a ',
  },

  'bmw-diagnostics-dublin': {
    slug: 'bmw-diagnostics-dublin',
    metaTitle: 'BMW Diagnostics Dublin | ISTA Fault Scan & Coding Checks',
    metaDescription:
      'BMW diagnostics in Dublin using ISTA. Fault scan, control unit check, coding issues, warning lights and written summary of findings.',
    serviceName: 'BMW Diagnostics',
    eyebrow: 'Diagnostics · Dublin & Ireland',
    h1: 'BMW Diagnostics Dublin — ISTA Fault Scan & Coding Checks',
    heroSub:
      'Dealer-level BMW diagnostics in Dublin using ISTA / Rheingold. A full fault scan across every control unit, a clear read on what the codes mean and a written summary you can act on.',
    intro: [
      'A warning light or a vague fault is rarely the whole story. We run a complete BMW diagnostic scan with ISTA / Rheingold — the same diagnostic platform used at dealer level — reading every control unit, not just the engine. You get the actual fault codes, a plain-English explanation of what they point to, and an honest view of what is worth doing next.',
      'Diagnostics are useful before buying a used BMW, after a warning light appears, or to confirm a coding or retrofit job is clean. We work in person across Dublin and the surrounding counties, and the price is agreed before we start so there are no surprises.',
    ],
    includedHeading: 'What a diagnostic session includes',
    included: [
      'Full fault scan across all control units with ISTA / Rheingold',
      'Read and clear stored and pending fault codes',
      'Plain-English explanation of what each code points to',
      'A written summary of findings and recommended next steps',
      'A check of coding and retrofit work where relevant',
      'Honest advice on what is worth fixing and what can wait',
    ],
    modelsHeading: 'Models and tooling',
    models: [
      'F-Series and G-Series across NBT, NBT Evo and MGU systems',
      'ISTA / Rheingold for diagnostics, E-Sys for coding checks',
      'ENET / OBD connection — in person around Dublin',
      'Pre-purchase scans for used BMW buyers',
    ],
    process: [
      { title: 'Tell us the symptoms', body: 'Send your model, year and what you are seeing — a warning light, a fault, or a pre-purchase check. We confirm the price before we start.' },
      { title: 'Full ISTA scan', body: 'We connect to the car around Dublin and read every control unit, capturing stored and pending codes.' },
      { title: 'Explain and summarise', body: 'We talk you through what the codes mean and send a written summary of findings and next steps.' },
      { title: 'Pay on completion', body: 'Diagnostics start from €80, agreed up front and paid once the work is done.' },
    ],
    faqs: [
      { q: 'Can you diagnose BMW faults with ISTA?', a: 'Yes. We run a full fault scan with ISTA / Rheingold across every control unit, then explain the codes and give you a written summary of findings.' },
      { q: 'Do you do pre-purchase BMW inspections?', a: 'We offer a full diagnostic scan that is ideal before buying a used BMW — it shows stored faults and the overall health of the control units. It is a software scan, not a mechanical inspection.' },
      { q: 'Will you clear the fault codes?', a: 'We can read and clear codes, but clearing without fixing the cause only hides the issue. We explain what each code means so you can decide what to address.' },
      { q: 'What information do you need?', a: 'Your model, year, VIN-derived build and a short description of the symptoms or warning lights. That lets us prepare and confirm the price before we arrive.' },
    ],
    related: [
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'bmw-retrofits-dublin', label: 'BMW retrofits in Dublin' },
      { slug: 'japan-import-bmw-conversion-ireland', label: 'Japan import BMW conversion' },
      { slug: 'remote-bmw-coding-ireland', label: 'remote BMW coding across Ireland' },
    ],
    waMessage: 'Hi — I’d like BMW diagnostics in Dublin. My car is a ',
  },

  'bmw-retrofits-dublin': {
    slug: 'bmw-retrofits-dublin',
    metaTitle: 'BMW Retrofits Dublin | Ambient Lighting, Cruise Control & Comfort Features',
    metaDescription:
      'BMW retrofit services in Dublin including ambient lighting, cruise control, folding mirrors, Comfort Access and coding support for F and G Series models.',
    serviceName: 'BMW Retrofits',
    eyebrow: 'Retrofits · Dublin & Ireland',
    h1: 'BMW Retrofits Dublin — Ambient Lighting, Cruise Control & Comfort Features',
    heroSub:
      'BMW retrofits in Dublin for F-Series and G-Series cars — ambient lighting, cruise control, Comfort Access, folding mirrors and more, fitted and coded so they work like factory.',
    intro: [
      'A retrofit adds hardware your car did not leave the factory with, then codes the car so it recognises and runs the new feature. Done properly it is indistinguishable from a factory option. We handle the wiring, the modules and the coding so the result is clean — ambient contour lighting, cruise control, Comfort Access, auto-folding mirrors and the convenience features owners miss most.',
      'Retrofits are in-person jobs around Dublin and the surrounding counties, and some need parts ordered first, so it is worth messaging early with your car details. We scope the full job up front — parts, labour and coding — so you know the cost before we begin.',
    ],
    includedHeading: 'Popular BMW retrofits',
    included: [
      'OEM-style ambient and contour lighting retrofit',
      'Cruise control retrofit and activation, including SZL and steering modules',
      'Comfort Access (keyless) tweaks and retrofit support',
      'Auto-folding mirrors on lock and Welcome / Coming Home lighting',
      'Sport displays, M View layouts and digital instrument features',
      'Coding to integrate retrofitted hardware so it runs like factory',
    ],
    modelsHeading: 'Models and what is involved',
    models: [
      'F-Series: F20, F30, F31, F32, F36, F10, F80, F82 and related chassis',
      'G-Series: G20, G30, G31, G01, G05 and related platforms',
      'Hardware retrofits are in-person and may need parts ordered first',
      'Tooling: ISTA, E-Sys with PSdZData and ENET / OBD for coding',
    ],
    process: [
      { title: 'Scope the job', body: 'Send your model, year and the feature you want. We confirm whether it is a coding job, a hardware retrofit, or both, and what parts are needed.' },
      { title: 'Order and book', body: 'Where parts are required we source them first, then arrange an in-person fit around Dublin and the surrounding counties.' },
      { title: 'Fit and code', body: 'We install the hardware, code the car to recognise it and show the feature working.' },
      { title: 'Pay on completion', body: 'The full job — parts, labour and coding — is quoted up front and paid once it is finished and shown working.' },
    ],
    faqs: [
      { q: 'Can you retrofit hardware, not just code?', a: 'Yes. Ambient lighting, cruise control and similar retrofits that need wiring or modules are a regular job. They are in-person only and some need parts ordered first.' },
      { q: 'Is a retrofit reversible?', a: 'The coding is reversible. Hardware can usually be removed, but a clean retrofit is designed to stay and run like a factory option.' },
      { q: 'How much does a BMW retrofit cost?', a: 'It depends on the feature, the parts and the labour involved. We scope the full job and quote it up front before any work or ordering begins.' },
      { q: 'Which retrofits are most popular?', a: 'Ambient lighting, cruise control, Comfort Access and auto-folding mirrors are the most requested. Tell us your car and we will confirm what is possible.' },
    ],
    related: [
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'bmw-diagnostics-dublin', label: 'ISTA diagnostics' },
      { slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay activation' },
      { slug: 'remote-bmw-coding-ireland', label: 'remote BMW coding across Ireland' },
    ],
    waMessage: 'Hi — I’d like a BMW retrofit in Dublin. My car is a ',
  },

  'japan-import-bmw-conversion-ireland': {
    slug: 'japan-import-bmw-conversion-ireland',
    metaTitle: 'Japan Import BMW Conversion Ireland | BMW Region Change & Map Updates',
    metaDescription:
      'BMW Japan to EU conversion in Ireland. Region change, navigation FSC, map updates, ETC mirror and TCB checks for Japanese import BMW models.',
    serviceName: 'Japan to EU BMW Conversion',
    eyebrow: 'Japan Import · Dublin & Ireland',
    h1: 'Japan Import BMW Conversion Ireland — Region Change & Map Updates',
    heroSub:
      'Full Japan-to-EU conversion for imported BMWs in Ireland. Region change, navigation FSC and European maps, ETC mirror handling and TCB checks so a JDM import works properly here.',
    intro: [
      'A Japanese import BMW is built for the JDM market — its navigation, radio bands, language and some convenience modules are set up for Japan, not Ireland. Converting it is a regular job for us: we change the region so the car runs as a European model, generate the navigation FSC and load European maps, and address the details that catch imports out, like the ETC mirror module and TCB considerations.',
      'The work is available in Ireland, in person around Dublin and the surrounding counties. Because every import is slightly different, we confirm exactly what your specific car needs first — JDM specs vary by year and build, and an honest scope up front saves time and cost.',
    ],
    includedHeading: 'What a Japan to EU conversion covers',
    included: [
      'Region change so the car runs as a European-spec model',
      'Navigation FSC generation and European map installation',
      'Radio band and language set-up for Ireland and the EU',
      'ETC mirror module handling common on JDM imports',
      'TCB and telematics considerations checked and addressed',
      'A full diagnostic scan to confirm the import is healthy',
    ],
    modelsHeading: 'Imports and systems we handle',
    models: [
      'F-Series and G-Series JDM imports with NBT, NBT Evo and MGU',
      'Navigation FSC and EU maps for compatible systems',
      'Region, band and language conversion to EU spec',
      'Tooling: ISTA, E-Sys with PSdZData and ENET / OBD',
    ],
    process: [
      { title: 'Send import details', body: 'Give us the model, year and VIN-derived build. We confirm what your JDM import needs and quote the conversion before starting.' },
      { title: 'Convert the car', body: 'We change the region, generate the FSC, load EU maps and address the import-specific modules around Dublin.' },
      { title: 'Verify and scan', body: 'We confirm navigation, radio and convenience features work, and run a diagnostic scan to check the car is clean.' },
      { title: 'Pay on completion', body: 'Conversions start from €150, agreed up front and paid once the work is shown done.' },
    ],
    faqs: [
      { q: 'Can you code Japanese import BMWs for Ireland?', a: 'Yes. Japan to EU conversion is a regular job — region change, navigation FSC, European maps, ETC mirror handling and TCB checks. Send the details and we will tell you exactly what your car needs.' },
      { q: 'Will the navigation work with European maps?', a: 'On compatible systems we generate the navigation FSC and install European maps so the navigation works here. We confirm your head unit supports it before booking.' },
      { q: 'What is the ETC mirror issue on imports?', a: 'Japanese imports often have an ETC toll module tied to the mirror that can cause faults here. We handle it as part of a proper conversion.' },
      { q: 'How long does a conversion take?', a: 'Most conversions are completed in a single in-person session, though map installation and FSC generation can add time depending on the system.' },
    ],
    related: [
      { slug: 'bmw-map-updates-fsc-codes', label: 'BMW map updates and FSC codes' },
      { slug: 'bmw-diagnostics-dublin', label: 'ISTA diagnostics' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'remote-bmw-coding-ireland', label: 'remote BMW coding across Ireland' },
    ],
    waMessage: 'Hi — I have a Japanese import BMW and I’d like it converted for Ireland. My car is a ',
  },

  'bmw-map-updates-fsc-codes': {
    slug: 'bmw-map-updates-fsc-codes',
    metaTitle: 'BMW Map Updates & FSC Codes Ireland | Navigation Activation',
    metaDescription:
      'BMW navigation map updates and FSC codes in Ireland. Activation and map support for compatible NBT, NBT Evo and MGU systems.',
    serviceName: 'BMW Map Updates & FSC Codes',
    eyebrow: 'Map Updates · Dublin & Ireland',
    h1: 'BMW Map Updates & FSC Codes Ireland — Navigation Activation',
    heroSub:
      'BMW navigation map updates and FSC code generation in Ireland. Bring your maps up to date and activate navigation on compatible NBT, NBT Evo and MGU systems.',
    intro: [
      'BMW navigation runs on map data that needs periodic updating, and each update is authorised by an FSC (Freischaltcode) tied to your car. We update the maps on compatible systems and generate the FSC so the navigation accepts them — handy after an import, after a head-unit change, or simply when your maps are years out of date.',
      'Map and FSC work is available in Ireland, in person around Dublin and, on some systems, remotely. Compatibility depends on your head unit and current software, so we confirm what your car supports before booking and tell you honestly if an update is not worthwhile on your system.',
    ],
    includedHeading: 'What map and FSC work covers',
    included: [
      'Latest compatible European map data installed',
      'Navigation FSC generation and activation',
      'Navigation enabled after an import or head-unit change',
      'A check that the navigation reads and runs the new maps',
      'Advice on what your specific system can and cannot take',
    ],
    modelsHeading: 'Supported systems',
    models: [
      'NBT and NBT Evo — map updates and FSC where supported',
      'MGU (iDrive 7/8) — map handling assessed per car',
      'Navigation activation after import or retrofit',
      'Tooling: E-Sys with PSdZData and ENET / OBD',
    ],
    process: [
      { title: 'Confirm your system', body: 'Send your model, year and VIN-derived build. We identify your head unit and confirm what map and FSC work is possible.' },
      { title: 'Update and activate', body: 'We install the latest compatible maps and generate the FSC so the navigation accepts them, around Dublin or remotely where supported.' },
      { title: 'Verify navigation', body: 'We confirm the navigation reads the new maps and runs correctly before you pay.' },
      { title: 'Pay on completion', body: 'Priced on request depending on the system and work involved, agreed before we start.' },
    ],
    faqs: [
      { q: 'Can you update BMW maps and FSC codes?', a: 'Yes, on compatible systems. We install the latest map data and generate the navigation FSC so your car accepts the update. We confirm your head unit supports it first.' },
      { q: 'What is an FSC code?', a: 'An FSC (Freischaltcode) is an authorisation code tied to your car that unlocks or validates features like navigation maps. The right FSC lets the system accept updated maps.' },
      { q: 'My import has no navigation — can you activate it?', a: 'On compatible systems we can generate the FSC and install maps to activate navigation, which is common after a Japanese import. Send your build and we will confirm.' },
      { q: 'Can map updates be done remotely?', a: 'Some FSC work can be done remotely, but full map installation often needs the car in person. We tell you which applies to your system.' },
    ],
    related: [
      { slug: 'japan-import-bmw-conversion-ireland', label: 'Japan import BMW conversion' },
      { slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay activation' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'bmw-diagnostics-dublin', label: 'ISTA diagnostics' },
    ],
    waMessage: 'Hi — I’d like a BMW map update / FSC code. My car is a ',
  },

  'remote-bmw-coding-ireland': {
    slug: 'remote-bmw-coding-ireland',
    metaTitle: 'Remote BMW Coding Ireland | ENET Coding for BMW F & G Series',
    metaDescription:
      'Remote BMW coding across Ireland. Connect your BMW with a laptop and ENET cable for supported coding, CarPlay, diagnostics and feature activation.',
    serviceName: 'Remote BMW Coding',
    eyebrow: 'Remote Coding · All of Ireland',
    h1: 'Remote BMW Coding Ireland — ENET Coding for F & G Series',
    heroSub:
      'Remote BMW coding anywhere in Ireland. Connect your car with a laptop and an ENET cable and we code it over the connection — CarPlay, feature activation and supported diagnostics, no travel needed.',
    intro: [
      'If you are outside the Dublin area, you do not have to drive to us. With a laptop and an inexpensive ENET cable plugged into your car’s OBD port, we connect remotely and code the car as if we were sitting in it. It is the same coding, done over a screen-share session at a time that suits you — popular with owners in Cork, Galway, Limerick, Waterford and right across Ireland.',
      'Remote coding covers most software features: CarPlay activation, comfort and convenience coding, hidden features and many diagnostic tasks. Hardware retrofits and a small number of coding jobs still need the car in person, and we will always tell you up front which applies to your car.',
    ],
    includedHeading: 'What remote coding can do',
    included: [
      'Apple CarPlay activation on supported systems',
      'Comfort, convenience and hidden-feature coding',
      'Sport displays, M View and instrument coding',
      'Many diagnostic and fault-reading tasks over the connection',
      'A compatibility check before you commit to anything',
      'Guidance on the cheap ENET cable you need to get started',
    ],
    modelsHeading: 'What you need and what is supported',
    models: [
      'A Windows laptop and an ENET (OBD) cable — we guide you on both',
      'F-Series and G-Series with NBT, NBT Evo and MGU systems',
      'A stable connection for the screen-share session',
      'In-person only: hardware retrofits and a few coding jobs',
    ],
    process: [
      { title: 'Check compatibility', body: 'Send your model, year and VIN-derived build. We confirm what can be done remotely on your car before booking.' },
      { title: 'Get set up', body: 'You plug the ENET cable into the OBD port and connect the laptop. We guide you through it if it is your first time.' },
      { title: 'Code remotely', body: 'We connect over a screen-share session and code the car, showing each feature working as we go.' },
      { title: 'Pay on completion', body: 'You pay once the features are running, exactly as you would for an in-person session.' },
    ],
    faqs: [
      { q: 'Can BMW coding be done remotely across Ireland?', a: 'Yes. With a laptop and an ENET cable in the OBD port, we connect remotely and code the car. It covers most software features, anywhere in Ireland.' },
      { q: 'Do I need an ENET cable for remote coding?', a: 'Yes — a standard ENET (OBD) cable, which is inexpensive. We tell you exactly which one to get before the session.' },
      { q: 'What can not be done remotely?', a: 'Hardware retrofits that need wiring or modules, and a small number of coding jobs, need the car in person. We confirm what applies to your car up front.' },
      { q: 'Is remote coding as safe as in person?', a: 'Yes. It is the same coding over a stable connection. We verify each change works and can revert anything that does not suit you.' },
    ],
    related: [
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay activation' },
      { slug: 'bmw-diagnostics-dublin', label: 'ISTA diagnostics' },
      { slug: 'bmw-android-auto-activation', label: 'BMW Android Auto activation' },
    ],
    waMessage: 'Hi — I’d like remote BMW coding. My car is a ',
  },
};

export const HONEST_COMPATIBILITY_NOTE = HONEST_NOTE;
export const ALL_SERVICE_SLUGS = Object.keys(SERVICE_PAGES);

/** Footer / homepage internal-link list. */
export const SERVICE_NAV: { slug: string; label: string }[] = [
  { slug: 'bmw-coding-dublin', label: 'BMW Coding Dublin' },
  { slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay Activation' },
  { slug: 'bmw-android-auto-activation', label: 'Android Auto Activation' },
  { slug: 'bmw-diagnostics-dublin', label: 'BMW Diagnostics' },
  { slug: 'bmw-retrofits-dublin', label: 'BMW Retrofits' },
  { slug: 'japan-import-bmw-conversion-ireland', label: 'Japan Import Conversion' },
  { slug: 'bmw-map-updates-fsc-codes', label: 'Map Updates & FSC Codes' },
  { slug: 'remote-bmw-coding-ireland', label: 'Remote BMW Coding' },
  { slug: 'bmw-coding-list', label: 'BMW Coding List' },
];

/** Build per-page Next.js metadata (title, description, canonical, OG, Twitter). */
export function serviceMetadata(slug: string): Metadata {
  const p = SERVICE_PAGES[slug];
  if (!p) return {};
  const url = `/${slug}`;
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}${url}`,
      siteName: 'BMW Coding',
      title: p.metaTitle,
      description: p.metaDescription,
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: `${p.serviceName} — BMW Coding IE` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: p.metaTitle,
      description: p.metaDescription,
      images: ['/og.jpg'],
    },
  };
}
