// A customer's custom rates are stored sparsely, in the same shape as the standard
// rates (see defaultRates.js), holding only the values that differ:
//   { transfer: { perLb: 0.025 }, accessoryCharges: { "Pallet Jack": 20 } }
// Anything not listed follows the standard rates, including later changes to them.

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Standard rates with the customer's overrides laid on top
export const applyRateOverrides = (rates, overrides) => {
  if (!isPlainObject(overrides)) return rates;
  const result = { ...rates };
  for (const [key, value] of Object.entries(overrides)) {
    // An override for a rate that no longer exists (e.g. a removed accessory charge) is ignored
    if (!(key in rates)) continue;
    if (isPlainObject(value)) {
      if (isPlainObject(rates[key])) result[key] = applyRateOverrides(rates[key], value);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = value;
    }
  }
  return result;
};

export const countRateOverrides = (overrides) => {
  if (!isPlainObject(overrides)) return 0;
  return Object.values(overrides).reduce(
    (total, value) => total + (isPlainObject(value) ? countRateOverrides(value) : 1),
    0
  );
};

export const customerRates = (rates, customer) => applyRateOverrides(rates, customer?.rateOverrides);
