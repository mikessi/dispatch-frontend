import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
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

const toDraft = (rates) => mapLeaves(rates, (v) => String(v));

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
      className="w-full min-w-[5rem] rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
    />
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default function RateSettings() {
  const { rates, status, updatedAt, saveRates } = useRates();
  const [draft, setDraft] = useState(() => toDraft(rates));
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pick up saved rates once they finish loading
  useEffect(() => {
    setDraft(toDraft(rates));
  }, [rates]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(rates)), [draft, rates]);
  const canEdit = Boolean(user);

  const setAt = (path, value) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      let node = next;
      for (const key of path.slice(0, -1)) node = node[key];
      node[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Sign-in failed. Check the email and password.' });
    }
  };

  const handleSave = async () => {
    const invalid = findInvalid(draft);
    if (invalid.length) {
      setMessage({ type: 'error', text: `Fix these fields (numbers only): ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '…' : ''}` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveRates(mapLeaves(draft, Number));
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

      {auth && (
        <div className="bg-white shadow rounded-lg p-4">
          {user ? (
            <div className="flex items-center justify-between text-sm">
              <span>Signed in as <strong>{user.email}</strong> — you can edit and save.</span>
              <button onClick={() => signOut(auth)} className="text-purple-600 hover:underline">Sign out</button>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-wrap items-end gap-2">
              <p className="w-full text-sm text-gray-600">Sign in to edit rates. Anyone can view them.</p>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username"
                className="rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password"
                className="rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500" />
              <button type="submit" className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700">Sign in</button>
            </form>
          )}
        </div>
      )}

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {MODES.map((mode) => (
        <Section key={mode} title={`${mode} Zone Rates`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="pr-2 py-1">Zone</th>
                  {TIERS.map((t) => <th key={t.key} className="px-1 py-1 font-medium">{t.label}</th>)}
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
        </Section>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Tolls by Zone ($)">
          <div className="grid grid-cols-3 gap-2">
            {ZONES.map((zone) => (
              <label key={zone} className="text-sm">
                <span className="block text-gray-600 mb-1">Zone {zone}</span>
                <NumberCell label={`Toll zone ${zone}`} value={draft.tolls[zone]} disabled={!canEdit} onChange={(v) => setAt(['tolls', zone], v)} />
              </label>
            ))}
          </div>
        </Section>

        <Section title="Transfer">
          <div className="space-y-2">
            {[['perLb', 'Rate ($/lb)'], ['min', 'Minimum ($)'], ['max', 'Maximum ($)']].map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="block text-gray-600 mb-1">{label}</span>
                <NumberCell label={`Transfer ${label}`} value={draft.transfer[key]} disabled={!canEdit} onChange={(v) => setAt(['transfer', key], v)} />
              </label>
            ))}
          </div>
        </Section>

        <Section title="PTT">
          <label className="block text-sm">
            <span className="block text-gray-600 mb-1">Rate ($/kg)</span>
            <NumberCell label="PTT rate per kg" value={draft.ptt.perKg} disabled={!canEdit} onChange={(v) => setAt(['ptt', 'perKg'], v)} />
          </label>
        </Section>
      </div>

      <Section title="Accessory Charges ($)">
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
      </Section>

      {canEdit && (
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t shadow-lg px-8 py-3 flex items-center justify-end gap-3 z-40">
          {isDirty && <span className="text-sm text-amber-600 mr-auto">You have unsaved changes</span>}
          <button
            onClick={() => setDraft(toDraft(DEFAULT_RATES))}
            className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
          >
            Fill in built-in defaults
          </button>
          <button
            onClick={() => setDraft(toDraft(rates))}
            disabled={!isDirty}
            className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Discard changes
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
