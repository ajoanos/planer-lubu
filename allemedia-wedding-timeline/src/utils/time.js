/**
 * Funkcje czasu.
 */

/**
 * Parsuje ISO i zwraca Date.
 * @param {string} iso
 * @returns {Date}
 */
export function parseISO(iso) {
  return iso ? new Date(iso) : new Date();
}

/**
 * Zwraca ISO w strefie europejskiej.
 * @param {Date} date
 * @returns {string}
 */
export function toISO(date) {
  const formatter = new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
  const offsetRaw = (parts.timeZoneName || 'GMT+00').replace('GMT', '');
  let normalizedOffset = offsetRaw;
  if (!offsetRaw.includes(':')) {
    const sign = offsetRaw.startsWith('-') ? '-' : '+';
    const digits = offsetRaw.replace('+', '').replace('-', '');
    const hours = digits.padStart(2, '0');
    const minutes = digits.length > 2 ? digits.slice(-2) : '00';
    normalizedOffset = `${sign}${hours}:${minutes}`;
  }
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${normalizedOffset}`;
}

/**
 * Zaokrąglenie do 5 minut.
 * @param {Date} date
 * @returns {Date}
 */
export function roundTo5(date) {
  const ms = 5 * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

/**
 * Dodaje minuty do daty.
 * @param {Date} date
 * @param {number} minutes
 */
export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Porównanie dwóch ISO.
 */
export function compareISO(a, b) {
  return parseISO(a).getTime() - parseISO(b).getTime();
}

/**
 * Format godzinowy HH:MM.
 */
export function formatHM(date) {
  const d = date instanceof Date ? date : parseISO(date);
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
}

/**
 * Normalizacja daty timeline do localTime.
 */
export function ensureOffset(iso) {
  if (!iso) return new Date().toISOString();
  if (iso.includes('+') || iso.endsWith('Z')) return iso;
  const date = new Date(iso + 'T00:00:00');
  return date.toISOString();
}

/**
 * Zwraca różnicę w minutach.
 */
export function diffMinutes(a, b) {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 60000);
}
