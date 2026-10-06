import { calculateQuote } from "./rateCalculator";

const FIRST_INVOICE_NUMBER = 1001;

export const money = (amount) =>
  (Number(amount) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const toCents = (amount) => Math.round((Number(amount) || 0) * 100) / 100;

// The priced lines for a shipment: the same numbers the Quotes page shows,
// laid out as invoice lines. `pricing` holds the shipment and pricing choices.
export const buildCharges = (rates, pricing) => {
  const weight = parseFloat(pricing.weight);
  if (isNaN(weight)) return [];
  // Zone-priced moves can't be priced until a zone is chosen
  const usesZone = pricing.moveType !== 'Transfer' && pricing.moveType !== 'PTT';
  if (usesZone && !pricing.zone) return [];

  const quote = calculateQuote(rates, {
    moveType: pricing.moveType,
    // Local has no rate table of its own; it's priced at the Ocean rates
    transportMode: pricing.transportMode === 'Local' ? 'Ocean' : pricing.transportMode,
    zone: pricing.zone,
    weight,
    weightUnit: pricing.weightUnit,
    fuelPercent: pricing.fuelPercent,
    rateMultiplier: pricing.markupEnabled ? 1 + pricing.markupPercent / 100 : 1,
  });

  const shipment = `${weight.toLocaleString()} ${pricing.weightUnit}`;
  // e.g. "Ocean Import/Export General Freight"; zone and weight are listed separately on the invoice
  const freight = (move) => `${pricing.transportMode} ${move} General Freight`;
  let lines;
  if (pricing.moveType === 'Transfer') {
    lines = [
      { description: `Transfer — ${shipment}`, amount: quote.transferRate },
      { description: 'Fuel surcharge', amount: quote.transferFuel },
    ];
  } else if (pricing.moveType === 'PTT') {
    lines = [{ description: `PTT — ${shipment}`, amount: quote.baseRate }];
  } else if (pricing.moveType === 'Export + Transfer') {
    lines = [
      { description: freight('Export'), amount: quote.exportRate },
      { description: 'Export fuel surcharge', amount: quote.exportFuel },
      { description: 'Toll', amount: quote.exportToll },
      { description: `Transfer — ${shipment}`, amount: quote.transferRate },
      { description: 'Transfer fuel surcharge', amount: quote.transferFuel },
    ];
  } else {
    lines = [
      { description: freight('Import/Export'), amount: quote.baseRate },
      { description: 'Fuel surcharge', amount: quote.fuelSurcharge },
      { description: 'Toll', amount: quote.toll },
    ];
  }
  // The base line always shows; other lines only when there's something to charge
  return lines.filter((line, index) => index === 0 || line.amount > 0).map((line) => ({ ...line, amount: toCents(line.amount) }));
};

export const extraAmount = (extra) => toCents((parseFloat(extra.qty) || 0) * (parseFloat(extra.unitPrice) || 0));

export const invoiceTotal = (charges, extras) =>
  toCents([...charges.map((c) => c.amount), ...extras.map(extraAmount)].reduce((sum, amount) => sum + amount, 0));

export const nextInvoiceNumber = (invoices) => {
  const highest = invoices.reduce((max, invoice) => {
    const number = parseInt(String(invoice.invoiceNumber).replace(/\D/g, ''), 10);
    return number > max ? number : max;
  }, FIRST_INVOICE_NUMBER - 1);
  return String(highest + 1);
};
