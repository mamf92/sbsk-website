export interface IcsEventInput {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  url?: string;
  /** A stable id, for entries a title and start time cannot tell apart (festival sessions). */
  uid?: string;
  /** `YYYY-MM-DD` for an all-day entry, written as a date rather than as `start`/`end` times. */
  allDayDate?: string;
}

/** The day after a `YYYY-MM-DD` date, as `YYYYMMDD`: an all-day DTEND is exclusive. */
function nextIcsDate(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10).replace(/-/g, '');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * RFC 5545 §3.1: a content line longer than 75 octets continues on the next line after CRLF and
 * one space. Counted in UTF-8 bytes, and never split inside a character (æ, ø, å are two bytes).
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // The first line holds 75 octets; continuation lines 74 after their leading space.
    if (bytes + size > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
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
    ...(event.allDayDate
      ? [
          `DTSTART;VALUE=DATE:${event.allDayDate.replace(/-/g, '')}`,
          `DTEND;VALUE=DATE:${nextIcsDate(event.allDayDate)}`,
        ]
      : [`DTSTART:${toIcsUtc(event.start)}`, `DTEND:${toIcsUtc(event.end)}`]),
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.url) lines.push(`URL:${escapeIcsText(event.url)}`);
  lines.push('END:VEVENT');
  return lines;
}

/** What a subscribed calendar shows as its name, and how often apps should fetch it again. */
export interface IcsFeedOptions {
  name: string;
  description?: string;
  /** ISO 8601 duration, e.g. `PT12H`. */
  refresh: string;
}

/**
 * Builds a minimal RFC 5545 .ics document holding every event given, e.g. a festival's
 * programme. `feed` makes it a subscription: a calendar name and a refresh interval
 * (RFC 7986, plus the `X-` names Google and Outlook read).
 */
export function buildIcsCalendar(events: IcsEventInput[], feed?: IcsFeedOptions): string {
  const stamp = toIcsUtc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stavanger Brettspillklubb//SBSK Website//NO',
    'CALSCALE:GREGORIAN',
    ...(feed
      ? [
          'METHOD:PUBLISH',
          `NAME:${escapeIcsText(feed.name)}`,
          `X-WR-CALNAME:${escapeIcsText(feed.name)}`,
          ...(feed.description
            ? [
                `DESCRIPTION:${escapeIcsText(feed.description)}`,
                `X-WR-CALDESC:${escapeIcsText(feed.description)}`,
              ]
            : []),
          'X-WR-TIMEZONE:Europe/Oslo',
          `REFRESH-INTERVAL;VALUE=DURATION:${feed.refresh}`,
          `X-PUBLISHED-TTL:${feed.refresh}`,
        ]
      : []),
    ...events.flatMap((event) => vevent(event, stamp)),
    'END:VCALENDAR',
  ];
  // RFC 5545 requires CRLF line endings, and lines of at most 75 octets.
  return lines.map(foldIcsLine).join('\r\n');
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
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick: some browsers (Firefox, older Safari) read the blob after
  // `click()` returns, and an object URL revoked at once gives them an empty download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
