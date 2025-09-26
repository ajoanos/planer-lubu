import { parseISO, addMinutes, toISO } from './time.js';

/**
 * Przybliżony algorytm golden/blue hour (stub).
 * Zwraca tablicę okien czasowych.
 *
 * @param {string} dateISO
 * @param {number} lat
 * @param {number} lng
 */
export function getGoldenBlue(dateISO, lat = 50.06, lng = 19.94) {
  const base = parseISO(dateISO + 'T12:00:00');
  const goldenStart = addMinutes(base, -180);
  const goldenEnd = addMinutes(base, -120);
  const blueStart = addMinutes(base, 180);
  const blueEnd = addMinutes(base, 210);

  return [
    { type: 'golden', start: toISO(goldenStart), end: toISO(goldenEnd) },
    { type: 'blue', start: toISO(blueStart), end: toISO(blueEnd) },
  ];
}
