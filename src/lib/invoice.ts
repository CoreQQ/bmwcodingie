import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type InvoiceItem = { service: string; price: number };

export type InvoiceData = {
  number: string;
  date: string;
  client: string;
  items: InvoiceItem[];
  business: { name: string; phone: string; email: string; website: string };
};

/** Pull the first euro amount out of a price label like "from €120". */
export function parsePrice(label: string): number | null {
  const m = label.match(/€\s?(\d+)/);
  return m ? Number(m[1]) : null;
}

const BLUE = rgb(0.11, 0.41, 0.83);
const MBLUE = rgb(0.18, 0.61, 0.9);
const MDARK = rgb(0.04, 0.31, 0.69);
const MRED = rgb(0.89, 0, 0.1);
const INK = rgb(0.1, 0.11, 0.13);
const GREY = rgb(0.45, 0.47, 0.5);
const HAIR = rgb(0.82, 0.83, 0.85);

const A4 = { w: 595.28, h: 841.89 };
const M = 50;

/** Render a clean, branded A4 invoice and return the PDF bytes. */
export async function buildInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([A4.w, A4.h]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const right = A4.w - M;
  const rt = (t: string, y: number, size: number, f = font, color = INK) =>
    page.drawText(t, { x: right - f.widthOfTextAtSize(t, size), y, size, font: f, color });

  // M-stripe header bar
  const sw = (A4.w - 2 * M) / 3;
  [MBLUE, MDARK, MRED].forEach((c, i) =>
    page.drawRectangle({ x: M + i * sw, y: A4.h - 36, width: sw, height: 6, color: c }),
  );

  // Brand + invoice meta
  page.drawText(data.business.name, { x: M, y: A4.h - 78, size: 26, font: bold, color: INK });
  page.drawText('CODING · DIAGNOSTICS · RETROFITS', {
    x: M, y: A4.h - 94, size: 8, font, color: GREY,
  });
  rt('INVOICE', A4.h - 74, 22, bold, BLUE);
  rt(data.number, A4.h - 92, 10, font, GREY);
  rt(data.date, A4.h - 106, 10, font, GREY);

  // Business contact line
  const contact = [data.business.phone, data.business.email, data.business.website]
    .filter(Boolean)
    .join('   ·   ');
  page.drawText(contact, { x: M, y: A4.h - 120, size: 9, font, color: GREY });
  page.drawLine({
    start: { x: M, y: A4.h - 138 }, end: { x: right, y: A4.h - 138 },
    thickness: 1, color: HAIR,
  });

  // Bill to
  page.drawText('BILL TO', { x: M, y: A4.h - 162, size: 8, font: bold, color: GREY });
  page.drawText(data.client || '—', { x: M, y: A4.h - 180, size: 13, font: bold, color: INK });

  // Table header
  let y = A4.h - 222;
  page.drawText('DESCRIPTION', { x: M, y, size: 8, font: bold, color: GREY });
  rt('AMOUNT', y, 8, bold, GREY);
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: HAIR });
  y -= 24;

  // Rows
  let total = 0;
  for (const it of data.items) {
    total += it.price;
    page.drawText(it.service, { x: M, y, size: 11, font, color: INK });
    rt(`€${it.price}`, y, 11, font, INK);
    y -= 22;
  }

  // Total
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: HAIR });
  y -= 26;
  page.drawText('TOTAL', { x: right - 170, y, size: 12, font: bold, color: INK });
  rt(`€${total}`, y, 16, bold, BLUE);

  // Footer
  page.drawText('Payment on completion. Thank you for your business.', {
    x: M, y: 76, size: 9, font, color: GREY,
  });
  page.drawText(data.business.website, { x: M, y: 62, size: 9, font, color: GREY });
  [MBLUE, MDARK, MRED].forEach((c, i) =>
    page.drawRectangle({ x: M + i * sw, y: 44, width: sw, height: 5, color: c }),
  );

  return doc.save();
}
