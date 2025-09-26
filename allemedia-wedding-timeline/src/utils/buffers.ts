import { DayStyle } from '../admin/types';
import { addMinutes, roundTo5 } from './time';

const STYLE_FACTOR: Record<DayStyle, number> = {
  slow: 0.2,
  standard: 0.1,
  dynamic: 0.05
};

/**
 * Szacuje czas przejazdu bazując na kilometrach i stylu dnia.
 */
export function estimateDriveMinutes(km: number, style: DayStyle): number {
  if (!km || km < 0) {
    return 10;
  }
  const base = km * 1.2;
  const factor = 1 + (STYLE_FACTOR[style] ?? 0.1);
  const total = Math.max(10, base * factor);
  return roundTo5(total);
}

/**
 * Szacuje czas zdjęć rodzinnych.
 */
export function familyPhotosMinutes(groups: number): number {
  if (!groups) return 0;
  return roundTo5(Math.ceil(groups * 1.5));
}

export const PRESETS = {
  ceremony: {
    kosciol: 75,
    cywilny: 25,
    plener: 35
  },
  firstLook: 20
};

/**
 * Tworzy slot first look na podstawie godziny wyjazdu.
 */
export function suggestFirstLook(startIso: string): { start: string; end: string } | null {
  if (!startIso) return null;
  const end = addMinutes(startIso, -10);
  const start = addMinutes(end, -PRESETS.firstLook);
  return { start, end };
}
