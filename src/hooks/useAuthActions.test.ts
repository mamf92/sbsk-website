import { describe, expect, it } from 'vitest';
import { destinationAfterSignIn } from './useAuthActions';

describe('destinationAfterSignIn', () => {
  it('sends members to Min side and admins to Styreportal', () => {
    expect(destinationAfterSignIn({ isAdmin: false, needsOnboarding: false })).toBe(
      '/medlemsportal',
    );
    expect(destinationAfterSignIn({ isAdmin: true, needsOnboarding: false })).toBe('/styreportal');
  });

  it('follows a safe next path and ignores an unsafe one', () => {
    const member = { isAdmin: false, needsOnboarding: false };
    expect(destinationAfterSignIn(member, '/kalender')).toBe('/kalender');
    expect(destinationAfterSignIn(member, '//evil.example')).toBe('/medlemsportal');
  });

  it('puts first-time setup first and keeps where to go afterwards', () => {
    expect(destinationAfterSignIn({ isAdmin: false, needsOnboarding: true }, '/kalender')).toBe(
      '/lag-medlemsprofil?neste=%2Fkalender',
    );
  });
});
