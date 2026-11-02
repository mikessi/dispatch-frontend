import { useState } from "react";
import DataTable from "../components/DataTable";
import RequireSignIn from "../components/RequireSignIn";
import {
  Card, Field, Message, inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass,
} from "../components/ui";
import { useAddresses } from "../context/DataContext";
import { useRates } from "../context/RatesContext";
import { tidyField, tidyRecord } from "../utils/format";

const ZONES = ['A', 'B', 'C', 'D', 'E', 'F'];
const TYPES = ['Warehouse', 'Airline / Airport', 'Rail', 'Customer', 'Residential', 'Other'];
const EMPTY_ADDRESS = {
  // companyName is the short name shown in lists; fullName shows in full details
  companyName: '', fullName: '', type: '',
  street: '', city: '', state: '', zip: '', zone: '',
  hours: '', contactName: '', phone: '', email: '',
  appointmentRequired: false, appointmentNotes: '', notes: '',
};

const zoneForCity = (cityZones, city) =>
  cityZones.find((entry) => entry.city.toLowerCase() === city.trim().toLowerCase())?.zone || '';

const matches = (address, query) =>
  [address.companyName, address.fullName, address.type, address.street, address.city, address.state, address.zip, address.contactName]
    .join(' ').toLowerCase().includes(query.trim().toLowerCase());

function AddressForm({ initial, onSubmit, onDelete, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const { cityZones } = useRates().rates;
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  // Typing updates the field; leaving it tidies the text ("palatine" -> "Palatine")
  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    onBlur: () => setForm((prev) => ({ ...prev, [key]: tidyField(key, prev[key]) })),
  });
  const suggestedZone = zoneForCity(cityZones, form.city);

  const handleCityChange = (e) => {
    const city = e.target.value;
    setForm((prev) => {
      // Follow the zone chart unless the zone was set by hand to something else
      const wasAuto = prev.zone === '' || prev.zone === zoneForCity(cityZones, prev.city);
      return { ...prev, city, zone: wasAuto ? zoneForCity(cityZones, city) : prev.zone };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { id, createdAt, updatedAt, customerId, ...data } = form;
      await onSubmit(tidyRecord(data));
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">{initial.id ? 'Edit address' : 'Add address'}</h2>
        <Message message={message} />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Field label="Name" required hint="Short name shown in lists, e.g. on jobs" className="md:col-span-2">
            <input type="text" required autoFocus {...bind('companyName')} className={inputClass} />
          </Field>
          <Field label="Full name" hint="Shown in full details" className="md:col-span-4">
            <input type="text" {...bind('fullName')} className={inputClass} />
          </Field>
          <Field label="Type" className="md:col-span-6">
            <input type="text" list="address-types" {...bind('type')} className={inputClass} />
            <datalist id="address-types">{TYPES.map((type) => <option key={type} value={type} />)}</datalist>
          </Field>
          <Field label="Street" className="md:col-span-6">
            <input type="text" {...bind('street')} className={inputClass} />
          </Field>
          <Field label="City" className="md:col-span-2">
            <input type="text" list="zone-cities" {...bind('city')} onChange={handleCityChange} className={inputClass} />
            <datalist id="zone-cities">{cityZones.map(({ city }) => <option key={city} value={city} />)}</datalist>
          </Field>
          <Field label="State" className="md:col-span-1">
            <input type="text" {...bind('state')} maxLength={2} className={`${inputClass} uppercase`} />
          </Field>
          <Field label="ZIP" className="md:col-span-1">
            <input type="text" {...bind('zip')} className={inputClass} />
          </Field>
          <Field
            label="Zone"
            className="md:col-span-2"
            hint={suggestedZone ? `Zone chart: ${form.city.trim()} is Zone ${suggestedZone}` : 'City isn’t on the zone chart — pick one if it applies'}
          >
            <select {...bind('zone')} className={inputClass}>
              <option value="">None</option>
              {ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </Field>

          <Field label="Contact name" className="md:col-span-2">
            <input type="text" {...bind('contactName')} className={inputClass} />
          </Field>
          <Field label="Phone" className="md:col-span-2">
            <input type="tel" {...bind('phone')} className={inputClass} />
          </Field>
          <Field label="Email" className="md:col-span-2">
            <input type="email" {...bind('email')} className={inputClass} />
          </Field>

          <Field label="Hours" className="md:col-span-6">
            <input type="text" {...bind('hours')} placeholder="e.g. Mon–Fri 8:00 AM – 5:00 PM" className={inputClass} />
          </Field>
          <label className="md:col-span-6 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.appointmentRequired}
              onChange={(e) => setForm((prev) => ({ ...prev, appointmentRequired: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            Appointment required
          </label>
          {form.appointmentRequired && (
            <Field label="Appointment notes" className="md:col-span-6">
              <textarea rows={2} {...bind('appointmentNotes')} className={inputClass} />
            </Field>
          )}
          <Field label="Notes" className="md:col-span-6">
            <textarea rows={2} {...bind('notes')} className={inputClass} />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          {initial.id && <button type="button" onClick={onDelete} className={dangerButtonClass}>Delete</button>}
          <span className="flex-1" />
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Saving…' : 'Save address'}</button>
        </div>
      </form>
    </div>
  );
}

function AddressBook() {
  const addresses = useAddresses();
  const [query, setQuery] = useState('');
  // null = closed, {} = adding, an address = editing
  const [editing, setEditing] = useState(null);

  const visible = addresses.items.filter((address) => matches(address, query));

  const handleSubmit = async (data) => {
    if (editing.id) await addresses.update(editing.id, data);
    else await addresses.add(data);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${editing.companyName}?`)) return;
    await addresses.remove(editing.id);
    setEditing(null);
  };

  const columns = [
    {
      key: 'name', label: 'Name', width: 280,
      render: (address) => (
        <>
          <span className="font-medium text-purple-700">{address.companyName}</span>
          {address.fullName && <p className="text-gray-700">{address.fullName}</p>}
          {address.type && <p className="text-gray-500">{address.type}</p>}
        </>
      ),
    },
    {
      key: 'address', label: 'Address', width: 260,
      render: (address) => (
        <>
          {address.street && <p>{address.street}</p>}
          <p>{[address.city, [address.state, address.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</p>
        </>
      ),
    },
    { key: 'zone', label: 'Zone', width: 70, render: (address) => <span className="font-medium">{address.zone}</span> },
    {
      key: 'contact', label: 'Contact', width: 190,
      render: (address) => (
        <>
          {address.contactName && <p>{address.contactName}</p>}
          {address.phone && <p className="text-gray-600">{address.phone}</p>}
        </>
      ),
    },
    { key: 'hours', label: 'Hours', width: 220, render: (address) => address.hours || '' },
    { key: 'appointment', label: 'Appt.', width: 100, render: (address) => (address.appointmentRequired ? 'Required' : '') },
  ];

  return (
    <div className="p-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Addresses</h1>
        <button onClick={() => setEditing({})} className={primaryButtonClass}>Add address</button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, full name, street, city or ZIP"
        className={inputClass}
      />

      {visible.length === 0 ? (
        <Card>
          {addresses.status === 'loading' && <p className="text-sm text-gray-600">Loading addresses…</p>}
          {addresses.status === 'error' && (
            <p className="text-sm text-red-600">
              Couldn’t load addresses. The database rules may not allow it yet — see firebase/README.md.
            </p>
          )}
          {addresses.status === 'ready' && addresses.items.length === 0 && (
            <p className="text-sm text-gray-600">No addresses yet. Add pickup and delivery locations here.</p>
          )}
          {addresses.status === 'ready' && addresses.items.length > 0 && visible.length === 0 && (
            <p className="text-sm text-gray-600">No addresses match “{query}”.</p>
          )}
        </Card>
      ) : (
        <DataTable storageKey="addresses" columns={columns} rows={visible} onRowClick={setEditing} />
      )}

      {editing && (
        <AddressForm
          key={editing.id || 'new'}
          initial={editing}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export default function Addresses() {
  return (
    <RequireSignIn title="Addresses">
      <AddressBook />
    </RequireSignIn>
  );
}
