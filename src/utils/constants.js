// Shared option lists
export const ZONES = ['A', 'B', 'C', 'D', 'E', 'F'];
// Quotes price imports and exports the same way, so they share one option there
export const MOVE_TYPES = ['Import/Export', 'Transfer', 'PTT', 'Export + Transfer'];
// Jobs (and their invoices) say which one it actually is
export const JOB_MOVE_TYPES = ['Import', 'Export', 'Transfer', 'PTT', 'Export + Transfer'];

// Jobs saved before imports and exports were split said "Import/Export"; they count as Import
export const jobMoveType = (moveType) => (JOB_MOVE_TYPES.includes(moveType) ? moveType : JOB_MOVE_TYPES[0]);

// A saved invoice keeps whatever move type it was issued with, so an old value stays in its list
export const invoiceMoveTypeOptions = (current) =>
  current && !JOB_MOVE_TYPES.includes(current) ? [current, ...JOB_MOVE_TYPES] : JOB_MOVE_TYPES;

// Import, Export and Export + Transfer are priced from the zone tables; Transfer and PTT aren't
export const usesZoneRates = (moveType) => moveType !== 'Transfer' && moveType !== 'PTT';

// Short codes for the Dispatch Board: "Air" + "Import" -> "A,I"
const TRANSPORT_CODES = { Air: 'A', Ocean: 'O', Local: 'L' };
const MOVE_CODES = { Import: 'I', Export: 'E', Transfer: 'T', PTT: 'P', 'Export + Transfer': 'E+T' };
export const jobTypeCode = (transportMode, moveType) =>
  [TRANSPORT_CODES[transportMode] || transportMode, MOVE_CODES[jobMoveType(moveType)]].filter(Boolean).join(',');
// How the freight travels. Air and Ocean have zone rate tables; Local is priced at the Ocean rates.
export const TRANSPORT_TYPES = ['Air', 'Ocean', 'Local'];

// The stages a job moves through, in order. Each is stored on the job as the
// date and time it happened (job.statusTimes[key]); the Dispatch Board shows them as checkboxes.
export const JOB_STAGES = [
  { key: 'arrivedPickup', label: 'Arrived at pickup', short: 'At pickup' },
  { key: 'pickedUp', label: 'Picked up', short: 'Picked up' },
  { key: 'enRoute', label: 'En route', short: 'En route' },
  { key: 'arrivedDelivery', label: 'Arrived at delivery', short: 'At delivery' },
  { key: 'delivered', label: 'Delivered', short: 'Delivered' },
];
