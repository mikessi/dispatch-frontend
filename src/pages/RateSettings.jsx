import { useEffect, useMemo, useState } from "react";
import RequireSignIn from "../components/RequireSignIn";
import { Card, Message, smallInputBase, labelClass, primaryButtonClass, secondaryButtonClass } from "../components/ui";
import { useRates } from "../context/RatesContext";
import { DEFAULT_RATES } from "../utils/defaultRates";

const ZONES = ['A', 'B', 'C', 'D', 'E', 'F'];
const MODES = ['Air', 'Ocean'];
const TIERS = [
  { key: 'MIN', label: 'Min charge ($)' },
  { key: '100', label: 'Under 1,000 lb ($/lb)' },
  { key: '1000', label: '1,000+ lb ($/lb)' },
  { key: '2000', label: '2,000+ lb ($/lb)' },
  { key: '3000', label: '3,000+ lb ($/lb)' },
  { key: '5000', label: '5,000+ lb ($/lb)' },
  { key: '10000', label: '10,000+ lb ($/lb)' },
  { key: 'MAX', label: 'Max charge ($)' },
];
const ACCESSORY_UNITS = {
  "Empty Pallet": 'each',
  "In/Out Charge": 'each',
  "Volume Charge Per Pallet": 'per pallet',
  "Inside Delivery | per 100Lbs": 'per 100 lbs',
  "Detention $60/Hour": 'per hour',
  "Storage Charge $10/Pallet/Per Day": 'per pallet per day',
  "THC + Processing Fee per $100 Covered": 'per $100 covered',
};

// The form edits strings so partially typed numbers like "0." aren't lost
const mapLeaves = (obj, fn) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v !== null && typeof v === 'object' ? mapLeaves(v, fn) : fn(v)])
  );

// Only the numbers go in this draft. The city list has its own editor, and charge
// descriptions are text, so they're kept as saved.
const toDraft = ({ cityZones, accessoryDetails, ...numbers }) => mapLeaves(numbers, (v) => String(v));

// Each row gets a local id so rows keep their place while names are being typed
let nextRowId = 0;
const toCityDraft = (cityZones) => cityZones.map(({ city, zone }) => ({ rowId: nextRowId++, city, zone }));
const cleanCities = (rows) =>
  rows
    .map(({ city, zone }) => ({ city: city.trim().replace(/\s+/g, ' '), zone }))
    .sort((a, b) => a.city.localeCompare(b.city, undefined, { sensitivity: 'base' }));
const cityKey = (city) => city.trim().replace(/\s+/g, ' ').toLowerCase();

// Problems that block saving the city list
const findCityProblems = (rows) => {
  const problems = [];
  const counts = {};
  rows.forEach(({ city }) => { const k = cityKey(city); if (k) counts[k] = (counts[k] || 0) + 1; });
  if (rows.some(({ city }) => !city.trim())) problems.push('a city has no name');
  const dupes = Object.keys(counts).filter((k) => counts[k] > 1);
  if (dupes.length) problems.push(`listed twice: ${dupes.slice(0, 3).join(', ')}${dupes.length > 3 ? '…' : ''}`);
  if (rows.some(({ zone }) => !ZONES.includes(zone))) problems.push('a city has no zone');
  return { problems, dupes: new Set(dupes) };
};

function CityZonesEditor({ rows, onChange }) {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newZone, setNewZone] = useState('A');
  const [addError, setAddError] = useState('');
  const { dupes } = findCityProblems(rows);

  const q = search.trim().toLowerCase();
  const visible = rows
    .filter((r) => (!q || r.city.toLowerCase().includes(q)) && (!zoneFilter || r.zone === zoneFilter))
    .slice()
    .sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
  const perZone = ZONES.map((zone) => [zone, rows.filter((r) => r.zone === zone).length]);

  const update = (rowId, field, value) => onChange(rows.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  const remove = (rowId) => onChange(rows.filter((r) => r.rowId !== rowId));

  const add = (e) => {
    e.preventDefault();
    const name = newCity.trim().replace(/\s+/g, ' ');
    if (!name) return setAddError('Type a city name.');
    const existing = rows.find((r) => cityKey(r.city) === cityKey(name));
    if (existing) return setAddError(`${existing.city} is already in the list (zone ${existing.zone}).`);
    onChange([{ rowId: nextRowId++, city: name, zone: newZone, isNew: true }, ...rows]);
    setNewCity('');
    setAddError('');
  };

  return (
    <Card
      title="City Zones"
      actions={<span className="text-xs text-gray-500">{rows.length} cities · {perZone.map(([z, n]) => `${z}: ${n}`).join(' · ')}</span>}
    >
      <p className="text-sm text-gray-600 mb-4">
        The city lookup on Quotes and Addresses uses this list to fill in the zone.
      </p>

      <form onSubmit={add} className="flex flex-wrap items-end gap-2 mb-1">
        <label className="flex-1 min-w-[12rem]">
          <span className={labelClass}>Add a city</span>
          <input
            type="text"
            aria-label="New city name"
            value={newCity}
            onChange={(e) => { setNewCity(e.target.value); setAddError(''); }}
            placeholder="City name"
            className={`block w-full ${smallInputBase}`}
          />
        </label>
        <label>
          <span className={labelClass}>Zone</span>
          <select value={newZone} onChange={(e) => setNewZone(e.target.value)} className={smallInputBase}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
        <button type="submit" className={secondaryButtonClass}>Add city</button>
      </form>
      {addError && <p className="text-xs text-red-600 mb-1">{addError}</p>}

      <div className="mt-4 mb-2 flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cities"
          aria-label="Search cities"
          className={`block flex-1 ${smallInputBase}`}
        />
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} aria-label="Show zone" className={smallInputBase}>
          <option value="">All zones</option>
          {ZONES.map((z) => <option key={z} value={z}>Zone {z}</option>)}
        </select>
      </div>

      <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2 w-24">Zone</th>
              <th className="px-3 py-2 w-20"><span className="sr-only">Delete</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-4 text-gray-500">No matching cities.</td></tr>
            )}
            {visible.map((row) => {
              const bad = !row.city.trim() || dupes.has(cityKey(row.city));
              return (
                <tr key={row.rowId} className={`border-t border-gray-100 ${row.isNew ? 'bg-purple-50/50' : ''}`}>
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      aria-label="City name"
                      value={row.city}
                      onChange={(e) => update(row.rowId, 'city', e.target.value)}
                      className={`block w-full ${smallInputBase} ${bad ? 'border-red-400 bg-red-50' : ''}`}
                    />
                  </td>
                  <td className="px-3 py-1">
                    <select
                      aria-label={`Zone for ${row.city}`}
                      value={row.zone}
                      onChange={(e) => update(row.rowId, 'zone', e.target.value)}
                      className={smallInputBase}
                    >
                      {!ZONES.includes(row.zone) && <option value={row.zone}>—</option>}
                      {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1 text-right">
                    <button
                      type="button"
                      onClick={() => remove(row.rowId)}
                      className="text-xs font-medium text-red-600 hover:underline"
                      aria-label={`Delete ${row.city || 'city'}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const findInvalid = (draft) => {
  const bad = [];
  const walk = (obj, path) => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'object') walk(v, [...path, k]);
      else if (v.trim() === '' || !(Number(v) >= 0)) bad.push([...path, k].join(' › '));
    }
  };
  walk(draft, []);
  return bad;
};

function NumberCell({ value, onChange, disabled, label }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => {
        if (/^\d*\.?\d*$/.test(e.target.value)) onChange(e.target.value);
      }}
      className={`block w-full min-w-[4.5rem] ${smallInputBase}`}
    />
  );
}

function RateSettingsEditor() {
  const { rates, status, updatedAt, saveRates } = useRates();
  const [draft, setDraft] = useState(() => toDraft(rates));
  const [cityDraft, setCityDraft] = useState(() => toCityDraft(rates.cityZones));
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pick up saved rates once they finish loading
  useEffect(() => {
    setDraft(toDraft(rates));
    setCityDraft(toCityDraft(rates.cityZones));
  }, [rates]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(draft) !== JSON.stringify(toDraft(rates)) ||
      JSON.stringify(cleanCities(cityDraft)) !== JSON.stringify(cleanCities(rates.cityZones)),
    [draft, cityDraft, rates]
  );
  const resetTo = (source) => {
    setDraft(toDraft(source));
    setCityDraft(toCityDraft(source.cityZones));
  };
  // The page is only shown to signed-in staff, who can all edit
  const canEdit = true;

  const setAt = (path, value) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      let node = next;
      for (const key of path.slice(0, -1)) node = node[key];
      node[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    const invalid = findInvalid(draft);
    if (invalid.length) {
      setMessage({ type: 'error', text: `Fix these fields (numbers only): ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '…' : ''}` });
      return;
    }
    const { problems } = findCityProblems(cityDraft);
    if (problems.length) {
      setMessage({ type: 'error', text: `Fix the City Zones list: ${problems.join('; ')}.` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveRates({
        ...mapLeaves(draft, Number),
        accessoryDetails: rates.accessoryDetails || {},
        cityZones: cleanCities(cityDraft),
      });
      setMessage({ type: 'success', text: 'Saved. Quotes now use these rates for everyone.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const statusText = {
    loading: 'Loading saved rates…',
    saved: `Showing saved rates${updatedAt ? ` (last saved ${new Date(updatedAt).toLocaleString()})` : ''}.`,
    defaults: 'No saved rates yet — showing the built-in defaults.',
    offline: 'The database isn’t connected yet, so rates can’t be saved. Quotes use the built-in defaults.',
    error: 'Couldn’t load saved rates — showing the built-in defaults.',
  }[status];

  return (
    <div className="p-1 space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold mb-1">Rate Settings</h1>
        <p className="text-sm text-gray-600">{statusText}</p>
      </div>

      <Message message={message} />

      {MODES.map((mode) => (
        <Card key={mode} title={`${mode} Zone Rates`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <th className="pr-2 py-1">Zone</th>
                  {TIERS.map((t) => <th key={t.key} className="px-1 py-1">{t.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {ZONES.map((zone) => (
                  <tr key={zone}>
                    <td className="pr-2 py-1 font-semibold">{zone}</td>
                    {TIERS.map((t) => (
                      <td key={t.key} className="px-1 py-1">
                        <NumberCell
                          label={`${mode} zone ${zone} ${t.label}`}
                          value={draft.zoneRates[mode][zone][t.key]}
                          disabled={!canEdit}
                          onChange={(v) => setAt(['zoneRates', mode, zone, t.key], v)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Tolls by Zone ($)">
          <div className="grid grid-cols-3 gap-2">
            {ZONES.map((zone) => (
              <label key={zone}>
                <span className={labelClass}>Zone {zone}</span>
                <NumberCell label={`Toll zone ${zone}`} value={draft.tolls[zone]} disabled={!canEdit} onChange={(v) => setAt(['tolls', zone], v)} />
              </label>
            ))}
          </div>
        </Card>

        <Card title="Transfer">
          <div className="space-y-2">
            {[['perLb', 'Rate ($/lb)'], ['min', 'Minimum ($)'], ['max', 'Maximum ($)']].map(([key, label]) => (
              <label key={key} className="block">
                <span className={labelClass}>{label}</span>
                <NumberCell label={`Transfer ${label}`} value={draft.transfer[key]} disabled={!canEdit} onChange={(v) => setAt(['transfer', key], v)} />
              </label>
            ))}
          </div>
        </Card>

        <Card title="PTT">
          <label className="block">
            <span className={labelClass}>Rate ($/kg)</span>
            <NumberCell label="PTT rate per kg" value={draft.ptt.perKg} disabled={!canEdit} onChange={(v) => setAt(['ptt', 'perKg'], v)} />
          </label>
        </Card>
      </div>

      <Card title="Accessory Charges ($)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {Object.keys(draft.accessoryCharges).map((name) => (
            <label key={name} className="flex items-center gap-3 text-sm">
              <span className="flex-1 text-gray-700">
                {name}
                {ACCESSORY_UNITS[name] && <span className="text-gray-400"> · {ACCESSORY_UNITS[name]}</span>}
              </span>
              <div className="w-28">
                <NumberCell label={name} value={draft.accessoryCharges[name]} disabled={!canEdit} onChange={(v) => setAt(['accessoryCharges', name], v)} />
              </div>
            </label>
          ))}
        </div>
      </Card>

      <CityZonesEditor rows={cityDraft} onChange={setCityDraft} />

      {canEdit && (
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t shadow-lg px-8 py-3 flex items-center justify-end gap-3 z-40">
          {isDirty && <span className="text-sm text-amber-600 mr-auto">You have unsaved changes</span>}
          <button
            onClick={() => resetTo(DEFAULT_RATES)}
            className={secondaryButtonClass}
          >
            Fill in built-in defaults
          </button>
          <button
            onClick={() => resetTo(rates)}
            disabled={!isDirty}
            className={secondaryButtonClass}
          >
            Discard changes
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={primaryButtonClass}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function RateSettings() {
  return (
    <RequireSignIn title="Rate Settings">
      <RateSettingsEditor />
    </RequireSignIn>
  );
}
