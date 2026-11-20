import { describe, expect, it } from 'vitest';
import { auditDocument, looksEnglish } from './norwegianAudit.mjs';

describe('looksEnglish', () => {
  it('flags English and passes Norwegian', () => {
    expect(looksEnglish('Join us for a long weekend and meet all the players')).toBe(true);
    expect(looksEnglish('Bli med på en langhelg og møt alle spillerne i klubben')).toBe(false);
    expect(looksEnglish('Catan')).toBe(false);
  });
});

describe('auditDocument', () => {
  it('reports a locale field with English only, and English hiding in nb', () => {
    const rows = auditDocument({
      _id: 'x',
      _type: 'festival',
      title: { en: 'Board Game Masters' },
      tagline: { nb: 'Join us for the weekend and have fun with all of us', en: 'x' },
      ok: { nb: 'Fire dager med brettspill på Tasta', en: 'Four days of board games' },
    });
    expect(rows.map((r) => r.path)).toEqual(['x.title', 'x.tagline']);
  });
});
