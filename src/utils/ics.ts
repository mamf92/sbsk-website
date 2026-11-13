export interface IcsEventInput {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  url?: string;
  /** A stable id, for entries a title and start time cannot tell apart (festival sessions). */
  uid?: string;
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

function vevent(event: IcsEventInput, stamp: string): string[] {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid ? `${event.uid}@sbsk.no` : icsUid(event.title, event.start)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsUtc(event.start)}`,
    `DTEND:${toIcsUtc(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.url) lines.push(`URL:${escapeIcsText(event.url)}`);
  lines.push('END:VEVENT');
  return lines;
}

/** Builds a minimal RFC 5545 .ics document holding every event given, e.g. a festival's programme. */
export function buildIcsCalendar(events: IcsEventInput[]): string {
  const stamp = toIcsUtc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stavanger Brettspillklubb//SBSK Website//NO',
    'CALSCALE:GREGORIAN',
    ...events.flatMap((event) => vevent(event, stamp)),
    'END:VCALENDAR',
  ];
  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n');
}

/** Builds a minimal RFC 5545 .ics document for a single event. */
export function buildIcs(event: IcsEventInput): string {
  return buildIcsCalendar([event]);
}

/** Triggers a browser download of the event as a .ics file. Browser-only. */
export function downloadIcs(
  event: IcsEventInput | IcsEventInput[],
  filename = 'arrangement.ics',
): void {
  const text = Array.isArray(event) ? buildIcsCalendar(event) : buildIcs(event);
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
