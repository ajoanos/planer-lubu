/**
 * Pomocnicze funkcje operujące na czasie w formacie ISO.
 */

export function toDate(dateIso: string): Date {
  return new Date(dateIso);
}

export function addMinutes(dateIso: string, minutes: number): string {
  const date = new Date(dateIso);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export function diffInMinutes(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function roundTo5(value: number): number {
  return Math.ceil(value / 5) * 5;
}

export function formatTime(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export function isAfter(a: string, b: string): boolean {
  return new Date(a).getTime() > new Date(b).getTime();
}

export function clampToDay(dateIso: string, day: string): string {
  const base = new Date(`${day}T00:00:00`);
  const date = new Date(dateIso);
  const diff = date.getTime() - base.getTime();
  const max = 24 * 60 * 60 * 1000 - 5 * 60 * 1000;
  if (diff < 0) return base.toISOString();
  if (diff > max) {
    base.setTime(base.getTime() + max);
    return base.toISOString();
  }
  return date.toISOString();
}

export function parseISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}
