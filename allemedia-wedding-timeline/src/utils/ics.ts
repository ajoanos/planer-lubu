import { Timeline } from '../admin/types';

/**
 * Buduje prosty ICS po stronie klienta (fallback gdy REST niedostępny).
 */
export function buildIcs(timeline: Timeline): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Allemedia//Wedding Timeline//PL'];
  timeline.events.forEach((event) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@allemedia.local`);
    lines.push(`DTSTART:${format(event.start)}`);
    lines.push(`DTEND:${format(event.end)}`);
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    if (event.location?.label) {
      lines.push(`LOCATION:${escapeText(event.location.label)}`);
    }
    if (event.notes) {
      lines.push(`DESCRIPTION:${escapeText(event.notes)}`);
    }
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function format(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeText(text: string): string {
  return text.replace(/,/g, '\\,').replace(/;/g, '\\;');
}
