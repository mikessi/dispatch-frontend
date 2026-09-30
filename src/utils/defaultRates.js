// Built-in prices. Saved rates from the Rate Settings page override these.
export const DEFAULT_RATES = {
  // Per-zone price tables: MIN charge, per-lb rate by weight tier, MAX charge
  zoneRates: {
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
  },
  tolls: { A: 0, B: 5, C: 15, D: 25, E: 35, F: 55 },
  transfer: { perLb: 0.03, min: 35, max: 330 },
  ptt: { perKg: 0.12 },
  // Inside Delivery is per 100 lbs, THC per $100 covered, Detention per hour
  accessoryCharges: {
    "26' Straight Truck Show place Delivery": 400,
    "53' Semi Trailer Show Place Delivery": 600,
    "AM/PM Special": 50,
    "DG/Haz Mat | A, B Zone": 25,
    "DG/Haz Mat | C, D Zone": 50,
    "Downtown Area": 50,
    "Empty Pallet": 15,
    "Liftgate 1~4": 65,
    "Liftgate 5~8": 90,
    "Liftgate 9~12": 120,
    "Pallet Jack": 25,
    "Prepull": 50,
    "Residential Area": 50,
    "Same Day Delivery": 50,
    "Weekend Special": 150,
    "In/Out Charge": 10,
    "Inside Delivery | per 100Lbs": 25,
    "Volume Charge Per Pallet": 15,
    "Detention $60/Hour": 60,
    "COD | Collect On Delivery": 25,
    "Stop Over Charge": 50,
    "Storage Charge $10/Pallet/Per Day": 10,
    "THC + Processing Fee per $100 Covered": 15
  }
};

// Fill anything missing from saved rates (e.g. a newly added charge) with defaults
export const withDefaults = (saved) => {
  if (!saved) return DEFAULT_RATES;
  const zoneRates = {};
  for (const [mode, zones] of Object.entries(DEFAULT_RATES.zoneRates)) {
    zoneRates[mode] = {};
    for (const [zone, tiers] of Object.entries(zones)) {
      zoneRates[mode][zone] = { ...tiers, ...saved.zoneRates?.[mode]?.[zone] };
    }
  }
  return {
    zoneRates,
    tolls: { ...DEFAULT_RATES.tolls, ...saved.tolls },
    transfer: { ...DEFAULT_RATES.transfer, ...saved.transfer },
    ptt: { ...DEFAULT_RATES.ptt, ...saved.ptt },
    accessoryCharges: { ...DEFAULT_RATES.accessoryCharges, ...saved.accessoryCharges }
  };
};
