import { describe, expect, it } from 'vitest';
import { pickLocale } from './pickLocale';

describe('pickLocale', () => {
  it('returns English on an English page when it exists', () => {
    expect(pickLocale({ nb: 'Hei', en: 'Hello' }, 'en')).toEqual({ value: 'Hello', lang: 'en' });
  });

  it('falls back to Norwegian, marked as Norwegian', () => {
    expect(pickLocale({ nb: 'Hei' }, 'en')).toEqual({ value: 'Hei', lang: 'nb' });
    expect(pickLocale({ nb: 'Hei', en: '   ' }, 'en')).toEqual({ value: 'Hei', lang: 'nb' });
  });

  it('returns Norwegian on a Norwegian page', () => {
    expect(pickLocale({ nb: 'Hei', en: 'Hello' }, 'nb')).toEqual({ value: 'Hei', lang: 'nb' });
  });

  it('uses English on a Norwegian page only when Norwegian is missing', () => {
    expect(pickLocale({ en: 'Hello' }, 'nb')).toEqual({ value: 'Hello', lang: 'en' });
  });

  it('handles Portable Text arrays', () => {
    const blocks = [{ _type: 'block' }];
    expect(pickLocale({ nb: blocks, en: [] }, 'en')).toEqual({ value: blocks, lang: 'nb' });
  });

  it('returns null when there is nothing to show', () => {
    expect(pickLocale(undefined, 'nb')).toBeNull();
    expect(pickLocale(null, 'en')).toBeNull();
    expect(pickLocale({}, 'en')).toBeNull();
    expect(pickLocale({ nb: '' }, 'nb')).toBeNull();
  });
});
