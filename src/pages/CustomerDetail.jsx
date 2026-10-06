import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomerRatesEditor from "../components/CustomerRatesEditor";
import RequireSignIn from "../components/RequireSignIn";
import {
  Card, Field, Message, inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass,
} from "../components/ui";
import { useAddresses, useCustomers } from "../context/DataContext";
import { countRateOverrides } from "../utils/customerRates";
import { tidyField, tidyRecord } from "../utils/format";

const EMPTY_DETAILS = { name: '', street: '', city: '', state: '', zip: '', phone: '', email: '', notes: '' };
const EMPTY_CONTACT = { name: '', title: '', phone: '', email: '' };

const pickDetails = (customer) =>
  Object.fromEntries(Object.keys(EMPTY_DETAILS).map((key) => [key, customer?.[key] || '']));

function DetailsForm({ customer, onSave, onDelete }) {
  const [form, setForm] = useState(() => pickDetails(customer));
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const savedKey = JSON.stringify(pickDetails(customer));

  useEffect(() => {
    setForm(JSON.parse(savedKey));
  }, [savedKey]);

  const isNew = !customer;
  const isDirty = JSON.stringify(form) !== savedKey;
  // Typing updates the field; leaving it tidies the text ("palatine" -> "Palatine")
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
      await onSave(tidyRecord(form));
      if (!isNew) setMessage({ type: 'success', text: 'Customer saved.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Message message={message} />
      <Card title="Business">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Business name" required className="md:col-span-2">
            <input type="text" required {...bind('name')} className={inputClass} />
          </Field>
          <Field label="Main phone">
            <input type="tel" {...bind('phone')} className={inputClass} />
          </Field>
          <Field label="Main email">
            <input type="email" {...bind('email')} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Address">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Field label="Street" className="md:col-span-6">
            <input type="text" {...bind('street')} className={inputClass} />
          </Field>
          <Field label="City" className="md:col-span-3">
            <input type="text" {...bind('city')} className={inputClass} />
          </Field>
          <Field label="State" className="md:col-span-1">
            <input type="text" {...bind('state')} maxLength={2} className={`${inputClass} uppercase`} />
          </Field>
          <Field label="ZIP" className="md:col-span-2">
            <input type="text" {...bind('zip')} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Notes">
        <textarea rows={3} {...bind('notes')} className={inputClass} />
      </Card>

      <div className="flex items-center gap-3">
        {!isNew && (
          <button type="button" onClick={onDelete} className={dangerButtonClass}>Delete customer</button>
        )}
        <span className="flex-1" />
        {!isNew && (
          <button type="button" onClick={() => setForm(JSON.parse(savedKey))} disabled={!isDirty} className={secondaryButtonClass}>
            Discard changes
          </button>
        )}
        <button type="submit" disabled={saving || (!isNew && !isDirty)} className={primaryButtonClass}>
          {saving ? 'Saving…' : isNew ? 'Create customer' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function ContactForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  // Typing updates the field; leaving it tidies the text ("palatine" -> "Palatine")
  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    onBlur: () => setForm((prev) => ({ ...prev, [key]: tidyField(key, prev[key]) })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(tidyRecord(form));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border border-purple-200 bg-purple-50/40 rounded-lg p-4">
      <Field label="Name" required>
        <input type="text" required autoFocus {...bind('name')} className={inputClass} />
      </Field>
      <Field label="Title / role">
        <input type="text" {...bind('title')} placeholder="e.g. Dispatcher, Billing" className={inputClass} />
      </Field>
      <Field label="Phone">
        <input type="tel" {...bind('phone')} className={inputClass} />
      </Field>
      <Field label="Email">
        <input type="email" {...bind('email')} className={inputClass} />
      </Field>
      <div className="md:col-span-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>Cancel</button>
        <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Saving…' : 'Save contact'}</button>
      </div>
    </form>
  );
}

function ContactsTab({ customer, onSave }) {
  const contacts = customer.contacts || [];
  // null = nothing open, 'new' = adding, otherwise the id being edited
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState(null);

  const save = async (next) => {
    setMessage(null);
    try {
      await onSave(next);
      setEditing(null);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
    }
  };

  const handleAdd = (contact) => save([...contacts, { ...contact, id: crypto.randomUUID() }]);
  const handleEdit = (contact) => save(contacts.map((c) => (c.id === contact.id ? contact : c)));
  const handleDelete = (contact) => {
    if (window.confirm(`Remove ${contact.name} from ${customer.name}?`)) save(contacts.filter((c) => c.id !== contact.id));
  };

  return (
    <Card
      title="Contacts"
      actions={editing === null && (
        <button onClick={() => setEditing('new')} className={primaryButtonClass}>Add contact</button>
      )}
    >
      <div className="space-y-3">
        <Message message={message} />
        {editing === 'new' && <ContactForm initial={EMPTY_CONTACT} onSubmit={handleAdd} onCancel={() => setEditing(null)} />}
        {contacts.length === 0 && editing !== 'new' && (
          <p className="text-sm text-gray-600">No contacts yet. Add the people you deal with at {customer.name}.</p>
        )}
        {contacts.map((contact) =>
          editing === contact.id ? (
            <ContactForm
              key={contact.id}
              initial={{ ...EMPTY_CONTACT, ...contact }}
              onSubmit={handleEdit}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div key={contact.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b last:border-0 pb-3 last:pb-0 text-sm">
              <div className="w-56">
                <p className="font-medium text-gray-900">{contact.name}</p>
                {contact.title && <p className="text-gray-500">{contact.title}</p>}
              </div>
              <div className="w-40">{contact.phone && <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>}</div>
              <div className="flex-1 min-w-[12rem]">
                {contact.email && <a href={`mailto:${contact.email}`} className="text-purple-700 hover:underline">{contact.email}</a>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditing(contact.id)} className="text-purple-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(contact)} className="text-red-600 hover:underline">Remove</button>
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  );
}

function CustomerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customers = useCustomers();
  const addresses = useAddresses();
  const [tab, setTab] = useState('details');
  const isNew = id === 'new';
  const customer = isNew ? null : customers.byId(id);

  if (!isNew && customers.status !== 'ready') {
    return <p className="p-1 text-sm text-gray-600">{customers.status === 'error' ? 'Couldn’t load customers.' : 'Loading…'}</p>;
  }
  if (!isNew && !customer) {
    return (
      <div className="p-1 space-y-2">
        <p className="text-sm text-gray-600">This customer no longer exists.</p>
        <Link to="/customers" className="text-sm text-purple-600 hover:underline">← Back to customers</Link>
      </div>
    );
  }

  const handleCreate = async (details) => {
    const newId = await customers.add({ ...details, contacts: [], rateOverrides: {} });
    navigate(`/customers/${newId}`, { replace: true });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${customer.name}? This also removes its contacts and custom rates.`)) return;
    await customers.remove(customer.id);
    navigate('/customers', { replace: true });
  };

  const linkedAddresses = customer ? addresses.items.filter((address) => address.customerId === customer.id) : [];
  const tabs = customer
    ? [
        { key: 'details', label: 'Details' },
        { key: 'contacts', label: `Contacts (${(customer.contacts || []).length})` },
        { key: 'rates', label: `Custom Rates (${countRateOverrides(customer.rateOverrides)})` },
      ]
    : [];

  return (
    <div className="p-1 space-y-4">
      <div>
        <Link to="/customers" className="text-sm text-purple-600 hover:underline">← Customers</Link>
        <h1 className="text-2xl font-bold mt-1">{isNew ? 'New customer' : customer.name}</h1>
      </div>

      {tabs.length > 0 && (
        <div className="flex gap-1 border-b">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.key ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-600 hover:text-purple-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isNew && <DetailsForm customer={null} onSave={handleCreate} />}

      {customer && tab === 'details' && (
        <>
          <DetailsForm customer={customer} onSave={(details) => customers.update(customer.id, details)} onDelete={handleDelete} />
          <Card title="Addresses" actions={<Link to="/addresses" className="text-sm text-purple-600 hover:underline">Manage addresses</Link>}>
            {linkedAddresses.length === 0 ? (
              <p className="text-sm text-gray-600">No addresses are linked to this customer yet.</p>
            ) : (
              <ul className="text-sm divide-y">
                {linkedAddresses.map((address) => (
                  <li key={address.id} className="py-2">
                    <span className="font-medium">{address.fullName || address.companyName}</span>
                    <span className="text-gray-600"> — {[address.street, address.city, address.state, address.zip].filter(Boolean).join(', ')}</span>
                    {address.zone && <span className="ml-2 text-purple-700 font-medium">Zone {address.zone}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {customer && tab === 'contacts' && (
        <ContactsTab customer={customer} onSave={(contacts) => customers.update(customer.id, { contacts })} />
      )}

      {customer && tab === 'rates' && (
        <CustomerRatesEditor
          customer={customer}
          onSave={(rateOverrides) => customers.update(customer.id, { rateOverrides })}
        />
      )}
    </div>
  );
}

export default function CustomerDetail() {
  return (
    <RequireSignIn title="Customers">
      <CustomerView />
    </RequireSignIn>
  );
}
