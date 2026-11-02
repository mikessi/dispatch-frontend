import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cityZones } from "./cityZones";
import { JOB_STAGES } from "./constants";
import { addDays, todayISO } from "./format";

// Made-up records for trying the app out. Every one is marked `sample: true`
// so they can all be removed again without touching real data.
// All names and street addresses are invented; phone numbers use the reserved
// 555 range and emails use example.com.

const zoneFor = (city) => cityZones.find((entry) => entry.city === city)?.zone || '';

const CUSTOMERS = [
  { name: 'Lakeshore Freight Forwarding', phone: '(847) 555-0101', contacts: [['Maria Alvarez', 'Import Manager'], ['Tom Becker', 'Billing']] },
  { name: 'Midwest Cargo Partners', phone: '(630) 555-0112', contacts: [['Priya Nair', 'Dispatcher']], rateOverrides: { transfer: { perLb: 0.025 } } },
  { name: 'Prairie Logistics Group', phone: '(708) 555-0123', contacts: [['Daniel Kim', 'Operations'], ['Sofia Rossi', 'Accounts Payable']] },
  { name: 'Windy City Imports', phone: '(773) 555-0134', contacts: [['Hannah Schmidt', 'Owner']], rateOverrides: { accessoryCharges: { 'Pallet Jack': 20 } } },
  { name: 'Great Lakes Global Trade', phone: '(847) 555-0145', contacts: [['Omar Haddad', 'Export Coordinator'], ['Grace Liu', 'Customer Service']] },
  { name: 'Northfield Electronics', phone: '(224) 555-0156', contacts: [['Ben Carter', 'Warehouse Lead']] },
  { name: 'Fox Valley Medical Supply', phone: '(630) 555-0167', contacts: [['Emily Nowak', 'Purchasing']], rateOverrides: { ptt: { perKg: 0.1 } } },
  { name: 'Harbor Point Apparel', phone: '(312) 555-0178', contacts: [['Lucas Meyer', 'Logistics'], ['Aisha Khan', 'Billing']] },
];

// [short name, full name, type, street, city, zip, contact, hours, appointment required]
const ADDRESSES = [
  ['Skyline Cargo', 'Skyline Air Cargo — ORD', 'Airline / Airport', '11601 W Touhy Ave', 'Des Plaines', '60018', 'Cargo Desk', 'Open 24 hours', false],
  ['Meridian Cargo', 'Meridian Airways Cargo — ORD', 'Airline / Airport', '11600 W Irving Park Rd', 'Franklin Park', '60131', 'Import Counter', 'Open 24 hours', false],
  ['Apex Handling', 'Apex Cargo Handling Services', 'Airline / Airport', '10000 W Lawrence Ave', 'Franklin Park', '60131', 'Release Desk', 'Mon–Sun 6:00 AM – 10:00 PM', false],
  ['Runway Ground', 'Runway Ground Services', 'Airline / Airport', '2500 Arthur Ave', 'Elk Grove Village', '60007', 'Dock Office', 'Mon–Fri 7:00 AM – 7:00 PM', false],
  ['Joliet Ramp', 'Prairie Rail Intermodal Terminal', 'Rail', '26664 S Baseline Rd', 'Joliet', '60436', 'Gate', 'Mon–Sat 6:00 AM – 6:00 PM', true],
  ['Lakeshore WH', 'Lakeshore Freight Warehouse', 'Warehouse', '850 Devon Ave', 'Bensenville', '60106', 'Receiving', 'Mon–Fri 8:00 AM – 4:30 PM', true],
  ['Midwest CFS', 'Midwest Cargo Container Freight Station', 'Warehouse', '1200 Mittel Dr', 'Wood Dale', '60191', 'CFS Office', 'Mon–Fri 8:00 AM – 5:00 PM', false],
  ['Prairie DC', 'Prairie Logistics Distribution Center', 'Warehouse', '455 Remington Blvd', 'Bolingbrook', '60440', 'Shipping', 'Mon–Fri 7:00 AM – 3:30 PM', true],
  ['Northfield Elec', 'Northfield Electronics Receiving Dock', 'Customer', '300 Lunt Ave', 'Schaumburg', '60193', 'Ben Carter', 'Mon–Fri 9:00 AM – 4:00 PM', false],
  ['Fox Valley Med', 'Fox Valley Medical Supply', 'Customer', '1750 Bilter Rd', 'Aurora', '60502', 'Emily Nowak', 'Mon–Fri 8:00 AM – 3:00 PM', true],
  ['Harbor Point', 'Harbor Point Apparel Fulfillment', 'Customer', '625 Gary Ave', 'Carol Stream', '60188', 'Lucas Meyer', 'Mon–Fri 8:00 AM – 5:00 PM', false],
  ['Windy City Imp', 'Windy City Imports Showroom', 'Customer', '980 N Rohlwing Rd', 'Addison', '60101', 'Hannah Schmidt', 'Tue–Sat 10:00 AM – 6:00 PM', false],
  ['Romeoville XD', 'Romeoville Cross Dock', 'Warehouse', '1100 Crossroads Pkwy', 'Romeoville', '60446', 'Dock Lead', 'Mon–Fri 6:00 AM – 6:00 PM', false],
  ['Great Lakes WH', 'Great Lakes Global Trade Warehouse', 'Warehouse', '2100 Estes Ave', 'Elk Grove Village', '60007', 'Omar Haddad', 'Mon–Fri 8:00 AM – 5:00 PM', false],
];

// [truck ID, make, model, year, VIN] — the VINs are made up
const TRUCKS = [
  ['101', 'Freightliner', 'M2 106', '2021', 'SAMPLE0000000T101'],
  ['102', 'Freightliner', 'M2 106', '2022', 'SAMPLE0000000T102'],
  ['103', 'Isuzu', 'NPR-HD', '2020', 'SAMPLE0000000T103'],
  ['104', 'Hino', 'L6', '2023', 'SAMPLE0000000T104'],
  ['105', 'Kenworth', 'T280', '2019', 'SAMPLE0000000T105'],
  ['106', 'International', 'MV607', '2022', 'SAMPLE0000000T106'],
  ['107', 'Peterbilt', '337', '2020', 'SAMPLE0000000T107'],
  ['108', 'Ford', 'F-650', '2021', 'SAMPLE0000000T108'],
  ['109', 'Isuzu', 'FTR', '2023', 'SAMPLE0000000T109'],
  ['110', 'Freightliner', 'Cascadia', '2018', 'SAMPLE0000000T110'],
];

const NOTES = ['', '', '', 'Liftgate needed at delivery.', 'Call 30 minutes ahead.', 'Fragile — do not stack.', 'Driver needs airport ID.', 'Dock 4 only.'];
const TYPES = ['Air', 'Air', 'Ocean', 'Local'];

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '');
const pad = (number) => String(number).padStart(2, '0');

// Job dates run from last week to about three weeks out, so the board has
// delivered, in-progress and upcoming work. Deterministic: same input, same data.
export const buildSampleData = (today = todayISO()) => {
  const now = new Date().toISOString();
  const customers = CUSTOMERS.map((customer, index) => ({
    key: `c${index}`,
    name: customer.name,
    phone: customer.phone,
    email: `dispatch@${slug(customer.name)}.example.com`,
    notes: '',
    contacts: customer.contacts.map(([name, title], contactIndex) => ({
      id: `sample-contact-${index}-${contactIndex}`,
      name,
      title,
      phone: `(847) 555-02${pad(index * 3 + contactIndex)}`,
      email: `${name.split(' ')[0].toLowerCase()}@${slug(customer.name)}.example.com`,
    })),
    rateOverrides: customer.rateOverrides || {},
  }));

  const addresses = ADDRESSES.map(([companyName, fullName, type, street, city, zip, contactName, hours, appointmentRequired], index) => ({
    key: `a${index}`,
    companyName, fullName, type, street, city, state: 'IL', zip,
    zone: zoneFor(city),
    hours, contactName,
    phone: `(847) 555-03${pad(index)}`,
    email: '',
    appointmentRequired,
    appointmentNotes: appointmentRequired ? 'Book at least 24 hours ahead.' : '',
    notes: '',
  }));

  const trucks = TRUCKS.map(([truckId, make, model, year, vin], index) => ({ key: `t${index}`, truckId, make, model, year, vin }));

  const pickups = addresses.filter((a) => a.type === 'Airline / Airport' || a.type === 'Rail');
  const deliveries = addresses.filter((a) => a.type === 'Customer' || a.type === 'Warehouse');
  // Offsets from today; several jobs share a day so there is something to reorder
  const offsets = [-6, -5, -5, -3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 5, 5, 6, 7, 7, 8, 9, 12, 13, 14, 14, 16, 19, 20, 21, 23, 26];
  const boardOrders = {};

  const jobs = offsets.map((offset, index) => {
    const customer = customers[index % customers.length];
    const from = pickups[index % pickups.length];
    const to = deliveries[(index * 3 + 1) % deliveries.length];
    const date = addDays(today, offset);
    const transportMode = TYPES[index % TYPES.length];
    const moveType = index % 9 === 4 ? 'Transfer' : index % 11 === 7 ? 'Export + Transfer' : index % 3 === 1 ? 'Export' : 'Import';
    const contact = customer.contacts[index % customer.contacts.length];
    const useKg = index % 5 === 3;

    // Past days are fully delivered, today is part-way through, future days are untouched
    const stagesDone = offset < 0 ? JOB_STAGES.length : offset === 0 ? [5, 3, 2, 0][index % 4] : 0;
    const statusTimes = {};
    JOB_STAGES.slice(0, stagesDone).forEach((stage, stageIndex) => {
      statusTimes[stage.key] = `${date}T${pad(7 + stageIndex + (index % 3))}:${pad((index * 7 + stageIndex * 20) % 60)}`;
    });
    const boardOrder = (boardOrders[date] = (boardOrders[date] ?? -1) + 1);
    // Past and today's jobs have trucks; some upcoming ones are still unassigned
    const pickupTruck = offset <= 0 || index % 3 === 0 ? trucks[index % trucks.length] : null;
    const deliveryTruck = offset <= 0 ? trucks[(index + (index % 4 === 0 ? 1 : 0)) % trucks.length] : null;

    return {
      customerKey: customer.key,
      fromKey: from.key,
      toKey: to.key,
      pickupTruckKey: pickupTruck?.key || '',
      deliveryTruckKey: deliveryTruck?.key || '',
      pickupTruckName: pickupTruck?.truckId || '',
      deliveryTruckName: deliveryTruck?.truckId || '',
      customerName: customer.name,
      contactId: contact.id,
      contactName: contact.name,
      fromName: from.companyName,
      toName: to.companyName,
      zone: to.zone || from.zone,
      transportMode,
      moveType,
      pcs: 2 + ((index * 7) % 40),
      pallets: 1 + (index % 6),
      weight: useKg ? 150 + index * 37 : 300 + index * 85,
      weightUnit: useKg ? 'kg' : 'lbs',
      date,
      proNumber: `S${1000 + index}`,
      referenceNumber: `PO-${4200 + index * 3}`,
      notes: NOTES[index % NOTES.length],
      lastFreeDay: index % 3 === 0 ? addDays(date, 2) : '',
      pickupDate: stagesDone >= 2 ? date : '',
      pickupTimeIn: statusTimes.arrivedPickup?.slice(11) || '',
      pickupTimeOut: statusTimes.pickedUp?.slice(11) || '',
      cutoffDate: to.appointmentRequired ? date : '',
      deliveryDate: stagesDone >= 5 ? date : '',
      deliveryTimeIn: statusTimes.arrivedDelivery?.slice(11) || '',
      deliveryTimeOut: statusTimes.delivered?.slice(11) || '',
      statusTimes,
      boardOrder,
    };
  });

  return { customers, addresses, trucks, jobs, now };
};

const COLLECTIONS = ['customers', 'addresses', 'trucks', 'jobs'];
const COLLECTION_FOR_KEY = { c: 'customers', a: 'addresses', t: 'trucks' };

export const addSampleData = async () => {
  const { customers, addresses, trucks, jobs, now } = buildSampleData();
  const batch = writeBatch(db);
  const stamp = { sample: true, createdAt: now, updatedAt: now };
  const ids = {};

  [...customers, ...addresses, ...trucks].forEach(({ key, ...record }) => {
    const ref = doc(collection(db, COLLECTION_FOR_KEY[key[0]]));
    ids[key] = ref.id;
    batch.set(ref, { ...record, ...stamp });
  });
  jobs.forEach(({ customerKey, fromKey, toKey, pickupTruckKey, deliveryTruckKey, ...job }) => {
    batch.set(doc(collection(db, 'jobs')), {
      ...job,
      customerId: ids[customerKey],
      fromAddressId: ids[fromKey],
      toAddressId: ids[toKey],
      pickupTruckId: ids[pickupTruckKey] || '',
      deliveryTruckId: ids[deliveryTruckKey] || '',
      ...stamp,
    });
  });
  await batch.commit();
  return { customers: customers.length, addresses: addresses.length, trucks: trucks.length, jobs: jobs.length };
};

// Deletes only records marked as sample data
export const removeSampleData = async () => {
  const snapshots = await Promise.all(
    COLLECTIONS.map((name) => getDocs(query(collection(db, name), where('sample', '==', true))))
  );
  const batch = writeBatch(db);
  let removed = 0;
  snapshots.forEach((snapshot) => snapshot.forEach((record) => {
    batch.delete(record.ref);
    removed += 1;
  }));
  if (removed > 0) await batch.commit();
  return removed;
};
