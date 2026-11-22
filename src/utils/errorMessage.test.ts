import { describe, expect, it } from 'vitest';
import { CODE_INVALID, NOT_ON_LIST, norwegianErrorMessage } from './errorMessage';

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

  it('explains the sign-in code errors', () => {
    expect(norwegianErrorMessage(new Error('Database error saving new user'), 'x')).toBe(
      NOT_ON_LIST,
    );
    expect(norwegianErrorMessage(new Error('Token has expired or is invalid'), 'x')).toBe(
      CODE_INVALID,
    );
    expect(norwegianErrorMessage(new Error('User is banned'), 'x')).toMatch(/deaktivert/);
  });
});
