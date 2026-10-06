import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RequireSignIn from "../components/RequireSignIn";
import {
  Card, Field, Message, inputBase, inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass,
} from "../components/ui";
import { useAddresses, useCustomers, useInvoices, useJobs } from "../context/DataContext";
import { MOVE_TYPES, TRANSPORT_TYPES, ZONES } from "../utils/constants";
import { formatDate, tidyField, tidyRecord, todayISO } from "../utils/format";

const newJob = () => ({
  customerId: '', contactId: '',
  fromAddressId: '', toAddressId: '', zone: '',
  // Pickup (from) side
  lastFreeDay: '', pickupDate: '', pickupTimeIn: '', pickupTimeOut: '',
  // Delivery (to) side; cutoffDate is the cut-off / lock-out or appointment date
  cutoffDate: '', deliveryDate: '', deliveryTimeIn: '', deliveryTimeOut: '',
  // transportMode is the job's Type: Air, Ocean or Local
  transportMode: '', moveType: MOVE_TYPES[0], pcs: '', pallets: '', weight: '', weightUnit: 'lbs',
  date: todayISO(), proNumber: '', referenceNumber: '', notes: '',
});

const LBS_PER_KG = 2.20462;

// Jobs keep the weight as entered; the list always shows pounds
const weightInLbs = (job) => {
  if (job.weight == null || job.weight === '') return '';
  const lbs = job.weightUnit === 'kg' ? job.weight * LBS_PER_KG : job.weight;
  return `${Math.round(lbs).toLocaleString()} lbs`;
};

// "14:30" -> "2:30 PM"
const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
};

// One stop's schedule for the list: the date, then "in – out" if recorded
const stopSummary = (date, timeIn, timeOut) => {
  const times = [formatTime(timeIn), formatTime(timeOut)].filter(Boolean).join(' – ');
  return { date: formatDate(date), times };
};

const addressLabel = (address) =>
  [address.companyName, [address.city, address.state].filter(Boolean).join(', ')].filter(Boolean).join(' — ');

function JobForm({ initial, customers, addresses, onSubmit, onDelete, onCancel }) {
  const [form, setForm] = useState({ ...newJob(), ...initial });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Typing updates the field; leaving it tidies the text
  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    onBlur: () => setForm((prev) => ({ ...prev, [key]: tidyField(key, prev[key]) })),
  });
  // Dates, times and other pick-only fields need no tidying
  const plain = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });
  const bindCount = (key) => ({
    value: form[key],
    onChange: (e) => {
      if (/^\d*$/.test(e.target.value)) setForm((prev) => ({ ...prev, [key]: e.target.value }));
    },
  });

  const customer = customers.find((c) => c.id === form.customerId);
  const contacts = customer?.contacts || [];
  const addressById = (id) => addresses.find((a) => a.id === id);

  const handleCustomerChange = (e) => {
    // Contacts belong to a customer, so a different customer clears the contact
    setForm((prev) => ({ ...prev, customerId: e.target.value, contactId: '' }));
  };

  const handleAddressChange = (key) => (e) => {
    setForm((prev) => {
      const next = { ...prev, [key]: e.target.value };
      // The delivery address decides the zone; fall back to the pickup address
      const zone = addressById(next.toAddressId)?.zone || addressById(next.fromAddressId)?.zone;
      return zone ? { ...next, zone } : next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { id, createdAt, updatedAt, ...data } = form;
      const contact = contacts.find((c) => c.id === data.contactId);
      await onSubmit(tidyRecord({
        ...data,
        pcs: data.pcs === '' ? null : Number(data.pcs),
        pallets: data.pallets === '' ? null : Number(data.pallets),
        weight: data.weight === '' || data.weight === '.' ? null : Number(data.weight),
        // Names are kept alongside the links so a job still reads correctly
        // if the customer, contact or address is later removed
        customerName: customer?.name || '',
        contactName: contact?.name || '',
        fromName: addressById(data.fromAddressId)?.companyName || '',
        toName: addressById(data.toAddressId)?.companyName || '',
      }));
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
      setSaving(false);
    }
  };

  // Full details of the picked address, shown under its dropdown
  const addressDetails = (id) => {
    const address = addressById(id);
    if (!address) return null;
    const cityLine = [address.city, [address.state, address.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return (
      <span className="block mt-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm normal-case">
        <span className="block font-medium text-gray-900">{address.fullName || address.companyName}</span>
        {address.street && <span className="block text-gray-600">{address.street}</span>}
        {cityLine && <span className="block text-gray-600">{cityLine}</span>}
      </span>
    );
  };

  const addressOptions = addresses.map((address) => (
    <option key={address.id} value={address.id}>{addressLabel(address)}</option>
  ));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
          {initial.id ? 'Edit job' : 'Add job'}
        </h2>
        <Message message={message} />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Field label="Customer" required className="md:col-span-3">
            <select required autoFocus value={form.customerId} onChange={handleCustomerChange} className={inputClass}>
              <option value="">Select a customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field
            label="Contact person"
            className="md:col-span-3"
            hint={customer && contacts.length === 0 ? `No contacts saved for ${customer.name} yet` : undefined}
          >
            <select
              value={form.contactId}
              onChange={(e) => setForm((prev) => ({ ...prev, contactId: e.target.value }))}
              disabled={contacts.length === 0}
              className={inputClass}
            >
              <option value="">{customer ? 'None' : 'Select a customer first'}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{[c.name, c.title].filter(Boolean).join(' — ')}</option>
              ))}
            </select>
          </Field>

          <fieldset className="md:col-span-3 rounded-xl border border-gray-200 p-4 space-y-4">
            <legend className="px-2 text-sm font-semibold text-gray-900">Pickup</legend>
            <Field label="From address">
              <select value={form.fromAddressId} onChange={handleAddressChange('fromAddressId')} className={inputClass}>
                <option value="">Select pickup location</option>
                {addressOptions}
              </select>
              {addressDetails(form.fromAddressId)}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Last free day">
                <input type="date" {...plain('lastFreeDay')} className={inputClass} />
              </Field>
              <Field label="Pick up date">
                <input type="date" {...plain('pickupDate')} className={inputClass} />
              </Field>
              <Field label="Time in">
                <input type="time" {...plain('pickupTimeIn')} className={inputClass} />
              </Field>
              <Field label="Time out">
                <input type="time" {...plain('pickupTimeOut')} className={inputClass} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="md:col-span-3 rounded-xl border border-gray-200 p-4 space-y-4">
            <legend className="px-2 text-sm font-semibold text-gray-900">Delivery</legend>
            <Field label="To address">
              <select value={form.toAddressId} onChange={handleAddressChange('toAddressId')} className={inputClass}>
                <option value="">Select delivery location</option>
                {addressOptions}
              </select>
              {addressDetails(form.toAddressId)}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cut-off / lock-out / appt.">
                <input type="date" {...plain('cutoffDate')} className={inputClass} />
              </Field>
              <Field label="Delivery date">
                <input type="date" {...plain('deliveryDate')} className={inputClass} />
              </Field>
              <Field label="Time in">
                <input type="time" {...plain('deliveryTimeIn')} className={inputClass} />
              </Field>
              <Field label="Time out">
                <input type="time" {...plain('deliveryTimeOut')} className={inputClass} />
              </Field>
            </div>
          </fieldset>

          <Field label="Type" className="md:col-span-2">
            <select value={form.transportMode} onChange={(e) => setForm((prev) => ({ ...prev, transportMode: e.target.value }))} className={inputClass}>
              <option value="">Select type</option>
              {TRANSPORT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Move type" className="md:col-span-2">
            <select value={form.moveType} onChange={(e) => setForm((prev) => ({ ...prev, moveType: e.target.value }))} className={inputClass}>
              {MOVE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Zone" className="md:col-span-2" hint="Filled in from the address; change it if needed">
            <select value={form.zone} onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))} className={inputClass}>
              <option value="">None</option>
              {ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </Field>

          <Field label="Pcs" className="md:col-span-2">
            <input type="text" inputMode="numeric" {...bindCount('pcs')} className={inputClass} />
          </Field>
          <Field label="Pallets" className="md:col-span-2">
            <input type="text" inputMode="numeric" {...bindCount('pallets')} className={inputClass} />
          </Field>
          <Field label="Weight" className="md:col-span-2">
            <span className="flex">
              <input
                type="text"
                inputMode="decimal"
                value={form.weight}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) setForm((prev) => ({ ...prev, weight: e.target.value }));
                }}
                className={`${inputBase} flex-1 min-w-0 rounded-r-none`}
              />
              <select
                aria-label="Weight unit"
                value={form.weightUnit}
                onChange={(e) => setForm((prev) => ({ ...prev, weightUnit: e.target.value }))}
                className={`${inputBase} rounded-l-none border-l-0`}
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </span>
          </Field>
          <Field label="Date" required className="md:col-span-2">
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Pro #" className="md:col-span-2">
            <input type="text" {...bind('proNumber')} className={inputClass} />
          </Field>
          <Field label="Reference #" className="md:col-span-2">
            <input type="text" {...bind('referenceNumber')} className={inputClass} />
          </Field>

          <Field label="Notes" className="md:col-span-6">
            <textarea rows={3} {...bind('notes')} className={inputClass} />
          </Field>
        </div>

        {addresses.length === 0 && (
          <p className="text-sm text-gray-600">
            No addresses saved yet. <Link to="/addresses" className="text-purple-600 hover:underline">Add pickup and delivery locations</Link> first.
          </p>
        )}

        <div className="flex items-center gap-3">
          {initial.id && <button type="button" onClick={onDelete} className={dangerButtonClass}>Delete</button>}
          <span className="flex-1" />
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Saving…' : 'Save job'}</button>
        </div>
      </form>
    </div>
  );
}

function JobList() {
  const jobs = useJobs();
  const customers = useCustomers();
  const addresses = useAddresses();
  const invoices = useInvoices();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  // null = closed, {} = adding, a job = editing
  const [editing, setEditing] = useState(null);

  // Prefer the live record's name; fall back to the name saved on the job
  const names = (job) => ({
    customer: customers.byId(job.customerId)?.name || job.customerName || '',
    contact: customers.byId(job.customerId)?.contacts?.find((c) => c.id === job.contactId)?.name || job.contactName || '',
    from: addresses.byId(job.fromAddressId)?.companyName || job.fromName || '',
    to: addresses.byId(job.toAddressId)?.companyName || job.toName || '',
  });

  const visible = jobs.items.filter((job) => {
    const n = names(job);
    return [n.customer, n.contact, n.from, n.to, job.proNumber, job.referenceNumber, job.transportMode, job.moveType, job.notes, formatDate(job.date)]
      .join(' ').toLowerCase().includes(query.trim().toLowerCase());
  });

  const handleSubmit = async (data) => {
    if (editing.id) await jobs.update(editing.id, data);
    else await jobs.add(data);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this job${editing.proNumber ? ` (Pro # ${editing.proNumber})` : ''}?`)) return;
    await jobs.remove(editing.id);
    setEditing(null);
  };

  const editingForm = editing && {
    ...editing,
    pcs: editing.pcs == null ? '' : String(editing.pcs),
    pallets: editing.pallets == null ? '' : String(editing.pallets),
    weight: editing.weight == null ? '' : String(editing.weight),
  };

  return (
    <div className="p-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <button onClick={() => setEditing({})} className={primaryButtonClass}>Add job</button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by customer, pro #, reference #, location, contact or notes"
        className={inputClass}
      />

      <Card>
        {jobs.status === 'loading' && <p className="text-sm text-gray-600">Loading jobs…</p>}
        {jobs.status === 'error' && (
          <p className="text-sm text-red-600">
            Couldn’t load jobs. The database rules may not allow it yet — see firebase/README.md.
          </p>
        )}
        {jobs.status === 'ready' && jobs.items.length === 0 && (
          <p className="text-sm text-gray-600">No jobs yet. Add your first one to get started.</p>
        )}
        {jobs.status === 'ready' && jobs.items.length > 0 && visible.length === 0 && (
          <p className="text-sm text-gray-600">No jobs match “{query}”.</p>
        )}
        {visible.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Pro #</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">From</th>
                  <th className="py-2 pr-4">To</th>
                  <th className="py-2 pr-4">Pick up</th>
                  <th className="py-2 pr-4">Delivery</th>
                  <th className="py-2 pr-4">Zone</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Move type</th>
                  <th className="py-2 pr-4 text-right">Pcs</th>
                  <th className="py-2 pr-4 text-right">Pallets</th>
                  <th className="py-2 pr-4 text-right">Weight</th>
                  <th className="py-2 pr-4">Ref #</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((job) => {
                  const n = names(job);
                  const pickup = stopSummary(job.pickupDate, job.pickupTimeIn, job.pickupTimeOut);
                  const delivery = stopSummary(job.deliveryDate, job.deliveryTimeIn, job.deliveryTimeOut);
                  const invoice = invoices.items.find((item) => item.jobId === job.id);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setEditing(job)}
                      className="border-b last:border-0 hover:bg-purple-50/50 cursor-pointer align-top"
                    >
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDate(job.date)}</td>
                      <td className="py-2 pr-4 font-medium text-purple-700 whitespace-nowrap">{job.proNumber || '—'}</td>
                      <td className="py-2 pr-4">
                        {n.customer}
                        {job.notes && <p className="text-xs text-gray-500 max-w-xs truncate" title={job.notes}>{job.notes}</p>}
                      </td>
                      <td className="py-2 pr-4">
                        {n.from}
                        {job.lastFreeDay && <p className="text-xs text-amber-700 whitespace-nowrap">LFD {formatDate(job.lastFreeDay)}</p>}
                      </td>
                      <td className="py-2 pr-4">
                        {n.to}
                        {job.cutoffDate && <p className="text-xs text-amber-700 whitespace-nowrap">Cut-off/appt. {formatDate(job.cutoffDate)}</p>}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {pickup.date}
                        {pickup.times && <p className="text-xs text-gray-500">{pickup.times}</p>}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {delivery.date}
                        {delivery.times && <p className="text-xs text-gray-500">{delivery.times}</p>}
                      </td>
                      <td className="py-2 pr-4 font-medium">{job.zone}</td>
                      <td className="py-2 pr-4">{job.transportMode}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{job.moveType}</td>
                      <td className="py-2 pr-4 text-right">{job.pcs}</td>
                      <td className="py-2 pr-4 text-right">{job.pallets}</td>
                      <td className="py-2 pr-4 text-right whitespace-nowrap">{weightInLbs(job)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{job.referenceNumber}</td>
                      <td className="py-2 pr-4">{n.contact}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            // Don't also open the job editor
                            e.stopPropagation();
                            navigate(invoice ? `/invoices/${invoice.id}` : `/invoices/new?job=${job.id}`);
                          }}
                          className={invoice
                            ? "px-3 py-1 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            : "px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"}
                        >
                          {invoice ? `View invoice ${invoice.invoiceNumber}` : 'Invoice'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <JobForm
          key={editing.id || 'new'}
          initial={editingForm}
          customers={customers.items}
          addresses={addresses.items}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export default function Jobs() {
  return (
    <RequireSignIn title="Jobs">
      <JobList />
    </RequireSignIn>
  );
}
