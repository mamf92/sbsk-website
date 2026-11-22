import { describe, expect, it } from 'vitest';
import { CURRENT_LEGAL_VERSION, hasAcceptedCurrentTerms } from './legal';
import { PRIVACY_POLICY, TERMS } from '../content/legal';

describe('legal versions', () => {
  it('accepts only the current version', () => {
    expect(hasAcceptedCurrentTerms(CURRENT_LEGAL_VERSION)).toBe(true);
    expect(hasAcceptedCurrentTerms('2020-01')).toBe(false);
    expect(hasAcceptedCurrentTerms(null)).toBe(false);
  });

  it('keeps both documents on the version members accept', () => {
    expect(PRIVACY_POLICY.nb.version).toBe(CURRENT_LEGAL_VERSION);
    expect(TERMS.nb.version).toBe(CURRENT_LEGAL_VERSION);
  });
});
