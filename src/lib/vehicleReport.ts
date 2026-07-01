import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type ReportSection = { title: string; rows: [string, string][] };

export type VehicleReport = {
  vin: string;
  date: string;
  title: string; // e.g. "BMW 328i · 3-Series · 2012"
  sections: ReportSection[];
  website: string;
};

const BLUE = rgb(0.11, 0.41, 0.83);
const MBLUE = rgb(0.18, 0.61, 0.9);
const MDARK = rgb(0.04, 0.31, 0.69);
const MRED = rgb(0.89, 0, 0.1);
const INK = rgb(0.1, 0.11, 0.13);
const GREY = rgb(0.45, 0.47, 0.5);
const HAIR = rgb(0.82, 0.83, 0.85);

const A4 = { w: 595.28, h: 841.89 };
const M = 50;

/** Render a branded A4 vehicle report from decoded VIN data. */
export async function buildVehicleReportPdf(data: VehicleReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([A4.w, A4.h]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const right = A4.w - M;
  const sw = (A4.w - 2 * M) / 3;

  const rt = (t: string, y: number, size: number, f = font, color = INK) =>
    page.drawText(t, { x: right - f.widthOfTextAtSize(t, size), y, size, font: f, color });

  // Header stripe + brand
  [MBLUE, MDARK, MRED].forEach((c, i) =>
    page.drawRectangle({ x: M + i * sw, y: A4.h - 36, width: sw, height: 6, color: c }),
  );
  page.drawText('BMW Coding', { x: M, y: A4.h - 78, size: 26, font: bold, color: INK });
  page.drawText('CODING · DIAGNOSTICS · RETROFITS', { x: M, y: A4.h - 94, size: 8, font, color: GREY });
  rt('VEHICLE REPORT', A4.h - 74, 18, bold, BLUE);
  rt(`VIN ${data.vin}`, A4.h - 92, 10, font, GREY);
  rt(data.date, A4.h - 106, 10, font, GREY);

  // Vehicle title
  page.drawText(data.title, { x: M, y: A4.h - 132, size: 15, font: bold, color: INK });
  page.drawLine({ start: { x: M, y: A4.h - 146 }, end: { x: right, y: A4.h - 146 }, thickness: 1, color: HAIR });

  let y = A4.h - 172;
  const ensureSpace = (needed: number) => {
    if (y - needed < 90) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - 60;
    }
  };

  for (const section of data.sections) {
    if (!section.rows.length) continue;
    ensureSpace(28 + section.rows.length * 18);
    page.drawText(section.title.toUpperCase(), { x: M, y, size: 9, font: bold, color: BLUE });
    y -= 16;
    for (const [k, v] of section.rows) {
      page.drawText(k, { x: M, y, size: 10, font, color: GREY });
      const val = v.length > 62 ? `${v.slice(0, 61)}…` : v;
      page.drawText(val, { x: M + 180, y, size: 10, font, color: INK });
      y -= 17;
    }
    y -= 10;
  }

  // Footer
  page.drawText('Decoded from public VIN data (NHTSA vPIC). Factory option list not included.', {
    x: M, y: 74, size: 8, font, color: GREY,
  });
  page.drawText(data.website, { x: M, y: 60, size: 9, font, color: GREY });
  [MBLUE, MDARK, MRED].forEach((c, i) =>
    page.drawRectangle({ x: M + i * sw, y: 44, width: sw, height: 5, color: c }),
  );

  return doc.save();
}
