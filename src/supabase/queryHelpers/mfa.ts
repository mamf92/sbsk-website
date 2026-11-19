import { supabase } from '../client';

// Thin wrappers around Supabase's TOTP API for the admin second factor (security plan S2a,
// docs/plans/SECURITY_AND_RELIABILITY.md). One module rather than one file per function, as
// that plan specifies: they are five calls on one API and only make sense together.
// Each throws on error, like the other helpers.

export type AssuranceLevel = 'aal1' | 'aal2';

export interface Assurance {
  currentLevel: AssuranceLevel | null;
  /** `aal2` when the user has a verified factor, so a code would raise the session. */
  nextLevel: AssuranceLevel | null;
}

export interface TotpFactor {
  id: string;
  friendlyName: string | null;
  status: 'verified' | 'unverified';
  createdAt: string;
}

export interface TotpEnrollment {
  factorId: string;
  /** SVG as a data URI. Render with `<img src>`, never inline the markup. */
  qrCode: string;
  /** The same secret as text, for password managers. */
  secret: string;
}

export async function getAssurance(): Promise<Assurance> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  const level = (value: string | null): AssuranceLevel | null =>
    value === 'aal1' || value === 'aal2' ? value : null;
  return { currentLevel: level(data.currentLevel), nextLevel: level(data.nextLevel) };
}

export async function listTotpFactors(): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.all
    .filter((factor) => factor.factor_type === 'totp')
    .map((factor) => ({
      id: factor.id,
      friendlyName: factor.friendly_name ?? null,
      status: factor.status === 'verified' ? 'verified' : 'unverified',
      createdAt: factor.created_at,
    }));
}

/**
 * The name an authenticator app shows above the code ("Stavanger Brettspillklubb: you@…").
 * Supabase builds the otpauth URI's issuer from the site URL when none is given, which is how an
 * entry came to read "localhost:3000". `friendlyName` is only the label in Supabase's own factor
 * list, never what the app displays.
 */
export const TOTP_ISSUER = 'Stavanger Brettspillklubb';

export async function enrollTotp(friendlyName: string): Promise<TotpEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
    issuer: TOTP_ISSUER,
  });
  if (error) throw error;
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Challenge and verify in one step. On success the session is raised to aal2. */
export async function verifyTotp(factorId: string, code: string): Promise<void> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw error;
}

export async function unenrollFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
