import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RequireSignIn from "../components/RequireSignIn";
import StatusBadge from "../components/StatusBadge";
import {
  Card, Field, Message, inputClass, primaryButtonClass, secondaryButtonClass,
} from "../components/ui";
import { useCompany } from "../context/CompanyContext";
import { useCustomers, useInvoices } from "../context/DataContext";
import { formatDate, tidyField, tidyRecord, todayISO } from "../utils/format";
import { money } from "../utils/invoice";
import { paymentSummary } from "../utils/invoicePdf";

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'paid', label: 'Paid' },
];

const statusOf = (invoice) => (invoice.status === 'paid' ? 'paid' : 'unpaid');

// Your own business details, printed at the top of every invoice
function CompanyForm({ onClose }) {
  const { company, saveCompany } = useCompany();
  const [form, setForm] = useState(company);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    onBlur: () => setForm((prev) => ({ ...prev, [key]: tidyField(key, prev[key]) })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await saveCompany(tidyRecord(form));
      onClose();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-xl font-semibold text-gray-900">Company details</h2>
          <p className="text-sm text-gray-600 mt-1">Printed at the top of every invoice.</p>
        </div>
        <Message message={message} />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Field label="Company name" required className="md:col-span-6">
            <input type="text" required autoFocus {...bind('name')} className={inputClass} />
          </Field>
          <Field label="Street" className="md:col-span-6">
            <input type="text" {...bind('street')} className={inputClass} />
          </Field>
          <Field label="City" className="md:col-span-3">
            <input type="text" {...bind('city')} className={inputClass} />
          </Field>
          <Field label="State" className="md:col-span-1">
            <input type="text" maxLength={2} {...bind('state')} className={`${inputClass} uppercase`} />
          </Field>
          <Field label="ZIP" className="md:col-span-2">
            <input type="text" {...bind('zip')} className={inputClass} />
          </Field>
          <Field label="Phone" className="md:col-span-3">
            <input type="tel" {...bind('phone')} className={inputClass} />
          </Field>
          <Field label="Email" className="md:col-span-3">
            <input type="email" {...bind('email')} className={inputClass} />
          </Field>
          <Field label="Invoice footer" hint="Printed at the bottom, e.g. payment terms or where to send payment" className="md:col-span-6">
            <textarea rows={3} {...bind('invoiceFooter')} className={inputClass} />
          </Field>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

function InvoiceList() {
  const invoices = useInvoices();
  const customers = useCustomers();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingCompany, setEditingCompany] = useState(false);
  const { company } = useCompany();

  const customerName = (invoice) => customers.byId(invoice.customerId)?.name || invoice.customerName || '';
  const visible = invoices.items.filter((invoice) =>
    (filter === 'all' || statusOf(invoice) === filter) &&
    [invoice.invoiceNumber, customerName(invoice), invoice.proNumber, invoice.referenceNumber, invoice.paymentReference, formatDate(invoice.date)]
      .join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );
  const sum = (list) => list.reduce((total, invoice) => total + (invoice.total || 0), 0);
  const visibleUnpaid = visible.filter((invoice) => statusOf(invoice) === 'unpaid');
  const countFor = (key) => invoices.items.filter((invoice) => key === 'all' || statusOf(invoice) === key).length;

  return (
    <div className="p-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button onClick={() => setEditingCompany(true)} className={secondaryButtonClass}>Company details</button>
      </div>

      {!company.name && (
        <p className="rounded-lg bg-amber-50 text-amber-800 text-sm p-3">
          Add your company details so printed invoices show your name and address.
        </p>
      )}

      <div className="flex gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              filter === option.key
                ? 'bg-purple-600 border-purple-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {option.label} ({countFor(option.key)})
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by invoice #, customer, pro #, reference # or payment ref #"
        className={inputClass}
      />

      <Card>
        {invoices.status === 'loading' && <p className="text-sm text-gray-600">Loading invoices…</p>}
        {invoices.status === 'error' && (
          <p className="text-sm text-red-600">
            Couldn’t load invoices. The database rules may not allow it yet — see firebase/README.md.
          </p>
        )}
        {invoices.status === 'ready' && invoices.items.length === 0 && (
          <p className="text-sm text-gray-600">
            No invoices yet. Open <Link to="/jobs" className="text-purple-600 hover:underline">Jobs</Link> and
            click <strong>Invoice</strong> on a job to create one.
          </p>
        )}
        {invoices.status === 'ready' && invoices.items.length > 0 && visible.length === 0 && (
          <p className="text-sm text-gray-600">No invoices match this search and filter.</p>
        )}
        {visible.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600 border-b">
                  <th className="py-2 pr-4">Invoice #</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Pro #</th>
                  <th className="py-2 pr-4">Ref #</th>
                  <th className="py-2 pr-4">Move type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="border-b last:border-0 hover:bg-purple-50/50 cursor-pointer"
                  >
                    <td className="py-2 pr-4 font-medium text-purple-700">{invoice.invoiceNumber}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDate(invoice.date)}</td>
                    <td className="py-2 pr-4">{customerName(invoice)}</td>
                    <td className="py-2 pr-4">{invoice.proNumber}</td>
                    <td className="py-2 pr-4">{invoice.referenceNumber}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{invoice.moveType}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <StatusBadge status={statusOf(invoice)} />
                      {invoice.paidDate && <span className="ml-2 text-xs text-gray-500">{formatDate(invoice.paidDate)}</span>}
                      {paymentSummary(invoice) && <p className="text-xs text-gray-500">{paymentSummary(invoice)}</p>}
                      {statusOf(invoice) === 'unpaid' && invoice.dueDate && (
                        <p className={`text-xs ${invoice.dueDate < todayISO() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {invoice.dueDate < todayISO() ? 'Overdue — was due' : 'Due'} {formatDate(invoice.dueDate)}
                        </p>
                      )}
                    </td>
                    <td className="py-2 text-right font-medium">{money(invoice.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={7} className="py-2 pr-4 text-right text-gray-600">
                    {visible.length} invoice{visible.length === 1 ? '' : 's'}
                  </td>
                  <td className="py-2 text-right font-semibold">{money(sum(visible))}</td>
                </tr>
                {visibleUnpaid.length > 0 && (
                  <tr>
                    <td colSpan={7} className="pb-2 pr-4 text-right text-amber-700">
                      Still unpaid ({visibleUnpaid.length})
                    </td>
                    <td className="pb-2 text-right font-semibold text-amber-700">{money(sum(visibleUnpaid))}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {editingCompany && <CompanyForm onClose={() => setEditingCompany(false)} />}
    </div>
  );
}

export default function Invoices() {
  return (
    <RequireSignIn title="Invoices">
      <InvoiceList />
    </RequireSignIn>
  );
}
