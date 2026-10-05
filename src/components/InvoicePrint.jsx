import { formatDate } from "../utils/format";
import { money } from "../utils/invoice";
import { cargoFacts, paymentSummary, routeFacts } from "../utils/invoicePdf";

const cityLine = ({ city, state, zip }) =>
  [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');

// The paper version of an invoice. Hidden on screen; shown only when printing
// (or saving as PDF from the print dialog).
export default function InvoicePrint({ invoice, lines, total, company }) {
  const isPaid = invoice.status === 'paid';
  const factsTable = (rows) => (
    <table>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="pr-4 align-top text-gray-700">{label}</td>
            <td className="whitespace-pre-line pb-1">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="text-sm text-black">
      <div className="flex justify-between items-start border-b-2 border-black pb-4">
        <div>
          <p className="text-2xl font-bold">{company.name || 'Your company name'}</p>
          {company.street && <p>{company.street}</p>}
          {cityLine(company) && <p>{cityLine(company)}</p>}
          {company.phone && <p>{company.phone}</p>}
          {company.email && <p>{company.email}</p>}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-wide">INVOICE</p>
          <p className="mt-1"><span className="font-semibold">Invoice #</span> {invoice.invoiceNumber}</p>
          <p><span className="font-semibold">Date</span> {formatDate(invoice.date)}</p>
          {invoice.dueDate && <p><span className="font-semibold">Due date</span> {formatDate(invoice.dueDate)}</p>}
          {isPaid && (
            <p className="mt-2 inline-block border-2 border-black px-3 py-0.5 font-bold tracking-widest">PAID</p>
          )}
          {isPaid && invoice.paidDate && <p className="mt-1">Paid {formatDate(invoice.paidDate)}</p>}
          {isPaid && paymentSummary(invoice) && <p>{paymentSummary(invoice)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1">Bill to</p>
          <p className="font-semibold">{invoice.billTo.name}</p>
          {invoice.billTo.street && <p>{invoice.billTo.street}</p>}
          {cityLine(invoice.billTo) && <p>{cityLine(invoice.billTo)}</p>}
          {invoice.billTo.phone && <p>{invoice.billTo.phone}</p>}
          {invoice.billTo.email && <p>{invoice.billTo.email}</p>}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1">Shipment</p>
          {factsTable(routeFacts(invoice))}
        </div>
      </div>

      {cargoFacts(invoice).length > 0 && (
        <table className="w-full mt-6 text-center">
          <thead>
            <tr className="bg-gray-100 text-xs font-bold uppercase tracking-wide text-gray-700">
              {cargoFacts(invoice).map(([label]) => <th key={label} className="py-1 px-2">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              {cargoFacts(invoice).map(([label, value]) => <td key={label} className="py-1 px-2">{value}</td>)}
            </tr>
          </tbody>
        </table>
      )}

      <table className="w-full mt-6">
        <thead>
          <tr className="border-b-2 border-black text-left text-xs font-bold uppercase tracking-wide">
            <th className="py-2 pr-4">Description</th>
            <th className="py-2 pr-4 text-right w-16">Qty</th>
            <th className="py-2 pr-4 text-right w-28">Unit price</th>
            <th className="py-2 text-right w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="py-2 pr-4">{line.description}</td>
              <td className="py-2 pr-4 text-right">{line.qty ?? ''}</td>
              <td className="py-2 pr-4 text-right">{line.unitPrice == null ? '' : money(line.unitPrice)}</td>
              <td className="py-2 text-right">{money(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-3 pr-4 text-right text-base font-bold">Total</td>
            <td className="pt-3 text-right text-base font-bold">{money(total)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wide mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
      {company.invoiceFooter && (
        <p className="mt-10 pt-3 border-t border-gray-400 whitespace-pre-wrap text-gray-800">{company.invoiceFooter}</p>
      )}
    </div>
  );
}
