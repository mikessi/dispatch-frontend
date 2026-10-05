import { useEffect, useMemo, useState } from "react";
import { useRates } from "../context/RatesContext";
import { countRateOverrides } from "../utils/customerRates";
import { Card, Message, inputClass, primaryButtonClass, secondaryButtonClass } from "./ui";

// Which standard rates a customer can override. Each field's path matches the
// rates config (defaultRates.js), so adding a section here is all it takes.
const buildSections = (rates) => [
  {
    title: 'Transfer',
    fields: [
      { path: ['transfer', 'perLb'], label: 'Rate', unit: '$/lb' },
      { path: ['transfer', 'min'], label: 'Minimum', unit: '$' },
      { path: ['transfer', 'max'], label: 'Maximum', unit: '$' },
    ],
  },
  {
    title: 'PTT',
    fields: [{ path: ['ptt', 'perKg'], label: 'Rate', unit: '$/kg' }],
  },
  {
    title: 'Accessory Charges',
    fields: Object.keys(rates.accessoryCharges).map((name) => ({
      path: ['accessoryCharges', name],
      label: name,
      unit: '$',
    })),
  },
];

const getAt = (obj, path) => path.reduce((node, key) => node?.[key], obj);
const keyOf = (path) => path.join('\u0000');

// Form state: { [pathKey]: "typed text" }; blank means "use the standard rate"
const toDraft = (overrides, sections) => {
  const draft = {};
  for (const section of sections) {
    for (const field of section.fields) {
      const value = getAt(overrides, field.path);
      draft[keyOf(field.path)] = typeof value === 'number' ? String(value) : '';
    }
  }
  return draft;
};

const toOverrides = (draft, sections) => {
  const overrides = {};
  for (const section of sections) {
    for (const { path } of section.fields) {
      const text = draft[keyOf(path)].trim();
      if (text === '' || !(Number(text) >= 0)) continue;
      let node = overrides;
      for (const key of path.slice(0, -1)) node = node[key] = node[key] || {};
      node[path[path.length - 1]] = Number(text);
    }
  }
  return overrides;
};

export default function CustomerRatesEditor({ customer, onSave }) {
  const { rates } = useRates();
  const sections = useMemo(() => buildSections(rates), [rates]);
  const saved = customer.rateOverrides;
  // Live updates hand us a new object each time; compare by content so an unrelated
  // update doesn't wipe what's being typed
  const savedKey = JSON.stringify(saved || {});
  const [draft, setDraft] = useState(() => toDraft(saved, sections));
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(toDraft(JSON.parse(savedKey), sections));
  }, [savedKey, sections]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(toDraft(saved, sections));
  const customCount = countRateOverrides(toOverrides(draft, sections));

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await onSave(toOverrides(draft, sections));
      setMessage({ type: 'success', text: 'Custom rates saved.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Save failed: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter a price only where this customer differs from your standard rates. Anything left blank follows
        Rate Settings, including future changes there.
      </p>
      <Message message={message} />

      {sections.map((section) => (
        <Card key={section.title} title={section.title}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {section.fields.map((field) => {
              const key = keyOf(field.path);
              const standard = getAt(rates, field.path);
              const isCustom = draft[key].trim() !== '';
              return (
                <label key={key} className="flex items-center gap-3 text-sm">
                  <span className={`flex-1 ${isCustom ? 'font-medium text-purple-700' : 'text-gray-700'}`}>
                    {field.label}
                    <span className="block text-xs font-normal text-gray-400">Standard: {standard} {field.unit}</span>
                  </span>
                  <span className="w-28 shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`${section.title} ${field.label} custom rate`}
                      value={draft[key]}
                      placeholder={String(standard)}
                      onChange={(e) => {
                        if (/^\d*\.?\d*$/.test(e.target.value)) setDraft((prev) => ({ ...prev, [key]: e.target.value }));
                      }}
                      className={`${inputClass} ${isCustom ? 'border-purple-400 bg-white' : ''}`}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="flex items-center justify-end gap-3">
        <span className="mr-auto text-sm text-gray-600">
          {customCount === 0 ? 'Using standard rates for everything' : `${customCount} custom rate${customCount === 1 ? '' : 's'}`}
          {isDirty && <span className="text-amber-600"> · unsaved changes</span>}
        </span>
        <button
          onClick={() => setDraft(toDraft(undefined, sections))}
          disabled={customCount === 0}
          className={secondaryButtonClass}
        >
          Clear all
        </button>
        <button onClick={() => setDraft(toDraft(saved, sections))} disabled={!isDirty} className={secondaryButtonClass}>
          Discard changes
        </button>
        <button onClick={handleSave} disabled={!isDirty || saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save custom rates'}
        </button>
      </div>
    </div>
  );
}
