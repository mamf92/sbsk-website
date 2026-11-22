import { describe, expect, it } from 'vitest';
import { cardPayload, formatCardToken, parseCardCode } from './membershipCard';

const TOKEN = '0123456789abcdef0123456789abcdef';

describe('membership card codes', () => {
  it('round-trips a payload', () => {
    expect(parseCardCode(cardPayload(TOKEN))).toBe(TOKEN);
  });

  it('accepts a typed token, with spaces and capitals', () => {
    expect(parseCardCode(` ${TOKEN.toUpperCase()} `)).toBe(TOKEN);
    expect(parseCardCode(formatCardToken(TOKEN))).toBe(TOKEN);
  });

  it('refuses anything that is not a card', () => {
    expect(parseCardCode('https://example.com')).toBeNull();
    expect(parseCardCode('sbsk-medlem:not-a-token')).toBeNull();
    expect(parseCardCode('')).toBeNull();
  });

  it('groups the token in fours for reading out', () => {
    expect(formatCardToken(TOKEN)).toBe('0123 4567 89ab cdef 0123 4567 89ab cdef');
  });
});
