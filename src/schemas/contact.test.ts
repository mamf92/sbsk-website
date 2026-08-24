import { describe, expect, it } from 'vitest';
import { contactSchema } from './contact';

const VALID = { name: 'Ola Nordmann', email: 'ola@epost.no', message: 'Hei, jeg lurer på...' };

describe('contactSchema', () => {
  it('accepts a fully filled-out submission', () => {
    const result = contactSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it('requires a name', () => {
    const result = contactSchema.safeParse({ ...VALID, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Navn er påkrevd');
      expect(result.error.issues[0].path).toEqual(['name']);
    }
  });

  it('treats a whitespace-only name as empty', () => {
    const result = contactSchema.safeParse({ ...VALID, name: '   ' });
    expect(result.success).toBe(false);
  });

  it('requires an email', () => {
    const result = contactSchema.safeParse({ ...VALID, email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('E-post er påkrevd');
    }
  });

  it('rejects an email missing an @ or a domain', () => {
    const result = contactSchema.safeParse({ ...VALID, email: 'ikke-en-epost' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ugyldig e-post — må inneholde @ og et domene');
    }
  });

  it('requires a message', () => {
    const result = contactSchema.safeParse({ ...VALID, message: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Skriv en melding før du sender');
    }
  });

  it('trims surrounding whitespace from every field on success', () => {
    const result = contactSchema.safeParse({
      name: '  Ola Nordmann  ',
      email: '  ola@epost.no  ',
      message: '  Hei!  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Ola Nordmann',
        email: 'ola@epost.no',
        message: 'Hei!',
      });
    }
  });

  it('reports every failing field at once, not only the first', () => {
    const result = contactSchema.safeParse({ name: '', email: '', message: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
      expect(fields).toEqual(new Set(['name', 'email', 'message']));
    }
  });
});
