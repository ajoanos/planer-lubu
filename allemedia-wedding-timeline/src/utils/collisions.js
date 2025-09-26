import { compareISO, addMinutes, toISO } from './time.js';

/**
 * Czy eventy się pokrywają.
 * @param {TimelineEvent} a
 * @param {TimelineEvent} b
 */
export function hasOverlap(a, b) {
  if (!a || !b) return false;
  return compareISO(a.start, b.end) < 0 && compareISO(b.start, a.end) < 0;
}

/**
 * Sugestia przesunięcia w górę dla eventów.
 * @param {TimelineEvent[]} events
 * @param {string} changedId
 */
export function suggestShift(events, changedId) {
  const sorted = [...events].sort((x, y) => compareISO(x.start, y.start));
  let previousEnd = null;
  const corrections = [];

  for (const event of sorted) {
    if (previousEnd && compareISO(event.start, previousEnd) < 0) {
      const diff = Math.abs(compareISO(event.start, previousEnd));
      corrections.push({ id: event.id, minutes: diff });
      const newStart = addMinutes(new Date(previousEnd), 0);
      event.start = toISO(newStart);
    }
    previousEnd = event.end;
  }

  return corrections;
}

/**
 * Aplikuje opóźnienie w trybie LIVE.
 * @param {TimelineEvent[]} events
 * @param {string} targetId
 * @param {number} minutes
 */
export function applyDelay(events, targetId, minutes) {
  const sorted = [...events].sort((a, b) => compareISO(a.start, b.start));
  let apply = false;
  return sorted.map((event) => {
    if (event.id === targetId) {
      apply = true;
    }
    if (!apply || event.fixed) {
      return event;
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    const step = Math.round(minutes / 5) * 5;
    return {
      ...event,
      start: toISO(addMinutes(start, step)),
      end: toISO(addMinutes(end, step)),
    };
  });
}
