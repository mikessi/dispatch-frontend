// Tidy up what people type before it's saved, so records look consistent
// everywhere they're shown ("palatine" -> "Palatine").

const collapse = (text) => String(text ?? '').trim().replace(/\s+/g, ' ');

// Short words that should be all caps when typed in lowercase
const ACRONYMS = new Set(['llc', 'llp', 'usa', 'ups', 'dhl', 'ne', 'nw', 'se', 'sw', 'po']);

// Capitalise words typed in lowercase; leave anything the user capitalised
// themselves alone ("ABC Logistics", "McDonald").
export const titleCase = (text) =>
  collapse(text)
    .split(' ')
    .map((word) => {
      if (word !== word.toLowerCase()) return word;
      const bare = word.replace(/[.,]/g, '');
      if (ACRONYMS.has(bare)) return word.toUpperCase();
      return word
        // First letter of the word and of each part after - / ( & .
        .replace(/(^|[-/(&.])([a-z])/g, (match, before, letter) => before + letter.toUpperCase())
        // O'Hare, D'Angelo
        .replace(/^([OD])'([a-z])/, (match, prefix, letter) => `${prefix}'${letter.toUpperCase()}`);
    })
    .join(' ');

export const formatEmail = (text) => collapse(text).toLowerCase();

export const formatState = (text) => collapse(text).toUpperCase();

// US numbers become (847) 555-1234, keeping any extension; anything else is left as typed
export const formatPhone = (text) => {
  const value = collapse(text);
  const [, main, ext] = value.match(/^(.*?)(?:\s*(?:x|ext\.?|extension)\s*(\d+))?$/i);
  let digits = main.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return value;
  const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return ext ? `${formatted} ext. ${ext}` : formatted;
};

// Field name -> formatter. Free-text fields (notes, hours) are only trimmed.
const FORMATTERS = {
  name: titleCase,
  companyName: titleCase,
  fullName: titleCase,
  contactName: titleCase,
  title: titleCase,
  type: titleCase,
  street: titleCase,
  city: titleCase,
  state: formatState,
  zip: (text) => collapse(text).toUpperCase(),
  phone: formatPhone,
  proNumber: (text) => collapse(text).toUpperCase(),
  truckId: (text) => collapse(text).toUpperCase(),
  vin: (text) => collapse(text).toUpperCase().replace(/\s/g, ''),
  make: titleCase,
  model: titleCase,
  referenceNumber: (text) => collapse(text).toUpperCase(),
  email: formatEmail,
};

export const tidyField = (key, value) =>
  typeof value === 'string' ? (FORMATTERS[key] || ((text) => text.trim()))(value) : value;

// Apply the right formatter to every text field of a record
export const tidyRecord = (record) =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [key, tidyField(key, value)]));

// Today's date in the user's own time zone, as YYYY-MM-DD (what <input type="date"> uses)
export const todayISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// "2026-10-05" -> "10/05/2026"
export const formatDate = (iso) => {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${month}/${day}/${year}`;
};

// "2026-10-02" + 30 -> "2026-11-01"
export const addDays = (iso, days) => {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

// Now, in the user's own time zone, as YYYY-MM-DDTHH:mm (what <input type="datetime-local"> uses)
export const nowLocalDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// "2026-10-07T14:05" -> "10/07/2026 2:05 PM"
export const formatDateTime = (value) => {
  if (!value) return '';
  const [date, time = ''] = value.split('T');
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours)) return formatDate(date);
  return `${formatDate(date)} ${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
};
