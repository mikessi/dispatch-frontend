const getRateForZone = (transport, zone) => {
  const rates = {
    Air: {
      A: { MIN: 35.00, "100": 0.0752, "1000": 0.0638, "2000": 0.0503, "3000": 0.0415, "5000": 0.0325, "10000": 0.0280, MAX: 300 },
      B: { MIN: 45.00, "100": 0.0838, "1000": 0.0715, "2000": 0.0550, "3000": 0.0465, "5000": 0.0350, "10000": 0.0300, MAX: 325 },
      C: { MIN: 55.00, "100": 0.0900, "1000": 0.0760, "2000": 0.0615, "3000": 0.0515, "5000": 0.0415, "10000": 0.0300, MAX: 325 },
      D: { MIN: 65.00, "100": 0.0975, "1000": 0.0825, "2000": 0.0698, "3000": 0.0605, "5000": 0.0525, "10000": 0.0325, MAX: 350 },
      E: { MIN: 90.00, "100": 0.1105, "1000": 0.1025, "2000": 0.0875, "3000": 0.0738, "5000": 0.0650, "10000": 0.0400, MAX: 400 },
      F: { MIN: 150.00, "100": 0.1238, "1000": 0.1154, "2000": 0.0968, "3000": 0.0819, "5000": 0.0731, "10000": 0.0430, MAX: 1000 }
    },
    Ocean: {
      A: { MIN: 35.00, "100": 0.0538, "1000": 0.0475, "2000": 0.0415, "3000": 0.0375, "5000": 0.0305, "10000": 0.0250, MAX: 300 },
      B: { MIN: 45.00, "100": 0.0595, "1000": 0.0512, "2000": 0.0425, "3000": 0.0398, "5000": 0.0315, "10000": 0.0275, MAX: 325 },
      C: { MIN: 55.00, "100": 0.0755, "1000": 0.0595, "2000": 0.0475, "3000": 0.0415, "5000": 0.0365, "10000": 0.0300, MAX: 325 },
      D: { MIN: 65.00, "100": 0.0826, "1000": 0.0645, "2000": 0.0515, "3000": 0.0465, "5000": 0.0405, "10000": 0.0325, MAX: 350 },
      E: { MIN: 90.00, "100": 0.1098, "1000": 0.1018, "2000": 0.0855, "3000": 0.0715, "5000": 0.0645, "10000": 0.0400, MAX: 400 },
      F: { MIN: 150.00, "100": 0.1193, "1000": 0.1125, "2000": 0.0965, "3000": 0.0800, "5000": 0.0730, "10000": 0.0425, MAX: 1000 }
    }
  };

  return rates[transport]?.[zone] || null;
};

const calcBetterRate = (first, second) => {
  return first > second ? second : first;
};

const getTollForZone = (zone) => {
  const tolls = {
    'A': 0,
    'B': 5,
    'C': 15,
    'D': 25,
    'E': 35,
    'F': 55
  };
  return tolls[zone] || 0;
};

const convertToPounds = (weight, unit) => {
  return unit === 'kg' ? weight * 2.20462 : weight;
};

const calculateRate = (transport, zone, weight, unit) => {
  const weightInLbs = convertToPounds(weight, unit);
  const rates = getRateForZone(transport, zone);
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

  const fuel = calculateFuel(baseRate);
  const toll = getTollForZone(zone);
  return { rate: baseRate, fuel, toll };
};

const calculateFuel = (rate) => {
  return rate * 0.22;
};

const calculateTransferRate = (weight, unit) => {
  const weightInLbs = convertToPounds(weight, unit);
  const rate = weightInLbs * 0.03;
  const fuel = rate * 0.22;

  if (rate < 35) {
    return { rate: 35, fuel: 7.7, toll: 0 };
  } else if (rate > 330) {
    return { rate: 330, fuel: 72.6, toll: 0 };
  }
  return { rate, fuel, toll: 0 };
};

const calculatePTTRate = (weight, unit) => {
  // Convert weight to kg if it's in lbs
  const weightInKg = unit === 'lbs' ? weight * 0.453592 : weight;
  const rate = weightInKg * 0.12;
  return { rate, fuel: 0, toll: 0 };
};

const calculateExportAndTransferRate = (transport, zone, weight, unit) => {
  const exportResult = calculateRate(transport, zone, weight, unit);
  const transferResult = calculateTransferRate(weight, unit);
  
  return {
    rate: exportResult.rate + transferResult.rate,
    fuel: exportResult.fuel + transferResult.fuel,
    toll: exportResult.toll // Only include export toll
  };
};

export {
  calculateRate,
  calculateFuel,
  calculateTransferRate,
  calculatePTTRate,
  calculateExportAndTransferRate
}; 