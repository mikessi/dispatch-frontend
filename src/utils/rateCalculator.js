// priceList is the full rate config (see defaultRates.js); saved settings are passed in here.
// rateMultiplier scales every zone rate (MIN, per-lb tiers, MAX), e.g. 1.15 for +15%
const getRateForZone = (priceList, transport, zone, rateMultiplier = 1) => {
  const zoneRates = priceList.zoneRates[transport]?.[zone];
  if (!zoneRates) return null;
  return Object.fromEntries(
    Object.entries(zoneRates).map(([tier, value]) => [tier, value * rateMultiplier])
  );
};

const calcBetterRate = (first, second) => {
  return first > second ? second : first;
};

const getTollForZone = (priceList, zone) => {
  return priceList.tolls[zone] || 0;
};

const convertToPounds = (weight, unit) => {
  return unit === 'kg' ? weight * 2.20462 : weight;
};

const DEFAULT_FUEL_PERCENT = 30;

const calculateRate = (priceList, transport, zone, weight, unit, fuelPercent = DEFAULT_FUEL_PERCENT, rateMultiplier = 1) => {
  const weightInLbs = convertToPounds(weight, unit);
  const rates = getRateForZone(priceList, transport, zone, rateMultiplier);
  if (!rates) return 0;

  let baseRate;
  if (weightInLbs < 1000) {
    const firstRate = weightInLbs * rates["100"];
    const secondRate = rates["1000"] * 1000;
    baseRate = firstRate < rates.MIN ? rates.MIN : calcBetterRate(firstRate, secondRate);
  } else if (weightInLbs < 2000) {
    const firstRate = weightInLbs * rates["1000"];
    const secondRate = rates["2000"] * 2000;
    baseRate = calcBetterRate(firstRate, secondRate);
  } else if (weightInLbs < 3000) {
    const firstRate = weightInLbs * rates["2000"];
    const secondRate = rates["3000"] * 3000;
    baseRate = calcBetterRate(firstRate, secondRate);
  } else if (weightInLbs < 5000) {
    const firstRate = weightInLbs * rates["3000"];
    const secondRate = rates["5000"] * 5000;
    baseRate = calcBetterRate(firstRate, secondRate);
  } else if (weightInLbs < 10000) {
    const firstRate = weightInLbs * rates["5000"];
    const secondRate = rates["10000"] * 10000;
    baseRate = calcBetterRate(firstRate, secondRate);
  } else if (weightInLbs < 100000) {
    const firstRate = weightInLbs * rates["10000"];
    baseRate = calcBetterRate(firstRate, rates.MAX);
  } else {
    baseRate = 0;
  }

  // The zone minimum is a floor for every tier, not just the first
  if (baseRate > 0) {
    baseRate = Math.max(baseRate, rates.MIN);
  }

  // Round up to 2 decimal places
  baseRate = Math.ceil(baseRate * 100) / 100;
  const fuel = calculateFuel(baseRate, fuelPercent);
  const toll = getTollForZone(priceList, zone);
  return { rate: baseRate, fuel, toll };
};

const calculateFuel = (rate, fuelPercent = DEFAULT_FUEL_PERCENT) => {
  // Fuel in cents; toFixed strips float noise so e.g. 35 * 22% stays 770, not 771
  const fuelCents = Number((rate * fuelPercent).toFixed(6));
  // Round up to 2 decimal places
  return Math.ceil(fuelCents) / 100;
};

const calculateTransferRate = (priceList, weight, unit, fuelPercent = DEFAULT_FUEL_PERCENT) => {
  const { perLb, min, max } = priceList.transfer;
  const weightInLbs = convertToPounds(weight, unit);
  let rate = weightInLbs * perLb;

  if (rate < min) {
    return { rate: min, fuel: calculateFuel(min, fuelPercent), toll: 0 };
  } else if (rate > max) {
    return { rate: max, fuel: calculateFuel(max, fuelPercent), toll: 0 };
  }
  const fuel = calculateFuel(rate, fuelPercent);
  // Round up to 2 decimal places
  rate = Math.ceil(rate * 100) / 100;
  return { rate, fuel, toll: 0 };
};

const calculatePTTRate = (priceList, weight, unit) => {
  // Convert weight to kg if it's in lbs
  const weightInKg = unit === 'lbs' ? weight * 0.453592 : weight;
  let rate = weightInKg * priceList.ptt.perKg;
  // Round up to 2 decimal places
  rate = Math.ceil(rate * 100) / 100;
  return { rate, fuel: 0, toll: 0 };
};

const calculateExportAndTransferRate = (priceList, transport, zone, weight, unit, fuelPercent = DEFAULT_FUEL_PERCENT, rateMultiplier = 1) => {
  const exportResult = calculateRate(priceList, transport, zone, weight, unit, fuelPercent, rateMultiplier);
  const transferResult = calculateTransferRate(priceList, weight, unit, fuelPercent);
  
  const totalRate = exportResult.rate + transferResult.rate;
  const totalFuel = exportResult.fuel + transferResult.fuel;
  
  return {
    rate: Math.ceil(totalRate * 100) / 100,
    fuel: Math.ceil(totalFuel * 100) / 100,
    toll: exportResult.toll // Only include export toll
  };
};

const EMPTY_QUOTE = {
  baseRate: 0, fuelSurcharge: 0, toll: 0,
  exportRate: 0, exportFuel: 0, exportToll: 0,
  transferRate: 0, transferFuel: 0
};

// The full price breakdown for one shipment. Used by the Quotes page and by
// invoices so both always price the same way.
const calculateQuote = (priceList, { moveType, transportMode, zone, weight, weightUnit, fuelPercent = DEFAULT_FUEL_PERCENT, rateMultiplier = 1 }) => {
  if (typeof weight !== 'number' || isNaN(weight)) return EMPTY_QUOTE;

  if (moveType === 'Transfer') {
    const transfer = calculateTransferRate(priceList, weight, weightUnit, fuelPercent);
    return { ...EMPTY_QUOTE, baseRate: transfer.rate, fuelSurcharge: transfer.fuel, transferRate: transfer.rate, transferFuel: transfer.fuel };
  }
  if (moveType === 'PTT') {
    return { ...EMPTY_QUOTE, baseRate: calculatePTTRate(priceList, weight, weightUnit).rate };
  }

  const zoneResult = calculateRate(priceList, transportMode, zone, weight, weightUnit, fuelPercent, rateMultiplier);
  if (!zoneResult) return EMPTY_QUOTE;
  const exportPart = { exportRate: zoneResult.rate, exportFuel: zoneResult.fuel, exportToll: zoneResult.toll };

  if (moveType === 'Export + Transfer') {
    const transfer = calculateTransferRate(priceList, weight, weightUnit, fuelPercent);
    return {
      ...exportPart,
      baseRate: zoneResult.rate + transfer.rate,
      fuelSurcharge: zoneResult.fuel + transfer.fuel,
      toll: zoneResult.toll,
      transferRate: transfer.rate,
      transferFuel: transfer.fuel
    };
  }
  return { ...EMPTY_QUOTE, ...exportPart, baseRate: zoneResult.rate, fuelSurcharge: zoneResult.fuel, toll: zoneResult.toll };
};

export {
  EMPTY_QUOTE,
  calculateQuote,
  DEFAULT_FUEL_PERCENT,
  calculateRate,
  calculateFuel,
  calculateTransferRate,
  calculatePTTRate,
  calculateExportAndTransferRate
}; 