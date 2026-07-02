const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

// llms.txt — a concise, LLM-friendly summary of the business (emerging
// convention, like robots.txt for AI assistants). Plain markdown.
const BODY = `# BMW Coding (bmwcoding.ie)

> Independent BMW coding, diagnostics and retrofit service based in Dublin,
> Ireland. In-person across Dublin, Kildare, Wicklow and Meath; remote coding
> over ENET anywhere in Ireland. F-series and G-series BMWs (NBT, NBT Evo,
> MGU / iDrive 6-8). Tooling: ISTA/Rheingold, E-Sys + PSdZData, BimmerCode.
> Payment on completion. Not affiliated with BMW AG.

## Services
- [BMW Coding Dublin](${SITE_URL}/bmw-coding-dublin): hidden features, iDrive and comfort coding
- [Apple CarPlay Activation](${SITE_URL}/apple-carplay-activation-dublin): wired/wireless CarPlay on NBT Evo and MGU, from EUR 120
- [Android Auto Activation](${SITE_URL}/bmw-android-auto-activation): iDrive 7 (MGU) builds
- [BMW Diagnostics](${SITE_URL}/bmw-diagnostics-dublin): full ISTA fault scan with written summary, from EUR 80
- [BMW Retrofits](${SITE_URL}/bmw-retrofits-dublin): ambient lighting, cruise control, Comfort Access
- [Japan Import Conversion](${SITE_URL}/japan-import-bmw-conversion-ireland): region change, FSC, EU maps, from EUR 150
- [Map Updates & FSC Codes](${SITE_URL}/bmw-map-updates-fsc-codes): navigation activation and updates
- [Remote BMW Coding](${SITE_URL}/remote-bmw-coding-ireland): ENET sessions anywhere in Ireland

## Reference
- [Full coding list](${SITE_URL}/bmw-coding-list): every codeable feature by category
- [Model checker](${SITE_URL}/models): what's possible per chassis and year
- [Guides](${SITE_URL}/blog): CarPlay NBT Evo vs MGU, F30 hidden features, remote coding prep

## Booking
- Book online with a preferred time slot: ${SITE_URL}/#contact
- Hours: Mon-Fri 19:00-23:00, Sat-Sun 11:00-23:00 (Europe/Dublin)
- Compatibility is confirmed from model, year and VIN before any work.
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
