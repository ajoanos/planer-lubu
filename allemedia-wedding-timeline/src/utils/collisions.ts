import { TimelineEvent } from '../admin/types';
import { addMinutes, isAfter } from './time';

export function hasOverlap(a: TimelineEvent, b: TimelineEvent): boolean {
  const startA = new Date(a.start).getTime();
  const endA = new Date(a.end).getTime();
  const startB = new Date(b.start).getTime();
  const endB = new Date(b.end).getTime();
  return startA < endB && startB < endA;
}

export function sortEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function suggestShift(events: TimelineEvent[], changedEventId: string): TimelineEvent[] {
  const ordered = sortEvents(events);
  const changedIndex = ordered.findIndex((e) => e.id === changedEventId);
  if (changedIndex === -1) return events;

  for (let i = changedIndex; i < ordered.length - 1; i++) {
    const current = ordered[i];
    const next = ordered[i + 1];
    if (hasOverlap(current, next) || isAfter(current.end, next.start)) {
      const diff = new Date(current.end).getTime() - new Date(next.start).getTime();
      const minutes = Math.ceil(diff / 60000) + 5;
      ordered[i + 1] = {
        ...next,
        start: addMinutes(next.start, minutes),
        end: addMinutes(next.end, minutes)
      };
    }
  }

  return ordered;
}

export function applyDelay(events: TimelineEvent[], targetId: string, minutes: number): TimelineEvent[] {
  const ordered = sortEvents(events);
  const index = ordered.findIndex((e) => e.id === targetId);
  if (index === -1) return events;

  const updated = ordered.map((event, idx) => {
    if (idx < index) return event;
    if (idx === index) {
      return {
        ...event,
        start: addMinutes(event.start, minutes),
        end: addMinutes(event.end, minutes)
      };
    }
    return {
      ...event,
      start: addMinutes(event.start, minutes),
      end: addMinutes(event.end, minutes)
    };
  });

  // Iteracyjnie eliminuj kolizje minimalnymi krokami.
  for (let i = index; i < updated.length - 1; i++) {
    let current = updated[i];
    let next = updated[i + 1];
    while (hasOverlap(current, next)) {
      next = {
        ...next,
        start: addMinutes(next.start, 5),
        end: addMinutes(next.end, 5)
      };
    }
    updated[i + 1] = next;
    current = updated[i + 1];
  }

  return updated;
}
