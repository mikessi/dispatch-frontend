import { formatDate } from "./format";
import { money } from "./invoice";

export const PAYMENT_METHODS = ['Check', 'ACH', 'Wire', 'Credit card', 'Zelle', 'Cash', 'Other'];

const cityLine = ({ city, state, zip }) =>
  [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');

// A pickup/delivery stop as lines: name, street, "City, ST ZIP"
export const stopLines = (stop) => (stop ? [stop.name, stop.street, cityLine(stop)].filter(Boolean) : []);

const present = (rows) => rows.filter(([, value]) => value !== '' && value != null);

// The cargo facts, shown as one row of columns above the charges
export const cargoFacts = (invoice) => {
  const hasWeight = invoice.weight !== '' && invoice.weight != null;
  const usesZone = invoice.moveType !== 'Transfer' && invoice.moveType !== 'PTT';
  return present([
    ['Pieces', invoice.pcs],
    ['Pallets', invoice.pallets],
    ['Weight', hasWeight ? `${Number(invoice.weight).toLocaleString()} ${invoice.weightUnit}` : ''],
    ['Reference #', invoice.referenceNumber],
    ['Zone', usesZone ? invoice.zone : ''],
    ['Type', invoice.transportMode],
    ['Move type', invoice.moveType],
  ]);
};

// Where it went and when, listed beside "Bill to"
export const routeFacts = (invoice) =>
  present([
    ['Pro #', invoice.proNumber],
    ['From', stopLines(invoice.fromAddress).join('\n') || invoice.fromName],
    ['To', stopLines(invoice.toAddress).join('\n') || invoice.toName],
    ['Contact', invoice.contactName],
    ['Pick up', formatDate(invoice.pickupDate)],
    ['Delivery', formatDate(invoice.deliveryDate)],
  ]);

// "Check · Ref 10482" — how a payment is described on paper and in lists
export const paymentSummary = (invoice) =>
  [invoice.paymentMethod, invoice.paymentReference && `Ref ${invoice.paymentReference}`].filter(Boolean).join(' · ');

// Build the invoice as a PDF document. `lines` are the charge rows
// ({ description, qty?, unitPrice?, amount }), the same ones the print view shows.
export const buildInvoicePdf = async ({ invoice, lines, total, company }) => {
  // Loaded on demand so the PDF library isn't part of every page load
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const right = pageWidth - margin;
  const isPaid = invoice.status === 'paid';

  // Writes lines of text downward from y and returns the y after the last one
  const writeLines = (textLines, x, y, { align = 'left', lineHeight = 14 } = {}) => {
    textLines.filter(Boolean).forEach((text) => {
      doc.text(String(text), x, y, { align });
      y += lineHeight;
    });
    return y;
  };

  // Header: company on the left, invoice facts on the right
  doc.setFont('helvetica', 'bold').setFontSize(18);
  doc.text(company.name || 'Your company name', margin, margin + 6);
  doc.setFont('helvetica', 'normal').setFontSize(10);
  const companyBottom = writeLines([company.street, cityLine(company), company.phone, company.email], margin, margin + 24);

  doc.setFont('helvetica', 'bold').setFontSize(24);
  doc.text('INVOICE', right, margin + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(10);
  let factsBottom = writeLines(
    [
      `Invoice # ${invoice.invoiceNumber}`,
      `Date ${formatDate(invoice.date)}`,
      invoice.dueDate && `Due date ${formatDate(invoice.dueDate)}`,
    ],
    right, margin + 30, { align: 'right' }
  );
  if (isPaid) {
    doc.setFont('helvetica', 'bold').setFontSize(11);
    doc.text('PAID', right, factsBottom + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal').setFontSize(10);
    factsBottom = writeLines(
      [invoice.paidDate && `Paid ${formatDate(invoice.paidDate)}`, paymentSummary(invoice)],
      right, factsBottom + 20, { align: 'right' }
    );
  }

  let y = Math.max(companyBottom, factsBottom) + 6;
  doc.setLineWidth(1.5).line(margin, y, right, y);
  y += 24;

  // Left: bill to. Right: the route.
  const middle = pageWidth / 2 + 10;
  const labelWidth = 70;
  const sectionTitle = (text, x) => {
    doc.setFont('helvetica', 'bold').setFontSize(8);
    doc.text(text.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal').setFontSize(10);
  };
  // Label/value rows going down from startY; returns the y after the last row
  const writeFacts = (rows, x, startY, maxRight) => {
    let rowY = startY;
    rows.forEach(([label, value]) => {
      doc.setTextColor(90).text(label, x, rowY);
      const wrapped = doc.splitTextToSize(String(value), maxRight - (x + labelWidth));
      doc.setTextColor(0).text(wrapped, x + labelWidth, rowY, { lineHeightFactor: 1.2 });
      // Multi-line values (full addresses) get a little air before the next row
      rowY += 12 * wrapped.length + (wrapped.length > 1 ? 6 : 2);
    });
    return rowY;
  };

  sectionTitle('Bill to', margin);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.billTo.name || '', margin, y + 15);
  doc.setFont('helvetica', 'normal');
  const billToBottom = writeLines(
    [invoice.billTo.street, cityLine(invoice.billTo), invoice.billTo.phone, invoice.billTo.email],
    margin, y + 29
  );

  sectionTitle('Shipment', middle);
  const shipmentY = writeFacts(routeFacts(invoice), middle, y + 15, right);

  // Cargo facts: one row of columns across the page
  let chargesStart = Math.max(billToBottom, shipmentY) + 16;
  const cargo = cargoFacts(invoice);
  if (cargo.length > 0) {
    autoTable(doc, {
      startY: chargesStart,
      margin: { left: margin, right: margin },
      head: [cargo.map(([label]) => label)],
      body: [cargo.map(([, value]) => String(value))],
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }, textColor: 0, halign: 'center' },
      headStyles: { fontStyle: 'bold', fontSize: 8, textColor: 90, fillColor: 243 },
      bodyStyles: { lineWidth: { bottom: 0.5 }, lineColor: 200 },
    });
    chargesStart = doc.lastAutoTable.finalY + 18;
  }

  // Charges
  autoTable(doc, {
    startY: chargesStart,
    margin: { left: margin, right: margin },
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body: lines.map((line) => [
      line.description,
      line.qty ?? '',
      line.unitPrice == null ? '' : money(line.unitPrice),
      money(line.amount),
    ]),
    foot: [[{ content: 'Total', colSpan: 3, styles: { halign: 'right' } }, money(total)]],
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: 0 },
    headStyles: { fontStyle: 'bold', fontSize: 8, lineWidth: { bottom: 1.5 }, lineColor: 0 },
    bodyStyles: { lineWidth: { bottom: 0.5 }, lineColor: 200 },
    footStyles: { fontStyle: 'bold', fontSize: 12 },
    columnStyles: {
      1: { halign: 'right', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 80 },
      3: { halign: 'right', cellWidth: 90 },
    },
    didParseCell: ({ section, column, cell }) => {
      if (section === 'head' && column.index > 0) cell.styles.halign = 'right';
      if (section === 'foot') cell.styles.halign = 'right';
    },
  });

  y = doc.lastAutoTable.finalY + 28;
  const textWidth = right - margin;
  const pageBottom = doc.internal.pageSize.getHeight() - margin;
  // Long notes or footers continue on a new page instead of running off the bottom
  const writeBlock = (text) => {
    doc.splitTextToSize(text, textWidth).forEach((line) => {
      if (y > pageBottom) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    });
  };

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold').setFontSize(8);
    doc.text('NOTES', margin, y);
    doc.setFont('helvetica', 'normal').setFontSize(10);
    y += 14;
    writeBlock(invoice.notes);
    y += 12;
  }
  if (company.invoiceFooter) {
    doc.setLineWidth(0.5).setDrawColor(150).line(margin, y, right, y);
    y += 16;
    doc.setTextColor(60);
    writeBlock(company.invoiceFooter);
  }

  return doc;
};

export const downloadInvoicePdf = async (details) => {
  const doc = await buildInvoicePdf(details);
  doc.save(`Invoice-${String(details.invoice.invoiceNumber).replace(/[^\w-]+/g, '_')}.pdf`);
};
