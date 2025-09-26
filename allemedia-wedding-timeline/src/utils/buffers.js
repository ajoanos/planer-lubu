/**
 * Silnik buforów.
 */

export const STYLE_FACTOR = {
  slow: 0.2,
  standard: 0.1,
  dynamic: 0.05,
};

/**
 * Dojazd w minutach z zaokrągleniem do 5.
 * @param {number} km
 * @param {'slow'|'standard'|'dynamic'} style
 */
export function estimateDriveMinutes(km = 0, style = 'standard') {
  const factor = STYLE_FACTOR[style] ?? STYLE_FACTOR.standard;
  const base = Math.max(10, km * 1.2 * (1 + factor));
  return roundUp(base, 5);
}

/**
 * Czas zdjęć rodzinnych.
 * @param {number} groups
 */
export function familyPhotosMinutes(groups = 10) {
  return roundUp(groups * 1.5, 5);
}

export const PRESETS = {
  church: 75,
  civil: 25,
  firstLook: 20,
};

/**
 * Zaokrąglenie w górę.
 */
export function roundUp(value, step) {
  return Math.ceil(value / step) * step;
}
