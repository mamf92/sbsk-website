import { describe, expect, it } from 'vitest';
import { norwegianErrorMessage } from './errorMessage';

describe('norwegianErrorMessage', () => {
  it('translates known Supabase messages', () => {
    expect(norwegianErrorMessage(new Error('Invalid login credentials'), 'x')).toBe(
      'Feil e-post eller passord.',
    );
    expect(norwegianErrorMessage({ message: 'Failed to fetch' }, 'x')).toMatch(
      /kontakt med serveren/,
    );
  });

  it('never passes unknown English through', () => {
    expect(norwegianErrorMessage(new Error('Profile not found'), 'Noe gikk galt.')).toBe(
      'Noe gikk galt.',
    );
    expect(norwegianErrorMessage(undefined, 'Noe gikk galt.')).toBe('Noe gikk galt.');
  });
});
