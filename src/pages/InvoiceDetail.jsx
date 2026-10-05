import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import InvoicePrint from "../components/InvoicePrint";
import RequireSignIn from "../components/RequireSignIn";
import {
  Card, Field, Message, checkboxClass, inputBase, inputClass, labelClass, smallInputBase,
  primaryButtonClass, secondaryButtonClass, dangerButtonClass,
} from "../components/ui";
import { useAddresses, useCustomers, useInvoices, useJobs } from "../context/DataContext";
import { useCompany } from "../context/CompanyContext";
import { useRates } from "../context/RatesContext";
import { MOVE_TYPES, TRANSPORT_TYPES, ZONES } from "../utils/constants";
import { customerRates } from "../utils/customerRates";
import { addDays, formatDate, todayISO } from "../utils/format";
import { buildCharges, extraAmount, invoiceTotal, money, nextInvoiceNumber } from "../utils/invoice";
import { PAYMENT_METHODS, downloadInvoicePdf, stopLines } from "../utils/invoicePdf";
import { DEFAULT_FUEL_PERCENT } from "../utils/rateCalculator";

const MARKUP_OPTIONS = [5, 10, 15, 20, 25];
// New invoices are due this many days after the invoice date
const DEFAULT_TERMS_DAYS = 30;

// A copy of an address kept on the invoice, so it stays as issued even if the
// address book entry is later changed or removed
const snapshotAddress = (address) =>
  address
    ? {
        name: address.fullName || address.companyName || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.zip || '',
      }
    : null;
const FUEL_OPTIONS = Array.from({ length: 31 }, (_, i) => 20 + i);

// A new invoice, filled in with everything the job (and its customer) already knows
const invoiceFromJob = (job, customer, addresses, rates, existingInvoices) => {
  const addressName = (id, fallback) => {
    const address = addresses.byId(id);
    return address ? address.fullName || address.companyName : fallback || '';
  };
  const invoice = {
    invoiceNumber: nextInvoiceNumber(existingInvoices),
    date: todayISO(),
    dueDate: addDays(todayISO(), DEFAULT_TERMS_DAYS),
    jobId: job.id,
    customerId: job.customerId || '',
    customerName: customer?.name || job.customerName || '',
    billTo: {
      name: customer?.name || job.customerName || '',
      street: customer?.street || '',
      city: customer?.city || '',
      state: customer?.state || '',
      zip: customer?.zip || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
    },
    contactName: customer?.contacts?.find((c) => c.id === job.contactId)?.name || job.contactName || '',
    proNumber: job.proNumber || '',
    referenceNumber: job.referenceNumber || '',
    fromName: addressName(job.fromAddressId, job.fromName),
    toName: addressName(job.toAddressId, job.toName),
    fromAddress: snapshotAddress(addresses.byId(job.fromAddressId)) || { name: job.fromName || '' },
    toAddress: snapshotAddress(addresses.byId(job.toAddressId)) || { name: job.toName || '' },
    pcs: job.pcs ?? null,
    pallets: job.pallets ?? null,
    pickupDate: job.pickupDate || '',
    deliveryDate: job.deliveryDate || '',
    // Pricing: shipment facts come from the job; the rest start at the usual defaults
    moveType: job.moveType || MOVE_TYPES[0],
    zone: job.zone || '',
    weight: job.weight == null ? '' : String(job.weight),
    weightUnit: job.weightUnit || 'lbs',
    transportMode: job.transportMode || 'Air',
    fuelPercent: DEFAULT_FUEL_PERCENT,
    markupEnabled: false,
    markupPercent: 15,
    extras: [],
    notes: '',
    status: 'unpaid',
    paidDate: '',
    paymentMethod: '',
    paymentReference: '',
  };
  return { ...invoice, charges: buildCharges(customerRates(rates, customer), invoice) };
};

// Saved invoices keep numbers; the form edits text
const toForm = (invoice) => ({
  ...invoice,
  weight: invoice.weight == null ? '' : String(invoice.weight),
  status: invoice.status || 'unpaid',
  dueDate: invoice.dueDate || '',
  paidDate: invoice.paidDate || '',
  paymentMethod: invoice.paymentMethod || '',
  paymentReference: invoice.paymentReference || '',
  extras: (invoice.extras || []).map((extra) => ({
    ...extra,
    qty: String(extra.qty ?? ''),
    unitPrice: String(extra.unitPrice ?? ''),
  })),
});

// Blank rows that were added but never filled in aren't part of the invoice
const isRealExtra = (extra) => extra.description.trim() !== '' || extraAmount(extra) !== 0;

function InvoiceEditor({ initial, isNew }) {
  const navigate = useNavigate();
  const invoices = useInvoices();
  const customers = useCustomers();
  const jobs = useJobs();
  const addresses = useAddresses();
  const { rates: standardRates } = useRates();
  const { company } = useCompany();
  const [form, setForm] = useState(() => toForm(initial));
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  // Saved invoices open locked; Edit unlocks them so nothing changes by accident
  const [editing, setEditing] = useState(isNew);

  const rates = customerRates(standardRates, customers.byId(form.customerId));
  // Invoices made before full addresses were kept look them up from the job
  const job = jobs.byId(form.jobId);
  const fromAddress = form.fromAddress || snapshotAddress(addresses.byId(job?.fromAddressId)) || { name: form.fromName || '' };
  const toAddress = form.toAddress || snapshotAddress(addresses.byId(job?.toAddressId)) || { name: form.toName || '' };
  // What goes on paper: the form plus the resolved addresses
  const output = { ...form, fromAddress, toAddress };

  const usesZone = form.moveType === 'Import/Export' || form.moveType === 'Export + Transfer';
  const total = invoiceTotal(form.charges, form.extras);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Changing anything that affects the price recalculates the charges from current rates.
  // Just opening a saved invoice never does, so its amounts stay as they were issued.
  const setPricing = (patch) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      return { ...next, charges: buildCharges(rates, next) };
    });
  };

  const setExtra = (id, patch) => {
    setForm((prev) => ({ ...prev, extras: prev.extras.map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)) }));
  };
  const addExtra = (description = '', unitPrice = '') => {
    setForm((prev) => ({
      ...prev,
      extras: [...prev.extras, { id: crypto.randomUUID(), description, qty: '1', unitPrice: String(unitPrice) }],
    }));
  };
  const removeExtra = (id) => setForm((prev) => ({ ...prev, extras: prev.extras.filter((extra) => extra.id !== id) }));

  // Returns true when the invoice was saved
  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { id, createdAt, updatedAt, ...data } = form;
      const record = {
        ...data,
        fromAddress,
        toAddress,
        invoiceNumber: String(data.invoiceNumber).trim(),
        notes: data.notes.trim(),
        paidDate: data.status === 'paid' ? data.paidDate || todayISO() : '',
        paymentMethod: data.status === 'paid' ? data.paymentMethod : '',
        paymentReference: data.status === 'paid' ? data.paymentReference.trim().toUpperCase() : '',
        weight: data.weight === '' || isNaN(parseFloat(data.weight)) ? null : parseFloat(data.weight),
        extras: data.extras.filter(isRealExtra).map((extra) => ({
          id: extra.id,
          description: extra.description.trim(),
          qty: parseFloat(extra.qty) || 0,
          unitPrice: parseFloat(extra.unitPrice) || 0,
          amount: extraAmount(extra),
        })),
        total,
      };
      if (isNew) {
        const newId = await invoices.add(record);
        navigate(`/invoices/${newId}`, { replace: true });
      } else {
        await invoices.update(id, record);
        setMessage({ type: 'success', text: 'Invoice saved.' });
        setEditing(false);
      }
      return true;
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save();
  };

  const handleCancelEdit = () => {
    setForm(toForm(initial));
    setMessage(null);
    setEditing(false);
  };

  // Paper copies always match what's stored: unsaved edits are saved first
  const saveIfEditing = async () => !editing || (await save());

  const handlePrint = async () => {
    if (await saveIfEditing()) setTimeout(() => window.print(), 100);
  };

  const handleDownloadPdf = async () => {
    if (!(await saveIfEditing())) return;
    try {
      await downloadInvoicePdf({ invoice: output, lines: printLines, total, company });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Couldn’t create the PDF: ${error.message}` });
    }
  };

  // Moving the invoice date moves the due date with it, keeping the same terms
  const handleDateChange = (e) => {
    const date = e.target.value;
    setForm((prev) => {
      const termsDays = prev.date && prev.dueDate
        ? Math.round((Date.parse(prev.dueDate) - Date.parse(prev.date)) / 86400000)
        : DEFAULT_TERMS_DAYS;
      return { ...prev, date, dueDate: prev.dueDate || isNew ? addDays(date, termsDays) : prev.dueDate };
    });
  };

  const setStatus = (e) => {
    const status = e.target.value;
    setForm((prev) => ({
      ...prev,
      status,
      paidDate: status === 'paid' ? prev.paidDate || todayISO() : '',
      // Payment details only mean something once it's paid
      paymentMethod: status === 'paid' ? prev.paymentMethod : '',
      paymentReference: status === 'paid' ? prev.paymentReference : '',
    }));
  };

  const printLines = [
    ...form.charges,
    ...form.extras.filter(isRealExtra).map((extra) => ({
      description: extra.description.trim(),
      qty: parseFloat(extra.qty) || 0,
      unitPrice: parseFloat(extra.unitPrice) || 0,
      amount: extraAmount(extra),
    })),
  ];

  const handleDelete = async () => {
    if (!window.confirm(`Delete invoice ${form.invoiceNumber}?`)) return;
    await invoices.remove(form.id);
    navigate('/invoices', { replace: true });
  };

  const missing = [
    form.weight === '' && 'weight',
    usesZone && !form.zone && 'zone',
  ].filter(Boolean);

  const billToLines = [
    form.billTo.street,
    [form.billTo.city, [form.billTo.state, form.billTo.zip].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    form.billTo.phone,
    form.billTo.email,
  ].filter(Boolean);

  const shipmentFacts = [
    ['Pro #', form.proNumber],
    ['Reference #', form.referenceNumber],
    ['From', stopLines(fromAddress).join('\n')],
    ['To', stopLines(toAddress).join('\n')],
    ['Contact', form.contactName],
    ['Pcs', form.pcs],
    ['Pallets', form.pallets],
    ['Pick up', formatDate(form.pickupDate)],
    ['Delivery', formatDate(form.deliveryDate)],
  ].filter(([, value]) => value !== '' && value != null);

  return (
    <>
      <form onSubmit={handleSubmit} className="p-1 space-y-4 print:hidden">
        {/* Stays in view while scrolling, so the actions are always at hand */}
        <div className="sticky top-0 z-30 -mx-2 px-2 py-3 flex flex-wrap items-end justify-between gap-3 bg-gray-50/90 backdrop-blur border-b border-gray-200 rounded-b-lg">
          <div>
            <Link to="/invoices" className="text-sm text-purple-600 hover:underline">← Invoices</Link>
            <h1 className="text-2xl font-bold mt-1">
              {isNew ? 'New invoice' : `Invoice ${form.invoiceNumber}`}
              {isNew && <span className="ml-3 text-sm font-normal text-amber-600">Not saved yet</span>}
              {!isNew && <StatusBadge status={form.status} className="ml-3 align-middle" />}
              {!isNew && editing && <span className="ml-3 text-sm font-normal text-amber-600">Editing</span>}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isNew && <span className="text-xs text-gray-500">Create the invoice to print or save it</span>}
            <button type="button" onClick={handlePrint} disabled={isNew || saving} className={secondaryButtonClass}>
              Print
            </button>
            <button type="button" onClick={handleDownloadPdf} disabled={isNew || saving} className={secondaryButtonClass}>
              Save to PDF
            </button>
            <button
              type="button"
              onClick={() => { setMessage(null); setEditing(true); }}
              disabled={editing}
              className={primaryButtonClass}
            >
              {editing && !isNew ? 'Editing…' : 'Edit'}
            </button>
          </div>
        </div>
        <Message message={message} />

        {/* Everything inside is locked until Edit is clicked */}
        <fieldset disabled={!editing} className="space-y-4 min-w-0">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Invoice">
              <div className="space-y-4">
                <Field label="Invoice #" required>
                  <input type="text" required value={form.invoiceNumber} onChange={set('invoiceNumber')} className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Invoice date" required>
                    <input type="date" required value={form.date} onChange={handleDateChange} className={inputClass} />
                  </Field>
                  <Field label="Due date">
                    <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Status">
                    <select value={form.status} onChange={setStatus} className={inputClass}>
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                    </select>
                  </Field>
                  {form.status === 'paid' && (
                    <Field label="Paid on">
                      <input type="date" value={form.paidDate} onChange={set('paidDate')} className={inputClass} />
                    </Field>
                  )}
                  {form.status === 'paid' && (
                    <Field label="Payment method">
                      <select value={form.paymentMethod} onChange={set('paymentMethod')} className={inputClass}>
                        <option value="">Not recorded</option>
                        {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                      </select>
                    </Field>
                  )}
                  {form.status === 'paid' && (
                    <Field label="Payment ref #">
                      <input
                        type="text"
                        value={form.paymentReference}
                        onChange={set('paymentReference')}
                        placeholder="Check # or confirmation"
                        className={inputClass}
                      />
                    </Field>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Bill to">
              <p className="font-medium text-gray-900">{form.billTo.name || '—'}</p>
              {billToLines.map((line) => <p key={line} className="text-sm text-gray-600">{line}</p>)}
              {form.customerId && (
                <Link to={`/customers/${form.customerId}`} className="inline-block mt-2 text-sm text-purple-600 hover:underline">
                  View customer
                </Link>
              )}
            </Card>

            <Card title="Shipment">
              <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                {shipmentFacts.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-900 whitespace-pre-line">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <Card title="Pricing">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Field label="Move type" className="md:col-span-2">
                <select value={form.moveType} onChange={(e) => setPricing({ moveType: e.target.value })} className={inputClass}>
                  {MOVE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Weight" className="md:col-span-2">
                <span className="flex">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.weight}
                    onChange={(e) => {
                      if (/^\d*\.?\d*$/.test(e.target.value)) setPricing({ weight: e.target.value });
                    }}
                    className={`${inputBase} flex-1 min-w-0 rounded-r-none`}
                  />
                  <select
                    aria-label="Weight unit"
                    value={form.weightUnit}
                    onChange={(e) => setPricing({ weightUnit: e.target.value })}
                    className={`${inputBase} rounded-l-none border-l-0`}
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </span>
              </Field>
              <Field label="Zone" className="md:col-span-1">
                <select value={form.zone} onChange={(e) => setPricing({ zone: e.target.value })} disabled={!usesZone} className={inputClass}>
                  <option value="">—</option>
                  {ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                </select>
              </Field>
              <Field label="Type" className="md:col-span-1">
                <select value={form.transportMode} onChange={(e) => setPricing({ transportMode: e.target.value })} className={inputClass}>
                  {TRANSPORT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Fuel surcharge" className="md:col-span-2">
                <select
                  value={form.fuelPercent}
                  onChange={(e) => setPricing({ fuelPercent: Number(e.target.value) })}
                  disabled={form.moveType === 'PTT'}
                  className={inputClass}
                >
                  {FUEL_OPTIONS.map((percent) => <option key={percent} value={percent}>{percent}%</option>)}
                </select>
              </Field>
              <div className="md:col-span-2">
                <span className={labelClass}>Markup</span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={form.markupEnabled}
                      onChange={(e) => setPricing({ markupEnabled: e.target.checked })}
                      disabled={!usesZone}
                      className={checkboxClass}
                    />
                    Apply
                  </label>
                  <select
                    aria-label="Markup percent"
                    value={form.markupPercent}
                    onChange={(e) => setPricing({ markupPercent: Number(e.target.value) })}
                    disabled={!usesZone || !form.markupEnabled}
                    className={`${inputBase} flex-1`}
                  >
                    {MARKUP_OPTIONS.map((percent) => <option key={percent} value={percent}>{percent}%</option>)}
                  </select>
                </div>
              </div>
            </div>
            {missing.length > 0 && (
              <p className="mt-3 text-sm text-amber-700">
                Add the {missing.join(' and ')} to price this invoice — the job didn’t have {missing.length === 1 ? 'it' : 'them'}.
              </p>
            )}
          </Card>

          <Card title="Charges">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600 border-b">
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4 w-24">Qty</th>
                  <th className="py-2 pr-4 w-32">Unit price</th>
                  <th className="py-2 pr-2 w-32 text-right">Amount</th>
                  <th className="py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {form.charges.map((charge) => (
                  <tr key={charge.description} className="border-b">
                    <td className="py-2 pr-4" colSpan={3}>{charge.description}</td>
                    <td className="py-2 pr-2 text-right">{money(charge.amount)}</td>
                    <td />
                  </tr>
                ))}
                {form.extras.map((extra) => (
                  <tr key={extra.id} className="border-b">
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        aria-label="Charge description"
                        value={extra.description}
                        onChange={(e) => setExtra(extra.id, { description: e.target.value })}
                        placeholder="Description"
                        className={`${smallInputBase} block w-full`}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label="Quantity"
                        value={extra.qty}
                        onChange={(e) => {
                          if (/^\d*\.?\d*$/.test(e.target.value)) setExtra(extra.id, { qty: e.target.value });
                        }}
                        className={`${smallInputBase} block w-full`}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label="Unit price"
                        value={extra.unitPrice}
                        onChange={(e) => {
                          // A leading minus allows discounts and credits
                          if (/^-?\d*\.?\d*$/.test(e.target.value)) setExtra(extra.id, { unitPrice: e.target.value });
                        }}
                        placeholder="0.00"
                        className={`${smallInputBase} block w-full`}
                      />
                    </td>
                    <td className="py-2 pr-2 text-right">{money(extraAmount(extra))}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => removeExtra(extra.id)} aria-label="Remove charge" className="text-red-600 hover:underline">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 pr-4 text-right font-semibold">Total</td>
                  <td className="pt-3 pr-2 text-right text-lg font-bold text-purple-700">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                aria-label="Add accessory charge"
                value=""
                onChange={(e) => {
                  if (e.target.value) addExtra(e.target.value, rates.accessoryCharges[e.target.value]);
                }}
                className={`${inputBase} max-w-xs`}
              >
                <option value="">+ Add accessory charge…</option>
                {Object.entries(rates.accessoryCharges).map(([name, price]) => (
                  <option key={name} value={name}>{name} ({money(price)})</option>
                ))}
              </select>
              <button type="button" onClick={() => addExtra()} className={secondaryButtonClass}>+ Add custom line</button>
            </div>
          </Card>

          <Card title="Notes">
            <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Shown on the invoice" className={inputClass} />
          </Card>

        </fieldset>

        {editing && (
          <div className="flex items-center gap-3">
            {!isNew && <button type="button" onClick={handleDelete} className={dangerButtonClass}>Delete invoice</button>}
            <span className="flex-1" />
            {isNew
              ? <Link to="/jobs" className={secondaryButtonClass}>Cancel</Link>
              : <button type="button" onClick={handleCancelEdit} className={secondaryButtonClass}>Cancel</button>}
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Saving…' : isNew ? 'Create invoice' : 'Save changes'}
            </button>
          </div>
        )}
      </form>
      <div className="hidden print:block">
        <InvoicePrint invoice={output} lines={printLines} total={total} company={company} />
      </div>
    </>
  );
}

function InvoiceView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const invoices = useInvoices();
  const jobs = useJobs();
  const customers = useCustomers();
  const addresses = useAddresses();
  const { rates, status: ratesStatus } = useRates();
  const isNew = id === 'new';

  const collections = [invoices, jobs, customers, addresses];
  if (collections.some((c) => c.status === 'error')) {
    return <p className="p-1 text-sm text-red-600">Couldn’t load the data for this invoice.</p>;
  }
  if (collections.some((c) => c.status !== 'ready') || ratesStatus === 'loading') {
    return <p className="p-1 text-sm text-gray-600">Loading…</p>;
  }

  const notFound = (text) => (
    <div className="p-1 space-y-2">
      <p className="text-sm text-gray-600">{text}</p>
      <Link to="/invoices" className="text-sm text-purple-600 hover:underline">← Back to invoices</Link>
    </div>
  );

  if (!isNew) {
    const invoice = invoices.byId(id);
    if (!invoice) return notFound('This invoice no longer exists.');
    return <InvoiceEditor key={invoice.id} initial={invoice} isNew={false} />;
  }

  const jobId = searchParams.get('job');
  const job = jobs.byId(jobId);
  if (!job) return notFound('Invoices are created from a job. Open Jobs and click Invoice on the one to bill.');

  // One invoice per job: go to the existing one rather than making a second
  const existing = invoices.items.find((invoice) => invoice.jobId === job.id);
  if (existing) return <Navigate to={`/invoices/${existing.id}`} replace />;

  const initial = invoiceFromJob(job, customers.byId(job.customerId), addresses, rates, invoices.items);
  return <InvoiceEditor key={`new-${job.id}`} initial={initial} isNew />;
}

export default function InvoiceDetail() {
  return (
    <RequireSignIn title="Invoices">
      <InvoiceView />
    </RequireSignIn>
  );
}
