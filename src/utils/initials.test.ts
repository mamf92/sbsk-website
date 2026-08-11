import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Anne Berg')).toBe('AB');
    expect(initials('Anne Kristine Berg')).toBe('AK');
  });

  it('handles a single name', () => {
    expect(initials('Martin')).toBe('M');
  });

  it('tolerates ragged whitespace', () => {
    expect(initials('  kari   lund  ')).toBe('KL');
  });

  it('falls back to a question mark rather than rendering an empty box', () => {
    expect(initials('')).toBe('?');
    expect(initials('   ')).toBe('?');
  });

  it('keeps non-ASCII initials intact', () => {
    expect(initials('Øystein Ådland')).toBe('ØÅ');
  });
});
