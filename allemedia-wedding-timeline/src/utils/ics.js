/**
 * Generator ICS po stronie frontendu (fallback do public view).
 */
export function timelineToICS(timeline) {
  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Allemedia//Wedding Timeline//PL',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
  ];
  (timeline.events || []).forEach((event) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@allemedia`);
    lines.push(`DTSTAMP:${formatDate(new Date())}`);
    lines.push(`DTSTART:${formatDate(new Date(event.start))}`);
    lines.push(`DTEND:${formatDate(new Date(event.end))}`);
    lines.push(`SUMMARY:${escapeLine(event.title)}`);
    if (event.location?.label) {
      lines.push(`LOCATION:${escapeLine(event.location.label)}`);
    }
    if (event.notes) {
      lines.push(`DESCRIPTION:${escapeLine(event.notes)}`);
    }
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeLine(text = '') {
  return text.replace(/[,;]/g, ' ');
}
