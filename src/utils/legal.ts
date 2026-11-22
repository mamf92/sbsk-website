/**
 * The version of the privacy policy and terms a member accepts during first-time setup
 * (docs/plans/gdpr.md step 1). Stored on `profiles.terms_accepted_version`; `requireMember`
 * sends anyone whose stored version differs back to accept the new one. Bump it only for a
 * material change, together with the text in `src/content/legal.ts`.
 */
export const CURRENT_LEGAL_VERSION = '2026-11';

/** Whether a stored acceptance covers the current texts. */
export function hasAcceptedCurrentTerms(version: string | null | undefined): boolean {
  return version === CURRENT_LEGAL_VERSION;
}
