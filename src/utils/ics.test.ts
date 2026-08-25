import { describe, expect, it } from 'vitest';
import { buildIcs } from './ics';

describe('buildIcs', () => {
  it('builds a well-formed VEVENT with CRLF line endings', () => {
    const ics = buildIcs({
      title: 'Board Game Masters 2026',
      description: 'Fire dager med brettspill.',
      location: 'Tasta bydelshus, Stavanger',
      start: new Date('2026-01-23T17:00:00Z'),
      end: new Date('2026-01-23T23:45:00Z'),
      url: 'https://sbsk.no/arrangementer/bgm',
    });

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain('DTSTART:20260123T170000Z');
    expect(ics).toContain('DTEND:20260123T234500Z');
    expect(ics).toContain('SUMMARY:Board Game Masters 2026');
    expect(ics).toContain('LOCATION:Tasta bydelshus\\, Stavanger');
    expect(ics).toContain('URL:https://sbsk.no/arrangementer/bgm');
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR')).toBe(true);
  });

  it('escapes commas, semicolons and newlines in text fields', () => {
    const ics = buildIcs({
      title: 'Turnering; finale, runde 1\nekstra',
      start: new Date('2026-03-01T18:00:00Z'),
      end: new Date('2026-03-01T22:00:00Z'),
    });

    expect(ics).toContain('SUMMARY:Turnering\\; finale\\, runde 1\\nekstra');
  });

  it('omits optional fields that are not given', () => {
    const ics = buildIcs({
      title: 'Spillkveld',
      start: new Date('2026-03-01T18:00:00Z'),
      end: new Date('2026-03-01T22:00:00Z'),
    });

    expect(ics).not.toContain('DESCRIPTION:');
    expect(ics).not.toContain('LOCATION:');
    expect(ics).not.toContain('URL:');
  });

  it('gives two events at the same time different UIDs when titles differ', () => {
    const start = new Date('2026-03-01T18:00:00Z');
    const end = new Date('2026-03-01T22:00:00Z');
    const a = buildIcs({ title: 'Dag 1', start, end });
    const b = buildIcs({ title: 'Dag 2', start, end });

    const uid = (ics: string) => ics.match(/UID:(.+)/)?.[1];
    expect(uid(a)).not.toBe(uid(b));
  });
});
