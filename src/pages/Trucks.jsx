import { useState } from "react";
import DataTable from "../components/DataTable";
import RequireSignIn from "../components/RequireSignIn";
import {
  Card, Field, Message, inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass,
} from "../components/ui";
import { useTrucks } from "../context/DataContext";
import { tidyField, tidyRecord } from "../utils/format";

const EMPTY_TRUCK = { truckId: '', make: '', model: '', year: '', vin: '' };

function TruckForm({ initial, existing, onSubmit, onDelete, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_TRUCK, ...initial });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Typing updates the field; leaving it tidies the text
  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    onBlur: () => setForm((prev) => ({ ...prev, [key]: tidyField(key, prev[key]) })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, createdAt, updatedAt, ...data } = form;
    const truck = tidyRecord(data);
    // Truck IDs are how trucks are picked on jobs, so two can't share one
    if (existing.some((other) => other.id !== id && other.truckId === truck.truckId)) {
      setMessage({ type: 'error', text: `There’s already a truck with ID ${truck.truckId}.` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await onSubmit(truck);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-3 sm:p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4 sm:p-6 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
          {initial.id ? 'Edit truck' : 'Add truck'}
        </h2>
        <Message message={message} />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Field label="Truck ID" required hint="The number you call it by, e.g. 12 or T-105" className="md:col-span-2">
            <input type="text" required autoFocus {...bind('truckId')} className={inputClass} />
          </Field>
          <Field label="Make" className="md:col-span-2">
            <input type="text" {...bind('make')} placeholder="e.g. Freightliner" className={inputClass} />
          </Field>
          <Field label="Model" className="md:col-span-2">
            <input type="text" {...bind('model')} placeholder="e.g. M2 106" className={inputClass} />
          </Field>
          <Field label="Year" className="md:col-span-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={form.year}
              onChange={(e) => {
                if (/^\d{0,4}$/.test(e.target.value)) setForm((prev) => ({ ...prev, year: e.target.value }));
              }}
              className={inputClass}
            />
          </Field>
          <Field label="VIN #" className="md:col-span-4">
            <input type="text" maxLength={17} {...bind('vin')} className={`${inputClass} uppercase`} />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          {initial.id && <button type="button" onClick={onDelete} className={dangerButtonClass}>Delete</button>}
          <span className="flex-1" />
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Saving…' : 'Save truck'}</button>
        </div>
      </form>
    </div>
  );
}

function TruckList() {
  const trucks = useTrucks();
  const [query, setQuery] = useState('');
  // null = closed, {} = adding, a truck = editing
  const [editing, setEditing] = useState(null);

  const visible = trucks.items.filter((truck) =>
    [truck.truckId, truck.make, truck.model, truck.year, truck.vin].join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );

  const handleSubmit = async (data) => {
    if (editing.id) await trucks.update(editing.id, data);
    else await trucks.add(data);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete truck ${editing.truckId}? Jobs it was assigned to keep its number.`)) return;
    await trucks.remove(editing.id);
    setEditing(null);
  };

  const columns = [
    { key: 'truckId', label: 'Truck ID', width: 120, render: (truck) => <span className="font-medium text-purple-700">{truck.truckId}</span> },
    { key: 'make', label: 'Make', width: 180, render: (truck) => truck.make },
    { key: 'model', label: 'Model', width: 180, render: (truck) => truck.model },
    { key: 'year', label: 'Year', width: 90, render: (truck) => truck.year },
    { key: 'vin', label: 'VIN #', width: 240, render: (truck) => <span className="font-mono text-xs">{truck.vin}</span> },
  ];

  return (
    <div className="p-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trucks</h1>
        <button onClick={() => setEditing({})} className={primaryButtonClass}>Add truck</button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by truck ID, make, model, year or VIN"
        className={inputClass}
      />

      {visible.length === 0 ? (
        <Card>
          {trucks.status === 'loading' && <p className="text-sm text-gray-600">Loading trucks…</p>}
          {trucks.status === 'error' && (
            <p className="text-sm text-red-600">
              Couldn’t load trucks. The database rules need re-publishing to include trucks — see firebase/README.md.
            </p>
          )}
          {trucks.status === 'ready' && trucks.items.length === 0 && (
            <p className="text-sm text-gray-600">No trucks yet. Add your first one to assign it to jobs.</p>
          )}
          {trucks.status === 'ready' && trucks.items.length > 0 && visible.length === 0 && (
            <p className="text-sm text-gray-600">No trucks match “{query}”.</p>
          )}
        </Card>
      ) : (
        <DataTable storageKey="trucks" columns={columns} rows={visible} onRowClick={setEditing} />
      )}

      {editing && (
        <TruckForm
          key={editing.id || 'new'}
          initial={editing}
          existing={trucks.items}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export default function Trucks() {
  return (
    <RequireSignIn title="Trucks">
      <TruckList />
    </RequireSignIn>
  );
}
