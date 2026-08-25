export interface IcsEventInput {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  url?: string;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

// A stable-enough UID: the start time plus a slug of the title, so re-downloading the same
// event's .ics twice updates one calendar entry instead of duplicating it.
function icsUid(title: string, start: Date): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${start.getTime()}-${slug || 'arrangement'}@sbsk.no`;
}

/** Builds a minimal RFC 5545 .ics document for a single event. */
export function buildIcs(event: IcsEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stavanger Brettspillklubb//SBSK Website//NO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${icsUid(event.title, event.start)}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(event.start)}`,
    `DTEND:${toIcsUtc(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.url) lines.push(`URL:${escapeIcsText(event.url)}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n');
}

/** Triggers a browser download of the event as a .ics file. Browser-only. */
export function downloadIcs(event: IcsEventInput, filename = 'arrangement.ics'): void {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
